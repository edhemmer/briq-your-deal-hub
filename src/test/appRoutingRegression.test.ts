import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const findIQSource = readFileSync(resolve(process.cwd(), "src/pages/FindIQ.tsx"), "utf8");
const dealIQLandingSource = readFileSync(resolve(process.cwd(), "src/components/dealiq/DealIQLanding.tsx"), "utf8");
const dealCompareSource = readFileSync(resolve(process.cwd(), "src/pages/DealCompare.tsx"), "utf8");
const dashboardSource = readFileSync(resolve(process.cwd(), "src/pages/Index.tsx"), "utf8");
const offerIQSource = readFileSync(resolve(process.cwd(), "src/pages/OfferIQ.tsx"), "utf8");
const pipelineIQSource = readFileSync(resolve(process.cwd(), "src/pages/PipelineIQ.tsx"), "utf8");
const portfolioIQSource = readFileSync(resolve(process.cwd(), "src/pages/PortfolioIQ.tsx"), "utf8");
const reportsSource = readFileSync(resolve(process.cwd(), "src/pages/Reports.tsx"), "utf8");
const helpContentSource = readFileSync(resolve(process.cwd(), "src/components/help/helpContent.ts"), "utf8");
const analysisContextGateSource = readFileSync(resolve(process.cwd(), "src/components/analysis/AnalysisContextGate.tsx"), "utf8");
const appLayoutSource = readFileSync(resolve(process.cwd(), "src/components/AppLayout.tsx"), "utf8");
const topNavSource = readFileSync(resolve(process.cwd(), "src/components/TopNav.tsx"), "utf8");
const dealsHookSource = readFileSync(resolve(process.cwd(), "src/hooks/useDeals.ts"), "utf8");
const iosModelsSource = readFileSync(resolve(process.cwd(), "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AppModels.swift"), "utf8");
const iosFindIQSource = readFileSync(resolve(process.cwd(), "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/FindIQView.swift"), "utf8");
const iosDealIQSource = readFileSync(resolve(process.cwd(), "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/DealIQCockpitView.swift"), "utf8");
const iosOfferIQSource = readFileSync(resolve(process.cwd(), "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/OfferIQView.swift"), "utf8");
const iosPipelineIQSource = readFileSync(resolve(process.cwd(), "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/PipelineIQView.swift"), "utf8");
const iosPortfolioIQSource = readFileSync(resolve(process.cwd(), "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/PortfolioOSView.swift"), "utf8");
const iosServicesSource = readFileSync(resolve(process.cwd(), "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/Services.swift"), "utf8");
const iosAppStateSource = readFileSync(resolve(process.cwd(), "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AppState.swift"), "utf8");
const iosAccountSource = readFileSync(resolve(process.cwd(), "ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AccountView.swift"), "utf8");
const supabaseClientSource = readFileSync(resolve(process.cwd(), "src/integrations/supabase/client.ts"), "utf8");

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

  it("refreshes native iOS Supabase sessions instead of surfacing expired JWT errors", () => {
    expect(iosServicesSource).toContain("grant_type=refresh_token");
    expect(iosServicesSource).toContain("func refreshSession");
    expect(iosAppStateSource).toContain("func extractListing(from text: String)");
    expect(iosAppStateSource).toContain("func requestAccountDeletion");
    expect(iosAppStateSource).toContain("refreshStoredSession");
    expect(iosAppStateSource).toContain("recoverExpiredSessionIfNeeded");
    expect(iosAppStateSource).toContain("isExpiredAuthError");
    expect(iosAppStateSource).toContain("Sign in to continue.");
    expect(iosFindIQSource).toContain("appState.extractListing");
    expect(iosFindIQSource).not.toContain("BRIXAPIClient().extractListing");
    expect(iosFindIQSource).not.toContain("Deal packet ready");
    expect(iosFindIQSource).not.toContain("Property source");
    expect(iosAppStateSource).toContain("apiClient.requestAccountDeletion");
    expect(iosAccountSource).toContain("appState.requestAccountDeletion");
    expect(iosAccountSource).not.toContain("apiClient.requestAccountDeletion");
    expect(supabaseClientSource).toContain("autoRefreshToken: true");
    expect(supabaseClientSource).toContain("persistSession: true");
  });

  it("keeps module navigation focused on real workflow actions", () => {
    expect(appLayoutSource).not.toContain("DealOperatingStrip");
    expect(topNavSource).not.toContain("Search deals, addresses, reports");
    expect(findIQSource).toContain("Deal intake");
    expect(findIQSource).not.toContain("Start property");
    expect(dashboardSource).not.toContain("Start Property");
    expect(dashboardSource).not.toContain("workspace");
    expect(dashboardSource).toContain("property address or listing link");
    expect(dealIQLandingSource).not.toContain("<span className=\"hidden sm:inline\">Import</span>");
    expect(dealIQLandingSource).not.toContain("Continue source review");
    expect(dealCompareSource).toContain("Start in FindIQ");
    expect(dealCompareSource).not.toContain("Start Property");
    expect(offerIQSource).not.toContain("FileSignature");
    expect(pipelineIQSource).toContain("Start in FindIQ");
    expect(portfolioIQSource).not.toContain("Add property");
    expect(reportsSource).not.toContain("Open report tools");
    expect(reportsSource).not.toContain('Link to="/dealiq/compare">Compare');
  });

  it("keeps trust and intake behavior consistent across modules", () => {
    expect(dealCompareSource).toContain("dealReadinessScore(deal, { requireLocation: true, requireSource: true })");
    expect(dealCompareSource).toContain("missingDealInputs(deal, { requireLocation: true, requireSource: true })");
    expect(dealCompareSource).toContain("evaluateDealStrategies");
    expect(dealCompareSource).toContain("selectedStrategy");
    expect(dealCompareSource).toContain("bestStrategy");
    expect(dealCompareSource).toContain("analyzeDealIntelligence(analysis, { strategy: deal.strategy_primary })");
    expect(dealCompareSource).not.toContain("const requiredFields");
    expect(dashboardSource).toContain("dealReadinessScore(deal, { requireLocation: true, requireSource: true })");
    expect(findIQSource).toContain("formatPropertyIdentity");
    expect(findIQSource).toContain("setQuickParsedFields");
    expect(analysisContextGateSource).toContain("Confirm Deal Setup");
    expect(analysisContextGateSource).toContain("const nextCountry = e.target.value");
    expect(analysisContextGateSource).toContain("const nextRegion = e.target.value");
    expect(helpContentSource).toContain("Enter a property address or listing link");
    expect(helpContentSource).not.toContain("Create an acquisition profile");
    expect(helpContentSource).not.toContain("admin console tracks");
  });

  it("keeps native iOS module screens actionable instead of informational only", () => {
    expect(iosOfferIQSource).toContain("Open DealIQ");
    expect(iosOfferIQSource).toContain("appState.selectedTab = .deal");
    expect(iosOfferIQSource).toContain("Start in FindIQ");
    expect(iosPipelineIQSource).toContain("Start in FindIQ");
    expect(iosPortfolioIQSource).toContain("Start in FindIQ");
  });
});
