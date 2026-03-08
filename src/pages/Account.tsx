import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { EmptyStateContainer } from "@/components/ui/empty-state-container";
import { CardContainer } from "@/components/ui/card-container";
import { User } from "lucide-react";

const Account = () => {
  return (
    <SectionContainer>
      <PageHeader title="Account" description="Manage your account and preferences" />
      <CardContainer>
        <EmptyStateContainer
          icon={<User className="h-10 w-10" />}
          title="Account settings"
          description="Account management will be available here."
        />
      </CardContainer>
    </SectionContainer>
  );
};

export default Account;
