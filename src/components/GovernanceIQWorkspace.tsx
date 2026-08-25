import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FileSearch, Gavel, Landmark, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import {
  loadGovernanceIQWorkspace,
  propagateAcceptedGovernanceFinding,
  setGovernanceFindingAcceptance,
  type GovernanceWorkspaceData,
} from "../core/governanceIQClient";
import {
  buildGovernanceIQPresentation,
  findingCategoryLabel,
  formatMoney,
  formatPercent,
  governanceIqSections,
  governanceSectionFromFocus,
  hierarchyLabel,
  labelize,
  possibleImpactLabels,
  restrictionStateLabel,
  sourceAnchorLabel,
  type GovernanceIQPresentationModel,
  type GovernanceIQSectionId,
} from "../core/governanceIQPresentation";
import type { GovernanceAcceptanceState, GovernanceFinding } from "../core/governanceIQ";
import type { PresentationMode } from "../core/presentationMode";

type GovernanceIQWorkspaceProps = {
  dealId: string;
  dealName: string;
  workspaceId?: string;
  isAuthenticated: boolean;
  isOnline: boolean;
  mode: PresentationMode;
};

type WorkspaceStatus = "idle" | "loading" | "saving" | "failed" | "offline" | "signed_out";

export function GovernanceIQWorkspace({ dealId, dealName, workspaceId, isAuthenticated, isOnline, mode }: GovernanceIQWorkspaceProps) {
  const [data, setData] = useState<GovernanceWorkspaceData | null>(null);
  const [selectedGovernanceRecordId, setSelectedGovernanceRecordId] = useState<string | undefined>();
  const [section, setSection] = useState<GovernanceIQSectionId>(() => governanceSectionFromFocus(new URLSearchParams(window.location.search).get("focus")));
  const [status, setStatus] = useState<WorkspaceStatus>("loading");
  const [message, setMessage] = useState("");
  const [busyFindingId, setBusyFindingId] = useState<string | undefined>();

  const load = useCallback(async (nextGovernanceRecordId = selectedGovernanceRecordId) => {
    if (!isAuthenticated || !workspaceId) {
      setStatus("signed_out");
      setMessage("Sign in to load canonical GovernanceIQ records for this Deal.");
      return;
    }
    if (!isOnline) {
      setStatus("offline");
      setMessage("GovernanceIQ requires a connection so BRIX can confirm canonical governance state.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const loaded = await loadGovernanceIQWorkspace(dealId, nextGovernanceRecordId);
      setData(loaded);
      setSelectedGovernanceRecordId(loaded.selectedProjection?.governanceRecordId);
      setStatus("idle");
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "BRIX could not load GovernanceIQ.");
    }
  }, [dealId, isAuthenticated, isOnline, selectedGovernanceRecordId, workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onPopState = () => setSection(governanceSectionFromFocus(new URLSearchParams(window.location.search).get("focus")));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const model = useMemo(() => buildGovernanceIQPresentation({
    dealId,
    dealName,
    mode,
    data: data ?? { projections: [], documents: [], findings: [], conflicts: [], financialPeriods: [], questions: [], propagations: [] },
  }), [data, dealId, dealName, mode]);

  async function onSelectRecord(governanceRecordId: string) {
    setSelectedGovernanceRecordId(governanceRecordId);
    await load(governanceRecordId);
  }

  async function decideFinding(finding: GovernanceFinding, acceptanceState: Extract<GovernanceAcceptanceState, "accepted" | "rejected" | "disputed">) {
    if (busyFindingId) return;
    setBusyFindingId(finding.governanceFindingId);
    setStatus("saving");
    setMessage("");
    try {
      const accepted = await setGovernanceFindingAcceptance(
        finding.governanceFindingId,
        acceptanceState,
        finding.governanceFindingVersion,
        `${labelize(acceptanceState)} from GovernanceIQ web source review.`,
      );
      if (acceptanceState === "accepted") {
        await propagateAcceptedGovernanceFinding(finding.governanceFindingId, accepted.governanceFindingVersion);
        setMessage("Finding accepted. Server-owned propagation was queued; prior valid downstream results remain visible during review.");
      } else {
        setMessage(`Finding marked ${labelize(acceptanceState)}. Canonical GovernanceIQ state will reload now.`);
      }
      await load(model.selectedProjection?.governanceRecordId);
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "BRIX could not save that GovernanceIQ decision.");
    } finally {
      setBusyFindingId(undefined);
      setStatus((current) => current === "failed" ? current : "idle");
    }
  }

  if (status === "signed_out" || status === "offline") {
    return <GovernanceIQStateCard title={status === "signed_out" ? "GovernanceIQ needs your BRIX account" : "GovernanceIQ is offline"} message={message} />;
  }

  return (
    <div className="governanceiq-workspace" role="region" aria-label="GovernanceIQ workspace">
      <section className="workspace-card wide governanceiq-hero">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">GovernanceIQ</p>
            <h4>{model.selectedProjection?.name ?? model.emptyState?.title ?? "Governance review"}</h4>
            <p className="quiet">{model.emptyState?.detail ?? `${model.stateLabel}. ${model.statusDetail}`}</p>
          </div>
          <div className="governanceiq-actions">
            <span className="status-badge">{mode === "professional" ? "Professional" : "Guided"}</span>
            <span className="status-badge warning">{model.selectedProjection?.sourceCompleteness ? labelize(model.selectedProjection.sourceCompleteness) : "Source review"}</span>
            <button className="secondary compact" type="button" onClick={() => void load()} disabled={status === "loading" || status === "saving"}>
              <RefreshCw size={14} /> Reload
            </button>
          </div>
        </div>
        {model.projections.length > 0 && (
          <div className="governanceiq-record-picker" aria-label="Governance records">
            {model.projections.map((projection) => (
              <button
                key={projection.governanceRecordId}
                className={projection.governanceRecordId === model.selectedProjection?.governanceRecordId ? "governanceiq-record-chip active" : "governanceiq-record-chip"}
                type="button"
                onClick={() => void onSelectRecord(projection.governanceRecordId)}
              >
                <span>{projection.name}</span>
                <small>{labelize(projection.governanceType)} / {labelize(projection.projectionState)}</small>
              </button>
            ))}
          </div>
        )}
        {message && <p className={status === "failed" ? "error" : "success-text"}>{message}</p>}
        {status === "loading" && <p className="quiet">Loading canonical GovernanceIQ records.</p>}
      </section>

      {model.selectedProjection ? (
        <>
          <nav className="governanceiq-tabs" role="tablist" aria-label="GovernanceIQ sections">
            {governanceIqSections.map((item) => (
              <button key={item.id} className={section === item.id ? "deal-section-tab active" : "deal-section-tab"} type="button" role="tab" aria-selected={section === item.id} onClick={() => setSection(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>
          {section === "overview" && <GovernanceIQOverview model={model} />}
          {section === "documents" && <GovernanceIQDocuments model={model} />}
          {section === "restrictions" && <GovernanceIQRestrictions model={model} />}
          {section === "financials" && <GovernanceIQFinancials model={model} />}
          {section === "conflicts" && <GovernanceIQConflicts model={model} />}
          {section === "questions" && <GovernanceIQQuestions model={model} />}
          {section === "changes" && <GovernanceIQChanges model={model} onDecide={decideFinding} busyFindingId={busyFindingId} />}
        </>
      ) : (
        <GovernanceIQStateCard title={model.emptyState?.title ?? "No GovernanceIQ record yet"} message={model.emptyState?.nextAction ?? "No governance projection is available."} />
      )}
    </div>
  );
}

function GovernanceIQOverview({ model }: { model: GovernanceIQPresentationModel }) {
  return (
    <div className="governanceiq-grid">
      <section className="workspace-card wide">
        <div className="governanceiq-summary-grid">
          {model.metrics.map((item) => (
            <article className={`governanceiq-summary-card ${item.tone}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              {item.detail && <small>{item.detail}</small>}
            </article>
          ))}
        </div>
      </section>
      <section className="workspace-card">
        <p className="eyebrow">Guided Review</p>
        <h4>Priority questions</h4>
        <div className="governanceiq-row-list">{model.guidedPriorities.map((priority) => (
          <article className="governanceiq-row compact-row" key={priority}>
            <ShieldCheck size={16} /><div><strong>{priority}</strong><span>Source-backed GovernanceIQ item</span></div>
          </article>
        ))}</div>
      </section>
      {model.mode === "professional" && (
        <section className="workspace-card">
          <p className="eyebrow">Professional Detail</p>
          <h4>Projection trace</h4>
          <div className="governanceiq-row-list">{model.professionalDetails.map((detail) => (
            <article className="governanceiq-row compact-row" key={detail}>
              <FileSearch size={16} /><div><strong>{detail}</strong><span>Read-only projection metadata</span></div>
            </article>
          ))}</div>
        </section>
      )}
    </div>
  );
}

function GovernanceIQDocuments({ model }: { model: GovernanceIQPresentationModel }) {
  return (
    <div className="governanceiq-review-grid">
      <section className="workspace-card governanceiq-source-pane">
        <p className="eyebrow">Document Hierarchy</p>
        <h4>Candidate sources</h4>
        <p className="quiet">BRIX preserves source hierarchy as candidate evidence until explicit professional or source confirmation exists.</p>
        {model.documents.length === 0 ? <p className="quiet">No governance documents are linked to this record.</p> : model.documents.map((group) => (
          <div className="governanceiq-group" key={group.groupId}>
            <h5>{group.label}</h5>
            <div className="governanceiq-row-list">
              {group.documents.map((document) => (
                <article className="governanceiq-row document-row" key={document.governanceDocumentId}>
                  <FileSearch size={16} />
                  <div>
                    <strong>{document.title}</strong>
                    <span>{hierarchyLabel(document.hierarchyClassification)} / {labelize(document.analysisState)} / {labelize(document.verificationState)}</span>
                    <small>{sourceAnchorLabel(document.sourceAnchor)} / Confidence {formatPercent(document.confidence)}</small>
                  </div>
                  <small>{document.effectiveAt ? `Effective ${document.effectiveAt}` : "Effective date unknown"}</small>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
      <section className="workspace-card governanceiq-findings-pane">
        <p className="eyebrow">Source Review</p>
        <h4>Findings by category</h4>
        <FindingGroups model={model} showActions={false} />
      </section>
    </div>
  );
}

function GovernanceIQRestrictions({ model }: { model: GovernanceIQPresentationModel }) {
  return (
    <section className="workspace-card wide">
      <p className="eyebrow">Restrictions</p>
      <h4>Use, rental, vehicle, and renovation constraints</h4>
      {model.restrictions.length === 0 ? <p className="quiet">No accepted restriction findings are available yet.</p> : (
        <div className="governanceiq-row-list">
          {model.restrictions.map((restriction) => (
            <article className={`governanceiq-row restriction-row ${restriction.state}`} key={restriction.resultHash}>
              <AlertTriangle size={16} />
              <div>
                <strong>{labelize(restriction.category)}: {restrictionStateLabel(restriction.state)}</strong>
                <span>{restriction.normalizedRestriction ?? "No normalized restriction supplied."}</span>
                <small>{restriction.conditions.length ? `Conditions: ${restriction.conditions.join("; ")}` : "No source-backed conditions"} / {restriction.exceptions.length ? `Exceptions: ${restriction.exceptions.join("; ")}` : "No source-backed exceptions"}</small>
                {String(restriction.category).includes("vehicle") || String(restriction.category).includes("pickup") ? <small>Pickup and commercial vehicle language can turn on definitions, signage, weight, garaging, and enforcement exceptions.</small> : null}
              </div>
              <b>{labelize(restriction.verificationState)}</b>
              <small>{sourceAnchorLabel(restriction.sourceAnchor)}</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function GovernanceIQFinancials({ model }: { model: GovernanceIQPresentationModel }) {
  const financial = model.financial;
  if (!financial) return <GovernanceIQStateCard title="No financial health projection" message="Upload or link budget, reserve, dues, assessment, delinquency, insurance, or debt evidence through the canonical Evidence intake." />;
  return (
    <div className="governanceiq-grid">
      <section className="workspace-card">
        <p className="eyebrow">Dues</p>
        <h4>{formatMoney(financial.duesIndicator.currentAmount)}</h4>
        <DefinitionList items={[
          { label: "Frequency", value: financial.duesIndicator.frequency ? labelize(financial.duesIndicator.frequency) : "Unknown" },
          { label: "Annualized", value: formatMoney(financial.duesIndicator.annualizedCurrentAmount) },
          { label: "Trend", value: labelize(financial.duesIndicator.trendState) },
        ]} />
      </section>
      <section className="workspace-card">
        <p className="eyebrow">Assessments</p>
        <h4>{labelize(financial.assessmentIndicator.state)}</h4>
        <DefinitionList items={[
          { label: "Current", value: formatMoney(financial.assessmentIndicator.currentAssessmentAmount) },
          { label: "Adopted", value: formatMoney(financial.assessmentIndicator.adoptedAssessmentAmount) },
          { label: "Proposed", value: formatMoney(financial.assessmentIndicator.proposedAssessmentAmount) },
        ]} />
      </section>
      <section className="workspace-card">
        <p className="eyebrow">Reserve / Delinquency</p>
        <h4>{labelize(financial.reserveIndicator.state)}</h4>
        <DefinitionList items={[
          { label: "Reserve balance", value: formatMoney(financial.reserveIndicator.reserveBalance) },
          { label: "Delinquency rate", value: formatPercent(financial.delinquencyIndicator.delinquencyRate) },
          { label: "Debt", value: formatMoney(financial.associationDebtIndicator.principalAmount) },
        ]} />
      </section>
      <section className="workspace-card">
        <p className="eyebrow">Insurance / Projects</p>
        <h4>{labelize(financial.insuranceIndicator.state)}</h4>
        <DefinitionList items={[
          { label: "Insurance expense", value: formatMoney(financial.insuranceIndicator.insuranceExpenseAmount) },
          { label: "Deductible", value: formatMoney(financial.insuranceIndicator.deductibleAmount) },
          { label: "Warnings", value: financial.warnings.length ? String(financial.warnings.length) : "None" },
        ]} />
      </section>
    </div>
  );
}

function GovernanceIQConflicts({ model }: { model: GovernanceIQPresentationModel }) {
  return (
    <section className="workspace-card wide">
      <p className="eyebrow">Conflicts</p>
      <h4>Unresolved source disagreements</h4>
      {model.conflicts.length === 0 ? <p className="quiet">No unresolved GovernanceIQ conflicts are present in the current projection.</p> : (
        <div className="governanceiq-row-list">
          {model.conflicts.map((conflict) => (
            <article className="governanceiq-row conflict-row" key={`${conflict.summary}-${sourceAnchorLabel(conflict.sourceAAnchor)}-${sourceAnchorLabel(conflict.sourceBAnchor)}`}>
              <Gavel size={16} />
              <div>
                <strong>{conflict.summary}</strong>
                <span>{findingCategoryLabel(conflict.category)} / {labelize(conflict.conflictType)} / {labelize(conflict.severity)}</span>
                <small>A: {sourceAnchorLabel(conflict.sourceAAnchor)} / B: {sourceAnchorLabel(conflict.sourceBAnchor)}</small>
                <small>Values: {compactJson(conflict.normalizedA)} versus {compactJson(conflict.normalizedB)}</small>
              </div>
              <b>{conflict.professionalReviewRecommended ? "Review" : "Open"}</b>
              <small>BRIX does not choose a legal winner.</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function GovernanceIQQuestions({ model }: { model: GovernanceIQPresentationModel }) {
  return (
    <section className="workspace-card wide">
      <p className="eyebrow">Questions / Review</p>
      <h4>Canonical follow-up questions</h4>
      {model.questions.length === 0 ? <p className="quiet">No GovernanceIQ questions are open for this record.</p> : model.questions.map((group) => (
        <div className="governanceiq-group" key={group.groupId}>
          <h5>{group.label}</h5>
          <div className="governanceiq-row-list">
            {group.questions.map((question) => (
              <article className="governanceiq-row question-row" key={question.questionId}>
                <FileSearch size={16} />
                <div>
                  <strong>{question.question}</strong>
                  <span>{question.whyItMatters}</span>
                  <small>{question.sourceReason} / {sourceAnchorLabel(question.sourceAnchor)}</small>
                </div>
                <b>{labelize(question.status)}</b>
                <small>{question.professionalReviewRecommended ? "Professional review recommended" : "Source follow-up"}</small>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function GovernanceIQChanges({ model, onDecide, busyFindingId }: { model: GovernanceIQPresentationModel; onDecide: (finding: GovernanceFinding, state: Extract<GovernanceAcceptanceState, "accepted" | "rejected" | "disputed">) => Promise<void>; busyFindingId?: string }) {
  return (
    <div className="governanceiq-grid">
      <section className="workspace-card wide">
        <p className="eyebrow">Changes / Impact</p>
        <h4>Accepted-change propagation</h4>
        {model.propagations.length === 0 ? <p className="quiet">No accepted GovernanceIQ change has been propagated yet.</p> : (
          <div className="governanceiq-row-list">
            {model.propagations.map((item) => (
              <article className="governanceiq-row propagation-row" key={item.governanceChangePropagationId}>
                <Landmark size={16} />
                <div>
                  <strong>{labelize(item.category)} / {labelize(item.propagationStatus)}</strong>
                  <span>{item.impactDomains.length ? item.impactDomains.map(labelize).join(", ") : "No downstream domain flagged"}</span>
                  <small>{item.explanations[0] ?? "Server-owned propagation state."}</small>
                </div>
                <b>{item.blockedProposalCount > 0 ? "Failed - Prior Valid Result Preserved" : item.hasPendingDownstreamReview ? "Pending review" : "Current"}</b>
                <small>{item.downstreamProposalCount} proposals / {item.blockedProposalCount} blocked</small>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="workspace-card wide">
        <p className="eyebrow">Governed decisions</p>
        <h4>Accept, reject, or dispute proposed findings</h4>
        <FindingGroups model={model} showActions onDecide={onDecide} busyFindingId={busyFindingId} />
      </section>
    </div>
  );
}

function FindingGroups({ model, showActions, onDecide, busyFindingId }: { model: GovernanceIQPresentationModel; showActions: boolean; onDecide?: (finding: GovernanceFinding, state: Extract<GovernanceAcceptanceState, "accepted" | "rejected" | "disputed">) => Promise<void>; busyFindingId?: string }) {
  if (model.findings.length === 0) return <p className="quiet">No GovernanceIQ findings are available in this projection.</p>;
  return (
    <>
      {model.findings.map((group) => (
        <div className="governanceiq-group" key={group.groupId}>
          <h5>{group.label}</h5>
          <div className="governanceiq-row-list">
            {group.findings.map((finding) => {
              const disabled = Boolean(busyFindingId);
              return (
                <article className={`governanceiq-row finding-row ${finding.severity}`} key={finding.governanceFindingId}>
                  <AlertTriangle size={16} />
                  <div>
                    <strong>{finding.summary}</strong>
                    <span>{labelize(finding.acceptanceState)} / {labelize(finding.severity)} / {labelize(finding.verificationState)}</span>
                    <small>{finding.normalizedRequirement ?? compactJson(finding.normalizedValue)}</small>
                    <small>{sourceAnchorLabel(finding.sourceAnchor)} / May affect {possibleImpactLabels(finding).join(", ")}</small>
                  </div>
                  <b>{finding.professionalReviewRecommended ? "Review" : labelize(finding.impactType)}</b>
                  {showActions && finding.acceptanceState === "proposed" ? (
                    <div className="governanceiq-decision-actions">
                      <button className="primary compact" type="button" onClick={() => void onDecide?.(finding, "accepted")} disabled={disabled}>
                        <CheckCircle2 size={14} /> Accept
                      </button>
                      <button className="secondary compact" type="button" onClick={() => void onDecide?.(finding, "disputed")} disabled={disabled}>
                        <AlertTriangle size={14} /> Dispute
                      </button>
                      <button className="danger compact" type="button" onClick={() => void onDecide?.(finding, "rejected")} disabled={disabled}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  ) : (
                    <small>{labelize(finding.sourceClassification)}</small>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

function GovernanceIQStateCard({ title, message }: { title: string; message: string }) {
  return (
    <section className="workspace-card wide governanceiq-empty">
      <p className="eyebrow">GovernanceIQ</p>
      <h4>{title}</h4>
      <p className="quiet">{message}</p>
    </section>
  );
}

function DefinitionList({ items }: { items: Array<{ label: string; value: string }> }) {
  return <div className="definition-list">{items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</div>;
}

function compactJson(value: unknown) {
  const serialized = JSON.stringify(value ?? {});
  if (!serialized || serialized === "{}") return "No normalized value";
  return serialized.length > 150 ? `${serialized.slice(0, 147)}...` : serialized;
}
