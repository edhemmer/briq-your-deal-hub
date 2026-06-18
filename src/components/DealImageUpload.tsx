import { useState, useCallback, useRef } from "react";
import { Upload, Image, Clipboard, X, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface ExtractedDeal {
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
  year_built?: number | null;
  condition_notes?: string[];
  visible_or_stated_risks?: string[];
  missing_questions?: string[];
  source_confidence?: "low" | "medium" | "high";
  strategy_primary?: string | null;
}

interface DealImageUploadProps {
  onExtracted: (data: ExtractedDeal) => void;
}

type Mode = "idle" | "image" | "text";

const STATE_CODES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK",
  "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV",
  "WI", "WY", "DC",
]);

const titleCase = (value: string) =>
  value
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bNe\b/g, "NE")
    .replace(/\bNw\b/g, "NW")
    .replace(/\bSe\b/g, "SE")
    .replace(/\bSw\b/g, "SW");

const extractDealFromListingUrl = (input: string): ExtractedDeal | null => {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  const pathParts = url.pathname.split("/").filter(Boolean);
  const detailSegment =
    pathParts.find((part) => /-\d{5}(?:-\d{4})?$/i.test(part)) ??
    pathParts.find((part) => part.includes("-") && /\d/.test(part));

  if (!detailSegment) return null;

  const cleanSegment = decodeURIComponent(detailSegment)
    .replace(/_zpid$/i, "")
    .replace(/\?.*$/, "");
  const tokens = cleanSegment.split("-").filter(Boolean);
  const zipIndex = tokens.findIndex((token) => /^\d{5}(?:\d{4})?$/.test(token));

  if (zipIndex < 2) return null;

  const stateIndex = zipIndex - 1;
  const state = tokens[stateIndex]?.toUpperCase();
  if (!STATE_CODES.has(state)) return null;

  const cityIndex = stateIndex - 1;
  const city = titleCase(tokens[cityIndex]);
  const propertyAddress = titleCase(tokens.slice(0, cityIndex).join(" "));

  if (!propertyAddress || !city) return null;

  return {
    property_address: propertyAddress,
    city,
    state,
    zip_code: tokens[zipIndex],
    source_confidence: "low",
    missing_questions: [
      "Paste the full listing text or upload screenshots to verify price, property type, beds, baths, square footage, taxes, rent, and condition.",
      "Confirm facts against official records or listing documents before relying on the analysis.",
    ],
    visible_or_stated_risks: [
      "Only the listing URL was provided, so BRIX has not verified property details beyond the address parsed from the URL.",
    ],
  };
};

export function DealImageUpload({ onExtracted }: DealImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [pastedText, setPastedText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPreview(base64);
      setMode("image");
      setIsExtracting(true);

      try {
        const { data, error } = await supabase.functions.invoke("extract-deal-from-image", {
          body: { image_base64: base64 },
        });
        if (error) throw error;
        if (data?.extracted) {
          onExtracted(data.extracted);
          toast.success("Deal info extracted — review and submit");
        } else if (data?.error) {
          toast.error(data.error);
        }
      } catch (err: unknown) {
        console.error("Extraction error:", err);
        toast.error("Failed to extract deal info from image");
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  }, [onExtracted]);

  const processText = useCallback(async () => {
    const trimmedText = pastedText.trim();
    const urlExtract = extractDealFromListingUrl(trimmedText);
    if (urlExtract) {
      onExtracted(urlExtract);
      toast.success("Address extracted from listing URL. Add listing facts or screenshots to verify the deal.");
      return;
    }

    if (pastedText.trim().length < 10) {
      toast.error("Please paste more listing text");
      return;
    }
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-deal-from-text", {
        body: { listing_text: trimmedText },
      });
      if (error) throw error;
      if (data?.extracted) {
        onExtracted(data.extracted);
        toast.success("Deal info extracted — review and submit");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err: unknown) {
      console.error("Text extraction error:", err);
      const message = err instanceof Error ? err.message : "Failed to extract deal info from text";
      toast.error(message);
    } finally {
      setIsExtracting(false);
    }
  }, [pastedText, onExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handlePasteOnZone = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) { e.preventDefault(); processFile(file); return; }
      }
    }
  }, [processFile]);

  const reset = () => {
    setPreview(null);
    setMode("idle");
    setPastedText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Image upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onPaste={handlePasteOnZone}
        tabIndex={0}
        className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-muted/30"
        }`}
        onClick={() => !isExtracting && mode !== "text" && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processFile(file);
          }}
        />

        {isExtracting && mode === "image" ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground">Extracting deal info with AI…</p>
          </div>
        ) : preview ? (
          <div className="relative p-4">
            <button onClick={(e) => { e.stopPropagation(); reset(); }} className="absolute top-2 right-2 z-10 rounded-full bg-background/80 backdrop-blur-sm p-1 border border-border hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            <img src={preview} alt="Listing" className="max-h-32 rounded-lg mx-auto object-contain" />
            <p className="text-xs text-muted-foreground text-center mt-2">Extracted — drop another to re-extract</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Upload className="h-5 w-5" />
              <Image className="h-5 w-5" />
              <Clipboard className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Drop listing screenshots or property photos</p>
            <p className="text-xs text-muted-foreground">BRIX extracts deal facts and starts visual issue triage before a site visit</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">or paste listing text / URL</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Text paste zone */}
      <div className="space-y-2">
        <Textarea
          placeholder="Paste a property listing, listing URL, rent roll, broker notes, MLS remarks, or inspection/photo observations..."
          value={pastedText}
          onChange={(e) => { setPastedText(e.target.value); setMode("text"); }}
          className="min-h-[100px] text-sm resize-none"
        />
        {pastedText.trim().length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={processText}
              disabled={isExtracting}
              className="gap-1.5"
            >
              {isExtracting && mode === "text" ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Extracting…</>
              ) : (
                <><FileText className="h-3.5 w-3.5" /> Extract Deal Info</>
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={reset} className="text-muted-foreground">
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
