import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Search, BarChart3, FilePenLine, KanbanSquare, Building2, ShieldCheck, UserCircle, Trash2, Camera, Plus, LogOut, FileDown, Table2, MapPinned, Landmark, FileSearch, Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { strategyCatalog, type StrategyId } from "./core/strategyCatalog";
import { analyzeDeal, formatCurrency } from "./core/underwriting";
import { createDealFromInput, loadAnonymousDeals, loadRemoteDeals, persistRemoteDeal, saveAnonymousDeals, softDeleteRemoteDeal } from "./core/store";
import type { DealFacts, DealStatus } from "./core/types";
import { supabase } from "./core/supabase";
import { downloadDecisionPdf, downloadWorkbook } from "./core/reportExports";
import { analyzePhotoEvidence } from "./core/photoAnalysis";
import { areaSearchUrl, ownerOccupiedConveniences, taxSearchUrl } from "./core/areaAndTax";
import { reviewContractText } from "./core/contractReview";
import { buildOfferStructures, offerSummary } from "./core/offerEngine";
import { portfolioMetrics } from "./core/portfolioEngine";
import { ensureWorkspaceContext, type WorkspaceContext } from "./core/workspace";
import { isSessionFailure, safeAuthError, validateAuthInput, type AuthMode } from "./core/authLifecycle";

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

function moduleFromPath(): Module {
  const raw = window.location.pathname.replace(/^\/+/, "").split("/")[0];
  const aliases: Record<string, Module> = {
    app: "find",
    findiq: "find",
    dealiq: "deal",
    contractiq: "contract",
    pipelineiq: "pipeline",
    offeriq: "offer",
    portfolioiq: "portfolio",
    reports: "reports",
    account: "account",
  };
  return aliases[raw] ?? "find";
}

function pathForModule(module: Module) {
  const paths: Record<Module, string> = {
    find: "/findiq",
    deal: "/dealiq",
    contract: "/contractiq",
    pipeline: "/pipelineiq",
    offer: "/offeriq",
    portfolio: "/portfolioiq",
    reports: "/reports",
    account: "/account",
  };
  return paths[module];
}

function BrixApp() {
  const [module, setModuleState] = useState<Module>(() => moduleFromPath());
  const [deals, setDeals] = useState<DealFacts[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [hasAnonymousDrafts, setHasAnonymousDrafts] = useState(false);
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState<"loading" | "ready" | "failed" | "signed_out">("loading");
  const [authLifecycle, setAuthLifecycle] = useState<"restoring" | "signed_out" | "bootstrapping" | "ready" | "failed" | "signing_out" | "expired">("restoring");
  const [workspaceRetryKey, setWorkspaceRetryKey] = useState(0);
  const isAuthenticated = Boolean(authUserId);
  const selectedDeal = deals.find((deal) => deal.id === selectedId) ?? deals[0];

  function setModule(next: Module) {
    setModuleState(next);
    const nextPath = pathForModule(next);
    if (window.location.pathname !== nextPath) window.history.pushState({}, "", nextPath);
  }

  const anonymousDraftsOnDevice = useCallback(() => {
    const anonymousDeals = loadAnonymousDeals();
    setHasAnonymousDrafts(anonymousDeals.length > 0);
    return anonymousDeals;
  }, []);

  async function prepareWorkspaceForCloudAction() {
    if (!authUserId || workspaceStatus === "ready") return;
    setWorkspaceStatus("loading");
    const context = await ensureWorkspaceContext();
    setWorkspaceContext(context);
    setWorkspaceStatus("ready");
  }

  const restoreAnonymousDrafts = useCallback(() => {
    const anonymousDeals = anonymousDraftsOnDevice();
    setDeals(anonymousDeals);
    setSelectedId(anonymousDeals[0]?.id ?? null);
  }, [anonymousDraftsOnDevice]);

  const clearProtectedState = useCallback(() => {
    setDeals([]);
    setSelectedId(null);
    setWorkspaceContext(null);
    setWorkspaceStatus("signed_out");
  }, []);

  function retryWorkspaceBootstrap() {
    if (!authUserId) {
      setModule("account");
      return;
    }
    setSyncMessage(null);
    setWorkspaceRetryKey((current) => current + 1);
  }

  useEffect(() => {
    if (!authReady || authUserId) return;
    saveAnonymousDeals(deals);
  }, [authReady, authUserId, deals]);

  useEffect(() => {
    const onPopState = () => setModuleState(moduleFromPath());
    window.addEventListener("popstate", onPopState);
    setAuthLifecycle("restoring");
    supabase.auth.getSession()
      .then(({ data }) => {
        const userId = data.session?.user?.id ?? null;
        clearProtectedState();
        setAuthUserId(userId);
        setAuthReady(true);
        if (!userId) {
          setAuthLifecycle("signed_out");
          restoreAnonymousDrafts();
        } else {
          setAuthLifecycle("bootstrapping");
          setWorkspaceStatus("loading");
          anonymousDraftsOnDevice();
        }
      })
      .catch(() => {
        setAuthUserId(null);
        setAuthReady(true);
        clearProtectedState();
        restoreAnonymousDrafts();
        setAuthLifecycle("expired");
        setSyncMessage("Your session could not be restored. Sign in again to continue.");
      });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id ?? null;
      clearProtectedState();
      setAuthUserId(userId);
      setAuthReady(true);
      if (!userId) {
        setAuthLifecycle("signed_out");
        restoreAnonymousDrafts();
      } else {
        setAuthLifecycle("bootstrapping");
        setWorkspaceStatus("loading");
        anonymousDraftsOnDevice();
      }
    });
    return () => {
      window.removeEventListener("popstate", onPopState);
      listener.subscription.unsubscribe();
    };
  }, [anonymousDraftsOnDevice, clearProtectedState, restoreAnonymousDrafts]);

  useEffect(() => {
    if (!authUserId) return;
    let isCurrent = true;
    clearProtectedState();
    setWorkspaceContext(null);
    setWorkspaceStatus("loading");
    setAuthLifecycle("bootstrapping");
    ensureWorkspaceContext()
      .then((context) => {
        if (!isCurrent) return [];
        setWorkspaceContext(context);
        setWorkspaceStatus("ready");
        setAuthLifecycle("ready");
        return loadRemoteDeals(authUserId);
      })
      .then((remoteDeals) => {
        if (!isCurrent) return;
        setDeals(remoteDeals);
        setSelectedId(remoteDeals[0]?.id ?? null);
        setSyncMessage(null);
      })
      .catch((error) => {
        if (!isCurrent) return;
        if (isSessionFailure(error)) {
          setAuthUserId(null);
          clearProtectedState();
          restoreAnonymousDrafts();
          setAuthLifecycle("expired");
          setSyncMessage("Your session has expired. Sign in again to continue.");
          return;
        }
        setWorkspaceContext(null);
        setWorkspaceStatus("failed");
        setAuthLifecycle("failed");
        setSyncMessage(safeAuthError(error).message);
      });
    return () => {
      isCurrent = false;
    };
  }, [authUserId, clearProtectedState, restoreAnonymousDrafts, workspaceRetryKey]);

  async function createDeal(deal: DealFacts) {
    try {
      await prepareWorkspaceForCloudAction();
      const confirmedDeal = authUserId ? await persistRemoteDeal(deal, authUserId) : deal;
      setDeals((current) => [confirmedDeal, ...current.filter((item) => item.id !== confirmedDeal.id)]);
      setSelectedId(confirmedDeal.id);
      if (!authUserId) setHasAnonymousDrafts(true);
      setSyncMessage(isAuthenticated ? null : "Deal created on this device. Sign in from Account to keep it across devices.");
      setModule("deal");
      return true;
    } catch (error) {
      setSyncMessage(`Deal was not created: ${error instanceof Error ? error.message : "cloud save failed."}`);
      setModule("find");
      return false;
    }
  }

  function putDealInState(next: DealFacts) {
    setDeals((current) => {
      const exists = current.some((deal) => deal.id === next.id);
      return exists ? current.map((deal) => deal.id === next.id ? next : deal) : [next, ...current];
    });
    setSelectedId(next.id);
  }

  async function upsertDeal(next: DealFacts) {
    if (!authUserId) {
      putDealInState(next);
      setHasAnonymousDrafts(true);
      setSyncMessage("Deal updated on this device. Sign in from Account to keep it across devices.");
      return;
    }
    setSyncMessage("Saving deal to BRIX cloud...");
    try {
      await prepareWorkspaceForCloudAction();
      const confirmedDeal = await persistRemoteDeal(next, authUserId);
      putDealInState(confirmedDeal);
      setSyncMessage(null);
    } catch (error) {
      setSyncMessage(`Deal was not saved: ${error instanceof Error ? error.message : "check your connection."}`);
    }
  }

  async function deleteDeal(id: string) {
    if (!authUserId) {
      setDeals((current) => {
        const next = current.filter((deal) => deal.id !== id);
        setSelectedId((currentId) => currentId === id ? next[0]?.id ?? null : currentId);
        setHasAnonymousDrafts(next.length > 0);
        return next;
      });
      setSyncMessage("Deal removed from this device.");
      return;
    }
    setSyncMessage("Deleting deal from BRIX cloud...");
    try {
      await prepareWorkspaceForCloudAction();
      await softDeleteRemoteDeal(id, authUserId);
      setDeals((current) => {
        const next = current.filter((deal) => deal.id !== id);
        setSelectedId((currentId) => currentId === id ? next[0]?.id ?? null : currentId);
        return next;
      });
      setSyncMessage(null);
    } catch (error) {
      setSyncMessage(`Deal was not deleted: ${error instanceof Error ? error.message : "check your connection."}`);
    }
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
          {isAuthenticated && (
            <div className={workspaceStatus === "failed" ? "workspace-pill danger" : "workspace-pill"}>
              <span>{workspaceStatus === "ready" ? "Workspace" : "Preparing workspace"}</span>
              <strong>{workspaceContext?.workspaceName ?? "BRIX Account"}</strong>
            </div>
          )}
          <DealSwitcher deals={deals} selectedId={selectedDeal?.id} onSelect={setSelectedId} />
        </header>

        {!authReady && (
          <div className="callout" role="status" aria-live="polite">
            <strong>Restoring session</strong>
            <span>BRIX is checking whether this browser already has a valid account session.</span>
          </div>
        )}
        {syncMessage && (
          <div className={isAuthenticated ? "callout danger-callout" : "callout"} role={isAuthenticated ? "alert" : "status"} aria-live="polite">
            <strong>{authLifecycle === "expired" ? "Sign in required" : isAuthenticated ? "Workspace needs attention" : "Account"}</strong>
            <span>{syncMessage}</span>
            {(workspaceStatus === "failed" || authLifecycle === "expired") && (
              <button className="secondary compact-button" onClick={retryWorkspaceBootstrap}>{authLifecycle === "expired" ? "Sign in" : "Retry setup"}</button>
            )}
          </div>
        )}
        {isAuthenticated && hasAnonymousDrafts && (
          <div className="callout">
            <strong>Local drafts</strong>
            <span>Local drafts are saved on this device and are not part of your BRIX account.</span>
            <span>Sign out to view local drafts.</span>
          </div>
        )}
        {module !== "account" && <WorkflowStrip active={module} onSelect={setModule} />}
        {module === "find" && <FindIQ onCreate={createDeal} />}
        {module === "deal" && <DealIQ deal={selectedDeal} onChange={upsertDeal} onDelete={deleteDeal} />}
        {module === "contract" && <ContractIQ deal={selectedDeal} />}
        {module === "pipeline" && <PipelineIQ deals={deals} onOpen={(id) => { setSelectedId(id); setModule("deal"); }} onStatusChange={(deal) => upsertDeal(deal)} />}
        {module === "offer" && <OfferIQ deal={selectedDeal} />}
        {module === "portfolio" && <PortfolioIQ deals={deals} onOpen={(id) => { setSelectedId(id); setModule("deal"); }} />}
        {module === "reports" && <Reports deal={selectedDeal} />}
        {module === "account" && <Account isAuthenticated={isAuthenticated} workspaceName={workspaceContext?.workspaceName} onAuthChanged={(userId) => {
          setDeals([]);
          setSelectedId(null);
          setAuthUserId(userId);
          setAuthReady(true);
          setWorkspaceContext(null);
          setWorkspaceStatus(userId ? "loading" : "signed_out");
          setAuthLifecycle(userId ? "bootstrapping" : "signed_out");
          if (userId) anonymousDraftsOnDevice();
          setModule("find");
        }} onSigningOut={() => {
          setAuthLifecycle("signing_out");
          clearProtectedState();
        }} onSignedOut={() => {
          setAuthUserId(null);
          setAuthReady(true);
          setWorkspaceContext(null);
          setWorkspaceStatus("signed_out");
          setAuthLifecycle("signed_out");
          restoreAnonymousDrafts();
          setModule("find");
        }} />}
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
        <button className="primary" onClick={() => window.location.assign("/app")}>Open BRIX</button>
      </section>
      <section className="landing-grid">
        <Step n="1" title="Start with one property" text="Address, listing URL, or listing text. No browsing maze." />
        <Step n="2" title="Choose the strategy" text="Owner occupied, rental, BRRRR, flip, seller finance, refinance, tax, development, and partnership paths." />
        <Step n="3" title="Get decision intelligence" text="Confidence, readiness, missing data, strategy comparison, report export, and next actions." />
      </section>
    </main>
  );
}

function FindIQ({ onCreate }: { onCreate: (deal: DealFacts) => Promise<boolean> }) {
  const [input, setInput] = useState("");
  const [strategyId, setStrategyId] = useState<StrategyId>("owner_occupant");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  async function create() {
    const cleaned = input.trim();
    if (!cleaned) {
      setError("Enter an address, listing URL, or listing text.");
      return;
    }
    setError("");
    setIsCreating(true);
    const deal = createDealFromInput(cleaned, strategyId);
    const created = await onCreate(deal);
    setIsCreating(false);
    if (!created) setError("BRIX could not save this deal. Check your account access and try again.");
  }

  return (
    <section className="two-column">
      <div className="panel hero-panel focus-panel">
        <p className="eyebrow">Start the deal file</p>
        <h2>One property. One strategy. Then BRIX analyzes.</h2>
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
        <button className="primary" onClick={create} disabled={isCreating}><Plus size={18} /> {isCreating ? "Creating deal file" : "Create deal file"}</button>
      </div>
      <div className="panel focus-panel">
        <p className="eyebrow">After create</p>
        <div className="flow-steps">
          <Step n="1" title="Captured facts appear in DealIQ" text="Known listing facts fill the deal file. Unknown facts stay empty and reduce confidence." />
          <Step n="2" title="Strategy rules run immediately" text="The selected strategy controls required inputs, calculations, risks, and success conditions." />
          <Step n="3" title="Decision output is provisional until verified" text="BRIX gives a visit, research-first, or do-not-visit-yet signal with missing data and next actions." />
        </div>
      </div>
    </section>
  );
}

function WorkflowStrip({ active, onSelect }: { active: Module; onSelect: (module: Module) => void }) {
  const steps: Array<{ id: Module; short: string; title: string }> = [
    { id: "find", short: "1", title: "Start" },
    { id: "deal", short: "2", title: "Analyze" },
    { id: "offer", short: "3", title: "Pursue" },
    { id: "pipeline", short: "4", title: "Track" },
    { id: "portfolio", short: "5", title: "Own" },
  ];
  return (
    <div className="workflow-strip" aria-label="BRIX workflow">
      {steps.map((step) => (
        <button key={step.id} className={active === step.id ? "workflow-step active" : "workflow-step"} onClick={() => onSelect(step.id)}>
          <span>{step.short}</span>
          <strong>{step.title}</strong>
        </button>
      ))}
    </div>
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
        <div className="strategy-insight">
          <div>
            <h3>{analysis.strategyInsight.headline}</h3>
            <p className="quiet">{analysis.strategyInsight.explanation}</p>
          </div>
          <div className="stat-row compact">
            <Stat label="Selected" value={analysis.strategyInsight.selected.name} />
            <Stat label="Top fit" value={analysis.strategyInsight.best.name} />
            <Stat label="Gap" value={`${analysis.strategyInsight.scoreGap} pts`} />
          </div>
        </div>
        <div className="score-list">
          {analysis.strategyScores.slice(0, 12).map((score) => (
            <button key={score.strategyId} className={score.strategyId === deal.strategyId ? "score-card selected" : "score-card"} onClick={() => patch({ strategyId: score.strategyId })}>
              <strong>{score.name}</strong>
              <span>{score.recommendation}</span>
              <b>{score.score}</b>
              <small>{score.why[0]}</small>
              {score.risks[0] && <small>Verify: {score.risks[0]}</small>}
            </button>
          ))}
        </div>
        <div className="comparison-detail">
          <ChallengeBlock title="Tradeoffs" items={analysis.strategyInsight.tradeoffs} />
          <ChallengeBlock title="Verify before switching strategy" items={analysis.strategyInsight.verification} />
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

      <section className="panel wide">
        <p className="eyebrow">Decision challenge</p>
        <div className="challenge-grid">
          <ChallengeBlock title="Key risks" items={analysis.keyRisks} />
          <ChallengeBlock title="Bull case" items={analysis.bullCase} />
          <ChallengeBlock title="Bear case" items={analysis.bearCase} />
          <ChallengeBlock title="What must be true" items={analysis.whatMustBeTrue} />
          <ChallengeBlock title="Failure scenarios" items={analysis.failureScenarios} />
          <ChallengeBlock title="Alternatives" items={analysis.alternativeStrategies} />
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
            <strong>{statusLabel(stage)}</strong>
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
      <div className="stat-row">
        <Stat label="Assets" value={String(metrics.count)} />
        <Stat label="Annual net" value={formatCurrency(metrics.annualNet)} />
        <Stat label="Estimated equity" value={formatCurrency(metrics.estimatedEquity)} />
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
  return (
    <section className="panel memo">
      <p className="eyebrow">Decision memo</p>
      <h2>{deal.address}</h2>
      <div className="button-row"><button className="primary" onClick={() => downloadDecisionPdf(deal, analysis)}>Download PDF</button><button className="secondary" onClick={() => downloadWorkbook(deal, analysis)}>Download XLS</button></div>
      <div className="stat-row">
        <Stat label="Recommendation" value={analysis.decision} />
        <Stat label="Confidence" value={`${analysis.confidence}/100`} />
        <Stat label="Readiness" value={`${analysis.readiness}/100`} />
      </div>
      <h3>Financial read</h3>
      <div className="stat-row">
        <Stat label="Monthly payment" value={formatCurrency(analysis.monthlyPayment)} />
        <Stat label="Monthly cash flow" value={formatCurrency(analysis.monthlyCashFlow)} />
        <Stat label="DSCR" value={analysis.dscr ? `${analysis.dscr}x` : "Missing"} />
      </div>
      <h3>Evidence</h3><ul>{analysis.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
      <h3>Missing</h3><ul>{analysis.missing.map((item) => <li key={item}>{item}</li>)}</ul>
      <h3>Strategy comparison</h3>
      <p>{analysis.strategyInsight.headline}</p>
      <ul>{analysis.strategyInsight.tradeoffs.map((item) => <li key={item}>{item}</li>)}</ul>
      <ul>{analysis.strategyScores.slice(0, 8).map((score) => <li key={score.strategyId}>{score.name}: {score.recommendation} ({score.score}/100)</li>)}</ul>
      <h3>Decision challenge</h3>
      <h4>Key risks</h4><ul>{analysis.keyRisks.map((item) => <li key={item}>{item}</li>)}</ul>
      <h4>Bull case</h4><ul>{analysis.bullCase.map((item) => <li key={item}>{item}</li>)}</ul>
      <h4>Bear case</h4><ul>{analysis.bearCase.map((item) => <li key={item}>{item}</li>)}</ul>
      <h4>What must be true</h4><ul>{analysis.whatMustBeTrue.map((item) => <li key={item}>{item}</li>)}</ul>
      <h4>Failure scenarios</h4><ul>{analysis.failureScenarios.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}

function Account({
  isAuthenticated,
  workspaceName,
  onAuthChanged,
  onSigningOut,
  onSignedOut,
}: {
  isAuthenticated: boolean;
  workspaceName?: string;
  onAuthChanged: (userId: string) => void;
  onSigningOut?: () => void;
  onSignedOut?: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"email" | "password" | "fullName", string>>>({});
  const [summary, setSummary] = useState<string[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const authSubmitInFlightRef = useRef(false);

  function resetFeedback() {
    setMessage(null);
    setFieldErrors({});
    setSummary([]);
  }

  async function submitAuth(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (isWorking || authSubmitInFlightRef.current) return;
    const cleanEmail = email.trim();
    const validation = validateAuthInput({ email: cleanEmail, password, fullName }, mode);
    setFieldErrors(validation.fields);
    setSummary(validation.summary);
    setMessage(null);
    if (!validation.isValid) {
      setMessage({ tone: "error", text: "Fix the highlighted fields and try again." });
      window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
      return;
    }
    authSubmitInFlightRef.current = true;
    setIsWorking(true);
    try {
      const response = mode === "sign_in"
        ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
        : await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { full_name: fullName.trim() } },
        });
      const { data, error } = response;
      const userId = data.session?.user?.id;
      if (error) {
        const safe = safeAuthError(error);
        setMessage({ tone: "error", text: safe.message });
      } else if (userId) {
        setMessage({ tone: "success", text: mode === "sign_in" ? "Signed in. Preparing your workspace." : "Account created. Preparing your workspace." });
        onAuthChanged(userId);
      } else {
        setMessage({ tone: "info", text: "Check your email to finish account activation, then sign in." });
      }
    } catch {
      setMessage({ tone: "error", text: safeAuthError(new Error("network failure")).message });
    } finally {
      authSubmitInFlightRef.current = false;
      setIsWorking(false);
    }
  }

  async function signOut() {
    if (isWorking || authSubmitInFlightRef.current) return;
    authSubmitInFlightRef.current = true;
    setIsWorking(true);
    onSigningOut?.();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setMessage({ tone: "success", text: "Signed out." });
      onSignedOut?.();
    } catch {
      setMessage({ tone: "error", text: "BRIX could not sign you out. Check your connection and try again." });
    } finally {
      authSubmitInFlightRef.current = false;
      setIsWorking(false);
    }
  }

  return (
    <section className="auth-stage" aria-labelledby="auth-title">
      <div className="auth-card">
        <div className="auth-copy">
          <p className="eyebrow">Secure BRIX access</p>
          <h2 id="auth-title">{isAuthenticated ? "Account ready" : mode === "sign_in" ? "Sign in to BRIX" : "Create your BRIX account"}</h2>
          <p className="quiet">
            {isAuthenticated
              ? `You are signed in${workspaceName ? ` to ${workspaceName}` : ""}.`
              : "Use one secure account to keep your workspace, deal files, evidence, and decisions separated from local device drafts."}
          </p>
        </div>

        {!isAuthenticated && (
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button type="button" role="tab" aria-selected={mode === "sign_in"} className={mode === "sign_in" ? "active" : ""} onClick={() => { setMode("sign_in"); resetFeedback(); }}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "sign_up"} className={mode === "sign_up" ? "active" : ""} onClick={() => { setMode("sign_up"); resetFeedback(); }}>Create account</button>
          </div>
        )}

        {summary.length > 0 && (
          <div className="auth-summary" role="alert" tabIndex={-1} ref={errorSummaryRef}>
            <AlertTriangle size={18} />
            <div>
              <strong>Check these fields</strong>
              <ul>{summary.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>
        )}

        {message && (
          <div className={`auth-message ${message.tone}`} role={message.tone === "error" ? "alert" : "status"} aria-live="polite">
            {message.tone === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {!isAuthenticated ? (
          <form className="auth-form" onSubmit={submitAuth} noValidate>
            {mode === "sign_up" && (
              <label className="field" htmlFor="auth-full-name">
                <span>Name</span>
                <input id="auth-full-name" autoComplete="name" value={fullName} aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? "auth-full-name-error" : undefined} onChange={(event) => setFullName(event.target.value)} />
                {fieldErrors.fullName && <small className="field-error" id="auth-full-name-error">{fieldErrors.fullName}</small>}
              </label>
            )}
            <label className="field" htmlFor="auth-email">
              <span>Email</span>
              <input id="auth-email" type="email" autoComplete="email" value={email} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "auth-email-error" : undefined} onChange={(event) => setEmail(event.target.value)} />
              {fieldErrors.email && <small className="field-error" id="auth-email-error">{fieldErrors.email}</small>}
            </label>
            <label className="field" htmlFor="auth-password">
              <span>Password</span>
              <span className="password-control">
                <input id="auth-password" value={password} type={showPassword ? "text" : "password"} autoComplete={mode === "sign_in" ? "current-password" : "new-password"} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "auth-password-error" : undefined} onChange={(event) => setPassword(event.target.value)} />
                <button type="button" className="icon-button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </span>
              {fieldErrors.password && <small className="field-error" id="auth-password-error">{fieldErrors.password}</small>}
            </label>
            <button className="primary wide-button" type="submit" disabled={isWorking}>
              {isWorking ? mode === "sign_in" ? "Signing in" : "Creating account" : mode === "sign_in" ? "Sign in to BRIX" : "Create BRIX account"}
            </button>
          </form>
        ) : (
          <div className="auth-actions">
            <button className="secondary" onClick={signOut} disabled={isWorking}><LogOut size={16} /> {isWorking ? "Signing out" : "Sign out"}</button>
          </div>
        )}
      </div>
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

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

function ChallengeBlock({ title, items }: { title: string; items: string[] }) {
  return <article className="challenge-block"><strong>{title}</strong><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></article>;
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
  if (status === "passed" || status === "closed") return status;
  return stages[Math.min(stages.indexOf(status) + 1, stages.length - 1)] ?? "reviewing";
}

function statusLabel(status: DealStatus) {
  const labels: Record<DealStatus, string> = {
    draft: "New",
    reviewing: "Reviewing",
    underwriting: "Underwriting",
    pursuing: "Pursuing",
    under_contract: "Under contract",
    closed: "Closed",
    passed: "Passed",
  };
  return labels[status];
}
