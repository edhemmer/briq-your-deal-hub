import { AlertTriangle, CheckCircle2, Database, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardContainer } from "@/components/ui/card-container";
import type { PublicSourceConnector, TrustGateResult, VerifiedTaxResult } from "@/lib/sourceVerificationEngine";

interface SourceVerificationPanelProps {
  trustGate: TrustGateResult;
  tax: VerifiedTaxResult;
  connectors: PublicSourceConnector[];
}

function statusVariant(status: TrustGateResult["status"]): "default" | "secondary" | "destructive" {
  if (status === "verified") return "default";
  if (status === "partially_verified") return "secondary";
  return "destructive";
}

function connectorVariant(status: PublicSourceConnector["status"]): "default" | "secondary" | "outline" | "destructive" {
  if (status === "connected") return "default";
  if (status === "manual_verified") return "secondary";
  if (status === "requires_key") return "outline";
  return "destructive";
}

export function SourceVerificationPanel({ trustGate, tax, connectors }: SourceVerificationPanelProps) {
  return (
    <div className="space-y-3">
      <CardContainer className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-base font-bold text-foreground">Verification Gate</h3>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{trustGate.reportLanguage}</p>
          </div>
          <div className="text-left sm:text-right">
            <Badge variant={statusVariant(trustGate.status)} className="capitalize">
              {trustGate.status.replace("_", " ")}
            </Badge>
            <p className="mt-2 text-3xl font-black text-foreground">{trustGate.score}<span className="text-sm font-medium text-muted-foreground">/100</span></p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Property Tax Basis</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {tax.annualTax == null ? "Missing" : tax.annualTax.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{tax.note}</p>
          </div>
          <div className="rounded-md border border-border bg-background p-3 md:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Verified Fields</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {trustGate.verifiedFields.length > 0 ? trustGate.verifiedFields.map((field) => (
                <Badge key={field} variant="outline" className="gap-1 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 text-signal-positive" /> {field}
                </Badge>
              )) : (
                <span className="text-xs text-muted-foreground">No verified fields yet.</span>
              )}
            </div>
          </div>
        </div>

        {(trustGate.blockers.length > 0 || trustGate.warnings.length > 0) && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {trustGate.blockers.length > 0 && (
              <div className="rounded-md border border-signal-risk/25 bg-signal-risk/5 p-3">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-signal-risk">
                  <AlertTriangle className="h-3.5 w-3.5" /> Blockers
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-foreground">
                  {trustGate.blockers.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            )}
            {trustGate.warnings.length > 0 && (
              <div className="rounded-md border border-signal-warning/25 bg-signal-warning/5 p-3">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-signal-warning">
                  <AlertTriangle className="h-3.5 w-3.5" /> Warnings
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-foreground">
                  {trustGate.warnings.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContainer>

      <CardContainer className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Public Source Connectors</p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {connectors.map((connector) => (
            <div key={connector.name} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{connector.name}</p>
                <Badge variant={connectorVariant(connector.status)} className="text-[10px]">
                  {connector.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{connector.trustUse}</p>
            </div>
          ))}
        </div>
      </CardContainer>
    </div>
  );
}
