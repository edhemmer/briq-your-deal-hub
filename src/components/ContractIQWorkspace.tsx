import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileSearch,
  GitBranch,
  Landmark,
  RefreshCw,
  Scale,
  Send,
  ShieldCheck,
} from "lucide-react";
import type { ContractPerspective } from "../core/contractIQ";
import {
  loadContractIQWorkspace,
  propagateAcceptedContractChange,
  type ContractDetailRow,
  type ContractIQWorkspaceData,
  type ContractPerspectiveAnalysisItem,
} from "../core/contractIQClient";
import {
  analysisStateLabel,
  availablePerspectives,
  buildContractIQPresentation,
  compactJson,
  contractIqSections,
  contractSectionFromFocus,
  formatDateTime,
  formatMoney,
  labelize,
  perspectiveLabel,
  sourceAnchorLabel,
  targetDomainLabel,
  type ContractIQPresentationModel,
  type ContractIQSectionId,
} from "../core/contractIQPresentation";
import type { PresentationMode } from "../core/presentationMode";

type ContractIQWorkspaceProps = {
  dealId: string;
  dealName: string;
  workspaceId?: string;
  isAuthenticated: boolean;
  isOnline: boolean;
  mode: PresentationMode;
};

type WorkspaceStatus = "idle" | "loading" | "saving" | "failed" | "offline" | "signed_out";

export function ContractIQWorkspace({ dealId, dealName, workspaceId, isAuthenticated, isOnline, mode }: ContractIQWorkspaceProps) {
  const [data, setData] = useState<ContractIQWorkspaceData | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | undefined>();
  const [perspective, setPerspective] = useState<ContractPerspective>("buyer");
  const [section, setSection] = useState<ContractIQSectionId>(() => contractSectionFromFocus(new URLSearchParams(window.location.search).get("focus")));
  const [status, setStatus] = useState<WorkspaceStatus>("loading");
  const [message, setMessage] = useState("");
  const [selectedSource, setSelectedSource] = useState<ContractDetailRow | ContractPerspectiveAnalysisItem | null>(null);
  const [busyProposalId, setBusyProposalId] = useState<string | undefined>();

  const load = useCallback(async (nextContractId = selectedContractId) => {
    if (!isAuthenticated || !workspaceId) {
      setStatus("signed_out");
      setMessage("Sign in to load canonical ContractIQ records for this Deal.");
      return;
    }
    if (!isOnline) {
      setStatus("offline");
      setMessage("ContractIQ requires a connection so BRIX can confirm canonical contract state.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const loaded = await loadContractIQWorkspace(dealId, nextContractId);
      setData(loaded);
      setSelectedContractId(loaded.selectedProjection?.contractId);
      setPerspective((current) => loaded.selectedProjection?.perspective ?? current);
      setSelectedSource(loaded.detail.record ? detailToSourceRow(loaded.detail.record) : loaded.detail.evidenceLinks[0] ?? null);
      setStatus("idle");
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "BRIX could not load ContractIQ.");
    }
  }, [dealId, isAuthenticated, isOnline, selectedContractId, workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onPopState = () => setSection(contractSectionFromFocus(new URLSearchParams(window.location.search).get("focus")));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const model = useMemo(() => buildContractIQPresentation({
    dealId,
    dealName,
    mode,
    perspective,
    data: data ?? { projections: [], detail: emptyWorkspaceDetail(), perspectiveItems: [], deadlineResults: [], amendmentImpacts: [], propagations: [] },
  }), [data, dealId, dealName, mode, perspective]);

  async function onSelectContract(contractId: string) {
    setSelectedContractId(contractId);
    await load(contractId);
  }

  async function propagateProposal(proposal: ContractDetailRow) {
    if (busyProposalId || !model.selectedProjection) return;
    setBusyProposalId(proposal.recordId);
    setStatus("saving");
    setMessage("");
    try {
      const result = await propagateAcceptedContractChange(proposal.recordId, model.selectedProjection.contractVersion, {
        source: "contractiq_web_experience",
        perspective,
      });
      setMessage(`Accepted change propagated to ${targetDomainLabel(result.targetDomain)}. Downstream owner review remains canonical.`);
      await load(model.selectedProjection.contractId);
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "BRIX could not propagate that ContractIQ change.");
    } finally {
      setBusyProposalId(undefined);
      setStatus((current) => current === "failed" ? current : "idle");
    }
  }

  if (status === "signed_out" || status === "offline") {
    return <ContractIQStateCard title={status === "signed_out" ? "ContractIQ needs your BRIX account" : "ContractIQ is offline"} message={message} />;
  }

  return (
    <div className="contractiq-workspace" role="region" aria-label="ContractIQ workspace">
      <section className="workspace-card wide contractiq-hero">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">ContractIQ</p>
            <h4>{model.selectedProjection?.title ?? model.emptyState?.title ?? "Contract review"}</h4>
            <p className="quiet">{model.emptyState?.detail ?? `${model.stateLabel}. ${model.statusDetail}`}</p>
          </div>
          <div className="contractiq-actions">
            <a className="secondary compact" href={`/deals/${encodeURIComponent(dealId)}`}>
              <ArrowLeft size={14} /> Cockpit
            </a>
            <span className="status-badge">{mode === "professional" ? "Professional" : "Guided"}</span>
            <span className="status-badge warning">{perspectiveLabel(perspective)} view</span>
            <button className="secondary compact" type="button" onClick={() => void load()} disabled={status === "loading" || status === "saving"}>
              <RefreshCw size={14} /> Reload
            </button>
          </div>
        </div>
        {model.projections.length > 0 && (
          <div className="contractiq-contract-picker" aria-label="Contract records">
            {model.projections.map((projection) => (
              <button
                key={projection.contractId}
                className={projection.contractId === model.selectedProjection?.contractId ? "contractiq-contract-chip active" : "contractiq-contract-chip"}
                type="button"
                onClick={() => void onSelectContract(projection.contractId)}
              >
                <span>{projection.title}</span>
                <small>{labelize(projection.contractType)} / {analysisStateLabel(projection.projectionState)}</small>
              </button>
            ))}
          </div>
        )}
        <div className="contractiq-perspective-strip">
          <label htmlFor="contractiq-perspective">Perspective</label>
          <select id="contractiq-perspective" value={perspective} onChange={(event) => setPerspective(event.target.value as ContractPerspective)}>
            {availablePerspectives().map((item) => <option key={item} value={item}>{perspectiveLabel(item)}</option>)}
          </select>
          <small>Perspective changes interpretation and questions. It does not rewrite source facts.</small>
        </div>
        {message && <p className={status === "failed" ? "error" : "success-text"}>{message}</p>}
        {status === "loading" && <p className="quiet">Loading canonical ContractIQ records.</p>}
      </section>

      {model.selectedProjection ? (
        <>
          <nav className="contractiq-tabs" role="tablist" aria-label="ContractIQ sections">
            {contractIqSections.map((item) => (
              <button key={item.id} className={section === item.id ? "deal-section-tab active" : "deal-section-tab"} type="button" role="tab" aria-selected={section === item.id} onClick={() => setSection(item.id)}>
                {item.label}
              </button>
            ))}
          </nav>
          {section === "overview" && <ContractIQOverview model={model} />}
          {section === "documents" && <ContractIQDocuments model={model} selectedSource={selectedSource} onSelectSource={setSelectedSource} />}
          {section === "parties_money" && <ContractIQPartiesMoney model={model} onSelectSource={setSelectedSource} />}
          {section === "deadlines" && <ContractIQDeadlines model={model} onSelectSource={setSelectedSource} />}
          {section === "contingencies" && <ContractIQContingencies model={model} onSelectSource={setSelectedSource} />}
          {section === "risks" && <ContractIQRisks model={model} onSelectSource={setSelectedSource} />}
          {section === "amendments" && <ContractIQAmendments model={model} onSelectSource={setSelectedSource} />}
          {section === "questions" && <ContractIQQuestions model={model} onSelectSource={setSelectedSource} />}
          {section === "changes" && <ContractIQChanges model={model} onPropagate={propagateProposal} busyProposalId={busyProposalId} onSelectSource={setSelectedSource} />}
        </>
      ) : (
        <ContractIQStateCard title={model.emptyState?.title ?? "No ContractIQ record yet"} message={model.emptyState?.nextAction ?? "No contract projection is available."} />
      )}
    </div>
  );
}

function ContractIQOverview({ model }: { model: ContractIQPresentationModel }) {
  return (
    <div className="contractiq-grid">
      <section className="workspace-card wide">
        <div className="contractiq-summary-grid">
          {model.metrics.map((item) => (
            <article className={`contractiq-summary-card ${item.tone}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              {item.detail && <small>{item.detail}</small>}
            </article>
          ))}
        </div>
      </section>
      <section className="workspace-card">
        <p className="eyebrow">Guided Review</p>
        <h4>Priority checks</h4>
        <div className="contractiq-row-list">
          {model.guidedPriorities.map((priority) => (
            <article className="contractiq-row compact-row" key={priority}>
              <ShieldCheck size={16} />
              <div><strong>{priority}</strong><span>Source-backed ContractIQ review item</span></div>
            </article>
          ))}
        </div>
      </section>
      {model.mode === "professional" && (
        <section className="workspace-card">
          <p className="eyebrow">Professional Detail</p>
          <h4>Projection trace</h4>
          <div className="contractiq-row-list">
            {model.professionalDetails.map((detail) => (
              <article className="contractiq-row compact-row" key={detail}>
                <FileSearch size={16} />
                <div><strong>{detail}</strong><span>Read-only ContractIQ metadata</span></div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ContractIQDocuments({ model, selectedSource, onSelectSource }: { model: ContractIQPresentationModel; selectedSource: ContractDetailRow | ContractPerspectiveAnalysisItem | null; onSelectSource: (source: ContractDetailRow | ContractPerspectiveAnalysisItem) => void }) {
  return (
    <div className="contractiq-review-grid">
      <section className="workspace-card contractiq-source-list">
        <p className="eyebrow">Documents</p>
        <h4>Source inventory</h4>
        <p className="quiet">ContractIQ uses immutable Evidence records and source anchors. It does not store or expose raw document text in this workspace.</p>
        {model.sourceRows.length === 0 ? <p className="quiet">No contract Evidence is linked to this record.</p> : (
          <div className="contractiq-row-list">
            {model.sourceRows.map((source) => (
              <article className="contractiq-row document-row" key={`${source.recordType}-${source.recordId}`}>
                <FileSearch size={16} />
                <div>
                  <strong>{source.label}</strong>
                  <span>{labelize(source.recordType)} / {labelize(source.status)} / {labelize(source.verificationState)}</span>
                  <small>{sourceAnchorLabel(source.sourceAnchor)}</small>
                </div>
                <button className="secondary compact" type="button" onClick={() => onSelectSource(source)}>Source anchor</button>
              </article>
            ))}
          </div>
        )}
      </section>
      <SourceReviewPane source={selectedSource} />
    </div>
  );
}

function ContractIQPartiesMoney({ model, onSelectSource }: { model: ContractIQPresentationModel; onSelectSource: (source: ContractDetailRow) => void }) {
  return (
    <div className="contractiq-grid">
      <section className="workspace-card">
        <p className="eyebrow">Parties</p>
        <h4>People and roles</h4>
        <RecordList rows={model.parties} empty="No parties are available in the current projection." icon="party" onSelectSource={onSelectSource} />
      </section>
      <section className="workspace-card">
        <p className="eyebrow">Money</p>
        <h4>Economic terms</h4>
        <RecordList rows={model.moneyTerms} empty="No source-linked money terms are available yet." icon="money" onSelectSource={onSelectSource} />
      </section>
    </div>
  );
}

function ContractIQDeadlines({ model, onSelectSource }: { model: ContractIQPresentationModel; onSelectSource: (source: ContractDetailRow) => void }) {
  return (
    <div className="contractiq-grid">
      <section className="workspace-card wide">
        <p className="eyebrow">Deadlines</p>
        <h4>Deterministic contract deadline results</h4>
        <p className="quiet">Dates shown here are backend-owned ContractIQ results linked to the canonical task/deadline system when accepted.</p>
        {model.deadlineResults.length === 0 ? <RecordList rows={model.deadlines} empty="No deadline results are available yet." icon="deadline" onSelectSource={onSelectSource} /> : (
          <div className="contractiq-row-list">
            {model.deadlineResults.map((deadline) => (
              <article className={`contractiq-row deadline-row ${deadline.status}`} key={deadline.calculationId}>
                <AlertTriangle size={16} />
                <div>
                  <strong>{formatDateTime(deadline.dueAt)}</strong>
                  <span>{labelize(deadline.status)} / {labelize(deadline.triggerVerification)} / {deadline.timezone}</span>
                  <small>{deadline.offsetValue ?? "No"} {deadline.offsetUnit ? labelize(deadline.offsetUnit) : "offset"} / {deadline.countingRule ? labelize(deadline.countingRule) : "Counting rule unavailable"}</small>
                  {deadline.staleReason && <small>{deadline.staleReason}</small>}
                </div>
                <b>{deadline.warnings.length ? `${deadline.warnings.length} warnings` : "Source-linked"}</b>
                <small>{sourceAnchorLabel(deadline.sourceAnchor)}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ContractIQContingencies({ model, onSelectSource }: { model: ContractIQPresentationModel; onSelectSource: (source: ContractDetailRow) => void }) {
  return (
    <section className="workspace-card wide">
      <p className="eyebrow">Contingencies</p>
      <h4>Inspection, financing, appraisal, title, and review items</h4>
      <RecordList rows={model.contingencies} empty="No contingency terms are available in the current projection." icon="deadline" onSelectSource={onSelectSource} />
    </section>
  );
}

function ContractIQRisks({ model, onSelectSource }: { model: ContractIQPresentationModel; onSelectSource: (source: ContractPerspectiveAnalysisItem) => void }) {
  return (
    <section className="workspace-card wide">
      <p className="eyebrow">Risks / Analysis</p>
      <h4>{perspectiveLabel(model.perspective)} interpretation</h4>
      <p className="quiet">ContractIQ separates facts, risks, missing information, and questions. It does not provide legal advice or choose a legal outcome.</p>
      {model.perspectiveGroups.length === 0 ? <p className="quiet">No perspective analysis is available for this perspective yet.</p> : model.perspectiveGroups.map((group) => (
        <div className="contractiq-group" key={group.groupId}>
          <h5>{group.label}</h5>
          <div className="contractiq-row-list">
            {group.items.map((item) => (
              <article className={`contractiq-row finding-row ${item.severity ?? "unknown"}`} key={item.itemId}>
                <Scale size={16} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{labelize(item.category)} / {labelize(item.severity)} / {labelize(item.status)}</span>
                  <small>{item.summary}</small>
                </div>
                <b>{item.professionalReviewRequired ? "Review" : "Current"}</b>
                <button className="secondary compact" type="button" onClick={() => onSelectSource(item)}>Source refs</button>
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function ContractIQAmendments({ model, onSelectSource }: { model: ContractIQPresentationModel; onSelectSource: (source: ContractDetailRow) => void }) {
  return (
    <div className="contractiq-grid">
      <section className="workspace-card">
        <p className="eyebrow">Amendments</p>
        <h4>Relationships and hierarchy</h4>
        <RecordList rows={model.relationships} empty="No contract amendment or supersession relationship is available." icon="relationship" onSelectSource={onSelectSource} />
      </section>
      <section className="workspace-card">
        <p className="eyebrow">Conflicts</p>
        <h4>Source disagreements</h4>
        <RecordList rows={model.conflicts} empty="No unresolved contract conflicts are present." icon="conflict" onSelectSource={onSelectSource} />
      </section>
      <section className="workspace-card wide">
        <p className="eyebrow">Before / After</p>
        <h4>Backend amendment impact candidates</h4>
        {model.amendmentImpacts.length === 0 ? <p className="quiet">No amendment impact result is available yet.</p> : (
          <div className="contractiq-row-list">
            {model.amendmentImpacts.map((impact) => (
              <article className={`contractiq-row amendment-row ${impact.status}`} key={impact.impactId}>
                <GitBranch size={16} />
                <div>
                  <strong>{impact.impactSummary}</strong>
                  <span>{labelize(impact.impactType)} / {labelize(impact.status)}</span>
                  <small>{impact.changedTermIds.length} changed terms / {impact.addedTermIds.length} added terms / {impact.changedDeadlineIds.length} changed deadlines / {impact.conflictIds.length} conflicts</small>
                </div>
                <b>{impact.professionalReviewRequired ? "Review" : "Current"}</b>
                <small>{impact.deterministicHash || "Hash unavailable"}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ContractIQQuestions({ model, onSelectSource }: { model: ContractIQPresentationModel; onSelectSource: (source: ContractDetailRow | ContractPerspectiveAnalysisItem) => void }) {
  return (
    <div className="contractiq-grid">
      <section className="workspace-card wide">
        <p className="eyebrow">Questions / Review</p>
        <h4>Source follow-up queue</h4>
        {model.questions.length === 0 ? <p className="quiet">No ContractIQ questions are open for this contract.</p> : model.questions.map((group) => (
          <div className="contractiq-group" key={group.groupId}>
            <h5>{group.label}</h5>
            <div className="contractiq-row-list">
              {group.questions.map((question) => (
                <article className="contractiq-row question-row" key={questionKey(question)}>
                  <FileSearch size={16} />
                  <div>
                    <strong>{questionTitle(question)}</strong>
                    <span>{questionSummary(question)}</span>
                    <small>{sourceLabelForQuestion(question)}</small>
                  </div>
                  <b>{questionReviewLabel(question)}</b>
                  <button className="secondary compact" type="button" onClick={() => onSelectSource(question)}>Source refs</button>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
      <section className="workspace-card wide">
        <p className="eyebrow">Negotiation Concepts</p>
        <h4>Discussion drafts</h4>
        {model.negotiationConcepts.length === 0 ? <p className="quiet">No negotiation concepts are available for this perspective.</p> : (
          <div className="contractiq-row-list">
            {model.negotiationConcepts.map((item) => (
              <article className="contractiq-row negotiation-row" key={item.itemId}>
                <Scale size={16} />
                <div>
                  <strong>{item.title}</strong>
                  <span>DISCUSSION DRAFT / FOR LICENSED PROFESSIONAL REVIEW</span>
                  <small>{item.summary || compactJson(item.payload)}</small>
                </div>
                <b>{labelize(item.status)}</b>
                <button className="secondary compact" type="button" onClick={() => onSelectSource(item)}>Source refs</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ContractIQChanges({ model, onPropagate, busyProposalId, onSelectSource }: { model: ContractIQPresentationModel; onPropagate: (proposal: ContractDetailRow) => Promise<void>; busyProposalId?: string; onSelectSource: (source: ContractDetailRow) => void }) {
  return (
    <div className="contractiq-grid">
      <section className="workspace-card wide">
        <p className="eyebrow">Connected Deal Impact</p>
        <h4>Accepted-change propagation</h4>
        {model.propagations.length === 0 ? <p className="quiet">No accepted ContractIQ change has been propagated yet.</p> : (
          <div className="contractiq-row-list">
            {model.propagations.map((item) => (
              <article className={`contractiq-row propagation-row ${item.propagationStatus}`} key={item.contractChangePropagationId}>
                <Landmark size={16} />
                <div>
                  <strong>{targetDomainLabel(item.targetDomain)} / {labelize(item.propagationStatus)}</strong>
                  <span>{item.affectedDomains.length ? item.affectedDomains.map(targetDomainLabel).join(", ") : "No downstream domain flagged"}</span>
                  <small>Underwriting {labelize(item.underwritingStatus)} / Strategy {labelize(item.strategyStatus)} / FinanceIQ {labelize(item.financeStatus)} / Tasks {labelize(item.deadlineTaskStatus)} / Cockpit {labelize(item.cockpitStatus)}</small>
                </div>
                <b>{item.failedDownstreamCount > 0 ? "Failed - Prior Valid Result Preserved" : "Owner review"}</b>
                <small>{item.downstreamProposalCount} proposals / {item.retryCount} retries</small>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="workspace-card wide">
        <p className="eyebrow">Change Proposals</p>
        <h4>Backend-supported actions</h4>
        {model.changeProposals.length === 0 ? <p className="quiet">No ContractIQ change proposal is available.</p> : (
          <div className="contractiq-row-list">
            {model.changeProposals.map((proposal) => {
              const canPropagate = proposal.status === "accepted";
              return (
                <article className={`contractiq-row change-row ${proposal.status}`} key={proposal.recordId}>
                  <Send size={16} />
                  <div>
                    <strong>{proposal.label}</strong>
                    <span>{labelize(proposal.status)} / {targetDomainLabel(String(proposal.payload.target_domain ?? proposal.payload.targetDomain ?? "none"))}</span>
                    <small>{compactJson(proposal.payload.normalized_value ?? proposal.payload.normalizedValue)} / {sourceAnchorLabel(proposal.sourceAnchor)}</small>
                  </div>
                  <button className="secondary compact" type="button" onClick={() => onSelectSource(proposal)}>Source anchor</button>
                  <button className="primary compact" type="button" disabled={!canPropagate || Boolean(busyProposalId)} onClick={() => void onPropagate(proposal)}>
                    {busyProposalId === proposal.recordId ? "Propagating" : "Propagate accepted change"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function RecordList({ rows, empty, icon, onSelectSource }: { rows: ContractDetailRow[]; empty: string; icon: "party" | "money" | "deadline" | "relationship" | "conflict"; onSelectSource: (source: ContractDetailRow) => void }) {
  if (rows.length === 0) return <p className="quiet">{empty}</p>;
  const Icon = icon === "party" ? ShieldCheck : icon === "money" ? Landmark : icon === "relationship" ? GitBranch : icon === "conflict" ? AlertTriangle : CheckCircle2;
  return (
    <div className="contractiq-row-list">
      {rows.map((row) => (
        <article className={`contractiq-row ${row.recordType}-row ${row.status}`} key={`${row.recordType}-${row.recordId}`}>
          <Icon size={16} />
          <div>
            <strong>{row.label}</strong>
            <span>{labelize(row.status)} / {labelize(row.verificationState)}</span>
            <small>{recordValue(row)} / {sourceAnchorLabel(row.sourceAnchor)}</small>
          </div>
          <b>{row.sourceEvidenceId ? "Source-linked" : "Source pending"}</b>
          <button className="secondary compact" type="button" onClick={() => onSelectSource(row)}>Source anchor</button>
        </article>
      ))}
    </div>
  );
}

function SourceReviewPane({ source }: { source: ContractDetailRow | ContractPerspectiveAnalysisItem | null }) {
  if (!source) return <ContractIQStateCard title="No source selected" message="Select a source anchor to review canonical reference metadata." />;
  const isPerspective = "itemId" in source;
  return (
    <section className="workspace-card contractiq-source-pane" aria-label="Selected source anchor">
      <p className="eyebrow">Source Review</p>
      <h4>{isPerspective ? source.title : source.label}</h4>
      <DefinitionList items={[
        { label: "Record", value: isPerspective ? labelize(source.itemKind) : labelize(source.recordType) },
        { label: "State", value: isPerspective ? labelize(source.status) : labelize(source.status) },
        { label: "Version", value: String(isPerspective ? source.itemVersion : source.recordVersion) },
        { label: "Evidence", value: isPerspective ? source.sourceRefs.length ? `${source.sourceRefs.length} source refs` : "Source refs unavailable" : source.sourceEvidenceId ?? "Evidence id unavailable" },
        { label: "Anchor", value: isPerspective ? compactJson(source.sourceRefs[0]) : sourceAnchorLabel(source.sourceAnchor) },
        { label: "Payload", value: isPerspective ? compactJson(source.payload) : compactJson(source.payload) },
      ]} />
      <p className="quiet">Use the canonical Evidence record for original document review. ContractIQ only presents source anchors and derived records here.</p>
    </section>
  );
}

function ContractIQStateCard({ title, message }: { title: string; message: string }) {
  return (
    <section className="workspace-card wide contractiq-empty">
      <p className="eyebrow">ContractIQ</p>
      <h4>{title}</h4>
      <p className="quiet">{message}</p>
    </section>
  );
}

function DefinitionList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="definition-list">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function detailToSourceRow(record: NonNullable<ContractIQWorkspaceData["detail"]["record"]>): ContractDetailRow {
  return {
    recordType: "contract",
    recordId: record.contractId,
    recordVersion: record.contractVersion,
    workspaceId: record.workspaceId,
    contractId: record.contractId,
    dealId: record.dealId,
    propertyId: record.propertyId,
    label: record.title,
    status: record.status,
    verificationState: record.verificationState,
    sourceEvidenceId: record.sourceEvidenceId,
    sourceAnchor: record.sourceAnchor,
    payload: {
      contract_type: record.contractType,
      perspective: record.perspective,
      analysis_state: record.analysisState,
      confidence: record.confidence,
      effective_date: record.effectiveDate,
      execution_date: record.executionDate,
      expiration_date: record.expirationDate,
      closing_date: record.closingDate,
    },
    updatedAt: record.updatedAt,
  };
}

function emptyWorkspaceDetail(): ContractIQWorkspaceData["detail"] {
  return { evidenceLinks: [], parties: [], terms: [], deadlines: [], findings: [], conflicts: [], relationships: [], changeProposals: [], questions: [] };
}

function recordValue(row: ContractDetailRow) {
  const currency = typeof row.payload.currency === "string" ? row.payload.currency : "USD";
  if (row.payload.amount != null) return formatMoney(row.payload.amount, currency);
  if (row.payload.display_value) return String(row.payload.display_value);
  if (row.payload.normalized_value) return compactJson(row.payload.normalized_value);
  if (row.payload.due_at) return formatDateTime(String(row.payload.due_at));
  if (row.payload.deadline_type) return labelize(String(row.payload.deadline_type));
  return compactJson(row.payload);
}

function questionKey(question: ContractDetailRow | ContractPerspectiveAnalysisItem) {
  return "itemId" in question ? question.itemId : question.recordId;
}

function questionTitle(question: ContractDetailRow | ContractPerspectiveAnalysisItem) {
  if ("itemId" in question) return question.title;
  return String(question.payload.question ?? question.label);
}

function questionSummary(question: ContractDetailRow | ContractPerspectiveAnalysisItem) {
  if ("itemId" in question) return question.summary || compactJson(question.payload);
  return String(question.payload.rationale ?? question.payload.why_it_matters ?? "Source follow-up requested.");
}

function sourceLabelForQuestion(question: ContractDetailRow | ContractPerspectiveAnalysisItem) {
  if ("itemId" in question) return question.sourceRefs.length ? `${question.sourceRefs.length} source refs` : "Source refs unavailable";
  return sourceAnchorLabel(question.sourceAnchor);
}

function questionReviewLabel(question: ContractDetailRow | ContractPerspectiveAnalysisItem) {
  if ("itemId" in question) return question.professionalReviewRequired ? "Review" : labelize(question.status);
  return String(question.payload.professional_review_recommended) === "true" ? "Review" : labelize(question.status);
}
