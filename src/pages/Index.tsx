import { Link } from "react-router-dom";
import type { ElementType } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileSignature,
  Gauge,
  Home,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContainer } from "@/components/ui/card-container";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeals } from "@/hooks/useDeals";
import { cn } from "@/lib/utils";

type Deal = NonNullable<ReturnType<typeof useDeals>["data"]>[number];
type Tone = "positive" | "caution" | "risk" | "neutral";

const money = (value: number | null | undefined) =>
  value == null
    ? "Missing"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);

const numberOrNull = (value: number | null | undefined) =>
  value != null && Number.isFinite(value) && value > 0 ? value : null;

function readinessScore(deal: Deal) {
  const checks = [
    deal.property_address,
    deal.city,
    deal.state,
    numberOrNull(deal.purchase_price),
    numberOrNull(deal.monthly_rent),
    numberOrNull(deal.annual_property_tax ?? deal.taxes),
    numberOrNull(deal.insurance),
    deal.property_type,
    deal.strategy_primary,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function missingItems(deal: Deal) {
  const missing: string[] = [];
  if (!numberOrNull(deal.purchase_price)) missing.push("purchase price");
  if (!numberOrNull(deal.monthly_rent)) missing.push("rent support");
  if (!numberOrNull(deal.annual_property_tax ?? deal.taxes)) missing.push("tax history");
  if (!numberOrNull(deal.insurance)) missing.push("insurance quote");
  if (!deal.property_type) missing.push("property type");
  if (!deal.strategy_primary) missing.push("strategy");
  return missing;
}

function riskTone(score: number): Tone {
  if (score >= 80) return "positive";
  if (score >= 60) return "caution";
  return "risk";
}

function toneClass(tone: Tone) {
  if (tone === "positive") return "border-signal-positive/25 bg-signal-positive/10 text-signal-positive";
  if (tone === "risk") return "border-signal-risk/25 bg-signal-risk/10 text-signal-risk";
  if (tone === "caution") return "border-signal-warning/25 bg-signal-warning/10 text-signal-warning";
  return "border-border bg-muted/40 text-muted-foreground";
}

function scoreText(score: number) {
  if (score >= 80) return "text-signal-positive";
  if (score >= 60) return "text-signal-warning";
  return "text-signal-risk";
}

export default function Index() {
  const { data: deals, isLoading } = useDeals();
  const activeDeals = deals ?? [];
  const primaryDeal = activeDeals[0] ?? null;
  const primaryScore = primaryDeal ? readinessScore(primaryDeal) : 0;
  const primaryMissing = primaryDeal ? missingItems(primaryDeal) : [];
  const readyCount = activeDeals.filter((deal) => readinessScore(deal) >= 80).length;
  const needsVerification = activeDeals.filter((deal) => readinessScore(deal) < 80).length;

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-32 rounded-lg" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="ios-material rounded-2xl p-4 md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
              Deal Dashboard
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Open the next property, close verification gaps, compare active deals, and move the strongest file forward.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link to="/findiq">Find an address</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/dealiq/new">Build deal file</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/dealiq/compare">Compare active deals</Link>
              </Button>
            </div>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-[390px] xl:w-[410px]">
            <ExecutiveMetric label="Open deal files" value={String(activeDeals.length)} tone="neutral" />
            <ExecutiveMetric label="Ready to act" value={String(readyCount)} tone="positive" />
            <ExecutiveMetric label="Need verification" value={String(needsVerification)} tone={needsVerification > 0 ? "caution" : "positive"} />
          </div>
        </div>
      </section>

      {activeDeals.length === 0 ? (
        <EmptyDealDashboard />
      ) : (
        <>
          <DealJourney activeDeals={activeDeals.length} readyCount={readyCount} needsVerification={needsVerification} />

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <CardContainer className="relative overflow-hidden space-y-5">
              <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <PanelTitle
                icon={Target}
                title="Active Deal File"
                subtitle="The property you are working now, what is known, and what still needs proof."
              />
              {primaryDeal && (
                <div className="relative rounded-2xl border border-border/70 bg-background/45 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{primaryDeal.property_address}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[primaryDeal.city, primaryDeal.state, primaryDeal.zip_code].filter(Boolean).join(", ") || "Location incomplete"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline">{primaryDeal.property_type ?? "Property type missing"}</Badge>
                        <Badge variant="outline">{primaryDeal.strategy_primary ?? "Strategy missing"}</Badge>
                        <Badge className={`border ${toneClass(riskTone(primaryScore))}`}>
                          {primaryScore >= 80 ? "Mostly ready" : primaryScore >= 60 ? "Verification needed" : "Draft only"}
                        </Badge>
                      </div>
                    </div>
                    <div className="ios-control w-full p-3 sm:w-[210px] sm:shrink-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Readiness</span>
                        <span className={`text-xl font-black ${scoreText(primaryScore)}`}>{primaryScore}</span>
                      </div>
                      <Progress value={primaryScore} className="mt-2 h-2" />
                      <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        {primaryMissing.length === 0 ? "Ready for scenario and source review." : `${primaryMissing.length} item${primaryMissing.length === 1 ? "" : "s"} blocking confidence.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <FactTile label="Purchase price" value={money(primaryDeal?.purchase_price)} verified={!!numberOrNull(primaryDeal?.purchase_price)} />
                <FactTile label="Monthly rent" value={numberOrNull(primaryDeal?.monthly_rent) ? money(primaryDeal?.monthly_rent) : "Missing"} verified={!!numberOrNull(primaryDeal?.monthly_rent)} />
                <FactTile label="Annual insurance" value={numberOrNull(primaryDeal?.insurance) ? money(primaryDeal?.insurance) : "Missing"} verified={!!numberOrNull(primaryDeal?.insurance)} />
              </div>

              <div className="flex flex-wrap gap-2">
                {primaryDeal && (
                  <Button asChild>
                    <Link to={`/dealiq/${primaryDeal.id}`}>
                      Open DealIQ <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link to="/dealiq/compare">Compare active deals</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dealiq/new">Build deal file</Link>
                </Button>
              </div>
            </CardContainer>

            <CardContainer className="space-y-4">
              <PanelTitle
                icon={ShieldCheck}
                title="Verification"
                subtitle="What must be confirmed before relying on the recommendation."
              />
              {primaryMissing.length === 0 ? (
                <div className="rounded-2xl border border-signal-positive/25 bg-signal-positive/10 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-signal-positive" />
                    <div>
                      <p className="font-semibold text-foreground">Core inputs are present</p>
                      <p className="mt-1 text-sm text-muted-foreground">Continue with source review, scenarios, and professional diligence before committing.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {primaryMissing.map((item) => (
                    <div key={item} className="flex items-start gap-2 rounded-xl border border-signal-warning/25 bg-signal-warning/10 p-3 text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-signal-warning" />
                      <span className="capitalize text-foreground">{item} requires verification</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
                BRIX can help structure the decision, but your buy/renegotiate/pass decision should stay provisional until source quality is strong enough.
              </div>
            </CardContainer>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
            <CardContainer className="space-y-4">
              <PanelTitle
                icon={BarChart3}
                title="Deal Queue"
                subtitle="Open deal files prioritized by readiness, missing information, and next action."
              />
              <div className="grid gap-3">
                {activeDeals.slice(0, 6).map((deal, index) => (
                  <DealStackCard key={deal.id} deal={deal} rank={index + 1} />
                ))}
              </div>
            </CardContainer>

            <CardContainer className="space-y-4">
              <PanelTitle
                icon={ClipboardCheck}
                title="Next Best Actions"
                subtitle="The work that improves confidence fastest."
              />
              <ActionLine tone="caution" text="Verify rent support with comps or a lease/rent roll." />
              <ActionLine tone="caution" text="Get an insurance quote before relying on cash flow." />
              <ActionLine tone="neutral" text="Compare active deals before choosing where to spend diligence time." />
              <ActionLine tone="neutral" text="When a deal wins or loses, keep the reason so BRIX can learn which patterns matter." />
            </CardContainer>
          </section>
        </>
      )}
    </div>
  );
}

function EmptyDealDashboard() {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
      <CardContainer className="space-y-5">
        <PanelTitle
          icon={Home}
          title="Build Your Deal Queue"
          subtitle="Add a real property to begin underwriting. BRIX will organize facts, source confidence, risks, strategy fit, and next actions."
        />
        <div className="grid gap-3 md:grid-cols-2">
          <StartAction
            title="1. Find the address"
            body="Use FindIQ to search a geography, import listings, and rank properties against your buying criteria."
            to="/findiq"
            action="Open FindIQ"
          />
          <StartAction
            title="2. Build the file"
            body="Use DealIQ when you already have a listing URL, screenshots, listing text, or known property facts."
            to="/dealiq/new"
            action="Start DealIQ"
          />
        </div>
      </CardContainer>
      <CardContainer className="space-y-4">
        <PanelTitle
          icon={Gauge}
          title="Before You Rely on Results"
          subtitle="BRIX separates entered facts, estimates, and verified information so confidence is visible."
        />
        <ActionLine tone="neutral" text="Facts you provide are separated from information that still needs confirmation." />
        <ActionLine tone="neutral" text="Estimates are never presented as facts." />
        <ActionLine tone="neutral" text="Missing rent, insurance, taxes, or rehab scope lowers confidence." />
      </CardContainer>
    </section>
  );
}

function DealJourney({ activeDeals, readyCount, needsVerification }: { activeDeals: number; readyCount: number; needsVerification: number }) {
  const steps = [
    { label: "Find", detail: `${activeDeals} deal file${activeDeals === 1 ? "" : "s"}`, icon: Compass, tone: activeDeals > 0 ? "positive" : "neutral" as Tone },
    { label: "Prepare", detail: "Notes, tasks, contact", icon: Activity, tone: activeDeals > 0 ? "positive" : "neutral" as Tone },
    { label: "Analyze", detail: needsVerification > 0 ? `${needsVerification} to verify` : "Inputs clean", icon: BarChart3, tone: needsVerification > 0 ? "caution" : "positive" as Tone },
    { label: "Contract", detail: "Terms and risk", icon: FileSignature, tone: "neutral" as Tone },
    { label: "Learn", detail: `${readyCount} actionable`, icon: Sparkles, tone: readyCount > 0 ? "positive" : "neutral" as Tone },
  ];

  return (
    <section className="ios-material relative overflow-hidden rounded-2xl p-4">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">From property to decision record</h2>
        </div>
        <p className="text-sm text-muted-foreground">Source, prepare, underwrite, pursue, close or pass, learn.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step) => (
          <div
            key={step.label}
            className={cn(
              "ios-pressable group relative overflow-hidden rounded-xl border bg-background/55 p-3 transition-colors hover:border-primary/35 hover:bg-muted/35",
              step.tone === "positive" && "border-signal-positive/25 bg-signal-positive/5",
              step.tone === "caution" && "border-signal-warning/25 bg-signal-warning/5",
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground", step.tone === "positive" && "bg-signal-positive/10 text-signal-positive", step.tone === "caution" && "bg-signal-warning/10 text-signal-warning")}>
                <step.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DealStackCard({ deal, rank }: { deal: Deal; rank: number }) {
  const score = readinessScore(deal);
  const missing = missingItems(deal);
  const tone = riskTone(score);

  return (
    <Link
      to={`/dealiq/${deal.id}`}
      className="ios-pressable group relative block overflow-hidden rounded-2xl border border-border/70 bg-background/55 p-4 transition-colors hover:border-primary/35 hover:bg-muted/35"
    >
      <div className={cn("absolute inset-y-0 left-0 w-1 bg-muted", tone === "positive" && "bg-signal-positive", tone === "caution" && "bg-signal-warning", tone === "risk" && "bg-signal-risk")} />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-sm font-bold text-muted-foreground">
            {rank}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-foreground group-hover:text-primary">{deal.property_address || "Unnamed property"}</h3>
              <Badge className={`border ${toneClass(tone)}`}>
                {score >= 80 ? "Ready" : score >= 60 ? "Verify" : "Draft"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {[deal.city, deal.state].filter(Boolean).join(", ") || "Location missing"} - {deal.strategy_primary ?? "Strategy not selected"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:w-[310px] xl:w-[330px]">
          <MiniSignal label="Readiness" value={String(score)} tone={tone} />
          <MiniSignal label="Price" value={money(deal.purchase_price)} tone={numberOrNull(deal.purchase_price) ? "positive" : "caution"} />
          <MiniSignal label="Missing" value={String(missing.length)} tone={missing.length > 0 ? "caution" : "positive"} />
        </div>
      </div>
    </Link>
  );
}

function MiniSignal({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className={cn("mt-1 truncate text-sm font-black text-foreground", scoreText(tone === "positive" ? 90 : tone === "caution" ? 70 : tone === "risk" ? 40 : 80))}>
        {value}
      </p>
    </div>
  );
}

function PanelTitle({ icon: Icon, title, subtitle }: { icon: ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}

function ExecutiveMetric({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  const valueClass =
    tone === "positive" ? "text-signal-positive" :
    tone === "caution" ? "text-signal-warning" :
    tone === "risk" ? "text-signal-risk" :
    "text-foreground";

  return (
    <div className="ios-control p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function FactTile({ label, value, verified }: { label: string; value: string; verified: boolean }) {
  return (
    <div className="ios-control p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Badge className={`shrink-0 border text-[10px] ${verified ? toneClass("positive") : toneClass("caution")}`}>
          {verified ? "Entered" : "Missing"}
        </Badge>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ActionLine({ text, tone }: { text: string; tone: Tone }) {
  return (
    <div className="ios-control flex items-start gap-3 p-3">
      {tone === "caution" ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-signal-warning" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      )}
      <p className="text-sm leading-5 text-foreground">{text}</p>
    </div>
  );
}

function StartAction({ title, body, to, action }: { title: string; body: string; to: string; action: string }) {
  return (
    <div className="ios-control p-4">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      <Button className="mt-4" asChild>
        <Link to={to}>
          {action} <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
