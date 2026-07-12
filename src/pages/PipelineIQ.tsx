import { useEffect, useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  KanbanSquare,
  ListChecks,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useDeals, useUpdateDeal } from "@/hooks/useDeals";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { dealReadinessScore, missingDealInputs, positiveNumber } from "@/lib/dealReadiness";
import { cn } from "@/lib/utils";

type Deal = NonNullable<ReturnType<typeof useDeals>["data"]>[number];
type Task = Tables<"brix_project_tasks">;

const PIPELINE_STAGES = [
  { id: "draft", label: "Intake", action: "Complete the property file" },
  { id: "reviewing", label: "Review", action: "Decide if it deserves underwriting" },
  { id: "underwriting", label: "Underwriting", action: "Verify numbers and risks" },
  { id: "offer_strategy", label: "Offer Strategy", action: "Set offer terms and walk-away limits" },
  { id: "offer_submitted", label: "Offer Sent", action: "Track response and counter terms" },
  { id: "negotiating", label: "Negotiation", action: "Resolve price, terms, and contingencies" },
  { id: "under_contract", label: "Under Contract", action: "Run due diligence before deadlines" },
  { id: "closed", label: "Closed", action: "Move the asset into PortfolioIQ" },
  { id: "passed", label: "Passed", action: "Record why and keep the lesson" },
] as const;

const ACTIVE_STAGES = new Set(["draft", "reviewing", "underwriting", "offer_strategy", "offer_submitted", "negotiating", "under_contract"]);

export default function PipelineIQ() {
  const { user } = useAuth();
  const { data: deals = [], isLoading } = useDeals();
  const { data: tasks = [] } = usePipelineTasks();
  const updateDeal = useUpdateDeal();
  const queryClient = useQueryClient();
  const upsertTasks = useEnsurePipelineTasks();
  const updateTask = useUpdatePipelineTask();

  const sortedDeals = useMemo(() => [...deals].sort((a, b) => readinessScore(b) - readinessScore(a)), [deals]);
  const activeDeals = useMemo(() => deals.filter((deal) => ACTIVE_STAGES.has(normalizeStage(deal))), [deals]);
  const readyDeals = useMemo(() => deals.filter((deal) => readinessScore(deal) >= 85), [deals]);
  const closedDeals = useMemo(() => deals.filter((deal) => normalizeStage(deal) === "closed"), [deals]);
  const passedDeals = useMemo(() => deals.filter((deal) => normalizeStage(deal) === "passed"), [deals]);
  const tasksByDeal = useMemo(() => groupTasksByDeal(tasks), [tasks]);
  const openTasks = tasks.filter((task) => task.status !== "complete" && task.status !== "cancelled");

  useEffect(() => {
    if (!user || activeDeals.length === 0) return;
    const missingTaskInputs = activeDeals.flatMap((deal) => {
      const existingTitles = new Set((tasksByDeal.get(deal.id) ?? []).map((task) => task.title.toLowerCase()));
      return missingInputs(deal)
        .filter((title) => !existingTitles.has(title.toLowerCase()))
        .map((title) => ({ deal, title }));
    });

    if (missingTaskInputs.length === 0 || upsertTasks.isPending) return;
    upsertTasks.mutate(missingTaskInputs.slice(0, 20));
  }, [activeDeals, tasksByDeal, upsertTasks, upsertTasks.isPending, user]);

  function moveDeal(deal: Deal, nextStage: string) {
    updateDeal.mutate({ id: deal.id, deal_status: nextStage }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["pipeline-tasks"] });
      },
    });
  }

  return (
    <SectionContainer>
      <PageHeader
        title="PipelineIQ"
        description="Move each property from intake to outcome with clear status, missing proof, next action, and deal history."
      >
        <Button asChild>
          <Link to="/findiq">
            <Plus className="mr-2 h-4 w-4" />
            Start in FindIQ
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-4">
        <PipelineMetric label="Active" value={activeDeals.length} tone="blue" />
        <PipelineMetric label="Ready to pursue" value={readyDeals.length} tone="green" />
        <PipelineMetric label="Open tasks" value={openTasks.length} tone="amber" />
        <PipelineMetric label="Outcomes" value={closedDeals.length + passedDeals.length} tone="neutral" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <CardContainer className="p-0">
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <KanbanSquare className="h-4 w-4 text-primary" />
              Deal Flow
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
                  Every property stays visible until it has a win, loss, pass, or close outcome. Verification tasks are saved with the deal file.
            </p>
          </div>

          {isLoading ? (
            <EmptyPipeline title="Loading your pipeline" body="BRIX is checking your active deal files." />
          ) : sortedDeals.length === 0 ? (
            <EmptyPipeline
              title="No active deal files yet"
              body="Start by adding a listing URL, listing text, spreadsheet row, or property facts. BRIX will turn it into a deal record."
            />
          ) : (
            <div className="divide-y divide-border">
              {sortedDeals.map((deal) => (
                <PipelineDealRow
                  key={deal.id}
                  deal={deal}
                  tasks={tasksByDeal.get(deal.id) ?? []}
                  onStageChange={(stage) => moveDeal(deal, stage)}
                  onTaskToggle={(task) => updateTask.mutate({
                    id: task.id,
                    status: task.status === "complete" ? "open" : "complete",
                  })}
                />
              ))}
            </div>
          )}
        </CardContainer>

        <CardContainer className="self-start">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Confidence Work
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            BRIX only gets more decisive when the deal file gets stronger. The highest value work is usually one missing source, not another opinion.
          </p>

          <div className="mt-5 space-y-3">
            {openTasks.length === 0 ? (
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                No open verification tasks are showing right now.
              </div>
            ) : (
              openTasks.slice(0, 6).map((task) => {
                const deal = deals.find((item) => item.id === task.deal_id);
                return (
                <div key={task.id} className="rounded-lg border border-border bg-background/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{deal?.property_address || deal?.deal_name || "Unnamed deal"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{task.title}</p>
                      {task.due_at && (
                        <p className="mt-1 text-[11px] font-medium text-amber-300">
                          Due {new Date(task.due_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="border-amber-500/35 bg-amber-500/10 text-amber-300">
                      Verify
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {deal && (
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/dealiq/${deal.id}`}>Open deal file</Link>
                      </Button>
                    )}
                    <Button size="sm" onClick={() => updateTask.mutate({ id: task.id, status: "complete" })}>
                      Mark complete
                    </Button>
                  </div>
                </div>
              );
              })
            )}
          </div>
        </CardContainer>
      </div>
    </SectionContainer>
  );
}

function PipelineDealRow({
  deal,
  tasks,
  onStageChange,
  onTaskToggle,
}: {
  deal: Deal;
  tasks: Task[];
  onStageChange: (stage: string) => void;
  onTaskToggle: (task: Task) => void;
}) {
  const score = readinessScore(deal);
  const stage = normalizeStage(deal);
  const gaps = missingInputs(deal);
  const next = nextAction(deal);

  return (
    <div className="grid gap-4 p-5 lg:grid-cols-[minmax(260px,1fr)_190px_190px_180px] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{deal.property_address || deal.deal_name || "Unnamed deal"}</h3>
          <Badge variant="outline" className={stageBadgeClass(stage)}>
            {stageLabel(stage)}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{locationLine(deal)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip>{deal.property_type || "Property type needed"}</Chip>
          <Chip>{deal.strategy_primary || "Strategy needed"}</Chip>
          <Chip>{formatCurrency(deal.purchase_price) || "Price needed"}</Chip>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Readiness</span>
          <span className={cn("font-bold", score >= 85 ? "text-emerald-400" : score >= 65 ? "text-amber-300" : "text-red-300")}>{score}</span>
        </div>
        <Progress value={score} className="h-2" />
        <p className="mt-2 text-xs text-muted-foreground">{openDealTasks(tasks).length ? `${openDealTasks(tasks).length} open task${openDealTasks(tasks).length === 1 ? "" : "s"}` : "Core tasks clear"}</p>
      </div>

      <div>
        <Select value={stage} onValueChange={onStageChange}>
          <SelectTrigger className="bg-background/70">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_STAGES.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{next}</p>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/dealiq/${deal.id}`}>DealIQ</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to="/offeriq">
            OfferIQ
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {tasks.length > 0 && (
        <div className="lg:col-span-4 grid gap-2 rounded-lg border border-border bg-background/35 p-3 md:grid-cols-2 xl:grid-cols-3">
          {tasks.slice(0, 6).map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onTaskToggle(task)}
              className={cn(
                "flex items-start gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors",
                task.status === "complete"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  : "border-amber-500/25 bg-amber-500/10 text-foreground hover:border-primary/40",
              )}
            >
              <CheckCircle2 className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", task.status === "complete" ? "text-emerald-300" : "text-amber-300")} />
              <span>
                {task.title}
                {task.due_at && (
                  <span className="ml-1 text-muted-foreground">
                    Due {new Date(task.due_at).toLocaleDateString()}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function usePipelineTasks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["pipeline-tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brix_project_tasks")
        .select("*")
        .eq("user_id", user!.id)
        .not("deal_id", "is", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useEnsurePipelineTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: Array<{ deal: Deal; title: string }>) => {
      if (!user || items.length === 0) return;
      const rows = items.map(({ deal, title }) => ({
        user_id: user.id,
        deal_id: deal.id,
        title,
        task_type: "due_diligence",
        status: "open",
        priority: title.toLowerCase().includes("insurance") || title.toLowerCase().includes("tax")
          ? "critical"
          : "important",
        verification_required: true,
        notes: "Created from missing deal inputs.",
      }));
      const { error } = await supabase.from("brix_project_tasks").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline-tasks"] }),
  });
}

function useUpdatePipelineTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("brix_project_tasks")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline-tasks"] }),
  });
}

function groupTasksByDeal(tasks: Task[]) {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.deal_id) continue;
    map.set(task.deal_id, [...(map.get(task.deal_id) ?? []), task]);
  }
  return map;
}

function openDealTasks(tasks: Task[]) {
  return tasks.filter((task) => task.status !== "complete" && task.status !== "cancelled");
}

function EmptyPipeline({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center p-8 text-center">
      <ListChecks className="h-10 w-10 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/findiq">Start in FindIQ</Link>
        </Button>
      </div>
    </div>
  );
}

function PipelineMetric({ label, value, tone }: { label: string; value: number; tone: "blue" | "green" | "amber" | "neutral" }) {
  return (
    <CardContainer className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-3xl font-bold",
          tone === "green" && "text-emerald-400",
          tone === "amber" && "text-amber-300",
          tone === "blue" && "text-primary",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </p>
    </CardContainer>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-border bg-background/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">{children}</span>;
}

function readinessScore(deal: Deal) {
  return dealReadinessScore(deal, { requireLocation: true, requireSource: true });
}

function missingInputs(deal: Deal) {
  return missingDealInputs(deal, { requireLocation: true, requireSource: true }).map(taskLabel);
}

function nextAction(deal: Deal) {
  return missingInputs(deal)[0] ?? PIPELINE_STAGES.find((item) => item.id === normalizeStage(deal))?.action ?? "Open the deal file and choose the next step.";
}

function normalizeStage(deal: Deal) {
  const raw = (deal.deal_status || "draft").toLowerCase().replace(/\s+/g, "_");
  return PIPELINE_STAGES.some((stage) => stage.id === raw) ? raw : "draft";
}

function stageLabel(stage: string) {
  return PIPELINE_STAGES.find((item) => item.id === stage)?.label ?? "Intake";
}

function stageBadgeClass(stage: string) {
  if (stage === "closed") return "border-emerald-500/35 bg-emerald-500/10 text-emerald-300";
  if (stage === "passed") return "border-muted bg-muted/40 text-muted-foreground";
  if (["under_contract", "offer_submitted", "negotiating"].includes(stage)) return "border-primary/40 bg-primary/10 text-primary";
  return "border-amber-500/35 bg-amber-500/10 text-amber-300";
}

function locationLine(deal: Deal) {
  const parts = [deal.city, deal.state, deal.zip_code].filter(Boolean);
  return parts.length ? parts.join(", ").replace(", ,", ",") : "Location needed";
}

function formatCurrency(value: number | null | undefined) {
  if (!positiveNumber(value)) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
}

function taskLabel(item: string) {
  switch (item) {
    case "property address": return "Add the property address.";
    case "city": return "Add the city.";
    case "state": return "Add the state.";
    case "property type": return "Select a property type.";
    case "strategy": return "Choose the primary strategy.";
    case "purchase price": return "Enter or verify purchase price.";
    case "rent support": return "Verify monthly rent support.";
    case "verified annual taxes": return "Verify annual property taxes from an official source.";
    case "annual insurance quote": return "Get an annual insurance quote.";
    case "source listing or notes": return "Attach the source listing, document, or notes.";
    default: return item;
  }
}
