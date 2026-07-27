import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const fallbackSource = readFileSync("src/core/manualFallback.ts", "utf8");

describe("manual fallback source boundaries", () => {
  it("does not introduce alternate persistence, provider, AI, credential, or browser request paths", () => {
    expect(fallbackSource).not.toMatch(/\bsupabase\b/);
    expect(fallbackSource).not.toMatch(/invokeBrixFunction/);
    expect(fallbackSource).not.toMatch(/fetch\(/);
    expect(fallbackSource).not.toMatch(/api[_-]?key|secret|oauth|token/i);
    expect(fallbackSource).not.toMatch(/openai|model[_-]?id|systemPrompt|userPrompt|chat\.completions/i);
    expect(fallbackSource).not.toMatch(/insert\s*\(|update\s*\(|delete\s*\(/);
    expect(fallbackSource).not.toMatch(/create(Property|Deal)|completeManualPropertyIntake/);
  });

  it("documents every automated source as a manual fallback source without enabling providers", () => {
    for (const source of [
      "manual_intake",
      "listing_url",
      "file_intake",
      "image_intake",
      "document_intake",
      "email_intake",
      "share_extension",
      "package_intake",
      "batch_intake",
      "future_provider_adapter",
      "future_mls_provider",
    ]) {
      expect(fallbackSource).toContain(`"${source}"`);
    }
  });

  it("emits only the approved manual fallback domain event names", () => {
    expect(fallbackSource).toContain('"manual.fallback_started"');
    expect(fallbackSource).toContain('"manual.field_completed"');
    expect(fallbackSource).toContain('"manual.fallback_completed"');
    expect(fallbackSource).not.toMatch(/manual\.(fallback_cancelled|fallback_failed|fallback_imported)/);
  });
});
