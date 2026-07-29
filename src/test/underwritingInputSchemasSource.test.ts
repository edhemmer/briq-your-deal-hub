import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/core/underwritingInputSchemas.ts", "utf8");

describe("underwriting input schema source boundaries", () => {
  it("does not introduce providers, network access, browser calls, AI, or secrets", () => {
    expect(source).not.toMatch(/fetch\s*\(|XMLHttpRequest|axios|supabase\.functions|invokeBrixFunction|openai|anthropic|api[_-]?key|secret|oauth|access_token|refresh_token|bearer/i);
    expect(source).not.toMatch(/zillow|realtor|loopnet|crexi|mls\s*api/i);
    expect(source).not.toMatch(/window\.|document\.|localStorage|sessionStorage|navigator\./);
  });

  it("does not create persistence, events, audit writes, or alternate Property and Deal write paths", () => {
    expect(source).not.toMatch(/\.from\(["'](properties|deals|domain_events|audit_events)["']\)|insert\s*\(|upsert\s*\(|update\s*\(|rpc\s*\(/i);
    expect(source).not.toMatch(/createProperty|createDeal|recordAudit|emitDomainEvent|underwriting\.schema_selected|underwriting\.schema_changed|underwriting\.input_readiness_changed/i);
  });

  it("keeps the registry deterministic and independent of time, locale, random values, and formula execution", () => {
    expect(source).not.toMatch(/new Date\(|Date\.now\(|Math\.random\(|Intl\./);
    expect(source).not.toMatch(/executeFormula\s*\(/);
    expect(source).toContain("selectPropertyUnderwritingSchema");
    expect(source).toContain("projectSchemaReadiness");
    expect(source).toContain("validatePropertyUnderwritingSchemaRegistry");
  });
});
