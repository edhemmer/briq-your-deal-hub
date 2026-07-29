export const FORMULA_REGISTRY_VERSION = "underwriting-formula-registry-v1";

export type FormulaCategory =
  | "acquisition"
  | "financing"
  | "income"
  | "operating_expense"
  | "cash_flow"
  | "valuation"
  | "return"
  | "leverage"
  | "coverage"
  | "reserve"
  | "tax"
  | "disposition"
  | "sensitivity"
  | "utility";

export type FormulaStatus = "draft" | "active" | "deprecated" | "disabled";
export type FormulaUnit = "currency" | "percentage" | "ratio" | "count" | "square_feet" | "acres" | "months" | "years" | "unitless";
export type FormulaPeriod = "monthly" | "annual" | "one_time" | "per_unit" | "per_square_foot" | "none";
export type FormulaRoundingMode = "half_away_from_zero" | "none";
export type FormulaInputClassification =
  | "accepted_fact"
  | "verified_source_value"
  | "accepted_user_assumption"
  | "preliminary_assumption"
  | "descriptive_input"
  | "unknown";
export type FormulaConfidenceState = "confirmed_inputs" | "accepted_assumptions" | "preliminary" | "incomplete" | "blocked";
export type FormulaResultStatus =
  | "calculated"
  | "incomplete"
  | "blocked_conflict"
  | "invalid_input"
  | "unsupported_unit"
  | "unsupported_currency"
  | "divide_by_zero"
  | "formula_disabled"
  | "formula_not_found"
  | "version_not_found";

export type FormulaPrecisionRule = {
  scale: number;
  roundingMode: FormulaRoundingMode;
};

export type FormulaInputDefinition = {
  id: string;
  displayName: string;
  required: boolean;
  unit: FormulaUnit;
  period: FormulaPeriod;
  currencyBehavior: "required" | "optional" | "not_applicable";
  allowAcceptedAssumption: boolean;
  allowPreliminaryAssumption: boolean;
};

export type FormulaOutputDefinition = {
  unit: FormulaUnit;
  period: FormulaPeriod;
  currencyBehavior: "inherits_input_currency" | "not_applicable";
  precision: FormulaPrecisionRule;
};

export type FormulaDependency = {
  formulaId: FormulaId;
  version: string;
  requiredStatus: "calculated";
};

export type FormulaDefinition = {
  id: FormulaId;
  displayName: string;
  description: string;
  category: FormulaCategory;
  semanticVersion: string;
  registryVersion: typeof FORMULA_REGISTRY_VERSION;
  status: FormulaStatus;
  inputs: FormulaInputDefinition[];
  output: FormulaOutputDefinition;
  validationRules: string[];
  missingInputBehavior: FormulaResultStatus;
  conflictInputBehavior: FormulaResultStatus;
  assumptionInputBehavior: "allow_accepted" | "allow_preliminary" | "block";
  implementationRef: string;
  explanationTemplate: string;
  dependencies: FormulaDependency[];
  effectiveDate: string;
  deprecatedDate?: string;
  replacementFormulaId?: FormulaId;
};

export type FormulaInputValue = {
  value: number | string | null | undefined;
  unit: FormulaUnit;
  period: FormulaPeriod;
  currency?: string;
  classification: FormulaInputClassification;
  sourceFactIds?: string[];
  acceptedAssumptionIds?: string[];
  inputVersion?: string | number;
  conflictState?: "none" | "unresolved" | "resolved";
  proposalStatus?: "accepted" | "edited" | "pending" | "rejected" | "deferred" | "conflicted" | "superseded";
};

export type FormulaExecutionRequest = {
  formulaId: FormulaId | string;
  formulaVersion?: string | "latest";
  registryVersion: typeof FORMULA_REGISTRY_VERSION;
  calculationId: string;
  workspaceId: string;
  dealId?: string;
  propertyIds?: string[];
  inputs: Record<string, FormulaInputValue>;
  sourceFactIds?: string[];
  acceptedAssumptionIds?: string[];
  requestedPrecision?: FormulaPrecisionRule;
  requestedAt: string;
  context?: Record<string, string | number | boolean | null>;
};

export type FormulaExecutionResult = {
  calculationId: string;
  formulaId: string;
  formulaVersion?: string;
  registryVersion: typeof FORMULA_REGISTRY_VERSION;
  status: FormulaResultStatus;
  rawResult?: number;
  displayResult?: number;
  outputUnit?: FormulaUnit;
  currency?: string;
  period?: FormulaPeriod;
  precision?: FormulaPrecisionRule;
  roundingMode?: FormulaRoundingMode;
  inputsUsed: Record<string, number>;
  inputVersions: Record<string, string | number>;
  sourceFactIds: string[];
  assumptionIds: string[];
  warnings: string[];
  missingInputs: string[];
  blockedInputs: string[];
  confidenceState: FormulaConfidenceState;
  explanation: string;
  calculatedAt: string;
  deterministicHash: string;
};

export type FormulaExecutionPlanStep = {
  request: FormulaExecutionRequest;
  dependsOnCalculationIds?: string[];
};

export type FormulaId =
  | "loan_amount"
  | "down_payment_amount"
  | "monthly_principal_interest_fixed"
  | "gross_scheduled_income"
  | "effective_gross_income"
  | "total_operating_expenses"
  | "net_operating_income"
  | "annual_debt_service"
  | "pre_tax_cash_flow"
  | "capitalization_rate"
  | "cash_on_cash_return"
  | "loan_to_value_ratio"
  | "debt_service_coverage_ratio";

type FormulaImplementation = (definition: FormulaDefinition, request: FormulaExecutionRequest, inputs: Record<string, number>) => number | FormulaExecutionResult;

const CURRENCY_PRECISION: FormulaPrecisionRule = { scale: 2, roundingMode: "half_away_from_zero" };
const RATIO_PRECISION: FormulaPrecisionRule = { scale: 4, roundingMode: "half_away_from_zero" };

const definitions = [
  formula("loan_amount", "Loan amount", "Purchase price less down payment.", "financing", "currency", "one_time", CURRENCY_PRECISION, [
    input("purchase_price", true, "currency", "one_time", "required"),
    input("down_payment_amount", true, "currency", "one_time", "required", true),
  ], [], "Subtracts accepted down payment from accepted purchase price."),
  formula("down_payment_amount", "Down payment amount", "Purchase price multiplied by down payment percentage.", "acquisition", "currency", "one_time", CURRENCY_PRECISION, [
    input("purchase_price", true, "currency", "one_time", "required"),
    input("down_payment_percent", true, "percentage", "none", "not_applicable", true),
  ], [], "Applies the accepted down payment percentage to purchase price."),
  formula("monthly_principal_interest_fixed", "Monthly principal and interest", "Fixed-rate amortizing principal and interest payment.", "financing", "currency", "monthly", CURRENCY_PRECISION, [
    input("loan_amount", true, "currency", "one_time", "required", true),
    input("annual_interest_rate", true, "percentage", "none", "not_applicable", true),
    input("amortization_years", true, "years", "none", "not_applicable", true),
  ], [{ formulaId: "loan_amount", version: "1.0.0", requiredStatus: "calculated" }], "Calculates the fixed amortizing debt payment from loan amount, annual rate, and amortization years."),
  formula("gross_scheduled_income", "Gross scheduled income", "Annualizes scheduled monthly income.", "income", "currency", "annual", CURRENCY_PRECISION, [
    input("scheduled_income_monthly", true, "currency", "monthly", "required", true),
  ], [], "Annualizes scheduled monthly income."),
  formula("effective_gross_income", "Effective gross income", "Gross scheduled income less vacancy and credit loss plus other income.", "income", "currency", "annual", CURRENCY_PRECISION, [
    input("gross_scheduled_income", true, "currency", "annual", "required", true),
    input("vacancy_loss", false, "currency", "annual", "required", true),
    input("credit_loss", false, "currency", "annual", "required", true),
    input("other_income", false, "currency", "annual", "required", true),
  ], [{ formulaId: "gross_scheduled_income", version: "1.0.0", requiredStatus: "calculated" }], "Subtracts accepted vacancy and credit loss from gross scheduled income and adds other income."),
  formula("total_operating_expenses", "Total operating expenses", "Sums recurring annual operating expenses, excluding debt service and income taxes.", "operating_expense", "currency", "annual", CURRENCY_PRECISION, [
    input("taxes", false, "currency", "annual", "required", true),
    input("insurance", false, "currency", "annual", "required", true),
    input("maintenance", false, "currency", "annual", "required", true),
    input("management", false, "currency", "annual", "required", true),
    input("hoa", false, "currency", "annual", "required", true),
    input("utilities", false, "currency", "annual", "required", true),
    input("other_operating_expenses", false, "currency", "annual", "required", true),
  ], [], "Sums accepted annual operating expense inputs."),
  formula("net_operating_income", "Net operating income", "Effective gross income less operating expenses.", "cash_flow", "currency", "annual", CURRENCY_PRECISION, [
    input("effective_gross_income", true, "currency", "annual", "required", true),
    input("total_operating_expenses", true, "currency", "annual", "required", true),
  ], [
    { formulaId: "effective_gross_income", version: "1.0.0", requiredStatus: "calculated" },
    { formulaId: "total_operating_expenses", version: "1.0.0", requiredStatus: "calculated" },
  ], "Subtracts operating expenses from effective gross income."),
  formula("annual_debt_service", "Annual debt service", "Annualizes monthly principal and interest debt service.", "financing", "currency", "annual", CURRENCY_PRECISION, [
    input("monthly_principal_interest", true, "currency", "monthly", "required", true),
  ], [{ formulaId: "monthly_principal_interest_fixed", version: "1.0.0", requiredStatus: "calculated" }], "Multiplies monthly principal and interest by twelve."),
  formula("pre_tax_cash_flow", "Pre-tax cash flow", "Net operating income less annual debt service.", "cash_flow", "currency", "annual", CURRENCY_PRECISION, [
    input("net_operating_income", true, "currency", "annual", "required", true),
    input("annual_debt_service", true, "currency", "annual", "required", true),
  ], [
    { formulaId: "net_operating_income", version: "1.0.0", requiredStatus: "calculated" },
    { formulaId: "annual_debt_service", version: "1.0.0", requiredStatus: "calculated" },
  ], "Subtracts annual debt service from net operating income."),
  formula("capitalization_rate", "Capitalization rate", "Annual NOI divided by value basis.", "return", "percentage", "none", RATIO_PRECISION, [
    input("net_operating_income", true, "currency", "annual", "required", true),
    input("value_basis", true, "currency", "one_time", "required", true),
  ], [{ formulaId: "net_operating_income", version: "1.0.0", requiredStatus: "calculated" }], "Divides annual NOI by value basis."),
  formula("cash_on_cash_return", "Cash-on-cash return", "Annual pre-tax cash flow divided by total cash invested.", "return", "percentage", "none", RATIO_PRECISION, [
    input("pre_tax_cash_flow", true, "currency", "annual", "required", true),
    input("total_cash_invested", true, "currency", "one_time", "required", true),
  ], [{ formulaId: "pre_tax_cash_flow", version: "1.0.0", requiredStatus: "calculated" }], "Divides annual pre-tax cash flow by total cash invested."),
  formula("loan_to_value_ratio", "Loan-to-value ratio", "Loan amount divided by property value basis.", "leverage", "percentage", "none", RATIO_PRECISION, [
    input("loan_amount", true, "currency", "one_time", "required", true),
    input("property_value", true, "currency", "one_time", "required", true),
  ], [{ formulaId: "loan_amount", version: "1.0.0", requiredStatus: "calculated" }], "Divides loan amount by property value basis."),
  formula("debt_service_coverage_ratio", "Debt service coverage ratio", "Annual NOI divided by annual debt service.", "coverage", "ratio", "none", RATIO_PRECISION, [
    input("net_operating_income", true, "currency", "annual", "required", true),
    input("annual_debt_service", true, "currency", "annual", "required", true),
  ], [
    { formulaId: "net_operating_income", version: "1.0.0", requiredStatus: "calculated" },
    { formulaId: "annual_debt_service", version: "1.0.0", requiredStatus: "calculated" },
  ], "Divides annual NOI by annual debt service."),
] satisfies FormulaDefinition[];

const implementations: Record<FormulaId, FormulaImplementation> = {
  loan_amount: (_definition, request, inputs) => subtractCurrency(request, inputs.purchase_price, inputs.down_payment_amount),
  down_payment_amount: (_definition, request, inputs) => multiplyCurrency(request, inputs.purchase_price, normalizePercentage(inputs.down_payment_percent)),
  monthly_principal_interest_fixed: (definition, request, inputs) => {
    const months = inputs.amortization_years * 12;
    if (months <= 0) return typedResult(definition, request, "invalid_input", { blockedInputs: ["amortization_years"], explanation: "Amortization years must be greater than zero." });
    const rate = normalizePercentage(inputs.annual_interest_rate) / 12;
    const payment = rate === 0
      ? inputs.loan_amount / months
      : inputs.loan_amount * (rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    return payment;
  },
  gross_scheduled_income: (_definition, request, inputs) => multiplyCurrency(request, inputs.scheduled_income_monthly, 12),
  effective_gross_income: (_definition, request, inputs) => addCurrency(request, [inputs.gross_scheduled_income, -(inputs.vacancy_loss ?? 0), -(inputs.credit_loss ?? 0), inputs.other_income ?? 0]),
  total_operating_expenses: (_definition, request, inputs) => addCurrency(request, Object.values(inputs)),
  net_operating_income: (_definition, request, inputs) => subtractCurrency(request, inputs.effective_gross_income, inputs.total_operating_expenses),
  annual_debt_service: (_definition, request, inputs) => multiplyCurrency(request, inputs.monthly_principal_interest, 12),
  pre_tax_cash_flow: (_definition, request, inputs) => subtractCurrency(request, inputs.net_operating_income, inputs.annual_debt_service),
  capitalization_rate: (definition, request, inputs) => divideAsPercentage(definition, request, inputs.net_operating_income, inputs.value_basis),
  cash_on_cash_return: (definition, request, inputs) => divideAsPercentage(definition, request, inputs.pre_tax_cash_flow, inputs.total_cash_invested),
  loan_to_value_ratio: (definition, request, inputs) => divideAsPercentage(definition, request, inputs.loan_amount, inputs.property_value),
  debt_service_coverage_ratio: (definition, request, inputs) => divideAsRatio(definition, request, inputs.net_operating_income, inputs.annual_debt_service),
};

export function listFormulaDefinitions() {
  return [...definitions].sort((a, b) => a.id.localeCompare(b.id) || compareSemver(a.semanticVersion, b.semanticVersion));
}

export function getFormulaRegistry() {
  return new Map(listFormulaDefinitions().map((definition) => [`${definition.id}@${definition.semanticVersion}`, definition]));
}

export function resolveFormulaDefinition(formulaId: string, version: string | "latest" = "latest") {
  const matches = definitions.filter((definition) => definition.id === formulaId);
  if (matches.length === 0) return undefined;
  if (version !== "latest") return matches.find((definition) => definition.semanticVersion === version);
  return matches
    .filter((definition) => definition.status === "active")
    .sort((a, b) => compareSemver(b.semanticVersion, a.semanticVersion))[0];
}

export function executeFormula(request: FormulaExecutionRequest): FormulaExecutionResult {
  const definition = resolveFormulaDefinition(request.formulaId, request.formulaVersion ?? "latest");
  if (!definition) {
    const hasFormula = definitions.some((candidate) => candidate.id === request.formulaId);
    return typedResult(undefined, request, hasFormula ? "version_not_found" : "formula_not_found", { explanation: hasFormula ? "Requested formula version was not found." : "Requested formula was not found." });
  }
  if (definition.registryVersion !== request.registryVersion) {
    return typedResult(definition, request, "invalid_input", { explanation: "Registry version does not match the requested formula registry." });
  }
  if (definition.status !== "active") {
    return typedResult(definition, request, "formula_disabled", { explanation: "Only active formulas execute in production." });
  }

  const validated = validateInputs(definition, request);
  if (validated.status !== "calculated") return typedResult(definition, request, validated.status, validated);

  const implementation = implementations[definition.id];
  const raw = implementation(definition, request, validated.inputsUsed);
  if (isFormulaResult(raw)) return raw;
  if (!Number.isFinite(raw)) return typedResult(definition, request, "invalid_input", { explanation: "Formula produced a non-finite value." });

  const precision = request.requestedPrecision ?? definition.output.precision;
  const display = applyPrecision(raw, precision);
  return {
    calculationId: request.calculationId,
    formulaId: definition.id,
    formulaVersion: definition.semanticVersion,
    registryVersion: FORMULA_REGISTRY_VERSION,
    status: "calculated",
    rawResult: raw,
    displayResult: display,
    outputUnit: definition.output.unit,
    currency: definition.output.currencyBehavior === "inherits_input_currency" ? validated.currency : undefined,
    period: definition.output.period,
    precision,
    roundingMode: precision.roundingMode,
    inputsUsed: validated.inputsUsed,
    inputVersions: validated.inputVersions,
    sourceFactIds: validated.sourceFactIds,
    assumptionIds: validated.assumptionIds,
    warnings: validated.warnings,
    missingInputs: [],
    blockedInputs: [],
    confidenceState: validated.confidenceState,
    explanation: renderExplanation(definition, display, validated.currency, validated.inputsUsed),
    calculatedAt: request.requestedAt,
    deterministicHash: deterministicHash({
      registryVersion: FORMULA_REGISTRY_VERSION,
      formulaId: definition.id,
      formulaVersion: definition.semanticVersion,
      display,
      raw,
      inputs: stableObject(validated.inputsUsed),
      inputVersions: stableObject(validated.inputVersions),
      sourceFactIds: [...validated.sourceFactIds].sort(),
      assumptionIds: [...validated.assumptionIds].sort(),
      status: "calculated",
    }),
  };
}

export function executeFormulaPlan(steps: FormulaExecutionPlanStep[]): FormulaExecutionResult[] {
  const ordered = sortExecutionPlan(steps);
  const results = new Map<string, FormulaExecutionResult>();
  for (const step of ordered) {
    const dependencyFailure = (step.dependsOnCalculationIds ?? [])
      .map((id) => results.get(id))
      .find((result) => result?.status !== "calculated");
    if (dependencyFailure) {
      results.set(step.request.calculationId, typedResult(resolveFormulaDefinition(step.request.formulaId, step.request.formulaVersion ?? "latest"), step.request, propagateStatus(dependencyFailure.status), {
        blockedInputs: [dependencyFailure.calculationId],
        explanation: `Dependency ${dependencyFailure.calculationId} did not calculate.`,
      }));
      continue;
    }
    results.set(step.request.calculationId, executeFormula(step.request));
  }
  return ordered.map((step) => results.get(step.request.calculationId)).filter(Boolean) as FormulaExecutionResult[];
}

export function applyPrecision(value: number, precision: FormulaPrecisionRule) {
  if (precision.roundingMode === "none") return value;
  const factor = 10 ** precision.scale;
  const sign = value < 0 ? -1 : 1;
  return sign * Math.round((Math.abs(value) + Number.EPSILON) * factor) / factor;
}

export function formulaInput(value: number | string | null | undefined, unit: FormulaUnit, period: FormulaPeriod, currency = "USD", classification: FormulaInputClassification = "accepted_fact"): FormulaInputValue {
  return { value, unit, period, currency: unit === "currency" ? currency : undefined, classification, conflictState: "none", proposalStatus: "accepted" };
}

function input(id: string, required: boolean, unit: FormulaUnit, period: FormulaPeriod, currencyBehavior: FormulaInputDefinition["currencyBehavior"], allowAcceptedAssumption = false, allowPreliminaryAssumption = false): FormulaInputDefinition {
  return { id, displayName: titleize(id), required, unit, period, currencyBehavior, allowAcceptedAssumption, allowPreliminaryAssumption };
}

function formula(id: FormulaId, displayName: string, description: string, category: FormulaCategory, outputUnit: FormulaUnit, outputPeriod: FormulaPeriod, precision: FormulaPrecisionRule, inputs: FormulaInputDefinition[], dependencies: FormulaDependency[], explanationTemplate: string): FormulaDefinition {
  return {
    id,
    displayName,
    description,
    category,
    semanticVersion: "1.0.0",
    registryVersion: FORMULA_REGISTRY_VERSION,
    status: "active",
    inputs,
    output: {
      unit: outputUnit,
      period: outputPeriod,
      currencyBehavior: outputUnit === "currency" ? "inherits_input_currency" : "not_applicable",
      precision,
    },
    validationRules: ["required_inputs_present", "known_units", "known_periods", "single_currency", "accepted_or_permitted_assumptions", "no_unresolved_conflicts", "no_raw_proposals"],
    missingInputBehavior: "incomplete",
    conflictInputBehavior: "blocked_conflict",
    assumptionInputBehavior: inputs.some((item) => item.allowPreliminaryAssumption) ? "allow_preliminary" : "allow_accepted",
    implementationRef: `src/core/formulaRegistry.ts:${id}`,
    explanationTemplate,
    dependencies,
    effectiveDate: "2026-07-29",
  };
}

function validateInputs(definition: FormulaDefinition, request: FormulaExecutionRequest) {
  const warnings: string[] = [];
  const missingInputs: string[] = [];
  const blockedInputs: string[] = [];
  const inputsUsed: Record<string, number> = {};
  const inputVersions: Record<string, string | number> = {};
  const sourceFactIds = new Set(request.sourceFactIds ?? []);
  const assumptionIds = new Set(request.acceptedAssumptionIds ?? []);
  const currencies = new Set<string>();
  let usedAcceptedAssumption = false;
  let usedPreliminary = false;

  for (const contract of definition.inputs) {
    const actual = request.inputs[contract.id];
    if (actual?.sourceFactIds) actual.sourceFactIds.forEach((id) => sourceFactIds.add(id));
    if (actual?.acceptedAssumptionIds) actual.acceptedAssumptionIds.forEach((id) => assumptionIds.add(id));
    if (actual?.inputVersion !== undefined) inputVersions[contract.id] = actual.inputVersion;

    if (actual?.conflictState === "unresolved" || actual?.proposalStatus === "conflicted") blockedInputs.push(contract.id);
    if (actual?.proposalStatus && !["accepted", "edited"].includes(actual.proposalStatus)) blockedInputs.push(contract.id);
    if (actual?.classification === "unknown") {
      if (contract.required) missingInputs.push(contract.id);
      continue;
    }
    if (!actual || actual.value === null || actual.value === undefined || actual.value === "") {
      if (contract.required) missingInputs.push(contract.id);
      continue;
    }
    if (actual.unit !== contract.unit) return { status: "unsupported_unit" as FormulaResultStatus, missingInputs, blockedInputs: [contract.id], warnings, inputsUsed, inputVersions, sourceFactIds: [...sourceFactIds], assumptionIds: [...assumptionIds], confidenceState: "blocked" as FormulaConfidenceState };
    if (actual.period !== contract.period) return { status: "invalid_input" as FormulaResultStatus, missingInputs, blockedInputs: [contract.id], warnings, inputsUsed, inputVersions, sourceFactIds: [...sourceFactIds], assumptionIds: [...assumptionIds], confidenceState: "blocked" as FormulaConfidenceState };
    if (contract.currencyBehavior === "required") {
      if (!actual.currency || !/^[A-Z]{3}$/.test(actual.currency)) return { status: "unsupported_currency" as FormulaResultStatus, missingInputs, blockedInputs: [contract.id], warnings, inputsUsed, inputVersions, sourceFactIds: [...sourceFactIds], assumptionIds: [...assumptionIds], confidenceState: "blocked" as FormulaConfidenceState };
      currencies.add(actual.currency);
    }
    if (actual.classification === "accepted_user_assumption") {
      if (!contract.allowAcceptedAssumption) blockedInputs.push(contract.id);
      usedAcceptedAssumption = true;
    }
    if (actual.classification === "preliminary_assumption") {
      if (!contract.allowPreliminaryAssumption) blockedInputs.push(contract.id);
      usedPreliminary = true;
      warnings.push(`${contract.displayName} uses a preliminary assumption.`);
    }
    const numeric = parseNumeric(actual.value);
    if (numeric === undefined) return { status: "invalid_input" as FormulaResultStatus, missingInputs, blockedInputs: [contract.id], warnings, inputsUsed, inputVersions, sourceFactIds: [...sourceFactIds], assumptionIds: [...assumptionIds], confidenceState: "blocked" as FormulaConfidenceState };
    inputsUsed[contract.id] = numeric;
  }

  if (currencies.size > 1) return { status: "unsupported_currency" as FormulaResultStatus, missingInputs, blockedInputs, warnings, inputsUsed, inputVersions, sourceFactIds: [...sourceFactIds], assumptionIds: [...assumptionIds], confidenceState: "blocked" as FormulaConfidenceState };
  if (blockedInputs.length) return { status: "blocked_conflict" as FormulaResultStatus, missingInputs, blockedInputs: [...new Set(blockedInputs)], warnings, inputsUsed, inputVersions, sourceFactIds: [...sourceFactIds], assumptionIds: [...assumptionIds], confidenceState: "blocked" as FormulaConfidenceState };
  if (missingInputs.length) return { status: "incomplete" as FormulaResultStatus, missingInputs, blockedInputs, warnings, inputsUsed, inputVersions, sourceFactIds: [...sourceFactIds], assumptionIds: [...assumptionIds], confidenceState: "incomplete" as FormulaConfidenceState };

  return {
    status: "calculated" as FormulaResultStatus,
    missingInputs,
    blockedInputs,
    warnings,
    inputsUsed,
    inputVersions,
    sourceFactIds: [...sourceFactIds].sort(),
    assumptionIds: [...assumptionIds].sort(),
    currency: [...currencies][0],
    confidenceState: usedPreliminary ? "preliminary" as const : usedAcceptedAssumption ? "accepted_assumptions" as const : "confirmed_inputs" as const,
  };
}

function typedResult(definition: FormulaDefinition | undefined, request: FormulaExecutionRequest, status: FormulaResultStatus, overrides: Partial<FormulaExecutionResult> = {}): FormulaExecutionResult {
  return {
    calculationId: request.calculationId,
    formulaId: definition?.id ?? request.formulaId,
    formulaVersion: definition?.semanticVersion,
    registryVersion: FORMULA_REGISTRY_VERSION,
    status,
    inputsUsed: {},
    inputVersions: {},
    sourceFactIds: [],
    assumptionIds: [],
    warnings: [],
    missingInputs: [],
    blockedInputs: [],
    confidenceState: status === "incomplete" ? "incomplete" : "blocked",
    explanation: "Formula did not calculate.",
    calculatedAt: request.requestedAt,
    deterministicHash: deterministicHash({ formulaId: request.formulaId, formulaVersion: definition?.semanticVersion, registryVersion: FORMULA_REGISTRY_VERSION, status }),
    ...overrides,
  };
}

function isFormulaResult(value: number | FormulaExecutionResult): value is FormulaExecutionResult {
  return typeof value === "object";
}

function parseNumeric(value: number | string) {
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/[$,%\s,]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
}

function subtractCurrency(request: FormulaExecutionRequest, left: number, right: number) {
  return fromCents(toCents(left) - toCents(right), requestCurrency(request));
}

function addCurrency(request: FormulaExecutionRequest, values: number[]) {
  return fromCents(values.reduce((sum, value) => sum + toCents(value), 0), requestCurrency(request));
}

function multiplyCurrency(request: FormulaExecutionRequest, value: number, factor: number) {
  return fromCents(Math.round(toCents(value) * factor), requestCurrency(request));
}

function toCents(value: number) {
  return Math.round((value + Number.EPSILON) * 100);
}

function fromCents(cents: number, _currency?: string) {
  return cents / 100;
}

function requestCurrency(request: FormulaExecutionRequest) {
  return Object.values(request.inputs).find((value) => value.currency)?.currency;
}

function divideAsPercentage(definition: FormulaDefinition, request: FormulaExecutionRequest, numerator: number, denominator: number) {
  if (denominator === 0) return typedResult(definition, request, "divide_by_zero", { blockedInputs: ["denominator"], explanation: "Formula cannot divide by zero." });
  return numerator / denominator * 100;
}

function divideAsRatio(definition: FormulaDefinition, request: FormulaExecutionRequest, numerator: number, denominator: number) {
  if (denominator === 0) return typedResult(definition, request, "divide_by_zero", { blockedInputs: ["denominator"], explanation: "Formula cannot divide by zero." });
  return numerator / denominator;
}

function normalizePercentage(value: number) {
  return value > 1 ? value / 100 : value;
}

function renderExplanation(definition: FormulaDefinition, result: number, currency: string | undefined, inputs: Record<string, number>) {
  const unit = definition.output.unit === "currency" && currency ? `${currency} ` : "";
  return `${definition.displayName}: ${definition.explanationTemplate} Result: ${unit}${String(result)}. Inputs: ${Object.keys(inputs).sort().join(", ")}.`;
}

function deterministicHash(value: unknown) {
  const text = JSON.stringify(stableObject(value));
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stableObject(item)]));
  }
  return value;
}

function sortExecutionPlan(steps: FormulaExecutionPlanStep[]) {
  const byId = new Map(steps.map((step) => [step.request.calculationId, step]));
  const ordered: FormulaExecutionPlanStep[] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (step: FormulaExecutionPlanStep) => {
    const id = step.request.calculationId;
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error("Formula dependency cycle detected.");
    visiting.add(id);
    for (const dependencyId of step.dependsOnCalculationIds ?? []) {
      const dependency = byId.get(dependencyId);
      if (dependency) visit(dependency);
    }
    visiting.delete(id);
    visited.add(id);
    ordered.push(step);
  };

  [...steps].sort((a, b) => a.request.calculationId.localeCompare(b.request.calculationId)).forEach(visit);
  return ordered;
}

function propagateStatus(status: FormulaResultStatus): FormulaResultStatus {
  if (status === "blocked_conflict") return "blocked_conflict";
  if (status === "incomplete") return "incomplete";
  if (status === "divide_by_zero") return "divide_by_zero";
  if (status === "unsupported_currency") return "unsupported_currency";
  if (status === "unsupported_unit") return "unsupported_unit";
  return "invalid_input";
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

function titleize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
