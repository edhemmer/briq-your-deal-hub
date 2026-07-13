import { useEffect, useMemo, useState } from "react";
import { Search, BarChart3, FilePenLine, KanbanSquare, Building2, ShieldCheck, UserCircle, Trash2, Camera, Plus, LogOut, FileDown, Table2, MapPinned, Landmark, FileSearch } from "lucide-react";
import { strategyCatalog, type StrategyId } from "./core/strategyCatalog";
import { analyzeDeal, formatCurrency } from "./core/underwriting";
import { createDealFromInput, loadDeals, loadRemoteDeals, persistRemoteDeal, saveDeals, softDeleteRemoteDeal } from "./core/store";
import type { DealFacts, DealStatus } from "./core/types";
import { supabase } from "./core/supabase";
import { downloadDecisionPdf, downloadWorkbook } from "./core/reportExports";
import { analyzePhotoEvidence } from "./core/photoAnalysis";
import { areaSearchUrl, ownerOccupiedConveniences, taxSearchUrl } from "./core/areaAndTax";
import { requestAccountDeletion } from "./core/authActions";
import { reviewContractText } from "./core/contractReview";
import { buildOfferStructures, offerSummary } from "./core/offerEngine";
import { portfolioMetrics } from "./core/portfolioEngine";

type Module = "find" | "deal" | "contract" | "pipeline" | "offer" | "portfolio" | "reports" | "account";

const nav: Array<{ id: Module; label: string; icon: typeof Search; purpose: string }> = [
  { id: "find", label: "FindIQ", icon: Search, purpose: "Start or import a property" },
  { id: "deal", label: "DealIQ", icon: BarChart3, purpose: "Underwrite and compare strategies" },
  { id: "contract", label: "ContractIQ", icon: FileSearch, purpose: "Review contract risk" },
  { id: "pipeline", label: "PipelineIQ", icon: KanbanSquare, purpose: "Track active opportunities" },
  { id: "offer", label: "OfferIQ", icon: FilePenLine, purpose: "Plan pursuit and terms" },
  { id: "portfolio", label: "PortfolioIQ", icon: Building2, purpose: "Monitor owned assets" },
  { id: "reports", label: "Reports", icon: ShieldCheck, purpose: "Export decision memos" },
  { id: "account", label: "Account", icon: UserCircle, purpose: "Profile, billing, privacy" },
];

export default function App() {
  if (window.location.pathname === "/") {
    return <Landing />;
  }
  return <BrixApp />;
}

function BrixApp() {
  const [module, setModule] = useState<Module>("account");
  const [deals, setDeals] = useState<DealFacts[]>(() => loadDeals());
  const [selectedId, setSelectedId] = useState<string | null>(() => loadDeals()[0]?.id ?? null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const selectedDeal = deals.find((deal) => deal.id === selectedId) ?? deals[0];

  useEffect(() => saveDeals(deals), [deals]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const signedIn = Boolean(data.session);
      setIsAuthenticated(signedIn);
      if (signedIn) setModule("find");
      if (!signedIn) setModule("account");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      if (!session) setModule("account");
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadRemoteDeals()
      .then((remoteDeals) => {
        if (remoteDeals.length > 0) {
          setDeals(remoteDeals);
          setSelectedId(remoteDeals[0].id);
        }
        setSyncMessage(null);
      })
      .catch((error) => setSyncMessage(`Could not load cloud records: ${error.message ?? "check your connection."}`));
  }, [isAuthenticated]);

  function upsertDeal(next: DealFacts) {
    setDeals((current) => {
      const exists = current.some((deal) => deal.id === next.id);
      return exists ? current.map((deal) => deal.id === next.id ? next : deal) : [next, ...current];
    });
    setSelectedId(next.id);
    persistRemoteDeal(next)
      .then(() => setSyncMessage(null))
      .catch((error) => setSyncMessage(`Deal saved on this device, but cloud sync failed: ${error.message ?? "check your connection."}`));
  }

  function deleteDeal(id: string) {
    setDeals((current) => current.filter((deal) => deal.id !== id));
    setSelectedId((current) => current === id ? deals.find((deal) => deal.id !== id)?.id ?? null : current);
    softDeleteRemoteDeal(id)
      .then(() => setSyncMessage(null))
      .catch((error) => setSyncMessage(`Deal removed on this device, but cloud sync failed: ${error.message ?? "check your connection."}`));
  }

  return (
    <div className="app-shell">
      <aside className="rail">
        <div className="brand">
          <div className="mark" aria-hidden="true"><span /><span /><span /><span /></div>
          <div>
            <strong>BRIX</strong>
            <small>Real Estate</small>
          </div>
        </div>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={module === item.id ? "nav-item active" : "nav-item"} onClick={() => setModule(item.id)}>
                <Icon size={18} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.purpose}</small>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">BRIX Real Estate</p>
            <h1>{titleFor(module)}</h1>
          </div>
          <DealSwitcher deals={deals} selectedId={selectedDeal?.id} onSelect={setSelectedId} />
        </header>

        {!isAuthenticated && <Account onAuthChanged={() => setIsAuthenticated(true)} />}
        {isAuthenticated && syncMessage && <div className="callout danger-callout"><strong>Sync needs attention</strong><span>{syncMessage}</span></div>}
        {isAuthenticated && module === "find" && <FindIQ onCreate={(deal) => { upsertDeal(deal); setModule("deal"); }} />}
        {isAuthenticated && module === "deal" && <DealIQ deal={selectedDeal} onChange={upsertDeal} onDelete={deleteDeal} />}
        {isAuthenticated && module === "contract" && <ContractIQ deal={selectedDeal} />}
        {isAuthenticated && module === "pipeline" && <PipelineIQ deals={deals} onOpen={(id) => { setSelectedId(id); setModule("deal"); }} onStatusChange={(deal) => upsertDeal(deal)} />}
        {isAuthenticated && module === "offer" && <OfferIQ deal={selectedDeal} />}
        {isAuthenticated && module === "portfolio" && <PortfolioIQ deals={deals} onOpen={(id) => { setSelectedId(id); setModule("deal"); }} />}
        {isAuthenticated && module === "reports" && <Reports deal={selectedDeal} />}
        {isAuthenticated && module === "account" && <Account onAuthChanged={() => setIsAuthenticated(true)} />}
      </main>
    </div>
  );
}

function Landing() {
  return (
    <main className="landing">
      <section className="landing-hero">
        <div className="brand large">
          <div className="mark" aria-hidden="true"><span /><span /><span /><span /></div>
          <div><strong>BRIX</strong><small>Real Estate</small></div>
        </div>
        <h1>Real estate decisions with evidence before emotion.</h1>
        <p>Enter a property, choose a strategy, and BRIX builds the deal file, checks missing facts, compares strategies, and tells you whether to visit, research first, or pass.</p>
        <button className="primary" onClick={() => { window.history.pushState({}, "", "/app"); window.location.reload(); }}>Open BRIX</button>
      </section>
      <section className="landing-grid">
        <Step n="1" title="Start with one property" text="Address, listing URL, or listing text. No browsing maze." />
        <Step n="2" title="Choose the strategy" text="Owner occupied, rental, BRRRR, flip, seller finance, refinance, tax, development, and partnership paths." />
        <Step n="3" title="Get decision intelligence" text="Confidence, readiness, missing data, strategy comparison, report export, and next actions." />
      </section>
    </main>
  );
}

function FindIQ({ onCreate }: { onCreate: (deal: DealFacts) => void }) {
  const [input, setInput] = useState("");
  const [strategyId, setStrategyId] = useState<StrategyId>("owner_occupant");
  const [error, setError] = useState("");

  function create() {
    const cleaned = input.trim();
    if (!cleaned) {
      setError("Enter an address, listing URL, or listing text.");
      return;
    }
    const deal = createDealFromInput(cleaned, strategyId);
    onCreate(deal);
  }

  return (
    <section className="two-column">
      <div className="panel hero-panel">
        <p className="eyebrow">Start</p>
        <h2>Paste or enter a property.</h2>
        <p className="quiet">Use a listing URL, full address, or listing text. BRIX extracts what it can and leaves unknown fields empty.</p>
        <label className="field">
          <span>Address, listing URL, or listing text</span>
          <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={7} />
        </label>
        <label className="field">
          <span>Primary strategy</span>
          <select value={strategyId} onChange={(event) => setStrategyId(event.target.value as StrategyId)}>
            {strategyCatalog.map((strategy) => <option value={strategy.id} key={strategy.id}>{strategy.name}</option>)}
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" onClick={create}><Plus size={18} /> Create deal file</button>
      </div>
      <div className="panel">
        <p className="eyebrow">What happens next</p>
        <div className="flow-steps">
          <Step n="1" title="BRIX reads the listing" text="Address, price, beds, baths, taxes, HOA clues, photos, and condition signals are captured when present." />
          <Step n="2" title="DealIQ checks the strategy" text="The selected strategy sets the questions, missing data, assumptions, and failure points." />
          <Step n="3" title="You decide what is worth time" text="BRIX gives a visit, research-first, or do-not-visit-yet signal with evidence and next actions." />
        </div>
      </div>
    </section>
  );
}

function DealIQ({ deal, onChange, onDelete }: { deal?: DealFacts; onChange: (deal: DealFacts) => void; onDelete: (id: string) => void }) {
  if (!deal) return <Empty title="No deal file yet" text="Start in FindIQ with an address, listing URL, or listing text." />;
  const analysis = analyzeDeal(deal);
  const primary = analysis.primaryStrategy;

  function patch(update: Partial<DealFacts>) {
    onChange({ ...deal, ...update, updatedAt: new Date().toISOString() });
  }

  return (
    <div className="deal-grid">
      <section className="panel decision-card">
        <p className="eyebrow">Decision</p>
        <h2>{analysis.decision}</h2>
        <p className="quiet">{deal.address}{deal.city ? `, ${deal.city}` : ""}{deal.state ? `, ${deal.state}` : ""}</p>
        <div className="metric-row">
          <Metric label="Confidence" value={analysis.confidence} />
          <Metric label="Readiness" value={analysis.readiness} />
          <Metric label="Strategy fit" value={primary.score} />
        </div>
        <div className="callout">
          <strong>{primary.name}: {primary.recommendation}</strong>
          <span>{primary.why[0]}</span>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Facts</p>
        <div className="form-grid">
          <MoneyField label="Purchase price" value={deal.listPrice} onChange={(listPrice) => patch({ listPrice })} />
          <NumberField label="Beds" value={deal.beds} onChange={(beds) => patch({ beds })} />
          <NumberField label="Baths" value={deal.baths} onChange={(baths) => patch({ baths })} />
          <NumberField label="Square feet" value={deal.squareFeet} onChange={(squareFeet) => patch({ squareFeet })} />
          <MoneyField label="Annual taxes" value={deal.annualTaxes} onChange={(annualTaxes) => patch({ annualTaxes })} />
          <MoneyField label="Annual insurance" value={deal.annualInsurance} onChange={(annualInsurance) => patch({ annualInsurance })} />
          <MoneyField label="Monthly rent" value={deal.monthlyRent} onChange={(monthlyRent) => patch({ monthlyRent })} />
          <MoneyField label="Rehab budget" value={deal.rehabBudget} onChange={(rehabBudget) => patch({ rehabBudget })} />
          <MoneyField label="After repair value" value={deal.arv} onChange={(arv) => patch({ arv })} />
          <MoneyField label="Down payment" value={deal.downPayment} onChange={(downPayment) => patch({ downPayment })} />
        </div>
      </section>

      <section className="panel wide">
        <p className="eyebrow">Strategy comparison</p>
        <div className="score-list">
          {analysis.strategyScores.slice(0, 12).map((score) => (
            <button key={score.strategyId} className={score.strategyId === deal.strategyId ? "score-card selected" : "score-card"} onClick={() => patch({ strategyId: score.strategyId })}>
              <strong>{score.name}</strong>
              <span>{score.recommendation}</span>
              <b>{score.score}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Photos and condition</p>
        <div className="upload-zone">
          <Camera size={26} />
          <strong>Add listing or field photos</strong>
          <input type="file" accept="image/*" multiple onChange={(event) => {
            const names = Array.from(event.target.files ?? []).map((file) => file.name);
            patch({ uploadedPhotoNames: [...deal.uploadedPhotoNames, ...names] });
          }} />
        </div>
        {[...deal.photoUrls, ...deal.uploadedPhotoNames].length > 0 && (
          <ul className="compact-list">{[...deal.photoUrls, ...deal.uploadedPhotoNames].slice(0, 8).map((item) => <li key={item}>{item}</li>)}</ul>
        )}
        {analyzePhotoEvidence([...deal.photoUrls, ...deal.uploadedPhotoNames]).length > 0 && (
          <div className="findings">
            {analyzePhotoEvidence([...deal.photoUrls, ...deal.uploadedPhotoNames]).map((finding) => (
              <article key={finding.area}>
                <strong>{finding.severity}: {finding.area}</strong>
                <span>{finding.finding} {finding.action}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <p className="eyebrow">Verification</p>
        <ul className="check-list">
          {analysis.nextActions.map((action) => <li key={action}>{action}</li>)}
        </ul>
        <div className="button-row">
          <a className="secondary link-button" href={taxSearchUrl(deal)} target="_blank" rel="noreferrer"><Landmark size={16} /> Tax source</a>
          {ownerOccupiedConveniences.slice(0, 3).map((item) => (
            <a key={item.label} className="secondary link-button" href={areaSearchUrl(deal, item.label)} target="_blank" rel="noreferrer"><MapPinned size={16} /> {item.label}</a>
          ))}
        </div>
      </section>

      <section className="panel wide action-bar">
        <button className="secondary" onClick={() => patch({ status: nextStatus(deal.status) })}>Advance status</button>
        <button className="secondary" onClick={() => downloadDecisionPdf(deal, analysis)}><FileDown size={16} /> PDF memo</button>
        <button className="secondary" onClick={() => downloadWorkbook(deal, analysis)}><Table2 size={16} /> XLS workbook</button>
        <button className="danger" onClick={() => onDelete(deal.id)}><Trash2 size={16} /> Delete deal</button>
      </section>
    </div>
  );
}

function PipelineIQ({ deals, onOpen, onStatusChange }: { deals: DealFacts[]; onOpen: (id: string) => void; onStatusChange: (deal: DealFacts) => void }) {
  if (!deals.length) return <Empty title="No active properties" text="Create a deal in FindIQ to begin tracking it." />;
  const stages: DealStatus[] = ["draft", "reviewing", "underwriting", "pursuing", "under_contract", "closed", "passed"];
  return (
    <section className="panel wide">
      <p className="eyebrow">Pipeline</p>
      <div className="kanban">
        {stages.map((stage) => (
          <div className="kanban-col" key={stage}>
            <strong>{stage.replace(/_/g, " ")}</strong>
            {deals.filter((deal) => deal.status === stage).map((deal) => {
              const analysis = analyzeDeal(deal);
              return (
                <article key={deal.id} className="mini-card">
                  <button onClick={() => onOpen(deal.id)}>{deal.address || "Untitled property"}</button>
                  <span>{analysis.decision} - {analysis.confidence}</span>
                  <button className="tiny" onClick={() => onStatusChange({ ...deal, status: nextStatus(deal.status), updatedAt: new Date().toISOString() })}>Advance</button>
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

function OfferIQ({ deal }: { deal?: DealFacts }) {
  if (!deal) return <Empty title="No deal selected" text="Open a deal before building an offer plan." />;
  const analysis = analyzeDeal(deal);
  const offers = buildOfferStructures(deal, analysis);
  return (
    <section className="panel wide">
      <p className="eyebrow">Offer plan</p>
      <h2>{deal.address}</h2>
      <p className="quiet">Terms stay conditional until required facts are verified.</p>
      <div className="score-list">
        {offers.map((offer) => (
          <article className="score-card" key={offer.name}>
            <strong>{offerSummary(offer)}</strong>
            <span>{offer.posture}</span>
            {offer.risks.map((risk) => <small key={risk}>{risk}</small>)}
          </article>
        ))}
      </div>
    </section>
  );
}

function PortfolioIQ({ deals, onOpen }: { deals: DealFacts[]; onOpen: (id: string) => void }) {
  const closed = deals.filter((deal) => deal.status === "closed");
  if (!closed.length) return <Empty title="No portfolio assets yet" text="Closed acquisitions will appear here." />;
  const metrics = portfolioMetrics(deals);
  return (
    <section className="panel wide">
      <p className="eyebrow">Portfolio</p>
      <div className="metric-row">
        <Metric label="Assets" value={metrics.count} />
        <Metric label="Cash flow" value={Math.max(0, Math.min(100, Math.round(metrics.annualNet / 1000)))} />
        <Metric label="Equity" value={Math.max(0, Math.min(100, Math.round(metrics.estimatedEquity / 10000)))} />
      </div>
      <div className="table">{closed.map((deal) => <button className="table-row" key={deal.id} onClick={() => onOpen(deal.id)}><span>{deal.address}</span><span>{formatCurrency(deal.listPrice)}</span><span>{formatCurrency(deal.monthlyRent)}</span></button>)}</div>
    </section>
  );
}

function ContractIQ({ deal }: { deal?: DealFacts }) {
  const [text, setText] = useState("");
  const findings = useMemo(() => reviewContractText(text), [text]);
  if (!deal) return <Empty title="No deal selected" text="Open a deal before reviewing contract risk." />;
  return (
    <section className="two-column">
      <div className="panel">
        <p className="eyebrow">ContractIQ</p>
        <h2>{deal.address}</h2>
        <label className="field">
          <span>Paste contract text or key clauses</span>
          <textarea rows={12} value={text} onChange={(event) => setText(event.target.value)} />
        </label>
      </div>
      <div className="panel">
        <p className="eyebrow">Risk review</p>
        {!text.trim() && <p className="quiet">Paste contract language to review inspection, financing, appraisal, HOA, earnest money, tax proration, closing, and condition risk.</p>}
        <div className="findings">
          {findings.map((finding) => (
            <article key={`${finding.clause}-${finding.action}`}>
              <strong>{finding.severity}: {finding.clause}</strong>
              <span>{finding.finding} {finding.action}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reports({ deal }: { deal?: DealFacts }) {
  if (!deal) return <Empty title="No report available" text="Create or open a deal first." />;
  const analysis = analyzeDeal(deal);
  return <section className="panel memo"><p className="eyebrow">Decision memo</p><h2>{deal.address}</h2><div className="button-row"><button className="primary" onClick={() => downloadDecisionPdf(deal, analysis)}>Download PDF</button><button className="secondary" onClick={() => downloadWorkbook(deal, analysis)}>Download XLS</button></div><p>Recommendation: {analysis.decision}</p><p>Confidence: {analysis.confidence}/100</p><p>Readiness: {analysis.readiness}/100</p><h3>Evidence</h3><ul>{analysis.evidence.map((item) => <li key={item}>{item}</li>)}</ul><h3>Missing</h3><ul>{analysis.missing.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}

function Account({ onAuthChanged }: { onAuthChanged: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMessage(error ? error.message : "Signed in.");
    if (!error) onAuthChanged();
  }

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : "Account created. Check email if confirmation is required.");
    if (!error) onAuthChanged();
  }

  async function reset() {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/account` });
    setMessage(error ? error.message : "Password reset email sent.");
  }

  async function deleteAccount() {
    try {
      await requestAccountDeletion();
      setMessage("Account deletion request recorded.");
    } catch {
      setMessage("Account deletion request failed. Sign in and try again.");
    }
  }

  return (
    <section className="panel account-panel">
      <p className="eyebrow">Account</p>
      <label className="field"><span>Email</span><input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="field"><span>Password</span><input value={password} type="password" onChange={(event) => setPassword(event.target.value)} /></label>
      <div className="button-row">
        <button className="primary" onClick={signIn}>Sign in</button>
        <button className="secondary" onClick={signUp}>Create account</button>
        <button className="secondary" onClick={reset}>Reset password</button>
        <button className="secondary" onClick={() => supabase.auth.signOut()}><LogOut size={16} /> Sign out</button>
        <button className="danger" onClick={deleteAccount}>Request account deletion</button>
      </div>
      {message && <p className="quiet">{message}</p>}
      <div className="callout"><strong>Privacy controls</strong><span>Account deletion, data export, and billing controls are part of the BRIX account system.</span></div>
    </section>
  );
}

function DealSwitcher({ deals, selectedId, onSelect }: { deals: DealFacts[]; selectedId?: string; onSelect: (id: string) => void }) {
  if (!deals.length) return null;
  return <select className="deal-switcher" value={selectedId} onChange={(event) => onSelect(event.target.value)}>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.address || "Untitled property"}</option>)}</select>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><div><i style={{ width: `${value}%` }} /></div></div>;
}

function MoneyField({ label, value, onChange }: { label: string; value?: number; onChange: (value?: number) => void }) {
  return <label className="field"><span>{label}</span><input inputMode="numeric" value={value ?? ""} onChange={(event) => onChange(toNumber(event.target.value))} /></label>;
}

function NumberField({ label, value, onChange }: { label: string; value?: number; onChange: (value?: number) => void }) {
  return <label className="field"><span>{label}</span><input inputMode="decimal" value={value ?? ""} onChange={(event) => onChange(toNumber(event.target.value))} /></label>;
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return <div className="step"><b>{n}</b><div><strong>{title}</strong><p>{text}</p></div></div>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <section className="panel empty"><h2>{title}</h2><p>{text}</p></section>;
}

function titleFor(module: Module) {
  return nav.find((item) => item.id === module)?.label ?? "BRIX";
}

function toNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function nextStatus(status: DealStatus): DealStatus {
  const stages: DealStatus[] = ["draft", "reviewing", "underwriting", "pursuing", "under_contract", "closed"];
  return stages[Math.min(stages.indexOf(status) + 1, stages.length - 1)] ?? "reviewing";
}
