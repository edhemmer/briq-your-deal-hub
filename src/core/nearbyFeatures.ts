import type { AreaFeatureKind, NearestFeature } from "./areaCheck";

// Nearby physical features from OpenStreetMap (c) OpenStreetMap contributors, ODbL.
// The public Overpass API is meant for browser-based tools, so this runs in the user's browser.

type Point = { lat: number; lon: number };
type OsmElement = {
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  geometry?: Point[];
  members?: { geometry?: Point[] }[];
  tags?: Record<string, string>;
};

const FT_PER_M = 3.28084;
const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
const CACHE_PREFIX = "brix.area.osm.v1:";
const CACHE_DAYS = 30;

// Search radius in meters. Anything farther does not change the read.
export const RADIUS_M: Record<AreaFeatureKind, number> = {
  rail: 460,
  freeway: 310,
  majorRoad: 95,
  industrial: 310,
  powerLine: 95,
  landfill: 1610,
  wastewater: 1610,
  airport: 4830,
  grocery: 1610,
  school: 1610,
  park: 805,
};

export function overpassQuery(lat: number, lon: number) {
  const at = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  return `[out:json][timeout:20];
(
  way(around:${RADIUS_M.rail},${at})["railway"~"^(rail|light_rail)$"]["service"!~"^(yard|spur|siding|crossover)$"];
  way(around:${RADIUS_M.freeway},${at})["highway"~"^(motorway|trunk)$"];
  way(around:${RADIUS_M.majorRoad},${at})["highway"~"^(primary|secondary)$"];
  nwr(around:${RADIUS_M.industrial},${at})["landuse"="industrial"];
  way(around:${RADIUS_M.powerLine},${at})["power"="line"];
  nwr(around:${RADIUS_M.landfill},${at})["landuse"="landfill"];
  nwr(around:${RADIUS_M.wastewater},${at})["man_made"="wastewater_plant"];
  nwr(around:${RADIUS_M.airport},${at})["aeroway"="aerodrome"]["iata"];
  nwr(around:${RADIUS_M.grocery},${at})["shop"="supermarket"];
  nwr(around:${RADIUS_M.school},${at})["amenity"="school"];
  nwr(around:${RADIUS_M.park},${at})["leisure"="park"];
);
out tags geom qt;`;
}

export function emptyNearest(): Record<AreaFeatureKind, NearestFeature> {
  return { rail: null, freeway: null, majorRoad: null, industrial: null, powerLine: null, landfill: null, wastewater: null, airport: null, grocery: null, school: null, park: null };
}

export function classifyOsm(t: Record<string, string>): AreaFeatureKind | null {
  if (t.railway === "rail" || t.railway === "light_rail") return "rail";
  if (t.highway === "motorway" || t.highway === "trunk") return "freeway";
  if (t.highway === "primary" || t.highway === "secondary") return "majorRoad";
  if (t.landuse === "industrial") return "industrial";
  if (t.power === "line") return "powerLine";
  if (t.landuse === "landfill") return "landfill";
  if (t.man_made === "wastewater_plant") return "wastewater";
  if (t.aeroway === "aerodrome") return "airport";
  if (t.shop === "supermarket") return "grocery";
  if (t.amenity === "school") return "school";
  if (t.leisure === "park") return "park";
  return null;
}

/** Nearest feature of each kind, in feet, from raw Overpass elements. */
export function nearestFromElements(origin: Point, elements: OsmElement[]): Record<AreaFeatureKind, NearestFeature> {
  const nearest = emptyNearest();
  for (const el of elements) {
    const tags = el.tags ?? {};
    const kind = classifyOsm(tags);
    if (!kind) continue;
    const meters = distanceTo(origin, el);
    if (meters === null) continue;
    const feet = Math.round(meters * FT_PER_M);
    const current = nearest[kind];
    if (!current || feet < current.distanceFt) nearest[kind] = { distanceFt: feet, name: tags.name ?? tags.ref ?? tags.operator ?? null };
  }
  return nearest;
}

export function distanceTo(origin: Point, el: OsmElement): number | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") return haversine(origin, { lat: el.lat, lon: el.lon });
  const lines: Point[][] = [];
  if (el.geometry?.length) lines.push(el.geometry);
  for (const member of el.members ?? []) if (member.geometry?.length) lines.push(member.geometry);
  if (!lines.length) return null;
  let best = Infinity;
  for (const line of lines) {
    if (line.length === 1) {
      best = Math.min(best, haversine(origin, line[0]));
      continue;
    }
    if (isClosed(line) && pointInPolygon(origin, line)) return 0;
    for (let i = 1; i < line.length; i++) best = Math.min(best, segmentDistance(origin, line[i - 1], line[i]));
  }
  return Number.isFinite(best) ? best : null;
}

function isClosed(line: Point[]) {
  const a = line[0];
  const b = line[line.length - 1];
  return line.length > 3 && a.lat === b.lat && a.lon === b.lon;
}

function pointInPolygon(p: Point, ring: Point[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i];
    const b = ring[j];
    if ((a.lat > p.lat) !== (b.lat > p.lat) && p.lon < ((b.lon - a.lon) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lon) inside = !inside;
  }
  return inside;
}

// Local equirectangular projection; well under 1% error at these distances.
function segmentDistance(p: Point, a: Point, b: Point) {
  const k = Math.cos((p.lat * Math.PI) / 180);
  const R = 6371000;
  const ax = (((a.lon - p.lon) * Math.PI) / 180) * k * R;
  const ay = (((a.lat - p.lat) * Math.PI) / 180) * R;
  const bx = (((b.lon - p.lon) * Math.PI) / 180) * k * R;
  const by = (((b.lat - p.lat) * Math.PI) / 180) * R;
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len));
  return Math.hypot(ax + t * dx, ay + t * dy);
}

export function haversine(a: Point, b: Point) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function cacheKey(lat: number, lon: number) {
  return `${CACHE_PREFIX}${lat.toFixed(5)},${lon.toFixed(5)}`;
}

function readCache(key: string): Record<AreaFeatureKind, NearestFeature> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; nearest: Record<AreaFeatureKind, NearestFeature> };
    if (!parsed?.nearest || Date.now() - parsed.at > CACHE_DAYS * 86400000) return null;
    return parsed.nearest;
  } catch {
    return null;
  }
}

function writeCache(key: string, nearest: Record<AreaFeatureKind, NearestFeature>) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ at: Date.now(), nearest }));
  } catch {
    // Storage can be full or blocked; the check still works without the cache.
  }
}

/** Looks up nearby features from the browser. Returns null when every public endpoint is busy. */
export async function loadNearbyFeatures(lat: number, lon: number): Promise<Record<AreaFeatureKind, NearestFeature> | null> {
  const key = cacheKey(lat, lon);
  const cached = readCache(key);
  if (cached) return cached;
  const body = `data=${encodeURIComponent(overpassQuery(lat, lon))}`;
  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(25000),
      });
      if (!response.ok) continue;
      const data = (await response.json()) as { elements?: OsmElement[] };
      const nearest = nearestFromElements({ lat, lon }, data.elements ?? []);
      writeCache(key, nearest);
      return nearest;
    } catch {
      // Busy or unreachable; try the next public endpoint.
    }
  }
  return null;
}
