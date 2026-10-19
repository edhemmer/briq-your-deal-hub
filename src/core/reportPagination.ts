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
  const ids = new Set<string>();
  for (const block of blocks) {
    if (!block.id || ids.has(block.id)) throw new Error("duplicate_or_missing_block_id");
    ids.add(block.id);
  }
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

  // A heading's requested minimum is not sufficient when the next block is an
  // indivisible paragraph or a short table. Reserve its actual first fragment.
  const followingHeight = (index: number, reservedHeight = blocks[index].kind === "table" ? 0 : blocks[index].height): number => {
    const next = blocks[index + 1];
    if (!next) return 0;
    if (next.kind === "heading") return next.height + Math.max(next.minFollowingHeight, followingHeight(index + 1, reservedHeight + next.height));
    if (next.kind === "paragraph") return next.height;
    if (!next.rowHeights.length) return followingHeight(index + 1);
    const total = next.headerHeight + next.rowHeights.reduce((sum, height) => sum + height, 0);
    return total + reservedHeight <= pageHeight ? total : next.headerHeight + next.rowHeights[0];
  };

  for (const [blockIndex, block] of blocks.entries()) {
    if (!block.id || !validHeight(block.kind === "table" ? block.headerHeight : block.height)) throw new Error("invalid_layout_block");
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
      // If a nearly full-page table follows a heading on a fresh page, keeping
      // both complete is impossible. Continue the table rather than orphan it.
      const followsHeading = page.items[page.items.length - 1]?.kind === "heading";
      if (total <= pageHeight && total > remaining() && !followsHeading) nextPage();
      for (let index = 0; index < block.rowHeights.length; index++) {
        const rowHeight = block.rowHeights[index];
        if (index === 0 || remaining() < rowHeight) {
          if (remaining() < block.headerHeight + rowHeight) nextPage();
          add({ blockId: block.id, kind: "table-header", height: block.headerHeight });
        }
        add({ blockId: block.id, kind: "table-row", rowIndex: index, height: rowHeight });
      }
    } else {
      const requested = block.minFollowingHeight ?? 0;
      if (!validHeight(requested)) throw new Error("invalid_following_height");
      if (block.kind === "heading" && followingHeight(blockIndex) === 0) throw new Error("heading_without_content");
      const following = block.kind === "heading" ? Math.max(requested, followingHeight(blockIndex)) : requested;
      if (!validHeight(following)) throw new Error("invalid_following_height");
      if (block.height + following > pageHeight) throw new Error("keep_with_next_exceeds_page");
      if (block.height + following > remaining()) nextPage();
      add({ blockId: block.id, kind: block.kind, height: block.height });
    }
  }
  if (page.items.length) pages.push(page);
  return pages;
}
