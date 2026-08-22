import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FINANCEIQ_NON_GOAL_CALCULATION_FIELDS } from "../core/financeIQ";

const app = readFileSync("src/App.tsx", "utf8");
const workspace = readFileSync("src/components/FinanceIQWorkspace.tsx", "utf8");
const client = readFileSync("src/core/financeIQClient.ts", "utf8");
const presentation = readFileSync("src/core/financeIQPresentation.ts", "utf8");
const deepLinks = readFileSync("src/core/deepLinks.ts", "utf8");
const cockpitDestinations = readFileSync("src/core/decisionCockpitDestinations.ts", "utf8");

describe("FinanceIQ UI source boundaries", () => {
  it("adds FinanceIQ to the Deal workspace and safe deep links", () => {
    expect(app).toContain("{ id: \"financeiq\", label: \"FinanceIQ\" }");
    expect(app).toContain("<FinanceIQWorkspace");
    expect(deepLinks).toContain("\"financeiq\"");
    expect(deepLinks).toContain("\"financing_structure\"");
    expect(deepLinks).toContain("\"financing_condition\"");
    expect(deepLinks).toContain("\"financing_covenant\"");
    expect(deepLinks).toContain("\"financing_comparison\"");
    expect(cockpitDestinations).toContain("\"FinanceIQ\"");
    expect(cockpitDestinations).toContain("decision_cockpit.financeiq");
    expect(cockpitDestinations).toContain("\"financeiq\"");
  });

  it("uses FinanceIQ RPC contracts for canonical loads and mutations", () => {
    for (const rpcName of [
      "list_financing_structure_projection",
      "load_financing_structure_detail",
      "list_financeiq_debt_schedule_projection",
      "load_financing_conditions",
      "load_financing_covenants",
      "load_financing_constraint_projection",
      "select_active_financing_structure",
      "update_financing_structure",
      "upsert_debt_tranche",
      "upsert_equity_tranche",
    ]) {
      expect(client).toContain(rpcName);
    }
    expect(client).not.toMatch(/\.from\(["'`](financing_structures|debt_tranches|equity_tranches|underwriting_debt_schedule_results)["'`]\)/);
    expect(workspace).not.toMatch(/\.from\(/);
  });

  it("does not import or implement forbidden FinanceIQ calculation authority in UI files", () => {
    const uiSource = `${workspace}\n${presentation}\n${client}`;
    expect(uiSource).not.toContain("calculateDebtSchedule");
    expect(uiSource).not.toContain("assertFinanceIQDoesNotCalculateDebtSchedule");
    expect(uiSource).not.toMatch(/\bPMT\b|monthlyPayment|comparisonScore|bestLoanScore|fundingGap\s*=|cashRequired\s*=/);
    for (const field of FINANCEIQ_NON_GOAL_CALCULATION_FIELDS) {
      expect(uiSource).not.toContain(`function ${field}`);
    }
  });

  it("renders accessibility and recovery language for saved FinanceIQ state", () => {
    expect(workspace).toContain("role=\"region\"");
    expect(workspace).toContain("role=\"tablist\"");
    expect(workspace).toContain("aria-selected");
    expect(workspace).toContain("Reload");
    expect(workspace).toContain("Sign in");
    expect(workspace).toContain("offline");
    expect(workspace).toContain("No comparison result yet");
    expect(workspace).toContain("prior valid");
  });
});
