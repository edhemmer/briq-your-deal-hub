import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/core/intakeReconciliation.ts", "utf8");

describe("Specification 004 reconciliation source boundaries", () => {
  it("does not add persistence, provider calls, browser requests, AI, or credentials", () => {
    expect(source).not.toMatch(/\bsupabase\b/);
    expect(source).not.toMatch(/invokeBrixFunction/);
    expect(source).not.toMatch(/fetch\(/);
    expect(source).not.toMatch(/api[_-]?key|secret|oauth|token/i);
    expect(source).not.toMatch(/openai|model[_-]?id|systemPrompt|userPrompt|chat\.completions/i);
    expect(source).not.toMatch(/insert\s*\(|update\s*\(|delete\s*\(/);
    expect(source).not.toMatch(/completeManualPropertyIntake|createProperty|createDeal/);
  });

  it("keeps preliminary assumptions restricted to the approved subjects and classifications", () => {
    for (const subject of [
      "property_type",
      "occupancy",
      "construction_type",
      "building_use",
      "estimated_units",
      "approximate_square_footage",
      "estimated_year_built",
      "expected_strategy",
      "basic_land_use",
      "general_property_classification",
    ]) {
      expect(source).toContain(`"${subject}"`);
    }

    for (const classification of [
      "user_entered_fact",
      "verified_source",
      "preliminary_assumption",
      "descriptive_input",
      "unknown",
    ]) {
      expect(source).toContain(`"${classification}"`);
    }
  });

  it("forbids unsafe assumption domains and emits only the approved completion event", () => {
    for (const subject of [
      "purchase_price",
      "market_value",
      "repair_cost",
      "arv",
      "insurance_values",
      "environmental_conditions",
      "structural_condition",
      "legal_conclusions",
      "contract_interpretation",
      "financial_analysis",
      "investment_recommendation",
      "risk_score",
      "brix_analytical_output",
    ]) {
      expect(source).toContain(`"${subject}"`);
    }

    expect(source).toContain('"specification004.completed"');
    expect(source).not.toMatch(/specification004\.(failed|cancelled|started|ready|incomplete)/);
  });
});
