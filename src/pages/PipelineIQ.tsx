import type { ReactNode } from "react";
import { CalendarDays, CheckCircle2, Clock, KanbanSquare, ListTodo, Table2, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  healthTone,
  pipelineStages,
  samplePipelineOpportunities,
  type PipelineOpportunity,
  type PipelineStage,
} from "@/lib/pipelineIQArchitecture";

const visibleStages: PipelineStage[] = [
  "New Opportunity",
  "Reviewing",
  "Underwriting",
  "Offer Strategy",
  "Offer Submitted",
  "Negotiating",
  "Under Contract",
  "Due Diligence",
  "Closing",
];

const healthClass = (score: number) => {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
};

export default function PipelineIQ() {
  const active = samplePipelineOpportunities.filter((item) => item.stage !== "Closed" && item.stage !== "Rejected");
  const urgentTasks = active.flatMap((item) => item.tasks.filter((task) => task.status !== "Done")).length;
  const atRisk = active.filter((item) => item.healthScore < 60).length;

  return (
    <SectionContainer>
      <PageHeader
        title="PipelineIQ"
        description="Track active opportunities, next actions, owners, deadlines, and closing readiness from discovery through acquisition."
      >
        <Button variant="outline">
          <Table2 className="h-4 w-4 mr-2" />
          Table
        </Button>
        <Button>
          <KanbanSquare className="h-4 w-4 mr-2" />
          Kanban
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-4">
        <PipelineMetric label="Active Opportunities" value={String(active.length)} />
        <PipelineMetric label="Open Tasks" value={String(urgentTasks)} />
        <PipelineMetric label="At Risk" value={String(atRisk)} />
        <PipelineMetric label="Avg Close Odds" value={`${Math.round(active.reduce((sum, item) => sum + item.probabilityToClose, 0) / active.length)}%`} />
      </div>

      <CardContainer>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <ListTodo className="h-4 w-4" />
              Acquisition Workflow
            </div>
            <h2 className="mt-2 text-lg font-semibold text-foreground">Current acquisition board</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Use PipelineIQ to keep each opportunity moving with a visible status, accountable owner, deadline, and next action.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Workflow preview</Badge>
            <Badge variant="outline">List</Badge>
            <Badge variant="outline">Table</Badge>
            <Badge variant="outline">Calendar</Badge>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto pb-2">
          <div className="grid min-w-[1180px] grid-cols-9 gap-3">
            {visibleStages.map((stage) => {
              const items = active.filter((item) => item.stage === stage);
              return (
                <div key={stage} className="rounded-lg border border-border bg-muted/20">
                  <div className="border-b border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{stage}</h3>
                      <Badge variant="outline">{items.length}</Badge>
                    </div>
                  </div>
                  <div className="space-y-3 p-3">
                    {items.map((item) => (
                      <PipelineCard key={item.id} item={item} />
                    ))}
                    {items.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                        No active opportunities
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContainer>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <CardContainer>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Clock className="h-4 w-4" />
            Attention Queue
          </div>
          <div className="mt-4 divide-y divide-border">
            {active
              .slice()
              .sort((a, b) => a.healthScore - b.healthScore)
              .map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{item.address}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.nextAction}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{item.responsibleParty}</Badge>
                      <Badge variant={item.healthScore < 60 ? "destructive" : "secondary"}>{healthTone(item.healthScore)}</Badge>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContainer>

        <CardContainer>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Users className="h-4 w-4" />
            Workflow Automation
          </div>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <CheckLine>Auto-create tasks after DealIQ analysis</CheckLine>
            <CheckLine>Notify when offers remain unanswered</CheckLine>
            <CheckLine>Remind owners before due diligence deadlines</CheckLine>
            <CheckLine>Auto-create PortfolioIQ asset after closing</CheckLine>
          </div>
        </CardContainer>
      </div>

      <div className="hidden">
        {pipelineStages.join(", ")}
      </div>
    </SectionContainer>
  );
}

function PipelineMetric({ label, value }: { label: string; value: string }) {
  return (
    <CardContainer className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </CardContainer>
  );
}

function PipelineCard({ item }: { item: PipelineOpportunity }) {
  const openTasks = item.tasks.filter((task) => task.status !== "Done");

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{item.address}</h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.city}, {item.state}</p>
        </div>
        <Badge variant="outline">{item.source}</Badge>
      </div>

      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          <span>{item.deadline}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span>{item.responsibleParty}</span>
        </div>
      </div>

      <p className="mt-3 text-xs text-foreground">{item.nextAction}</p>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Health</span>
          <span className={`font-bold ${healthClass(item.healthScore)}`}>{item.healthScore}</span>
        </div>
        <Progress value={item.healthScore} className="mt-1.5 h-2" />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{openTasks.length} open tasks</span>
        <span className="font-medium text-foreground">{item.probabilityToClose}% close odds</span>
      </div>
    </div>
  );
}

function CheckLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      <span>{children}</span>
    </div>
  );
}
