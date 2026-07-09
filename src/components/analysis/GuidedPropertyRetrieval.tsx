/**
 * BRIX v1.6.1 — Guided Property Retrieval Component
 *
 * Sits within the existing analysis container. Provides address/URL input,
 * source resolution, draft state workflow (accept/edit/discard).
 * No auto-fetching. No auto-commit.
 */

import { useState, useCallback } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpTooltip } from "@/components/help/HelpTooltip";
import {
  Search, ExternalLink, Check, Pencil, X, FileSearch,
  Building2, Globe, ChevronDown, ChevronUp, Info
} from "lucide-react";
import {
  resolvePropertySources,
  createEmptyDraft,
  createDraftField,
  acceptDraftField,
  editDraftField,
  discardDraftField,
  SOURCE_QUALITY_LABELS,
  type SourceResolutionResult,
  type PropertySource,
  type DraftPropertyData,
  type DraftFieldValue,
  type SourceQuality,
} from "@/lib/propertySourceResolver";
import { openPropertyRecord } from "@/lib/property/propertyIntelligenceEngine";

// ── Draft field definition ──

interface DraftFieldDef {
  key: keyof DraftPropertyData;
  label: string;
  type: "number" | "text";
  isAnalysisInput?: boolean; // true if this feeds directly into financial analysis
}

const DRAFT_FIELDS: DraftFieldDef[] = [
  { key: "assessedValue", label: "Assessed Value", type: "number" },
  { key: "annualPropertyTax", label: "Annual Property Tax", type: "number", isAnalysisInput: true },
  { key: "yearBuilt", label: "Year Built", type: "number" },
  { key: "lotSize", label: "Lot Size", type: "text" },
  { key: "zoningType", label: "Zoning Type", type: "text" },
  { key: "squareFootage", label: "Square Footage", type: "number" },
  { key: "purchasePrice", label: "Purchase Price", type: "number", isAnalysisInput: true },
  { key: "monthlyRent", label: "Monthly Rent", type: "number", isAnalysisInput: true },
];

// ── Props ──

interface GuidedPropertyRetrievalProps {
  dealAddress: {
    property_address: string;
    city: string;
    state: string;
    zip_code?: string | null;
  };
  onAcceptDraft: (accepted: Partial<Record<string, { value: number | string; source: SourceQuality; confidence: string }>>) => void;
}

// ── Component ──

export function GuidedPropertyRetrieval({ dealAddress, onAcceptDraft }: GuidedPropertyRetrievalProps) {
  const [addressInput, setAddressInput] = useState("");
  const [listingUrlInput, setListingUrlInput] = useState("");
  const [resolution, setResolution] = useState<SourceResolutionResult | null>(null);
  const [draft, setDraft] = useState<DraftPropertyData>(createEmptyDraft());
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSource, setActiveSource] = useState<PropertySource | null>(null);

  const handleResolve = useCallback(() => {
    const result = resolvePropertySources(addressInput, listingUrlInput, dealAddress);
    setResolution(result);
    setDraft(createEmptyDraft());
    setEditValues({});
    setActiveSource(null);
  }, [addressInput, listingUrlInput, dealAddress]);

  const handleSourceAction = useCallback((source: PropertySource) => {
    if (source.url) {
      openPropertyRecord(source.url);
    }
    setActiveSource(source);
  }, []);

  const handleSetDraftField = useCallback((key: keyof DraftPropertyData, value: string, source: SourceQuality) => {
    const field = DRAFT_FIELDS.find(f => f.key === key);
    if (!field) return;

    const parsed = field.type === "number" ? parseFloat(value) || 0 : value;
    const confidence = source === "official" ? "verified" as const : source === "listing" ? "estimated" as const : "user_reported" as const;

    setDraft(prev => ({
      ...prev,
      [key]: createDraftField(parsed, source, confidence),
    }));
    setEditValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleAcceptField = useCallback((key: keyof DraftPropertyData) => {
    setDraft(prev => {
      const field = prev[key];
      if (!field) return prev;
      return { ...prev, [key]: acceptDraftField(field as DraftFieldValue<number | string>) };
    });
  }, []);

  const handleEditField = useCallback((key: keyof DraftPropertyData, newValue: string) => {
    setEditValues(prev => ({ ...prev, [key]: newValue }));
    setDraft(prev => {
      const field = prev[key];
      if (!field) return prev;
      const fieldDef = DRAFT_FIELDS.find(f => f.key === key);
      const parsed = fieldDef?.type === "number" ? parseFloat(newValue) || 0 : newValue;
      return { ...prev, [key]: editDraftField(field as DraftFieldValue<number | string>, parsed) };
    });
  }, []);

  const handleDiscardField = useCallback((key: keyof DraftPropertyData) => {
    setDraft(prev => ({ ...prev, [key]: discardDraftField(prev[key] as DraftFieldValue<number | string>) }));
    setEditValues(prev => { const n = { ...prev }; delete n[key]; return n; });
  }, []);

  const handleAcceptAll = useCallback(() => {
    const accepted: Partial<Record<string, { value: number | string; source: SourceQuality; confidence: string }>> = {};
    for (const [key, field] of Object.entries(draft)) {
      const f = field as DraftFieldValue | null;
      if (f && (f.status === "pending" || f.status === "accepted" || f.status === "edited")) {
        accepted[key] = { value: f.value, source: f.source, confidence: f.confidence };
      }
    }
    if (Object.keys(accepted).length > 0) {
      onAcceptDraft(accepted);
    }
  }, [draft, onAcceptDraft]);

  const hasPendingDrafts = Object.values(draft).some(f => f && (f.status === "pending" || f.status === "edited"));
  const hasAccepted = Object.values(draft).some(f => f && f.status === "accepted");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-muted-foreground" />
          Property Data Retrieval
          <HelpTooltip content="Find and verify property data from official county records or listing sources. Data appears as drafts that you review before committing to analysis." />
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Address & URL Input */}
          <CardContainer className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Property Address</Label>
                <Input
                  value={addressInput}
                  onChange={e => setAddressInput(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Listing URL (optional)</Label>
                <Input
                  value={listingUrlInput}
                  onChange={e => setListingUrlInput(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
            <Button onClick={handleResolve} className="gap-2">
              <Search className="h-4 w-4" />
              Find Property Data
            </Button>
          </CardContainer>

          {/* Resolution Results */}
          {resolution && (
            <CardContainer className="p-5 space-y-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{resolution.message}</p>
              </div>

              {/* Available Sources */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Available Sources</h3>
                {resolution.availableSources.map((source, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                      activeSource?.type === source.type ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {source.type === "official_record" ? <Building2 className="h-4 w-4 text-signal-positive" /> :
                       source.type === "listing" ? <Globe className="h-4 w-4 text-primary" /> :
                       <Pencil className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{source.label}</span>
                        <Badge variant={source.quality === "official" ? "default" : "secondary"} className="text-[10px]">
                          {SOURCE_QUALITY_LABELS[source.quality]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{source.description}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {source.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSourceAction(source)}
                          className="gap-1.5 text-xs h-8"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {source.type === "official_record" ? "Pull Property Details" : "View Listing"}
                        </Button>
                      )}
                      {source.type === "manual" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveSource(source)}
                          className="gap-1.5 text-xs h-8"
                        >
                          <Pencil className="h-3 w-3" />
                          Enter Manually
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Draft Data Entry */}
              {activeSource && (
                <div className="border-t border-border pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {activeSource.type === "official_record"
                        ? "Enter Data from Official Record"
                        : activeSource.type === "listing"
                        ? "Enter Data from Listing"
                        : "Manual Data Entry"}
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {SOURCE_QUALITY_LABELS[activeSource.quality]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter values below. Each field will appear as a draft for your review before being committed to analysis.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {DRAFT_FIELDS.map(field => {
                      const draftField = draft[field.key];
                      const isPending = draftField?.status === "pending";
                      const isAccepted = draftField?.status === "accepted";
                      const isEdited = draftField?.status === "edited";

                      return (
                        <div key={field.key} className="space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <Label className="text-xs text-muted-foreground">{field.label}</Label>
                            {field.isAnalysisInput && (
                              <Badge variant="secondary" className="text-[9px] px-1">Analysis Input</Badge>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            <Input
                              type={field.type}
                              value={editValues[field.key] ?? ""}
                              onChange={e => {
                                const val = e.target.value;
                                setEditValues(prev => ({ ...prev, [field.key]: val }));
                                if (val) {
                                  handleSetDraftField(field.key, val, activeSource.quality);
                                }
                              }}
                              className={`h-8 text-sm flex-1 ${
                                isAccepted ? "border-signal-positive/50" :
                                isPending || isEdited ? "border-signal-warning/50" : ""
                              }`}
                            />
                            {draftField && (
                              <div className="flex gap-1">
                                {(isPending || isEdited) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAcceptField(field.key)}
                                    className="h-8 w-8 p-0 text-signal-positive hover:text-signal-positive"
                                    title="Accept"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDiscardField(field.key)}
                                  className="h-8 w-8 p-0 text-signal-risk hover:text-signal-risk"
                                  title="Discard"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {draftField && (
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] ${
                                isAccepted ? "text-signal-positive" :
                                isPending ? "text-signal-warning" :
                                isEdited ? "text-primary" : "text-muted-foreground"
                              }`}>
                                {isAccepted ? "✓ Accepted" :
                                 isPending ? "⏳ Pending review" :
                                 isEdited ? "✎ Edited" : ""}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                • {SOURCE_QUALITY_LABELS[draftField.source]}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Accept All / Commit */}
                  {(hasPendingDrafts || hasAccepted) && (
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        {hasPendingDrafts
                          ? "Review draft values, then accept to commit to analysis inputs."
                          : "Accepted values are ready to commit."}
                      </p>
                      <Button onClick={handleAcceptAll} className="gap-2">
                        <Check className="h-4 w-4" />
                        Commit to Analysis
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContainer>
          )}
        </>
      )}

      {/* Collapsed summary when resolution exists */}
      {!isExpanded && resolution && (
        <CardContainer className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>{resolution.availableSources.length} sources resolved</span>
            {resolution.hasOfficialSource && <Badge variant="default" className="text-[9px]">Official Available</Badge>}
            {resolution.hasListingSource && <Badge variant="secondary" className="text-[9px]">Listing Available</Badge>}
          </div>
        </CardContainer>
      )}
    </div>
  );
}
