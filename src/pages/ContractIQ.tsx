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
  ) => {
    setExtraction(e);
    setSourceFiles(files);
    setExtractionMeta(meta);
    const v = extractionToFormValues(e);
    setForm((prev) => ({
      ...prev,
      // Auto-fill, but don't overwrite a value the user already typed.
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

const FieldChip = ({
  extraction,
  field,
  children,
}: {
  extraction: CanonicalContractExtraction | null;
  field: ExtractableField;
  children: React.ReactNode;
}) => {
  const f = extraction?.[field];
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {children}
        {f && f.confidence !== "none" && (
          <span
            title={f.excerpt || "Source excerpt unavailable"}
            className={`text-[10px] px-1.5 py-0.5 rounded border ${confidenceBadgeColor(f.confidence)}`}
          >
            {f.confidence}
          </span>
        )}
      </div>
      {f?.excerpt && f.confidence !== "none" && (
        <p className="text-[10px] text-muted-foreground italic line-clamp-1" title={f.excerpt}>
          “{f.excerpt}”
        </p>
      )}
    </div>
  );
};

export default ContractIQ;
