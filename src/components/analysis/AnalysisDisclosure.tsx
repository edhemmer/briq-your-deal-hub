/**
 * BRIX v1.6.0 — Analysis Disclosure Banner
 *
 * Professional, non-intrusive global disclosure for the analysis experience.
 */

import { Info } from "lucide-react";
import { ANALYSIS_DISCLOSURE } from "@/lib/glossary";

interface AnalysisDisclosureProps {
  className?: string;
}

export function AnalysisDisclosure({ className }: AnalysisDisclosureProps) {
  return (
    <div className={`flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 ${className ?? ""}`}>
      <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {ANALYSIS_DISCLOSURE}
      </p>
    </div>
  );
}
