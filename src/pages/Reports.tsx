import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { EmptyStateContainer } from "@/components/ui/empty-state-container";
import { CardContainer } from "@/components/ui/card-container";
import { FileText } from "lucide-react";

const Reports = () => {
  return (
    <SectionContainer>
      <PageHeader title="Reports" description="Generated reports and exports" />
      <CardContainer>
        <EmptyStateContainer
          icon={<FileText className="h-10 w-10" />}
          title="No reports yet"
          description="Reports will be generated from your deal analyses."
        />
      </CardContainer>
    </SectionContainer>
  );
};

export default Reports;
