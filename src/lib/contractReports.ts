/**
 * ContractIQ PDF reports — CBRE / McKinsey grade deal book.
 *
 * Four reports:
 *   - Full Deal Book PDF       generateFullDealBookPDF()
 *   - Highlight Brief PDF      generateHighlightBriefPDF()
 *   - Attorney Questions PDF   generateAttorneyQuestionsPDF()
 *   - Broker Questions PDF     generateBrokerQuestionsPDF()
 *
 * Design constraints:
 *   - Helvetica only (NO italics anywhere)
 *   - Navy #0A1F44 headings, gold #C9A84C accent rules
 *   - 11pt body, 10pt tables, 17pt bold headings
 *   - Each major section starts on a fresh page
 *   - Cover: contract title, counterparty, prepared-by, date, BRIX · ContractIQ — Highly Confidential
 *   - Bullet renderer skips empty labels (no orphan gold squares)
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  ContractAnalysis,
  Pro,
  Con,
  Weakness,
  Question,
  BrokerQuestion,
  RiskMatrixRow,
  LiabilityRow,
  WhoPaysRow,
  TimelineRow,
  NegotiationMove,
  Deadline,
} from "./contractIQEngine";

// ── Brand tokens ───────────────────────────────────────────────────────
const NAVY: [number, number, number] = [10, 31, 68]; // #0A1F44
const GOLD: [number, number, number] = [201, 168, 76]; // #C9A84C
const MUTED: [number, number, number] = [107, 114, 128]; // #6B7280
const TEXT: [number, number, number] = [17, 24, 39]; // near-black for body
const DANGER: [number, number, number] = [185, 28, 28];
const AMBER: [number, number, number] = [180, 83, 9];
const SUCCESS: [number, number, number] = [15, 118, 110];
const BORDER: [number, number, number] = [229, 231, 235];

const PAGE_W = 612; // letter width in pt
const PAGE_H = 792;
const MARGIN_X = 56;
const MARGIN_Y = 64;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—";
const sevLabel = (s: "high" | "moderate" | "low") =>
  s === "high" ? "HIGH" : s === "moderate" ? "MODERATE" : "LOW";
const sevColor = (s: "high" | "moderate" | "low"): [number, number, number] =>
  s === "high" ? DANGER : s === "moderate" ? AMBER : MUTED;

// ── Inputs ─────────────────────────────────────────────────────────────
export interface ContractReportContext {
  contractTitle: string;
  contractType?: string | null;
  propertyAddress?: string | null;
  counterparty?: string | null;
  buyerName?: string | null;
  sellerName?: string | null;
  purchasePrice?: number | null;
  earnestMoney?: number | null;
  closingDate?: string | null;
  preparedBy: string; // logged-in user's name or email
  analysis: ContractAnalysis;
}

// ── Drawing helpers ────────────────────────────────────────────────────
type Doc = jsPDF & { lastAutoTable?: { finalY: number } };

function setFont(doc: Doc, weight: "normal" | "bold" = "normal") {
  // Helvetica only — never italic.
  doc.setFont("helvetica", weight);
}

function setColor(doc: Doc, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function setFill(doc: Doc, c: [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}

function setDraw(doc: Doc, c: [number, number, number]) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

function ensureSpace(doc: Doc, y: number, needed: number): number {
  if (y + needed > PAGE_H - MARGIN_Y) {
    doc.addPage();
    drawRunningHeader(doc);
    return MARGIN_Y + 24;
  }
  return y;
}

function drawRunningHeader(doc: Doc) {
  setFont(doc, "bold");
  doc.setFontSize(9);
  setColor(doc, NAVY);
  doc.text("BRIX · CONTRACTIQ", MARGIN_X, 36);
  setFont(doc, "normal");
  setColor(doc, MUTED);
  doc.text("HIGHLY CONFIDENTIAL · FAMILY ADVISORY MATERIAL", PAGE_W - MARGIN_X, 36, { align: "right" });
  // gold rule
  setDraw(doc, GOLD);
  doc.setLineWidth(0.8);
  doc.line(MARGIN_X, 44, PAGE_W - MARGIN_X, 44);
  setColor(doc, TEXT);
}

function drawFooter(doc: Doc) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    setFont(doc, "normal");
    doc.setFontSize(8);
    setColor(doc, MUTED);
    doc.text(
      "BRIX · ContractIQ · Highly Confidential · Family Advisory Material",
      MARGIN_X,
      PAGE_H - 28,
    );
    doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN_X, PAGE_H - 28, { align: "right" });
  }
}

function sectionHeader(doc: Doc, y: number, title: string, eyebrow?: string): number {
  if (eyebrow) {
    setFont(doc, "bold");
    doc.setFontSize(8);
    setColor(doc, GOLD);
    doc.text(eyebrow.toUpperCase(), MARGIN_X, y);
    y += 12;
  }
  setFont(doc, "bold");
  doc.setFontSize(17);
  setColor(doc, NAVY);
  doc.text(title, MARGIN_X, y);
  y += 6;
  setDraw(doc, GOLD);
  doc.setLineWidth(1.2);
  doc.line(MARGIN_X, y, MARGIN_X + 36, y);
  y += 18;
  setColor(doc, TEXT);
  setFont(doc, "normal");
  doc.setFontSize(11);
  return y;
}

function bodyParagraph(doc: Doc, y: number, text: string, opts?: { color?: [number, number, number]; size?: number }): number {
  setFont(doc, "normal");
  doc.setFontSize(opts?.size ?? 11);
  setColor(doc, opts?.color ?? TEXT);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  for (const line of lines as string[]) {
    y = ensureSpace(doc, y, 15);
    doc.text(line, MARGIN_X, y);
    y += 15;
  }
  return y;
}

/**
 * Bullet renderer that skips empty labels (no orphan gold squares).
 * `items` may be objects with optional label/detail or plain strings.
 */
function bulletList(
  doc: Doc,
  y: number,
  items: Array<{ label?: string; detail?: string } | string>,
): number {
  setFont(doc, "normal");
  doc.setFontSize(11);
  for (const raw of items) {
    const label =
      typeof raw === "string"
        ? raw.trim()
        : (raw.label ?? "").trim();
    const detail =
      typeof raw === "string" ? "" : (raw.detail ?? "").trim();

    // Skip entirely if both label and detail are empty — no orphan squares.
    if (!label && !detail) continue;

    y = ensureSpace(doc, y, 18);
    // Gold square bullet
    setFill(doc, GOLD);
    doc.rect(MARGIN_X, y - 7, 4, 4, "F");

    const textX = MARGIN_X + 12;
    const textW = CONTENT_W - 12;

    if (label) {
      setFont(doc, "bold");
      setColor(doc, NAVY);
      const labelLines = doc.splitTextToSize(label, textW) as string[];
      for (let i = 0; i < labelLines.length; i++) {
        if (i > 0) y = ensureSpace(doc, y, 14);
        doc.text(labelLines[i], textX, y);
        if (i < labelLines.length - 1) y += 14;
      }
    }

    if (detail) {
      if (label) y += 13;
      setFont(doc, "normal");
      setColor(doc, TEXT);
      const detailLines = doc.splitTextToSize(detail, textW) as string[];
      for (let i = 0; i < detailLines.length; i++) {
        if (i > 0) y = ensureSpace(doc, y, 14);
        doc.text(detailLines[i], textX, y);
        if (i < detailLines.length - 1) y += 14;
      }
    }

    y += 14;
  }
  return y;
}

// ── Cover page ─────────────────────────────────────────────────────────
function coverPage(doc: Doc, ctx: ContractReportContext, reportLabel: string) {
  // Navy band top
  setFill(doc, NAVY);
  doc.rect(0, 0, PAGE_W, 180, "F");

  setFont(doc, "bold");
  setColor(doc, [255, 255, 255]);
  doc.setFontSize(32);
  doc.text("BRIX", MARGIN_X, 90);

  setFont(doc, "normal");
  doc.setFontSize(10);
  setColor(doc, GOLD);
  doc.text("CONTRACTIQ", MARGIN_X + 96, 90);

  setFont(doc, "normal");
  doc.setFontSize(9);
  setColor(doc, [255, 255, 255]);
  doc.text("HIGHLY CONFIDENTIAL · FAMILY ADVISORY MATERIAL", MARGIN_X, 120);

  // Gold rule
  setFill(doc, GOLD);
  doc.rect(MARGIN_X, 150, 60, 3, "F");

  // Report label
  let y = 230;
  setFont(doc, "bold");
  doc.setFontSize(9);
  setColor(doc, GOLD);
  doc.text(reportLabel.toUpperCase(), MARGIN_X, y);
  y += 24;

  // Title
  setFont(doc, "bold");
  doc.setFontSize(28);
  setColor(doc, NAVY);
  const titleLines = doc.splitTextToSize(ctx.contractTitle, CONTENT_W) as string[];
  for (const line of titleLines) {
    doc.text(line, MARGIN_X, y);
    y += 32;
  }

  // Subtitle
  if (ctx.propertyAddress) {
    setFont(doc, "normal");
    doc.setFontSize(13);
    setColor(doc, MUTED);
    const addrLines = doc.splitTextToSize(ctx.propertyAddress, CONTENT_W) as string[];
    for (const line of addrLines) {
      doc.text(line, MARGIN_X, y);
      y += 18;
    }
  }

  y += 32;

  // Meta block
  const meta: Array<[string, string]> = [
    ["Contract Type", ctx.contractType ?? "—"],
    ["Counterparty", ctx.counterparty ?? "—"],
    ["Purchase Price", fmtMoney(ctx.purchasePrice)],
    ["Earnest Money", fmtMoney(ctx.earnestMoney)],
    ["Closing Date", fmtDate(ctx.closingDate)],
    ["Perspective", `${ctx.analysis.perspective.toUpperCase()}-side analysis`],
    ["Decision", ctx.analysis.decision.toUpperCase()],
  ];
  setFont(doc, "normal");
  doc.setFontSize(10);
  for (const [k, v] of meta) {
    setColor(doc, MUTED);
    doc.text(k.toUpperCase(), MARGIN_X, y);
    setFont(doc, "bold");
    setColor(doc, NAVY);
    doc.text(v, MARGIN_X + 160, y);
    setFont(doc, "normal");
    y += 18;
  }

  // Prepared by + date footer block
  setDraw(doc, BORDER);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X, PAGE_H - 130, PAGE_W - MARGIN_X, PAGE_H - 130);

  setFont(doc, "normal");
  doc.setFontSize(9);
  setColor(doc, MUTED);
  doc.text("PREPARED BY", MARGIN_X, PAGE_H - 110);
  doc.text("DATE", PAGE_W - MARGIN_X - 100, PAGE_H - 110);

  setFont(doc, "bold");
  setColor(doc, NAVY);
  doc.setFontSize(11);
  doc.text(ctx.preparedBy, MARGIN_X, PAGE_H - 94);
  doc.text(
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    PAGE_W - MARGIN_X - 100,
    PAGE_H - 94,
  );

  setFont(doc, "normal");
  setColor(doc, MUTED);
  doc.setFontSize(8);
  doc.text(
    "BRIX · ContractIQ — Highly Confidential. This deal book is advisory material for the named recipient only. Not legal advice.",
    MARGIN_X,
    PAGE_H - 56,
    { maxWidth: CONTENT_W },
  );
}

// ── Section: Executive Summary ─────────────────────────────────────────
function sectionExecutiveSummary(doc: Doc, ctx: ContractReportContext) {
  doc.addPage();
  drawRunningHeader(doc);
  let y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, "Executive Summary", "Bottom Line");

  // Decision card
  const decisionColor =
    ctx.analysis.decision === "Proceed"
      ? SUCCESS
      : ctx.analysis.decision === "Renegotiate"
      ? AMBER
      : DANGER;
  setFill(doc, decisionColor);
  doc.rect(MARGIN_X, y, 4, 36, "F");
  setFont(doc, "bold");
  doc.setFontSize(14);
  setColor(doc, NAVY);
  doc.text(`Decision: ${ctx.analysis.decision}`, MARGIN_X + 14, y + 16);
  setFont(doc, "normal");
  doc.setFontSize(10);
  setColor(doc, MUTED);
  doc.text(
    `Risk ${ctx.analysis.riskScore}/100   ·   Leverage ${ctx.analysis.leverageScore}/100   ·   ${ctx.analysis.perspective.toUpperCase()} side`,
    MARGIN_X + 14,
    y + 32,
  );
  y += 56;

  y = bodyParagraph(doc, y, ctx.analysis.executiveSummary);
  y += 8;
  y = bodyParagraph(doc, y, ctx.analysis.decisionRationale, { color: MUTED, size: 10 });

  if (ctx.analysis.takeaways.length) {
    y += 16;
    setFont(doc, "bold");
    doc.setFontSize(11);
    setColor(doc, NAVY);
    y = ensureSpace(doc, y, 18);
    doc.text("Key Takeaways", MARGIN_X, y);
    y += 14;
    y = bulletList(
      doc,
      y,
      ctx.analysis.takeaways.map((t) => ({ label: t })),
    );
  }
}

// ── Section: Pros / Cons ───────────────────────────────────────────────
function sectionProsAndCons(doc: Doc, ctx: ContractReportContext) {
  doc.addPage();
  drawRunningHeader(doc);
  let y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, `Pros for ${ctx.analysis.perspective}`, "Favorable Terms");
  y = bulletList(
    doc,
    y,
    ctx.analysis.pros.length
      ? ctx.analysis.pros.map((p: Pro) => ({ label: p.label, detail: p.detail }))
      : [{ label: "No favorable terms identified." }],
  );

  doc.addPage();
  drawRunningHeader(doc);
  y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, `Cons for ${ctx.analysis.perspective}`, "Concerns");
  if (!ctx.analysis.cons.length) {
    y = bulletList(doc, y, [{ label: "No concerns identified." }]);
    return;
  }
  for (const c of ctx.analysis.cons as Con[]) {
    y = ensureSpace(doc, y, 36);
    setFill(doc, sevColor(c.severity));
    doc.rect(MARGIN_X, y - 7, 4, 4, "F");
    setFont(doc, "bold");
    setColor(doc, NAVY);
    doc.setFontSize(11);
    doc.text(c.label, MARGIN_X + 12, y);
    setFont(doc, "bold");
    setColor(doc, sevColor(c.severity));
    doc.setFontSize(8);
    doc.text(`  ${sevLabel(c.severity)}`, MARGIN_X + 12 + doc.getTextWidth(c.label), y);
    y += 14;
    setFont(doc, "normal");
    setColor(doc, TEXT);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(c.detail, CONTENT_W - 12) as string[];
    for (const line of lines) {
      y = ensureSpace(doc, y, 14);
      doc.text(line, MARGIN_X + 12, y);
      y += 14;
    }
    y += 8;
  }
}

// ── Section: Risk Matrix ───────────────────────────────────────────────
function sectionRiskMatrix(doc: Doc, ctx: ContractReportContext) {
  doc.addPage();
  drawRunningHeader(doc);
  let y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, "Risk Matrix", "Severity & Mitigation");

  const rows = (ctx.analysis.riskMatrix as RiskMatrixRow[]).map((r) => [
    sevLabel(r.severity),
    r.risk,
    r.mitigation,
  ]);

  if (!rows.length) {
    bodyParagraph(doc, y, "No material risks identified.");
    return;
  }

  autoTable(doc, {
    startY: y,
    head: [["Severity", "Risk", "Recommended Mitigation"]],
    body: rows,
    styles: { font: "helvetica", fontStyle: "normal", fontSize: 10, cellPadding: 8, lineColor: BORDER, lineWidth: 0.5, textColor: TEXT },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: "bold" },
      1: { cellWidth: 160 },
      2: { cellWidth: "auto" },
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const sev = data.cell.raw as string;
        const c = sev === "HIGH" ? DANGER : sev === "MODERATE" ? AMBER : MUTED;
        data.cell.styles.textColor = c;
      }
    },
  });
}

// ── Section: Liability Allocation ──────────────────────────────────────
function sectionLiabilityAllocation(doc: Doc, ctx: ContractReportContext) {
  doc.addPage();
  drawRunningHeader(doc);
  let y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, "Liability Allocation", "Who Owes What, When, Why");

  y = bodyParagraph(
    doc,
    y,
    "This table tracks every cost and risk allocated by the contract — including property tax obligations after rezoning, insurance, environmental conditions, liens, and default remedies.",
    { color: MUTED, size: 10 },
  );
  y += 6;

  const rows = (ctx.analysis.liabilityAllocation as LiabilityRow[]).map((r) => [
    r.item,
    r.party === "unspecified" ? "Unspecified" : r.party.toUpperCase(),
    r.when,
    r.why,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Item", "Party", "When", "Why"]],
    body: rows,
    styles: { font: "helvetica", fontStyle: "normal", fontSize: 9.5, cellPadding: 7, lineColor: BORDER, lineWidth: 0.5, textColor: TEXT },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 130, fontStyle: "bold" },
      1: { cellWidth: 60 },
      2: { cellWidth: 90 },
      3: { cellWidth: "auto" },
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
}

// ── Section: Who Pays What ─────────────────────────────────────────────
function sectionWhoPaysWhat(doc: Doc, ctx: ContractReportContext) {
  doc.addPage();
  drawRunningHeader(doc);
  let y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, "Who Pays What", "Closing Cost Allocation");

  const rows = (ctx.analysis.whoPaysWhat as WhoPaysRow[]).map((r) => [
    r.item,
    r.buyer ? "X" : "",
    r.seller ? "X" : "",
    r.notes,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Item", "Buyer", "Seller", "Notes"]],
    body: rows,
    styles: { font: "helvetica", fontStyle: "normal", fontSize: 10, cellPadding: 8, lineColor: BORDER, lineWidth: 0.5, textColor: TEXT },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 170, fontStyle: "bold" },
      1: { cellWidth: 50, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 50, halign: "center", fontStyle: "bold" },
      3: { cellWidth: "auto" },
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
}

// ── Section: Timeline ──────────────────────────────────────────────────
function sectionTimeline(doc: Doc, ctx: ContractReportContext) {
  doc.addPage();
  drawRunningHeader(doc);
  let y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, "Timeline", "Milestones & Deadlines");

  const rows = (ctx.analysis.timeline as TimelineRow[]).map((t) => [
    t.milestone,
    t.date ? fmtDate(t.date) : t.daysFromEffective != null ? `+${t.daysFromEffective} days from effective` : "Not set",
    t.party === "both" ? "Buyer & Seller" : t.party.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Milestone", "Date", "Party"]],
    body: rows,
    styles: { font: "helvetica", fontStyle: "normal", fontSize: 10, cellPadding: 8, lineColor: BORDER, lineWidth: 0.5, textColor: TEXT },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 220, fontStyle: "bold" },
      1: { cellWidth: 160 },
      2: { cellWidth: "auto" },
    },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
}

// ── Section: Negotiation Playbook ──────────────────────────────────────
function sectionNegotiation(doc: Doc, ctx: ContractReportContext) {
  doc.addPage();
  drawRunningHeader(doc);
  let y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, "Negotiation Playbook", "Specific Asks & Rationale");
  if (!ctx.analysis.negotiation.length) {
    bodyParagraph(doc, y, "No negotiation moves recommended at this time.");
    return;
  }
  let i = 1;
  for (const n of ctx.analysis.negotiation as NegotiationMove[]) {
    y = ensureSpace(doc, y, 40);
    setFont(doc, "bold");
    setColor(doc, GOLD);
    doc.setFontSize(11);
    doc.text(`${i}.`, MARGIN_X, y);
    setColor(doc, NAVY);
    const askLines = doc.splitTextToSize(n.ask, CONTENT_W - 22) as string[];
    for (let j = 0; j < askLines.length; j++) {
      if (j > 0) y = ensureSpace(doc, y, 14);
      doc.text(askLines[j], MARGIN_X + 22, y);
      if (j < askLines.length - 1) y += 14;
    }
    y += 14;
    setFont(doc, "normal");
    setColor(doc, MUTED);
    doc.setFontSize(10);
    const ratLines = doc.splitTextToSize(`Why: ${n.rationale}`, CONTENT_W - 22) as string[];
    for (const line of ratLines) {
      y = ensureSpace(doc, y, 13);
      doc.text(line, MARGIN_X + 22, y);
      y += 13;
    }
    y += 10;
    i++;
  }
}

// ── Section: Attorney Questions ────────────────────────────────────────
function sectionAttorneyQuestions(doc: Doc, ctx: ContractReportContext, isStandalone = false) {
  if (!isStandalone) doc.addPage();
  drawRunningHeader(doc);
  let y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, "Attorney Questions", "Legal & Financial Diligence");

  const grouped: Record<string, Question[]> = {};
  for (const q of ctx.analysis.attorneyQuestions as Question[]) {
    const key = q.category.charAt(0).toUpperCase() + q.category.slice(1);
    (grouped[key] ||= []).push(q);
  }

  const cats = Object.keys(grouped);
  if (cats.length === 0) {
    bodyParagraph(doc, y, "No outstanding attorney questions.");
    return;
  }

  for (const cat of cats) {
    y = ensureSpace(doc, y, 24);
    setFont(doc, "bold");
    doc.setFontSize(11);
    setColor(doc, GOLD);
    doc.text(cat.toUpperCase(), MARGIN_X, y);
    y += 16;
    let i = 1;
    for (const q of grouped[cat]) {
      y = ensureSpace(doc, y, 36);
      setFont(doc, "bold");
      setColor(doc, NAVY);
      doc.setFontSize(11);
      const numbered = `${i}. ${q.question}`;
      const qLines = doc.splitTextToSize(numbered, CONTENT_W) as string[];
      for (let j = 0; j < qLines.length; j++) {
        if (j > 0) y = ensureSpace(doc, y, 14);
        doc.text(qLines[j], MARGIN_X, y);
        if (j < qLines.length - 1) y += 14;
      }
      y += 14;
      setFont(doc, "normal");
      setColor(doc, MUTED);
      doc.setFontSize(10);
      const wLines = doc.splitTextToSize(`Why it matters: ${q.why}`, CONTENT_W) as string[];
      for (const line of wLines) {
        y = ensureSpace(doc, y, 13);
        doc.text(line, MARGIN_X, y);
        y += 13;
      }
      y += 10;
      i++;
    }
    y += 8;
  }
}

// ── Section: Broker Questions ──────────────────────────────────────────
function sectionBrokerQuestions(doc: Doc, ctx: ContractReportContext, isStandalone = false) {
  if (!isStandalone) doc.addPage();
  drawRunningHeader(doc);
  let y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, "Broker Questions", "Market & Counterparty Diligence");

  const qs = ctx.analysis.brokerQuestions as BrokerQuestion[];
  if (!qs.length) {
    bodyParagraph(doc, y, "No outstanding broker questions.");
    return;
  }

  let i = 1;
  for (const q of qs) {
    y = ensureSpace(doc, y, 36);
    setFont(doc, "bold");
    setColor(doc, NAVY);
    doc.setFontSize(11);
    const numbered = `${i}. ${q.question}`;
    const qLines = doc.splitTextToSize(numbered, CONTENT_W) as string[];
    for (let j = 0; j < qLines.length; j++) {
      if (j > 0) y = ensureSpace(doc, y, 14);
      doc.text(qLines[j], MARGIN_X, y);
      if (j < qLines.length - 1) y += 14;
    }
    y += 14;
    setFont(doc, "normal");
    setColor(doc, MUTED);
    doc.setFontSize(10);
    const wLines = doc.splitTextToSize(`Why it matters: ${q.why}`, CONTENT_W) as string[];
    for (const line of wLines) {
      y = ensureSpace(doc, y, 13);
      doc.text(line, MARGIN_X, y);
      y += 13;
    }
    y += 10;
    i++;
  }
}

// ── Section: Decision ──────────────────────────────────────────────────
function sectionDecision(doc: Doc, ctx: ContractReportContext) {
  doc.addPage();
  drawRunningHeader(doc);
  let y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, "Decision", "Recommendation & Next Steps");

  const decisionColor =
    ctx.analysis.decision === "Proceed"
      ? SUCCESS
      : ctx.analysis.decision === "Renegotiate"
      ? AMBER
      : DANGER;

  // Big decision card
  setFill(doc, decisionColor);
  doc.rect(MARGIN_X, y, 6, 64, "F");
  setFont(doc, "bold");
  doc.setFontSize(28);
  setColor(doc, NAVY);
  doc.text(ctx.analysis.decision.toUpperCase(), MARGIN_X + 18, y + 32);
  setFont(doc, "normal");
  doc.setFontSize(10);
  setColor(doc, MUTED);
  doc.text(
    `Risk ${ctx.analysis.riskScore}/100   ·   Leverage ${ctx.analysis.leverageScore}/100`,
    MARGIN_X + 18,
    y + 54,
  );
  y += 84;

  y = bodyParagraph(doc, y, ctx.analysis.decisionRationale);
  y += 12;

  setFont(doc, "bold");
  setColor(doc, NAVY);
  doc.setFontSize(12);
  y = ensureSpace(doc, y, 20);
  doc.text("Next Steps", MARGIN_X, y);
  y += 16;

  const steps =
    ctx.analysis.decision === "Proceed"
      ? [
          { label: "Calendar all deadlines from the timeline section." },
          { label: "Confirm receipt of all seller disclosures." },
          { label: "Bind property insurance effective at closing." },
        ]
      : ctx.analysis.decision === "Renegotiate"
      ? [
          { label: "Send the negotiation playbook to your broker." },
          { label: "Set a 48-hour response window for counterparty." },
          { label: "Hold execution until material moderate items are resolved." },
        ]
      : [
          { label: "Pause execution. Do not sign as drafted." },
          { label: "Forward this deal book to your real-estate attorney." },
          { label: "Resolve every HIGH-severity risk in writing before re-engaging." },
        ];

  y = bulletList(doc, y, steps);
}

// ── Section: Sources ───────────────────────────────────────────────────
function sectionSources(doc: Doc, ctx: ContractReportContext) {
  doc.addPage();
  drawRunningHeader(doc);
  let y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, "Sources & Method", "How This Was Built");

  y = bodyParagraph(
    doc,
    y,
    "Extraction: contract text was parsed by BRIX ContractIQ using a deterministic structured-output extractor (Lovable AI Gateway). The model identifies named fields verbatim and assigns null when a field is not stated. No inference is performed during extraction.",
  );
  y += 6;
  y = bodyParagraph(
    doc,
    y,
    "Analysis: every score, pro, con, risk-matrix row, liability allocation, and negotiation move is computed deterministically by the BRIX ContractIQ engine. The same inputs always produce the same output.",
  );
  y += 6;
  y = bodyParagraph(
    doc,
    y,
    "This document is advisory material only. It is not legal, tax, or investment advice. Confirm all material terms with your real-estate attorney before signing.",
    { color: MUTED, size: 10 },
  );

  if (ctx.analysis.weaknesses.length) {
    y += 12;
    setFont(doc, "bold");
    doc.setFontSize(11);
    setColor(doc, NAVY);
    y = ensureSpace(doc, y, 18);
    doc.text("Areas of Weakness in the Drafting", MARGIN_X, y);
    y += 14;
    y = bulletList(
      doc,
      y,
      (ctx.analysis.weaknesses as Weakness[]).map((w) => ({ label: w.label, detail: w.detail })),
    );
  }

  if (ctx.analysis.missingInputs.length) {
    y += 12;
    setFont(doc, "bold");
    doc.setFontSize(11);
    setColor(doc, NAVY);
    y = ensureSpace(doc, y, 18);
    doc.text("Inputs Not Found in the Contract", MARGIN_X, y);
    y += 14;
    y = bulletList(
      doc,
      y,
      ctx.analysis.missingInputs.map((m) => ({ label: m })),
    );
  }
}

function fileName(ctx: ContractReportContext, kind: string) {
  const safeTitle = ctx.contractTitle.replace(/[^a-z0-9]+/gi, "_").slice(0, 40);
  const date = new Date().toISOString().slice(0, 10);
  return `${safeTitle}_${kind}_${date}.pdf`;
}

// ── PUBLIC: Full Deal Book ─────────────────────────────────────────────
export function generateFullDealBookPDF(ctx: ContractReportContext): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" }) as Doc;
  coverPage(doc, ctx, "Full Deal Book");
  sectionExecutiveSummary(doc, ctx);
  sectionProsAndCons(doc, ctx);
  sectionRiskMatrix(doc, ctx);
  sectionLiabilityAllocation(doc, ctx);
  sectionWhoPaysWhat(doc, ctx);
  sectionTimeline(doc, ctx);
  sectionNegotiation(doc, ctx);
  sectionAttorneyQuestions(doc, ctx);
  sectionBrokerQuestions(doc, ctx);
  sectionDecision(doc, ctx);
  sectionSources(doc, ctx);
  drawFooter(doc);
  doc.save(fileName(ctx, "Full_Deal_Book"));
}

// ── PUBLIC: Highlight Brief ────────────────────────────────────────────
export function generateHighlightBriefPDF(ctx: ContractReportContext): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" }) as Doc;
  coverPage(doc, ctx, "Highlight Brief");

  // Bottom Line
  doc.addPage();
  drawRunningHeader(doc);
  let y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, "Bottom Line", "Decision");
  y = bodyParagraph(doc, y, ctx.analysis.executiveSummary);
  y += 6;
  y = bodyParagraph(doc, y, ctx.analysis.decisionRationale, { color: MUTED, size: 10 });

  // Pros
  doc.addPage();
  drawRunningHeader(doc);
  y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, `Pros for ${ctx.analysis.perspective}`, "Favorable Terms");
  y = bulletList(
    doc,
    y,
    ctx.analysis.pros.length
      ? ctx.analysis.pros.slice(0, 8).map((p) => ({ label: p.label, detail: p.detail }))
      : [{ label: "No favorable terms identified." }],
  );

  // Cons
  doc.addPage();
  drawRunningHeader(doc);
  y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, `Cons for ${ctx.analysis.perspective}`, "Concerns");
  y = bulletList(
    doc,
    y,
    ctx.analysis.cons.length
      ? ctx.analysis.cons
          .slice(0, 8)
          .map((c) => ({ label: `${c.label}  [${sevLabel(c.severity)}]`, detail: c.detail }))
      : [{ label: "No concerns identified." }],
  );

  // Who Pays What — bordered alternating-row table
  sectionWhoPaysWhat(doc, ctx);

  // Top Recommendations
  doc.addPage();
  drawRunningHeader(doc);
  y = MARGIN_Y + 24;
  y = sectionHeader(doc, y, "Top Recommendations", "Negotiation Priorities");
  y = bulletList(
    doc,
    y,
    ctx.analysis.negotiation.length
      ? ctx.analysis.negotiation.slice(0, 5).map((n) => ({ label: n.ask, detail: n.rationale }))
      : [{ label: "Proceed with standard diligence — no renegotiation needed." }],
  );

  // Decision
  sectionDecision(doc, ctx);

  drawFooter(doc);
  doc.save(fileName(ctx, "Highlight_Brief"));
}

// ── PUBLIC: Attorney Questions ─────────────────────────────────────────
export function generateAttorneyQuestionsPDF(ctx: ContractReportContext): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" }) as Doc;
  coverPage(doc, ctx, "Attorney Questions");
  doc.addPage();
  sectionAttorneyQuestions(doc, ctx, true);
  drawFooter(doc);
  doc.save(fileName(ctx, "Attorney_Questions"));
}

// ── PUBLIC: Broker Questions ───────────────────────────────────────────
export function generateBrokerQuestionsPDF(ctx: ContractReportContext): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" }) as Doc;
  coverPage(doc, ctx, "Broker Questions");
  doc.addPage();
  sectionBrokerQuestions(doc, ctx, true);
  drawFooter(doc);
  doc.save(fileName(ctx, "Broker_Questions"));
}

// Re-export helpers for ContractAnalysis page (for context display).
export type { Pro, Con, Weakness, Question, BrokerQuestion, RiskMatrixRow, LiabilityRow, WhoPaysRow, TimelineRow, NegotiationMove, Deadline };
