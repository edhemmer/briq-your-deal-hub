import { supabase } from "./supabase";
import { loadNearbyFeatures } from "./nearbyFeatures";

export type AreaFeatureKind =
  | "rail" | "freeway" | "majorRoad" | "industrial" | "powerLine" | "landfill" | "wastewater" | "airport"
  | "grocery" | "school" | "park";

export type NearestFeature = { distanceFt: number; name: string | null } | null;

export type AreaCheckResult = {
  location: { lat: number; lon: number; matchedAddress: string };
  nearest: Record<AreaFeatureKind, NearestFeature> | null;
  flood: { zone: string | null; subtype: string | null; highRisk: boolean; mapped: boolean } | null;
  sources: { geocoder: string; features: string; flood: string };
  checkedAt: string;
};

export type AreaFinding = {
  key: string;
  tone: "high" | "medium" | "good" | "info";
  title: string;
  detail: string;
};

export type AreaRead = {
  verdict: "clear" | "check" | "caution" | "partial";
  headline: string;
  findings: AreaFinding[];
};

export type AreaAddress = { address?: string; city?: string; state?: string; zip?: string };

/** One-line address for geocoding, or null when there isn't enough to place it on a map. */
export function areaQuery(deal: AreaAddress): string | null {
  const street = (deal.address ?? "").trim();
  if (!/\d/.test(street) || street.length < 5) return null;
  const zip = (deal.zip ?? "").trim().slice(0, 5);
  const cityState = [deal.city, deal.state].map((v) => (v ?? "").trim()).filter(Boolean).join(", ");
  if (!/^\d{5}$/.test(zip) && !cityState) return null;
  if (street.includes(",") && (zip && street.includes(zip))) return street;
  return [street, cityState, zip].filter(Boolean).join(", ");
}

const cache = new Map<string, Promise<AreaCheckResult | { error: string }>>();

export function loadAreaCheck(query: string | null): Promise<AreaCheckResult | { error: string } | null> {
  if (!query) return Promise.resolve(null);
  const key = query.toLowerCase();
  if (!cache.has(key)) {
    const pending = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(`area-check?address=${encodeURIComponent(query)}`, { method: "GET" });
        if (error) {
          const context = (error as { context?: Response }).context;
          const body = context && typeof context.json === "function" ? await context.json().catch(() => null) : null;
          return { error: typeof body?.error === "string" ? body.error : "Area check is unavailable right now." };
        }
        if (!data || typeof data !== "object" || "error" in data) return { error: String((data as { error?: string })?.error ?? "Area check is unavailable right now.") };
        const server = data as Omit<AreaCheckResult, "nearest" | "sources"> & { sources?: { geocoder?: string; flood?: string } };
        if (!server.location || typeof server.location.lat !== "number") return { error: "Area check is unavailable right now." };
        const nearest = await loadNearbyFeatures(server.location.lat, server.location.lon);
        return {
          location: server.location,
          flood: server.flood ?? null,
          nearest,
          sources: {
            geocoder: server.sources?.geocoder ?? "U.S. Census Bureau Geocoder",
            flood: server.sources?.flood ?? "unavailable",
            features: nearest ? "OpenStreetMap contributors (ODbL)" : "unavailable",
          },
          checkedAt: server.checkedAt ?? new Date().toISOString(),
        } satisfies AreaCheckResult;
      } catch {
        return { error: "Area check is unavailable right now." };
      }
    })();
    cache.set(key, pending);
    void pending.then((result) => { if ("error" in result || !result.nearest || !result.flood) cache.delete(key); });
  }
  return cache.get(key)!;
}

function distance(ft: number) {
  if (ft < 50) return "right next to it";
  if (ft < 1000) return `${Math.round(ft / 10) * 10} ft away`;
  const miles = ft / 5280;
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi away`;
}

function named(feature: NonNullable<NearestFeature>, fallback: string) {
  return feature.name ? `${fallback} (${feature.name})` : fallback;
}

/**
 * Deterministic read of the physical surroundings. Thresholds are distances where buyers and tenants
 * commonly notice noise, vibration, odor, safety or insurance effects. Physical features only.
 */
export function readArea(result: AreaCheckResult): AreaRead {
  const findings: AreaFinding[] = [];
  const n = result.nearest;

  if (result.flood?.mapped && result.flood.highRisk) {
    findings.push({
      key: "flood",
      tone: "high",
      title: `FEMA high-risk flood zone ${result.flood.zone ?? ""}`.trim(),
      detail: "Lenders require flood insurance here, often $1,000 to $3,000+ a year. Get a quote before you offer and add it to insurance.",
    });
  } else if (result.flood?.mapped && result.flood.zone) {
    const moderate = result.flood.subtype?.includes("0.2 PCT");
    findings.push({
      key: "flood",
      tone: moderate ? "info" : "good",
      title: moderate ? `Moderate flood risk (zone ${result.flood.zone}, 500-year)` : `Outside the high-risk flood zone (zone ${result.flood.zone})`,
      detail: moderate ? "Flood insurance usually isn't required, but it's cheap here and worth pricing." : "Flood insurance isn't required by lenders at this spot.",
    });
  } else if (result.flood && !result.flood.mapped) {
    findings.push({ key: "flood", tone: "info", title: "No FEMA flood map at this spot", detail: "Some areas aren't mapped. Check the county's flood map or ask the seller about water history." });
  }

  if (n) {
    if (n.rail) {
      const ft = n.rail.distanceFt;
      findings.push({
        key: "rail",
        tone: ft <= 500 ? "high" : "medium",
        title: `${named(n.rail, "Rail line")} ${distance(ft)}`,
        detail: ft <= 500 ? "Expect train noise, horns and vibration. Tenants notice; resale buyers discount it." : "Trains may be audible, especially at night. Listen for it if you visit.",
      });
    }
    if (n.freeway) {
      const ft = n.freeway.distanceFt;
      findings.push({
        key: "freeway",
        tone: ft <= 500 ? "high" : "medium",
        title: `${named(n.freeway, "Highway")} ${distance(ft)}`,
        detail: ft <= 500 ? "Constant traffic noise and exhaust this close. Good for commuters, hard on resale." : "Some highway noise is likely, depending on walls and trees between.",
      });
    }
    if (n.majorRoad) {
      const ft = n.majorRoad.distanceFt;
      const fronts = ft <= 120;
      findings.push({
        key: "majorRoad",
        tone: fronts ? "medium" : "info",
        title: fronts ? `On or next to a busy road${n.majorRoad.name ? ` (${n.majorRoad.name})` : ""}` : `${named(n.majorRoad, "Busy road")} ${distance(ft)}`,
        detail: fronts ? "Busy-road houses rent fine but sell for less and take longer to sell. Check driveway access and traffic at rush hour." : "Close to a main road; usually convenient, sometimes noisy.",
      });
    }
    if (n.industrial) {
      const ft = n.industrial.distanceFt;
      findings.push({
        key: "industrial",
        tone: ft <= 300 ? "high" : "medium",
        title: ft === 0 ? "Inside an industrial area" : `Industrial land ${distance(ft)}`,
        detail: "Can mean trucks, noise, odor or lights. Look at what's actually there on satellite view before you drive out.",
      });
    }
    if (n.powerLine) {
      findings.push({
        key: "powerLine",
        tone: "medium",
        title: `High-voltage power lines ${distance(n.powerLine.distanceFt)}`,
        detail: "Many buyers avoid homes near transmission lines, which can slow resale.",
      });
    }
    if (n.landfill) {
      findings.push({ key: "landfill", tone: n.landfill.distanceFt <= 2000 ? "high" : "medium", title: `Landfill ${distance(n.landfill.distanceFt)}`, detail: "Odor, trucks and resale drag are common complaints near landfills." });
    }
    if (n.wastewater) {
      findings.push({ key: "wastewater", tone: n.wastewater.distanceFt <= 2000 ? "high" : "medium", title: `Wastewater plant ${distance(n.wastewater.distanceFt)}`, detail: "Odor depends on wind; ask neighbors or visit on a warm day." });
    }
    if (n.airport) {
      findings.push({ key: "airport", tone: n.airport.distanceFt <= 10560 ? "medium" : "info", title: `${named(n.airport, "Airport")} ${distance(n.airport.distanceFt)}`, detail: "Check whether the house is under a flight path; noise varies a lot by direction." });
    }

    const nothingNearby = !n.rail && !n.freeway && !n.industrial && !n.powerLine && !n.landfill && !n.wastewater;
    if (nothingNearby) {
      findings.push({ key: "quiet", tone: "good", title: "No rail, highway, industrial land or power lines close by", detail: "Nothing in the usual noise-and-nuisance checks turned up within about a quarter mile." });
    }

    if (n.grocery) findings.push({ key: "grocery", tone: n.grocery.distanceFt <= 5280 ? "good" : "info", title: `${named(n.grocery, "Grocery store")} ${distance(n.grocery.distanceFt)}`, detail: "Daily convenience tenants look for." });
    else findings.push({ key: "grocery", tone: "info", title: "No supermarket within 1 mile", detail: "Normal in suburbs and rural areas; tenants will need a car." });
    if (n.school) findings.push({ key: "school", tone: "good", title: `${named(n.school, "School")} ${distance(n.school.distanceFt)}`, detail: "Check the school's rating; it drives family rental demand." });
    if (n.park) findings.push({ key: "park", tone: "good", title: `${named(n.park, "Park")} ${distance(n.park.distanceFt)}`, detail: "A plus for families and resale." });
  }

  const order = { high: 0, medium: 1, info: 2, good: 3 } as const;
  findings.sort((a, b) => order[a.tone] - order[b.tone]);
  const highs = findings.filter((f) => f.tone === "high").length;
  const mediums = findings.filter((f) => f.tone === "medium").length;
  const partial = !n || !result.flood;

  if (highs) {
    return { verdict: "caution", headline: highs === 1 ? "One big location issue to weigh before you drive out." : `${highs} big location issues to weigh before you drive out.`, findings };
  }
  if (mediums) {
    return { verdict: "check", headline: "Nothing deal-breaking, but check these when you look at it.", findings };
  }
  if (partial) {
    return { verdict: "partial", headline: "Part of the area check didn't load. What did load looks clear.", findings };
  }
  return { verdict: "clear", headline: "The location checks out. Worth a look in person.", findings };
}
