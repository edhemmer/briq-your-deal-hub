import { jsPDF } from "jspdf";
import regular from "./reportFonts/regular.json";
import bold from "./reportFonts/bold.json";
import { planReportPages, type ReportLayoutBlock } from "./reportPagination";

/** Presentation only. No canonical records, authorization, or analysis live here. */
export const REPORT_RENDERER_VERSION = "reportiq-pdf-v1";
export const REPORT_LAYOUT_VERSION = "reportiq-letter-v1";
export type ReportDisplayBlock =
  | { kind: "heading"; id: string; text: string; level: 1 | 2 }
  | { kind: "paragraph"; id: string; text: string; sourceNote?: boolean; keepTogether?: boolean }
  | { kind: "table"; id: string; headers: string[]; rows: string[][]; columnWeights?: number[] };

export interface ReportRenderDocument {
  title: string;
  reportType: string;
  workspaceId: string;
  dealId: string;
  propertyId: string;
  contractId: string;
  definitionId: string;
  definitionVersion: number;
  definitionHash: string;
  snapshotId: string;
  snapshotVersion: number;
  analysisVersion: number;
  templateVersion: string;
  generatedAt: string;
  sourceCutoffAt: string;
  perspective: string;
  selectedRole?: string;
  /** Summary front matter must precede its contents list and any cover. */
  frontMatter?: ReportDisplayBlock[];
  blocks: ReportDisplayBlock[];
}

export interface RenderedReportPdf {
  bytes: Uint8Array;
  mimeType: "application/pdf";
  extension: "pdf";
  fileHash: string;
  pageCount: number;
  durationMs: number;
  rendererVersion: string;
  layoutVersion: string;
  definitionHash: string;
  sectionPages: Record<string, number>;
  textRuns: string[];
  accessibility: { language: "en-US"; bookmarks: true; taggedPdf: false };
}

const geometry = { width: 612, height: 792, left: 54, top: 64, bottom: 60 } as const;
const width = geometry.width - geometry.left * 2;
const height = geometry.height - geometry.top - geometry.bottom;
const navy = "#17324D";
const charcoal = "#252B33";
const glyphs = new Set(regular.codepoints.filter((point) => bold.codepoints.includes(point)));
const hashPattern = /^[a-f0-9]{64}$/;

type TextFragment = { type: "text"; text: string[]; size: number; line: number; bold: boolean; color: string; headingId?: string; level?: number };
type TableFragment = { type: "table"; widths: number[]; header: string[][]; rows: string[][][]; line: number; size: number };
type Fragment = TextFragment | TableFragment;

function assertText(text: unknown) {
  if (typeof text !== "string" || text.length > 200_000) throw new Error("invalid_render_text");
  // Fail closed rather than drop unsupported glyphs or print template syntax.
  if (/\b(?:undefined|null|TODO)\b|\{\{|\}\}|<\/?[a-z][^>]*>|```/i.test(text)) throw new Error("render_placeholder_or_markup");
  for (const char of text) {
    if (char === "\n" || char === "\t") continue;
    if (!glyphs.has(char.codePointAt(0)!)) throw new Error("unsupported_report_glyph");
  }
}

function validateDocument(input: ReportRenderDocument) {
  for (const key of ["title", "reportType", "workspaceId", "dealId", "propertyId", "contractId", "definitionId", "snapshotId", "templateVersion", "perspective"] as const) {
    if (!input[key]?.trim()) throw new Error("incomplete_render_identity");
    assertText(input[key]);
  }
  if (!hashPattern.test(input.definitionHash)) throw new Error("invalid_definition_hash");
  if (input.title.length > 180 || [input.workspaceId, input.dealId, input.propertyId, input.contractId,
    input.definitionId, input.snapshotId, input.templateVersion, input.reportType].some((value) => value.length > 100)) {
    throw new Error("render_identity_exceeds_limit");
  }
  for (const value of [input.definitionVersion, input.snapshotVersion, input.analysisVersion]) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error("invalid_render_version");
  }
  for (const value of [input.generatedAt, input.sourceCutoffAt]) {
    if (!/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value))) throw new Error("invalid_render_timestamp");
  }
  if (!input.blocks.length || input.blocks.length > 10_000 || (input.frontMatter?.length ?? 0) > 100) throw new Error("invalid_render_block_count");
  const ids = new Set<string>();
  let previousLevel = 0;
  let characterCount = 0;
  let cellCount = 0;
  for (const block of [...input.frontMatter ?? [], ...input.blocks]) {
    if (!block.id || ids.has(block.id)) throw new Error("duplicate_or_missing_block_id");
    ids.add(block.id);
    if (block.kind === "table") {
      if (!block.headers.length || block.headers.length > 8 || block.rows.length > 10_000 ||
        block.rows.some((row) => row.length !== block.headers.length)) throw new Error("invalid_render_table");
      if (block.columnWeights && (block.columnWeights.length !== block.headers.length ||
        block.columnWeights.some((weight) => !Number.isFinite(weight) || weight <= 0))) throw new Error("invalid_column_weights");
      [...block.headers, ...block.rows.flat()].forEach(assertText);
      characterCount += [...block.headers, ...block.rows.flat()].reduce((sum, value) => sum + value.length, 0);
      cellCount += block.headers.length + block.rows.length * block.headers.length;
    } else {
      assertText(block.text);
      characterCount += block.text.length;
      if (!block.text.trim()) throw new Error("empty_render_text");
      if (block.kind === "heading") {
        if (![1, 2].includes(block.level) || block.level > previousLevel + 1) throw new Error("invalid_heading_hierarchy");
        previousLevel = block.level;
      }
    }
    if (characterCount > 2_000_000 || cellCount > 50_000) throw new Error("render_content_limit");
  }
}

function prepare(pdf: jsPDF, blocks: ReportDisplayBlock[]) {
  const layout: ReportLayoutBlock[] = [];
  const fragments = new Map<string, Fragment>();
  for (const [blockIndex, block] of blocks.entries()) {
    const internalId = `block-${blockIndex}`;
    if (block.kind === "table") {
      const weights = block.columnWeights ?? block.headers.map(() => 1);
      const sum = weights.reduce((total, value) => total + value, 0);
      const widths = weights.map((value) => width * value / sum);
      if (widths.some((value) => value < 42)) throw new Error("table_column_too_narrow");
      const size = 9;
      const line = 12;
      pdf.setFontSize(size);
      pdf.setFont("DejaVu", "bold");
      const header = block.headers.map((cell, index) => pdf.splitTextToSize(cell, widths[index] - 12) as string[]);
      pdf.setFont("DejaVu", "normal");
      const rows = block.rows.map((row) => row.map((cell, index) => pdf.splitTextToSize(cell || " ", widths[index] - 12) as string[]));
      const rowHeight = (row: string[][]) => Math.max(...row.map((cell) => cell.length)) * line + 14;
      layout.push({ kind: "table", id: internalId, headerHeight: rowHeight(header), rowHeights: rows.map(rowHeight) });
      fragments.set(internalId, { type: "table", widths, header, rows, size, line });
      continue;
    }
    const heading = block.kind === "heading";
    const size = heading ? (block.level === 1 ? 16 : 12) : (block.sourceNote ? 8.5 : 11);
    const line = heading ? size * 1.25 : size * 1.4;
    pdf.setFont("DejaVu", heading ? "bold" : "normal");
    pdf.setFontSize(size);
    const lines = pdf.splitTextToSize(block.text, width) as string[];
    // Two-line fragments prevent paragraph widows without shrinking body text.
    // Keep a final group of three lines together rather than leaving one line.
    const chunks: string[][] = [];
    if (heading || block.keepTogether || lines.length <= 3) chunks.push(lines);
    else for (let index = 0; index < lines.length;) {
      const count = lines.length - index === 3 ? 3 : 2;
      chunks.push(lines.slice(index, index + count));
      index += count;
    }
    chunks.forEach((text, index) => {
      const id = `${internalId}:fragment:${index}`;
      const gap = index === chunks.length - 1 ? (heading ? 9 : 7) : 0;
      const measured = text.length * line + gap;
      layout.push(heading ? { kind: "heading", id, height: measured, minFollowingHeight: 30.8 }
        : { kind: "paragraph", id, height: measured });
      fragments.set(id, { type: "text", text, size, line, bold: heading, color: heading ? navy : charcoal,
        ...(heading ? { headingId: block.id, level: block.level } : {}) });
    });
  }
  return { pages: planReportPages(layout, height), fragments };
}

export async function renderReportPdf(input: ReportRenderDocument): Promise<RenderedReportPdf> {
  const started = performance.now();
  validateDocument(input);
  const pdf = new jsPDF({ unit: "pt", format: "letter", compress: true, putOnlyUsedFonts: true });
  pdf.addFileToVFS("DejaVuSans.ttf", regular.base64);
  pdf.addFileToVFS("DejaVuSans-Bold.ttf", bold.base64);
  pdf.addFont("DejaVuSans.ttf", "DejaVu", "normal");
  pdf.addFont("DejaVuSans-Bold.ttf", "DejaVu", "bold");
  pdf.setFileId(input.definitionHash.slice(0, 32).toUpperCase());
  pdf.setLanguage("en-US");
  pdf.setProperties({ title: input.title, subject: `${input.reportType}; definition ${input.definitionId} v${input.definitionVersion}`,
    author: "BRIX Real Estate", creator: `BRIX ${REPORT_RENDERER_VERSION}`,
    keywords: [input.definitionHash, input.workspaceId, input.dealId, input.propertyId, input.contractId,
      input.snapshotId, `snapshot-v${input.snapshotVersion}`, `analysis-v${input.analysisVersion}`,
      input.templateVersion, REPORT_LAYOUT_VERSION, input.perspective, input.selectedRole ?? "",
      `sources-as-of:${input.sourceCutoffAt}`].join(";") });
  const utcCreation = new Date(input.generatedAt).toISOString().slice(0, 19).replace(/[-:T]/g, "");
  pdf.setCreationDate(`D:${utcCreation}+00'00'`);
  const sections = input.blocks.filter((block): block is Extract<ReportDisplayBlock, { kind: "heading" }> => block.kind === "heading");
  const front = input.frontMatter?.length ? prepare(pdf, input.frontMatter) : null;
  if (input.reportType === "buyer_summary" && (!front || front.pages.length > 2)) {
    throw new Error("summary_front_matter_exceeds_two_pages_or_missing");
  }
  const content = prepare(pdf, input.blocks);
  // Contents entries wrap and paginate using exactly the same measured layout.
  const contentsBlocks: ReportDisplayBlock[] = sections.length && (sections.length > 3 || content.pages.length > 2) ? [{ kind: "heading", id: "__contents", text: "Contents", level: 1 },
    ...sections.map((section) => ({ kind: "paragraph" as const, id: `__toc_${section.id}`, text: `${section.text}    00000`, keepTogether: true }))] : [];
  const contents = prepare(pdf, contentsBlocks);
  const offset = front ? front.pages.length : 1;
  const contentOffset = offset + contents.pages.length;
  const total = contentOffset + content.pages.length;
  if (total > 500) throw new Error("render_page_limit");
  const sectionPages: Record<string, number> = {};
  content.pages.forEach((page, index) => page.items.forEach((item) => {
    const fragment = content.fragments.get(item.blockId)!;
    if (fragment.type === "text" && fragment.headingId) sectionPages[fragment.headingId] = contentOffset + index + 1;
  }));
  const textRuns: string[] = [];
  const contentsTargets = new Map(contentsBlocks.map((block, index) => [`block-${index}:fragment:0`,
    sections.find((section) => block.id === `__toc_${section.id}`)]));
  let pageNumber = 0;
  const newPage = () => { if (pageNumber++) pdf.addPage(); };
  const draw = (prepared: ReturnType<typeof prepare>, isContents = false) => {
    for (const page of prepared.pages) {
      newPage();
      let y: number = geometry.top;
      for (const item of page.items) {
        const fragment = prepared.fragments.get(item.blockId)!;
        if (fragment.type === "text") {
          pdf.setFont("DejaVu", fragment.bold ? "bold" : "normal");
          pdf.setFontSize(fragment.size);
          pdf.setTextColor(fragment.color);
          let lines = fragment.text;
          const tocSection = isContents ? contentsTargets.get(item.blockId) : undefined;
          if (tocSection) lines = pdf.splitTextToSize(`${tocSection.text}    ${sectionPages[tocSection.id]}`, width) as string[];
          lines.forEach((line, index) => { pdf.text(line, geometry.left, y + fragment.size + index * fragment.line); textRuns.push(line); });
          if (tocSection) pdf.link(geometry.left, y, width, item.height, { pageNumber: sectionPages[tocSection.id] });
          if (fragment.headingId && !isContents) pdf.outline.add(undefined, fragment.text.join(" "), { pageNumber });
        } else {
          const isHeader = item.kind === "table-header";
          const cells = isHeader ? fragment.header : fragment.rows[item.rowIndex!];
          let x: number = geometry.left;
          cells.forEach((lines, index) => {
            pdf.setFillColor(isHeader ? navy : "#FFFFFF");
            pdf.setDrawColor("#C9D0D8");
            pdf.rect(x, y, fragment.widths[index], item.height, "FD");
            pdf.setFont("DejaVu", isHeader ? "bold" : "normal");
            pdf.setFontSize(fragment.size);
            pdf.setTextColor(isHeader ? "#FFFFFF" : charcoal);
            lines.forEach((line, lineIndex) => { pdf.text(line, x + 6, y + 7 + fragment.size + lineIndex * fragment.line); textRuns.push(line); });
            x += fragment.widths[index];
          });
        }
        y += item.height;
      }
    }
  };
  if (front) draw(front);
  else {
    newPage();
    pdf.setFont("DejaVu", "bold"); pdf.setFontSize(24); pdf.setTextColor(navy);
    const titleLines = pdf.splitTextToSize(input.title, width) as string[];
    if (titleLines.length > 5) throw new Error("cover_title_exceeds_limit");
    pdf.text(titleLines, geometry.left, 170, { lineHeightFactor: 1.25 });
    textRuns.push(input.title);
    pdf.setFont("DejaVu", "normal"); pdf.setFontSize(11); pdf.setTextColor(charcoal);
    const labels = [`Perspective: ${input.perspective}`, `Generated: ${input.generatedAt}`, `Sources as of: ${input.sourceCutoffAt}`,
      `Definition version: ${input.definitionVersion}`, `Template: ${input.templateVersion}`, `Renderer: ${REPORT_RENDERER_VERSION}`];
    const labelLines = labels.flatMap((label) => pdf.splitTextToSize(label, width) as string[]);
    pdf.text(labelLines, geometry.left, 370, { lineHeightFactor: 1.7 }); textRuns.push(...labels);
  }
  draw(contents, true);
  draw(content);
  for (let page = 1; page <= total; page++) {
    pdf.setPage(page); pdf.setFont("DejaVu", "normal"); pdf.setFontSize(8.5); pdf.setTextColor("#435064");
    pdf.text("BRIX REAL ESTATE | PRIVATE REPORT", geometry.left, 32);
    const footer = pdf.splitTextToSize(`Definition ${input.definitionId} | v${input.definitionVersion}`, width - 60) as string[];
    if (footer.length > 2) throw new Error("footer_identity_exceeds_limit");
    pdf.text(footer, geometry.left, 752, { lineHeightFactor: 1.2 });
    pdf.text(`${page} / ${total}`, geometry.width - geometry.left, 752, { align: "right" });
  }
  const bytes = new Uint8Array(pdf.output("arraybuffer"));
  const signature = new TextDecoder().decode(bytes.slice(0, 8));
  if (!signature.startsWith("%PDF-") || bytes.length < 100 || bytes.length > 52_428_800 ||
    !new TextDecoder().decode(bytes.slice(-50)).includes("%%EOF")) throw new Error("invalid_pdf_output");
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const fileHash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { bytes, mimeType: "application/pdf", extension: "pdf", fileHash, pageCount: total,
    durationMs: performance.now() - started, rendererVersion: REPORT_RENDERER_VERSION, layoutVersion: REPORT_LAYOUT_VERSION,
    definitionHash: input.definitionHash, sectionPages, textRuns,
    accessibility: { language: "en-US", bookmarks: true, taggedPdf: false } };
}
