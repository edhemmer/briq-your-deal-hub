// BRIQ Investor Report Engine v1.8.0 — deterministic report assembly.
// Reads finalized analysis outputs only. Never recalculates metrics.

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult, DealInput } from "./dealAnalysisEngine";
import type { DealIntelligenceResult } from "./dealIntelligenceEngine";
import type { StrategyFitResults, StrategyScore } from "./strategyFitEngine";
import type { MarketIntelligenceResult } from "./marketIntelligenceEngine";
import type { StressTestResults, ScenarioResult } from "./stressTestingEngine";

// ── Types ──────────────────────────────────────────────────────────────

export interface DealReportProperty {
  address: string;
  city: string;
  state: string;
  zipCode: string | null;
  purchasePrice: number;
  propertyType: string | null;
}

export interface DealReport {
  property: DealReportProperty;
  reportDate: string;
  analysis: AnalysisResult;
  intelligence: DealIntelligenceResult;
  strategyFit: StrategyFitResults;
  marketIntelligence: MarketIntelligenceResult;
  stressResults: StressTestResults;
}

// ── Helpers ────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n: number) => (n * 100).toFixed(2) + "%";
const fmtX = (n: number) => n.toFixed(2) + "x";

const STRATEGY_LABELS: Record<keyof StrategyFitResults, string> = {
  brrrr: "BRRRR",
  longTermRental: "Long Term Rental",
  midTermRental: "Mid Term Rental",
  shortTermRental: "Short Term Rental",
  fixFlip: "Fix & Flip",
  valueAdd: "Value Add",
  appreciationHold: "Appreciation Hold",
};

function getBestStrategy(fit: StrategyFitResults): { key: keyof StrategyFitResults; strategy: StrategyScore } {
  const entries = Object.entries(fit) as [keyof StrategyFitResults, StrategyScore][];
  const best = entries.reduce((a, b) => b[1].score > a[1].score ? b : a, entries[0]);
  return { key: best[0], strategy: best[1] };
}

// ── Report Assembly ────────────────────────────────────────────────────

export function assembleDealReport(
  property: DealReportProperty,
  analysis: AnalysisResult,
  intelligence: DealIntelligenceResult,
  strategyFit: StrategyFitResults,
  marketIntelligence: MarketIntelligenceResult,
  stressResults: StressTestResults,
): DealReport {
  return {
    property,
    reportDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    analysis,
    intelligence,
    strategyFit,
    marketIntelligence,
    stressResults,
  };
}

// ── PDF Generation ─────────────────────────────────────────────────────

export function generateInvestorPDF(report: DealReport): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  const contentW = pageW - margin * 2;
  let y = margin;

  const brandColor: [number, number, number] = [30, 64, 175]; // primary blue
  const textDark: [number, number, number] = [17, 24, 39];
  const textMuted: [number, number, number] = [107, 114, 128];
  const lineColor: [number, number, number] = [229, 231, 235];

  // -- Header --
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, pageW, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("BRIQ Investment Report", margin, 36);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated ${report.reportDate}`, margin, 54);
  doc.text("Powered by BRIQ • InLight AI", pageW - margin, 54, { align: "right" });
  y = 100;

  // -- Property Summary --
  doc.setTextColor(...textDark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Property Summary", margin, y);
  y += 6;
  doc.setDrawColor(...lineColor);
  doc.line(margin, y, margin + contentW, y);
  y += 16;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  const propRows = [
    ["Address", report.property.address],
    ["Location", `${report.property.city}, ${report.property.state} ${report.property.zipCode ?? ""}`],
    ["Purchase Price", fmt(report.property.purchasePrice)],
    ["Property Type", report.property.propertyType ?? "—"],
  ];
  propRows.forEach(([label, value]) => {
    doc.setTextColor(...textMuted);
    doc.text(label, margin, y);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text(value, margin + 120, y);
    doc.setFont("helvetica", "normal");
    y += 14;
  });
  y += 10;

  // -- Deal Overview --
  doc.setTextColor(...textDark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Deal Overview", margin, y);
  y += 6;
  doc.line(margin, y, margin + contentW, y);
  y += 16;

  const best = getBestStrategy(report.strategyFit);
  doc.setFontSize(9);
  const overviewRows = [
    ["Deal Score", `${report.intelligence.score} / 100 — ${report.intelligence.scoreLabel}`],
    ["Decision", report.intelligence.decision],
    ["Recommended Strategy", STRATEGY_LABELS[best.key]],
    ["Strategy Confidence", best.strategy.confidenceLevel],
    ["Deal Resilience", report.stressResults.resilience],
  ];
  overviewRows.forEach(([label, value]) => {
    doc.setTextColor(...textMuted);
    doc.setFont("helvetica", "normal");
    doc.text(label, margin, y);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text(value, margin + 140, y);
    y += 14;
  });
  y += 10;

  // -- Financial Performance --
  doc.setTextColor(...textDark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Performance", margin, y);
  y += 6;
  doc.line(margin, y, margin + contentW, y);
  y += 10;

  const m = report.analysis.metrics;
  const finData = [
    ["Monthly Cash Flow", fmt(m.monthly_cashflow)],
    ["Annual Cash Flow", fmt(m.annual_cashflow)],
    ["Cap Rate", fmtPct(m.cap_rate)],
    ["DSCR", fmtX(m.dscr)],
    ["Cash-on-Cash Return", fmtPct(m.cash_on_cash)],
    ["NOI", fmt(m.noi)],
    ["Initial Cash Required", fmt(m.initial_cash_required)],
    ["Equity Created", fmt(report.analysis.refinance.equity_created)],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Metric", "Value"]],
    body: finData,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: brandColor, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: "plain",
  });
  y = (doc as any).lastAutoTable.finalY + 20;

  // -- Market Conditions --
  if (y > 620) { doc.addPage(); y = margin; }
  doc.setTextColor(...textDark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Market Conditions", margin, y);
  y += 6;
  doc.line(margin, y, margin + contentW, y);
  y += 10;

  const mi = report.marketIntelligence;
  const marketData = [
    ["Market Strength", `${mi.market_strength_score} — ${mi.strengthLabel}`],
    ["Market Risk", `${mi.market_risk_score} — ${mi.riskLabel}`],
    ["Demand Pressure", `${mi.demand_pressure_score}`],
  ];
  Object.entries(mi.signals).forEach(([, signal]) => {
    marketData.push([signal.label, `${signal.score} — ${signal.level === "strong" ? "Strong" : signal.level === "neutral" ? "Neutral" : "Weak"}`]);
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Indicator", "Value"]],
    body: marketData,
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: brandColor, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: "plain",
  });
  y = (doc as any).lastAutoTable.finalY + 20;

  // -- Crime & Safety --
  if (y > 680) { doc.addPage(); y = margin; }
  doc.setTextColor(...textDark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Crime & Safety Signal", margin, y);
  y += 6;
  doc.line(margin, y, margin + contentW, y);
  y += 16;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (mi.crime.crime_score != null) {
    doc.setTextColor(...textMuted);
    doc.text("Crime Score", margin, y);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text(`${mi.crime.crime_score.toFixed(1)} / 10`, margin + 120, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textMuted);
    doc.text("Risk Band", margin, y);
    doc.setTextColor(...textDark);
    doc.setFont("helvetica", "bold");
    doc.text(mi.crime.crime_risk_band ?? "—", margin + 120, y);
    y += 14;
  } else {
    doc.setTextColor(...textMuted);
    doc.text("Crime data unavailable for this location.", margin, y);
    y += 14;
  }
  y += 10;

  // -- Stress Testing --
  if (y > 580) { doc.addPage(); y = margin; }
  doc.setTextColor(...textDark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Stress Testing Results", margin, y);
  y += 6;
  doc.line(margin, y, margin + contentW, y);
  y += 16;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  doc.text("Resilience", margin, y);
  doc.setTextColor(...textDark);
  doc.setFont("helvetica", "bold");
  doc.text(report.stressResults.resilience, margin + 120, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textMuted);
  const insightLines = doc.splitTextToSize(report.stressResults.resilienceInsight, contentW);
  doc.text(insightLines, margin, y);
  y += insightLines.length * 12 + 10;

  const stressHead = [["Scenario", "Cash Flow/mo", "DSCR", "CoC Return", "Break-Even Occ."]];
  const stressBody = report.stressResults.scenarios.map(s => [
    s.scenario.label,
    fmt(s.stressed.monthly_cashflow),
    fmtX(s.stressed.dscr),
    fmtPct(s.stressed.cash_on_cash),
    fmtPct(s.stressed.break_even_occupancy),
  ]);

  // Insert baseline row at top
  if (report.stressResults.scenarios.length > 0) {
    const b = report.stressResults.scenarios[0].baseline;
    stressBody.unshift(["Baseline", fmt(b.monthly_cashflow), fmtX(b.dscr), fmtPct(b.cash_on_cash), fmtPct(b.break_even_occupancy)]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: stressHead,
    body: stressBody,
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: brandColor, textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: "plain",
  });

  // -- Footer on each page --
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text("BRIQ • InLight AI — Confidential Investment Analysis", margin, pageH - 20);
    doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 20, { align: "right" });
  }

  const filename = `BRIQ_Report_${report.property.address.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
  doc.save(filename);
}

// ── CSV Generation ─────────────────────────────────────────────────────

export function generateCSVExport(report: DealReport): void {
  const rows: string[][] = [];

  // Header
  rows.push(["BRIQ Investment Report"]);
  rows.push(["Generated", report.reportDate]);
  rows.push([]);

  // Property
  rows.push(["Property Summary"]);
  rows.push(["Address", report.property.address]);
  rows.push(["City", report.property.city]);
  rows.push(["State", report.property.state]);
  rows.push(["Zip", report.property.zipCode ?? ""]);
  rows.push(["Purchase Price", String(report.property.purchasePrice)]);
  rows.push([]);

  // Financial
  rows.push(["Financial Performance"]);
  rows.push(["Metric", "Value"]);
  const m = report.analysis.metrics;
  rows.push(["Monthly Cash Flow", String(m.monthly_cashflow)]);
  rows.push(["Annual Cash Flow", String(m.annual_cashflow)]);
  rows.push(["Cap Rate", String(m.cap_rate)]);
  rows.push(["DSCR", String(m.dscr)]);
  rows.push(["Cash-on-Cash Return", String(m.cash_on_cash)]);
  rows.push(["NOI", String(m.noi)]);
  rows.push(["Initial Cash Required", String(m.initial_cash_required)]);
  rows.push(["Equity Created", String(report.analysis.refinance.equity_created)]);
  rows.push([]);

  // Intelligence
  rows.push(["Deal Intelligence"]);
  rows.push(["Deal Score", String(report.intelligence.score)]);
  rows.push(["Decision", report.intelligence.decision]);
  rows.push(["Resilience", report.stressResults.resilience]);
  rows.push([]);

  // Strategy
  rows.push(["Strategy Fit"]);
  rows.push(["Strategy", "Score", "Fit Level", "Confidence"]);
  (Object.entries(report.strategyFit) as [keyof StrategyFitResults, StrategyScore][]).forEach(([key, s]) => {
    rows.push([STRATEGY_LABELS[key], String(s.score), s.fitLevel, s.confidenceLevel]);
  });
  rows.push([]);

  // Stress Testing
  rows.push(["Stress Testing"]);
  rows.push(["Scenario", "Monthly Cash Flow", "Annual Cash Flow", "DSCR", "CoC Return", "Break-Even Occupancy"]);
  if (report.stressResults.scenarios.length > 0) {
    const b = report.stressResults.scenarios[0].baseline;
    rows.push(["Baseline", String(b.monthly_cashflow), String(b.annual_cashflow), String(b.dscr), String(b.cash_on_cash), String(b.break_even_occupancy)]);
  }
  report.stressResults.scenarios.forEach(s => {
    rows.push([
      s.scenario.label,
      String(s.stressed.monthly_cashflow),
      String(s.stressed.annual_cashflow),
      String(s.stressed.dscr),
      String(s.stressed.cash_on_cash),
      String(s.stressed.break_even_occupancy),
    ]);
  });

  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BRIQ_Export_${report.property.address.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
