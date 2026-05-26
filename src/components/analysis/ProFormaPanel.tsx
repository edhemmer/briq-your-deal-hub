import { CardContainer } from "@/components/ui/card-container";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import type { ProFormaResult } from "@/lib/underwriting/proFormaEngine";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n: number) => (n * 100).toFixed(1) + "%";

interface Props {
  result: ProFormaResult;
}

export function ProFormaPanel({ result }: Props) {
  const { annual, monthly, opexBreakdown, noiBridge, ratios, units, warnings } = result;

  return (
    <div className="space-y-6">
      {/* Headline metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RatioTile label="Effective Gross Income" value={fmt(annual.effective_gross_income)} />
        <RatioTile label="Operating Expenses" value={fmt(annual.operating_expenses)} sub={fmtPct(ratios.opex_ratio) + " of EGI"} />
        <RatioTile label="Net Operating Income" value={fmt(annual.noi)} emphasis />
        <RatioTile label="DSCR" value={ratios.dscr > 0 ? ratios.dscr.toFixed(2) + "x" : "N/A"} sub={ratios.debt_yield > 0 ? "Debt Yield " + fmtPct(ratios.debt_yield) : undefined} />
      </div>

      {/* NOI Bridge */}
      <CardContainer className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">NOI Bridge</h3>
        <div className="space-y-2">
          {noiBridge.map((step, i) => (
            <div
              key={i}
              className={`flex items-center justify-between text-sm py-1.5 ${
                step.type === "subtotal" ? "border-t border-border pt-2.5 font-semibold" :
                step.type === "total" ? "border-t-2 border-foreground pt-2.5 font-bold text-base" : ""
              }`}
            >
              <span className={step.type === "deduction" ? "text-muted-foreground pl-4" : "text-foreground"}>
                {step.label}
              </span>
              <span className={
                step.type === "deduction" ? "text-signal-risk tabular-nums" :
                step.type === "total" ? "text-signal-positive tabular-nums" :
                "text-foreground tabular-nums"
              }>
                {step.amount < 0 ? `(${fmt(Math.abs(step.amount))})` : fmt(step.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContainer>

      {/* OpEx breakdown */}
      <CardContainer className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Operating Expense Breakdown</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
              <TableHead className="text-right">Annual</TableHead>
              <TableHead className="text-right">% of EGI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opexBreakdown.map(cat => (
              <TableRow key={cat.key}>
                <TableCell className="font-medium">{cat.label}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(cat.monthly)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(cat.annual)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{fmtPct(cat.pct_of_egi)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 border-foreground/30">
              <TableCell className="font-bold">Total Operating Expenses</TableCell>
              <TableCell className="text-right tabular-nums font-bold">{fmt(annual.operating_expenses / 12)}</TableCell>
              <TableCell className="text-right tabular-nums font-bold">{fmt(annual.operating_expenses)}</TableCell>
              <TableCell className="text-right tabular-nums font-bold">{fmtPct(ratios.opex_ratio)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContainer>

      {/* T-12 view */}
      <CardContainer className="p-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Trailing-12 Income Statement (straight-line)</h3>
          <Badge variant="secondary" className="text-[10px]">Stabilized projection</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background">Month</TableHead>
              <TableHead className="text-right">Gross Rent</TableHead>
              <TableHead className="text-right">Vacancy</TableHead>
              <TableHead className="text-right">Effective</TableHead>
              <TableHead className="text-right">Total OpEx</TableHead>
              <TableHead className="text-right">NOI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthly.map(m => (
              <TableRow key={m.month}>
                <TableCell className="sticky left-0 bg-background font-medium">{m.label}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(m.gross_rent)}</TableCell>
                <TableCell className="text-right tabular-nums text-signal-risk">({fmt(m.vacancy_loss)})</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(m.effective_income)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">({fmt(m.total_opex)})</TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-signal-positive">{fmt(m.noi)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 border-foreground/30">
              <TableCell className="sticky left-0 bg-background font-bold">Annual</TableCell>
              <TableCell className="text-right tabular-nums font-bold">{fmt(annual.gross_potential_income)}</TableCell>
              <TableCell className="text-right tabular-nums font-bold text-signal-risk">({fmt(annual.vacancy_loss)})</TableCell>
              <TableCell className="text-right tabular-nums font-bold">{fmt(annual.effective_gross_income)}</TableCell>
              <TableCell className="text-right tabular-nums font-bold">({fmt(annual.operating_expenses)})</TableCell>
              <TableCell className="text-right tabular-nums font-bold text-signal-positive">{fmt(annual.noi)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContainer>

      {/* Per-unit + break-even */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <RatioTile label={`Units (assumed)`} value={String(units)} sub="Edit property type to refine" />
        <RatioTile label="EGI per Unit" value={fmt(ratios.income_per_unit)} />
        <RatioTile label="OpEx per Unit" value={fmt(ratios.expense_per_unit)} />
        <RatioTile
          label="Break-Even Occupancy"
          value={fmtPct(ratios.break_even_occupancy)}
          sub={ratios.break_even_occupancy > 0.95 ? "Tight — little margin" : ratios.break_even_occupancy > 0.85 ? "Acceptable" : "Strong cushion"}
          tone={ratios.break_even_occupancy > 0.95 ? "risk" : ratios.break_even_occupancy > 0.85 ? "warning" : "positive"}
        />
      </div>

      {warnings.length > 0 && (
        <div className="flex items-start gap-2 text-xs text-signal-warning bg-signal-warning/5 border border-signal-warning/30 rounded-md p-3">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            {warnings.map((w, i) => <p key={i}>{w}</p>)}
          </div>
        </div>
      )}
    </div>
  );
}

function RatioTile({
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
