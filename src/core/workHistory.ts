import { supabase } from "./supabase";
import type {
  DealDeadlineStatus,
  DealDeadlineVerificationState,
  DealNote,
  DealNoteType,
  DealTaskPriority,
  DealTaskStatus,
  DealTaskType,
  DealTimelineItem,
  DealWorkItem,
} from "./types";

type UnknownRecord = Record<string, unknown>;

export const taskStatuses: Array<{ id: DealTaskStatus; label: string }> = [
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In progress" },
  { id: "blocked", label: "Blocked" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export const taskPriorities: Array<{ id: DealTaskPriority; label: string }> = [
  { id: "low", label: "Low" },
  { id: "normal", label: "Normal" },
  { id: "high", label: "High" },
  { id: "urgent", label: "Urgent" },
];

export const taskTypes: Array<{ id: DealTaskType; label: string }> = [
  { id: "general", label: "General" },
  { id: "verification", label: "Verification" },
  { id: "research", label: "Research" },
  { id: "visit", label: "Visit" },
  { id: "offer", label: "Offer" },
  { id: "contract", label: "Contract" },
  { id: "financing", label: "Financing" },
  { id: "due_diligence", label: "Due diligence" },
];

export const deadlineStatuses: Array<{ id: DealDeadlineStatus; label: string }> = [
  { id: "open", label: "Open" },
  { id: "changed", label: "Changed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export const deadlineVerificationStates: Array<{ id: DealDeadlineVerificationState; label: string }> = [
  { id: "unverified", label: "Unverified" },
  { id: "user_verified", label: "User verified" },
  { id: "source_verified", label: "Source verified" },
  { id: "professional_review_recommended", label: "Review recommended" },
  { id: "rejected", label: "Rejected" },
  { id: "superseded", label: "Superseded" },
];

export const noteTypes: Array<{ id: DealNoteType; label: string }> = [
  { id: "general", label: "General" },
  { id: "call", label: "Call" },
  { id: "visit", label: "Visit" },
  { id: "research", label: "Research" },
  { id: "decision", label: "Decision" },
];

export type TaskDraft = {
  title: string;
  description?: string;
  taskType: DealTaskType;
  priority: DealTaskPriority;
  status: DealTaskStatus;
  dueAt?: string;
  dueDate?: string;
  isAllDay: boolean;
  timezone: string;
};

export type DeadlineDraft = {
  title: string;
  status: DealDeadlineStatus;
  dueAt?: string;
  dueDate?: string;
  isAllDay: boolean;
  timezone: string;
  sourceTerm?: string;
  sourceDescription?: string;
  triggerDate?: string;
  calculationRule?: string;
  verificationState: DealDeadlineVerificationState;
};

export type NoteDraft = {
  body: string;
  noteType: DealNoteType;
  pinned: boolean;
};

export async function listDealWork(dealId: string): Promise<DealWorkItem[]> {
  const { data, error } = await supabase.rpc("list_deal_work", { target_deal_id: dealId });
  if (error) throw error;
  return Array.isArray(data) ? data.map(normalizeWorkItem).filter(isWorkItem) : [];
}

export async function listDealNotes(dealId: string): Promise<DealNote[]> {
  const { data, error } = await supabase.rpc("list_deal_notes", { target_deal_id: dealId });
  if (error) throw error;
  return Array.isArray(data) ? data.map(normalizeNote).filter(isNote) : [];
}

export async function loadDealTimeline(dealId: string, beforeTime?: string): Promise<DealTimelineItem[]> {
  const { data, error } = await supabase.rpc("load_deal_timeline", {
    target_deal_id: dealId,
    before_time: beforeTime ?? null,
    page_size: 30,
  });
  if (error) throw error;
  return Array.isArray(data) ? data.map(normalizeTimelineItem).filter(isTimelineItem) : [];
}

export async function createDealTask(dealId: string, draft: TaskDraft) {
  const { error } = await supabase.rpc("create_deal_task", {
    target_deal_id: dealId,
    task_input: taskInput(draft),
    idempotency_key: `task:${dealId}:${crypto.randomUUID()}`,
  });
  if (error) throw error;
}

export async function updateDealTask(item: DealWorkItem, draft: Partial<TaskDraft> & { status?: DealTaskStatus }) {
  const { error } = await supabase.rpc("update_deal_task", {
    target_task_id: item.recordId,
    expected_version: item.recordVersion,
    task_input: taskInput({ ...itemToTaskDraft(item), ...draft }),
  });
  if (error) throw error;
}

export async function completeDealTask(item: DealWorkItem) {
  const { error } = await supabase.rpc("complete_deal_task", { target_task_id: item.recordId, expected_version: item.recordVersion });
  if (error) throw error;
}

export async function cancelDealTask(item: DealWorkItem) {
  const { error } = await supabase.rpc("cancel_deal_task", { target_task_id: item.recordId, expected_version: item.recordVersion });
  if (error) throw error;
}

export async function createDealDeadline(dealId: string, draft: DeadlineDraft) {
  const { error } = await supabase.rpc("create_deal_deadline", {
    target_deal_id: dealId,
    deadline_input: deadlineInput(draft),
    idempotency_key: `deadline:${dealId}:${crypto.randomUUID()}`,
  });
  if (error) throw error;
}

export async function updateDealDeadline(item: DealWorkItem, draft: Partial<DeadlineDraft>) {
  const { error } = await supabase.rpc("update_deal_deadline", {
    target_deadline_id: item.recordId,
    expected_version: item.recordVersion,
    deadline_input: deadlineInput({ ...itemToDeadlineDraft(item), ...draft }),
  });
  if (error) throw error;
}

export async function completeDealDeadline(item: DealWorkItem) {
  const { error } = await supabase.rpc("complete_deal_deadline", { target_deadline_id: item.recordId, expected_version: item.recordVersion });
  if (error) throw error;
}

export async function createDealNote(dealId: string, draft: NoteDraft) {
  const { error } = await supabase.rpc("create_deal_note", {
    target_deal_id: dealId,
    note_input: noteInput(draft),
    idempotency_key: `note:${dealId}:${crypto.randomUUID()}`,
  });
  if (error) throw error;
}

export async function updateDealNote(note: DealNote, draft: Partial<NoteDraft>) {
  const { error } = await supabase.rpc("update_deal_note", {
    target_note_id: note.noteId,
    expected_version: note.noteVersion,
    note_input: noteInput({ body: note.body, noteType: note.noteType, pinned: note.pinned, ...draft }),
  });
  if (error) throw error;
}

export async function archiveDealNote(note: DealNote) {
  const { error } = await supabase.rpc("archive_deal_note", { target_note_id: note.noteId, expected_version: note.noteVersion });
  if (error) throw error;
}

function taskInput(draft: TaskDraft) {
  return {
    title: draft.title.trim(),
    description: draft.description?.trim() || null,
    task_type: draft.taskType,
    status: draft.status,
    priority: draft.priority,
    due_at: draft.isAllDay ? null : draft.dueAt || null,
    due_date: draft.isAllDay ? draft.dueDate || null : null,
    is_all_day: draft.isAllDay,
    timezone: draft.timezone || "UTC",
    source_type: "manual",
  };
}

function deadlineInput(draft: DeadlineDraft) {
  return {
    title: draft.title.trim(),
    status: draft.status,
    due_at: draft.isAllDay ? null : draft.dueAt || null,
    due_date: draft.isAllDay ? draft.dueDate || null : null,
    is_all_day: draft.isAllDay,
    timezone: draft.timezone || "UTC",
    source_type: "manual",
    source_term: draft.sourceTerm?.trim() || null,
    source_description: draft.sourceDescription?.trim() || null,
    trigger_date: draft.triggerDate || null,
    calculation_rule: draft.calculationRule?.trim() || null,
    verification_state: draft.verificationState,
  };
}

function noteInput(draft: NoteDraft) {
  return {
    body: draft.body.trim(),
    note_type: draft.noteType,
    pinned: draft.pinned,
    source_type: "manual",
  };
}

function itemToTaskDraft(item: DealWorkItem): TaskDraft {
  return {
    title: item.title,
    description: item.body,
    taskType: item.workType === "deadline" ? "general" : item.workType,
    priority: item.priority ?? "normal",
    status: item.status as DealTaskStatus,
    dueAt: item.dueAt,
    dueDate: item.dueDate,
    isAllDay: item.isAllDay,
    timezone: item.timezone,
  };
}

function itemToDeadlineDraft(item: DealWorkItem): DeadlineDraft {
  return {
    title: item.title,
    status: item.status as DealDeadlineStatus,
    dueAt: item.dueAt,
    dueDate: item.dueDate,
    isAllDay: item.isAllDay,
    timezone: item.timezone,
    sourceDescription: item.body,
    verificationState: item.verificationState ?? "unverified",
  };
}

function normalizeWorkItem(value: unknown): DealWorkItem | null {
  if (!isRecord(value)) return null;
  const recordType = value.record_type === "task" || value.record_type === "deadline" ? value.record_type : undefined;
  const recordId = stringValue(value.record_id);
  const workspaceId = stringValue(value.workspace_id);
  const dealId = stringValue(value.deal_id);
  const title = stringValue(value.title);
  const updatedAt = stringValue(value.updated_at);
  const createdAt = stringValue(value.created_at);
  if (!recordType || !recordId || !workspaceId || !dealId || !title || !updatedAt || !createdAt) return null;
  return {
    recordType,
    recordId,
    recordVersion: numberValue(value.record_version) ?? 1,
    workspaceId,
    dealId,
    title,
    body: stringValue(value.body),
    status: stringValue(value.status) as DealWorkItem["status"],
    priority: stringValue(value.priority) as DealTaskPriority | undefined,
    workType: (stringValue(value.work_type) ?? (recordType === "deadline" ? "deadline" : "general")) as DealWorkItem["workType"],
    dueAt: stringValue(value.due_at),
    dueDate: stringValue(value.due_date),
    isAllDay: value.is_all_day === true,
    timezone: stringValue(value.timezone) ?? "UTC",
    sourceType: stringValue(value.source_type) ?? "manual",
    sourceRecordId: stringValue(value.source_record_id),
    verificationState: stringValue(value.verification_state) as DealDeadlineVerificationState | undefined,
    completedAt: stringValue(value.completed_at),
    archivedAt: stringValue(value.archived_at),
    createdAt,
    updatedAt,
  };
}

function normalizeNote(value: unknown): DealNote | null {
  if (!isRecord(value)) return null;
  const noteId = stringValue(value.note_id);
  const workspaceId = stringValue(value.workspace_id);
  const dealId = stringValue(value.deal_id);
  const body = stringValue(value.body);
  const updatedAt = stringValue(value.updated_at);
  const createdAt = stringValue(value.created_at);
  if (!noteId || !workspaceId || !dealId || !body || !updatedAt || !createdAt) return null;
  return {
    noteId,
    noteVersion: numberValue(value.note_version) ?? 1,
    workspaceId,
    dealId,
    body,
    noteType: (stringValue(value.note_type) ?? "general") as DealNoteType,
    pinned: value.pinned === true,
    sourceType: stringValue(value.source_type) ?? "manual",
    sourceRecordId: stringValue(value.source_record_id),
    archivedAt: stringValue(value.archived_at),
    createdAt,
    updatedAt,
  };
}

function normalizeTimelineItem(value: unknown): DealTimelineItem | null {
  if (!isRecord(value)) return null;
  const timelineId = stringValue(value.timeline_id);
  const workspaceId = stringValue(value.workspace_id);
  const dealId = stringValue(value.deal_id);
  const eventType = stringValue(value.event_type);
  const safeTitle = stringValue(value.safe_title);
  const safeSummary = stringValue(value.safe_summary);
  const occurredAt = stringValue(value.occurred_at);
  const canonicalOrder = stringValue(value.canonical_order);
  if (!timelineId || !workspaceId || !dealId || !eventType || !safeTitle || !safeSummary || !occurredAt || !canonicalOrder) return null;
  return {
    timelineId,
    workspaceId,
    dealId,
    eventType,
    sourceType: stringValue(value.source_type) ?? eventType.split(".")[0],
    sourceRecordId: stringValue(value.source_record_id),
    safeTitle,
    safeSummary,
    actorId: stringValue(value.actor_id),
    occurredAt,
    canonicalOrder,
  };
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function isWorkItem(value: DealWorkItem | null): value is DealWorkItem {
  return value !== null;
}

function isNote(value: DealNote | null): value is DealNote {
  return value !== null;
}

function isTimelineItem(value: DealTimelineItem | null): value is DealTimelineItem {
  return value !== null;
}
