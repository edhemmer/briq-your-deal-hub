import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  DollarSign,
  FileSignature,
  MessageSquareText,
  ShieldAlert,
  Target,
  Workflow,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDeals, useUpdateDeal } from "@/hooks/useDeals";
import { cn } from "@/lib/utils";

type Deal = NonNullable<ReturnType<typeof useDeals>["data"]>[number];

export default function OfferIQ() {
  const { data: deals = [], isLoading } = useDeals();
  const updateDeal = useUpdateDeal();
  const [selectedDealId, setSelectedDealId] = useState<string | undefined>();

  const deal = useMemo(() => {
    if (deals.length === 0) return undefined;
    return deals.find((item) => item.id === selectedDealId) ?? deals[0];
  }, [deals, selectedDealId]);

  const strategy = deal ? offerStrategy(deal) : undefined;
  const readiness = deal ? readinessScore(deal) : 0;
  const gaps = deal ? missingInputs(deal) : [];

  function markStage(stage: string) {
    if (!deal) return;
    updateDeal.mutate({ id: deal.id, deal_status: stage });
  }

  return (
    <SectionContainer>
      <PageHeader
        title="OfferIQ"
        description="Turn the current deal file into offer terms, negotiation posture, diligence requests, and a clean pursuit record."
      >
        <Button variant="outline" asChild>
          <Link to="/pipelineiq">Pipeline</Link>
        </Button>
        <Button asChild>
          <Link to="/dealiq/new">
            <FileSignature className="mr-2 h-4 w-4" />
            Add deal
          </Link>
        </Button>
      </PageHeader>

      {isLoading ? (
        <CardContainer className="min-h-[340px]">
          <EmptyOffer title="Loading offer workspace" body="BRIX is checking your active deal records." />
        </CardContainer>
      ) : !deal ? (
        <CardContainer className="min-h-[420px]">
          <EmptyOffer
            title="No deal ready for an offer yet"
            body="Add a property or send one from FindIQ. OfferIQ needs a deal file before it can structure terms."
          />
        </CardContainer>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <CardContainer className="p-0">
              <div className="border-b border-border p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Selected Deal</p>
                    <h2 className="mt-2 text-2xl font-bold text-foreground">{deal.property_address || deal.deal_name || "Unnamed deal"}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{locationLine(deal)}</p>
                  </div>
                  <div className="w-full lg:w-72">
                    <Select value={deal.id} onValueChange={setSelectedDealId}>
                      <SelectTrigger className="bg-background/70">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {deals.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.property_address || item.deal_name || "Unnamed deal"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <OfferFact label="Purchase price" value={formatCurrency(deal.purchase_price) || "Needed"} />
                  <OfferFact label="Strategy" value={deal.strategy_primary || "Needed"} />
                  <OfferFact label="Annual insurance" value={formatCurrency(deal.insurance) || "Needed"} />
                  <OfferFact label="Annual taxes" value={formatCurrency(deal.annual_property_tax ?? deal.taxes) || "Needed"} />
                </div>
              </div>

              <div className="grid gap-4 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
                <div className="rounded-lg border border-border bg-background/40 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Offer readiness</span>
                    <span className={cn("font-bold", readiness >= 85 ? "text-emerald-400" : readiness >= 65 ? "text-amber-300" : "text-red-300")}>
                      {readiness}
                    </span>
                  </div>
                  <Progress value={readiness} className="h-2" />
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {gaps.length ? `${gaps.length} source item${gaps.length === 1 ? "" : "s"} should be resolved before you rely on terms.` : "Core deal inputs are present."}
                  </p>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={strategyBadge(strategy.tone)}>
                      {strategy.label}
                    </Badge>
                    <Badge variant="outline">{strategy.confidence}</Badge>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-foreground">{strategy.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{strategy.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button onClick={() => markStage("offer_strategy")}>Prepare offer strategy</Button>
                    <Button variant="outline" onClick={() => markStage("underwriting")}>Send back to verification</Button>
                  </div>
                </div>
              </div>
            </CardContainer>

            <div className="grid gap-4 lg:grid-cols-3">
              <OfferPanel
                icon={DollarSign}
                title="Terms"
                items={[
                  strategy.priceGuidance,
                  "Earnest money, contingencies, and closing timeline should reflect verified risk.",
                  "Set walk-away terms before negotiation starts.",
                ]}
              />
              <OfferPanel
                icon={MessageSquareText}
                title="Communication"
                items={[
                  "Lead with facts BRIX can support from the deal file.",
                  "Ask for missing information directly instead of guessing.",
                  "Keep negotiation language professional, brief, and source-backed.",
                ]}
              />
              <OfferPanel
                icon={ShieldAlert}
                title="Diligence"
                items={gaps.length ? gaps.slice(0, 3) : ["Confirm title, insurance, financing, inspection, and final numbers before execution."]}
              />
            </div>
          </div>

          <CardContainer className="self-start">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="h-4 w-4 text-primary" />
              Pursuit Checklist
            </div>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">The offer should stay provisional until these are resolved or intentionally accepted.</p>

            <div className="mt-5 space-y-3">
              {(gaps.length ? gaps : ["Confirm all contract terms with the proper licensed professionals."]).map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-border bg-background/50 p-3 text-sm">
                  {gaps.length ? <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />}
                  <span className="leading-5 text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-2">
              <Button disabled={gaps.length > 0} onClick={() => markStage("offer_submitted")}>
                Mark offer submitted
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/analysis/${deal.id}`}>Open DealIQ file</Link>
              </Button>
            </div>
          </CardContainer>
        </div>
      )}
    </SectionContainer>
  );
}

function EmptyOffer({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
      <Workflow className="h-10 w-10 text-muted-foreground" />
      <h2 className="mt-4 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/findiq">Start in FindIQ</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dealiq/new">Add deal manually</Link>
        </Button>
      </div>
    </div>
  );
}

function OfferFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/45 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function OfferPanel({ icon: Icon, title, items }: { icon: typeof DollarSign; title: string; items: string[] }) {
  return (
    <CardContainer>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-2 text-sm leading-6 text-muted-foreground">
            <CheckCircle2 className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </CardContainer>
  );
}

function offerStrategy(deal: Deal) {
  const readiness = readinessScore(deal);
  const price = Number(deal.purchase_price || 0);
  const rehab = Number(deal.rehab_cost || 0);
  const riskDiscount = readiness < 60 ? 0.9 : readiness < 85 ? 0.95 : 0.98;
  const anchor = price > 0 ? Math.max(0, price * riskDiscount - rehab * 0.5) : 0;

  if (readiness < 60) {
    return {
      label: "Verify first",
      tone: "red" as const,
      confidence: "Low confidence",
      title: "Do not rely on offer terms yet",
      summary: "The deal file is missing core inputs. BRIX can organize the pursuit, but it should not create a firm offer posture until price, rent, taxes, insurance, strategy, and source support are stronger.",
      priceGuidance: "No reliable offer range yet. Finish verification before anchoring price.",
    };
  }

  if (readiness < 85) {
    return {
      label: "Conditional pursuit",
      tone: "amber" as const,
      confidence: "Moderate confidence",
      title: "Use a protected offer posture",
      summary: "The deal may be worth pursuing, but missing verification should be reflected in contingencies, inspection period, seller questions, and walk-away discipline.",
      priceGuidance: anchor ? `Initial posture around ${formatCurrency(anchor)} subject to verification.` : "Use conservative terms until the purchase price and costs are complete.",
    };
  }

  return {
    label: "Ready to structure",
    tone: "green" as const,
    confidence: "Higher confidence",
    title: "Prepare a source-backed offer package",
    summary: "Core inputs are present. OfferIQ can move from verification to pursuit while still keeping legal, financing, title, insurance, and inspection review visible.",
    priceGuidance: anchor ? `Offer anchor can be modeled near ${formatCurrency(anchor)} before final human review.` : "Model offer terms from verified economics and strategy fit.",
  };
}

function readinessScore(deal: Deal) {
  const checks = [
    positiveNumber(deal.purchase_price),
    positiveNumber(deal.monthly_rent),
    positiveNumber(deal.annual_property_tax ?? deal.taxes),
    positiveNumber(deal.insurance),
    Boolean(deal.property_address),
    Boolean(deal.strategy_primary),
    Boolean(deal.property_type),
    Boolean(deal.listing_url || deal.property_record_url || deal.listing_remarks),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function missingInputs(deal: Deal) {
  const missing: string[] = [];
  if (!deal.property_address) missing.push("Add the property address.");
  if (!deal.property_type) missing.push("Select a property type.");
  if (!deal.strategy_primary) missing.push("Choose the primary strategy.");
  if (!positiveNumber(deal.purchase_price)) missing.push("Enter or verify purchase price.");
  if (!positiveNumber(deal.monthly_rent)) missing.push("Verify monthly rent support.");
  if (!positiveNumber(deal.annual_property_tax ?? deal.taxes)) missing.push("Verify annual property taxes.");
  if (!positiveNumber(deal.insurance)) missing.push("Get an annual insurance quote.");
  if (!deal.listing_url && !deal.property_record_url && !deal.listing_remarks) missing.push("Attach the source listing, document, or notes.");
  return missing;
}

function strategyBadge(tone: "green" | "amber" | "red") {
  if (tone === "green") return "border-emerald-500/35 bg-emerald-500/10 text-emerald-300";
  if (tone === "amber") return "border-amber-500/35 bg-amber-500/10 text-amber-300";
  return "border-red-500/35 bg-red-500/10 text-red-300";
}

function locationLine(deal: Deal) {
  const parts = [deal.city, deal.state, deal.zip_code].filter(Boolean);
  return parts.length ? parts.join(", ").replace(", ,", ",") : "Location needed";
}

function formatCurrency(value: number | null | undefined) {
  if (!positiveNumber(value)) return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(value));
}

function positiveNumber(value: number | string | null | undefined) {
  return Number(value) > 0;
}
