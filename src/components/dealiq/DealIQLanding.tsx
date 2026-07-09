import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GitCompareArrows,
  Home,
  MoreHorizontal,
  Plus,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CardContainer } from "@/components/ui/card-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useDeals, useDeleteDeal } from "@/hooks/useDeals";
import { supabase } from "@/integrations/supabase/client";
import { analyzeDeal, type AnalysisResult, type DealInput } from "@/lib/dealAnalysisEngine";
import { analyzeDealIntelligence } from "@/lib/dealIntelligenceEngine";
import { evaluateDealStrategies, type StrategyFitInput, type StrategyFitResults, type StrategyScore } from "@/lib/strategyFitEngine";
import { cn } from "@/lib/utils";

type Deal = NonNullable<ReturnType<typeof useDeals>["data"]>[number];
type CaptureFinding = {
  area?: string;
  finding?: string;
  evidence?: string;
  severity?: "critical" | "important" | "informational" | string;
  confidence?: number;
  limitation?: string;
  recommended_action?: string;
};

const money = (value: number | null | undefined) =>
  value != null && Number.isFinite(Number(value))
    ? Number(value).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "Needed";

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const ratio = (value: number) => `${value.toFixed(2)}x`;
type StrategyKey = keyof StrategyFitResults;

const STRATEGY_LABELS: Record<StrategyKey, string> = {
  ownerOccupant: "Owner Occupant",
  buyAndHold: "Buy & Hold",
  brrrr: "BRRRR",
  hybridBrrrr: "Hybrid BRRRR",
  longTermRental: "Long-Term Rental",
  midTermRental: "Mid-Term Rental",
  shortTermRental: "Short-Term Rental",
  hybridRental: "Hybrid Rental",
  houseHack: "House Hack",
  fixFlip: "Fix & Flip",
  valueAdd: "Value-Add",
  appreciationHold: "Appreciation Hold",
  refinance: "Refinance",
  hold: "Hold",
  sell: "Sell",
  sellerFinance: "Seller Finance",
  subjectTo: "Subject-To",
  leaseOption: "Lease Option",
  wrapMortgage: "Wrap Mortgage",
  adu: "ADU / Value-Add",
  lotSplit: "Lot Split",
  mixedUseConversion: "Mixed-Use Conversion",
  commercialRepositioning: "Commercial Repositioning",
  development: "Development",
  exchange1031: "1031 Exchange",
};

function normalizeStrategyKey(strategy: string | null | undefined): StrategyKey {
  const normalized = (strategy ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalized.includes("owneroccup") || normalized.includes("livein") || normalized.includes("primary")) return "ownerOccupant";
  if (normalized.includes("hybridbrrrr")) return "hybridBrrrr";
  if (normalized.includes("brrrr")) return "brrrr";
  if (normalized.includes("longterm")) return "longTermRental";
  if (normalized.includes("midterm")) return "midTermRental";
  if (normalized.includes("shortterm")) return "shortTermRental";
  if (normalized.includes("hybridrental")) return "hybridRental";
  if (normalized.includes("househack")) return "houseHack";
  if (normalized.includes("flip")) return "fixFlip";
  if (normalized.includes("valueadd")) return "valueAdd";
  if (normalized.includes("appreciation")) return "appreciationHold";
  if (normalized.includes("refinance")) return "refinance";
  if (normalized === "hold") return "hold";
  if (normalized === "sell") return "sell";
  if (normalized.includes("sellerfinance")) return "sellerFinance";
  if (normalized.includes("subjectto")) return "subjectTo";
  if (normalized.includes("leaseoption")) return "leaseOption";
  if (normalized.includes("wrap")) return "wrapMortgage";
  if (normalized.includes("adu")) return "adu";
  if (normalized.includes("lotsplit")) return "lotSplit";
  if (normalized.includes("mixeduse")) return "mixedUseConversion";
  if (normalized.includes("commercial")) return "commercialRepositioning";
  if (normalized.includes("development")) return "development";
  if (normalized.includes("1031")) return "exchange1031";
  return "buyAndHold";
}

function toStrategyFitInput(input: DealInput, analysis: AnalysisResult): StrategyFitInput {
  return {
    purchasePrice: input.purchase_price,
    rehabCost: input.rehab_cost + input.rehab_contingency,
    arv: input.arv,
    projectedRent: input.monthly_rent,
    cashFlowMonthly: analysis.metrics.monthly_cashflow,
    capRate: analysis.metrics.cap_rate,
    cashOnCashReturn: analysis.metrics.cash_on_cash,
    rentTrend: null,
    priceTrend: null,
    inventoryTrend: null,
    crimeScore: null,
  };
}

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
  const activeStrategyFit = activeInput && activeAnalysis
    ? evaluateDealStrategies(toStrategyFitInput(activeInput, activeAnalysis))
    : null;
  const activeMissing = activeDeal ? missingInputs(activeDeal) : [];
  const { data: fieldEvidence } = useFieldEvidence(activeDeal?.id);
  const readyCount = liveDeals.filter((deal) => readiness(deal) >= 80).length;
  const averageReadiness = liveDeals.length
    ? Math.round(liveDeals.reduce((sum, deal) => sum + readiness(deal), 0) / liveDeals.length)
    : 0;

  return (
    <div className="space-y-4 pb-20">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-[560px] rounded-2xl" />
        </div>
      ) : liveDeals.length === 0 ? (
        <EmptyDealCockpit />
      ) : (
        <>
          <section className="ios-material rounded-2xl p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">DealIQ Cockpit</h1>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                    Work the active deal, test the numbers, compare strategies, and clear the verification items that change the decision.
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-4 xl:w-[560px]">
                <MetricTile label="Open" value={String(liveDeals.length)} />
                <MetricTile label="Ready" value={String(readyCount)} tone="good" />
                <MetricTile label="Need proof" value={String(liveDeals.length - readyCount)} tone={liveDeals.length - readyCount > 0 ? "warn" : "good"} />
                <MetricTile label="Avg" value={`${averageReadiness}/100`} tone={averageReadiness >= 80 ? "good" : "warn"} />
              </div>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px] 2xl:grid-cols-[330px_minmax(0,1fr)_360px]">
            <CardContainer className="p-0">
              <div className="flex items-center justify-between border-b border-border/70 p-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Deals</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{rankedDeals.length} active files</p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Filter deals">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <div className="border-b border-border/70 p-3">
                <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/45 p-1 text-xs font-semibold text-muted-foreground">
                  {["All", "Ready", "Verify", "Risk"].map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      className={cn("rounded-lg px-2 py-1.5 transition-colors", index === 0 ? "bg-background text-foreground shadow-sm" : "hover:text-foreground")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-[640px] divide-y divide-border/70 overflow-y-auto">
                {rankedDeals.map((deal) => (
                  <DealListItem key={deal.id} deal={deal} active={deal.id === activeDeal.id} onOpen={() => navigate(`/dealiq/${deal.id}`)} />
                ))}
              </div>
            </CardContainer>

            <CardContainer className="p-0">
              <div className="border-b border-border/70 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full">{activeDeal.property_type || "Property type needed"}</Badge>
                      <Badge variant="outline" className="rounded-full">{activeDeal.strategy_primary || "Strategy needed"}</Badge>
                      <Badge className={cn("rounded-full border", readiness(activeDeal) >= 80 ? "border-signal-positive/25 bg-signal-positive/10 text-signal-positive" : "border-signal-warning/25 bg-signal-warning/10 text-signal-warning")}>
                        {readiness(activeDeal) >= 80 ? "Mostly ready" : "Under review"}
                      </Badge>
                    </div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                      {activeDeal.property_address || activeDeal.deal_name || "Unnamed property"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[activeDeal.city, activeDeal.state, activeDeal.zip_code].filter(Boolean).join(", ") || "Location needed"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[420px]">
                    <Kpi label="Score" value={String(readiness(activeDeal))} tone={readiness(activeDeal) >= 80 ? "good" : "warn"} />
                    <Kpi label="Cash flow" value={activeAnalysis ? money(activeAnalysis.metrics.monthly_cashflow) : "Needed"} tone={activeAnalysis && activeAnalysis.metrics.monthly_cashflow >= 0 ? "good" : "warn"} />
                    <Kpi label="DSCR" value={activeAnalysis ? ratio(activeAnalysis.metrics.dscr) : "Needed"} tone={activeAnalysis && activeAnalysis.metrics.dscr >= 1.2 ? "good" : "warn"} />
                    <Kpi label="Cap rate" value={activeAnalysis ? pct(activeAnalysis.metrics.cap_rate) : "Needed"} tone={activeAnalysis && activeAnalysis.metrics.cap_rate >= 0.06 ? "good" : "warn"} />
                  </div>
                </div>
              </div>

              <div className="border-b border-border/70 px-4">
                <div className="scrollbar-hide flex gap-1 overflow-x-auto">
                  {["Underwrite", "Property", "Financials", "Strategy", "Sensitivity", "Notes", "Documents"].map((tab, index) => (
                    <button
                      key={tab}
                      type="button"
                      className={cn(
                        "relative shrink-0 px-3 py-3 text-sm font-semibold transition-colors",
                        index === 0 ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {tab}
                      {index === 0 && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 p-4 lg:grid-cols-2">
                <InstrumentPanel title="Purchase & Capital" action="Edit">
                  <ValueLine label="Purchase price" value={money(activeDeal.purchase_price)} />
                  <ValueLine label="Closing costs" value={money(activeDeal.closing_costs)} />
                  <ValueLine label="Rehab budget" value={money(activeDeal.rehab_cost)} />
                  <ValueLine label="Down payment" value={activeInput ? pct(activeInput.down_payment_percent) : "Needed"} />
                  <ValueLine label="Interest rate" value={activeInput ? pct(activeInput.interest_rate) : "Needed"} />
                </InstrumentPanel>

                <InstrumentPanel title="Income & Expenses" action="Edit">
                  <ValueLine label="Monthly rent" value={money(activeDeal.monthly_rent)} />
                  <ValueLine label="Other income" value={money(activeDeal.other_income)} />
                  <ValueLine label="Annual taxes" value={money(activeDeal.annual_property_tax ?? activeDeal.taxes)} />
                  <ValueLine label="Annual insurance" value={money(activeDeal.insurance)} />
                  <ValueLine label="Vacancy reserve" value={activeInput ? pct(activeInput.vacancy_percent) : "Needed"} />
                </InstrumentPanel>
              </div>

              <div className="px-4 pb-4">
                <StrategyInstrument
                  deal={activeDeal}
                  analysis={activeAnalysis}
                  strategyFit={activeStrategyFit}
                />
              </div>

              <div className="px-4 pb-4">
                <FieldEvidencePanel evidence={fieldEvidence ?? []} />
              </div>
            </CardContainer>

            <CardContainer className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Verification & Next Actions</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Clear the items that can change the recommendation.</p>
                </div>
                <ShieldAlert className="h-5 w-5 text-primary" />
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/45 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Checklist</span>
                  <span className="text-xs text-muted-foreground">{Math.max(0, 9 - activeMissing.length)} / 9 complete</span>
                </div>
                <Progress value={readiness(activeDeal)} className="h-2" />
                <div className="mt-4 space-y-2">
                  {activeMissing.length === 0 ? (
                    <ActionLine icon={CheckCircle2} text="Core inputs are present. Continue source review and stress testing." tone="good" />
                  ) : (
                    activeMissing.slice(0, 6).map((item) => (
                      <ActionLine key={item} icon={AlertTriangle} text={item} tone="warn" />
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/45 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Current read</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{activeIntelligence?.decision ?? "Waiting for required numbers"}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {activeIntelligence?.summary ?? "Add purchase price, rent, taxes, and insurance to generate deterministic underwriting."}
                </p>
              </div>

              <div className="space-y-2">
                <Button className="w-full justify-between" asChild>
                  <Link to={`/dealiq/${activeDeal.id}`}>
                    Open full DealIQ analysis <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button className="w-full justify-between" variant="outline" asChild>
                  <Link to="/dealiq/compare">
                    Compare active deals <GitCompareArrows className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContainer>
          </section>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-card/85 px-3 py-2 backdrop-blur-2xl xl:left-[236px] 2xl:left-[248px]">
            <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-2">
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold text-foreground">{activeDeal.property_address || "Active deal"}</p>
                <p className="text-xs text-muted-foreground">Score {readiness(activeDeal)} · {activeMissing.length} verification item{activeMissing.length === 1 ? "" : "s"}</p>
              </div>
              <div className="grid w-full grid-cols-4 gap-2 sm:w-auto sm:flex">
                <Button variant="outline" asChild>
                  <Link to="/dealiq/compare"><GitCompareArrows className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Compare</span></Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dealiq/new"><Plus className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Add</span></Link>
                </Button>
                <Button variant="outline"><Upload className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Import</span></Button>
                <Button asChild>
                  <Link to={`/dealiq/${activeDeal.id}`}><FileText className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Report</span></Link>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function useFieldEvidence(dealId: string | undefined) {
  return useQuery({
    queryKey: ["field-evidence", dealId],
    enabled: Boolean(dealId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brix_field_captures")
        .select("id,capture_type,ai_findings,confidence_score,severity,verification_recommendation,created_at")
        .eq("deal_id", dealId!)
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function MetricTile({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "good" | "warn" | "bad" | "neutral" }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-lg font-black", toneClass(tone))}>{value}</p>
    </div>
  );
}

function DealListItem({ deal, active, onOpen }: { deal: Deal; active: boolean; onOpen: () => void }) {
  const score = readiness(deal);
  const missing = missingInputs(deal).length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "block w-full p-4 text-left transition-colors hover:bg-muted/35",
        active && "bg-primary/8",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{deal.property_address || deal.deal_name || "Unnamed property"}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{[deal.city, deal.state].filter(Boolean).join(", ") || "Location needed"}</p>
        </div>
        <span className={cn("text-sm font-black", scoreColor(score))}>{score}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="rounded-full text-[10px]">{deal.strategy_primary || "Strategy needed"}</Badge>
        {missing > 0 && <Badge className="rounded-full border border-signal-warning/25 bg-signal-warning/10 text-[10px] text-signal-warning">{missing} to verify</Badge>}
      </div>
    </button>
  );
}

function InstrumentPanel({ title, action, children }: { title: string; action?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/45 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {action && <span className="text-xs font-semibold text-muted-foreground">{action}</span>}
      </div>
      {children}
    </div>
  );
}

function ValueLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/60 py-2 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function strategyTone(score: number): "good" | "warn" | "bad" {
  if (score >= 80) return "good";
  if (score >= 60) return "warn";
  return "bad";
}

function StrategyInstrument({
  deal,
  analysis,
  strategyFit,
}: {
  deal: Deal;
  analysis: AnalysisResult | null;
  strategyFit: StrategyFitResults | null;
}) {
  if (!analysis || !strategyFit) {
    return (
      <InstrumentPanel title="Strategy Fit" action="Needs numbers">
        <p className="text-sm leading-6 text-muted-foreground">Enter price, rent, taxes, insurance, and financing assumptions to compare strategy fit.</p>
      </InstrumentPanel>
    );
  }

  const selectedKey = normalizeStrategyKey(deal.strategy_primary);
  const selected = strategyFit[selectedKey];
  const ranked = (Object.entries(strategyFit) as Array<[StrategyKey, StrategyScore]>)
    .sort((a, b) => b[1].score - a[1].score);
  const alternatives = ranked.filter(([key]) => key !== selectedKey).slice(0, 4);
  const betterAlternatives = ranked.filter(([key, score]) => key !== selectedKey && score.score > selected.score).slice(0, 3);

  return (
    <InstrumentPanel title="Strategy Fit" action={`${selected.score}/100`}>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Selected strategy</p>
              <h3 className="mt-1 text-lg font-bold text-foreground">{STRATEGY_LABELS[selectedKey]}</h3>
            </div>
            <div className="text-right">
              <p className={cn("text-3xl font-black", toneClass(strategyTone(selected.score)))}>{selected.score}</p>
              <Badge variant="outline" className="rounded-full">{selected.fitLevel} fit</Badge>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{selected.explanation}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <StrategyChecklist title="What must be true" items={selected.whatMustBeTrue} />
            <StrategyChecklist title="Proof needed" items={selected.requiredInputs} />
            <StrategyChecklist title="Failure points" items={selected.failureScenarios} tone="warn" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Best fit ranking</p>
            <div className="mt-3 space-y-2">
              {ranked.slice(0, 5).map(([key, score]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-xl bg-background/55 px-3 py-2">
                  <span className="truncate text-sm font-semibold text-foreground">{STRATEGY_LABELS[key]}</span>
                  <span className={cn("text-sm font-black", toneClass(strategyTone(score.score)))}>{score.score}</span>
                </div>
              ))}
            </div>
          </div>

          {betterAlternatives.length > 0 && (
            <div className="rounded-2xl border border-primary/25 bg-primary/8 p-4">
              <p className="text-sm font-semibold text-foreground">Consider comparing</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                This property currently scores higher for {betterAlternatives.map(([key]) => STRATEGY_LABELS[key]).join(", ")}.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {alternatives.map(([key, score]) => (
          <div key={key} className="rounded-xl border border-border/70 bg-background/45 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{STRATEGY_LABELS[key]}</p>
              <span className={cn("text-sm font-black", toneClass(strategyTone(score.score)))}>{score.score}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{score.explanation}</p>
          </div>
        ))}
      </div>
    </InstrumentPanel>
  );
}

function StrategyChecklist({ title, items, tone = "neutral" }: { title: string; items: string[]; tone?: "warn" | "neutral" }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/45 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.slice(0, 4).map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground">
            <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", tone === "warn" ? "bg-signal-warning" : "bg-primary")} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FieldEvidencePanel({ evidence }: { evidence: Array<{ id: string; ai_findings: unknown; confidence_score: number | null; severity: string | null; verification_recommendation: string | null }> }) {
  const findings = evidence.flatMap((item) => {
    const raw = Array.isArray(item.ai_findings) ? item.ai_findings : [];
    return raw.map((finding) => ({ capture: item, finding: finding as CaptureFinding }));
  });

  return (
    <InstrumentPanel title="Field Evidence" action={findings.length ? `${findings.length} finding${findings.length === 1 ? "" : "s"}` : "None yet"}>
      {findings.length === 0 ? (
        <p className="text-sm leading-6 text-muted-foreground">
          Upload property photos to attach visual evidence, surface visible concerns, and keep condition notes with this deal.
        </p>
      ) : (
        <div className="space-y-2">
          {findings.slice(0, 5).map(({ capture, finding }, index) => (
            <div key={`${capture.id}-${index}`} className="rounded-xl border border-border/70 bg-background/55 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{finding.area || "Photo review"}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{finding.finding || "Visible condition requires verification."}</p>
                  {finding.evidence && (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      <span className="font-semibold text-foreground">Evidence:</span> {finding.evidence}
                    </p>
                  )}
                  {finding.limitation && (
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      <span className="font-semibold text-foreground">Limit:</span> {finding.limitation}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="shrink-0 rounded-full">
                  {finding.confidence ?? capture.confidence_score ?? "?"}%
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {finding.recommended_action || capture.verification_recommendation || "Verify during due diligence before relying on this observation."}
              </p>
            </div>
          ))}
        </div>
      )}
    </InstrumentPanel>
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
