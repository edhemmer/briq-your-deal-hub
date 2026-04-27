import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  Scale,
  Clock,
  CheckCircle2,
  Sparkles,
  ListChecks,
} from "lucide-react";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useContract } from "@/hooks/useContracts";
import {
  analyzeContract,
  type ContractAnalysis,
  type ContractInput,
  type Perspective,
} from "@/lib/contractIQEngine";

const sevColor = (s: "high" | "moderate" | "low") =>
  s === "high"
    ? "text-destructive bg-destructive/10 border-destructive/20"
    : s === "moderate"
    ? "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800"
    : "text-muted-foreground bg-muted border-border";

const recoLabel = (r: ContractAnalysis["recommendation"]) =>
  r === "proceed" ? "Proceed" : r === "negotiate" ? "Negotiate" : "Caution";

const recoColor = (r: ContractAnalysis["recommendation"]) =>
  r === "proceed"
    ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/20"
    : r === "negotiate"
    ? "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/20"
    : "text-destructive bg-destructive/10 border-destructive/20";

const ContractAnalysisPage = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading } = useContract(contractId);

  const analysis = useMemo<ContractAnalysis | null>(() => {
    if (!contract) return null;
    // Prefer stored analysis; fall back to recompute (deterministic).
    const stored = contract.contractiq_analysis as unknown as ContractAnalysis | null;
    if (stored && stored.perspective) return stored;
    const input: ContractInput = {
      perspective: (contract.perspective as Perspective) ?? "buyer",
      contract_type: contract.contract_type,
      buyer_name: contract.buyer_name,
      seller_name: contract.seller_name,
      property_address: contract.property_address,
      purchase_price: contract.purchase_price,
      earnest_money: contract.earnest_money,
      closing_date: contract.closing_date,
      inspection_period_days: contract.inspection_period_days,
      financing_contingency: contract.financing_contingency,
      appraisal_contingency: contract.appraisal_contingency,
      inspection_contingency: contract.inspection_contingency,
      contract_text: contract.contract_text,
    };
    return analyzeContract(input);
  }, [contract]);

  if (isLoading) {
    return (
      <SectionContainer>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </SectionContainer>
    );
  }

  if (!contract || !analysis) {
    return (
      <SectionContainer>
        <p className="text-sm text-muted-foreground">Contract not found.</p>
        <Link to="/contractiq" className="text-sm text-primary hover:underline mt-2 inline-block">
          ← Back to ContractIQ
        </Link>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/contractiq")}
        className="mb-4 -ml-2 text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
              {contract.contract_name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {contract.property_address ?? "No address"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {analysis.perspective} perspective
            </Badge>
            <Badge className={`border ${recoColor(analysis.recommendation)} bg-opacity-100`} variant="outline">
              {recoLabel(analysis.recommendation)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Decision summary */}
      <CardContainer className="p-6 mb-5 border-primary/15 bg-gradient-to-br from-primary/[0.03] to-card">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground mb-1">What this means</h2>
            <p className="text-sm text-foreground/90 leading-relaxed">{analysis.summary}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Risk to {analysis.perspective}
              </span>
              <span className="text-xs font-semibold text-foreground">{analysis.riskScore}/100</span>
            </div>
            <Progress value={analysis.riskScore} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Leverage for {analysis.perspective}
              </span>
              <span className="text-xs font-semibold text-foreground">{analysis.leverageScore}/100</span>
            </div>
            <Progress value={analysis.leverageScore} className="h-2" />
          </div>
        </div>
      </CardContainer>

      {/* Takeaways + Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <CardContainer className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Key takeaways</h3>
          </div>
          {analysis.takeaways.length === 0 ? (
            <p className="text-xs text-muted-foreground">No takeaways.</p>
          ) : (
            <ul className="space-y-2">
              {analysis.takeaways.map((t, i) => (
                <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContainer>

        <CardContainer className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Recommended actions</h3>
          </div>
          {analysis.actions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No actions required.</p>
          ) : (
            <ul className="space-y-2">
              {analysis.actions.map((a, i) => (
                <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
                  <span className="text-primary font-semibold">{i + 1}.</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContainer>
      </div>

      {/* Risks */}
      <CardContainer className="p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Risk flags</h3>
        </div>
        {analysis.risks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No material risks detected.</p>
        ) : (
          <div className="space-y-2">
            {analysis.risks.map((r) => (
              <div
                key={r.id}
                className={`rounded-md border p-3 ${sevColor(r.severity)}`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold">{r.label}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {r.severity}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed opacity-90">{r.detail}</p>
                <p className="text-[10px] uppercase tracking-wide mt-1.5 opacity-70">
                  Affects: {r.affects}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContainer>

      {/* Leverage */}
      <CardContainer className="p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Leverage points</h3>
        </div>
        {analysis.leverage.length === 0 ? (
          <p className="text-xs text-muted-foreground">No leverage points identified.</p>
        ) : (
          <div className="space-y-2">
            {analysis.leverage.map((l) => (
              <div key={l.id} className="rounded-md border border-border bg-muted/20 p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-foreground">{l.label}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    Favors {l.favors}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{l.detail}</p>
              </div>
            ))}
          </div>
        )}
      </CardContainer>

      {/* Timeline */}
      <CardContainer className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Timeline</h3>
        </div>
        <div className="space-y-2">
          {analysis.timeline.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm text-foreground">{t.label}</span>
              <span className="text-xs text-muted-foreground">
                {t.status === "missing"
                  ? "Not set"
                  : t.date
                  ? new Date(t.date).toLocaleDateString()
                  : t.daysFromNow != null
                  ? `${t.daysFromNow} days`
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      </CardContainer>

      {analysis.missingInputs.length > 0 && (
        <p className="text-xs text-muted-foreground mt-4">
          Missing inputs: {analysis.missingInputs.join(", ")}.
        </p>
      )}
    </SectionContainer>
  );
};

export default ContractAnalysisPage;
