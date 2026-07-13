import { describe, expect, it } from "vitest";
import { parseListingInput } from "../core/listingParser";
import { analyzeDeal } from "../core/underwriting";
import { strategyCatalog } from "../core/strategyCatalog";

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
});
