import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, RotateCcw, Save, XCircle } from "lucide-react";
import {
  DEFAULT_ASSUMPTIONS,
  MARKET_DEFAULTS,
  analyzeBrrrr,
  analyzeFlip,
  analyzeRental,
  inputsFromDeal,
  maxRentalOffer,
  rentalVerdict,
  usd,
  type AnalyzerInputs,
  type DealLike,
} from "../core/investorMath";

export type AnalyzerView = "rental" | "brrrr" | "flip" | "projection" | "compare";
export type AnalyzerSaveState = "idle" | "saving" | "saved" | "failed" | "stale" | "local";

type FieldDef = {
  key: keyof AnalyzerInputs;
  label: string;
  unit: "$" | "%" | "yrs" | "mo" | "x" | "#";
  step?: number;
  hint?: string;
  market?: boolean;
};

const GROUPS: Array<{ title: string; views: AnalyzerView[]; fields: FieldDef[] }> = [
  {
    title: "Purchase",
    views: ["rental", "brrrr", "flip", "projection", "compare"],
    fields: [
      { key: "purchasePrice", label: "Purchase price", unit: "$", step: 1000 },
      { key: "closingCostPct", label: "Buyer closing costs", unit: "%", step: 0.25, hint: "Typically 2%-5% of price" },
      { key: "rehabBudget", label: "Rehab budget", unit: "$", step: 500 },
      { key: "arv", label: "After-repair value (ARV)", unit: "$", step: 1000, hint: "Support with 3+ sold comps" },
      { key: "units", label: "Units", unit: "#", step: 1 },
    ],
  },
  {
    title: "Long-term loan",
    views: ["rental", "projection", "compare"],
    fields: [
      { key: "downPaymentPct", label: "Down payment", unit: "%", step: 1, hint: "Conventional 1-unit investment: 15%-25%" },
      { key: "interestRate", label: "Interest rate", unit: "%", step: 0.125, market: true },
      { key: "loanTermYears", label: "Loan term", unit: "yrs", step: 1 },
      { key: "loanPointsPct", label: "Points", unit: "%", step: 0.25 },
    ],
  },
  {
    title: "Income",
    views: ["rental", "brrrr", "projection", "compare"],
    fields: [
      { key: "monthlyRent", label: "Monthly rent (all units)", unit: "$", step: 25, hint: "Use signed leases or 3+ rent comps" },
      { key: "otherMonthlyIncome", label: "Other income / mo", unit: "$", step: 10, hint: "Laundry, parking, pet fees" },
      { key: "vacancyPct", label: "Vacancy & credit loss", unit: "%", step: 0.5 },
    ],
  },
  {
    title: "Operating expenses",
    views: ["rental", "brrrr", "projection", "compare"],
    fields: [
      { key: "annualTaxes", label: "Property taxes / yr", unit: "$", step: 50, hint: "Check reassessment after sale" },
      { key: "annualInsurance", label: "Insurance / yr", unit: "$", step: 50, hint: "Landlord (DP-3) quote, not homeowner" },
      { key: "hoaMonthly", label: "HOA / mo", unit: "$", step: 10 },
      { key: "managementPct", label: "Management (of collected rent)", unit: "%", step: 0.5 },
      { key: "maintenancePct", label: "Repairs & maintenance", unit: "%", step: 0.5 },
      { key: "capexPct", label: "CapEx reserve", unit: "%", step: 0.5, hint: "Roof, HVAC, water heater, flooring" },
      { key: "utilitiesMonthly", label: "Owner-paid utilities / mo", unit: "$", step: 10 },
      { key: "otherMonthlyExpenses", label: "Other expenses / mo", unit: "$", step: 10 },
    ],
  },
  {
    title: "Rehab financing (hard money)",
    views: ["brrrr", "flip", "compare"],
    fields: [
      { key: "shortTermLoanToCostPct", label: "Loan-to-cost", unit: "%", step: 1 },
      { key: "shortTermRate", label: "Interest rate", unit: "%", step: 0.25, market: true },
      { key: "shortTermPointsPct", label: "Points", unit: "%", step: 0.25 },
      { key: "rehabMonths", label: "Months to stabilize (BRRRR)", unit: "mo", step: 1 },
      { key: "flipHoldMonths", label: "Months to sell (flip)", unit: "mo", step: 1 },
    ],
  },
  {
    title: "Refinance",
    views: ["brrrr", "compare"],
    fields: [
      { key: "refiLtvPct", label: "Refi loan-to-value", unit: "%", step: 1, hint: "Most cash-out refis cap at 70%-75%" },
      { key: "refiRate", label: "Refi rate (DSCR)", unit: "%", step: 0.125, market: true },
      { key: "refiTermYears", label: "Refi term", unit: "yrs", step: 1 },
      { key: "refiClosingCostPct", label: "Refi closing costs", unit: "%", step: 0.25 },
    ],
  },
  {
    title: "Growth & exit",
    views: ["projection", "flip", "compare"],
    fields: [
      { key: "appreciationPct", label: "Appreciation / yr", unit: "%", step: 0.25 },
      { key: "rentGrowthPct", label: "Rent growth / yr", unit: "%", step: 0.25 },
      { key: "expenseGrowthPct", label: "Expense growth / yr", unit: "%", step: 0.25 },
      { key: "holdYears", label: "Hold period", unit: "yrs", step: 1 },
      { key: "sellingCostPct", label: "Selling costs", unit: "%", step: 0.25, hint: "Commissions + seller closing" },
    ],
  },
  {
    title: "Your targets",
    views: ["rental", "compare"],
    fields: [
      { key: "targetMonthlyCashFlowPerUnit", label: "Min cash flow / unit / mo", unit: "$", step: 25 },
      { key: "targetCashOnCashPct", label: "Min cash-on-cash", unit: "%", step: 0.5 },
      { key: "targetDscr", label: "Min DSCR", unit: "x", step: 0.05 },
    ],
  },
];

const VIEWS: Array<{ id: AnalyzerView; label: string }> = [
  { id: "rental", label: "Rental" },
  { id: "brrrr", label: "BRRRR" },
  { id: "flip", label: "Fix & flip" },
  { id: "projection", label: "10-year view" },
  { id: "compare", label: "Compare" },
];

export function DealAnalyzer({
  deal,
  initialView = "rental",
  canSave,
  saveState,
  saveMessage,
  onSave,
}: {
  deal: DealLike;
  initialView?: AnalyzerView;
  canSave: boolean;
  saveState: AnalyzerSaveState;
  saveMessage?: string;
  onSave: (inputs: AnalyzerInputs) => void;
}) {
  const savedInputs = useMemo(() => inputsFromDeal(deal), [deal]);
  const [inputs, setInputs] = useState<AnalyzerInputs>(savedInputs);
  const [view, setView] = useState<AnalyzerView>(initialView);
  useEffect(() => setInputs(savedInputs), [savedInputs]);

  const dirty = JSON.stringify(inputs) !== JSON.stringify(savedInputs);
  const rental = useMemo(() => analyzeRental(inputs), [inputs]);
  const verdict = useMemo(() => rentalVerdict(inputs, rental), [inputs, rental]);
  const brrrr = useMemo(() => analyzeBrrrr(inputs), [inputs]);
  const flip = useMemo(() => analyzeFlip(inputs), [inputs]);
  const maxOffer = useMemo(() => maxRentalOffer(inputs), [inputs]);

  const update = (key: keyof AnalyzerInputs, value: number | boolean | undefined) => setInputs((current) => ({ ...current, [key]: value }));

  return (
    <div className="analyzer">
      <div className="analyzer-toolbar">
        <div className="analyzer-tabs" role="tablist" aria-label="Analysis view">
          {VIEWS.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={view === item.id} className={view === item.id ? "analyzer-tab active" : "analyzer-tab"} onClick={() => setView(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="analyzer-actions">
          <span className={`analyzer-save-state ${saveState}`} role="status" aria-live="polite">
            {saveState === "saving" ? "Saving…" : saveState === "saved" && !dirty ? "Saved to Deal" : dirty ? "Unsaved changes" : saveMessage ?? ""}
          </span>
          <button className="secondary compact" type="button" disabled={!dirty} onClick={() => setInputs(savedInputs)}>
            <RotateCcw size={16} /> Reset
          </button>
          <button className="primary compact" type="button" disabled={!canSave || !dirty || saveState === "saving"} onClick={() => onSave(inputs)}>
            <Save size={16} /> Save analysis
          </button>
        </div>
      </div>
      {(saveState === "failed" || saveState === "stale" || saveState === "local") && saveMessage ? <p className={`analyzer-banner ${saveState}`}>{saveMessage}</p> : null}

      <div className="analyzer-grid">
        <aside className="analyzer-inputs" aria-label="Assumptions">
          {GROUPS.filter((group) => group.views.includes(view)).map((group) => (
            <fieldset key={group.title} className="analyzer-group">
              <legend>{group.title}</legend>
              {group.title === "Long-term loan" ? (
                <label className="analyzer-toggle">
                  <input type="checkbox" checked={inputs.cashPurchase} onChange={(event) => update("cashPurchase", event.target.checked)} /> All-cash purchase
                </label>
              ) : null}
              {group.fields.map((field) => (
                <NumberInput
                  key={field.key}
                  field={field}
                  value={inputs[field.key] as number | undefined}
                  disabled={inputs.cashPurchase && group.title === "Long-term loan"}
                  isDefault={(DEFAULT_ASSUMPTIONS as Record<string, unknown>)[field.key] === inputs[field.key]}
                  onChange={(value) => update(field.key, value)}
                />
              ))}
            </fieldset>
          ))}
          <p className="analyzer-footnote">
            Market rates as of {formatAsOf(MARKET_DEFAULTS.asOf)}: 30-yr primary {MARKET_DEFAULTS.primaryRate30y}% (Freddie Mac), investment ≈{MARKET_DEFAULTS.investmentRate30y}%, DSCR ≈{MARKET_DEFAULTS.dscrRate30y}%, hard money ≈{MARKET_DEFAULTS.hardMoneyRate}% + {MARKET_DEFAULTS.hardMoneyPointsPct} pts. Replace with your lender quote.
          </p>
        </aside>

        <section className="analyzer-results" aria-label="Results">
          {view === "rental" && (
            <>
              <VerdictCard tone={verdict.tone} headline={verdict.headline} />
              <div className="kpi-grid">
                <Kpi label="Cash flow / mo" value={usd(rental.monthlyCashFlow)} tone={rental.monthlyCashFlow >= 0 ? "good" : "bad"} />
                <Kpi label="Cash-on-cash" value={pct(rental.cashOnCash)} tone={toneFor(rental.cashOnCash, inputs.targetCashOnCashPct / 100)} />
                <Kpi label="Cap rate" value={pct(rental.capRate)} sub={`All-in ${pct(rental.capRateAllIn)}`} />
                <Kpi label="DSCR" value={rental.dscr === null ? "No loan" : rental.dscr.toFixed(2)} tone={rental.dscr === null ? undefined : rental.dscr >= inputs.targetDscr ? "good" : rental.dscr >= 1 ? "warn" : "bad"} />
                <Kpi label="Cash needed" value={usd(rental.totalCashInvested)} sub="Down + closing + points + rehab" />
                <Kpi label="Year-1 total return" value={pct(rental.yearOneTotalReturn)} sub="Cash flow + paydown + appreciation" />
              </div>
              {verdict.checks.length ? (
                <div className="analyzer-card">
                  <h5>Against your targets</h5>
                  <ul className="check-rows">
                    {verdict.checks.map((check) => (
                      <li key={check.label}>
                        {check.pass ? <CheckCircle2 size={18} className="ok" aria-label="Pass" /> : <XCircle size={18} className="no" aria-label="Miss" />}
                        <span>{check.label}</span>
                        <strong>{check.value}</strong>
                        <small>{check.benchmark}</small>
                      </li>
                    ))}
                  </ul>
                  {maxOffer !== null ? (
                    <p className="max-offer">
                      Max offer that meets every target: <strong>{usd(maxOffer)}</strong>
                      {inputs.purchasePrice > 0 ? <span> ({maxOffer >= inputs.purchasePrice ? "above" : "below"} the current price by {usd(Math.abs(maxOffer - inputs.purchasePrice))})</span> : null}
                    </p>
                  ) : inputs.monthlyRent > 0 ? <p className="max-offer warn">No price meets every target at this rent and these terms. Change the financing or the targets.</p> : null}
                </div>
              ) : null}
              <OperatingTable rental={rental} />
              <div className="analyzer-card">
                <h5>Quick screens</h5>
                <dl className="quick-screens">
                  <div><dt>1% rule</dt><dd>{rental.onePercentRatio === null ? "n/a" : `${(rental.onePercentRatio * 100).toFixed(2)}%`}<small>rent ÷ (price + rehab)</small></dd></div>
                  <div><dt>Gross rent multiplier</dt><dd>{rental.grossRentMultiplier?.toFixed(1) ?? "n/a"}<small>lower is better</small></dd></div>
                  <div><dt>Expense ratio</dt><dd>{pct(rental.expenseRatio)}<small>50% rule check</small></dd></div>
                  <div><dt>Break-even occupancy</dt><dd>{pct(rental.breakEvenOccupancy)}<small>below 85% is safer</small></dd></div>
                </dl>
              </div>
            </>
          )}

          {view === "brrrr" && (brrrr ? (
            <>
              <VerdictCard
                tone={brrrr.allCashRecovered ? "strong" : brrrr.cashLeftInDeal <= brrrr.cashInvestedBeforeRefi * 0.25 && brrrr.monthlyCashFlow >= 0 ? "workable" : "weak"}
                headline={brrrr.allCashRecovered ? `All cash recovered at refinance, plus ${usd(-brrrr.cashLeftInDeal)} back.` : `${usd(brrrr.cashLeftInDeal)} stays in the deal after the refinance.`}
              />
              <div className="kpi-grid">
                <Kpi label="Cash in before refi" value={usd(brrrr.cashInvestedBeforeRefi)} />
                <Kpi label="Cash out at refi" value={usd(brrrr.cashOutAtRefi)} tone={brrrr.cashOutAtRefi >= 0 ? "good" : "bad"} />
                <Kpi label="Cash left in deal" value={usd(Math.max(0, brrrr.cashLeftInDeal))} tone={brrrr.allCashRecovered ? "good" : undefined} />
                <Kpi label="Cash flow / mo after refi" value={usd(brrrr.monthlyCashFlow)} tone={brrrr.monthlyCashFlow >= 0 ? "good" : "bad"} />
                <Kpi label="Cash-on-cash" value={brrrr.allCashRecovered ? "∞" : pct(brrrr.cashOnCash)} />
                <Kpi label="DSCR after refi" value={brrrr.dscr?.toFixed(2) ?? "n/a"} tone={(brrrr.dscr ?? 0) >= inputs.targetDscr ? "good" : "bad"} />
              </div>
              <Breakdown rows={[
                ["Total project cost", brrrr.totalProjectCost],
                ["  incl. holding & financing during rehab", brrrr.holdingCosts],
                ["Acquisition loan", brrrr.acquisitionLoan],
                ["Refinance loan", brrrr.refinanceLoan],
                ["Refinance closing costs", brrrr.refinanceCosts],
                ["Equity left after refi", brrrr.equityCaptured],
              ]} />
              <p className="analyzer-footnote">Most lenders require 3-12 months of seasoning before a cash-out refinance at ARV. The rehab loan is modeled as interest-only on the full draw, which is conservative.</p>
            </>
          ) : <EmptyResult text="Add an after-repair value (ARV) to model the refinance." />)}

          {view === "flip" && (flip ? (
            <>
              <VerdictCard
                tone={flip.netProfit >= 30000 && flip.profitMargin >= 0.1 ? "strong" : flip.netProfit > 0 ? "workable" : "weak"}
                headline={flip.netProfit > 0 ? `${usd(flip.netProfit)} projected profit (${(flip.profitMargin * 100).toFixed(1)}% of ARV).` : `Projected loss of ${usd(-flip.netProfit)}.`}
              />
              <div className="kpi-grid">
                <Kpi label="Net profit" value={usd(flip.netProfit)} tone={flip.netProfit > 0 ? "good" : "bad"} />
                <Kpi label="ROI on cash" value={pct(flip.roi)} sub={`Annualized ${pct(flip.annualizedRoi)}`} />
                <Kpi label="Cash needed" value={usd(flip.cashInvested)} />
                <Kpi label="70% rule max offer" value={usd(flip.maxAllowableOffer70)} tone={flip.passesSeventyPercentRule ? "good" : "warn"} sub={flip.passesSeventyPercentRule ? "Price is under MAO" : "Price is over MAO"} />
              </div>
              <Breakdown rows={[
                ["Sale price (ARV)", inputs.arv ?? 0],
                ["Purchase", -inputs.purchasePrice],
                ["Buyer closing costs", -flip.purchaseClosingCosts],
                ["Rehab", -inputs.rehabBudget],
                ["Loan interest & points", -flip.financingCosts],
                ["Taxes, insurance, utilities while holding", -flip.holdingCosts],
                ["Selling costs", -flip.sellingCosts],
                ["Net profit", flip.netProfit],
              ]} />
            </>
          ) : <EmptyResult text="Add an after-repair value (ARV) to model a flip." />)}

          {view === "projection" && (
            <>
              <div className="kpi-grid">
                <Kpi label={`IRR (${rental.projection.length}-yr)`} value={pct(rental.irr)} tone={(rental.irr ?? -1) >= 0.1 ? "good" : (rental.irr ?? -1) >= 0 ? "warn" : "bad"} />
                <Kpi label="Equity multiple" value={rental.equityMultiple === null ? "n/a" : `${rental.equityMultiple.toFixed(2)}x`} />
                <Kpi label="Total profit" value={usd(rental.totalProfit)} tone={rental.totalProfit >= 0 ? "good" : "bad"} />
                <Kpi label="Net sale proceeds" value={usd(rental.saleProceeds)} sub="After selling costs and loan payoff" />
              </div>
              <div className="analyzer-card table-scroll">
                <table className="projection-table">
                  <thead><tr><th>Year</th><th>Gross rent</th><th>NOI</th><th>Cash flow</th><th>Value</th><th>Loan</th><th>Equity</th></tr></thead>
                  <tbody>
                    {rental.projection.map((year) => (
                      <tr key={year.year}>
                        <td>{year.year}</td>
                        <td>{usd(year.grossRent)}</td>
                        <td>{usd(year.netOperatingIncome)}</td>
                        <td className={year.cashFlow >= 0 ? "pos" : "neg"}>{usd(year.cashFlow)}</td>
                        <td>{usd(year.propertyValue)}</td>
                        <td>{usd(year.loanBalance)}</td>
                        <td>{usd(year.equity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="analyzer-footnote">Pre-tax. Does not include depreciation, which can shelter rental income (27.5-year schedule for residential buildings; cost segregation may qualify components for 100% bonus depreciation). Confirm with your CPA.</p>
            </>
          )}

          {view === "compare" && (
            <div className="analyzer-card table-scroll">
              <h5>Same property, three strategies</h5>
              <table className="projection-table compare-table">
                <thead><tr><th /><th>Rental</th><th>BRRRR</th><th>Fix & flip</th></tr></thead>
                <tbody>
                  <tr><td>Cash needed</td><td>{usd(rental.totalCashInvested)}</td><td>{brrrr ? usd(Math.max(0, brrrr.cashLeftInDeal)) + " left in" : "Needs ARV"}</td><td>{flip ? usd(flip.cashInvested) : "Needs ARV"}</td></tr>
                  <tr><td>Cash flow / mo</td><td>{usd(rental.monthlyCashFlow)}</td><td>{brrrr ? usd(brrrr.monthlyCashFlow) : "—"}</td><td>—</td></tr>
                  <tr><td>Return</td><td>{pct(rental.cashOnCash)} CoC · {pct(rental.irr)} IRR</td><td>{brrrr ? (brrrr.allCashRecovered ? "∞ CoC" : `${pct(brrrr.cashOnCash)} CoC`) : "—"}</td><td>{flip ? `${pct(flip.roi)} ROI` : "—"}</td></tr>
                  <tr><td>Profit</td><td>{usd(rental.totalProfit)} over {rental.projection.length} yrs</td><td>{brrrr ? `${usd(brrrr.equityCaptured)} equity` : "—"}</td><td>{flip ? usd(flip.netProfit) : "—"}</td></tr>
                  <tr><td>Biggest risk</td><td>Rent and expense assumptions</td><td>Appraisal below ARV; rate at refi</td><td>Rehab overruns and days on market</td></tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function displayNumber(value: number | undefined, unit: FieldDef["unit"]) {
  if (value === undefined) return "";
  return unit === "$" ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value) : String(value);
}

function NumberInput({ field, value, disabled, isDefault, onChange }: { field: FieldDef; value: number | undefined; disabled?: boolean; isDefault: boolean; onChange: (value: number | undefined) => void }) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(displayNumber(value, field.unit));
  useEffect(() => {
    if (!focused) setText(displayNumber(value, field.unit));
  }, [value, focused, field.unit]);
  const id = `analyzer-${String(field.key)}`;
  return (
    <div className="analyzer-field">
      <label htmlFor={id}>
        {field.label}
        {field.market ? <span className="badge-market" title={`Market default as of ${formatAsOf(MARKET_DEFAULTS.asOf)}`}>{isDefault ? "Market" : "Custom"}</span> : null}
      </label>
      <div className={`unit-input unit-${field.unit === "$" ? "prefix" : "suffix"}`}>
        {field.unit === "$" ? <span aria-hidden="true">$</span> : null}
        <input
          id={id}
          inputMode="decimal"
          value={text}
          disabled={disabled}
          aria-describedby={field.hint ? `${id}-hint` : undefined}
          onChange={(event) => {
            const raw = event.target.value.replace(/[,$\s]/g, "");
            setText(event.target.value);
            if (raw === "") onChange(field.key === "arv" ? undefined : 0);
            else if (Number.isFinite(Number(raw))) onChange(Number(raw));
          }}
          onFocus={() => {
            setFocused(true);
            setText(value === undefined ? "" : String(value));
          }}
          onBlur={() => {
            setFocused(false);
            setText(displayNumber(value, field.unit));
          }}
        />
        {field.unit !== "$" && field.unit !== "#" ? <span aria-hidden="true">{field.unit}</span> : null}
      </div>
      {field.hint ? <small id={`${id}-hint`}>{field.hint}</small> : null}
    </div>
  );
}

function VerdictCard({ tone, headline }: { tone: "strong" | "workable" | "weak" | "incomplete"; headline: string }) {
  const label = tone === "strong" ? "Strong deal" : tone === "workable" ? "Workable" : tone === "weak" ? "Doesn't pencil" : "Needs inputs";
  const Icon = tone === "strong" ? CheckCircle2 : tone === "weak" ? XCircle : CircleAlert;
  return (
    <div className={`verdict verdict-${tone}`}>
      <Icon size={26} aria-hidden="true" />
      <div>
        <strong>{label}</strong>
        <p>{headline}</p>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "warn" | "bad" }) {
  return (
    <div className={`kpi${tone ? ` kpi-${tone}` : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {sub ? <small>{sub}</small> : null}
    </div>
  );
}

function OperatingTable({ rental }: { rental: ReturnType<typeof analyzeRental> }) {
  const op = rental.operating;
  return (
    <Breakdown
      title="Year-1 operating statement"
      rows={[
        ["Gross scheduled income", op.grossScheduledIncome],
        ["Vacancy & credit loss", -op.vacancyLoss],
        ["Effective gross income", op.effectiveGrossIncome],
        ["Property taxes", -op.expenses.taxes],
        ["Insurance", -op.expenses.insurance],
        ["HOA", -op.expenses.hoa],
        ["Management", -op.expenses.management],
        ["Repairs & maintenance", -op.expenses.maintenance],
        ["CapEx reserve", -op.expenses.capex],
        ["Utilities", -op.expenses.utilities],
        ["Other", -op.expenses.other],
        ["Net operating income (NOI)", op.netOperatingIncome],
        ["Debt service (P&I)", -rental.annualDebtService],
        ["Cash flow before tax", rental.annualCashFlow],
      ].filter(([label, value]) => value !== 0 || /income|NOI|Cash flow/.test(String(label))) as Array<[string, number]>}
    />
  );
}

function Breakdown({ rows, title }: { rows: Array<[string, number]>; title?: string }) {
  const totals = /^(Effective gross income|Net operating income|Cash flow before tax|Net profit|Total project cost)/;
  return (
    <div className="analyzer-card">
      {title ? <h5>{title}</h5> : null}
      <dl className="breakdown">
        {rows.map(([label, value]) => (
          <div key={label} className={totals.test(label) ? "total" : label.startsWith("  ") ? "sub" : undefined}>
            <dt>{label.trim()}</dt>
            <dd className={value < 0 ? "neg" : undefined}>{value < 0 ? `(${usd(-value)})` : usd(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function EmptyResult({ text }: { text: string }) {
  return <div className="analyzer-card empty-result"><CircleAlert size={20} aria-hidden="true" /><p>{text}</p></div>;
}

function pct(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value) ? "n/a" : `${(value * 100).toFixed(1)}%`;
}

function toneFor(value: number | null, target: number): "good" | "warn" | "bad" {
  if (value === null) return "bad";
  return value >= target ? "good" : value >= 0 ? "warn" : "bad";
}

function formatAsOf(iso: string) {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DealSnapshot({ deal, onOpen }: { deal: DealLike; onOpen: () => void }) {
  const inputs = useMemo(() => inputsFromDeal(deal), [deal]);
  const rental = useMemo(() => analyzeRental(inputs), [inputs]);
  const verdict = useMemo(() => rentalVerdict(inputs, rental), [inputs, rental]);
  return (
    <section className="workspace-card wide deal-snapshot">
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">Deal snapshot</p>
          <h4>{verdict.tone === "incomplete" ? "Add price and rent to see the numbers" : verdict.headline}</h4>
        </div>
        <button className="primary compact" type="button" onClick={onOpen}>Open analyzer</button>
      </div>
      {verdict.tone !== "incomplete" ? (
        <div className="kpi-grid compact-kpis">
          <Kpi label="Price" value={usd(inputs.purchasePrice)} />
          <Kpi label="Rent / mo" value={usd(inputs.monthlyRent)} />
          <Kpi label="Cash flow / mo" value={usd(rental.monthlyCashFlow)} tone={rental.monthlyCashFlow >= 0 ? "good" : "bad"} />
          <Kpi label="Cash-on-cash" value={pct(rental.cashOnCash)} tone={toneFor(rental.cashOnCash, inputs.targetCashOnCashPct / 100)} />
          <Kpi label="Cap rate" value={pct(rental.capRate)} />
          <Kpi label="DSCR" value={rental.dscr === null ? "No loan" : rental.dscr.toFixed(2)} tone={rental.dscr === null ? undefined : rental.dscr >= inputs.targetDscr ? "good" : "bad"} />
        </div>
      ) : null}
    </section>
  );
}
