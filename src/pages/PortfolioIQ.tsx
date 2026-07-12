import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BarChart3, Building2, CircleDollarSign, Landmark, LineChart, Save, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDeals } from "@/hooks/useDeals";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

type Deal = NonNullable<ReturnType<typeof useDeals>["data"]>[number];

export default function PortfolioIQ() {
  const { user } = useAuth();
  const { data: deals = [], isLoading } = useDeals();
  const { data: snapshots = [], isLoading: snapshotsLoading } = usePortfolioSnapshots();
  const saveSnapshot = useSavePortfolioSnapshot();
  const assets = deals.filter(isPortfolioAsset);
  const metrics = buildPortfolioMetrics(assets);

  return (
    <SectionContainer>
      <PageHeader
        title="PortfolioIQ"
        description="Monitor owned assets, equity, cash flow, debt, and the deal traits that turned into real outcomes."
      >
        <Button variant="outline" asChild>
          <Link to="/pipelineiq">Review pipeline</Link>
        </Button>
        <Button
          variant="outline"
          disabled={!user || assets.length === 0 || saveSnapshot.isPending}
          onClick={() => user && saveSnapshot.mutate({ userId: user.id, assets, metrics })}
        >
          <Save className="mr-2 h-4 w-4" />
          {saveSnapshot.isPending ? "Saving" : "Save review"}
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PortfolioMetric label="Total Asset Value" value={money(metrics.totalValue)} icon={Building2} />
        <PortfolioMetric label="Estimated Equity" value={money(metrics.totalEquity)} icon={CircleDollarSign} tone="good" />
        <PortfolioMetric label="Monthly Cash Flow" value={money(metrics.monthlyCashFlow)} icon={LineChart} tone={metrics.monthlyCashFlow >= 0 ? "good" : "risk"} />
        <PortfolioMetric label="Portfolio Debt" value={money(metrics.totalDebt)} icon={Landmark} />
      </div>

      {isLoading ? (
        <CardContainer className="min-h-[360px]">
          <EmptyPortfolio title="Loading portfolio" body="BRIX is checking your closed and owned property records." />
        </CardContainer>
      ) : assets.length === 0 ? (
        <CardContainer className="min-h-[420px]">
          <EmptyPortfolio
            title="No owned assets recorded"
            body="Move a property to Closed in PipelineIQ, then PortfolioIQ will track equity, debt, income, expenses, performance, and follow-up decisions from the same deal record."
          />
        </CardContainer>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <CardContainer className="p-0">
            <div className="border-b border-border p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                Owned Assets
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Values are calculated from the saved deal file. Any missing or unverified source lowers confidence.
              </p>
            </div>
            <div className="divide-y divide-border">
              {assets.map((asset) => (
                <AssetRow key={asset.id} deal={asset} />
              ))}
            </div>
          </CardContainer>

          <CardContainer className="self-start">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Portfolio Review
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The portfolio view is source-aware. BRIX will not treat estimated value, rent, taxes, insurance, or debt as final until the underlying deal record has support.
            </p>
            <div className="mt-5 space-y-3">
              <ReviewLine label="Assets tracked" value={String(assets.length)} />
              <ReviewLine label="Average health" value={`${metrics.averageHealth}/100`} />
              <ReviewLine label="Average DSCR" value={metrics.averageDscr ? `${metrics.averageDscr.toFixed(2)}x` : "Needed"} />
            </div>
            <Button className="mt-5 w-full" asChild>
              <Link to="/dealiq/compare">
                Compare active deals
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <div className="mt-5 border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Saved reviews</p>
              <div className="mt-3 space-y-2">
                {snapshotsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading saved reviews.</p>
                ) : snapshots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved portfolio reviews yet.</p>
                ) : (
                  snapshots.slice(0, 4).map((snapshot) => (
                    <div key={snapshot.id} className="rounded-lg border border-border bg-background/50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{new Date(snapshot.snapshot_date).toLocaleDateString()}</p>
                        <span className="text-xs font-semibold text-primary">{snapshot.portfolio_score ?? 0}/100</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Equity {money(snapshot.total_equity ?? 0)} - Cash flow {money(snapshot.monthly_cash_flow ?? 0)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContainer>
        </div>
      )}
    </SectionContainer>
  );
}

function AssetRow({ deal }: { deal: Deal }) {
  const asset = analyzeAsset(deal);
  return (
    <div className="grid gap-4 p-5 lg:grid-cols-[minmax(260px,1fr)_150px_150px_150px_150px] lg:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{deal.property_address || deal.deal_name || "Unnamed asset"}</h3>
          <Badge variant="outline">{deal.strategy_primary || "Strategy needed"}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{[deal.city, deal.state, deal.zip_code].filter(Boolean).join(", ")}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {deal.property_type || "Property type needed"} - {deal.beds ?? "-"} bed - {deal.baths ?? "-"} bath
        </p>
      </div>
      <AssetMetric label="Value" value={money(asset.value)} />
      <AssetMetric label="Debt" value={money(asset.debt)} />
      <AssetMetric label="Equity" value={money(asset.equity)} tone={asset.equity >= 0 ? "good" : "risk"} />
      <AssetMetric label="Cash flow" value={money(asset.monthlyCashFlow)} tone={asset.monthlyCashFlow >= 0 ? "good" : "risk"} />
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Health</span>
          <span className={asset.health >= 75 ? "text-signal-positive" : asset.health >= 55 ? "text-signal-warning" : "text-signal-risk"}>{asset.health}</span>
        </div>
        <Progress value={asset.health} className="h-2" />
        <Button size="sm" variant="outline" className="mt-3 w-full" asChild>
          <Link to={`/dealiq/${deal.id}`}>Open asset file</Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyPortfolio({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
      <Building2 className="h-10 w-10 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/pipelineiq">Open PipelineIQ</Link>
        </Button>
      </div>
    </div>
  );
}

function PortfolioMetric({ label, value, icon: Icon, tone = "neutral" }: { label: string; value: string; icon: typeof Building2; tone?: "good" | "risk" | "neutral" }) {
  return (
    <CardContainer className="flex items-center gap-3 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${tone === "good" ? "text-signal-positive" : tone === "risk" ? "text-signal-risk" : "text-foreground"}`}>{value}</p>
      </div>
    </CardContainer>
  );
}

function AssetMetric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "good" | "risk" | "neutral" }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-bold ${tone === "good" ? "text-signal-positive" : tone === "risk" ? "text-signal-risk" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function isPortfolioAsset(deal: Deal) {
  const status = (deal.deal_status ?? "").toLowerCase().replace(/\s+/g, "_");
  return ["closed", "owned", "portfolio", "stabilized"].includes(status);
}

function analyzeAsset(deal: Deal) {
  const value = positiveNumber(deal.arv) || positiveNumber(deal.estimated_arv) || positiveNumber(deal.purchase_price);
  const debt = positiveNumber(deal.purchase_price) * (1 - positiveNumber(deal.down_payment_percent || 0.25));
  const annualIncome = positiveNumber(deal.monthly_rent) * 12 + positiveNumber(deal.other_income);
  const taxes = positiveNumber(deal.annual_property_tax ?? deal.taxes);
  const expenses =
    taxes +
    positiveNumber(deal.insurance) +
    annualIncome * positiveNumber(deal.vacancy_percent) +
    annualIncome * positiveNumber(deal.maintenance_percent) +
    annualIncome * positiveNumber(deal.management_percent) +
    annualIncome * positiveNumber(deal.capex_percent);
  const rate = positiveNumber(deal.interest_rate || 0.07) / 12;
  const payments = positiveNumber(deal.loan_term_years || 30) * 12;
  const monthlyDebt = debt > 0 && rate > 0 ? (debt * rate * Math.pow(1 + rate, payments)) / (Math.pow(1 + rate, payments) - 1) : 0;
  const monthlyCashFlow = annualIncome / 12 - expenses / 12 - monthlyDebt;
  const dscr = monthlyDebt > 0 ? (annualIncome - expenses) / (monthlyDebt * 12) : 0;
  const completeness = [
    deal.purchase_price,
    value,
    deal.monthly_rent,
    deal.annual_property_tax ?? deal.taxes,
    deal.insurance,
    deal.interest_rate,
    deal.strategy_primary,
    deal.property_type,
  ].filter(Boolean).length / 8;
  const health = Math.round(Math.max(0, Math.min(100, completeness * 55 + (monthlyCashFlow >= 0 ? 20 : 0) + (dscr >= 1.15 ? 15 : 0) + (value > debt ? 10 : 0))));
  return { value, debt, equity: value - debt, monthlyCashFlow, dscr, health };
}

function buildPortfolioMetrics(assets: Deal[]) {
  const analyzed = assets.map(analyzeAsset);
  const totalValue = analyzed.reduce((sum, asset) => sum + asset.value, 0);
  const totalDebt = analyzed.reduce((sum, asset) => sum + asset.debt, 0);
  const monthlyCashFlow = analyzed.reduce((sum, asset) => sum + asset.monthlyCashFlow, 0);
  const averageHealth = analyzed.length ? Math.round(analyzed.reduce((sum, asset) => sum + asset.health, 0) / analyzed.length) : 0;
  const dscrValues = analyzed.map((asset) => asset.dscr).filter((value) => value > 0);
  const averageDscr = dscrValues.length ? dscrValues.reduce((sum, value) => sum + value, 0) / dscrValues.length : 0;
  return {
    totalValue,
    totalDebt,
    totalEquity: totalValue - totalDebt,
    monthlyCashFlow,
    averageHealth,
    averageDscr,
  };
}

type PortfolioMetrics = ReturnType<typeof buildPortfolioMetrics>;

function usePortfolioSnapshots() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["portfolio-snapshots", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brix_portfolio_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useSavePortfolioSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, assets, metrics }: { userId: string; assets: Deal[]; metrics: PortfolioMetrics }) => {
      const analyzed = assets.map((deal) => {
        const asset = analyzeAsset(deal);
        return {
          deal_id: deal.id,
          address: deal.property_address || deal.deal_name || "Unnamed asset",
          strategy: deal.strategy_primary,
          value: asset.value,
          debt: asset.debt,
          equity: asset.equity,
          monthly_cash_flow: asset.monthlyCashFlow,
          dscr: asset.dscr,
          health: asset.health,
        };
      });
      const concentration = analyzed.reduce<Record<string, number>>((acc, item) => {
        const strategy = item.strategy || "Unspecified";
        acc[strategy] = (acc[strategy] ?? 0) + 1;
        return acc;
      }, {});
      const riskFlags = analyzed
        .filter((item) => item.health < 60 || item.monthly_cash_flow < 0)
        .map((item) => ({
          deal_id: item.deal_id,
          address: item.address,
          reason: item.monthly_cash_flow < 0 ? "Negative monthly cash flow" : "Low asset health",
        }));

      const { data, error } = await supabase
        .from("brix_portfolio_snapshots")
        .insert({
          user_id: userId,
          snapshot_date: new Date().toISOString().slice(0, 10),
          net_worth: metrics.totalEquity,
          total_debt: metrics.totalDebt,
          total_equity: metrics.totalEquity,
          monthly_cash_flow: metrics.monthlyCashFlow,
          portfolio_score: metrics.averageHealth,
          concentration_analysis: concentration as Json,
          risk_analysis: { risk_flags: riskFlags } as Json,
          capital_allocation: { assets: analyzed } as Json,
          liquidity: null,
          opportunities: {
            refinance_candidates: analyzed.filter((item) => item.dscr > 1.25 && item.equity > 50000).map((item) => item.deal_id),
            review_candidates: riskFlags.map((item) => item.deal_id),
          } as Json,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portfolio-snapshots"] });
      toast({ title: "Portfolio review saved" });
    },
    onError: (error) => {
      toast({
        title: "Could not save portfolio review",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });
}

function positiveNumber(value: number | string | null | undefined) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.round(value));
}
