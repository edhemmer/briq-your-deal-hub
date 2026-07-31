import { resolveFormulaDefinition, type FormulaId } from "./formulaRegistry";
import {
  listUnderwritingInputDefinitions,
  type UnderwritingInputId,
  type UnderwritingMode,
  type UnderwritingPropertyProfile,
} from "./underwritingInputSchemas";

export const STRATEGY_REGISTRY_VERSION = "strategy-registry-v1";
export const STRATEGY_COMPATIBILITY_CONTRACT_VERSION_PENDING = "strategy-compatibility-contract-pending";
export const STRATEGY_DISQUALIFIER_CONTRACT_VERSION_PENDING = "strategy-disqualifier-contract-pending";
export const STRATEGY_SCORING_MODEL_VERSION_PENDING = "strategy-scoring-model-pending";
export const STRATEGY_CONFIDENCE_MODEL_VERSION_PENDING = "strategy-confidence-model-pending";
export const STRATEGY_EXPLANATION_CONTRACT_VERSION_PENDING = "strategy-explanation-contract-pending";
export const STRATEGY_OUTPUT_CONTRACT_VERSION_PENDING = "strategy-output-contract-pending";

export type StrategyCategory =
  | "residential"
  | "multifamily"
  | "commercial"
  | "specialty"
  | "land"
  | "development"
  | "distressed"
  | "transaction_structure"
  | "tax_or_exchange"
  | "portfolio_or_partnership";

export type StrategyLifecycleStatus = "draft" | "active" | "deprecated" | "disabled";
export type StrategySupportStatus = "registered" | "evaluation_ready" | "presentation_ready" | "fully_supported";
export type StrategyOperatingBurden = "low" | "moderate" | "high" | "expert";
export type StrategyTimeHorizon = "short" | "medium" | "long" | "variable";
export type StrategyLiquidityProfile = "illiquid" | "moderate" | "liquid_after_stabilization" | "exit_dependent";
export type StrategyCapitalIntensity = "low" | "moderate" | "high" | "variable";
export type StrategyExecutionComplexity = "low" | "moderate" | "high" | "expert";
export type StrategyTransactionContext =
  | "acquisition"
  | "ownership"
  | "renovation"
  | "refinance"
  | "disposition"
  | "development"
  | "partnership"
  | "tax_planning";

export type StrategyReplacementReference = {
  strategyId: string;
  semanticVersion: string;
};

export type StrategyDefinition = {
  strategyId: string;
  semanticVersion: string;
  registryVersion: typeof STRATEGY_REGISTRY_VERSION;
  machineKey: string;
  displayName: string;
  shortName?: string;
  category: StrategyCategory;
  subcategory?: string;
  conciseDescription: string;
  detailedPurpose: string;
  supportedPropertyProfiles: UnderwritingPropertyProfile[];
  supportedUnderwritingModes: UnderwritingMode[];
  supportedTransactionContexts: StrategyTransactionContext[];
  jurisdictionScope: "us" | "state_specific" | "local_specific" | "international" | "contract_specific";
  jurisdictionRestrictions: string[];
  requiredUnderwritingOutputIds: FormulaId[];
  optionalUnderwritingOutputIds: FormulaId[];
  requiredCanonicalInputIds: UnderwritingInputId[];
  optionalCanonicalInputIds: UnderwritingInputId[];
  futureMarketDependencies: string[];
  futureFinancingDependencies: string[];
  futureGovernanceLegalDependencies: string[];
  futurePropertyConditionDependencies: string[];
  futureInvestorFitDependencies: string[];
  compatibilityContractVersion: typeof STRATEGY_COMPATIBILITY_CONTRACT_VERSION_PENDING;
  disqualifierContractVersion: typeof STRATEGY_DISQUALIFIER_CONTRACT_VERSION_PENDING;
  scoringModelVersion: typeof STRATEGY_SCORING_MODEL_VERSION_PENDING;
  confidenceModelVersion: typeof STRATEGY_CONFIDENCE_MODEL_VERSION_PENDING;
  explanationContractVersion: typeof STRATEGY_EXPLANATION_CONTRACT_VERSION_PENDING;
  outputContractVersion: typeof STRATEGY_OUTPUT_CONTRACT_VERSION_PENDING;
  relearnIqContentRef: { contentId: string; version: string; status: "pending" };
  operatingBurden: StrategyOperatingBurden;
  timeHorizon: StrategyTimeHorizon;
  liquidityProfile: StrategyLiquidityProfile;
  capitalIntensity: StrategyCapitalIntensity;
  executionComplexity: StrategyExecutionComplexity;
  lifecycleStatus: StrategyLifecycleStatus;
  supportStatus: StrategySupportStatus;
  featureFlagRequirement: string | null;
  effectiveDate: string;
  deprecatedDate: string | null;
  replacementStrategy: StrategyReplacementReference | null;
  aliases: string[];
  stableOrdinal: number;
  metadataHash: string;
};

export type StrategyLookupResult = {
  strategyId: string;
  semanticVersion: string;
  registryVersion: typeof STRATEGY_REGISTRY_VERSION;
  lifecycleStatus: StrategyLifecycleStatus;
  supportStatus: StrategySupportStatus;
  eligibleForNewSelection: boolean;
  featureFlagRequirement: string | null;
  safeUnavailableReason: string | null;
  definition: StrategyDefinition;
};

export type StrategyAliasResolution =
  | {
      status: "exact";
      rawValue: string;
      normalizedValue: string;
      strategyId: string;
      semanticVersion: string;
      definition: StrategyDefinition;
    }
  | {
      status: "ambiguous";
      rawValue: string;
      normalizedValue: string;
      candidates: StrategyLookupResult[];
      safeMessage: string;
    }
  | {
      status: "unresolved";
      rawValue: string;
      normalizedValue: string;
      safeMessage: string;
    };

export type StrategyRegistryValidationResult = {
  valid: boolean;
  registryVersion: typeof STRATEGY_REGISTRY_VERSION;
  contentHash: string;
  definitionCount: number;
  errors: string[];
};

export class StrategyRegistryError extends Error {
  constructor(
    public readonly code:
      | "strategy_not_found"
      | "strategy_version_not_found"
      | "strategy_disabled"
      | "strategy_deprecated"
      | "strategy_not_selection_ready"
      | "registry_invalid"
      | "invalid_strategy_id"
      | "invalid_semantic_version"
      | "duplicate_strategy_id"
      | "duplicate_alias"
      | "ambiguous_alias"
      | "unresolved_alias"
      | "invalid_property_profile_reference"
      | "invalid_underwriting_dependency"
      | "replacement_strategy_not_found"
      | "circular_replacement"
      | "unauthorized_registry_mutation"
      | "unsupported_strategy_selection"
      | "internal_registry_error",
    message: string,
  ) {
    super(message);
    this.name = "StrategyRegistryError";
  }
}

type StrategySeed = Omit<StrategyDefinition, "registryVersion" | "machineKey" | "metadataHash"> & {
  aliases?: string[];
};

const residentialProfiles: UnderwritingPropertyProfile[] = ["single_family", "condominium", "townhouse", "two_to_four_unit", "other_residential"];
const multifamilyProfiles: UnderwritingPropertyProfile[] = ["multifamily", "two_to_four_unit"];
const commercialProfiles: UnderwritingPropertyProfile[] = ["office", "retail", "industrial", "warehouse", "other_commercial"];
const specialtyProfiles: UnderwritingPropertyProfile[] = ["self_storage", "hospitality", "mobile_home_park", "special_purpose"];
const landProfiles: UnderwritingPropertyProfile[] = ["land"];
const incomeOutputs: FormulaId[] = ["net_operating_income", "pre_tax_cash_flow", "capitalization_rate", "cash_on_cash_return", "debt_service_coverage_ratio"];
const leverageOutputs: FormulaId[] = ["loan_amount", "loan_to_value_ratio", "annual_debt_service"];
const incomeInputs: UnderwritingInputId[] = ["property_type", "purchase_price", "scheduled_income_monthly", "taxes", "insurance", "total_cash_invested"];
const financingInputs: UnderwritingInputId[] = ["financing_used", "down_payment_amount", "annual_interest_rate", "amortization_years"];

const strategySeeds: StrategySeed[] = [
  seed(10, "residential.owner_occupied", "Owner Occupied Purchase", "Owner Occupant", "residential", residentialProfiles, ["owner_occupied"], ["acquisition", "ownership"], ["property_type", "purchase_price", "down_payment_amount", "taxes", "insurance"], ["hoa", "initial_repairs"], [], leverageOutputs, "low", "long", "moderate", ["owner_occupant", "owner occupied", "live in home", "primary residence"]),
  seed(20, "residential.long_term_rental", "Long-Term Rental", "LTR", "residential", residentialProfiles, ["rental"], ["acquisition", "ownership"], incomeInputs, financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "liquid_after_stabilization", ["long_term_rental", "long term rental", "ltr"]),
  seed(30, "residential.medium_term_rental", "Medium-Term Rental", "MTR", "residential", residentialProfiles, ["rental"], ["acquisition", "ownership"], incomeInputs, financingInputs, incomeOutputs, leverageOutputs, "high", "medium", "moderate", ["mid_term_rental", "medium term rental", "mtr"]),
  seed(40, "residential.short_term_rental", "Short-Term Rental", "STR", "residential", residentialProfiles, ["rental"], ["acquisition", "ownership"], incomeInputs, financingInputs, incomeOutputs, leverageOutputs, "high", "short", "moderate", ["short_term_rental", "short term rental", "str"]),
  seed(50, "residential.rent_by_room", "Rent by Room", undefined, "residential", residentialProfiles, ["rental"], ["acquisition", "ownership"], incomeInputs, financingInputs, incomeOutputs, leverageOutputs, "high", "variable", "moderate", ["rent by room"]),
  seed(60, "residential.co_living", "Co-Living", undefined, "residential", residentialProfiles, ["rental"], ["acquisition", "ownership"], incomeInputs, financingInputs, incomeOutputs, leverageOutputs, "expert", "variable", "moderate", ["co living", "coliving"]),
  seed(70, "residential.student_housing", "Student Housing", undefined, "residential", residentialProfiles, ["rental"], ["acquisition", "ownership"], incomeInputs, financingInputs, incomeOutputs, leverageOutputs, "high", "variable", "moderate", ["student housing"]),
  seed(80, "residential.senior_housing", "Senior Housing", undefined, "residential", residentialProfiles, ["rental"], ["acquisition", "ownership"], incomeInputs, financingInputs, incomeOutputs, leverageOutputs, "expert", "long", "moderate", ["senior housing"]),
  seed(90, "residential.house_hack", "House Hack", undefined, "residential", ["single_family", "two_to_four_unit", "townhouse"], ["owner_occupied", "rental"], ["acquisition", "ownership"], ["property_type", "purchase_price", "monthly_rent", "taxes", "insurance"], financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "moderate", ["house_hack", "house hack"]),
  seed(100, "residential.brrrr", "BRRRR", undefined, "residential", residentialProfiles, ["rental"], ["acquisition", "renovation", "refinance"], [...incomeInputs, "initial_repairs", "property_value"], financingInputs, incomeOutputs, leverageOutputs, "high", "medium", "exit_dependent", ["brrrr"]),
  seed(110, "residential.fix_and_flip", "Fix and Flip", "Flip", "residential", residentialProfiles, ["flip"], ["acquisition", "renovation", "disposition"], ["property_type", "purchase_price", "initial_repairs", "disposition_price", "closing_costs"], ["taxes", "insurance"], ["loan_amount"], ["loan_to_value_ratio"], "high", "short", "exit_dependent", ["fix_and_flip", "fix and flip", "flip"]),
  seed(120, "residential.live_in_flip", "Live-In Flip", undefined, "residential", residentialProfiles, ["owner_occupied", "flip"], ["acquisition", "renovation", "disposition"], ["property_type", "purchase_price", "initial_repairs", "disposition_price"], ["taxes", "insurance"], ["loan_amount"], ["loan_to_value_ratio"], "high", "medium", "exit_dependent", ["live in flip"]),
  seed(130, "residential.buy_and_hold", "Buy and Hold", undefined, "residential", residentialProfiles, ["rental"], ["acquisition", "ownership"], incomeInputs, financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "liquid_after_stabilization", ["buy_and_hold", "buy and hold"]),
  seed(140, "residential.light_value_add", "Light Value Add", undefined, "residential", residentialProfiles, ["rental", "flip"], ["acquisition", "renovation"], [...incomeInputs, "initial_repairs"], financingInputs, incomeOutputs, leverageOutputs, "moderate", "medium", "moderate", ["value_add", "light value add"]),
  seed(150, "residential.heavy_value_add", "Heavy Value Add", undefined, "residential", residentialProfiles, ["rental", "flip"], ["acquisition", "renovation"], [...incomeInputs, "initial_repairs"], financingInputs, incomeOutputs, leverageOutputs, "high", "medium", "exit_dependent", ["heavy value add"]),
  seed(160, "residential.build_to_rent", "Build to Rent", undefined, "residential", residentialProfiles, ["development", "rental"], ["development", "ownership"], ["property_type", "purchase_price", "development_costs", "scheduled_income_monthly"], ["taxes", "insurance"], incomeOutputs, leverageOutputs, "expert", "long", "exit_dependent", ["build to rent"]),
  seed(170, "residential.new_construction", "New Construction", undefined, "residential", residentialProfiles, ["development"], ["development", "disposition"], ["property_type", "purchase_price", "development_costs", "disposition_price"], ["closing_costs"], ["loan_amount"], ["loan_to_value_ratio"], "expert", "medium", "exit_dependent", ["new construction"]),
  seed(180, "transaction.seller_financed_acquisition", "Seller-Financed Acquisition", "Seller Finance", "transaction_structure", [...residentialProfiles, ...multifamilyProfiles, ...commercialProfiles], ["rental", "commercial_income", "owner_occupied"], ["acquisition"], ["property_type", "purchase_price", "monthly_principal_interest"], ["taxes", "insurance"], ["annual_debt_service", "debt_service_coverage_ratio"], ["loan_to_value_ratio"], "high", "variable", "moderate", ["seller_finance", "seller financing", "seller-financed acquisition"]),
  seed(190, "transaction.lease_option", "Lease Option", undefined, "transaction_structure", [...residentialProfiles, ...commercialProfiles], ["owner_occupied", "rental", "commercial_income"], ["acquisition"], ["property_type", "purchase_price"], ["monthly_rent", "closing_costs"], [], leverageOutputs, "high", "variable", "exit_dependent", ["lease_option", "lease option"]),
  seed(200, "transaction.subject_to", "Subject-To", undefined, "transaction_structure", residentialProfiles, ["rental", "owner_occupied"], ["acquisition"], ["property_type", "purchase_price", "monthly_principal_interest"], ["taxes", "insurance"], ["annual_debt_service"], ["loan_to_value_ratio"], "expert", "variable", "exit_dependent", ["subject_to", "subject to"]),
  seed(210, "transaction.wrap", "Wrap Mortgage", "Wrap", "transaction_structure", residentialProfiles, ["rental", "owner_occupied"], ["acquisition"], ["property_type", "purchase_price", "monthly_principal_interest"], ["taxes", "insurance"], ["annual_debt_service"], ["loan_to_value_ratio"], "expert", "variable", "exit_dependent", ["wrap_mortgage", "wrap mortgage"]),
  seed(220, "multifamily.stabilized_hold", "Stabilized Multifamily Hold", undefined, "multifamily", multifamilyProfiles, ["rental"], ["acquisition", "ownership"], [...incomeInputs, "unit_count"], financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "liquid_after_stabilization", ["multifamily stabilized hold"]),
  seed(230, "multifamily.light_value_add", "Multifamily Light Value Add", undefined, "multifamily", multifamilyProfiles, ["rental"], ["acquisition", "renovation"], [...incomeInputs, "unit_count", "initial_repairs"], financingInputs, incomeOutputs, leverageOutputs, "high", "medium", "exit_dependent", ["multifamily value add"]),
  seed(240, "multifamily.heavy_value_add", "Multifamily Heavy Value Add", undefined, "multifamily", multifamilyProfiles, ["rental"], ["acquisition", "renovation"], [...incomeInputs, "unit_count", "initial_repairs"], financingInputs, incomeOutputs, leverageOutputs, "expert", "medium", "exit_dependent", ["heavy multifamily value add"]),
  seed(250, "multifamily.repositioning", "Multifamily Repositioning", undefined, "multifamily", multifamilyProfiles, ["rental"], ["acquisition", "renovation"], [...incomeInputs, "unit_count", "initial_repairs"], financingInputs, incomeOutputs, leverageOutputs, "expert", "medium", "exit_dependent", ["multifamily repositioning"]),
  seed(260, "multifamily.refinance_and_hold", "Refinance and Hold", undefined, "multifamily", multifamilyProfiles, ["rental"], ["ownership", "refinance"], [...incomeInputs, "property_value"], financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "moderate", ["refinance and hold"]),
  seed(270, "multifamily.condominium_conversion", "Condominium Conversion", undefined, "multifamily", multifamilyProfiles, ["development"], ["development", "disposition"], ["property_type", "purchase_price", "development_costs", "disposition_price"], ["unit_count"], ["loan_amount"], ["loan_to_value_ratio"], "expert", "medium", "exit_dependent", ["condominium conversion"]),
  seed(280, "multifamily.portfolio_acquisition", "Multifamily Portfolio Acquisition", undefined, "multifamily", multifamilyProfiles, ["rental"], ["acquisition", "ownership"], [...incomeInputs, "unit_count"], financingInputs, incomeOutputs, leverageOutputs, "expert", "long", "moderate", ["portfolio acquisition"]),
  seed(290, "portfolio_or_partnership.syndication_evaluation", "Syndication Evaluation", "Syndication", "portfolio_or_partnership", [...multifamilyProfiles, ...commercialProfiles, ...specialtyProfiles], ["commercial_income", "rental"], ["partnership", "acquisition"], [...incomeInputs, "unit_count"], financingInputs, incomeOutputs, leverageOutputs, "expert", "long", "illiquid", ["syndication", "syndication evaluation", "waterfall_partnership"]),
  seed(300, "commercial.stabilized_office", "Stabilized Office", undefined, "commercial", ["office"], ["commercial_income"], ["acquisition", "ownership"], [...incomeInputs, "rentable_square_feet"], financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "moderate", ["stabilized office"]),
  seed(310, "commercial.stabilized_medical_office", "Stabilized Medical Office", undefined, "commercial", ["office"], ["commercial_income"], ["acquisition", "ownership"], [...incomeInputs, "rentable_square_feet"], financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "moderate", ["medical office"]),
  seed(320, "commercial.retail", "Retail", undefined, "commercial", ["retail"], ["commercial_income"], ["acquisition", "ownership"], [...incomeInputs, "rentable_square_feet"], financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "moderate", ["retail"]),
  seed(330, "commercial.retail_nnn", "Retail NNN", "NNN", "commercial", ["retail"], ["commercial_income"], ["acquisition", "ownership"], [...incomeInputs, "rentable_square_feet"], financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "liquid_after_stabilization", ["nnn", "triple net"]),
  seed(340, "commercial.industrial", "Industrial", undefined, "commercial", ["industrial"], ["commercial_income"], ["acquisition", "ownership"], [...incomeInputs, "rentable_square_feet"], financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "moderate", ["industrial"]),
  seed(350, "commercial.warehouse", "Warehouse", undefined, "commercial", ["warehouse"], ["commercial_income"], ["acquisition", "ownership"], [...incomeInputs, "rentable_square_feet"], financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "moderate", ["warehouse"]),
  seed(360, "commercial.flex", "Flex", undefined, "commercial", ["industrial", "warehouse", "other_commercial"], ["commercial_income"], ["acquisition", "ownership"], [...incomeInputs, "rentable_square_feet"], financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "moderate", ["flex"]),
  seed(370, "specialty.self_storage", "Self-Storage", undefined, "specialty", ["self_storage"], ["commercial_income"], ["acquisition", "ownership"], [...incomeInputs, "unit_count"], financingInputs, incomeOutputs, leverageOutputs, "high", "long", "moderate", ["self_storage", "self storage"]),
  seed(380, "specialty.hospitality", "Hospitality", undefined, "specialty", ["hospitality"], ["commercial_income"], ["acquisition", "ownership"], [...incomeInputs, "unit_count"], financingInputs, incomeOutputs, leverageOutputs, "expert", "variable", "moderate", ["hospitality"]),
  seed(390, "commercial.mixed_use", "Mixed Use", undefined, "commercial", ["mixed_use"], ["mixed_use_income"], ["acquisition", "ownership"], [...incomeInputs, "residential_income_monthly", "commercial_income_monthly"], financingInputs, incomeOutputs, leverageOutputs, "high", "long", "moderate", ["mixed use", "mixed_use_conversion"]),
  seed(400, "specialty.mobile_home_park", "Mobile-Home Park", "MHP", "specialty", ["mobile_home_park"], ["commercial_income"], ["acquisition", "ownership"], [...incomeInputs, "unit_count"], financingInputs, incomeOutputs, leverageOutputs, "expert", "long", "moderate", ["mobile home park"]),
  seed(410, "specialty.rv_park", "RV Park", undefined, "specialty", ["special_purpose"], ["commercial_income"], ["acquisition", "ownership"], [...incomeInputs, "unit_count"], financingInputs, incomeOutputs, leverageOutputs, "expert", "variable", "moderate", ["rv park"]),
  seed(420, "commercial.owner_user", "Commercial Owner-User", "Owner-User", "commercial", commercialProfiles, ["owner_occupied", "commercial_income"], ["acquisition", "ownership"], ["property_type", "purchase_price", "taxes", "insurance"], financingInputs, leverageOutputs, incomeOutputs, "moderate", "long", "moderate", ["commercial owner user", "owner user"]),
  seed(430, "commercial.value_add", "Commercial Value Add", undefined, "commercial", commercialProfiles, ["commercial_income"], ["acquisition", "renovation"], [...incomeInputs, "initial_repairs", "rentable_square_feet"], financingInputs, incomeOutputs, leverageOutputs, "high", "medium", "exit_dependent", ["commercial value add", "commercial_repositioning"]),
  seed(440, "commercial.adaptive_reuse", "Adaptive Reuse", undefined, "commercial", commercialProfiles, ["development", "commercial_income"], ["development", "renovation"], ["property_type", "purchase_price", "development_costs"], ["scheduled_income_monthly"], incomeOutputs, leverageOutputs, "expert", "medium", "exit_dependent", ["adaptive reuse"]),
  seed(450, "transaction.sale_leaseback", "Sale Leaseback", undefined, "transaction_structure", commercialProfiles, ["commercial_income"], ["acquisition", "disposition"], ["property_type", "purchase_price", "scheduled_income_monthly"], financingInputs, incomeOutputs, leverageOutputs, "high", "long", "moderate", ["sale leaseback"]),
  seed(460, "transaction.ground_lease", "Ground Lease", undefined, "transaction_structure", [...commercialProfiles, ...landProfiles], ["commercial_income", "land_hold"], ["acquisition", "ownership"], ["property_type", "purchase_price", "scheduled_income_monthly"], financingInputs, incomeOutputs, leverageOutputs, "expert", "long", "illiquid", ["ground lease"]),
  seed(470, "land.raw_land_hold", "Raw Land Hold", undefined, "land", landProfiles, ["land_hold"], ["acquisition", "ownership"], ["property_type", "purchase_price", "taxes", "insurance"], ["lot_size"], ["loan_amount", "loan_to_value_ratio"], [], "low", "long", "illiquid", ["raw land hold"]),
  seed(480, "land.land_banking", "Land Banking", undefined, "land", landProfiles, ["land_hold"], ["acquisition", "ownership"], ["property_type", "purchase_price", "taxes", "insurance"], ["lot_size"], ["loan_amount", "loan_to_value_ratio"], [], "low", "long", "illiquid", ["land banking"]),
  seed(490, "land.agricultural_hold", "Agricultural Hold", undefined, "land", landProfiles, ["land_hold"], ["acquisition", "ownership"], ["property_type", "purchase_price", "taxes", "insurance"], ["lot_size"], ["loan_amount"], [], "moderate", "long", "illiquid", ["agricultural hold"]),
  seed(500, "land.timber_hold", "Timber Hold", undefined, "land", landProfiles, ["land_hold"], ["acquisition", "ownership"], ["property_type", "purchase_price", "taxes", "insurance"], ["lot_size"], ["loan_amount"], [], "moderate", "long", "illiquid", ["timber hold"]),
  seed(510, "land.recreational_hold", "Recreational Hold", undefined, "land", landProfiles, ["land_hold"], ["acquisition", "ownership"], ["property_type", "purchase_price", "taxes", "insurance"], ["lot_size"], ["loan_amount"], [], "low", "long", "illiquid", ["recreational hold"]),
  seed(520, "development.entitlement", "Entitlement", undefined, "development", landProfiles, ["development"], ["development"], ["property_type", "purchase_price", "development_costs"], ["lot_size"], ["loan_amount"], [], "expert", "medium", "exit_dependent", ["entitlement", "land.entitlement"]),
  seed(530, "development.subdivision", "Subdivision", undefined, "development", landProfiles, ["development"], ["development"], ["property_type", "purchase_price", "development_costs"], ["lot_size"], ["loan_amount"], [], "expert", "medium", "exit_dependent", ["subdivision", "lot_split"]),
  seed(540, "development.horizontal_development", "Horizontal Development", undefined, "development", landProfiles, ["development"], ["development"], ["property_type", "purchase_price", "development_costs"], ["lot_size"], ["loan_amount"], [], "expert", "medium", "exit_dependent", ["horizontal development"]),
  seed(550, "development.vertical_development", "Vertical Development", undefined, "development", [...landProfiles, ...commercialProfiles], ["development"], ["development"], ["property_type", "purchase_price", "development_costs"], ["gross_building_area"], ["loan_amount"], [], "expert", "medium", "exit_dependent", ["vertical development", "development"]),
  seed(560, "development.infill", "Infill Development", undefined, "development", [...landProfiles, ...residentialProfiles], ["development"], ["development"], ["property_type", "purchase_price", "development_costs"], ["lot_size"], ["loan_amount"], [], "expert", "medium", "exit_dependent", ["infill"]),
  seed(570, "development.build_to_rent_community", "Build-to-Rent Community", undefined, "development", [...landProfiles, ...residentialProfiles], ["development", "rental"], ["development", "ownership"], ["property_type", "purchase_price", "development_costs", "scheduled_income_monthly"], ["unit_count"], incomeOutputs, leverageOutputs, "expert", "long", "exit_dependent", ["build to rent community"]),
  seed(580, "development.assemblage", "Assemblage", undefined, "development", landProfiles, ["development", "land_hold"], ["development", "acquisition"], ["property_type", "purchase_price", "lot_size"], ["development_costs"], ["loan_amount"], [], "expert", "medium", "exit_dependent", ["assemblage"]),
  seed(590, "land.conservation_easement_evaluation", "Conservation Easement Evaluation", undefined, "land", landProfiles, ["land_hold"], ["acquisition", "tax_planning"], ["property_type", "purchase_price", "lot_size"], ["taxes"], ["loan_amount"], [], "expert", "long", "illiquid", ["conservation easement"]),
  seed(600, "distressed.reo", "REO", undefined, "distressed", [...residentialProfiles, ...multifamilyProfiles, ...commercialProfiles], ["rental", "commercial_income", "flip"], ["acquisition"], ["property_type", "purchase_price", "initial_repairs"], ["taxes", "insurance"], ["loan_amount"], incomeOutputs, "high", "short", "exit_dependent", ["reo"]),
  seed(610, "distressed.foreclosure", "Foreclosure", undefined, "distressed", [...residentialProfiles, ...multifamilyProfiles, ...commercialProfiles], ["rental", "commercial_income", "flip"], ["acquisition"], ["property_type", "purchase_price", "initial_repairs"], ["taxes", "insurance"], ["loan_amount"], incomeOutputs, "expert", "short", "exit_dependent", ["foreclosure"]),
  seed(620, "distressed.tax_sale", "Tax Sale", undefined, "distressed", [...residentialProfiles, ...landProfiles], ["land_hold", "rental"], ["acquisition"], ["property_type", "purchase_price", "taxes"], ["insurance"], ["loan_amount"], [], "expert", "variable", "illiquid", ["tax sale"]),
  seed(630, "distressed.probate_estate", "Probate or Estate", undefined, "distressed", [...residentialProfiles, ...landProfiles], ["rental", "owner_occupied", "land_hold"], ["acquisition"], ["property_type", "purchase_price"], ["taxes", "insurance"], ["loan_amount"], incomeOutputs, "high", "variable", "exit_dependent", ["probate", "estate"]),
  seed(640, "distressed.short_sale", "Short Sale", undefined, "distressed", residentialProfiles, ["rental", "owner_occupied"], ["acquisition"], ["property_type", "purchase_price"], ["taxes", "insurance"], ["loan_amount"], incomeOutputs, "high", "variable", "exit_dependent", ["short sale"]),
  seed(650, "distressed.distressed_note", "Distressed Note", undefined, "distressed", [...residentialProfiles, ...multifamilyProfiles, ...commercialProfiles], ["unknown"], ["acquisition"], ["property_type", "purchase_price"], ["loan_amount"], ["loan_to_value_ratio"], [], "expert", "variable", "illiquid", ["distressed note"]),
  seed(660, "portfolio_or_partnership.joint_venture", "Joint Venture", "JV", "portfolio_or_partnership", [...residentialProfiles, ...multifamilyProfiles, ...commercialProfiles, ...specialtyProfiles], ["rental", "commercial_income", "development"], ["partnership", "acquisition"], ["property_type", "purchase_price"], financingInputs, incomeOutputs, leverageOutputs, "high", "variable", "illiquid", ["joint_venture", "joint venture", "equity_partner"]),
  seed(670, "tax_or_exchange.1031_replacement_evaluation", "1031 Replacement Evaluation", "1031", "tax_or_exchange", [...residentialProfiles, ...multifamilyProfiles, ...commercialProfiles, ...specialtyProfiles, ...landProfiles], ["rental", "commercial_income", "land_hold"], ["tax_planning", "acquisition"], ["property_type", "purchase_price"], ["loan_amount"], incomeOutputs, leverageOutputs, "expert", "long", "illiquid", ["exchange_1031", "1031 exchange", "1031 replacement"]),
  seed(680, "tax_or_exchange.opportunity_zone_evaluation", "Opportunity-Zone Evaluation", "OZ", "tax_or_exchange", [...commercialProfiles, ...multifamilyProfiles, ...landProfiles], ["development", "commercial_income", "rental"], ["tax_planning", "development"], ["property_type", "purchase_price", "development_costs"], ["scheduled_income_monthly"], incomeOutputs, leverageOutputs, "expert", "long", "illiquid", ["opportunity zone"]),
  seed(690, "transaction.assumption_of_debt", "Assumption of Debt", undefined, "transaction_structure", [...residentialProfiles, ...commercialProfiles], ["rental", "commercial_income", "owner_occupied"], ["acquisition"], ["property_type", "purchase_price", "monthly_principal_interest"], ["loan_amount", "taxes", "insurance"], ["annual_debt_service", "debt_service_coverage_ratio"], ["loan_to_value_ratio"], "high", "variable", "moderate", ["assumable_financing", "assumption of debt"]),
  seed(700, "residential.long_term_rental", "Long-Term Rental", "LTR", "residential", residentialProfiles, ["rental"], ["acquisition", "ownership"], incomeInputs, financingInputs, incomeOutputs, leverageOutputs, "moderate", "long", "liquid_after_stabilization", [], "deprecated", "registered", "2026-07-01", "2026-07-31", { strategyId: "residential.long_term_rental", semanticVersion: "1.0.0" }, "0.9.0"),
  seed(710, "transaction.wrap", "Wrap Mortgage", "Wrap", "transaction_structure", residentialProfiles, ["rental", "owner_occupied"], ["acquisition"], ["property_type", "purchase_price", "monthly_principal_interest"], ["taxes", "insurance"], ["annual_debt_service"], ["loan_to_value_ratio"], "expert", "variable", "exit_dependent", [], "disabled", "registered", "2026-07-01", null, { strategyId: "transaction.wrap", semanticVersion: "1.0.0" }, "0.9.0"),
];

export const strategyDefinitions: readonly StrategyDefinition[] = Object.freeze(
  strategySeeds.map(materializeStrategy).sort(compareStrategyDefinitions),
);

const latestById = new Map<string, StrategyDefinition>();
const exactByKey = new Map<string, StrategyDefinition>();
for (const definition of strategyDefinitions) {
  exactByKey.set(versionKey(definition.strategyId, definition.semanticVersion), definition);
  const current = latestById.get(definition.strategyId);
  if (definition.lifecycleStatus === "active" && (!current || compareSemver(definition.semanticVersion, current.semanticVersion) > 0)) {
    latestById.set(definition.strategyId, definition);
  }
}

const ambiguousLegacyAliasCandidates: Record<string, string[]> = {
  commercial: ["commercial.stabilized_office", "commercial.retail", "commercial.industrial", "commercial.owner_user", "commercial.value_add"],
  hold: ["residential.buy_and_hold", "multifamily.stabilized_hold", "land.raw_land_hold"],
  land: ["land.raw_land_hold", "land.land_banking", "land.agricultural_hold", "development.entitlement"],
  rental: ["residential.long_term_rental", "residential.medium_term_rental", "residential.short_term_rental"],
};

export function listStrategyDefinitions(options: { includeUnavailable?: boolean } = {}) {
  const values = options.includeUnavailable ? strategyDefinitions : strategyDefinitions.filter(isEligibleForNewSelection);
  return [...values].sort(compareStrategyDefinitions);
}

export function resolveStrategyDefinition(strategyId: string, semanticVersion: string | "latest" = "latest") {
  if (!isValidPermanentStrategyId(strategyId)) {
    throw new StrategyRegistryError("invalid_strategy_id", "The strategy identifier is not a valid permanent strategy ID.");
  }
  if (semanticVersion === "latest") return resolveLatestActiveStrategyDefinition(strategyId);
  if (!isValidSemver(semanticVersion)) {
    throw new StrategyRegistryError("invalid_semantic_version", "The requested strategy version is not a valid semantic version.");
  }
  const definition = exactByKey.get(versionKey(strategyId, semanticVersion));
  if (!definition) throw new StrategyRegistryError("strategy_version_not_found", "The requested strategy version was not found.");
  return definition;
}

export function resolveLatestActiveStrategyDefinition(strategyId: string) {
  if (!isValidPermanentStrategyId(strategyId)) {
    throw new StrategyRegistryError("invalid_strategy_id", "The strategy identifier is not a valid permanent strategy ID.");
  }
  const definition = latestById.get(strategyId);
  if (!definition) throw new StrategyRegistryError("strategy_not_found", "No active strategy definition was found for that permanent ID.");
  return definition;
}

export function getStrategyLookup(strategyId: string, semanticVersion: string | "latest" = "latest"): StrategyLookupResult {
  const definition = resolveStrategyDefinition(strategyId, semanticVersion);
  return buildLookup(definition);
}

export function assertStrategySelectable(strategyId: string, semanticVersion: string | "latest" = "latest") {
  const lookup = getStrategyLookup(strategyId, semanticVersion);
  if (lookup.lifecycleStatus === "disabled") throw new StrategyRegistryError("strategy_disabled", lookup.safeUnavailableReason ?? "Strategy is disabled.");
  if (lookup.lifecycleStatus === "deprecated") throw new StrategyRegistryError("strategy_deprecated", lookup.safeUnavailableReason ?? "Strategy is deprecated.");
  if (!lookup.eligibleForNewSelection) throw new StrategyRegistryError("strategy_not_selection_ready", lookup.safeUnavailableReason ?? "Strategy is not ready for new selection.");
  return lookup;
}

export function listStrategiesByCategory(category: StrategyCategory, options: { includeUnavailable?: boolean } = {}) {
  return listStrategyDefinitions({ includeUnavailable: true }).filter((definition) => definition.category === category && (options.includeUnavailable || isEligibleForNewSelection(definition))).map(buildLookup);
}

export function listStrategiesByPropertyProfile(profile: UnderwritingPropertyProfile, options: { includeUnavailable?: boolean } = {}) {
  return listStrategyDefinitions({ includeUnavailable: true }).filter((definition) => definition.supportedPropertyProfiles.includes(profile) && (options.includeUnavailable || isEligibleForNewSelection(definition))).map(buildLookup);
}

export function listStrategiesBySupportStatus(status: StrategySupportStatus) {
  return strategyDefinitions.filter((definition) => definition.supportStatus === status).map(buildLookup).sort(compareLookups);
}

export function inspectHistoricalStrategyVersion(strategyId: string, semanticVersion: string) {
  return buildLookup(resolveStrategyDefinition(strategyId, semanticVersion));
}

export function identifyReplacementStrategy(strategyId: string, semanticVersion: string) {
  const definition = resolveStrategyDefinition(strategyId, semanticVersion);
  if (!definition.replacementStrategy) return null;
  return buildLookup(resolveStrategyDefinition(definition.replacementStrategy.strategyId, definition.replacementStrategy.semanticVersion));
}

export function loadStrategyDependencyMetadata(strategyId: string, semanticVersion: string | "latest" = "latest") {
  const definition = resolveStrategyDefinition(strategyId, semanticVersion);
  return {
    strategyId: definition.strategyId,
    semanticVersion: definition.semanticVersion,
    requiredCanonicalInputIds: [...definition.requiredCanonicalInputIds],
    optionalCanonicalInputIds: [...definition.optionalCanonicalInputIds],
    requiredUnderwritingOutputIds: [...definition.requiredUnderwritingOutputIds],
    optionalUnderwritingOutputIds: [...definition.optionalUnderwritingOutputIds],
    futureMarketDependencies: [...definition.futureMarketDependencies],
    futureFinancingDependencies: [...definition.futureFinancingDependencies],
    futureGovernanceLegalDependencies: [...definition.futureGovernanceLegalDependencies],
    futurePropertyConditionDependencies: [...definition.futurePropertyConditionDependencies],
    futureInvestorFitDependencies: [...definition.futureInvestorFitDependencies],
  };
}

export function resolveLegacyStrategyAlias(rawValue: string | null | undefined): StrategyAliasResolution {
  const raw = String(rawValue ?? "");
  const normalizedValue = normalizeAlias(raw);
  if (!normalizedValue) return { status: "unresolved", rawValue: raw, normalizedValue, safeMessage: "No strategy value was provided." };
  const exactDefinition = latestById.get(raw);
  if (exactDefinition) return { status: "exact", rawValue: raw, normalizedValue, strategyId: exactDefinition.strategyId, semanticVersion: exactDefinition.semanticVersion, definition: exactDefinition };
  const ambiguousCandidateIds = ambiguousLegacyAliasCandidates[normalizedValue];
  if (ambiguousCandidateIds) {
    return {
      status: "ambiguous",
      rawValue: raw,
      normalizedValue,
      candidates: ambiguousCandidateIds.map((strategyId) => buildLookup(resolveLatestActiveStrategyDefinition(strategyId))).sort(compareLookups),
      safeMessage: "This legacy strategy label matches more than one permanent strategy ID and requires review.",
    };
  }
  const matches = strategyDefinitions.filter((definition) => definition.aliases.map(normalizeAlias).includes(normalizedValue) && definition.lifecycleStatus === "active");
  const latestMatches = [...new Map(matches.map((definition) => [definition.strategyId, resolveLatestActiveStrategyDefinition(definition.strategyId)])).values()].sort(compareStrategyDefinitions);
  if (latestMatches.length === 1) {
    const definition = latestMatches[0];
    return { status: "exact", rawValue: raw, normalizedValue, strategyId: definition.strategyId, semanticVersion: definition.semanticVersion, definition };
  }
  if (latestMatches.length > 1) {
    return { status: "ambiguous", rawValue: raw, normalizedValue, candidates: latestMatches.map(buildLookup), safeMessage: "This legacy strategy label matches more than one permanent strategy ID and requires review." };
  }
  return { status: "unresolved", rawValue: raw, normalizedValue, safeMessage: "This legacy strategy label does not safely map to a permanent strategy ID." };
}

export function validateStrategyRegistry(definitions: readonly StrategyDefinition[] = strategyDefinitions): StrategyRegistryValidationResult {
  const errors: string[] = [];
  const exactKeys = new Set<string>();
  const ordinals = new Set<number>();
  const aliases = new Map<string, string>();
  const activeIds = new Set(definitions.filter((definition) => definition.lifecycleStatus === "active").map((definition) => definition.strategyId));
  const inputIds = new Set(listUnderwritingInputDefinitions().map((definition) => definition.inputId));
  const allowedProfiles: UnderwritingPropertyProfile[] = ["single_family", "condominium", "townhouse", "two_to_four_unit", "multifamily", "mixed_use", "office", "retail", "industrial", "warehouse", "self_storage", "hospitality", "mobile_home_park", "land", "special_purpose", "other_residential", "other_commercial", "unknown"];
  const allowedModes: UnderwritingMode[] = ["rental", "owner_occupied", "flip", "wholesale", "development", "land_hold", "commercial_income", "mixed_use_income", "unknown"];
  for (const definition of definitions) {
    const key = versionKey(definition.strategyId, definition.semanticVersion);
    if (!isValidPermanentStrategyId(definition.strategyId)) errors.push(`Invalid permanent strategy ID: ${definition.strategyId}.`);
    if (!isValidSemver(definition.semanticVersion)) errors.push(`Invalid semantic version for ${definition.strategyId}: ${definition.semanticVersion}.`);
    if (exactKeys.has(key)) errors.push(`Duplicate strategy ID/version: ${key}.`);
    exactKeys.add(key);
    if (ordinals.has(definition.stableOrdinal)) errors.push(`Duplicate stable ordinal: ${definition.stableOrdinal}.`);
    ordinals.add(definition.stableOrdinal);
    if (!definition.displayName || !definition.conciseDescription || !definition.detailedPurpose) errors.push(`Missing mandatory metadata for ${key}.`);
    if (definition.metadataHash !== computeStrategyMetadataHash(definition)) errors.push(`Metadata hash mismatch for ${key}.`);
    for (const profile of definition.supportedPropertyProfiles) if (!allowedProfiles.includes(profile)) errors.push(`Invalid Property profile reference ${profile} for ${key}.`);
    for (const mode of definition.supportedUnderwritingModes) if (!allowedModes.includes(mode)) errors.push(`Invalid underwriting mode reference ${mode} for ${key}.`);
    for (const inputId of [...definition.requiredCanonicalInputIds, ...definition.optionalCanonicalInputIds]) if (!inputIds.has(inputId)) errors.push(`Invalid underwriting input reference ${inputId} for ${key}.`);
    for (const formulaId of [...definition.requiredUnderwritingOutputIds, ...definition.optionalUnderwritingOutputIds]) if (!resolveFormulaDefinition(formulaId)) errors.push(`Invalid underwriting output reference ${formulaId} for ${key}.`);
    if (definition.supportStatus === "fully_supported" && (definition.requiredCanonicalInputIds.length === 0 || definition.requiredUnderwritingOutputIds.length === 0)) errors.push(`Fully supported strategy has incomplete dependencies: ${key}.`);
    if (definition.supportStatus === "registered" && definition.featureFlagRequirement === null) errors.push(`Registered-only strategy must remain gated: ${key}.`);
    for (const alias of definition.aliases) {
      const normalized = normalizeAlias(alias);
      if (!normalized) errors.push(`Blank alias for ${key}.`);
      const owner = aliases.get(normalized);
      if (owner && owner !== definition.strategyId) errors.push(`Duplicate alias ${normalized} on ${owner} and ${definition.strategyId}.`);
      aliases.set(normalized, definition.strategyId);
    }
    if (definition.replacementStrategy && !definitions.some((candidate) => candidate.strategyId === definition.replacementStrategy?.strategyId && candidate.semanticVersion === definition.replacementStrategy?.semanticVersion)) {
      errors.push(`Replacement strategy not found for ${key}.`);
    }
    if ((definition.lifecycleStatus === "deprecated" || definition.lifecycleStatus === "disabled") && !definition.replacementStrategy) errors.push(`Historical unavailable version lacks replacement reference: ${key}.`);
  }
  errors.push(...findCircularReplacements(definitions));
  const ordered = [...definitions].sort(compareStrategyDefinitions);
  if (ordered.some((definition, index) => definition !== definitions[index])) errors.push("Strategy registry is not stored in deterministic order.");
  return { valid: errors.length === 0, registryVersion: STRATEGY_REGISTRY_VERSION, contentHash: computeStrategyRegistryHash(definitions), definitionCount: definitions.length, errors };
}

export function assertValidStrategyRegistry(definitions: readonly StrategyDefinition[] = strategyDefinitions) {
  const validation = validateStrategyRegistry(definitions);
  if (!validation.valid) throw new StrategyRegistryError("registry_invalid", validation.errors.join(" "));
  return validation;
}

export function computeStrategyRegistryHash(definitions: readonly StrategyDefinition[] = strategyDefinitions) {
  return stableHash(definitions.map((definition) => ({ strategyId: definition.strategyId, semanticVersion: definition.semanticVersion, metadataHash: definition.metadataHash })).sort((a, b) => a.strategyId.localeCompare(b.strategyId) || compareSemver(a.semanticVersion, b.semanticVersion)));
}

export function computeStrategyMetadataHash(definition: Omit<StrategyDefinition, "metadataHash"> | StrategyDefinition) {
  return stableHash({
    strategyId: definition.strategyId,
    semanticVersion: definition.semanticVersion,
    category: definition.category,
    subcategory: definition.subcategory ?? null,
    supportedPropertyProfiles: sortedStrings(definition.supportedPropertyProfiles),
    supportedUnderwritingModes: sortedStrings(definition.supportedUnderwritingModes),
    supportedTransactionContexts: sortedStrings(definition.supportedTransactionContexts),
    jurisdictionScope: definition.jurisdictionScope,
    jurisdictionRestrictions: sortedStrings(definition.jurisdictionRestrictions),
    requiredUnderwritingOutputIds: sortedStrings(definition.requiredUnderwritingOutputIds),
    optionalUnderwritingOutputIds: sortedStrings(definition.optionalUnderwritingOutputIds),
    requiredCanonicalInputIds: sortedStrings(definition.requiredCanonicalInputIds),
    optionalCanonicalInputIds: sortedStrings(definition.optionalCanonicalInputIds),
    futureMarketDependencies: sortedStrings(definition.futureMarketDependencies),
    futureFinancingDependencies: sortedStrings(definition.futureFinancingDependencies),
    futureGovernanceLegalDependencies: sortedStrings(definition.futureGovernanceLegalDependencies),
    futurePropertyConditionDependencies: sortedStrings(definition.futurePropertyConditionDependencies),
    futureInvestorFitDependencies: sortedStrings(definition.futureInvestorFitDependencies),
    compatibilityContractVersion: definition.compatibilityContractVersion,
    disqualifierContractVersion: definition.disqualifierContractVersion,
    scoringModelVersion: definition.scoringModelVersion,
    confidenceModelVersion: definition.confidenceModelVersion,
    explanationContractVersion: definition.explanationContractVersion,
    outputContractVersion: definition.outputContractVersion,
    relearnIqContentRef: definition.relearnIqContentRef,
    operatingBurden: definition.operatingBurden,
    timeHorizon: definition.timeHorizon,
    liquidityProfile: definition.liquidityProfile,
    capitalIntensity: definition.capitalIntensity,
    executionComplexity: definition.executionComplexity,
    lifecycleStatus: definition.lifecycleStatus,
    supportStatus: definition.supportStatus,
    featureFlagRequirement: definition.featureFlagRequirement,
    effectiveDate: definition.effectiveDate,
    deprecatedDate: definition.deprecatedDate,
    replacementStrategy: definition.replacementStrategy,
    stableOrdinal: definition.stableOrdinal,
  });
}

function seed(
  stableOrdinal: number,
  strategyId: string,
  displayName: string,
  shortName: string | undefined,
  category: StrategyCategory,
  supportedPropertyProfiles: UnderwritingPropertyProfile[],
  supportedUnderwritingModes: UnderwritingMode[],
  supportedTransactionContexts: StrategyTransactionContext[],
  requiredCanonicalInputIds: UnderwritingInputId[],
  optionalCanonicalInputIds: UnderwritingInputId[],
  requiredUnderwritingOutputIds: FormulaId[],
  optionalUnderwritingOutputIds: FormulaId[],
  operatingBurden: StrategyOperatingBurden,
  timeHorizon: StrategyTimeHorizon,
  liquidityProfile: StrategyLiquidityProfile,
  aliases: string[] = [],
  lifecycleStatus: StrategyLifecycleStatus = "active",
  supportStatus: StrategySupportStatus = "registered",
  effectiveDate = "2026-07-31",
  deprecatedDate: string | null = null,
  replacementStrategy: StrategyReplacementReference | null = null,
  semanticVersion = "1.0.0",
): StrategySeed {
  const futureDependencyBase = category === "tax_or_exchange" ? ["tax-professional-review"] : [];
  return {
    strategyId,
    semanticVersion,
    displayName,
    shortName,
    category,
    conciseDescription: `${displayName} is registered as a permanent Strategy Intelligence identity.`,
    detailedPurpose: `${displayName} preserves a stable strategy identity for future compatibility, requirements, scoring, confidence, education, and reporting contracts. This registry slice does not evaluate, rank, recommend, or calculate the strategy.`,
    supportedPropertyProfiles: sortedUnique(supportedPropertyProfiles),
    supportedUnderwritingModes: sortedUnique(supportedUnderwritingModes),
    supportedTransactionContexts: sortedUnique(supportedTransactionContexts),
    jurisdictionScope: category === "transaction_structure" || category === "tax_or_exchange" || category === "development" ? "local_specific" : "us",
    jurisdictionRestrictions: category === "transaction_structure" ? ["Requires local legal and financing review before future evaluation."] : [],
    requiredUnderwritingOutputIds: sortedUnique(requiredUnderwritingOutputIds),
    optionalUnderwritingOutputIds: sortedUnique(optionalUnderwritingOutputIds),
    requiredCanonicalInputIds: sortedUnique(requiredCanonicalInputIds),
    optionalCanonicalInputIds: sortedUnique(optionalCanonicalInputIds),
    futureMarketDependencies: ["market-liquidity", "rent-or-demand-support"],
    futureFinancingDependencies: category === "land" ? ["land-financing-availability"] : ["financing-terms"],
    futureGovernanceLegalDependencies: [...futureDependencyBase, ...(category === "development" ? ["zoning-and-entitlements"] : []), ...(category === "transaction_structure" ? ["legal-structure-review"] : [])],
    futurePropertyConditionDependencies: supportedTransactionContexts.includes("renovation") ? ["scope-and-condition-review"] : ["condition-risk-review"],
    futureInvestorFitDependencies: ["capital-position", "experience-level", "risk-profile", "time-horizon"],
    compatibilityContractVersion: STRATEGY_COMPATIBILITY_CONTRACT_VERSION_PENDING,
    disqualifierContractVersion: STRATEGY_DISQUALIFIER_CONTRACT_VERSION_PENDING,
    scoringModelVersion: STRATEGY_SCORING_MODEL_VERSION_PENDING,
    confidenceModelVersion: STRATEGY_CONFIDENCE_MODEL_VERSION_PENDING,
    explanationContractVersion: STRATEGY_EXPLANATION_CONTRACT_VERSION_PENDING,
    outputContractVersion: STRATEGY_OUTPUT_CONTRACT_VERSION_PENDING,
    relearnIqContentRef: { contentId: `relearniq.${strategyId}`, version: "pending", status: "pending" },
    operatingBurden,
    timeHorizon,
    liquidityProfile,
    capitalIntensity: operatingBurden === "expert" || operatingBurden === "high" ? "high" : "moderate",
    executionComplexity: operatingBurden,
    lifecycleStatus,
    supportStatus,
    featureFlagRequirement: supportStatus === "fully_supported" ? null : "strategy_intelligence_registry_only",
    effectiveDate,
    deprecatedDate,
    replacementStrategy,
    aliases: sortedUnique([displayName, shortName, strategyId, ...aliases].filter((value): value is string => Boolean(value))),
    stableOrdinal,
  };
}

function materializeStrategy(seedDefinition: StrategySeed): StrategyDefinition {
  const machineKey = seedDefinition.strategyId.replace(/\./g, "_");
  const base = { ...seedDefinition, registryVersion: STRATEGY_REGISTRY_VERSION as typeof STRATEGY_REGISTRY_VERSION, machineKey };
  return { ...base, metadataHash: computeStrategyMetadataHash(base) };
}

function buildLookup(definition: StrategyDefinition): StrategyLookupResult {
  const eligibleForNewSelection = isEligibleForNewSelection(definition);
  return {
    strategyId: definition.strategyId,
    semanticVersion: definition.semanticVersion,
    registryVersion: STRATEGY_REGISTRY_VERSION,
    lifecycleStatus: definition.lifecycleStatus,
    supportStatus: definition.supportStatus,
    eligibleForNewSelection,
    featureFlagRequirement: definition.featureFlagRequirement,
    safeUnavailableReason: eligibleForNewSelection ? null : unavailableReason(definition),
    definition,
  };
}

function isEligibleForNewSelection(definition: StrategyDefinition) {
  return definition.lifecycleStatus === "active" && definition.supportStatus !== "registered" && !definition.featureFlagRequirement;
}

function unavailableReason(definition: StrategyDefinition) {
  if (definition.lifecycleStatus === "disabled") return "This strategy version is disabled and cannot be selected for new evaluation.";
  if (definition.lifecycleStatus === "deprecated") return "This historical strategy version remains readable but is not available for new evaluation.";
  if (definition.lifecycleStatus === "draft") return "This strategy is not available outside controlled development.";
  if (definition.supportStatus === "registered") return "This strategy identity is registered, but future requirements, disqualifiers, calculations, risks, education, and acceptance fixtures are not complete.";
  if (definition.featureFlagRequirement) return "This strategy requires a server-controlled release gate before selection.";
  return "This strategy is unavailable for new selection.";
}

function compareStrategyDefinitions(a: StrategyDefinition, b: StrategyDefinition) {
  return a.stableOrdinal - b.stableOrdinal || a.strategyId.localeCompare(b.strategyId) || compareSemver(a.semanticVersion, b.semanticVersion);
}

function compareLookups(a: StrategyLookupResult, b: StrategyLookupResult) {
  return compareStrategyDefinitions(a.definition, b.definition);
}

function versionKey(strategyId: string, semanticVersion: string) {
  return `${strategyId}@${semanticVersion}`;
}

function isValidPermanentStrategyId(value: string) {
  return /^[a-z][a-z0-9_]*(\.[a-z0-9][a-z0-9_]*)+$/.test(value);
}

function isValidSemver(value: string) {
  return /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value);
}

function compareSemver(a: string, b: string) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function normalizeAlias(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function sortedUnique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function sortedStrings(values: readonly string[]) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function findCircularReplacements(definitions: readonly StrategyDefinition[]) {
  const errors: string[] = [];
  for (const definition of definitions) {
    const seen = new Set<string>();
    let current: StrategyDefinition | undefined = definition;
    while (current?.replacementStrategy) {
      const key = versionKey(current.strategyId, current.semanticVersion);
      if (seen.has(key)) {
        errors.push(`Circular replacement chain detected at ${key}.`);
        break;
      }
      seen.add(key);
      current = definitions.find((candidate) => candidate.strategyId === current?.replacementStrategy?.strategyId && candidate.semanticVersion === current?.replacementStrategy?.semanticVersion);
    }
  }
  return errors;
}

function stableHash(value: unknown) {
  const source = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `strat_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

assertValidStrategyRegistry();
