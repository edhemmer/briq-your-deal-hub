import * as XLSX from "xlsx";
import { createDuplicateDetectionRequest, findDuplicateCandidates, packageBatchDuplicateCandidate } from "./duplicateDetection";
import { createManualIntakeDraft } from "./propertyIntake";
import { supabase } from "./supabase";
import type { ManualIntakeDraft } from "./types";

type UnknownRecord = Record<string, unknown>;

export const PACKAGE_BATCH_SCHEMA_VERSION = 1;
export const PACKAGE_BATCH_STORAGE_PREFIX = "brix.packageBatchDraft:";

export const PACKAGE_BATCH_LIMITS = {
  maxItems: 50,
  maxFiles: 20,
  maxTotalPackageBytes: 25 * 1024 * 1024,
  maxFileBytes: 5 * 1024 * 1024,
  maxCsvRows: 100,
  maxXlsxSheets: 3,
  maxXlsxRowsPerSheet: 100,
  maxXlsxCellsPerRow: 50,
  maxConcurrentItemProcessors: 3,
  maxExtractedCharactersPerItem: 8_000,
  maxRetainedItemErrors: 5,
  tempUploadExpirationHours: 24,
} as const;

export const packageBatchStatuses = [
  "draft",
  "validating",
  "awaiting_mapping",
  "queued",
  "processing",
  "awaiting_review",
  "partially_complete",
  "complete",
  "failed",
  "conflicted",
  "cancelled",
] as const;

export const packageBatchItemStatuses = [
  "pending",
  "validating",
  "invalid",
  "duplicate_candidate",
  "awaiting_mapping",
  "awaiting_match_decision",
  "queued",
  "processing",
  "awaiting_review",
  "conflicted",
  "creating_property",
  "creating_deal",
  "attaching_evidence",
  "complete",
  "failed",
  "retry_scheduled",
  "skipped",
  "cancelled",
] as const;

export type PackageBatchStatus = typeof packageBatchStatuses[number];
export type PackageBatchItemStatus = typeof packageBatchItemStatuses[number];
export type PackageBatchType = "spreadsheet" | "multi_file" | "mixed_package" | "multi_property_deal" | "multi_deal_batch";
export type PackageBatchSourceType = "csv" | "xlsx" | "file" | "image" | "document" | "listing_url" | "email" | "manual_row" | "unknown";
export type PackageBatchField =
  | "ignore"
  | "opportunity_name"
  | "address"
  | "unit_number"
  | "city"
  | "region"
  | "postal_code"
  | "property_type"
  | "asking_price"
  | "expected_price"
  | "intended_strategy"
  | "source_url"
  | "source"
  | "source_contact"
  | "notes"
  | "deal_group";

export type PackageBatchSource = {
  sourceId: string;
  sourceType: PackageBatchSourceType;
  originalFilename?: string;
  declaredMimeType?: string;
  byteSize?: number;
  contentHash: string;
  preservedAsEvidence: boolean;
  originalText?: string;
};

export type PackageColumnMapping = Record<string, PackageBatchField>;

export type PackageBatchItem = {
  id: string;
  batchId: string;
  itemIndex: number;
  sourceId: string;
  sourceType: PackageBatchSourceType;
  status: PackageBatchItemStatus;
  mappedValues: Partial<Record<Exclude<PackageBatchField, "ignore">, string>>;
  rawValues: Record<string, string>;
  sourceAnchor: Record<string, string | number | boolean | null>;
  targetDealGroupKey?: string;
  duplicateCandidates: Array<{ itemId?: string; propertyId?: string; reason: string; displayAddress: string }>;
  safeErrors: string[];
  retryCount: number;
};

export type PackageBatchDraft = {
  version: 1;
  id: string;
  workspaceId?: string;
  batchType: PackageBatchType;
  status: PackageBatchStatus;
  sources: PackageBatchSource[];
  items: PackageBatchItem[];
  columnMapping: PackageColumnMapping;
  limits: typeof PACKAGE_BATCH_LIMITS;
  createdAt: string;
  updatedAt: string;
};

export type PackageBatchSummary = {
  total: number;
  ready: number;
  needsMapping: number;
  duplicates: number;
  failed: number;
  skipped: number;
  complete: number;
  canPartiallyProcess: boolean;
};

export type PackageBatchRecordResult = {
  batchId: string;
  batchStatus: PackageBatchStatus;
  itemCount: number;
  readyItemCount: number;
  failedItemCount: number;
  skippedItemCount: number;
  duplicateCandidateCount: number;
};

const headerAliases: Record<Exclude<PackageBatchField, "ignore">, string[]> = {
  opportunity_name: ["opportunity", "opportunity name", "deal", "deal name", "name"],
  address: ["address", "street", "street address", "property address", "location", "full address"],
  unit_number: ["unit", "unit number", "apt", "suite"],
  city: ["city", "municipality", "town"],
  region: ["state", "region", "province"],
  postal_code: ["zip", "zipcode", "zip code", "postal", "postal code"],
  property_type: ["type", "property type", "asset type"],
  asking_price: ["price", "asking price", "list price", "listing price"],
  expected_price: ["offer", "offer price", "expected price", "target price"],
  intended_strategy: ["strategy", "intended strategy", "use"],
  source_url: ["url", "listing url", "source url", "link"],
  source: ["source", "lead source"],
  source_contact: ["contact", "agent", "seller", "source contact"],
  notes: ["notes", "comments", "description"],
  deal_group: ["group", "deal group", "package", "portfolio"],
};

export async function createPackageBatchFromFiles(files: File[], input: { batchType?: PackageBatchType; workspaceId?: string; now?: string } = {}): Promise<PackageBatchDraft> {
  validatePackageFiles(files);
  const now = input.now ?? new Date().toISOString();
  const batchId = `batch_${safeRandomId()}`;
  const sources: PackageBatchSource[] = [];
  const items: PackageBatchItem[] = [];
  let columnMapping: PackageColumnMapping = {};

  for (const file of files) {
    const bytes = await readFileBytes(file);
    const contentHash = stableHash(`${file.name}:${file.type}:${bytes.byteLength}:${bytesToTextSample(bytes)}`);
    const source: PackageBatchSource = {
      sourceId: `src_${stableHash(`${file.name}:${contentHash}`)}`,
      sourceType: detectSourceType(file.name, file.type),
      originalFilename: file.name,
      declaredMimeType: file.type || undefined,
      byteSize: bytes.byteLength,
      contentHash,
      preservedAsEvidence: true,
    };
    sources.push(source);

    if (source.sourceType === "csv" || source.sourceType === "xlsx") {
      const parsed = source.sourceType === "csv"
        ? parseCsv(bytesToText(bytes), source)
        : parseXlsx(bytes, source);
      if (!Object.keys(columnMapping).length) columnMapping = parsed.mapping;
      const rowItems = parsed.rows.flatMap((row, rowIndex) => buildItemFromMappedRow({
        batchId,
        source,
        row,
        itemIndex: items.length + rowIndex,
        mapping: parsed.mapping,
      }));
      items.push(...rowItems);
    } else {
      items.push(createPackageItem({
        batchId,
        itemIndex: items.length,
        source,
        status: "awaiting_mapping",
        rawValues: {},
        mappedValues: {},
        sourceAnchor: { filename: file.name },
        safeErrors: ["Assign this file to a Property or Deal before it can be processed."],
      }));
    }
  }

  if (items.length > PACKAGE_BATCH_LIMITS.maxItems) {
    throw new Error(`Package contains ${items.length} items. Limit is ${PACKAGE_BATCH_LIMITS.maxItems}.`);
  }

  const batch = detectPackageDuplicates({
    version: 1,
    id: batchId,
    workspaceId: input.workspaceId,
    batchType: input.batchType ?? inferBatchType(sources, items),
    status: items.some((item) => item.status === "awaiting_mapping") ? "awaiting_mapping" : "awaiting_review",
    sources,
    items,
    columnMapping,
    limits: PACKAGE_BATCH_LIMITS,
    createdAt: now,
    updatedAt: now,
  });

  return { ...batch, status: summarizePackageBatch(batch).failed === batch.items.length ? "failed" : batch.status };
}

async function readFileBytes(file: File): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === "function") {
    return new Uint8Array(await file.arrayBuffer());
  }

  if (typeof FileReader !== "undefined") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Package item could not be read. Select the file again and retry."));
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
          return;
        }
        if (typeof reader.result === "string") {
          resolve(new TextEncoder().encode(reader.result));
          return;
        }
        reject(new Error("Package item could not be read. Select the file again and retry."));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  if (typeof Blob !== "undefined" && file instanceof Blob) {
    return new Uint8Array(await new Response(file).arrayBuffer());
  }

  throw new Error("Package item could not be read. Select the file again and retry.");
}

export function applyPackageColumnMapping(batch: PackageBatchDraft, mapping: PackageColumnMapping): PackageBatchDraft {
  const spreadsheetSources = new Set(batch.sources.filter((source) => source.sourceType === "csv" || source.sourceType === "xlsx").map((source) => source.sourceId));
  const items = batch.items.map((item) => {
    if (!spreadsheetSources.has(item.sourceId)) return item;
    const rebuilt = buildItemFromMappedRow({
      batchId: batch.id,
      source: batch.sources.find((source) => source.sourceId === item.sourceId) ?? batch.sources[0],
      row: item.rawValues,
      itemIndex: item.itemIndex,
      mapping,
    })[0];
    return rebuilt ?? item;
  });
  return detectPackageDuplicates({ ...batch, columnMapping: mapping, items, status: "awaiting_review", updatedAt: new Date().toISOString() });
}

export function createManualDraftFromPackageItem(item: PackageBatchItem, base: Partial<ManualIntakeDraft> = {}): ManualIntakeDraft {
  if (item.status !== "awaiting_review" && item.status !== "duplicate_candidate") throw new Error("Review and resolve this package item before creating a Deal.");
  const values = item.mappedValues;
  if (!values.address?.trim()) throw new Error("Package item needs an address before it can become a Deal.");
  return {
    ...createManualIntakeDraft(),
    ...base,
    opportunityName: values.opportunity_name?.trim() || values.address.trim(),
    address: values.address.trim(),
    unitNumber: values.unit_number,
    city: values.city,
    region: values.region?.toUpperCase(),
    postalCode: values.postal_code,
    propertyType: values.property_type,
    askingPrice: values.asking_price,
    expectedPrice: values.expected_price,
    intendedStrategy: values.intended_strategy as ManualIntakeDraft["intendedStrategy"] ?? base.intendedStrategy,
    source: values.source ?? "Package intake",
    sourceUrl: values.source_url,
    sourceContact: values.source_contact,
    notes: values.notes,
    updatedAt: new Date().toISOString(),
  };
}

export function transitionPackageBatchItem(item: PackageBatchItem, action: "retry" | "skip" | "cancel" | "complete" | "fail"): PackageBatchItem {
  if (action === "skip") return { ...item, status: "skipped" };
  if (action === "cancel") return { ...item, status: "cancelled" };
  if (action === "retry") return { ...item, status: item.safeErrors.length ? "awaiting_mapping" : "queued", retryCount: item.retryCount + 1 };
  if (action === "complete") return { ...item, status: "complete", safeErrors: [] };
  return { ...item, status: "failed", safeErrors: [...item.safeErrors, "Item failed during package processing."].slice(-PACKAGE_BATCH_LIMITS.maxRetainedItemErrors) };
}

export function summarizePackageBatch(batch: PackageBatchDraft): PackageBatchSummary {
  const readyStatuses: PackageBatchItemStatus[] = ["awaiting_review", "duplicate_candidate"];
  const failedStatuses: PackageBatchItemStatus[] = ["invalid", "failed", "conflicted"];
  return {
    total: batch.items.length,
    ready: batch.items.filter((item) => readyStatuses.includes(item.status)).length,
    needsMapping: batch.items.filter((item) => item.status === "awaiting_mapping" || item.status === "pending").length,
    duplicates: batch.items.filter((item) => item.status === "duplicate_candidate").length,
    failed: batch.items.filter((item) => failedStatuses.includes(item.status)).length,
    skipped: batch.items.filter((item) => item.status === "skipped" || item.status === "cancelled").length,
    complete: batch.items.filter((item) => item.status === "complete").length,
    canPartiallyProcess: batch.items.some((item) => readyStatuses.includes(item.status)) && batch.items.some((item) => !readyStatuses.includes(item.status)),
  };
}

export function savePackageBatchDraft(scopeKey: string, batch: PackageBatchDraft, storage: Storage = localStorage) {
  storage.setItem(`${PACKAGE_BATCH_STORAGE_PREFIX}${scopeKey}`, JSON.stringify(normalizePackageBatchDraft(batch)));
  return batch;
}

export function loadPackageBatchDraft(scopeKey: string, storage: Storage = localStorage): PackageBatchDraft | null {
  const raw = storage.getItem(`${PACKAGE_BATCH_STORAGE_PREFIX}${scopeKey}`);
  if (!raw) return null;
  try {
    return normalizePackageBatchDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearPackageBatchDraft(scopeKey: string, storage: Storage = localStorage) {
  storage.removeItem(`${PACKAGE_BATCH_STORAGE_PREFIX}${scopeKey}`);
}

export async function recordPackageBatchReview(workspaceId: string, batch: PackageBatchDraft, idempotencyKey = `package-batch:${batch.id}`): Promise<PackageBatchRecordResult> {
  const rpc = supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
  const { data, error } = await rpc("record_intake_batch_review", {
    target_workspace_id: workspaceId,
    idempotency_key: idempotencyKey,
    batch_input: {
      batchType: batch.batchType,
      status: batch.status,
      sourceSummary: {
        sourceCount: batch.sources.length,
        sourceTypes: Array.from(new Set(batch.sources.map((source) => source.sourceType))),
      },
      limits: batch.limits,
    },
    item_inputs: batch.items.map((item) => ({
      itemIndex: item.itemIndex,
      sourceType: item.sourceType,
      status: item.status,
      originalFilename: batch.sources.find((source) => source.sourceId === item.sourceId)?.originalFilename,
      sourceUrl: item.mappedValues.source_url,
      contentHash: batch.sources.find((source) => source.sourceId === item.sourceId)?.contentHash,
      targetDealGroupKey: item.targetDealGroupKey,
      mappedValues: item.mappedValues,
      duplicateCandidates: item.duplicateCandidates,
      sourceAnchor: item.sourceAnchor,
      safeError: item.safeErrors[0],
      retryCount: item.retryCount,
    })),
  });
  if (error) throw error;
  return normalizeRecordResult(Array.isArray(data) ? data[0] : data);
}

export function normalizePackageBatchDraft(value: unknown): PackageBatchDraft {
  if (!isRecord(value) || value.version !== PACKAGE_BATCH_SCHEMA_VERSION) throw new Error("Package batch draft is malformed.");
  const id = stringValue(value.id);
  const createdAt = stringValue(value.createdAt);
  const updatedAt = stringValue(value.updatedAt);
  if (!id || !createdAt || !updatedAt) throw new Error("Package batch identity is missing.");
  const batchType = ["spreadsheet", "multi_file", "mixed_package", "multi_property_deal", "multi_deal_batch"].includes(value.batchType as string) ? value.batchType as PackageBatchType : "mixed_package";
  const status = packageBatchStatuses.includes(value.status as PackageBatchStatus) ? value.status as PackageBatchStatus : "draft";
  return {
    version: 1,
    id,
    workspaceId: stringValue(value.workspaceId),
    batchType,
    status,
    sources: Array.isArray(value.sources) ? value.sources.map(normalizeSource).filter(isSource) : [],
    items: Array.isArray(value.items) ? value.items.map((item) => normalizeItem(item, id)).filter(isItem) : [],
    columnMapping: normalizeMapping(value.columnMapping),
    limits: PACKAGE_BATCH_LIMITS,
    createdAt,
    updatedAt,
  };
}

function normalizeRecordResult(value: unknown): PackageBatchRecordResult {
  if (!isRecord(value)) throw new Error("BRIX could not confirm the package batch record.");
  const batchId = stringValue(value.batch_id);
  const batchStatus = packageBatchStatuses.includes(value.batch_status as PackageBatchStatus) ? value.batch_status as PackageBatchStatus : undefined;
  if (!batchId || !batchStatus) throw new Error("BRIX could not confirm the package batch status.");
  return {
    batchId,
    batchStatus,
    itemCount: numberValue(value.item_count) ?? 0,
    readyItemCount: numberValue(value.ready_item_count) ?? 0,
    failedItemCount: numberValue(value.failed_item_count) ?? 0,
    skippedItemCount: numberValue(value.skipped_item_count) ?? 0,
    duplicateCandidateCount: numberValue(value.duplicate_candidate_count) ?? 0,
  };
}

function validatePackageFiles(files: File[]) {
  if (!files.length) throw new Error("Choose at least one package file.");
  if (files.length > PACKAGE_BATCH_LIMITS.maxFiles) throw new Error(`Choose ${PACKAGE_BATCH_LIMITS.maxFiles} files or fewer.`);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > PACKAGE_BATCH_LIMITS.maxTotalPackageBytes) throw new Error("Package is larger than the 25 MB limit.");
  for (const file of files) {
    if (!file.name.trim()) throw new Error("Every package file needs a usable filename.");
    if (file.size === 0) throw new Error(`${file.name} is empty.`);
    if (file.size > PACKAGE_BATCH_LIMITS.maxFileBytes) throw new Error(`${file.name} is larger than 5 MB.`);
    const extension = extensionFor(file.name);
    if (["exe", "js", "mjs", "cjs", "html", "htm", "svg", "zip", "rar", "7z", "mp4", "mov", "mp3", "wav", "heic", "heif", "xlsm", "docm"].includes(extension)) {
      throw new Error(`${file.name} is not supported for package intake.`);
    }
  }
}

function parseCsv(text: string, source: PackageBatchSource) {
  const rows = parseDelimitedRows(text).slice(0, PACKAGE_BATCH_LIMITS.maxCsvRows + 1);
  if (rows.length < 2) throw new Error(`${source.originalFilename ?? "CSV"} needs headers and at least one row.`);
  const headers = rows[0].map((header, index) => header.trim() || `Column ${index + 1}`);
  const mapping = suggestColumnMapping(headers);
  return {
    mapping,
    rows: rows.slice(1).map((row) => rowToRecord(headers, row)),
  };
}

function parseXlsx(bytes: Uint8Array, source: PackageBatchSource) {
  const workbook = XLSX.read(bytes, { type: "array" });
  const sheetNames = workbook.SheetNames.slice(0, PACKAGE_BATCH_LIMITS.maxXlsxSheets);
  const allRows: Record<string, string>[] = [];
  let mapping: PackageColumnMapping = {};
  for (const sheetName of sheetNames) {
    const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[sheetName], { header: 1, blankrows: false })
      .slice(0, PACKAGE_BATCH_LIMITS.maxXlsxRowsPerSheet + 1)
      .map((row) => row.slice(0, PACKAGE_BATCH_LIMITS.maxXlsxCellsPerRow).map((cell) => cell == null ? "" : String(cell).trim()));
    if (rows.length < 2) continue;
    const headers = rows[0].map((header, index) => header.trim() || `${sheetName} Column ${index + 1}`);
    if (!Object.keys(mapping).length) mapping = suggestColumnMapping(headers);
    rows.slice(1).forEach((row, index) => allRows.push({ ...rowToRecord(headers, row), "__sheet": sheetName, "__row": String(index + 2) }));
  }
  if (!allRows.length) throw new Error(`${source.originalFilename ?? "XLSX"} needs headers and at least one row.`);
  return { mapping, rows: allRows };
}

function buildItemFromMappedRow(input: { batchId: string; source: PackageBatchSource; row: Record<string, string>; itemIndex: number; mapping: PackageColumnMapping }): PackageBatchItem[] {
  const mappedValues: PackageBatchItem["mappedValues"] = {};
  Object.entries(input.mapping).forEach(([header, field]) => {
    if (field === "ignore") return;
    const value = input.row[header]?.trim();
    if (value) mappedValues[field] = value.slice(0, PACKAGE_BATCH_LIMITS.maxExtractedCharactersPerItem);
  });
  const safeErrors: string[] = [];
  if (!mappedValues.address) safeErrors.push("Address is required before this row can create or link a Property.");
  const item = createPackageItem({
    batchId: input.batchId,
    itemIndex: input.itemIndex,
    source: input.source,
    status: safeErrors.length ? "awaiting_mapping" : "awaiting_review",
    rawValues: input.row,
    mappedValues,
    targetDealGroupKey: mappedValues.deal_group,
    sourceAnchor: {
      filename: input.source.originalFilename ?? "spreadsheet",
      sheet: input.row.__sheet ?? null,
      row: Number(input.row.__row ?? input.itemIndex + 2),
    },
    safeErrors,
  });
  return [item];
}

function createPackageItem(input: {
  batchId: string;
  itemIndex: number;
  source: PackageBatchSource;
  status: PackageBatchItemStatus;
  rawValues: Record<string, string>;
  mappedValues: PackageBatchItem["mappedValues"];
  sourceAnchor: PackageBatchItem["sourceAnchor"];
  targetDealGroupKey?: string;
  safeErrors?: string[];
}): PackageBatchItem {
  return {
    id: `item_${stableHash(`${input.batchId}:${input.source.sourceId}:${input.itemIndex}:${stableSerialize(input.rawValues)}`)}`,
    batchId: input.batchId,
    itemIndex: input.itemIndex,
    sourceId: input.source.sourceId,
    sourceType: input.source.sourceType,
    status: input.status,
    rawValues: input.rawValues,
    mappedValues: input.mappedValues,
    sourceAnchor: input.sourceAnchor,
    targetDealGroupKey: input.targetDealGroupKey,
    duplicateCandidates: [],
    safeErrors: (input.safeErrors ?? []).slice(-PACKAGE_BATCH_LIMITS.maxRetainedItemErrors),
    retryCount: 0,
  };
}

function detectPackageDuplicates(batch: PackageBatchDraft): PackageBatchDraft {
  const priorCandidates: ReturnType<typeof packageBatchDuplicateCandidate>[] = [];
  const items = batch.items.map((item) => {
    const candidateInput = packageBatchDuplicateCandidate({
      workspaceId: batch.workspaceId ?? `local:${batch.id}`,
      batchId: batch.id,
      itemId: item.id,
      address: item.mappedValues.address,
      sourceUrl: item.mappedValues.source_url,
      contentHash: batch.sources.find((source) => source.sourceId === item.sourceId)?.contentHash,
    });
    const request = createDuplicateDetectionRequest({
      workspaceId: candidateInput.identity.workspaceId,
      subjectType: "batch_item",
      identity: candidateInput.identity,
      candidateLimit: 1,
    });
    const [match] = findDuplicateCandidates(request, priorCandidates);
    priorCandidates.push(candidateInput);
    if (!match) {
      return item;
    }
    return {
      ...item,
      status: "duplicate_candidate" as const,
      duplicateCandidates: [{
        itemId: match.identity.batchItemId,
        reason: match.explanation[0] ?? "This item may already exist in the package.",
        displayAddress: match.identity.displayName ?? match.identity.normalizedAddress ?? match.identity.sourceUrl ?? "Earlier package item",
      }],
    };
  });
  const summary = summarizePackageBatch({ ...batch, items });
  return {
    ...batch,
    items,
    status: summary.failed > 0 && summary.ready > 0 ? "partially_complete" : batch.status,
  };
}

function suggestColumnMapping(headers: string[]): PackageColumnMapping {
  const used = new Set<PackageBatchField>();
  return Object.fromEntries(headers.map((header) => {
    const normalized = normalizeHeader(header);
    const field = Object.entries(headerAliases).find(([, aliases]) => aliases.some((alias) => normalizeHeader(alias) === normalized))?.[0] as PackageBatchField | undefined;
    if (!field || used.has(field)) return [header, "ignore"];
    used.add(field);
    return [header, field];
  }));
}

function parseDelimitedRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function rowToRecord(headers: string[], row: string[]) {
  return Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() ?? ""]));
}

function detectSourceType(fileName: string, mimeType?: string): PackageBatchSourceType {
  const extension = extensionFor(fileName);
  const mime = mimeType?.toLowerCase() ?? "";
  if (extension === "csv" || mime === "text/csv") return "csv";
  if (extension === "xlsx" || mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return "xlsx";
  if (extension === "eml" || extension === "msg" || mime === "message/rfc822") return "email";
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(extension)) return "image";
  if (["pdf", "docx", "txt"].includes(extension)) return "document";
  return "file";
}

function inferBatchType(sources: PackageBatchSource[], items: PackageBatchItem[]): PackageBatchType {
  if (sources.length === 1 && ["csv", "xlsx"].includes(sources[0].sourceType)) return "spreadsheet";
  if (sources.length > 1 && items.every((item) => item.targetDealGroupKey)) return "multi_property_deal";
  if (items.length > 1 && items.every((item) => item.status === "awaiting_review" || item.status === "duplicate_candidate")) return "multi_deal_batch";
  if (sources.length > 1) return "multi_file";
  return "mixed_package";
}

function normalizeSource(value: unknown): PackageBatchSource | null {
  if (!isRecord(value)) return null;
  const sourceId = stringValue(value.sourceId);
  const contentHash = stringValue(value.contentHash);
  if (!sourceId || !contentHash) return null;
  return {
    sourceId,
    sourceType: ["csv", "xlsx", "file", "image", "document", "listing_url", "email", "manual_row", "unknown"].includes(value.sourceType as string) ? value.sourceType as PackageBatchSourceType : "unknown",
    originalFilename: stringValue(value.originalFilename),
    declaredMimeType: stringValue(value.declaredMimeType),
    byteSize: numberValue(value.byteSize),
    contentHash,
    preservedAsEvidence: Boolean(value.preservedAsEvidence),
    originalText: stringValue(value.originalText),
  };
}

function normalizeItem(value: unknown, batchId: string): PackageBatchItem | null {
  if (!isRecord(value)) return null;
  const id = stringValue(value.id);
  const sourceId = stringValue(value.sourceId);
  if (!id || !sourceId) return null;
  return {
    id,
    batchId,
    itemIndex: numberValue(value.itemIndex) ?? 0,
    sourceId,
    sourceType: ["csv", "xlsx", "file", "image", "document", "listing_url", "email", "manual_row", "unknown"].includes(value.sourceType as string) ? value.sourceType as PackageBatchSourceType : "unknown",
    status: packageBatchItemStatuses.includes(value.status as PackageBatchItemStatus) ? value.status as PackageBatchItemStatus : "pending",
    mappedValues: normalizeStringRecord(value.mappedValues),
    rawValues: normalizeStringRecord(value.rawValues),
    sourceAnchor: normalizePrimitiveRecord(value.sourceAnchor),
    targetDealGroupKey: stringValue(value.targetDealGroupKey),
    duplicateCandidates: Array.isArray(value.duplicateCandidates) ? value.duplicateCandidates.map(normalizeDuplicate).filter(isDuplicate) : [],
    safeErrors: stringArray(value.safeErrors).slice(-PACKAGE_BATCH_LIMITS.maxRetainedItemErrors),
    retryCount: numberValue(value.retryCount) ?? 0,
  };
}

function normalizeDuplicate(value: unknown): PackageBatchItem["duplicateCandidates"][number] | null {
  if (!isRecord(value)) return null;
  const reason = stringValue(value.reason);
  const displayAddress = stringValue(value.displayAddress);
  if (!reason || !displayAddress) return null;
  return {
    itemId: stringValue(value.itemId),
    propertyId: stringValue(value.propertyId),
    reason,
    displayAddress,
  };
}

function normalizeMapping(value: unknown): PackageColumnMapping {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, field]) => [key, isPackageField(field) ? field : "ignore"]));
}

function normalizeStringRecord(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function normalizePrimitiveRecord(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string | number | boolean | null] => entry[1] === null || ["string", "number", "boolean"].includes(typeof entry[1])));
}

function isPackageField(value: unknown): value is PackageBatchField {
  return ["ignore", ...Object.keys(headerAliases)].includes(value as string);
}

function isSource(value: PackageBatchSource | null): value is PackageBatchSource {
  return value !== null;
}

function isItem(value: PackageBatchItem | null): value is PackageBatchItem {
  return value !== null;
}

function isDuplicate(value: ReturnType<typeof normalizeDuplicate>): value is PackageBatchItem["duplicateCandidates"][number] {
  return value !== null;
}

function extensionFor(fileName: string) {
  return fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
}

function bytesToText(bytes: Uint8Array) {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes).slice(0, PACKAGE_BATCH_LIMITS.maxExtractedCharactersPerItem * PACKAGE_BATCH_LIMITS.maxCsvRows);
}

function bytesToTextSample(bytes: Uint8Array) {
  return bytesToText(bytes.slice(0, Math.min(bytes.length, 4096)));
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.entries(value as UnknownRecord).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`).join(",")}}`;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function safeRandomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown) {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
