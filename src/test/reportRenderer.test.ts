import { mkdir, writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { renderReportPdf, type ReportRenderDocument, type ReportDisplayBlock } from "../core/reportRenderer";

const base: ReportRenderDocument = {
  title: "Full Due Diligence Report", reportType: "full_due_diligence", workspaceId: "workspace-one", dealId: "deal-one",
  propertyId: "property-one", contractId: "contract-one", definitionId: "definition-one", definitionVersion: 1,
  definitionHash: "a".repeat(64), snapshotId: "snapshot-one", snapshotVersion: 1, analysisVersion: 1,
  templateVersion: "fixture-v1", generatedAt: "2026-10-19T12:00:00Z", sourceCutoffAt: "2026-10-18T12:00:00Z", perspective: "buyer",
  blocks: [{ kind: "heading", id: "overview", level: 1, text: "Executive Transaction Overview" },
    { kind: "paragraph", id: "recommendation", text: "Proceed with Conditions. Obtain the executed amendment before final approval." }],
};

const issue = (index: number): ReportDisplayBlock[] => [
  { kind: "heading", id: `issue-${index}`, level: 1, text: `Source-linked finding ${index}` },
  { kind: "paragraph", id: `finding-${index}`, text: `Finding ${index}: The supplied inspection describes moisture staining. Cause, extent and repair cost remain unverified. Confirm the condition with the appropriate professional before accepting responsibility.` },
  { kind: "paragraph", id: `source-${index}`, text: `Source: inspection record ${index}, version 1, page 4. Supported concern; professional review recommended.`, sourceNote: true },
];

describe("R7 measured PDF renderer", () => {
  it("creates real PDF bytes, complete hash, metadata and stable section pages", async () => {
    const result = await renderReportPdf(base);
    expect(new TextDecoder().decode(result.bytes.slice(0, 5))).toBe("%PDF-");
    expect(result.pageCount).toBe(2);
    expect(result.sectionPages.overview).toBe(2);
    expect(result.fileHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.definitionHash).toBe(base.definitionHash);
    expect(result.textRuns.join(" ")).toContain("Proceed with Conditions");
    expect(result.accessibility.taggedPdf).toBe(false);
  });

  it("rejects incomplete identity, markup, unsupported characters and malformed rows", async () => {
    await expect(renderReportPdf({ ...base, definitionHash: "bad" })).rejects.toThrow("invalid_definition_hash");
    await expect(renderReportPdf({ ...base, title: "" })).rejects.toThrow("incomplete_render_identity");
    await expect(renderReportPdf({ ...base, blocks: [{ kind: "paragraph", id: "p", text: "{{missing}}" }] })).rejects.toThrow("render_placeholder_or_markup");
    await expect(renderReportPdf({ ...base, title: "Report 🏠" })).rejects.toThrow("unsupported_report_glyph");
    await expect(renderReportPdf({ ...base, blocks: [{ kind: "table", id: "t", headers: ["One", "Two"], rows: [["One"]] }] })).rejects.toThrow("invalid_render_table");
  });

  it("rejects an oversized row instead of clipping or omitting it", async () => {
    await expect(renderReportPdf({ ...base, blocks: [{ kind: "table", id: "t", headers: ["Finding"], rows: [["Full canonical text. ".repeat(1000)]] }] }))
      .rejects.toThrow("table_row_exceeds_page");
  });
  it("reproduces identical bytes for the same immutable input", async () => {
    const first = await renderReportPdf(base);
    const second = await renderReportPdf(base);
    expect(second.fileHash).toBe(first.fileHash);
    expect(second.bytes).toEqual(first.bytes);
  });

  it("preserves Unicode punctuation and accents in the embedded-font document", async () => {
    const sentence = "José O’Neill — café costs €125; verification required.";
    const result = await renderReportPdf({ ...base, blocks: [{ kind: "paragraph", id: "unicode", text: sentence }] });
    expect(result.textRuns).toContain(sentence);
  });

  it("places supplied Summary decision content first and omits an unnecessary short contents page", async () => {
    const result = await renderReportPdf({ ...base, reportType: "buyer_summary", title: "Buyer Due Diligence Summary",
      frontMatter: [{ kind: "heading", id: "decision", level: 1, text: "Executive Decision Summary" },
        { kind: "paragraph", id: "position", text: "Pause Pending Information. Confirm the critical inspection deadline before proceeding." }],
    });
    expect(result.textRuns[0]).toBe("Executive Decision Summary");
    expect(result.textRuns).not.toContain("Contents");
    expect(result.sectionPages.overview).toBe(2);
  });
  it("rejects Summary output with missing or overlong decision front matter", async () => {
    await expect(renderReportPdf({ ...base, reportType: "buyer_summary" }))
      .rejects.toThrow("summary_front_matter_exceeds_two_pages_or_missing");
    await expect(renderReportPdf({ ...base, reportType: "buyer_summary", frontMatter: Array.from({ length: 20 }, (_, index) => ({
      kind: "paragraph" as const, id: `front-${index}`, text: "Canonical decision information remains subject to the cited source. ".repeat(20),
    })) })).rejects.toThrow("summary_front_matter_exceeds_two_pages_or_missing");
  });

  it("renders representative layout fixtures and records performance for inspection", async () => {
    const table: ReportDisplayBlock = { kind: "table", id: "long-table", headers: ["Item", "Source-linked finding", "Status"],
      columnWeights: [1, 5, 1.2], rows: Array.from({ length: 80 }, (_, index) => [`ROW-${String(index).padStart(3, "0")}`, `Canonical finding ${index}. Obtain the cited record before accepting this obligation.`, "Open"]) };
    const fixtures: Record<string, ReportRenderDocument> = {
      short: base,
      ordinary: { ...base, blocks: [...base.blocks, ...Array.from({ length: 12 }, (_, index) => issue(index)).flat()] },
      complex: { ...base, blocks: [...base.blocks, ...Array.from({ length: 45 }, (_, index) => issue(index)).flat()] },
      solar: { ...base, blocks: [...base.blocks, { kind: "heading", id: "solar", level: 1, text: "Solar Agreement Analysis" },
        { kind: "paragraph", id: "solar-text", text: "The transfer, buyout amount, remaining balance and matched utility comparison remain unknown. Obtain written provider confirmation and lender, title and insurer review." }] },
      inspection: { ...base, blocks: [...base.blocks, ...issue(100)] },
      "multi-document": { ...base, blocks: [...base.blocks, { kind: "table", id: "documents", headers: ["Document", "Version", "Source"], rows: [["Purchase agreement", "1", "Evidence A"], ["Executed amendment", "2", "Evidence B"]] }] },
      "many-questions": { ...base, reportType: "questions_grouped", title: "Questions by Recipient Role", blocks: [{ kind: "heading", id: "questions", level: 1, text: "Canonical Questions" },
        ...Array.from({ length: 65 }, (_, index): ReportDisplayBlock => ({ kind: "paragraph", id: `q-${index}`, text: `QUESTION-${index}: Please provide the executed record and confirm the responsible party. Priority: high. Status: open. Requested evidence: executed amendment. Source: contract page 3.` }))] },
      "long-table": { ...base, blocks: [...base.blocks, { kind: "heading", id: "findings", level: 1, text: "Complete Findings" }, table] },
      "edge-page-break": { ...base, blocks: [...base.blocks, ...Array.from({ length: 7 }, (_, index) => issue(index)).flat(), { kind: "heading", id: "edge", level: 1, text: "Resolution Tracker" }, { ...table, rows: table.rows.slice(0, 3) }] },
      summary: { ...base, title: "Buyer Due Diligence Summary", reportType: "buyer_summary", frontMatter: [
        { kind: "heading", id: "decision", level: 1, text: "Executive Decision Summary" },
        { kind: "paragraph", id: "position", text: "Proceed with Conditions. Obtain the executed amendment and verify the insurance requirements before final approval." },
        { kind: "heading", id: "quick-review", level: 1, text: "Quick Review" },
        { kind: "table", id: "quick", headers: ["Priority", "Finding", "Required action"], columnWeights: [1, 3, 3], rows: [["High", "Acceptance date remains unverified", "Attorney to confirm executed agreement"], ["High", "Insurance evidence is incomplete", "Insurer to confirm issued coverage"]] },
      ] },
    };
    const output = "/tmp/brix-r7-render-evidence";
    await mkdir(output, { recursive: true });
    const metrics: Record<string, unknown> = {};
    for (const [name, input] of Object.entries(fixtures)) {
      const result = await renderReportPdf(input);
      await writeFile(`${output}/${name}.pdf`, result.bytes);
      metrics[name] = { pageCount: result.pageCount, durationMs: Math.round(result.durationMs), sizeBytes: result.bytes.length, fileHash: result.fileHash };
      if (name === "long-table") {
        const text = result.textRuns.join(" ");
        for (let index = 0; index < 80; index++) expect(text.split(`ROW-${String(index).padStart(3, "0")}`).length - 1).toBe(1);
      }
    }
    await writeFile(`${output}/metrics.json`, JSON.stringify(metrics, null, 2));
  }, 30_000);
});
