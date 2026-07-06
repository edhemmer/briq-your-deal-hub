import { Link } from "react-router-dom";
import {
  ArrowRight,
  KanbanSquare,
  ListChecks,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeals, useUpdateDeal } from "@/hooks/useDeals";
import { cn } from "@/lib/utils";

type Deal = NonNullable<ReturnType<typeof useDeals>["data"]>[number];

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
  const { data: deals = [], isLoading } = useDeals();
  const updateDeal = useUpdateDeal();

  const sortedDeals = [...deals].sort((a, b) => readinessScore(b) - readinessScore(a));
  const activeDeals = deals.filter((deal) => ACTIVE_STAGES.has(normalizeStage(deal)));
  const readyDeals = deals.filter((deal) => readinessScore(deal) >= 85);
  const blockedDeals = activeDeals.filter((deal) => missingInputs(deal).length > 0);
  const closedDeals = deals.filter((deal) => normalizeStage(deal) === "closed");
  const passedDeals = deals.filter((deal) => normalizeStage(deal) === "passed");

  function moveDeal(deal: Deal, nextStage: string) {
    updateDeal.mutate({ id: deal.id, deal_status: nextStage });
  }

  return (
    <SectionContainer>
      <PageHeader
        title="PipelineIQ"
        description="Move each property from intake to outcome with clear status, missing proof, next action, and deal history."
      >
        <Button variant="outline" asChild>
          <Link to="/findiq">Find properties</Link>
        </Button>
        <Button asChild>
          <Link to="/dealiq/new">
            <Plus className="mr-2 h-4 w-4" />
            Add deal
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-4">
        <PipelineMetric label="Active" value={activeDeals.length} tone="blue" />
        <PipelineMetric label="Ready to pursue" value={readyDeals.length} tone="green" />
        <PipelineMetric label="Needs proof" value={blockedDeals.length} tone="amber" />
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
              These are real BRIX records from your workspace. A deal stays visible until it has a win, loss, pass, or close outcome.
            </p>
          </div>

          {isLoading ? (
            <EmptyPipeline title="Loading your pipeline" body="BRIX is checking your deal workspace." />
          ) : sortedDeals.length === 0 ? (
            <EmptyPipeline
              title="No active deal files yet"
              body="Start by adding a listing URL, listing text, spreadsheet row, or property facts. BRIX will turn it into a deal record."
            />
          ) : (
            <div className="divide-y divide-border">
              {sortedDeals.map((deal) => (
                <PipelineDealRow key={deal.id} deal={deal} onStageChange={(stage) => moveDeal(deal, stage)} />
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
            {blockedDeals.length === 0 ? (
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                No active verification blockers are showing right now.
              </div>
            ) : (
              blockedDeals.slice(0, 4).map((deal) => (
                <div key={deal.id} className="rounded-lg border border-border bg-background/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{deal.property_address || deal.deal_name || "Unnamed deal"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{missingInputs(deal)[0]}</p>
                    </div>
                    <Badge variant="outline" className="border-amber-500/35 bg-amber-500/10 text-amber-300">
                      Verify
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3 w-full" asChild>
                    <Link to={`/analysis/${deal.id}`}>Open deal file</Link>
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContainer>
      </div>
    </SectionContainer>
  );
}

function PipelineDealRow({ deal, onStageChange }: { deal: Deal; onStageChange: (stage: string) => void }) {
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
        <p className="mt-2 text-xs text-muted-foreground">{gaps.length ? `${gaps.length} item${gaps.length === 1 ? "" : "s"} to verify` : "Core inputs present"}</p>
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
          <Link to={`/analysis/${deal.id}`}>DealIQ</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to="/offeriq">
            OfferIQ
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
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
        <Button variant="outline" asChild>
          <Link to="/dealiq/new">Add deal manually</Link>
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

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-border bg-background/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">{children}</span>;
}

function readinessScore(deal: Deal) {
  const checks = [
    positiveNumber(deal.purchase_price),
    positiveNumber(deal.monthly_rent),
    positiveNumber(deal.annual_property_tax ?? deal.taxes),
    positiveNumber(deal.insurance),
    Boolean(deal.property_address),
    Boolean(deal.strategy_primary),
    Boolean(deal.property_type),
    Boolean(deal.listing_url || deal.property_record_url || deal.listing_remarks),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function missingInputs(deal: Deal) {
  const missing: string[] = [];
  if (!deal.property_address) missing.push("Add the property address.");
  if (!deal.property_type) missing.push("Select a property type.");
  if (!deal.strategy_primary) missing.push("Choose the primary strategy.");
  if (!positiveNumber(deal.purchase_price)) missing.push("Enter or verify purchase price.");
  if (!positiveNumber(deal.monthly_rent)) missing.push("Verify monthly rent support.");
  if (!positiveNumber(deal.annual_property_tax ?? deal.taxes)) missing.push("Verify annual property taxes.");
  if (!positiveNumber(deal.insurance)) missing.push("Get an annual insurance quote.");
  if (!deal.listing_url && !deal.property_record_url && !deal.listing_remarks) missing.push("Attach the source listing, document, or notes.");
  return missing;
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

function positiveNumber(value: number | string | null | undefined) {
  return Number(value) > 0;
}
