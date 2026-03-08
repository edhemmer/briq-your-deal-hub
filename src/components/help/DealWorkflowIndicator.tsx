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
  className?: string;
}

export function DealWorkflowIndicator({ activeStep = 0, className }: DealWorkflowIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide", className)}>
      {WORKFLOW_STEPS.map((step, i) => {
        const isComplete = i < activeStep;
        const isCurrent = i === activeStep;
        return (
          <div key={step.full} className="flex items-center gap-1 shrink-0">
            {i > 0 && <div className={cn("w-3 md:w-4 h-px", isComplete ? "bg-foreground" : "bg-border")} />}
            <div className="flex items-center gap-1 md:gap-1.5">
              <div
                className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors shrink-0",
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
