export type IntelligenceModule = "FindIQ" | "DealIQ" | "PipelineIQ" | "OfferIQ" | "PortfolioIQ";

export type RecommendationClass = "Strong Buy" | "Buy" | "Consider" | "Pass" | "Avoid";

export interface ExplainableRecommendation {
  module: IntelligenceModule;
  recommendation: string;
  confidenceScore: number;
  supportingFactors: string[];
  risks: string[];
  assumptions: string[];
  alternativeStrategies: string[];
}

export const aiOperatingRules = [
  "Explain reasoning before conclusions.",
  "Distinguish verified facts, estimates, assumptions, and AI opinions.",
  "Highlight uncertainty and request missing data.",
  "Evaluate opportunities objectively rather than justifying them.",
  "Optimize decision quality, not deal volume.",
];

export const moduleIntelligenceCapabilities: Record<
  IntelligenceModule,
  {
    purpose: string;
    primaryQuestion: string;
    outputs: string[];
  }
> = {
  FindIQ: {
    purpose: "Discovery Intelligence",
    primaryQuestion: "What should I investigate?",
    outputs: [
      "Opportunity Summary",
      "Opportunity Ranking Explanation",
      "Market Alerts",
      "Opportunity Change Analysis",
      "New Opportunity Notifications",
    ],
  },
  DealIQ: {
    purpose: "Acquisition Intelligence",
    primaryQuestion: "Should I acquire it?",
    outputs: [
      "Executive Summary",
      "Acquisition Recommendation",
      "Confidence Score",
      "Risk Assessment",
      "Negotiation Strategy",
      "Suggested Offer Range",
      "Renovation Strategy",
      "Rental Strategy",
      "Resale Strategy",
      "Exit Strategy",
    ],
  },
  PipelineIQ: {
    purpose: "Workflow Intelligence",
    primaryQuestion: "What should I do next?",
    outputs: [
      "Deal Health Review",
      "Task Recommendations",
      "Deadline Alerts",
      "Next Action Recommendations",
      "Pipeline Risk Analysis",
    ],
  },
  OfferIQ: {
    purpose: "Transaction Intelligence",
    primaryQuestion: "How should I pursue it?",
    outputs: [
      "Offer Recommendations",
      "Counteroffer Recommendations",
      "Negotiation Talking Points",
      "Concession Recommendations",
      "Seller Strategy Analysis",
      "Communication Drafts",
    ],
  },
  PortfolioIQ: {
    purpose: "Asset Intelligence",
    primaryQuestion: "What should I do with what I own?",
    outputs: [
      "Portfolio Reviews",
      "Asset Reviews",
      "Refinance Opportunities",
      "Disposition Opportunities",
      "Growth Recommendations",
      "Risk Reviews",
      "Capital Allocation Recommendations",
    ],
  },
};

export function clampConfidence(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildExplainableRecommendation(input: ExplainableRecommendation): ExplainableRecommendation {
  return {
    ...input,
    confidenceScore: clampConfidence(input.confidenceScore),
    supportingFactors: input.supportingFactors.length > 0 ? input.supportingFactors : ["Insufficient supporting factors provided."],
    risks: input.risks.length > 0 ? input.risks : ["Risk requires additional verification."],
    assumptions: input.assumptions.length > 0 ? input.assumptions : ["Assumptions require review before action."],
    alternativeStrategies: input.alternativeStrategies.length > 0 ? input.alternativeStrategies : ["Investigate further before selecting a strategy."],
  };
}

export const aiGuardrails = [
  "Never guarantee returns.",
  "Never guarantee appreciation.",
  "Never guarantee cash flow.",
  "Never guarantee occupancy.",
  "Never guarantee future market conditions.",
  "Provide decision support, not financial certainty.",
];
