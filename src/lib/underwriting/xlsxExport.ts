// XLSX Investor Model Export — deterministic workbook with formulas.
// Color convention: BLUE = inputs, BLACK = formulas, GREEN = cross-sheet links.
// No AI. Pure data + formulas. Recalculates natively in Excel.

import ExcelJS from "exceljs";
import type { DealInput, AnalysisResult } from "@/lib/dealAnalysisEngine";
import type { ReturnsResult, ReturnsAssumptions } from "@/lib/underwriting/returnsEngine";
import type { ProFormaResult } from "@/lib/underwriting/proFormaEngine";

const COLOR_INPUT = { argb: "FF0000FF" };       // blue
const COLOR_FORMULA = { argb: "FF000000" };     // black
const COLOR_LINK = { argb: "FF008000" };        // green
const COLOR_HEADER_FILL = { argb: "FF1E3A5F" }; // brix dark blue
const COLOR_HEADER_FONT = { argb: "FFFFFFFF" }; // white
const COLOR_SECTION_FILL = { argb: "FFE6EEF7" };// pale blue
const COLOR_TOTAL_FILL = { argb: "FFF8FAFC" };  // off-white

const FONT = "Arial";

const FMT = {
  currency: '"$"#,##0;("$"#,##0);"-"',
  currencyCents: '"$"#,##0.00;("$"#,##0.00);"-"',
  pct: "0.00%;(0.00%);-",
  pct1: "0.0%;(0.0%);-",
  number: "#,##0;(#,##0);-",
  multiple: '0.00"x"',
  year: "0",
};

interface BuildArgs {
  dealName: string;
  address: string;
  input: DealInput;
  analysis: AnalysisResult;
  proForma: ProFormaResult | null;
  returns: ReturnsResult | null;
  returnsAssumptions: ReturnsAssumptions;
}

export async function exportInvestorModel(args: BuildArgs): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "BRIX DealIQ";
  wb.created = new Date();
  wb.properties.date1904 = false;

  buildAssumptionsSheet(wb, args);
  buildSourcesUsesSheet(wb, args);
  buildProFormaSheet(wb, args);
  buildReturnsSheet(wb, args);
  buildSummarySheet(wb, args);

  // Reorder: Summary first
  const summary = wb.getWorksheet("Summary")!;
  wb.removeWorksheet(summary.id);
  const newSummary = wb.addWorksheet("Summary", { properties: { tabColor: { argb: "FF1E3A5F" } } });
  copySheet(summary, newSummary);
  // ExcelJS doesn't expose easy reorder; instead build Summary last and add at index 0
  // Simpler: just leave as-is — alphabetical/insertion order Summary already added last.
  wb.removeWorksheet(newSummary.id);

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeName(args.dealName)}_Investor_Model.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Sheet helpers ──────────────────────────────────────────────────────
function copySheet(src: ExcelJS.Worksheet, dst: ExcelJS.Worksheet) {
  src.eachRow((row, ri) => {
    const newRow = dst.getRow(ri);
    row.eachCell({ includeEmpty: true }, (cell, ci) => {
      const nc = newRow.getCell(ci);
      nc.value = cell.value;
      nc.style = { ...cell.style };
      nc.numFmt = cell.numFmt;
    });
    newRow.commit();
  });
  src.columns.forEach((col, i) => {
    if (col.width) dst.getColumn(i + 1).width = col.width;
  });
}

function applyHeader(cell: ExcelJS.Cell) {
  cell.font = { name: FONT, size: 11, bold: true, color: COLOR_HEADER_FONT };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: COLOR_HEADER_FILL };
  cell.alignment = { vertical: "middle", horizontal: "left" };
}

function applySection(cell: ExcelJS.Cell) {
  cell.font = { name: FONT, size: 11, bold: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: COLOR_SECTION_FILL };
}

function setInput(cell: ExcelJS.Cell, value: number | string, fmt?: string) {
  cell.value = value;
  cell.font = { name: FONT, size: 10, color: COLOR_INPUT };
  if (fmt) cell.numFmt = fmt;
}

function setFormula(cell: ExcelJS.Cell, formula: string, fmt?: string, bold = false) {
  cell.value = { formula, date1904: false } as ExcelJS.CellFormulaValue;
  cell.font = { name: FONT, size: 10, color: COLOR_FORMULA, bold };
  if (fmt) cell.numFmt = fmt;
}

function setLink(cell: ExcelJS.Cell, formula: string, fmt?: string, bold = false) {
  cell.value = { formula, date1904: false } as ExcelJS.CellFormulaValue;
  cell.font = { name: FONT, size: 10, color: COLOR_LINK, bold };
  if (fmt) cell.numFmt = fmt;
}

function setLabel(cell: ExcelJS.Cell, text: string, bold = false) {
  cell.value = text;
  cell.font = { name: FONT, size: 10, bold };
}

function safeName(name: string): string {
  return (name || "Deal").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60);
}

// ── 1. ASSUMPTIONS ─────────────────────────────────────────────────────
function buildAssumptionsSheet(wb: ExcelJS.Workbook, args: BuildArgs) {
  const ws = wb.addWorksheet("Assumptions", { properties: { tabColor: { argb: "FF2563EB" } } });
  ws.columns = [
    { width: 38 },
    { width: 18 },
    { width: 36 },
  ];

  const titleCell = ws.getCell("A1");
  titleCell.value = `${args.dealName} — Investor Underwriting Model`;
  titleCell.font = { name: FONT, size: 14, bold: true, color: COLOR_HEADER_FILL };
  ws.mergeCells("A1:C1");

  ws.getCell("A2").value = args.address || "";
  ws.getCell("A2").font = { name: FONT, size: 10, italic: true, color: { argb: "FF666666" } };
  ws.mergeCells("A2:C2");

  let r = 4;
  const header = ws.getRow(r);
  setLabel(header.getCell(1), "Item", true);
  setLabel(header.getCell(2), "Value", true);
  setLabel(header.getCell(3), "Notes", true);
  applyHeader(header.getCell(1)); applyHeader(header.getCell(2)); applyHeader(header.getCell(3));
  r++;

  const sec = (label: string) => {
    const cell = ws.getCell(`A${r}`);
    setLabel(cell, label, true);
    applySection(cell);
    applySection(ws.getCell(`B${r}`));
    applySection(ws.getCell(`C${r}`));
    r++;
  };
  const inp = (label: string, val: number | string, fmt = FMT.currency, note = "") => {
    setLabel(ws.getCell(`A${r}`), label);
    setInput(ws.getCell(`B${r}`), val, fmt);
    if (note) ws.getCell(`C${r}`).value = note;
    ws.getCell(`C${r}`).font = { name: FONT, size: 9, italic: true, color: { argb: "FF666666" } };
    r++;
  };

  sec("Acquisition");
  inp("Purchase Price", args.input.purchase_price || 0);
  inp("Closing Costs", args.input.closing_costs || 0);
  inp("After Repair Value (ARV)", args.input.arv || 0);

  sec("Rehab / CapEx");
  inp("Rehab Cost", args.input.rehab_cost || 0);
  inp("Rehab Contingency", args.input.rehab_contingency || 0);

  sec("Financing");
  inp("Down Payment %", args.input.down_payment_percent || 0, FMT.pct);
  inp("Interest Rate", args.input.interest_rate || 0, FMT.pct);
  inp("Loan Term (Years)", args.input.loan_term_years || 0, FMT.number);

  sec("Income");
  inp("Monthly Rent", (args.input.monthly_rent || 0), FMT.currency);
  inp("Other Income (Annual)", (args.input.other_income || 0), FMT.currency);
  inp("Vacancy %", args.input.vacancy_percent || 0, FMT.pct);

  sec("Operating Expenses");
  inp("Property Tax (Annual)", args.input.taxes || 0);
  inp("Insurance (Annual)", args.input.insurance || 0);
  inp("Property Mgmt %", args.input.management_percent || 0, FMT.pct);
  inp("Maintenance %", args.input.maintenance_percent || 0, FMT.pct);
  inp("CapEx Reserve %", args.input.capex_percent || 0, FMT.pct);

  sec("Hold Assumptions");
  inp("Hold Period (Years)", args.returnsAssumptions.hold_years, FMT.number);
  inp("Rent Growth", args.returnsAssumptions.rent_growth, FMT.pct);
  inp("Expense Growth", args.returnsAssumptions.expense_growth, FMT.pct);
  inp("Appreciation", args.returnsAssumptions.appreciation, FMT.pct);
  inp("Exit Cap Rate", args.returnsAssumptions.exit_cap_rate ?? 0, FMT.pct, args.returnsAssumptions.exit_cap_rate ? "" : "0 = use appreciation");
  inp("Cost of Sale", args.returnsAssumptions.cost_of_sale_pct, FMT.pct);

  // Named refs via comments for downstream readability (ExcelJS named-range API)
  defineNames(wb, ws, {
    PurchasePrice: "B6",
    ClosingCosts: "B7",
    ARV: "B8",
    RehabCost: "B10",
    Contingency: "B11",
    DownPaymentPct: "B13",
    InterestRate: "B14",
    LoanTermYears: "B15",
    MonthlyRent: "B17",
    OtherIncome: "B18",
    VacancyPct: "B19",
    PropertyTax: "B21",
    Insurance: "B22",
    PMPct: "B23",
    MaintPct: "B24",
    CapExPct: "B25",
    HoldYears: "B27",
    RentGrowth: "B28",
    ExpenseGrowth: "B29",
    Appreciation: "B30",
    ExitCap: "B31",
    CostOfSale: "B32",
  });
}

function defineNames(wb: ExcelJS.Workbook, ws: ExcelJS.Worksheet, names: Record<string, string>) {
  Object.entries(names).forEach(([name, addr]) => {
    wb.definedNames.add(`'${ws.name}'!$${addr.charAt(0)}$${addr.slice(1)}`, name);
  });
}

// ── 2. SOURCES & USES ──────────────────────────────────────────────────
function buildSourcesUsesSheet(wb: ExcelJS.Workbook, _args: BuildArgs) {
  const ws = wb.addWorksheet("Sources_Uses", { properties: { tabColor: { argb: "FF14B8A6" } } });
  ws.columns = [{ width: 32 }, { width: 18 }, { width: 14 }];

  ws.getCell("A1").value = "Sources & Uses of Capital";
  ws.getCell("A1").font = { name: FONT, size: 13, bold: true, color: COLOR_HEADER_FILL };
  ws.mergeCells("A1:C1");

  // USES
  let r = 3;
  const usesHeader = ws.getRow(r);
  setLabel(usesHeader.getCell(1), "Uses", true);
  setLabel(usesHeader.getCell(2), "Amount", true);
  setLabel(usesHeader.getCell(3), "% Total", true);
  applyHeader(usesHeader.getCell(1)); applyHeader(usesHeader.getCell(2)); applyHeader(usesHeader.getCell(3));
  r++;

  const usesStart = r;
  const usesItems = [
    ["Purchase Price", "PurchasePrice"],
    ["Closing Costs", "ClosingCosts"],
    ["Rehab", "RehabCost"],
    ["Contingency", "Contingency"],
  ];
  usesItems.forEach(([label, name]) => {
    setLabel(ws.getCell(`A${r}`), label);
    setLink(ws.getCell(`B${r}`), `=${name}`, FMT.currency);
    setFormula(ws.getCell(`C${r}`), `=B${r}/$B$${usesStart + usesItems.length}`, FMT.pct1);
    r++;
  });
  const totalUsesRow = r;
  setLabel(ws.getCell(`A${r}`), "Total Uses", true);
  setFormula(ws.getCell(`B${r}`), `=SUM(B${usesStart}:B${r - 1})`, FMT.currency, true);
  setFormula(ws.getCell(`C${r}`), `=SUM(C${usesStart}:C${r - 1})`, FMT.pct1, true);
  ws.getRow(r).eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: COLOR_TOTAL_FILL }; });
  r += 2;

  // SOURCES
  const sourcesHeader = ws.getRow(r);
  setLabel(sourcesHeader.getCell(1), "Sources", true);
  setLabel(sourcesHeader.getCell(2), "Amount", true);
  setLabel(sourcesHeader.getCell(3), "% Total", true);
  applyHeader(sourcesHeader.getCell(1)); applyHeader(sourcesHeader.getCell(2)); applyHeader(sourcesHeader.getCell(3));
  r++;

  const sourcesStart = r;
  // Senior Debt = PurchasePrice * (1 - DownPaymentPct)
  setLabel(ws.getCell(`A${r}`), "Senior Debt");
  setFormula(ws.getCell(`B${r}`), `=PurchasePrice*(1-DownPaymentPct)`, FMT.currency);
  setFormula(ws.getCell(`C${r}`), `=B${r}/$B$${r + 2}`, FMT.pct1);
  const seniorDebtRow = r;
  r++;
  // Equity Required = Total Uses - Senior Debt
  setLabel(ws.getCell(`A${r}`), "Equity Required");
  setFormula(ws.getCell(`B${r}`), `=B${totalUsesRow}-B${seniorDebtRow}`, FMT.currency);
  setFormula(ws.getCell(`C${r}`), `=B${r}/$B$${r + 1}`, FMT.pct1);
  r++;
  setLabel(ws.getCell(`A${r}`), "Total Sources", true);
  setFormula(ws.getCell(`B${r}`), `=SUM(B${sourcesStart}:B${r - 1})`, FMT.currency, true);
  setFormula(ws.getCell(`C${r}`), `=SUM(C${sourcesStart}:C${r - 1})`, FMT.pct1, true);
  ws.getRow(r).eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: COLOR_TOTAL_FILL }; });
  r += 2;

  // LTV / LTC
  setLabel(ws.getCell(`A${r}`), "LTV (Senior / Purchase)", true);
  setFormula(ws.getCell(`B${r}`), `=B${seniorDebtRow}/PurchasePrice`, FMT.pct);
  r++;
  setLabel(ws.getCell(`A${r}`), "LTC (Senior / Total Uses)", true);
  setFormula(ws.getCell(`B${r}`), `=B${seniorDebtRow}/B${totalUsesRow}`, FMT.pct);
  r++;

  wb.definedNames.add(`'${ws.name}'!$B$${seniorDebtRow}`, "LoanAmount");
  wb.definedNames.add(`'${ws.name}'!$B$${totalUsesRow}`, "TotalUses");
  wb.definedNames.add(`'${ws.name}'!$B$${seniorDebtRow + 1}`, "InitialEquity");
}

// ── 3. PRO FORMA ───────────────────────────────────────────────────────
function buildProFormaSheet(wb: ExcelJS.Workbook, _args: BuildArgs) {
  const ws = wb.addWorksheet("Pro_Forma", { properties: { tabColor: { argb: "FF0EA5E9" } } });
  ws.columns = [{ width: 36 }, { width: 18 }, { width: 14 }];

  ws.getCell("A1").value = "Year-1 Pro Forma (Stabilized)";
  ws.getCell("A1").font = { name: FONT, size: 13, bold: true, color: COLOR_HEADER_FILL };
  ws.mergeCells("A1:C1");

  let r = 3;
  const header = ws.getRow(r);
  setLabel(header.getCell(1), "Line Item", true);
  setLabel(header.getCell(2), "Annual", true);
  setLabel(header.getCell(3), "% EGI", true);
  applyHeader(header.getCell(1)); applyHeader(header.getCell(2)); applyHeader(header.getCell(3));
  r++;

  setLabel(ws.getCell(`A${r}`), "Gross Potential Rent");
  setFormula(ws.getCell(`B${r}`), `=MonthlyRent*12`, FMT.currency);
  const gpiRow = r;
  r++;

  setLabel(ws.getCell(`A${r}`), "Other Income");
  setFormula(ws.getCell(`B${r}`), `=OtherIncome`, FMT.currency);
  const otherRow = r;
  r++;

  setLabel(ws.getCell(`A${r}`), "Less: Vacancy Loss");
  setFormula(ws.getCell(`B${r}`), `=-B${gpiRow}*VacancyPct`, FMT.currency);
  const vacRow = r;
  r++;

  setLabel(ws.getCell(`A${r}`), "Effective Gross Income (EGI)", true);
  setFormula(ws.getCell(`B${r}`), `=B${gpiRow}+B${otherRow}+B${vacRow}`, FMT.currency, true);
  const egiRow = r;
  ws.getRow(r).eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: COLOR_TOTAL_FILL }; });
  r += 2;

  setLabel(ws.getCell(`A${r}`), "Operating Expenses", true);
  applySection(ws.getCell(`A${r}`));
  applySection(ws.getCell(`B${r}`));
  applySection(ws.getCell(`C${r}`));
  r++;

  const opexStart = r;
  const opexLines: Array<[string, string]> = [
    ["Property Tax", "=PropertyTax"],
    ["Insurance", "=Insurance"],
    ["Property Management", `=B${egiRow}*PMPct`],
    ["Maintenance", `=B${egiRow}*MaintPct`],
    ["CapEx Reserve", `=B${egiRow}*CapExPct`],
  ];
  opexLines.forEach(([label, f]) => {
    setLabel(ws.getCell(`A${r}`), label);
    setFormula(ws.getCell(`B${r}`), f, FMT.currency);
    setFormula(ws.getCell(`C${r}`), `=B${r}/$B$${egiRow}`, FMT.pct1);
    r++;
  });
  const opexEnd = r - 1;

  setLabel(ws.getCell(`A${r}`), "Total Operating Expenses", true);
  setFormula(ws.getCell(`B${r}`), `=SUM(B${opexStart}:B${opexEnd})`, FMT.currency, true);
  setFormula(ws.getCell(`C${r}`), `=B${r}/$B$${egiRow}`, FMT.pct1, true);
  const totalOpexRow = r;
  ws.getRow(r).eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: COLOR_TOTAL_FILL }; });
  r += 2;

  setLabel(ws.getCell(`A${r}`), "Net Operating Income (NOI)", true);
  setFormula(ws.getCell(`B${r}`), `=B${egiRow}-B${totalOpexRow}`, FMT.currency, true);
  setFormula(ws.getCell(`C${r}`), `=B${r}/$B$${egiRow}`, FMT.pct1, true);
  const noiRow = r;
  ws.getRow(r).eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: COLOR_SECTION_FILL }; });
  r += 2;

  setLabel(ws.getCell(`A${r}`), "Debt Service (Annual)");
  setFormula(ws.getCell(`B${r}`), `=-PMT(InterestRate/12,LoanTermYears*12,LoanAmount)*12`, FMT.currency);
  const dsRow = r;
  r++;

  setLabel(ws.getCell(`A${r}`), "Cash Flow Before Tax", true);
  setFormula(ws.getCell(`B${r}`), `=B${noiRow}-B${dsRow}`, FMT.currency, true);
  ws.getRow(r).eachCell(c => { c.fill = { type: "pattern", pattern: "solid", fgColor: COLOR_SECTION_FILL }; });
  r += 2;

  // Key ratios
  setLabel(ws.getCell(`A${r}`), "Cap Rate (NOI / Purchase)", true);
  setFormula(ws.getCell(`B${r}`), `=B${noiRow}/PurchasePrice`, FMT.pct);
  r++;
  setLabel(ws.getCell(`A${r}`), "DSCR", true);
  setFormula(ws.getCell(`B${r}`), `=IFERROR(B${noiRow}/B${dsRow},0)`, FMT.multiple);
  r++;
  setLabel(ws.getCell(`A${r}`), "Cash-on-Cash", true);
  setFormula(ws.getCell(`B${r}`), `=IFERROR((B${noiRow}-B${dsRow})/InitialEquity,0)`, FMT.pct);
  r++;
  setLabel(ws.getCell(`A${r}`), "OpEx Ratio", true);
  setFormula(ws.getCell(`B${r}`), `=B${totalOpexRow}/B${egiRow}`, FMT.pct);

  wb.definedNames.add(`'${ws.name}'!$B$${gpiRow}`, "Y1_GPI");
  wb.definedNames.add(`'${ws.name}'!$B$${otherRow}`, "Y1_Other");
  wb.definedNames.add(`'${ws.name}'!$B$${vacRow}`, "Y1_Vac");
  wb.definedNames.add(`'${ws.name}'!$B$${totalOpexRow}`, "Y1_OpEx");
  wb.definedNames.add(`'${ws.name}'!$B$${noiRow}`, "Y1_NOI");
  wb.definedNames.add(`'${ws.name}'!$B$${dsRow}`, "AnnualDebtService");
}

// ── 4. RETURNS — multi-year hold model ─────────────────────────────────
function buildReturnsSheet(wb: ExcelJS.Workbook, args: BuildArgs) {
  const ws = wb.addWorksheet("Returns", { properties: { tabColor: { argb: "FF8B5CF6" } } });
  const hold = args.returnsAssumptions.hold_years;
  const cols: Partial<ExcelJS.Column>[] = [{ width: 32 }];
  for (let i = 0; i <= hold; i++) cols.push({ width: 14 });
  ws.columns = cols;

  ws.getCell("A1").value = `${hold}-Year Hold Cash Flow Model`;
  ws.getCell("A1").font = { name: FONT, size: 13, bold: true, color: COLOR_HEADER_FILL };
  ws.mergeCells(1, 1, 1, hold + 2);

  let r = 3;
  // Year header row
  const yearRow = ws.getRow(r);
  setLabel(yearRow.getCell(1), "", true);
  applyHeader(yearRow.getCell(1));
  yearRow.getCell(2).value = "Year 0";
  applyHeader(yearRow.getCell(2));
  yearRow.getCell(2).font = { name: FONT, size: 11, bold: true, color: COLOR_HEADER_FONT };
  for (let y = 1; y <= hold; y++) {
    const c = yearRow.getCell(2 + y);
    c.value = `Year ${y}`;
    applyHeader(c);
    c.font = { name: FONT, size: 11, bold: true, color: COLOR_HEADER_FONT };
  }
  r++;

  const col = (y: number) => ws.getColumn(2 + y).letter; // y=0 -> B, y=1 -> C, ...

  // Gross Rent (grows by RentGrowth)
  setLabel(ws.getCell(`A${r}`), "Gross Rent");
  for (let y = 1; y <= hold; y++) {
    setLink(ws.getCell(`${col(y)}${r}`), `=Y1_GPI*(1+RentGrowth)^(${y}-1)`, FMT.currency);
  }
  const grossRow = r; r++;

  setLabel(ws.getCell(`A${r}`), "Other Income");
  for (let y = 1; y <= hold; y++) {
    setLink(ws.getCell(`${col(y)}${r}`), `=Y1_Other*(1+RentGrowth)^(${y}-1)`, FMT.currency);
  }
  const otherRow = r; r++;

  setLabel(ws.getCell(`A${r}`), "Vacancy Loss");
  for (let y = 1; y <= hold; y++) {
    setFormula(ws.getCell(`${col(y)}${r}`), `=-${col(y)}${grossRow}*VacancyPct`, FMT.currency);
  }
  const vacRow = r; r++;

  setLabel(ws.getCell(`A${r}`), "Effective Gross Income", true);
  for (let y = 1; y <= hold; y++) {
    setFormula(ws.getCell(`${col(y)}${r}`), `=${col(y)}${grossRow}+${col(y)}${otherRow}+${col(y)}${vacRow}`, FMT.currency, true);
  }
  const egiRow = r;
  ws.getRow(r).eachCell(c => { if (c.value) c.fill = { type: "pattern", pattern: "solid", fgColor: COLOR_TOTAL_FILL }; });
  r++;

  setLabel(ws.getCell(`A${r}`), "Operating Expenses");
  for (let y = 1; y <= hold; y++) {
    setLink(ws.getCell(`${col(y)}${r}`), `=-Y1_OpEx*(1+ExpenseGrowth)^(${y}-1)`, FMT.currency);
  }
  const opexRow = r; r++;

  setLabel(ws.getCell(`A${r}`), "NOI", true);
  for (let y = 1; y <= hold; y++) {
    setFormula(ws.getCell(`${col(y)}${r}`), `=${col(y)}${egiRow}+${col(y)}${opexRow}`, FMT.currency, true);
  }
  const noiRow = r;
  ws.getRow(r).eachCell(c => { if (c.value) c.fill = { type: "pattern", pattern: "solid", fgColor: COLOR_SECTION_FILL }; });
  r++;

  setLabel(ws.getCell(`A${r}`), "Debt Service");
  for (let y = 1; y <= hold; y++) {
    setLink(ws.getCell(`${col(y)}${r}`), `=-AnnualDebtService`, FMT.currency);
  }
  const dsRow = r; r++;

  setLabel(ws.getCell(`A${r}`), "Loan Balance (EOY)");
  for (let y = 1; y <= hold; y++) {
    // CUMPRINC returns negative principal paid; balance = loan + CUMPRINC
    setLink(
      ws.getCell(`${col(y)}${r}`),
      `=LoanAmount+CUMPRINC(InterestRate/12,LoanTermYears*12,LoanAmount,1,${y}*12,0)`,
      FMT.currency
    );
  }
  const balRow = r; r++;

  // Exit (Year-N only)
  setLabel(ws.getCell(`A${r}`), "Exit Value");
  setFormula(
    ws.getCell(`${col(hold)}${r}`),
    `=IF(ExitCap>0,${col(hold)}${noiRow}/ExitCap,ARV*(1+Appreciation)^HoldYears)`,
    FMT.currency
  );
  const exitValRow = r; r++;

  setLabel(ws.getCell(`A${r}`), "Cost of Sale");
  setFormula(ws.getCell(`${col(hold)}${r}`), `=-${col(hold)}${exitValRow}*CostOfSale`, FMT.currency);
  const exitCostRow = r; r++;

  setLabel(ws.getCell(`A${r}`), "Loan Payoff");
  setFormula(ws.getCell(`${col(hold)}${r}`), `=-${col(hold)}${balRow}`, FMT.currency);
  const payoffRow = r; r++;

  setLabel(ws.getCell(`A${r}`), "Net Sale Proceeds", true);
  setFormula(
    ws.getCell(`${col(hold)}${r}`),
    `=${col(hold)}${exitValRow}+${col(hold)}${exitCostRow}+${col(hold)}${payoffRow}`,
    FMT.currency,
    true
  );
  const netSaleRow = r;
  ws.getRow(r).eachCell(c => { if (c.value) c.fill = { type: "pattern", pattern: "solid", fgColor: COLOR_SECTION_FILL }; });
  r += 2;

  // Levered cash flow series for IRR
  setLabel(ws.getCell(`A${r}`), "Levered Cash Flow", true);
  setLink(ws.getCell(`B${r}`), `=-InitialEquity`, FMT.currency, true);
  for (let y = 1; y <= hold; y++) {
    const isLast = y === hold;
    const f = isLast
      ? `=${col(y)}${noiRow}+${col(y)}${dsRow}+${col(y)}${netSaleRow}`
      : `=${col(y)}${noiRow}+${col(y)}${dsRow}`;
    setFormula(ws.getCell(`${col(y)}${r}`), f, FMT.currency, true);
  }
  const leveredCFRow = r;
  ws.getRow(r).eachCell(c => { if (c.value) c.fill = { type: "pattern", pattern: "solid", fgColor: COLOR_SECTION_FILL }; });
  r++;

  setLabel(ws.getCell(`A${r}`), "Cash-on-Cash");
  for (let y = 1; y <= hold; y++) {
    setFormula(
      ws.getCell(`${col(y)}${r}`),
      `=IFERROR((${col(y)}${noiRow}+${col(y)}${dsRow})/InitialEquity,0)`,
      FMT.pct
    );
  }
  r += 2;

  // Summary metrics
  setLabel(ws.getCell(`A${r}`), "Levered IRR", true);
  setFormula(ws.getCell(`B${r}`), `=IFERROR(IRR(B${leveredCFRow}:${col(hold)}${leveredCFRow}),0)`, FMT.pct, true);
  r++;
  setLabel(ws.getCell(`A${r}`), "Equity Multiple", true);
  setFormula(
    ws.getCell(`B${r}`),
    `=IFERROR((SUM(C${leveredCFRow}:${col(hold)}${leveredCFRow}))/InitialEquity,0)`,
    FMT.multiple,
    true
  );
  r++;
  setLabel(ws.getCell(`A${r}`), "Average Annual Return (AAR)", true);
  setFormula(
    ws.getCell(`B${r}`),
    `=IFERROR((SUM(C${leveredCFRow}:${col(hold)}${leveredCFRow})-InitialEquity)/InitialEquity/HoldYears,0)`,
    FMT.pct,
    true
  );

  wb.definedNames.add(`'${ws.name}'!$B$${leveredCFRow}:$${col(hold)}$${leveredCFRow}`, "LeveredCF");
}

// ── 5. SUMMARY ─────────────────────────────────────────────────────────
function buildSummarySheet(wb: ExcelJS.Workbook, args: BuildArgs) {
  const ws = wb.addWorksheet("Summary", { properties: { tabColor: { argb: "FFEF4444" } } });
  ws.columns = [{ width: 36 }, { width: 20 }];

  ws.getCell("A1").value = "Investor Summary";
  ws.getCell("A1").font = { name: FONT, size: 16, bold: true, color: COLOR_HEADER_FILL };
  ws.mergeCells("A1:B1");

  ws.getCell("A2").value = args.dealName;
  ws.getCell("A2").font = { name: FONT, size: 12, bold: true };
  ws.mergeCells("A2:B2");

  ws.getCell("A3").value = args.address || "";
  ws.getCell("A3").font = { name: FONT, size: 10, italic: true, color: { argb: "FF666666" } };
  ws.mergeCells("A3:B3");

  let r = 5;
  const sec = (label: string) => {
    const c = ws.getCell(`A${r}`);
    setLabel(c, label, true);
    applySection(c);
    applySection(ws.getCell(`B${r}`));
    r++;
  };
  const row = (label: string, formula: string, fmt: string) => {
    setLabel(ws.getCell(`A${r}`), label);
    setLink(ws.getCell(`B${r}`), formula, fmt, true);
    r++;
  };

  sec("Deal Snapshot");
  row("Purchase Price", "=PurchasePrice", FMT.currency);
  row("ARV", "=ARV", FMT.currency);
  row("Total Project Cost", "=Sources_Uses!B8", FMT.currency); // TotalUses
  row("Senior Debt", "=LoanAmount", FMT.currency);
  row("Equity Required", "=InitialEquity", FMT.currency);
  row("LTV", "=LoanAmount/PurchasePrice", FMT.pct);

  r++;
  sec("Year-1 Stabilized");
  row("Gross Rent", "=Y1_GPI", FMT.currency);
  row("Operating Expenses", "=Y1_OpEx", FMT.currency);
  row("NOI", "=Y1_NOI", FMT.currency);
  row("Debt Service", "=AnnualDebtService", FMT.currency);
  row("Cash Flow", "=Y1_NOI-AnnualDebtService", FMT.currency);
  row("Cap Rate", "=Y1_NOI/PurchasePrice", FMT.pct);
  row("DSCR", "=IFERROR(Y1_NOI/AnnualDebtService,0)", FMT.multiple);
  row("Cash-on-Cash", "=IFERROR((Y1_NOI-AnnualDebtService)/InitialEquity,0)", FMT.pct);

  r++;
  sec(`${args.returnsAssumptions.hold_years}-Year Hold Returns`);
  row("Levered IRR", "=IFERROR(IRR(LeveredCF),0)", FMT.pct);
  row(
    "Equity Multiple",
    "=IFERROR(SUM(OFFSET(LeveredCF,0,1,1,COLUMNS(LeveredCF)-1))/InitialEquity,0)",
    FMT.multiple
  );
  row("Hold Period", "=HoldYears", FMT.number);

  r++;
  ws.getCell(`A${r}`).value = "Color legend: Blue = input · Black = formula · Green = cross-sheet link";
  ws.getCell(`A${r}`).font = { name: FONT, size: 9, italic: true, color: { argb: "FF666666" } };
  ws.mergeCells(`A${r}:B${r}`);
  r++;
  ws.getCell(`A${r}`).value = "Disclaimer: For investor review. Not investment advice. All inputs editable in Assumptions tab.";
  ws.getCell(`A${r}`).font = { name: FONT, size: 9, italic: true, color: { argb: "FF666666" } };
  ws.mergeCells(`A${r}:B${r}`);

  // Make Summary the first tab
  wb.views = [{ x: 0, y: 0, width: 12000, height: 24000, firstSheet: 0, activeTab: wb.worksheets.length - 1, visibility: "visible" }];
}
