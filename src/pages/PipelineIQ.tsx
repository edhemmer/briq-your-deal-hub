import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, KanbanSquare, ListTodo, Table2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";

export default function PipelineIQ() {
  return (
    <SectionContainer>
      <PageHeader
        title="PipelineIQ"
        description="Track real opportunities, next actions, owners, deadlines, and closing readiness from discovery through acquisition."
      >
        <Button variant="outline" disabled>
          <Table2 className="mr-2 h-4 w-4" />
          Table
        </Button>
        <Button disabled>
          <KanbanSquare className="mr-2 h-4 w-4" />
          Kanban
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-4">
        <PipelineMetric label="Active Opportunities" value="0" />
        <PipelineMetric label="Open Tasks" value="0" />
        <PipelineMetric label="At Risk" value="0" />
        <PipelineMetric label="Closing This Month" value="0" />
      </div>

      <CardContainer className="min-h-[420px]">
        <div className="flex min-h-[340px] flex-col items-center justify-center text-center">
          <ListTodo className="h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">No active acquisition pipeline yet</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            PipelineIQ starts when you move a property forward from FindIQ, DealIQ, or OfferIQ.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/dealiq">
              <Button>
                Review DealIQ Records
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/findiq">
              <Button variant="outline">Search Opportunities</Button>
            </Link>
          </div>
        </div>
      </CardContainer>

      <CardContainer>
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Workflow rule</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Tasks, deadlines, offer status, and closing readiness appear after you begin pursuing a property.
            </p>
          </div>
        </div>
      </CardContainer>
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
