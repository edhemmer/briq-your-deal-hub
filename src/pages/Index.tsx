import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { DashboardWorkspace } from "@/components/ui/dashboard-workspace";
import { EmptyStateContainer } from "@/components/ui/empty-state-container";
import { PrimaryButton } from "@/components/ui/primary-button";
import { LayoutDashboard } from "lucide-react";

const Index = () => {
  return (
    <SectionContainer>
      <PageHeader
        title="BRIQ"
        description="Real Estate Deal Intelligence"
      >
        <PrimaryButton>
          <Plus className="h-4 w-4 mr-2" />
          Analyze New Deal
        </PrimaryButton>
      </PageHeader>

      <DashboardWorkspace>
        <EmptyStateContainer
          icon={<LayoutDashboard className="h-10 w-10" />}
          title="Your workspace is ready"
          description="Start by analyzing a new deal. Insights and analytics will appear here."
        />
      </DashboardWorkspace>
    </SectionContainer>
  );
};

export default Index;
