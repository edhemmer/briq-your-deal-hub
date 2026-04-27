/**
 * ContractIQ document parser — deterministic, client-side text extraction.
 *
 * Strategy: do the *parsing* in the browser using well-known libraries
 * (pdfjs, mammoth, xlsx) so the AI only has to do *mapping*, not OCR
 * on documents that already have a text layer. This keeps the pipeline
 * canonical (same input bytes -> same extracted text -> same hash).
 *
 * For pure scanned PDFs / images, we send the raw image to the edge
 * function which uses Gemini's vision capability.
 */

export interface ParsedDocument {
  filename: string;
  mime: string;
  size: number;
  text: string;
  pageCount?: number;
  parser: "pdfjs" | "mammoth" | "xlsx" | "eml" | "plain" | "image";
}

const readAsText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });

const readAsArrayBuffer = (file: File) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(file);
  });

export const readAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

async function parsePdf(file: File): Promise<ParsedDocument> {
  // Dynamic import keeps initial bundle smaller.
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (
    await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
  ).default as string;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buf = await readAsArrayBuffer(file);
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ");
    pages.push(text);
  }
  return {
    filename: file.name,
    mime: file.type || "application/pdf",
    size: file.size,
    text: pages.join("\n\n"),
    pageCount: doc.numPages,
    parser: "pdfjs",
  };
}

async function parseDocx(file: File): Promise<ParsedDocument> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await readAsArrayBuffer(file);
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return {
    filename: file.name,
    mime: file.type,
    size: file.size,
    text: result.value ?? "",
    parser: "mammoth",
  };
}

async function parseXlsx(file: File): Promise<ParsedDocument> {
  const XLSX = await import("xlsx");
  const buf = await readAsArrayBuffer(file);
  const wb = XLSX.read(buf, { type: "array" });
  const chunks: string[] = [];
  wb.SheetNames.forEach((name) => {
    const sheet = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    if (csv.trim()) chunks.push(`# Sheet: ${name}\n${csv}`);
  });
  return {
    filename: file.name,
    mime: file.type,
    size: file.size,
    text: chunks.join("\n\n"),
    parser: "xlsx",
  };
}

/**
 * Minimal .eml parser: extract headers (From / To / Subject / Date) and the
 * first plain-text body section. Good enough for broker emails — no MIME
 * attachment recursion (attachments should be uploaded as separate files).
 */
async function parseEml(file: File): Promise<ParsedDocument> {
  const raw = await readAsText(file);
  const headerEnd = raw.search(/\r?\n\r?\n/);
  const headerBlock = headerEnd >= 0 ? raw.slice(0, headerEnd) : raw;
  const body = headerEnd >= 0 ? raw.slice(headerEnd).trim() : "";

  const grab = (name: string) => {
    const m = headerBlock.match(new RegExp(`^${name}:\\s*(.+)$`, "im"));
    return m ? m[1].trim() : "";
  };

  // Strip any quoted-printable soft-wraps in the body.
  const cleanedBody = body
    .replace(/=\r?\n/g, "")
    .replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

  const text = [
    `From: ${grab("From")}`,
    `To: ${grab("To")}`,
    `Subject: ${grab("Subject")}`,
    `Date: ${grab("Date")}`,
    "",
    cleanedBody,
  ].join("\n");

  return {
    filename: file.name,
    mime: file.type || "message/rfc822",
    size: file.size,
    text,
    parser: "eml",
  };
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  const lower = file.name.toLowerCase();
  if (file.type === "application/pdf" || lower.endsWith(".pdf")) return parsePdf(file);
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  )
    return parseDocx(file);
  if (
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls")
  )
    return parseXlsx(file);
  if (lower.endsWith(".eml") || file.type === "message/rfc822") return parseEml(file);
  if (file.type.startsWith("image/")) {
    // Images are handed off to the edge function as base64.
    return {
      filename: file.name,
      mime: file.type,
      size: file.size,
      text: "",
      parser: "image",
    };
  }
  // Fallback: treat as plain text (covers .txt, .md, copy/pasted email saved as .txt)
  const text = await readAsText(file);
  return {
    filename: file.name,
    mime: file.type || "text/plain",
    size: file.size,
    text,
    parser: "plain",
  };
}
