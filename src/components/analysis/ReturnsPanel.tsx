import { useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle } from "lucide-react";
import type { ReturnsResult, ReturnsAssumptions } from "@/lib/underwriting/returnsEngine";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n: number | null | undefined) => n == null ? "N/A" : (n * 100).toFixed(2) + "%";
const fmtX = (n: number | null | undefined) => n == null ? "N/A" : n.toFixed(2) + "x";

interface Props {
  result: ReturnsResult;
  assumptions: ReturnsAssumptions;
  onAssumptionsChange: (next: Partial<ReturnsAssumptions>) => void;
}

export function ReturnsPanel({ result, assumptions, onAssumptionsChange }: Props) {
  const [draft, setDraft] = useState(assumptions);
  const { years, exit, summary, initial_equity, warnings } = result;

  const apply = () => onAssumptionsChange(draft);

  return (
    <div className="space-y-6">
      {/* Headline returns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReturnTile label={`Levered IRR (${assumptions.hold_years}-yr)`} value={fmtPct(summary.levered_irr)} tone={ireToTone(summary.levered_irr)} emphasis />
        <ReturnTile label="Unlevered IRR" value={fmtPct(summary.unlevered_irr)} />
        <ReturnTile label="Equity Multiple" value={fmtX(summary.equity_multiple)} tone={summary.equity_multiple && summary.equity_multiple >= 2 ? "positive" : summary.equity_multiple && summary.equity_multiple >= 1.5 ? "warning" : undefined} />
        <ReturnTile label="Avg Cash-on-Cash" value={fmtPct(summary.average_coc)} />
      </div>

      {/* Hold assumptions */}
      <CardContainer className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Hold Assumptions</h3>
          <Badge variant="secondary" className="text-[10px]">Deterministic projection</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <AssumptionField label="Hold (yrs)" value={draft.hold_years} step={1} min={1} max={30}
            onChange={v => setDraft({ ...draft, hold_years: Math.max(1, Math.round(v)) })} />
          <AssumptionField label="Rent Growth %" value={draft.rent_growth * 100} step={0.25}
            onChange={v => setDraft({ ...draft, rent_growth: v / 100 })} />
          <AssumptionField label="Expense Growth %" value={draft.expense_growth * 100} step={0.25}
            onChange={v => setDraft({ ...draft, expense_growth: v / 100 })} />
          <AssumptionField label="Appreciation %" value={draft.appreciation * 100} step={0.25}
            onChange={v => setDraft({ ...draft, appreciation: v / 100 })} />
          <AssumptionField label="Exit Cap % (opt)" value={(draft.exit_cap_rate ?? 0) * 100} step={0.25}
            onChange={v => setDraft({ ...draft, exit_cap_rate: v > 0 ? v / 100 : null })}
            placeholder="Appreciation" />
          <AssumptionField label="Cost of Sale %" value={draft.cost_of_sale_pct * 100} step={0.25}
            onChange={v => setDraft({ ...draft, cost_of_sale_pct: v / 100 })} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Initial equity modeled: <span className="font-semibold text-foreground tabular-nums">{fmt(initial_equity)}</span>
          </p>
          <Button size="sm" onClick={apply}>Recalculate</Button>
        </div>
      </CardContainer>

      {/* Year-by-year cash flow */}
      <CardContainer className="p-6 overflow-x-auto">
        <h3 className="text-sm font-semibold text-foreground mb-4">Year-by-Year Cash Flow</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Effective Income</TableHead>
              <TableHead className="text-right">OpEx</TableHead>
              <TableHead className="text-right">NOI</TableHead>
              <TableHead className="text-right">Debt Service</TableHead>
              <TableHead className="text-right">Cash Flow</TableHead>
              <TableHead className="text-right">CoC</TableHead>
              <TableHead className="text-right">Loan Balance EOY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {years.map(y => (
              <TableRow key={y.year}>
                <TableCell className="font-medium">Year {y.year}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(y.effective_income)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">({fmt(y.operating_expenses)})</TableCell>
                <TableCell className="text-right tabular-nums font-semibold">{fmt(y.noi)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">({fmt(y.debt_service)})</TableCell>
                <TableCell className={`text-right tabular-nums font-bold ${y.cash_flow_before_tax >= 0 ? "text-signal-positive" : "text-signal-risk"}`}>
                  {fmt(y.cash_flow_before_tax)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmtPct(y.coc_return)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{fmt(y.loan_balance_eoy)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContainer>

      {/* Exit / sale */}
      {exit && (
        <CardContainer className="p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Exit at Year {exit.year}
            <Badge variant="outline" className="ml-2 text-[10px]">
              {exit.basis_method === "exit_cap" ? "Cap-Rate Method" : "Appreciation Method"}
            </Badge>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SaleStat label="Projected Sale Value" value={fmt(exit.projected_value)} />
            <SaleStat label="Cost of Sale" value={"(" + fmt(exit.sale_costs) + ")"} tone="muted" />
            <SaleStat label="Loan Balance" value={"(" + fmt(exit.loan_balance_at_exit) + ")"} tone="muted" />
            <SaleStat label="Net Sale Proceeds" value={fmt(exit.net_sale_proceeds)} tone="positive" emphasis />
          </div>
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4">
            <SaleStat label="Total Cash Flow" value={fmt(summary.total_cash_flow)} />
            <SaleStat label="Total Return" value={fmt(summary.total_return)} tone={summary.total_return >= 0 ? "positive" : "risk"} emphasis />
            <SaleStat label="Equity Multiple" value={fmtX(summary.equity_multiple)} />
            <SaleStat label="Avg Annual Return" value={fmtPct(summary.aar)} />
          </div>
        </CardContainer>
      )}

      {warnings.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-signal-warning bg-signal-warning/5 border border-signal-warning/30 rounded-md p-3">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">{warnings.map((w, i) => <p key={i}>{w}</p>)}</div>
        </div>
      )}
    </div>
  );
}

function ireToTone(irr: number | null): "positive" | "warning" | "risk" | undefined {
  if (irr == null) return undefined;
  if (irr >= 0.15) return "positive";
  if (irr >= 0.08) return "warning";
  return "risk";
}

function ReturnTile({
  label, value, sub, emphasis, tone,
}: { label: string; value: string; sub?: string; emphasis?: boolean; tone?: "positive" | "warning" | "risk" }) {
  const toneClass = tone === "positive" ? "text-signal-positive" : tone === "warning" ? "text-signal-warning" : tone === "risk" ? "text-signal-risk" : "text-foreground";
  return (
    <CardContainer className="p-4">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      <div className={`mt-1 ${emphasis ? "text-2xl font-black" : "text-lg font-bold"} ${toneClass} tabular-nums`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </CardContainer>
  );
}

function SaleStat({
  label, value, tone, emphasis,
}: { label: string; value: string; tone?: "positive" | "risk" | "muted"; emphasis?: boolean }) {
  const cls = tone === "positive" ? "text-signal-positive" : tone === "risk" ? "text-signal-risk" : tone === "muted" ? "text-muted-foreground" : "text-foreground";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
      <div className={`${emphasis ? "text-xl font-black" : "text-base font-bold"} ${cls} tabular-nums mt-0.5`}>{value}</div>
    </div>
  );
}

function AssumptionField({
  label, value, step = 1, min, max, onChange, placeholder,
}: { label: string; value: number; step?: number; min?: number; max?: number; onChange: (v: number) => void; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</Label>
      <Input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value || ""}
        placeholder={placeholder}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="h-8 text-sm tabular-nums"
      />
    </div>
  );
}
