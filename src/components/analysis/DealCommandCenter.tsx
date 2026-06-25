import {
  AlertTriangle,
  Building2,
  Camera,
  CheckCircle2,
  Download,
  FileQuestion,
  Home,
  Landmark,
  Scale,
  Search,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContainer } from "@/components/ui/card-container";
import type { AnalysisResult } from "@/lib/dealAnalysisEngine";
import type { DealGuidanceResult } from "@/lib/dealGuidanceEngine";
import type { HiddenRiskResult } from "@/lib/hiddenRiskEngine";
import type { MarketIntelligenceResult } from "@/lib/marketIntelligenceEngine";
import type { DueDiligenceQuestionSet, ResidentialDecisionResult } from "@/lib/residentialDecisionEngine";

interface DealCommandCenterProps {
  mode: "investment" | "live-in";
  onModeChange: (mode: "investment" | "live-in") => void;
  holdPeriod: 5 | 10 | 15;
  onHoldPeriodChange: (period: 5 | 10 | 15) => void;
  score: number;
  verdict: string;
  analysis: AnalysisResult;
  marketIntelligence: MarketIntelligenceResult;
  guidance: DealGuidanceResult | null;
  hiddenRisks: HiddenRiskResult | null;
  residential: ResidentialDecisionResult;
  questions: DueDiligenceQuestionSet;
  onExportPdf: () => void;
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
const fmtX = (n: number) => `${n.toFixed(2)}x`;

function scoreTone(score: number) {
  if (score >= 75) return "text-signal-positive border-signal-positive/30 bg-signal-positive/10";
  if (score >= 55) return "text-signal-warning border-signal-warning/30 bg-signal-warning/10";
  return "text-signal-risk border-signal-risk/30 bg-signal-risk/10";
}

function RiskLedger({ hiddenRisks }: { hiddenRisks: HiddenRiskResult | null }) {
  const flags = hiddenRisks?.flags.slice(0, 5) ?? [];
  if (flags.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-md border border-signal-positive/20 bg-signal-positive/5 p-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 text-signal-positive" />
        <div>
          <p className="text-sm font-semibold text-foreground">No major hidden-risk flags from current inputs</p>
          <p className="text-xs text-muted-foreground">Photo, inspection, public-record, and insurance review still need source verification.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {flags.map((flag) => (
        <div key={flag.id} className="rounded-md border border-border bg-background p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{flag.title}</p>
            <Badge variant={flag.severity === "high" ? "destructive" : flag.severity === "moderate" ? "secondary" : "outline"} className="text-[10px]">
              {flag.severity}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{flag.description}</p>
        </div>
      ))}
    </div>
  );
}

function QuestionColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="space-y-2">
        {items.slice(0, 3).map((item) => (
          <li key={item} className="rounded-md border border-border bg-background p-2.5 text-xs leading-relaxed text-foreground">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DealCommandCenter({
  mode,
  onModeChange,
  holdPeriod,
  onHoldPeriodChange,
  score,
  verdict,
  analysis,
  marketIntelligence,
  guidance,
  hiddenRisks,
  residential,
  questions,
  onExportPdf,
}: DealCommandCenterProps) {
  const activeScore = mode === "live-in" ? residential.score : score;
  const activeVerdict = mode === "live-in" ? residential.verdict : verdict;

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <CardContainer className="overflow-hidden border-border/90 p-0">
        <div className="border-b border-border bg-[linear-gradient(135deg,hsl(222_47%_11%),hsl(215_28%_17%))] p-5 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">DealIQ Review</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Underwriting, diligence, and offer strategy</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/70">
                BRIX scores the economics, source quality, market risk, property condition signals, financing path, and contract questions before you spend inspection money.
              </p>
            </div>
            <div className={`min-w-[140px] rounded-md border px-4 py-3 text-center ${scoreTone(activeScore)}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide opacity-75">Decision Score</p>
              <p className="text-4xl font-black leading-none">{activeScore}</p>
              <p className="mt-1 text-xs font-semibold">{activeVerdict}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={mode === "investment" ? "secondary" : "outline"}
              className="h-8 gap-1.5"
              onClick={() => onModeChange("investment")}
            >
              <Building2 className="h-3.5 w-3.5" /> Investment
            </Button>
            <Button
              size="sm"
              variant={mode === "live-in" ? "secondary" : "outline"}
              className="h-8 gap-1.5"
              onClick={() => onModeChange("live-in")}
            >
              <Home className="h-3.5 w-3.5" /> Live-In Home
            </Button>
            <div className="ml-0 flex rounded-md border border-white/15 bg-white/10 p-0.5 lg:ml-2">
              {[5, 10, 15].map((period) => (
                <button
                  key={period}
                  onClick={() => onHoldPeriodChange(period as 5 | 10 | 15)}
                  className={`h-7 px-3 text-xs font-semibold transition-colors ${holdPeriod === period ? "rounded bg-white text-slate-950" : "text-white/70 hover:text-white"}`}
                >
                  {period}Y
                </button>
              ))}
            </div>
            <Button size="sm" className="ml-auto h-8 gap-1.5" onClick={onExportPdf}>
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-4">
          <CommandMetric icon={<TrendingUp />} label="Cash Flow" value={fmt(analysis.metrics.monthly_cashflow)} sub="per month" />
          <CommandMetric icon={<Scale />} label="DSCR" value={fmtX(analysis.metrics.dscr)} sub="debt coverage" />
          <CommandMetric icon={<Landmark />} label="Cash Needed" value={fmt(analysis.metrics.initial_cash_required)} sub="down payment + costs" />
          <CommandMetric icon={<ShieldAlert />} label="Risk Flags" value={String(hiddenRisks?.flagCount ?? 0)} sub={guidance?.overallConfidenceLevel ?? "confidence pending"} />
        </div>
      </CardContainer>

      <CardContainer className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground">{mode === "live-in" ? "Owner-Occupant Lens" : "Investor Lens"}</h3>
            <p className="text-xs text-muted-foreground">Hold-period and source-aware decision support.</p>
          </div>
          <Badge variant="outline">{holdPeriod}-year hold</Badge>
        </div>
        {mode === "live-in" ? (
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Est. Exit Value" value={fmt(residential.estimatedValueAtExit)} />
            <MiniStat label="Projected Equity" value={fmt(residential.projectedEquity)} />
            <MiniStat label="Owner Cost" value={`${fmt(residential.ownershipCostMonthly)}/mo`} />
            <MiniStat label="Own/Rent Gap" value={`${fmt(residential.rentEquivalentGapMonthly)}/mo`} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Cap Rate" value={fmtPct(analysis.metrics.cap_rate)} />
            <MiniStat label="Cash-on-Cash" value={fmtPct(analysis.metrics.cash_on_cash)} />
            <MiniStat label="Market Strength" value={`${marketIntelligence.market_strength_score}/100`} />
            <MiniStat label="Risk Score" value={`${hiddenRisks?.totalRiskScore ?? 0}/100`} />
          </div>
        )}
        <div className="space-y-2">
          {(mode === "live-in" ? residential.signals : [
            `NOI is ${fmt(analysis.metrics.noi)} with ${fmt(analysis.metrics.annual_cashflow)} annual cash flow.`,
            `Market risk score is ${marketIntelligence.market_risk_score}/100 and demand pressure is ${marketIntelligence.demand_pressure_score}/100.`,
            `Initial capital requirement is ${fmt(analysis.metrics.initial_cash_required)} before lender reserves.`,
          ]).map((signal) => (
            <div key={signal} className="flex items-start gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-positive" />
              <span>{signal}</span>
            </div>
          ))}
        </div>
      </CardContainer>

      <CardContainer className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-bold text-foreground">Photo & Hidden-Issue Triage</h3>
        </div>
        <RiskLedger hiddenRisks={hiddenRisks} />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Use listing photos to identify visible risk signals before a site visit. Treat output as triage only; inspection and specialist quotes decide the number.
        </p>
      </CardContainer>

      <CardContainer className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-bold text-foreground">Public Record & Article Checks</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "Tax assessment and reassessment exposure",
            "Permit, code, lien, and title exceptions",
            "Rent comps and tenant restrictions",
            "News, nuisance, flood, crime, and zoning articles",
          ].map((item) => (
            <div key={item} className="rounded-md border border-border bg-background p-3 text-xs font-medium text-foreground">
              {item}
            </div>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Use this list to confirm taxes, permits, liens, title items, rental restrictions, and local risk before your offer terms become firm.
        </p>
      </CardContainer>

      <CardContainer className="space-y-4 p-5 xl:col-span-2">
        <div className="flex items-center gap-2">
          <FileQuestion className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-bold text-foreground">Questions to Send Before You Spend Money</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <QuestionColumn title="Realtor" items={questions.realtor} />
          <QuestionColumn title="Attorney" items={questions.attorney} />
          <QuestionColumn title="Lender" items={questions.lender} />
          <QuestionColumn title="Inspector" items={questions.inspector} />
        </div>
        {(hiddenRisks?.totalRiskScore ?? 0) > 35 && (
          <div className="flex items-start gap-2 rounded-md border border-signal-warning/25 bg-signal-warning/10 p-3 text-xs text-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-signal-warning" />
            <span>Risk score is elevated. Ask these questions before offer hardening, earnest money release, inspection contingency removal, or lender appraisal spend.</span>
          </div>
        )}
      </CardContainer>
    </div>
  );
}

function CommandMetric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="border-b border-r border-border p-4 last:border-r-0 md:border-b-0">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black tracking-tight text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-black tracking-tight text-foreground">{value}</p>
    </div>
  );
}
