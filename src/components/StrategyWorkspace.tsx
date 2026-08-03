import type { StrategyPresentationModel, StrategyRankedRowProjection } from "../core/strategyPresentation";

type StrategyWorkspaceProps = {
  model: StrategyPresentationModel;
};

export function StrategyWorkspace({ model }: StrategyWorkspaceProps) {
  if (!model.hasCanonicalStrategyResults) {
    return (
      <section className="workspace-card wide strategy-empty" role="region" aria-labelledby="strategy-empty-title">
        <p className="eyebrow">Strategy Intelligence</p>
        <h4 id="strategy-empty-title">{model.emptyState?.title ?? "No Strategy Intelligence result yet"}</h4>
        <p className="quiet">{model.emptyState?.detail}</p>
      </section>
    );
  }

  return (
    <div className="strategy-workspace" role="region" aria-label="Strategy Intelligence workspace">
      <section className="workspace-card wide">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">Strategy Intelligence</p>
            <h4>{model.dealName}</h4>
            <p className="quiet">System ranking and your intended strategy are separate. Confidence describes evidence quality, not probability of success.</p>
          </div>
          <span className="status-badge">{model.mode === "professional" ? "Professional" : "Guided"}</span>
        </div>
        {model.overview.staleWarning && <p className="warning-text" role="status">{model.overview.staleWarning}</p>}
        <div className="strategy-summary-grid" aria-label="Strategy result overview">
          <Metric label="Candidates" value={displayNullable(model.overview.candidateCount)} />
          <Metric label="Compatible" value={displayNullable(model.overview.compatibleCount)} />
          <Metric label="With conditions" value={displayNullable(model.overview.compatibleWithConditionsCount)} />
          <Metric label="Uncertain" value={displayNullable(model.overview.uncertainCount)} />
          <Metric label="Incompatible" value={displayNullable(model.overview.incompatibleCount)} />
          <Metric label="Missing" value={displayNullable(model.overview.missingDependencyCount)} />
        </div>
        <div className="strategy-overview-pair">
          <article>
            <span>System top-ranked viable strategy</span>
            <strong>{model.overview.topRankedViable?.displayName ?? "Unavailable"}</strong>
            <small>{model.overview.topRankedViable?.rank ? `Canonical rank ${model.overview.topRankedViable.rank}` : "No scored viable strategy"}</small>
          </article>
          <article>
            <span>User-selected strategy</span>
            <strong>{model.overview.userSelected?.displayName ?? "Not selected"}</strong>
            <small>{model.overview.userSelectionMatchesSystemRank === null ? "No preference recorded" : model.overview.userSelectionMatchesSystemRank ? "Same as system rank" : "Different from system rank"}</small>
          </article>
        </div>
      </section>

      <section className="workspace-card wide">
        <p className="eyebrow">Ranked Strategies</p>
        <h4>Canonical ranking</h4>
        <div className="strategy-ranked-list" role="list" aria-label="Canonical strategy ranking">
          {model.rankedStrategies.map((row) => <StrategyRankedCard key={row.scoreResultId} row={row} mode={model.mode} />)}
        </div>
      </section>

      {model.selectedStrategy && (
        <section className="workspace-card wide">
          <p className="eyebrow">Strategy Detail</p>
          <h4>{model.selectedStrategy.displayName}</h4>
          <div className="strategy-detail-grid">
            <DefinitionBlock title="Identity" rows={[
              ["Strategy ID", model.selectedStrategy.identity.strategyId],
              ["Version", model.selectedStrategy.identity.strategyVersion],
              ["Registry", model.selectedStrategy.identity.registryVersion],
              ["Support", humanize(model.selectedStrategy.identity.supportStatus)],
            ]} />
            <DefinitionBlock title="Compatibility" rows={[
              ["Status", humanize(model.selectedStrategy.compatibilityStatus)],
              ["Hard disqualifiers", String(model.selectedStrategy.hardDisqualifierCount)],
              ["Conditions", String(model.selectedStrategy.conditions.length)],
              ["Professional review", String(model.selectedStrategy.professionalReviewCount)],
            ]} />
          </div>
          {model.selectedStrategy.hardDisqualifiers.length > 0 && (
            <div className="strategy-alert-list" aria-label="Hard disqualifiers">
              {model.selectedStrategy.hardDisqualifiers.map((item) => <p className="strategy-alert blocking" key={item}>{item}</p>)}
            </div>
          )}
          <div className="strategy-dimension-grid">
            {model.selectedStrategy.dimensionScores.map((dimension) => (
              <article className="strategy-dimension" key={dimension.categoryId}>
                <span>{dimension.label}</span>
                <strong>{dimension.normalizedScore}/100</strong>
                <small>{dimension.explanation}</small>
              </article>
            ))}
          </div>
          {model.mode === "professional" && (
            <details className="strategy-professional-detail">
              <summary>Versions, weights, and contributions</summary>
              <div className="strategy-comparison-scroll">
                <table className="strategy-table">
                  <thead><tr><th>Dimension</th><th>Weight</th><th>Contribution</th><th>Explanation</th></tr></thead>
                  <tbody>
                    {model.selectedStrategy.weights.map((weight) => {
                      const contribution = model.selectedStrategy?.weightedContributions.find((item) => item.categoryId === weight.categoryId);
                      return (
                        <tr key={weight.categoryId}>
                          <th scope="row">{humanize(weight.categoryId)}</th>
                          <td>{weight.weightPercent}%</td>
                          <td>{contribution ? contribution.weightedContributionBasis : "Unavailable"}</td>
                          <td>{weight.explanation}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="quiet">{model.selectedStrategy.versionReferences.slice(0, 12).join(" / ")}</p>
            </details>
          )}
        </section>
      )}

      <section className="workspace-card wide">
        <p className="eyebrow">Compare</p>
        <h4>Side-by-side strategy review</h4>
        <div className="strategy-comparison-scroll">
          <table className="strategy-table">
            <caption>Canonical comparison. No additional comparison score is calculated here.</caption>
            <thead>
              <tr>
                <th scope="col">Field</th>
                {model.comparison.columns.map((column) => <th scope="col" key={column.strategyId}>{column.displayName}</th>)}
              </tr>
            </thead>
            <tbody>
              {model.comparison.rows.map((row) => (
                <tr key={row.rowId}>
                  <th scope="row">{row.label}</th>
                  {row.values.map((value) => <td key={`${row.rowId}-${value.strategyId}`}><span>{value.value}</span><small>{humanize(value.state)}</small></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="workspace-card">
        <p className="eyebrow">Evidence and Constraints</p>
        <h4>What controls the result</h4>
        {model.selectedStrategy?.explanation?.sections.map((section) => (
          <details className="strategy-explanation" key={section.sectionId}>
            <summary>{section.title} / {humanize(section.status)}</summary>
            <ul>
              {section.items.map((item) => <li key={item.itemId}>{item.text}</li>)}
            </ul>
          </details>
        ))}
      </section>

      <section className="workspace-card">
        <p className="eyebrow">History</p>
        <h4>Immutable strategy results</h4>
        {model.history.length === 0 ? <p className="quiet">No historical strategy results are available.</p> : (
          <div className="underwriting-row-list" role="list" aria-label="Strategy history">
            {model.history.map((item) => (
              <article className="underwriting-row" key={item.resultId} role="listitem">
                <div>
                  <strong>{item.displayName}</strong>
                  <span>{humanize(item.freshnessState)} / {item.hash.slice(0, 12)}</span>
                </div>
                <b>{item.rank ? `Rank ${item.rank}` : "Unranked"}</b>
                <small>{item.score === null ? "Unscored" : `${item.score}/100`}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StrategyRankedCard({ row, mode }: { row: StrategyRankedRowProjection; mode: "guided" | "professional" }) {
  return (
    <article className={`strategy-ranked-card ${row.compatibilityStatus}`} role="listitem">
      <div className="strategy-rank-marker" aria-label={row.rank ? `Canonical rank ${row.rank}` : "Unranked"}>{row.rank ?? "-"}</div>
      <div>
        <div className="strategy-card-title">
          <strong>{row.displayName}</strong>
          {row.selectedByUser && <span className="status-chip info">User selected</span>}
          <span className="status-chip">{humanize(row.compatibilityStatus)}</span>
          <span className="status-chip">{humanize(row.freshnessState)}</span>
        </div>
        <p className="quiet">{row.confidenceLabel}: {row.confidenceDescription}</p>
        {row.hardDisqualifiers.length > 0 && row.hardDisqualifiers.map((item) => <p className="strategy-alert blocking" key={item}>{item}</p>)}
        <div className="strategy-card-meta">
          <span>Score: {row.totalScore === null ? "Unscored" : `${row.totalScore}/100`}</span>
          <span>Missing: {row.missingDependencyCount}</span>
          <span>Review: {row.professionalReviewCount}</span>
          {mode === "professional" && <span>{row.strategyId}@{row.strategyVersion}</span>}
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="underwriting-summary-card neutral"><span>{label}</span><strong>{value}</strong></article>;
}

function DefinitionBlock({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section>
      <h5>{title}</h5>
      <dl className="definition-list">
        {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </section>
  );
}

function displayNullable(value: number | null) {
  return value === null ? "Unavailable" : String(value);
}

function humanize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
