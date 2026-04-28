/**
 * BRIQ v1.6.3 — Market Outlook (3–5 Year) UI Component
 * Premium, compact, investor-grade forward intelligence display.
 */

import { TrendingUp, TrendingDown, Minus, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CardContainer } from "@/components/ui/card-container";
import type { MarketOutlook as MarketOutlookType, OutlookLabel, OutlookConfidence } from "@/lib/marketOutlookEngine";

interface MarketOutlookProps {
  outlook: MarketOutlookType;
}

function labelDisplay(label: OutlookLabel): { text: string; variant: "default" | "secondary" | "destructive" } {
  switch (label) {
    case "strong_growth": return { text: "Strong Growth", variant: "default" };
    case "stable": return { text: "Stable", variant: "secondary" };
    case "declining": return { text: "Declining", variant: "destructive" };
  }
}

function confidenceBadge(c: OutlookConfidence): { text: string; className: string } {
  switch (c) {
    case "high": return { text: "High Confidence", className: "bg-signal-positive/10 text-signal-positive border-signal-positive/20" };
    case "medium": return { text: "Medium Confidence", className: "bg-signal-warning/10 text-signal-warning border-signal-warning/20" };
    case "low": return { text: "Low Confidence", className: "bg-signal-risk/10 text-signal-risk border-signal-risk/20" };
  }
}

function trendIcon(value: number | null) {
  if (value == null) return null;
  if (value > 0.5) return <TrendingUp className="h-3.5 w-3.5 text-signal-positive" />;
  if (value < -0.5) return <TrendingDown className="h-3.5 w-3.5 text-signal-risk" />;
  return <Minus className="h-3.5 w-3.5 text-signal-neutral" />;
}

function formatPct(v: number | null): string {
  if (v == null) return "—";
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function migrationLabel(trend: string | null): string {
  if (!trend) return "—";
  if (trend === "inflow") return "Net Inflow";
  if (trend === "outflow") return "Net Outflow";
  return "Stable";
}

function supplyLabel(risk: string | null): string {
  if (!risk) return "—";
  return risk.charAt(0).toUpperCase() + risk.slice(1) + " Risk";
}

export function MarketOutlook({ outlook }: MarketOutlookProps) {
  const [showSources, setShowSources] = useState(false);
  const label = labelDisplay(outlook.outlook_label);
  const conf = confidenceBadge(outlook.data_confidence);

  const signals: { label: string; value: string; icon: React.ReactNode; available: boolean }[] = [
    {
      label: "Population Trend",
      value: formatPct(outlook.population_trend_pct),
      icon: trendIcon(outlook.population_trend_pct),
      available: outlook.population_trend_pct != null,
    },
    {
      label: "Job Growth Trend",
      value: formatPct(outlook.job_growth_trend_pct),
      icon: trendIcon(outlook.job_growth_trend_pct),
      available: outlook.job_growth_trend_pct != null,
    },
    {
      label: "Rent Growth Trend",
      value: formatPct(outlook.rent_growth_trend_pct),
      icon: trendIcon(outlook.rent_growth_trend_pct),
      available: outlook.rent_growth_trend_pct != null,
    },
    {
      label: "Migration",
      value: migrationLabel(outlook.migration_trend),
      icon: outlook.migration_trend === "inflow" ? <TrendingUp className="h-3.5 w-3.5 text-signal-positive" /> :
            outlook.migration_trend === "outflow" ? <TrendingDown className="h-3.5 w-3.5 text-signal-risk" /> :
            outlook.migration_trend ? <Minus className="h-3.5 w-3.5 text-signal-neutral" /> : null,
      available: outlook.migration_trend != null,
    },
    {
      label: "Supply Pipeline",
      value: supplyLabel(outlook.supply_pipeline_risk),
      icon: null,
      available: outlook.supply_pipeline_risk != null,
    },
  ];

  const availableSignals = signals.filter(s => s.available);
  const sourceEntries = Object.entries(outlook.sources).filter(([, v]) => !!v);

  return (
    <CardContainer className="p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-foreground">{outlook.outlook_score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={label.variant}>{label.text}</Badge>
            <Badge variant="outline" className={conf.className}>{conf.text}</Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Signals Used</p>
          <p className="text-lg font-semibold text-foreground">{outlook.signals_used_count}<span className="text-muted-foreground text-xs">/5</span></p>
        </div>
      </div>

      {/* Investor guidance */}
      <p className="text-sm text-muted-foreground leading-relaxed">{outlook.investor_guidance}</p>

      {/* Signal grid */}
      {availableSignals.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableSignals.map((s) => (
            <div key={s.label} className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <div className="flex items-center gap-1.5">
                {s.icon}
                <span className="text-sm font-semibold text-foreground">{s.value}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sources (collapsed) */}
      {sourceEntries.length > 0 && (
        <div>
          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="h-3 w-3" />
            Data Sources
            {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showSources && (
            <div className="mt-1.5 space-y-0.5">
              {sourceEntries.map(([key, val]) => (
                <p key={key} className="text-[10px] text-muted-foreground">
                  <span className="capitalize">{key}</span>: {val}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </CardContainer>
  );
}
