import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardPaste, Home, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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

const STRATEGY_OPTIONS = [
  "Owner Occupant",
  "Buy & Hold",
  "House Hack",
  "Long-Term Rental",
  "Mid-Term Rental",
  "Short-Term Rental",
  "BRRRR",
  "Hybrid BRRRR",
  "Fix & Flip",
  "Refinance",
  "Hold",
  "Sell",
  "Seller Finance",
  "Subject-To",
  "Lease Option",
  "Wrap Mortgage",
  "ADU / Value-Add",
  "Lot Split",
  "Mixed Use Conversion",
  "Commercial Repositioning",
  "Development",
  "1031 Exchange",
];

export default function FindIQ() {
  const navigate = useNavigate();
  const { data: deals, isLoading } = useDeals();
  const createDeal = useCreateDeal();
  const [search] = useState<SearchState>(initialSearch);
  const [quickInput, setQuickInput] = useState("");
  const [quickStrategy, setQuickStrategy] = useState("");
  const [quickStage, setQuickStage] = useState<"property" | "strategy">("property");
  const [quickPropertyAddress, setQuickPropertyAddress] = useState("");
  const [quickParsedFields, setQuickParsedFields] = useState<Partial<ManualListingState>>({});
  const [isQuickScanning, setIsQuickScanning] = useState(false);

  const activeProfile = useMemo(() => searchToProfile(search), [search]);

  const rankedOpportunities = useMemo(() => {
    return (deals ?? [])
      .map(dealToOpportunity)
      .map((opportunity) => applyActiveProfileFit(rankOpportunity(activeProfile, opportunity), activeProfile, search))
      .sort((a, b) => b.score - a.score);
  }, [activeProfile, deals, search]);

  const strongMatches = rankedOpportunities.filter((opportunity) => opportunity.score >= 82).length;
  const needsVerification = rankedOpportunities.filter((opportunity) => opportunity.missingData.length > 0 || opportunity.risks.length > 0).length;
  const dealFiles = deals ?? [];
  const readyForDealIQ = rankedOpportunities.filter((opportunity) => opportunity.score >= 75 && opportunity.missingData.length <= 2).length;

  const startFromQuickInput = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = quickInput.trim();
    if (!text) {
      toast.error("Enter an address or paste a listing link first.");
      return;
    }

    setIsQuickScanning(true);
    try {
      const parsed = parseListingText(text);
      const listingUrl = text.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
      const urlParts = parseListingUrlParts(listingUrl);
      const merged = {
        ...urlParts,
        ...Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== undefined && value !== "")),
      } as Partial<ManualListingState>;
      const displayAddress = formatPropertyIdentity(merged) || text;
      setQuickParsedFields(merged);
      setQuickPropertyAddress(displayAddress);
    } finally {
      setIsQuickScanning(false);
    }
    setQuickStage("strategy");
  };

  const createDealFromAddressStrategy = async (address: string, strategy: string) => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      toast.error("Enter the property address first.");
      return;
    }
    if (!strategy.trim()) {
      toast.error("Choose the strategy to test first.");
      return;
    }

    const listingUrl = trimmedAddress.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
    let parsed = {
      ...parseListingText(trimmedAddress),
      ...Object.fromEntries(Object.entries(quickParsedFields).filter(([, value]) => value !== undefined && value !== "")),
    } as Partial<ManualListingState>;
    let extractedFields: Partial<ManualListingState> = {};
    const loadingToast = toast.loading("Creating deal file...");
    setIsQuickScanning(true);

    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke("extract-deal-from-text", {
          body: { listing_text: trimmedAddress, listing_url: listingUrl },
        }),
        9000,
      );
      if (!error) {
        const extracted = normalizeExtractionResponse(data);
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

    if (splitLines(parsed.listing_photo_urls ?? "").length > 0) {
      try {
        parsed = {
          ...parsed,
          ...(await enrichWithPhotoAnalysis(parsed)),
        };
      } catch {
        parsed = {
          ...parsed,
          photo_analysis_status: "blocked",
          missing_questions: uniqueLines([
            ...splitLines(parsed.missing_questions ?? ""),
            "Listing photos could not be analyzed automatically. Upload listing screenshots or drive-by photos in DealIQ.",
          ]).join("\n"),
        };
      }
    }

    const urlParts = parseListingUrlParts(listingUrl);
    let propertyAddress = parsed.property_address || urlParts.property_address || (listingUrl ? "" : trimmedAddress);
    let city = parsed.city || "";
    let state = parsed.state || "";
    let zip = parsed.zip_code || "";
    let county = parsed.county || "";

    if (listingUrl) {
      city ||= urlParts.city || "";
      state ||= urlParts.state || "";
      zip ||= urlParts.zip_code || "";
    }

    const geocodeTarget = [propertyAddress, city, state, zip].filter(Boolean).join(", ") || (listingUrl ? "" : trimmedAddress);
    if (geocodeTarget) {
      try {
        const { data } = await withTimeout(
          supabase.functions.invoke("geocode-address", {
            body: { address: geocodeTarget },
          }),
          6500,
        );
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
    }

    try {
      const deal = await createDeal.mutateAsync({
        property_address: propertyAddress || trimmedAddress,
        city: city || "",
        county: county || undefined,
        state: state || "",
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
        taxes: parseNumber(parsed.annual_property_tax),
        insurance: parseNumber(parsed.insurance),
        estimated_arv: parseNumber(parsed.estimated_arv),
        missing_questions: splitLines(parsed.missing_questions).length ? splitLines(parsed.missing_questions) as Json : [] as Json,
        condition_notes: splitLines(parsed.condition_notes).length ? splitLines(parsed.condition_notes) as Json : [] as Json,
        visible_or_stated_risks: splitLines(parsed.visible_or_stated_risks).length ? splitLines(parsed.visible_or_stated_risks) as Json : [] as Json,
        listing_photo_urls: splitLines(parsed.listing_photo_urls).length ? splitLines(parsed.listing_photo_urls) as Json : [] as Json,
        source_confidence: parsed.source_confidence || (listingUrl ? "medium" : "low"),
        photo_analysis_status: parsed.photo_analysis_status || (splitLines(parsed.listing_photo_urls).length ? "listing_photos_found" : "not_requested"),
        deal_status: "draft",
      });

      resetQuickWorkflow();
      setQuickInput("");
      toast.success(`${deal.property_address} created. Add evidence when ready.`);
      navigate(`/dealiq/${deal.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "BRIX could not create the deal file.");
    } finally {
      toast.dismiss(loadingToast);
      setIsQuickScanning(false);
    }
  };

  const continueFromStrategy = async (event?: FormEvent) => {
    event?.preventDefault();
    await createDealFromAddressStrategy(quickInput || quickPropertyAddress, quickStrategy);
  };

  const resetQuickWorkflow = () => {
    setQuickStage("property");
    setQuickPropertyAddress("");
    setQuickStrategy("");
    setQuickParsedFields({});
  };

  return (
    <SectionContainer>
      <PageHeader
        title="FindIQ"
        description="Start a deal file with an address and the strategy you want to test."
      />

      <section>
        <CardContainer className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />
          <div className="flex flex-col gap-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Deal intake</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Address or listing link</h2>
            </div>

            {quickStage === "property" ? (
              <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={startFromQuickInput}>
                <div className="space-y-2">
                  <Label htmlFor="findiq-quick-input">Property address or listing link</Label>
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
              <form className="grid gap-4" onSubmit={continueFromStrategy}>
                <div className="space-y-2">
                  <Label>Property</Label>
                  <Input value={quickPropertyAddress} readOnly className="h-12 bg-muted/40 text-base" aria-label="Selected property address" />
                </div>
                <div className="space-y-2">
                  <Label>Strategy to test</Label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="lg" onClick={resetQuickWorkflow}>
                    Back
                  </Button>
                  <Button type="submit" size="lg" disabled={!quickStrategy.trim() || isQuickScanning || createDeal.isPending}>
                    {isQuickScanning || createDeal.isPending ? "Creating..." : "Create deal file"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            <div className="grid w-full grid-cols-2 gap-2">
              <MiniMetric label="Deal files" value={String(dealFiles.length)} />
              <MiniMetric label="Ready" value={String(readyForDealIQ)} />
            </div>
          </div>
        </CardContainer>
      </section>

      <div className="grid gap-4">
        <div className="space-y-4">
          <CardContainer>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4 text-primary" />
                  Opportunity Queue
                </div>
                <h2 className="mt-2 text-lg font-semibold text-foreground">
                  {rankedOpportunities.length > 0 ? "Ranked properties" : "Deal queue"}
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
                <h3 className="mt-4 text-xl font-semibold text-foreground">No deal files yet</h3>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button onClick={() => document.getElementById("findiq-quick-input")?.focus()}>
                    Start
                    <ClipboardPaste className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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
    const slugCandidates = decodeURIComponent(parsed.pathname)
      .split("/")
      .filter(Boolean)
      .map((segment) =>
        segment
          .replace(/_zpid.*$/i, "")
          .replace(/\d+_zpid.*$/i, "")
          .replace(/\b(?:home|homes|details|property|real-estate|for-sale|listing|listings|house|houses)\b/gi, " ")
          .replace(/[-_]+/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter((segment) => /\d{1,6}\s+\S+/.test(segment) || /\b[A-Z]{2}\s+\d{5}\b/i.test(segment));

    const slug = (slugCandidates.find((segment) => /\d{1,6}\s+\S+/.test(segment)) ?? slugCandidates.at(-1) ?? "")
      .replace(/\b(?:zpid|mls|pid)\b.*$/i, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!slug) return {};
    const parts = slug.split(" ").filter(Boolean);
    const zipIndex = parts.findLastIndex((part) => /^\d{5}$/.test(part));
    const zip = zipIndex >= 0 ? parts[zipIndex] : "";
    const stateCandidate = zipIndex > 0 ? parts[zipIndex - 1]?.toUpperCase() ?? "" : "";
    const state = STATE_CODES.has(stateCandidate) ? stateCandidate : "";
    const city = state && zipIndex > 1 ? parts[zipIndex - 2] ?? "" : "";
    const addressParts = zip && state ? parts.slice(0, Math.max(0, zipIndex - 2)) : parts;

    return {
      property_address: toTitleCase(addressParts.join(" ")) || undefined,
      city: toTitleCase(city) || undefined,
      state: state || undefined,
      zip_code: zip || undefined,
    };
  } catch {
    return {};
  }
}

function formatPropertyIdentity(fields: Partial<ManualListingState>) {
  const cityStateZip = [
    fields.city,
    [fields.state, fields.zip_code].filter(Boolean).join(" "),
  ].filter(Boolean).join(", ");
  return [fields.property_address, cityStateZip].filter(Boolean).join(" - ");
}

const STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA",
  "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
]);

function toTitleCase(value: string | undefined) {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => (part.length <= 2 && STATE_CODES.has(part.toUpperCase()) ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`))
    .join(" ");
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
      const { data, error } = await withTimeout(
        supabase.functions.invoke("extract-deal-from-image", {
          body: { image_url: url },
        }),
        7000,
      );
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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Request timed out"));
    }, timeoutMs);
    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => window.clearTimeout(timeout));
  });
}

function normalizeExtractionResponse(data: unknown): VisualExtraction | undefined {
  if (!data || typeof data !== "object") return undefined;
  const payload = data as { extracted?: VisualExtraction };
  if (payload.extracted && typeof payload.extracted === "object") return payload.extracted;
  return data as VisualExtraction;
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

function parseNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value.replace(/[$,\s]/g, ""));
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
