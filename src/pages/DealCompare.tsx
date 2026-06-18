import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  GitCompareArrows,
  ShieldAlert,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { EmptyStateContainer } from "@/components/ui/empty-state-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeals } from "@/hooks/useDeals";
import { analyzeDeal, type DealInput } from "@/lib/dealAnalysisEngine";
import { analyzeDealIntelligence } from "@/lib/dealIntelligenceEngine";
import type { Tables } from "@/integrations/supabase/types";

type DealRow = Tables<"deals">;

type ComparedDeal = {
  deal: DealRow;
  input: DealInput;
  analysis: ReturnType<typeof analyzeDeal>;
  intelligence: ReturnType<typeof analyzeDealIntelligence>;
  readiness: number;
  riskScore: number;
  decisionScore: number;
  missing: string[];
};

const money = (value: number | null | undefined) =>
  value != null && Number.isFinite(Number(value))
    ? Number(value).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "-";

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const multiple = (value: number) => `${value.toFixed(2)}x`;

const requiredFields: Array<{ key: keyof DealRow; label: string }> = [
  { key: "purchase_price", label: "Purchase price" },
  { key: "monthly_rent", label: "Rent" },
  { key: "taxes", label: "Taxes" },
  { key: "insurance", label: "Insurance" },
  { key: "estimated_arv", label: "ARV" },
  { key: "strategy_primary", label: "Strategy" },
  { key: "property_type", label: "Property type" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
];

function toDealInput(deal: DealRow): DealInput {
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

function calculateReadiness(deal: DealRow) {
  const missing = requiredFields
    .filter(({ key }) => {
      const value = deal[key];
      return value == null || value === "" || value === 0;
    })
    .map((field) => field.label);

  return {
    missing,
    readiness: Math.round(((requiredFields.length - missing.length) / requiredFields.length) * 100),
  };
}

function compareDeal(deal: DealRow): ComparedDeal {
  const input = toDealInput(deal);
  const analysis = analyzeDeal(input);
  const intelligence = analyzeDealIntelligence(analysis);
  const { readiness, missing } = calculateReadiness(deal);
  const riskScore = Math.min(100, intelligence.dealKillers.length * 30 + intelligence.warnings.length * 10);
  const decisionScore = Math.round(
    intelligence.score * 0.55 + readiness * 0.25 + (100 - riskScore) * 0.2,
  );

  return { deal, input, analysis, intelligence, readiness, riskScore, decisionScore, missing };
}

function rankBadge(index: number) {
  if (index === 0) return <Badge className="bg-signal-positive/10 text-signal-positive border-signal-positive/20">Leading option</Badge>;
  if (index === 1) return <Badge variant="secondary">Second look</Badge>;
  return <Badge variant="outline">Compare</Badge>;
}

function scoreClass(score: number) {
  if (score >= 80) return "text-signal-positive";
  if (score >= 65) return "text-primary";
  if (score >= 50) return "text-signal-warning";
  return "text-signal-risk";
}

export default function DealCompare() {
  const navigate = useNavigate();
  const { data: deals, isLoading } = useDeals();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const comparedDeals = useMemo(() => {
    const rows = (deals ?? []).map(compareDeal);
    const activeIds = selectedIds.length > 0 ? selectedIds : rows.slice(0, 4).map((item) => item.deal.id);
    return rows
      .filter((item) => activeIds.includes(item.deal.id))
      .sort((a, b) => b.decisionScore - a.decisionScore);
  }, [deals, selectedIds]);

  const allCompared = useMemo(() => (deals ?? []).map(compareDeal), [deals]);
  const leader = comparedDeals[0];

  const toggleDeal = (dealId: string) => {
    setSelectedIds((current) => {
      const base = current.length > 0 ? current : (deals ?? []).slice(0, 4).map((deal) => deal.id);
      return base.includes(dealId) ? base.filter((id) => id !== dealId) : [...base, dealId];
    });
  };

  return (
    <SectionContainer>
      <PageHeader
        title="Deal Comparison"
        description="Compare opportunities side by side by decision score, downside risk, capital required, and missing verification."
      >
        <div className="flex gap-2">
          <Link to="/dealiq/new">
            <Button>
              New Deal
            </Button>
          </Link>
          <Link to="/dealiq">
            <Button variant="outline">
              Deal List
            </Button>
          </Link>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : !deals || deals.length < 2 ? (
        <CardContainer className="p-8">
          <EmptyStateContainer
            icon={<GitCompareArrows className="h-10 w-10" />}
            title="Add at least two deals"
            description="BRIX needs multiple opportunities before it can compare tradeoffs and opportunity cost."
          />
          <div className="mt-4 flex justify-center">
            <Link to="/dealiq/new">
              <Button>New Deal</Button>
            </Link>
          </div>
        </CardContainer>
      ) : (
        <div className="space-y-5">
          <CardContainer className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Current read</p>
                <h2 className="mt-1 text-2xl font-bold text-foreground">
                  {leader ? `${leader.deal.property_address} is leading, pending verification.` : "Select deals to compare."}
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  BRIX ranks the selected deals using a blended decision score: 55% deal quality, 25% data readiness, and 20% downside risk. Missing data reduces confidence.
                </p>
              </div>
              {leader && (
                <div className="grid min-w-[260px] grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Decision</p>
                    <p className={`text-xl font-bold ${scoreClass(leader.decisionScore)}`}>{leader.decisionScore}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Readiness</p>
                    <p className={`text-xl font-bold ${scoreClass(leader.readiness)}`}>{leader.readiness}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Risk</p>
                    <p className={`text-xl font-bold ${scoreClass(100 - leader.riskScore)}`}>{leader.riskScore}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContainer>

          <CardContainer className="p-4">
            <div className="flex flex-wrap gap-2">
              {allCompared.map((item) => {
                const active = comparedDeals.some((compared) => compared.deal.id === item.deal.id);
                return (
                  <button
                    key={item.deal.id}
                    type="button"
                    onClick={() => toggleDeal(item.deal.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      active ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="block font-medium">{item.deal.property_address}</span>
                    <span className="text-xs">{money(item.deal.purchase_price)} · Score {item.decisionScore}</span>
                  </button>
                );
              })}
            </div>
          </CardContainer>

          <div className="grid gap-4 xl:grid-cols-3">
            {comparedDeals.map((item, index) => (
              <CardContainer key={item.deal.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {rankBadge(index)}
                    <h3 className="mt-3 text-lg font-bold text-foreground">{item.deal.property_address}</h3>
                    <p className="text-sm text-muted-foreground">
                      {[item.deal.city, item.deal.state].filter(Boolean).join(", ")} · {item.deal.strategy_primary ?? "Strategy missing"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => navigate(`/dealiq/${item.deal.id}`)}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <MetricTile label="Decision" value={String(item.decisionScore)} score={item.decisionScore} />
                  <MetricTile label="Deal" value={String(item.intelligence.score)} score={item.intelligence.score} />
                  <MetricTile label="Ready" value={String(item.readiness)} score={item.readiness} />
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <CompareRow label="Price" value={money(item.input.purchase_price)} />
                  <CompareRow label="Monthly cash flow" value={money(item.analysis.metrics.monthly_cashflow)} signal={item.analysis.metrics.monthly_cashflow >= 0 ? "positive" : "risk"} />
                  <CompareRow label="Cap rate" value={pct(item.analysis.metrics.cap_rate)} />
                  <CompareRow label="DSCR" value={multiple(item.analysis.metrics.dscr)} signal={item.analysis.metrics.dscr >= 1.2 ? "positive" : "warning"} />
                  <CompareRow label="Cash on cash" value={pct(item.analysis.metrics.cash_on_cash)} />
                  <CompareRow label="Initial cash" value={money(item.analysis.metrics.initial_cash_required)} />
                  <CompareRow label="Equity created" value={money(item.analysis.refinance.equity_created)} signal={item.analysis.refinance.equity_created > 0 ? "positive" : "risk"} />
                </div>

                <div className="mt-5 rounded-lg border border-border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Target className="h-4 w-4 text-primary" />
                    Recommendation
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.intelligence.decision}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.intelligence.summary.replaceAll("â€”", "-")}</p>
                </div>

                <div className="mt-4 space-y-2">
                  <EvidenceList
                    icon={<CheckCircle2 className="h-4 w-4 text-signal-positive" />}
                    title="Supporting evidence"
                    items={item.intelligence.strengths.slice(0, 3)}
                    fallback="No major strengths detected yet."
                  />
                  <EvidenceList
                    icon={<ShieldAlert className="h-4 w-4 text-signal-warning" />}
                    title="Key risks"
                    items={[...item.intelligence.dealKillers, ...item.intelligence.warnings].slice(0, 3)}
                    fallback="No major deterministic risks detected."
                  />
                  <EvidenceList
                    icon={<BarChart3 className="h-4 w-4 text-primary" />}
                    title="Missing information"
                    items={item.missing.slice(0, 4)}
                    fallback="Core comparison fields are present."
                  />
                </div>
              </CardContainer>
            ))}
          </div>

          <CardContainer className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Deal</th>
                  <th className="pb-3 font-medium">Decision</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Cash Flow</th>
                  <th className="pb-3 font-medium">Cap Rate</th>
                  <th className="pb-3 font-medium">DSCR</th>
                  <th className="pb-3 font-medium">Cash Needed</th>
                  <th className="pb-3 font-medium">Missing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparedDeals.map((item) => (
                  <tr key={item.deal.id}>
                    <td className="py-3 pr-4 font-medium text-foreground">{item.deal.property_address}</td>
                    <td className="py-3 pr-4">
                      <span className={`font-semibold ${scoreClass(item.decisionScore)}`}>{item.decisionScore}</span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{money(item.input.purchase_price)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{money(item.analysis.metrics.monthly_cashflow)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{pct(item.analysis.metrics.cap_rate)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{multiple(item.analysis.metrics.dscr)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{money(item.analysis.metrics.initial_cash_required)}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{item.missing.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContainer>
        </div>
      )}
    </SectionContainer>
  );
}

function MetricTile({ label, value, score }: { label: string; value: string; score: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-bold ${scoreClass(score)}`}>{value}</p>
    </div>
  );
}

function CompareRow({ label, value, signal }: { label: string; value: string; signal?: "positive" | "warning" | "risk" }) {
  const color =
    signal === "positive" ? "text-signal-positive" :
    signal === "warning" ? "text-signal-warning" :
    signal === "risk" ? "text-signal-risk" :
    "text-foreground";

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function EvidenceList({
  icon,
  title,
  items,
  fallback,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
  fallback: string;
}) {
  const visibleItems = items.length > 0 ? items : [fallback];
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        {title}
      </div>
      <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
        {visibleItems.map((item) => (
          <li key={item}>{item.replaceAll("â€”", "-")}</li>
        ))}
      </ul>
    </div>
  );
}
