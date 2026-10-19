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
  it("moves a heading with a short table instead of orphaning the heading", () => {
    const pages = planReportPages([
      { kind: "paragraph", id: "intro", height: 50 },
      { kind: "heading", id: "heading", height: 10, minFollowingHeight: 15 },
      { kind: "table", id: "table", headerHeight: 10, rowHeights: [20, 20] },
    ], 100);
    expect(pages.map((page) => page.items.map((item) => item.blockId)))
      .toEqual([["intro"], ["heading", "table", "table", "table"]]);
  });
  it("reserves the real paragraph height and chained headings", () => {
    const pages = planReportPages([
      { kind: "paragraph", id: "intro", height: 65 },
      { kind: "heading", id: "h1", height: 10, minFollowingHeight: 10 },
      { kind: "heading", id: "h2", height: 10, minFollowingHeight: 10 },
      { kind: "paragraph", id: "body", height: 30 },
    ], 100);
    expect(pages[1].items.map((item) => item.blockId)).toEqual(["h1", "h2", "body"]);
  });
  it("does not reserve an additional header on each row of the same page", () => {
    const pages = planReportPages([{ kind: "table", id: "t", headerHeight: 20, rowHeights: [35, 35, 35] }], 100);
    expect(pages[0].items.map((item) => item.rowIndex).filter((index) => index !== undefined)).toEqual([0, 1]);
  });
  it("rejects duplicate block identity and nonfinite measurements", () => {
    expect(() => planReportPages([
      { kind: "paragraph", id: "x", height: 1 }, { kind: "paragraph", id: "x", height: 2 },
    ], 100)).toThrow("duplicate_or_missing_block_id");
    expect(() => planReportPages([{ kind: "heading", id: "h", height: 10, minFollowingHeight: NaN }], 100))
      .toThrow("invalid_following_height");
  });
  it("continues a nearly full-page table beneath its heading", () => {
    const pages = planReportPages([
      { kind: "heading", id: "h", height: 20, minFollowingHeight: 10 },
      { kind: "table", id: "t", headerHeight: 10, rowHeights: [30, 30, 30] },
    ], 100);
    expect(pages[0].items.map((item) => item.kind)).toEqual(["heading", "table-header", "table-row", "table-row"]);
    expect(pages[1].items.map((item) => item.kind)).toEqual(["table-header", "table-row"]);
  });
  it("rejects a terminal heading with no content", () => {
    expect(() => planReportPages([{ kind: "heading", id: "h", height: 10, minFollowingHeight: 20 }], 100))
      .toThrow("heading_without_content");
  });
});
