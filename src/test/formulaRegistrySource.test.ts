import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(join(process.cwd(), "src/core/formulaRegistry.ts"), "utf8");
const underwritingSource = readFileSync(join(process.cwd(), "src/core/underwriting.ts"), "utf8");

describe("underwriting formula registry source boundaries", () => {
  it("keeps the formula registry pure and independent of clients, network, AI, persistence, and wall-clock time", () => {
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/\bsupabase\b/i);
    expect(source).not.toMatch(/\bopenai\b/i);
    expect(source).not.toMatch(/\blocalStorage\b/);
    expect(source).not.toMatch(/\bsessionStorage\b/);
    expect(source).not.toMatch(/\bwindow\b/);
    expect(source).not.toMatch(/\bdocument\b/);
    expect(source).not.toMatch(/\bDate\.now\s*\(/);
    expect(source).not.toMatch(/\bnew Date\s*\(/);
    expect(source).not.toMatch(/\bMath\.random\s*\(/);
  });

  it("centralizes core underwriting calculations through the formula registry instead of hidden inline return math", () => {
    expect(underwritingSource).toContain("executeFormula");
    expect(underwritingSource).toContain("FORMULA_REGISTRY_VERSION");
    expect(underwritingSource).toContain("\"net_operating_income\"");
    expect(underwritingSource).toContain("\"debt_service_coverage_ratio\"");
    expect(underwritingSource).toContain("\"capitalization_rate\"");
    expect(underwritingSource).toContain("\"cash_on_cash_return\"");
    expect(underwritingSource).not.toMatch(/monthlyNOI\s*=\s*Math\.round\(grossRent/);
    expect(underwritingSource).not.toMatch(/dscr:\s*monthlyPayment\s*>\s*0/);
    expect(underwritingSource).not.toMatch(/capRate:\s*round2\(\(annualNOI/);
    expect(underwritingSource).not.toMatch(/cashOnCash:\s*cashNeeded\s*>\s*0\s*\?\s*round2/);
  });

  it("does not add schema, RLS, edge-function, or audit/event write surfaces for pure previews", () => {
    expect(source).not.toMatch(/(?<!\.)\b(?:insert|update|delete|rpc)\s*\(|domain_events|audit/i);
    expect(source).toContain("FORMULA_REGISTRY_VERSION");
  });
});
