import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, FileSearch, Home, MapPin, Search, SlidersHorizontal, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [search, setSearch] = useState<SearchState>(initialSearch);
  const [submittedSearch, setSubmittedSearch] = useState<SearchState | null>(null);

  const hasLocation = search.location.trim().length > 0;
  const activeCriteria = useMemo(() => {
    if (!submittedSearch) return [];

    return [
      submittedSearch.location && `Location: ${submittedSearch.location}`,
      submittedSearch.budgetMin && `Min budget: ${submittedSearch.budgetMin}`,
      submittedSearch.budgetMax && `Max budget: ${submittedSearch.budgetMax}`,
      submittedSearch.propertyType && `Property: ${submittedSearch.propertyType}`,
      submittedSearch.bedrooms && `Beds: ${submittedSearch.bedrooms}+`,
      submittedSearch.bathrooms && `Baths: ${submittedSearch.bathrooms}+`,
    ].filter(Boolean) as string[];
  }, [submittedSearch]);

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
        description="Start with a location and buying criteria. Add real properties when you are ready to compare and analyze them."
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
              Enter a state, ZIP code, county, or city. Only properties you add or import will appear in your opportunity list.
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
                  {submittedSearch ? "Ready for properties" : "Start your search"}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Add a listing URL, screenshots, listing text, or property facts. BRIX will rank only the properties in your workspace.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MiniMetric label="Found" value="0" />
                <MiniMetric label="Ready" value="0" />
                <MiniMetric label="Needs data" value={submittedSearch ? "1" : "0"} />
              </div>
            </div>
          </CardContainer>

          <CardContainer className="min-h-[420px]">
            {submittedSearch ? (
              <div className="flex min-h-[360px] flex-col justify-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-muted/30">
                  <FileSearch className="h-6 w-6 text-primary" />
                </div>
                <div className="mx-auto mt-5 max-w-xl text-center">
                  <h3 className="text-xl font-semibold text-foreground">No properties added yet</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Your search criteria are saved for this session. Add the first property to begin ranking, comparison, and DealIQ analysis.
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
                  Enter a geography and acquisition criteria to begin. BRIX will keep the queue empty until real opportunity data exists.
                </p>
              </div>
            )}
          </CardContainer>

          <CardContainer>
            <div className="flex items-start gap-3">
              <Upload className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Add real opportunity data</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Start in DealIQ with a listing URL, uploaded screenshots, property photos, or manually entered facts. FindIQ will rank opportunities once properties are in your workspace.
                </p>
              </div>
            </div>
          </CardContainer>
        </div>
      </div>
    </SectionContainer>
  );
}

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
