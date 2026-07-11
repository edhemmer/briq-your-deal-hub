import { describe, expect, it } from "vitest";
import { evaluateBillingAccess, FREE_DEAL_LIMIT, type BillingProfile } from "@/lib/billingAccess";

const freeProfile: BillingProfile = {
  subscription_status: "free",
  free_deal_used: false,
  admin_override: false,
  manual_premium_override: false,
  stripe_customer_id: null,
  stripe_subscription_id: null,
};

describe("billing access regression", () => {
  it("allows free users below the lifetime deal limit", () => {
    const access = evaluateBillingAccess(freeProfile, FREE_DEAL_LIMIT - 1);

    expect(access.canCreateDeal).toBe(true);
    expect(access.dealsRemaining).toBe(1);
  });

  it("hard locks free users at the lifetime deal limit", () => {
    const access = evaluateBillingAccess(freeProfile, FREE_DEAL_LIMIT);

    expect(access.canCreateDeal).toBe(false);
    expect(access.canExport).toBe(false);
    expect(access.reason).toContain("15 deal files");
    expect(access.dealsRemaining).toBe(0);
  });

  it("does not apply the free deal cap to paid or manually comped users", () => {
    const paid = evaluateBillingAccess({ ...freeProfile, subscription_status: "active" }, FREE_DEAL_LIMIT + 100);
    const comped = evaluateBillingAccess({ ...freeProfile, manual_premium_override: true }, FREE_DEAL_LIMIT + 100);

    expect(paid.canCreateDeal).toBe(true);
    expect(paid.dealsRemaining).toBeNull();
    expect(comped.canCreateDeal).toBe(true);
    expect(comped.dealsRemaining).toBeNull();
  });
});
