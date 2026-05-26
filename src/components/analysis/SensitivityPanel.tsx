import { useMemo, useState } from "react";
import { CardContainer } from "@/components/ui/card-container";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Activity, Target } from "lucide-react";
import type { DealInput, AnalysisResult } from "@/lib/dealAnalysisEngine";
import type { ReturnsAssumptions } from "@/lib/underwriting/returnsEngine";
import {
  buildMatrix,
  buildTornado,
  buildBreakEvens,
  AXIS_PRESETS,
  type MatrixAxis,
  type ScenarioMetrics,
} from "@/lib/underwriting/sensitivityEngine";

type MetricKey = keyof ScenarioMetrics;

const METRIC_OPTIONS: { value: MetricKey; label: string }[] = [
  { value: "levered_irr", label: "Levered IRR" },
  { value: "cash_on_cash", label: "Cash-on-Cash" },
  { value: "dscr", label: "DSCR" },
  { value: "cap_rate", label: "Cap Rate" },
  { value: "equity_multiple", label: "Equity Multiple" },
  { value: "monthly_cashflow", label: "Monthly Cash Flow" },
];

const MATRIX_PRESETS: { value: string; label: string; row: () => MatrixAxis; col: () => MatrixAxis }[] = [
  { value: "rent-x-rate",  label: "Rent × Interest Rate",   row: () => AXIS_PRESETS.rentPct(),   col: () => AXIS_PRESETS.rateBps() },
  { value: "rent-x-cap",   label: "Rent × Exit Cap",        row: () => AXIS_PRESETS.rentPct(),   col: () => AXIS_PRESETS.exitCapBps() },
  { value: "price-x-rate", label: "Price × Interest Rate",  row: () => AXIS_PRESETS.pricePct(),  col: () => AXIS_PRESETS.rateBps() },
  { value: "vac-x-rent",   label: "Vacancy × Rent",         row: () => AXIS_PRESETS.vacancyPct(), col: () => AXIS_PRESETS.rentPct() },
];

interface Props {
  input: DealInput;
  analysis: AnalysisResult;
  assumptions: ReturnsAssumptions;
}

export function SensitivityPanel({ input, analysis, assumptions }: Props) {
  const [metric, setMetric] = useState<MetricKey>("levered_irr");
  const [matrixKey, setMatrixKey] = useState<string>("rent-x-rate");

  const preset = useMemo(() => MATRIX_PRESETS.find(p => p.value === matrixKey)!, [matrixKey]);
  const matrix = useMemo(
    () => buildMatrix(input, analysis, assumptions, preset.row(), preset.col(), metric),
    [input, analysis, assumptions, preset, metric]
  );

  const tornado = useMemo(
    () => buildTornado(input, analysis, assumptions, metric),
    [input, analysis, assumptions, metric]
  );

  const breakEvens = useMemo(
    () => buildBreakEvens(input, analysis, assumptions),
    [input, analysis, assumptions]
  );

  const fmtMetric = (v: number | null) => formatMetric(metric, v);

  // Cell color scaling
  const flatVals = matrix.cells.flat().map(c => c[metric]).filter((v): v is number => v != null && isFinite(v));
  const min = flatVals.length ? Math.min(...flatVals) : 0;
  const max = flatVals.length ? Math.max(...flatVals) : 1;

  const cellTone = (v: number | null): string => {
    if (v == null || !isFinite(v)) return "bg-muted/40 text-muted-foreground";
    const range = max - min || 1;
    const t = (v - min) / range;
    if (metric === "dscr" || metric === "cap_rate" || metric === "cash_on_cash" || metric === "levered_irr" || metric === "equity_multiple" || metric === "monthly_cashflow") {
      // higher = better
      if (t > 0.66) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold";
      if (t > 0.33) return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
      return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
    }
    return "";
  };

  // Tornado bar layout
  const tornadoMax = Math.max(...tornado.bars.map(b => b.swing), 1e-9);

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" /> Sensitivity & Stress Tests
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Deterministic re-pricing across rent, price, rate, vacancy, and exit cap. No simulation — pure math.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Outcome metric</span>
          <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRIC_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 2-D matrix */}
      <CardContainer>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Two-Variable Matrix</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {matrix.metricLabel} across {matrix.rowAxis.label} (rows) vs {matrix.colAxis.label} (columns).
            </p>
          </div>
          <Select value={matrixKey} onValueChange={setMatrixKey}>
            <SelectTrigger className="h-8 w-56 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATRIX_PRESETS.map(p => (
                <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs text-muted-foreground">
                  {matrix.rowAxis.label} ↓ / {matrix.colAxis.label} →
                </TableHead>
                {matrix.colAxis.values.map((v, i) => (
                  <TableHead key={i} className="text-xs text-center font-medium text-foreground">
                    {matrix.colAxis.format(v)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {matrix.cells.map((row, ri) => (
                <TableRow key={ri}>
                  <TableCell className="text-xs font-medium text-foreground py-2">
                    {matrix.rowAxis.format(matrix.rowAxis.values[ri])}
                  </TableCell>
                  {row.map((cell, ci) => {
                    const v = cell[metric] as number | null;
                    return (
                      <TableCell
                        key={ci}
                        className={`text-xs text-center py-2 ${cellTone(v)}`}
                      >
                        {fmtMetric(v)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContainer>

      {/* Tornado */}
      <CardContainer>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tornado — Driver Sensitivity</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Single-variable swings on {tornado.metricLabel}. Base: <span className="font-medium text-foreground">{fmtMetric(tornado.base)}</span>.
            </p>
          </div>
          <Badge variant="outline" className="text-xs">Ranked by swing</Badge>
        </div>
        <div className="space-y-2.5">
          {tornado.bars.map((b) => {
            const width = (b.swing / tornadoMax) * 100;
            return (
              <div key={b.driver} className="grid grid-cols-[140px_1fr_auto] items-center gap-3">
                <div className="text-xs font-medium text-foreground">{b.label}</div>
                <div className="relative h-6 bg-muted/40 rounded">
                  <div
                    className="absolute left-1/2 top-0 h-full bg-primary/30 rounded"
                    style={{ width: `${width / 2}%`, transform: "translateX(-100%)" }}
                  />
                  <div
                    className="absolute left-1/2 top-0 h-full bg-primary/60 rounded"
                    style={{ width: `${width / 2}%` }}
                  />
                  <div className="absolute left-1/2 top-0 h-full w-px bg-foreground/40" />
                  <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-medium">
                    <span className="text-rose-700 dark:text-rose-300">{fmtMetric(b.low.metric)}</span>
                    <span className="text-emerald-700 dark:text-emerald-300">{fmtMetric(b.high.metric)}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  Δ {formatSwing(metric, b.swing)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContainer>

      {/* Break-evens */}
      <CardContainer>
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Break-Even Thresholds</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Threshold</TableHead>
              <TableHead className="text-xs">Metric</TableHead>
              <TableHead className="text-xs">Target</TableHead>
              <TableHead className="text-xs text-right">Break-Even Point</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakEvens.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs font-medium">{r.label}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.metric}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.target}</TableCell>
                <TableCell className="text-xs text-right font-medium text-foreground">{r.break_even_display}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-[11px] text-muted-foreground mt-3 flex items-start gap-1.5">
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
          Break-even points solved by bisection on the deterministic re-pricer. "Not reachable" means the threshold lies outside the searched ±range.
        </p>
      </CardContainer>
    </div>
  );
}

function formatMetric(metric: MetricKey, v: number | null): string {
  if (v == null || !isFinite(v)) return "N/A";
  switch (metric) {
    case "levered_irr":
    case "cash_on_cash":
    case "cap_rate":
      return `${(v * 100).toFixed(2)}%`;
    case "dscr":
      return `${v.toFixed(2)}x`;
    case "equity_multiple":
      return `${v.toFixed(2)}x`;
    case "monthly_cashflow":
      return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }
}

function formatSwing(metric: MetricKey, v: number): string {
  switch (metric) {
    case "levered_irr":
    case "cash_on_cash":
    case "cap_rate":
      return `${(v * 100).toFixed(2)} pts`;
    case "dscr":
    case "equity_multiple":
      return `${v.toFixed(2)}x`;
    case "monthly_cashflow":
      return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }
}
