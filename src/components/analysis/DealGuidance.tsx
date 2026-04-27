/**
 * BRIX v1.7.2 — Deal Confidence & Guidance Panel
 *
 * Displays overall confidence score, guidance level,
 * reasoning bullets, and tiered uncertainties.
 */

import { Badge } from "@/components/ui/badge";
import { CardContainer } from "@/components/ui/card-container";
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react";
import type { DealGuidanceResult } from "@/lib/dealGuidanceEngine";

interface DealGuidanceProps {
  result: DealGuidanceResult;
}

const GUIDANCE_CONFIG = {
  proceed: {
    icon: CheckCircle2,
    label: "Proceed",
    badge: "default" as const,
    color: "text-signal-positive",
    bgColor: "bg-signal-positive/10",
    borderColor: "border-signal-positive/20",
    description: "Analysis supports moving forward with standard due diligence.",
  },
  proceed_with_caution: {
    icon: ShieldAlert,
    label: "Proceed with Caution",
    badge: "secondary" as const,
    color: "text-signal-warning",
    bgColor: "bg-signal-warning/10",
    borderColor: "border-signal-warning/20",
    description: "Some risk factors or data gaps require attention before committing.",
  },
  high_risk: {
    icon: XCircle,
    label: "High Risk",
    badge: "destructive" as const,
    color: "text-signal-risk",
    bgColor: "bg-signal-risk/10",
    borderColor: "border-signal-risk/20",
    description: "Significant risks or insufficient data to support a confident decision.",
  },
};

function confidenceLevelBadge(level: string): "default" | "secondary" | "destructive" {
  if (level === "high") return "default";
  if (level === "medium") return "secondary";
  return "destructive";
}

function scoreColor(score: number): string {
  if (score >= 70) return "text-signal-positive";
  if (score >= 40) return "text-signal-warning";
  return "text-signal-risk";
}

export function DealGuidance({ result }: DealGuidanceProps) {
  const config = GUIDANCE_CONFIG[result.guidance];
  const GuidanceIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* ── Primary Guidance Card ── */}
      <CardContainer className={`p-5 border ${config.borderColor}`}>
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-lg ${config.bgColor} shrink-0`}>
            <GuidanceIcon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-lg font-bold ${config.color}`}>{config.label}</span>
              <Badge variant={config.badge} className="text-[10px]">
                Confidence: {result.overallConfidenceScore}/100
              </Badge>
              <Badge variant={confidenceLevelBadge(result.overallConfidenceLevel)} className="text-[10px] capitalize">
                {result.overallConfidenceLevel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
        </div>
      </CardContainer>

      {/* ── Score Breakdown ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ScoreCard
          label="Data Completeness"
          score={result.dataCompletenessScore}
          icon={<Info className="h-3.5 w-3.5" />}
        />
        <ScoreCard
          label="Signal Confidence"
          score={result.signalConfidenceAvg}
          icon={<ShieldCheck className="h-3.5 w-3.5" />}
        />
        <ScoreCard
          label="Risk Adjusted"
          score={result.riskConfidence}
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
        />
      </div>

      {/* ── Reasoning ── */}
      {result.reasoning.length > 0 && (
        <CardContainer className="p-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Key Drivers</h4>
          <ul className="space-y-1.5">
            {result.reasoning.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-muted-foreground mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </CardContainer>
      )}

      {/* ── Critical Uncertainties ── */}
      {result.criticalUncertainties.length > 0 && (
        <CardContainer className="p-4 border border-signal-risk/20 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-signal-risk" />
            <h4 className="text-xs font-semibold text-signal-risk uppercase tracking-wide">Critical Uncertainties</h4>
          </div>
          <ul className="space-y-1.5">
            {result.criticalUncertainties.map((u, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-signal-risk">
                <span className="mt-0.5">•</span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </CardContainer>
      )}

      {/* ── Standard Uncertainties ── */}
      {result.uncertainties.length > 0 && (
        <CardContainer className="p-4 space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Open Data Gaps</h4>
          <ul className="space-y-1.5">
            {result.uncertainties.map((u, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="mt-0.5">•</span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </CardContainer>
      )}
    </div>
  );
}

// ── Score Card Sub-Component ──────────────────────────────────────────

function ScoreCard({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  return (
    <CardContainer className="p-3 flex items-center gap-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold ${scoreColor(score)}`}>{score}</p>
      </div>
      <span className="text-[10px] text-muted-foreground">/100</span>
    </CardContainer>
  );
}
