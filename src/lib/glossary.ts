/**
 * BRIQ v1.6.0 — Inline Glossary & Strategy Education
 *
 * Lightweight, plain-English definitions for key investment terms
 * and strategy explanations. Designed for inline contextual display
 * near relevant UI/results — not a standalone help center.
 *
 * Extensible: add new terms without changing architecture.
 */

export interface GlossaryEntry {
  term: string;
  definition: string;
  category: "metric" | "strategy" | "market" | "risk" | "general";
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ── Financial Metrics ──
  noi: {
    term: "Net Operating Income (NOI)",
    definition: "Annual income from the property after operating expenses but before debt service. NOI = Effective Rent + Other Income − Operating Expenses.",
    category: "metric",
  },
  cap_rate: {
    term: "Capitalization Rate",
    definition: "Property return independent of financing. Cap Rate = NOI ÷ Purchase Price. Higher cap rates indicate higher income yield relative to price.",
    category: "metric",
  },
  cash_on_cash: {
    term: "Cash-on-Cash Return",
    definition: "Annual pre-tax cash flow divided by total cash invested. Measures the return on your actual out-of-pocket investment.",
    category: "metric",
  },
  dscr: {
    term: "Debt Service Coverage Ratio",
    definition: "NOI divided by annual debt payments. Above 1.0 means the property covers its debt; lenders typically want 1.20x or higher.",
    category: "metric",
  },
  monthly_cashflow: {
    term: "Monthly Cash Flow",
    definition: "Net income after all expenses and debt service each month. Positive cash flow means the property pays for itself.",
    category: "metric",
  },
  arv: {
    term: "After Repair Value (ARV)",
    definition: "The estimated market value of the property after all planned renovations and improvements are complete.",
    category: "metric",
  },
  equity_created: {
    term: "Equity Created",
    definition: "The difference between ARV and total project cost (purchase + closing + rehab). Represents forced appreciation from improvements.",
    category: "metric",
  },
  break_even_occupancy: {
    term: "Break-Even Occupancy",
    definition: "The minimum occupancy rate needed to cover all operating expenses and debt service. Lower is more resilient.",
    category: "metric",
  },

  // ── Strategy Terms ──
  long_term_rental: {
    term: "Long-Term Rental (LTR)",
    definition: "Traditional 12+ month lease strategy. Prioritizes predictable monthly cash flow, lower turnover costs, and tenant stability.",
    category: "strategy",
  },
  short_term_rental: {
    term: "Short-Term Rental (STR)",
    definition: "Furnished rentals on platforms like Airbnb/VRBO. Higher potential income but more operational work, higher vacancy risk, and regulatory exposure.",
    category: "strategy",
  },
  hybrid_strategy: {
    term: "Hybrid Strategy",
    definition: "Combines long-term and short-term rental approaches across different units or seasons. Balances income upside with cash flow stability.",
    category: "strategy",
  },
  fix_flip: {
    term: "Fix & Flip",
    definition: "Buy, renovate, and sell for profit. Returns depend on the spread between total cost and resale value in the current market.",
    category: "strategy",
  },
  brrrr: {
    term: "BRRRR",
    definition: "Buy, Rehab, Rent, Refinance, Repeat. Strategy to recycle capital by creating equity through renovation and refinancing to recover invested cash.",
    category: "strategy",
  },
  value_add: {
    term: "Value-Add",
    definition: "Acquire underperforming property, improve it to increase income or value, then hold or sell. Success depends on the rent uplift relative to renovation cost.",
    category: "strategy",
  },

  // ── Market Terms ──
  months_of_supply: {
    term: "Months of Supply",
    definition: "How long current inventory would last at the current sales pace. Under 4 months typically favors sellers; over 6 months favors buyers.",
    category: "market",
  },
  absorption_rate: {
    term: "Absorption Rate",
    definition: "The rate at which available homes are sold in a market over a given time period. Higher absorption indicates stronger demand.",
    category: "market",
  },
  sale_to_list_ratio: {
    term: "Sale-to-List Ratio",
    definition: "Average sale price divided by list price. Above 1.0 means properties are selling above asking; below 0.95 indicates buyer leverage.",
    category: "market",
  },
  days_on_market: {
    term: "Days on Market",
    definition: "Average time properties spend listed before selling. Fewer days = hotter market. Over 60 days may indicate softening demand.",
    category: "market",
  },

  // ── Risk Terms ──
  crime_score: {
    term: "Crime Score",
    definition: "Relative safety signal on a 0–10 scale. Lower scores indicate less crime risk. Used as one factor in location risk assessment, not a prediction.",
    category: "risk",
  },
  stress_test: {
    term: "Stress Test",
    definition: "Scenario analysis that models how the deal performs under adverse conditions (rate increases, rent drops, higher vacancy, cost overruns).",
    category: "risk",
  },
  resilience: {
    term: "Deal Resilience",
    definition: "How well the deal maintains positive performance across stress scenarios. Strong resilience means the deal tolerates multiple downside conditions.",
    category: "risk",
  },
  unseen_risk_buffer: {
    term: "Unseen-Risk Buffer",
    definition: "A small, defensible adjustment applied to expense, financing, and vacancy assumptions so analysis is not based on best-case conditions. Built into the decision framework, not random padding.",
    category: "risk",
  },

  // ── General ──
  confidence_level: {
    term: "Confidence Level",
    definition: "Reflects the strength and completeness of available data inputs. Higher confidence means more data supports the analysis; lower confidence means results are preliminary.",
    category: "general",
  },
  deal_score: {
    term: "Deal Score",
    definition: "Composite rating (0–100) based on cash flow strength, return metrics, risk factors, and market alignment. Reflects overall deal quality under the selected market profile and strategy.",
    category: "general",
  },
};

/**
 * Look up a glossary entry by key.
 * Returns undefined if not found — UI should handle gracefully.
 */
export function getGlossaryEntry(key: string): GlossaryEntry | undefined {
  return GLOSSARY[key];
}

/**
 * Get all glossary entries for a specific category.
 */
export function getGlossaryByCategory(category: GlossaryEntry["category"]): GlossaryEntry[] {
  return Object.values(GLOSSARY).filter(e => e.category === category);
}

// ── Disclosure Text ────────────────────────────────────────────────────

export const ANALYSIS_DISCLOSURE =
  "For informational purposes only. Not financial, tax, legal, lending, or investment advice. Users should independently verify all assumptions, financing terms, regulations, and market conditions.";
