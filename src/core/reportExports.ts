import type { DealAnalysis, DealFacts } from "./types";
import { formatCurrency } from "./underwriting";

export async function downloadDecisionPdf(deal: DealFacts, analysis: DealAnalysis) {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("BRIX Decision Memo", 18, 20);
  pdf.setFontSize(13);
  pdf.text(deal.address || "Property", 18, 32);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  const lines = [
    `Recommendation: ${analysis.decision}`,
    `Confidence: ${analysis.confidence}/100`,
    `Readiness: ${analysis.readiness}/100`,
    `Strategy: ${analysis.primaryStrategy.name}`,
    `Purchase price: ${formatCurrency(deal.listPrice)}`,
    `Annual taxes: ${formatCurrency(deal.annualTaxes)}`,
    `Annual insurance: ${formatCurrency(deal.annualInsurance)}`,
    `Monthly payment: ${formatCurrency(analysis.monthlyPayment)}`,
    `Monthly NOI: ${formatCurrency(analysis.monthlyNOI)}`,
    `Monthly cash flow: ${formatCurrency(analysis.monthlyCashFlow)}`,
    `DSCR: ${analysis.dscr ? `${analysis.dscr}x` : "Missing"}`,
    `Cap rate: ${analysis.capRate ? `${analysis.capRate}%` : "Missing"}`,
    `Cash-on-cash: ${analysis.cashOnCash ? `${analysis.cashOnCash}%` : "Missing"}`,
    "",
    "Strategy comparison:",
    `- ${analysis.strategyInsight.headline}`,
    `- ${analysis.strategyInsight.explanation}`,
    `- Selected: ${analysis.strategyInsight.selected.name}`,
    `- Top fit: ${analysis.strategyInsight.best.name}`,
    `- Score gap: ${analysis.strategyInsight.scoreGap}`,
    ...analysis.strategyInsight.tradeoffs.map((item) => `- ${item}`),
    "",
    "Evidence:",
    ...analysis.evidence.map((item) => `- ${item}`),
    "",
    "Missing information:",
    ...analysis.missing.map((item) => `- ${item}`),
    "",
    "Next actions:",
    ...analysis.nextActions.map((item) => `- ${item}`),
    "",
    "Key risks:",
    ...analysis.keyRisks.map((item) => `- ${item}`),
    "",
    "Bull case:",
    ...analysis.bullCase.map((item) => `- ${item}`),
    "",
    "Bear case:",
    ...analysis.bearCase.map((item) => `- ${item}`),
    "",
    "What must be true:",
    ...analysis.whatMustBeTrue.map((item) => `- ${item}`),
    "",
    "Failure scenarios:",
    ...analysis.failureScenarios.map((item) => `- ${item}`),
  ];
  pdf.text(lines, 18, 46, { maxWidth: 174, lineHeightFactor: 1.25 });
  pdf.save(fileName(deal, "decision-memo", "pdf"));
}

export async function downloadWorkbook(deal: DealFacts, analysis: DealAnalysis) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
    address: deal.address,
    city: deal.city,
    state: deal.state,
    zip: deal.zip,
    strategy: analysis.primaryStrategy.name,
    recommendation: analysis.decision,
    confidence: analysis.confidence,
    readiness: analysis.readiness,
    purchase_price: deal.listPrice ?? null,
    annual_taxes: deal.annualTaxes ?? null,
    annual_insurance: deal.annualInsurance ?? null,
    monthly_rent: deal.monthlyRent ?? null,
    rehab_budget: deal.rehabBudget ?? null,
    arv: deal.arv ?? null,
    monthly_payment: analysis.monthlyPayment ?? null,
    monthly_noi: analysis.monthlyNOI ?? null,
    monthly_cash_flow: analysis.monthlyCashFlow ?? null,
    dscr: analysis.dscr ?? null,
    cap_rate: analysis.capRate ?? null,
    cash_on_cash: analysis.cashOnCash ?? null,
  }]), "Deal");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analysis.strategyScores), "Strategies");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
    {
      headline: analysis.strategyInsight.headline,
      explanation: analysis.strategyInsight.explanation,
      selected: analysis.strategyInsight.selected.name,
      top_fit: analysis.strategyInsight.best.name,
      score_gap: analysis.strategyInsight.scoreGap,
    },
    ...analysis.strategyInsight.tradeoffs.map((item) => ({ tradeoff: item })),
    ...analysis.strategyInsight.verification.map((item) => ({ verification: item })),
  ]), "Strategy Insight");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(analysis.nextActions.map((action) => ({ action }))), "Next Actions");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
    ...analysis.keyRisks.map((item) => ({ section: "Key risks", item })),
    ...analysis.bullCase.map((item) => ({ section: "Bull case", item })),
    ...analysis.bearCase.map((item) => ({ section: "Bear case", item })),
    ...analysis.whatMustBeTrue.map((item) => ({ section: "What must be true", item })),
    ...analysis.failureScenarios.map((item) => ({ section: "Failure scenarios", item })),
    ...analysis.alternativeStrategies.map((item) => ({ section: "Alternatives", item })),
  ]), "Decision Challenge");
  XLSX.writeFile(wb, fileName(deal, "underwriting", "xlsx"));
}

function fileName(deal: DealFacts, suffix: string, ext: string) {
  const base = (deal.address || "brix-property").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base}-${suffix}.${ext}`;
}
