import { useEffect, useMemo, useState } from "react";
import { Lightbulb, Save, TrendingUp } from "lucide-react";
import { inputsFromDeal, usd } from "../core/investorMath";
import { analyzeOwned, type OwnedActuals } from "../core/portfolio";
import type { DealFacts } from "../core/types";

type Status = "idle" | "saving" | "saved" | "failed";

export function OwnedPerformance({ deal, canSave, onSave }: { deal: DealFacts; canSave: boolean; onSave: (actuals: OwnedActuals) => Promise<void> }) {
  const inputs = useMemo(() => inputsFromDeal(deal), [deal]);
  const initial = useMemo<OwnedActuals>(() => deal.actuals ?? {
    purchaseDate: "",
    actualMonthlyRent: inputs.monthlyRent,
    actualMonthlyExpenses: 0,
    currentValue: inputs.arv ?? inputs.purchasePrice,
    monthsVacantLast12: 0,
  }, [deal.actuals, inputs]);
  const [draft, setDraft] = useState<OwnedActuals>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  useEffect(() => setDraft(initial), [initial]);
  const ready = /^\d{4}-\d{2}-\d{2}$/.test(draft.purchaseDate) && inputs.purchasePrice > 0;
  const perf = useMemo(() => (ready ? analyzeOwned(inputs, draft) : null), [ready, inputs, draft]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const field = (key: keyof OwnedActuals, label: string, hint?: string) => (
    <label className="field compact-field">
      <span>{label}</span>
      <input
        inputMode="decimal"
        value={draft[key] === undefined ? "" : String(draft[key])}
        onChange={(event) => {
          const raw = event.target.value.replace(/[$,\s]/g, "");
          setDraft((d) => ({ ...d, [key]: raw === "" ? undefined : Number.isFinite(Number(raw)) ? Number(raw) : d[key] }));
        }}
      />
      {hint ? <small className="analyzer-footnote">{hint}</small> : null}
    </label>
  );

  async function save() {
    setStatus("saving");
    setMessage("");
    try {
      await onSave({ ...draft, actualMonthlyRent: draft.actualMonthlyRent || 0, actualMonthlyExpenses: draft.actualMonthlyExpenses || 0 });
      setStatus("saved");
      setMessage("Performance saved.");
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "BRIX could not save. Try again.");
    }
  }

  const pct = (v: number | null) => (v === null ? "n/a" : `${(v * 100).toFixed(1)}%`);
  return (
    <div className="analyzer">
      <section className="workspace-card">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow"><TrendingUp size={14} aria-hidden="true" /> Owned performance</p>
            <h4>How this property is actually doing</h4>
            <p className="quiet">Enter what you really collect and spend. BRIX compares it to your underwriting and tracks equity from the loan terms.</p>
          </div>
          <button className="primary compact" type="button" disabled={!canSave || !dirty || !ready || status === "saving"} onClick={() => void save()}>
            <Save size={16} /> {status === "saving" ? "Saving…" : "Save performance"}
          </button>
        </div>
        <div className="property-facts-grid">
          <label className="field compact-field">
            <span>Closing date</span>
            <input type="date" value={draft.purchaseDate} onChange={(event) => setDraft((d) => ({ ...d, purchaseDate: event.target.value }))} />
          </label>
          {field("actualMonthlyRent", "Rent collected / mo", "Average, after vacancy and concessions")}
          {field("actualMonthlyExpenses", "Operating expenses / mo", "Taxes, insurance, repairs, mgmt, utilities, HOA. Not the mortgage")}
          {field("currentValue", "Current value estimate", "Recent comps or an appraisal")}
          {field("monthsVacantLast12", "Vacant months, last 12")}
        </div>
        {message ? <p className={status === "failed" ? "analyzer-banner failed" : "analyzer-save-state saved"} role="status">{message}</p> : null}
        {!inputs.purchasePrice ? <p className="max-offer warn">Add the purchase price and loan terms in Underwriting first. Performance uses them for the loan balance and return.</p> : null}
      </section>

      {perf ? (
        <>
          <div className="kpi-grid">
            <div className={`kpi ${perf.actualCashFlowMonthly >= 0 ? "kpi-good" : "kpi-bad"}`}><span>Actual cash flow / mo</span><strong>{usd(perf.actualCashFlowMonthly)}</strong><small>Plan: {usd(perf.projectedCashFlowMonthly)} ({perf.cashFlowVariance >= 0 ? "+" : ""}{usd(perf.cashFlowVariance)})</small></div>
            <div className="kpi"><span>Equity today</span><strong>{usd(perf.equity)}</strong><small>LTV {pct(perf.ltv)}</small></div>
            <div className="kpi"><span>Loan balance</span><strong>{usd(perf.loanBalanceToday)}</strong><small>{usd(perf.principalPaidSoFar)} principal paid in {perf.monthsOwned} mo</small></div>
            <div className={`kpi ${perf.totalReturnToDate >= 0 ? "kpi-good" : "kpi-bad"}`}><span>Total return to date</span><strong>{usd(perf.totalReturnToDate)}</strong><small>Cash flow + paydown + appreciation</small></div>
            <div className="kpi"><span>Annualized return</span><strong>{pct(perf.annualizedReturn)}</strong><small>{perf.annualizedReturn === null ? "Shown after 12 months" : `On ${usd(perf.cashInvested)} invested`}</small></div>
            <div className={`kpi ${(perf.actualDscr ?? 2) >= 1.25 ? "kpi-good" : (perf.actualDscr ?? 2) >= 1 ? "kpi-warn" : "kpi-bad"}`}><span>Actual DSCR</span><strong>{perf.actualDscr === null ? "No loan" : perf.actualDscr.toFixed(2)}</strong></div>
          </div>
          <div className="analyzer-card">
            <h5>Actual vs plan</h5>
            <dl className="breakdown">
              <div><dt>Rent collected</dt><dd>{usd(draft.actualMonthlyRent)} <small className={perf.rentVariancePct !== null && perf.rentVariancePct < 0 ? "neg" : undefined}>({pct(perf.rentVariancePct)})</small></dd></div>
              <div><dt>Operating expenses</dt><dd>{usd(draft.actualMonthlyExpenses)} <small>({pct(perf.expenseVariancePct)})</small></dd></div>
              <div><dt>Net operating income</dt><dd>{usd(perf.actualNoiMonthly)}</dd></div>
              <div><dt>Mortgage (P&I)</dt><dd>({usd(perf.monthlyPrincipalAndInterest)})</dd></div>
              <div className="total"><dt>Cash flow</dt><dd>{usd(perf.actualCashFlowMonthly)}</dd></div>
            </dl>
          </div>
          {perf.notes.length ? (
            <div className="analyzer-card">
              <h5><Lightbulb size={16} aria-hidden="true" /> What BRIX sees</h5>
              <ul className="flag-list">{perf.notes.map((n) => <li key={n} className="flag flag-info"><div><p>{n}</p></div></li>)}</ul>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
