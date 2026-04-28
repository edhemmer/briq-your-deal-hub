/**
 * BRIX v1.6.0 — Inline Glossary Tooltip Component
 *
 * Lightweight contextual definition for key terms.
 * Wraps any trigger element and shows the definition on hover.
 */

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { getGlossaryEntry } from "@/lib/glossary";
import { BookOpen } from "lucide-react";

interface GlossaryTermProps {
  /** Key from the GLOSSARY record */
  termKey: string;
  /** Optional custom trigger content — defaults to the term name with an underline */
  children?: React.ReactNode;
}

export function GlossaryTerm({ termKey, children }: GlossaryTermProps) {
  const entry = getGlossaryEntry(termKey);
  if (!entry) return <>{children ?? termKey}</>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/40">
            {children ?? entry.term}
            <BookOpen className="h-3 w-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs font-semibold text-foreground mb-1">{entry.term}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{entry.definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
