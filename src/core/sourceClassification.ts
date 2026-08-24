export const SOURCE_CLASSIFICATION_VERSION = "source-classification-v1";

export const CANONICAL_SOURCE_CLASSES = [
  "manual",
  "listing_url",
  "mls_listing",
  "county_record",
  "tax_record",
  "assessment",
  "survey",
  "plat",
  "legal_description",
  "purchase_contract",
  "counter_offer",
  "addendum",
  "inspection_report",
  "roof_report",
  "foundation_report",
  "environmental_report",
  "hoa_documents",
  "ccr",
  "budget",
  "reserve_study",
  "disclosure",
  "seller_disclosure",
  "lead_paint",
  "well",
  "septic",
  "insurance_quote",
  "policy",
  "loss_run",
  "appraisal",
  "rent_roll",
  "lease",
  "financial_statement",
  "operating_statement",
  "utility_bill",
  "permit",
  "photo",
  "satellite",
  "street_view",
  "map",
  "title_commitment",
  "closing_statement",
  "settlement_statement",
  "mortgage_estimate",
  "loan_documents",
  "email",
  "attachment",
  "spreadsheet",
  "unknown",
  "future_reserved",
] as const;

export type CanonicalSourceClass = typeof CANONICAL_SOURCE_CLASSES[number];
export type SourceClassificationConfidenceTier = "exact" | "strong" | "possible" | "unknown";
export type SourceClassificationMethod = "source_type" | "mime_type" | "extension" | "filename_keyword" | "metadata" | "future_placeholder" | "fallback";
export type SourceClassificationReviewStatus = "system_classified" | "needs_review" | "confirmed" | "changed";
export type SourceProcessingState = "eligible" | "review_required" | "deferred" | "not_eligible";

export type SourceExtractionEngine =
  | "listing_parser"
  | "ocr"
  | "vision"
  | "condition_engine"
  | "repair_engine"
  | "damage_observation"
  | "contractiq"
  | "timeline_extraction"
  | "clause_engine"
  | "question_generator"
  | "email_parser"
  | "attachment_routing"
  | "spreadsheet_parser"
  | "map_context"
  | "evidence_preservation"
  | "manual_review";

export type SourceDownstreamModule =
  | "intake"
  | "evidence"
  | "dealiq"
  | "contractiq"
  | "governanceiq"
  | "inspectioniq"
  | "photoiq"
  | "financeiq"
  | "insuranceiq"
  | "taxiq"
  | "marketiq"
  | "reportiq"
  | "pipelineiq";

export type SourceProcessingEligibility = {
  state: SourceProcessingState;
  allowedExtractionEngines: SourceExtractionEngine[];
  requiredReview: boolean;
  supportedDownstreamModules: SourceDownstreamModule[];
};

export type SourceClassificationResult = {
  canonicalClass: CanonicalSourceClass;
  canonicalSubtype: string;
  confidenceTier: SourceClassificationConfidenceTier;
  classificationVersion: typeof SOURCE_CLASSIFICATION_VERSION;
  classificationMethod: SourceClassificationMethod;
  classificationEvidence: string[];
  reviewStatus: SourceClassificationReviewStatus;
  processingEligibility: SourceProcessingEligibility;
  allowedExtractionEngines: SourceExtractionEngine[];
  requiredReview: boolean;
  supportedDownstreamModules: SourceDownstreamModule[];
};

export type SourceClassificationInput = {
  sourceType?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  originalFilename?: string | null;
  declaredMimeType?: string | null;
  detectedMimeType?: string | null;
  evidenceType?: string | null;
  isAttachment?: boolean | null;
  providerKind?: string | null;
  metadata?: Record<string, unknown> | null;
};

type RegistryEntry = {
  canonicalSubtype: string;
  eligibility: SourceProcessingEligibility;
};

const noEngine: SourceExtractionEngine[] = [];

const registry: Record<CanonicalSourceClass, RegistryEntry> = {
  manual: entry("user_entered", "review_required", ["manual_review"], ["intake", "dealiq"]),
  listing_url: entry("public_listing_url", "eligible", ["listing_parser", "manual_review"], ["intake", "dealiq", "evidence"]),
  mls_listing: entry("authorized_mls_listing_placeholder", "deferred", noEngine, ["intake"], true),
  county_record: entry("county_record", "eligible", ["ocr", "manual_review"], ["intake", "evidence", "taxiq"]),
  tax_record: entry("tax_record", "eligible", ["ocr", "manual_review"], ["intake", "evidence", "taxiq"]),
  assessment: entry("assessment_record", "eligible", ["ocr", "manual_review"], ["intake", "evidence", "taxiq"]),
  survey: entry("survey", "eligible", ["ocr"], ["intake", "evidence", "marketiq"]),
  plat: entry("plat", "eligible", ["ocr", "map_context"], ["intake", "evidence", "marketiq"]),
  legal_description: entry("legal_description", "eligible", ["ocr"], ["intake", "evidence", "contractiq"]),
  purchase_contract: entry("purchase_contract", "eligible", ["contractiq", "timeline_extraction", "clause_engine", "question_generator"], ["intake", "contractiq", "pipelineiq"]),
  counter_offer: entry("counter_offer", "eligible", ["contractiq", "timeline_extraction", "clause_engine", "question_generator"], ["intake", "contractiq", "pipelineiq"]),
  addendum: entry("addendum", "eligible", ["contractiq", "timeline_extraction", "clause_engine", "question_generator"], ["intake", "contractiq", "pipelineiq"]),
  inspection_report: entry("general_inspection", "eligible", ["ocr", "condition_engine", "repair_engine"], ["intake", "evidence", "inspectioniq", "dealiq"]),
  roof_report: entry("roof_report", "eligible", ["ocr", "condition_engine", "repair_engine"], ["intake", "evidence", "inspectioniq", "dealiq"]),
  foundation_report: entry("foundation_report", "eligible", ["ocr", "condition_engine", "repair_engine"], ["intake", "evidence", "inspectioniq", "dealiq"]),
  environmental_report: entry("environmental_report", "eligible", ["ocr", "condition_engine"], ["intake", "evidence", "inspectioniq", "dealiq"]),
  hoa_documents: entry("hoa_documents", "eligible", ["ocr", "question_generator"], ["intake", "evidence", "governanceiq"]),
  ccr: entry("covenants_conditions_restrictions", "eligible", ["ocr", "question_generator"], ["intake", "evidence", "governanceiq"]),
  budget: entry("budget", "eligible", ["ocr", "spreadsheet_parser"], ["intake", "financeiq", "governanceiq"]),
  reserve_study: entry("reserve_study", "eligible", ["ocr"], ["intake", "financeiq", "governanceiq", "reportiq"]),
  disclosure: entry("disclosure", "eligible", ["ocr", "question_generator"], ["intake", "evidence", "dealiq"]),
  seller_disclosure: entry("seller_disclosure", "eligible", ["ocr", "question_generator"], ["intake", "evidence", "dealiq"]),
  lead_paint: entry("lead_paint_disclosure", "eligible", ["ocr"], ["intake", "evidence", "dealiq"]),
  well: entry("well_disclosure", "eligible", ["ocr"], ["intake", "evidence", "dealiq"]),
  septic: entry("septic_disclosure", "eligible", ["ocr"], ["intake", "evidence", "dealiq"]),
  insurance_quote: entry("insurance_quote", "eligible", ["ocr"], ["intake", "insuranceiq", "dealiq"]),
  policy: entry("insurance_policy", "eligible", ["ocr"], ["intake", "insuranceiq", "dealiq"]),
  loss_run: entry("loss_run", "eligible", ["ocr"], ["intake", "insuranceiq"]),
  appraisal: entry("appraisal", "eligible", ["ocr"], ["intake", "evidence", "dealiq"]),
  rent_roll: entry("rent_roll", "eligible", ["ocr", "spreadsheet_parser"], ["intake", "financeiq", "dealiq"]),
  lease: entry("lease", "eligible", ["ocr", "contractiq", "timeline_extraction", "clause_engine"], ["intake", "contractiq", "financeiq"]),
  financial_statement: entry("financial_statement", "eligible", ["ocr", "spreadsheet_parser"], ["intake", "financeiq", "dealiq"]),
  operating_statement: entry("operating_statement", "eligible", ["ocr", "spreadsheet_parser"], ["intake", "financeiq", "dealiq"]),
  utility_bill: entry("utility_bill", "eligible", ["ocr"], ["intake", "financeiq"]),
  permit: entry("permit", "eligible", ["ocr"], ["intake", "evidence", "dealiq"]),
  photo: entry("uploaded_photo", "eligible", ["vision", "condition_engine", "damage_observation"], ["intake", "evidence", "photoiq", "dealiq"]),
  satellite: entry("satellite_image", "eligible", ["vision", "map_context"], ["intake", "evidence", "marketiq"]),
  street_view: entry("street_view_image", "eligible", ["vision", "map_context"], ["intake", "evidence", "marketiq"]),
  map: entry("map", "eligible", ["map_context"], ["intake", "evidence", "marketiq"]),
  title_commitment: entry("title_commitment", "eligible", ["ocr", "question_generator"], ["intake", "contractiq", "pipelineiq"]),
  closing_statement: entry("closing_statement", "eligible", ["ocr"], ["intake", "financeiq", "pipelineiq"]),
  settlement_statement: entry("settlement_statement", "eligible", ["ocr"], ["intake", "financeiq", "pipelineiq"]),
  mortgage_estimate: entry("mortgage_estimate", "eligible", ["ocr"], ["intake", "financeiq", "dealiq"]),
  loan_documents: entry("loan_documents", "eligible", ["ocr", "contractiq"], ["intake", "financeiq", "contractiq"]),
  email: entry("email_message", "eligible", ["email_parser", "attachment_routing"], ["intake", "evidence", "pipelineiq"]),
  attachment: entry("email_attachment", "review_required", ["attachment_routing", "manual_review"], ["intake", "evidence"]),
  spreadsheet: entry("spreadsheet", "eligible", ["spreadsheet_parser"], ["intake", "financeiq", "dealiq"]),
  unknown: entry("unclassified", "review_required", ["manual_review"], ["intake", "evidence"], true),
  future_reserved: entry("future_reserved", "deferred", noEngine, ["intake"], true),
};

const keywordRules: Array<{ pattern: RegExp; sourceClass: CanonicalSourceClass; subtype?: string }> = [
  { pattern: /\b(mls)\b/i, sourceClass: "mls_listing" },
  { pattern: /\b(county record|recorder|deed|parcel record)\b/i, sourceClass: "county_record" },
  { pattern: /\b(tax bill|property tax|tax record|tax history)\b/i, sourceClass: "tax_record" },
  { pattern: /\b(assessment|assessor)\b/i, sourceClass: "assessment" },
  { pattern: /\b(survey)\b/i, sourceClass: "survey" },
  { pattern: /\b(plat)\b/i, sourceClass: "plat" },
  { pattern: /\b(legal description)\b/i, sourceClass: "legal_description" },
  { pattern: /\b(purchase contract|purchase agreement|sale contract|sales contract)\b/i, sourceClass: "purchase_contract" },
  { pattern: /\b(counter offer|counteroffer)\b/i, sourceClass: "counter_offer" },
  { pattern: /\b(addendum|amendment)\b/i, sourceClass: "addendum" },
  { pattern: /\b(roof report|roof inspection)\b/i, sourceClass: "roof_report" },
  { pattern: /\b(foundation report|foundation inspection|structural report)\b/i, sourceClass: "foundation_report" },
  { pattern: /\b(inspection report|home inspection)\b/i, sourceClass: "inspection_report" },
  { pattern: /\b(environmental|phase i|phase 1)\b/i, sourceClass: "environmental_report" },
  { pattern: /\b(hoa|homeowners association)\b/i, sourceClass: "hoa_documents" },
  { pattern: /\b(cc&r|ccrs|covenants|conditions restrictions)\b/i, sourceClass: "ccr" },
  { pattern: /\b(budget)\b/i, sourceClass: "budget" },
  { pattern: /\b(reserve study|reserves)\b/i, sourceClass: "reserve_study" },
  { pattern: /\b(seller disclosure)\b/i, sourceClass: "seller_disclosure" },
  { pattern: /\b(disclosure)\b/i, sourceClass: "disclosure" },
  { pattern: /\b(lead paint|lead-based paint)\b/i, sourceClass: "lead_paint" },
  { pattern: /\b(well)\b/i, sourceClass: "well" },
  { pattern: /\b(septic)\b/i, sourceClass: "septic" },
  { pattern: /\b(insurance quote|premium quote)\b/i, sourceClass: "insurance_quote" },
  { pattern: /\b(policy|insurance policy)\b/i, sourceClass: "policy" },
  { pattern: /\b(loss run|claims history)\b/i, sourceClass: "loss_run" },
  { pattern: /\b(appraisal)\b/i, sourceClass: "appraisal" },
  { pattern: /\b(rent roll)\b/i, sourceClass: "rent_roll" },
  { pattern: /\b(lease)\b/i, sourceClass: "lease" },
  { pattern: /\b(financial statement|p&l|profit and loss)\b/i, sourceClass: "financial_statement" },
  { pattern: /\b(operating statement|trailing twelve|t12|income statement)\b/i, sourceClass: "operating_statement" },
  { pattern: /\b(utility bill|electric bill|gas bill|water bill)\b/i, sourceClass: "utility_bill" },
  { pattern: /\b(permit)\b/i, sourceClass: "permit" },
  { pattern: /\b(satellite)\b/i, sourceClass: "satellite" },
  { pattern: /\b(street view|streetview)\b/i, sourceClass: "street_view" },
  { pattern: /\b(map|aerial)\b/i, sourceClass: "map" },
  { pattern: /\b(title commitment|title report)\b/i, sourceClass: "title_commitment" },
  { pattern: /\b(closing statement)\b/i, sourceClass: "closing_statement" },
  { pattern: /\b(settlement statement|hud-1|alta)\b/i, sourceClass: "settlement_statement" },
  { pattern: /\b(mortgage estimate|loan estimate)\b/i, sourceClass: "mortgage_estimate" },
  { pattern: /\b(loan document|note|mortgage document)\b/i, sourceClass: "loan_documents" },
];

const spreadsheetMimes = new Set([
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const imageMimes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/tiff", "image/bmp"]);

export function sourceClassificationRegistry() {
  return Object.freeze({ ...registry });
}

export function classifySource(input: SourceClassificationInput): SourceClassificationResult {
  const facts = normalizeInput(input);
  if (facts.sourceType === "future_reserved") return result("future_reserved", "future_placeholder", ["source_type:future_reserved"]);
  if (facts.sourceType === "mls_listing" || facts.providerKind === "mls") return result("mls_listing", "future_placeholder", ["provider_kind:mls"]);
  if (facts.sourceType === "manual" || facts.sourceType === "manual_row") return result("manual", "source_type", [`source_type:${facts.sourceType}`]);
  if (facts.sourceType === "listing_url" || hasUrl(facts)) return result("listing_url", "source_type", ["source_type:listing_url"]);
  if (facts.sourceType === "email" || facts.mimeType === "message/rfc822" || facts.extension === "eml" || facts.extension === "msg") return result("email", "source_type", ["source_type:email"]);
  if (facts.isAttachment) {
    const specific = classifyByFilenameOrName(facts);
    if (specific.canonicalClass !== "unknown") return specific;
    return result("attachment", "metadata", ["metadata:is_attachment"]);
  }
  if (facts.sourceType === "image" || facts.evidenceType === "image" || imageMimes.has(facts.mimeType)) return result("photo", facts.sourceType === "image" ? "source_type" : "mime_type", [`${facts.sourceType === "image" ? "source_type" : "mime_type"}:${facts.sourceType === "image" ? "image" : facts.mimeType}`]);
  if (facts.sourceType === "csv" || facts.sourceType === "xlsx" || spreadsheetMimes.has(facts.mimeType) || ["csv", "xls", "xlsx"].includes(facts.extension)) return result("spreadsheet", facts.sourceType === "csv" || facts.sourceType === "xlsx" ? "source_type" : "extension", [`${facts.sourceType === "csv" || facts.sourceType === "xlsx" ? "source_type" : "extension"}:${facts.sourceType || facts.extension}`]);

  const specific = classifyByFilenameOrName(facts);
  if (specific.canonicalClass !== "unknown") return specific;

  return result("unknown", "fallback", ["fallback:unknown_source"]);
}

export function classificationForManualDraft(input: { source?: string; sourceUrl?: string }) {
  return classifySource({ sourceType: input.sourceUrl ? "listing_url" : "manual", sourceName: input.source, sourceUrl: input.sourceUrl });
}

export function classificationForListingUrl(url: string) {
  return classifySource({ sourceType: "listing_url", sourceUrl: url });
}

export function classificationForEvidenceFile(input: { originalFilename: string; declaredMimeType?: string; detectedMimeType?: string; evidenceType?: string }) {
  return classifySource({ sourceType: input.evidenceType ?? "file", originalFilename: input.originalFilename, declaredMimeType: input.declaredMimeType, detectedMimeType: input.detectedMimeType, evidenceType: input.evidenceType });
}

export function classificationForEmailSource(input: { subject?: string; originalFilename?: string; declaredMimeType?: string }) {
  return classifySource({ sourceType: "email", sourceName: input.subject, originalFilename: input.originalFilename, declaredMimeType: input.declaredMimeType });
}

export function classificationForEmailAttachment(input: { originalFilename: string; detectedMimeType?: string }) {
  return classifySource({ sourceType: "attachment", isAttachment: true, originalFilename: input.originalFilename, detectedMimeType: input.detectedMimeType });
}

export function classificationForPackageSource(input: { sourceType: string; originalFilename?: string; declaredMimeType?: string; sourceUrl?: string }) {
  return classifySource({ sourceType: input.sourceType, originalFilename: input.originalFilename, declaredMimeType: input.declaredMimeType, sourceUrl: input.sourceUrl });
}

export function serializeSourceClassification(classification: SourceClassificationResult) {
  return {
    canonicalClass: classification.canonicalClass,
    canonicalSubtype: classification.canonicalSubtype,
    confidenceTier: classification.confidenceTier,
    classificationVersion: classification.classificationVersion,
    classificationMethod: classification.classificationMethod,
    classificationEvidence: classification.classificationEvidence,
    reviewStatus: classification.reviewStatus,
    processingEligibility: classification.processingEligibility,
    allowedExtractionEngines: classification.allowedExtractionEngines,
    requiredReview: classification.requiredReview,
    supportedDownstreamModules: classification.supportedDownstreamModules,
  };
}

function classifyByFilenameOrName(facts: ReturnType<typeof normalizeInput>): SourceClassificationResult {
  const text = [facts.sourceName, facts.originalFilename, facts.sourceUrl].filter(Boolean).join(" ");
  for (const rule of keywordRules) {
    if (rule.pattern.test(text)) {
      return result(rule.sourceClass, "filename_keyword", [`keyword:${rule.pattern.source}`], rule.subtype);
    }
  }
  if (facts.extension === "pdf" || facts.sourceType === "document") return result("unknown", "fallback", ["fallback:generic_document"]);
  return result("unknown", "fallback", ["fallback:no_specific_match"]);
}

function result(sourceClass: CanonicalSourceClass, method: SourceClassificationMethod, evidence: string[], subtype?: string): SourceClassificationResult {
  const registryEntry = registry[sourceClass];
  const confidenceTier = confidenceFor(sourceClass, method);
  const requiredReview = registryEntry.eligibility.requiredReview || confidenceTier === "possible" || confidenceTier === "unknown";
  const processingEligibility = {
    ...registryEntry.eligibility,
    requiredReview,
  };
  return {
    canonicalClass: sourceClass,
    canonicalSubtype: subtype ?? registryEntry.canonicalSubtype,
    confidenceTier,
    classificationVersion: SOURCE_CLASSIFICATION_VERSION,
    classificationMethod: method,
    classificationEvidence: evidence.slice(0, 8),
    reviewStatus: requiredReview ? "needs_review" : "system_classified",
    processingEligibility,
    allowedExtractionEngines: processingEligibility.allowedExtractionEngines,
    requiredReview,
    supportedDownstreamModules: processingEligibility.supportedDownstreamModules,
  };
}

function confidenceFor(sourceClass: CanonicalSourceClass, method: SourceClassificationMethod): SourceClassificationConfidenceTier {
  if (sourceClass === "unknown") return "unknown";
  if (sourceClass === "future_reserved" || sourceClass === "mls_listing") return "possible";
  if (method === "source_type" || method === "metadata" || method === "future_placeholder") return "exact";
  if (method === "mime_type" || method === "extension" || method === "filename_keyword") return "strong";
  return "possible";
}

function normalizeInput(input: SourceClassificationInput) {
  const declaredMimeType = lower(input.declaredMimeType);
  const detectedMimeType = lower(input.detectedMimeType);
  const originalFilename = trim(input.originalFilename);
  return {
    sourceType: normalizeToken(input.sourceType),
    sourceName: trim(input.sourceName),
    sourceUrl: trim(input.sourceUrl),
    originalFilename,
    mimeType: detectedMimeType || declaredMimeType,
    evidenceType: normalizeToken(input.evidenceType),
    isAttachment: Boolean(input.isAttachment),
    providerKind: normalizeToken(input.providerKind ?? tokenFromMetadata(input.metadata, "providerKind")),
    extension: extensionFor(originalFilename),
  };
}

function entry(
  canonicalSubtype: string,
  state: SourceProcessingState,
  allowedExtractionEngines: SourceExtractionEngine[],
  supportedDownstreamModules: SourceDownstreamModule[],
  requiredReview = state === "review_required" || state === "deferred",
): RegistryEntry {
  return {
    canonicalSubtype,
    eligibility: {
      state,
      allowedExtractionEngines,
      requiredReview,
      supportedDownstreamModules,
    },
  };
}

function hasUrl(facts: ReturnType<typeof normalizeInput>) {
  return Boolean(facts.sourceUrl && /^https?:\/\//i.test(facts.sourceUrl));
}

function extensionFor(filename?: string) {
  return filename?.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
}

function trim(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function lower(value: unknown) {
  return trim(value)?.toLowerCase() ?? "";
}

function normalizeToken(value: unknown) {
  return lower(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function tokenFromMetadata(metadata: SourceClassificationInput["metadata"], key: string) {
  if (!metadata || typeof metadata !== "object") return undefined;
  const value = metadata[key];
  return typeof value === "string" ? value : undefined;
}
