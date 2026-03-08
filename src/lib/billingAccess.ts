/**
 * BRIQ Billing Access Helper
 * Single source of truth for subscription state, deal creation access, and Stripe readiness.
 */

export type SubscriptionStatus =
  | "free"
  | "active"
  | "inactive"
  | "canceled"
  | "admin_override"
  | "billing_not_configured";

export interface BillingProfile {
  subscription_status: string | null;
  free_deal_used: boolean | null;
  admin_override: boolean | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export interface BillingAccessResult {
  canCreateDeal: boolean;
  canExport: boolean;
  reason: string;
  subscriptionState: SubscriptionStatus;
  isStripeConfigured: boolean;
  isFreeUser: boolean;
  hasUsedFreeDeal: boolean;
}

const STRIPE_PRODUCT_ID = import.meta.env.VITE_STRIPE_PRODUCT_ID ?? "";
const STRIPE_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID ?? "";

export function isStripeConfigured(): boolean {
  return !!(STRIPE_PRODUCT_ID && STRIPE_PRICE_ID);
}

export function resolveSubscriptionState(profile: BillingProfile | null): SubscriptionStatus {
  if (!profile) return "free";
  if (profile.admin_override) return "admin_override";

  const status = profile.subscription_status ?? "free";

  if (status === "active") return "active";
  if (status === "canceled") return "canceled";
  if (status === "inactive") return "inactive";

  return "free";
}

export function evaluateBillingAccess(
  profile: BillingProfile | null,
  dealCount: number
): BillingAccessResult {
  const subscriptionState = resolveSubscriptionState(profile);
  const stripeReady = isStripeConfigured();
  const hasUsedFreeDeal = profile?.free_deal_used ?? false;
  const isFreeUser = subscriptionState === "free";

  // Admin override: full access
  if (subscriptionState === "admin_override") {
    return {
      canCreateDeal: true,
      canExport: true,
      reason: "Admin override active",
      subscriptionState,
      isStripeConfigured: stripeReady,
      isFreeUser: false,
      hasUsedFreeDeal,
    };
  }

  // Active subscriber: full access
  if (subscriptionState === "active") {
    return {
      canCreateDeal: true,
      canExport: true,
      reason: "Active subscription",
      subscriptionState,
      isStripeConfigured: stripeReady,
      isFreeUser: false,
      hasUsedFreeDeal,
    };
  }

  // Free user: first deal free
  if (isFreeUser && !hasUsedFreeDeal) {
    return {
      canCreateDeal: true,
      canExport: true,
      reason: "First free deal available",
      subscriptionState,
      isStripeConfigured: stripeReady,
      isFreeUser: true,
      hasUsedFreeDeal: false,
    };
  }

  // Free user who used free deal, or inactive/canceled
  const reason = !stripeReady
    ? "Subscription billing will be enabled once platform configuration is completed."
    : "Subscription required to create additional deals.";

  return {
    canCreateDeal: false,
    canExport: false,
    reason,
    subscriptionState: !stripeReady ? "billing_not_configured" : subscriptionState,
    isStripeConfigured: stripeReady,
    isFreeUser,
    hasUsedFreeDeal,
  };
}

export function getUpgradeMessage(access: BillingAccessResult): string {
  if (access.canCreateDeal) return "";
  if (!access.isStripeConfigured) {
    return "Subscription billing will be enabled once platform configuration is completed.";
  }
  return "Upgrade to BRIQ Pro at $155.99/month for unlimited deal analysis.";
}
