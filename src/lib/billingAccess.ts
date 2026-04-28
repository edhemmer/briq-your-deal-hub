/**
 * BRIX Billing Access Helper
 * Single source of truth for subscription state, deal creation access, and Stripe readiness.
 */

export type SubscriptionStatus =
  | "free"
  | "active"
  | "inactive"
  | "canceled"
  | "admin_override"
  | "manual_override"
  | "billing_not_configured";

export type AccessSource = "manual_override" | "stripe_active" | "free_tier" | "locked";

export interface BillingProfile {
  subscription_status: string | null;
  free_deal_used: boolean | null;
  admin_override: boolean | null;
  manual_premium_override: boolean | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export interface BillingAccessResult {
  canCreateDeal: boolean;
  canExport: boolean;
  reason: string;
  subscriptionState: SubscriptionStatus;
  accessSource: AccessSource;
  isStripeConfigured: boolean;
  isFreeUser: boolean;
  hasUsedFreeDeal: boolean;
}

const STRIPE_PRODUCT_ID = import.meta.env.VITE_STRIPE_PRODUCT_ID ?? "";
const STRIPE_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID ?? "";

export function isStripeConfigured(): boolean {
  return !!(STRIPE_PRODUCT_ID && STRIPE_PRICE_ID);
}

export function resolveAccessSource(profile: BillingProfile | null): AccessSource {
  if (!profile) return "free_tier";
  if (profile.manual_premium_override) return "manual_override";
  if (profile.admin_override) return "manual_override";
  const status = profile.subscription_status ?? "free";
  if (status === "active" || status === "admin_override") return "stripe_active";
  if (status === "free") return "free_tier";
  return "locked";
}

export function resolveSubscriptionState(profile: BillingProfile | null): SubscriptionStatus {
  if (!profile) return "free";
  // 1. Manual premium override (highest priority)
  if (profile.manual_premium_override) return "manual_override";
  // 2. Legacy admin override
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
  const accessSource = resolveAccessSource(profile);
  const stripeReady = isStripeConfigured();
  const hasUsedFreeDeal = profile?.free_deal_used ?? false;
  const isFreeUser = subscriptionState === "free";

  // 1. Manual premium override: full access
  if (subscriptionState === "manual_override" || subscriptionState === "admin_override") {
    return {
      canCreateDeal: true,
      canExport: true,
      reason: "Premium access via manual override",
      subscriptionState,
      accessSource: "manual_override",
      isStripeConfigured: stripeReady,
      isFreeUser: false,
      hasUsedFreeDeal,
    };
  }

  // 2. Active Stripe subscriber: full access
  if (subscriptionState === "active") {
    return {
      canCreateDeal: true,
      canExport: true,
      reason: "Active subscription",
      subscriptionState,
      accessSource: "stripe_active",
      isStripeConfigured: stripeReady,
      isFreeUser: false,
      hasUsedFreeDeal,
    };
  }

  // 3. Free user: first deal free
  if (isFreeUser && !hasUsedFreeDeal) {
    return {
      canCreateDeal: true,
      canExport: true,
      reason: "First free deal available",
      subscriptionState,
      accessSource: "free_tier",
      isStripeConfigured: stripeReady,
      isFreeUser: true,
      hasUsedFreeDeal: false,
    };
  }

  // 4. Locked state
  const reason = !stripeReady
    ? "Subscription billing will be enabled once platform configuration is completed."
    : "Subscription required to create additional deals.";

  return {
    canCreateDeal: false,
    canExport: false,
    reason,
    subscriptionState: !stripeReady ? "billing_not_configured" : subscriptionState,
    accessSource: "locked",
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
  return "Upgrade to BRIX Pro at $155.99/month for unlimited deal analysis.";
}

export function getAccessSourceLabel(source: AccessSource): string {
  switch (source) {
    case "manual_override": return "Manual Override";
    case "stripe_active": return "Stripe Active";
    case "free_tier": return "Free Tier";
    case "locked": return "Locked";
  }
}
