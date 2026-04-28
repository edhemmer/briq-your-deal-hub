import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHelp } from "@/contexts/HelpContext";
import { BarChart3, PlusCircle, Brain, Target, FileText } from "lucide-react";

const steps = [
  {
    icon: BarChart3,
    title: "Welcome to BRIQ",
    description: "BRIQ is a deal intelligence platform that analyzes real estate investments using financial data, market signals, and strategy evaluation to help you make informed decisions.",
  },
  {
    icon: PlusCircle,
    title: "Create Your First Deal",
    description: "Start by entering a property address and basic financial assumptions. BRIQ uses these inputs to build a comprehensive investment analysis.",
  },
  {
    icon: Brain,
    title: "Run the Analysis",
    description: "BRIQ calculates key investment metrics including cap rate, cash-on-cash return, DSCR, and cash flow. It also identifies deal killers and strengths automatically.",
  },
  {
    icon: Target,
    title: "Review Strategy Insights",
    description: "BRIQ evaluates your deal against common investment strategies like Buy & Hold, Fix & Flip, BRRRR, and Wholesale — showing fit signals for each approach.",
  },
  {
    icon: FileText,
    title: "Export Investor Reports",
    description: "Generate professional PDF reports and CSV exports to share with partners, lenders, or your own records.",
  },
];

export function OnboardingWalkthrough() {
  const { showOnboarding, setShowOnboarding, completeOnboarding } = useHelp();
  const [step, setStep] = useState(0);

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = current.icon;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
      setStep(0);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    setStep(0);
  };

  return (
    <Dialog open={showOnboarding} onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Progress bar */}
        <div className="flex gap-1 px-6 pt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-foreground" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-5">
            <Icon className="h-6 w-6 text-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">{current.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{current.description}</p>
        </div>

        <div className="px-6 pb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
            Skip
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {isLast ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
