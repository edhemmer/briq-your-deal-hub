import { describe, expect, it } from "vitest";
import { planReportPages } from "../core/reportPagination";

describe("R7 report pagination planner", () => {
  it("keeps a short table together", () => {
    const pages = planReportPages([
      { kind: "paragraph", id: "intro", height: 70 },
      { kind: "table", id: "facts", headerHeight: 10, rowHeights: [15, 15] },
    ], 100);
    expect(pages).toHaveLength(2);
    expect(pages[1].items.map((item) => item.kind)).toEqual(["table-header", "table-row", "table-row"]);
  });
  it("repeats headers without splitting or dropping long table rows", () => {
    const pages = planReportPages([{ kind: "table", id: "risks", headerHeight: 10, rowHeights: [35, 35, 35] }], 80);
    expect(pages).toHaveLength(2);
    expect(pages.flatMap((p) => p.items.filter((i) => i.kind === "table-row").map((i) => i.rowIndex))).toEqual([0, 1, 2]);
    expect(pages[1].items[0].kind).toBe("table-header");
  });
  it("keeps headings with following content", () => {
    const pages = planReportPages([
      { kind: "paragraph", id: "prior", height: 85 },
      { kind: "heading", id: "next", height: 10, minFollowingHeight: 15 },
      { kind: "paragraph", id: "body", height: 15 },
    ], 100);
    expect(pages[1].items.map((i) => i.blockId)).toEqual(["next", "body"]);
  });
  it("rejects impossible rows rather than dropping content", () => {
    expect(() => planReportPages([{ kind: "table", id: "t", headerHeight: 20, rowHeights: [90] }], 100))
      .toThrow("table_row_exceeds_page");
  });
  it("does not emit empty pages", () => {
    expect(planReportPages([], 100)).toEqual([]);
  });
});
