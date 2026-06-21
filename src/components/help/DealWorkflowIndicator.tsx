import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const WORKFLOW_STEPS = [
  { short: "Property", full: "Property Details" },
  { short: "Financials", full: "Financial Assumptions" },
  { short: "Analysis", full: "Deal Analysis" },
  { short: "Signals", full: "Investment Signals" },
  { short: "Strategy", full: "Strategy Fit" },
  { short: "Stress", full: "Stress Test" },
  { short: "Export", full: "Export Report" },
];

interface DealWorkflowIndicatorProps {
  activeStep?: number;
  maxAccessibleStep?: number;
  onStepSelect?: (step: number) => void;
  className?: string;
}

export function DealWorkflowIndicator({
  activeStep = 0,
  maxAccessibleStep = activeStep,
  onStepSelect,
  className,
}: DealWorkflowIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide", className)}>
      {WORKFLOW_STEPS.map((step, i) => {
        const isComplete = i < activeStep;
        const isCurrent = i === activeStep;
        const canSelect = Boolean(onStepSelect) && i <= maxAccessibleStep;
        return (
          <div key={step.full} className="flex items-center gap-1 shrink-0">
            {i > 0 && <div className={cn("w-3 md:w-4 h-px", isComplete ? "bg-foreground" : "bg-border")} />}
            <button
              type="button"
              disabled={!canSelect}
              onClick={() => canSelect && onStepSelect?.(i)}
              className={cn(
                "flex items-center gap-1 rounded-full text-left md:gap-1.5",
                canSelect && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                !canSelect && "cursor-default"
              )}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`${isComplete ? "Revisit" : isCurrent ? "Current step" : "Locked step"}: ${step.full}`}
            >
              <div
                className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors shrink-0",
                  canSelect && "hover:ring-2 hover:ring-primary/30",
                  isComplete && "bg-foreground text-background",
                  isCurrent && "bg-foreground text-background ring-2 ring-foreground/20",
                  !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={cn(
                "text-[10px] md:text-[11px] whitespace-nowrap",
                isCurrent ? "text-foreground font-medium" : "text-muted-foreground",
                !isCurrent && "hidden sm:inline"
              )}>
                <span className="md:hidden">{step.short}</span>
                <span className="hidden md:inline">{step.full}</span>
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
