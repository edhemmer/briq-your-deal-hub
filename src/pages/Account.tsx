import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useDeals } from "@/hooks/useDeals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Lock } from "lucide-react";
import { evaluateBillingAccess, getUpgradeMessage } from "@/lib/billingAccess";

const MAX_DEALS = 15;

const Account = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: deals } = useDeals();
  const billingAccess = evaluateBillingAccess(profile ?? null, deals?.length ?? 0);

  return (
    <SectionContainer>
      <PageHeader title="Account" description="Manage your account and preferences" />

      <div className="space-y-4 max-w-xl">
        <CardContainer className="p-5 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Account Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subscription</span>
              <Badge variant="outline" className="text-xs capitalize">
                {billingAccess.subscriptionState.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deals Used</span>
              <span className="text-foreground font-medium">{deals?.length ?? 0} / {MAX_DEALS}</span>
            </div>
          </div>
        </CardContainer>

        <CardContainer className="p-5 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Billing</h2>
          {billingAccess.isStripeConfigured ? (
            <p className="text-sm text-muted-foreground">Manage your subscription and payment method.</p>
          ) : (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Subscription billing will be enabled once platform configuration is completed.</p>
            </div>
          )}
        </CardContainer>

        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </SectionContainer>
  );
};

export default Account;
