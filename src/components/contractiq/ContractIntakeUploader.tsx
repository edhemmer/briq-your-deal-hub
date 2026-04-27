import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, FileText, FileSpreadsheet, Mail, Image as ImageIcon, X, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { parseDocument, readAsDataURL, type ParsedDocument } from "@/lib/contractDocumentParser";
import { mapAiExtraction, type CanonicalContractExtraction } from "@/lib/contractDataMapper";

interface ContractIntakeUploaderProps {
  onExtracted: (
    extraction: CanonicalContractExtraction,
    sourceFiles: { filename: string; size: number; parser: string }[],
    meta: Record<string, unknown>,
  ) => void;
}

const ACCEPT =
  ".pdf,.docx,.xlsx,.xls,.eml,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,message/rfc822,text/plain";
const MAX_BYTES = 20 * 1024 * 1024;

const iconFor = (parser: string) => {
  if (parser === "xlsx") return FileSpreadsheet;
  if (parser === "eml" || parser === "plain") return Mail;
  if (parser === "image") return ImageIcon;
  return FileText;
};

export function ContractIntakeUploader({ onExtracted }: ContractIntakeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ParsedDocument[]>([]);
  const [emailText, setEmailText] = useState("");
  const [busy, setBusy] = useState<"parsing" | "extracting" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setBusy("parsing");
    try {
      const parsed: ParsedDocument[] = [];
      for (const f of Array.from(fileList)) {
        if (f.size > MAX_BYTES) {
          toast({
            title: `${f.name} skipped`,
            description: "File exceeds 20MB.",
            variant: "destructive",
          });
          continue;
        }
        const p = await parseDocument(f);
        // Stash the original File on the parsed doc so we can re-read for image OCR.
        (p as ParsedDocument & { __file?: File }).__file = f;
        parsed.push(p);
      }
      setFiles((prev) => [...prev, ...parsed]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to read file";
      setError(msg);
      toast({ title: "File parse error", description: msg, variant: "destructive" });
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, []);

  // Prevent the browser from navigating away (opening the PDF/email)
  // when a file is dropped outside the dropzone.
  useEffect(() => {
    const prevent = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const runExtraction = async () => {
    setError(null);
    if (files.length === 0 && !emailText.trim()) {
      setError("Upload a file or paste email text first.");
      return;
    }

    setBusy("extracting");
    try {
      // Build the canonical text payload deterministically:
      //   [email pasted text] + [file 1 text] + [file 2 text] ...
      // Order is preserved -> input hash is stable across reruns.
      const textParts: string[] = [];
      if (emailText.trim()) {
        textParts.push(`# Pasted email\n${emailText.trim()}`);
      }
      let imagePayload: string | null = null;
      for (const f of files) {
        if (f.parser === "image") {
          if (!imagePayload) {
            const file = (f as ParsedDocument & { __file?: File }).__file;
            if (file) imagePayload = await readAsDataURL(file);
          }
        } else if (f.text.trim()) {
          textParts.push(`# ${f.filename}\n${f.text.trim()}`);
        }
      }

      const payload: Record<string, unknown> = {
        source_files: files.map((f) => ({
          filename: f.filename,
          size: f.size,
          parser: f.parser,
          mime: f.mime,
          page_count: f.pageCount ?? null,
        })),
      };
      if (textParts.length) payload.text = textParts.join("\n\n---\n\n");
      if (imagePayload) payload.image_base64 = imagePayload;

      const { data, error: fnErr } = await supabase.functions.invoke(
        "extract-contract-from-document",
        { body: payload },
      );

      if (fnErr) throw new Error(fnErr.message);
      if (!data?.extracted) throw new Error(data?.error ?? "Extraction returned no data");

      const canonical = mapAiExtraction(data.extracted);
      onExtracted(canonical, payload.source_files as never, data.meta ?? {});
      toast({ title: "Document parsed", description: "Review the auto-filled fields below." });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Extraction failed";
      setError(msg);
      toast({ title: "Extraction failed", description: msg, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground flex items-center gap-2">
            <Upload className="h-4 w-4" /> Smart intake
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload PDFs, DOCX, XLSX, or .eml — AI will populate the contract fields. You review before analyzing.
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">Deterministic</Badge>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "copy"; }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onFiles(e.dataTransfer.files);
        }}
        className="cursor-pointer rounded-md border border-border bg-background p-4 text-center hover:bg-muted/40 transition-colors"
      >
        <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
        <p className="text-sm font-medium text-foreground mt-2">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-0.5">PDF · DOCX · XLSX · EML · Images · up to 20MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => {
            const Icon = iconFor(f.parser);
            return (
              <div
                key={`${f.filename}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{f.filename}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {(f.size / 1024).toFixed(1)} KB · {f.parser}
                      {f.pageCount ? ` · ${f.pageCount} pages` : ""}
                      {f.parser !== "image" && f.text ? ` · ${f.text.length.toLocaleString()} chars` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0"
                  onClick={() => removeFile(i)}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div>
        <Label htmlFor="emailpaste" className="text-xs">Or paste email / contract text</Label>
        <Textarea
          id="emailpaste"
          rows={3}
          placeholder="Paste a broker email body, term sheet snippet, or contract clauses..."
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          className="mt-1"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={runExtraction}
          disabled={busy !== null || (files.length === 0 && !emailText.trim())}
          size="sm"
        >
          {busy === "parsing" && <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Reading files…</>}
          {busy === "extracting" && <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Extracting…</>}
          {!busy && "Auto-fill from documents"}
        </Button>
      </div>
    </div>
  );
}

export const confidenceBadgeColor = (c: "high" | "medium" | "low" | "none") => {
  if (c === "high") return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900";
  if (c === "medium") return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900";
  if (c === "low") return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900";
  return "bg-muted text-muted-foreground border-border";
};
