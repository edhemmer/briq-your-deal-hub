/**
 * BRIQ v1.9.0 — Data Confidence & Sources Panel
 *
 * Display-only trust visibility for the canonical data layer.
 * Shows completeness score, detected conflicts, and source labels.
 */

import { Badge } from "@/components/ui/badge";
import { CardContainer } from "@/components/ui/card-container";
import type { ResolvedPropertyData } from "@/lib/propertyDataSources";
import type { PropertyConflict } from "@/lib/propertyConflictDetector";
import { AlertTriangle, CheckCircle2, Database, ShieldCheck } from "lucide-react";

interface DataConfidenceProps {
  resolved: ResolvedPropertyData;
  conflicts: PropertyConflict[];
}

function completenessColor(score: number): string {
  if (score >= 75) return "text-signal-positive";
  if (score >= 50) return "text-signal-warning";
  return "text-signal-risk";
}

function completenessLabel(score: number): string {
  if (score >= 75) return "Strong";
  if (score >= 50) return "Partial";
  return "Limited";
}

function completenessVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 75) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
}

const SOURCE_LABELS: Record<string, string> = {
  listing: "Listing",
  public_record: "Public Record",
  user: "User Input",
  estimate: "Estimate",
};

const FIELD_LABELS: Record<string, string> = {
  address: "Address",
  price: "Price",
  rent: "Rent",
  taxes: "Taxes",
  beds: "Beds",
  baths: "Baths",
  sqft: "Sq Ft",
  yearBuilt: "Year Built",
};

export function DataConfidencePanel({ resolved, conflicts }: DataConfidenceProps) {
  const score = resolved.completenessScore;
  const resolvedFields = Object.entries(resolved)
    .filter(([k]) => k !== "completenessScore")
    .filter(([, v]) => v != null && v !== 0 && v !== "");

  return (
    <div className="space-y-3">
      {/* Completeness Score */}
      <CardContainer className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-foreground">Data Completeness</p>
            <p className="text-xs text-muted-foreground">
              {resolvedFields.length} of 8 fields resolved
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${completenessColor(score)}`}>{score}</span>
          <span className="text-xs text-muted-foreground ml-1">/ 100</span>
          <div className="mt-0.5">
            <Badge variant={completenessVariant(score)} className="text-[10px]">
              {completenessLabel(score)}
            </Badge>
          </div>
        </div>
      </CardContainer>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <CardContainer className="p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-signal-warning" />
            <p className="text-sm font-semibold text-foreground">Data Conflicts Detected</p>
          </div>
          {conflicts.map((c, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <Badge variant={c.severity === "high" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                {c.severity}
              </Badge>
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground capitalize">{c.field}</span>
                {" — "}
                {c.values.map((v, j) => (
                  <span key={j}>
                    {j > 0 && " vs "}
                    {SOURCE_LABELS[v.source] || v.source}: ${v.value.toLocaleString()}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </CardContainer>
      )}

      {/* Resolved Sources */}
      {resolvedFields.length > 0 && (
        <CardContainer className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">Resolved Values</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {resolvedFields.map(([key, value]) => (
              <div key={key} className="text-xs">
                <p className="text-muted-foreground">{FIELD_LABELS[key] || key}</p>
                <p className="font-medium text-foreground truncate">
                  {typeof value === "number" 
                    ? (key === "price" || key === "rent" || key === "taxes"
                      ? `$${value.toLocaleString()}`
                      : value.toLocaleString())
                    : String(value)
                  }
                </p>
              </div>
            ))}
          </div>
        </CardContainer>
      )}

      {conflicts.length === 0 && resolvedFields.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-signal-positive" />
          No data conflicts detected
        </div>
      )}
    </div>
  );
}
