/**
 * Investor-grade Deal Memo PDF for lenders, partners, and your own files.
 * Built entirely from the deterministic BRIX engines; loaded on demand so it never weighs on page load.
 */
import { analyzeBrrrr, analyzeFlip, analyzeRental, maxRentalOffer, rentalVerdict, usd, type AnalyzerInputs, type DealLike } from "./investorMath";
import { brixRead, localMarketInsights, riskFlags, stressTest, whatItTakes } from "./dealIntelligence";
import type { MarketContext } from "./marketContext";

type Rgb = [number, number, number];
const NAVY: Rgb = [11, 18, 32];
const BLUE: Rgb = [59, 130, 246];
const INK: Rgb = [24, 32, 48];
const MUTED: Rgb = [100, 116, 139];
const TONE: Record<string, Rgb> = { strong: [22, 163, 74], workable: [217, 119, 6], weak: [220, 38, 38], incomplete: [100, 116, 139] };

export async function downloadDealMemo(options: { title: string; address: string; inputs: AnalyzerInputs; deal: DealLike; market: MarketContext | null; ratesNote: string }) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const { title, address, inputs, deal, market, ratesNote } = options;
  const r = analyzeRental(inputs);
  const verdict = rentalVerdict(inputs, r);
  const read = brixRead(inputs, r);
  const takes = whatItTakes(inputs);
  const stress = stressTest(inputs);
  const local = localMarketInsights(inputs, deal, market);
  const flags = [...riskFlags(inputs, deal, r), ...(local?.flags ?? [])];
  const brrrr = analyzeBrrrr(inputs);
  const flip = analyzeFlip(inputs);
  const maxOffer = maxRentalOffer(inputs);
  const pct = (v: number | null | undefined) => (v === null || v === undefined || !Number.isFinite(v) ? "n/a" : `${(v * 100).toFixed(1)}%`);

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const M = 44;
  let y = 0;

  // Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 86, "F");
  doc.setFillColor(...BLUE);
  [[M, 26], [M + 13, 26], [M, 39], [M + 13, 39]].forEach(([x, yy]) => doc.roundedRect(x, yy, 10, 10, 2, 2, "F"));
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("BRIX", M + 32, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("REAL ESTATE  ·  DEAL MEMO", M + 32, 50);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), W - M, 38, { align: "right" });
  doc.text("Pre-tax, pre-financing-quote estimate", W - M, 50, { align: "right" });

  y = 118;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(pdfSafe(title), M, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  if (address && address !== title) doc.text(pdfSafe(address), M, y + 16);
  y += 34;

  // Verdict box
  const tone = TONE[verdict.tone];
  const verdictLabel = verdict.tone === "strong" ? "STRONG DEAL" : verdict.tone === "workable" ? "WORKABLE" : verdict.tone === "weak" ? "DOESN'T PENCIL" : "NEEDS INPUTS";
  const readLines = doc.splitTextToSize(pdfSafe(read ?? verdict.headline), W - 2 * M - 28);
  const boxH = 34 + readLines.length * 13;
  doc.setDrawColor(...tone);
  doc.setLineWidth(1.2);
  doc.setFillColor(tone[0], tone[1], tone[2]);
  doc.rect(M, y, 4, boxH, "F");
  doc.roundedRect(M, y, W - 2 * M, boxH, 4, 4, "S");
  doc.setTextColor(...tone);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(verdictLabel, M + 16, y + 20);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(readLines, M + 16, y + 36);
  y += boxH + 18;

  const table = (head: string[] | null, body: Array<Array<string>>, opts: Record<string, unknown> = {}) => {
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: head ? [head.map(pdfSafe)] : undefined,
      body: body.map((row) => row.map(pdfSafe)),
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, cellPadding: 5, textColor: INK, lineColor: [226, 232, 240], lineWidth: 0.5 },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      ...opts,
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
  };
  const heading = (text: string) => {
    if (y > 700) { doc.addPage(); y = 56; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(pdfSafe(text), M, y);
    y += 8;
  };

  heading("Key numbers");
  table(null, [
    ["Purchase price", usd(inputs.purchasePrice), "Monthly cash flow", usd(r.monthlyCashFlow)],
    ["Monthly rent", usd(inputs.monthlyRent), "Cash-on-cash", pct(r.cashOnCash)],
    ["Cash needed", usd(r.totalCashInvested), "Cap rate (price / all-in)", `${pct(r.capRate)} / ${pct(r.capRateAllIn)}`],
    ["Loan", inputs.cashPurchase ? "All cash" : `${usd(r.loanAmount)} at ${inputs.interestRate}%, ${inputs.loanTermYears} yr`, "DSCR", r.dscr === null ? "No loan" : r.dscr.toFixed(2)],
    ["Max offer at your targets", maxOffer === null ? "None at this rent" : usd(maxOffer), `${r.projection.length}-yr IRR / equity multiple`, `${pct(r.irr)} / ${r.equityMultiple === null ? "n/a" : `${r.equityMultiple.toFixed(2)}x`}`],
  ], { columnStyles: { 0: { fontStyle: "bold" }, 2: { fontStyle: "bold" } } });

  heading("Year-1 operating statement");
  const op = r.operating;
  table(["Line", "Annual", "Monthly"], ([
    ["Gross scheduled income", op.grossScheduledIncome],
    [`Vacancy & credit loss (${inputs.vacancyPct}%)`, -op.vacancyLoss],
    ["Effective gross income", op.effectiveGrossIncome],
    ["Property taxes", -op.expenses.taxes],
    ["Insurance", -op.expenses.insurance],
    ["HOA", -op.expenses.hoa],
    [`Management (${inputs.managementPct}% of collected rent)`, -op.expenses.management],
    [`Repairs & maintenance (${inputs.maintenancePct}%)`, -op.expenses.maintenance],
    [`CapEx reserve (${inputs.capexPct}%)`, -op.expenses.capex],
    ["Utilities & other", -(op.expenses.utilities + op.expenses.other)],
    ["Net operating income", op.netOperatingIncome],
    ["Debt service (P&I)", -r.annualDebtService],
    ["Cash flow before tax", r.annualCashFlow],
  ] as Array<[string, number]>).filter(([label, v]) => v !== 0 || /income|Cash flow/.test(label)).map(([label, v]) => [label, money(v), money(v / 12)]), {
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    didParseCell: (data: { row: { raw: string[] }; cell: { styles: { fontStyle: string } } }) => {
      if (/^(Effective gross income|Net operating income|Cash flow before tax)/.test(data.row.raw[0])) data.cell.styles.fontStyle = "bold";
    },
  });

  if (takes.levers.length) {
    heading(takes.alreadyMeets ? "Room in the deal" : "What it would take to hit the targets");
    table(["Lever", "Today", "Needed", "Change", "Comment"], takes.levers.map((l) => [l.label, l.current, l.needed ?? "Not possible", l.change ?? "—", l.note]), {
      columnStyles: { 4: { cellWidth: 190 } },
    });
  }

  if (stress.length) {
    heading("Stress test");
    table(["Scenario", "Cash flow / mo", "DSCR", "Holds?"], stress.map((s) => [`${s.label} — ${s.detail}`, usd(s.monthlyCashFlow), s.dscr === null ? "—" : s.dscr.toFixed(2), s.survives ? "Yes" : "No"]), {
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "center" } },
    });
  }

  if (brrrr || flip) {
    heading("Alternative strategies on this property");
    const rows: string[][] = [];
    if (brrrr) rows.push(["BRRRR", `Cash left in deal ${usd(Math.max(0, brrrr.cashLeftInDeal))}${brrrr.allCashRecovered ? " (all cash recovered)" : ""}`, `Post-refi cash flow ${usd(brrrr.monthlyCashFlow)}/mo, DSCR ${brrrr.dscr?.toFixed(2) ?? "n/a"}`]);
    if (flip) rows.push(["Fix & flip", `Net profit ${usd(flip.netProfit)} (${pct(flip.profitMargin)} of ARV)`, `ROI ${pct(flip.roi)}; 70% rule MAO ${usd(flip.maxAllowableOffer70)}`]);
    table(["Strategy", "Result", "Detail"], rows);
  }

  if (local) {
    heading(`Local market · ZIP ${market?.zip}`);
    table(null, [
      [local.benchmarkLabel + " (today's $)", local.benchmarkRent ? usd(local.benchmarkRent) : "n/a", "Your rent vs median", local.rentVsBenchmark === null ? "n/a" : `${Math.round(local.rentVsBenchmark * 100)}%`],
      ["Rental vacancy rate", local.localVacancyPct === null ? "n/a" : `${local.localVacancyPct.toFixed(1)}%`, "Median household income", market?.medianHouseholdIncome ? usd(market.medianHouseholdIncome) : "n/a"],
      ["Renter share", market?.renterShare === null || market?.renterShare === undefined ? "n/a" : `${Math.round(market.renterShare * 100)}%`, "Median home value (survey)", market?.medianHomeValue ? usd(market.medianHomeValue) : "n/a"],
    ], { columnStyles: { 0: { fontStyle: "bold" }, 2: { fontStyle: "bold" } } });
  }

  if (flags.length) {
    heading("Risks and diligence items");
    table(["", "Item", "Why it matters"], flags.map((f) => [f.severity === "high" ? "HIGH" : f.severity === "medium" ? "MED" : "NOTE", f.title, f.detail]), {
      columnStyles: { 0: { cellWidth: 40, fontStyle: "bold" }, 1: { cellWidth: 150, fontStyle: "bold" } },
    });
  }

  heading("Assumptions");
  table(null, [
    ["Down payment", inputs.cashPurchase ? "All cash" : `${inputs.downPaymentPct}%`, "Closing costs", `${inputs.closingCostPct}%`],
    ["Rehab budget", usd(inputs.rehabBudget), "ARV", inputs.arv ? usd(inputs.arv) : "n/a"],
    ["Appreciation / rent growth / expense growth", `${inputs.appreciationPct}% / ${inputs.rentGrowthPct}% / ${inputs.expenseGrowthPct}%`, "Hold period / selling costs", `${inputs.holdYears} yrs / ${inputs.sellingCostPct}%`],
    ["Targets", `≥ ${usd(inputs.targetMonthlyCashFlowPerUnit)}/unit/mo, ≥ ${inputs.targetCashOnCashPct}% CoC, DSCR ≥ ${inputs.targetDscr}`, "Units", String(inputs.units)],
  ], { columnStyles: { 0: { fontStyle: "bold" }, 2: { fontStyle: "bold" } } });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    const note = doc.splitTextToSize(pdfSafe(`${ratesNote} ${market ? `Local data: ${market.survey}${market.rentAdjustment ? `, rents adjusted to ${market.rentAdjustment.through} with ${market.rentAdjustment.source}` : ""}.` : ""} Estimates for decision support only, not an appraisal, loan offer, or tax advice. Verify with comps, inspections, and lender quotes.`), W - 2 * M - 40);
    doc.text(note, M, h - 34);
    doc.text(`${i} / ${pages}`, W - M, h - 34, { align: "right" });
  }

  const safe = (title || "deal").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "deal";
  doc.save(`BRIX-Deal-Memo-${safe}.pdf`);
}

/** jsPDF's built-in Helvetica only covers WinAnsi; map the few symbols BRIX uses to safe equivalents. */
export function pdfSafe(text: string) {
  return text.replace(/≈\s*/g, "approx. ").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/[−–]/g, "-").replace(/→/g, "->").replace(/×/g, "x").replace(/∞/g, "infinite");
}

function money(v: number) {
  return v < 0 ? `(${usd(-v)})` : usd(v);
}
