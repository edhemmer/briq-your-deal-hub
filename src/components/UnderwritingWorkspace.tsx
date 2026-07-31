import type { UnderwritingPresentationModel } from "../core/underwritingPresentation";

type UnderwritingWorkspaceProps = {
  model: UnderwritingPresentationModel;
};

export function UnderwritingWorkspace({ model }: UnderwritingWorkspaceProps) {
  if (!model.hasCanonicalUnderwriting) {
    return (
      <section className="workspace-card wide underwriting-empty" role="region" aria-labelledby="underwriting-empty-title">
        <p className="eyebrow">Underwriting</p>
        <h4 id="underwriting-empty-title">{model.emptyState?.title ?? "No underwriting record yet"}</h4>
        <p className="quiet">{model.emptyState?.detail}</p>
      </section>
    );
  }

  return (
    <div className="underwriting-workspace" role="region" aria-label="Underwriting workspace">
      <section className="workspace-card wide">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">Underwriting Summary</p>
            <h4>{model.dealName}</h4>
          </div>
          <span className="status-badge">{model.mode === "professional" ? "Professional" : "Guided"}</span>
        </div>
        <div className="underwriting-summary-grid">
          {model.summary.map((item) => (
            <article className={`underwriting-summary-card ${item.tone}`} key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              {item.detail && <small>{item.detail}</small>}
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-card">
        <p className="eyebrow">Inputs</p>
        <h4>Readiness and validation</h4>
        <div className="definition-list">
          <div><dt>Schema</dt><dd>{model.schema.schemaId ?? "Not selected"}</dd></div>
          <div><dt>Schema version</dt><dd>{model.schema.schemaVersion ?? "Not available"}</dd></div>
          <div><dt>Schema registry</dt><dd>{model.schema.schemaRegistryVersion ?? "Not available"}</dd></div>
          <div><dt>Input registry</dt><dd>{model.schema.inputRegistryVersion ?? "Not available"}</dd></div>
          <div><dt>Validation registry</dt><dd>{model.schema.validationRegistryVersion ?? "Not available"}</dd></div>
          <div><dt>Formula registry</dt><dd>{model.schema.formulaRegistryVersion ?? "Not available"}</dd></div>
          <div><dt>Readiness</dt><dd>{model.readiness.label}</dd></div>
          <div><dt>Executable</dt><dd>{model.readiness.isExecutable ? "Yes" : "No"}</dd></div>
          <div><dt>Missing</dt><dd>{String(model.readiness.missingRequiredInputCount)}</dd></div>
          <div><dt>Conflicted</dt><dd>{String(model.readiness.conflictedRequiredInputCount)}</dd></div>
        </div>
        <div className="underwriting-row-list" role="list" aria-label="Underwriting inputs">
          {model.inputs.map((input) => (
            <article className={input.needsAttention ? "underwriting-row needs-attention" : "underwriting-row"} key={input.inputId} role="listitem">
              <div>
                <strong>{input.label}</strong>
                <span>{input.requirement} / {input.sourceState}</span>
              </div>
              <b>{input.value}</b>
              <small>{input.status}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-card">
        <p className="eyebrow">Core Outputs</p>
        <h4>Authoritative result values</h4>
        {model.coreOutputGroups.length === 0 ? (
          <p className="quiet">No Core Outputs are available for the selected snapshot.</p>
        ) : (
          <div className="underwriting-output-groups">
            {model.coreOutputGroups.map((group) => (
              <article className="underwriting-output-group" key={group.id}>
                <h5>{group.label}</h5>
                {group.outputs.map((output) => (
                  <details key={output.formulaId} className="underwriting-output-row">
                    <summary>
                      <span>{output.label}</span>
                      <strong>{output.value}</strong>
                    </summary>
                    <p>{output.explanation}</p>
                    <small>{output.status} / {output.formulaId}@{output.formulaVersion}</small>
                    {output.warnings.length > 0 && <p className="warning-text">{output.warnings.join(" ")}</p>}
                    {output.assumptions.length > 0 && <p className="quiet">{output.assumptions.join(" ")}</p>}
                    {model.mode === "professional" && output.technicalReferences.length > 0 && (
                      <ul className="underwriting-technical-list">
                        {output.technicalReferences.map((reference) => <li key={reference}>{reference}</li>)}
                      </ul>
                    )}
                  </details>
                ))}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="workspace-card">
        <p className="eyebrow">Snapshots</p>
        <h4>Immutable history</h4>
        <div className="underwriting-row-list" role="list" aria-label="Underwriting snapshots">
          {model.snapshots.map((snapshot) => (
            <article className="underwriting-row" key={snapshot.snapshotId} role="listitem">
              <div>
                <strong>Snapshot {snapshot.sequence}</strong>
                <span>{snapshot.reason} / {snapshot.readiness}</span>
              </div>
              <b>{snapshot.executable ? "Executable" : "Not executable"}</b>
              <small>{snapshot.changedInputIds.length} changed inputs</small>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-card">
        <p className="eyebrow">Scenarios</p>
        <h4>Scenario comparisons</h4>
        {model.scenarios.length === 0 ? <p className="quiet">No scenario comparisons are available.</p> : (
          <div className="underwriting-row-list">
            {model.scenarios.map((scenario) => (
              <article className="underwriting-row scenario" key={scenario.scenarioId}>
                <div>
                  <strong>{scenario.name}</strong>
                  <span>{scenario.type} / {scenario.readiness}</span>
                </div>
                <b>{scenario.changedOutputCount} changed outputs</b>
                <small>{scenario.status}</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="workspace-card">
        <p className="eyebrow">Sensitivity</p>
        <h4>Tested variables</h4>
        {model.sensitivities.length === 0 ? <p className="quiet">No sensitivity results are available.</p> : (
          <div className="underwriting-row-list">
            {model.sensitivities.map((sensitivity) => (
              <article className="underwriting-row scenario" key={sensitivity.sensitivityId}>
                <div>
                  <strong>{sensitivity.inputLabel}</strong>
                  <span>{sensitivity.pointCount} tested point{sensitivity.pointCount === 1 ? "" : "s"}</span>
                </div>
                <b>{sensitivity.status}</b>
                <small>{sensitivity.targetFormulaIds.length} outputs</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="workspace-card wide">
        <p className="eyebrow">Sources and Assumptions</p>
        <h4>Traceability</h4>
        <div className="underwriting-summary-grid compact">
          <article className="underwriting-summary-card neutral"><span>Sources</span><strong>{model.sourcesAndAssumptions.sourceCount}</strong></article>
          <article className="underwriting-summary-card neutral"><span>Assumptions</span><strong>{model.sourcesAndAssumptions.assumptionCount}</strong></article>
          <article className="underwriting-summary-card neutral"><span>Warnings</span><strong>{model.sourcesAndAssumptions.warningCount}</strong></article>
        </div>
        {model.sourcesAndAssumptions.provenance.length > 0 && (
          <div className="underwriting-row-list" role="list" aria-label="Underwriting source provenance">
            {model.sourcesAndAssumptions.provenance.slice(0, model.mode === "professional" ? 20 : 6).map((source, index) => (
              <article className="underwriting-row" key={`${source.inputId}-${source.sourceFactId ?? source.evidenceId ?? index}`} role="listitem">
                <div>
                  <strong>{source.inputLabel}</strong>
                  <span>{source.verificationState ?? "Source recorded"}</span>
                </div>
                <b>{source.sourceFactId ?? source.sourceRecordId ?? "Evidence"}</b>
                <small>{source.evidenceId ?? ""}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
