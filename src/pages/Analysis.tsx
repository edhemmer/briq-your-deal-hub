import { useParams } from "react-router-dom";
import { useMemo, useState, useEffect, useCallback } from "react";
import type { StrategySignals } from "@/lib/strategyFitEngine";
import { evaluateInputSufficiency, type InputSufficiency, buildNormalizedDealState, enrichWithMarketData, updateFinancialFields } from "@/lib/normalizedDealState";
import { deriveDealInput, deriveMarketConditions } from "@/lib/canonicalEngineLayer";
import { useCanonicalAnalysis } from "@/hooks/useCanonicalAnalysis";
import type { AnalysisContext } from "@/lib/marketProfiles";
import { isContextComplete } from "@/lib/marketProfiles";

import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { EmptyStateContainer } from "@/components/ui/empty-state-container";
import { CardContainer } from "@/components/ui/card-container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, TrendingUp, DollarSign, Percent, ShieldCheck, Lightbulb,
  AlertTriangle, XCircle, CheckCircle2, Gauge, Wrench, RefreshCw,
  FileSearch, ExternalLink, MapPin, Home, Activity, BarChart2, Users,
  ShieldAlert, Shield, ChevronDown, ChevronUp, FileText, Download,
  Target, Zap, Landmark
} from "lucide-react";
import { useDeal, useUpdateDeal } from "@/hooks/useDeals";
import type { DealInput } from "@/lib/dealAnalysisEngine";
import { resolvePropertyIntelligence, openPropertyRecord } from "@/lib/property/propertyIntelligenceEngine";
import type { MarketConditions } from "@/lib/marketIntelligenceEngine";
import { useMarketConditions, useUpsertMarketConditions } from "@/hooks/useMarketConditions";
import type { StrategyFitResults } from "@/lib/strategyFitEngine";
import type { ScenarioResult, ScenarioCategory, ResilienceLevel, StressTestResults } from "@/lib/stressTestingEngine";
import { STRESS_SCENARIOS } from "@/lib/stressTestingEngine";
import { assembleDealReport, generateInvestorPDF, generateCSVExport } from "@/lib/reportEngine";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HelpTooltip } from "@/components/help/HelpTooltip";
import { DealWorkflowIndicator } from "@/components/help/DealWorkflowIndicator";
import { METRIC_HELP, STRATEGY_HELP, MARKET_HELP, CRIME_HELP, DEAL_INPUT_HELP } from "@/components/help/helpContent";
import { AnalysisContextGate } from "@/components/analysis/AnalysisContextGate";
import { AnalysisDisclosure } from "@/components/analysis/AnalysisDisclosure";
import { ConfidenceIndicator } from "@/components/analysis/ConfidenceIndicator";
import { MARKET_TYPE_LABELS, STRATEGY_LABELS as STRATEGY_GATE_LABELS, RISK_TOLERANCE_LABELS } from "@/lib/marketProfiles";
import { GuidedPropertyRetrieval } from "@/components/analysis/GuidedPropertyRetrieval";
import { FinancingIntelligence } from "@/components/analysis/FinancingIntelligence";
import { MarketOutlook } from "@/components/analysis/MarketOutlook";
import { HiddenRiskPanel } from "@/components/analysis/HiddenRiskPanel";
import { DealGuidance } from "@/components/analysis/DealGuidance";
import type { SourceQualityInput } from "@/lib/confidenceEngine";
import type { SourceQuality } from "@/lib/propertySourceResolver";

const FINANCIAL_FIELDS: { key: keyof DealInput; label: string; isPercent?: boolean; group: string }[] = [
  { key: "purchase_price", label: "Purchase Price", group: "Acquisition" },
  { key: "closing_costs", label: "Closing Costs", group: "Acquisition" },
  { key: "arv", label: "After Repair Value (ARV)", group: "Acquisition" },
  { key: "rehab_cost", label: "Rehab Cost", group: "Rehab" },
  { key: "rehab_contingency", label: "Rehab Contingency", group: "Rehab" },
  { key: "down_payment_percent", label: "Down Payment %", isPercent: true, group: "Financing" },
  { key: "interest_rate", label: "Interest Rate %", isPercent: true, group: "Financing" },
  { key: "loan_term_years", label: "Loan Term (years)", group: "Financing" },
  { key: "monthly_rent", label: "Monthly Rent", group: "Income" },
  { key: "other_income", label: "Other Annual Income", group: "Income" },
  { key: "taxes", label: "Annual Taxes", group: "Expenses" },
  { key: "insurance", label: "Annual Insurance", group: "Expenses" },
  { key: "vacancy_percent", label: "Vacancy %", isPercent: true, group: "Expenses" },
  { key: "maintenance_percent", label: "Maintenance %", isPercent: true, group: "Expenses" },
  { key: "management_percent", label: "Management %", isPercent: true, group: "Expenses" },
  { key: "capex_percent", label: "CapEx %", isPercent: true, group: "Expenses" },
];

const MARKET_FIELD_KEYS = [
  "median_rent", "rent_growth_12mo", "rent_growth_36mo",
  "median_home_price", "price_growth_12mo", "price_growth_36mo",
  "price_per_sqft", "inventory_level", "months_of_supply",
  "days_on_market", "sale_to_list_ratio", "absorption_rate",
  "population_growth_rate", "job_growth_rate", "crime_score",
] as const;

const MARKET_FIELDS: { key: string; label: string; group: string; suffix?: string }[] = [
  { key: "median_rent", label: "Median Rent", group: "Rent Market", suffix: "/mo" },
  { key: "rent_growth_12mo", label: "Rent Growth (12mo)", group: "Rent Market", suffix: "%" },
  { key: "rent_growth_36mo", label: "Rent Growth (36mo)", group: "Rent Market", suffix: "%" },
  { key: "median_home_price", label: "Median Home Price", group: "Sales Market" },
  { key: "price_growth_12mo", label: "Price Growth (12mo)", group: "Sales Market", suffix: "%" },
  { key: "price_growth_36mo", label: "Price Growth (36mo)", group: "Sales Market", suffix: "%" },
  { key: "price_per_sqft", label: "Price per Sq Ft", group: "Sales Market" },
  { key: "inventory_level", label: "Inventory Level", group: "Inventory" },
  { key: "months_of_supply", label: "Months of Supply", group: "Inventory" },
  { key: "days_on_market", label: "Days on Market", group: "Inventory" },
  { key: "sale_to_list_ratio", label: "Sale-to-List Ratio", group: "Inventory" },
  { key: "absorption_rate", label: "Absorption Rate", group: "Inventory", suffix: "%" },
  { key: "population_growth_rate", label: "Population Growth", group: "Demand", suffix: "%" },
  { key: "job_growth_rate", label: "Job Growth", group: "Demand", suffix: "%" },
  { key: "crime_score", label: "Crime Score (0-10)", group: "Crime & Safety" },
];

// Signal color utilities using semantic tokens
function signalColor(level: "positive" | "warning" | "risk" | "neutral"): string {
  switch (level) {
    case "positive": return "text-signal-positive";
    case "warning": return "text-signal-warning";
    case "risk": return "text-signal-risk";
    default: return "text-signal-neutral";
  }
}

function metricSignalLevel(value: number, thresholds: [number, number]): "positive" | "warning" | "risk" {
  if (value >= thresholds[1]) return "positive";
  if (value >= thresholds[0]) return "warning";
  return "risk";
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
  if (score >= 85) return "text-signal-positive";
  if (score >= 70) return "text-primary";
  if (score >= 55) return "text-signal-warning";
  return "text-signal-risk";
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
  const { data: marketConditionsRow } = useMarketConditions(dealId);
  const upsertMarket = useUpsertMarketConditions();

  const [localFields, setLocalFields] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [enrichmentFields, setEnrichmentFields] = useState<Record<string, string>>({});
  const [marketFields, setMarketFields] = useState<Record<string, string>>({});
  const [analysisContext, setAnalysisContext] = useState<AnalysisContext | null>(null);
  const [sourceQualityMap, setSourceQualityMap] = useState<Record<string, SourceQuality>>({});

  const sourceQualityInput = useMemo<SourceQualityInput | null>(() => {
    if (Object.keys(sourceQualityMap).length === 0) return null;
    return { fieldSources: sourceQualityMap };
  }, [sourceQualityMap]);

  const handleAcceptDraft = useCallback((accepted: Partial<Record<string, { value: number | string; source: SourceQuality; confidence: string }>>) => {
    if (!dealId) return;
    const fieldUpdates: Record<string, number> = {};
    const enrichUpdates: Record<string, string> = {};
    const newSources: Record<string, SourceQuality> = { ...sourceQualityMap };

    for (const [key, data] of Object.entries(accepted)) {
      if (!data) continue;
      newSources[key] = data.source;

      // Map draft keys to analysis/enrichment fields
      if (key === "purchasePrice") { fieldUpdates.purchase_price = Number(data.value); setField("purchase_price", String(data.value)); }
      else if (key === "monthlyRent") { fieldUpdates.monthly_rent = Number(data.value); setField("monthly_rent", String(data.value)); }
      else if (key === "annualPropertyTax") { fieldUpdates.taxes = Number(data.value); setField("taxes", String(data.value)); }
      else if (key === "assessedValue") { enrichUpdates.assessed_value = String(data.value); setEnrichmentField("assessed_value", String(data.value)); }
      else if (key === "yearBuilt") { enrichUpdates.year_built = String(data.value); setEnrichmentField("year_built", String(data.value)); }
      else if (key === "lotSize") { enrichUpdates.lot_size = String(data.value); setEnrichmentField("lot_size", String(data.value)); }
      else if (key === "zoningType") { enrichUpdates.zoning_type = String(data.value); setEnrichmentField("zoning_type", String(data.value)); }
    }
    setSourceQualityMap(newSources);
  }, [dealId, sourceQualityMap]);

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

  useEffect(() => {
    if (marketConditionsRow) {
      const mf: Record<string, string> = {};
      for (const k of MARKET_FIELD_KEYS) {
        const val = (marketConditionsRow as any)[k];
        mf[k] = val != null ? String(val) : "";
      }
      setMarketFields(mf);
    }
  }, [marketConditionsRow]);

  const setField = useCallback((key: string, val: string) => {
    setLocalFields(prev => ({ ...prev, [key]: val }));
  }, []);

  const setEnrichmentField = useCallback((key: string, val: string) => {
    setEnrichmentFields(prev => ({ ...prev, [key]: val }));
  }, []);

  const setMarketField = useCallback((key: string, val: string) => {
    setMarketFields(prev => ({ ...prev, [key]: val }));
  }, []);

  // ── Build Canonical NormalizedDealState ──
  const normalizedState = useMemo(() => {
    if (!deal) return null;
    const baseState = buildNormalizedDealState(deal as any);
    
    // Apply local field overrides (user edits not yet persisted)
    const fieldUpdates: Record<string, number> = {};
    for (const f of FINANCIAL_FIELDS) {
      const raw = parseFloat(localFields[f.key] || "0") || 0;
      fieldUpdates[f.key] = f.isPercent ? raw / 100 : raw;
    }
    const withFields = updateFinancialFields(baseState, fieldUpdates);
    
    // Enrich with market data
    const marketRow: Record<string, number | null> = {};
    for (const k of MARKET_FIELD_KEYS) {
      if (k === "crime_score") {
        const v = parseFloat(marketFields[k] || "");
        marketRow[k] = isNaN(v) ? null : v;
      } else {
        marketRow[k] = parseFloat(marketFields[k] || "0") || 0;
      }
    }
    return enrichWithMarketData(withFields, marketRow);
  }, [deal, localFields, marketFields]);

  // ── Run Canonical Analysis Pipeline (debounced + concurrency-safe) ──
  const { output: canonicalOutput, status: analysisStatus } = useCanonicalAnalysis(normalizedState, analysisContext, sourceQualityInput);


  const dealInput = canonicalOutput?.dealInput ?? ({} as DealInput);
  const analysis = canonicalOutput?.analysis!;
  const intelligence = canonicalOutput?.intelligence!;
  const marketConditionsInput = canonicalOutput?.marketConditions ?? ({} as MarketConditions);
  const marketIntelligence = canonicalOutput?.marketIntelligence!;
  const strategyFit = canonicalOutput?.strategyFit!;
  const stressResults = canonicalOutput?.stressResults!;

  // ── Input Sufficiency Check ──
  const inputSufficiency: InputSufficiency = useMemo(() => {
    const hasAnyMarketFields = MARKET_FIELD_KEYS.some(k => {
      const v = parseFloat(marketFields[k] || "");
      return !isNaN(v) && v !== 0;
    });
    return evaluateInputSufficiency(
      {
        purchase_price: dealInput.purchase_price || null,
        monthly_rent: dealInput.monthly_rent,
        arv: dealInput.arv,
        interest_rate: dealInput.interest_rate,
        loan_term_years: dealInput.loan_term_years,
        down_payment_percent: dealInput.down_payment_percent,
        taxes: dealInput.taxes,
        insurance: dealInput.insurance,
      },
      { hasAnyMarketFields }
    );
  }, [dealInput, marketFields]);

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

  const handleMarketBlur = useCallback(() => {
    if (!dealId || !deal) return;
    const numericFields: Record<string, any> = {};
    for (const k of MARKET_FIELD_KEYS) {
      if (k === "crime_score") {
        const v = parseFloat(marketFields[k] || "");
        numericFields[k] = isNaN(v) ? null : v;
      } else {
        numericFields[k] = parseFloat(marketFields[k] || "0") || 0;
      }
    }
    // Use canonical market intelligence from the pipeline
    const mi = marketIntelligence;
    upsertMarket.mutate({
      deal_id: dealId,
      city: deal.city,
      state: deal.state,
      zipcode: deal.zip_code || undefined,
      existing_id: marketConditionsRow?.id,
      ...numericFields,
      market_strength_score: mi?.market_strength_score ?? 0,
      market_risk_score: mi?.market_risk_score ?? 0,
      demand_pressure_score: mi?.demand_pressure_score ?? 0,
      crime_risk_band: mi?.crime?.crime_risk_band ?? null,
    });
  }, [dealId, deal, marketFields, marketConditionsRow, upsertMarket, marketIntelligence]);

  // Report generation helper
  const buildReport = useCallback(() => {
    if (!deal) return null;
    return assembleDealReport(
      {
        address: deal.property_address,
        city: deal.city,
        state: deal.state,
        zipCode: deal.zip_code ?? null,
        purchasePrice: dealInput.purchase_price,
        propertyType: deal.property_type ?? null,
      },
      analysis,
      intelligence,
      strategyFit,
      marketIntelligence,
      stressResults,
    );
  }, [deal, dealInput, analysis, intelligence, strategyFit, marketIntelligence, stressResults]);

  // ── Empty / Loading States ──
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
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </SectionContainer>
    );
  }

  const groups = [...new Set(FINANCIAL_FIELDS.map(f => f.group))];

  // If context gate is not complete, show the gate UI
  if (!analysisContext) {
    return (
      <SectionContainer>
        <PageHeader
          title={deal?.property_address ?? "Analysis"}
          description={deal ? `${deal.city}, ${deal.state} ${deal.zip_code ?? ""}` : "Deal analysis"}
        />
        <DealWorkflowIndicator activeStep={2} className="mb-2" />
        <AnalysisContextGate onContextComplete={setAnalysisContext} />
        <AnalysisDisclosure className="mt-6" />
      </SectionContainer>
    );
  }

  // Derive top strategy for summary
  const strategyEntries = Object.entries(strategyFit) as [keyof StrategyFitResults, StrategyFitResults[keyof StrategyFitResults]][];
  const topStrategy = strategyEntries.reduce((best, curr) => curr[1].score > best[1].score ? curr : best, strategyEntries[0]);

  return (
    <SectionContainer>
      <PageHeader
        title={deal?.property_address ?? "Analysis"}
        description={deal ? `${deal.city}, ${deal.state} ${deal.zip_code ?? ""}` : "Deal analysis"}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              const report = buildReport();
              if (report) generateInvestorPDF(report);
            }}>
              <FileText className="h-4 w-4 mr-2" />
              Investor PDF Report
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const report = buildReport();
              if (report) generateCSVExport(report);
            }}>
              <Download className="h-4 w-4 mr-2" />
              CSV Data Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <DealWorkflowIndicator activeStep={2} className="mb-2" />

      {/* ── Analysis Context Summary ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge variant="secondary" className="text-xs">{MARKET_TYPE_LABELS[analysisContext.marketType]}</Badge>
        <Badge variant="secondary" className="text-xs">{STRATEGY_GATE_LABELS[analysisContext.strategy]}</Badge>
        <Badge variant="secondary" className="text-xs">{RISK_TOLERANCE_LABELS[analysisContext.riskTolerance]}</Badge>
        <button
          onClick={() => setAnalysisContext(null)}
          className="text-[10px] text-muted-foreground hover:text-foreground underline transition-colors ml-1"
        >
          Change
        </button>
        {canonicalOutput?.confidence && (
          <div className="ml-auto">
            <ConfidenceIndicator confidence={canonicalOutput.confidence} compact />
          </div>
        )}
      </div>
      {/* ── Input Sufficiency Warning ── */}
      {!inputSufficiency.canAnalyze && (
        <Alert className="border-signal-warning/50 text-signal-warning [&>svg]:text-signal-warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Awaiting Deal Data</AlertTitle>
          <AlertDescription>
            <p className="mb-1">Enter required financial inputs to generate analysis.</p>
            {inputSufficiency.missingFields.length > 0 && (
              <p className="text-xs">Missing: {inputSufficiency.missingFields.join(", ")}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1: DEAL INTELLIGENCE SUMMARY (Investment decision first)
          ═══════════════════════════════════════════════════════════════════ */}
      {inputSufficiency.canAnalyze ? (
      <DealIntelligenceSummary
        intelligence={intelligence}
        topStrategyLabel={STRATEGY_FIT_LABELS[topStrategy[0]]}
        marketStrength={marketIntelligence.market_strength_score}
        crimeScore={marketIntelligence.crime.crime_score}
        priceGrowth={marketConditionsInput.price_growth_12mo}
        cashFlowMonthly={analysis.metrics.monthly_cashflow}
      />
      ) : (
        <CardContainer className="p-6">
          <EmptyStateContainer
            icon={<Gauge className="h-10 w-10" />}
            title="No analysis available"
            description="Enter purchase price and monthly rent to generate deal intelligence."
          />
        </CardContainer>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1.25: DEAL CONFIDENCE & GUIDANCE
          ═══════════════════════════════════════════════════════════════════ */}
      {inputSufficiency.canAnalyze && canonicalOutput?.dealGuidance && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" /> Deal Confidence & Guidance
          </h2>
          <DealGuidance result={canonicalOutput.dealGuidance} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1.5: GUIDED PROPERTY RETRIEVAL
          ═══════════════════════════════════════════════════════════════════ */}
      {deal && (
        <GuidedPropertyRetrieval
          dealAddress={{ property_address: deal.property_address, city: deal.city, state: deal.state, zip_code: deal.zip_code }}
          onAcceptDraft={handleAcceptDraft}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2: PROPERTY OVERVIEW
          ═══════════════════════════════════════════════════════════════════ */}
      {propertyIntelligence && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-muted-foreground" /> Property Intelligence
          </h2>
          <CardContainer className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">County Property Record</h3>
                <p className="text-xs text-muted-foreground">
                  {propertyIntelligence.countyLookup.county} County • {propertyIntelligence.countyLookup.source === "registry" ? "Direct link" : "Google search fallback"}
                </p>
              </div>
              <Button onClick={() => openPropertyRecord(propertyIntelligence.countyLookup.url)} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open County Property Record
              </Button>
            </div>
            <div className="border-t border-border pt-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Property Data Enrichment</h3>
              <p className="text-xs text-muted-foreground mb-4">Optionally enter verified property details from official records.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: "assessed_value", label: "Assessed Value", type: "number", placeholder: "0" },
                  { key: "annual_property_tax", label: "Annual Property Tax", type: "number", placeholder: "0" },
                  { key: "year_built", label: "Year Built", type: "number", placeholder: "0" },
                  { key: "lot_size", label: "Lot Size", type: "text", placeholder: "e.g. 0.25 acres" },
                  { key: "zoning_type", label: "Zoning Type", type: "text", placeholder: "e.g. R-1, Commercial" },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{f.label}</Label>
                    <Input
                      type={f.type}
                      className="h-8 text-sm"
                      value={enrichmentFields[f.key] ?? ""}
                      onChange={e => setEnrichmentField(f.key, e.target.value)}
                      onBlur={handleEnrichmentBlur}
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContainer>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3: DEAL METRICS
          ═══════════════════════════════════════════════════════════════════ */}
      {inputSufficiency.canAnalyze ? (
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" /> Deal Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          <MetricCard
            icon={<Percent className="h-4 w-4" />}
            label={<span className="flex items-center gap-1">Cap Rate <HelpTooltip content={METRIC_HELP.cap_rate} /></span>}
            value={fmtPct(analysis.metrics.cap_rate)}
            level={metricSignalLevel(analysis.metrics.cap_rate, [0.04, 0.06])}
            badge={metricBadge(analysis.metrics.cap_rate, [0.04, 0.06])}
          />
          <MetricCard
            icon={<DollarSign className="h-4 w-4" />}
            label={<span className="flex items-center gap-1">Cash Flow / mo <HelpTooltip content={METRIC_HELP.monthly_cashflow} /></span>}
            value={fmt(analysis.metrics.monthly_cashflow)}
            level={metricSignalLevel(analysis.metrics.monthly_cashflow, [0, 200])}
            badge={metricBadge(analysis.metrics.monthly_cashflow, [0, 200])}
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4" />}
            label={<span className="flex items-center gap-1">Cash on Cash <HelpTooltip content={METRIC_HELP.cash_on_cash} /></span>}
            value={fmtPct(analysis.metrics.cash_on_cash)}
            level={metricSignalLevel(analysis.metrics.cash_on_cash, [0.04, 0.08])}
            badge={metricBadge(analysis.metrics.cash_on_cash, [0.04, 0.08])}
          />
          <MetricCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label={<span className="flex items-center gap-1">DSCR <HelpTooltip content={METRIC_HELP.dscr} /></span>}
            value={fmtX(analysis.metrics.dscr)}
            level={metricSignalLevel(analysis.metrics.dscr, [1.0, 1.25])}
            badge={metricBadge(analysis.metrics.dscr, [1.0, 1.25])}
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Equity Created"
            value={fmt(analysis.refinance.equity_created)}
            level={metricSignalLevel(analysis.refinance.equity_created, [0, 20000])}
            badge={metricBadge(analysis.refinance.equity_created, [0, 20000])}
          />
        </div>

        {analysis.strategyInsights.length > 0 && (
          <CardContainer>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-signal-warning" />
              <h3 className="text-sm font-semibold text-foreground">Strategy Insights</h3>
            </div>
            <div className="space-y-1">
              {analysis.strategyInsights.map((s, i) => (
                <p key={i} className="text-sm text-muted-foreground">• {s}</p>
              ))}
            </div>
          </CardContainer>
        )}
      </div>
      ) : (
        <CardContainer className="p-6">
          <EmptyStateContainer
            icon={<BarChart3 className="h-10 w-10" />}
            title="No metrics available"
            description="Enter financial inputs to calculate deal metrics."
          />
        </CardContainer>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3.5: FINANCING INTELLIGENCE
          ═══════════════════════════════════════════════════════════════════ */}
      {inputSufficiency.canAnalyze && canonicalOutput?.financingOptions && (
        <FinancingIntelligence results={canonicalOutput.financingOptions} />
      )}
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3B: MARKET OUTLOOK (3–5 YEAR)
          ═══════════════════════════════════════════════════════════════════ */}
      {canonicalOutput?.marketOutlook && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" /> Market Outlook (3–5 Year)
          </h2>
          <MarketOutlook outlook={canonicalOutput.marketOutlook} />
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3C: HIDDEN RISK ENGINE
          ═══════════════════════════════════════════════════════════════════ */}
      {inputSufficiency.canAnalyze && canonicalOutput?.hiddenRisks && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" /> Hidden Risk Analysis
          </h2>
          <HiddenRiskPanel result={canonicalOutput.hiddenRisks} />
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4: MARKET INTELLIGENCE
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" /> Market Intelligence <HelpTooltip content={MARKET_HELP} />
        </h2>
        <p className="text-sm text-muted-foreground">
          Contextual market intelligence for {deal?.city}, {deal?.state}.
        </p>

        {inputSufficiency.hasMarketData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <ScoreCard label="Market Strength" score={marketIntelligence.market_strength_score} badgeText={marketIntelligence.strengthLabel} positive={marketIntelligence.market_strength_score >= 61} warning={marketIntelligence.market_strength_score >= 31 && marketIntelligence.market_strength_score < 61} />
          <ScoreCard label="Market Risk" score={marketIntelligence.market_risk_score} badgeText={marketIntelligence.riskLabel} positive={marketIntelligence.market_risk_score <= 39} warning={marketIntelligence.market_risk_score <= 69 && marketIntelligence.market_risk_score > 39} />
          <ScoreCard label="Demand Pressure" score={marketIntelligence.demand_pressure_score} badgeText={marketIntelligence.demand_pressure_score >= 61 ? "Strong" : marketIntelligence.demand_pressure_score >= 31 ? "Moderate" : "Weak"} positive={marketIntelligence.demand_pressure_score >= 61} warning={marketIntelligence.demand_pressure_score >= 31 && marketIntelligence.demand_pressure_score < 61} />
        </div>
        ) : (
          <CardContainer className="p-4">
            <p className="text-sm text-muted-foreground italic">No market data entered. Enter market conditions below to generate intelligence scores.</p>
          </CardContainer>
        )}

        {inputSufficiency.hasMarketData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {Object.entries(marketIntelligence.signals).map(([key, signal]: [string, any]) => (
            <CardContainer key={key} className="flex flex-col items-start gap-1 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                {key === "rent" ? <Home className="h-4 w-4" /> :
                 key === "price" ? <BarChart2 className="h-4 w-4" /> :
                 key === "supply" ? <Activity className="h-4 w-4" /> :
                 key === "liquidity" ? <TrendingUp className="h-4 w-4" /> :
                 <Users className="h-4 w-4" />}
                <span className="text-xs font-medium">{signal.label}</span>
              </div>
              <span className={`text-2xl font-black ${signal.level === "strong" ? "text-signal-positive" : signal.level === "neutral" ? "text-signal-warning" : "text-signal-risk"}`}>
                {signal.score}
              </span>
              <Badge variant={signal.level === "strong" ? "default" : signal.level === "neutral" ? "secondary" : "destructive"} className="text-[10px] mt-1">
                {signal.level === "strong" ? "Strong" : signal.level === "neutral" ? "Neutral" : "Weak"}
              </Badge>
            </CardContainer>
          ))}
        </div>
        )}

        {/* Crime & Safety Signal */}
        <CardContainer className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Crime & Safety Signal</h3>
            <HelpTooltip content={CRIME_HELP} />
          </div>
          {marketIntelligence.crime.crime_score != null ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex flex-col items-center">
                <span className={`text-4xl font-black ${
                  marketIntelligence.crime.crime_score <= 3 ? "text-signal-positive" :
                  marketIntelligence.crime.crime_score <= 6 ? "text-signal-warning" :
                  "text-signal-risk"
                }`}>
                  {marketIntelligence.crime.crime_score.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground mt-1">/ 10</span>
              </div>
              <div className="space-y-1.5">
                <Badge variant={
                  marketIntelligence.crime.crime_score <= 3 ? "default" :
                  marketIntelligence.crime.crime_score <= 6 ? "secondary" :
                  "destructive"
                } className="text-xs">
                  {marketIntelligence.crime.crime_risk_band}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {marketIntelligence.crime.crime_score <= 3
                    ? "Low crime area — supports stable tenancy and neighborhood value retention."
                    : marketIntelligence.crime.crime_score <= 6
                    ? "Moderate crime levels — typical for urban markets. Monitor trends."
                    : "Elevated crime risk — may impact tenant retention, insurance costs, and property values."}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Crime data unavailable for this location.</p>
          )}
        </CardContainer>

        {/* Market Insights */}
        {marketIntelligence.insights.length > 0 && (
          <div className="space-y-2">
            {marketIntelligence.insights.filter(i => i.type === "risk").length > 0 && (
              <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Market Risks</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    {marketIntelligence.insights.filter(i => i.type === "risk").map((ins, i) => <li key={i}>{ins.message}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {marketIntelligence.insights.filter(i => i.type === "caution").length > 0 && (
              <Alert className="border-signal-warning/50 text-signal-warning [&>svg]:text-signal-warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Market Cautions</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    {marketIntelligence.insights.filter(i => i.type === "caution").map((ins, i) => <li key={i}>{ins.message}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {marketIntelligence.insights.filter(i => i.type === "positive").length > 0 && (
              <Alert className="border-signal-positive/50 text-signal-positive [&>svg]:text-signal-positive">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Positive Signals</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    {marketIntelligence.insights.filter(i => i.type === "positive").map((ins, i) => <li key={i}>{ins.message}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Market Data Input Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...new Set(MARKET_FIELDS.map(f => f.group))].map(group => (
            <CardContainer key={group}>
              <h3 className="text-sm font-semibold text-foreground mb-4">{group}</h3>
              <div className="space-y-3">
                {MARKET_FIELDS.filter(f => f.group === group).map(f => (
                  <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <Label className="sm:w-44 text-xs text-muted-foreground shrink-0">
                      {f.label}{f.suffix ? ` (${f.suffix})` : ""}
                    </Label>
                    <Input
                      type="number"
                      step="any"
                      className="h-8 text-sm"
                      value={marketFields[f.key] ?? ""}
                      onChange={e => setMarketField(f.key, e.target.value)}
                      onBlur={handleMarketBlur}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </CardContainer>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5: STRATEGY FIT
          ═══════════════════════════════════════════════════════════════════ */}
      {inputSufficiency.canAnalyze ? (
        <StrategyFitSection strategyFit={strategyFit} />
      ) : (
        <CardContainer className="p-6">
          <EmptyStateContainer
            icon={<Target className="h-10 w-10" />}
            title="Strategy analysis unavailable"
            description="Enter financial inputs to evaluate strategy fit."
          />
        </CardContainer>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6: STRESS TESTING
          ═══════════════════════════════════════════════════════════════════ */}
      {inputSufficiency.canAnalyze ? (
        <StressTestingSection stressResults={stressResults} />
      ) : (
        <CardContainer className="p-6">
          <EmptyStateContainer
            icon={<Zap className="h-10 w-10" />}
            title="Stress testing unavailable"
            description="Enter financial inputs to run stress scenarios."
          />
        </CardContainer>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7: DETAILED ANALYSIS (Financial Inputs)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" /> Financial Assumptions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(group => (
            <CardContainer key={group}>
              <h3 className="text-sm font-semibold text-foreground mb-4">{group}</h3>
              <div className="space-y-3">
                {FINANCIAL_FIELDS.filter(f => f.group === group).map(f => (
                  <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <Label className="sm:w-40 text-xs text-muted-foreground shrink-0">{f.label}</Label>
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
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 8: SUMMARY BREAKDOWN
          ═══════════════════════════════════════════════════════════════════ */}
      {inputSufficiency.canAnalyze && (
      <div className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" /> Financial Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
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
      </div>
      )}

      {/* ── Confidence Assessment (full) ── */}
      {canonicalOutput?.confidence && (
        <ConfidenceIndicator confidence={canonicalOutput.confidence} />
      )}

      {/* ── Global Disclosure ── */}
      <AnalysisDisclosure className="mt-2" />
    </SectionContainer>
  );
};

// ── Deal Intelligence Summary Panel ──────────────────────────────────────

function DealIntelligenceSummary({
  intelligence,
  topStrategyLabel,
  marketStrength,
  crimeScore,
  priceGrowth,
  cashFlowMonthly,
}: {
  intelligence: import("@/lib/dealIntelligenceEngine").DealIntelligenceResult;
  topStrategyLabel: string;
  marketStrength: number;
  crimeScore: number | null;
  priceGrowth: number;
  cashFlowMonthly: number;
}) {
  const signals = [
    {
      label: "Cash Flow",
      level: cashFlowMonthly >= 200 ? "positive" as const : cashFlowMonthly >= 0 ? "warning" as const : "risk" as const,
      text: cashFlowMonthly >= 200 ? "Strong" : cashFlowMonthly >= 0 ? "Moderate" : "Negative",
    },
    {
      label: "Market Demand",
      level: marketStrength >= 61 ? "positive" as const : marketStrength >= 31 ? "warning" as const : "risk" as const,
      text: marketStrength >= 61 ? "Strong" : marketStrength >= 31 ? "Moderate" : "Weak",
    },
    {
      label: "Crime Risk",
      level: crimeScore == null ? "neutral" as const : crimeScore <= 3 ? "positive" as const : crimeScore <= 6 ? "warning" as const : "risk" as const,
      text: crimeScore == null ? "N/A" : crimeScore <= 3 ? "Low" : crimeScore <= 6 ? "Moderate" : "High",
    },
    {
      label: "Price Trend",
      level: priceGrowth >= 5 ? "positive" as const : priceGrowth >= 0 ? "warning" as const : "risk" as const,
      text: priceGrowth >= 5 ? "Strong" : priceGrowth >= 0 ? "Stable" : "Declining",
    },
  ];

  return (
    <CardContainer className="p-6 ring-1 ring-border shadow-md">
      <div className="flex items-center gap-2 mb-5">
        <Gauge className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-bold text-foreground">Deal Intelligence Summary</h2>
        <HelpTooltip content="Composite analysis combining cash flow, returns, risk factors, and market alignment into a single deal score." />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 mb-6">
        {/* Deal Score */}
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Deal Score</span>
          <span className={`text-5xl font-black leading-none ${scoreColor(intelligence.score)}`}>{intelligence.score}</span>
          <Badge variant={scoreBadgeVariant(intelligence.scoreLabel)} className="mt-2 text-xs">{intelligence.scoreLabel}</Badge>
        </div>

        {/* Classification */}
        <div className="flex flex-col items-center text-center justify-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Classification</span>
          <Badge variant={decisionBadgeVariant(intelligence.decision)} className="text-sm px-4 py-1.5">{intelligence.decision}</Badge>
        </div>

        {/* Recommended Strategy */}
        <div className="flex flex-col items-center text-center justify-center">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Strategy</span>
          <span className="text-sm font-semibold text-foreground">{topStrategyLabel}</span>
        </div>

        {/* Viability Indicators */}
        <div className="flex flex-col items-center text-center justify-center gap-2">
          <div className="flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Refinance</span>
            <Badge variant={viabilityBadgeVariant(intelligence.refinanceViability)} className="text-[10px]">{intelligence.refinanceViability}</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Complexity</span>
            <Badge variant={complexityBadgeVariant(intelligence.executionComplexity)} className="text-[10px]">{intelligence.executionComplexity}</Badge>
          </div>
        </div>
      </div>

      {/* Key Market Signals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {signals.map(s => (
          <div key={s.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
            <div className={`h-2 w-2 rounded-full ${
              s.level === "positive" ? "bg-signal-positive" :
              s.level === "warning" ? "bg-signal-warning" :
              s.level === "risk" ? "bg-signal-risk" :
              "bg-signal-neutral"
            }`} />
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground block">{s.label}</span>
              <span className={`text-xs font-semibold ${signalColor(s.level)}`}>{s.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground italic border-t border-border pt-4">{intelligence.summary}</p>

      {/* Deal Killers */}
      {intelligence.dealKillers.length > 0 && (
        <Alert variant="destructive" className="mt-4">
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
        <Alert className="mt-3 border-signal-warning/50 text-signal-warning [&>svg]:text-signal-warning">
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
        <Alert className="mt-3 border-signal-positive/50 text-signal-positive [&>svg]:text-signal-positive">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Strengths</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1 mt-1">
              {intelligence.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </CardContainer>
  );
}

// ── Metric Card (elevated typography) ──────────────────────────────────

function MetricCard({ icon, label, value, level, badge }: {
  icon: React.ReactNode; label: React.ReactNode; value: string; level: "positive" | "warning" | "risk";
  badge: "default" | "secondary" | "destructive";
}) {
  return (
    <CardContainer className="flex flex-col items-start gap-1.5 p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <span className={`text-2xl font-black tracking-tight ${signalColor(level)}`}>{value}</span>
      <Badge variant={badge} className="text-[10px] mt-0.5">
        {badge === "default" ? "Strong" : badge === "secondary" ? "Moderate" : "Weak"}
      </Badge>
    </CardContainer>
  );
}

// ── Score Card (Market scores) ──────────────────────────────────────────

function ScoreCard({ label, score, badgeText, positive, warning }: {
  label: string; score: number; badgeText: string; positive: boolean; warning: boolean;
}) {
  return (
    <CardContainer className="flex flex-col items-center justify-center p-6">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-5xl font-black leading-none ${positive ? "text-signal-positive" : warning ? "text-signal-warning" : "text-signal-risk"}`}>
        {score}
      </span>
      <Badge variant={positive ? "default" : warning ? "secondary" : "destructive"} className="mt-2 text-xs">
        {badgeText}
      </Badge>
    </CardContainer>
  );
}

// ── Summary Card ────────────────────────────────────────────────────────

function SummaryCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <CardContainer>
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <div className="space-y-2.5">
        {rows.map(([label, val]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold text-foreground tabular-nums">{val}</span>
          </div>
        ))}
      </div>
    </CardContainer>
  );
}

// ── Strategy Section ────────────────────────────────────────────────────

const STRATEGY_FIT_LABELS: Record<keyof StrategyFitResults, string> = {
  brrrr: "BRRRR",
  longTermRental: "Long Term Rental",
  midTermRental: "Mid Term Rental",
  shortTermRental: "Short Term Rental",
  fixFlip: "Fix & Flip",
  valueAdd: "Value Add",
  appreciationHold: "Appreciation Hold",
};

function StrategyFitSection({ strategyFit }: { strategyFit: StrategyFitResults }) {
  const entries = Object.entries(strategyFit) as [keyof StrategyFitResults, StrategyFitResults[keyof StrategyFitResults]][];
  const topEntry = entries.reduce((best, curr) => curr[1].score > best[1].score ? curr : best, entries[0]);
  const topScore = topEntry[1].score;
  const best = topEntry[1];
  const bestLabel = STRATEGY_FIT_LABELS[topEntry[0]];
  const [expandedSignals, setExpandedSignals] = useState<Record<string, boolean>>({});

  const toggleSignals = (key: string) => {
    setExpandedSignals(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
        <Target className="h-5 w-5 text-muted-foreground" /> Strategy Fit Analysis <HelpTooltip content={STRATEGY_HELP} />
      </h2>
      <p className="text-sm text-muted-foreground">
        Deterministic strategy scoring based on deal financials, property metrics, and market signals.
      </p>

      {topScore > 0 && (
        <CardContainer className="p-6 ring-2 ring-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold text-foreground uppercase tracking-wider">Best Strategy</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Strategy</span>
              <span className="text-sm font-semibold text-foreground">{bestLabel}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Fit Level</span>
              <Badge variant={best.fitLevel === "Strong" ? "default" : best.fitLevel === "Moderate" ? "secondary" : "destructive"} className="text-xs">{best.fitLevel}</Badge>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Confidence</span>
              <Badge variant={best.confidenceLevel === "High" ? "default" : best.confidenceLevel === "Medium" ? "secondary" : "destructive"} className="text-xs">{best.confidenceLevel}</Badge>
            </div>
            <div className="col-span-2 md:col-span-1">
              <span className="text-xs text-muted-foreground block mb-1">Score</span>
              <span className={`text-2xl font-black ${best.score >= 80 ? "text-signal-positive" : best.score >= 60 ? "text-signal-warning" : "text-signal-risk"}`}>{best.score}</span>
              <span className="text-xs text-muted-foreground ml-1">/ 100</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{best.explanation}</p>
        </CardContainer>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {entries.map(([key, strategy]) => {
          const isTop = strategy.score === topScore && topScore > 0;
          const isExpanded = !!expandedSignals[key];
          const hasSignals = strategy.signals.financial.length > 0 || strategy.signals.property.length > 0 || strategy.signals.market.length > 0;
          return (
            <CardContainer key={key} className={`p-5 flex flex-col gap-3 transition-all ${isTop ? "ring-2 ring-primary shadow-md" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{STRATEGY_FIT_LABELS[key]}</span>
                {isTop && <Badge variant="default" className="text-[10px]">Best Fit</Badge>}
              </div>
              <div className="flex items-end gap-2">
                <span className={`text-3xl font-black ${strategy.score >= 80 ? "text-signal-positive" : strategy.score >= 60 ? "text-signal-warning" : "text-signal-risk"}`}>
                  {strategy.score}
                </span>
                <span className="text-xs text-muted-foreground mb-1">/ 100</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={strategy.fitLevel === "Strong" ? "default" : strategy.fitLevel === "Moderate" ? "secondary" : "destructive"} className="text-xs">{strategy.fitLevel}</Badge>
                <Badge variant={strategy.confidenceLevel === "High" ? "default" : strategy.confidenceLevel === "Medium" ? "secondary" : "destructive"} className="text-[10px]">{strategy.confidenceLevel} Confidence</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{strategy.explanation}</p>
              {strategy.disqualifiers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border">
                  {strategy.disqualifiers.map((dq) => (
                    <span key={dq} className="inline-flex items-center gap-1 rounded-md bg-destructive/10 text-destructive px-2 py-0.5 text-[10px] font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      {dq}
                    </span>
                  ))}
                </div>
              )}
              {hasSignals && (
                <div className="pt-1 border-t border-border">
                  <button onClick={() => toggleSignals(key)} className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    View Signals
                  </button>
                  {isExpanded && (
                    <div className="mt-2 space-y-2">
                      <SignalGroup label="Financial" signals={strategy.signals.financial} />
                      <SignalGroup label="Property" signals={strategy.signals.property} />
                      <SignalGroup label="Market" signals={strategy.signals.market} />
                    </div>
                  )}
                </div>
              )}
            </CardContainer>
          );
        })}
      </div>
    </div>
  );
}

function SignalGroup({ label, signals }: { label: string; signals: string[] }) {
  if (signals.length === 0) return null;
  return (
    <div>
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1 mt-0.5">
        {signals.map((s) => (
          <span key={s} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{s}</span>
        ))}
      </div>
    </div>
  );
}

// ── Stress Testing Section ─────────────────────────────────────────────

const CATEGORY_LABELS: Record<ScenarioCategory, string> = {
  interest: "Interest Rate",
  rent: "Rent",
  vacancy: "Vacancy",
  rehab: "Rehab",
  expenses: "Expenses",
};

const CATEGORY_ORDER: ScenarioCategory[] = ["interest", "rent", "vacancy", "rehab", "expenses"];

function resilienceBadgeVariant(level: ResilienceLevel): "default" | "secondary" | "destructive" {
  if (level === "Strong") return "default";
  if (level === "Moderate") return "secondary";
  return "destructive";
}

function StressTestingSection({ stressResults }: { stressResults: StressTestResults }) {
  const [activeCategory, setActiveCategory] = useState<ScenarioCategory>("interest");

  const filteredScenarios = stressResults.scenarios.filter(
    s => s.scenario.category === activeCategory
  );

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
        <Zap className="h-5 w-5 text-muted-foreground" /> Stress Testing
      </h2>
      <p className="text-sm text-muted-foreground">
        Scenario modeling to evaluate deal resilience under adverse conditions.
      </p>

      <CardContainer className={`p-6 ${
        stressResults.resilience === "Strong" ? "ring-2 ring-signal-positive/30 bg-signal-positive/5" :
        stressResults.resilience === "Moderate" ? "ring-2 ring-signal-warning/30 bg-signal-warning/5" :
        "ring-2 ring-signal-risk/30 bg-signal-risk/5"
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Deal Resilience</span>
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-black ${
                stressResults.resilience === "Strong" ? "text-signal-positive" :
                stressResults.resilience === "Moderate" ? "text-signal-warning" :
                "text-signal-risk"
              }`}>
                {stressResults.resilience}
              </span>
              <Badge variant={resilienceBadgeVariant(stressResults.resilience)} className="text-xs">
                {stressResults.scenarios.filter(s => s.stressed.monthly_cashflow >= 0).length}/{stressResults.scenarios.length} pass
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed flex-1">{stressResults.resilienceInsight}</p>
        </div>
      </CardContainer>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_ORDER.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <CardContainer className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scenario</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cash Flow / mo</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cash Flow / yr</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">DSCR</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">CoC Return</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Break-Even Occ.</th>
            </tr>
          </thead>
          <tbody>
            {filteredScenarios.length > 0 && (
              <tr className="border-b border-border bg-muted/30">
                <td className="py-2.5 px-4 font-medium text-foreground">Baseline</td>
                <td className="py-2.5 px-4 text-right font-mono text-foreground">{fmt(filteredScenarios[0].baseline.monthly_cashflow)}</td>
                <td className="py-2.5 px-4 text-right font-mono text-foreground">{fmt(filteredScenarios[0].baseline.annual_cashflow)}</td>
                <td className="py-2.5 px-4 text-right font-mono text-foreground">{fmtX(filteredScenarios[0].baseline.dscr)}</td>
                <td className="py-2.5 px-4 text-right font-mono text-foreground">{fmtPct(filteredScenarios[0].baseline.cash_on_cash)}</td>
                <td className="py-2.5 px-4 text-right font-mono text-foreground">{fmtPct(filteredScenarios[0].baseline.break_even_occupancy)}</td>
              </tr>
            )}
            {filteredScenarios.map(sr => {
              const isNegative = sr.stressed.monthly_cashflow < 0;
              return (
                <tr key={sr.scenario.id} className={`border-b border-border ${isNegative ? "bg-destructive/5" : ""}`}>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{sr.scenario.label}</span>
                      {isNegative && <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Negative</Badge>}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{sr.scenario.description}</span>
                  </td>
                  <StressCell value={sr.stressed.monthly_cashflow} delta={sr.delta.monthly_cashflow} format="currency" />
                  <StressCell value={sr.stressed.annual_cashflow} delta={sr.delta.annual_cashflow} format="currency" />
                  <StressCell value={sr.stressed.dscr} delta={sr.delta.dscr} format="x" threshold={1.0} />
                  <StressCell value={sr.stressed.cash_on_cash} delta={sr.delta.cash_on_cash} format="percent" />
                  <StressCell value={sr.stressed.break_even_occupancy} delta={sr.delta.break_even_occupancy} format="percent" invertDelta />
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContainer>
    </div>
  );
}

function StressCell({
  value, delta, format, threshold, invertDelta
}: {
  value: number;
  delta: number;
  format: "currency" | "percent" | "x";
  threshold?: number;
  invertDelta?: boolean;
}) {
  const formatted = format === "currency" ? fmt(value) : format === "x" ? fmtX(value) : fmtPct(value);
  const deltaFormatted = format === "currency"
    ? (delta >= 0 ? "+" : "") + fmt(delta)
    : format === "x"
    ? (delta >= 0 ? "+" : "") + delta.toFixed(2) + "x"
    : (delta >= 0 ? "+" : "") + (delta * 100).toFixed(2) + "%";

  const isWorse = invertDelta ? delta > 0 : delta < 0;
  const belowThreshold = threshold != null && value < threshold;

  return (
    <td className="py-2.5 px-4 text-right">
      <span className={`font-mono text-sm ${belowThreshold ? "text-signal-risk font-semibold" : "text-foreground"}`}>
        {formatted}
      </span>
      <span className={`block text-[10px] font-mono ${isWorse ? "text-signal-risk" : "text-signal-positive"}`}>
        {deltaFormatted}
      </span>
    </td>
  );
}

export default Analysis;
