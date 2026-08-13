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

type WorkbookCell = string | number | null | undefined;
type WorkbookRow = Record<string, WorkbookCell>;

export async function downloadWorkbook(deal: DealFacts, analysis: DealAnalysis) {
  const sheets: Array<{ name: string; rows: WorkbookRow[] }> = [
    {
      name: "Deal",
      rows: [{
        address: deal.address,
        city: deal.city,
        state: deal.state,
        zip: deal.zip,
        strategy: analysis.primaryStrategy.name,
        recommendation: analysis.decision,
        confidence: analysis.confidence,
        readiness: analysis.readiness,
        purchase_price: deal.listPrice,
        annual_taxes: deal.annualTaxes,
        annual_insurance: deal.annualInsurance,
        monthly_rent: deal.monthlyRent,
        rehab_budget: deal.rehabBudget,
        arv: deal.arv,
        monthly_payment: analysis.monthlyPayment,
        monthly_noi: analysis.monthlyNOI,
        monthly_cash_flow: analysis.monthlyCashFlow,
        dscr: analysis.dscr,
        cap_rate: analysis.capRate,
        cash_on_cash: analysis.cashOnCash,
      }],
    },
    {
      name: "Strategies",
      rows: analysis.strategyScores.map((score) => ({
        strategy: score.name,
        score: score.score,
        confidence: score.confidence,
        recommendation: score.recommendation,
      })),
    },
    {
      name: "Strategy Insight",
      rows: [
        {
          headline: analysis.strategyInsight.headline,
          explanation: analysis.strategyInsight.explanation,
          selected: analysis.strategyInsight.selected.name,
          top_fit: analysis.strategyInsight.best.name,
          score_gap: analysis.strategyInsight.scoreGap,
        },
        ...analysis.strategyInsight.tradeoffs.map((item) => ({ tradeoff: item })),
        ...analysis.strategyInsight.verification.map((item) => ({ verification: item })),
      ],
    },
    {
      name: "Next Actions",
      rows: analysis.nextActions.map((action) => ({ action })),
    },
    {
      name: "Decision Challenge",
      rows: [
        ...analysis.keyRisks.map((item) => ({ section: "Key risks", item })),
        ...analysis.bullCase.map((item) => ({ section: "Bull case", item })),
        ...analysis.bearCase.map((item) => ({ section: "Bear case", item })),
        ...analysis.whatMustBeTrue.map((item) => ({ section: "What must be true", item })),
        ...analysis.failureScenarios.map((item) => ({ section: "Failure scenarios", item })),
        ...analysis.alternativeStrategies.map((item) => ({ section: "Alternatives", item })),
      ],
    },
  ];

  const xml = buildSpreadsheetXml(sheets);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName(deal, "underwriting-workbook", "xml");
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

function buildSpreadsheetXml(sheets: Array<{ name: string; rows: WorkbookRow[] }>) {
  const worksheets = sheets.map(({ name, rows }) => {
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const headerRow = spreadsheetRow(headers);
    const dataRows = rows.map((row) => spreadsheetRow(headers.map((header) => row[header]))).join("");
    return `<Worksheet ss:Name="${escapeXml(name.slice(0, 31))}"><Table>${headerRow}${dataRows}</Table></Worksheet>`;
  }).join("");

  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${worksheets}</Workbook>`;
}

function spreadsheetRow(values: WorkbookCell[]) {
  return `<Row>${values.map(spreadsheetCell).join("")}</Row>`;
}

function spreadsheetCell(value: WorkbookCell) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  const text = value === null || value === undefined ? "" : String(value);
  return `<Cell><Data ss:Type="String">${escapeXml(text)}</Data></Cell>`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fileName(deal: DealFacts, suffix: string, ext: string) {
  const base = (deal.address || "brix-property").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base}-${suffix}.${ext}`;
}
