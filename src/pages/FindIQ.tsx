import { useMemo, useState, type DragEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Bell, Camera, CheckCircle2, ClipboardPaste, ExternalLink, FileSpreadsheet, Home, Image as ImageIcon, Plus, ShieldAlert, SlidersHorizontal, Target, Upload, XCircle } from "lucide-react";
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
import { openPropertyRecord } from "@/lib/property/propertyIntelligenceEngine";
import { resolveCountyPropertyUrl } from "@/lib/property/countyPropertyResolver";
import type { Json, Tables } from "@/integrations/supabase/types";

type DealRow = Tables<"deals">;

type SearchState = {
  location: string;
  budgetMin: string;
  budgetMax: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  strategy: string;
  excludedCounties: string;
  mustHaveKeywords: string;
  preferredKeywords: string;
  renovationTolerance: string;
};

type ManualListingState = {
  listingText: string;
  property_address: string;
  city: string;
  county: string;
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
  strategy: "",
  excludedCounties: "",
  mustHaveKeywords: "",
  preferredKeywords: "",
  renovationTolerance: "",
};

const initialManualListing: ManualListingState = {
  listingText: "",
  property_address: "",
  city: "",
  county: "",
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
  strategy_primary: "",
  listing_url: "",
  listing_source: "",
  listing_photo_urls: "",
  condition_notes: "",
  visible_or_stated_risks: "",
  missing_questions: "",
  source_confidence: "low",
  photo_analysis_status: "not_requested",
};

const STRATEGY_OPTIONS = [
  "Owner Occupant",
  "Buy & Hold",
  "House Hack",
  "Long-Term Rental",
  "Mid-Term Rental",
  "Short-Term Rental",
  "BRRRR",
  "Fix & Flip",
  "Seller Finance",
  "Subject-To",
  "Lease Option",
  "ADU / Value-Add",
  "Development",
  "1031 Exchange",
];

export default function FindIQ() {
  const navigate = useNavigate();
  const { data: deals, isLoading } = useDeals();
  const createDeal = useCreateDeal();
  const [search, setSearch] = useState<SearchState>(initialSearch);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [manualListing, setManualListing] = useState<ManualListingState>(initialManualListing);
  const [quickInput, setQuickInput] = useState("");
  const [quickStrategy, setQuickStrategy] = useState("");
  const [quickStage, setQuickStage] = useState<"property" | "strategy">("property");
  const [quickPropertyAddress, setQuickPropertyAddress] = useState("");
  const [isQuickScanning, setIsQuickScanning] = useState(false);

  const activeProfile = useMemo(() => searchToProfile(search), [search]);
  const profileMustHaves = useMemo(() => buildProfileRequirements(search), [search]);
  const profilePreferences = useMemo(() => splitProfileTerms(search.preferredKeywords), [search.preferredKeywords]);

  const rankedOpportunities = useMemo(() => {
    return (deals ?? [])
      .map(dealToOpportunity)
      .map((opportunity) => applyActiveProfileFit(rankOpportunity(activeProfile, opportunity), activeProfile, search))
      .sort((a, b) => b.score - a.score);
  }, [activeProfile, deals, search]);

  const strongMatches = rankedOpportunities.filter((opportunity) => opportunity.score >= 82).length;
  const needsVerification = rankedOpportunities.filter((opportunity) => opportunity.missingData.length > 0 || opportunity.risks.length > 0).length;
  const dealFiles = deals ?? [];
  const importedDeals = dealFiles.filter((deal) => deal.listing_url || deal.listing_remarks || deal.listing_photo_urls);
  const readyForDealIQ = rankedOpportunities.filter((opportunity) => opportunity.score >= 75 && opportunity.missingData.length <= 2).length;

  const updateManualListing = (key: keyof ManualListingState, value: string) => {
    setManualListing((current) => ({ ...current, [key]: value }));
  };

  const updateSearch = (key: keyof SearchState, value: string) => {
    setSearch((current) => ({ ...current, [key]: value }));
  };

  const openImportIntake = (fields: Partial<ManualListingState>) => {
    const geography = parseSearchGeography(search.location);
    setManualListing((current) => ({
      ...current,
      city: fields.city || current.city || geography.city,
      county: fields.county || current.county,
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
      county: current.county,
      state: current.state || geography.state,
      zip_code: current.zip_code || geography.zip_code,
      property_type: current.property_type || search.propertyType,
    }));
    setIsAddOpen(true);
  };

  const mergeManualFields = (fields: Partial<ManualListingState>) => {
    const scalarFields = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value !== undefined && value !== ""),
    ) as Partial<ManualListingState>;

    setManualListing((current) => ({
      ...current,
      ...scalarFields,
      listingText: uniqueLines([
        current.listingText,
        fields.listingText ?? "",
      ]).join("\n"),
      listing_photo_urls: uniqueLines([
        ...splitLines(current.listing_photo_urls),
        ...splitLines(fields.listing_photo_urls ?? ""),
      ]).join("\n"),
      condition_notes: uniqueLines([
        ...splitLines(current.condition_notes),
        ...splitLines(fields.condition_notes ?? ""),
      ]).join("\n"),
      visible_or_stated_risks: uniqueLines([
        ...splitLines(current.visible_or_stated_risks),
        ...splitLines(fields.visible_or_stated_risks ?? ""),
      ]).join("\n"),
      missing_questions: uniqueLines([
        ...splitLines(current.missing_questions),
        ...splitLines(fields.missing_questions ?? ""),
      ]).join("\n"),
      photo_analysis_status: fields.photo_analysis_status || current.photo_analysis_status,
      source_confidence: fields.source_confidence || current.source_confidence,
    }));
  };

  const applyListingText = () => {
    const parsed = parseListingText(manualListing.listingText);
    mergeManualFields(parsed);
    toast.success("Listing facts scanned into this property.");
  };

  const scanQuickInput = async () => {
    const text = quickInput.trim();
    if (!text) {
      toast.error("Paste a listing URL, listing text, email, notes, or property facts first.");
      return;
    }

    setIsQuickScanning(true);
    try {
      const listingUrl = text.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
      const { data, error } = await supabase.functions.invoke("extract-deal-from-text", {
        body: { listing_text: text, listing_url: listingUrl },
      });
      if (error) throw error;

      const extracted = (data as { extracted?: VisualExtraction })?.extracted;
      const deterministic = parseListingText(text);
      const aiFields = extracted ? visualToManualFields(extracted) : {};
      const warning = (data as { warning?: string })?.warning;
      const resolvedListingUrl = listingUrl ?? deterministic.listing_url;

      openImportIntake({
        ...deterministic,
        ...aiFields,
        listingText: text,
        listing_url: resolvedListingUrl,
        listing_source: inferListingSource(resolvedListingUrl) || deterministic.listing_source,
        missing_questions: uniqueLines([
          ...splitLines(deterministic.missing_questions ?? ""),
          ...splitLines(aiFields.missing_questions ?? ""),
        ]).join("\n"),
        visible_or_stated_risks: uniqueLines([
          ...splitLines(deterministic.visible_or_stated_risks ?? ""),
          ...splitLines(aiFields.visible_or_stated_risks ?? ""),
        ]).join("\n"),
      });
      if (warning) {
        toast.warning(warning);
      } else {
        toast.success("Fields extracted. Review before saving.");
      }
    } catch {
      const fields = parseListingText(text);
      openImportIntake({
        ...fields,
        listingText: text,
        listing_url: fields.listing_url || text.match(/https?:\/\/[^\s"'<>]+/i)?.[0],
      });
      toast.warning("AI extraction was unavailable. BRIX used deterministic parsing; review the fields carefully.");
    } finally {
      setIsQuickScanning(false);
    }
  };

  const startFromQuickInput = (event?: FormEvent) => {
    event?.preventDefault();
    const text = quickInput.trim();
    if (!text) {
      toast.error("Enter an address or paste a listing link first.");
      return;
    }

    const looksLikeListing = /https?:\/\//i.test(text) || text.length > 80 || text.includes("\n");
    if (looksLikeListing) {
      void scanQuickInput();
      return;
    }

    setQuickPropertyAddress(text);
    setQuickStage("strategy");
  };

  const createDealFromAddressStrategy = async (address: string, strategy: string) => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      toast.error("Enter the property address first.");
      return;
    }

    const listingUrl = trimmedAddress.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
    let parsed = parseListingText(trimmedAddress);
    let extractedFields: Partial<ManualListingState> = {};

    try {
      const { data, error } = await supabase.functions.invoke("extract-deal-from-text", {
        body: { listing_text: trimmedAddress, listing_url: listingUrl },
      });
      if (!error) {
        const extracted = (data as { extracted?: VisualExtraction })?.extracted;
        extractedFields = extracted ? visualToManualFields(extracted) : {};
        parsed = {
          ...parsed,
          ...Object.fromEntries(
            Object.entries(extractedFields).filter(([, value]) => typeof value === "string" && value.trim()),
          ),
        } as Partial<ManualListingState>;
      }
    } catch {
      // Provider or AI extraction may be unavailable. Keep the workflow moving with parsed or blank fields.
    }

    let propertyAddress = parsed.property_address || (listingUrl ? "" : trimmedAddress);
    let city = parsed.city || "";
    let state = parsed.state || "";
    let zip = parsed.zip_code || "";
    let county = parsed.county || "";

    try {
      const { data } = await supabase.functions.invoke("geocode-address", {
        body: { address: trimmedAddress },
      });
      const result = data as {
        found?: boolean;
        formatted_address?: string | null;
        city?: string | null;
        county?: string | null;
        state?: string | null;
        zip?: string | null;
      } | null;

      if (result?.found) {
        city = result.city || city;
        county = result.county || county;
        state = result.state || state;
        zip = result.zip || zip;
        propertyAddress = parsed.property_address || result.formatted_address?.split(",")[0] || propertyAddress;
      }
    } catch {
      // Fall back to parsed text and leave unsupported fields blank.
    }

    try {
      const deal = await createDeal.mutateAsync({
        property_address: propertyAddress || trimmedAddress,
        city: city || undefined,
        county: county || undefined,
        state: state || undefined,
        zip_code: zip || undefined,
        strategy_primary: strategy || undefined,
        listing_url: listingUrl || parsed.listing_url || undefined,
        listing_source: inferListingSource(listingUrl || parsed.listing_url),
        listing_remarks: listingUrl ? trimmedAddress : undefined,
        property_type: parsed.property_type || undefined,
        beds: parseNumber(parsed.beds),
        baths: parseNumber(parsed.baths),
        square_feet: parseNumber(parsed.square_feet),
        year_built: parseNumber(parsed.year_built),
        purchase_price: parseNumber(parsed.purchase_price),
        monthly_rent: parseNumber(parsed.monthly_rent),
        annual_property_tax: parseNumber(parsed.annual_property_tax),
        insurance: parseNumber(parsed.insurance),
        estimated_arv: parseNumber(parsed.estimated_arv),
        missing_questions: splitLines(parsed.missing_questions).length ? splitLines(parsed.missing_questions) as Json : [] as Json,
        condition_notes: splitLines(parsed.condition_notes).length ? splitLines(parsed.condition_notes) as Json : [] as Json,
        visible_or_stated_risks: splitLines(parsed.visible_or_stated_risks).length ? splitLines(parsed.visible_or_stated_risks) as Json : [] as Json,
        listing_photo_urls: splitLines(parsed.listing_photo_urls).length ? splitLines(parsed.listing_photo_urls) as Json : [] as Json,
        source_confidence: "low",
        photo_analysis_status: splitLines(parsed.listing_photo_urls).length ? "pending_review" : "not_requested",
        deal_status: "draft",
      });

      resetQuickWorkflow();
      setQuickInput("");
      toast.success(`${deal.property_address} created. Add evidence when ready.`);
      navigate(`/dealiq/${deal.id}`);
    } catch {
      toast.error("BRIX could not create the deal file. Try again or add the property manually.");
    }
  };

  const continueFromStrategy = async (event?: FormEvent) => {
    event?.preventDefault();
    await createDealFromAddressStrategy(quickPropertyAddress, quickStrategy);
  };

  const resetQuickWorkflow = () => {
    setQuickStage("property");
    setQuickPropertyAddress("");
    setQuickStrategy("");
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

  const handleEvidenceFiles = async (files: FileList | null) => {
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;

    let imported = 0;
    for (const file of selected) {
      try {
        const fields = await enrichWithPhotoAnalysis(await parseImportFile(file));
        mergeManualFields(fields);
        imported += 1;
      } catch {
        toast.error(`${file.name} could not be scanned.`);
      }
    }

    if (imported > 0) {
      toast.success(`${imported} file${imported === 1 ? "" : "s"} added to this property.`);
    }
  };

  const openCountyTaxRecords = () => {
    const address = manualListing.property_address.trim();
    const city = manualListing.city.trim();
    const state = manualListing.state.trim();
    if (!address || !city || !state) {
      toast.error("Add property address, city, and state first.");
      return;
    }

    const result = resolveCountyPropertyUrl({
      property_address: address,
      city,
      state,
      zip_code: manualListing.zip_code || undefined,
      county: manualListing.county || undefined,
    });
    openPropertyRecord(result.url);
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

    if (!manualListing.property_address.trim()) {
      toast.error("Enter at least the property address. City, state, pricing, photos, and notes can be added as you verify the deal.");
      return;
    }

    try {
      const verified = await verifyManualListingLocation(manualListing);
      const verificationQuestions = splitLines(verified.missing_questions ?? manualListing.missing_questions);
      const verificationRisks = splitLines(verified.visible_or_stated_risks ?? manualListing.visible_or_stated_risks);
      const conditionNotes = splitLines(verified.condition_notes ?? manualListing.condition_notes);

      const deal = await createDeal.mutateAsync({
        property_address: verified.property_address.trim(),
        city: verified.city.trim(),
        county: verified.county.trim() || undefined,
        state: verified.state.trim(),
        zip_code: verified.zip_code.trim() || undefined,
        property_type: verified.property_type.trim() || undefined,
        beds: parseNumber(verified.beds) ?? undefined,
        baths: parseNumber(verified.baths) ?? undefined,
        square_feet: parseNumber(verified.square_feet) ?? undefined,
        year_built: parseNumber(verified.year_built) ?? undefined,
        lot_size: verified.lot_size.trim() || undefined,
        purchase_price: parseNumber(verified.purchase_price) ?? undefined,
        monthly_rent: parseNumber(verified.monthly_rent) ?? undefined,
        annual_property_tax: parseNumber(verified.annual_property_tax) ?? undefined,
        taxes: parseNumber(verified.annual_property_tax) ?? undefined,
        insurance: parseNumber(verified.insurance) ?? undefined,
        estimated_arv: parseNumber(verified.estimated_arv) ?? undefined,
        strategy_primary: verified.strategy_primary.trim() || search.strategy.trim() || undefined,
        listing_url: verified.listing_url.trim() || undefined,
        listing_source: verified.listing_source.trim() || inferListingSource(verified.listing_url),
        listing_remarks: verified.listingText.trim() || undefined,
        listing_photo_urls: splitLines(manualListing.listing_photo_urls) as Json,
        condition_notes: conditionNotes as Json,
        visible_or_stated_risks: verificationRisks as Json,
        missing_questions: verificationQuestions as Json,
        source_confidence: verified.source_confidence,
        photo_analysis_status: verified.photo_analysis_status,
        asset_type: `${verified.strategy_primary} ${search.strategy}`.toLowerCase().includes("owner") ? "owner_occupied" : undefined,
        deal_status: "draft",
      });

      setManualListing(initialManualListing);
      resetQuickWorkflow();
      setQuickInput("");
      setIsAddOpen(false);
      toast.success(`${deal.property_address} added to FindIQ.`);
    } catch {
      toast.error("Property was not saved. Check the required fields and try again.");
    }
  };

  return (
    <SectionContainer>
      <PageHeader
        title="FindIQ"
        description="Start a deal file with an address and the strategy you want to test."
      />

      <section className="mx-auto max-w-3xl">
        <CardContainer className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void createDealFromAddressStrategy(quickInput, quickStrategy);
            }}
          >
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Start a property</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                BRIX creates the deal file first. Add photos, tax history, missing facts, and source documents inside DealIQ.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="findiq-quick-input">Property address or listing link</Label>
              <Input
                id="findiq-quick-input"
                value={quickInput}
                onChange={(event) => setQuickInput(event.target.value)}
                className="h-12 text-base"
                aria-label="Property address or listing link"
              />
            </div>

            <div className="space-y-2">
              <Label>Strategy</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {STRATEGY_OPTIONS.map((strategy) => {
                  const selected = quickStrategy === strategy;
                  return (
                    <button
                      key={strategy}
                      type="button"
                      onClick={() => setQuickStrategy(strategy)}
                      className={`rounded-lg border px-3 py-3 text-left text-sm font-semibold transition-colors ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-background hover:border-primary/50 hover:bg-primary/10"
                      }`}
                      aria-pressed={selected}
                    >
                      {strategy}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={createDeal.isPending}>
              {createDeal.isPending ? "Creating deal..." : "Create deal file"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContainer>
      </section>

      {false && (
        <>

      <section>
        <CardContainer className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />
          <div className="flex flex-col gap-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Start property</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Address or listing link</h2>
            </div>

            {quickStage === "property" ? (
              <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={startFromQuickInput}>
                <div className="space-y-2">
                  <Label htmlFor="findiq-quick-input">Address or listing link</Label>
                  <Input
                    id="findiq-quick-input"
                    value={quickInput}
                    onChange={(event) => setQuickInput(event.target.value)}
                    className="h-12 text-base"
                    aria-label="Address or listing link"
                  />
                </div>
                <Button type="submit" size="lg" disabled={isQuickScanning} className="self-end">
                  {isQuickScanning ? "Reading..." : "Next"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            ) : (
              <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)_auto]" onSubmit={continueFromStrategy}>
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Input value={quickPropertyAddress} readOnly className="h-12 bg-muted/40 text-base" aria-label="Selected property address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="findiq-quick-strategy">Strategy to test</Label>
                  <Input
                    id="findiq-quick-strategy"
                    value={quickStrategy}
                    onChange={(event) => setQuickStrategy(event.target.value)}
                    className="h-12 text-base"
                    aria-label="Strategy to test"
                  />
                </div>
                <div className="flex gap-2 self-end">
                  <Button type="button" variant="outline" size="lg" onClick={resetQuickWorkflow}>
                    Back
                  </Button>
                  <Button type="submit" size="lg">
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            <div className="grid w-full grid-cols-3 gap-2">
              <MiniMetric label="Deal files" value={String(dealFiles.length)} />
              <MiniMetric label="Imported" value={String(importedDeals.length)} />
              <MiniMetric label="Ready" value={String(readyForDealIQ)} />
            </div>
          </div>
        </CardContainer>
      </section>

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[390px_minmax(0,1fr)]">
        <CardContainer className="space-y-5">
          <details className="rounded-xl border border-border bg-muted/10 p-3">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="h-4 w-4 text-primary" />
              Buying criteria
            </summary>
            <div className="mt-3 grid gap-3">
              <ManualField label="Strategy" value={search.strategy} onChange={(value) => updateSearch("strategy", value)} />
              <ManualField label="Search geography" value={search.location} onChange={(value) => updateSearch("location", value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <ManualField label="Min budget" value={search.budgetMin} onChange={(value) => updateSearch("budgetMin", value)} inputMode="numeric" />
                <ManualField label="Max budget" value={search.budgetMax} onChange={(value) => updateSearch("budgetMax", value)} inputMode="numeric" />
              </div>
              <ManualField label="Property type" value={search.propertyType} onChange={(value) => updateSearch("propertyType", value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <ManualField label="Minimum bedrooms" value={search.bedrooms} onChange={(value) => updateSearch("bedrooms", value)} inputMode="decimal" />
                <ManualField label="Minimum bathrooms" value={search.bathrooms} onChange={(value) => updateSearch("bathrooms", value)} inputMode="decimal" />
              </div>
              <ManualField label="Excluded counties or areas" value={search.excludedCounties} onChange={(value) => updateSearch("excludedCounties", value)} />
              <ManualField label="Must-have words" value={search.mustHaveKeywords} onChange={(value) => updateSearch("mustHaveKeywords", value)} />
              <ManualField label="Preferred words" value={search.preferredKeywords} onChange={(value) => updateSearch("preferredKeywords", value)} />
              <ManualField label="Renovation tolerance" value={search.renovationTolerance} onChange={(value) => updateSearch("renovationTolerance", value)} />
            </div>
          </details>

          <div className="grid gap-3 sm:grid-cols-2">
            <ProfileList title="Must have" items={profileMustHaves.length > 0 ? profileMustHaves : ["No criteria set"]} icon="must" />
            <ProfileList title="Preferred" items={profilePreferences.length > 0 ? profilePreferences : ["No preferences set"]} icon="prefer" />
          </div>

          <div
            className="rounded-lg border border-dashed border-primary/35 bg-muted/10 p-4 transition-colors hover:border-primary/60 hover:bg-primary/10"
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
                <h3 className="text-sm font-semibold text-foreground">Drag, upload, or use your camera</h3>
                <div className="mt-3 flex flex-wrap gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Choose file/photo
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
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80">
                    <Upload className="h-3.5 w-3.5" />
                    Phone camera
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
          </div>

          <Button className="w-full" variant="outline" onClick={openAddProperty}>
            Enter Property Manually
            <Plus className="ml-2 h-4 w-4" />
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
                  {rankedOpportunities.length > 0 ? "Ranked property results" : "Opportunity queue"}
                </h2>
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
            ) : rankedOpportunities.length > 0 ? (
              <div className="divide-y divide-border">
                {rankedOpportunities.map((opportunity) => (
                  <OpportunityRow key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <Home className="h-10 w-10 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold text-foreground">No properties yet</h3>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button onClick={() => document.getElementById("findiq-quick-input")?.focus()}>
                    Paste Listing
                    <ClipboardPaste className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContainer>
        </div>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a property to FindIQ</DialogTitle>
            <DialogDescription>
              Add the property once. BRIX will scan what it can, keep unsupported fields blank, and carry the record into DealIQ.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={saveManualListing}>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-2">
                <Label htmlFor="findiq-listing-text">Address, listing link, copied facts, or notes</Label>
                <Textarea
                  id="findiq-listing-text"
                  value={manualListing.listingText}
                  onChange={(event) => updateManualListing("listingText", event.target.value)}
                  rows={5}
                />
                <Button type="button" variant="outline" onClick={applyListingText} disabled={!manualListing.listingText.trim()}>
                  Scan into property
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Photos & evidence</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add listing screenshots, drive-by photos, inspection photos, or spreadsheets.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                    <Upload className="h-4 w-4" />
                    Upload files/photos
                    <input
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".csv,.txt,.xls,.xlsx,text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*"
                      onChange={(event) => {
                        void handleEvidenceFiles(event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/50">
                    <Camera className="h-4 w-4" />
                    Use camera
                    <input
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      capture="environment"
                      onChange={(event) => {
                        void handleEvidenceFiles(event.target.files);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  <Button type="button" variant="outline" className="justify-center gap-2" onClick={openCountyTaxRecords}>
                    <ExternalLink className="h-4 w-4" />
                    Open county tax record
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ManualField label="Property address" required value={manualListing.property_address} onChange={(value) => updateManualListing("property_address", value)} />
              <ManualField label="City" value={manualListing.city} onChange={(value) => updateManualListing("city", value)} />
              <ManualField label="State" value={manualListing.state} onChange={(value) => updateManualListing("state", value)} />
              <ManualField label="County" value={manualListing.county} onChange={(value) => updateManualListing("county", value)} />
              <ManualField label="ZIP code" value={manualListing.zip_code} onChange={(value) => updateManualListing("zip_code", value)} />
              <ManualField label="Property type" value={manualListing.property_type} onChange={(value) => updateManualListing("property_type", value)} />
              <ManualField label="Strategy to test first" value={manualListing.strategy_primary} onChange={(value) => updateManualListing("strategy_primary", value)} />
              <ManualField label="Beds" value={manualListing.beds} onChange={(value) => updateManualListing("beds", value)} inputMode="decimal" />
              <ManualField label="Baths" value={manualListing.baths} onChange={(value) => updateManualListing("baths", value)} inputMode="decimal" />
              <ManualField label="Square feet" value={manualListing.square_feet} onChange={(value) => updateManualListing("square_feet", value)} inputMode="numeric" />
              <ManualField label="Year built" value={manualListing.year_built} onChange={(value) => updateManualListing("year_built", value)} inputMode="numeric" />
              <ManualField label="Lot size" value={manualListing.lot_size} onChange={(value) => updateManualListing("lot_size", value)} />
              <ManualField label="Purchase price" value={manualListing.purchase_price} onChange={(value) => updateManualListing("purchase_price", value)} inputMode="numeric" />
              <ManualField label="Market or lease rent, monthly" value={manualListing.monthly_rent} onChange={(value) => updateManualListing("monthly_rent", value)} inputMode="numeric" />
              <ManualField label="Property taxes, annual" value={manualListing.annual_property_tax} onChange={(value) => updateManualListing("annual_property_tax", value)} inputMode="numeric" />
              <ManualField label="Insurance quote, annual" value={manualListing.insurance} onChange={(value) => updateManualListing("insurance", value)} inputMode="numeric" />
              <ManualField label="Estimated ARV" value={manualListing.estimated_arv} onChange={(value) => updateManualListing("estimated_arv", value)} inputMode="numeric" />
              <ManualField label="Listing URL" value={manualListing.listing_url} onChange={(value) => updateManualListing("listing_url", value)} />
              <ManualField label="Listing source" value={manualListing.listing_source} onChange={(value) => updateManualListing("listing_source", value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <EvidenceList
                title="Photos captured"
                empty="No photos attached yet."
                items={splitLines(manualListing.listing_photo_urls)}
                image
              />
              <EvidenceList
                title="BRIX findings"
                empty="No photo or listing findings yet."
                items={[
                  ...splitLines(manualListing.condition_notes),
                  ...splitLines(manualListing.visible_or_stated_risks),
                ]}
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
        </>
      )}
    </SectionContainer>
  );
}

function searchToProfile(search: SearchState): AcquisitionProfile {
  const budgetMin = parseNumber(search.budgetMin) ?? 0;
  const budgetMax = parseNumber(search.budgetMax) ?? Number.MAX_SAFE_INTEGER;
  const propertyType = normalizePropertyType(search.propertyType);
  const geographyTerms = splitProfileTerms(search.location);

  return {
    id: "active-findiq-search",
    name: search.strategy.trim() || "Active Buying Profile",
    budgetMin,
    budgetMax,
    markets: geographyTerms,
    propertyTypes: propertyType ? [propertyType] : [],
    minBedrooms: parseNumber(search.bedrooms) ?? 0,
    minBathrooms: parseNumber(search.bathrooms) ?? 0,
    garageRequired: false,
    preferredMaxTaxes: Number.MAX_SAFE_INTEGER,
    requiresFutureRentalPotential: false,
    requiresFutureResalePotential: false,
    preferredValueAdd: splitProfileTerms(search.preferredKeywords),
  };
}

async function verifyManualListingLocation(listing: ManualListingState): Promise<ManualListingState> {
  const address = [
    listing.property_address,
    listing.city,
    listing.state,
    listing.zip_code,
  ].filter(Boolean).join(", ");

  if (address.trim().length < 8) return listing;

  try {
    const { data, error } = await supabase.functions.invoke("geocode-address", {
      body: { address },
    });
    if (error) throw error;

    const result = data as {
      found?: boolean;
      source?: string;
      source_quality?: string;
      formatted_address?: string | null;
      city?: string | null;
      county?: string | null;
      state?: string | null;
      zip?: string | null;
    };

    if (!result.found) {
      return {
        ...listing,
        missing_questions: uniqueLines([
          ...splitLines(listing.missing_questions),
          "Verify address and county from an official source; geocoder did not return a match.",
        ]).join("\n"),
      };
    }

    const notes = uniqueLines([
      ...splitLines(listing.condition_notes),
      `Address checked against ${result.source ?? "official geocoder"}${result.source_quality ? ` (${result.source_quality})` : ""}.`,
    ]);

    return {
      ...listing,
      city: listing.city || result.city || "",
      county: listing.county || result.county?.replace(/\s+County$/i, "") || "",
      state: listing.state || result.state || "",
      zip_code: listing.zip_code || result.zip || "",
      condition_notes: notes.join("\n"),
      source_confidence: listing.source_confidence === "low" ? "medium" : listing.source_confidence,
    };
  } catch {
    return {
      ...listing,
      missing_questions: uniqueLines([
        ...splitLines(listing.missing_questions),
        "Verify address/county manually; official geocoding was unavailable at save time.",
      ]).join("\n"),
    };
  }
}

function dealToOpportunity(deal: DealRow): FindIQOpportunity {
  const price = deal.purchase_price ?? 0;
  const rent = deal.monthly_rent ?? 0;
  const taxes = deal.annual_property_tax ?? deal.taxes ?? 0;
  const propertyType = normalizePropertyType(deal.property_type ?? "") || "Unknown";
  const photoUrls = jsonStringArray(deal.listing_photo_urls);
  const savedRisks = jsonStringArray(deal.visible_or_stated_risks);
  const savedQuestions = jsonStringArray(deal.missing_questions);
  const conditionNotes = jsonStringArray(deal.condition_notes);
  const searchableText = [
    deal.property_address,
    deal.city,
    deal.county,
    deal.state,
    deal.property_type,
    deal.listing_remarks,
    ...conditionNotes,
    ...savedRisks,
    ...savedQuestions,
  ].filter(Boolean).join(" ");
  const county = deal.county ?? extractCounty(searchableText);
  const propertySignals = inferPropertySignals(searchableText);
  const missingData = [
    !price && "Purchase price",
    !deal.county && "County verification",
    !taxes && "Annual taxes",
    !deal.insurance && "Annual insurance",
    !deal.square_feet && "Square footage",
    photoUrls.length === 0 && "Property photos",
    ...(savedQuestions.length > 0 ? savedQuestions : []),
  ].filter(Boolean) as string[];

  const risks = [
    !deal.insurance && "Insurance quote requires verification",
    propertySignals.heavyReno && "Renovation risk: listing suggests more than light renovation.",
    deal.photo_analysis_status === "blocked" && "Listing photos could not be downloaded; upload screenshots for visual review",
    ...savedRisks,
  ].filter(Boolean) as string[];

  return {
    id: deal.id,
    photoUrl: photoUrls[0] ?? "",
    address: deal.property_address,
    city: deal.city ?? "",
    county: county ?? "",
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
    valueAddSignals: [
      propertySignals.ranchConfirmed && "Ranch layout",
      propertySignals.basementConfirmed === true && "Basement",
      propertySignals.lightReno && "Light renovation potential",
      deal.rehab_cost && deal.rehab_cost > 0 && "Rehab scope entered",
    ].filter(Boolean) as string[],
    risks,
    missingData,
    providerSignals: deal.listing_photo_urls ? ["user_entered", "uploaded_image"] : ["user_entered"],
    daysOnMarket: 0,
  };
}

function jsonStringArray(value: Json | null | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function applyActiveProfileFit(opportunity: RankedOpportunity, profile: AcquisitionProfile, search: SearchState): RankedOpportunity {
  let score = opportunity.score;
  const reasons = [...opportunity.reasons];
  const risks = [...opportunity.risks];
  const missingData = [...opportunity.missingData];
  const signals = inferPropertySignals([
    opportunity.address,
    opportunity.city,
    opportunity.county,
    opportunity.state,
    opportunity.propertyType,
    opportunity.valueAddSignals.join(" "),
    opportunity.risks.join(" "),
    opportunity.missingData.join(" "),
  ].filter(Boolean).join(" "));

  const county = opportunity.county ?? "";
  const city = opportunity.city ?? "";
  const combinedText = [
    opportunity.address,
    opportunity.city,
    opportunity.county,
    opportunity.state,
    opportunity.propertyType,
    opportunity.valueAddSignals.join(" "),
    opportunity.risks.join(" "),
    opportunity.missingData.join(" "),
  ].filter(Boolean).join(" ").toLowerCase();
  const excludedTerms = splitProfileTerms(search.excludedCounties);
  const mustHaveTerms = splitProfileTerms(search.mustHaveKeywords);
  const preferredTerms = splitProfileTerms(search.preferredKeywords);
  const hasBudgetCap = profile.budgetMax < Number.MAX_SAFE_INTEGER;
  const heavyRenoNotAllowed = /light|cosmetic|minor/i.test(search.renovationTolerance);

  for (const term of excludedTerms) {
    if (!term) continue;
    const normalizedTerm = term.toLowerCase().replace(/\s+county$/, "");
    const matched =
      combinedText.includes(term.toLowerCase()) ||
      (!!county && county.toLowerCase().includes(normalizedTerm));
    if (matched) {
      score -= 45;
      risks.push(`Pass trigger: ${term} is excluded by this profile.`);
    } else if (county && /county/i.test(term)) {
      score += 5;
      reasons.push(`${county} County does not match the excluded county term "${term}".`);
    }
  }

  if (excludedTerms.some((term) => /county/i.test(term)) && !county) {
    missingData.push("County must be verified against excluded areas.");
  }

  if (hasBudgetCap && opportunity.listPrice > profile.budgetMax) {
    score -= 35;
    risks.push(`Pass trigger: price is above the ${money(profile.budgetMax)} cap.`);
  } else if (hasBudgetCap && opportunity.listPrice > 0) {
    score += 12;
    reasons.push(`Price is under the ${money(profile.budgetMax)} cap.`);
  }

  if (profile.minBedrooms > 0 && opportunity.bedrooms >= profile.minBedrooms) {
    score += 12;
    reasons.push(`Bedroom count meets the ${profile.minBedrooms}+ bedroom requirement.`);
  } else if (profile.minBedrooms > 0 && opportunity.bedrooms > 0) {
    score -= 25;
    risks.push(`Pass trigger unless flexible: fewer than ${profile.minBedrooms} bedrooms.`);
  } else if (profile.minBedrooms > 0) {
    missingData.push("Bedroom count must be verified.");
  }

  if (profile.minBathrooms > 0 && opportunity.bathrooms >= profile.minBathrooms) {
    score += 10;
    reasons.push(`Bathroom count meets the ${profile.minBathrooms}+ bath requirement.`);
  } else if (profile.minBathrooms > 0 && opportunity.bathrooms > 0) {
    score -= 22;
    risks.push(`Pass trigger unless flexible: fewer than ${profile.minBathrooms} bathrooms.`);
  } else if (profile.minBathrooms > 0) {
    missingData.push("Bathroom count must be verified.");
  }

  const locationMatched = profile.markets.some((market) => {
    const lower = market.toLowerCase();
    return [opportunity.city, opportunity.county, opportunity.state, opportunity.zip, opportunity.address]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(lower));
  });
  if (profile.markets.length > 0 && locationMatched) {
    score += 10;
    reasons.push("Location appears to match the active buying geography.");
  } else if (profile.markets.length > 0 && city) {
    missingData.push("Verify location/commute fit against the active buying profile.");
  }

  for (const term of mustHaveTerms) {
    const matches = combinedText.includes(term.toLowerCase());
    if (matches) {
      score += 8;
      reasons.push(`Must-have appears present: ${term}.`);
    } else {
      missingData.push(`Must-have not confirmed: ${term}.`);
    }
  }

  for (const term of preferredTerms) {
    const matches = combinedText.includes(term.toLowerCase());
    if (matches) {
      score += 5;
      reasons.push(`Preference appears present: ${term}.`);
    }
  }

  if (signals.lightReno && /light|cosmetic|minor/i.test(search.renovationTolerance)) {
    score += 6;
    reasons.push("Renovation language appears within the stated tolerance.");
  }

  if (signals.heavyReno && heavyRenoNotAllowed) {
    score -= 20;
    risks.push("Renovation may exceed the stated tolerance.");
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const fit =
    boundedScore >= 82
      ? "Strong Match"
      : boundedScore >= 70
        ? "Good Match"
        : boundedScore >= 55
          ? "Watchlist"
          : "Investigate Carefully";

  const passTrigger = risks.some((risk) => /Pass trigger/i.test(risk));
  return {
    ...opportunity,
    score: boundedScore,
    fit,
    reasons: uniqueLines(reasons).slice(0, 6),
    risks: uniqueLines(risks),
    missingData: uniqueLines(missingData),
    nextAction: passTrigger
      ? "Do not visit unless the flagged constraint is wrong or negotiable"
      : fit === "Strong Match" || fit === "Good Match"
        ? "Review in DealIQ before scheduling a visit"
        : "Verify missing fit items before spending drive time",
  };
}

function buildProfileRequirements(search: SearchState) {
  return uniqueLines([
    search.location && `Location/geography: ${search.location}`,
    search.budgetMax && `Max price: ${money(parseNumber(search.budgetMax) ?? 0)}`,
    search.propertyType && `Property type: ${search.propertyType}`,
    search.bedrooms && `Minimum bedrooms: ${search.bedrooms}`,
    search.bathrooms && `Minimum bathrooms: ${search.bathrooms}`,
    search.excludedCounties && `Exclude: ${search.excludedCounties}`,
    ...splitProfileTerms(search.mustHaveKeywords),
  ].filter(Boolean) as string[]);
}

function splitProfileTerms(value: string) {
  return uniqueLines(
    value
      .split(/[,;\n|]+/)
      .map((item) => item.trim())
      .filter(Boolean),
  );
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
  const county = extractCounty(joined);
  const zip = joined.match(/\b\d{5}(?:-\d{4})?\b/);
  const price = joined.match(/(?:\$|price[:\s$]+)(\d[\d,]{4,})/i);
  const taxes = joined.match(/(?:tax(?:es)?|property tax(?:es)?)[^\d$]{0,20}\$?(\d[\d,]{2,})/i);
  const rent = joined.match(/(?:rent|lease)[^\d$]{0,20}\$?(\d[\d,]{2,})/i);
  const propertyType = joined.match(/\b(single family|duplex|triplex|fourplex|townhouse|condo|multi[- ]family|commercial|mixed use|land)\b/i);
  const listingUrl = joined.match(/https?:\/\/[^\s"'<>]+/i)?.[0] ?? "";
  const urlParts = parseListingUrlParts(listingUrl);
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
    property_address: addressLine ?? urlParts.property_address ?? undefined,
    city: cityStateZip?.[1]?.trim() ?? urlParts.city ?? undefined,
    county: county ?? undefined,
    state: cityStateZip?.[2]?.trim() ?? urlParts.state ?? undefined,
    zip_code: cityStateZip?.[3] ?? zip?.[0] ?? urlParts.zip_code ?? undefined,
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

function parseListingUrlParts(url: string | undefined): Partial<ManualListingState> {
  if (!url) return {};
  try {
    const parsed = new URL(url);
    const homeDetailsMarker = "/homedetails/";
    const path = decodeURIComponent(parsed.pathname);
    const markerIndex = path.indexOf(homeDetailsMarker);
    if (markerIndex === -1) return {};

    const slug = path
      .slice(markerIndex + homeDetailsMarker.length)
      .split("/")[0]
      .replace(/_zpid.*$/i, "")
      .replace(/\d+_zpid.*$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!slug) return {};
    const parts = slug.split(" ");
    const zip = /^\d{5}$/.test(parts.at(-1) ?? "") ? parts.at(-1) : "";
    const state = zip ? parts.at(-2) ?? "" : "";
    const city = zip ? parts.at(-3) ?? "" : "";
    const addressParts = zip ? parts.slice(0, -3) : parts;

    return {
      property_address: addressParts.join(" ") || undefined,
      city: city || undefined,
      state: state || undefined,
      zip_code: zip || undefined,
    };
  } catch {
    return {};
  }
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
  county?: string | null;
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
  photo_urls?: string[];
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
    return {
      ...visualToManualFields(extracted, file.name),
      listing_photo_urls: imageBase64,
    };
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
    county: pick("county", "county name"),
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
    county: extracted.county ?? undefined,
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
    listing_photo_urls: extracted.photo_urls?.join("\n") || undefined,
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
    if (host.includes("mls")) return "MLS";
    return "Public listing URL";
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
  risks.push(...inferLocationFrictionRisks(text));
  return uniqueLines(risks);
}

function extractCounty(text: string) {
  const match = text.match(/\b([A-Za-z][A-Za-z .'-]{1,40})\s+County\b/i);
  if (!match?.[1]) return "";
  return match[1]
    .replace(/\b(county|il|illinois)\b/gi, "")
    .replace(/[,.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferPropertySignals(text: string) {
  const normalized = text.toLowerCase();
  const noBasement = /\b(no basement|slab|crawlspace only)\b/i.test(text);
  const basementMentioned = /\b(basement|full basement|partial basement|finished basement|unfinished basement)\b/i.test(text);
  return {
    ranchConfirmed: /\b(ranch|single[-\s]?story|one[-\s]?story|1[-\s]?story|all on one level)\b/i.test(text),
    basementConfirmed: noBasement ? false : basementMentioned ? true : null,
    lightReno: /\b(light renovation|lite renovation|cosmetic|fresh paint|paint|flooring|refresh|needs updating|updates needed|minor repairs|tlc)\b/i.test(text),
    heavyReno: /\b(gut rehab|full rehab|major rehab|tear down|teardown|structural|foundation issue|fire damage|mold|not habitable|cash only|will not qualify)\b/i.test(normalized),
  };
}

function inferLocationFrictionRisks(text: string) {
  const risks: string[] = [];
  if (/\b(busy road|busy street|main road|main street|high traffic|traffic noise|road noise|commuter route)\b/i.test(text)) {
    risks.push("Location access concern: listing text suggests busy-road or traffic-noise exposure. Verify street context before visiting.");
  }
  if (/\b(highway|expressway|interstate|state route|county highway|us route|il route|route \d+|rt\.?\s*\d+)\b/i.test(text)) {
    risks.push("Location access concern: possible highway or route exposure. Check ingress, egress, noise, and tenant/resale impact.");
  }
  if (/\b(railroad|rail line|train tracks|tracks nearby)\b/i.test(text)) {
    risks.push("Location friction concern: nearby rail exposure mentioned. Verify noise, safety, and resale impact.");
  }
  if (/\b(no parking|limited parking|shared driveway|easement|private road)\b/i.test(text)) {
    risks.push("Access/parking constraint mentioned. Verify daily usability, tenant demand, and resale impact.");
  }
  return risks;
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
  questions.push("Check map/street context for road noise, access friction, parking, and nearby traffic corridors before visiting.");
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
        {opportunity.risks.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {opportunity.risks.slice(0, 4).map((item) => (
              <Badge key={item} variant="outline" className="border-destructive/40 text-destructive">
                <AlertTriangle className="mr-1 h-3 w-3" />
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

function ManualField({
  label,
  value,
  onChange,
  required,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
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
        required={required}
        inputMode={inputMode}
      />
    </div>
  );
}

function EvidenceList({
  title,
  empty,
  items,
  image = false,
}: {
  title: string;
  empty: string;
  items: string[];
  image?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : image ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {items.slice(0, 6).map((item, index) => (
            <div key={`${item}-${index}`} className="aspect-square overflow-hidden rounded-lg border border-border bg-background">
              <img src={item} alt="" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {items.slice(0, 6).map((item) => (
            <div key={item} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileList({ title, items, icon }: { title: string; items: string[]; icon: "must" | "prefer" }) {
  const Icon = icon === "must" ? XCircle : CheckCircle2;
  const tone = icon === "must" ? "text-signal-warning" : "text-signal-positive";

  return (
    <div className="rounded-xl border border-border bg-muted/15 p-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} />
            <span>{item}</span>
          </div>
        ))}
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
