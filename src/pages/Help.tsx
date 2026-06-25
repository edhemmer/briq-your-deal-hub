import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { HELP_CENTER_SECTIONS } from "@/components/help/helpContent";
import { useHelp } from "@/contexts/HelpContext";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, Compass, RotateCcw, ShieldCheck, Zap } from "lucide-react";

const quickStartCards = [
  {
    icon: Compass,
    title: "Start with an address",
    text: "Every workflow starts with a property, a deal file, and the next action needed to move it forward.",
  },
  {
    icon: ShieldCheck,
    title: "Trust is visible",
    text: "Confidence, risks, assumptions, evidence, and missing information stay attached to recommendations.",
  },
  {
    icon: Zap,
    title: "Win, lose, learn",
    text: "Closed, passed, and lost deals preserve why the outcome happened so future decisions get sharper.",
  },
];

export default function Help() {
  const { reopenOnboarding } = useHelp();

  return (
    <SectionContainer>
      <PageHeader
        title="Help & Training"
        description="Learn BRIX quickly, use it confidently, and understand exactly how each module supports better real estate decisions."
      >
        <Button variant="outline" size="sm" onClick={reopenOnboarding} className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" />
          Replay Onboarding
        </Button>
      </PageHeader>

      <div className="space-y-6 max-w-5xl">
        <CardContainer className="p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-4">Quick to learn</Badge>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                BRIX turns complex real estate decisions into simple next steps.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                You can start with one property, one strategy, or one question. BRIX keeps the workflow structured:
                find the address, build the deal file, verify the facts, compare strategies, understand the risks,
                work the offer, record the outcome, and keep the intelligence after closing.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Accuracy rule
              </div>
              <p className="max-w-sm text-muted-foreground">
                BRIX lowers confidence when data is missing, weak, conflicting, or estimated. That is how the app stays
                useful without creating false certainty.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {quickStartCards.map((card) => (
              <div key={card.title} className="rounded-xl border border-border/70 bg-background p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <card.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{card.text}</p>
              </div>
            ))}
          </div>
        </CardContainer>

        <CardContainer className="p-2">
          <Accordion type="multiple" defaultValue={["getting-started", "module-map", "strategy-training"]}>
            {HELP_CENTER_SECTIONS.map((section) => (
              <AccordionItem key={section.id} value={section.id} className="border-border px-4 last:border-b-0">
                <AccordionTrigger className="gap-3 py-5 text-left hover:no-underline">
                  <span className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <BookOpen className="h-4 w-4 text-foreground" />
                    </span>
                    <span className="text-base font-semibold text-foreground">{section.title}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-11">
                  <div className="space-y-3">
                    {section.content.map((paragraph, i) => (
                      <p key={i} className="text-sm leading-relaxed text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContainer>

        <CardContainer className="p-6">
          <h2 className="text-base font-semibold text-foreground">The simplest way to use BRIX</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {[
              ["FindIQ", "Investigate"],
              ["DealIQ", "Analyze"],
              ["OfferIQ", "Pursue"],
              ["PipelineIQ", "Win/Lose"],
              ["PortfolioIQ", "Learn"],
            ].map(([module, action]) => (
              <div key={module} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="text-sm font-semibold text-foreground">{module}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{action}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            If the platform ever feels big, follow that sequence. Each module answers one question and hands the work to
            the next module without forcing duplicate data entry.
          </p>
        </CardContainer>
      </div>
    </SectionContainer>
  );
}
