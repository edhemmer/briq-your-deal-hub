import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/core/providerAdapters.ts", "utf8");
const tests = readFileSync("src/test/providerAdapters.test.ts", "utf8");

describe("provider adapter source boundaries", () => {
  it("does not register or enable any concrete provider", () => {
    expect(source).toContain("const providerRegistry: ProviderRegistry = new Map()");
    expect(source).toContain("return []");
    expect(source).toContain("return undefined");
    expect(source).not.toMatch(/registerProvider|enabled:\s*true|zillow|realtor|loopnet|crexi/i);
  });

  it("does not introduce credentials, endpoints, OAuth, SDKs, or browser requests", () => {
    expect(source).not.toMatch(/api[_-]?key|secret|credential|oauth|access_token|refresh_token|bearer|client_secret/i);
    expect(source).not.toMatch(/fetch\s*\(|XMLHttpRequest|axios|supabase\.functions|invokeBrixFunction|http_post|net\.http/i);
    expect(source).not.toMatch(/from\s+["'][^"']*(sdk|client)["']/i);
  });

  it("keeps provider output outside canonical Property creation", () => {
    expect(source).toContain("ProviderNormalizedSourceRecord");
    expect(source).not.toMatch(/createProperty|insertProperty|canonicalProperty|from\(["']properties["']\)|into public\.properties/i);
    expect(tests).toContain("never canonical Property objects");
  });

  it("reuses source classification, conflict values, and duplicate identity contracts", () => {
    expect(source).toContain("classifySource");
    expect(source).toContain("serializeSourceClassification");
    expect(source).toContain("DuplicateIdentity");
    expect(source).toContain("SourceConflictValue");
  });
});
