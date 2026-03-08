import { useState, useCallback, useRef } from "react";
import { Upload, Image, Loader2, Clipboard, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export function DealImageUpload({ onExtracted }: DealImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          processFile(file);
          return;
        }
      }
    }
  }, [processFile]);

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
      className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-muted/30"
      }`}
      onClick={() => !isExtracting && fileInputRef.current?.click()}
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

      {isExtracting ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-foreground">Extracting deal info with AI…</p>
          <p className="text-xs text-muted-foreground">Analyzing your property listing</p>
        </div>
      ) : preview ? (
        <div className="relative p-4">
          <button
            onClick={(e) => { e.stopPropagation(); clearPreview(); }}
            className="absolute top-2 right-2 z-10 rounded-full bg-background/80 backdrop-blur-sm p-1 border border-border hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          <img src={preview} alt="Listing preview" className="max-h-40 rounded-lg mx-auto object-contain" />
          <p className="text-xs text-muted-foreground text-center mt-2">Data extracted — drop another image to re-extract</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <Image className="h-5 w-5 text-muted-foreground" />
            <Clipboard className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Drop a listing screenshot, take a photo, or paste an image
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              AI will extract the property details automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
