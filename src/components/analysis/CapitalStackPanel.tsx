import { useMemo, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Layers, Building2, Users } from "lucide-react";
import type { DealInput, AnalysisResult } from "@/lib/dealAnalysisEngine";
import type { ReturnsResult } from "@/lib/underwriting/returnsEngine";
import {
  buildSourcesUses,
  DEFAULT_CAPITAL_STACK,
  type CapitalStackInput,
  type CapitalSlice,
} from "@/lib/underwriting/sourcesUsesEngine";
import { buildWaterfall, DEFAULT_WATERFALL, type WaterfallAssumptions } from "@/lib/underwriting/waterfallEngine";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n: number | null | undefined) => n == null ? "N/A" : (n * 100).toFixed(2) + "%";
const fmtX = (n: number | null | undefined) => n == null ? "N/A" : n.toFixed(2) + "x";

const SLICE_COLOR: Record<CapitalSlice["category"], string> = {
  senior_debt: "bg-slate-700",
  mezz_debt: "bg-slate-500",
  preferred_equity: "bg-amber-500",
  gp_equity: "bg-primary",
  lp_equity: "bg-teal-500",
};

interface Props {
  input: DealInput;
  analysis: AnalysisResult;
  returns: ReturnsResult | null;
}

export function CapitalStackPanel({ input, analysis, returns }: Props) {
  const [stack, setStack] = useState<CapitalStackInput>(DEFAULT_CAPITAL_STACK);
  const [waterfall, setWaterfall] = useState<WaterfallAssumptions>(DEFAULT_WATERFALL);

  const sources = useMemo(
    () => buildSourcesUses(input, analysis, stack),
    [input, analysis, stack]
  );

  const waterfallResult = useMemo(() => {
    if (!returns || !returns.exit) return null;
    return buildWaterfall(
      {
        total_equity: sources.total_equity,
        annual_cash_flows: returns.years.map(y => y.cash_flow_before_tax),
        net_sale_proceeds: returns.exit.net_sale_proceeds,
        hold_years: returns.assumptions.hold_years,
      },
      { ...waterfall, gp_coinvest_pct: stack.gp_coinvest_pct }
    );
  }, [returns, sources.total_equity, stack.gp_coinvest_pct, waterfall]);

  const updateTier = (idx: number, patch: Partial<{ hurdle_irr: number; gp_split: number }>) => {
    setWaterfall(prev => ({
      ...prev,
      tiers: prev.tiers.map((t, i) => i === idx ? { ...t, ...patch } : t),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Sources & Uses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CardContainer>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Uses of Funds</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Item</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.uses.map((u, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs">{u.name}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{fmt(u.amount)}</TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">{(u.pct_of_total * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="text-xs font-bold">Total Uses</TableCell>
                <TableCell className="text-xs text-right font-bold">{fmt(sources.total_uses)}</TableCell>
                <TableCell className="text-xs text-right text-muted-foreground">100.0%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContainer>

        <CardContainer>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Sources of Funds</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Layer</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.sources.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs flex items-center gap-2">
                    <span className={`inline-block w-2.5 h-2.5 rounded-sm ${SLICE_COLOR[c.category]}`} />
                    {c.name}
                  </TableCell>
                  <TableCell className="text-xs text-right font-medium">{fmt(c.amount)}</TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">{(c.pct_of_total * 100).toFixed(1)}%</TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="text-xs font-bold">Total Sources</TableCell>
                <TableCell className="text-xs text-right font-bold">{fmt(sources.total_sources)}</TableCell>
                <TableCell className="text-xs text-right text-muted-foreground">100.0%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {!sources.balanced && (
            <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Sources do not balance to uses.
            </p>
          )}
        </CardContainer>
      </div>

      {/* Capital stack bar + metrics */}
      <CardContainer>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Capital Stack</h3>
          <div className="flex gap-3 text-xs">
            <span className="text-muted-foreground">LTV: <span className="font-semibold text-foreground">{fmtPct(sources.ltv)}</span></span>
            <span className="text-muted-foreground">LTC: <span className="font-semibold text-foreground">{fmtPct(sources.ltc)}</span></span>
            <span className="text-muted-foreground">Combined LTV: <span className="font-semibold text-foreground">{fmtPct(sources.combined_ltv)}</span></span>
          </div>
        </div>
        <div className="flex h-8 rounded overflow-hidden border border-border">
          {sources.sources.map((c, i) => (
            <div
              key={i}
              className={`${SLICE_COLOR[c.category]} flex items-center justify-center text-[10px] font-medium text-white`}
              style={{ width: `${c.pct_of_total * 100}%` }}
              title={`${c.name}: ${fmt(c.amount)}`}
            >
              {c.pct_of_total >= 0.06 ? `${(c.pct_of_total * 100).toFixed(0)}%` : ""}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-[11px]">
          {sources.sources.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5 text-muted-foreground">
              <span className={`inline-block w-2.5 h-2.5 rounded-sm ${SLICE_COLOR[c.category]}`} /> {c.name}
            </span>
          ))}
        </div>
        {sources.warnings.length > 0 && (
          <div className="mt-3 space-y-1">
            {sources.warnings.map((w, i) => (
              <p key={i} className="text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {w}
              </p>
            ))}
          </div>
        )}
      </CardContainer>

      {/* Stack assumptions */}
      <CardContainer>
        <h3 className="text-sm font-semibold text-foreground mb-4">Capital Stack Assumptions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">GP Co-Invest (% of equity)</Label>
            <Input
              type="number" step="0.01" className="h-8 text-sm"
              value={(stack.gp_coinvest_pct * 100).toFixed(2)}
              onChange={e => setStack(p => ({ ...p, gp_coinvest_pct: (parseFloat(e.target.value) || 0) / 100 }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mezzanine Debt ($)</Label>
            <Input
              type="number" className="h-8 text-sm"
              value={stack.mezz_amount}
              onChange={e => setStack(p => ({ ...p, mezz_amount: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Preferred Equity ($)</Label>
            <Input
              type="number" className="h-8 text-sm"
              value={stack.pref_equity_amount}
              onChange={e => setStack(p => ({ ...p, pref_equity_amount: parseFloat(e.target.value) || 0 }))}
            />
          </div>
        </div>
      </CardContainer>

      {/* Waterfall */}
      <CardContainer>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Distribution Waterfall (European)</h3>
          </div>
          <Badge variant="outline" className="text-xs">Year-N exit</Badge>
        </div>

        {!waterfallResult ? (
          <p className="text-xs text-muted-foreground">
            Waterfall requires the Returns model exit projection. Configure hold assumptions in the Returns tab.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
              <ReturnTile label="LP IRR" value={fmtPct(waterfallResult.returns.lp_irr)} emphasis />
              <ReturnTile label="GP IRR" value={fmtPct(waterfallResult.returns.gp_irr)} />
              <ReturnTile label="LP Multiple" value={fmtX(waterfallResult.returns.lp_multiple)} />
              <ReturnTile label="GP Multiple" value={fmtX(waterfallResult.returns.gp_multiple)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Preferred Return Rate</Label>
                <Input
                  type="number" step="0.001" className="h-8 text-sm"
                  value={(waterfall.pref_rate * 100).toFixed(2)}
                  onChange={e => setWaterfall(p => ({ ...p, pref_rate: (parseFloat(e.target.value) || 0) / 100 }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border border-border px-3 h-8 mt-5">
                <Label className="text-xs text-muted-foreground">GP Catch-up Tier</Label>
                <Switch checked={waterfall.catch_up} onCheckedChange={(v) => setWaterfall(p => ({ ...p, catch_up: v }))} />
              </div>
            </div>

            <div className="space-y-2 mb-5">
              <Label className="text-xs text-muted-foreground">Promote Tiers (hurdle IRR → GP split)</Label>
              {waterfall.tiers.map((t, i) => (
                <div key={i} className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-16">Hurdle {i + 1}</span>
                    <Input
                      type="number" step="0.01" className="h-8 text-sm"
                      value={(t.hurdle_irr * 100).toFixed(2)}
                      onChange={e => updateTier(i, { hurdle_irr: (parseFloat(e.target.value) || 0) / 100 })}
                    />
                    <span className="text-[11px] text-muted-foreground">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground w-16">GP %</span>
                    <Input
                      type="number" step="0.01" className="h-8 text-sm"
                      value={(t.gp_split * 100).toFixed(2)}
                      onChange={e => updateTier(i, { gp_split: (parseFloat(e.target.value) || 0) / 100 })}
                    />
                    <span className="text-[11px] text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Tier</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs text-right">To LP</TableHead>
                  <TableHead className="text-xs text-right">To GP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waterfallResult.distributions.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{d.tier}</TableCell>
                    <TableCell className="text-xs text-right font-medium">{fmt(d.total)}</TableCell>
                    <TableCell className="text-xs text-right text-teal-700 dark:text-teal-300">{fmt(d.to_lp)}</TableCell>
                    <TableCell className="text-xs text-right text-primary">{fmt(d.to_gp)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell className="text-xs font-bold">Total Distributed</TableCell>
                  <TableCell className="text-xs text-right font-bold">{fmt(waterfallResult.total_distributable)}</TableCell>
                  <TableCell className="text-xs text-right font-bold text-teal-700 dark:text-teal-300">{fmt(waterfallResult.totals.lp_total)}</TableCell>
                  <TableCell className="text-xs text-right font-bold text-primary">{fmt(waterfallResult.totals.gp_total)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs text-muted-foreground">Profit (after capital return)</TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">
                    {fmt(waterfallResult.totals.lp_profit + waterfallResult.totals.gp_profit)}
                  </TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">{fmt(waterfallResult.totals.lp_profit)}</TableCell>
                  <TableCell className="text-xs text-right text-muted-foreground">{fmt(waterfallResult.totals.gp_profit)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <p className="text-[11px] text-muted-foreground mt-3 flex items-start gap-1.5">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              European waterfall — all tiers settled at exit. IRRs computed on contribution + pro-rata operating CF + terminal promote distribution. Not investment advice.
            </p>
          </>
        )}
      </CardContainer>
    </div>
  );
}

function ReturnTile({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-lg border border-border p-3 ${emphasis ? "bg-primary/5" : "bg-card"}`}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold mt-1 ${emphasis ? "text-primary" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
