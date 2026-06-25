import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, CheckCircle2, ListTodo, Plus } from "lucide-react";
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
        <Button variant="outline" asChild>
          <Link to="/dealiq">
            Review deals
          </Link>
        </Button>
        <Button asChild>
          <Link to="/dealiq/new">
            <Plus className="mr-2 h-4 w-4" />
            Add property
          </Link>
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
          <h2 className="mt-4 text-xl font-semibold text-foreground">No opportunities in motion</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Move a property forward after analysis, then track offer work, due diligence, deadlines, and closing readiness here.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/dealiq">
              <Button>
                Review DealIQ Records
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/findiq">
              <Button variant="outline">Search properties</Button>
            </Link>
          </div>
        </div>
      </CardContainer>

      <div className="grid gap-3 md:grid-cols-3">
        <WorkflowCard icon={ListTodo} title="Review" body="Choose the property worth pursuing." />
        <WorkflowCard icon={CalendarDays} title="Deadline" body="Add offer, inspection, financing, and closing dates." />
        <WorkflowCard icon={CheckCircle2} title="Close" body="Track conditions until the asset is ready for PortfolioIQ." />
      </div>
    </SectionContainer>
  );
}

function WorkflowCard({ icon: Icon, title, body }: { icon: typeof ListTodo; title: string; body: string }) {
  return (
    <CardContainer className="p-4">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
    </CardContainer>
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
