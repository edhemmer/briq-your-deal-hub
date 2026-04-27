import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { Button } from "@/components/ui/button";
import { HELP_CENTER_SECTIONS } from "@/components/help/helpContent";
import { useHelp } from "@/contexts/HelpContext";
import { BookOpen, RotateCcw } from "lucide-react";

export default function Help() {
  const { reopenOnboarding } = useHelp();

  return (
    <SectionContainer>
      <PageHeader title="Help Center" description="Learn how to use BRIX effectively">
        <Button variant="outline" size="sm" onClick={reopenOnboarding} className="gap-2">
          <RotateCcw className="h-3.5 w-3.5" />
          Replay Onboarding
        </Button>
      </PageHeader>

      <div className="space-y-6 max-w-3xl">
        {HELP_CENTER_SECTIONS.map((section) => (
          <CardContainer key={section.id} className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-foreground" />
              </div>
              <h2 className="text-base font-semibold text-foreground pt-1">{section.title}</h2>
            </div>
            <div className="space-y-3 pl-11">
              {section.content.map((paragraph, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">{paragraph}</p>
              ))}
            </div>
          </CardContainer>
        ))}
      </div>
    </SectionContainer>
  );
}
