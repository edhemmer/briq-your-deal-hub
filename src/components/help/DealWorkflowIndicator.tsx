import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const WORKFLOW_STEPS = [
  "Property Details",
  "Financial Assumptions",
  "Deal Analysis",
  "Investment Signals",
  "Strategy Fit",
  "Stress Test",
  "Export Report",
];

interface DealWorkflowIndicatorProps {
  activeStep?: number; // 0-indexed
  className?: string;
}

export function DealWorkflowIndicator({ activeStep = 0, className }: DealWorkflowIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1 overflow-x-auto py-2", className)}>
      {WORKFLOW_STEPS.map((step, i) => {
        const isComplete = i < activeStep;
        const isCurrent = i === activeStep;
        return (
          <div key={step} className="flex items-center gap-1 shrink-0">
            {i > 0 && <div className={cn("w-4 h-px", isComplete ? "bg-foreground" : "bg-border")} />}
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors",
                  isComplete && "bg-foreground text-background",
                  isCurrent && "bg-foreground text-background ring-2 ring-foreground/20",
                  !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={cn(
                "text-[11px] whitespace-nowrap",
                isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {step}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
