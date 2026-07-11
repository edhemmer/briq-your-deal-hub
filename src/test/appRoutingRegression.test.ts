import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const findIQSource = readFileSync(resolve(process.cwd(), "src/pages/FindIQ.tsx"), "utf8");
const dealsHookSource = readFileSync(resolve(process.cwd(), "src/hooks/useDeals.ts"), "utf8");
const iosModelsSource = readFileSync(resolve(process.cwd(), "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AppModels.swift"), "utf8");
const iosFindIQSource = readFileSync(resolve(process.cwd(), "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/FindIQView.swift"), "utf8");
const iosDealIQSource = readFileSync(resolve(process.cwd(), "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/DealIQCockpitView.swift"), "utf8");

describe("app route regression", () => {
  it("keeps specific DealIQ routes before the optional deal id catch-all", () => {
    expect(appSource.indexOf('path="/dealiq/compare"')).toBeLessThan(appSource.indexOf('path="/dealiq/:dealId?"'));
    expect(appSource.indexOf('path="/dealiq/new"')).toBeLessThan(appSource.indexOf('path="/dealiq/:dealId?"'));
    expect(appSource).toContain('path="/dealiq/new"');
    expect(appSource).toContain('<Navigate to="/findiq" replace />');
  });

  it("registers all primary BRIX module routes", () => {
    [
      "/dashboard",
      "/findiq",
      "/dealiq/compare",
      "/dealiq/new",
      "/dealiq/:dealId?",
      "/offeriq",
      "/pipelineiq",
      "/portfolioiq",
      "/contractiq",
      "/reports",
      "/settings",
      "/help",
    ].forEach((route) => {
      expect(appSource).toContain(`path="${route}"`);
    });
  });

  it("wraps protected app pages in route-level fault isolation", () => {
    expect(appSource).toContain("function ProtectedAppPage");
    expect(appSource).toContain("<RouteErrorBoundary routeName={routeName}>");
  });

  it("keeps FindIQ deal creation bounded and visibly pending", () => {
    expect(findIQSource).toContain("function withTimeout");
    expect(findIQSource).toContain('supabase.functions.invoke("extract-deal-from-text"');
    expect(findIQSource).toContain("setIsQuickScanning(true)");
    expect(findIQSource).toContain("finally");
    expect(findIQSource).toContain("Creating...");
    expect(findIQSource).toContain("navigate(`/dealiq/${deal.id}`)");
  });

  it("keeps deal creation resilient to missing billing metadata", () => {
    expect(dealsHookSource).toContain(".maybeSingle()");
    expect(dealsHookSource).toContain("loadBillingProfile");
    expect(dealsHookSource).toContain("ensure_current_profile");
    expect(dealsHookSource).toContain("Unable to prepare your account profile");
    expect(dealsHookSource).toContain("Unable to verify deal file limit");
    expect(dealsHookSource).toContain("DEVELOPER_ACCESS_EMAILS");
  });

  it("keeps FindIQ as the only user-facing deal creation path", () => {
    expect(appSource).not.toContain("import(\"./pages/NewDeal\")");
    expect(appSource).toContain('path="/deals/new" element={<Navigate to="/findiq" replace />}');
    expect(findIQSource).toContain("Create deal file");
  });

  it("keeps native iOS strategy coverage aligned with the full BRIX strategy set", () => {
    [
      "Owner Occupant",
      "Buy & Hold",
      "House Hack",
      "Long-Term Rental",
      "Mid-Term Rental",
      "Short-Term Rental",
      "BRRRR",
      "Hybrid BRRRR",
      "Fix & Flip",
      "Refinance",
      "Hold",
      "Sell",
      "Seller Finance",
      "Subject-To",
      "Lease Option",
      "Wrap Mortgage",
      "ADU / Value-Add",
      "Lot Split",
      "Mixed Use Conversion",
      "Commercial Repositioning",
      "Development",
      "1031 Exchange",
    ].forEach((strategy) => {
      expect(findIQSource).toContain(strategy);
      expect(iosModelsSource).toContain(strategy);
    });

    expect(iosFindIQSource).toContain("brixStrategyDefinitions");
    expect(iosDealIQSource).toContain("rankedStrategyDefinitions");
    expect(iosDealIQSource).toContain("Proof:");
  });
});
