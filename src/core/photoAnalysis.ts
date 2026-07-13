export type PhotoFinding = {
  severity: "Review" | "Important" | "Critical";
  area: string;
  finding: string;
  action: string;
};

const signals: Array<[RegExp, PhotoFinding]> = [
  [/roof|shingle|gutter/i, { severity: "Important", area: "Roof / drainage", finding: "Roof or drainage image present.", action: "Review age, visible wear, and request roof disclosure or inspection." }],
  [/foundation|basement|crack/i, { severity: "Critical", area: "Foundation / basement", finding: "Foundation or basement concern may be visible.", action: "Require inspector or structural review before relying on pricing." }],
  [/water|mold|stain|ceiling/i, { severity: "Critical", area: "Moisture", finding: "Possible moisture-related image or note.", action: "Verify source, extent, and remediation need." }],
  [/hvac|furnace|ac|condenser/i, { severity: "Important", area: "HVAC", finding: "Mechanical system image present.", action: "Confirm age, service history, and replacement risk." }],
  [/electric|panel|breaker/i, { severity: "Important", area: "Electrical", finding: "Electrical system image present.", action: "Verify panel condition and safety issues." }],
  [/bath|kitchen|floor|paint|reno/i, { severity: "Review", area: "Interior finishes", finding: "Interior finish scope may affect rehab budget.", action: "Estimate cosmetic scope and confirm material quality." }],
];

export function analyzePhotoEvidence(items: string[]): PhotoFinding[] {
  const findings = items.flatMap((item) => signals.filter(([pattern]) => pattern.test(item)).map(([, finding]) => finding));
  const unique = new Map(findings.map((finding) => [`${finding.area}-${finding.finding}`, finding]));
  return [...unique.values()];
}
