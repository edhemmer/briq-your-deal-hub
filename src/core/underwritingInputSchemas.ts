import {
  FORMULA_REGISTRY_VERSION,
  resolveFormulaDefinition,
  type FormulaId,
  type FormulaInputClassification,
  type FormulaPeriod,
  type FormulaPrecisionRule,
  type FormulaUnit,
} from "./formulaRegistry";
import type { CanonicalSourceClass } from "./sourceClassification";

export const UNDERWRITING_INPUT_REGISTRY_VERSION = "underwriting-input-registry-v1";
export const PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION = "property-underwriting-schema-registry-v1";

const EFFECTIVE_DATE = "2026-07-29";
const MONEY_PRECISION: FormulaPrecisionRule = { scale: 2, roundingMode: "half_away_from_zero" };
const RATIO_PRECISION: FormulaPrecisionRule = { scale: 4, roundingMode: "half_away_from_zero" };
const COUNT_PRECISION: FormulaPrecisionRule = { scale: 0, roundingMode: "half_away_from_zero" };

export type UnderwritingPropertyProfile =
  | "single_family"
  | "condominium"
  | "townhouse"
  | "two_to_four_unit"
  | "multifamily"
  | "mixed_use"
  | "office"
  | "retail"
  | "industrial"
  | "warehouse"
  | "self_storage"
  | "hospitality"
  | "mobile_home_park"
  | "land"
  | "special_purpose"
  | "other_residential"
  | "other_commercial"
  | "unknown";

export type UnderwritingMode =
  | "rental"
  | "owner_occupied"
  | "flip"
  | "wholesale"
  | "development"
  | "land_hold"
  | "commercial_income"
  | "mixed_use_income"
  | "unknown";

export type UnderwritingInputId =
  | "property_type"
  | "asking_price"
  | "purchase_price"
  | "down_payment_amount"
  | "down_payment_percent"
  | "closing_costs"
  | "initial_repairs"
  | "initial_reserves"
  | "total_cash_invested"
  | "value_basis"
  | "property_value"
  | "financing_used"
  | "loan_amount"
  | "annual_interest_rate"
  | "amortization_years"
  | "loan_term_months"
  | "monthly_principal_interest"
  | "annual_debt_service"
  | "monthly_rent"
  | "scheduled_income_monthly"
  | "gross_scheduled_income"
  | "other_income"
  | "vacancy_rate"
  | "vacancy_loss"
  | "credit_loss"
  | "concessions"
  | "effective_gross_income"
  | "taxes"
  | "insurance"
  | "hoa"
  | "utilities"
  | "maintenance"
  | "management"
  | "payroll"
  | "landscaping"
  | "snow_removal"
  | "pest_control"
  | "licenses_and_permits"
  | "legal_and_accounting"
  | "advertising"
  | "replacement_reserves"
  | "other_operating_expenses"
  | "total_operating_expenses"
  | "net_operating_income"
  | "pre_tax_cash_flow"
  | "capitalization_rate"
  | "cash_on_cash_return"
  | "loan_to_value_ratio"
  | "debt_service_coverage_ratio"
  | "unit_count"
  | "occupied_unit_count"
  | "rentable_square_feet"
  | "gross_building_area"
  | "lot_size"
  | "bedroom_count"
  | "bathroom_count"
  | "year_built"
  | "association_exists"
  | "third_party_management_selected"
  | "commercial_income_included"
  | "residential_income_monthly"
  | "commercial_income_monthly"
  | "development_profile_active"
  | "development_costs"
  | "exit_analysis_requested"
  | "disposition_price"
  | "legacy_rent_guess";

export type UnderwritingInputCategory =
  | "identity"
  | "acquisition"
  | "property_characteristics"
  | "unit_mix"
  | "income"
  | "vacancy"
  | "concessions"
  | "operating_expense"
  | "capital_expenditure"
  | "financing"
  | "reserves"
  | "disposition"
  | "tax"
  | "insurance"
  | "utilities"
  | "management"
  | "other";

export type UnderwritingDataType = "money" | "percentage" | "number" | "integer" | "text" | "boolean" | "date" | "derived";
export type CurrencyBehavior = "required" | "optional" | "not_applicable" | "inherits_input_currency";
export type UnderwritingRegistryStatus = "draft" | "active" | "deprecated" | "disabled";
export type AssumptionPolicy = "accepted_fact_only" | "accepted_fact_or_accepted_assumption" | "preliminary_assumption_allowed" | "no_assumptions";
export type ConflictPolicy = "block_unresolved" | "allow_resolved_only";
export type UnderwritingRequirementState = "required" | "conditionally_required" | "optional" | "derived" | "not_applicable" | "prohibited";
export type ValueClassification = FormulaInputClassification | "rejected" | "deferred" | "conflicted";
export type UnderwritingVerificationState = "confirmed" | "source_backed" | "estimated" | "user_entered" | "missing" | "unknown";
export type UnderwritingConflictState = "none" | "resolved" | "unresolved";
export type UnderwritingCompletenessState =
  | "available_confirmed"
  | "available_accepted_assumption"
  | "available_preliminary"
  | "missing"
  | "conflicted"
  | "invalid"
  | "not_applicable"
  | "prohibited"
  | "derived_pending";

export type UnderwritingInputDefinition = {
  inputId: UnderwritingInputId;
  displayName: string;
  description: string;
  category: UnderwritingInputCategory;
  semanticVersion: string;
  registryVersion: typeof UNDERWRITING_INPUT_REGISTRY_VERSION;
  dataType: UnderwritingDataType;
  canonicalUnit: FormulaUnit;
  permittedUnits: FormulaUnit[];
  canonicalPeriod: FormulaPeriod;
  permittedPeriods: FormulaPeriod[];
  currencyBehavior: CurrencyBehavior;
  precision: FormulaPrecisionRule;
  allowedRange?: { min?: number; max?: number };
  acceptedSourceClassifications: CanonicalSourceClass[];
  acceptedValueClassifications: ValueClassification[];
  assumptionPolicy: AssumptionPolicy;
  conflictPolicy: ConflictPolicy;
  canonicalPropertyField?: string;
  canonicalDealField?: string;
  formulaConsumers: FormulaId[];
  sensitivityEligible: boolean;
  userEditable: boolean;
  provenanceRequired: boolean;
  status: UnderwritingRegistryStatus;
  effectiveDate: string;
  deprecatedDate?: string;
  replacementInputId?: UnderwritingInputId;
};

export type ConditionalOperator = "equals" | "not_equals" | "greater_than" | "less_than" | "in" | "truthy";
export type ConditionalRequirementRule = {
  ruleId: string;
  conditionVersion: string;
  targetInputId: UnderwritingInputId;
  requirementState: "conditionally_required" | "not_applicable" | "prohibited";
  condition: {
    inputId: UnderwritingInputId;
    operator: ConditionalOperator;
    value?: string | number | boolean | Array<string | number | boolean>;
  };
  explanation: string;
};

export type MinimumReadinessRules = {
  allowAcceptedAssumptions: boolean;
  allowPreliminaryRequiredInputs: boolean;
  blockConflicts: boolean;
};

export type PropertyUnderwritingSchema = {
  schemaId: string;
  displayName: string;
  description: string;
  propertyProfile: UnderwritingPropertyProfile;
  underwritingMode: UnderwritingMode;
  semanticVersion: string;
  registryVersion: typeof PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION;
  status: UnderwritingRegistryStatus;
  requiredInputIds: UnderwritingInputId[];
  optionalInputIds: UnderwritingInputId[];
  conditionalRequirements: ConditionalRequirementRule[];
  excludedInputIds: UnderwritingInputId[];
  supportedFormulaIds: FormulaId[];
  minimumReadinessRules: MinimumReadinessRules;
  allowedAssumptionPolicy: AssumptionPolicy;
  selectionPriority: number;
  explanationTemplate: string;
  effectiveDate: string;
  deprecatedDate?: string;
  replacementSchemaId?: string;
};

export type UnderwritingInputValue = {
  inputId: UnderwritingInputId;
  canonicalValue?: string | number | boolean | null;
  rawAcceptedValue?: string | number | boolean | null;
  canonicalUnit: FormulaUnit;
  originalUnit?: FormulaUnit;
  period: FormulaPeriod;
  currency?: string;
  sourceFactId?: string;
  acceptedAssumptionId?: string;
  classification: ValueClassification;
  verificationState: UnderwritingVerificationState;
  conflictState: UnderwritingConflictState;
  proposalStatus?: "accepted" | "edited" | "pending" | "rejected" | "deferred" | "conflicted" | "superseded";
};

export type ResolvedUnderwritingInputState = {
  inputId: UnderwritingInputId;
  requirementState: UnderwritingRequirementState;
  canonicalValue?: string | number | boolean | null;
  rawAcceptedValue?: string | number | boolean | null;
  canonicalUnit: FormulaUnit;
  originalUnit?: FormulaUnit;
  period: FormulaPeriod;
  currency?: string;
  sourceFactId?: string;
  acceptedAssumptionId?: string;
  classification?: ValueClassification;
  verificationState: UnderwritingVerificationState;
  conflictState: UnderwritingConflictState;
  completenessState: UnderwritingCompletenessState;
  editability: boolean;
  applicability: "applicable" | "not_applicable" | "prohibited";
  formulaConsumers: FormulaId[];
  warnings: string[];
};

export type SchemaSelectionStatus =
  | "selected"
  | "unresolved_property_type"
  | "unresolved_mode"
  | "ambiguous"
  | "unsupported_property_type"
  | "schema_disabled"
  | "version_not_found";

export type SchemaSelectionRequest = {
  workspaceId?: string;
  dealId?: string;
  propertyId?: string;
  acceptedPropertyType?: string | UnderwritingPropertyProfile;
  acceptedPropertySubtype?: string;
  intendedUnderwritingMode?: string | UnderwritingMode;
  unitCount?: number;
  residentialCommercialMix?: "residential" | "commercial" | "mixed" | "unknown";
  country?: string;
  schemaVersionRequest?: string | "latest";
  registryVersion: typeof PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION;
};

export type SchemaSelectionResult = {
  selectedSchemaId?: string;
  schemaVersion?: string;
  registryVersion: typeof PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION;
  selectionStatus: SchemaSelectionStatus;
  matchedRules: string[];
  missingClassificationInputs: string[];
  ambiguityReasons: string[];
  supportedFormulaIds: FormulaId[];
  safeExplanation: string;
  schema?: PropertyUnderwritingSchema;
};

export type SchemaReadinessState =
  | "ready"
  | "ready_with_accepted_assumptions"
  | "preliminary"
  | "incomplete"
  | "blocked_conflict"
  | "unresolved_schema"
  | "unsupported";

export type SchemaReadinessProjection = {
  schemaSelected: boolean;
  schemaId?: string;
  schemaVersion?: string;
  registryVersion: typeof PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION;
  totalApplicableInputs: number;
  requiredInputs: number;
  availableRequiredInputs: number;
  missingRequiredInputs: UnderwritingInputId[];
  conflictedRequiredInputs: UnderwritingInputId[];
  preliminaryRequiredInputs: UnderwritingInputId[];
  optionalMissingInputs: UnderwritingInputId[];
  supportedFormulaIds: FormulaId[];
  formulasInputReady: FormulaId[];
  formulasBlockedByMissingInputs: Record<FormulaId, string[]>;
  formulasBlockedByConflicts: Record<FormulaId, string[]>;
  overallInputReadinessState: SchemaReadinessState;
};

export type UnderwritingSchemaAccessRequest = {
  actorId?: string;
  workspaceId: string;
  dealWorkspaceId?: string;
  propertyWorkspaceId?: string;
  membershipStatus: "active" | "revoked" | "missing";
  permissions: Array<"deal.read" | "property.read" | "underwriting.read" | "underwriting.update">;
};

export type UnderwritingSchemaAccessResult = {
  authorized: boolean;
  status: "authorized" | "authentication_required" | "workspace_mismatch" | "permission_denied" | "access_revoked";
  safeMessage: string;
};

const trustedSources: CanonicalSourceClass[] = [
  "manual",
  "listing_url",
  "county_record",
  "tax_record",
  "assessment",
  "purchase_contract",
  "insurance_quote",
  "appraisal",
  "rent_roll",
  "lease",
  "financial_statement",
  "operating_statement",
  "utility_bill",
  "spreadsheet",
];

const factOnly: ValueClassification[] = ["accepted_fact", "verified_source_value", "descriptive_input"];
const factOrAcceptedAssumption: ValueClassification[] = [...factOnly, "accepted_user_assumption"];
const factAcceptedOrPreliminary: ValueClassification[] = [...factOrAcceptedAssumption, "preliminary_assumption"];

const inputDefinitions = [
  input("property_type", "Property type", "Accepted canonical property profile.", "identity", "text", "unitless", "none", "not_applicable", factOnly, "accepted_fact_only", [], false, true, { property: "properties.property_type", deal: "deals.facts.propertyType" }),
  input("asking_price", "Asking price", "Published seller or listing ask; never treated as agreed purchase price.", "acquisition", "money", "currency", "one_time", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, { deal: "deals.facts.listPrice" }, { min: 0 }),
  input("purchase_price", "Purchase price", "Accepted acquisition basis or intended offer price used for underwriting.", "acquisition", "money", "currency", "one_time", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["loan_amount", "down_payment_amount"], true, true, { deal: "deals.facts.expectedPrice" }, { min: 0 }),
  input("down_payment_amount", "Down payment amount", "Cash down payment amount.", "acquisition", "money", "currency", "one_time", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["loan_amount"], true, true, { deal: "deals.facts.downPayment" }, { min: 0 }),
  input("down_payment_percent", "Down payment percent", "Down payment percentage when amount is derived.", "acquisition", "percentage", "percentage", "none", "not_applicable", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["down_payment_amount"], true, true, undefined, { min: 0, max: 100 }),
  input("closing_costs", "Closing costs", "One-time buyer closing costs.", "acquisition", "money", "currency", "one_time", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("initial_repairs", "Initial repairs", "Initial repair or renovation budget.", "capital_expenditure", "money", "currency", "one_time", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, { deal: "deals.facts.rehabBudget" }, { min: 0 }),
  input("initial_reserves", "Initial reserves", "Cash reserve set aside at acquisition.", "reserves", "money", "currency", "one_time", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("total_cash_invested", "Total cash invested", "Accepted total investor cash basis.", "acquisition", "money", "currency", "one_time", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["cash_on_cash_return"], true, true, undefined, { min: 0 }),
  input("value_basis", "Value basis", "Accepted value basis for cap-rate calculations.", "acquisition", "money", "currency", "one_time", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["capitalization_rate"], true, true, { deal: "deals.facts.arv" }, { min: 0 }),
  input("property_value", "Property value", "Accepted collateral or current value basis.", "acquisition", "money", "currency", "one_time", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["loan_to_value_ratio"], true, true, { deal: "deals.facts.arv" }, { min: 0 }),
  input("financing_used", "Financing used", "Whether debt financing is part of the underwriting.", "financing", "boolean", "unitless", "none", "not_applicable", factOnly, "accepted_fact_only", [], false, true),
  input("loan_amount", "Loan amount", "Accepted principal loan amount.", "financing", "money", "currency", "one_time", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["monthly_principal_interest_fixed", "loan_to_value_ratio"], true, true, undefined, { min: 0 }),
  input("annual_interest_rate", "Annual interest rate", "Annual stated interest rate.", "financing", "percentage", "percentage", "none", "not_applicable", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["monthly_principal_interest_fixed"], true, true, { deal: "deals.facts.interestRate" }, { min: 0, max: 100 }),
  input("amortization_years", "Amortization years", "Amortization term in years.", "financing", "number", "years", "none", "not_applicable", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["monthly_principal_interest_fixed"], true, true, { deal: "deals.facts.loanYears" }, { min: 0 }),
  input("loan_term_months", "Loan term months", "Contractual loan maturity term in months.", "financing", "integer", "months", "none", "not_applicable", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("monthly_principal_interest", "Monthly principal and interest", "Accepted or calculated monthly debt payment.", "financing", "money", "currency", "monthly", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["annual_debt_service"], true, true, undefined, { min: 0 }),
  derived("annual_debt_service", "Annual debt service", "Annualized debt service output.", "financing", "currency", "annual", ["pre_tax_cash_flow", "debt_service_coverage_ratio"]),
  input("monthly_rent", "Monthly rent", "Residential monthly rent support.", "income", "money", "currency", "monthly", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, { deal: "deals.facts.monthlyRent" }, { min: 0 }),
  input("scheduled_income_monthly", "Scheduled income monthly", "Monthly scheduled rental income consumed by gross scheduled income.", "income", "money", "currency", "monthly", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["gross_scheduled_income"], true, true, { deal: "deals.facts.monthlyRent" }, { min: 0 }),
  derived("gross_scheduled_income", "Gross scheduled income", "Annual gross scheduled income output.", "income", "currency", "annual", ["effective_gross_income"]),
  input("other_income", "Other income", "Other recurring annual income.", "income", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["effective_gross_income"], true, true, undefined, { min: 0 }),
  input("vacancy_rate", "Vacancy rate", "Vacancy percentage assumption or supported actual.", "vacancy", "percentage", "percentage", "none", "not_applicable", factAcceptedOrPreliminary, "preliminary_assumption_allowed", [], true, true, undefined, { min: 0, max: 100 }),
  input("vacancy_loss", "Vacancy loss", "Annual vacancy loss amount.", "vacancy", "money", "currency", "annual", "required", factAcceptedOrPreliminary, "preliminary_assumption_allowed", ["effective_gross_income"], true, true, undefined, { min: 0 }),
  input("credit_loss", "Credit loss", "Annual collection or credit loss.", "vacancy", "money", "currency", "annual", "required", factAcceptedOrPreliminary, "preliminary_assumption_allowed", ["effective_gross_income"], true, true, undefined, { min: 0 }),
  input("concessions", "Concessions", "Annual rent concessions.", "concessions", "money", "currency", "annual", "required", factAcceptedOrPreliminary, "preliminary_assumption_allowed", [], true, true, undefined, { min: 0 }),
  derived("effective_gross_income", "Effective gross income", "Effective gross income after vacancy and credit loss.", "income", "currency", "annual", ["net_operating_income"]),
  input("taxes", "Property taxes", "Annual property tax expense.", "tax", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["total_operating_expenses"], true, true, { deal: "deals.facts.annualTaxes" }, { min: 0 }),
  input("insurance", "Insurance", "Annual insurance premium.", "insurance", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["total_operating_expenses"], true, true, { deal: "deals.facts.annualInsurance" }, { min: 0 }),
  input("hoa", "HOA or association fees", "Annual association dues where applicable.", "operating_expense", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["total_operating_expenses"], true, true, { deal: "deals.facts.hoaMonthly" }, { min: 0 }),
  input("utilities", "Utilities paid by owner", "Annual owner-paid utilities.", "utilities", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["total_operating_expenses"], true, true, undefined, { min: 0 }),
  input("maintenance", "Repairs and maintenance", "Annual repairs and maintenance expense.", "operating_expense", "money", "currency", "annual", "required", factAcceptedOrPreliminary, "preliminary_assumption_allowed", ["total_operating_expenses"], true, true, undefined, { min: 0 }),
  input("management", "Management fees", "Annual property management expense.", "management", "money", "currency", "annual", "required", factAcceptedOrPreliminary, "preliminary_assumption_allowed", ["total_operating_expenses"], true, true, undefined, { min: 0 }),
  input("payroll", "Payroll", "Annual payroll expense.", "operating_expense", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("landscaping", "Landscaping", "Annual landscaping expense.", "operating_expense", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("snow_removal", "Snow removal", "Annual snow removal expense.", "operating_expense", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("pest_control", "Pest control", "Annual pest-control expense.", "operating_expense", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("licenses_and_permits", "Licenses and permits", "Annual license and permit costs.", "operating_expense", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("legal_and_accounting", "Legal and accounting", "Annual legal and accounting expense.", "operating_expense", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("advertising", "Advertising", "Annual marketing or leasing advertising expense.", "operating_expense", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("replacement_reserves", "Replacement reserves", "Annual replacement reserve allowance.", "reserves", "money", "currency", "annual", "required", factAcceptedOrPreliminary, "preliminary_assumption_allowed", [], true, true, undefined, { min: 0 }),
  input("other_operating_expenses", "Other operating expenses", "Other recurring annual operating expenses.", "operating_expense", "money", "currency", "annual", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", ["total_operating_expenses"], true, true, undefined, { min: 0 }),
  derived("total_operating_expenses", "Total operating expenses", "Total annual operating expense output.", "operating_expense", "currency", "annual", ["net_operating_income"]),
  derived("net_operating_income", "NOI", "Net operating income output.", "income", "currency", "annual", ["pre_tax_cash_flow", "capitalization_rate", "debt_service_coverage_ratio"]),
  derived("pre_tax_cash_flow", "Pre-tax cash flow", "Pre-tax cash flow output.", "income", "currency", "annual", ["cash_on_cash_return"]),
  derived("capitalization_rate", "Cap rate", "Capitalization rate output.", "income", "percentage", "none", []),
  derived("cash_on_cash_return", "Cash-on-cash return", "Cash-on-cash return output.", "income", "percentage", "none", []),
  derived("loan_to_value_ratio", "LTV", "Loan-to-value output.", "financing", "percentage", "none", []),
  derived("debt_service_coverage_ratio", "DSCR", "Debt service coverage ratio output.", "financing", "ratio", "none", []),
  input("unit_count", "Unit count", "Number of units or suites.", "unit_mix", "integer", "count", "none", "not_applicable", factOnly, "accepted_fact_only", [], true, true, { property: "properties.unit_count" }, { min: 0 }),
  input("occupied_unit_count", "Occupied unit count", "Number of occupied units or suites.", "unit_mix", "integer", "count", "none", "not_applicable", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("rentable_square_feet", "Rentable square feet", "Commercial rentable area.", "property_characteristics", "number", "square_feet", "none", "not_applicable", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, { property: "properties.rentable_square_feet" }, { min: 0 }),
  input("gross_building_area", "Gross building area", "Gross building area.", "property_characteristics", "number", "square_feet", "none", "not_applicable", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, { property: "properties.gross_building_area", deal: "deals.facts.squareFeet" }, { min: 0 }),
  input("lot_size", "Lot size", "Lot size in acres.", "property_characteristics", "number", "acres", "none", "not_applicable", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, { deal: "deals.facts.lotSize" }, { min: 0 }),
  input("bedroom_count", "Bedroom count", "Residential bedroom count.", "property_characteristics", "integer", "count", "none", "not_applicable", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], false, true, { deal: "deals.facts.beds" }, { min: 0 }),
  input("bathroom_count", "Bathroom count", "Residential bathroom count.", "property_characteristics", "number", "count", "none", "not_applicable", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], false, true, { deal: "deals.facts.baths" }, { min: 0 }),
  input("year_built", "Year built", "Year the primary improvements were built.", "property_characteristics", "integer", "years", "none", "not_applicable", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], false, true, { deal: "deals.facts.yearBuilt" }, { min: 1600 }),
  input("association_exists", "Association exists", "Whether an HOA, COA, POA, or similar association applies.", "property_characteristics", "boolean", "unitless", "none", "not_applicable", factOnly, "accepted_fact_only", [], false, true),
  input("third_party_management_selected", "Third-party management selected", "Whether third-party management is used in the underwriting.", "management", "boolean", "unitless", "none", "not_applicable", factAcceptedOrPreliminary, "preliminary_assumption_allowed", [], false, true),
  input("commercial_income_included", "Commercial income included", "Whether commercial tenant income is included.", "income", "boolean", "unitless", "none", "not_applicable", factOnly, "accepted_fact_only", [], false, true),
  input("residential_income_monthly", "Residential income monthly", "Residential portion of mixed-use monthly income.", "income", "money", "currency", "monthly", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("commercial_income_monthly", "Commercial income monthly", "Commercial portion of mixed-use monthly income.", "income", "money", "currency", "monthly", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("development_profile_active", "Development profile active", "Whether development analysis is in scope.", "property_characteristics", "boolean", "unitless", "none", "not_applicable", factOnly, "accepted_fact_only", [], false, true),
  input("development_costs", "Development costs", "Development or entitlement costs.", "capital_expenditure", "money", "currency", "one_time", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("exit_analysis_requested", "Exit analysis requested", "Whether disposition assumptions are requested.", "disposition", "boolean", "unitless", "none", "not_applicable", factOnly, "accepted_fact_only", [], false, true),
  input("disposition_price", "Disposition price", "Accepted planned disposition price.", "disposition", "money", "currency", "one_time", "required", factOrAcceptedAssumption, "accepted_fact_or_accepted_assumption", [], true, true, undefined, { min: 0 }),
  input("legacy_rent_guess", "Legacy rent guess", "Disabled historical rent guess input.", "income", "money", "currency", "monthly", "required", factAcceptedOrPreliminary, "preliminary_assumption_allowed", [], false, false, undefined, { min: 0 }, "disabled", "monthly_rent"),
] satisfies UnderwritingInputDefinition[];

const residentialBaseRequired: UnderwritingInputId[] = ["property_type", "purchase_price", "taxes", "insurance"];
const rentalBaseRequired: UnderwritingInputId[] = [
  ...residentialBaseRequired,
  "scheduled_income_monthly",
  "vacancy_loss",
  "maintenance",
  "total_cash_invested",
  "value_basis",
  "property_value",
];
const rentalBaseOptional: UnderwritingInputId[] = ["asking_price", "closing_costs", "initial_repairs", "initial_reserves", "financing_used", "bedroom_count", "bathroom_count", "year_built", "lot_size", "other_income", "credit_loss", "utilities", "other_operating_expenses", "vacancy_rate"];
const debtConditionals = [
  condition("debt.loan_amount", "loan_amount", "financing_used", "truthy", true, "Debt inputs apply only when financing is used."),
  condition("debt.annual_interest_rate", "annual_interest_rate", "financing_used", "truthy", true, "Interest rate applies only when financing is used."),
  condition("debt.amortization_years", "amortization_years", "financing_used", "truthy", true, "Amortization applies only when financing is used."),
  condition("debt.monthly_principal_interest", "monthly_principal_interest", "financing_used", "truthy", true, "Monthly debt payment applies only when financing is used."),
];

const schemaDefinitions = [
  schema("single_family_rental", "Single-family rental", "Residential rental schema for one dwelling.", "single_family", "rental", 10, rentalBaseRequired, rentalBaseOptional, [
    ...debtConditionals,
    condition("hoa.applies", "hoa", "association_exists", "truthy", true, "Association fees apply only when an association exists."),
    condition("management.selected", "management", "third_party_management_selected", "truthy", true, "Management expense applies when third-party management is selected."),
  ], ["rentable_square_feet", "commercial_income_monthly", "commercial_income_included"], standardRentalFormulas()),
  schema("single_family_owner_occupied", "Single-family owner occupied", "Owner-occupied residential schema without rent requirements.", "single_family", "owner_occupied", 20, residentialBaseRequired, ["asking_price", "closing_costs", "initial_repairs", "initial_reserves", "bedroom_count", "bathroom_count", "year_built", "lot_size", "hoa"], [
    ...debtConditionals,
    condition("hoa.applies", "hoa", "association_exists", "truthy", true, "Association fees apply only when an association exists."),
  ], ["scheduled_income_monthly", "monthly_rent", "gross_scheduled_income", "net_operating_income", "capitalization_rate", "cash_on_cash_return", "debt_service_coverage_ratio", "rentable_square_feet"], ["loan_amount", "down_payment_amount", "monthly_principal_interest_fixed", "annual_debt_service", "loan_to_value_ratio"]),
  schema("condominium_rental", "Condominium rental", "Condominium rental schema with association fee applicability.", "condominium", "rental", 10, [...rentalBaseRequired, "association_exists"], [...rentalBaseOptional, "hoa"], [
    ...debtConditionals,
    condition("condo.hoa.applies", "hoa", "association_exists", "truthy", true, "Association dues are required when the condo association applies."),
  ], ["rentable_square_feet", "commercial_income_monthly"], standardRentalFormulas()),
  schema("townhouse_rental", "Townhouse rental", "Townhouse rental schema with association fee applicability.", "townhouse", "rental", 10, [...rentalBaseRequired, "association_exists"], [...rentalBaseOptional, "hoa"], [
    ...debtConditionals,
    condition("townhouse.hoa.applies", "hoa", "association_exists", "truthy", true, "Association dues are required when applicable."),
  ], ["rentable_square_feet", "commercial_income_monthly"], standardRentalFormulas()),
  schema("two_to_four_unit_rental", "Two-to-four-unit rental", "Small multifamily rental schema using unit count and aggregate income.", "two_to_four_unit", "rental", 9, [...rentalBaseRequired, "unit_count"], [...rentalBaseOptional, "occupied_unit_count"], debtConditionals, ["rentable_square_feet", "commercial_income_monthly"], standardRentalFormulas()),
  schema("multifamily_rental", "Multifamily rental", "Multifamily schema that uses unit and income records, not bedroom count as a core financial input.", "multifamily", "rental", 8, ["property_type", "purchase_price", "unit_count", "occupied_unit_count", "scheduled_income_monthly", "vacancy_loss", "taxes", "insurance", "maintenance", "management", "total_cash_invested", "value_basis", "property_value"], ["asking_price", "financing_used", "gross_building_area", "rentable_square_feet", "other_income", "credit_loss", "payroll", "utilities", "landscaping", "snow_removal", "pest_control", "licenses_and_permits", "legal_and_accounting", "advertising", "replacement_reserves", "other_operating_expenses"], debtConditionals, ["bedroom_count", "bathroom_count"], standardRentalFormulas()),
  schema("mixed_use_income", "Mixed-use income", "Mixed-use schema preserving residential and commercial income separately.", "mixed_use", "mixed_use_income", 7, ["property_type", "purchase_price", "residential_income_monthly", "commercial_income_monthly", "scheduled_income_monthly", "vacancy_loss", "taxes", "insurance", "maintenance", "management", "gross_building_area", "rentable_square_feet", "total_cash_invested", "value_basis", "property_value"], ["asking_price", "financing_used", "other_income", "credit_loss", "payroll", "utilities", "other_operating_expenses"], debtConditionals, ["monthly_rent", "bedroom_count", "bathroom_count"], ["loan_amount", "down_payment_amount", "monthly_principal_interest_fixed", "gross_scheduled_income", "effective_gross_income", "annual_debt_service", "total_operating_expenses", "net_operating_income", "pre_tax_cash_flow", "capitalization_rate", "cash_on_cash_return", "loan_to_value_ratio", "debt_service_coverage_ratio"]),
  ...commercialProfiles().map((profile, index) => schema(`${profile}_commercial_income`, `${titleize(profile)} income`, `Commercial income schema for ${titleize(profile)} property.`, profile, "commercial_income", 6 + index, ["property_type", "purchase_price", "rentable_square_feet", "scheduled_income_monthly", "vacancy_loss", "taxes", "insurance", "maintenance", "management", "total_cash_invested", "value_basis", "property_value"], ["asking_price", "financing_used", "gross_building_area", "unit_count", "occupied_unit_count", "other_income", "credit_loss", "payroll", "utilities", "landscaping", "snow_removal", "pest_control", "licenses_and_permits", "legal_and_accounting", "advertising", "replacement_reserves", "other_operating_expenses"], debtConditionals, ["bedroom_count", "bathroom_count", "monthly_rent"], standardRentalFormulas())),
  schema("land_hold", "Land hold", "Acquisition-only land hold schema without rent or NOI assumptions.", "land", "land_hold", 5, ["property_type", "purchase_price", "lot_size"], ["asking_price", "closing_costs", "initial_reserves", "financing_used", "taxes", "insurance", "development_profile_active", "development_costs", "property_value"], [
    ...debtConditionals,
    condition("land.development_costs", "development_costs", "development_profile_active", "truthy", true, "Development costs apply only when development is active."),
  ], ["scheduled_income_monthly", "monthly_rent", "bedroom_count", "bathroom_count", "gross_scheduled_income", "effective_gross_income", "net_operating_income", "capitalization_rate", "cash_on_cash_return", "debt_service_coverage_ratio"], ["loan_amount", "down_payment_amount", "monthly_principal_interest_fixed", "annual_debt_service", "loan_to_value_ratio"]),
  schema("single_family_rental", "Single-family rental legacy", "Deprecated historical single-family rental schema.", "single_family", "rental", 1, rentalBaseRequired.filter((id) => id !== "property_value"), rentalBaseOptional, debtConditionals, ["rentable_square_feet"], standardRentalFormulas().filter((id) => id !== "loan_to_value_ratio"), "deprecated", "0.9.0", "single_family_rental"),
  schema("single_family_disabled_experimental", "Disabled experimental schema", "Disabled schema that cannot be selected for new underwriting.", "single_family", "rental", 99, rentalBaseRequired, rentalBaseOptional, [], [], standardRentalFormulas(), "disabled", "9.9.9"),
] satisfies PropertyUnderwritingSchema[];

export function listUnderwritingInputDefinitions() {
  return [...inputDefinitions].sort(inputDefinitionSorter);
}

export function resolveUnderwritingInputDefinition(inputId: string, version: string | "latest" = "latest") {
  const matches = inputDefinitions.filter((definition) => definition.inputId === inputId);
  if (matches.length === 0) return undefined;
  if (version !== "latest") return matches.find((definition) => definition.semanticVersion === version);
  return matches.filter((definition) => definition.status === "active").sort((a, b) => compareSemver(b.semanticVersion, a.semanticVersion))[0];
}

export function listPropertyUnderwritingSchemas() {
  return [...schemaDefinitions].sort(schemaSorter);
}

export function resolvePropertyUnderwritingSchema(schemaId: string, version: string | "latest" = "latest") {
  const matches = schemaDefinitions.filter((schemaItem) => schemaItem.schemaId === schemaId);
  if (matches.length === 0) return undefined;
  if (version !== "latest") return matches.find((schemaItem) => schemaItem.semanticVersion === version);
  return matches.filter((schemaItem) => schemaItem.status === "active").sort((a, b) => compareSemver(b.semanticVersion, a.semanticVersion))[0];
}

export function selectPropertyUnderwritingSchema(request: SchemaSelectionRequest): SchemaSelectionResult {
  const propertyProfile = normalizePropertyProfile(request.acceptedPropertyType, request.unitCount);
  const mode = normalizeUnderwritingMode(request.intendedUnderwritingMode);
  const base: Pick<SchemaSelectionResult, "registryVersion" | "matchedRules" | "missingClassificationInputs" | "ambiguityReasons" | "supportedFormulaIds"> = {
    registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
    matchedRules: [],
    missingClassificationInputs: [],
    ambiguityReasons: [],
    supportedFormulaIds: [],
  };
  if (request.registryVersion !== PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION) {
    return { ...base, selectionStatus: "version_not_found", safeExplanation: "Requested schema registry version is not available." };
  }
  if (!request.acceptedPropertyType || propertyProfile === "unknown") {
    return { ...base, selectionStatus: "unresolved_property_type", missingClassificationInputs: ["acceptedPropertyType"], safeExplanation: "BRIX needs an accepted property type before selecting an underwriting schema." };
  }
  if (!request.intendedUnderwritingMode || mode === "unknown") {
    return { ...base, selectionStatus: "unresolved_mode", missingClassificationInputs: ["intendedUnderwritingMode"], safeExplanation: "BRIX needs the intended underwriting mode before selecting an underwriting schema." };
  }
  if (request.unitCount !== undefined && ["single_family", "condominium", "townhouse"].includes(propertyProfile) && request.unitCount > 1) {
    return { ...base, selectionStatus: "ambiguous", ambiguityReasons: ["unit_count_conflicts_with_property_profile"], safeExplanation: "The accepted property type conflicts with unit count. Resolve the property classification before underwriting." };
  }
  if (propertyProfile === "other_residential" || propertyProfile === "special_purpose") {
    return { ...base, selectionStatus: "unsupported_property_type", safeExplanation: "This property profile does not yet have an active underwriting schema." };
  }

  const candidates = listPropertyUnderwritingSchemas().filter((schemaItem) => schemaItem.propertyProfile === propertyProfile && schemaItem.underwritingMode === mode);
  if (candidates.length === 0) {
    return { ...base, selectionStatus: "unsupported_property_type", safeExplanation: "No active underwriting schema supports this property type and mode yet." };
  }
  const requestedVersion = request.schemaVersionRequest ?? "latest";
  const exact = requestedVersion === "latest" ? candidates : candidates.filter((schemaItem) => schemaItem.semanticVersion === requestedVersion);
  if (exact.length === 0) {
    return { ...base, selectionStatus: "version_not_found", safeExplanation: "Requested schema version was not found." };
  }
  const active = exact.filter((schemaItem) => schemaItem.status === "active");
  if (active.length === 0) {
    return { ...base, selectionStatus: "schema_disabled", safeExplanation: "Requested schema version is not selectable for new underwriting." };
  }
  const selected = active.sort((a, b) => b.selectionPriority - a.selectionPriority || b.semanticVersion.localeCompare(a.semanticVersion) || a.schemaId.localeCompare(b.schemaId))[0];
  return {
    ...base,
    selectedSchemaId: selected.schemaId,
    schemaVersion: selected.semanticVersion,
    selectionStatus: "selected",
    matchedRules: [`property_profile:${propertyProfile}`, `mode:${mode}`, `schema:${selected.schemaId}@${selected.semanticVersion}`],
    supportedFormulaIds: [...selected.supportedFormulaIds].sort(),
    safeExplanation: renderSchemaExplanation(selected),
    schema: selected,
  };
}

export function evaluateConditionalRequirements(schemaItem: PropertyUnderwritingSchema, values: Record<string, UnderwritingInputValue> = {}) {
  assertNoCircularConditionalRequirements(schemaItem);
  return [...schemaItem.conditionalRequirements].sort((a, b) => a.ruleId.localeCompare(b.ruleId)).map((rule) => ({
    ...rule,
    applies: evaluateCondition(rule, values[rule.condition.inputId]),
  }));
}

export function projectInputStates(schemaItem: PropertyUnderwritingSchema, values: Record<string, UnderwritingInputValue> = {}): ResolvedUnderwritingInputState[] {
  assertNoCircularConditionalRequirements(schemaItem);
  const requirementByInput = buildRequirementMap(schemaItem, values);
  const requiredInputIds = Object.keys(requirementByInput) as UnderwritingInputId[];
  const valueInputIds = Object.keys(values) as UnderwritingInputId[];
  const allInputIds = sortedUniqueInputIds([...requiredInputIds, ...valueInputIds]);
  return allInputIds.map((inputId) => projectInputState(inputId, requirementByInput[inputId] ?? "not_applicable", values[inputId]));
}

export function projectSchemaReadiness(selection: SchemaSelectionResult, values: Record<string, UnderwritingInputValue> = {}): SchemaReadinessProjection {
  if (selection.selectionStatus !== "selected" || !selection.schema) {
    const state: SchemaReadinessState = selection.selectionStatus === "unsupported_property_type" || selection.selectionStatus === "schema_disabled" ? "unsupported" : "unresolved_schema";
    return emptyReadiness(selection, state);
  }
  const schemaItem = selection.schema;
  const states = projectInputStates(schemaItem, values);
  const requiredStates = states.filter((state) => state.requirementState === "required" || state.requirementState === "conditionally_required");
  const optionalStates = states.filter((state) => state.requirementState === "optional");
  const availableRequired = requiredStates.filter((state) => ["available_confirmed", "available_accepted_assumption"].includes(state.completenessState));
  const missingRequired = requiredStates.filter((state) => state.completenessState === "missing").map((state) => state.inputId);
  const conflictedRequired = requiredStates.filter((state) => state.completenessState === "conflicted").map((state) => state.inputId);
  const preliminaryRequired = requiredStates.filter((state) => state.completenessState === "available_preliminary").map((state) => state.inputId);
  const optionalMissing = optionalStates.filter((state) => state.completenessState === "missing").map((state) => state.inputId);
  const formulasInputReady: FormulaId[] = [];
  const formulasBlockedByMissingInputs = {} as Record<FormulaId, string[]>;
  const formulasBlockedByConflicts = {} as Record<FormulaId, string[]>;
  const stateByInput = new Map(states.map((state) => [state.inputId, state]));

  for (const formulaId of schemaItem.supportedFormulaIds) {
    const definition = resolveFormulaDefinition(formulaId);
    const formulaMissing = definition?.inputs
      .filter((formulaInputItem) => formulaInputItem.required)
      .map((formulaInputItem) => stateByInput.get(formulaInputItem.id as UnderwritingInputId))
      .filter((state): state is ResolvedUnderwritingInputState => !state || state.completenessState === "missing" || state.completenessState === "derived_pending" || state.completenessState === "not_applicable" || state.completenessState === "prohibited")
      .map((state) => state?.inputId ?? "unknown") ?? ["formula_not_found"];
    const formulaConflicts = definition?.inputs
      .map((formulaInputItem) => stateByInput.get(formulaInputItem.id as UnderwritingInputId))
      .filter((state): state is ResolvedUnderwritingInputState => Boolean(state) && state.completenessState === "conflicted")
      .map((state) => state.inputId) ?? [];
    if (formulaConflicts.length) formulasBlockedByConflicts[formulaId] = formulaConflicts;
    if (formulaMissing.length) formulasBlockedByMissingInputs[formulaId] = formulaMissing;
    if (!formulaMissing.length && !formulaConflicts.length) formulasInputReady.push(formulaId);
  }

  const overallInputReadinessState: SchemaReadinessState = conflictedRequired.length
    ? "blocked_conflict"
    : missingRequired.length
      ? "incomplete"
      : preliminaryRequired.length
        ? "preliminary"
        : availableRequired.some((state) => state.completenessState === "available_accepted_assumption")
          ? "ready_with_accepted_assumptions"
          : "ready";

  return {
    schemaSelected: true,
    schemaId: schemaItem.schemaId,
    schemaVersion: schemaItem.semanticVersion,
    registryVersion: schemaItem.registryVersion,
    totalApplicableInputs: states.filter((state) => state.applicability === "applicable").length,
    requiredInputs: requiredStates.length,
    availableRequiredInputs: availableRequired.length,
    missingRequiredInputs: missingRequired,
    conflictedRequiredInputs: conflictedRequired,
    preliminaryRequiredInputs: preliminaryRequired,
    optionalMissingInputs: optionalMissing,
    supportedFormulaIds: [...schemaItem.supportedFormulaIds].sort(),
    formulasInputReady: formulasInputReady.sort(),
    formulasBlockedByMissingInputs,
    formulasBlockedByConflicts,
    overallInputReadinessState,
  };
}

export function validateUnderwritingInputRegistry() {
  const errors: string[] = [];
  const keys = new Set<string>();
  const activeInputIds = new Set<UnderwritingInputId>();
  for (const definition of inputDefinitions) {
    const key = `${definition.inputId}@${definition.semanticVersion}`;
    if (keys.has(key)) errors.push(`Duplicate input definition ${key}.`);
    keys.add(key);
    if (definition.registryVersion !== UNDERWRITING_INPUT_REGISTRY_VERSION) errors.push(`Input ${key} has wrong registry version.`);
    if (definition.status === "active") activeInputIds.add(definition.inputId);
    if (definition.status === "active" && definition.replacementInputId) errors.push(`Active input ${key} cannot have replacement input.`);
    for (const formulaId of definition.formulaConsumers) {
      if (!resolveFormulaDefinition(formulaId)) errors.push(`Input ${key} references unresolved formula ${formulaId}.`);
    }
    if (definition.currencyBehavior === "required" && definition.canonicalUnit !== "currency") errors.push(`Input ${key} requires currency with non-currency unit.`);
    if (!definition.permittedUnits.includes(definition.canonicalUnit)) errors.push(`Input ${key} does not permit its canonical unit.`);
    if (!definition.permittedPeriods.includes(definition.canonicalPeriod)) errors.push(`Input ${key} does not permit its canonical period.`);
  }
  return { valid: errors.length === 0, errors, activeInputIds };
}

export function validatePropertyUnderwritingSchemaRegistry() {
  const inputValidation = validateUnderwritingInputRegistry();
  const errors = [...inputValidation.errors];
  const keys = new Set<string>();
  for (const schemaItem of schemaDefinitions) {
    const key = `${schemaItem.schemaId}@${schemaItem.semanticVersion}`;
    if (keys.has(key)) errors.push(`Duplicate schema definition ${key}.`);
    keys.add(key);
    if (schemaItem.registryVersion !== PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION) errors.push(`Schema ${key} has wrong registry version.`);
    for (const inputId of allSchemaInputIds(schemaItem)) {
      const definition = resolveUnderwritingInputDefinition(inputId);
      if (!definition && !schemaItem.excludedInputIds.includes(inputId)) errors.push(`Schema ${key} references non-active input ${inputId}.`);
      if (definition?.status !== "active" && !schemaItem.excludedInputIds.includes(inputId)) errors.push(`Schema ${key} references non-active input ${inputId}.`);
    }
    for (const rule of schemaItem.conditionalRequirements) {
      if (!inputValidation.activeInputIds.has(rule.targetInputId)) errors.push(`Schema ${key} rule ${rule.ruleId} targets inactive input ${rule.targetInputId}.`);
      if (!inputValidation.activeInputIds.has(rule.condition.inputId)) errors.push(`Schema ${key} rule ${rule.ruleId} depends on inactive input ${rule.condition.inputId}.`);
    }
    for (const formulaId of schemaItem.supportedFormulaIds) {
      const formula = resolveFormulaDefinition(formulaId);
      if (!formula) {
        errors.push(`Schema ${key} references unresolved formula ${formulaId}.`);
        continue;
      }
      for (const formulaInputItem of formula.inputs) {
        const inputId = formulaInputItem.id as UnderwritingInputId;
        const inputDefinition = resolveUnderwritingInputDefinition(inputId);
        if (!inputDefinition) errors.push(`Formula ${formulaId} input ${formulaInputItem.id} is missing from underwriting input registry.`);
        if (schemaItem.excludedInputIds.includes(inputId) && formulaInputItem.required) errors.push(`Schema ${key} supports ${formulaId} but prohibits required input ${inputId}.`);
      }
    }
    try {
      assertNoCircularConditionalRequirements(schemaItem);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { valid: errors.length === 0, errors };
}

export function authorizeUnderwritingSchemaAccess(request: UnderwritingSchemaAccessRequest): UnderwritingSchemaAccessResult {
  if (!request.actorId) return { authorized: false, status: "authentication_required", safeMessage: "Sign in is required before protected underwriting data can be resolved." };
  if (request.membershipStatus === "revoked") return { authorized: false, status: "access_revoked", safeMessage: "Workspace access has been revoked." };
  if (request.membershipStatus !== "active") return { authorized: false, status: "permission_denied", safeMessage: "Workspace membership is required." };
  if (request.dealWorkspaceId && request.dealWorkspaceId !== request.workspaceId) return { authorized: false, status: "workspace_mismatch", safeMessage: "The requested deal is outside the active workspace." };
  if (request.propertyWorkspaceId && request.propertyWorkspaceId !== request.workspaceId) return { authorized: false, status: "workspace_mismatch", safeMessage: "The requested property is outside the active workspace." };
  const requiredPermissions = ["deal.read", "property.read", "underwriting.read"] as const;
  if (!requiredPermissions.every((permission) => request.permissions.includes(permission))) {
    return { authorized: false, status: "permission_denied", safeMessage: "You do not have permission to resolve underwriting inputs for this deal." };
  }
  return { authorized: true, status: "authorized", safeMessage: "Access authorized." };
}

function input(
  inputId: UnderwritingInputId,
  displayName: string,
  description: string,
  category: UnderwritingInputCategory,
  dataType: UnderwritingDataType,
  canonicalUnit: FormulaUnit,
  canonicalPeriod: FormulaPeriod,
  currencyBehavior: CurrencyBehavior,
  acceptedValueClassifications: ValueClassification[],
  assumptionPolicy: AssumptionPolicy,
  formulaConsumers: FormulaId[],
  sensitivityEligible: boolean,
  userEditable: boolean,
  mappings?: { property?: string; deal?: string },
  allowedRange?: UnderwritingInputDefinition["allowedRange"],
  status: UnderwritingRegistryStatus = "active",
  replacementInputId?: UnderwritingInputId,
  semanticVersion = "1.0.0",
): UnderwritingInputDefinition {
  return {
    inputId,
    displayName,
    description,
    category,
    semanticVersion,
    registryVersion: UNDERWRITING_INPUT_REGISTRY_VERSION,
    dataType,
    canonicalUnit,
    permittedUnits: [canonicalUnit],
    canonicalPeriod,
    permittedPeriods: [canonicalPeriod],
    currencyBehavior,
    precision: precisionFor(canonicalUnit, dataType),
    allowedRange,
    acceptedSourceClassifications: trustedSources,
    acceptedValueClassifications,
    assumptionPolicy,
    conflictPolicy: "block_unresolved",
    canonicalPropertyField: mappings?.property,
    canonicalDealField: mappings?.deal,
    formulaConsumers,
    sensitivityEligible,
    userEditable,
    provenanceRequired: userEditable || dataType !== "derived",
    status,
    effectiveDate: EFFECTIVE_DATE,
    deprecatedDate: status === "deprecated" || status === "disabled" ? EFFECTIVE_DATE : undefined,
    replacementInputId,
  };
}

function derived(inputId: UnderwritingInputId, displayName: string, description: string, category: UnderwritingInputCategory, canonicalUnit: FormulaUnit, canonicalPeriod: FormulaPeriod, formulaConsumers: FormulaId[]): UnderwritingInputDefinition {
  return input(inputId, displayName, description, category, "derived", canonicalUnit, canonicalPeriod, canonicalUnit === "currency" ? "inherits_input_currency" : "not_applicable", [], "no_assumptions", formulaConsumers, false, false);
}

function schema(
  schemaId: string,
  displayName: string,
  description: string,
  propertyProfile: UnderwritingPropertyProfile,
  underwritingMode: UnderwritingMode,
  selectionPriority: number,
  requiredInputIds: UnderwritingInputId[],
  optionalInputIds: UnderwritingInputId[],
  conditionalRequirements: ConditionalRequirementRule[],
  excludedInputIds: UnderwritingInputId[],
  supportedFormulaIds: FormulaId[],
  status: UnderwritingRegistryStatus = "active",
  semanticVersion = status === "deprecated" ? "0.9.0" : "1.0.0",
  replacementSchemaId?: string,
): PropertyUnderwritingSchema {
  return {
    schemaId,
    displayName,
    description,
    propertyProfile,
    underwritingMode,
    semanticVersion,
    registryVersion: PROPERTY_UNDERWRITING_SCHEMA_REGISTRY_VERSION,
    status,
    requiredInputIds: sortedUniqueInputIds(requiredInputIds),
    optionalInputIds: sortedUniqueInputIds(optionalInputIds),
    conditionalRequirements: [...conditionalRequirements].sort((a, b) => a.ruleId.localeCompare(b.ruleId)),
    excludedInputIds: sortedUniqueInputIds(excludedInputIds),
    supportedFormulaIds: [...supportedFormulaIds].sort(),
    minimumReadinessRules: { allowAcceptedAssumptions: true, allowPreliminaryRequiredInputs: false, blockConflicts: true },
    allowedAssumptionPolicy: "accepted_fact_or_accepted_assumption",
    selectionPriority,
    explanationTemplate: `${displayName} applies to ${propertyProfile} property using ${underwritingMode} underwriting.`,
    effectiveDate: EFFECTIVE_DATE,
    deprecatedDate: status === "deprecated" || status === "disabled" ? EFFECTIVE_DATE : undefined,
    replacementSchemaId,
  };
}

function condition(
  ruleId: string,
  targetInputId: UnderwritingInputId,
  inputId: UnderwritingInputId,
  operator: ConditionalOperator,
  value: ConditionalRequirementRule["condition"]["value"],
  explanation: string,
): ConditionalRequirementRule {
  return { ruleId, conditionVersion: "1.0.0", targetInputId, requirementState: "conditionally_required", condition: { inputId, operator, value }, explanation };
}

function buildRequirementMap(schemaItem: PropertyUnderwritingSchema, values: Record<string, UnderwritingInputValue>) {
  const map = {} as Record<UnderwritingInputId, UnderwritingRequirementState>;
  for (const inputId of schemaItem.requiredInputIds) map[inputId] = "required";
  for (const inputId of schemaItem.optionalInputIds) {
    if (!map[inputId]) map[inputId] = "optional";
  }
  for (const rule of evaluateConditionalRequirements(schemaItem, values)) {
    if (rule.applies) map[rule.targetInputId] = rule.requirementState;
  }
  for (const inputId of derivedFormulaInputs(schemaItem)) {
    if (!map[inputId] && !schemaItem.excludedInputIds.includes(inputId)) map[inputId] = "derived";
  }
  for (const inputId of schemaItem.excludedInputIds) map[inputId] = "prohibited";
  return map;
}

function projectInputState(inputId: UnderwritingInputId, requirementState: UnderwritingRequirementState, value?: UnderwritingInputValue): ResolvedUnderwritingInputState {
  const definition = resolveUnderwritingInputDefinition(inputId);
  const canonicalUnit = definition?.canonicalUnit ?? value?.canonicalUnit ?? "unitless";
  const canonicalPeriod = definition?.canonicalPeriod ?? value?.period ?? "none";
  const base = {
    inputId,
    requirementState,
    canonicalValue: value?.canonicalValue,
    rawAcceptedValue: value?.rawAcceptedValue,
    canonicalUnit,
    originalUnit: value?.originalUnit,
    period: canonicalPeriod,
    currency: value?.currency,
    sourceFactId: value?.sourceFactId,
    acceptedAssumptionId: value?.acceptedAssumptionId,
    classification: value?.classification,
    verificationState: value?.verificationState ?? "missing" as UnderwritingVerificationState,
    conflictState: value?.conflictState ?? "none" as UnderwritingConflictState,
    editability: Boolean(definition?.userEditable),
    applicability: requirementState === "prohibited" ? "prohibited" as const : requirementState === "not_applicable" ? "not_applicable" as const : "applicable" as const,
    formulaConsumers: definition?.formulaConsumers ?? [],
    warnings: [] as string[],
  };
  if (requirementState === "prohibited") return { ...base, completenessState: "prohibited" };
  if (requirementState === "not_applicable") return { ...base, completenessState: "not_applicable" };
  if (requirementState === "derived") return { ...base, completenessState: "derived_pending" };
  if (!definition) return { ...base, completenessState: "invalid", warnings: ["Input definition is not registered."] };
  if (value?.conflictState === "unresolved" || value?.classification === "conflicted" || value?.proposalStatus === "conflicted") return { ...base, completenessState: "conflicted" };
  if (value?.proposalStatus && !["accepted", "edited"].includes(value.proposalStatus)) return { ...base, completenessState: value.proposalStatus === "deferred" ? "missing" : "invalid" };
  if (!value || value.canonicalValue === null || value.canonicalValue === undefined || value.canonicalValue === "") return { ...base, completenessState: requirementState === "optional" ? "missing" : "missing" };
  if (!definition.permittedUnits.includes(value.canonicalUnit) || !definition.permittedPeriods.includes(value.period)) return { ...base, completenessState: "invalid", warnings: ["Input unit or period does not match the schema contract."] };
  if (definition.currencyBehavior === "required" && (!value.currency || !/^[A-Z]{3}$/.test(value.currency))) return { ...base, completenessState: "invalid", warnings: ["Input requires a three-letter currency."] };
  if (value.classification === "preliminary_assumption") {
    return definition.assumptionPolicy === "preliminary_assumption_allowed"
      ? { ...base, completenessState: "available_preliminary", warnings: ["Preliminary assumption is not confirmed."] }
      : { ...base, completenessState: "invalid", warnings: ["Preliminary assumptions are not allowed for this input."] };
  }
  if (value.classification === "accepted_user_assumption") {
    return ["accepted_fact_or_accepted_assumption", "preliminary_assumption_allowed"].includes(definition.assumptionPolicy)
      ? { ...base, completenessState: "available_accepted_assumption", warnings: ["Accepted assumption must remain disclosed."] }
      : { ...base, completenessState: "invalid", warnings: ["Assumptions are not allowed for this input."] };
  }
  if (definition.acceptedValueClassifications.includes(value.classification)) return { ...base, completenessState: "available_confirmed" };
  return { ...base, completenessState: "invalid", warnings: ["Input classification is not accepted by this input contract."] };
}

function evaluateCondition(rule: ConditionalRequirementRule, value?: UnderwritingInputValue) {
  const rawValue = (value as UnderwritingInputValue & { rawValue?: unknown } | undefined)?.rawValue;
  const actual = value?.canonicalValue ?? rawValue;
  switch (rule.condition.operator) {
    case "truthy": return Boolean(actual) === Boolean(rule.condition.value);
    case "equals": return actual === rule.condition.value;
    case "not_equals": return actual !== rule.condition.value;
    case "greater_than": return Number(actual) > Number(rule.condition.value);
    case "less_than": return Number(actual) < Number(rule.condition.value);
    case "in": return Array.isArray(rule.condition.value) && rule.condition.value.includes(actual as string | number | boolean);
  }
}

function assertNoCircularConditionalRequirements(schemaItem: PropertyUnderwritingSchema) {
  const graph = new Map<UnderwritingInputId, UnderwritingInputId[]>();
  for (const rule of schemaItem.conditionalRequirements) {
    const edges = graph.get(rule.targetInputId) ?? [];
    edges.push(rule.condition.inputId);
    graph.set(rule.targetInputId, edges);
  }
  const visiting = new Set<UnderwritingInputId>();
  const visited = new Set<UnderwritingInputId>();
  const visit = (inputId: UnderwritingInputId) => {
    if (visited.has(inputId)) return;
    if (visiting.has(inputId)) throw new Error(`Circular conditional requirement detected in ${schemaItem.schemaId}.`);
    visiting.add(inputId);
    for (const dependency of graph.get(inputId) ?? []) visit(dependency);
    visiting.delete(inputId);
    visited.add(inputId);
  };
  [...graph.keys()].sort().forEach(visit);
}

function standardRentalFormulas(): FormulaId[] {
  return ["loan_amount", "down_payment_amount", "monthly_principal_interest_fixed", "gross_scheduled_income", "effective_gross_income", "total_operating_expenses", "net_operating_income", "annual_debt_service", "pre_tax_cash_flow", "capitalization_rate", "cash_on_cash_return", "loan_to_value_ratio", "debt_service_coverage_ratio"];
}

function commercialProfiles(): UnderwritingPropertyProfile[] {
  return ["office", "retail", "industrial", "warehouse", "self_storage", "hospitality", "mobile_home_park", "other_commercial"];
}

function derivedFormulaInputs(schemaItem: PropertyUnderwritingSchema) {
  return sortedUniqueInputIds(schemaItem.supportedFormulaIds.flatMap((formulaId) => {
    const formula = resolveFormulaDefinition(formulaId);
    if (!formula) return [];
    const candidateIds: string[] = [
      formula.id,
      ...formula.inputs.map((inputItem) => inputItem.id),
      ...formula.dependencies.map((dependency) => dependency.formulaId),
    ];
    return candidateIds.filter((inputId): inputId is UnderwritingInputId => Boolean(resolveUnderwritingInputDefinition(inputId)));
  }));
}

function allSchemaInputIds(schemaItem: PropertyUnderwritingSchema) {
  return sortedUniqueInputIds([...schemaItem.requiredInputIds, ...schemaItem.optionalInputIds, ...schemaItem.conditionalRequirements.flatMap((rule) => [rule.targetInputId, rule.condition.inputId]), ...derivedFormulaInputs(schemaItem), ...schemaItem.excludedInputIds]);
}

function emptyReadiness(selection: SchemaSelectionResult, state: SchemaReadinessState): SchemaReadinessProjection {
  return {
    schemaSelected: false,
    registryVersion: selection.registryVersion,
    totalApplicableInputs: 0,
    requiredInputs: 0,
    availableRequiredInputs: 0,
    missingRequiredInputs: [],
    conflictedRequiredInputs: [],
    preliminaryRequiredInputs: [],
    optionalMissingInputs: [],
    supportedFormulaIds: selection.supportedFormulaIds,
    formulasInputReady: [],
    formulasBlockedByMissingInputs: {} as Record<FormulaId, string[]>,
    formulasBlockedByConflicts: {} as Record<FormulaId, string[]>,
    overallInputReadinessState: state,
  };
}

function normalizePropertyProfile(value?: string, unitCount?: number): UnderwritingPropertyProfile {
  const normalized = normalizeToken(value);
  if (!normalized) return "unknown";
  if (normalized === "single_family" && unitCount !== undefined && unitCount >= 2 && unitCount <= 4) return "two_to_four_unit";
  const aliases: Record<string, UnderwritingPropertyProfile> = {
    sfh: "single_family",
    single_family_home: "single_family",
    condo: "condominium",
    condominium: "condominium",
    townhome: "townhouse",
    town_house: "townhouse",
    duplex: "two_to_four_unit",
    triplex: "two_to_four_unit",
    fourplex: "two_to_four_unit",
    two_to_four_units: "two_to_four_unit",
    multifamily: "multifamily",
    multi_family: "multifamily",
    mixed_use: "mixed_use",
    office: "office",
    retail: "retail",
    industrial: "industrial",
    warehouse: "warehouse",
    self_storage: "self_storage",
    hospitality: "hospitality",
    hotel: "hospitality",
    mobile_home_park: "mobile_home_park",
    land: "land",
    vacant_land: "land",
    special_purpose: "special_purpose",
    other_residential: "other_residential",
    other_commercial: "other_commercial",
  };
  return aliases[normalized] ?? (isSupportedProfile(normalized) ? normalized : "unknown");
}

function normalizeUnderwritingMode(value?: string): UnderwritingMode {
  const normalized = normalizeToken(value);
  const aliases: Record<string, UnderwritingMode> = {
    rental: "rental",
    long_term_rental: "rental",
    buy_and_hold: "rental",
    owner_occupied: "owner_occupied",
    owner_occupant: "owner_occupied",
    flip: "flip",
    fix_and_flip: "flip",
    wholesale: "wholesale",
    development: "development",
    land_hold: "land_hold",
    commercial_income: "commercial_income",
    mixed_use_income: "mixed_use_income",
  };
  return aliases[normalized] ?? "unknown";
}

function isSupportedProfile(value: string): value is UnderwritingPropertyProfile {
  return ["single_family", "condominium", "townhouse", "two_to_four_unit", "multifamily", "mixed_use", "office", "retail", "industrial", "warehouse", "self_storage", "hospitality", "mobile_home_park", "land", "special_purpose", "other_residential", "other_commercial", "unknown"].includes(value);
}

function inputDefinitionSorter(a: UnderwritingInputDefinition, b: UnderwritingInputDefinition) {
  return a.inputId.localeCompare(b.inputId) || compareSemver(a.semanticVersion, b.semanticVersion);
}

function schemaSorter(a: PropertyUnderwritingSchema, b: PropertyUnderwritingSchema) {
  return a.propertyProfile.localeCompare(b.propertyProfile) || a.underwritingMode.localeCompare(b.underwritingMode) || b.selectionPriority - a.selectionPriority || a.schemaId.localeCompare(b.schemaId) || compareSemver(a.semanticVersion, b.semanticVersion);
}

function sortedUniqueInputIds(values: UnderwritingInputId[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function precisionFor(unit: FormulaUnit, dataType: UnderwritingDataType): FormulaPrecisionRule {
  if (dataType === "integer" || unit === "count") return COUNT_PRECISION;
  if (unit === "percentage" || unit === "ratio") return RATIO_PRECISION;
  if (unit === "currency") return MONEY_PRECISION;
  return { scale: 2, roundingMode: "half_away_from_zero" };
}

function renderSchemaExplanation(schemaItem: PropertyUnderwritingSchema) {
  return `${schemaItem.displayName} selected explicitly from ${schemaItem.propertyProfile} and ${schemaItem.underwritingMode}. Version ${schemaItem.semanticVersion}.`;
}

function titleize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeToken(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function compareSemver(a: string, b: string) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const delta = (left[index] ?? 0) - (right[index] ?? 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

void FORMULA_REGISTRY_VERSION;
