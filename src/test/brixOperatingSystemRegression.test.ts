import { describe, expect, it } from "vitest";
import { analyzeDeal, type DealInput } from "@/lib/dealAnalysisEngine";
import { runStressTests } from "@/lib/stressTestingEngine";
import { evaluateDealStrategies } from "@/lib/strategyFitEngine";
import { defaultAcquisitionProfile, opportunityToDealInsert, rankOpportunities, type FindIQOpportunity } from "@/lib/findIQArchitecture";
import { regressionOfferStructures } from "@/lib/offerIQArchitecture";
import { healthTone, regressionPipelineOpportunities } from "@/lib/pipelineIQArchitecture";
import { buildPortfolioSummary, equity, monthlyCashFlow, portfolioAssets } from "@/lib/portfolioIQArchitecture";
import { buildExplainableRecommendation } from "@/lib/aiIntelligenceLayer";
import { dataCategories, providerIndependenceRules } from "@/lib/providerDataArchitecture";
import { findIQProviderAdapters, hasConfiguredFindIQProvider } from "@/lib/findIQProviderAdapters";
import { coreDataModelRules, coreEntities } from "@/lib/coreDataModel";

const baseDeal: DealInput = {
  purchase_price: 240000,
  closing_costs: 7200,
  rehab_cost: 18000,
  rehab_contingency: 1800,
  down_payment_percent: 0.25,
  interest_rate: 0.0675,
  loan_term_years: 30,
  monthly_rent: 2750,
  other_income: 0,
  taxes: 5200,
  insurance: 1900,
  maintenance_percent: 0.08,
  vacancy_percent: 0.06,
  management_percent: 0.08,
  capex_percent: 0.05,
  arv: 315000,
};

const testOpportunities: FindIQOpportunity[] = [
  {
    id: "test-opportunity-one",
    photoUrl: "",
    address: "Test Opportunity One",
    city: "Test Market",
    state: "TS",
    zip: "00001",
    propertyType: "Single Family",
    opportunityType: "Active Listing",
    listPrice: 240000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1600,
    lotSize: "0.20 ac",
    garage: true,
    estimatedAnnualTaxes: 5200,
    daysOnMarket: 18,
    rentalPotential: "moderate",
    resalePotential: "strong",
    valueAddSignals: ["Cosmetic refresh", "Garage"],
    risks: ["Rent support requires verification"],
    missingData: ["Insurance quote"],
    providerSignals: ["user_entered"],
  },
  {
    id: "test-opportunity-two",
    photoUrl: "",
    address: "Test Opportunity Two",
    city: "Test Market",
    state: "TS",
    zip: "00002",
    propertyType: "Single Family",
    opportunityType: "Price Reduction",
    listPrice: 225000,
    bedrooms: 3,
    bathrooms: 1.5,
    squareFeet: 1450,
    lotSize: "0.18 ac",
    garage: true,
    estimatedAnnualTaxes: 6400,
    daysOnMarket: 42,
    rentalPotential: "strong",
    resalePotential: "moderate",
    valueAddSignals: ["Rental demand signal"],
    risks: ["Taxes above preference"],
    missingData: ["Rent comps"],
    providerSignals: ["uploaded_document"],
  },
];

describe("BRIX operating system regression", () => {
  it("ranks FindIQ opportunities against the active acquisition profile without underwriting", () => {
    const ranked = rankOpportunities(
      { ...defaultAcquisitionProfile, markets: ["Test Market"] },
      testOpportunities,
    );

    expect(ranked).toHaveLength(2);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked[0].nextAction).toMatch(/DealIQ|Monitor|resolved/i);
    expect(ranked.some((item) => item.opportunityType === "Price Reduction")).toBe(true);

    const dealInsert = opportunityToDealInsert(ranked[0]);
    expect(dealInsert.property_address).toBe(ranked[0].address);
    expect(dealInsert.strategy_primary).toBe("Buy & Hold");
  });

  it("penalizes FindIQ opportunities with location friction before a wasted site visit", () => {
    const [cleanOpportunity] = testOpportunities;
    const busyRoadOpportunity: FindIQOpportunity = {
      ...cleanOpportunity,
      id: "busy-road-opportunity",
      address: "101 Test Route",
      risks: [
        ...cleanOpportunity.risks,
        "Location access concern: listing text suggests busy-road or traffic-noise exposure. Verify street context before visiting.",
      ],
    };

    const ranked = rankOpportunities(
      { ...defaultAcquisitionProfile, markets: ["Test Market"] },
      [cleanOpportunity, busyRoadOpportunity],
    );

    const clean = ranked.find((item) => item.id === cleanOpportunity.id);
    const busyRoad = ranked.find((item) => item.id === busyRoadOpportunity.id);

    expect(clean?.score).toBeGreaterThan(busyRoad?.score ?? 100);
    expect(busyRoad?.risks.join(" ")).toMatch(/busy-road|traffic-noise|street context/i);
  });

  it("keeps DealIQ strategy and stress scenario outputs directionally sane", () => {
    const analysis = analyzeDeal(baseDeal);
    const stress = runStressTests(baseDeal, analysis);
    const strategyFit = evaluateDealStrategies({
      purchasePrice: baseDeal.purchase_price,
      rehabCost: baseDeal.rehab_cost,
      arv: baseDeal.arv,
      projectedRent: baseDeal.monthly_rent,
      cashFlowMonthly: analysis.metrics.monthly_cashflow,
      capRate: analysis.metrics.cap_rate,
      cashOnCashReturn: analysis.metrics.cash_on_cash,
      rentTrend: 4,
      priceTrend: 5,
      inventoryTrend: 3.5,
      crimeScore: 3,
    });

    expect(analysis.metrics.monthly_cashflow).toBeGreaterThan(0);
    expect(analysis.metrics.dscr).toBeGreaterThan(1);
    expect(stress.scenarios).toHaveLength(10);
    expect(stress.scenarios.find((item) => item.scenario.id === "rent_10")?.stressed.monthly_cashflow)
      .toBeLessThan(analysis.metrics.monthly_cashflow);
    expect(strategyFit.longTermRental.score).toBeGreaterThan(60);
    expect(strategyFit.fixFlip.score).toBeGreaterThan(50);
  });

  it("flags weak strategies and fragile scenarios when assumptions deteriorate", () => {
    const weakDeal: DealInput = {
      ...baseDeal,
      purchase_price: 455000,
      monthly_rent: 1350,
      taxes: 7000,
      insurance: 3200,
      rehab_cost: 45000,
      rehab_contingency: 4500,
      arv: 452000,
      interest_rate: 0.0825,
    };
    const analysis = analyzeDeal(weakDeal);
    const stress = runStressTests(weakDeal, analysis);
    const strategyFit = evaluateDealStrategies({
      purchasePrice: weakDeal.purchase_price,
      rehabCost: weakDeal.rehab_cost,
      arv: weakDeal.arv,
      projectedRent: weakDeal.monthly_rent,
      cashFlowMonthly: analysis.metrics.monthly_cashflow,
      capRate: analysis.metrics.cap_rate,
      cashOnCashReturn: analysis.metrics.cash_on_cash,
      rentTrend: -1,
      priceTrend: -2,
      inventoryTrend: 8,
      crimeScore: 7.5,
    });

    expect(analysis.metrics.monthly_cashflow).toBeLessThan(0);
    expect(stress.resilience).toBe("Fragile");
    expect(strategyFit.longTermRental.disqualifiers).toContain("Negative monthly cash flow");
    expect(strategyFit.fixFlip.disqualifiers).toContain("Thin ARV spread");
  });

  it("compares OfferIQ structures and preserves PipelineIQ execution health signals", () => {
    expect(regressionOfferStructures).toHaveLength(3);
    expect(regressionOfferStructures.map((offer) => offer.financing)).toContain("Cash");
    expect(regressionOfferStructures.find((offer) => offer.label.includes("Protected"))?.strengths[0])
      .toMatch(/Protects downside/i);

    const dueDiligence = regressionPipelineOpportunities.find((item) => item.stage === "Due Diligence");
    expect(dueDiligence?.tasks.filter((task) => task.status !== "Done").length).toBeGreaterThan(0);
    expect(healthTone(dueDiligence?.healthScore ?? 0)).toBe("At Risk");
  });

  it("calculates PortfolioIQ value, equity, cash flow, and health summaries", () => {
    const summary = buildPortfolioSummary(portfolioAssets);
    const vacantAsset = portfolioAssets.find((asset) => asset.status === "Vacant");

    expect(summary.totalAssetValue).toBeGreaterThan(summary.totalDebt);
    expect(summary.totalEquity).toBe(summary.totalAssetValue - summary.totalDebt);
    expect(vacantAsset).toBeDefined();
    expect(monthlyCashFlow(vacantAsset!)).toBeLessThan(0);
    expect(equity(portfolioAssets[0])).toBeGreaterThan(0);
  });

  it("enforces AI explainability, provider independence, and shared core data model contracts", () => {
    const rec = buildExplainableRecommendation({
      module: "DealIQ",
      recommendation: "Consider",
      confidenceScore: 187,
      supportingFactors: [],
      risks: [],
      assumptions: [],
      alternativeStrategies: [],
    });

    expect(rec.confidenceScore).toBe(100);
    expect(rec.supportingFactors[0]).toMatch(/Insufficient/i);
    expect(providerIndependenceRules.some((rule) => rule.includes("never communicate directly"))).toBe(true);
    expect(dataCategories["Rental Data"]).toContain("Rent Estimates");
    expect(coreEntities.map((entity) => entity.entity)).toContain("AcquisitionProfile");
    expect(coreDataModelRules).toContain("Web and iOS consume the same APIs and data model.");
  });

  it("keeps FindIQ ready for paid listing providers without requiring one for manual entry", async () => {
    expect(hasConfiguredFindIQProvider()).toBe(false);
    expect(findIQProviderAdapters.map((adapter) => adapter.providerName)).toEqual([
      "RentCast",
      "ATTOM",
      "Authorized MLS Feed",
    ]);

    const result = await findIQProviderAdapters[0].search({ location: "Sandwich IL", budgetMax: 250000 });
    expect(result.opportunities).toEqual([]);
    expect(result.sourceQuality).toBe("unavailable");
    expect(result.message).toMatch(/credentials|ready/i);
  });
});
