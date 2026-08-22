import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, Landmark, RefreshCw, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { loadFinanceIQWorkspace, saveDebtTranche, saveEquityTranche, selectActiveFinancingStructure, updateFinancingStructure, type FinanceIQWorkspaceData } from "../core/financeIQClient";
import { buildFinanceIQPresentation, formatCurrencyDisplay, formatPercentDisplay, labelize, type FinanceIQPresentationModel } from "../core/financeIQPresentation";
import type { DebtTranche, EquityTranche, FinancingStructure } from "../core/financeIQ";
import type { PresentationMode } from "../core/presentationMode";

type FinanceIQWorkspaceProps = {
  dealId: string;
  dealName: string;
  workspaceId?: string;
  isAuthenticated: boolean;
  isOnline: boolean;
  mode: PresentationMode;
};

type FinanceIQSection = "overview" | "capital" | "debt" | "equity" | "requirements" | "compare" | "sources";

const financeIqSections: Array<{ id: FinanceIQSection; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "capital", label: "Capital Stack" },
  { id: "debt", label: "Debt" },
  { id: "equity", label: "Equity" },
  { id: "requirements", label: "Conditions & Covenants" },
  { id: "compare", label: "Compare" },
  { id: "sources", label: "Sources / Documents" },
];

export function FinanceIQWorkspace({ dealId, dealName, workspaceId, isAuthenticated, isOnline, mode }: FinanceIQWorkspaceProps) {
  const [data, setData] = useState<FinanceIQWorkspaceData | null>(null);
  const [selectedStructureId, setSelectedStructureId] = useState<string | undefined>();
  const [section, setSection] = useState<FinanceIQSection>("overview");
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "failed" | "offline" | "signed_out">("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async (nextSelectedStructureId = selectedStructureId) => {
    if (!isAuthenticated || !workspaceId) {
      setStatus("signed_out");
      setMessage("Sign in to load canonical FinanceIQ financing structures for this Deal.");
      return;
    }
    if (!isOnline) {
      setStatus("offline");
      setMessage("FinanceIQ requires a connection so BRIX can confirm canonical financing state.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const loaded = await loadFinanceIQWorkspace(dealId, nextSelectedStructureId);
      setData(loaded);
      const selected = loaded.projections.find((projection) => projection.financingStructureId === nextSelectedStructureId)
        ?? loaded.projections.find((projection) => projection.isActive)
        ?? loaded.projections[0];
      setSelectedStructureId(selected?.financingStructureId);
      setStatus("idle");
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "BRIX could not load FinanceIQ.");
    }
  }, [dealId, isAuthenticated, isOnline, selectedStructureId, workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const model = useMemo(() => buildFinanceIQPresentation({
    dealId,
    dealName,
    mode,
    projections: data?.projections ?? [],
    selectedStructureId,
    selectedStructure: data?.selectedStructure,
    capitalSources: data?.capitalSources,
    debtTranches: data?.debtTranches,
    equityTranches: data?.equityTranches,
    debtSchedules: data?.debtSchedules,
    conditions: data?.conditions,
    covenants: data?.covenants,
    comparison: data?.comparison,
  }), [data, dealId, dealName, mode, selectedStructureId]);

  async function onSelectStructure(id: string) {
    setSelectedStructureId(id);
    await load(id);
  }

  async function onActivate() {
    if (!model.selectedProjection || !model.activeSelection.canSelect) return;
    setStatus("saving");
    setMessage("");
    try {
      await selectActiveFinancingStructure(model.selectedProjection.financingStructureId, model.selectedProjection.financingStructureVersion);
      await load(model.selectedProjection.financingStructureId);
      setMessage("Active financing structure updated. BRIX will keep prior valid underwriting visible while downstream results refresh.");
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "BRIX could not activate that financing structure.");
    }
  }

  if (status === "signed_out" || status === "offline") {
    return <FinanceIQStateCard title={status === "signed_out" ? "FinanceIQ needs your BRIX account" : "FinanceIQ is offline"} message={message} />;
  }

  return (
    <div className="financeiq-workspace" role="region" aria-label="FinanceIQ workspace">
      <section className="workspace-card wide financeiq-hero">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">FinanceIQ</p>
            <h4>{model.selectedProjection?.name ?? model.emptyState?.title ?? "Financing structure"}</h4>
            <p className="quiet">{model.emptyState?.detail ?? "Canonical financing, lender requirements, and underwriting-owned debt projections for this Deal."}</p>
          </div>
          <div className="financeiq-actions">
            <span className="status-badge">{mode === "professional" ? "Professional" : "Guided"}</span>
            <button className="secondary compact" type="button" onClick={() => void load()} disabled={status === "loading" || status === "saving"}>
              <RefreshCw size={14} /> Reload
            </button>
            <button className="primary compact" type="button" onClick={() => void onActivate()} disabled={!model.activeSelection.canSelect || status === "saving"}>
              <CheckCircle2 size={14} /> {model.activeSelection.label}
            </button>
          </div>
        </div>
        {model.projections.length > 0 && (
          <div className="financeiq-structure-picker" aria-label="Financing structures">
            {model.projections.map((projection) => (
              <button
                key={projection.financingStructureId}
                className={projection.financingStructureId === model.selectedProjection?.financingStructureId ? "financeiq-structure-chip active" : "financeiq-structure-chip"}
                type="button"
                onClick={() => void onSelectStructure(projection.financingStructureId)}
              >
                <span>{projection.name}</span>
                <small>{projection.isActive ? "Active" : labelize(projection.status)}</small>
              </button>
            ))}
          </div>
        )}
        {model.activeSelection.warning && <p className="warning-text">{model.activeSelection.warning}</p>}
        {message && <p className={status === "failed" ? "error" : "success-text"}>{message}</p>}
        {status === "loading" && <p className="quiet">Loading canonical FinanceIQ records.</p>}
      </section>

      {model.selectedProjection ? (
        <>
          <nav className="financeiq-tabs" role="tablist" aria-label="FinanceIQ sections">
            {financeIqSections.map((item) => (
              <button key={item.id} className={section === item.id ? "deal-section-tab active" : "deal-section-tab"} type="button" role="tab" aria-selected={section === item.id} onClick={() => setSection(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>
          {section === "overview" && <FinanceIQOverview model={model} onSaved={() => load(model.selectedProjection?.financingStructureId)} />}
          {section === "capital" && <FinanceIQCapitalStack model={model} />}
          {section === "debt" && <FinanceIQDebt model={model} status={status} onSaved={() => load(model.selectedProjection?.financingStructureId)} />}
          {section === "equity" && <FinanceIQEquity model={model} status={status} onSaved={() => load(model.selectedProjection?.financingStructureId)} />}
          {section === "requirements" && <FinanceIQRequirements model={model} />}
          {section === "compare" && <FinanceIQCompare model={model} />}
          {section === "sources" && <FinanceIQSources model={model} />}
        </>
      ) : (
        <FinanceIQStateCard title={model.emptyState?.title ?? "No FinanceIQ structure yet"} message={model.emptyState?.detail ?? "No financing structures are available."} />
      )}
    </div>
  );
}

function FinanceIQOverview({ model, onSaved }: { model: FinanceIQPresentationModel; onSaved: () => Promise<void> }) {
  return (
    <div className="financeiq-grid">
      <section className="workspace-card wide">
        <div className="financeiq-summary-grid">
          {model.overview.map((item) => (
            <article className={`financeiq-summary-card ${item.tone}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              {item.detail && <small>{item.detail}</small>}
            </article>
          ))}
        </div>
      </section>
      <StructureEditCard model={model} onSaved={onSaved} />
      <section className="workspace-card">
        <p className="eyebrow">Sources & Uses</p>
        <h4>{model.sourcesUses.title}</h4>
        <p className="quiet">{model.sourcesUses.detail}</p>
      </section>
    </div>
  );
}

function StructureEditCard({ model, onSaved }: { model: FinanceIQPresentationModel; onSaved: () => Promise<void> }) {
  const structure = model.selectedStructure;
  const projection = model.selectedProjection;
  const [name, setName] = useState(structure?.name ?? projection?.name ?? "");
  const [status, setStatus] = useState<string>(structure?.status ?? projection?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setName(structure?.name ?? projection?.name ?? "");
    setStatus(structure?.status ?? projection?.status ?? "draft");
    setMessage("");
  }, [projection?.financingStructureId, projection?.name, projection?.status, structure?.name, structure?.status]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!projection) return;
    setSaving(true);
    setMessage("");
    try {
      await updateFinancingStructure(projection.financingStructureId, projection.financingStructureVersion, { name, status: status as FinancingStructure["status"] });
      await onSaved();
      setMessage("Structure terms saved. Downstream calculations remain backend-owned.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "BRIX could not save structure terms.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="workspace-card">
      <p className="eyebrow">Edit structure</p>
      <h4>Canonical terms</h4>
      <form className="financeiq-edit-form" onSubmit={(event) => void submit(event)}>
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>
          {["draft", "scenario", "proposed", "quoted", "application_started", "application_submitted", "conditional_approval", "approved", "commitment_issued", "clear_to_close", "closed", "declined", "withdrawn", "expired", "superseded", "refinance_candidate"].map((option) => <option key={option} value={option}>{labelize(option)}</option>)}
        </select></label>
        <button className="primary compact" type="submit" disabled={saving}><Save size={14} /> Save</button>
      </form>
      {message && <p className={message.includes("could not") || message.includes("changed") ? "error" : "success-text"}>{message}</p>}
    </section>
  );
}

function FinanceIQCapitalStack({ model }: { model: FinanceIQPresentationModel }) {
  return (
    <section className="workspace-card wide">
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">Capital Stack</p>
          <h4>{model.capitalStack.label}</h4>
          <p className="quiet">{formatCurrencyDisplay(model.capitalStack.knownAmount, model.capitalStack.currency)} source-backed amount known. Percentages are percent of known stack only.</p>
        </div>
        {model.capitalStack.unknownSegmentCount > 0 && <span className="status-badge warning">{model.capitalStack.unknownSegmentCount} amount unknown</span>}
      </div>
      <div className="capital-stack-bar" aria-label={model.capitalStack.label}>
        {model.capitalStack.segments.map((segment) => (
          <span key={segment.id} className={`capital-stack-segment ${segment.kind}`} style={{ flexGrow: segment.percentOfKnownStack ? Math.max(segment.percentOfKnownStack * 100, 3) : 3 }} title={`${segment.label}: ${formatCurrencyDisplay(segment.amount, segment.currency)}`} />
        ))}
      </div>
      <div className="financeiq-row-list" role="list" aria-label="Capital stack segments">
        {model.capitalStack.segments.map((segment) => (
          <article className="financeiq-row" key={segment.id} role="listitem">
            <Landmark size={16} />
            <div>
              <strong>{segment.label}</strong>
              <span>{labelize(segment.sourceType)} / {labelize(segment.status)}</span>
            </div>
            <b>{formatCurrencyDisplay(segment.amount, segment.currency)}</b>
            <small>{segment.percentOfKnownStack === undefined ? "Percent not shown" : `${formatPercentDisplay(segment.percentOfKnownStack)} of known stack`} / {labelize(segment.verificationState)}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinanceIQDebt({ model, status, onSaved }: { model: FinanceIQPresentationModel; status: string; onSaved: () => Promise<void> }) {
  return (
    <div className="financeiq-grid">
      {model.debtTranches.map((tranche) => <DebtEditCard key={tranche.debtTrancheId} model={model} tranche={tranche} disabled={status === "saving"} onSaved={onSaved} />)}
      <section className="workspace-card wide">
        <p className="eyebrow">Debt schedule drilldown</p>
        <h4>Underwriting-owned projections</h4>
        {model.debtSchedules.length === 0 ? <p className="quiet">No debt schedule projection is available for this financing structure.</p> : (
          <div className="financeiq-table-wrap">
            <table className="strategy-table">
              <caption>Read-only debt schedule projection summaries</caption>
              <thead><tr><th>Tranche</th><th>Status</th><th>First payment</th><th>Final payment</th><th>Total service</th><th>Balloon</th><th>Warnings</th></tr></thead>
              <tbody>
                {model.debtSchedules.map((schedule) => (
                  <tr key={schedule.debtTrancheId}>
                    <td>{schedule.debtTrancheLabel}</td>
                    <td>{labelize(schedule.status)}</td>
                    <td>{formatCurrencyDisplay(schedule.firstPeriodicDebtService, schedule.currency)}</td>
                    <td>{formatCurrencyDisplay(schedule.finalPeriodicDebtService, schedule.currency)}</td>
                    <td>{formatCurrencyDisplay(schedule.totalDebtService, schedule.currency)}</td>
                    <td>{formatCurrencyDisplay(schedule.totalBalloonPaid, schedule.currency)}</td>
                    <td>{schedule.warningCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function DebtEditCard({ model, tranche, disabled, onSaved }: { model: FinanceIQPresentationModel; tranche: DebtTranche; disabled: boolean; onSaved: () => Promise<void> }) {
  const [label, setLabel] = useState(tranche.label);
  const [principal, setPrincipal] = useState(String(tranche.principalAmount ?? ""));
  const [rate, setRate] = useState(String(tranche.statedRate ?? ""));
  const [maturity, setMaturity] = useState(String(tranche.maturityMonths ?? ""));
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!model.selectedProjection) return;
    try {
      await saveDebtTranche(model.selectedProjection.financingStructureId, { debtTrancheId: tranche.debtTrancheId, label, principalAmount: numberInput(principal), statedRate: numberInput(rate), maturityMonths: numberInput(maturity) }, tranche.debtTrancheVersion);
      await onSaved();
      setMessage("Debt terms saved. Schedule math remains in the underwriting engine.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "BRIX could not save debt terms.");
    }
  }
  return (
    <section className="workspace-card">
      <p className="eyebrow">Debt tranche</p>
      <h4>{tranche.label}</h4>
      <form className="financeiq-edit-form" onSubmit={(event) => void submit(event)}>
        <label>Label<input value={label} onChange={(event) => setLabel(event.target.value)} /></label>
        <label>Principal<input inputMode="decimal" value={principal} onChange={(event) => setPrincipal(event.target.value)} /></label>
        <label>Stated rate<input inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} /></label>
        <label>Maturity months<input inputMode="numeric" value={maturity} onChange={(event) => setMaturity(event.target.value)} /></label>
        <button className="primary compact" type="submit" disabled={disabled}><Save size={14} /> Save debt</button>
      </form>
      <DefinitionList items={[
        { label: "Lender", value: tranche.lenderLabel ?? "Not provided" },
        { label: "Payment frequency", value: labelize(tranche.paymentFrequency) },
        { label: "Balloon", value: tranche.hasBalloon ? "Yes" : "No" },
        { label: "Recourse", value: labelize(tranche.recourseType) },
      ]} />
      {message && <p className={message.includes("could not") || message.includes("changed") ? "error" : "success-text"}>{message}</p>}
    </section>
  );
}

function FinanceIQEquity({ model, status, onSaved }: { model: FinanceIQPresentationModel; status: string; onSaved: () => Promise<void> }) {
  if (model.equityTranches.length === 0) return <FinanceIQStateCard title="No equity tranches" message="No canonical equity tranche is attached to this financing structure." />;
  return <div className="financeiq-grid">{model.equityTranches.map((tranche) => <EquityEditCard key={tranche.equityTrancheId} model={model} tranche={tranche} disabled={status === "saving"} onSaved={onSaved} />)}</div>;
}

function EquityEditCard({ model, tranche, disabled, onSaved }: { model: FinanceIQPresentationModel; tranche: EquityTranche; disabled: boolean; onSaved: () => Promise<void> }) {
  const [label, setLabel] = useState(tranche.label);
  const [amount, setAmount] = useState(String(tranche.contributionAmount ?? ""));
  const [ownership, setOwnership] = useState(String(tranche.ownershipPercentage ?? ""));
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!model.selectedProjection) return;
    try {
      await saveEquityTranche(model.selectedProjection.financingStructureId, { equityTrancheId: tranche.equityTrancheId, label, contributionAmount: numberInput(amount), ownershipPercentage: numberInput(ownership) }, tranche.equityTrancheVersion);
      await onSaved();
      setMessage("Equity terms saved through FinanceIQ.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "BRIX could not save equity terms.");
    }
  }
  return (
    <section className="workspace-card">
      <p className="eyebrow">Equity tranche</p>
      <h4>{tranche.label}</h4>
      <form className="financeiq-edit-form" onSubmit={(event) => void submit(event)}>
        <label>Label<input value={label} onChange={(event) => setLabel(event.target.value)} /></label>
        <label>Contribution<input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label>Ownership %<input inputMode="decimal" value={ownership} onChange={(event) => setOwnership(event.target.value)} /></label>
        <button className="primary compact" type="submit" disabled={disabled}><Save size={14} /> Save equity</button>
      </form>
      <DefinitionList items={[
        { label: "Contributor", value: tranche.contributorLabel ?? "Not provided" },
        { label: "Control terms", value: tranche.controlTerms ?? "Not provided" },
        { label: "Voting terms", value: tranche.votingTerms ?? "Not provided" },
        { label: "Distribution priority", value: String(tranche.distributionPriority) },
      ]} />
      {message && <p className={message.includes("could not") || message.includes("changed") ? "error" : "success-text"}>{message}</p>}
    </section>
  );
}

function FinanceIQRequirements({ model }: { model: FinanceIQPresentationModel }) {
  return (
    <div className="financeiq-grid">
      <section className="workspace-card">
        <p className="eyebrow">Conditions</p>
        <h4>{model.requirementCounts.unresolvedConditions} unresolved</h4>
        <div className="financeiq-row-list">{model.conditions.map((condition) => (
          <article className="financeiq-row" key={condition.conditionId}>
            <ShieldCheck size={16} /><div><strong>{condition.title}</strong><span>{labelize(condition.conditionType)} / {labelize(condition.status)}</span></div><small>{condition.dueDate ? `Due ${condition.dueDate}` : "No due date"}</small>
          </article>
        ))}</div>
      </section>
      <section className="workspace-card">
        <p className="eyebrow">Covenants</p>
        <h4>{model.requirementCounts.failedCovenants} failed / {model.requirementCounts.uncertainCovenants} uncertain</h4>
        <div className="financeiq-row-list">{model.covenants.map((covenant) => (
          <article className="financeiq-row" key={covenant.covenantId}>
            <SlidersHorizontal size={16} /><div><strong>{labelize(covenant.covenantType)}</strong><span>{covenant.metricKey ? labelize(covenant.metricKey) : "No bound metric"} / {labelize(covenant.status)}</span></div><small>{covenant.isHardConstraint ? "Hard constraint" : "Soft condition"}</small>
          </article>
        ))}</div>
      </section>
    </div>
  );
}

function FinanceIQCompare({ model }: { model: FinanceIQPresentationModel }) {
  if (!model.comparison) return <FinanceIQStateCard title="No comparison result yet" message="FinanceIQ will show saved comparison output after the backend creates a canonical financing comparison." />;
  return (
    <section className="workspace-card wide">
      <p className="eyebrow">Comparison</p>
      <h4>{labelize(model.comparison.status)}</h4>
      {model.comparison.clearWinnerFinancingStructureId && <p className="success-text">Winner: {model.comparison.clearWinnerFinancingStructureId}</p>}
      <div className="financeiq-row-list">{model.comparison.tradeoffs.map((tradeoff) => (
        <article className="financeiq-row" key={`${tradeoff.dimension}-${tradeoff.reasonCode}`}>
          <div><strong>{labelize(tradeoff.dimension)}</strong><span>{tradeoff.explanation}</span></div><small>{labelize(tradeoff.state)}</small>
        </article>
      ))}</div>
    </section>
  );
}

function FinanceIQSources({ model }: { model: FinanceIQPresentationModel }) {
  return (
    <section className="workspace-card wide">
      <p className="eyebrow">Sources / Documents</p>
      <h4>Source-backed financing terms</h4>
      <div className="financeiq-row-list">{model.sourceTerms.map((term) => (
        <article className="financeiq-row" key={`${term.recordType}-${term.id}`}>
          <div><strong>{term.label}</strong><span>{labelize(term.recordType)} / {labelize(term.sourceClassification)}</span></div>
          <b>{labelize(term.verificationState)}</b>
          <small>{term.sourceEvidenceId ? `Evidence ${term.sourceEvidenceId}` : "No evidence link"}</small>
        </article>
      ))}</div>
    </section>
  );
}

function FinanceIQStateCard({ title, message }: { title: string; message: string }) {
  return (
    <section className="workspace-card wide financeiq-empty">
      <p className="eyebrow">FinanceIQ</p>
      <h4>{title}</h4>
      <p className="quiet">{message}</p>
    </section>
  );
}

function DefinitionList({ items }: { items: Array<{ label: string; value: string }> }) {
  return <div className="definition-list">{items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</div>;
}

function numberInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
