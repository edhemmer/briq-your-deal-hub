/**
 * BRIX v1.9.0 — Property Conflict Detector
 *
 * Detects meaningful disagreements between available source values.
 * Conflicts are informational — they do not block analysis.
 */

import type { RawPropertyData, SourcedField } from "./propertyDataSources";

export type ConflictSeverity = "high" | "medium" | "low";

export interface PropertyConflict {
  field: string;
  values: { source: string; value: number }[];
  severity: ConflictSeverity;
}

const RENT_MATERIAL_THRESHOLD = 0.10;  // 10% difference
const PRICE_MATERIAL_THRESHOLD = 0.05; // 5% difference
const TAX_MATERIAL_THRESHOLD = 0.15;   // 15% difference

function percentDiff(a: number, b: number): number {
  const avg = (a + b) / 2;
  if (avg === 0) return 0;
  return Math.abs(a - b) / avg;
}

/**
 * Detect conflicts in raw property data.
 * Returns an array of detected conflicts (may be empty).
 */
export function detectPropertyConflicts(raw: RawPropertyData): PropertyConflict[] {
  const conflicts: PropertyConflict[] = [];

  // Rent conflict: user vs estimate
  if (raw.rentUser && raw.rentEstimate) {
    const diff = percentDiff(raw.rentUser.value, raw.rentEstimate.value);
    if (diff >= RENT_MATERIAL_THRESHOLD) {
      conflicts.push({
        field: "rent",
        values: [
          { source: raw.rentUser.source, value: raw.rentUser.value },
          { source: raw.rentEstimate.source, value: raw.rentEstimate.value },
        ],
        severity: "high",
      });
    }
  }

  // Tax conflict: compare across sources
  if (raw.taxes.length >= 2) {
    const sorted = [...raw.taxes].sort((a, b) => a.value - b.value);
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];
    const diff = percentDiff(lowest.value, highest.value);
    if (diff >= TAX_MATERIAL_THRESHOLD) {
      conflicts.push({
        field: "taxes",
        values: sorted.map(t => ({ source: t.source, value: t.value })),
        severity: "medium",
      });
    }
  }

  return conflicts;
}
