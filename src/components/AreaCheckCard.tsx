import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ExternalLink, Info, Map as MapIcon } from "lucide-react";
import { areaQuery, loadAreaCheck, readArea, type AreaAddress, type AreaCheckResult } from "../core/areaCheck";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; result: AreaCheckResult }
  | { status: "error"; message: string };

export function AreaCheckCard({ deal }: { deal: AreaAddress }) {
  const query = useMemo(() => areaQuery(deal), [deal]);
  const [state, setState] = useState<State>({ status: "idle" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!query) {
      setState({ status: "idle" });
      return;
    }
    let active = true;
    setState({ status: "loading" });
    void loadAreaCheck(query).then((result) => {
      if (!active) return;
      if (!result) setState({ status: "idle" });
      else if ("error" in result) setState({ status: "error", message: result.error });
      else setState({ status: "ready", result });
    });
    return () => { active = false; };
  }, [query, attempt]);

  const read = useMemo(() => (state.status === "ready" ? readArea(state.result) : null), [state]);

  return (
    <div className="analyzer-card area-check" aria-live="polite">
      <h5><MapIcon size={16} aria-hidden="true" /> Area check</h5>
      {!query ? (
        <p className="analyzer-footnote">Add the street address with city and state or ZIP to check for rail lines, highways, busy roads, industrial land, power lines and flood zones before you drive out.</p>
      ) : state.status === "loading" || state.status === "idle" ? (
        <p className="analyzer-footnote">Checking the surroundings of {query}…</p>
      ) : state.status === "error" ? (
        <div className="area-error">
          <p>{state.message}</p>
          <button className="secondary compact" type="button" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
        </div>
      ) : read ? (
        <>
          <p className={`area-headline area-${read.verdict}`}>{read.headline}</p>
          <ul className="area-list">
            {read.findings.map((finding) => (
              <li key={finding.key} className={`area-item area-${finding.tone}`}>
                {finding.tone === "good" ? <CheckCircle2 size={18} aria-hidden="true" /> : finding.tone === "info" ? <Info size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
                <div><strong>{finding.title}</strong><p>{finding.detail}</p></div>
              </li>
            ))}
          </ul>
          <div className="area-links">
            <a href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${state.result.location.lat},${state.result.location.lon}`} target="_blank" rel="noreferrer">Street View <ExternalLink size={14} aria-hidden="true" /></a>
            <a href={`https://www.google.com/maps/@${state.result.location.lat},${state.result.location.lon},300m/data=!3m1!1e3`} target="_blank" rel="noreferrer">Satellite view <ExternalLink size={14} aria-hidden="true" /></a>
          </div>
          <p className="analyzer-footnote">
            Matched {state.result.location.matchedAddress}. Distances are to the nearest mapped feature from {state.result.sources.features}; flood zone from {state.result.sources.flood}.
            Only physical features are checked. Walk or drive the block before you buy; maps miss things like upkeep and noise levels.
          </p>
        </>
      ) : null}
    </div>
  );
}
