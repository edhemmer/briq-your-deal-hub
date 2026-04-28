/**
 * BRIX v1.6.0 — Confidence Indicator Component
 *
 * Displays the confidence level of the analysis alongside results.
 */

import { Badge } from "@/components/ui/badge";
import { HelpTooltip } from "@/components/help/HelpTooltip";
import { ShieldCheck, ShieldAlert, AlertTriangle, XCircle } from "lucide-react";
import type { ConfidenceAssessment } from "@/lib/confidenceEngine";
import { GLOSSARY } from "@/lib/glossary";

interface ConfidenceIndicatorProps {
  confidence: ConfidenceAssessment;
  compact?: boolean;
}

export function ConfidenceIndicator({ confidence, compact }: ConfidenceIndicatorProps) {
  const config = {
    high: { icon: ShieldCheck, color: "text-signal-positive", badge: "default" as const, label: "High Confidence" },
    moderate: { icon: ShieldAlert, color: "text-signal-warning", badge: "secondary" as const, label: "Moderate Confidence" },
    low: { icon: AlertTriangle, color: "text-signal-risk", badge: "destructive" as const, label: "Low Confidence" },
    insufficient: { icon: XCircle, color: "text-muted-foreground", badge: "destructive" as const, label: "Insufficient Data" },
  }[confidence.level];

  const Icon = config.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
        <Badge variant={config.badge} className="text-[10px]">{config.label}</Badge>
        <HelpTooltip content={GLOSSARY.confidence_level?.definition ?? confidence.summary} />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-4">
      <Icon className={`h-5 w-5 ${config.color} shrink-0 mt-0.5`} />
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
          <Badge variant={config.badge} className="text-[10px]">{confidence.score}/100</Badge>
          <HelpTooltip content={GLOSSARY.confidence_level?.definition ?? ""} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{confidence.summary}</p>
        {!confidence.isActionable && (
          <p className="text-xs text-signal-risk font-medium mt-1">
            Results are preliminary. Add more data for actionable analysis.
          </p>
        )}
      </div>
    </div>
  );
}
