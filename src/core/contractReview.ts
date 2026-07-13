export type ContractFinding = {
  severity: "Low" | "Medium" | "High";
  clause: string;
  finding: string;
  action: string;
};

const rules: Array<[RegExp, ContractFinding]> = [
  [/as[-\s]?is/i, { severity: "High", clause: "As-is condition", finding: "The contract appears to shift condition risk to the buyer.", action: "Confirm inspection rights, repair limits, and walk-away deadlines." }],
  [/inspection/i, { severity: "Medium", clause: "Inspection", finding: "Inspection language is present.", action: "Verify inspection period length and cancellation rights." }],
  [/appraisal/i, { severity: "Medium", clause: "Appraisal", finding: "Appraisal language is present.", action: "Confirm whether appraisal shortfall protection exists." }],
  [/financ/i, { severity: "Medium", clause: "Financing", finding: "Financing language is present.", action: "Verify loan contingency, approval deadline, and documentation duties." }],
  [/hoa|association/i, { severity: "High", clause: "HOA / association", finding: "HOA terms may affect use, parking, rentals, or cost.", action: "Request declarations, rules, budget, reserves, meeting minutes, and fee schedule." }],
  [/earnest/i, { severity: "Medium", clause: "Earnest money", finding: "Earnest money language is present.", action: "Confirm deposit amount, due date, holder, and refund conditions." }],
  [/closing|possession/i, { severity: "Low", clause: "Closing / possession", finding: "Closing or possession language is present.", action: "Verify dates, possession timing, and post-close occupancy risk." }],
  [/tax proration|prorat/i, { severity: "Medium", clause: "Tax proration", finding: "Tax proration terms may materially affect closing economics.", action: "Verify proration method against county tax timing." }],
];

export function reviewContractText(text: string): ContractFinding[] {
  const findings = rules.filter(([pattern]) => pattern.test(text)).map(([, finding]) => finding);
  if (!text.trim()) return [];
  if (!findings.length) {
    return [{
      severity: "Medium",
      clause: "Manual review required",
      finding: "No major clause signals were detected by the deterministic review.",
      action: "Upload or paste the full contract and review with licensed professionals before signing.",
    }];
  }
  return findings;
}
