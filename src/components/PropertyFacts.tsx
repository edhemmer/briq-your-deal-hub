import { useEffect, useMemo, useState } from "react";
import { Home, Save } from "lucide-react";
import { usd } from "../core/investorMath";
import type { DealFacts } from "../core/types";

export type PropertyFactsPatch = Pick<DealFacts, "beds" | "baths" | "squareFeet" | "yearBuilt" | "propertyType" | "lotSize" | "county"> & { units?: number };

const TYPES = ["Single family", "Townhouse", "Condo", "Duplex", "Triplex", "Fourplex", "Multifamily (5+)", "Manufactured", "Mixed use", "Land"];

type Status = "idle" | "saving" | "saved" | "failed";

export function PropertyFacts({
  deal,
  address,
  canSave,
  onSave,
}: {
  deal: DealFacts;
  address: string;
  canSave: boolean;
  onSave: (patch: PropertyFactsPatch) => Promise<void>;
}) {
  const initial = useMemo<PropertyFactsPatch>(() => ({
    beds: deal.beds,
    baths: deal.baths,
    squareFeet: deal.squareFeet,
    yearBuilt: deal.yearBuilt,
    propertyType: deal.propertyType,
    lotSize: deal.lotSize,
    county: deal.county,
    units: deal.analyzer?.units,
  }), [deal]);
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  useEffect(() => setDraft(initial), [initial]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const year = new Date().getFullYear();
  const price = deal.analyzer?.purchasePrice ?? deal.listPrice;
  const rent = deal.analyzer?.monthlyRent ?? deal.monthlyRent;
  const sf = draft.squareFeet;

  const num = (key: keyof PropertyFactsPatch, label: string, opts: { step?: number; min?: number; max?: number; suffix?: string } = {}) => (
    <label className="field compact-field">
      <span>{label}</span>
      <input
        inputMode="decimal"
        value={draft[key] === undefined ? "" : String(draft[key])}
        onChange={(event) => {
          const raw = event.target.value.replace(/[,\s]/g, "");
          setDraft((d) => ({ ...d, [key]: raw === "" ? undefined : Number.isFinite(Number(raw)) ? Number(raw) : d[key] }));
        }}
        aria-describedby={opts.suffix ? `${String(key)}-suffix` : undefined}
      />
    </label>
  );

  async function save() {
    if (draft.yearBuilt !== undefined && (draft.yearBuilt < 1700 || draft.yearBuilt > year + 2)) {
      setStatus("failed");
      setMessage(`Year built should be between 1700 and ${year + 2}.`);
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      await onSave(draft);
      setStatus("saved");
      setMessage("Property facts saved.");
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "BRIX could not save these facts. Try again.");
    }
  }

  return (
    <section className="workspace-card property-facts">
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow"><Home size={14} aria-hidden="true" /> Property facts</p>
          <h4>{address}</h4>
        </div>
        <button className="primary compact" type="button" disabled={!canSave || !dirty || status === "saving"} onClick={() => void save()}>
          <Save size={16} /> {status === "saving" ? "Saving…" : "Save facts"}
        </button>
      </div>
      <div className="property-facts-grid">
        {num("beds", "Bedrooms")}
        {num("baths", "Bathrooms")}
        {num("squareFeet", "Living area (sq ft)")}
        {num("yearBuilt", "Year built")}
        {num("units", "Units")}
        <label className="field compact-field">
          <span>Property type</span>
          <select value={draft.propertyType ?? ""} onChange={(event) => setDraft((d) => ({ ...d, propertyType: event.target.value || undefined }))}>
            <option value="">Not set</option>
            {[...new Set([...TYPES, ...(draft.propertyType && !TYPES.includes(draft.propertyType) ? [draft.propertyType] : [])])].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="field compact-field">
          <span>Lot size</span>
          <input value={draft.lotSize ?? ""} placeholder="e.g. 0.18 acres" onChange={(event) => setDraft((d) => ({ ...d, lotSize: event.target.value || undefined }))} />
        </label>
        <label className="field compact-field">
          <span>County</span>
          <input value={draft.county ?? ""} onChange={(event) => setDraft((d) => ({ ...d, county: event.target.value || undefined }))} />
        </label>
      </div>
      <div className="kpi-grid compact-kpis">
        <div className="kpi"><span>Price / sq ft</span><strong>{price && sf ? usd(price / sf) : "—"}</strong></div>
        <div className="kpi"><span>Rent / sq ft / mo</span><strong>{rent && sf ? `$${(rent / sf).toFixed(2)}` : "—"}</strong></div>
        <div className="kpi"><span>Age</span><strong>{draft.yearBuilt ? `${year - draft.yearBuilt} yrs` : "—"}</strong>{draft.yearBuilt && draft.yearBuilt < 1978 ? <small>Pre-1978: lead disclosure applies</small> : null}</div>
        <div className="kpi"><span>Beds / baths</span><strong>{draft.beds ?? "—"} / {draft.baths ?? "—"}</strong></div>
      </div>
      {message ? <p className={status === "failed" ? "analyzer-banner failed" : "analyzer-save-state saved"} role="status">{message}</p> : null}
      {!canSave ? <p className="analyzer-footnote">Sign in and stay online to save property facts.</p> : null}
    </section>
  );
}
