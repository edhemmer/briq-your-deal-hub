import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  GitCompareArrows,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useDeals, useDeleteDeal } from "@/hooks/useDeals";
import { analyzeDeal, type DealInput } from "@/lib/dealAnalysisEngine";
import { analyzeDealIntelligence } from "@/lib/dealIntelligenceEngine";
import { cn } from "@/lib/utils";

type Deal = NonNullable<ReturnType<typeof useDeals>["data"]>[number];

const money = (value: number | null | undefined) =>
  value != null && Number.isFinite(Number(value))
    ? Number(value).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "Needed";

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const ratio = (value: number) => `${value.toFixed(2)}x`;

function toDealInput(deal: Deal): DealInput {
  return {
    purchase_price: deal.purchase_price ?? 0,
    closing_costs: deal.closing_costs ?? 0,
    rehab_cost: deal.rehab_cost ?? 0,
    rehab_contingency: deal.rehab_contingency ?? 0,
    down_payment_percent: deal.down_payment_percent ?? 0,
    interest_rate: deal.interest_rate ?? 0,
    loan_term_years: deal.loan_term_years ?? 0,
    monthly_rent: deal.monthly_rent ?? 0,
    other_income: deal.other_income ?? 0,
    taxes: deal.annual_property_tax ?? deal.taxes ?? 0,
    insurance: deal.insurance ?? 0,
    maintenance_percent: deal.maintenance_percent ?? 0,
    vacancy_percent: deal.vacancy_percent ?? 0,
    management_percent: deal.management_percent ?? 0,
    capex_percent: deal.capex_percent ?? 0,
    arv: deal.estimated_arv ?? deal.arv ?? 0,
  };
}

function readiness(deal: Deal) {
  const checks = [
    deal.property_address,
    deal.city,
    deal.state,
    positive(deal.purchase_price),
    positive(deal.monthly_rent),
    positive(deal.insurance),
    positive(deal.annual_property_tax ?? deal.taxes),
    deal.property_type,
    deal.strategy_primary,
    deal.listing_url || deal.listing_remarks || deal.property_record_url,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function missingInputs(deal: Deal) {
  const missing: string[] = [];
  if (!deal.property_address) missing.push("Property address");
  if (!deal.city || !deal.state) missing.push("City and state");
  if (!positive(deal.purchase_price)) missing.push("Purchase price");
  if (!positive(deal.monthly_rent)) missing.push("Monthly rent support");
  if (!positive(deal.insurance)) missing.push("Annual insurance quote");
  if (!positive(deal.annual_property_tax ?? deal.taxes)) missing.push("Annual property taxes");
  if (!deal.property_type) missing.push("Property type");
  if (!deal.strategy_primary) missing.push("Investment strategy");
  if (!deal.listing_url && !deal.listing_remarks && !deal.property_record_url) missing.push("Listing or source notes");
  return missing;
}

function scoreColor(score: number) {
  if (score >= 85) return "text-signal-positive";
  if (score >= 65) return "text-signal-warning";
  return "text-signal-risk";
}

export function DealIQLanding() {
  const { data: deals, isLoading } = useDeals();
  const deleteDeal = useDeleteDeal();
  const navigate = useNavigate();
  const liveDeals = deals ?? [];
  const rankedDeals = [...liveDeals].sort((a, b) => readiness(b) - readiness(a));
  const activeDeal = rankedDeals[0];
  const activeInput = activeDeal ? toDealInput(activeDeal) : null;
  const activeAnalysis = activeInput ? analyzeDeal(activeInput) : null;
  const activeIntelligence = activeAnalysis ? analyzeDealIntelligence(activeAnalysis) : null;
  const activeMissing = activeDeal ? missingInputs(activeDeal) : [];
  const readyCount = liveDeals.filter((deal) => readiness(deal) >= 80).length;

  return (
    <SectionContainer>
      <PageHeader
        title="DealIQ"
        description="Underwrite active property files, verify assumptions, compare strategies, and move only defensible deals forward."
      >
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/dealiq/compare">
              <GitCompareArrows className="mr-2 h-4 w-4" />
              Compare
            </Link>
          </Button>
          <Link to="/dealiq/new">
            <PrimaryButton>
              <Plus className="mr-2 h-4 w-4" />
              Add deal
            </PrimaryButton>
          </Link>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      ) : liveDeals.length === 0 ? (
        <EmptyDealCockpit />
      ) : (
        <div className="space-y-4">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
            <CardContainer className="relative overflow-hidden p-0">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
              <div className="grid gap-5 p-4 md:p-5 lg:grid-cols-[minmax(0,1fr)_250px] xl:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Active Underwriting Cockpit</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                    {activeDeal.property_address || activeDeal.deal_name || "Unnamed property"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[activeDeal.city, activeDeal.state, activeDeal.zip_code].filter(Boolean).join(", ") || "Location needed"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline">{activeDeal.property_type || "Property type needed"}</Badge>
                    <Badge variant="outline">{activeDeal.strategy_primary || "Strategy needed"}</Badge>
                    <Badge className={cn("border", readiness(activeDeal) >= 80 ? "border-signal-positive/25 bg-signal-positive/10 text-signal-positive" : "border-signal-warning/25 bg-signal-warning/10 text-signal-warning")}>
                      {readiness(activeDeal) >= 80 ? "Core file ready" : "Verification needed"}
                    </Badge>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Kpi label="Price" value={money(activeDeal.purchase_price)} />
                    <Kpi label="Rent/mo" value={money(activeDeal.monthly_rent)} />
                    <Kpi label="Cash flow/mo" value={activeAnalysis ? money(activeAnalysis.metrics.monthly_cashflow) : "Needed"} tone={activeAnalysis && activeAnalysis.metrics.monthly_cashflow >= 0 ? "good" : "warn"} />
                    <Kpi label="DSCR" value={activeAnalysis ? ratio(activeAnalysis.metrics.dscr) : "Needed"} tone={activeAnalysis && activeAnalysis.metrics.dscr >= 1.2 ? "good" : "warn"} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button asChild>
                      <Link to={`/dealiq/${activeDeal.id}`}>
                        Open full analysis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/dealiq/compare">Compare against other deals</Link>
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background/55 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Decision readiness</span>
                    <span className={cn("text-3xl font-black", scoreColor(readiness(activeDeal)))}>{readiness(activeDeal)}</span>
                  </div>
                  <Progress value={readiness(activeDeal)} className="mt-3 h-2" />
                  <div className="mt-4 rounded-md border border-border bg-card p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Current read</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{activeIntelligence?.decision ?? "Waiting for required numbers"}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {activeIntelligence?.summary ?? "Add purchase price, rent, taxes, and insurance to generate deterministic underwriting."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContainer>

            <CardContainer>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Confidence Work
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The fastest way to beat a spreadsheet is to know exactly which assumption is still weak.
              </p>
              <div className="mt-4 space-y-2">
                {activeMissing.length === 0 ? (
                  <ActionLine icon={CheckCircle2} text="Core inputs are present. Move into source review, scenario testing, and professional diligence." tone="good" />
                ) : (
                  activeMissing.slice(0, 5).map((item) => (
                    <ActionLine key={item} icon={AlertTriangle} text={`${item} needs verification.`} tone="warn" />
                  ))
                )}
              </div>
            </CardContainer>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Open files" value={liveDeals.length} />
            <Metric label="Ready files" value={readyCount} tone="good" />
            <Metric label="Need proof" value={liveDeals.length - readyCount} tone={liveDeals.length - readyCount > 0 ? "warn" : "good"} />
            <Metric label="Avg readiness" value={Math.round(liveDeals.reduce((sum, deal) => sum + readiness(deal), 0) / liveDeals.length)} suffix="/100" />
          </div>

          <CardContainer className="p-0">
            <div className="border-b border-border p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BarChart3 className="h-4 w-4 text-primary" />
                Deal Queue
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Open any file, remove bad records, or compare the strongest candidates side by side.</p>
            </div>
            <div className="divide-y divide-border">
              {rankedDeals.map((deal) => (
                <DealRow key={deal.id} deal={deal} onOpen={() => navigate(`/dealiq/${deal.id}`)} onDelete={() => deleteDeal.mutate(deal.id)} />
              ))}
            </div>
          </CardContainer>
        </div>
      )}
    </SectionContainer>
  );
}

function EmptyDealCockpit() {
  return (
    <CardContainer className="p-8">
      <div className="mx-auto max-w-2xl text-center">
        <Briefcase className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-4 text-2xl font-bold text-foreground">Build the first deal file</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Add a listing URL, spreadsheet row, screenshots, photos, or known facts. BRIX will turn it into an underwriting file with missing inputs and verification work clearly labeled.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/findiq">
            <PrimaryButton>Start in FindIQ</PrimaryButton>
          </Link>
          <Button variant="outline" asChild>
            <Link to="/dealiq/new">Add manually</Link>
          </Button>
        </div>
      </div>
    </CardContainer>
  );
}

function DealRow({ deal, onOpen, onDelete }: { deal: Deal; onOpen: () => void; onDelete: () => void }) {
  const score = readiness(deal);
  const input = toDealInput(deal);
  const analysis = analyzeDeal(input);
  const intel = analyzeDealIntelligence(analysis);
  const missing = missingInputs(deal);

  return (
    <div className="grid gap-4 p-4 md:p-5 lg:grid-cols-[minmax(0,1fr)_320px_120px] xl:grid-cols-[minmax(0,1fr)_420px_150px] lg:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-foreground">{deal.property_address || "Unnamed property"}</h3>
          <Badge variant="outline">{deal.strategy_primary ?? "Strategy needed"}</Badge>
          {missing.length > 0 && (
            <Badge className="border border-signal-warning/25 bg-signal-warning/10 text-signal-warning">
              <ShieldAlert className="mr-1 h-3 w-3" />
              {missing.length} to verify
            </Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {[deal.city, deal.state].filter(Boolean).join(", ") || "Location missing"} - {money(deal.purchase_price)} - {intel.decision}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Mini label="Ready" value={String(score)} tone={score >= 80 ? "good" : "warn"} />
        <Mini label="Cap" value={pct(analysis.metrics.cap_rate)} tone={analysis.metrics.cap_rate >= 0.06 ? "good" : "warn"} />
        <Mini label="CoC" value={pct(analysis.metrics.cash_on_cash)} tone={analysis.metrics.cash_on_cash >= 0.08 ? "good" : "warn"} />
        <Mini label="Risk" value={String(intel.dealKillers.length + intel.warnings.length)} tone={intel.dealKillers.length ? "bad" : intel.warnings.length ? "warn" : "good"} />
      </div>

      <div className="flex gap-2 lg:justify-end">
        <Button onClick={onOpen}>Open</Button>
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete deal">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "good" | "warn" | "bad" | "neutral" }) {
  return (
    <div className="rounded-lg border border-border bg-background/55 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-bold text-foreground", toneClass(tone))}>{value}</p>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "bad" | "neutral" }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-black", toneClass(tone))}>{value}</p>
    </div>
  );
}

function Metric({ label, value, tone = "neutral", suffix = "" }: { label: string; value: number; tone?: "good" | "warn" | "bad" | "neutral"; suffix?: string }) {
  return (
    <CardContainer className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-3xl font-bold", toneClass(tone))}>{value}{suffix}</p>
    </CardContainer>
  );
}

function ActionLine({ icon: Icon, text, tone }: { icon: typeof AlertTriangle; text: string; tone: "good" | "warn" }) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-background/50 p-3 text-sm">
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "good" ? "text-signal-positive" : "text-signal-warning")} />
      <span className="leading-5 text-foreground">{text}</span>
    </div>
  );
}

function toneClass(tone: "good" | "warn" | "bad" | "neutral") {
  if (tone === "good") return "text-signal-positive";
  if (tone === "warn") return "text-signal-warning";
  if (tone === "bad") return "text-signal-risk";
  return "text-foreground";
}

function positive(value: number | null | undefined) {
  return Number(value) > 0;
}
