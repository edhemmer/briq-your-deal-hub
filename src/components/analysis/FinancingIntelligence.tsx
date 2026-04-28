/**
 * BRIX v1.6.2 — Financing Intelligence UI Component
 */

import type { FinancingResult, FinancingFitScore } from "@/lib/financingEngine";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Landmark, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n: number) => (n * 100).toFixed(1) + "%";

function fitBadgeVariant(fit: FinancingFitScore): "default" | "secondary" | "destructive" {
  if (fit === "strong") return "default";
  if (fit === "moderate") return "secondary";
  return "destructive";
}

function fitLabel(fit: FinancingFitScore): string {
  switch (fit) {
    case "strong": return "Strong Fit";
    case "moderate": return "Moderate Fit";
    case "weak": return "Weak Fit";
    case "not_recommended": return "Not Recommended";
  }
}

function ConfidenceIcon({ impact }: { impact: "increase" | "neutral" | "decrease" }) {
  if (impact === "increase") return <TrendingUp className="h-3.5 w-3.5 text-signal-positive" />;
  if (impact === "decrease") return <TrendingDown className="h-3.5 w-3.5 text-signal-risk" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

function FinancingCard({ result }: { result: FinancingResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <CardContainer className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{result.label}</h4>
          <p className="text-xs text-muted-foreground">{result.termStructure}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ConfidenceIcon impact={result.confidenceImpact} />
          <Badge variant={fitBadgeVariant(result.fitScore)} className="text-[10px] whitespace-nowrap">
            {fitLabel(result.fitScore)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rate Range</p>
          <p className="text-sm font-mono text-foreground">
            {fmtPct(result.rateRange.min)} – {fmtPct(result.rateRange.max)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Down Payment</p>
          <p className="text-sm font-mono text-foreground">
            {fmtPct(result.downPaymentRange.min)} – {fmtPct(result.downPaymentRange.max)}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Est. Monthly Payment</p>
          <p className="text-sm font-mono text-foreground">{fmt(result.estimatedMonthlyPayment)}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Est. Cash to Close</p>
          <p className="text-sm font-mono text-foreground">{fmt(result.estimatedCashToClose)}</p>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Hide details" : "View details"}
      </button>

      {expanded && (
        <div className="space-y-3 pt-1 border-t border-border">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Advantages</p>
            {result.pros.map((p, i) => (
              <p key={i} className="text-xs text-signal-positive">+ {p}</p>
            ))}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Considerations</p>
            {result.cons.map((c, i) => (
              <p key={i} className="text-xs text-signal-risk">− {c}</p>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground">
            {result.sourceTag}
          </p>
        </div>
      )}
    </CardContainer>
  );
}

interface FinancingIntelligenceProps {
  results: FinancingResult[];
}

export function FinancingIntelligence({ results }: FinancingIntelligenceProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
        <Landmark className="h-5 w-5 text-muted-foreground" /> Financing Intelligence
      </h2>
      <p className="text-xs text-muted-foreground">
        Top financing paths ranked by fit. Estimates only — not a financing offer or approval.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {results.map(r => (
          <FinancingCard key={r.type} result={r} />
        ))}
      </div>
    </div>
  );
}
