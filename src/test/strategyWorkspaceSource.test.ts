import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("strategy workspace source boundaries", () => {
  const appSource = () => fs.readFileSync(path.join(process.cwd(), "src", "App.tsx"), "utf8");
  const componentSource = () => fs.readFileSync(path.join(process.cwd(), "src", "components", "StrategyWorkspace.tsx"), "utf8");
  const cssSource = () => fs.readFileSync(path.join(process.cwd(), "src", "styles", "app.css"), "utf8");

  it("exposes Strategy Intelligence inside the existing active Deal workspace", () => {
    const source = appSource();

    expect(source).toContain('"strategies"');
    expect(source).toContain('label: "Strategies"');
    expect(source).toContain("<DealStrategySection");
    expect(source).toContain("buildStrategyPresentation");
  });

  it("renders accessible comparison and history surfaces without authoritative strategy logic", () => {
    const source = componentSource();

    expect(source).toContain('role="region"');
    expect(source).toContain('aria-label="Strategy Intelligence workspace"');
    expect(source).toContain('aria-label="Canonical strategy ranking"');
    expect(source).toContain("<caption>Canonical comparison. No additional comparison score is calculated here.</caption>");
    expect(source).toContain('aria-label="Strategy history"');
    expect(source).not.toMatch(/\bevaluateStrategyCompatibility\b|\bevaluateStrategyScore\b|\bevaluateStrategyRanking\b|\bcalculateStrategyConfidence\b|\bapplyHardDisqualifier\b/i);
    expect(source).not.toMatch(/\bbuy\b|\bpass\b|\bbest deal\b|\brecommended strategy\b/i);
  });

  it("keeps strategy workspace responsive without creating a separate mobile logic path", () => {
    const source = cssSource();

    expect(source).toContain(".strategy-workspace");
    expect(source).toContain("@media (max-width: 980px)");
    expect(source).toContain("@media (max-width: 640px)");
    expect(source).toMatch(/\.strategy-workspace\s*\{\s*display:\s*grid/i);
    expect(source).toContain(".strategy-comparison-scroll { overflow-x: auto; max-width: 100%; }");
  });
});
