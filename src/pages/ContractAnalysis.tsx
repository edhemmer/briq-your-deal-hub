import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  Scale,
  Clock,
  CheckCircle2,
  Sparkles,
  ListChecks,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Lightbulb,
  ShieldAlert,
  Download,
  FileText,
  Briefcase,
  Gavel,
} from "lucide-react";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useContract } from "@/hooks/useContracts";
import {
  analyzeContract,
  type ContractAnalysis,
  type ContractInput,
  type Perspective,
} from "@/lib/contractIQEngine";
import {
  generateFullDealBookPDF,
  generateHighlightBriefPDF,
  generateAttorneyQuestionsPDF,
  generateBrokerQuestionsPDF,
  type ContractReportContext,
} from "@/lib/contractReports";
import type { CanonicalContractExtraction } from "@/lib/contractDataMapper";
import { ClauseEvidenceBlock } from "@/components/contractiq/ClauseEvidence";

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
  const { user } = useAuth();
  const [perspective, setPerspective] = useState<Perspective | null>(null);

  const activePerspective: Perspective =
    perspective ?? ((contract?.perspective as Perspective) ?? "buyer");

  const analysis = useMemo<ContractAnalysis | null>(() => {
    if (!contract) return null;
    // Always recompute deterministically so perspective toggle works live.
    const extractionConf = contract.extraction_confidence as unknown as
      | CanonicalContractExtraction
      | null;
    const input: ContractInput = {
      perspective: activePerspective,
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
      extraction: extractionConf,
    };
    return analyzeContract(input);
  }, [contract, activePerspective]);

  const buildReportCtx = (): ContractReportContext | null => {
    if (!contract || !analysis) return null;
    return {
      contractTitle: contract.contract_name ?? "Contract",
      contractType: contract.contract_type,
      propertyAddress: contract.property_address,
      counterparty: activePerspective === "buyer" ? contract.seller_name : contract.buyer_name,
      buyerName: contract.buyer_name,
      sellerName: contract.seller_name,
      purchasePrice: contract.purchase_price,
      earnestMoney: contract.earnest_money,
      closingDate: contract.closing_date,
      preparedBy: user?.email ?? "BRIX User",
      analysis,
    };
  };

  const downloadReport = (kind: "full" | "highlight" | "attorney" | "broker") => {
    const ctx = buildReportCtx();
    if (!ctx) return;
    if (kind === "full") generateFullDealBookPDF(ctx);
    else if (kind === "highlight") generateHighlightBriefPDF(ctx);
    else if (kind === "attorney") generateAttorneyQuestionsPDF(ctx);
    else generateBrokerQuestionsPDF(ctx);
  };

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
            {analysis.dealStructureLabel && (
              <Badge variant="outline" className="mt-2 text-[10px]">
                Structure: {analysis.dealStructureLabel}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-border bg-background p-0.5">
              {(["buyer", "seller"] as Perspective[]).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => setPerspective(side)}
                  className={`px-3 py-1 text-xs font-medium rounded-sm capitalize transition-colors ${
                    activePerspective === side
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
            <Badge className={`border ${recoColor(analysis.recommendation)}`} variant="outline">
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

      {/* Reports */}
      <CardContainer className="p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Reports</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => downloadReport("full")}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Full Deal Book
          </Button>
          <Button size="sm" variant="secondary" onClick={() => downloadReport("highlight")}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Highlight Brief
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadReport("attorney")}>
            <Gavel className="h-3.5 w-3.5 mr-1.5" /> Attorney Questions
          </Button>
          <Button size="sm" variant="outline" onClick={() => downloadReport("broker")}>
            <Briefcase className="h-3.5 w-3.5 mr-1.5" /> Broker Questions
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Prepared for {user?.email ?? "you"} · {new Date().toLocaleDateString()} · BRIX ContractIQ — Confidential
        </p>
      </CardContainer>

      {/* Executive Summary */}
      {analysis.executiveSummary && (
        <CardContainer className="p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Executive summary</h3>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{analysis.executiveSummary}</p>
        </CardContainer>
      )}

      {/* Takeaways */}
      <CardContainer className="p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Key takeaways</h3>
        </div>
        <ul className="space-y-2">
          {analysis.takeaways.map((t, i) => (
            <li key={i} className="text-sm text-foreground/90 flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </CardContainer>

      {/* Pros / Cons grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <CardContainer className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-foreground">
              Pros for {analysis.perspective}
            </h3>
            <Badge variant="outline" className="text-[10px] ml-auto">{analysis.pros.length}</Badge>
          </div>
          {analysis.pros.length === 0 ? (
            <p className="text-xs text-muted-foreground">No favorable terms identified.</p>
          ) : (
            <ul className="space-y-2.5">
              {analysis.pros.map((pr) => (
                <li key={pr.id} className="text-sm">
                  <p className="font-medium text-foreground">{pr.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{pr.detail}</p>
                  <ClauseEvidenceBlock evidence={pr.evidence} emphasis="muted" />
                </li>
              ))}
            </ul>
          )}
        </CardContainer>

        <CardContainer className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsDown className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">
              Cons for {analysis.perspective}
            </h3>
            <Badge variant="outline" className="text-[10px] ml-auto">{analysis.cons.length}</Badge>
          </div>
          {analysis.cons.length === 0 ? (
            <p className="text-xs text-muted-foreground">No concerns identified.</p>
          ) : (
            <ul className="space-y-2">
              {analysis.cons.map((c) => (
                <li key={c.id} className={`rounded-md border p-2.5 ${sevColor(c.severity)}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold">{c.label}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {c.confidenceAdjusted && (
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wide bg-background/60">
                          Adj.
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {c.severity}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{c.detail}</p>
                  <ClauseEvidenceBlock evidence={c.evidence} />
                </li>
              ))}
            </ul>
          )}
        </CardContainer>
      </div>

      {/* Weaknesses */}
      {analysis.weaknesses.length > 0 && (
        <CardContainer className="p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-foreground">Areas of weakness</h3>
            <Badge variant="outline" className="text-[10px] ml-auto">{analysis.weaknesses.length}</Badge>
          </div>
          <ul className="space-y-2">
            {analysis.weaknesses.map((w) => (
              <li key={w.id} className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800 p-3">
                <p className="text-sm font-medium text-foreground">{w.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{w.detail}</p>
                <ClauseEvidenceBlock evidence={w.evidence} emphasis="muted" />
              </li>
            ))}
          </ul>
        </CardContainer>
      )}

      {/* Questions to ask */}
      <CardContainer className="p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Questions to ask</h3>
          <Badge variant="outline" className="text-[10px] ml-auto">{analysis.questions.length}</Badge>
        </div>
        {analysis.questions.length === 0 ? (
          <p className="text-xs text-muted-foreground">No outstanding questions.</p>
        ) : (
          <ul className="space-y-3">
            {analysis.questions.map((q) => (
              <li key={q.id} className="border-l-2 border-primary/30 pl-3">
                <p className="text-sm font-medium text-foreground">{q.question}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  <span className="capitalize text-[10px] font-semibold tracking-wide text-primary mr-1.5">{q.category}</span>
                  {q.why}
                </p>
                <ClauseEvidenceBlock evidence={q.evidence} emphasis="muted" />
              </li>
            ))}
          </ul>
        )}
      </CardContainer>

      {/* Negotiation moves */}
      {analysis.negotiation.length > 0 && (
        <CardContainer className="p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Recommended negotiation moves</h3>
          </div>
          <ul className="space-y-2.5">
            {analysis.negotiation.map((n, i) => (
              <li key={n.id} className="text-sm flex items-start gap-2">
                <span className="text-primary font-semibold shrink-0">{i + 1}.</span>
                <div>
                  <p className="font-medium text-foreground">{n.ask}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{n.rationale}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContainer>
      )}

      {/* Deadlines */}
      <CardContainer className="p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Deadlines</h3>
        </div>
        <div className="space-y-1.5">
          {analysis.deadlines.map((d) => (
            <div
              key={d.id}
              className={`flex items-center justify-between py-2 px-3 rounded-md border ${
                d.status === "tight" || d.status === "past"
                  ? "border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800"
                  : d.status === "missing"
                  ? "border-dashed border-border bg-muted/20"
                  : "border-border bg-background"
              }`}
            >
              <span className="text-sm text-foreground">{d.label}</span>
              <span className="text-xs text-muted-foreground">
                {d.status === "missing"
                  ? "Not set"
                  : d.date
                  ? `${new Date(d.date).toLocaleDateString()}${d.daysFromNow != null ? ` · ${d.daysFromNow >= 0 ? `in ${d.daysFromNow}d` : `${Math.abs(d.daysFromNow)}d ago`}` : ""}`
                  : d.daysFromEffective != null
                  ? `${d.daysFromEffective} days from effective`
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      </CardContainer>

      {/* Risk Matrix */}
      {analysis.riskMatrix.length > 0 && (
        <CardContainer className="p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-foreground">Risk matrix</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Risk</th>
                  <th className="py-2 pr-3 font-medium">Severity</th>
                  <th className="py-2 pr-3 font-medium">Owner</th>
                  <th className="py-2 font-medium">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {analysis.riskMatrix.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-3 font-medium text-foreground">{r.risk}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline" className={`text-[10px] capitalize ${sevColor(r.severity)}`}>
                        {r.severity}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 capitalize text-foreground/80">{r.owner}</td>
                    <td className="py-2 text-muted-foreground leading-relaxed">{r.mitigation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContainer>
      )}

      {/* Liability allocation */}
      {analysis.liabilityAllocation.length > 0 && (
        <CardContainer className="p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Liability allocation</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Item</th>
                  <th className="py-2 pr-3 font-medium">Responsible party</th>
                  <th className="py-2 pr-3 font-medium">When</th>
                  <th className="py-2 font-medium">Why</th>
                </tr>
              </thead>
              <tbody>
                {analysis.liabilityAllocation.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-3 font-medium text-foreground">{r.item}</td>
                    <td className="py-2 pr-3 capitalize text-foreground/80">{r.party}</td>
                    <td className="py-2 pr-3 text-foreground/80">{r.when}</td>
                    <td className="py-2 text-muted-foreground leading-relaxed">{r.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContainer>
      )}

      {/* Closing accounting (estimated settlement statement) */}
      {analysis.closingAccounting && analysis.closingAccounting.length > 0 && (
        <CardContainer className="p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Closing accounting (estimated)</h3>
            <Badge variant="outline" className="text-[10px] ml-auto">{analysis.closingAccounting.length} lines</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 font-medium">Line item</th>
                  <th className="py-2 pr-3 font-medium text-center">Buyer</th>
                  <th className="py-2 pr-3 font-medium text-center">Seller</th>
                  <th className="py-2 pr-3 font-medium text-right">Est. amount</th>
                  <th className="py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {analysis.closingAccounting.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-3 text-foreground/80">{r.category}</td>
                    <td className="py-2 pr-3 font-medium text-foreground">{r.item}</td>
                    <td className="py-2 pr-3 text-center">{r.buyer ? "✓" : "—"}</td>
                    <td className="py-2 pr-3 text-center">{r.seller ? "✓" : "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-foreground">
                      {r.estimatedAmount != null
                        ? r.estimatedAmount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
                        : "—"}
                    </td>
                    <td className="py-2 text-muted-foreground leading-relaxed">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Estimated lines combine contract allocations with industry-standard defaults (title ~0.5%, transfer tax ~0.4%, etc.). Confirm with closing agent.
          </p>
        </CardContainer>
      )}

      {/* Who pays what */}
      {analysis.whoPaysWhat.length > 0 && (
        <CardContainer className="p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Who pays what</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-3 font-medium">Item</th>
                  <th className="py-2 pr-3 font-medium text-center">Buyer</th>
                  <th className="py-2 pr-3 font-medium text-center">Seller</th>
                  <th className="py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {analysis.whoPaysWhat.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 align-top">
                    <td className="py-2 pr-3 font-medium text-foreground">{r.item}</td>
                    <td className="py-2 pr-3 text-center">{r.buyer ? "✓" : "—"}</td>
                    <td className="py-2 pr-3 text-center">{r.seller ? "✓" : "—"}</td>
                    <td className="py-2 text-muted-foreground leading-relaxed">{r.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContainer>
      )}

      {/* Broker questions */}
      {analysis.brokerQuestions.length > 0 && (
        <CardContainer className="p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Questions for the broker</h3>
            <Badge variant="outline" className="text-[10px] ml-auto">{analysis.brokerQuestions.length}</Badge>
          </div>
          <ul className="space-y-3">
            {analysis.brokerQuestions.map((q) => (
              <li key={q.id} className="border-l-2 border-primary/30 pl-3">
                <p className="text-sm font-medium text-foreground">{q.question}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{q.why}</p>
              </li>
            ))}
          </ul>
        </CardContainer>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <CardContainer className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Risk score breakdown</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Computed deterministically from {analysis.cons.length} concern{analysis.cons.length === 1 ? "" : "s"} weighted by severity (high=30, moderate=15, low=5). Capped at 100.
          </p>
        </CardContainer>
        <CardContainer className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Leverage score breakdown</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Baseline 50, +6 per favorable term, −4 per concern, −20% of risk score. Reflects relative bargaining position.
          </p>
        </CardContainer>
      </div>

      {analysis.missingInputs.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Missing inputs may affect accuracy: {analysis.missingInputs.join(", ")}.
        </p>
      )}
    </SectionContainer>
  );
};

export default ContractAnalysisPage;
