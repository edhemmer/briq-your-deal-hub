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

export type StrategyInsight = {
  selected: StrategyScore;
  best: StrategyScore;
  isSelectedBest: boolean;
  scoreGap: number;
  headline: string;
  explanation: string;
  tradeoffs: string[];
  verification: string[];
};

export type DealAnalysis = {
  decision: "Visit" | "Research first" | "Do not visit yet";
  confidence: number;
  readiness: number;
  affordability: number;
  monthlyNOI?: number;
  monthlyDebtService?: number;
  monthlyCashFlow?: number;
  dscr?: number;
  capRate?: number;
  cashOnCash?: number;
  monthlyPayment?: number;
  estimatedCashNeeded?: number;
  primaryStrategy: StrategyScore;
  strategyScores: StrategyScore[];
  strategyInsight: StrategyInsight;
  nextActions: string[];
  evidence: string[];
  missing: string[];
  keyRisks: string[];
  alternativeStrategies: string[];
  bullCase: string[];
  bearCase: string[];
  whatMustBeTrue: string[];
  failureScenarios: string[];
};

export type PipelineItem = {
  dealId: string;
  address: string;
  stage: DealStatus;
  nextAction: string;
  confidence: number;
};

export type DealRelationshipRole =
  | "buyer_investor"
  | "seller_owner"
  | "listing_broker"
  | "buyer_broker"
  | "property_manager"
  | "lender"
  | "mortgage_broker"
  | "attorney"
  | "title_escrow"
  | "inspector"
  | "appraiser"
  | "contractor"
  | "architect_engineer"
  | "insurance_professional"
  | "association_manager"
  | "tenant"
  | "partner_investor"
  | "other";

export type DealRelationshipStatus = "active" | "prospective" | "inactive" | "removed";

export type RelationshipTargetType = "contact" | "organization";

export type DealRelationship = {
  relationshipId: string;
  relationshipVersion: number;
  workspaceId: string;
  dealId: string;
  targetType: RelationshipTargetType;
  contactId?: string;
  organizationId?: string;
  role: DealRelationshipRole;
  roleLabel: string;
  status: DealRelationshipStatus;
  statusLabel: string;
  isPrimary: boolean;
  notes?: string;
  communicationPreference?: "email" | "phone" | "text" | "unknown";
  targetDisplayName: string;
  targetEmail?: string;
  targetPhone?: string;
  targetWebsite?: string;
  targetArchivedAt?: string;
  updatedAt: string;
};

export type DuplicateCandidate = {
  id: string;
  displayName: string;
  email?: string;
  phone?: string;
  website?: string;
  version: number;
  matchReasons: string[];
};

export type DealTaskStatus = "open" | "in_progress" | "blocked" | "completed" | "cancelled";
export type DealTaskPriority = "low" | "normal" | "high" | "urgent";
export type DealTaskType = "general" | "verification" | "research" | "visit" | "offer" | "contract" | "financing" | "due_diligence";
export type DealDeadlineStatus = "open" | "changed" | "completed" | "cancelled";
export type DealDeadlineVerificationState =
  | "unverified"
  | "user_verified"
  | "source_verified"
  | "professional_review_recommended"
  | "rejected"
  | "superseded";
export type DealNoteType = "general" | "call" | "visit" | "research" | "decision";

export type DealWorkItem = {
  recordType: "task" | "deadline";
  recordId: string;
  recordVersion: number;
  workspaceId: string;
  dealId: string;
  title: string;
  body?: string;
  status: DealTaskStatus | DealDeadlineStatus;
  priority?: DealTaskPriority;
  workType: DealTaskType | "deadline";
  dueAt?: string;
  dueDate?: string;
  isAllDay: boolean;
  timezone: string;
  sourceType: string;
  sourceRecordId?: string;
  verificationState?: DealDeadlineVerificationState;
  completedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DealNote = {
  noteId: string;
  noteVersion: number;
  workspaceId: string;
  dealId: string;
  body: string;
  noteType: DealNoteType;
  pinned: boolean;
  sourceType: string;
  sourceRecordId?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DealTimelineItem = {
  timelineId: string;
  workspaceId: string;
  dealId: string;
  eventType: string;
  sourceType: string;
  sourceRecordId?: string;
  safeTitle: string;
  safeSummary: string;
  actorId?: string;
  occurredAt: string;
  canonicalOrder: string;
};
