import { describe, expect, it } from "vitest";
import { areaQuery, readArea, type AreaCheckResult } from "../core/areaCheck";
import { summarizePhotos, type PhotoFinding } from "../core/photoCheck";
import { normalizeDealRecord } from "../core/store";

const empty = {
  rail: null, freeway: null, majorRoad: null, industrial: null, powerLine: null, landfill: null,
  wastewater: null, airport: null, grocery: null, school: null, park: null,
};

function result(overrides: Partial<AreaCheckResult> = {}): AreaCheckResult {
  return {
    location: { lat: 41.93, lon: -88.75, matchedAddress: "123 MAIN ST, DEKALB, IL, 60115" },
    nearest: { ...empty },
    flood: { zone: "X", subtype: "AREA OF MINIMAL FLOOD HAZARD", highRisk: false, mapped: true },
    sources: { geocoder: "Census", features: "OSM", flood: "FEMA" },
    checkedAt: "2026-11-19T12:00:00Z",
    ...overrides,
  };
}

describe("areaQuery", () => {
  it("builds a one-line address from deal fields", () => {
    expect(areaQuery({ address: "123 Main St", city: "DeKalb", state: "IL", zip: "60115" })).toBe("123 Main St, DeKalb, IL, 60115");
  });
  it("needs a street number and a city/state or ZIP", () => {
    expect(areaQuery({ address: "Main St", zip: "60115" })).toBeNull();
    expect(areaQuery({ address: "123 Main St" })).toBeNull();
    expect(areaQuery({ address: "123 Main St", zip: "60115" })).toBe("123 Main St, 60115");
  });
});

describe("readArea", () => {
  it("calls a quiet, unflooded location clear", () => {
    const read = readArea(result({ nearest: { ...empty, grocery: { distanceFt: 2600, name: "Jewel-Osco" }, park: { distanceFt: 900, name: null } } }));
    expect(read.verdict).toBe("clear");
    expect(read.findings.map((f) => f.key)).toEqual(expect.arrayContaining(["flood", "quiet", "grocery", "park"]));
    expect(read.findings.every((f) => f.tone === "good" || f.tone === "info")).toBe(true);
  });

  it("flags rail within 500 ft and a high-risk flood zone as caution, worst first", () => {
    const read = readArea(result({
      nearest: { ...empty, rail: { distanceFt: 320, name: "Union Pacific" }, majorRoad: { distanceFt: 60, name: "Lincoln Hwy" } },
      flood: { zone: "AE", subtype: null, highRisk: true, mapped: true },
    }));
    expect(read.verdict).toBe("caution");
    expect(read.headline).toMatch(/2 big location issues/);
    expect(read.findings[0].tone).toBe("high");
    const rail = read.findings.find((f) => f.key === "rail")!;
    expect(rail.title).toBe("Rail line (Union Pacific) 320 ft away");
    expect(read.findings.find((f) => f.key === "majorRoad")!.title).toMatch(/On or next to a busy road \(Lincoln Hwy\)/);
    expect(read.findings.some((f) => f.key === "quiet")).toBe(false);
  });

  it("treats moderate nuisances as check, not caution", () => {
    const read = readArea(result({ nearest: { ...empty, rail: { distanceFt: 1200, name: null }, powerLine: { distanceFt: 200, name: null } } }));
    expect(read.verdict).toBe("check");
  });

  it("reports a partial read when a source is missing", () => {
    const read = readArea(result({ nearest: null }));
    expect(read.verdict).toBe("partial");
    expect(readArea(result({ flood: null, nearest: { ...empty } })).verdict).toBe("partial");
  });

  it("shows miles for far features and marks the 500-year zone as info", () => {
    const read = readArea(result({
      nearest: { ...empty, airport: { distanceFt: 13200, name: "O'Hare" } },
      flood: { zone: "X", subtype: "0.2 PCT ANNUAL CHANCE FLOOD HAZARD", highRisk: false, mapped: true },
    }));
    expect(read.findings.find((f) => f.key === "airport")!.title).toBe("Airport (O'Hare) 2.5 mi away");
    expect(read.findings.find((f) => f.key === "flood")!.tone).toBe("info");
  });
});

function finding(rehab: PhotoFinding["rehab"], issues: PhotoFinding["observations"] = []): PhotoFinding {
  return { id: Math.random().toString(36), fileName: "a.jpg", area: "kitchen", condition: "fair", rehab, summary: "", observations: issues, checkedAt: "2026-11-19T12:00:00Z" };
}

describe("summarizePhotos", () => {
  it("returns null with no photos", () => {
    expect(summarizePhotos([], 1500, 0)).toBeNull();
  });

  it("sizes the rehab from square feet and warns when the budget is short", () => {
    const summary = summarizePhotos([finding("cosmetic"), finding("moderate", [{ issue: "Water stain", severity: "high", detail: "Ceiling stain" }])], 1500, 10000)!;
    expect(summary.scope).toBe("moderate");
    expect(summary.estimate).toEqual({ low: 38000, high: 75000 });
    expect(summary.budgetNote).toMatch(/below the moderate range/);
    expect(summary.topIssues[0].issue).toBe("Water stain");
  });

  it("does not let one heavy photo among many cosmetic ones call the whole house heavy", () => {
    const summary = summarizePhotos([finding("heavy"), finding("cosmetic"), finding("cosmetic"), finding("cosmetic")], 1200, 100000)!;
    expect(summary.scope).toBe("moderate");
    expect(summary.budgetNote).toBeNull();
  });

  it("asks for square feet when it can't price the scope", () => {
    const summary = summarizePhotos([finding("cosmetic")], undefined, 0)!;
    expect(summary.estimate).toBeNull();
    expect(summary.budgetNote).toMatch(/Add square feet/);
  });
});

describe("photo findings persistence", () => {
  it("keeps valid saved findings when a deal is normalized", () => {
    const deal = normalizeDealRecord({
      id: "d1",
      name: "Test",
      photoFindings: [finding("cosmetic"), { bogus: true }],
    } as never);
    expect(deal.photoFindings).toHaveLength(1);
    expect(deal.photoFindings?.[0].rehab).toBe("cosmetic");
  });
});

import { nearestFromElements, overpassQuery } from "../core/nearbyFeatures";

describe("nearestFromElements", () => {
  const home = { lat: 41.9304, lon: -88.7532 };
  it("measures distance to the nearest point on a line, not its vertices", () => {
    // A rail line running east-west 0.001 deg (about 111 m / 365 ft) north of the house, with far-apart vertices.
    const nearest = nearestFromElements(home, [
      { type: "way", tags: { railway: "rail", name: "UP Geneva Subdivision" }, geometry: [{ lat: 41.9314, lon: -88.80 }, { lat: 41.9314, lon: -88.70 }] },
    ]);
    expect(nearest.rail?.name).toBe("UP Geneva Subdivision");
    expect(nearest.rail!.distanceFt).toBeGreaterThan(355);
    expect(nearest.rail!.distanceFt).toBeLessThan(375);
  });
  it("returns zero inside an industrial polygon and keeps the closest of each kind", () => {
    const square = [
      { lat: 41.929, lon: -88.755 }, { lat: 41.929, lon: -88.751 }, { lat: 41.932, lon: -88.751 }, { lat: 41.932, lon: -88.755 }, { lat: 41.929, lon: -88.755 },
    ];
    const nearest = nearestFromElements(home, [
      { type: "way", tags: { landuse: "industrial" }, geometry: square },
      { type: "node", tags: { shop: "supermarket", name: "Far" }, lat: 41.95, lon: -88.7532 },
      { type: "node", tags: { shop: "supermarket", name: "Near" }, lat: 41.932, lon: -88.7532 },
      { type: "node", tags: { amenity: "cafe" }, lat: 41.9304, lon: -88.7532 },
    ]);
    expect(nearest.industrial?.distanceFt).toBe(0);
    expect(nearest.grocery?.name).toBe("Near");
    expect(nearest.park).toBeNull();
  });
  it("builds a query that asks only for physical features", () => {
    const q = overpassQuery(41.9304, -88.7532);
    expect(q).toContain('["railway"~"^(rail|light_rail)$"]');
    expect(q).toContain("out tags geom qt;");
  });
});
