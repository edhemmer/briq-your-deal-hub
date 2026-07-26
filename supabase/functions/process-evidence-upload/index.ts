import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const MAX_BYTES = 5 * 1024 * 1024;
const BUCKET = "brix-evidence";
const VERSION = "file-evidence-intake-v1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EvidenceKind = "file" | "image" | "document";
type DetectedFile = {
  extension: string;
  detectedMimeType: string;
  evidenceType: EvidenceKind;
  extractionStatus: "complete" | "partially_complete" | "unsupported" | "failed";
  safeError?: string;
  imageWidth?: number;
  imageHeight?: number;
  pageCount?: number;
};

type Proposal = {
  id: string;
  field: "address" | "city" | "region" | "postal_code" | "property_type" | "asking_price";
  label: string;
  rawValue: string;
  normalizedValue: string;
  displayValue: string;
  classification: "source_backed_candidate" | "external_estimate" | "unknown";
  verificationState: "unverified";
  confidence: number;
  status: "pending";
  sourceKey: string;
  evidenceRule: string;
  sourceAnchor: Record<string, unknown>;
  extractorVersion: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST for Evidence intake." }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: "Evidence intake is not configured." }, 503);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Authentication required." }, 401);

    const body = await req.json();
    const workspaceId = stringValue(body?.workspaceId);
    if (!workspaceId) return json({ error: "Workspace is required." }, 400);

    const { data: canRecord, error: permissionError } = await userClient.rpc("can_record_file_evidence_intake", {
      target_workspace_id: workspaceId,
    });
    if (permissionError) return json({ error: safeMessage(permissionError, "BRIX could not verify Evidence permissions.") }, 403);
    if (canRecord !== true) return json({ error: "You do not have permission to import Evidence in this BRIX account." }, 403);

    const originalFilename = stringValue(body?.fileName) ?? "uploaded-evidence";
    const declaredMimeType = stringValue(body?.declaredMimeType);
    const base64 = stringValue(body?.contentBase64);
    if (!base64) return json({ error: "Evidence file content is required." }, 400);

    const bytes = decodeBase64(base64);
    const detected = detectSupportedFile(originalFilename, declaredMimeType, bytes);
    const contentHash = await sha256Hex(bytes);
    const sanitizedFilename = sanitizeFilename(originalFilename);
    const duplicate = await findDuplicateEvidence(serviceClient, workspaceId, contentHash);
    const storageObjectKey = duplicate?.storage_object_key ?? `${workspaceId}/${crypto.randomUUID()}/${sanitizedFilename}`;
    const proposals = buildDeterministicProposals(bytes, detected, originalFilename);

    if (!duplicate) {
      const { error: uploadError } = await serviceClient.storage
        .from(BUCKET)
        .upload(storageObjectKey, bytes, {
          contentType: detected.detectedMimeType,
          upsert: false,
          cacheControl: "3600",
        });
      if (uploadError) return json({ error: safeMessage(uploadError, "BRIX could not preserve this Evidence file.") }, 502);
    }

    const metadata = {
      originalFilename,
      sanitizedFilename,
      declaredMimeType,
      detectedMimeType: detected.detectedMimeType,
      evidenceType: detected.evidenceType,
      byteSize: bytes.byteLength,
      contentHash,
      storageObjectKey,
      extractionStatus: proposals.length ? "partially_complete" : detected.extractionStatus,
      processingStatus: "complete",
      extractionVersion: VERSION,
      pageCount: detected.pageCount,
      imageWidth: detected.imageWidth,
      imageHeight: detected.imageHeight,
      licenseUseRestrictions: "User-provided upload preserved as private BRIX Evidence.",
      safeError: proposals.length ? undefined : detected.safeError,
    };

    const idempotencyKey = `file-evidence:${contentHash}`;
    const { data, error } = await userClient.rpc("record_file_evidence_intake_result", {
      target_workspace_id: workspaceId,
      idempotency_key: idempotencyKey,
      file_metadata: metadata,
      extracted_proposals: proposals,
    });

    if (error) {
      if (!duplicate) await serviceClient.storage.from(BUCKET).remove([storageObjectKey]);
      return json({ error: safeMessage(error, "BRIX saved no Evidence metadata. The file can be retried safely.") }, 400);
    }

    const result = Array.isArray(data) ? data[0] : data;
    return json({
      evidenceId: result?.evidence_id,
      intakeId: result?.intake_id,
      sourceRecordId: result?.source_record_id,
      jobId: result?.job_id,
      duplicateOfEvidenceId: result?.duplicate_of_evidence_id,
      status: result?.import_status ?? (duplicate ? "duplicate" : "preserved"),
      safeMessage: result?.safe_message ?? "Evidence saved.",
      originalFilename,
      sanitizedFilename,
      detectedMimeType: detected.detectedMimeType,
      evidenceType: detected.evidenceType,
      byteSize: bytes.byteLength,
      contentHash,
      uploadedAt: new Date().toISOString(),
      extractionStatus: proposals.length ? "partially_complete" : detected.extractionStatus,
      proposals,
    });
  } catch (error) {
    return json({ error: safeMessage(error, "BRIX could not process this Evidence file.") }, 400);
  }
});

function detectSupportedFile(filename: string, declaredMimeType: string | undefined, bytes: Uint8Array): DetectedFile {
  if (bytes.byteLength === 0) throw new Error("Evidence file is empty.");
  if (bytes.byteLength > MAX_BYTES) throw new Error("Evidence file must be 5 MB or smaller for this intake path.");

  const extension = extensionFromName(filename);
  if (["exe", "js", "mjs", "cjs", "html", "htm", "svg", "zip", "rar", "7z", "mp4", "mov", "mp3", "wav", "heic", "heif", "xlsm", "docm"].includes(extension)) {
    throw new Error("That file type is not supported for BRIX Evidence intake.");
  }

  if (isPdf(bytes) && extension === "pdf") {
    return { extension, detectedMimeType: "application/pdf", evidenceType: "document", extractionStatus: "unsupported", safeError: "PDF preserved. Text extraction is deferred until the document processing slice.", pageCount: estimatePdfPageCount(bytes) };
  }
  if (isPng(bytes) && extension === "png") {
    return { extension, detectedMimeType: "image/png", evidenceType: "image", extractionStatus: "unsupported", safeError: "Image preserved. Photo condition analysis belongs to PhotoIQ.", ...pngDimensions(bytes) };
  }
  if (isJpeg(bytes) && (extension === "jpg" || extension === "jpeg")) {
    return { extension, detectedMimeType: "image/jpeg", evidenceType: "image", extractionStatus: "unsupported", safeError: "Image preserved. Photo condition analysis belongs to PhotoIQ.", ...jpegDimensions(bytes) };
  }
  if (isWebp(bytes) && extension === "webp") {
    return { extension, detectedMimeType: "image/webp", evidenceType: "image", extractionStatus: "unsupported", safeError: "Image preserved. Photo condition analysis belongs to PhotoIQ." };
  }
  if (isZipContainer(bytes) && extension === "xlsx") {
    return { extension, detectedMimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", evidenceType: "document", extractionStatus: "unsupported", safeError: "XLSX preserved. Spreadsheet parsing is deferred until a safe workbook parser is available." };
  }
  if (isZipContainer(bytes) && extension === "docx") {
    return { extension, detectedMimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", evidenceType: "document", extractionStatus: "unsupported", safeError: "DOCX preserved. Document parsing is deferred until a safe document parser is available." };
  }
  if ((extension === "txt" || extension === "csv") && looksLikeText(bytes) && !hasExecutableSignature(bytes)) {
    return {
      extension,
      detectedMimeType: extension === "csv" ? "text/csv" : "text/plain",
      evidenceType: "document",
      extractionStatus: "complete",
    };
  }

  if (declaredMimeType && /^(text\/plain|text\/csv)$/i.test(declaredMimeType) && looksLikeText(bytes) && !hasExecutableSignature(bytes)) {
    return { extension, detectedMimeType: declaredMimeType.toLowerCase(), evidenceType: "document", extractionStatus: "complete" };
  }

  throw new Error("BRIX could not verify this file type from its contents.");
}

function buildDeterministicProposals(bytes: Uint8Array, detected: DetectedFile, originalFilename: string): Proposal[] {
  if (detected.detectedMimeType !== "text/plain" && detected.detectedMimeType !== "text/csv") return [];
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes).slice(0, 120_000);
  const lines = text.split(/\r?\n/);
  const proposals: Proposal[] = [];
  addProposal(proposals, "address", "Address", findLine(lines, /\b\d{1,6}\s+[A-Za-z0-9.'# -]+?\s+(?:St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Cir|Circle|Blvd|Way|Place|Pl|Ter|Terrace|Pkwy|Parkway)\b/i), originalFilename);
  addProposal(proposals, "asking_price", "Asking price", findPrice(lines), originalFilename);
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
    id: `${field}:${line}:${normalizedValue.toLowerCase()}`,
    field,
    label,
    rawValue: match.value,
    normalizedValue,
    displayValue: match.value,
    classification: field === "asking_price" ? "source_backed_candidate" : "source_backed_candidate",
    verificationState: "unverified",
    confidence: field === "address" ? 72 : 62,
    status: "pending",
    sourceKey: "file_evidence",
    evidenceRule: "Deterministic text extraction from user-provided Evidence. Verify before relying on it.",
    sourceAnchor: { file: filename, line },
    extractorVersion: VERSION,
  });
}

function findLine(lines: string[], pattern: RegExp) {
  const index = lines.findIndex((line) => pattern.test(line));
  if (index < 0) return undefined;
  const value = lines[index].match(pattern)?.[0]?.trim();
  return value ? { value, line: index + 1 } : undefined;
}

function findPrice(lines: string[]) {
  return findLine(lines, /\$?\b\d{2,3}(?:,\d{3})+(?:\.\d{2})?\b/);
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
  const { data, error } = await client
    .from("evidence_items")
    .select("id, storage_object_key")
    .eq("workspace_id", workspaceId)
    .eq("content_hash", contentHash)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; storage_object_key: string } | null;
}

function sanitizeFilename(filename: string) {
  const name = filename.trim().replace(/[^\w.\- ]+/g, "-").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 120);
  return name || `evidence-${crypto.randomUUID()}`;
}

function extensionFromName(filename: string) {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

function isPdf(bytes: Uint8Array) {
  return ascii(bytes, 0, 5) === "%PDF-";
}

function isPng(bytes: Uint8Array) {
  return bytes.length > 24 && bytes[0] === 0x89 && ascii(bytes, 1, 3) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
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

function hasExecutableSignature(bytes: Uint8Array) {
  return ascii(bytes, 0, 2) === "MZ" || ascii(bytes, 1, 3) === "ELF" || isZipContainer(bytes);
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

function estimatePdfPageCount(bytes: Uint8Array) {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, Math.min(bytes.length, 500_000)));
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return matches?.length;
}

function pngDimensions(bytes: Uint8Array) {
  if (bytes.length < 24) return {};
  return { imageWidth: readUInt32(bytes, 16), imageHeight: readUInt32(bytes, 20) };
}

function jpegDimensions(bytes: Uint8Array) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if (marker >= 0xc0 && marker <= 0xc3 && offset + 8 < bytes.length) {
      return { imageHeight: (bytes[offset + 5] << 8) + bytes[offset + 6], imageWidth: (bytes[offset + 7] << 8) + bytes[offset + 8] };
    }
    offset += 2 + length;
  }
  return {};
}

function readUInt32(bytes: Uint8Array, offset: number) {
  return ((bytes[offset] << 24) >>> 0) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
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
