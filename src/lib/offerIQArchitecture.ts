export type AcquisitionStrategy =
  | "Full Price Strategy"
  | "Value Strategy"
  | "Distressed Strategy"
  | "Investor Strategy"
  | "Owner Occupant Strategy";

export type FinancingType =
  | "Cash"
  | "Conventional"
  | "FHA"
  | "VA"
  | "DSCR"
  | "Commercial";

export interface OfferStructure {
  id: string;
  label: string;
  financing: FinancingType;
  purchasePrice: number;
  earnestMoney: number;
  dueDiligenceDays: number;
  inspectionDays: number;
  financingContingency: boolean;
  appraisalContingency: boolean;
  closingDays: number;
  sellerConcessions: number;
  repairRequests: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface OfferDocument {
  id: string;
  title: string;
  source: "DealIQ" | "OfferIQ" | "PipelineIQ";
  status: "Ready" | "Needs Review" | "Draft";
}

export interface OfferCommunication {
  id: string;
  title: string;
  audience: "Listing Agent" | "Seller" | "Investor" | "Broker" | "Internal";
  purpose: string;
  status: "Generated" | "Needs Data" | "Ready";
}

export interface DueDiligenceItem {
  id: string;
  title: string;
  owner: string;
  status: "Open" | "In Progress" | "Complete";
  dueDate: string;
}

export interface TransactionMilestone {
  id: string;
  label: string;
  date: string;
  status: "Upcoming" | "At Risk" | "Complete";
}

export const regressionOfferStrategies: Array<{
  strategy: AcquisitionStrategy;
  fit: string;
  rationale: string;
  risk: string;
}> = [
  {
    strategy: "Value Strategy",
    fit: "Recommended",
    rationale: "DealIQ indicates value is possible if renovation scope and rent support are verified.",
    risk: "Offer must leave room for inspection findings and contractor bid variance.",
  },
  {
    strategy: "Investor Strategy",
    fit: "Good Alternative",
    rationale: "Cash flow can work if rents verify and insurance stays within the modeled range.",
    risk: "Weak rent evidence should reduce offer aggressiveness.",
  },
  {
    strategy: "Full Price Strategy",
    fit: "Not Preferred",
    rationale: "Current evidence does not justify paying full price before due diligence is complete.",
    risk: "Overpaying before verification reduces downside protection.",
  },
];

export const regressionOfferStructures: OfferStructure[] = [
  {
    id: "offer-a",
    label: "Offer A - Protected Value",
    financing: "Conventional",
    purchasePrice: 232000,
    earnestMoney: 2500,
    dueDiligenceDays: 10,
    inspectionDays: 7,
    financingContingency: true,
    appraisalContingency: true,
    closingDays: 35,
    sellerConcessions: 3000,
    repairRequests: ["Inspection-based repairs only"],
    strengths: ["Protects downside", "Leaves room for rehab uncertainty", "Clear diligence timeline"],
    weaknesses: ["Less competitive", "Seller may counter on price"],
  },
  {
    id: "offer-b",
    label: "Offer B - Competitive Terms",
    financing: "Conventional",
    purchasePrice: 242500,
    earnestMoney: 5000,
    dueDiligenceDays: 7,
    inspectionDays: 5,
    financingContingency: true,
    appraisalContingency: true,
    closingDays: 30,
    sellerConcessions: 0,
    repairRequests: ["Major systems only"],
    strengths: ["More competitive", "Cleaner seller economics", "Faster close"],
    weaknesses: ["Less price protection", "Requires stronger confidence in condition"],
  },
  {
    id: "offer-c",
    label: "Offer C - Cash Speed",
    financing: "Cash",
    purchasePrice: 225000,
    earnestMoney: 7500,
    dueDiligenceDays: 5,
    inspectionDays: 5,
    financingContingency: false,
    appraisalContingency: false,
    closingDays: 14,
    sellerConcessions: 0,
    repairRequests: ["None before inspection"],
    strengths: ["Fastest closing", "Highest certainty for seller", "Useful for distressed seller"],
    weaknesses: ["Requires more capital", "Lower price may be rejected"],
  },
];

export const offerDocuments: OfferDocument[] = [
  { id: "loi", title: "Letter of Intent", source: "OfferIQ", status: "Ready" },
  { id: "summary", title: "Purchase Offer Summary", source: "DealIQ", status: "Ready" },
  { id: "memo", title: "Investment Committee Memo", source: "DealIQ", status: "Needs Review" },
  { id: "package", title: "Buyer Presentation Package", source: "OfferIQ", status: "Draft" },
  { id: "negotiation", title: "Negotiation Package", source: "PipelineIQ", status: "Draft" },
];

export const offerCommunications: OfferCommunication[] = [
  {
    id: "agent-email",
    title: "Listing Agent Email",
    audience: "Listing Agent",
    purpose: "Open dialogue and request missing diligence items.",
    status: "Ready",
  },
  {
    id: "info-request",
    title: "Information Request",
    audience: "Broker",
    purpose: "Request rent support, roof age, and utility details.",
    status: "Generated",
  },
  {
    id: "counteroffer",
    title: "Counteroffer Communication",
    audience: "Seller",
    purpose: "Support counter with DealIQ condition and risk findings.",
    status: "Needs Data",
  },
];

export const dueDiligenceItems: DueDiligenceItem[] = [
  { id: "inspection", title: "Inspection Tracking", owner: "Ed", status: "Open", dueDate: "2026-06-24" },
  { id: "title", title: "Title Review", owner: "Paula", status: "Open", dueDate: "2026-06-25" },
  { id: "insurance", title: "Insurance Review", owner: "Ed", status: "In Progress", dueDate: "2026-06-22" },
  { id: "financing", title: "Financing Progress", owner: "Ed", status: "In Progress", dueDate: "2026-06-26" },
  { id: "appraisal", title: "Appraisal Tracking", owner: "Paula", status: "Open", dueDate: "2026-06-28" },
];

export const transactionTimeline: TransactionMilestone[] = [
  { id: "offer", label: "Offer package ready", date: "2026-06-19", status: "Upcoming" },
  { id: "response", label: "Seller response deadline", date: "2026-06-21", status: "Upcoming" },
  { id: "inspection", label: "Inspection period ends", date: "2026-06-28", status: "At Risk" },
  { id: "financing", label: "Financing milestone", date: "2026-07-03", status: "Upcoming" },
  { id: "closing", label: "Target closing", date: "2026-07-23", status: "Upcoming" },
];
