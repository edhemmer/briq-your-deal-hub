import { FileSearch } from "lucide-react";
import type { ClauseEvidence } from "@/lib/contractIQEngine";

const confColor = (c: ClauseEvidence["confidence"]) => {
  switch (c) {
    case "high":
      return "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-800";
    case "medium":
      return "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-900/20 dark:border-sky-800";
    case "low":
      return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800";
    case "derived":
      return "text-primary bg-primary/5 border-primary/20";
    default:
      return "text-muted-foreground bg-muted border-border";
  }
};

const confLabel = (c: ClauseEvidence["confidence"]) =>
  c === "derived" ? "Derived" : c === "none" ? "Not extracted" : `${c[0]?.toUpperCase()}${c.slice(1)} confidence`;

interface Props {
  evidence?: ClauseEvidence[];
  /** Visual emphasis — used inside high-severity cons so the link is more visible. */
  emphasis?: "default" | "muted";
}

export const ClauseEvidenceBlock = ({ evidence, emphasis = "default" }: Props) => {
  if (!evidence || evidence.length === 0) return null;

  return (
    <details className="group mt-2 rounded-md border border-border/60 bg-background/60 open:bg-background open:shadow-sm transition-colors">
      <summary
        className={`flex items-center gap-1.5 cursor-pointer select-none list-none px-2.5 py-1.5 text-[11px] font-medium ${
          emphasis === "muted" ? "text-muted-foreground" : "text-primary"
        } hover:text-foreground`}
      >
        <FileSearch className="h-3 w-3" />
        <span>View source clause{evidence.length > 1 ? `s (${evidence.length})` : ""}</span>
        <span className="ml-auto text-[10px] text-muted-foreground group-open:hidden">Expand</span>
        <span className="ml-auto text-[10px] text-muted-foreground hidden group-open:inline">Collapse</span>
      </summary>
      <div className="px-2.5 pb-2.5 pt-1 space-y-2">
        {evidence.map((ev, i) => (
          <div key={`${ev.field}-${i}`} className="rounded-md border border-border/60 bg-card p-2.5">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-foreground truncate">{ev.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{ev.field}</p>
              </div>
              <span
                className={`shrink-0 text-[9px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded border ${confColor(ev.confidence)}`}
              >
                {confLabel(ev.confidence)}
              </span>
            </div>
            <blockquote className="text-[11px] text-foreground/85 leading-relaxed italic border-l-2 border-border pl-2 whitespace-pre-wrap break-words">
              &ldquo;{ev.excerpt}&rdquo;
            </blockquote>
            {ev.value != null && (
              <p className="mt-1 text-[10px] text-muted-foreground">
                <span className="font-medium">Value:</span>{" "}
                <span className="font-mono text-foreground/80">{ev.value}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </details>
  );
};
