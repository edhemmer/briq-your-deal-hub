import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { SectionContainer } from "@/components/ui/section-container";
import { CardContainer } from "@/components/ui/card-container";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useDeals } from "@/hooks/useDeals";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink, LogOut, Lock, Trash2 } from "lucide-react";
import { evaluateBillingAccess } from "@/lib/billingAccess";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MAX_DEALS = 15;

const Account = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: deals } = useDeals();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const billingAccess = evaluateBillingAccess(profile ? {
    subscription_status: profile.subscription_status,
    free_deal_used: profile.free_deal_used,
    admin_override: profile.admin_override ?? false,
    manual_premium_override: profile.manual_premium_override ?? false,
    stripe_customer_id: profile.stripe_customer_id,
    stripe_subscription_id: profile.stripe_subscription_id,
  } : null, deals?.length ?? 0);

  const requestAccountDeletion = async () => {
    const confirmed = window.confirm(
      "Permanently delete your BRIX account and associated personal data? This is not temporary deactivation.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    const { error } = await supabase.functions.invoke("request-account-deletion", {
      body: {
        source: "web",
        confirmDeletion: true,
      },
    });
    setIsDeleting(false);

    if (error) {
      toast({
        title: "Account deletion failed",
        description: "BRIX could not complete deletion. Please try again or contact support.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Account deletion started",
      description: "Your account has been deleted or is being finalized. You will be signed out.",
    });
    await signOut();
  };

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

        <CardContainer className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Delete Account</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Permanently delete your BRIX account and associated personal data, except records BRIX is legally required to retain. This is not temporary deactivation.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={requestAccountDeletion} disabled={isDeleting} className="gap-2">
              <Trash2 className="h-4 w-4" />
              {isDeleting ? "Deleting..." : "Permanently Delete Account"}
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link to="/privacy">
                Privacy Policy <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContainer>

        <Button variant="outline" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </SectionContainer>
  );
};

export default Account;
