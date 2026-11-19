import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Trash2 } from "lucide-react";
import { checkPhoto, photoCheckEnabled, summarizePhotos, type PhotoFinding } from "../core/photoCheck";
import { usd } from "../core/investorMath";

const MAX_PER_BATCH = 8;
const AREA_LABEL: Record<string, string> = {
  exterior: "Exterior", roof: "Roof", kitchen: "Kitchen", bathroom: "Bathroom", bedroom: "Bedroom", living: "Living area",
  basement: "Basement", garage: "Garage", yard: "Yard", systems: "Systems", other: "Photo",
};

export function PhotoCheckCard({
  saved,
  squareFeet,
  rehabBudget,
  canSave,
  onSave,
  onUseRehab,
}: {
  saved: PhotoFinding[];
  squareFeet?: number;
  rehabBudget: number;
  canSave: boolean;
  onSave?: (findings: PhotoFinding[]) => Promise<void>;
  onUseRehab: (amount: number) => void;
}) {
  const [enabled, setEnabled] = useState(false);
  const [findings, setFindings] = useState<PhotoFinding[]>(saved);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void photoCheckEnabled().then((on) => { if (active) setEnabled(on); });
    return () => { active = false; };
  }, []);
  useEffect(() => setFindings(saved), [saved]);

  const summary = useMemo(() => summarizePhotos(findings, squareFeet, rehabBudget), [findings, squareFeet, rehabBudget]);
  const dirty = JSON.stringify(findings) !== JSON.stringify(saved);

  if (!enabled && !saved.length) return null;

  async function run(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, MAX_PER_BATCH);
    if (!list.length) {
      setMessage("Choose photo files (JPEG, PNG or WebP).");
      return;
    }
    setMessage(Array.from(files).length > MAX_PER_BATCH ? `Checking the first ${MAX_PER_BATCH} photos.` : null);
    setSaveState("idle");
    setProgress({ done: 0, total: list.length });
    for (const [i, file] of list.entries()) {
      try {
        const finding = await checkPhoto(file);
        setFindings((current) => [...current, finding]);
      } catch (error) {
        setMessage(`${file.name}: ${error instanceof Error ? error.message : "couldn't be checked."}`);
        if (error instanceof Error && /allowance|lot of photos/i.test(error.message)) break;
      }
      setProgress({ done: i + 1, total: list.length });
    }
    setProgress(null);
    if (input.current) input.current.value = "";
  }

  async function save() {
    if (!onSave) return;
    setSaveState("saving");
    try {
      await onSave(findings);
      setSaveState("saved");
    } catch {
      setSaveState("failed");
    }
  }

  return (
    <div className="analyzer-card photo-check">
      <h5><Camera size={16} aria-hidden="true" /> Photo check</h5>
      <p className="analyzer-footnote">Add listing screenshots or your own photos. BRIX flags visible condition issues and sizes the rehab. It can't see behind walls, so treat it as a list of things to look at closely, not an inspection.</p>
      {enabled ? (
        <div className="photo-actions">
          <input ref={input} id="photo-check-input" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => void run(e.target.files)} />
          <button className="primary compact" type="button" disabled={Boolean(progress)} onClick={() => input.current?.click()}>
            <Camera size={16} aria-hidden="true" /> {progress ? `Checking ${progress.done + 1 > progress.total ? progress.total : progress.done + 1} of ${progress.total}…` : findings.length ? "Add photos" : "Check photos"}
          </button>
          {onSave && findings.length ? (
            <button className="secondary compact" type="button" disabled={!canSave || !dirty || saveState === "saving"} onClick={() => void save()}>
              {saveState === "saving" ? "Saving…" : saveState === "saved" && !dirty ? "Saved to Deal" : "Save findings"}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="analyzer-footnote">Photo check is offline right now. Your saved findings are below.</p>
      )}
      {message ? <p className="photo-message" role="status">{message}</p> : null}
      {saveState === "failed" ? <p className="photo-message" role="alert">Couldn't save the findings. They're still on screen; try again.</p> : null}

      {summary ? (
        <div className="photo-summary">
          <div className={`photo-scope scope-${summary.scope}`}>
            <span>Rehab the photos suggest</span>
            <strong>{summary.scope === "none" ? "Move-in ready" : `${summary.scope[0].toUpperCase()}${summary.scope.slice(1)}`}</strong>
            {summary.estimate ? <small>About {usd(summary.estimate.low)} to {usd(summary.estimate.high)} for {squareFeet?.toLocaleString()} sq ft</small> : <small>From {summary.photos} photo{summary.photos === 1 ? "" : "s"}</small>}
          </div>
          {summary.budgetNote ? (
            <div className="photo-budget">
              <AlertTriangle size={16} aria-hidden="true" />
              <p>{summary.budgetNote}</p>
              {summary.estimate ? (
                <button className="secondary compact" type="button" onClick={() => onUseRehab(Math.round((summary.estimate!.low + summary.estimate!.high) / 2 / 1000) * 1000)}>
                  Use {usd(Math.round((summary.estimate.low + summary.estimate.high) / 2 / 1000) * 1000)}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {findings.length ? (
        <ul className="photo-list">
          {findings.map((f) => (
            <li key={f.id} className={`photo-item cond-${f.condition}`}>
              <div className="photo-head">
                <strong>{AREA_LABEL[f.area] ?? "Photo"} · {f.condition}</strong>
                <small>{f.fileName}</small>
                <button className="icon-button" type="button" aria-label={`Remove ${f.fileName}`} onClick={() => { setFindings((c) => c.filter((x) => x.id !== f.id)); setSaveState("idle"); }}><Trash2 size={16} /></button>
              </div>
              {f.summary ? <p>{f.summary}</p> : null}
              {f.observations.length ? (
                <ul>
                  {f.observations.map((o, i) => (
                    <li key={i} className={`obs-${o.severity}`}>
                      {o.severity === "low" ? <CheckCircle2 size={14} aria-hidden="true" /> : <AlertTriangle size={14} aria-hidden="true" />}
                      <span><b>{o.issue}.</b> {o.detail}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {findings.length ? <p className="analyzer-footnote">AI reads photos only; rehab ranges are rough 2026 planning numbers (cosmetic $10–25, moderate $25–50, heavy $50–100 per sq ft). Get contractor bids before you commit.</p> : null}
    </div>
  );
}
