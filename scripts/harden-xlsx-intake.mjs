import { readFile, writeFile } from "node:fs/promises";

const packagePath = new URL("../src/core/packageBatchIntake.ts", import.meta.url);
const testPath = new URL("../src/test/packageBatchIntake.test.ts", import.meta.url);

let source = await readFile(packagePath, "utf8");
source = source.replace('import * as XLSX from "xlsx";\n', 'import { parseBoundedXlsxRows } from "./xlsxReader";\n');

const oldParser = `function parseXlsx(bytes: Uint8Array, source: PackageBatchSource) {
  const workbook = XLSX.read(bytes, { type: "array" });
  const sheetNames = workbook.SheetNames.slice(0, PACKAGE_BATCH_LIMITS.maxXlsxSheets);
  const allRows: Record<string, string>[] = [];
  let mapping: PackageColumnMapping = {};
  for (const sheetName of sheetNames) {
    const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[sheetName], { header: 1, blankrows: false })
      .slice(0, PACKAGE_BATCH_LIMITS.maxXlsxRowsPerSheet + 1)
      .map((row) => row.slice(0, PACKAGE_BATCH_LIMITS.maxXlsxCellsPerRow).map((cell) => cell == null ? "" : String(cell).trim()));
    if (rows.length < 2) continue;
    const headers = rows[0].map((header, index) => header.trim() || \`\${sheetName} Column \${index + 1}\`);
    if (!Object.keys(mapping).length) mapping = suggestColumnMapping(headers);
    rows.slice(1).forEach((row, index) => allRows.push({ ...rowToRecord(headers, row), "__sheet": sheetName, "__row": String(index + 2) }));
  }
  if (!allRows.length) throw new Error(\`\${source.originalFilename ?? "XLSX"} needs headers and at least one row.\`);
  return { mapping, rows: allRows };
}`;

const newParser = `function parseXlsx(bytes: Uint8Array, source: PackageBatchSource) {
  const sheets = parseBoundedXlsxRows(bytes, {
    maxSheets: PACKAGE_BATCH_LIMITS.maxXlsxSheets,
    maxRowsPerSheet: PACKAGE_BATCH_LIMITS.maxXlsxRowsPerSheet,
    maxCellsPerRow: PACKAGE_BATCH_LIMITS.maxXlsxCellsPerRow,
    maxArchiveEntries: 256,
    maxUncompressedBytes: 20 * 1024 * 1024,
  });
  const allRows: Record<string, string>[] = [];
  let mapping: PackageColumnMapping = {};
  for (const sheet of sheets) {
    if (sheet.rows.length < 2) continue;
    const headers = sheet.rows[0].map((header, index) => header.trim() || \`\${sheet.name} Column \${index + 1}\`);
    if (!Object.keys(mapping).length) mapping = suggestColumnMapping(headers);
    sheet.rows.slice(1).forEach((row, index) => allRows.push({ ...rowToRecord(headers, row), "__sheet": sheet.name, "__row": String(index + 2) }));
  }
  if (!allRows.length) throw new Error(\`\${source.originalFilename ?? "XLSX"} needs headers and at least one row.\`);
  return { mapping, rows: allRows };
}`;

if (!source.includes(oldParser)) throw new Error("Expected legacy XLSX parser was not found; refusing an unsafe partial migration.");
source = source.replace(oldParser, newParser);
await writeFile(packagePath, source);

let test = await readFile(testPath, "utf8");
test = test.replace('import * as XLSX from "xlsx";\n', 'import { strToU8, zipSync } from "fflate";\n');

const oldFixture = `    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Property Address", "Zip Code", "Listing Price"],
      ["789 Pine Rd", "60540", "375000"],
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Deals");
    const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

    const batch = await createPackageBatchFromFiles([
      file("deals.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", [bytes]),
    ]);`;

const newFixture = `    const bytes = zipSync({
      "[Content_Types].xml": strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'),
      "_rels/.rels": strToU8('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
      "xl/workbook.xml": strToU8('<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Deals" sheetId="1" r:id="rId1"/></sheets></workbook>'),
      "xl/_rels/workbook.xml.rels": strToU8('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'),
      "xl/worksheets/sheet1.xml": strToU8('<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Property Address</t></is></c><c r="B1" t="inlineStr"><is><t>Zip Code</t></is></c><c r="C1" t="inlineStr"><is><t>Listing Price</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>789 Pine Rd</t></is></c><c r="B2" t="inlineStr"><is><t>60540</t></is></c><c r="C2"><v>375000</v></c></row></sheetData></worksheet>'),
    });

    const batch = await createPackageBatchFromFiles([
      file("deals.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", [bytes]),
    ]);`;

if (!test.includes(oldFixture)) throw new Error("Expected XLSX test fixture was not found; refusing an unsafe partial migration.");
test = test.replace(oldFixture, newFixture);
await writeFile(testPath, test);
