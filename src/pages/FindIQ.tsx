import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  FileSearch,
  Gauge,
  GitCompareArrows,
  Home,
  MessageSquareText,
  Save,
  Search,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDeal } from "@/hooks/useDeals";
import {
  defaultAcquisitionProfile,
  opportunityToDealInsert,
  rankOpportunities,
  sampleOpportunities,
  type RankedOpportunity,
} from "@/lib/findIQArchitecture";

const currency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const fitTone = (fit: RankedOpportunity["fit"]) => {
  if (fit === "Strong Match") return "text-emerald-500";
  if (fit === "Good Match") return "text-primary";
  if (fit === "Watchlist") return "text-amber-500";
  return "text-red-500";
};

export default function FindIQ() {
  const navigate = useNavigate();
  const createDeal = useCreateDeal();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const profile = defaultAcquisitionProfile;
  const opportunities = useMemo(
    () => rankOpportunities(profile, sampleOpportunities).filter((item) => !hiddenIds.has(item.id)),
    [profile, hiddenIds],
  );

  const selected = opportunities.find((item) => item.id === selectedId) ?? opportunities[0];

  const toggleSaved = (id: string) => {
    setSavedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hideOpportunity = (id: string) => {
    setHiddenIds((current) => new Set(current).add(id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveToDealIQ = async (opportunity: RankedOpportunity) => {
    const deal = await createDeal.mutateAsync(opportunityToDealInsert(opportunity));
    toast.success("Opportunity moved to DealIQ for underwriting");
    navigate(`/dealiq/${deal.id}`);
  };

  return (
    <SectionContainer>
      <PageHeader
        title="FindIQ"
        description="Rank acquisition opportunities, identify missing data, and send selected properties into DealIQ for underwriting."
      >
        <Button variant="outline">
          <Bell className="h-4 w-4 mr-2" />
          Alerts
        </Button>
        <Button>
          <Search className="h-4 w-4 mr-2" />
          Run Search
        </Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <CardContainer className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <FileSearch className="h-4 w-4" />
                Acquisition Profile
              </div>
              <h2 className="mt-2 text-lg font-semibold text-foreground">{profile.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Properties are ranked against your criteria before deeper underwriting.</p>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <ProfileStat label="Budget" value={`${currency(profile.budgetMin)}-${currency(profile.budgetMax)}`} />
            <ProfileStat label="Property" value={profile.propertyTypes.join(", ")} />
            <ProfileStat label="Beds" value={`${profile.minBedrooms}+`} />
            <ProfileStat label="Baths" value={`${profile.minBathrooms}+`} />
            <ProfileStat label="Garage" value={profile.garageRequired ? "Required" : "Optional"} />
            <ProfileStat label="Taxes" value={`Prefer < ${currency(profile.preferredMaxTaxes)}`} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Target markets</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.markets.map((market) => (
                <Badge key={market} variant="outline" className="font-medium">
                  {market}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <h3 className="text-sm font-semibold text-foreground">Required potential</h3>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <CheckLine>Future rental potential required</CheckLine>
              <CheckLine>Future resale potential required</CheckLine>
              <CheckLine>Cosmetic value-add preferred</CheckLine>
            </div>
          </div>
        </CardContainer>

        <div className="space-y-4">
          <CardContainer>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Gauge className="h-4 w-4 text-primary" />
                  Opportunity ranking
                </div>
                <h2 className="mt-2 text-lg font-semibold text-foreground">Opportunity queue</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Scores prioritize what deserves attention. Full underwriting, offer logic, and acquisition memos happen after transfer to DealIQ.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniMetric label="Found" value={String(opportunities.length)} />
                <MiniMetric label="Strong" value={String(opportunities.filter((item) => item.fit === "Strong Match").length)} />
                <MiniMetric label="Watch" value={String(opportunities.filter((item) => item.fit === "Watchlist").length)} />
              </div>
            </div>
          </CardContainer>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <CardContainer className="overflow-hidden p-0">
              <div className="divide-y divide-border">
                {opportunities.map((opportunity) => (
                  <div
                    key={opportunity.id}
                    className={`w-full p-4 transition-colors hover:bg-muted/35 ${
                      selected.id === opportunity.id ? "bg-primary/5" : "bg-card"
                    }`}
                  >
                    <button type="button" className="w-full text-left" onClick={() => setSelectedId(opportunity.id)}>
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex h-28 w-full shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground md:w-36">
                        <Home className="h-8 w-8" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-foreground">{opportunity.address}</h3>
                          <Badge variant="outline">{opportunity.city}, {opportunity.state}</Badge>
                          <Badge variant={opportunity.fit === "Investigate Carefully" ? "destructive" : "secondary"}>
                            {opportunity.fit}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>{currency(opportunity.listPrice)}</span>
                          <span>{opportunity.bedrooms} bed / {opportunity.bathrooms} bath</span>
                          <span>{opportunity.squareFeet.toLocaleString()} sq ft</span>
                          <span>{opportunity.lotSize} lot</span>
                          <span>{opportunity.garage ? "Garage" : "No garage"}</span>
                          <span>{opportunity.daysOnMarket} DOM</span>
                          <span>{currency(opportunity.estimatedAnnualTaxes)} tax est.</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {opportunity.valueAddSignals.slice(0, 3).map((signal) => (
                            <Badge key={signal} variant="outline" className="font-medium">{signal}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="w-full shrink-0 md:w-32">
                        <div className={`text-right text-lg font-bold ${fitTone(opportunity.fit)}`}>{opportunity.score}</div>
                        <Progress value={opportunity.score} className="mt-2 h-2" />
                      </div>
                    </div>
                    </button>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                      <Button variant="outline" size="sm" onClick={() => setSelectedId(opportunity.id)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleSaved(opportunity.id)}>
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        {savedIds.has(opportunity.id) ? "Saved" : "Save"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate("/dealiq/compare")}>
                        <GitCompareArrows className="h-3.5 w-3.5 mr-1.5" />
                        Compare
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setNotes((current) => ({ ...current, [opportunity.id]: current[opportunity.id] ?? "" }))}>
                        <MessageSquareText className="h-3.5 w-3.5 mr-1.5" />
                        Notes
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => hideOpportunity(opportunity.id)} className="text-muted-foreground">
                        <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                        Hide
                      </Button>
                      <Button size="sm" onClick={() => moveToDealIQ(opportunity)} disabled={createDeal.isPending}>
                        Analyze in DealIQ
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    </div>
                    {Object.prototype.hasOwnProperty.call(notes, opportunity.id) && (
                      <Textarea
                        className="mt-3 min-h-20"
                        placeholder="Add acquisition notes, call details, or follow-up questions..."
                        value={notes[opportunity.id]}
                        onChange={(event) => setNotes((current) => ({ ...current, [opportunity.id]: event.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContainer>

            <CardContainer className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  <Home className="h-4 w-4" />
                  Selected Opportunity
                </div>
                <h2 className="mt-2 text-lg font-semibold text-foreground">{selected.address}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.city}, {selected.state} {selected.zip}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Opportunity Score</span>
                  <span className={`text-2xl font-bold ${fitTone(selected.fit)}`}>{selected.score}</span>
                </div>
                <Progress value={selected.score} className="mt-3 h-2" />
                <p className="mt-3 text-sm font-semibold text-foreground">{selected.nextAction}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Why it ranked here</h3>
                {selected.reasons.map((reason) => (
                  <CheckLine key={reason}>{reason}</CheckLine>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Risks and missing data</h3>
                {[...selected.risks, ...selected.missingData].slice(0, 5).map((item) => (
                  <RiskLine key={item}>{item}</RiskLine>
                ))}
              </div>

              <Button className="w-full" onClick={() => moveToDealIQ(selected)} disabled={createDeal.isPending}>
                Analyze in DealIQ
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContainer>
          </div>
        </div>
      </div>

      <CardContainer>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Database className="h-4 w-4" />
              Source Status
            </div>
            <h2 className="mt-2 text-lg font-semibold text-foreground">Current data coverage</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Free market sources are connected. Listing feeds, rent comps, sales comps, and ownership data still require paid or authorized providers before broad production search.
            </p>
          </div>
          <Badge variant="outline">Verification required</Badge>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <SourceTile title="Connected" body="FRED, Census ACS, BLS public data, and Census geocoding." tone="positive" />
          <SourceTile title="Manual verification" body="County records, listing facts, photos, inspections, and user-supplied comps." tone="caution" />
          <SourceTile title="Future paid feeds" body="RentCast, ATTOM, MLS, insurance risk, and richer property history." tone="neutral" />
        </div>
      </CardContainer>
    </SectionContainer>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}

function CheckLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-muted-foreground">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      <span>{children}</span>
    </div>
  );
}

function RiskLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-sm text-muted-foreground">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <span>{children}</span>
    </div>
  );
}

function SourceTile({ title, body, tone }: { title: string; body: string; tone: "positive" | "caution" | "neutral" }) {
  const toneClass =
    tone === "positive"
      ? "border-signal-positive/20 bg-signal-positive/10 text-signal-positive"
      : tone === "caution"
        ? "border-signal-warning/20 bg-signal-warning/10 text-signal-warning"
        : "border-border bg-muted/25 text-muted-foreground";

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
        </div>
        <ShieldCheck className={`h-4 w-4 shrink-0 ${toneClass.split(" ").find((item) => item.startsWith("text-"))}`} />
      </div>
    </div>
  );
}
