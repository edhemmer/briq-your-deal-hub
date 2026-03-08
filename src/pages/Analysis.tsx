import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { EmptyStateContainer } from "@/components/ui/empty-state-container";
import { CardContainer } from "@/components/ui/card-container";
import { BarChart3 } from "lucide-react";

const Analysis = () => {
  const { dealId } = useParams();

  return (
    <SectionContainer>
      <PageHeader
        title="Analysis"
        description={dealId ? `Deal ${dealId.slice(0, 8)}…` : "Deal analysis and financial modeling"}
      />
      <CardContainer>
        <EmptyStateContainer
          icon={<BarChart3 className="h-10 w-10" />}
          title="Analysis coming soon"
          description="Deal intelligence and scoring will appear here."
        />
      </CardContainer>
    </SectionContainer>
  );
};

export default Analysis;
