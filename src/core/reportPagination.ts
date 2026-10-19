/**
 * R7 pure pagination planner. Consumes presentation blocks only; it must never
 * infer findings, change report content, or decide who may access a report.
 * Rendering engines consume this plan and remain responsible for actual layout.
 */
export type ReportLayoutBlock =
  | { kind: "paragraph"; id: string; height: number; minFollowingHeight?: number }
  | { kind: "heading"; id: string; height: number; minFollowingHeight: number }
  | { kind: "table"; id: string; headerHeight: number; rowHeights: number[] };

export interface ReportPageItem {
  blockId: string;
  kind: "paragraph" | "heading" | "table-header" | "table-row";
  rowIndex?: number;
  height: number;
}

export interface ReportPagePlan { items: ReportPageItem[]; usedHeight: number }

function validHeight(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Deterministic pagination for measured blocks. No row is ever split.
 * Table headers repeat when tables span pages; short tables stay together.
 * Throws on unrenderable inputs instead of silently dropping content.
 */
export function planReportPages(blocks: readonly ReportLayoutBlock[], pageHeight: number): ReportPagePlan[] {
  if (!Number.isFinite(pageHeight) || pageHeight <= 0) throw new Error("invalid_page_height");
  const pages: ReportPagePlan[] = [];
  let page: ReportPagePlan = { items: [], usedHeight: 0 };
  const remaining = () => pageHeight - page.usedHeight;
  const nextPage = () => {
    if (page.items.length) pages.push(page);
    page = { items: [], usedHeight: 0 };
  };
  const add = (item: ReportPageItem) => {
    if (item.height > pageHeight) throw new Error("block_exceeds_page");
    if (item.height > remaining()) nextPage();
    page.items.push(item);
    page.usedHeight += item.height;
  };

  for (const block of blocks) {
    if (!block.id || !validHeight(block.height ?? block.headerHeight)) throw new Error("invalid_layout_block");
    if (block.kind === "table") {
      if (!validHeight(block.headerHeight) || block.rowHeights.some((h) => !validHeight(h))) {
        throw new Error("invalid_table_measurement");
      }
      if (block.headerHeight > pageHeight) throw new Error("table_header_exceeds_page");
      if (!block.rowHeights.length) continue;
      if (block.rowHeights.some((h) => block.headerHeight + h > pageHeight)) {
        throw new Error("table_row_exceeds_page");
      }
      const total = block.headerHeight + block.rowHeights.reduce((sum, h) => sum + h, 0);
      if (total <= pageHeight && total > remaining()) nextPage();
      for (let index = 0; index < block.rowHeights.length; index++) {
        const rowHeight = block.rowHeights[index];
        if (index === 0 || remaining() < block.headerHeight + rowHeight) {
          if (remaining() < block.headerHeight + rowHeight) nextPage();
          add({ blockId: block.id, kind: "table-header", height: block.headerHeight });
        }
        add({ blockId: block.id, kind: "table-row", rowIndex: index, height: rowHeight });
      }
    } else {
      const following = block.minFollowingHeight ?? 0;
      if (!validHeight(following)) throw new Error("invalid_following_height");
      if (block.height + following > pageHeight) throw new Error("keep_with_next_exceeds_page");
      if (block.height + following > remaining()) nextPage();
      add({ blockId: block.id, kind: block.kind, height: block.height });
    }
  }
  if (page.items.length) pages.push(page);
  return pages;
}
