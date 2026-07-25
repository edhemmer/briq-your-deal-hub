import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync("src/App.tsx", "utf8");
const styles = readFileSync("src/styles/app.css", "utf8");

function dealIqSource() {
  const start = app.indexOf("type DealWorkspaceSection");
  const end = app.indexOf("const dealStageOptions");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return app.slice(start, end);
}

function dealWorkspaceStyles() {
  const start = styles.indexOf(".deal-workspace");
  const end = styles.indexOf(".panel {");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return styles.slice(start, end);
}

describe("Specification 003 Deal workspace UI", () => {
  it("renders only the approved workspace sections on the active Deal route", () => {
    const source = dealIqSource();
    for (const section of ["Overview", "Property", "People", "Work", "Notes", "History"]) {
      expect(source).toContain(section);
    }
    expect(source).toContain("role=\"tablist\"");
    expect(source).toContain("role=\"tab\"");
    expect(source).toContain("aria-selected");
    expect(source).toContain("onSectionKeyDown");
    expect(source).toContain("workspaceSectionFromLocation");
    expect(source).toContain("dealWorkspaceUrl");
  });

  it("uses completed canonical projections and command surfaces", () => {
    const source = dealIqSource();
    for (const call of ["function DealWorkspace", "loadDealDetail", "CanonicalDealEditPanel", "RelationshipPanel", "WorkHistoryPanel"]) {
      expect(source).toContain(call);
    }
    expect(source).toContain("section=\"work\"");
    expect(source).toContain("section=\"notes\"");
    expect(source).toContain("section=\"history\"");
  });

  it("does not expose later roadmap or analysis output in the active Deal workspace", () => {
    const source = dealIqSource();
    for (const forbidden of [
      "analyzeDeal",
      "downloadDecisionPdf",
      "downloadWorkbook",
      "analyzePhotoEvidence",
      "Strategy comparison",
      "Decision challenge",
      "Photos and condition",
      "PDF memo",
      "XLS workbook",
      "After repair value",
      "Monthly rent",
      "Cash flow",
      "cap rate",
      "risk score",
      "confidence",
    ]) {
      expect(source).not.toContain(forbidden);
    }
  });

  it("adds responsive premium workspace structure without trust labels", () => {
    const source = dealIqSource();
    const workspaceCss = dealWorkspaceStyles();
    expect(styles).toContain(".deal-workspace");
    expect(styles).toContain(".deal-section-tabs");
    expect(styles).toContain(".deal-section-grid");
    expect(styles).toContain(".definition-list");
    expect(styles).toContain("@media (max-width: 980px)");
    expect(`${source}\n${workspaceCss}`).not.toMatch(/trust|reliab|confidence/i);
  });
});
