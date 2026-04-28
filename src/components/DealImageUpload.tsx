import { useState, useCallback, useRef } from "react";
import { Upload, Image, Clipboard, X, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ExtractedDeal {
  property_address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  property_type?: string | null;
  purchase_price?: number | null;
  estimated_arv?: number | null;
  strategy_primary?: string | null;
}

interface DealImageUploadProps {
  onExtracted: (data: ExtractedDeal) => void;
}

type Mode = "idle" | "image" | "text";

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
      } catch (err: any) {
        console.error("Extraction error:", err);
        toast.error("Failed to extract deal info from image");
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  }, [onExtracted]);

  const processText = useCallback(async () => {
    if (pastedText.trim().length < 10) {
      toast.error("Please paste more listing text");
      return;
    }
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-deal-from-text", {
        body: { listing_text: pastedText },
      });
      if (error) throw error;
      if (data?.extracted) {
        onExtracted(data.extracted);
        toast.success("Deal info extracted — review and submit");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      console.error("Text extraction error:", err);
      toast.error("Failed to extract deal info from text");
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
            <p className="text-sm font-medium text-foreground">Drop a screenshot, take a photo, or paste an image</p>
            <p className="text-xs text-muted-foreground">BRIQ extracts property details automatically</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">or paste listing text</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Text paste zone */}
      <div className="space-y-2">
        <Textarea
          placeholder="Paste a property listing from Zillow, Redfin, MLS, etc…"
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
