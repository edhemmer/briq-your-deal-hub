import { AlertTriangle, Archive, BarChart3, Building2, DollarSign, FileText, Home, RefreshCw, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  buildPortfolioSummary,
  equity,
  monthlyCashFlow,
  portfolioAssets,
  type PortfolioAsset,
} from "@/lib/portfolioIQArchitecture";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const healthClass = (score: number) => {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
};

export default function PortfolioIQ() {
  const summary = buildPortfolioSummary(portfolioAssets);
  const attentionAssets = portfolioAssets.filter((asset) => asset.healthScore < 70 || monthlyCashFlow(asset) < 0);

  return (
    <SectionContainer>
      <PageHeader
        title="PortfolioIQ"
        description="Asset intelligence after acquisition. Track value, equity, cash flow, risk exposure, refinance opportunities, and next actions."
      >
        <Button variant="outline">
          <Archive className="h-4 w-4 mr-2" />
          Document Vault
        </Button>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Quarterly Report
        </Button>
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PortfolioMetric label="Total Asset Value" value={money(summary.totalAssetValue)} />
        <PortfolioMetric label="Total Equity" value={money(summary.totalEquity)} />
        <PortfolioMetric label="Total Debt" value={money(summary.totalDebt)} />
        <PortfolioMetric label="Monthly Cash Flow" value={money(summary.monthlyCashFlow)} />
      </div>

      <CardContainer>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Building2 className="h-4 w-4" />
              Portfolio Dashboard
            </div>
            <h2 className="mt-2 text-lg font-semibold text-foreground">How is my investment performing?</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              PortfolioIQ begins when PipelineIQ marks an acquisition closed. All acquisition, underwriting, offer, and transaction history stays attached to the permanent asset record.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <MiniMetric label="Units" value={String(summary.totalUnits)} />
            <MiniMetric label="Cap" value={`${summary.averageCapRate.toFixed(1)}%`} />
            <MiniMetric label="DSCR" value={summary.averageDscr.toFixed(2)} />
            <MiniMetric label="Occ." value={`${summary.occupancy}%`} />
          </div>
        </div>
      </CardContainer>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-4">
          {portfolioAssets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>

        <div className="space-y-4">
          <CardContainer>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <BarChart3 className="h-4 w-4" />
              AI Portfolio Analyst
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <Insight title="Portfolio Summary" detail="Equity is positive and concentrated in performing long-term rental assets." />
              <Insight title="Risk Review" detail="Vacancy and deferred maintenance are the highest current portfolio risks." />
              <Insight title="Capital Allocation" detail="Prioritize lease-up before new acquisitions if cash reserves are tight." />
            </div>
          </CardContainer>

          <CardContainer>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <RefreshCw className="h-4 w-4" />
              Refinance Intelligence
            </div>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <Insight title="Watchlist" detail="Maple Ave may support refinance analysis if rates drop below 5.9%." />
              <Insight title="Debt Risk" detail="Oak Ridge DSCR is serviceable but should be monitored if expenses rise." />
            </div>
          </CardContainer>

          <CardContainer>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <AlertTriangle className="h-4 w-4" />
              Needs Attention
            </div>
            <div className="mt-4 space-y-3">
              {attentionAssets.map((asset) => (
                <div key={asset.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <h3 className="text-sm font-semibold text-foreground">{asset.address}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{asset.risks[0]}</p>
                </div>
              ))}
            </div>
          </CardContainer>
        </div>
      </div>
    </SectionContainer>
  );
}

function PortfolioMetric({ label, value }: { label: string; value: string }) {
  return (
    <CardContainer className="p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </CardContainer>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

function AssetCard({ asset }: { asset: PortfolioAsset }) {
  const cashFlow = monthlyCashFlow(asset);

  return (
    <CardContainer>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Home className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">{asset.address}</h3>
            <Badge variant="outline">{asset.status}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {asset.propertyType} · {asset.bedrooms} bed / {asset.bathrooms} bath · {asset.squareFeet.toLocaleString()} sq ft · {asset.county} County, {asset.state}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <Metric label="Current Value" value={money(asset.currentEstimatedValue)} />
            <Metric label="Loan Balance" value={money(asset.loanBalance)} />
            <Metric label="Equity" value={money(equity(asset))} />
            <Metric label="Cash Flow" value={money(cashFlow)} tone={cashFlow >= 0 ? "positive" : "negative"} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <Metric label="Cap Rate" value={`${asset.capRate.toFixed(1)}%`} />
            <Metric label="CoC" value={`${asset.cashOnCashReturn.toFixed(1)}%`} />
            <Metric label="DSCR" value={asset.dscr.toFixed(2)} />
            <Metric label="ROI" value={`${asset.roi.toFixed(1)}%`} />
            <Metric label="Occupancy" value={`${asset.occupancy}%`} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Health Score</span>
            <span className={`text-2xl font-bold ${healthClass(asset.healthScore)}`}>{asset.healthScore}</span>
          </div>
          <Progress value={asset.healthScore} className="mt-3 h-2" />
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <p><span className="font-semibold text-foreground">Risk:</span> {asset.risks[0]}</p>
            <p><span className="font-semibold text-foreground">Opportunity:</span> {asset.opportunities[0]}</p>
          </div>
        </div>
      </div>
    </CardContainer>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-semibold ${tone === "positive" ? "text-emerald-500" : tone === "negative" ? "text-red-500" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function Insight({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
