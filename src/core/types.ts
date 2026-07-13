import type { StrategyId } from "./strategyCatalog";

export type DealStatus = "draft" | "reviewing" | "underwriting" | "pursuing" | "under_contract" | "closed" | "passed";

export type VerificationState = "entered" | "source_backed" | "estimated" | "missing";

export type DealFacts = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: DealStatus;
  sourceUrl?: string;
  sourceText?: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  listPrice?: number;
  beds?: number;
  baths?: number;
  squareFeet?: number;
  lotSize?: string;
  yearBuilt?: number;
  propertyType?: string;
  hoaMonthly?: number;
  annualTaxes?: number;
  annualInsurance?: number;
  monthlyRent?: number;
  arv?: number;
  rehabBudget?: number;
  downPayment?: number;
  interestRate?: number;
  loanYears?: number;
  strategyId: StrategyId;
  notes: string[];
  photoUrls: string[];
  uploadedPhotoNames: string[];
  verification: Record<string, VerificationState>;
};

export type StrategyScore = {
  strategyId: StrategyId;
  name: string;
  score: number;
  confidence: number;
  recommendation: "Strong fit" | "Possible fit" | "Needs verification" | "Weak fit";
  why: string[];
  risks: string[];
  missing: string[];
};

export type DealAnalysis = {
  decision: "Visit" | "Research first" | "Do not visit yet";
  confidence: number;
  readiness: number;
  affordability: number;
  monthlyPayment?: number;
  estimatedCashNeeded?: number;
  primaryStrategy: StrategyScore;
  strategyScores: StrategyScore[];
  nextActions: string[];
  evidence: string[];
  missing: string[];
};

export type PipelineItem = {
  dealId: string;
  address: string;
  stage: DealStatus;
  nextAction: string;
  confidence: number;
};
