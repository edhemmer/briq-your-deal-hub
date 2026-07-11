import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const findIQSource = readFileSync(resolve(process.cwd(), "src/pages/FindIQ.tsx"), "utf8");

describe("app route regression", () => {
  it("keeps specific DealIQ routes before the optional deal id catch-all", () => {
    expect(appSource.indexOf('path="/dealiq/compare"')).toBeLessThan(appSource.indexOf('path="/dealiq/:dealId?"'));
    expect(appSource.indexOf('path="/dealiq/new"')).toBeLessThan(appSource.indexOf('path="/dealiq/:dealId?"'));
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
});
