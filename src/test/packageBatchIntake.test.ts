import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PACKAGE_BATCH_LIMITS,
  applyPackageColumnMapping,
  createManualDraftFromPackageItem,
  createPackageBatchFromFiles,
  loadPackageBatchDraft,
  recordPackageBatchReview,
  savePackageBatchDraft,
  summarizePackageBatch,
  transitionPackageBatchItem,
} from "../core/packageBatchIntake";
import { makeZip } from "./xlsxFixture";

const rpc = vi.fn();

vi.mock("../core/supabase", () => ({
  supabase: { rpc: (...args: unknown[]) => rpc(...args) },
}));

function file(name: string, type: string, body: Array<BlobPart | Uint8Array>) {
  return new File(body.map(toBlobPart), name, { type });
}

function toBlobPart(value: BlobPart | Uint8Array): BlobPart {
  if (value instanceof Uint8Array) {
    const copy = new ArrayBuffer(value.byteLength);
    new Uint8Array(copy).set(value);
    return copy;
  }
  return value;
}

describe("package / batch intake", () => {
  beforeEach(() => {
    rpc.mockReset();
    localStorage.clear();
  });

  it("parses CSV rows into item-level review without creating deals", async () => {
    const batch = await createPackageBatchFromFiles([
      file("opportunities.csv", "text/csv", ["Address,City,State,Price,Strategy\n123 Main St,Aurora,IL,250000,owner_occupant\n456 Oak Ave,Naperville,IL,399000,buy_hold"]),
    ]);

    expect(batch.batchType).toBe("spreadsheet");
    expect(batch.items).toHaveLength(2);
    expect(batch.items[0].status).toBe("awaiting_review");
    expect(batch.items[0].mappedValues.address).toBe("123 Main St");
    expect(batch.items[0].mappedValues.asking_price).toBe("250000");
    expect(JSON.stringify(batch)).not.toContain("create_canonical_deal");
  });

  it("parses XLSX rows with bounded sheet and row limits", async () => {
    const bytes = makeZip({
      "[Content_Types].xml": '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
      "_rels/.rels": '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      "xl/workbook.xml": '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Deals" sheetId="1" r:id="rId1"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels": '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
      "xl/worksheets/sheet1.xml": '<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Property Address</t></is></c><c r="B1" t="inlineStr"><is><t>Zip Code</t></is></c><c r="C1" t="inlineStr"><is><t>Listing Price</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>789 Pine Rd</t></is></c><c r="B2" t="inlineStr"><is><t>60540</t></is></c><c r="C2"><v>375000</v></c></row></sheetData></worksheet>',
    });

    const batch = await createPackageBatchFromFiles([
      file("deals.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", [bytes]),
    ]);

    expect(batch.items[0].mappedValues.address).toBe("789 Pine Rd");
    expect(batch.items[0].mappedValues.postal_code).toBe("60540");
    expect(batch.limits.maxXlsxSheets).toBe(PACKAGE_BATCH_LIMITS.maxXlsxSheets);
  });

  it("requires explicit mapping when a spreadsheet row has no address", async () => {
    const batch = await createPackageBatchFromFiles([
      file("missing-address.csv", "text/csv", ["Name,City\nPossible deal,Aurora"]),
    ]);

    expect(batch.status).toBe("awaiting_mapping");
    expect(batch.items[0].status).toBe("awaiting_mapping");
    expect(batch.items[0].safeErrors[0]).toMatch(/address is required/i);

    const remapped = applyPackageColumnMapping(batch, { Name: "address", City: "city" });
    expect(remapped.items[0].status).toBe("awaiting_review");
    expect(remapped.items[0].mappedValues.address).toBe("Possible deal");
  });

  it("detects duplicate candidates inside the package instead of silently merging them", async () => {
    const batch = await createPackageBatchFromFiles([
      file("dupes.csv", "text/csv", ["Address,City\n123 Main St,Aurora\n123 Main St,Aurora"]),
    ]);

    expect(batch.items[1].status).toBe("duplicate_candidate");
    expect(batch.items[1].duplicateCandidates[0].reason).toMatch(/same normalized address/i);
  });

  it("supports multi-file packages as assignment-required items", async () => {
    const batch = await createPackageBatchFromFiles([
      file("inspection.pdf", "application/pdf", ["%PDF-1.4 fake"]),
      file("front.jpg", "image/jpeg", ["jpeg-bytes"]),
    ]);

    expect(batch.batchType).toBe("multi_file");
    expect(batch.items).toHaveLength(2);
    expect(batch.items.every((item) => item.status === "awaiting_mapping")).toBe(true);
    expect(batch.sources.every((source) => source.preservedAsEvidence)).toBe(true);
  });

  it("creates a manual intake draft only from an explicitly selected ready item", async () => {
    const batch = await createPackageBatchFromFiles([
      file("one.csv", "text/csv", ["Address,City,State,Price,Source URL\n123 Main St,Aurora,IL,250000,https://example.com/listing"]),
    ]);
    const draft = createManualDraftFromPackageItem(batch.items[0]);

    expect(draft.address).toBe("123 Main St");
    expect(draft.city).toBe("Aurora");
    expect(draft.region).toBe("IL");
    expect(draft.askingPrice).toBe("250000");
    expect(draft.sourceUrl).toBe("https://example.com/listing");
  });

  it("keeps partial success visible through summary counts and item transitions", async () => {
    const batch = await createPackageBatchFromFiles([
      file("mixed.csv", "text/csv", ["Address,City\n123 Main St,Aurora\n,Naperville"]),
    ]);
    const skipped = transitionPackageBatchItem(batch.items[1], "skip");
    const summary = summarizePackageBatch({ ...batch, items: [batch.items[0], skipped] });

    expect(summary.ready).toBe(1);
    expect(summary.skipped).toBe(1);
    expect(summary.canPartiallyProcess).toBe(true);
  });

  it("persists and restores interrupted package drafts locally", async () => {
    const batch = await createPackageBatchFromFiles([
      file("one.csv", "text/csv", ["Address\n123 Main St"]),
    ]);
    savePackageBatchDraft("scope", batch);

    expect(loadPackageBatchDraft("scope")?.items[0].mappedValues.address).toBe("123 Main St");
  });

  it("records reviewed package state through the server-owned batch RPC", async () => {
    rpc.mockResolvedValue({
      data: [{
        batch_id: "00000000-0000-0000-0000-000000000001",
        batch_status: "awaiting_review",
        item_count: 1,
        ready_item_count: 1,
        failed_item_count: 0,
        skipped_item_count: 0,
        duplicate_candidate_count: 0,
      }],
      error: null,
    });
    const batch = await createPackageBatchFromFiles([
      file("one.csv", "text/csv", ["Address\n123 Main St"]),
    ]);

    const result = await recordPackageBatchReview("workspace-1", batch);

    expect(result.readyItemCount).toBe(1);
    expect(rpc).toHaveBeenCalledWith("record_intake_batch_review", expect.objectContaining({
      target_workspace_id: "workspace-1",
      item_inputs: expect.arrayContaining([expect.objectContaining({ mappedValues: expect.objectContaining({ address: "123 Main St" }) })]),
    }));
  });

  it("enforces package limits before processing", async () => {
    const files = Array.from({ length: PACKAGE_BATCH_LIMITS.maxFiles + 1 }, (_, index) => file(`file-${index}.txt`, "text/plain", ["x"]));
    await expect(createPackageBatchFromFiles(files)).rejects.toThrow(/files or fewer/i);
  });
});
