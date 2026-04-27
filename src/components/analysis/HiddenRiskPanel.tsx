/**
 * BRIX v1.7.0 — Hidden Risk Panel
 * Premium, calm, investor-grade risk signal display.
 * No alarmist tone. Source badges. Visual disclaimers.
 */

import { useState } from "react";
import { ShieldAlert, ChevronDown, ChevronUp, Eye, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardContainer } from "@/components/ui/card-container";
import type { HiddenRiskResult, HiddenRiskFlag, RiskSourceType, RiskSeverity } from "@/lib/hiddenRiskEngine";

interface HiddenRiskPanelProps {
  result: HiddenRiskResult;
}

function riskLevelDisplay(level: HiddenRiskResult["riskLevel"]): { text: string; variant: "default" | "secondary" | "destructive" } {
  switch (level) {
    case "elevated": return { text: "Elevated", variant: "destructive" };
    case "moderate": return { text: "Moderate", variant: "secondary" };
    case "low": return { text: "Low", variant: "default" };
    case "minimal": return { text: "Minimal", variant: "default" };
  }
}

function severityColor(s: RiskSeverity): string {
  switch (s) {
    case "high": return "text-signal-risk";
    case "moderate": return "text-signal-warning";
    case "low": return "text-signal-neutral";
  }
}

function severityBadge(s: RiskSeverity): "destructive" | "secondary" | "default" {
  switch (s) {
    case "high": return "destructive";
    case "moderate": return "secondary";
    case "low": return "default";
  }
}

function sourceLabel(t: RiskSourceType): string {
  switch (t) {
    case "financial": return "Financial";
    case "market": return "Market";
    case "property": return "Property";
    case "visual": return "Visual";
  }
}

function sourceColor(t: RiskSourceType): string {
  switch (t) {
    case "financial": return "bg-primary/10 text-primary border-primary/20";
    case "market": return "bg-accent/20 text-accent-foreground border-accent/30";
    case "property": return "bg-muted text-muted-foreground border-border";
    case "visual": return "bg-signal-warning/10 text-signal-warning border-signal-warning/20";
  }
}

function RiskFlagCard({ flag }: { flag: HiddenRiskFlag }) {
  return (
    <div className="border border-border rounded-lg p-3.5 space-y-2 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={severityBadge(flag.severity)} className="text-[10px] uppercase">
            {flag.severity}
          </Badge>
          <Badge variant="outline" className={`text-[10px] ${sourceColor(flag.sourceType)}`}>
            {sourceLabel(flag.sourceType)}
          </Badge>
        </div>
        {flag.sourceType === "visual" && flag.visualConfidence && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {flag.visualConfidence} conf.
          </span>
        )}
      </div>

      <div>
        <p className={`text-sm font-semibold ${severityColor(flag.severity)}`}>{flag.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
      </div>

      <p className="text-[10px] text-muted-foreground/80 italic">{flag.evidence}</p>

      {flag.sourceType === "visual" && (
        <p className="text-[10px] text-muted-foreground/60">
          Visual signal from listing photos — not a diagnosis. Inspection recommended.
        </p>
      )}
    </div>
  );
}

export function HiddenRiskPanel({ result }: HiddenRiskPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const levelDisplay = riskLevelDisplay(result.riskLevel);

  if (result.flagCount === 0) {
    return (
      <CardContainer className="p-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-signal-positive" />
          <p className="text-sm text-muted-foreground">No hidden risk signals detected based on current data.</p>
        </div>
      </CardContainer>
    );
  }

  // Group flags by source type
  const grouped: Record<RiskSourceType, HiddenRiskFlag[]> = {
    financial: [],
    market: [],
    property: [],
    visual: [],
  };
  for (const flag of result.flags) {
    grouped[flag.sourceType].push(flag);
  }
  const sourceOrder: RiskSourceType[] = ["financial", "market", "property", "visual"];
  const activeGroups = sourceOrder.filter(t => grouped[t].length > 0);

  return (
    <CardContainer className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-foreground">{result.totalRiskScore}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={levelDisplay.variant}>{levelDisplay.text} Risk</Badge>
            <span className="text-xs text-muted-foreground">{result.flagCount} signal{result.flagCount !== 1 ? "s" : ""} detected</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          {expanded ? "Collapse" : "Expand"}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">
          {activeGroups.map(sourceType => (
            <div key={sourceType} className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {sourceLabel(sourceType)} Signals
              </p>
              <div className="space-y-2">
                {grouped[sourceType].map(flag => (
                  <RiskFlagCard key={flag.id} flag={flag} />
                ))}
              </div>
            </div>
          ))}

          {/* Disclosure */}
          <div className="flex items-start gap-1.5 pt-1">
            <Info className="h-3 w-3 text-muted-foreground/50 mt-0.5 shrink-0" />
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              Risk signals are informational only. Not a substitute for professional inspection, appraisal, or due diligence.
            </p>
          </div>
        </div>
      )}
    </CardContainer>
  );
}
