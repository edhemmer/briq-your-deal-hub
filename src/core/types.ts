import type { StrategyId } from "./strategyCatalog";

export type DealStatus = "draft" | "reviewing" | "underwriting" | "pursuing" | "under_contract" | "closed" | "passed";

export type VerificationState = "entered" | "source_backed" | "estimated" | "missing";

export type DealFacts = {
  id: string;
  dealVersion?: number;
  propertyId?: string;
  propertyVersion?: number;
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

export type DealPriority = "low" | "normal" | "high" | "urgent";
export type CanonicalDealStage =
  | "lead"
  | "screening"
  | "research"
  | "visit_planned"
  | "visited"
  | "underwriting"
  | "negotiation"
  | "offer_preparation"
  | "offer_submitted"
  | "under_contract"
  | "due_diligence"
  | "financing"
  | "closing"
  | "owned"
  | "stabilizing"
  | "operating"
  | "refinancing"
  | "disposition"
  | "sold"
  | "passed"
  | "archived";
export type CanonicalDealOperatingStatus = "active" | "needs_attention" | "waiting" | "blocked" | "on_hold" | "passed" | "closed_won" | "closed_lost" | "archived" | "deleted_pending";

export type PropertySummary = {
  propertyId: string;
  propertyVersion: number;
  workspaceId: string;
  displayAddress: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country: string;
  parcelIdentifier?: string;
  activeDealCount?: number;
  updatedAt: string;
};

export type DealListProjection = {
  dealId: string;
  dealVersion: number;
  workspaceId: string;
  displayName: string;
  primaryPropertyId?: string;
  primaryPropertyVersion?: number;
  primaryPropertyAddress?: string;
  stage: CanonicalDealStage;
  status: CanonicalDealOperatingStatus;
  priority: DealPriority;
  source: string;
  strategyIntent?: string;
  updatedAt: string;
  openWorkCount: number;
  relationshipCount: number;
  nextDueAt?: string;
  totalCount: number;
};

export type DealDetailProjection = {
  deal: DealFacts;
  workspaceId: string;
  displayName: string;
  dealType: string;
  stage: CanonicalDealStage;
  operatingStatus: CanonicalDealOperatingStatus;
  priority: DealPriority;
  source: string;
  strategyIntent?: string;
  property?: PropertySummary;
  relationshipCount: number;
  openTaskCount: number;
  openDeadlineCount: number;
  pinnedNoteCount: number;
  recentEventCount: number;
  loadedAt: string;
};

export type DealCoreUpdate = {
  displayName?: string;
  dealType?: string;
  priority?: DealPriority;
  source?: string;
  strategyIntent?: string;
  sourceUrl?: string;
  sourceText?: string;
  strategyId?: StrategyId;
  facts?: DealFacts;
  verification?: Record<string, VerificationState>;
};

export type PropertyUpdate = {
  displayAddress?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  parcelIdentifier?: string;
};

export type DealLifecycleUpdate = {
  stage?: CanonicalDealStage;
  operatingStatus?: CanonicalDealOperatingStatus;
  reason?: string;
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
