import { useMemo, useState, type DragEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, CheckCircle2, FileSearch, FileSpreadsheet, Home, Link2, MapPin, Plus, Search, ShieldAlert, SlidersHorizontal, Target, Upload, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateDeal, useDeals } from "@/hooks/useDeals";
import { supabase } from "@/integrations/supabase/client";
import { rankOpportunity, type AcquisitionProfile, type FindIQOpportunity, type RankedOpportunity } from "@/lib/findIQArchitecture";
import type { Json, Tables } from "@/integrations/supabase/types";

type DealRow = Tables<"deals">;

type SearchState = {
  location: string;
  budgetMin: string;
  budgetMax: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
};

type ManualListingState = {
  listingText: string;
  property_address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  beds: string;
  baths: string;
  square_feet: string;
  year_built: string;
  lot_size: string;
  purchase_price: string;
  monthly_rent: string;
  annual_property_tax: string;
  insurance: string;
  estimated_arv: string;
  strategy_primary: string;
  listing_url: string;
  listing_source: string;
  listing_photo_urls: string;
  condition_notes: string;
  visible_or_stated_risks: string;
  missing_questions: string;
  source_confidence: "low" | "medium" | "high";
  photo_analysis_status: string;
};

const initialSearch: SearchState = {
  location: "",
  budgetMin: "",
  budgetMax: "",
  propertyType: "",
  bedrooms: "",
  bathrooms: "",
};

const initialManualListing: ManualListingState = {
  listingText: "",
  property_address: "",
  city: "",
  state: "",
  zip_code: "",
  property_type: "",
  beds: "",
  baths: "",
  square_feet: "",
  year_built: "",
  lot_size: "",
  purchase_price: "",
  monthly_rent: "",
  annual_property_tax: "",
  insurance: "",
  estimated_arv: "",
  strategy_primary: "Buy & Hold",
  listing_url: "",
  listing_source: "",
  listing_photo_urls: "",
  condition_notes: "",
  visible_or_stated_risks: "",
  missing_questions: "",
  source_confidence: "low",
  photo_analysis_status: "not_requested",
};

export default function FindIQ() {
  const { data: deals, isLoading } = useDeals();
  const createDeal = useCreateDeal();
  const [search, setSearch] = useState<SearchState>(initialSearch);
  const [submittedSearch, setSubmittedSearch] = useState<SearchState | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [manualListing, setManualListing] = useState<ManualListingState>(initialManualListing);

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
  const workspaceDeals = deals ?? [];
  const importedDeals = workspaceDeals.filter((deal) => deal.listing_url || deal.listing_remarks || deal.listing_photo_urls);
  const readyForDealIQ = rankedOpportunities.filter((opportunity) => opportunity.score >= 75 && opportunity.missingData.length <= 2).length;

  const updateSearch = (key: keyof SearchState, value: string) => {
    setSearch((current) => ({ ...current, [key]: value }));
  };

  const updateManualListing = (key: keyof ManualListingState, value: string) => {
    setManualListing((current) => ({ ...current, [key]: value }));
  };

  const openImportIntake = (fields: Partial<ManualListingState>) => {
    const geography = parseSearchGeography(search.location);
    setManualListing((current) => ({
      ...current,
      city: fields.city || current.city || geography.city,
      state: fields.state || current.state || geography.state,
      zip_code: fields.zip_code || current.zip_code || geography.zip_code,
      property_type: fields.property_type || current.property_type || search.propertyType,
      ...fields,
    }));
    setIsAddOpen(true);
  };

  const openAddProperty = () => {
    const geography = parseSearchGeography(search.location);
    setManualListing((current) => ({
      ...current,
      city: current.city || geography.city,
      state: current.state || geography.state,
      zip_code: current.zip_code || geography.zip_code,
      property_type: current.property_type || search.propertyType,
    }));
    setIsAddOpen(true);
  };

  const applyListingText = () => {
    const parsed = parseListingText(manualListing.listingText);
    setManualListing((current) => ({ ...current, ...parsed }));
    toast.success("Listing text scanned. Review the fields before saving.");
  };

  const handleDroppedText = (text: string) => {
    if (!text.trim()) return;
    const fields = {
      listingText: text.trim(),
      ...parseListingText(text),
    };
    openImportIntake(fields);
    toast.success("Listing text loaded. Review the fields before saving.");
    void enrichWithPhotoAnalysis(fields).then((enriched) => {
      if (enriched !== fields) openImportIntake(enriched);
    });
  };

  const handleImportFile = async (file: File) => {
    try {
      const fields = await enrichWithPhotoAnalysis(await parseImportFile(file));
      openImportIntake(fields);
      toast.success(`${file.name} loaded. Review the fields before saving.`);
    } catch {
      toast.error("Could not read that file. Try CSV, XLS, XLSX, TXT, or paste the listing text.");
    }
  };

  const handleImportDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleImportFile(file);
      return;
    }

    const uri = event.dataTransfer.getData("text/uri-list");
    const text = event.dataTransfer.getData("text/plain");
    handleDroppedText(uri || text);
  };

  const saveManualListing = async (event: FormEvent) => {
    event.preventDefault();

    if (!manualListing.property_address.trim() || !manualListing.city.trim() || !manualListing.state.trim()) {
      toast.error("Address, city, and state are required.");
      return;
    }

    try {
      const deal = await createDeal.mutateAsync({
        property_address: manualListing.property_address.trim(),
        city: manualListing.city.trim(),
        state: manualListing.state.trim(),
        zip_code: manualListing.zip_code.trim() || undefined,
        property_type: manualListing.property_type.trim() || undefined,
        beds: parseNumber(manualListing.beds) ?? undefined,
        baths: parseNumber(manualListing.baths) ?? undefined,
        square_feet: parseNumber(manualListing.square_feet) ?? undefined,
        year_built: parseNumber(manualListing.year_built) ?? undefined,
        lot_size: manualListing.lot_size.trim() || undefined,
        purchase_price: parseNumber(manualListing.purchase_price) ?? undefined,
        monthly_rent: parseNumber(manualListing.monthly_rent) ?? undefined,
        annual_property_tax: parseNumber(manualListing.annual_property_tax) ?? undefined,
        taxes: parseNumber(manualListing.annual_property_tax) ?? undefined,
        insurance: parseNumber(manualListing.insurance) ?? undefined,
        estimated_arv: parseNumber(manualListing.estimated_arv) ?? undefined,
        strategy_primary: manualListing.strategy_primary.trim() || "Buy & Hold",
        listing_url: manualListing.listing_url.trim() || undefined,
        listing_source: manualListing.listing_source.trim() || inferListingSource(manualListing.listing_url),
        listing_remarks: manualListing.listingText.trim() || undefined,
        listing_photo_urls: splitLines(manualListing.listing_photo_urls) as Json,
        condition_notes: splitLines(manualListing.condition_notes) as Json,
        visible_or_stated_risks: splitLines(manualListing.visible_or_stated_risks) as Json,
        missing_questions: splitLines(manualListing.missing_questions) as Json,
        source_confidence: manualListing.source_confidence,
        photo_analysis_status: manualListing.photo_analysis_status,
        asset_type: "investment",
        deal_status: "draft",
      });

      const nextSearch = {
        ...search,
        location: [manualListing.city.trim(), manualListing.state.trim()].filter(Boolean).join(" ") || manualListing.zip_code.trim() || search.location,
        propertyType: manualListing.property_type.trim() || search.propertyType,
        budgetMax: search.budgetMax || manualListing.purchase_price.trim(),
      };

      setSearch(nextSearch);
      setSubmittedSearch(nextSearch);
      setManualListing(initialManualListing);
      setIsAddOpen(false);
      toast.success(`${deal.property_address} added to FindIQ.`);
    } catch {
      toast.error("Property was not saved. Check the required fields and try again.");
    }
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
        description="Source opportunities, import listings, rank deal files, and move the strongest candidates into DealIQ for underwriting."
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

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <CardContainer className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Opportunity Cockpit</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                Start with a place, then add the properties you want BRIX to rank.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                FindIQ ranks real property files in your workspace. You can enter a deal manually, drop a URL or spreadsheet, upload photos, or run a criteria search against saved records.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline">Manual entry</Badge>
                <Badge variant="outline">URL or listing text</Badge>
                <Badge variant="outline">CSV / XLS import</Badge>
                <Badge variant="outline">Phone photos</Badge>
              </div>
            </div>
            <div className="grid w-full grid-cols-3 gap-2 lg:w-[280px] lg:shrink-0">
              <MiniMetric label="Files" value={String(workspaceDeals.length)} />
              <MiniMetric label="Imported" value={String(importedDeals.length)} />
              <MiniMetric label="Ready" value={String(readyForDealIQ)} />
            </div>
          </div>
        </CardContainer>

        <CardContainer>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Faster than a spreadsheet</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                One saved property can flow into ranking, underwriting, comparison, offer work, pipeline status, and portfolio history without retyping the same facts.
              </p>
            </div>
          </div>
        </CardContainer>
      </section>

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[390px_minmax(0,1fr)]">
        <CardContainer className="space-y-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <FileSearch className="h-4 w-4" />
              Acquisition Search
            </div>
            <h2 className="mt-2 text-xl font-semibold text-foreground">Build the opportunity queue</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Search by state, ZIP code, county, or city. Add a listing URL, spreadsheet, copied text, or property photos when you already have a property.
            </p>
          </div>

          <div className="grid gap-2">
            <StartMethod icon={Search} title="Run a search" text="Rank your saved deal files against this location and buying criteria." />
            <StartMethod icon={Plus} title="Enter manually" text="Type property facts when you already know the deal you want to evaluate." />
            <StartMethod icon={Upload} title="Drop or import" text="Use a listing URL, copied text, CSV, XLS, or XLSX to start the deal file faster." />
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
          <Button className="w-full" variant="outline" onClick={openAddProperty}>
            Add Listing Manually
            <Plus className="ml-2 h-4 w-4" />
          </Button>

          <div
            className="rounded-lg border border-dashed border-primary/35 bg-primary/5 p-4 transition-colors hover:border-primary/60 hover:bg-primary/10"
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDrop={handleImportDrop}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Drop a listing, spreadsheet, or photos</h3>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Supports URLs, copied listing text, CSV, XLS, XLSX, and property photos. BRIX will prefill what it can and ask you to verify the rest.
                </p>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Choose file or photo
                  <input
                    type="file"
                    className="sr-only"
                    accept=".csv,.txt,.xls,.xlsx,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleImportFile(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                <label className="ml-4 mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80">
                  <Upload className="h-3.5 w-3.5" />
                  Use phone camera
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    capture="environment"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleImportFile(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
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
                  {submittedSearch ? "Ranked property results" : "Opportunity queue"}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Ranked results appear here after you run a search or save an imported property. Each result shows score, missing data, risks, and the path into DealIQ.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center lg:w-[260px] lg:shrink-0">
                <MiniMetric label="Found" value={String(rankedOpportunities.length)} />
                <MiniMetric label="Strong" value={String(strongMatches)} />
                <MiniMetric label="Needs data" value={String(needsVerification)} />
              </div>
            </div>
          </CardContainer>

          <CardContainer className="min-h-[360px] lg:min-h-[420px]">
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
                  <h3 className="text-xl font-semibold text-foreground">No properties match this search</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Add a property from a listing URL, listing text, screenshots, or manual facts, or widen the criteria and search again.
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
                  <Button onClick={openAddProperty}>
                    Add Manually
                    <Plus className="ml-2 h-4 w-4" />
                  </Button>
                  <Link to="/dealiq/new">
                    <Button variant="outline">
                      Open DealIQ Intake
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
                <h3 className="mt-4 text-xl font-semibold text-foreground">Build your opportunity queue</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Run a search against your deal files, add a listing manually, or import a listing file/photo to begin ranking.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button onClick={runSearch}>
                    Run Search
                    <Search className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={openAddProperty}>
                    Add Manually
                    <Plus className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContainer>

          <CardContainer>
            <div className="flex items-start gap-3">
              <Link2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Decision-ready intake</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Every imported property becomes a deal file with known facts, missing data, source confidence, photo findings, and verification questions.
                </p>
              </div>
            </div>
          </CardContainer>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a property to FindIQ</DialogTitle>
            <DialogDescription>
              Paste a listing URL, copied listing text, spreadsheet row, or enter the facts you know. BRIX saves this as a real DealIQ record and labels missing items for verification.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={saveManualListing}>
            <div className="space-y-2">
              <Label htmlFor="findiq-listing-text">Listing URL, remarks, or copied listing text</Label>
              <Textarea
                id="findiq-listing-text"
                value={manualListing.listingText}
                onChange={(event) => updateManualListing("listingText", event.target.value)}
                placeholder="Paste the listing URL, MLS remarks, broker notes, tax details, rent notes, or property description..."
                rows={5}
              />
              <Button type="button" variant="outline" onClick={applyListingText} disabled={!manualListing.listingText.trim()}>
                Scan Text Into Fields
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ManualField label="Property address" required value={manualListing.property_address} onChange={(value) => updateManualListing("property_address", value)} placeholder="123 Main St" />
              <ManualField label="City" required value={manualListing.city} onChange={(value) => updateManualListing("city", value)} placeholder="Sandwich" />
              <ManualField label="State" required value={manualListing.state} onChange={(value) => updateManualListing("state", value)} placeholder="IL" />
              <ManualField label="ZIP code" value={manualListing.zip_code} onChange={(value) => updateManualListing("zip_code", value)} placeholder="60548" />
              <ManualField label="Property type" value={manualListing.property_type} onChange={(value) => updateManualListing("property_type", value)} placeholder="Single Family" />
              <ManualField label="Strategy to test first" value={manualListing.strategy_primary} onChange={(value) => updateManualListing("strategy_primary", value)} placeholder="Buy & Hold" />
              <ManualField label="Beds" value={manualListing.beds} onChange={(value) => updateManualListing("beds", value)} placeholder="3" inputMode="decimal" />
              <ManualField label="Baths" value={manualListing.baths} onChange={(value) => updateManualListing("baths", value)} placeholder="2" inputMode="decimal" />
              <ManualField label="Square feet" value={manualListing.square_feet} onChange={(value) => updateManualListing("square_feet", value)} placeholder="1688" inputMode="numeric" />
              <ManualField label="Year built" value={manualListing.year_built} onChange={(value) => updateManualListing("year_built", value)} placeholder="1978" inputMode="numeric" />
              <ManualField label="Lot size" value={manualListing.lot_size} onChange={(value) => updateManualListing("lot_size", value)} placeholder="0.24 acres" />
              <ManualField label="Purchase price" value={manualListing.purchase_price} onChange={(value) => updateManualListing("purchase_price", value)} placeholder="249900" inputMode="numeric" />
              <ManualField label="Market or lease rent, monthly" value={manualListing.monthly_rent} onChange={(value) => updateManualListing("monthly_rent", value)} placeholder="2200" inputMode="numeric" />
              <ManualField label="Property taxes, annual" value={manualListing.annual_property_tax} onChange={(value) => updateManualListing("annual_property_tax", value)} placeholder="5140" inputMode="numeric" />
              <ManualField label="Insurance quote, annual" value={manualListing.insurance} onChange={(value) => updateManualListing("insurance", value)} placeholder="1800" inputMode="numeric" />
              <ManualField label="Estimated ARV" value={manualListing.estimated_arv} onChange={(value) => updateManualListing("estimated_arv", value)} placeholder="295000" inputMode="numeric" />
              <ManualField label="Listing URL" value={manualListing.listing_url} onChange={(value) => updateManualListing("listing_url", value)} placeholder="https://..." />
              <ManualField label="Listing source" value={manualListing.listing_source} onChange={(value) => updateManualListing("listing_source", value)} placeholder="Zillow, MLS, broker, county" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextReviewField
                label="Photo URLs"
                value={manualListing.listing_photo_urls}
                onChange={(value) => updateManualListing("listing_photo_urls", value)}
                placeholder="One direct image URL per line. BRIX will analyze accessible photos only."
              />
              <TextReviewField
                label="Condition notes from listing/photos"
                value={manualListing.condition_notes}
                onChange={(value) => updateManualListing("condition_notes", value)}
                placeholder="Visible or stated condition notes..."
              />
              <TextReviewField
                label="Visible or stated risks"
                value={manualListing.visible_or_stated_risks}
                onChange={(value) => updateManualListing("visible_or_stated_risks", value)}
                placeholder="Roof age unknown, water staining, as-is language..."
              />
              <TextReviewField
                label="Missing questions"
                value={manualListing.missing_questions}
                onChange={(value) => updateManualListing("missing_questions", value)}
                placeholder="What still needs verification?"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDeal.isPending}>
                {createDeal.isPending ? "Saving..." : "Save and Rank"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
  const photoUrls = jsonStringArray(deal.listing_photo_urls);
  const savedRisks = jsonStringArray(deal.visible_or_stated_risks);
  const savedQuestions = jsonStringArray(deal.missing_questions);
  const missingData = [
    !price && "Purchase price",
    !rent && "Rent support",
    !taxes && "Annual taxes",
    !deal.insurance && "Annual insurance",
    !deal.estimated_arv && !deal.arv && "After repair value",
    !deal.square_feet && "Square footage",
    photoUrls.length === 0 && "Property photos",
    ...(savedQuestions.length > 0 ? savedQuestions : []),
  ].filter(Boolean) as string[];

  const risks = [
    !rent && "Rent support requires verification",
    !deal.insurance && "Insurance quote requires verification",
    deal.photo_analysis_status === "blocked" && "Listing photos could not be downloaded; upload screenshots for visual review",
    ...savedRisks,
  ].filter(Boolean) as string[];

  return {
    id: deal.id,
    photoUrl: photoUrls[0] ?? "",
    address: deal.property_address,
    city: deal.city ?? "",
    state: deal.state ?? "",
    zip: deal.zip_code ?? "",
    propertyType,
    opportunityType: deal.deal_status === "draft" ? "Deal File" : deal.deal_status ?? "Deal File",
    listPrice: price,
    bedrooms: Number(deal.beds ?? 0),
    bathrooms: Number(deal.baths ?? 0),
    squareFeet: Number(deal.square_feet ?? 0),
    lotSize: deal.lot_size ?? "",
    garage: false,
    estimatedAnnualTaxes: taxes,
    rentalPotential: rent > 0 ? "moderate" : "unknown",
    resalePotential: deal.estimated_arv || deal.arv ? "moderate" : "unknown",
    valueAddSignals: deal.rehab_cost && deal.rehab_cost > 0 ? ["Rehab scope entered"] : [],
    risks,
    missingData,
    providerSignals: [deal.listing_source ?? "user_entered", deal.source_confidence].filter(Boolean),
    daysOnMarket: 0,
  };
}

function jsonStringArray(value: Json | null | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
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

function parseListingText(text: string): Partial<ManualListingState> {
  const cleaned = text.replace(/\r/g, "\n");
  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const joined = lines.join(" ");
  const addressLine = lines.find((line) => /\d{1,6}\s+[A-Za-z0-9.' -]+/.test(line) && !/^https?:\/\//i.test(line));
  const cityStateZip = joined.match(/\b([A-Za-z][A-Za-z .'-]+),\s*([A-Z]{2})\s*(\d{5})?\b/);
  const zip = joined.match(/\b\d{5}(?:-\d{4})?\b/);
  const price = joined.match(/(?:\$|price[:\s$]+)(\d[\d,]{4,})/i);
  const taxes = joined.match(/(?:tax(?:es)?|property tax(?:es)?)[^\d$]{0,20}\$?(\d[\d,]{2,})/i);
  const rent = joined.match(/(?:rent|lease)[^\d$]{0,20}\$?(\d[\d,]{2,})/i);
  const propertyType = joined.match(/\b(single family|duplex|triplex|fourplex|townhouse|condo|multi[- ]family|commercial|mixed use|land)\b/i);
  const listingUrl = joined.match(/https?:\/\/[^\s"'<>]+/i)?.[0] ?? "";
  const photoUrls = extractPhotoUrls(cleaned);
  const beds = joined.match(/\b(\d+(?:\.\d+)?)\s*(?:bed|beds|bd|bedrooms)\b/i);
  const baths = joined.match(/\b(\d+(?:\.\d+)?)\s*(?:bath|baths|ba|bathrooms)\b/i);
  const sqft = joined.match(/\b([\d,]+)\s*(?:sq\.?\s*ft|sqft|square feet)\b/i);
  const yearBuilt = joined.match(/(?:year built|built in|built)\D{0,12}(\d{4})/i);
  const lot = joined.match(/\b(\d+(?:\.\d+)?)\s*(?:acre|acres|ac)\b/i);
  const conditionNotes = inferConditionNotes(joined);
  const statedRisks = inferStatedRisks(joined);
  const missingQuestions = inferMissingQuestions({
    price: price?.[1],
    rent: rent?.[1],
    taxes: taxes?.[1],
    beds: beds?.[1],
    baths: baths?.[1],
    sqft: sqft?.[1],
    photoUrls,
  });

  return {
    property_address: addressLine ?? undefined,
    city: cityStateZip?.[1]?.trim() ?? undefined,
    state: cityStateZip?.[2]?.trim() ?? undefined,
    zip_code: cityStateZip?.[3] ?? zip?.[0] ?? undefined,
    purchase_price: price?.[1]?.replace(/,/g, "") ?? undefined,
    annual_property_tax: taxes?.[1]?.replace(/,/g, "") ?? undefined,
    monthly_rent: rent?.[1]?.replace(/,/g, "") ?? undefined,
    property_type: propertyType?.[1] ? normalizePropertyType(propertyType[1]) : undefined,
    beds: beds?.[1] ?? undefined,
    baths: baths?.[1] ?? undefined,
    square_feet: sqft?.[1]?.replace(/,/g, "") ?? undefined,
    year_built: yearBuilt?.[1] ?? undefined,
    lot_size: lot?.[0] ?? undefined,
    listing_url: listingUrl || undefined,
    listing_source: inferListingSource(listingUrl) || undefined,
    listing_photo_urls: photoUrls.join("\n") || undefined,
    condition_notes: conditionNotes.join("\n") || undefined,
    visible_or_stated_risks: statedRisks.join("\n") || undefined,
    missing_questions: missingQuestions.join("\n") || undefined,
    source_confidence: listingUrl || price || propertyType ? "medium" : "low",
  };
}

async function enrichWithPhotoAnalysis(fields: Partial<ManualListingState>): Promise<Partial<ManualListingState>> {
  const urls = splitLines(fields.listing_photo_urls ?? "").slice(0, 4);
  if (urls.length === 0) return fields;

  const conditionNotes = splitLines(fields.condition_notes ?? "");
  const risks = splitLines(fields.visible_or_stated_risks ?? "");
  const questions = splitLines(fields.missing_questions ?? "");
  let analyzed = 0;
  let blocked = 0;

  for (const url of urls) {
    try {
      const { data, error } = await supabase.functions.invoke("extract-deal-from-image", {
        body: { image_url: url },
      });
      if (error) throw error;
      const extracted = (data as { extracted?: VisualExtraction })?.extracted;
      if (!extracted) throw new Error("No visual extraction returned");

      analyzed += 1;
      conditionNotes.push(...(extracted.condition_notes ?? []).map((note) => `Photo: ${note}`));
      risks.push(...(extracted.visible_or_stated_risks ?? []).map((risk) => `Photo: ${risk}`));
      questions.push(...(extracted.missing_questions ?? []).map((question) => `Photo verification: ${question}`));
    } catch {
      blocked += 1;
    }
  }

  return {
    ...fields,
    condition_notes: uniqueLines(conditionNotes).join("\n"),
    visible_or_stated_risks: uniqueLines(risks).join("\n"),
    missing_questions: uniqueLines([
      ...questions,
      ...(blocked > 0 ? [`${blocked} listing photo URL${blocked === 1 ? "" : "s"} could not be downloaded. Upload screenshots/photos for visual analysis.`] : []),
    ]).join("\n"),
    photo_analysis_status: analyzed > 0 ? (blocked > 0 ? "partial" : "analyzed") : "blocked",
    source_confidence: analyzed > 0 ? "medium" : fields.source_confidence ?? "low",
  };
}

type VisualExtraction = {
  property_address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  property_type?: string | null;
  purchase_price?: number | null;
  estimated_arv?: number | null;
  monthly_rent?: number | null;
  annual_property_tax?: number | null;
  taxes?: number | null;
  insurance?: number | null;
  beds?: number | null;
  baths?: number | null;
  sqft?: number | null;
  year_built?: number | null;
  strategy_primary?: string | null;
  source_confidence?: "low" | "medium" | "high";
  condition_notes?: string[];
  visible_or_stated_risks?: string[];
  missing_questions?: string[];
};

async function parseImportFile(file: File): Promise<Partial<ManualListingState>> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (file.type.startsWith("image/")) {
    const imageBase64 = await readFileAsDataUrl(file);
    const { data, error } = await supabase.functions.invoke("extract-deal-from-image", {
      body: { image_base64: imageBase64 },
    });
    if (error) throw error;
    const extracted = (data as { extracted?: VisualExtraction })?.extracted;
    if (!extracted) throw new Error("No image extraction returned");
    return visualToManualFields(extracted, file.name);
  }

  if (extension === "xlsx" || extension === "xls") {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const firstRow = rows[0];
    if (!firstRow) throw new Error("Spreadsheet is empty");
    return parseTabularRow(firstRow);
  }

  const text = await file.text();
  if (extension === "csv") {
    const [headerLine, valueLine] = text.split(/\r?\n/).filter(Boolean);
    if (headerLine && valueLine) {
      return parseTabularRow(parseCsvFirstRow(headerLine, valueLine));
    }
  }

  return {
    listingText: text,
    ...parseListingText(text),
  };
}

function parseTabularRow(row: Record<string, unknown>): Partial<ManualListingState> {
  const normalized = Object.entries(row).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[normalizeHeader(key)] = String(value ?? "").trim();
    return acc;
  }, {});

  const pick = (...keys: string[]) => keys.map((key) => normalized[normalizeHeader(key)]).find(Boolean) ?? "";
  const joined = Object.values(normalized).filter(Boolean).join(" ");

  return {
    listingText: joined,
    property_address: pick("address", "property address", "street address", "full address"),
    city: pick("city", "municipality"),
    state: pick("state", "st"),
    zip_code: pick("zip", "zipcode", "zip code", "postal code"),
    property_type: normalizePropertyType(pick("property type", "type", "asset type")),
    beds: pick("beds", "bedrooms", "bed"),
    baths: pick("baths", "bathrooms", "bath"),
    square_feet: pick("sqft", "square feet", "sq ft", "living area").replace(/[$,\s]/g, ""),
    year_built: pick("year built", "built", "yr built"),
    lot_size: pick("lot", "lot size", "acres", "acreage"),
    purchase_price: pick("price", "list price", "asking price", "purchase price").replace(/[$,\s]/g, ""),
    monthly_rent: pick("rent", "monthly rent", "market rent", "lease rent").replace(/[$,\s]/g, ""),
    annual_property_tax: pick("taxes", "annual taxes", "property taxes", "tax").replace(/[$,\s]/g, ""),
    insurance: pick("insurance", "annual insurance", "insurance quote").replace(/[$,\s]/g, ""),
    estimated_arv: pick("arv", "estimated arv", "after repair value").replace(/[$,\s]/g, ""),
    strategy_primary: pick("strategy", "investment strategy") || undefined,
    listing_url: pick("listing url", "url", "source url") || undefined,
    listing_source: pick("source", "listing source", "provider") || inferListingSource(pick("listing url", "url", "source url")) || undefined,
    listing_photo_urls: splitPhotoCell(pick("photo urls", "photos", "image urls", "images")).join("\n") || undefined,
    condition_notes: pick("condition", "condition notes", "remarks", "description") || undefined,
    visible_or_stated_risks: pick("risks", "risk notes", "concerns") || undefined,
    missing_questions: pick("questions", "missing questions", "verification") || undefined,
    source_confidence: "medium",
  };
}

function parseCsvFirstRow(headerLine: string, valueLine: string) {
  const headers = parseCsvLine(headerLine);
  const values = parseCsvLine(valueLine);
  return headers.reduce<Record<string, string>>((acc, header, index) => {
    acc[header] = values[index] ?? "";
    return acc;
  }, {});
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function visualToManualFields(extracted: VisualExtraction, sourceName?: string): Partial<ManualListingState> {
  return {
    listingText: sourceName ? `Image upload: ${sourceName}` : "",
    property_address: extracted.property_address ?? undefined,
    city: extracted.city ?? undefined,
    state: extracted.state ?? undefined,
    zip_code: extracted.zip_code ?? undefined,
    property_type: extracted.property_type ?? undefined,
    beds: extracted.beds != null ? String(extracted.beds) : undefined,
    baths: extracted.baths != null ? String(extracted.baths) : undefined,
    square_feet: extracted.sqft != null ? String(extracted.sqft) : undefined,
    year_built: extracted.year_built != null ? String(extracted.year_built) : undefined,
    purchase_price: extracted.purchase_price != null ? String(extracted.purchase_price) : undefined,
    annual_property_tax: extracted.annual_property_tax != null || extracted.taxes != null ? String(extracted.annual_property_tax ?? extracted.taxes) : undefined,
    monthly_rent: extracted.monthly_rent != null ? String(extracted.monthly_rent) : undefined,
    insurance: extracted.insurance != null ? String(extracted.insurance) : undefined,
    estimated_arv: extracted.estimated_arv != null ? String(extracted.estimated_arv) : undefined,
    strategy_primary: extracted.strategy_primary ?? undefined,
    condition_notes: extracted.condition_notes?.join("\n") || undefined,
    visible_or_stated_risks: extracted.visible_or_stated_risks?.join("\n") || undefined,
    missing_questions: extracted.missing_questions?.join("\n") || undefined,
    source_confidence: extracted.source_confidence ?? "medium",
    photo_analysis_status: "analyzed",
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function extractPhotoUrls(text: string) {
  const imageUrlPattern = /https?:\/\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp|avif)(?:\?[^\s"'<>]*)?/gi;
  return uniqueLines(text.match(imageUrlPattern) ?? []);
}

function splitPhotoCell(value: string) {
  return uniqueLines(
    value
      .split(/[\n,;|]+/)
      .map((item) => item.trim())
      .filter((item) => /^https?:\/\//i.test(item)),
  );
}

function inferListingSource(url: string | undefined) {
  if (!url) return "";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("zillow")) return "Zillow";
    if (host.includes("redfin")) return "Redfin";
    if (host.includes("realtor")) return "Realtor.com";
    if (host.includes("mls")) return "MLS";
    return host;
  } catch {
    return "";
  }
}

function inferConditionNotes(text: string) {
  const notes: string[] = [];
  if (/cosmetic|paint|flooring|update|refresh|needs updating/i.test(text)) notes.push("Cosmetic or update opportunity mentioned.");
  if (/new roof|roof/i.test(text)) notes.push("Roof mentioned; verify age, condition, and insurability.");
  if (/new furnace|furnace|hvac|air conditioner|ac unit/i.test(text)) notes.push("HVAC/mechanical system mentioned; verify age and service history.");
  if (/basement|crawlspace|foundation/i.test(text)) notes.push("Foundation/basement/crawlspace mentioned; verify during inspection.");
  if (/as-is|as is/i.test(text)) notes.push("As-is language mentioned.");
  if (/fixer|rehab|needs work|tlc|handyman/i.test(text)) notes.push("Repair or rehab need mentioned.");
  return uniqueLines(notes);
}

function inferStatedRisks(text: string) {
  const risks: string[] = [];
  if (/as-is|as is/i.test(text)) risks.push("As-is sale language may shift condition risk to buyer.");
  if (/cash only|will not qualify|no fha|conventional only/i.test(text)) risks.push("Financing constraint mentioned.");
  if (/mold|water damage|leak|seepage|flood/i.test(text)) risks.push("Water/moisture concern mentioned; professional review required.");
  if (/foundation|structural|settling/i.test(text)) risks.push("Structural/foundation concern mentioned; professional review required.");
  if (/tenant occupied|lease in place|do not disturb/i.test(text)) risks.push("Occupancy or access constraint mentioned.");
  return uniqueLines(risks);
}

function inferMissingQuestions(input: {
  price?: string;
  rent?: string;
  taxes?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  photoUrls: string[];
}) {
  const questions: string[] = [];
  if (!input.price) questions.push("Verify purchase/list price.");
  if (!input.rent) questions.push("Verify market rent or current lease rent.");
  if (!input.taxes) questions.push("Verify annual property taxes from official records.");
  if (!input.beds || !input.baths || !input.sqft) questions.push("Verify beds, baths, and square footage.");
  if (input.photoUrls.length === 0) questions.push("Upload listing screenshots or property photos for visual condition triage.");
  questions.push("Verify insurance quote before relying on cash flow.");
  return uniqueLines(questions);
}

function splitLines(value: string) {
  return uniqueLines(value.split(/\r?\n|;|\|/).map((item) => item.trim()).filter(Boolean));
}

function uniqueLines(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function parseSearchGeography(value: string) {
  const trimmed = value.trim();
  const zipMatch = trimmed.match(/\b\d{5}(?:-\d{4})?\b/);
  const stateMatch = trimmed.match(/\b([A-Z]{2})\b/i);
  const city = trimmed
    .replace(/\b\d{5}(?:-\d{4})?\b/g, "")
    .replace(/\b[A-Z]{2}\b/gi, "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    city,
    state: stateMatch?.[1]?.toUpperCase() ?? "",
    zip_code: zipMatch?.[0] ?? "",
  };
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
    <div className="grid gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_240px] xl:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex min-w-0 gap-4">
        {opportunity.photoUrl ? (
          <div className="hidden h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/20 sm:block">
            <img src={opportunity.photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        ) : null}
        <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">{opportunity.address}</h3>
          <Badge variant="secondary">{opportunity.fit}</Badge>
          <Badge variant="outline">{opportunity.opportunityType}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {[opportunity.city, opportunity.state, opportunity.zip].filter(Boolean).join(", ")} - {money(opportunity.listPrice)} - {opportunity.propertyType}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {[
            opportunity.bedrooms ? `${opportunity.bedrooms} bed` : "",
            opportunity.bathrooms ? `${opportunity.bathrooms} bath` : "",
            opportunity.squareFeet ? `${opportunity.squareFeet.toLocaleString()} sq ft` : "",
            opportunity.lotSize,
          ].filter(Boolean).join(" - ") || "Physical details need verification"}
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

function ManualField({
  label,
  value,
  onChange,
  placeholder,
  required,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  inputMode?: "numeric" | "decimal";
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
      />
    </div>
  );
}

function TextReviewField({
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
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
      />
    </div>
  );
}

function StartMethod({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{text}</p>
      </div>
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
