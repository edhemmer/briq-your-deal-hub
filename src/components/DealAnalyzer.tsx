import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleAlert, FileDown, Info, MapPin, RotateCcw, Save, Sparkles, XCircle } from "lucide-react";
import { analyzeHouseHack, brixRead, localMarketInsights, riskFlags, stressTest, taxView, whatItTakes } from "../core/dealIntelligence";
import { loadMarketContext, type MarketContext } from "../core/marketContext";
import { STATIC_MARKET_RATES, loadMarketRates, type MarketRates } from "../core/marketRates";
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

export type AnalyzerView = "insights" | "rental" | "brrrr" | "flip" | "househack" | "projection" | "compare";
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
    views: ["insights", "rental", "brrrr", "flip", "househack", "projection", "compare"],
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
    views: ["insights", "rental", "projection", "compare"],
    fields: [
      { key: "downPaymentPct", label: "Down payment", unit: "%", step: 1, hint: "Conventional 1-unit investment: 15%-25%" },
      { key: "interestRate", label: "Interest rate", unit: "%", step: 0.125, market: true },
      { key: "loanTermYears", label: "Loan term", unit: "yrs", step: 1 },
      { key: "loanPointsPct", label: "Points", unit: "%", step: 0.25 },
    ],
  },
  {
    title: "Income",
    views: ["insights", "rental", "brrrr", "househack", "projection", "compare"],
    fields: [
      { key: "monthlyRent", label: "Monthly rent (all units)", unit: "$", step: 25, hint: "Use signed leases or 3+ rent comps" },
      { key: "otherMonthlyIncome", label: "Other income / mo", unit: "$", step: 10, hint: "Laundry, parking, pet fees" },
      { key: "vacancyPct", label: "Vacancy & credit loss", unit: "%", step: 0.5 },
    ],
  },
  {
    title: "Operating expenses",
    views: ["insights", "rental", "brrrr", "househack", "projection", "compare"],
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
    title: "House hack (you live in one unit)",
    views: ["househack"],
    fields: [
      { key: "ownerUnitRent", label: "Rent of the unit you'll live in", unit: "$", step: 25, hint: "Rent you give up by living there" },
      { key: "comparableRentForYou", label: "What you'd pay to rent instead", unit: "$", step: 25 },
      { key: "houseHackDownPct", label: "Down payment", unit: "%", step: 0.5, hint: "FHA minimum 3.5%; conventional owner-occupied 5% on 1 unit" },
      { key: "houseHackRate", label: "Owner-occupied rate", unit: "%", step: 0.125, market: true },
      { key: "houseHackMipPct", label: "Annual MIP / PMI", unit: "%", step: 0.05, hint: "FHA: 0.55% on most 30-year loans" },
      { key: "houseHackUpfrontMipPct", label: "Upfront MIP (financed)", unit: "%", step: 0.25, hint: "FHA: 1.75%; enter 0 for conventional" },
    ],
  },
  {
    title: "Taxes",
    views: ["projection"],
    fields: [
      { key: "taxBracketPct", label: "Your marginal tax bracket", unit: "%", step: 1 },
      { key: "landValuePct", label: "Land share of price (not depreciable)", unit: "%", step: 1, hint: "Use the county assessor's land/improvement split" },
    ],
  },
  {
    title: "Your targets",
    views: ["insights", "rental", "compare"],
    fields: [
      { key: "targetMonthlyCashFlowPerUnit", label: "Min cash flow / unit / mo", unit: "$", step: 25 },
      { key: "targetCashOnCashPct", label: "Min cash-on-cash", unit: "%", step: 0.5 },
      { key: "targetDscr", label: "Min DSCR", unit: "x", step: 0.05 },
    ],
  },
];

const VIEWS: Array<{ id: AnalyzerView; label: string }> = [
  { id: "insights", label: "Smart insights" },
  { id: "rental", label: "Rental" },
  { id: "brrrr", label: "BRRRR" },
  { id: "flip", label: "Fix & flip" },
  { id: "househack", label: "House hack" },
  { id: "projection", label: "10-year view" },
  { id: "compare", label: "Compare" },
];

export function DealAnalyzer({
  deal,
  initialView = "insights",
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
  const [market, setMarket] = useState<MarketRates>(STATIC_MARKET_RATES);
  useEffect(() => {
    let active = true;
    void loadMarketRates().then((rates) => { if (active) setMarket(rates); });
    return () => { active = false; };
  }, []);
  const [local, setLocal] = useState<MarketContext | null>(null);
  useEffect(() => {
    let active = true;
    void loadMarketContext(deal.zip).then((ctx) => { if (active) setLocal(ctx); });
    return () => { active = false; };
  }, [deal.zip]);
  const [memoState, setMemoState] = useState<"idle" | "working" | "failed">("idle");
  const savedInputs = useMemo(() => inputsFromDeal(deal, market), [deal, market]);
  const marketDefaults: Partial<Record<keyof AnalyzerInputs, unknown>> = { ...DEFAULT_ASSUMPTIONS, interestRate: market.investmentRate30y, refiRate: market.dscrRate30y };
  const [inputs, setInputs] = useState<AnalyzerInputs>(savedInputs);
  const [view, setView] = useState<AnalyzerView>(initialView);
  useEffect(() => setInputs(savedInputs), [savedInputs]);

  const dirty = JSON.stringify(inputs) !== JSON.stringify(savedInputs);
  const rental = useMemo(() => analyzeRental(inputs), [inputs]);
  const verdict = useMemo(() => rentalVerdict(inputs, rental), [inputs, rental]);
  const brrrr = useMemo(() => analyzeBrrrr(inputs), [inputs]);
  const flip = useMemo(() => analyzeFlip(inputs), [inputs]);
  const maxOffer = useMemo(() => maxRentalOffer(inputs), [inputs]);
  const takes = useMemo(() => whatItTakes(inputs), [inputs]);
  const stress = useMemo(() => stressTest(inputs), [inputs]);
  const localInsight = useMemo(() => localMarketInsights(inputs, deal, local), [inputs, deal, local]);
  const flags = useMemo(() => {
    const all = [...riskFlags(inputs, deal, rental), ...(localInsight?.flags ?? [])];
    const order = { high: 0, medium: 1, info: 2 } as const;
    return all.sort((a, b) => order[a.severity] - order[b.severity]);
  }, [inputs, deal, rental, localInsight]);
  const read = useMemo(() => brixRead(inputs, rental), [inputs, rental]);
  const houseHack = useMemo(() => analyzeHouseHack(inputs), [inputs]);
  const tax = useMemo(() => taxView(inputs, rental), [inputs, rental]);

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
          <button
            className="secondary compact"
            type="button"
            disabled={inputs.purchasePrice <= 0 || memoState === "working"}
            onClick={() => {
              setMemoState("working");
              void import("../core/dealMemoPdf")
                .then((m) => m.downloadDealMemo({
                  title: deal.address || "Deal",
                  address: [deal.address, [deal.city, [deal.state, deal.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")].filter(Boolean).join(", "),
                  inputs,
                  deal,
                  market: local,
                  ratesNote: `Rates: Freddie Mac PMMS week of ${formatAsOf(market.asOf)} (${market.primaryRate30y}% 30-yr); investment loans ≈${market.investmentRate30y}%.`,
                }))
                .then(() => setMemoState("idle"))
                .catch(() => setMemoState("failed"));
            }}
          >
            <FileDown size={16} /> {memoState === "working" ? "Building…" : memoState === "failed" ? "Retry memo" : "Deal Memo PDF"}
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
                  isDefault={marketDefaults[field.key] === inputs[field.key]}
                  marketAsOf={market.asOf}
                  onChange={(value) => update(field.key, value)}
                />
              ))}
            </fieldset>
          ))}
          <p className="analyzer-footnote">
            {market.live ? "Live" : "Built-in"} market rates, week of {formatAsOf(market.asOf)}: 30-yr primary {market.primaryRate30y}% ({market.source}), investment ≈{market.investmentRate30y}%, DSCR ≈{market.dscrRate30y}%, hard money ≈{MARKET_DEFAULTS.hardMoneyRate}% + {MARKET_DEFAULTS.hardMoneyPointsPct} pts, FHA ≈{MARKET_DEFAULTS.fhaRate30y}%. Replace with your lender quote.
          </p>
        </aside>

        <section className="analyzer-results" aria-label="Results">
          {view === "insights" && (
            verdict.tone === "incomplete" ? <EmptyResult text="Add a purchase price and monthly rent to get BRIX's read on this deal." /> : (
              <>
                <VerdictCard tone={verdict.tone} headline={verdict.headline} />
                {read ? (
                  <div className="analyzer-card brix-read">
                    <h5><Sparkles size={16} aria-hidden="true" /> BRIX's read</h5>
                    <p>{read}</p>
                  </div>
                ) : null}
                <div className="analyzer-card">
                  <h5>{takes.alreadyMeets ? "How much room you have" : "What it would take to hit your targets"}</h5>
                  <p className="analyzer-footnote">Each line changes one thing and holds everything else constant.</p>
                  <div className="lever-grid">
                    {takes.levers.map((lever) => (
                      <div key={lever.id} className={`lever ${lever.needed === null ? "lever-none" : lever.feasible ? "lever-ok" : "lever-hard"}`}>
                        <span>{lever.label}</span>
                        <strong>{lever.needed ?? "Not possible"}</strong>
                        <small>{lever.needed ? `from ${lever.current}${lever.change ? ` (${lever.change})` : ""}` : `now ${lever.current}`}</small>
                        <p>{lever.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="analyzer-card table-scroll">
                  <h5>Stress test</h5>
                  <table className="projection-table stress-table">
                    <thead><tr><th>Scenario</th><th>Cash flow / mo</th><th>DSCR</th><th>Holds?</th></tr></thead>
                    <tbody>
                      {stress.map((scenario) => (
                        <tr key={scenario.label}>
                          <td><strong>{scenario.label}</strong><small>{scenario.detail}</small></td>
                          <td className={scenario.monthlyCashFlow >= 0 ? "pos" : "neg"}>{usd(scenario.monthlyCashFlow)}</td>
                          <td>{scenario.dscr === null ? "—" : scenario.dscr.toFixed(2)}</td>
                          <td>{scenario.survives ? <CheckCircle2 size={18} className="ok" aria-label="Holds" /> : <XCircle size={18} className="no" aria-label="Breaks" />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {localInsight && local ? (
                  <div className="analyzer-card local-market">
                    <h5><MapPin size={16} aria-hidden="true" /> Local market · ZIP {local.zip}</h5>
                    <div className="kpi-grid compact-kpis">
                      <Kpi label={localInsight.benchmarkLabel.replace(/, ZIP \d+$/, "")} value={localInsight.benchmarkRent ? usd(localInsight.benchmarkRent) : "n/a"} sub="Today's dollars" />
                      <Kpi label="Your rent vs median" value={localInsight.rentVsBenchmark === null ? "n/a" : `${Math.round(localInsight.rentVsBenchmark * 100)}%`} tone={localInsight.rentVsBenchmark === null ? undefined : localInsight.rentVsBenchmark > 1.3 ? "warn" : "good"} />
                      <Kpi label="Rental vacancy" value={localInsight.localVacancyPct === null ? "n/a" : `${localInsight.localVacancyPct.toFixed(1)}%`} sub={`You assume ${inputs.vacancyPct}%`} tone={localInsight.localVacancyPct !== null && localInsight.localVacancyPct > inputs.vacancyPct + 1 ? "warn" : undefined} />
                      <Kpi label="Median household income" value={local.medianHouseholdIncome ? usd(local.medianHouseholdIncome) : "n/a"} sub={localInsight.rentToIncome === null ? undefined : `Rent = ${Math.round(localInsight.rentToIncome * 100)}% of it`} />
                      <Kpi label="Renter share" value={local.renterShare === null ? "n/a" : `${Math.round(local.renterShare * 100)}%`} />
                      <Kpi label="Median home value" value={local.medianHomeValue ? usd(local.medianHomeValue) : "n/a"} sub="Survey period" />
                    </div>
                    {localInsight.localVacancyPct !== null && localInsight.localVacancyPct > inputs.vacancyPct + 1 ? (
                      <button className="secondary compact" type="button" onClick={() => update("vacancyPct", Math.ceil(localInsight.localVacancyPct!))}>Use local vacancy ({Math.ceil(localInsight.localVacancyPct)}%)</button>
                    ) : null}
                    <p className="analyzer-footnote">{local.survey}{local.rentAdjustment ? `; rents brought to ${formatAsOf(local.rentAdjustment.through)} dollars (×${local.rentAdjustment.factor}) using ${local.rentAdjustment.source}` : ""}. ZIP-level medians include all unit ages and conditions; use them as a sanity check next to real comps.</p>
                  </div>
                ) : null}
                {flags.length ? (
                  <div className="analyzer-card">
                    <h5>Risks and checks ({flags.length})</h5>
                    <ul className="flag-list">
                      {flags.map((flag) => (
                        <li key={flag.title} className={`flag flag-${flag.severity}`}>
                          {flag.severity === "info" ? <Info size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
                          <div><strong>{flag.title}</strong><p>{flag.detail}</p></div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )
          )}

          {view === "househack" && (houseHack ? (
            <>
              <VerdictCard
                tone={houseHack.netMonthlyHousingCost <= 0 ? "strong" : houseHack.savingsVsRentingAfterEquity === null ? "incomplete" : houseHack.savingsVsRenting !== null && houseHack.savingsVsRenting >= 0 ? "strong" : houseHack.savingsVsRentingAfterEquity >= 0 ? "workable" : "weak"}
                headline={houseHack.netMonthlyHousingCost <= 0
                  ? `You live free and pocket ${usd(-houseHack.netMonthlyHousingCost)}/mo.`
                  : houseHack.savingsVsRenting === null
                    ? `Your net housing cost is ${usd(houseHack.netMonthlyHousingCost)}/mo (${usd(houseHack.costAfterEquity)} after principal paydown). Add what you'd pay to rent to compare.`
                    : houseHack.savingsVsRenting >= 0
                      ? `Costs ${usd(houseHack.netMonthlyHousingCost)}/mo to live here, ${usd(houseHack.savingsVsRenting)} less than renting, and you build ${usd(houseHack.monthlyPrincipalPaydown)}/mo of equity.`
                      : houseHack.savingsVsRentingAfterEquity! >= 0
                        ? `Costs ${usd(-houseHack.savingsVsRenting)}/mo more than renting in cash, but beats renting by ${usd(houseHack.savingsVsRentingAfterEquity!)}/mo once principal paydown is counted.`
                        : `Costs ${usd(-houseHack.savingsVsRentingAfterEquity!)}/mo more than renting even after ${usd(houseHack.monthlyPrincipalPaydown)}/mo of principal paydown.`}
              />
              <div className="kpi-grid">
                <Kpi label="Net housing cost / mo" value={usd(houseHack.netMonthlyHousingCost)} tone={houseHack.netMonthlyHousingCost <= 0 ? "good" : undefined} />
                <Kpi label="Cost after equity build" value={usd(houseHack.costAfterEquity)} sub={`Net cost − ${usd(houseHack.monthlyPrincipalPaydown)}/mo principal`} />
                <Kpi label="Cash to close" value={usd(houseHack.cashToClose)} sub="Down + closing costs" />
                <Kpi label="Rent from other units" value={usd(houseHack.rentFromOtherUnits)} sub="After vacancy" />
                <Kpi label="Cash flow after you move out" value={usd(houseHack.afterMoveOutCashFlow)} tone={houseHack.afterMoveOutCashFlow >= 0 ? "good" : "bad"} sub="Same loan, all units rented" />
              </div>
              <Breakdown title="Monthly cost of living there" rows={[
                ["Principal & interest", houseHack.monthlyPrincipalAndInterest],
                ["Mortgage insurance", houseHack.monthlyMip],
                ["Taxes, insurance, HOA", houseHack.monthlyTaxesInsuranceHoa],
                ["Reserves, management, utilities", houseHack.monthlyReservesAndOther],
                ["Rent collected from other units", -houseHack.rentFromOtherUnits],
                ["Net monthly housing cost", houseHack.netMonthlyHousingCost],
              ]} />
              {inputs.ownerUnitRent <= 0 ? <p className="max-offer warn">Enter the rent of the unit you'll live in, so BRIX doesn't count it as income.</p> : null}
              {houseHack.overFhaLimit ? <p className="max-offer warn">This loan may exceed the FHA limit for this county. Check HUD's lookup or use a conventional owner-occupied loan.</p> : null}
              <p className="analyzer-footnote">FHA requires you to move in within 60 days and live there at least a year. 3-4 unit FHA purchases must pass a self-sufficiency test: 75% of total rent has to cover the full payment. Upfront MIP is financed; annual MIP is modeled on the base loan.</p>
            </>
          ) : <EmptyResult text="Add a purchase price to model a house hack." />)}

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
                <Kpi label="Year-1 depreciation" value={usd(tax.annualDepreciation)} sub="27.5-yr straight line" />
                <Kpi label="Year-1 after-tax cash flow" value={usd(tax.afterTaxCashFlow)} tone={tax.afterTaxCashFlow >= 0 ? "good" : "bad"} sub={tax.taxEffect >= 0 ? `${usd(tax.taxEffect)} tax savings at ${inputs.taxBracketPct}%` : `${usd(-tax.taxEffect)} tax at ${inputs.taxBracketPct}%`} />
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
              <p className="analyzer-footnote">The table is pre-tax. After-tax figures assume rental losses can offset your other income; passive-loss rules limit that for many investors (the $25,000 allowance phases out between $100,000 and $150,000 of modified AGI) unless you qualify as a real estate professional. A cost segregation study can move components into shorter lives eligible for 100% bonus depreciation (permanent for property acquired after Jan 19, 2025). Confirm with your CPA.</p>
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

function NumberInput({ field, value, disabled, isDefault, marketAsOf, onChange }: { field: FieldDef; value: number | undefined; disabled?: boolean; isDefault: boolean; marketAsOf: string; onChange: (value: number | undefined) => void }) {
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
        {field.market ? <span className="badge-market" title={`Market default, week of ${formatAsOf(marketAsOf)}`}>{isDefault ? "Market" : "Custom"}</span> : null}
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
          onFocus={() => setFocused(true)}
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
  const read = useMemo(() => brixRead(inputs, rental), [inputs, rental]);
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
      {read ? <p className="snapshot-read"><Sparkles size={16} aria-hidden="true" /> {read}</p> : null}
    </section>
  );
}
