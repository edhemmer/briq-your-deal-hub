import { useParams } from "react-router-dom";
import { useMemo, useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { EmptyStateContainer } from "@/components/ui/empty-state-container";
import { CardContainer } from "@/components/ui/card-container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BarChart3, TrendingUp, DollarSign, Percent, ShieldCheck, Lightbulb, AlertTriangle, XCircle, CheckCircle2, Gauge, Wrench, RefreshCw, FileSearch, ExternalLink } from "lucide-react";
import { useDeal, useUpdateDeal } from "@/hooks/useDeals";
import { analyzeDeal, type DealInput } from "@/lib/dealAnalysisEngine";
import { analyzeDealIntelligence } from "@/lib/dealIntelligenceEngine";
import { resolvePropertyIntelligence, openPropertyRecord } from "@/lib/property/propertyIntelligenceEngine";

const FINANCIAL_FIELDS: { key: keyof DealInput; label: string; isPercent?: boolean; group: string }[] = [
  // Acquisition
  { key: "purchase_price", label: "Purchase Price", group: "Acquisition" },
  { key: "closing_costs", label: "Closing Costs", group: "Acquisition" },
  { key: "arv", label: "After Repair Value (ARV)", group: "Acquisition" },
  // Rehab
  { key: "rehab_cost", label: "Rehab Cost", group: "Rehab" },
  { key: "rehab_contingency", label: "Rehab Contingency", group: "Rehab" },
  // Financing
  { key: "down_payment_percent", label: "Down Payment %", isPercent: true, group: "Financing" },
  { key: "interest_rate", label: "Interest Rate %", isPercent: true, group: "Financing" },
  { key: "loan_term_years", label: "Loan Term (years)", group: "Financing" },
  // Income
  { key: "monthly_rent", label: "Monthly Rent", group: "Income" },
  { key: "other_income", label: "Other Annual Income", group: "Income" },
  // Expenses
  { key: "taxes", label: "Annual Taxes", group: "Expenses" },
  { key: "insurance", label: "Annual Insurance", group: "Expenses" },
  { key: "vacancy_percent", label: "Vacancy %", isPercent: true, group: "Expenses" },
  { key: "maintenance_percent", label: "Maintenance %", isPercent: true, group: "Expenses" },
  { key: "management_percent", label: "Management %", isPercent: true, group: "Expenses" },
  { key: "capex_percent", label: "CapEx %", isPercent: true, group: "Expenses" },
];

function metricColor(value: number, thresholds: [number, number]): string {
  if (value >= thresholds[1]) return "text-green-500";
  if (value >= thresholds[0]) return "text-yellow-500";
  return "text-destructive";
}

function metricBadge(value: number, thresholds: [number, number]): "default" | "secondary" | "destructive" {
  if (value >= thresholds[1]) return "default";
  if (value >= thresholds[0]) return "secondary";
  return "destructive";
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n: number) => (n * 100).toFixed(2) + "%";
const fmtX = (n: number) => n.toFixed(2) + "x";

function scoreColor(score: number): string {
  if (score >= 85) return "text-green-500";
  if (score >= 70) return "text-primary";
  if (score >= 55) return "text-yellow-500";
  return "text-destructive";
}

function scoreBadgeVariant(label: string): "default" | "secondary" | "destructive" {
  if (label === "Excellent" || label === "Strong") return "default";
  if (label === "Borderline") return "secondary";
  return "destructive";
}

function decisionBadgeVariant(d: string): "default" | "secondary" | "destructive" {
  if (d === "Strong Buy" || d === "Worth Pursuing") return "default";
  if (d === "Needs Negotiation") return "secondary";
  return "destructive";
}

function viabilityBadgeVariant(v: string): "default" | "secondary" | "destructive" {
  if (v === "Strong") return "default";
  if (v === "Moderate") return "secondary";
  return "destructive";
}

function complexityBadgeVariant(c: string): "default" | "secondary" | "destructive" {
  if (c === "Low") return "default";
  if (c === "Moderate") return "secondary";
  return "destructive";
}

const Analysis = () => {
  const { dealId } = useParams();
  const { data: deal, isLoading } = useDeal(dealId);
  const updateDeal = useUpdateDeal();

  const [localFields, setLocalFields] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [enrichmentFields, setEnrichmentFields] = useState<Record<string, string>>({});

  // Initialize local fields from DB deal
  useEffect(() => {
    if (deal && !initialized) {
      const fields: Record<string, string> = {};
      for (const f of FINANCIAL_FIELDS) {
        const raw = (deal as any)[f.key] as number | null;
        const val = raw ?? 0;
        fields[f.key] = f.isPercent ? String(val * 100) : String(val);
      }
      setLocalFields(fields);
      setEnrichmentFields({
        assessed_value: String((deal as any).assessed_value ?? 0),
        annual_property_tax: String((deal as any).annual_property_tax ?? 0),
        year_built: String((deal as any).year_built ?? 0),
        lot_size: (deal as any).lot_size ?? "",
        zoning_type: (deal as any).zoning_type ?? "",
      });
      setInitialized(true);
    }
  }, [deal, initialized]);

  const setField = useCallback((key: string, val: string) => {
    setLocalFields(prev => ({ ...prev, [key]: val }));
  }, []);

  const setEnrichmentField = useCallback((key: string, val: string) => {
    setEnrichmentFields(prev => ({ ...prev, [key]: val }));
  }, []);

  // Build DealInput from local fields
  const dealInput: DealInput = useMemo(() => {
    const input: any = {};
    for (const f of FINANCIAL_FIELDS) {
      const raw = parseFloat(localFields[f.key] || "0") || 0;
      input[f.key] = f.isPercent ? raw / 100 : raw;
    }
    return input as DealInput;
  }, [localFields]);

  const analysis = useMemo(() => analyzeDeal(dealInput), [dealInput]);
  const intelligence = useMemo(() => analyzeDealIntelligence(analysis), [analysis]);

  const propertyIntelligence = useMemo(() => {
    if (!deal) return null;
    return resolvePropertyIntelligence(
      { property_address: deal.property_address, city: deal.city, state: deal.state, zip_code: deal.zip_code },
      {
        assessed_value: parseFloat(enrichmentFields.assessed_value || "0") || 0,
        annual_property_tax: parseFloat(enrichmentFields.annual_property_tax || "0") || 0,
        year_built: parseFloat(enrichmentFields.year_built || "0") || 0,
        lot_size: enrichmentFields.lot_size || "",
        zoning_type: enrichmentFields.zoning_type || "",
      }
    );
  }, [deal, enrichmentFields]);

  // Auto-save on blur
  const handleBlur = useCallback(() => {
    if (!dealId) return;
    const updates: Record<string, number> = {};
    for (const f of FINANCIAL_FIELDS) {
      const raw = parseFloat(localFields[f.key] || "0") || 0;
      updates[f.key] = f.isPercent ? raw / 100 : raw;
    }
    updateDeal.mutate({ id: dealId, ...updates } as any);
  }, [dealId, localFields, updateDeal]);

  const handleEnrichmentBlur = useCallback(() => {
    if (!dealId) return;
    updateDeal.mutate({
      id: dealId,
      assessed_value: parseFloat(enrichmentFields.assessed_value || "0") || 0,
      annual_property_tax: parseFloat(enrichmentFields.annual_property_tax || "0") || 0,
      year_built: parseFloat(enrichmentFields.year_built || "0") || 0,
      lot_size: enrichmentFields.lot_size || null,
      zoning_type: enrichmentFields.zoning_type || null,
      property_record_url: propertyIntelligence?.countyLookup.url ?? null,
    } as any);
  }, [dealId, enrichmentFields, propertyIntelligence, updateDeal]);

  if (!dealId) {
    return (
      <SectionContainer>
        <PageHeader title="Analysis" description="Select a deal to analyze" />
        <CardContainer>
          <EmptyStateContainer icon={<BarChart3 className="h-10 w-10" />} title="No deal selected" description="Go to Deals and select a deal to analyze." />
        </CardContainer>
      </SectionContainer>
    );
  }

  if (isLoading || !initialized) {
    return (
      <SectionContainer>
        <PageHeader title="Analysis" description="Loading deal…" />
        <div className="text-sm text-muted-foreground">Loading…</div>
      </SectionContainer>
    );
  }

  const groups = [...new Set(FINANCIAL_FIELDS.map(f => f.group))];

  return (
    <SectionContainer>
      <PageHeader
        title={deal?.property_address ?? "Analysis"}
        description={deal ? `${deal.city}, ${deal.state} ${deal.zip_code ?? ""}` : "Deal analysis"}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          icon={<Percent className="h-4 w-4" />}
          label="Cap Rate"
          value={fmtPct(analysis.metrics.cap_rate)}
          color={metricColor(analysis.metrics.cap_rate, [0.04, 0.06])}
          badge={metricBadge(analysis.metrics.cap_rate, [0.04, 0.06])}
        />
        <MetricCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Cash Flow / mo"
          value={fmt(analysis.metrics.monthly_cashflow)}
          color={metricColor(analysis.metrics.monthly_cashflow, [0, 200])}
          badge={metricBadge(analysis.metrics.monthly_cashflow, [0, 200])}
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Cash on Cash"
          value={fmtPct(analysis.metrics.cash_on_cash)}
          color={metricColor(analysis.metrics.cash_on_cash, [0.04, 0.08])}
          badge={metricBadge(analysis.metrics.cash_on_cash, [0.04, 0.08])}
        />
        <MetricCard
          icon={<ShieldCheck className="h-4 w-4" />}
          label="DSCR"
          value={fmtX(analysis.metrics.dscr)}
          color={metricColor(analysis.metrics.dscr, [1.0, 1.25])}
          badge={metricBadge(analysis.metrics.dscr, [1.0, 1.25])}
        />
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Equity Created"
          value={fmt(analysis.refinance.equity_created)}
          color={metricColor(analysis.refinance.equity_created, [0, 20000])}
          badge={metricBadge(analysis.refinance.equity_created, [0, 20000])}
        />
      </div>

      {/* Strategy Insights */}
      {analysis.strategyInsights.length > 0 && (
        <CardContainer>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <h3 className="text-sm font-semibold text-foreground">Strategy Insights</h3>
          </div>
          <div className="space-y-1">
            {analysis.strategyInsights.map((s, i) => (
              <p key={i} className="text-sm text-muted-foreground">• {s}</p>
            ))}
          </div>
        </CardContainer>
      )}

      {/* Deal Intelligence Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Gauge className="h-5 w-5" /> Deal Intelligence
        </h2>

        {/* Score + Decision + Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardContainer className="flex flex-col items-center justify-center p-6">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Deal Score</span>
            <span className={`text-5xl font-black ${scoreColor(intelligence.score)}`}>{intelligence.score}</span>
            <Badge variant={scoreBadgeVariant(intelligence.scoreLabel)} className="mt-2 text-xs">
              {intelligence.scoreLabel}
            </Badge>
          </CardContainer>
          <CardContainer className="flex flex-col items-center justify-center p-6">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Decision</span>
            <Badge variant={decisionBadgeVariant(intelligence.decision)} className="text-sm px-4 py-1.5">
              {intelligence.decision}
            </Badge>
          </CardContainer>
          <CardContainer className="flex flex-col justify-center p-6 gap-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Refinance</span>
              <Badge variant={viabilityBadgeVariant(intelligence.refinanceViability)} className="text-[10px]">{intelligence.refinanceViability}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Complexity</span>
              <Badge variant={complexityBadgeVariant(intelligence.executionComplexity)} className="text-[10px]">{intelligence.executionComplexity}</Badge>
            </div>
          </CardContainer>
        </div>

        {/* Summary */}
        <CardContainer className="p-4">
          <p className="text-sm text-muted-foreground italic">{intelligence.summary}</p>
        </CardContainer>

        {/* Deal Killers */}
        {intelligence.dealKillers.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Deal Killers</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-1 mt-1">
                {intelligence.dealKillers.map((k, i) => <li key={i}>{k}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {intelligence.warnings.length > 0 && (
          <Alert className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-1 mt-1">
                {intelligence.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Strengths */}
        {intelligence.strengths.length > 0 && (
          <Alert className="border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Strengths</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-1 mt-1">
                {intelligence.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Property Intelligence Section */}
      {propertyIntelligence && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileSearch className="h-5 w-5" /> Property Intelligence
          </h2>
          <p className="text-sm text-muted-foreground">
            Verify official county property records and enrich property insights.
          </p>

          <CardContainer className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">County Property Record</h3>
                <p className="text-xs text-muted-foreground">
                  {propertyIntelligence.countyLookup.county} County • {propertyIntelligence.countyLookup.source === "registry" ? "Direct link" : "Google search fallback"}
                </p>
              </div>
              <Button
                onClick={() => openPropertyRecord(propertyIntelligence.countyLookup.url)}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open County Property Record
              </Button>
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Property Data Enrichment</h3>
              <p className="text-xs text-muted-foreground mb-4">Optionally enter verified property details from official records.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Assessed Value</Label>
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    value={enrichmentFields.assessed_value ?? ""}
                    onChange={e => setEnrichmentField("assessed_value", e.target.value)}
                    onBlur={handleEnrichmentBlur}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Annual Property Tax</Label>
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    value={enrichmentFields.annual_property_tax ?? ""}
                    onChange={e => setEnrichmentField("annual_property_tax", e.target.value)}
                    onBlur={handleEnrichmentBlur}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Year Built</Label>
                  <Input
                    type="number"
                    className="h-8 text-sm"
                    value={enrichmentFields.year_built ?? ""}
                    onChange={e => setEnrichmentField("year_built", e.target.value)}
                    onBlur={handleEnrichmentBlur}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Lot Size</Label>
                  <Input
                    type="text"
                    className="h-8 text-sm"
                    value={enrichmentFields.lot_size ?? ""}
                    onChange={e => setEnrichmentField("lot_size", e.target.value)}
                    onBlur={handleEnrichmentBlur}
                    placeholder="e.g. 0.25 acres"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Zoning Type</Label>
                  <Input
                    type="text"
                    className="h-8 text-sm"
                    value={enrichmentFields.zoning_type ?? ""}
                    onChange={e => setEnrichmentField("zoning_type", e.target.value)}
                    onBlur={handleEnrichmentBlur}
                    placeholder="e.g. R-1, Commercial"
                  />
                </div>
              </div>
            </div>
          </CardContainer>
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(group => (
          <CardContainer key={group}>
            <h3 className="text-sm font-semibold text-foreground mb-4">{group}</h3>
            <div className="space-y-3">
              {FINANCIAL_FIELDS.filter(f => f.group === group).map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <Label className="w-40 text-xs text-muted-foreground shrink-0">{f.label}</Label>
                  <Input
                    type="number"
                    step="any"
                    className="h-8 text-sm"
                    value={localFields[f.key] ?? ""}
                    onChange={e => setField(f.key, e.target.value)}
                    onBlur={handleBlur}
                  />
                </div>
              ))}
            </div>
          </CardContainer>
        ))}
      </div>

      {/* Summary Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Income" rows={[
          ["Gross Rent", fmt(analysis.income.gross_rent)],
          ["Effective Rent", fmt(analysis.income.effective_rent)],
          ["Other Income", fmt(analysis.income.other_income)],
        ]} />
        <SummaryCard title="Expenses" rows={[
          ["Operating Expenses", fmt(analysis.expenses.operating_expenses)],
          ["Debt Service", fmt(analysis.financing.annual_debt_service)],
          ["NOI", fmt(analysis.metrics.noi)],
        ]} />
        <SummaryCard title="BRRRR / Refinance" rows={[
          ["Total Project Cost", fmt(analysis.refinance.total_project_cost)],
          ["Refinance (75% ARV)", fmt(analysis.refinance.refinance_amount)],
          ["Cash Out", fmt(analysis.refinance.cash_out)],
        ]} />
      </div>
    </SectionContainer>
  );
};

function MetricCard({ icon, label, value, color, badge }: {
  icon: React.ReactNode; label: string; value: string; color: string;
  badge: "default" | "secondary" | "destructive";
}) {
  return (
    <CardContainer className="flex flex-col items-start gap-1 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <Badge variant={badge} className="text-[10px] mt-1">
        {badge === "default" ? "Strong" : badge === "secondary" ? "Moderate" : "Weak"}
      </Badge>
    </CardContainer>
  );
}

function SummaryCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <CardContainer>
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <div className="space-y-2">
        {rows.map(([label, val]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground">{val}</span>
          </div>
        ))}
      </div>
    </CardContainer>
  );
}

export default Analysis;
