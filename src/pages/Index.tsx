import { Link } from "react-router-dom";
import type { ElementType } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Gauge,
  Home,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContainer } from "@/components/ui/card-container";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeals } from "@/hooks/useDeals";

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
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Command Center
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Active properties, missing facts, verification work, and the next action before capital is committed.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <Link to="/findiq">Find opportunities</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/dealiq/new">Add property</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/dealiq/compare">Compare deals</Link>
              </Button>
            </div>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-[430px]">
            <ExecutiveMetric label="Active deals" value={String(activeDeals.length)} tone="neutral" />
            <ExecutiveMetric label="Decision ready" value={String(readyCount)} tone="positive" />
            <ExecutiveMetric label="Need verification" value={String(needsVerification)} tone={needsVerification > 0 ? "caution" : "positive"} />
          </div>
        </div>
      </section>

      {activeDeals.length === 0 ? (
        <EmptyWorkspace />
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <CardContainer className="space-y-5">
              <PanelTitle
                icon={Target}
                title="Current Property"
                subtitle="Open the active file, fill missing facts, and decide what to verify next."
              />
              {primaryDeal && (
                <div className="rounded-lg border border-border bg-muted/25 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
                    <div className="min-w-[190px] rounded-md border border-border bg-background p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Readiness</span>
                        <span className={`text-xl font-black ${scoreText(primaryScore)}`}>{primaryScore}</span>
                      </div>
                      <Progress value={primaryScore} className="mt-2 h-2" />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3">
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
                  <Link to="/dealiq/compare">Compare deals</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/dealiq/new">Add property</Link>
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
                <div className="rounded-lg border border-signal-positive/25 bg-signal-positive/10 p-4">
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
                    <div key={item} className="flex items-start gap-2 rounded-md border border-signal-warning/25 bg-signal-warning/10 p-3 text-sm">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-signal-warning" />
                      <span className="capitalize text-foreground">{item} requires verification</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-lg border border-border bg-muted/25 p-4 text-sm leading-6 text-muted-foreground">
                BRIX can help structure the decision, but your buy/renegotiate/pass decision should stay provisional until source quality is strong enough.
              </div>
            </CardContainer>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <CardContainer className="space-y-4">
              <PanelTitle
                icon={BarChart3}
                title="Property Queue"
                subtitle="Your active properties, sorted by newest activity."
              />
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 text-left">Property</th>
                      <th className="hidden px-3 py-3 text-left md:table-cell">Strategy</th>
                      <th className="px-3 py-3 text-right">Readiness</th>
                      <th className="px-3 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDeals.slice(0, 6).map((deal) => {
                      const score = readinessScore(deal);
                      return (
                        <tr key={deal.id} className="border-t border-border">
                          <td className="px-3 py-3">
                            <p className="font-semibold text-foreground">{deal.property_address || "Unnamed property"}</p>
                            <p className="text-xs text-muted-foreground">{[deal.city, deal.state].filter(Boolean).join(", ") || "Location missing"}</p>
                          </td>
                          <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">{deal.strategy_primary ?? "Not selected"}</td>
                          <td className={`px-3 py-3 text-right font-black ${scoreText(score)}`}>{score}</td>
                          <td className="px-3 py-3 text-right">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/dealiq/${deal.id}`}>Open</Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
              <ActionLine tone="neutral" text="Keep screenshots, documents, and notes attached to the property file." />
            </CardContainer>
          </section>
        </>
      )}
    </div>
  );
}

function EmptyWorkspace() {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
      <CardContainer className="space-y-5">
        <PanelTitle
          icon={Home}
          title="Start Your First Analysis"
          subtitle="Begin with a property you are considering. BRIX will organize the facts, risks, strategy fit, and next actions."
        />
        <div className="grid gap-3 md:grid-cols-2">
          <StartAction
            title="1. Search a market"
            body="Use FindIQ when you want to define a location and acquisition criteria before adding a property."
            to="/findiq"
            action="Open FindIQ"
          />
          <StartAction
            title="2. Analyze a property"
            body="Use DealIQ when you already have a listing URL, screenshots, listing text, or property facts."
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

function PanelTitle({ icon: Icon, title, subtitle }: { icon: ElementType; title: string; subtitle: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
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
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tracking-tight ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function FactTile({ label, value, verified }: { label: string; value: string; verified: boolean }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
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
    <div className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
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
    <div className="rounded-lg border border-border bg-background p-4">
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
