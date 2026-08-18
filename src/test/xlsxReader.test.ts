import { describe, expect, it } from "vitest";
import { parseBoundedXlsxRows } from "../core/xlsxReader";
import { makeZip } from "./xlsxFixture";

const defaultLimits = {
  maxSheets: 3,
  maxRowsPerSheet: 100,
  maxCellsPerRow: 50,
  maxArchiveEntries: 256,
  maxUncompressedBytes: 20 * 1024 * 1024,
};

function workbookPackage(input: { target?: string; worksheetXml?: string } = {}) {
  const target = input.target ?? "worksheets/sheet1.xml";
  const worksheetXml = input.worksheetXml ?? '<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Address</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>123 Main St</t></is></c></row></sheetData></worksheet>';
  return makeZip({
    "[Content_Types].xml": '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>',
    "xl/workbook.xml": '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Deals" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="${target}"/></Relationships>`,
    "xl/worksheets/sheet1.xml": worksheetXml,
  });
}

describe("bounded XLSX reader", () => {
  it("parses a valid workbook while preserving row and cell bounds", () => {
    const worksheetXml = '<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Address</t></is></c><c r="B1" t="inlineStr"><is><t>City</t></is></c><c r="C1" t="inlineStr"><is><t>Ignored</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>123 Main St</t></is></c><c r="B2" t="inlineStr"><is><t>Aurora</t></is></c><c r="C2" t="inlineStr"><is><t>extra</t></is></c></row><row r="3"><c r="A3" t="inlineStr"><is><t>456 Oak Ave</t></is></c></row></sheetData></worksheet>';
    const result = parseBoundedXlsxRows(workbookPackage({ worksheetXml }), {
      ...defaultLimits,
      maxRowsPerSheet: 1,
      maxCellsPerRow: 2,
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Deals");
    expect(result[0].rows).toEqual([
      ["Address", "City"],
      ["123 Main St", "Aurora"],
    ]);
  });

  it("fails closed on malformed or truncated ZIP input", () => {
    expect(() => parseBoundedXlsxRows(new Uint8Array([1, 2, 3, 4]), defaultLimits)).toThrow(/incomplete/i);
  });

  it("rejects archives with more entries than the configured envelope", () => {
    const bytes = makeZip({
      "one.txt": "1",
      "two.txt": "2",
      "three.txt": "3",
    });

    expect(() => parseBoundedXlsxRows(bytes, { ...defaultLimits, maxArchiveEntries: 2 })).toThrow(/too many package entries/i);
  });

  it("rejects workbooks whose declared expansion exceeds the safe limit before parsing", () => {
    const bytes = workbookPackage();
    expect(() => parseBoundedXlsxRows(bytes, { ...defaultLimits, maxUncompressedBytes: 100 })).toThrow(/safe processing limit/i);
  });

  it("rejects worksheet relationship targets outside the workbook worksheet boundary", () => {
    const bytes = workbookPackage({ target: "../sharedStrings.xml" });
    expect(() => parseBoundedXlsxRows(bytes, defaultLimits)).toThrow(/unexpected worksheet target/i);
  });

  it("rejects malformed workbook XML instead of attempting partial recovery", () => {
    const bytes = makeZip({
      "xl/workbook.xml": "<workbook><broken>",
      "xl/_rels/workbook.xml.rels": '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
    });
    expect(() => parseBoundedXlsxRows(bytes, defaultLimits)).toThrow(/malformed XML/i);
  });
});
