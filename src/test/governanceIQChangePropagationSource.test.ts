import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const core = readFileSync("src/core/governanceIQ.ts", "utf8");
const slice4Surface = core.slice(
  core.indexOf("export type GovernanceImpactDomain"),
  core.indexOf("export function analyzeGovernanceFinancialHealth"),
);
const slice4Helpers = core.slice(
  core.indexOf("function isAcceptedGovernanceState"),
  core.indexOf("function arrayOfStrings"),
);
const slice4 = `${slice4Surface}\n${slice4Helpers}`;

describe("GovernanceIQ Slice 4 source guardrails", () => {
  it("defines accepted change propagation without direct downstream calculation authority", () => {
    expect(core).toContain("GOVERNANCEIQ_CHANGE_PROPAGATION_CONTRACT_VERSION");
    expect(core).toContain("buildGovernanceChange");
    expect(core).toContain("buildGovernancePropagationResult");
    expect(slice4).not.toMatch(/\bexecuteFormula\b|\bbuildUnderwritingCoreOutputRun\b|\bcreateUnderwritingSnapshot\b/);
    expect(slice4).not.toMatch(/\bevaluateStrategyScore\b|\bevaluateStrategyRanking\b|\bevaluateStrategyCompatibility\b/);
    expect(slice4).not.toMatch(/\bloanPayment\b|\bltv\b|\bdscr\b|\bcapRate\b|\bnoi\b/i);
  });

  it("keeps propagation deterministic and isolated from clients, providers, UI, native, and persistence", () => {
    expect(slice4).not.toMatch(/from\s+["']react["']|JSX|SwiftUI|UIKit|ViewBuilder/i);
    expect(slice4).not.toMatch(/\bfetch\s*\(|supabase\.|OpenAI|ai\.|provider|Zillow|Realtor|MLS/i);
    expect(slice4).not.toMatch(/\binsert\b|\bupdate\b|\bdelete\b|\brpc\s*\(/i);
    expect(slice4).toContain("deterministicHash");
    expect(slice4).toContain("idempotencyKey");
    expect(slice4).toContain("triggeringEventId");
    expect(slice4).toContain("correlationId");
  });

  it("requires explicit acceptance and preserves uncertain governance as review rather than hard fact", () => {
    expect(slice4).toContain("Governance finding must be explicitly accepted before downstream propagation.");
    expect(slice4).toContain("uncertain_requires_review");
    expect(slice4).toContain("uncertain_conflicted_governance");
    expect(slice4).toContain("routed for review, not as a verified hard downstream fact");
  });
});
