import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Search, BarChart3, FilePenLine, KanbanSquare, Building2, ShieldCheck, UserCircle, Trash2, Camera, Plus, LogOut, FileDown, Table2, MapPinned, Landmark, FileSearch, Eye, EyeOff, AlertTriangle, CheckCircle2, Users, UserMinus, Home, Menu, X, WifiOff, RefreshCw } from "lucide-react";
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
import { requestAccountDeletion } from "./core/authActions";
import { isSessionFailure, safeAuthError, validateAuthInput, type AuthMode } from "./core/authLifecycle";
import {
  acceptWorkspaceInvitation,
  createWorkspaceInvitation,
  invitationTokenFromLocation,
  listWorkspaceInvitations,
  resendWorkspaceInvitation,
  revokeWorkspaceInvitation,
  type WorkspaceInvitation,
  type WorkspaceInvitationRole,
} from "./core/invitations";
import {
  changeWorkspaceMemberRole,
  listWorkspaceAccessMembers,
  listWorkspaceAccessRoles,
  revokeWorkspaceMemberAccess,
  type WorkspaceAccessMember,
  type WorkspaceAccessRole,
} from "./core/workspaceAccess";

type Module = "home" | "deal" | "account";

const nav: Array<{ id: Module; label: string; icon: typeof Search; purpose: string }> = [
  { id: "home", label: "Home", icon: Home, purpose: "Resume your BRIX account" },
  { id: "deal", label: "Deals", icon: BarChart3, purpose: "Review saved deal work" },
  { id: "account", label: "Settings", icon: UserCircle, purpose: "Account and access" },
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
    app: "home",
    dashboard: "home",
    home: "home",
    findiq: "home",
    dealiq: "deal",
    deals: "deal",
    contractiq: "home",
    pipelineiq: "home",
    offeriq: "home",
    portfolioiq: "home",
    reports: "home",
    account: "account",
    settings: "account",
  };
  return aliases[raw] ?? "home";
}

function pathForModule(module: Module) {
  const paths: Record<Module, string> = {
    home: "/app",
    deal: "/deals",
    account: "/account",
  };
  return paths[module];
}

function BrixApp() {
  const [module, setModuleState] = useState<Module>(() => moduleFromPath());
  const [navOpen, setNavOpen] = useState(false);
  const [deals, setDeals] = useState<DealFacts[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [hasAnonymousDrafts, setHasAnonymousDrafts] = useState(false);
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState<"loading" | "ready" | "failed" | "signed_out">("loading");
  const [authLifecycle, setAuthLifecycle] = useState<"restoring" | "signed_out" | "bootstrapping" | "ready" | "failed" | "signing_out" | "expired">("restoring");
  const [passwordRecoveryActive, setPasswordRecoveryActive] = useState(() => new URLSearchParams(window.location.search).get("flow") === "reset-password");
  const [invitationToken, setInvitationToken] = useState<string | null>(() => invitationTokenFromLocation());
  const [invitationMessage, setInvitationMessage] = useState<string | null>(null);
  const [workspaceRetryKey, setWorkspaceRetryKey] = useState(0);
  const recentCloudCreatesRef = useRef<Map<string, { ownerId: string; deal: DealFacts }>>(new Map());
  const mainContentRef = useRef<HTMLElement>(null);
  const didRenderInitialModuleRef = useRef(false);
  const isOnline = useOnlineStatus();
  const isAuthenticated = Boolean(authUserId);
  const selectedDeal = deals.find((deal) => deal.id === selectedId) ?? deals[0];

  useEffect(() => {
    const safePath = pathForModule(moduleFromPath());
    if (window.location.pathname !== safePath) {
      window.history.replaceState({}, "", `${safePath}${window.location.search}${window.location.hash}`);
    }
  }, []);

  function setModule(next: Module) {
    setModuleState(next);
    setNavOpen(false);
    const nextPath = pathForModule(next);
    if (window.location.pathname !== nextPath) window.history.pushState({}, "", nextPath);
  }

  useEffect(() => {
    if (!didRenderInitialModuleRef.current) {
      didRenderInitialModuleRef.current = true;
      return;
    }
    mainContentRef.current?.focus({ preventScroll: true });
  }, [module]);

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

  const restoreRecentCloudCreates = useCallback((userId: string) => {
    const recentDealsForUser = Array.from(recentCloudCreatesRef.current.values())
      .filter((entry) => entry.ownerId === userId)
      .map((entry) => entry.deal);
    if (recentDealsForUser.length === 0) return;
    setDeals((current) => {
      const currentIds = new Set(current.map((deal) => deal.id));
      return [...recentDealsForUser.filter((deal) => !currentIds.has(deal.id)), ...current];
    });
    setSelectedId((currentId) => currentId ?? recentDealsForUser[0]?.id ?? null);
  }, []);

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

  function clearInvitationFromUrl() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("invite")) return;
    url.searchParams.delete("invite");
    const nextSearch = url.searchParams.toString();
    window.history.replaceState({}, "", `${url.pathname}${nextSearch ? `?${nextSearch}` : ""}`);
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
          restoreRecentCloudCreates(userId);
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
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id ?? null;
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecoveryActive(true);
        setModule("account");
      }
      if (window.location.pathname === "/account") setInvitationToken(invitationTokenFromLocation());
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
        restoreRecentCloudCreates(userId);
      }
    });
    return () => {
      window.removeEventListener("popstate", onPopState);
      listener.subscription.unsubscribe();
    };
  }, [anonymousDraftsOnDevice, clearProtectedState, restoreAnonymousDrafts, restoreRecentCloudCreates]);

  useEffect(() => {
    if (!authUserId) return;
    let isCurrent = true;
    clearProtectedState();
    setWorkspaceContext(null);
    setWorkspaceStatus("loading");
    setAuthLifecycle("bootstrapping");
    const pendingInvitationToken = invitationToken;
    (async () => {
      if (pendingInvitationToken) {
        await acceptWorkspaceInvitation(pendingInvitationToken);
        setInvitationToken(null);
        clearInvitationFromUrl();
        setInvitationMessage("Trusted access accepted.");
      }
      return ensureWorkspaceContext();
    })()
      .then((context) => {
        if (!isCurrent) return [];
        setWorkspaceContext(context);
        setWorkspaceStatus("ready");
        setAuthLifecycle("ready");
        return loadRemoteDeals(authUserId);
      })
      .then((remoteDeals) => {
        if (!isCurrent) return;
        const recentDealsForUser = Array.from(recentCloudCreatesRef.current.values())
          .filter((entry) => entry.ownerId === authUserId)
          .map((entry) => entry.deal);
        setDeals((current) => {
          const remoteIds = new Set(remoteDeals.map((deal) => deal.id));
          const inFlightCreatedDeals = [
            ...recentDealsForUser,
            ...current,
          ].filter((deal, index, allDeals) => !remoteIds.has(deal.id) && allDeals.findIndex((item) => item.id === deal.id) === index);
          return [...inFlightCreatedDeals, ...remoteDeals];
        });
        setSelectedId((currentId) => currentId ?? recentDealsForUser[0]?.id ?? remoteDeals[0]?.id ?? null);
        setSyncMessage(null);
      })
      .catch((error) => {
        if (!isCurrent) return;
        if (isSessionFailure(error)) {
          void supabase.auth.signOut();
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
        setSyncMessage(pendingInvitationToken ? safeAuthError(error).message : safeAuthError(error).message);
      });
    return () => {
      isCurrent = false;
    };
  }, [authUserId, clearProtectedState, invitationToken, restoreAnonymousDrafts, workspaceRetryKey]);

  async function createDeal(deal: DealFacts) {
    try {
      let effectiveUserId = authUserId;
      if (!authReady) {
        const { data } = await supabase.auth.getSession();
        effectiveUserId = data.session?.user?.id ?? null;
        setAuthUserId(effectiveUserId);
        setAuthReady(true);
        if (effectiveUserId) {
          setAuthLifecycle("bootstrapping");
          setWorkspaceStatus("loading");
          anonymousDraftsOnDevice();
        } else {
          setAuthLifecycle("signed_out");
        }
      }
      if (effectiveUserId) {
        await prepareWorkspaceForCloudAction();
      }
      const confirmedDeal = effectiveUserId ? await persistRemoteDeal(deal, effectiveUserId) : deal;
      if (effectiveUserId) recentCloudCreatesRef.current.set(confirmedDeal.id, { ownerId: effectiveUserId, deal: confirmedDeal });
      if (!effectiveUserId) {
        const savedDeals = [confirmedDeal, ...loadAnonymousDeals().filter((item) => item.id !== confirmedDeal.id)];
        saveAnonymousDeals(savedDeals);
      }
      setDeals((current) => {
        const next = [confirmedDeal, ...current.filter((item) => item.id !== confirmedDeal.id)];
        return next;
      });
      setSelectedId(confirmedDeal.id);
      if (!effectiveUserId) setHasAnonymousDrafts(true);
      setSyncMessage(effectiveUserId ? null : "Deal created on this device. Sign in from Settings to keep it across devices.");
      setModule("deal");
      return true;
    } catch (error) {
      setSyncMessage(`Deal was not created: ${error instanceof Error ? error.message : "cloud save failed."}`);
      setModule("home");
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
      setSyncMessage("Deal updated on this device. Sign in from Settings to keep it across devices.");
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
    <div className={navOpen ? "app-shell shell-nav-open" : "app-shell"}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="rail">
        <div className="rail-header">
          <div className="brand">
            <div className="mark" aria-hidden="true"><span /><span /><span /><span /></div>
            <div>
              <strong>BRIX</strong>
              <small>Real Estate</small>
            </div>
          </div>
          <button className="nav-toggle" type="button" aria-expanded={navOpen} aria-controls="primary-nav" onClick={() => setNavOpen((open) => !open)}>
            {navOpen ? <X size={18} /> : <Menu size={18} />}
            <span>Menu</span>
          </button>
        </div>
        <nav id="primary-nav" aria-label="Primary">
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

      <main id="main-content" className="workspace" tabIndex={-1} ref={mainContentRef}>
        <header className="topbar">
          <div className="page-title">
            <p className="eyebrow">BRIX Real Estate</p>
            <h1>{titleFor(module)}</h1>
          </div>
          {isAuthenticated && (
            <div className={workspaceStatus === "failed" ? "workspace-pill danger" : "workspace-pill"}>
              <span>My BRIX</span>
              <strong>{workspaceContext?.workspaceName ?? "Personal account"}</strong>
            </div>
          )}
          {module === "deal" && <DealSwitcher deals={deals} selectedId={selectedDeal?.id} onSelect={setSelectedId} />}
        </header>

        {!isOnline && (
          <ShellNotice tone="warning" title="Offline" icon={<WifiOff size={18} />}>
            BRIX can keep the shell open, but cloud account and deal updates need a connection.
          </ShellNotice>
        )}
        {!authReady && (
          <ShellNotice tone="info" title="Restoring session">
            BRIX is checking whether this browser already has a valid account session.
          </ShellNotice>
        )}
        {syncMessage && (
          <ShellNotice tone={isAuthenticated ? "danger" : "info"} title={authLifecycle === "expired" ? "Sign in required" : isAuthenticated ? "Account needs attention" : "Account"}>
            {syncMessage}
          </ShellNotice>
        )}
        {invitationMessage && (
          <ShellNotice tone="success" title="Invitation accepted">{invitationMessage}</ShellNotice>
        )}
        {isAuthenticated && hasAnonymousDrafts && (
          <ShellNotice tone="info" title="Local drafts">
            <span>Local drafts are saved on this device and are not part of your BRIX account.</span>
            <span>Sign out to view local drafts.</span>
          </ShellNotice>
        )}
        {module === "home" && <HomeSurface isAuthenticated={isAuthenticated} authLifecycle={authLifecycle} workspaceStatus={workspaceStatus} deals={deals} selectedDeal={selectedDeal} onOpenDeal={() => setModule("deal")} onOpenSettings={() => setModule("account")} onRetry={retryWorkspaceBootstrap} />}
        {module === "deal" && <DealIQ deal={selectedDeal} onChange={upsertDeal} onDelete={deleteDeal} />}
        {module === "account" && <Account isAuthenticated={isAuthenticated} workspaceContext={workspaceContext} invitationToken={invitationToken} recoveryActive={passwordRecoveryActive} onAuthChanged={(userId) => {
          setDeals([]);
          setSelectedId(null);
          setAuthUserId(userId);
          setAuthReady(true);
          setWorkspaceContext(null);
          setWorkspaceStatus(userId ? "loading" : "signed_out");
          setAuthLifecycle(userId ? "bootstrapping" : "signed_out");
          if (userId) anonymousDraftsOnDevice();
          setModule("home");
        }} onRecoveryCompleted={() => {
          setPasswordRecoveryActive(false);
          if (window.location.pathname === "/account" && window.location.search) {
            window.history.replaceState({}, "", "/account");
          }
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
          setModule("home");
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

function HomeSurface({
  isAuthenticated,
  authLifecycle,
  workspaceStatus,
  deals,
  selectedDeal,
  onOpenDeal,
  onOpenSettings,
  onRetry,
}: {
  isAuthenticated: boolean;
  authLifecycle: "restoring" | "signed_out" | "bootstrapping" | "ready" | "failed" | "signing_out" | "expired";
  workspaceStatus: "loading" | "ready" | "failed" | "signed_out";
  deals: DealFacts[];
  selectedDeal?: DealFacts;
  onOpenDeal: () => void;
  onOpenSettings: () => void;
  onRetry: () => void;
}) {
  const hasDeals = deals.length > 0;
  const isPreparing = authLifecycle === "restoring" || authLifecycle === "bootstrapping" || workspaceStatus === "loading";

  if (workspaceStatus === "failed") {
    return (
      <RecoverableState
        title="Account setup needs attention"
        text="BRIX could not finish loading your account context. Retry before relying on cloud deal data."
        actionLabel="Retry setup"
        onRetry={onRetry}
      />
    );
  }

  return (
    <section className="home-surface">
      <div className="panel hero-panel home-hero">
        <StatusBadge tone={isAuthenticated ? "success" : "neutral"}>{isAuthenticated ? "Account ready" : "Local mode"}</StatusBadge>
        <h2>{isAuthenticated ? "Your BRIX account is ready." : "Use BRIX locally or sign in when you want cloud continuity."}</h2>
        <p className="quiet">
          {isAuthenticated
            ? "The shell is ready for verified Deal work. BRIX will only show account and Deal information that exists in your saved records."
            : "Local drafts stay on this device until you sign in. Cloud Deals remain separated from local drafts."}
        </p>
        <div className="button-row">
          {hasDeals && <button className="primary" onClick={onOpenDeal}><BarChart3 size={18} /> Open Deals</button>}
          <button className="secondary" onClick={onOpenSettings}><UserCircle size={18} /> {isAuthenticated ? "Account settings" : "Sign in"}</button>
        </div>
      </div>

      {isPreparing && (
        <ShellNotice tone="info" title="Preparing account">
          BRIX is restoring the secure account and workspace context before showing cloud Deal information.
        </ShellNotice>
      )}

      {hasDeals ? (
        <section className="panel">
          <p className="eyebrow">Saved Deal</p>
          <h2>{selectedDeal?.address || "Untitled property"}</h2>
          <p className="quiet">Open the saved Deal workspace to review facts, assumptions, strategy fit, and verification needs.</p>
          <button className="primary" onClick={onOpenDeal}>Open Deals</button>
        </section>
      ) : (
        <EmptyState
          title="No saved Deals yet"
          text="Saved Deal work appears here after a Deal is created or imported. The shell only shows records that exist in your account or on this device."
          actionLabel={isAuthenticated ? "Review account settings" : "Sign in"}
          onAction={onOpenSettings}
        />
      )}

      <section className="state-grid" aria-label="Shell state coverage">
        <StatePrimitive title="Loading" text="Session and account context show explicit progress." />
        <StatePrimitive title="Empty" text="No saved records means no invented metrics." />
        <StatePrimitive title="Offline" text="Connection loss is visible before cloud actions." />
        <StatePrimitive title="Recoverable" text="Retry actions are shown when setup can be retried." />
        <StatePrimitive title="Permission" text="Access changes fail closed and clear protected state." />
        <StatePrimitive title="Stale" text="Stale or partial data must be labeled before decisions rely on it." />
      </section>
    </section>
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
    { id: "home", short: "1", title: "Home" },
    { id: "deal", short: "2", title: "Deals" },
    { id: "account", short: "3", title: "Settings" },
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
  workspaceContext,
  invitationToken,
  recoveryActive,
  onAuthChanged,
  onRecoveryCompleted,
  onSigningOut,
  onSignedOut,
}: {
  isAuthenticated: boolean;
  workspaceContext?: WorkspaceContext | null;
  invitationToken?: string | null;
  recoveryActive?: boolean;
  onAuthChanged: (userId: string) => void;
  onRecoveryCompleted?: () => void;
  onSigningOut?: () => void;
  onSignedOut?: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>(() => recoveryActive ? "reset_complete" : "sign_in");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"email" | "currentPassword" | "password" | "passwordConfirm" | "fullName", string>>>({});
  const [summary, setSummary] = useState<string[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState<WorkspaceInvitationRole>("viewer");
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [invitationResult, setInvitationResult] = useState<WorkspaceInvitation | null>(null);
  const [invitationError, setInvitationError] = useState("");
  const [invitationStatus, setInvitationStatus] = useState("");
  const [isInvitationWorking, setIsInvitationWorking] = useState(false);
  const [isDeletionWorking, setIsDeletionWorking] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState("");
  const [deletionError, setDeletionError] = useState("");
  const [accessRoles, setAccessRoles] = useState<WorkspaceAccessRole[]>([]);
  const [accessMembers, setAccessMembers] = useState<WorkspaceAccessMember[]>([]);
  const [accessStatus, setAccessStatus] = useState<"idle" | "loading" | "ready" | "permission_denied" | "offline" | "failed">("idle");
  const [accessMessage, setAccessMessage] = useState("");
  const [accessError, setAccessError] = useState("");
  const [workingMembershipId, setWorkingMembershipId] = useState<string | null>(null);
  const [selectedRoleByMembership, setSelectedRoleByMembership] = useState<Record<string, string>>({});
  const [showTrustedAccess, setShowTrustedAccess] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const authSubmitInFlightRef = useRef(false);
  const canUseTrustedAccess = isAuthenticated && Boolean(workspaceContext?.workspaceId);
  const canInvite = isAuthenticated && Boolean(workspaceContext?.workspaceId) && (workspaceContext?.roleId === "owner" || workspaceContext?.roleId === "admin");
  const activeCollaborators = accessMembers.filter((member) => member.status === "active" && member.roleId !== "owner");
  const ownerMember = accessMembers.find((member) => member.roleId === "owner");
  const pendingInvitations = invitations.filter((invitation) => invitation.status === "pending");

  useEffect(() => {
    if (!recoveryActive) return;
    setMode("reset_complete");
    setCurrentPassword("");
    setPassword("");
    setPasswordConfirm("");
    resetFeedback();
  }, [recoveryActive]);

  useEffect(() => {
    if (!showTrustedAccess || !canInvite || !workspaceContext?.workspaceId) {
      setInvitations([]);
      return;
    }
    let isCurrent = true;
    listWorkspaceInvitations(workspaceContext.workspaceId)
      .then((items) => {
        if (isCurrent) setInvitations(items);
      })
      .catch(() => {
        if (isCurrent) setInvitationError("BRIX could not load current trusted invitations.");
      });
    return () => {
      isCurrent = false;
    };
  }, [canInvite, showTrustedAccess, workspaceContext?.workspaceId]);

  const loadWorkspaceAccess = useCallback(async (shouldUpdate: () => boolean = () => true) => {
    if (!workspaceContext?.workspaceId) return;
    setAccessStatus("loading");
    setAccessError("");
    try {
      const [roles, members] = await Promise.all([
        listWorkspaceAccessRoles(),
        listWorkspaceAccessMembers(workspaceContext.workspaceId),
      ]);
      if (!shouldUpdate()) return;
      setAccessRoles(roles);
      setAccessMembers(members);
      setSelectedRoleByMembership(Object.fromEntries(members.map((member) => [member.membershipId, member.roleId])));
      if (roles.some((role) => role.id === "viewer")) setInviteRoleId("viewer");
      else if (roles[0]) setInviteRoleId(roles[0].id);
      setAccessStatus("ready");
    } catch (error) {
      if (!shouldUpdate()) return;
      const safe = safeAuthError(error);
      setAccessStatus(safe.kind === "offline" ? "offline" : safe.kind === "session_expired" ? "permission_denied" : "failed");
      setAccessError(safe.kind === "offline"
        ? safe.message
        : safe.kind === "session_expired"
          ? "Your access changed. Sign in again to refresh your account."
          : "BRIX could not load trusted access. Retry when your connection is stable.");
    }
  }, [workspaceContext?.workspaceId]);

  useEffect(() => {
    if (!showTrustedAccess || !isAuthenticated || !workspaceContext?.workspaceId) {
      setAccessRoles([]);
      setAccessMembers([]);
      setSelectedRoleByMembership({});
      setAccessStatus("idle");
      return;
    }
    let isCurrent = true;
    loadWorkspaceAccess(() => isCurrent);
    return () => {
      isCurrent = false;
    };
  }, [isAuthenticated, loadWorkspaceAccess, showTrustedAccess, workspaceContext?.workspaceId]);

  useEffect(() => {
    if (!canUseTrustedAccess) setShowTrustedAccess(false);
  }, [canUseTrustedAccess]);

  function resetFeedback() {
    setMessage(null);
    setFieldErrors({});
    setSummary([]);
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setCurrentPassword("");
    setPassword("");
    setPasswordConfirm("");
    resetFeedback();
  }

  function recoveryRedirectUrl() {
    return `${window.location.origin}/account?flow=reset-password`;
  }

  async function submitInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!workspaceContext?.workspaceId || isInvitationWorking) return;
    setInvitationError("");
    setInvitationStatus("");
    setInvitationResult(null);
    if (!inviteEmail.trim()) {
      setInvitationError("Enter the teammate email to invite.");
      return;
    }
    setIsInvitationWorking(true);
    try {
      const invitation = await createWorkspaceInvitation(workspaceContext.workspaceId, inviteEmail, inviteRoleId);
      setInvitationResult(invitation);
      if (invitation.status === "already_member") {
        setInvitationError("That email already has access to this BRIX account.");
      } else {
        setInviteEmail("");
        const current = await listWorkspaceInvitations(workspaceContext.workspaceId);
        setInvitations(current);
      }
    } catch (error) {
      setInvitationError(safeAuthError(error).message);
    } finally {
      setIsInvitationWorking(false);
    }
  }

  async function resendInvitation(invitationId: string) {
    if (!workspaceContext?.workspaceId || isInvitationWorking) return;
    setInvitationError("");
    setInvitationStatus("");
    setInvitationResult(null);
    setIsInvitationWorking(true);
    try {
      const invitation = await resendWorkspaceInvitation(invitationId);
      setInvitationResult(invitation);
      const current = await listWorkspaceInvitations(workspaceContext.workspaceId);
      setInvitations(current);
    } catch (error) {
      setInvitationError(safeAuthError(error).message);
    } finally {
      setIsInvitationWorking(false);
    }
  }

  async function revokeInvitation(invitationId: string) {
    if (!workspaceContext?.workspaceId || isInvitationWorking) return;
    setInvitationError("");
    setInvitationStatus("");
    setInvitationResult(null);
    setIsInvitationWorking(true);
    try {
      await revokeWorkspaceInvitation(invitationId);
      const current = await listWorkspaceInvitations(workspaceContext.workspaceId);
      setInvitations(current);
      setInvitationStatus("Invitation revoked.");
    } catch (error) {
      setInvitationError(safeAuthError(error).message);
    } finally {
      setIsInvitationWorking(false);
    }
  }

  async function changeAccessRole(member: WorkspaceAccessMember) {
    if (workingMembershipId) return;
    const nextRoleId = selectedRoleByMembership[member.membershipId] ?? member.roleId;
    if (nextRoleId === member.roleId) {
      setAccessMessage("No access-level change is needed.");
      return;
    }
    const role = accessRoles.find((item) => item.id === nextRoleId);
    const memberLabel = member.fullName || member.email || "this collaborator";
    const confirmed = window.confirm(`Change ${memberLabel}'s access level to ${role?.name ?? nextRoleId}?`);
    if (!confirmed) return;
    setWorkingMembershipId(member.membershipId);
    setAccessError("");
    setAccessMessage("");
    try {
      await changeWorkspaceMemberRole(member.membershipId, nextRoleId, member.updatedAt);
      setAccessMessage("Access level updated.");
      await loadWorkspaceAccess();
    } catch (error) {
      setAccessError(workspaceAccessError(error));
    } finally {
      setWorkingMembershipId(null);
    }
  }

  async function removeAccess(member: WorkspaceAccessMember) {
    if (workingMembershipId) return;
    const memberLabel = member.fullName || member.email || "this collaborator";
    const confirmed = window.confirm(`Remove BRIX access for ${memberLabel}? They will no longer be able to view this account.`);
    if (!confirmed) return;
    setWorkingMembershipId(member.membershipId);
    setAccessError("");
    setAccessMessage("");
    try {
      await revokeWorkspaceMemberAccess(member.membershipId, member.updatedAt);
      setAccessMessage("Trusted access removed.");
      await loadWorkspaceAccess();
    } catch (error) {
      setAccessError(workspaceAccessError(error));
    } finally {
      setWorkingMembershipId(null);
    }
  }

  async function recordPasswordSecurityEvent() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;
      await supabase.from("audit_events").insert({
        actor_id: userId,
        action: "account.password_updated",
        target_table: "profiles",
        target_id: userId,
        metadata: { source_client: "web" },
      });
      await supabase.from("domain_events").insert({
        actor_id: userId,
        event_type: "account.password_updated",
        payload: { source_client: "web" },
      });
    } catch {
      // Password changes remain owned by Supabase Auth; audit write failure must not expose internals to the user.
    }
  }

  async function submitPasswordResetRequest() {
    if (isWorking || authSubmitInFlightRef.current) return;
    const cleanEmail = email.trim();
    const validation = validateAuthInput({ email: cleanEmail, password: "" }, "reset_request");
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
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: recoveryRedirectUrl() });
      if (error) {
        const safe = safeAuthError(error);
        setMessage({ tone: "error", text: safe.message });
      } else {
        setMessage({ tone: "success", text: "If that email has a BRIX account, a password reset link has been sent." });
      }
    } catch {
      setMessage({ tone: "error", text: safeAuthError(new Error("network failure")).message });
    } finally {
      authSubmitInFlightRef.current = false;
      setIsWorking(false);
    }
  }

  async function submitPasswordUpdate() {
    if (isWorking || authSubmitInFlightRef.current) return;
    const validation = validateAuthInput({ email: "", password, passwordConfirm }, "reset_complete");
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
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        const safe = safeAuthError(error);
        setMessage({ tone: "error", text: safe.kind === "session_expired" ? "This reset link is expired or already used. Request a new password reset link." : safe.message });
      } else {
        await recordPasswordSecurityEvent();
        setPassword("");
        setPasswordConfirm("");
        setMessage({ tone: "success", text: "Password updated. Your BRIX account is ready." });
        onRecoveryCompleted?.();
        if (data.user?.id) onAuthChanged(data.user.id);
      }
    } catch (error) {
      const safe = safeAuthError(error);
      setMessage({ tone: "error", text: safe.kind === "network" ? safe.message : "This reset link could not be used. Request a new password reset link." });
    } finally {
      authSubmitInFlightRef.current = false;
      setIsWorking(false);
    }
  }

  async function submitAuthenticatedPasswordChange() {
    if (isWorking || authSubmitInFlightRef.current) return;
    const validation = validateAuthInput({ email: "", currentPassword, password, passwordConfirm }, "change_password");
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
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const accountEmail = userData.user?.email;
      if (userError || !accountEmail) {
        setMessage({ tone: "error", text: "Sign in again before changing your password." });
        return;
      }

      const { error: reauthError } = await supabase.auth.signInWithPassword({ email: accountEmail, password: currentPassword });
      if (reauthError) {
        const safe = safeAuthError(reauthError);
        setMessage({ tone: "error", text: safe.kind === "invalid_credentials" ? "Current password is incorrect." : safe.message });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        const safe = safeAuthError(error);
        setMessage({ tone: "error", text: safe.kind === "session_expired" ? "Your session has expired. Sign in again before changing your password." : safe.message });
        return;
      }

      await recordPasswordSecurityEvent();
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirm("");
      setMode("sign_in");
      setMessage({ tone: "success", text: "Password updated." });
    } catch (error) {
      const safe = safeAuthError(error);
      setMessage({ tone: "error", text: safe.message });
    } finally {
      authSubmitInFlightRef.current = false;
      setIsWorking(false);
    }
  }

  async function submitAuth(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (mode === "reset_request") {
      await submitPasswordResetRequest();
      return;
    }
    if (mode === "reset_complete") {
      await submitPasswordUpdate();
      return;
    }
    if (mode === "change_password") {
      await submitAuthenticatedPasswordChange();
      return;
    }
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
        setMessage({ tone: "success", text: mode === "sign_in" ? "Signed in. Preparing your account." : "Account created. Preparing your account." });
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

  async function submitAccountDeletionRequest() {
    if (!isAuthenticated || isDeletionWorking) return;
    setDeletionError("");
    setDeletionStatus("");
    setIsDeletionWorking(true);
    try {
      const result = await requestAccountDeletion();
      const requestedAt = result.requestedAt ? formatShortDate(result.requestedAt) : "today";
      setDeletionStatus(`Account deletion request ${result.status}. Requested ${requestedAt}.`);
    } catch (error) {
      const safe = safeAuthError(error);
      setDeletionError(safe.kind === "session_expired" ? "Sign in again before requesting account deletion." : safe.message);
    } finally {
      setIsDeletionWorking(false);
    }
  }

  return (
    <section className="auth-stage" aria-labelledby="auth-title">
      <div className="auth-card">
        <div className="auth-copy">
          <p className="eyebrow">Secure BRIX access</p>
          <h2 id="auth-title">{mode === "change_password" ? "Change password" : isAuthenticated && mode !== "reset_complete" ? "My Account" : mode === "sign_up" ? "Create your BRIX account" : mode === "reset_request" ? "Reset your password" : mode === "reset_complete" ? "Set a new password" : "Sign in to BRIX"}</h2>
          <p className="quiet">
            {mode === "change_password"
              ? "Confirm your current password, then choose a new one."
              : mode === "reset_request"
              ? "Enter your account email. BRIX will send a secure reset link if the account exists."
              : mode === "reset_complete"
                ? "Choose a new password for your BRIX account."
                : isAuthenticated
              ? "You are signed in. Your deal files, evidence, and decisions stay tied to your BRIX account."
              : "Use one secure account to keep your deal files, evidence, and decisions separated from local device drafts."}
          </p>
        </div>

        {invitationToken && !isAuthenticated && (
          <div className="auth-message info" role="status">
            <CheckCircle2 size={18} />
            <span>Sign in or create an account with the invited email address to accept trusted access.</span>
          </div>
        )}

        {!isAuthenticated && mode !== "reset_complete" && (
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button type="button" role="tab" aria-selected={mode === "sign_in"} className={mode === "sign_in" ? "active" : ""} onClick={() => changeMode("sign_in")}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "sign_up"} className={mode === "sign_up" ? "active" : ""} onClick={() => changeMode("sign_up")}>Create account</button>
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

        {!isAuthenticated || mode === "reset_complete" || mode === "change_password" ? (
          <form className="auth-form" onSubmit={submitAuth} noValidate>
            {mode === "sign_up" && (
              <label className="field" htmlFor="auth-full-name">
                <span>Name</span>
                <input id="auth-full-name" autoComplete="name" value={fullName} aria-invalid={Boolean(fieldErrors.fullName)} aria-describedby={fieldErrors.fullName ? "auth-full-name-error" : undefined} onChange={(event) => setFullName(event.target.value)} />
                {fieldErrors.fullName && <small className="field-error" id="auth-full-name-error">{fieldErrors.fullName}</small>}
              </label>
            )}
            {mode !== "reset_complete" && mode !== "change_password" && (
              <label className="field" htmlFor="auth-email">
                <span>Email</span>
                <input id="auth-email" type="email" autoComplete="email" value={email} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "auth-email-error" : undefined} onChange={(event) => setEmail(event.target.value)} />
                {fieldErrors.email && <small className="field-error" id="auth-email-error">{fieldErrors.email}</small>}
              </label>
            )}
            {mode === "change_password" && (
              <label className="field" htmlFor="auth-current-password">
                <span>Current password</span>
                <input id="auth-current-password" value={currentPassword} type="password" autoComplete="current-password" aria-invalid={Boolean(fieldErrors.currentPassword)} aria-describedby={fieldErrors.currentPassword ? "auth-current-password-error" : undefined} onChange={(event) => setCurrentPassword(event.target.value)} />
                {fieldErrors.currentPassword && <small className="field-error" id="auth-current-password-error">{fieldErrors.currentPassword}</small>}
              </label>
            )}
            {mode !== "reset_request" && (
              <label className="field" htmlFor="auth-password">
                <span>{mode === "reset_complete" || mode === "change_password" ? "New password" : "Password"}</span>
                <span className="password-control">
                  <input id="auth-password" value={password} type={showPassword ? "text" : "password"} autoComplete={mode === "sign_in" ? "current-password" : "new-password"} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "auth-password-error" : undefined} onChange={(event) => setPassword(event.target.value)} />
                  <button type="button" className="icon-button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </span>
                {fieldErrors.password && <small className="field-error" id="auth-password-error">{fieldErrors.password}</small>}
              </label>
            )}
            {(mode === "reset_complete" || mode === "change_password") && (
              <label className="field" htmlFor="auth-password-confirm">
                <span>Confirm new password</span>
                <input id="auth-password-confirm" value={passwordConfirm} type={showPassword ? "text" : "password"} autoComplete="new-password" aria-invalid={Boolean(fieldErrors.passwordConfirm)} aria-describedby={fieldErrors.passwordConfirm ? "auth-password-confirm-error" : undefined} onChange={(event) => setPasswordConfirm(event.target.value)} />
                {fieldErrors.passwordConfirm && <small className="field-error" id="auth-password-confirm-error">{fieldErrors.passwordConfirm}</small>}
              </label>
            )}
            <button className="primary wide-button" type="submit" disabled={isWorking}>
              {isWorking
                ? mode === "sign_in" ? "Signing in" : mode === "sign_up" ? "Creating account" : mode === "reset_request" ? "Sending reset link" : "Updating password"
                : mode === "sign_in" ? "Sign in to BRIX" : mode === "sign_up" ? "Create BRIX account" : mode === "reset_request" ? "Send reset link" : "Update password"}
            </button>
            {mode === "sign_in" && (
              <button className="link-button" type="button" onClick={() => changeMode("reset_request")}>Forgot password?</button>
            )}
            {mode === "reset_request" && (
              <button className="link-button" type="button" onClick={() => changeMode("sign_in")}>Back to sign in</button>
            )}
            {mode === "change_password" && (
              <button className="link-button" type="button" onClick={() => changeMode("sign_in")}>Cancel</button>
            )}
          </form>
        ) : (
          <div className="account-ready-actions">
            <div className="auth-actions">
              <button className="secondary" onClick={() => changeMode("change_password")} disabled={isWorking}>Change password</button>
              <button className="secondary" onClick={signOut} disabled={isWorking}><LogOut size={16} /> {isWorking ? "Signing out" : "Sign out"}</button>
            </div>
            {canUseTrustedAccess && (
              <section className="trusted-access-entry" aria-labelledby="trusted-access-entry-title">
                <div>
                  <p className="eyebrow">Optional sharing</p>
                  <h3 id="trusted-access-entry-title">Trusted Access</h3>
                  <p className="quiet">Share BRIX only when a spouse, partner, advisor, or assistant needs access to your deal work.</p>
                </div>
                <button className="secondary" type="button" onClick={() => setShowTrustedAccess((current) => !current)}>
                  {showTrustedAccess ? "Hide Trusted Access" : "Open Trusted Access"}
                </button>
              </section>
            )}
            <section className="account-danger-zone" aria-labelledby="account-deletion-title">
              <div>
                <p className="eyebrow">Account deletion</p>
                <h3 id="account-deletion-title">Delete account request</h3>
                <p className="quiet">Request deletion of your BRIX account and personal account data. Deal, audit, or legal records may be retained only where required.</p>
              </div>
              <button className="secondary danger-button" type="button" onClick={submitAccountDeletionRequest} disabled={isDeletionWorking}>
                <Trash2 size={16} /> {isDeletionWorking ? "Recording request" : "Request account deletion"}
              </button>
              {deletionStatus && <p className="success" role="status">{deletionStatus}</p>}
              {deletionError && <p className="error" role="alert">{deletionError}</p>}
            </section>
          </div>
        )}

        {showTrustedAccess && isAuthenticated && workspaceContext?.workspaceId && (
          <section className="access-panel" aria-labelledby="trusted-access-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Trusted access</p>
                <h3 id="trusted-access-title">People with access</h3>
                <p className="quiet">Give trusted people only the access level they need.</p>
              </div>
              <button className="secondary compact-button" type="button" onClick={() => loadWorkspaceAccess()} disabled={accessStatus === "loading" || Boolean(workingMembershipId)}>
                {accessStatus === "loading" ? "Loading" : "Retry"}
              </button>
            </div>

            {accessStatus === "loading" && <p className="quiet" role="status">Loading trusted access.</p>}
            {accessStatus === "offline" && <p className="error">{accessError}</p>}
            {accessStatus === "permission_denied" && <p className="error">{accessError}</p>}
            {accessStatus === "failed" && <p className="error">{accessError}</p>}
            {accessMessage && <p className="success">{accessMessage}</p>}
            {accessError && accessStatus === "ready" && <p className="error">{accessError}</p>}

            {ownerMember && (
              <article className="access-owner-card">
                <ShieldCheck size={18} />
                <div>
                  <strong>{ownerMember.fullName || ownerMember.email || "Account owner"}</strong>
                  <span>Owner access cannot be removed or changed here.</span>
                </div>
              </article>
            )}

            {accessStatus === "ready" && activeCollaborators.length === 0 && (
              <div className="empty-mini">
                <Users size={22} />
                <strong>No collaborators yet</strong>
                <span>Invite a trusted partner, advisor, or assistant when you are ready to share BRIX.</span>
              </div>
            )}

            {activeCollaborators.length > 0 && (
              <div className="access-list">
                {activeCollaborators.map((member) => {
                  const selectedRoleId = selectedRoleByMembership[member.membershipId] ?? member.roleId;
                  const isRowWorking = workingMembershipId === member.membershipId;
                  const roleOptions = accessRoles.some((role) => role.id === member.roleId)
                    ? accessRoles
                    : [{ id: member.roleId, name: member.roleName, description: member.roleDescription }, ...accessRoles];
                  return (
                    <article className="access-row" key={member.membershipId}>
                      <div className="access-person">
                        <strong>{member.fullName || member.email || "Collaborator"}</strong>
                        <span>{member.email || "Email unavailable"}</span>
                        <small>{member.status === "active" ? `Joined ${formatShortDate(member.joinedAt)}` : `Removed ${formatShortDate(member.revokedAt)}`}</small>
                      </div>
                      <div className="access-role-summary">
                        <strong>{member.roleName}</strong>
                        <span>{member.roleDescription}</span>
                      </div>
                      {member.canChangeRole ? (
                        <label className="field access-role-field" htmlFor={`access-role-${member.membershipId}`}>
                          <span>Access level</span>
                          <select
                            id={`access-role-${member.membershipId}`}
                            value={selectedRoleId}
                            disabled={isRowWorking}
                            onChange={(event) => setSelectedRoleByMembership((current) => ({ ...current, [member.membershipId]: event.target.value }))}
                          >
                            {roleOptions.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                          </select>
                        </label>
                      ) : (
                        <div className="access-readonly"><span>Access level</span><strong>{member.roleName}</strong></div>
                      )}
                      <div className="row-actions">
                        {member.canChangeRole && (
                          <button className="secondary compact-button" type="button" disabled={isRowWorking || selectedRoleId === member.roleId} onClick={() => changeAccessRole(member)}>
                            {isRowWorking ? "Saving" : "Change"}
                          </button>
                        )}
                        {member.canRevoke && (
                          <button className="secondary compact-button danger-button" type="button" disabled={isRowWorking} onClick={() => removeAccess(member)}>
                            <UserMinus size={15} /> Remove access
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {!canInvite && accessStatus === "ready" && (
              <p className="quiet">Only the account owner or an administrator can change trusted access.</p>
            )}

            {pendingInvitations.length > 0 && (
              <div className="pending-access">
                <strong>Pending invitations</strong>
                <span>{pendingInvitations.length} invitation{pendingInvitations.length === 1 ? "" : "s"} waiting for acceptance.</span>
              </div>
            )}
          </section>
        )}

        {showTrustedAccess && canInvite && (
          <section className="invitation-panel" aria-labelledby="trusted-invitations-title">
            <div>
              <p className="eyebrow">Trusted invitation</p>
              <h3 id="trusted-invitations-title">Share access</h3>
              <p className="quiet">Send an expiring invitation to someone you trust with your BRIX deal work.</p>
            </div>
            <form className="invitation-form" onSubmit={submitInvitation}>
              <label className="field" htmlFor="invite-email">
                <span>Email</span>
                <input id="invite-email" type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} />
              </label>
              <label className="field" htmlFor="invite-role">
                <span>Access level</span>
                <select id="invite-role" value={inviteRoleId} disabled={accessRoles.length === 0} onChange={(event) => setInviteRoleId(event.target.value as WorkspaceInvitationRole)}>
                  {accessRoles.length === 0 && <option value="viewer">Loading access levels</option>}
                  {accessRoles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </select>
              </label>
              <button className="primary" type="submit" disabled={isInvitationWorking || accessRoles.length === 0}>{isInvitationWorking ? "Working" : "Send invite"}</button>
            </form>
            {invitationError && <p className="error">{invitationError}</p>}
            {invitationStatus && <p className="success">{invitationStatus}</p>}
            {invitationResult?.invitationLink && (
              <label className="field" htmlFor="invitation-link">
                <span>Invitation link</span>
                <input id="invitation-link" readOnly value={invitationResult.invitationLink} onFocus={(event) => event.currentTarget.select()} />
              </label>
            )}
            {pendingInvitations.length > 0 && (
              <div className="invitation-list">
                {pendingInvitations.map((invitation) => (
                  <article key={invitation.id || invitation.email} className="invitation-row">
                    <div>
                      <strong>{invitation.email}</strong>
                      <span>{roleLabel(accessRoles, invitation.roleId)} - {invitation.status}</span>
                    </div>
                    {invitation.status === "pending" && invitation.id && (
                      <div className="row-actions">
                        <button className="secondary compact-button" type="button" disabled={isInvitationWorking} onClick={() => resendInvitation(invitation.id)}>Resend</button>
                        <button className="secondary compact-button" type="button" disabled={isInvitationWorking} onClick={() => revokeInvitation(invitation.id)}>Revoke</button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </section>
  );
}

function roleLabel(roles: WorkspaceAccessRole[], roleId: string) {
  return roles.find((role) => role.id === roleId)?.name ?? roleId.replace(/_/g, " ");
}

function formatShortDate(value?: string) {
  if (!value) return "date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "date unavailable";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function workspaceAccessError(error: unknown) {
  const safe = safeAuthError(error);
  const raw = error instanceof Error ? error.message.toLowerCase() : typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string" ? (error as { message: string }).message.toLowerCase() : "";
  if (safe.kind === "offline") return safe.message;
  if (raw.includes("refresh") || raw.includes("changed")) return "Trusted access changed. Refresh and try again.";
  if (raw.includes("permission") || raw.includes("access") || raw.includes("42501")) return "You do not have permission to change trusted access.";
  if (raw.includes("owner")) return "The account owner cannot be changed or removed here.";
  if (raw.includes("role") || raw.includes("access level")) return "That access level is not available for this account.";
  if (raw.includes("active")) return "Only active trusted access can be changed.";
  return "BRIX could not update trusted access. Retry when your connection is stable.";
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

function EmptyState({ title, text, actionLabel, onAction }: { title: string; text: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <section className="panel empty state-card">
      <div className="state-icon"><Home size={28} /></div>
      <h2>{title}</h2>
      <p className="quiet">{text}</p>
      {actionLabel && onAction && <button className="secondary" onClick={onAction}>{actionLabel}</button>}
    </section>
  );
}

function RecoverableState({ title, text, actionLabel, onRetry }: { title: string; text: string; actionLabel: string; onRetry: () => void }) {
  return (
    <section className="panel state-card recoverable-state" role="alert">
      <div className="state-icon warning"><AlertTriangle size={28} /></div>
      <h2>{title}</h2>
      <p className="quiet">{text}</p>
      <button className="secondary" onClick={onRetry}><RefreshCw size={16} /> {actionLabel}</button>
    </section>
  );
}

function ShellNotice({ tone, title, icon, children }: { tone: "info" | "success" | "warning" | "danger"; title: string; icon?: ReactNode; children: ReactNode }) {
  const role = tone === "danger" || tone === "warning" ? "alert" : "status";
  return (
    <div className={`shell-notice ${tone}`} role={role} aria-live="polite">
      <div className="notice-icon">{icon ?? (tone === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />)}</div>
      <div>
        <strong>{title}</strong>
        <div className="notice-content">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ tone, children }: { tone: "success" | "neutral" | "warning" | "danger"; children: ReactNode }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

function StatePrimitive({ title, text }: { title: string; text: string }) {
  return (
    <article className="state-primitive">
      <strong>{title}</strong>
      <span>{text}</span>
    </article>
  );
}

function titleFor(module: Module) {
  return nav.find((item) => item.id === module)?.label ?? "BRIX";
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return isOnline;
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
