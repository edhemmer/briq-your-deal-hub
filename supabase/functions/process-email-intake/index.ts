import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = "brix-evidence";
const VERSION = "email-intake-v1";
const ATTACHMENT_VERSION = "file-evidence-intake-v1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Proposal = {
  id: string;
  field: "address" | "city" | "region" | "postal_code" | "property_type" | "asking_price";
  label: string;
  rawValue: string;
  normalizedValue: string;
  displayValue: string;
  classification: "source_backed_candidate";
  verificationState: "unverified";
  confidence: number;
  status: "pending";
  sourceKey: "email_source";
  evidenceRule: string;
  sourceAnchor: Record<string, unknown>;
  extractorVersion: string;
};

type ParsedEmail = {
  subject?: string;
  fromAddress?: string;
  toAddresses: string[];
  ccAddresses: string[];
  bccAddresses: string[];
  replyToAddress?: string;
  sentAt?: string;
  receivedHeaders: string[];
  messageId?: string;
  threadId?: string;
  plainTextBody?: string;
  htmlBody?: string;
  attachments: ParsedAttachment[];
};

type ParsedAttachment = {
  filename: string;
  contentType?: string;
  contentId?: string;
  disposition?: string;
  contentBase64?: string;
};

type ImportedAttachment = {
  attachmentId: string;
  evidenceId?: string;
  filename: string;
  originalFilename: string;
  contentType?: string;
  detectedMimeType?: string;
  byteSize?: number;
  contentHash?: string;
  contentId?: string;
  disposition?: string;
  status: "imported" | "duplicate" | "rejected" | "metadata_only";
  safeMessage: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return json("ok");
  if (req.method !== "POST") return json({ error: "Use POST for email intake." }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Email intake is not configured." }, 503);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Authentication required." }, 401);

    const body = await req.json();
    const workspaceId = stringValue(body?.workspaceId);
    if (!workspaceId) return json({ error: "Workspace is required." }, 400);
    const { data: canRecord, error: permissionError } = await userClient.rpc("can_record_email_intake", { target_workspace_id: workspaceId });
    if (permissionError) return json({ error: safeMessage(permissionError, "BRIX could not verify email intake permissions.") }, 403);
    if (canRecord !== true) return json({ error: "You do not have permission to import email in this BRIX account." }, 403);

    const originalFilename = stringValue(body?.fileName) ?? "pasted-email.txt";
    const rawEmail = emailSourceText(body);
    if (!rawEmail.trim()) return json({ error: "Paste email text or upload an email file." }, 400);
    if (new TextEncoder().encode(rawEmail).byteLength > MAX_BYTES) return json({ error: "Email intake accepts 5 MB or smaller in this path." }, 400);

    const parsed = parseEmail(rawEmail);
    const bodyHash = await sha256Hex(new TextEncoder().encode(`${parsed.plainTextBody ?? ""}\n${parsed.htmlBody ?? ""}`));
    const importedAttachments = await importSupportedAttachments(userClient, serviceClient, workspaceId, parsed.attachments);
    const proposals = buildEmailProposals(parsed, originalFilename);
    const emailMetadata = {
      subject: parsed.subject,
      fromAddress: parsed.fromAddress,
      toAddresses: parsed.toAddresses,
      ccAddresses: parsed.ccAddresses,
      bccAddresses: parsed.bccAddresses,
      replyToAddress: parsed.replyToAddress,
      sentAt: parsed.sentAt,
      receivedHeaders: parsed.receivedHeaders,
      messageId: parsed.messageId,
      threadId: parsed.threadId,
      bodyHash,
      plainTextBody: parsed.plainTextBody?.slice(0, 120_000),
      htmlBody: parsed.htmlBody?.slice(0, 120_000),
      parserVersion: VERSION,
      originalFilename,
    };

    const idempotencyKey = `email-intake:${workspaceId}:${parsed.messageId ?? bodyHash}`;
    const { data, error } = await userClient.rpc("record_email_intake_result", {
      target_workspace_id: workspaceId,
      idempotency_key: idempotencyKey,
      email_metadata: emailMetadata,
      extracted_proposals: proposals,
      attachment_metadata: importedAttachments.map((attachment) => ({
        evidenceId: attachment.evidenceId,
        filename: attachment.originalFilename,
        contentType: attachment.detectedMimeType ?? attachment.contentType,
        byteSize: attachment.byteSize,
        contentHash: attachment.contentHash,
        contentId: attachment.contentId,
        disposition: attachment.disposition,
        status: attachment.status,
        safeMessage: attachment.safeMessage,
      })),
    });
    if (error) return json({ error: safeMessage(error, "BRIX could not save this email source.") }, 400);

    const result = Array.isArray(data) ? data[0] : data;
    return json({
      intakeId: result?.intake_id,
      sourceRecordId: result?.source_record_id,
      emailSourceId: result?.email_source_id,
      duplicateOfEmailSourceId: result?.duplicate_of_email_source_id,
      jobId: result?.job_id,
      status: result?.import_status ?? "complete",
      safeMessage: result?.safe_message ?? "Email source saved.",
      ...emailMetadata,
      receivedHeaderCount: parsed.receivedHeaders.length,
      attachmentCount: importedAttachments.length,
      importedAt: new Date().toISOString(),
      attachments: importedAttachments.map((attachment) => ({
        attachmentId: attachment.attachmentId,
        evidenceId: attachment.evidenceId,
        originalFilename: attachment.originalFilename,
        detectedMimeType: attachment.detectedMimeType,
        byteSize: attachment.byteSize,
        contentHash: attachment.contentHash,
        status: attachment.status,
        safeMessage: attachment.safeMessage,
      })),
      proposals,
    });
  } catch (error) {
    return json({ error: safeMessage(error, "BRIX could not process this email source.") }, 400);
  }
});

function emailSourceText(body: Record<string, unknown>) {
  const pasted = stringValue(body?.emailText);
  if (pasted) return pasted;
  const base64 = stringValue(body?.contentBase64);
  if (!base64) return "";
  const bytes = decodeBase64(base64);
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function parseEmail(raw: string): ParsedEmail {
  const normalized = raw.replace(/\r\n/g, "\n");
  const splitIndex = normalized.search(/\n\n/);
  const headerText = splitIndex >= 0 ? normalized.slice(0, splitIndex) : "";
  const bodyText = splitIndex >= 0 ? normalized.slice(splitIndex + 2) : normalized;
  const headers = unfoldHeaders(headerText);
  const contentType = header(headers, "content-type") ?? "";
  const boundary = contentType.match(/boundary="?([^";]+)"?/i)?.[1];
  const parts = boundary ? parseMimeParts(bodyText, boundary) : [];
  const plainPart = parts.find((part) => /text\/plain/i.test(part.contentType ?? "") && !part.filename);
  const htmlPart = parts.find((part) => /text\/html/i.test(part.contentType ?? "") && !part.filename);
  const attachments = parts.filter((part) => Boolean(part.filename));
  return {
    subject: decodeMimeWords(header(headers, "subject")),
    fromAddress: header(headers, "from"),
    toAddresses: splitAddresses(header(headers, "to")),
    ccAddresses: splitAddresses(header(headers, "cc")),
    bccAddresses: splitAddresses(header(headers, "bcc")),
    replyToAddress: header(headers, "reply-to"),
    sentAt: normalizeEmailDate(header(headers, "date")),
    receivedHeaders: headers.filter((item) => item.name.toLowerCase() === "received").map((item) => item.value),
    messageId: cleanMessageId(header(headers, "message-id")),
    threadId: cleanMessageId(header(headers, "thread-id") ?? header(headers, "references")?.split(/\s+/)[0]),
    plainTextBody: decodePartBody(plainPart) ?? (!boundary ? bodyText : undefined),
    htmlBody: decodePartBody(htmlPart),
    attachments,
  };
}

function unfoldHeaders(headerText: string) {
  const lines = headerText.split("\n");
  const unfolded: string[] = [];
  for (const line of lines) {
    if (/^\s/.test(line) && unfolded.length) unfolded[unfolded.length - 1] += ` ${line.trim()}`;
    else unfolded.push(line);
  }
  return unfolded.map((line) => {
    const index = line.indexOf(":");
    return index > 0 ? { name: line.slice(0, index).trim(), value: line.slice(index + 1).trim() } : { name: "", value: "" };
  }).filter((item) => item.name);
}

function parseMimeParts(bodyText: string, boundary: string): ParsedAttachment[] {
  const marker = `--${boundary}`;
  return bodyText.split(marker).map((part) => part.trim()).filter((part) => part && part !== "--").map((part) => {
    const splitIndex = part.search(/\n\n/);
    const partHeaders = unfoldHeaders(splitIndex >= 0 ? part.slice(0, splitIndex) : "");
    const contentType = header(partHeaders, "content-type");
    const disposition = header(partHeaders, "content-disposition");
    const filename = filenameFromHeaders(contentType, disposition);
    return {
      filename: filename ?? "",
      contentType: contentType?.split(";")[0]?.trim().toLowerCase(),
      contentId: cleanMessageId(header(partHeaders, "content-id")),
      disposition,
      contentBase64: /base64/i.test(header(partHeaders, "content-transfer-encoding") ?? "") ? (splitIndex >= 0 ? part.slice(splitIndex + 2).replace(/\s/g, "") : undefined) : undefined,
    };
  }).filter((part) => part.filename || part.contentType?.startsWith("text/"));
}

async function importSupportedAttachments(userClient: ReturnType<typeof createClient>, serviceClient: ReturnType<typeof createClient>, workspaceId: string, attachments: ParsedAttachment[]): Promise<ImportedAttachment[]> {
  const results: ImportedAttachment[] = [];
  for (const attachment of attachments.slice(0, 12)) {
    const attachmentId = crypto.randomUUID();
    if (!attachment.filename || !attachment.contentBase64) {
      results.push({ attachmentId, filename: attachment.filename || "email attachment", originalFilename: attachment.filename || "email attachment", contentType: attachment.contentType, contentId: attachment.contentId, disposition: attachment.disposition, status: "metadata_only", safeMessage: "Attachment metadata preserved. No supported attachment bytes were available." });
      continue;
    }
    try {
      const bytes = decodeBase64(attachment.contentBase64);
      const detected = detectSupportedAttachment(attachment.filename, bytes);
      const contentHash = await sha256Hex(bytes);
      const duplicate = await findDuplicateEvidence(serviceClient, workspaceId, contentHash);
      const sanitizedFilename = sanitizeFilename(attachment.filename);
      const storageObjectKey = duplicate?.storage_object_key ?? `${workspaceId}/${crypto.randomUUID()}/${sanitizedFilename}`;
      if (!duplicate) {
        const { error: uploadError } = await serviceClient.storage.from(BUCKET).upload(storageObjectKey, bytes, { contentType: detected.detectedMimeType, upsert: false, cacheControl: "3600" });
        if (uploadError) throw uploadError;
      }
      const { data, error } = await userClient.rpc("record_file_evidence_intake_result", {
        target_workspace_id: workspaceId,
        idempotency_key: `email-attachment:${contentHash}`,
        file_metadata: {
          originalFilename: attachment.filename,
          sanitizedFilename,
          declaredMimeType: attachment.contentType,
          detectedMimeType: detected.detectedMimeType,
          evidenceType: detected.evidenceType,
          byteSize: bytes.byteLength,
          contentHash,
          storageObjectKey,
          extractionStatus: "unsupported",
          processingStatus: "complete",
          extractionVersion: ATTACHMENT_VERSION,
          licenseUseRestrictions: "Email attachment preserved as private BRIX Evidence.",
          safeError: "Attachment preserved. Interpretation belongs to the relevant document or photo slice.",
        },
        extracted_proposals: [],
      });
      if (error) {
        if (!duplicate) await serviceClient.storage.from(BUCKET).remove([storageObjectKey]);
        throw error;
      }
      const record = Array.isArray(data) ? data[0] : data;
      results.push({ attachmentId, evidenceId: record?.evidence_id, filename: attachment.filename, originalFilename: attachment.filename, contentType: attachment.contentType, detectedMimeType: detected.detectedMimeType, byteSize: bytes.byteLength, contentHash, contentId: attachment.contentId, disposition: attachment.disposition, status: duplicate ? "duplicate" : "imported", safeMessage: duplicate ? "Attachment matched existing private Evidence." : "Attachment preserved as private Evidence." });
    } catch (error) {
      results.push({ attachmentId, filename: attachment.filename || "email attachment", originalFilename: attachment.filename || "email attachment", contentType: attachment.contentType, contentId: attachment.contentId, disposition: attachment.disposition, status: "rejected", safeMessage: safeMessage(error, "Attachment was not supported for this intake path.") });
    }
  }
  return results;
}

function detectSupportedAttachment(filename: string, bytes: Uint8Array) {
  if (bytes.byteLength === 0) throw new Error("Attachment is empty.");
  if (bytes.byteLength > MAX_BYTES) throw new Error("Attachment must be 5 MB or smaller.");
  const extension = extensionFromName(filename);
  if (["exe", "js", "mjs", "cjs", "html", "htm", "svg", "zip", "rar", "7z", "mp4", "mov", "mp3", "wav", "heic", "heif", "xlsm", "docm"].includes(extension)) throw new Error("Attachment type is not supported.");
  if (ascii(bytes, 0, 5) === "%PDF-" && extension === "pdf") return { detectedMimeType: "application/pdf", evidenceType: "document" };
  if (isPng(bytes) && extension === "png") return { detectedMimeType: "image/png", evidenceType: "image" };
  if (isJpeg(bytes) && (extension === "jpg" || extension === "jpeg")) return { detectedMimeType: "image/jpeg", evidenceType: "image" };
  if (isWebp(bytes) && extension === "webp") return { detectedMimeType: "image/webp", evidenceType: "image" };
  if (isZipContainer(bytes) && extension === "xlsx") return { detectedMimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", evidenceType: "document" };
  if (isZipContainer(bytes) && extension === "docx") return { detectedMimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", evidenceType: "document" };
  if ((extension === "txt" || extension === "csv") && looksLikeText(bytes)) return { detectedMimeType: extension === "csv" ? "text/csv" : "text/plain", evidenceType: "document" };
  throw new Error("Attachment contents could not be verified as a supported Evidence type.");
}

function buildEmailProposals(parsed: ParsedEmail, originalFilename: string): Proposal[] {
  const text = `${parsed.subject ?? ""}\n${parsed.plainTextBody ?? ""}`.slice(0, 120_000);
  const lines = text.split(/\r?\n/);
  const proposals: Proposal[] = [];
  addProposal(proposals, "address", "Address", findLine(lines, /\b\d{1,6}\s+[A-Za-z0-9.'# -]+?\s+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Cir|Circle|Blvd|Way|Place|Pl|Ter|Terrace|Pkwy|Parkway)\b/i), originalFilename);
  addProposal(proposals, "asking_price", "Asking price", findLine(lines, /\$?\b\d{2,3}(?:,\d{3})+(?:\.\d{2})?\b/), originalFilename);
  addProposal(proposals, "property_type", "Property type", findPropertyType(lines), originalFilename);
  const cityStateZip = findCityStateZip(lines);
  if (cityStateZip) {
    addProposal(proposals, "city", "City", cityStateZip.city, originalFilename, cityStateZip.line);
    addProposal(proposals, "region", "State", cityStateZip.region, originalFilename, cityStateZip.line);
    addProposal(proposals, "postal_code", "ZIP code", cityStateZip.postalCode, originalFilename, cityStateZip.line);
  }
  return proposals;
}

function addProposal(proposals: Proposal[], field: Proposal["field"], label: string, match: { value: string; line: number } | undefined, filename: string, overrideLine?: number) {
  if (!match?.value) return;
  const line = overrideLine ?? match.line;
  const normalizedValue = field === "asking_price" ? match.value.replace(/[$,]/g, "") : match.value.trim();
  proposals.push({
    id: `email:${field}:${line}:${normalizedValue.toLowerCase()}`,
    field,
    label,
    rawValue: match.value,
    normalizedValue,
    displayValue: match.value,
    classification: "source_backed_candidate",
    verificationState: "unverified",
    confidence: field === "address" ? 70 : 60,
    status: "pending",
    sourceKey: "email_source",
    evidenceRule: "Deterministic extraction from user-provided email source. Verify before relying on it.",
    sourceAnchor: { source: filename, line },
    extractorVersion: VERSION,
  });
}

function findLine(lines: string[], pattern: RegExp) {
  const index = lines.findIndex((line) => pattern.test(line));
  if (index < 0) return undefined;
  const value = lines[index].match(pattern)?.[0]?.trim();
  return value ? { value, line: index + 1 } : undefined;
}

function findPropertyType(lines: string[]) {
  const joined = lines.slice(0, 120).join(" ");
  const match = joined.match(/\b(single family|duplex|triplex|fourplex|townhouse|condo|commercial|multifamily|multi-family|land|mixed use)\b/i);
  return match ? { value: titleCase(match[1]), line: 1 } : undefined;
}

function findCityStateZip(lines: string[]) {
  for (let index = 0; index < Math.min(lines.length, 160); index += 1) {
    const match = lines[index].match(/\b([A-Za-z][A-Za-z .'-]+),\s*([A-Z]{2})\s+(\d{5})(?:-\d{4})?\b/);
    if (match) return { city: { value: titleCase(match[1]), line: index + 1 }, region: { value: match[2], line: index + 1 }, postalCode: { value: match[3], line: index + 1 }, line: index + 1 };
  }
  return undefined;
}

function header(headers: Array<{ name: string; value: string }>, name: string) {
  return headers.find((item) => item.name.toLowerCase() === name.toLowerCase())?.value;
}

function decodePartBody(part?: ParsedAttachment) {
  if (!part?.contentBase64) return undefined;
  return new TextDecoder("utf-8", { fatal: false }).decode(decodeBase64(part.contentBase64));
}

function filenameFromHeaders(contentType?: string, disposition?: string) {
  const combined = `${contentType ?? ""}; ${disposition ?? ""}`;
  return decodeMimeWords(combined.match(/filename\*?=(?:UTF-8''|")?([^";]+)"?/i)?.[1]?.trim());
}

function splitAddresses(value?: string) {
  return value ? value.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((item) => item.trim()).filter(Boolean) : [];
}

function decodeMimeWords(value?: string) {
  return value?.replace(/=\?UTF-8\?B\?([^?]+)\?=/gi, (_match, base64) => new TextDecoder("utf-8", { fatal: false }).decode(decodeBase64(base64))).replace(/%20/g, " ").trim();
}

function normalizeEmailDate(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function cleanMessageId(value?: string) {
  return value?.trim().replace(/^<|>$/g, "");
}

function decodeBase64(base64: string) {
  const cleaned = base64.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sha256Hex(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function findDuplicateEvidence(client: ReturnType<typeof createClient>, workspaceId: string, contentHash: string) {
  const { data, error } = await client.from("evidence_items").select("id, storage_object_key").eq("workspace_id", workspaceId).eq("content_hash", contentHash).maybeSingle();
  if (error) throw error;
  return data as { id: string; storage_object_key: string } | null;
}

function sanitizeFilename(filename: string) {
  return filename.trim().replace(/[^\w.\- ]+/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 120) || `email-attachment-${crypto.randomUUID()}`;
}

function extensionFromName(filename: string) {
  return filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
}

function isPng(bytes: Uint8Array) {
  return bytes.length > 24 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG";
}

function isJpeg(bytes: Uint8Array) {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isWebp(bytes: Uint8Array) {
  return bytes.length > 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP";
}

function isZipContainer(bytes: Uint8Array) {
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2]);
}

function looksLikeText(bytes: Uint8Array) {
  const sample = bytes.slice(0, Math.min(bytes.length, 4096));
  let suspicious = 0;
  for (const byte of sample) {
    if (byte === 0) return false;
    if (byte < 0x08 || (byte > 0x0d && byte < 0x20)) suspicious += 1;
  }
  return suspicious / Math.max(1, sample.length) < 0.02;
}

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function titleCase(value: string) {
  return value.split(/\s+/).filter(Boolean).map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase()).join(" ");
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function safeMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") return error.message;
  return fallback;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
