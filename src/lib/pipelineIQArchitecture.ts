export type PipelineStage =
  | "New Opportunity"
  | "Reviewing"
  | "Underwriting"
  | "Offer Strategy"
  | "Offer Drafted"
  | "Offer Submitted"
  | "Negotiating"
  | "Under Contract"
  | "Due Diligence"
  | "Closing"
  | "Closed"
  | "Rejected";

export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus = "Open" | "In Progress" | "Done";

export interface PipelineTask {
  id: string;
  title: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  owner: string;
}

export interface PipelineActivity {
  id: string;
  type: "Note" | "Call" | "Email" | "Status Change" | "Offer" | "Document";
  description: string;
  date: string;
}

export interface PipelineOpportunity {
  id: string;
  address: string;
  city: string;
  state: string;
  source: "FindIQ" | "DealIQ" | "OfferIQ" | "Manual";
  stage: PipelineStage;
  nextAction: string;
  responsibleParty: string;
  deadline: string;
  probabilityToClose: number;
  healthScore: number;
  tasks: PipelineTask[];
  activity: PipelineActivity[];
}

export const pipelineStages: PipelineStage[] = [
  "New Opportunity",
  "Reviewing",
  "Underwriting",
  "Offer Strategy",
  "Offer Drafted",
  "Offer Submitted",
  "Negotiating",
  "Under Contract",
  "Due Diligence",
  "Closing",
  "Closed",
  "Rejected",
];

export const samplePipelineOpportunities: PipelineOpportunity[] = [
  {
    id: "pipe-sandhurst",
    address: "1019 Sandhurst Dr",
    city: "Sandwich",
    state: "IL",
    source: "FindIQ",
    stage: "Underwriting",
    nextAction: "Run DealIQ rent and insurance verification",
    responsibleParty: "Ed",
    deadline: "2026-06-21",
    probabilityToClose: 38,
    healthScore: 82,
    tasks: [
      { id: "task-s1", title: "Verify rent comps", dueDate: "2026-06-20", priority: "High", status: "Open", owner: "Ed" },
      { id: "task-s2", title: "Obtain insurance quote", dueDate: "2026-06-21", priority: "High", status: "Open", owner: "Paula" },
    ],
    activity: [
      { id: "act-s1", type: "Status Change", description: "Moved from FindIQ to DealIQ underwriting.", date: "2026-06-18" },
      { id: "act-s2", type: "Note", description: "Good profile fit, but rental support remains unverified.", date: "2026-06-18" },
    ],
  },
  {
    id: "pipe-dekalb",
    address: "428 Prairie View Ln",
    city: "DeKalb",
    state: "IL",
    source: "FindIQ",
    stage: "Reviewing",
    nextAction: "Decide whether taxes disqualify the opportunity",
    responsibleParty: "Ed",
    deadline: "2026-06-19",
    probabilityToClose: 22,
    healthScore: 67,
    tasks: [
      { id: "task-d1", title: "Pull latest tax bill", dueDate: "2026-06-19", priority: "Medium", status: "In Progress", owner: "Ed" },
    ],
    activity: [
      { id: "act-d1", type: "Note", description: "Taxes may exceed acquisition profile preference.", date: "2026-06-18" },
    ],
  },
  {
    id: "pipe-yorkville",
    address: "716 Birchwood Ct",
    city: "Yorkville",
    state: "IL",
    source: "DealIQ",
    stage: "Offer Strategy",
    nextAction: "Model offer price below profile budget ceiling",
    responsibleParty: "Paula",
    deadline: "2026-06-22",
    probabilityToClose: 31,
    healthScore: 75,
    tasks: [
      { id: "task-y1", title: "Prepare negotiation range", dueDate: "2026-06-22", priority: "Medium", status: "Open", owner: "Paula" },
      { id: "task-y2", title: "Review comparable sales", dueDate: "2026-06-22", priority: "Medium", status: "Open", owner: "Ed" },
    ],
    activity: [
      { id: "act-y1", type: "Status Change", description: "DealIQ recommends renegotiation before offer.", date: "2026-06-18" },
    ],
  },
  {
    id: "pipe-inspection",
    address: "233 Maple Crossing",
    city: "Montgomery",
    state: "IL",
    source: "OfferIQ",
    stage: "Due Diligence",
    nextAction: "Schedule inspection and verify title commitment",
    responsibleParty: "Ed",
    deadline: "2026-06-24",
    probabilityToClose: 63,
    healthScore: 58,
    tasks: [
      { id: "task-m1", title: "Schedule inspection", dueDate: "2026-06-20", priority: "High", status: "Open", owner: "Ed" },
      { id: "task-m2", title: "Review title commitment", dueDate: "2026-06-24", priority: "High", status: "Open", owner: "Paula" },
      { id: "task-m3", title: "Confirm financing conditions", dueDate: "2026-06-24", priority: "Medium", status: "In Progress", owner: "Ed" },
    ],
    activity: [
      { id: "act-m1", type: "Offer", description: "Offer accepted. Due diligence period opened.", date: "2026-06-17" },
      { id: "act-m2", type: "Document", description: "Purchase agreement uploaded from OfferIQ.", date: "2026-06-17" },
    ],
  },
];

export function healthTone(score: number) {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Needs Attention";
  return "At Risk";
}
