import { describe, expect, it } from "vitest";
import { analyzeDeal, type DealInput } from "@/lib/dealAnalysisEngine";
import { runStressTests } from "@/lib/stressTestingEngine";
import { evaluateDealStrategies } from "@/lib/strategyFitEngine";
import { defaultAcquisitionProfile, opportunityToDealInsert, rankOpportunities, sampleOpportunities } from "@/lib/findIQArchitecture";
import { sampleOfferStructures } from "@/lib/offerIQArchitecture";
import { healthTone, samplePipelineOpportunities } from "@/lib/pipelineIQArchitecture";
import { buildPortfolioSummary, equity, monthlyCashFlow, portfolioAssets } from "@/lib/portfolioIQArchitecture";
import { buildExplainableRecommendation } from "@/lib/aiIntelligenceLayer";
import { dataCategories, providerIndependenceRules } from "@/lib/providerDataArchitecture";
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

describe("BRIX operating system regression", () => {
  it("ranks FindIQ opportunities against the active acquisition profile without underwriting", () => {
    const ranked = rankOpportunities(defaultAcquisitionProfile, sampleOpportunities);

    expect(ranked).toHaveLength(4);
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
    expect(ranked[0].nextAction).toMatch(/DealIQ|Monitor|resolved/i);
    expect(ranked.some((item) => item.opportunityType === "Price Reduction")).toBe(true);

    const dealInsert = opportunityToDealInsert(ranked[0]);
    expect(dealInsert.property_address).toBe(ranked[0].address);
    expect(dealInsert.strategy_primary).toBe("Buy & Hold");
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
    expect(sampleOfferStructures).toHaveLength(3);
    expect(sampleOfferStructures.map((offer) => offer.financing)).toContain("Cash");
    expect(sampleOfferStructures.find((offer) => offer.label.includes("Protected"))?.strengths[0])
      .toMatch(/Protects downside/i);

    const dueDiligence = samplePipelineOpportunities.find((item) => item.stage === "Due Diligence");
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
});
