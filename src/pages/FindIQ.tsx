import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, CheckCircle2, FileSearch, Home, MapPin, Search, ShieldAlert, SlidersHorizontal, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeals } from "@/hooks/useDeals";
import { rankOpportunity, type AcquisitionProfile, type FindIQOpportunity, type RankedOpportunity } from "@/lib/findIQArchitecture";
import type { Tables } from "@/integrations/supabase/types";

type DealRow = Tables<"deals">;

type SearchState = {
  location: string;
  budgetMin: string;
  budgetMax: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
};

const initialSearch: SearchState = {
  location: "",
  budgetMin: "",
  budgetMax: "",
  propertyType: "",
  bedrooms: "",
  bathrooms: "",
};

export default function FindIQ() {
  const { data: deals, isLoading } = useDeals();
  const [search, setSearch] = useState<SearchState>(initialSearch);
  const [submittedSearch, setSubmittedSearch] = useState<SearchState | null>(null);

  const hasLocation = search.location.trim().length > 0;
  const activeCriteria = useMemo(() => {
    const criteria = submittedSearch ?? search;

    return [
      criteria.location && `Location: ${criteria.location}`,
      criteria.budgetMin && `Min budget: ${criteria.budgetMin}`,
      criteria.budgetMax && `Max budget: ${criteria.budgetMax}`,
      criteria.propertyType && `Property: ${criteria.propertyType}`,
      criteria.bedrooms && `Beds: ${criteria.bedrooms}+`,
      criteria.bathrooms && `Baths: ${criteria.bathrooms}+`,
    ].filter(Boolean) as string[];
  }, [search, submittedSearch]);

  const rankedOpportunities = useMemo(() => {
    if (!submittedSearch) return [];
    const profile = searchToProfile(submittedSearch);
    return (deals ?? [])
      .map(dealToOpportunity)
      .filter((opportunity) => opportunityMatchesSearch(opportunity, submittedSearch))
      .map((opportunity) => rankOpportunity(profile, opportunity))
      .sort((a, b) => b.score - a.score);
  }, [deals, submittedSearch]);

  const strongMatches = rankedOpportunities.filter((opportunity) => opportunity.score >= 82).length;
  const needsVerification = rankedOpportunities.filter((opportunity) => opportunity.missingData.length > 0 || opportunity.risks.length > 0).length;

  const updateSearch = (key: keyof SearchState, value: string) => {
    setSearch((current) => ({ ...current, [key]: value }));
  };

  const runSearch = () => {
    if (!hasLocation) {
      toast.error("Enter a state, ZIP code, county, or city to start FindIQ.");
      return;
    }

    setSubmittedSearch({
      location: search.location.trim(),
      budgetMin: search.budgetMin.trim(),
      budgetMax: search.budgetMax.trim(),
      propertyType: search.propertyType.trim(),
      bedrooms: search.bedrooms.trim(),
      bathrooms: search.bathrooms.trim(),
    });
  };

  return (
    <SectionContainer>
      <PageHeader
        title="FindIQ"
        description="Search the properties already in your BRIX workspace, rank them against your buying criteria, and move the strongest candidates into DealIQ."
      >
        <Button variant="outline">
          <Bell className="mr-2 h-4 w-4" />
          Alerts
        </Button>
        <Button onClick={runSearch}>
          <Search className="mr-2 h-4 w-4" />
          Run Search
        </Button>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[390px_minmax(0,1fr)]">
        <CardContainer className="space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <FileSearch className="h-4 w-4" />
              Acquisition Search
            </div>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Choose where to look first</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Enter a state, ZIP code, county, or city. FindIQ ranks real BRIX property records; external live listing feeds require an authorized listing provider.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="findiq-location" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                Search geography
              </label>
              <Input
                id="findiq-location"
                className="mt-2"
                value={search.location}
                onChange={(event) => updateSearch("location", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") runSearch();
                }}
                placeholder="State, ZIP, county, or city"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <LabeledInput
                label="Min budget"
                value={search.budgetMin}
                onChange={(value) => updateSearch("budgetMin", value)}
                placeholder="$"
              />
              <LabeledInput
                label="Max budget"
                value={search.budgetMax}
                onChange={(value) => updateSearch("budgetMax", value)}
                placeholder="$"
              />
              <LabeledInput
                label="Property type"
                value={search.propertyType}
                onChange={(value) => updateSearch("propertyType", value)}
                placeholder="Single family"
              />
              <LabeledInput
                label="Bedrooms"
                value={search.bedrooms}
                onChange={(value) => updateSearch("bedrooms", value)}
                placeholder="3"
              />
              <LabeledInput
                label="Bathrooms"
                value={search.bathrooms}
                onChange={(value) => updateSearch("bathrooms", value)}
                placeholder="2"
              />
            </div>
          </div>

          <Button className="w-full" onClick={runSearch}>
            Run FindIQ Search
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContainer>

        <div className="space-y-4">
          <CardContainer>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Opportunity Queue
                </div>
                <h2 className="mt-2 text-lg font-semibold text-foreground">
                  {submittedSearch ? "Ranked property results" : "Start your search"}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Results come from your saved BRIX properties and imported listing records. Nothing here is demo data.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniMetric label="Found" value={String(rankedOpportunities.length)} />
                <MiniMetric label="Strong" value={String(strongMatches)} />
                <MiniMetric label="Needs data" value={String(needsVerification)} />
              </div>
            </div>
          </CardContainer>

          <CardContainer className="min-h-[420px]">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : submittedSearch && rankedOpportunities.length > 0 ? (
              <div className="divide-y divide-border">
                {rankedOpportunities.map((opportunity) => (
                  <OpportunityRow key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            ) : submittedSearch ? (
              <div className="flex min-h-[360px] flex-col justify-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/30">
                  <FileSearch className="h-6 w-6 text-primary" />
                </div>
                <div className="mx-auto mt-5 max-w-xl text-center">
                  <h3 className="text-xl font-semibold text-foreground">No matching BRIX properties yet</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Add or import a real property, then run FindIQ again. Free public sources can add market context, but active listing inventory requires an authorized provider connection.
                  </p>
                </div>
                <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
                  {activeCriteria.map((criterion) => (
                    <Badge key={criterion} variant="outline">
                      {criterion}
                    </Badge>
                  ))}
                </div>
                <div className="mx-auto mt-6 flex flex-wrap justify-center gap-3">
                  <Link to="/dealiq/new">
                    <Button>
                      Analyze a Property
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/dealiq">
                    <Button variant="outline">View DealIQ Records</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <Home className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold text-foreground">Start with a location</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Enter a geography and criteria to rank your BRIX property records. Use DealIQ to import a listing URL, screenshots, listing text, or documents.
                </p>
              </div>
            )}
          </CardContainer>

          <CardContainer>
            <div className="flex items-start gap-3">
              <Upload className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Import a property into BRIX</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Start in DealIQ with a listing URL, uploaded screenshots, property photos, or manually entered facts. FindIQ ranks those real records after they are saved.
                </p>
              </div>
            </div>
          </CardContainer>
        </div>
      </div>
    </SectionContainer>
  );
}

function searchToProfile(search: SearchState): AcquisitionProfile {
  const budgetMin = parseNumber(search.budgetMin) ?? 0;
  const budgetMax = parseNumber(search.budgetMax) ?? Number.MAX_SAFE_INTEGER;
  const propertyType = normalizePropertyType(search.propertyType);

  return {
    id: "active-findiq-search",
    name: "Active FindIQ Search",
    budgetMin,
    budgetMax,
    markets: search.location.trim().split(/[,\s]+/).filter(Boolean),
    propertyTypes: propertyType ? [propertyType] : [],
    minBedrooms: parseNumber(search.bedrooms) ?? 0,
    minBathrooms: parseNumber(search.bathrooms) ?? 0,
    garageRequired: false,
    preferredMaxTaxes: Number.MAX_SAFE_INTEGER,
    requiresFutureRentalPotential: false,
    requiresFutureResalePotential: false,
    preferredValueAdd: [],
  };
}

function dealToOpportunity(deal: DealRow): FindIQOpportunity {
  const price = deal.purchase_price ?? 0;
  const rent = deal.monthly_rent ?? 0;
  const taxes = deal.annual_property_tax ?? deal.taxes ?? 0;
  const propertyType = normalizePropertyType(deal.property_type ?? "") || "Unknown";
  const missingData = [
    !price && "Purchase price",
    !rent && "Rent support",
    !taxes && "Annual taxes",
    !deal.insurance && "Annual insurance",
    !deal.estimated_arv && !deal.arv && "After repair value",
  ].filter(Boolean) as string[];

  const risks = [
    !rent && "Rent support requires verification",
    !deal.insurance && "Insurance quote requires verification",
  ].filter(Boolean) as string[];

  return {
    id: deal.id,
    photoUrl: "",
    address: deal.property_address,
    city: deal.city ?? "",
    state: deal.state ?? "",
    zip: deal.zip_code ?? "",
    propertyType,
    opportunityType: deal.deal_status === "draft" ? "Workspace Property" : deal.deal_status ?? "Workspace Property",
    listPrice: price,
    bedrooms: 0,
    bathrooms: 0,
    squareFeet: 0,
    lotSize: deal.lot_size ?? "",
    garage: false,
    estimatedAnnualTaxes: taxes,
    rentalPotential: rent > 0 ? "moderate" : "unknown",
    resalePotential: deal.estimated_arv || deal.arv ? "moderate" : "unknown",
    valueAddSignals: deal.rehab_cost && deal.rehab_cost > 0 ? ["Rehab scope entered"] : [],
    risks,
    missingData,
    providerSignals: ["user_entered"],
    daysOnMarket: 0,
  };
}

function opportunityMatchesSearch(opportunity: FindIQOpportunity, search: SearchState) {
  const location = search.location.trim().toLowerCase();
  const propertyType = normalizePropertyType(search.propertyType);
  const minBudget = parseNumber(search.budgetMin);
  const maxBudget = parseNumber(search.budgetMax);

  const haystack = [opportunity.city, opportunity.state, opportunity.zip, opportunity.address]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const locationTokens = location.split(/[,\s]+/).filter(Boolean);
  const locationMatch = locationTokens.length === 0 || locationTokens.every((token) => haystack.includes(token));
  const typeMatch = !propertyType || opportunity.propertyType.toLowerCase().includes(propertyType.toLowerCase());
  const minMatch = minBudget == null || opportunity.listPrice >= minBudget;
  const maxMatch = maxBudget == null || opportunity.listPrice <= maxBudget;

  return locationMatch && typeMatch && minMatch && maxMatch;
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizePropertyType(value: string | null | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("single")) return "Single Family";
  if (normalized.includes("duplex")) return "Duplex";
  if (normalized.includes("triplex")) return "Triplex";
  if (normalized.includes("fourplex")) return "Fourplex";
  if (normalized.includes("multi")) return "Small Multifamily";
  if (normalized.includes("commercial")) return "Commercial";
  if (normalized.includes("land")) return "Land";
  if (normalized.includes("mixed")) return "Mixed Use";
  return value ?? "";
}

function OpportunityRow({ opportunity }: { opportunity: RankedOpportunity }) {
  return (
    <div className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{opportunity.address}</h3>
          <Badge variant="secondary">{opportunity.fit}</Badge>
          <Badge variant="outline">{opportunity.opportunityType}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {[opportunity.city, opportunity.state, opportunity.zip].filter(Boolean).join(", ")} - {money(opportunity.listPrice)} - {opportunity.propertyType}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {opportunity.reasons.map((reason) => (
            <Badge key={reason} variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-signal-positive" />
              {reason}
            </Badge>
          ))}
        </div>
        {opportunity.missingData.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {opportunity.missingData.map((item) => (
              <Badge key={item} variant="outline" className="border-signal-warning/40 text-signal-warning">
                <ShieldAlert className="mr-1 h-3 w-3" />
                {item}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-lg border border-border bg-muted/20 p-4">
        <p className="text-xs font-medium text-muted-foreground">Opportunity Score</p>
        <p className="mt-1 text-3xl font-bold text-signal-positive">{opportunity.score}</p>
        <p className="mt-2 text-sm font-medium text-foreground">{opportunity.nextAction}</p>
        <Link to={`/dealiq/${opportunity.id}`}>
          <Button className="mt-4 w-full">
            Analyze in DealIQ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

const money = (value: number | null | undefined) =>
  value != null && Number.isFinite(Number(value)) && Number(value) > 0
    ? Number(value).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "Price missing";

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground">{label}</label>
      <Input className="mt-1" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
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
