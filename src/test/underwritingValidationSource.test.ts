import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/core/underwritingValidation.ts", "utf8");

describe("underwriting validation source boundaries", () => {
  it("does not introduce providers, network access, browser calls, credentials, or provider-specific dependencies", () => {
    expect(source).not.toMatch(/fetch\s*\(|XMLHttpRequest|axios|supabase\.functions|invokeBrixFunction|api[_-]?key|secret|oauth|access_token|refresh_token|bearer/i);
    expect(source).not.toMatch(/zillow|realtor|loopnet|crexi|mls\s*api/i);
    expect(source).not.toMatch(/window\.|document\.|localStorage|sessionStorage|navigator\./);
  });

  it("does not create persistence, events, audit writes, or alternate Property and Deal write paths", () => {
    expect(source).not.toMatch(/\.from\(["'](properties|deals|domain_events|audit_events)["']\)|insert\s*\(|upsert\s*\(|update\s*\(|rpc\s*\(/i);
    expect(source).not.toMatch(/createProperty|createDeal|recordAudit|emitDomainEvent|underwriting\.snapshot|underwriting\.output|underwriting\.recommendation/i);
  });

  it("does not execute formulas, scenarios, recommendations, reports, market pulls, or AI workflows", () => {
    expect(source).not.toMatch(/executeFormula\s*\(|scenario|sensitivity|recommendation|report|market[_-]?data|openai|anthropic/i);
    expect(source).toContain("validateAndNormalizeUnderwritingInputs");
    expect(source).toContain("resolveFormulaDefinition");
    expect(source).toContain("resolvePropertyUnderwritingSchema");
  });
});
