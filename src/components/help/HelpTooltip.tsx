import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HelpTooltipProps {
  content: string;
  className?: string;
}

export function HelpTooltip({ content, className }: HelpTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={`inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${className ?? ""}`}>
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
