/**
 * BRIX v1.6.0 — Analysis Context Gate Component
 *
 * Required market type, asset type, strategy, and risk tolerance selection
 * before analysis can run. Clean, minimal UI.
 */

import { useState, useCallback } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HelpTooltip } from "@/components/help/HelpTooltip";
import { Shield, Target, Globe, Building2, Home, ChevronRight } from "lucide-react";
import {
  type MarketType,
  type InvestmentStrategy,
  type RiskTolerance,
  type AnalysisContext,
  type InternationalContext,
  MARKET_TYPE_LABELS,
  US_RESIDENTIAL_ASSET_LABELS,
  US_COMMERCIAL_ASSET_LABELS,
  STRATEGY_LABELS,
  STRATEGY_DESCRIPTIONS,
  RISK_TOLERANCE_LABELS,
  RISK_TOLERANCE_DESCRIPTIONS,
  isContextComplete,
} from "@/lib/marketProfiles";
import { GLOSSARY } from "@/lib/glossary";

interface AnalysisContextGateProps {
  onContextComplete: (context: AnalysisContext) => void;
  initialContext?: Partial<AnalysisContext>;
}

export function AnalysisContextGate({ onContextComplete, initialContext }: AnalysisContextGateProps) {
  const [marketType, setMarketType] = useState<MarketType | "">(initialContext?.marketType ?? "");
  const [assetType, setAssetType] = useState<string>(initialContext?.assetType ?? "");
  const [strategy, setStrategy] = useState<InvestmentStrategy | "">(initialContext?.strategy ?? "");
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance | "">(initialContext?.riskTolerance ?? "");
  const [intlCountry, setIntlCountry] = useState(initialContext?.internationalContext?.country ?? "");
  const [intlRegion, setIntlRegion] = useState(initialContext?.internationalContext?.region ?? "");

  const buildContext = useCallback((): Partial<AnalysisContext> => {
    const ctx: Partial<AnalysisContext> = {
      marketType: marketType || undefined,
      assetType: assetType || undefined,
      strategy: strategy || undefined,
      riskTolerance: riskTolerance || undefined,
    };
    if (marketType === "international") {
      ctx.internationalContext = { country: intlCountry, region: intlRegion };
    }
    return ctx;
  }, [marketType, assetType, strategy, riskTolerance, intlCountry, intlRegion]);

  const handleSubmit = useCallback(() => {
    const ctx = buildContext();
    if (isContextComplete(ctx)) {
      onContextComplete(ctx);
    }
  }, [buildContext, onContextComplete]);

  const contextReady = isContextComplete(buildContext());

  // Reset asset type when market type changes
  const handleMarketTypeChange = (val: string) => {
    setMarketType(val as MarketType);
    setAssetType("");
    setIntlCountry("");
    setIntlRegion("");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-foreground">Confirm Deal Setup</h2>
        <p className="text-sm text-muted-foreground">
          Select your market type, asset class, investment strategy, and risk tolerance to begin analysis.
        </p>
      </div>

      {/* Market Type */}
      <CardContainer className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-semibold text-foreground">Market Type</Label>
        </div>
        <RadioGroup value={marketType} onValueChange={handleMarketTypeChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.entries(MARKET_TYPE_LABELS) as [MarketType, string][]).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                marketType === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <RadioGroupItem value={key} />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </label>
          ))}
        </RadioGroup>
      </CardContainer>

      {/* Asset Type Sub-Gate */}
      {marketType === "us_residential" && (
        <CardContainer className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold text-foreground">Residential Asset Type</Label>
          </div>
          <RadioGroup value={assetType} onValueChange={setAssetType} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(US_RESIDENTIAL_ASSET_LABELS).map(([key, label]) => (
              <label
                key={key}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  assetType === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={key} />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </label>
            ))}
          </RadioGroup>
        </CardContainer>
      )}

      {marketType === "us_commercial" && (
        <CardContainer className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold text-foreground">Commercial Asset Type</Label>
          </div>
          <RadioGroup value={assetType} onValueChange={setAssetType} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(US_COMMERCIAL_ASSET_LABELS).map(([key, label]) => (
              <label
                key={key}
                className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  assetType === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={key} />
                <span className="text-sm font-medium text-foreground">{label}</span>
              </label>
            ))}
          </RadioGroup>
        </CardContainer>
      )}

      {marketType === "international" && (
        <CardContainer className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold text-foreground">International Location</Label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Input
                value={intlCountry}
                onChange={e => {
                  const nextCountry = e.target.value;
                  setIntlCountry(nextCountry);
                  setAssetType(nextCountry && intlRegion ? "international" : "");
                }}
                onBlur={() => { if (intlCountry && intlRegion) setAssetType("international"); }}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Region / City</Label>
              <Input
                value={intlRegion}
                onChange={e => {
                  const nextRegion = e.target.value;
                  setIntlRegion(nextRegion);
                  setAssetType(intlCountry && nextRegion ? "international" : "");
                }}
                onBlur={() => { if (intlCountry && intlRegion) setAssetType("international"); }}
                className="h-9"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            International analysis uses broader thresholds and requires local market, financing, legal, tax, and professional verification before action.
          </p>
        </CardContainer>
      )}

      {/* Strategy Selection */}
      {marketType && (
        <CardContainer className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold text-foreground">Investment Strategy</Label>
            <HelpTooltip content="Select the primary strategy you plan to use for this deal. This affects how results are evaluated and which metrics are prioritized." />
          </div>
          <RadioGroup value={strategy} onValueChange={v => setStrategy(v as InvestmentStrategy)} className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(Object.entries(STRATEGY_LABELS) as [InvestmentStrategy, string][]).map(([key, label]) => (
              <label
                key={key}
                className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  strategy === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={key} className="mt-0.5" />
                <div className="space-y-1">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <p className="text-xs text-muted-foreground">{STRATEGY_DESCRIPTIONS[key]}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            Advanced strategies may require stronger verification, professional review, and lower confidence until supporting data is complete.
          </p>
        </CardContainer>
      )}

      {/* Risk Tolerance */}
      {marketType && strategy && (
        <CardContainer className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold text-foreground">Risk Tolerance</Label>
            <HelpTooltip content={GLOSSARY.unseen_risk_buffer?.definition ?? "Adjusts analysis thresholds and downside assumptions based on your risk preference."} />
          </div>
          <RadioGroup value={riskTolerance} onValueChange={v => setRiskTolerance(v as RiskTolerance)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.entries(RISK_TOLERANCE_LABELS) as [RiskTolerance, string][]).map(([key, label]) => (
              <label
                key={key}
                className={`flex flex-col gap-1.5 rounded-lg border p-4 cursor-pointer transition-colors ${
                  riskTolerance === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={key} />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">{RISK_TOLERANCE_DESCRIPTIONS[key]}</p>
              </label>
            ))}
          </RadioGroup>
        </CardContainer>
      )}

      {/* Submit */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!contextReady && (
            <p className="text-xs text-muted-foreground">Confirm the setup above to begin analysis.</p>
          )}
        </div>
        <Button onClick={handleSubmit} disabled={!contextReady} className="gap-2">
          Begin Analysis
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
