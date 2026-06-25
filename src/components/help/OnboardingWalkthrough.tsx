import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHelp } from "@/contexts/HelpContext";
import { BarChart3, Brain, KanbanSquare, PenLine, Search, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: ShieldCheck,
    title: "Welcome to BRIX",
    description: "BRIX turns every property into a deal file: find the address, analyze the economics and contract, record the outcome, and learn from what wins.",
  },
  {
    icon: Search,
    title: "Find What Deserves Attention",
    description: "Start in FindIQ with an acquisition profile. BRIX ranks opportunities by fit so you know what to investigate before spending time on full underwriting.",
  },
  {
    icon: BarChart3,
    title: "Analyze Any Strategy",
    description: "Send promising properties into DealIQ to test rental, flip, BRRRR, refinance, seller finance, hold, sell, and other strategies with base, conservative, and stress scenarios.",
  },
  {
    icon: Brain,
    title: "Trust the Process, Not Guesswork",
    description: "BRIX shows the recommendation, evidence, confidence, risks, assumptions, missing information, alternatives, and next actions. Weak data lowers confidence automatically.",
  },
  {
    icon: KanbanSquare,
    title: "Keep the Deal Moving",
    description: "PipelineIQ tracks stages, tasks, deadlines, and outcome. OfferIQ turns analysis into offers and communications. PortfolioIQ tracks performance and learns from wins, losses, and passes.",
  },
  {
    icon: PenLine,
    title: "Learn While You Work",
    description: "Use Help & Training anytime for step-by-step workflows, plain-English terms, strategy examples, risk checks, and field capture guidance.",
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
        <DialogTitle className="sr-only">{current.title}</DialogTitle>
        <DialogDescription className="sr-only">{current.description}</DialogDescription>

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
