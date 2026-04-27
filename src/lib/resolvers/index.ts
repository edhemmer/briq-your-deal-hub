/**
 * BRIX v1.5.2 — Canonical Data Resolvers
 *
 * Single entry point for all data resolution pathways.
 * All resolvers normalize into SourcedValue objects that flow
 * through dataSourceLayer → normalizedDealState → engines → UI.
 */

export { getPropertyData, type PropertyDataInput, type ResolvedPropertyData } from "./propertyDataResolver";
export { getRentData, type RentDataInput, type ResolvedRentData } from "./rentDataResolver";
export { getFinancingData, type FinancingDataInput, type ResolvedFinancingData } from "./financingDataResolver";
