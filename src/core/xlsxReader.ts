import { strFromU8, unzipSync } from "fflate";

export type XlsxReadLimits = {
  maxSheets: number;
  maxRowsPerSheet: number;
  maxCellsPerRow: number;
  maxArchiveEntries?: number;
  maxUncompressedBytes?: number;
};

export type XlsxSheetRows = {
  name: string;
  rows: string[][];
};

const DEFAULT_MAX_ARCHIVE_ENTRIES = 256;
const DEFAULT_MAX_UNCOMPRESSED_BYTES = 20 * 1024 * 1024;

export function parseBoundedXlsxRows(bytes: Uint8Array, limits: XlsxReadLimits): XlsxSheetRows[] {
  if (bytes.byteLength < 22) throw new Error("The XLSX workbook is incomplete.");
  const archive = openBoundedArchive(
    bytes,
    limits.maxArchiveEntries ?? DEFAULT_MAX_ARCHIVE_ENTRIES,
    limits.maxUncompressedBytes ?? DEFAULT_MAX_UNCOMPRESSED_BYTES,
  );

  const workbookXml = readXmlFile(archive, "xl/workbook.xml");
  const relsXml = readXmlFile(archive, "xl/_rels/workbook.xml.rels");
  const sharedStrings = readSharedStrings(archive);
  const relationships = readRelationships(relsXml);
  const workbookSheets = readWorkbookSheets(workbookXml).slice(0, limits.maxSheets);

  const result: XlsxSheetRows[] = [];
  for (const sheet of workbookSheets) {
    const target = relationships.get(sheet.relationshipId);
    if (!target) continue;
    const normalizedTarget = normalizeWorkbookTarget(target);
    const xml = readXmlFile(archive, normalizedTarget, false);
    if (!xml) continue;
    const rows = readSheetRows(xml, sharedStrings, limits.maxRowsPerSheet + 1, limits.maxCellsPerRow);
    if (rows.length) result.push({ name: sheet.name, rows });
  }
  return result;
}

function openBoundedArchive(bytes: Uint8Array, maxEntries: number, maxUncompressedBytes: number) {
  let fallbackError: Error | undefined;
  for (const end of zipCandidateEnds(bytes)) {
    let archive: Record<string, Uint8Array>;
    try {
      archive = unzipSync(bytes.slice(0, end));
    } catch (error) {
      fallbackError = error instanceof Error ? error : new Error("The XLSX workbook could not be opened safely.");
      continue;
    }
    try {
      validateUnzippedArchive(archive, maxEntries, maxUncompressedBytes);
    } catch (error) {
      fallbackError = error instanceof Error ? error : new Error("The XLSX workbook could not be opened safely.");
      continue;
    }
    if (archive["xl/workbook.xml"] && archive["xl/_rels/workbook.xml.rels"]) return archive;
    fallbackError = new Error("The XLSX workbook is missing a required part.");
  }
  if (fallbackError) throw fallbackError;
  throw new Error("The XLSX workbook could not be opened safely.");
}

function zipCandidateEnds(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const candidates: number[] = [];
  const min = 0;
  for (let index = bytes.byteLength - 22; index >= min; index -= 1) {
    if (view.getUint32(index, true) !== 0x06054b50) continue;
    const commentLength = view.getUint16(index + 20, true);
    const end = index + 22 + commentLength;
    if (end <= bytes.byteLength) candidates.push(end);
  }
  return candidates;
}

function validateUnzippedArchive(archive: Record<string, Uint8Array>, maxEntries: number, maxUncompressedBytes: number) {
  const entries = Object.values(archive);
  if (entries.length > maxEntries) throw new Error("The XLSX workbook contains too many package entries.");
  const totalUncompressed = entries.reduce((total, entry) => total + entry.byteLength, 0);
  if (totalUncompressed > maxUncompressedBytes) {
    throw new Error("The XLSX workbook expands beyond the safe processing limit.");
  }
}

function readXmlFile(archive: Record<string, Uint8Array>, path: string, required = true) {
  const bytes = archive[path];
  if (!bytes) {
    if (required) throw new Error("The XLSX workbook is missing a required part.");
    return "";
  }
  return strFromU8(bytes);
}

function parseXml(xml: string) {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror")) throw new Error("The XLSX workbook contains malformed XML.");
  return document;
}

function readWorkbookSheets(xml: string) {
  const document = parseXml(xml);
  return Array.from(document.getElementsByTagName("sheet")).map((sheet, index) => ({
    name: sheet.getAttribute("name")?.trim() || `Sheet ${index + 1}`,
    relationshipId:
      sheet.getAttribute("r:id") ||
      sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") ||
      "",
  })).filter((sheet) => sheet.relationshipId);
}

function readRelationships(xml: string) {
  const document = parseXml(xml);
  const relationships = new Map<string, string>();
  for (const relation of Array.from(document.getElementsByTagName("Relationship"))) {
    const id = relation.getAttribute("Id");
    const target = relation.getAttribute("Target");
    if (id && target) relationships.set(id, target);
  }
  return relationships;
}

function normalizeWorkbookTarget(target: string) {
  const cleaned = target.replace(/\\/g, "/").replace(/^\/+/, "");
  const fullPath = cleaned.startsWith("xl/") ? cleaned : `xl/${cleaned}`;
  const segments: string[] = [];
  for (const segment of fullPath.split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  const normalized = segments.join("/");
  if (!normalized.startsWith("xl/worksheets/")) {
    throw new Error("The XLSX workbook contains an unexpected worksheet target.");
  }
  return normalized;
}

function readSharedStrings(archive: Record<string, Uint8Array>) {
  const xml = readXmlFile(archive, "xl/sharedStrings.xml", false);
  if (!xml) return [] as string[];
  const document = parseXml(xml);
  return Array.from(document.getElementsByTagName("si")).map((node) =>
    Array.from(node.getElementsByTagName("t")).map((text) => text.textContent ?? "").join(""),
  );
}

function readSheetRows(xml: string, sharedStrings: string[], maxRows: number, maxCellsPerRow: number) {
  const document = parseXml(xml);
  const rows: string[][] = [];
  for (const row of Array.from(document.getElementsByTagName("row"))) {
    if (rows.length >= maxRows) break;
    const values: string[] = [];
    for (const cell of Array.from(row.getElementsByTagName("c"))) {
      const reference = cell.getAttribute("r") ?? "";
      const columnIndex = columnIndexForReference(reference);
      if (columnIndex >= maxCellsPerRow) continue;
      while (values.length <= columnIndex && values.length < maxCellsPerRow) values.push("");
      if (columnIndex < maxCellsPerRow) values[columnIndex] = cellText(cell, sharedStrings).trim();
    }
    if (values.some(Boolean)) rows.push(values.slice(0, maxCellsPerRow));
  }
  return rows;
}

function cellText(cell: Element, sharedStrings: string[]) {
  const type = cell.getAttribute("t");
  if (type === "inlineStr") {
    return Array.from(cell.getElementsByTagName("t")).map((node) => node.textContent ?? "").join("");
  }
  const raw = cell.getElementsByTagName("v")[0]?.textContent ?? "";
  if (type === "s") {
    const index = Number.parseInt(raw, 10);
    return Number.isFinite(index) ? sharedStrings[index] ?? "" : "";
  }
  if (type === "b") return raw === "1" ? "TRUE" : raw === "0" ? "FALSE" : raw;
  return raw;
}

function columnIndexForReference(reference: string) {
  const match = reference.match(/^([A-Z]+)\d+$/i);
  if (!match) return 0;
  let value = 0;
  for (const char of match[1].toUpperCase()) value = value * 26 + char.charCodeAt(0) - 64;
  return Math.max(0, value - 1);
}
