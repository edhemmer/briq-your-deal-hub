import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { EmptyStateContainer } from "@/components/ui/empty-state-container";
import { CardContainer } from "@/components/ui/card-container";
import { BarChart3 } from "lucide-react";

const Analysis = () => {
  return (
    <SectionContainer>
      <PageHeader title="Analysis" description="Deal analysis and financial modeling" />
      <CardContainer>
        <EmptyStateContainer
          icon={<BarChart3 className="h-10 w-10" />}
          title="No analyses yet"
          description="Run your first deal analysis to see results here."
        />
      </CardContainer>
    </SectionContainer>
  );
};

export default Analysis;
