import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { EmptyStateContainer } from "@/components/ui/empty-state-container";
import { CardContainer } from "@/components/ui/card-container";
import { Briefcase } from "lucide-react";

const Deals = () => {
  return (
    <SectionContainer>
      <PageHeader title="Deals" description="Manage your real estate deal pipeline" />
      <CardContainer>
        <EmptyStateContainer
          icon={<Briefcase className="h-10 w-10" />}
          title="No deals yet"
          description="Your analyzed deals will appear here."
        />
      </CardContainer>
    </SectionContainer>
  );
};

export default Deals;
