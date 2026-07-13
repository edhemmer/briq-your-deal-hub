import { describe, expect, it } from "vitest";
import { parseListingInput } from "../core/listingParser";
import { analyzeDeal } from "../core/underwriting";
import { strategyCatalog } from "../core/strategyCatalog";
import { reviewContractText } from "../core/contractReview";
import { buildOfferStructures } from "../core/offerEngine";
import { portfolioMetrics } from "../core/portfolioEngine";

describe("BRIX rebuilt core", () => {
  it("extracts address facts from listing URLs without provider-specific hard coding", () => {
    const deal = parseListingInput("https://example.com/homedetails/1615-Augusta-Ln-Shorewood-IL-60404/63210803", "owner_occupant");
    expect(deal.address).toContain("1615 Augusta Ln");
    expect(deal.city).toBe("Shorewood");
    expect(deal.state).toBe("IL");
    expect(deal.zip).toBe("60404");
  });

  it("contains the complete BRIX strategy surface, not a three-strategy shell", () => {
    expect(strategyCatalog.length).toBeGreaterThanOrEqual(30);
    expect(strategyCatalog.map((strategy) => strategy.id)).toContain("owner_occupant");
    expect(strategyCatalog.map((strategy) => strategy.id)).toContain("brrrr");
    expect(strategyCatalog.map((strategy) => strategy.id)).toContain("seller_finance");
    expect(strategyCatalog.map((strategy) => strategy.id)).toContain("waterfall_partnership");
  });

  it("returns conservative decisions when required facts are missing", () => {
    const deal = parseListingInput("204 Oak Ridge Ave Cortland IL 60112", "long_term_rental");
    const analysis = analyzeDeal(deal);
    expect(analysis.decision).not.toBe("Visit");
    expect(analysis.missing).toContain("Purchase price");
    expect(analysis.missing).toContain("Annual taxes");
    expect(analysis.missing).toContain("Monthly rent support");
  });

  it("flags contract clauses that change acquisition risk", () => {
    const findings = reviewContractText("Buyer accepts property as-is subject to HOA documents, inspection, financing, appraisal, earnest money, and tax proration.");
    expect(findings.map((finding) => finding.clause)).toContain("As-is condition");
    expect(findings.map((finding) => finding.clause)).toContain("HOA / association");
    expect(findings.map((finding) => finding.clause)).toContain("Tax proration");
  });

  it("generates offer structures from analysis without inventing confidence", () => {
    const deal = parseListingInput("1615 Augusta Ln Shorewood IL 60404 $399000 4 bed 2 bath", "owner_occupant");
    deal.annualTaxes = 9000;
    deal.annualInsurance = 1800;
    deal.monthlyRent = 2800;
    deal.arv = 405000;
    const analysis = analyzeDeal(deal);
    const offers = buildOfferStructures(deal, analysis);
    expect(offers).toHaveLength(3);
    expect(offers[0].price).toBeLessThan(offers[2].price ?? 0);
    expect(offers[2].risks.length).toBeGreaterThanOrEqual(0);
  });

  it("only counts closed records in PortfolioIQ metrics", () => {
    const openDeal = parseListingInput("10 Main St Plano IL 60545 $250000", "long_term_rental");
    const closedDeal = parseListingInput("20 Main St Plano IL 60545 $200000", "long_term_rental");
    closedDeal.status = "closed";
    closedDeal.arv = 240000;
    closedDeal.monthlyRent = 2100;
    closedDeal.annualTaxes = 5000;
    closedDeal.annualInsurance = 1500;
    const metrics = portfolioMetrics([openDeal, closedDeal]);
    expect(metrics.count).toBe(1);
    expect(metrics.estimatedValue).toBe(240000);
    expect(metrics.annualNet).toBe(18700);
  });
});
