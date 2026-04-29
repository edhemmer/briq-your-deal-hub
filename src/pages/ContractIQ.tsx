import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileSignature, Plus, Trash2, ArrowRight, FileText } from "lucide-react";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  useContracts,
  useCreateContract,
  useDeleteContract,
} from "@/hooks/useContracts";
import { analyzeContract, type Perspective } from "@/lib/contractIQEngine";
import {
  ContractIntakeUploader,
  confidenceBadgeColor,
} from "@/components/contractiq/ContractIntakeUploader";
import {
  extractionToFormValues,
  type CanonicalContractExtraction,
} from "@/lib/contractDataMapper";

const ContractIQ = () => {
  const navigate = useNavigate();
  const { data: contracts, isLoading } = useContracts();
  const createContract = useCreateContract();
  const deleteContract = useDeleteContract();

  const [open, setOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [perspective, setPerspective] = useState<Perspective>("buyer");
  const [form, setForm] = useState({
    contract_name: "",
    contract_type: "",
    buyer_name: "",
    seller_name: "",
    property_address: "",
    purchase_price: "",
    earnest_money: "",
    closing_date: "",
    inspection_period_days: "",
    financing_contingency: false,
    appraisal_contingency: false,
    inspection_contingency: false,
    contract_text: "",
  });

  const [extraction, setExtraction] = useState<CanonicalContractExtraction | null>(null);
  const [extractionMeta, setExtractionMeta] = useState<Record<string, unknown> | null>(null);
  const [sourceFiles, setSourceFiles] = useState<unknown[]>([]);

  const reset = () => {
    setPerspective("buyer");
    setShowManual(false);
    setExtraction(null);
    setExtractionMeta(null);
    setSourceFiles([]);
    setForm({
      contract_name: "",
      contract_type: "",
      buyer_name: "",
      seller_name: "",
      property_address: "",
      purchase_price: "",
      earnest_money: "",
      closing_date: "",
      inspection_period_days: "",
      financing_contingency: false,
      appraisal_contingency: false,
      inspection_contingency: false,
      contract_text: "",
    });
  };

  const handleExtracted = (
    e: CanonicalContractExtraction,
    files: unknown[],
    meta: Record<string, unknown>,
    rawText: string,
  ) => {
    setExtraction(e);
    setSourceFiles(files);
    setExtractionMeta(meta);
    const v = extractionToFormValues(e);
    setForm((prev) => ({
      ...prev,
      contract_type: prev.contract_type || v.contract_type,
      buyer_name: prev.buyer_name || v.buyer_name,
      seller_name: prev.seller_name || v.seller_name,
      property_address: prev.property_address || v.property_address,
      purchase_price: prev.purchase_price || v.purchase_price,
      earnest_money: prev.earnest_money || v.earnest_money,
      closing_date: prev.closing_date || v.closing_date,
      inspection_period_days: prev.inspection_period_days || v.inspection_period_days,
      financing_contingency: prev.financing_contingency || v.financing_contingency,
      appraisal_contingency: prev.appraisal_contingency || v.appraisal_contingency,
      inspection_contingency: prev.inspection_contingency || v.inspection_contingency,
      // Persist the parsed text so the engine and downstream review can
      // trace every extracted value back to its source.
      contract_text: prev.contract_text || rawText,
      contract_name:
        prev.contract_name ||
        v.property_address ||
        v.contract_type ||
        "Untitled contract",
    }));
  };

  const handleCreate = async () => {
    if (!form.contract_name.trim()) {
      toast({ title: "Contract name required", variant: "destructive" });
      return;
    }
    const numOrNull = (s: string) => (s.trim() ? Number(s) : null);
    const intOrNull = (s: string) => (s.trim() ? parseInt(s, 10) : null);

    try {
      const analysis = analyzeContract({
        perspective,
        contract_type: form.contract_type || null,
        buyer_name: form.buyer_name || null,
        seller_name: form.seller_name || null,
        property_address: form.property_address || null,
        purchase_price: numOrNull(form.purchase_price),
        earnest_money: numOrNull(form.earnest_money),
        closing_date: form.closing_date || null,
        inspection_period_days: intOrNull(form.inspection_period_days),
        financing_contingency: form.financing_contingency,
        appraisal_contingency: form.appraisal_contingency,
        inspection_contingency: form.inspection_contingency,
        contract_text: form.contract_text || null,
      });

      const created = await createContract.mutateAsync({
        contract_name: form.contract_name,
        contract_type: form.contract_type || null,
        perspective,
        buyer_name: form.buyer_name || null,
        seller_name: form.seller_name || null,
        property_address: form.property_address || null,
        purchase_price: numOrNull(form.purchase_price),
        earnest_money: numOrNull(form.earnest_money),
        closing_date: form.closing_date || null,
        inspection_period_days: intOrNull(form.inspection_period_days),
        financing_contingency: form.financing_contingency,
        appraisal_contingency: form.appraisal_contingency,
        inspection_contingency: form.inspection_contingency,
        contract_text: form.contract_text || null,
        contractiq_analysis: analysis as unknown as never,
        source_files: sourceFiles as never,
        extraction_meta: extractionMeta as never,
        extraction_confidence: (extraction
          ? Object.fromEntries(
              Object.entries(extraction).map(([k, v]) => [
                k,
                { confidence: v.confidence, excerpt: v.excerpt },
              ]),
            )
          : null) as never,
        status: "analyzed",
      });
      setOpen(false);
      reset();
      navigate(`/contractiq/${created.id}`);
    } catch (e: unknown) {
      toast({
        title: "Failed to create contract",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contract?")) return;
    await deleteContract.mutateAsync(id);
    toast({ title: "Contract deleted" });
  };

  return (
    <SectionContainer>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
              ContractIQ
            </h1>
            <Badge variant="outline" className="text-[10px]">Module</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze contracts from the buyer's or seller's perspective — risk, leverage, timeline, negotiation.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New contract analysis</DialogTitle>
              <DialogDescription>
                Choose your perspective and provide the contract terms.
              </DialogDescription>
            </DialogHeader>

            {/* Perspective toggle */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">Analyze from perspective</p>
                <p className="text-xs text-muted-foreground">
                  Risks, leverage, and recommendations are tailored to this party.
                </p>
              </div>
              <div className="flex rounded-md border border-border bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => setPerspective("buyer")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                    perspective === "buyer"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Buyer
                </button>
                <button
                  type="button"
                  onClick={() => setPerspective("seller")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors ${
                    perspective === "seller"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Seller
                </button>
              </div>
            </div>

            <ContractIntakeUploader onExtracted={handleExtracted} />

            {!extraction ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Upload a contract or paste email text above. ContractIQ will extract the key terms automatically — you'll only be asked for fields it can't find.
                </p>
                <button
                  type="button"
                  onClick={() => setShowManual((s) => !s)}
                  className="mt-2 text-[11px] text-primary hover:underline"
                >
                  {showManual ? "Hide manual entry" : "Or enter terms manually"}
                </button>
              </div>
            ) : (
              <ExtractedSummary extraction={extraction} form={form} />
            )}

            {(extraction || showManual) && (
              <>
                <div>
                  <Label htmlFor="cname">Contract name *</Label>
                  <Input
                    id="cname"
                    value={form.contract_name}
                    onChange={(e) => setForm({ ...form, contract_name: e.target.value })}
                    placeholder="e.g. Hemmer–Pulte Purchase Agreement"
                  />
                </div>

                <ReviewFields
                  extraction={extraction}
                  form={form}
                  setForm={setForm}
                  showAll={showManual && !extraction}
                />
              </>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createContract.isPending}>
                {createContract.isPending ? "Analyzing..." : "Analyze Contract"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <CardContainer className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Your contracts</h2>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        ) : !contracts || contracts.length === 0 ? (
          <div className="text-center py-12">
            <FileSignature className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No contracts yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "New Contract" to start analyzing.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {contracts.map((c) => (
              <div
                key={c.id}
                className="py-3 flex items-center justify-between gap-4 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
              >
                <button
                  onClick={() => navigate(`/contractiq/${c.id}`)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p className="text-sm font-medium text-foreground truncate">
                    {c.contract_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.property_address ?? "No address"} · {c.perspective} perspective
                  </p>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="capitalize">
                    {c.perspective}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate(`/contractiq/${c.id}`)}
                  >
                    Open <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(c.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContainer>
    </SectionContainer>
  );
};

type ExtractableField =
  | "contract_type"
  | "buyer_name"
  | "seller_name"
  | "property_address"
  | "purchase_price"
  | "earnest_money"
  | "closing_date"
  | "inspection_period_days";

type FieldDef = { key: ExtractableField; label: string; type?: string };
const FIELD_DEFS: FieldDef[] = [
  { key: "contract_type", label: "Contract type" },
  { key: "property_address", label: "Property address" },
  { key: "buyer_name", label: "Buyer name" },
  { key: "seller_name", label: "Seller name" },
  { key: "purchase_price", label: "Purchase price", type: "number" },
  { key: "earnest_money", label: "Earnest money", type: "number" },
  { key: "closing_date", label: "Closing date", type: "date" },
  { key: "inspection_period_days", label: "Inspection period (days)", type: "number" },
];

type FormShape = {
  contract_name: string;
  contract_type: string;
  buyer_name: string;
  seller_name: string;
  property_address: string;
  purchase_price: string;
  earnest_money: string;
  closing_date: string;
  inspection_period_days: string;
  financing_contingency: boolean;
  appraisal_contingency: boolean;
  inspection_contingency: boolean;
  contract_text: string;
};

// Compact summary of fields the AI captured with high/medium confidence.
const ExtractedSummary = ({
  extraction,
  form,
}: {
  extraction: CanonicalContractExtraction;
  form: FormShape;
}) => {
  const captured = FIELD_DEFS.filter((f) => {
    const ex = extraction[f.key];
    return ex && ex.confidence !== "none" && ex.confidence !== "low" && form[f.key];
  });
  if (captured.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="text-[11px] font-semibold text-foreground uppercase tracking-wide mb-2">
        Extracted from contract
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
        {captured.map((f) => {
          const ex = extraction[f.key];
          return (
            <div key={f.key} className="flex items-start justify-between gap-2 text-xs">
              <span className="text-muted-foreground">{f.label}</span>
              <span
                className="font-medium text-foreground text-right truncate max-w-[60%]"
                title={ex?.excerpt || ""}
              >
                {String(form[f.key])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Renders only the fields the AI couldn't confidently extract (or all, if `showAll`).
const ReviewFields = ({
  extraction,
  form,
  setForm,
  showAll,
}: {
  extraction: CanonicalContractExtraction | null;
  form: FormShape;
  setForm: (f: FormShape) => void;
  showAll: boolean;
}) => {
  const missing = FIELD_DEFS.filter((f) => {
    if (showAll) return true;
    if (!extraction) return true;
    const ex = extraction[f.key];
    const empty = !form[f.key] || String(form[f.key]).trim() === "";
    const lowConf = !ex || ex.confidence === "none" || ex.confidence === "low";
    return empty || lowConf;
  });

  return (
    <>
      {missing.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
            {extraction ? "Please confirm or fill in" : "Contract details"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {missing.map((f) => {
              const ex = extraction?.[f.key];
              return (
                <div key={f.key} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={f.key}>{f.label}</Label>
                    {ex && ex.confidence !== "none" && (
                      <span
                        title={ex.excerpt || ""}
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${confidenceBadgeColor(ex.confidence)}`}
                      >
                        {ex.confidence}
                      </span>
                    )}
                  </div>
                  <Input
                    id={f.key}
                    type={f.type ?? "text"}
                    value={String(form[f.key] ?? "")}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2 rounded-lg border border-border p-3">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
          Contingencies
        </p>
        {([
          ["financing_contingency", "Financing contingency"],
          ["appraisal_contingency", "Appraisal contingency"],
          ["inspection_contingency", "Inspection contingency"],
        ] as const).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
              {label}
            </Label>
            <Switch
              id={key}
              checked={form[key]}
              onCheckedChange={(v) => setForm({ ...form, [key]: v })}
            />
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="ctext">Contract text (optional)</Label>
        <Textarea
          id="ctext"
          rows={4}
          value={form.contract_text}
          onChange={(e) => setForm({ ...form, contract_text: e.target.value })}
          placeholder="Paste relevant contract clauses for reference..."
        />
      </div>
    </>
  );
};

export default ContractIQ;
