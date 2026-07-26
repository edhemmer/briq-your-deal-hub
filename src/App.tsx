import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode, RefObject, SetStateAction } from "react";
import { Search, BarChart3, FilePenLine, KanbanSquare, Building2, ShieldCheck, UserCircle, Trash2, Camera, Plus, LogOut, FileDown, Table2, MapPinned, Landmark, FileSearch, Eye, EyeOff, AlertTriangle, CheckCircle2, Users, UserMinus, Home, Menu, X, WifiOff, RefreshCw, CalendarClock, Pin, Archive, CheckSquare } from "lucide-react";
import { strategyCatalog, type StrategyId } from "./core/strategyCatalog";
import { analyzeDeal, formatCurrency } from "./core/underwriting";
import { createRemoteDeal, loadAnonymousDeals, loadRemoteDeals, persistRemoteDeal, saveAnonymousDeals, softDeleteRemoteDeal } from "./core/store";
import { archiveDeal, listDealProjections, loadDealDetail, restoreDeal, updateDealCore, updateDealLifecycle, updateProperty } from "./core/dealCrud";
import type { CanonicalDealOperatingStatus, CanonicalDealStage, DealAttentionState, DealDetailProjection, DealFacts, DealListProjection, DealNote, DealPriority, DealProjectionFilters, DealProjectionSort, DealRelationship, DealRelationshipRole, DealRelationshipStatus, DealStatus, DealTimelineItem, DealWorkItem, DuplicateCandidate, ManualIntakeDraft, ManualPropertyCandidate, PropertySummary, RelationshipTargetType } from "./core/types";
import { supabase } from "./core/supabase";
import { downloadDecisionPdf, downloadWorkbook } from "./core/reportExports";
import { analyzePhotoEvidence } from "./core/photoAnalysis";
import { areaSearchUrl, ownerOccupiedConveniences, taxSearchUrl } from "./core/areaAndTax";
import { reviewContractText } from "./core/contractReview";
import { buildOfferStructures, offerSummary } from "./core/offerEngine";
import { portfolioMetrics } from "./core/portfolioEngine";
import {
  attachExistingRelationship,
  createAndAttachRelationship,
  findRelationshipCandidates,
  listDealRelationships,
  relationshipRoles,
  relationshipStatuses,
  removeRelationship,
  updateRelationship,
  type RelationshipDraft,
} from "./core/relationships";
import {
  archiveDealNote,
  cancelDealTask,
  completeDealDeadline,
  completeDealTask,
  createDealDeadline,
  createDealNote,
  createDealTask,
  deadlineStatuses,
  deadlineVerificationStates,
  listDealNotes,
  listDealWork,
  loadDealTimeline,
  noteTypes,
  taskPriorities,
  taskStatuses,
  taskTypes,
  updateDealDeadline,
  updateDealNote,
  updateDealTask,
  type DeadlineDraft,
  type NoteDraft,
  type TaskDraft,
} from "./core/workHistory";
import { ensureWorkspaceContext, type WorkspaceContext } from "./core/workspace";
import { requestAccountDeletion } from "./core/authActions";
import { isSessionFailure, safeAuthError, validateAuthInput, type AuthMode } from "./core/authLifecycle";
import {
  DEFAULT_PRESENTATION_MODE,
  loadAnonymousPresentationMode,
  loadProfilePresentationMode,
  saveAnonymousPresentationMode,
  saveProfilePresentationMode,
  type PresentationMode,
} from "./core/presentationMode";
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
import {
  clearManualIntakeDraft,
  completeManualPropertyIntake,
  createManualIntakeDraft,
  loadManualIntakeDraft,
  manualIntakeDealFromResult,
  saveManualIntakeDraft,
  searchManualPropertyCandidates,
  validateManualIntakeDraft,
} from "./core/propertyIntake";
import { applyListingProposal, attachListingImportToDraft, importListingUrl, proposalSummary } from "./core/listingUrlIntake";
import {
  brixLink,
  parseBrixDeepLink,
  pathForBrixDestination,
  requiresAuthentication,
  type BrixDeepLinkDestination,
} from "./core/deepLinks";
import {
  cancelOfflineDraft,
  createOfflineDraft,
  createOfflineDraftRepository,
  processOfflineDraftQueue,
  queueOfflineDraft,
  type OfflineDraft,
  type OfflineDraftScope,
} from "./core/offlineDrafts";

type Module = "home" | "deals" | "deal" | "account";
type SearchStatus = "idle" | "loading" | "ready" | "failed";
type SearchTarget = "home" | "deals" | "account" | "deal";
type PresentationPreferenceStatus = "loading" | "ready" | "saving" | "saved" | "failed" | "offline" | "unsupported";

type ShellSearchResult = {
  key: string;
  label: string;
  description: string;
  group: string;
  target: SearchTarget;
  dealId?: string;
};

type InvestorAttentionItem = {
  key: string;
  title: string;
  detail: string;
  category: "Needs attention" | "Processing" | "Finished" | "Failed";
  tone: "success" | "neutral" | "warning" | "danger";
  action?: "openDeal" | "openDeals" | "retryWorkspace" | "openSettings";
  actionLabel?: string;
  dealId?: string;
};

const nav: Array<{ id: Module; label: string; icon: typeof Search; purpose: string }> = [
  { id: "home", label: "Home", icon: Home, purpose: "Resume your BRIX account" },
  { id: "deals", label: "Deals", icon: BarChart3, purpose: "Review saved deal work" },
  { id: "account", label: "Settings", icon: UserCircle, purpose: "Account and access" },
];
const SHELL_SEARCH_DEBOUNCE_MS = 180;

const RECENT_DEAL_IDS_LIMIT = 6;
const SHELL_RECENT_DEALS_PREFIX = "brix.shell.recentDeals";
const SHELL_LAST_DEAL_PREFIX = "brix.shell.lastDeal";

export default function App() {
  if (window.location.pathname === "/") {
    return <Landing />;
  }
  return <BrixApp />;
}

function moduleFromPath(): Module {
  const parsed = parseBrixDeepLink(window.location.href);
  return parsed.ok ? moduleForDestination(parsed.destination) : "home";
}

function pathForModule(module: Module) {
  const paths: Record<Module, string> = {
    home: "/app",
    deals: "/deals",
    deal: "/deals",
    account: "/account",
  };
  return paths[module];
}

function currentRoutePath() {
  const parsed = parseBrixDeepLink(window.location.href);
  return parsed.ok ? parsed.canonicalPath : "/app";
}

function dealPath(id: string) {
  return pathForBrixDestination({ kind: "deal", dealId: id });
}

function dealIdFromPath() {
  const parsed = parseBrixDeepLink(window.location.href);
  return parsed.ok && parsed.destination.kind === "deal" ? parsed.destination.dealId : null;
}

function moduleForDestination(destination: BrixDeepLinkDestination): Module {
  if (destination.kind === "deals" || destination.kind === "deal") return destination.kind === "deal" ? "deal" : "deals";
  if (destination.kind === "settings" || destination.kind === "password-recovery" || destination.kind === "invitation") return "account";
  return "home";
}

function shellStorageScope(userId: string | null, workspaceContext: WorkspaceContext | null) {
  if (!userId) return "anonymous";
  return `${userId}:${workspaceContext?.workspaceId ?? "workspace-pending"}`;
}

function readScopedDealIds(prefix: string, scope: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${prefix}:${scope}`) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeScopedDealIds(prefix: string, scope: string, ids: string[]) {
  localStorage.setItem(`${prefix}:${scope}`, JSON.stringify([...new Set(ids)].slice(0, RECENT_DEAL_IDS_LIMIT)));
}

function BrixApp() {
  const [module, setModuleState] = useState<Module>(() => moduleFromPath());
  const [navOpen, setNavOpen] = useState(false);
  const [deals, setDeals] = useState<DealFacts[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [presentationMode, setPresentationMode] = useState<PresentationMode>(() => loadAnonymousPresentationMode());
  const [presentationPreferenceStatus, setPresentationPreferenceStatus] = useState<PresentationPreferenceStatus>("ready");
  const [presentationPreferenceMessage, setPresentationPreferenceMessage] = useState("");
  const [failedPresentationMode, setFailedPresentationMode] = useState<PresentationMode | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [hasAnonymousDrafts, setHasAnonymousDrafts] = useState(false);
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState<"loading" | "ready" | "failed" | "signed_out">("loading");
  const [authLifecycle, setAuthLifecycle] = useState<"restoring" | "signed_out" | "bootstrapping" | "ready" | "failed" | "signing_out" | "expired">("restoring");
  const [passwordRecoveryActive, setPasswordRecoveryActive] = useState(() => new URLSearchParams(window.location.search).get("flow") === "reset-password");
  const [invitationToken, setInvitationToken] = useState<string | null>(() => invitationTokenFromLocation());
  const [invitationMessage, setInvitationMessage] = useState<string | null>(null);
  const [routeMessage, setRouteMessage] = useState<string | null>(null);
  const [pendingDeepLink, setPendingDeepLink] = useState<BrixDeepLinkDestination | null>(() => {
    const parsed = parseBrixDeepLink(window.location.href);
    return parsed.ok ? parsed.destination : null;
  });
  const [cloudDealsStatus, setCloudDealsStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [recentDealIds, setRecentDealIds] = useState<string[]>([]);
  const [workspaceRetryKey, setWorkspaceRetryKey] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ShellSearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [searchHighlightIndex, setSearchHighlightIndex] = useState(0);
  const recentCloudCreatesRef = useRef<Map<string, { ownerId: string; deal: DealFacts }>>(new Map());
  const mainContentRef = useRef<HTMLElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchRequestRef = useRef(0);
  const didRenderInitialModuleRef = useRef(false);
  const didRestoreLastDealRef = useRef(false);
  const dealHydrationRef = useRef<string | null>(null);
  const isOnline = useOnlineStatus();
  const isAuthenticated = Boolean(authUserId);
  const selectedDeal = deals.find((deal) => deal.id === selectedId);
  const storageScope = shellStorageScope(authUserId, workspaceContext);
  const draftRepository = useMemo(() => createOfflineDraftRepository(), []);
  const draftScope = useMemo<OfflineDraftScope>(() => authUserId && workspaceContext
    ? { kind: "authenticated", userId: authUserId, workspaceId: workspaceContext.workspaceId }
    : { kind: "anonymous" }, [authUserId, workspaceContext]);
  const [offlineDrafts, setOfflineDrafts] = useState<OfflineDraft[]>([]);
  const [draftSyncStatus, setDraftSyncStatus] = useState<"idle" | "loading" | "syncing" | "ready" | "failed">("idle");
  const [draftSyncMessage, setDraftSyncMessage] = useState("");
  const [manualIntakeOpen, setManualIntakeOpen] = useState(false);
  const recentDeals = useMemo(() => recentDealIds
    .map((id) => deals.find((deal) => deal.id === id))
    .filter((deal): deal is DealFacts => Boolean(deal)), [deals, recentDealIds]);
  const activeOfflineDrafts = offlineDrafts.filter((draft) => draft.status !== "synced" && draft.status !== "cancelled");
  const selectedDealDrafts = selectedDeal ? offlineDrafts.filter((draft) => draft.dealId === selectedDeal.id || draft.payload && "deal" in draft.payload && (draft.payload as { deal?: DealFacts }).deal?.id === selectedDeal.id) : [];

  const loadOfflineDrafts = useCallback(async () => {
    setDraftSyncStatus((current) => current === "syncing" ? current : "loading");
    try {
      const drafts = await draftRepository.list(draftScope);
      setOfflineDrafts(drafts);
      setDraftSyncStatus("ready");
      setDraftSyncMessage("");
    } catch {
      setDraftSyncStatus("failed");
      setDraftSyncMessage("BRIX could not read saved device work. Your account data remains protected.");
    }
  }, [draftRepository, draftScope]);

  useEffect(() => {
    void loadOfflineDrafts();
  }, [loadOfflineDrafts]);

  async function enqueueOfflineDraft(draft: OfflineDraft, message: string) {
    const queued = queueOfflineDraft(draft);
    await draftRepository.put(queued);
    await loadOfflineDrafts();
    setDraftSyncMessage(message);
  }

  const retryOfflineDrafts = useCallback(async () => {
    if (!isAuthenticated || !workspaceContext) {
      setDraftSyncMessage("Sign in before synchronizing saved device work.");
      return;
    }
    setDraftSyncStatus("syncing");
    const retryableDrafts = offlineDrafts.filter((draft) => draft.status === "failed" || draft.status === "conflicted");
    await Promise.all(retryableDrafts.map((draft) => draftRepository.put(queueOfflineDraft(draft))));
    const result = await processOfflineDraftQueue({
      repository: draftRepository,
      scope: draftScope,
      userId: authUserId,
      workspaceId: workspaceContext.workspaceId,
      isOnline,
      refresh: async () => {
        const cloudDeals = await loadRemoteDeals(authUserId, workspaceContext.workspaceId);
        setDeals(cloudDeals);
      },
    });
    await loadOfflineDrafts();
    setDraftSyncStatus(result.paused ? "failed" : "ready");
    if (result.synced > 0) setDraftSyncMessage(`${result.synced} saved device item${result.synced === 1 ? "" : "s"} synchronized with BRIX.`);
    else if (result.conflicted > 0) setDraftSyncMessage(`${result.conflicted} saved device item${result.conflicted === 1 ? " needs" : "s need"} review before synchronization.`);
    else if (result.failed > 0 || result.paused) setDraftSyncMessage("Saved device work could not synchronize yet. Retry when account access and connection are ready.");
    else setDraftSyncMessage("");
  }, [authUserId, draftRepository, draftScope, isAuthenticated, isOnline, loadOfflineDrafts, offlineDrafts, workspaceContext]);

  useEffect(() => {
    if (!isOnline || !isAuthenticated || !workspaceContext) return;
    if (!offlineDrafts.some((draft) => draft.status === "queued")) return;
    void retryOfflineDrafts();
  }, [isAuthenticated, isOnline, offlineDrafts, retryOfflineDrafts, workspaceContext]);

  async function cancelQueuedDraft(draft: OfflineDraft) {
    await draftRepository.put(cancelOfflineDraft(draft));
    await loadOfflineDrafts();
  }

  async function completeManualIntake(draft: ManualIntakeDraft) {
    const errors = validateManualIntakeDraft(draft);
    if (errors.length) throw new Error(errors[0]);
    if (!authUserId) throw new Error("Sign in before creating a canonical Deal.");
    const context = await prepareWorkspaceForCloudAction();
    if (!context) throw new Error("BRIX workspace is not ready.");

    if (!isOnline) {
      const localDeal: DealFacts = {
        id: draft.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "draft",
        address: draft.address.trim(),
        city: draft.city?.trim() || undefined,
        state: draft.region?.trim() || undefined,
        zip: draft.postalCode?.trim() || undefined,
        propertyType: draft.propertyType?.trim() || undefined,
        listPrice: draft.askingPrice ? Number(draft.askingPrice.replace(/[$,]/g, "")) : undefined,
        strategyId: draft.intendedStrategy || "owner_occupant",
        notes: draft.notes?.trim() ? [draft.notes.trim()] : [],
        photoUrls: [],
        uploadedPhotoNames: [],
        verification: { address: "entered", manual_source: "entered" },
      };
      await enqueueOfflineDraft(createOfflineDraft({
        scope: { kind: "authenticated", userId: authUserId, workspaceId: context.workspaceId },
        workspaceId: context.workspaceId,
        dealId: draft.id,
        draftType: "new_deal",
        commandType: "create_canonical_deal",
        payload: { manualIntake: draft },
      }), "Manual intake saved on this device and waiting to synchronize with BRIX.");
      putDealInState(localDeal);
      rememberDealContext(localDeal.id);
      setManualIntakeOpen(false);
      setModuleState("deal");
      window.history.pushState({}, "", dealPath(localDeal.id));
      return localDeal;
    }

    const result = await completeManualPropertyIntake(context.workspaceId, draft);
    const confirmedDeal = manualIntakeDealFromResult(draft, result);
    recentCloudCreatesRef.current.set(confirmedDeal.id, { ownerId: authUserId, deal: confirmedDeal });
    putDealInState(confirmedDeal);
    rememberDealContext(confirmedDeal.id);
    setSyncMessage(null);
    setManualIntakeOpen(false);
    setModuleState("deal");
    window.history.pushState({}, "", dealPath(confirmedDeal.id));
    return confirmedDeal;
  }

  useEffect(() => {
    const parsed = parseBrixDeepLink(window.location.href);
    if ("message" in parsed) {
      setPendingDeepLink(null);
      setRouteMessage(parsed.message);
      setModuleState("home");
      window.history.replaceState({}, "", parsed.canonicalPath);
      return;
    }
    if (parsed.destination.kind === "home") {
      setPendingDeepLink(null);
      setModuleState("home");
      if (window.location.pathname + window.location.search !== parsed.canonicalPath) {
        window.history.replaceState({}, "", parsed.canonicalPath);
      }
      return;
    }
    setPendingDeepLink(parsed.destination);
    setModuleState(moduleForDestination(parsed.destination));
    if (parsed.destination.kind === "password-recovery") setPasswordRecoveryActive(true);
    if (parsed.destination.kind === "invitation") setInvitationToken(parsed.destination.token);
    if (window.location.pathname + window.location.search !== parsed.canonicalPath) {
      window.history.replaceState({}, "", parsed.canonicalPath);
    }
  }, []);

  const setModule = useCallback((next: Module) => {
    setPendingDeepLink(null);
    setModuleState(next);
    setNavOpen(false);
    const nextPath = pathForModule(next);
    if (window.location.pathname !== nextPath) window.history.pushState({}, "", nextPath);
  }, []);

  const rememberDealContext = useCallback((dealId: string) => {
    const currentScope = shellStorageScope(authUserId, workspaceContext);
    setRecentDealIds((current) => {
      const nextRecent = [dealId, ...current.filter((id) => id !== dealId)].slice(0, RECENT_DEAL_IDS_LIMIT);
      writeScopedDealIds(SHELL_RECENT_DEALS_PREFIX, currentScope, nextRecent);
      return nextRecent;
    });
    writeScopedDealIds(SHELL_LAST_DEAL_PREFIX, currentScope, [dealId]);
  }, [authUserId, workspaceContext]);

  const openDeal = useCallback((dealId: string, options: { replace?: boolean; silent?: boolean } = {}) => {
    if (syncMessage?.startsWith("Deal was not saved") && !window.confirm("This Deal has unsaved cloud changes. Leave it anyway?")) return;
    const deal = deals.find((item) => item.id === dealId);
    if (!deal) {
      setSelectedId(null);
      setModuleState("deals");
      setRouteMessage("That Deal is no longer available in this workspace.");
      window.history.replaceState({}, "", "/deals");
      return;
    }
    setSelectedId(deal.id);
    rememberDealContext(deal.id);
    setPendingDeepLink(null);
    setRouteMessage(null);
    setModuleState("deal");
    setNavOpen(false);
    const nextPath = dealPath(deal.id);
    if (window.location.pathname !== nextPath) {
      if (options.replace) window.history.replaceState({}, "", nextPath);
      else window.history.pushState({}, "", nextPath);
    }
    if (!options.silent) mainContentRef.current?.focus({ preventScroll: true });
  }, [deals, rememberDealContext, syncMessage]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchStatus("idle");
    setSearchHighlightIndex(0);
    window.setTimeout(() => searchButtonRef.current?.focus({ preventScroll: true }), 0);
  }, []);

  const executeSearchResult = useCallback((result: ShellSearchResult) => {
    if (result.target === "deal" && result.dealId) {
      openDeal(result.dealId);
    } else if (result.target === "home") {
      setModule("home");
    } else if (result.target === "deals") {
      setModule("deals");
    } else if (result.target === "account") {
      setModule("account");
    }
    closeSearch();
  }, [closeSearch, openDeal, setModule]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey))) return;
      if (isTextEntryTarget(event.target)) return;
      event.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    window.setTimeout(() => searchInputRef.current?.focus({ preventScroll: true }), 0);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    setSearchHighlightIndex(0);
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;

    if (!isOnline) {
      setSearchStatus("failed");
      return;
    }

    if (workspaceStatus === "failed" || authLifecycle === "failed" || authLifecycle === "expired") {
      setSearchStatus("failed");
      return;
    }

    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setSearchResults(buildShellSearchResults({ query: "", deals, recentDeals, selectedDeal, isAuthenticated }));
      setSearchStatus("idle");
      return;
    }

    setSearchStatus("loading");
    const timer = window.setTimeout(() => {
      if (searchRequestRef.current !== requestId) return;
      setSearchResults(buildShellSearchResults({ query: trimmedQuery, deals, recentDeals, selectedDeal, isAuthenticated }));
      setSearchStatus("ready");
    }, SHELL_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [authLifecycle, deals, isAuthenticated, isOnline, recentDeals, searchOpen, searchQuery, selectedDeal, workspaceStatus]);

  useEffect(() => {
    if (!didRenderInitialModuleRef.current) {
      didRenderInitialModuleRef.current = true;
      return;
    }
    mainContentRef.current?.focus({ preventScroll: true });
  }, [module]);

  useEffect(() => {
    setRecentDealIds(readScopedDealIds(SHELL_RECENT_DEALS_PREFIX, storageScope));
  }, [storageScope]);

  const anonymousDraftsOnDevice = useCallback(() => {
    const anonymousDeals = loadAnonymousDeals();
    setHasAnonymousDrafts(anonymousDeals.length > 0);
    return anonymousDeals;
  }, []);

  async function prepareWorkspaceForCloudAction() {
    if (!authUserId) return null;
    if (workspaceStatus === "ready" && workspaceContext) return workspaceContext;
    setWorkspaceStatus("loading");
    const context = await ensureWorkspaceContext();
    setWorkspaceContext(context);
    setWorkspaceStatus("ready");
    return context;
  }

  const restoreAnonymousDrafts = useCallback(() => {
    const anonymousDeals = anonymousDraftsOnDevice();
    setDeals(anonymousDeals);
    setSelectedId(null);
  }, [anonymousDraftsOnDevice]);

  const resetPresentationForAuthTransition = useCallback((userId: string | null) => {
    setFailedPresentationMode(null);
    setPresentationPreferenceMessage("");
    if (userId) {
      setPresentationMode(DEFAULT_PRESENTATION_MODE);
      setPresentationPreferenceStatus("loading");
    } else {
      setPresentationMode(loadAnonymousPresentationMode());
      setPresentationPreferenceStatus("ready");
    }
  }, []);

  const restoreRecentCloudCreates = useCallback((userId: string) => {
    const recentDealsForUser = Array.from(recentCloudCreatesRef.current.values())
      .filter((entry) => entry.ownerId === userId)
      .map((entry) => entry.deal);
    if (recentDealsForUser.length === 0) return;
    setDeals((current) => {
      const currentIds = new Set(current.map((deal) => deal.id));
      return [...recentDealsForUser.filter((deal) => !currentIds.has(deal.id)), ...current];
    });
    setSelectedId((currentId) => currentId ?? null);
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

  const updatePresentationMode = useCallback(async (nextMode: PresentationMode) => {
    const previousMode = presentationMode;
    setPresentationMode(nextMode);
    setPresentationPreferenceStatus("saving");
    setPresentationPreferenceMessage("");
    setFailedPresentationMode(null);

    try {
      if (authUserId) {
        if (!isOnline) throw new Error("offline");
        await saveProfilePresentationMode(authUserId, nextMode);
      } else {
        saveAnonymousPresentationMode(nextMode);
      }
      setPresentationPreferenceStatus("saved");
      setPresentationPreferenceMessage(`${nextMode === "guided" ? "Guided" : "Professional"} mode saved.`);
    } catch {
      setPresentationMode(previousMode);
      setFailedPresentationMode(nextMode);
      setPresentationPreferenceStatus(isOnline ? "failed" : "offline");
      setPresentationPreferenceMessage(isOnline
        ? "BRIX could not save that preference. Your previous mode is still active."
        : "You appear to be offline. Your previous mode is still active.");
    }
  }, [authUserId, isOnline, presentationMode]);

  const retryPresentationModeSave = useCallback(() => {
    if (failedPresentationMode) void updatePresentationMode(failedPresentationMode);
  }, [failedPresentationMode, updatePresentationMode]);

  useEffect(() => {
    if (!authReady) return;
    if (!authUserId) {
      resetPresentationForAuthTransition(null);
      return;
    }
    let isCurrent = true;
    setPresentationMode(DEFAULT_PRESENTATION_MODE);
    setPresentationPreferenceStatus("loading");
    setPresentationPreferenceMessage("");
    setFailedPresentationMode(null);
    loadProfilePresentationMode(authUserId)
      .then((mode) => {
        if (!isCurrent) return;
        setPresentationMode(mode);
        setPresentationPreferenceStatus("ready");
      })
      .catch(() => {
        if (!isCurrent) return;
        setPresentationMode(DEFAULT_PRESENTATION_MODE);
        setPresentationPreferenceStatus(isOnline ? "failed" : "offline");
        setPresentationPreferenceMessage(isOnline
          ? "BRIX could not load your presentation preference. Guided mode is active until retry succeeds."
          : "You appear to be offline. Guided mode is active until BRIX can load your account preference.");
      });
    return () => {
      isCurrent = false;
    };
  }, [authReady, authUserId, isOnline, resetPresentationForAuthTransition]);

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
    const onPopState = () => {
      const parsed = parseBrixDeepLink(window.location.href);
      if ("message" in parsed) {
        setPendingDeepLink(null);
        setRouteMessage(parsed.message);
        setModuleState("home");
        window.history.replaceState({}, "", parsed.canonicalPath);
        return;
      }
      if (parsed.destination.kind === "home") {
        setPendingDeepLink(null);
        setRouteMessage(null);
        setModuleState("home");
        if (window.location.pathname + window.location.search !== parsed.canonicalPath) {
          window.history.replaceState({}, "", parsed.canonicalPath);
        }
        return;
      }
      setPendingDeepLink(parsed.destination);
      setRouteMessage(null);
      setModuleState(moduleForDestination(parsed.destination));
      setPasswordRecoveryActive(parsed.destination.kind === "password-recovery");
      setInvitationToken(parsed.destination.kind === "invitation" ? parsed.destination.token : null);
    };
    window.addEventListener("popstate", onPopState);
    setAuthLifecycle("restoring");
    supabase.auth.getSession()
      .then(({ data }) => {
        const userId = data.session?.user?.id ?? null;
        clearProtectedState();
        setCloudDealsStatus("idle");
        resetPresentationForAuthTransition(userId);
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
        setCloudDealsStatus("idle");
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
      setCloudDealsStatus("idle");
      resetPresentationForAuthTransition(userId);
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
  }, [
    anonymousDraftsOnDevice,
    clearProtectedState,
    resetPresentationForAuthTransition,
    restoreAnonymousDrafts,
    restoreRecentCloudCreates,
    setModule,
  ]);

  useEffect(() => {
    if (!authUserId) return;
    let isCurrent = true;
    clearProtectedState();
    setCloudDealsStatus("idle");
    setWorkspaceContext(null);
    setWorkspaceStatus("loading");
    setAuthLifecycle("bootstrapping");
    setCloudDealsStatus("loading");
    const pendingInvitationToken = invitationToken;
    (async () => {
      if (pendingInvitationToken) {
        await acceptWorkspaceInvitation(pendingInvitationToken);
        setInvitationToken(null);
        clearInvitationFromUrl();
        setInvitationMessage("Workspace access accepted.");
      }
      return ensureWorkspaceContext();
    })()
      .then((context) => {
        if (!isCurrent) return [];
        setWorkspaceContext(context);
        setWorkspaceStatus("ready");
        setAuthLifecycle("ready");
        return loadRemoteDeals(authUserId, context.workspaceId);
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
        setSelectedId((currentId) => currentId ?? null);
        setCloudDealsStatus("ready");
        setSyncMessage(null);
      })
      .catch((error) => {
        if (!isCurrent) return;
        if (isSessionFailure(error)) {
          void supabase.auth.signOut();
          setAuthUserId(null);
          clearProtectedState();
          setCloudDealsStatus("idle");
          restoreAnonymousDrafts();
          setAuthLifecycle("expired");
          setSyncMessage("Your session has expired. Sign in again to continue.");
          return;
        }
        setWorkspaceContext(null);
        setWorkspaceStatus("failed");
        setCloudDealsStatus("failed");
        setAuthLifecycle("failed");
        setSyncMessage(pendingInvitationToken ? safeAuthError(error).message : safeAuthError(error).message);
      });
    return () => {
      isCurrent = false;
    };
  }, [authUserId, clearProtectedState, invitationToken, restoreAnonymousDrafts, workspaceRetryKey]);

  useEffect(() => {
    if (!authReady) return;
    if (!pendingDeepLink) return;
    if (pendingDeepLink.kind === "password-recovery") {
      setModuleState("account");
      setRouteMessage(null);
      setPasswordRecoveryActive(true);
      if (window.location.pathname + window.location.search !== "/account?flow=reset-password") {
        window.history.replaceState({}, "", "/account?flow=reset-password");
      }
      setPendingDeepLink(null);
      return;
    }
    if (pendingDeepLink.kind === "home") {
      setModuleState("home");
      setRouteMessage(null);
      if (window.location.pathname !== "/app") window.history.replaceState({}, "", "/app");
      setPendingDeepLink(null);
      return;
    }
    if (pendingDeepLink.kind === "settings" && !requiresAuthentication(pendingDeepLink)) {
      setModuleState("account");
      setRouteMessage(null);
      if (window.location.pathname !== "/account") window.history.replaceState({}, "", "/account");
      setPendingDeepLink(null);
      return;
    }
    if (requiresAuthentication(pendingDeepLink) && !authUserId) {
      setSelectedId(null);
      setModuleState("account");
      setRouteMessage("Sign in to continue.");
      if (window.location.pathname !== "/account") window.history.replaceState({}, "", "/account");
      return;
    }
    if (authUserId && (workspaceStatus !== "ready" || cloudDealsStatus === "loading" || cloudDealsStatus === "idle")) return;
    if (authUserId && (workspaceStatus === "failed" || cloudDealsStatus === "failed")) {
      setSelectedId(null);
      setModuleState("account");
      setRouteMessage("BRIX could not open that link. Try again after account access is restored.");
      return;
    }
    if (pendingDeepLink.kind === "deal") {
      const deal = deals.find((item) => item.id === pendingDeepLink.dealId);
      if (deal) {
        setSelectedId(deal.id);
        rememberDealContext(deal.id);
        setModuleState("deal");
        setRouteMessage(null);
        if (window.location.pathname !== dealPath(deal.id)) window.history.replaceState({}, "", dealPath(deal.id));
        setPendingDeepLink(null);
        return;
      }
      setSelectedId(null);
      setModuleState("deals");
      setRouteMessage("This Deal is no longer available.");
      window.history.replaceState({}, "", "/deals");
      setPendingDeepLink(null);
      return;
    }
    if (pendingDeepLink.kind === "deals") {
      setModuleState("deals");
      setRouteMessage(null);
      if (window.location.pathname !== "/deals") window.history.replaceState({}, "", "/deals");
      setPendingDeepLink(null);
      return;
    }
    if (pendingDeepLink.kind === "settings") {
      setModuleState("account");
      setRouteMessage(null);
      const path = pathForBrixDestination(pendingDeepLink);
      if (window.location.pathname + window.location.search !== path) window.history.replaceState({}, "", path);
      setPendingDeepLink(null);
      return;
    }
    if (pendingDeepLink.kind === "invitation") {
      setModuleState("account");
      setRouteMessage(null);
      if (window.location.pathname !== "/account") window.history.replaceState({}, "", "/account");
      setPendingDeepLink(null);
    }
  }, [authReady, authUserId, cloudDealsStatus, deals, pendingDeepLink, rememberDealContext, workspaceStatus]);

  useEffect(() => {
    if (!authReady || didRestoreLastDealRef.current) return;
    if (authUserId && (workspaceStatus !== "ready" || !workspaceContext)) return;
    const routeDealId = dealIdFromPath();
    if (routeDealId || !["/app", "/home", "/dashboard"].includes(window.location.pathname)) return;
    const readyScope = shellStorageScope(authUserId, workspaceContext);
    const [lastDealId] = readScopedDealIds(SHELL_LAST_DEAL_PREFIX, readyScope);
    if (!lastDealId) {
      didRestoreLastDealRef.current = true;
      return;
    }
    const deal = deals.find((item) => item.id === lastDealId);
    didRestoreLastDealRef.current = true;
    if (deal) openDeal(deal.id, { replace: true, silent: true });
  }, [authReady, authUserId, deals, openDeal, workspaceContext, workspaceStatus]);

  useEffect(() => {
    didRestoreLastDealRef.current = false;
  }, [authUserId, storageScope]);

  useEffect(() => {
    if (!selectedId) return;
    if (deals.some((deal) => deal.id === selectedId)) return;
    setSelectedId(null);
  }, [deals, selectedId]);

  useEffect(() => {
    if (module !== "deal" || selectedDeal) return;
    if (dealIdFromPath()) return;
    setModuleState("deals");
    window.history.replaceState({}, "", "/deals");
  }, [module, selectedDeal]);

  useEffect(() => {
    if (!authUserId || !isOnline || module !== "deal" || !selectedDeal) return;
    const hydrationKey = `${selectedDeal.id}:${selectedDeal.dealVersion ?? 0}:${selectedDeal.updatedAt}`;
    if (dealHydrationRef.current === hydrationKey) return;
    let isCurrent = true;
    dealHydrationRef.current = hydrationKey;
    loadDealDetail(selectedDeal.id)
      .then((detail) => {
        if (!isCurrent) return;
        putDealInState(detail.deal);
      })
      .catch((error) => {
        if (!isCurrent) return;
        const safe = safeDealCommandMessage(error);
        setSyncMessage(safe.message);
      });
    return () => {
      isCurrent = false;
    };
  }, [authUserId, isOnline, module, selectedDeal]);

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
        const context = await prepareWorkspaceForCloudAction();
        if (!context) throw new Error("BRIX cloud workspace is not ready.");
        if (!isOnline) {
          const scopedDraft: OfflineDraftScope = { kind: "authenticated", userId: effectiveUserId, workspaceId: context.workspaceId };
          await enqueueOfflineDraft(createOfflineDraft({
            scope: scopedDraft,
            workspaceId: context.workspaceId,
            dealId: deal.id,
            draftType: "new_deal",
            commandType: "create_canonical_deal",
            payload: { deal },
          }), "Deal saved on this device and waiting to synchronize with BRIX.");
          putDealInState(deal);
          rememberDealContext(deal.id);
          setModuleState("deal");
          setNavOpen(false);
          window.history.pushState({}, "", dealPath(deal.id));
          return true;
        }
        const confirmedDeal = await createRemoteDeal(deal, effectiveUserId, context.workspaceId);
        recentCloudCreatesRef.current.set(confirmedDeal.id, { ownerId: effectiveUserId, deal: confirmedDeal });
        setDeals((current) => {
          const next = [confirmedDeal, ...current.filter((item) => item.id !== confirmedDeal.id)];
          return next;
        });
        setSelectedId(confirmedDeal.id);
        rememberDealContext(confirmedDeal.id);
        setSyncMessage(null);
        setModuleState("deal");
        setNavOpen(false);
        window.history.pushState({}, "", dealPath(confirmedDeal.id));
        return true;
      }

      const confirmedDeal = deal;
      const savedDeals = [confirmedDeal, ...loadAnonymousDeals().filter((item) => item.id !== confirmedDeal.id)];
      saveAnonymousDeals(savedDeals);
      setDeals((current) => {
        const next = [confirmedDeal, ...current.filter((item) => item.id !== confirmedDeal.id)];
        return next;
      });
      setSelectedId(confirmedDeal.id);
      rememberDealContext(confirmedDeal.id);
      if (!effectiveUserId) setHasAnonymousDrafts(true);
      setSyncMessage("Deal created on this device. Sign in from Settings to keep it across devices.");
      setModuleState("deal");
      setNavOpen(false);
      window.history.pushState({}, "", dealPath(confirmedDeal.id));
      return true;
    } catch (error) {
      if (authUserId && workspaceContext && classifyRecoverableDraftError(error)) {
        await enqueueOfflineDraft(createOfflineDraft({
          scope: { kind: "authenticated", userId: authUserId, workspaceId: workspaceContext.workspaceId },
          workspaceId: workspaceContext.workspaceId,
          dealId: deal.id,
          draftType: "new_deal",
          commandType: "create_canonical_deal",
          payload: { deal },
        }), "Deal saved on this device and waiting to synchronize with BRIX.");
        putDealInState(deal);
        rememberDealContext(deal.id);
        setModuleState("deal");
        setNavOpen(false);
        window.history.pushState({}, "", dealPath(deal.id));
        return true;
      }
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
      if (!isOnline && workspaceContext) {
        await enqueueOfflineDraft(createOfflineDraft({
          scope: { kind: "authenticated", userId: authUserId, workspaceId: workspaceContext.workspaceId },
          workspaceId: workspaceContext.workspaceId,
          dealId: next.id,
          propertyId: next.propertyId,
          draftType: "deal_core_update",
          commandType: "update_canonical_deal",
          baseRecordId: next.id,
          baseVersion: next.dealVersion,
          payload: {
            deal: next,
            update: {
              displayName: next.address,
              sourceUrl: next.sourceUrl,
              sourceText: next.sourceText,
              strategyId: next.strategyId,
              strategyIntent: next.strategyId,
              facts: next,
              verification: next.verification,
            },
          },
        }), "Deal change saved on this device and waiting to synchronize with BRIX.");
        putDealInState(next);
        return;
      }
      const confirmedDeal = await persistRemoteDeal(next, authUserId);
      putDealInState(confirmedDeal);
      setSyncMessage(null);
    } catch (error) {
      if (workspaceContext && classifyRecoverableDraftError(error)) {
        await enqueueOfflineDraft(createOfflineDraft({
          scope: { kind: "authenticated", userId: authUserId, workspaceId: workspaceContext.workspaceId },
          workspaceId: workspaceContext.workspaceId,
          dealId: next.id,
          propertyId: next.propertyId,
          draftType: "deal_core_update",
          commandType: "update_canonical_deal",
          baseRecordId: next.id,
          baseVersion: next.dealVersion,
          payload: {
            deal: next,
            update: {
              displayName: next.address,
              sourceUrl: next.sourceUrl,
              sourceText: next.sourceText,
              strategyId: next.strategyId,
              strategyIntent: next.strategyId,
              facts: next,
              verification: next.verification,
            },
          },
        }), "Deal change saved on this device and waiting to synchronize with BRIX.");
        putDealInState(next);
        return;
      }
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
      const nextRecent = recentDealIds.filter((dealId) => dealId !== id);
      setRecentDealIds(nextRecent);
      writeScopedDealIds(SHELL_RECENT_DEALS_PREFIX, storageScope, nextRecent);
      if (selectedId === id) {
        setModuleState("deals");
        window.history.replaceState({}, "", "/deals");
      }
      setSyncMessage("Deal removed from this device.");
      return;
    }
    setSyncMessage("Archiving Deal in BRIX cloud...");
    try {
      await prepareWorkspaceForCloudAction();
      await softDeleteRemoteDeal(id, authUserId);
      setDeals((current) => {
        const next = current.filter((deal) => deal.id !== id);
        setSelectedId((currentId) => currentId === id ? next[0]?.id ?? null : currentId);
        return next;
      });
      const nextRecent = recentDealIds.filter((dealId) => dealId !== id);
      setRecentDealIds(nextRecent);
      writeScopedDealIds(SHELL_RECENT_DEALS_PREFIX, storageScope, nextRecent);
      if (selectedId === id) {
        setModuleState("deals");
        window.history.replaceState({}, "", "/deals");
      }
      setSyncMessage(null);
    } catch (error) {
      setSyncMessage(`Deal was not archived: ${error instanceof Error ? error.message : "check your connection."}`);
    }
  }

  function markDealArchived(id: string) {
    setDeals((current) => current.filter((deal) => deal.id !== id));
    setRecentDealIds((current) => {
      const nextRecent = current.filter((dealId) => dealId !== id);
      writeScopedDealIds(SHELL_RECENT_DEALS_PREFIX, storageScope, nextRecent);
      return nextRecent;
    });
    if (selectedId === id) {
      setSelectedId(null);
      setModuleState("deals");
      setRouteMessage("That Deal was archived and removed from the active list.");
      window.history.replaceState({}, "", "/deals");
    }
  }

  return (
    <div className={`${navOpen ? "app-shell shell-nav-open" : "app-shell"} mode-${presentationMode}`}>
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
            const isActive = module === item.id || (module === "deal" && item.id === "deals");
            return (
              <button key={item.id} className={isActive ? "nav-item active" : "nav-item"} onClick={() => setModule(item.id)}>
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
          <button ref={searchButtonRef} className="shell-search-trigger" type="button" onClick={() => setSearchOpen(true)}>
            <Search size={18} />
            <span>Search</span>
            <kbd>Ctrl K</kbd>
          </button>
          {isAuthenticated && (
            <div className={workspaceStatus === "failed" ? "workspace-pill danger" : "workspace-pill"}>
              <span>My BRIX</span>
              <strong>{workspaceContext?.workspaceName ?? "Personal account"}</strong>
            </div>
          )}
          {selectedDeal && module !== "deal" && (
            <button className="active-deal-pill" type="button" onClick={() => openDeal(selectedDeal.id)}>
              <span>Active Deal</span>
              <strong>{dealTitle(selectedDeal)}</strong>
            </button>
          )}
          {module === "deal" && <DealSwitcher deals={deals} selectedId={selectedDeal?.id} onSelect={(id) => openDeal(id)} />}
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
        {draftSyncMessage && (
          <ShellNotice tone={activeOfflineDrafts.some((draft) => draft.status === "conflicted" || draft.status === "failed") ? "warning" : "info"} title="Saved device work">
            {draftSyncMessage}
          </ShellNotice>
        )}
        {activeOfflineDrafts.length > 0 && (
          <ShellNotice tone="info" title="Saved device work">
            <span>{activeOfflineDrafts.length} item{activeOfflineDrafts.length === 1 ? "" : "s"} saved on this device.</span>
            <button className="secondary compact" type="button" onClick={() => void retryOfflineDrafts()} disabled={draftSyncStatus === "syncing" || !isAuthenticated}>Retry sync</button>
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
        {routeMessage && (
          <ShellNotice tone="warning" title="Deal unavailable">{routeMessage}</ShellNotice>
        )}
        {module === "home" && <HomeSurface presentationMode={presentationMode} isAuthenticated={isAuthenticated} authLifecycle={authLifecycle} workspaceStatus={workspaceStatus} isOnline={isOnline} deals={deals} selectedDeal={selectedDeal ?? deals[0]} syncMessage={syncMessage} routeMessage={routeMessage} onOpenDeal={(dealId?: string) => dealId ? openDeal(dealId) : selectedDeal ? openDeal(selectedDeal.id) : setModule("deals")} onOpenDeals={() => setModule("deals")} onOpenSettings={() => setModule("account")} onStartIntake={() => setManualIntakeOpen(true)} onRetry={retryWorkspaceBootstrap} />}
        {module === "deals" && <DealsSurface presentationMode={presentationMode} authLifecycle={authLifecycle} workspaceStatus={workspaceStatus} workspaceId={workspaceContext?.workspaceId} storageScope={storageScope} isAuthenticated={isAuthenticated} isOnline={isOnline} deals={deals} recentDeals={recentDeals} selectedId={selectedId} onOpenDeal={openDeal} onStartIntake={() => setManualIntakeOpen(true)} onRetry={retryWorkspaceBootstrap} onArchived={markDealArchived} onRestored={putDealInState} />}
        {module === "deal" && <DealIQ deal={selectedDeal} workspaceId={workspaceContext?.workspaceId} userId={authUserId} draftScope={draftScope} offlineDrafts={selectedDealDrafts} isAuthenticated={isAuthenticated} isOnline={isOnline} onChange={upsertDeal} onCanonicalSaved={putDealInState} onDelete={deleteDeal} onDraftQueued={enqueueOfflineDraft} onDraftRetry={retryOfflineDrafts} onDraftCancel={cancelQueuedDraft} />}
        {module === "account" && <Account isAuthenticated={isAuthenticated} workspaceContext={workspaceContext} invitationToken={invitationToken} recoveryActive={passwordRecoveryActive} onAuthChanged={(userId) => {
          setDeals([]);
          setSelectedId(null);
          resetPresentationForAuthTransition(userId);
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
          if (activeOfflineDrafts.length > 0 && !window.confirm("You have saved device work that has not reached BRIX. Sign out anyway?")) return false;
          setAuthLifecycle("signing_out");
          clearProtectedState();
          return true;
        }} onSignedOut={() => {
          resetPresentationForAuthTransition(null);
          setAuthUserId(null);
          setAuthReady(true);
          setWorkspaceContext(null);
          setWorkspaceStatus("signed_out");
          setAuthLifecycle("signed_out");
          restoreAnonymousDrafts();
          setModule("home");
        }} presentationMode={presentationMode} presentationStatus={presentationPreferenceStatus} presentationMessage={presentationPreferenceMessage} failedPresentationMode={failedPresentationMode} onPresentationModeChange={(mode) => void updatePresentationMode(mode)} onPresentationRetry={retryPresentationModeSave} />}
      </main>
      {searchOpen && (
        <ShellSearchPanel
          query={searchQuery}
          results={searchResults}
          status={searchStatus}
          isOnline={isOnline}
          isAuthenticated={isAuthenticated}
          workspaceStatus={workspaceStatus}
          authLifecycle={authLifecycle}
          highlightedIndex={searchHighlightIndex}
          inputRef={searchInputRef}
          onQueryChange={setSearchQuery}
          onHighlightChange={setSearchHighlightIndex}
          onClose={closeSearch}
          onRetry={retryWorkspaceBootstrap}
          onExecute={executeSearchResult}
          presentationMode={presentationMode}
        />
      )}
      {manualIntakeOpen && (
        <ManualPropertyIntakeDialog
          presentationMode={presentationMode}
          storageScope={storageScope}
          workspaceId={workspaceContext?.workspaceId}
          isAuthenticated={isAuthenticated}
          isOnline={isOnline}
          onClose={() => setManualIntakeOpen(false)}
          onOpenSettings={() => { setManualIntakeOpen(false); setModule("account"); }}
          onSearchCandidates={searchManualPropertyCandidates}
          onComplete={completeManualIntake}
        />
      )}
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
        <Step n="1" title="Start with one property" text="Enter the address or descriptive location, then BRIX creates one Deal workspace." />
        <Step n="2" title="Choose the strategy" text="Owner occupied, rental, BRRRR, flip, seller finance, refinance, tax, development, and partnership paths." />
        <Step n="3" title="Get decision intelligence" text="Confidence, readiness, missing data, strategy comparison, report export, and next actions." />
      </section>
    </main>
  );
}

function ShellSearchPanel({
  query,
  results,
  status,
  isOnline,
  isAuthenticated,
  workspaceStatus,
  authLifecycle,
  highlightedIndex,
  inputRef,
  onQueryChange,
  onHighlightChange,
  onClose,
  onRetry,
  onExecute,
  presentationMode,
}: {
  query: string;
  results: ShellSearchResult[];
  status: SearchStatus;
  isOnline: boolean;
  isAuthenticated: boolean;
  workspaceStatus: "loading" | "ready" | "failed" | "signed_out";
  authLifecycle: "restoring" | "signed_out" | "bootstrapping" | "ready" | "failed" | "signing_out" | "expired";
  highlightedIndex: number;
  inputRef: RefObject<HTMLInputElement>;
  onQueryChange: (query: string) => void;
  onHighlightChange: (index: number) => void;
  onClose: () => void;
  onRetry: () => void;
  onExecute: (result: ShellSearchResult) => void;
  presentationMode: PresentationMode;
}) {
  const unavailableReason = !isOnline
    ? "Search needs a connection to confirm account access."
    : workspaceStatus === "failed" || authLifecycle === "failed"
      ? "Search is temporarily unavailable until account setup is restored."
      : authLifecycle === "expired"
        ? "Sign in again to search saved Deals."
        : null;
  const showLoading = status === "loading" && query.trim().length > 0;
  const showNoResults = status === "ready" && query.trim().length > 0 && results.length === 0;

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      onHighlightChange((highlightedIndex + 1) % results.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      onHighlightChange((highlightedIndex - 1 + results.length) % results.length);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      onExecute(results[Math.min(highlightedIndex, results.length - 1)]);
    }
  }

  return (
    <div className="search-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="shell-search-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shell-search-title"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <div className="search-heading">
          <div>
            <p className="eyebrow">Quick navigation</p>
            <h2 id="shell-search-title">Search BRIX</h2>
          </div>
          <button className="secondary compact-button" type="button" onClick={onClose}>
            <X size={16} /> Close
          </button>
        </div>
        <label className="search-input-row" htmlFor="shell-search-input">
          <Search size={18} />
          <input
            ref={inputRef}
            id="shell-search-input"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search saved Deals"
            aria-describedby="shell-search-help"
          />
          <kbd>Esc</kbd>
        </label>
        <p id="shell-search-help" className="search-help">
          {presentationMode === "professional"
            ? "Search saved Deals. Arrow keys move, Enter opens."
            : "Search saved Deals by address, location, strategy, or status. Use arrow keys and Enter to open a result."}
        </p>

        {unavailableReason && (
          <div className="search-state warning" role="status">
            <AlertTriangle size={18} />
            <span>{unavailableReason}</span>
            {(workspaceStatus === "failed" || authLifecycle === "failed") && (
              <button className="secondary compact-button" type="button" onClick={onRetry}>Retry account setup</button>
            )}
          </div>
        )}

        {!unavailableReason && !isAuthenticated && (
          <div className="search-state" role="status">
            <ShieldCheck size={18} />
            <span>Sign in to search saved cloud Deals. Local drafts stay separate from account Deals.</span>
          </div>
        )}

        {!unavailableReason && showLoading && (
          <div className="search-state" role="status" aria-live="polite">
            <RefreshCw size={18} />
            <span>Updating results...</span>
          </div>
        )}

        {!unavailableReason && showNoResults && (
          <div className="search-state" role="status" aria-live="polite">
            <Search size={18} />
            <span>No saved Deals match this search.</span>
          </div>
        )}

        {!unavailableReason && results.length > 0 && (
          <div className="search-results" role="listbox" aria-label="BRIX search results">
            {results.map((result, index) => (
              <button
                key={result.key}
                id={`shell-search-result-${index}`}
                className={index === highlightedIndex ? "search-result active" : "search-result"}
                type="button"
                role="option"
                aria-selected={index === highlightedIndex}
                onMouseEnter={() => onHighlightChange(index)}
                onClick={() => onExecute(result)}
              >
                <span>
                  <strong>{result.label}</strong>
                  <small>{result.description}</small>
                </span>
                <em>{result.group}</em>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HomeSurface({
  presentationMode,
  isAuthenticated,
  authLifecycle,
  workspaceStatus,
  isOnline,
  deals,
  selectedDeal,
  syncMessage,
  routeMessage,
  onOpenDeal,
  onOpenDeals,
  onOpenSettings,
  onStartIntake,
  onRetry,
}: {
  presentationMode: PresentationMode;
  isAuthenticated: boolean;
  authLifecycle: "restoring" | "signed_out" | "bootstrapping" | "ready" | "failed" | "signing_out" | "expired";
  workspaceStatus: "loading" | "ready" | "failed" | "signed_out";
  isOnline: boolean;
  deals: DealFacts[];
  selectedDeal?: DealFacts;
  syncMessage: string | null;
  routeMessage: string | null;
  onOpenDeal: (dealId?: string) => void;
  onOpenDeals: () => void;
  onOpenSettings: () => void;
  onStartIntake: () => void;
  onRetry: () => void;
}) {
  const hasDeals = deals.length > 0;
  const isProfessional = presentationMode === "professional";
  const isPreparing = authLifecycle === "restoring" || authLifecycle === "bootstrapping" || workspaceStatus === "loading";
  const accountReady = isAuthenticated && authLifecycle === "ready" && workspaceStatus === "ready";
  const attentionItems = buildInvestorAttentionItems({
    isAuthenticated,
    authLifecycle,
    workspaceStatus,
    isOnline,
    deals,
    syncMessage,
    routeMessage,
  });

  return (
    <section className="home-surface">
      <div className="panel hero-panel home-hero">
        <StatusBadge tone={accountReady ? "success" : isAuthenticated ? "warning" : "neutral"}>{accountReady ? "Account ready" : isAuthenticated ? "Account loading" : "Local mode"}</StatusBadge>
        <h2>{accountReady ? isProfessional ? "Ready for deal work." : "Your BRIX account is ready." : isAuthenticated ? "BRIX is confirming your account context." : "Use BRIX locally or sign in when you want cloud continuity."}</h2>
        <p className="quiet">
          {accountReady
            ? isProfessional
              ? "Saved records, account state, and available actions are loaded from your authorized BRIX data."
              : "The shell only shows records that exist in your saved workspace. Start a Deal when you are ready to investigate a Property."
            : isAuthenticated
              ? "Cloud Deal information stays hidden until BRIX confirms your account workspace and permissions."
            : "Local drafts stay on this device until you sign in. Cloud Deals remain separated from local drafts."}
        </p>
        <div className="button-row">
          <button className="primary" onClick={onStartIntake}><Plus size={18} /> Add Deal</button>
          {hasDeals && <button className="primary" onClick={() => onOpenDeal()}><BarChart3 size={18} /> Open Deals</button>}
          <button className="secondary" onClick={onOpenSettings}><UserCircle size={18} /> {isAuthenticated ? "Account settings" : "Sign in"}</button>
        </div>
      </div>

      <InvestorAttentionSurface
        presentationMode={presentationMode}
        items={attentionItems}
        onOpenDeal={onOpenDeal}
        onOpenDeals={onOpenDeals}
        onOpenSettings={onOpenSettings}
        onRetry={onRetry}
      />

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
          <button className="primary" onClick={() => onOpenDeal()}>Open Deals</button>
        </section>
      ) : (
        <EmptyState
          title="No saved Deals yet"
          text="Start with an address or descriptive location. Optional details can stay blank until you know them."
          actionLabel="Add Deal"
          onAction={onStartIntake}
        />
      )}
    </section>
  );
}

function InvestorAttentionSurface({
  presentationMode,
  items,
  onOpenDeal,
  onOpenDeals,
  onOpenSettings,
  onRetry,
}: {
  presentationMode: PresentationMode;
  items: InvestorAttentionItem[];
  onOpenDeal: (dealId?: string) => void;
  onOpenDeals: () => void;
  onOpenSettings: () => void;
  onRetry: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <section className="panel attention-surface" aria-labelledby="investor-attention-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Attention</p>
          <h2 id="investor-attention-title">{presentationMode === "professional" ? "Attention" : "What needs attention now"}</h2>
        </div>
      </div>
      <div className="attention-list">
        {items.map((item) => (
          <article className={`attention-item ${item.tone}`} key={item.key}>
            <div className="attention-marker" aria-hidden="true">
              {item.tone === "success" ? <CheckCircle2 size={18} /> : item.tone === "neutral" ? <RefreshCw size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div className="attention-copy">
              <div className="attention-title-row">
                <strong>{item.title}</strong>
                <StatusBadge tone={item.tone}>{item.category}</StatusBadge>
              </div>
              <p>{item.detail}</p>
            </div>
            {item.action && item.actionLabel && (
              <button
                className={item.tone === "danger" || item.tone === "warning" ? "secondary compact-button" : "primary compact-button"}
                type="button"
                onClick={() => {
                  if (item.action === "openDeal") onOpenDeal(item.dealId);
                  if (item.action === "openDeals") onOpenDeals();
                  if (item.action === "retryWorkspace") onRetry();
                  if (item.action === "openSettings") onOpenSettings();
                }}
              >
                {item.action === "retryWorkspace" && <RefreshCw size={15} />}
                {item.actionLabel}
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function DealsSurface({
  presentationMode,
  authLifecycle,
  workspaceStatus,
  workspaceId,
  storageScope,
  isAuthenticated,
  isOnline,
  deals,
  recentDeals,
  selectedId,
  onOpenDeal,
  onStartIntake,
  onRetry,
  onArchived,
  onRestored,
}: {
  presentationMode: PresentationMode;
  authLifecycle: "restoring" | "signed_out" | "bootstrapping" | "ready" | "failed" | "signing_out" | "expired";
  workspaceStatus: "loading" | "ready" | "failed" | "signed_out";
  workspaceId?: string;
  storageScope: string;
  isAuthenticated: boolean;
  isOnline: boolean;
  deals: DealFacts[];
  recentDeals: DealFacts[];
  selectedId: string | null;
  onOpenDeal: (id: string) => void;
  onStartIntake: () => void;
  onRetry: () => void;
  onArchived: (id: string) => void;
  onRestored: (deal: DealFacts) => void;
}) {
  const isPreparing = authLifecycle === "restoring" || authLifecycle === "bootstrapping" || workspaceStatus === "loading";
  const isProfessional = presentationMode === "professional";
  const filterStorageKey = `brix.deals.filters:${storageScope}`;
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<DealProjectionSort>("updated_desc");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const [filters, setFilters] = useState<DealProjectionFilters>(() => readDealProjectionFilters(filterStorageKey));
  const [page, setPage] = useState<ProjectionPageState>({ status: "idle", deals: [], totalCount: 0, activeCount: 0, archivedCount: 0 });
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<null | { type: "archive" | "restore"; deal: DealListProjection }>(null);
  const requestRef = useRef(0);
  const pageSize = 10;

  useEffect(() => {
    if (!isAuthenticated || workspaceStatus !== "ready" || !workspaceId) return;
    writeDealProjectionFilters(filterStorageKey, filters);
  }, [filterStorageKey, filters, isAuthenticated, workspaceId, workspaceStatus]);

  const loadPage = useCallback(async () => {
    if (!isAuthenticated || workspaceStatus !== "ready" || !workspaceId) return;
    if (!isOnline) {
      setPage((current) => ({ ...current, status: "offline" }));
      setMessage("Connection is unavailable. Existing results are preserved; retry when you are back online.");
      return;
    }
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setPage((current) => ({ ...current, status: current.deals.length ? "stale" : "loading" }));
    setMessage("");
    try {
      const next = await listDealProjections(workspaceId, {
        pageSize,
        pageOffset,
        sort,
        search,
        filters,
        includeArchived,
      });
      if (requestRef.current !== requestId) return;
      setPage({
        status: "ready",
        deals: next.deals,
        totalCount: next.totalCount,
        activeCount: next.activeCount,
        archivedCount: next.archivedCount,
      });
    } catch (error) {
      if (requestRef.current !== requestId) return;
      const safe = safeDealCommandMessage(error);
      setPage((current) => ({ ...current, status: safe.status === "permission" ? "permission" : "failed" }));
      setMessage(safe.message);
    }
  }, [filters, includeArchived, isAuthenticated, isOnline, pageOffset, search, sort, workspaceId, workspaceStatus]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  function updateFilters(update: DealProjectionFilters) {
    setFilters(update);
    setPageOffset(0);
  }

  function clearOneFilter(key: keyof DealProjectionFilters) {
    const next = { ...filters };
    delete next[key];
    updateFilters(next);
  }

  async function confirmArchiveOrRestore() {
    if (!pendingAction) return;
    if (!isOnline) {
      setMessage("Connection is unavailable. Retry when you are back online.");
      return;
    }
    setPage((current) => ({ ...current, status: "saving" }));
    setMessage(pendingAction.type === "archive" ? "Archiving Deal..." : "Restoring Deal...");
    try {
      if (pendingAction.type === "archive") {
        await archiveDeal(pendingAction.deal);
        onArchived(pendingAction.deal.dealId);
        setMessage("Deal archived. Related records and history were preserved.");
      } else {
        await restoreDeal(pendingAction.deal);
        const detail = await loadDealDetail(pendingAction.deal.dealId);
        onRestored(detail.deal);
        setMessage("Deal restored. Review the restored Deal before relying on old assumptions.");
      }
      setPendingAction(null);
      await loadPage();
    } catch (error) {
      const safe = safeDealCommandMessage(error);
      setPage((current) => ({ ...current, status: safe.status === "stale" ? "stale" : "failed" }));
      setMessage(safe.message);
    }
  }

  const isFiltered = Boolean(search.trim()) || hasDealProjectionFilters(filters);
  const finalPage = pageOffset + pageSize >= page.totalCount;
  const visibleDeals = isAuthenticated ? page.deals : deals.map(localDealProjection);

  if (workspaceStatus === "failed") {
    return (
      <EmptyState
        title="Deals are unavailable"
        text="BRIX could not confirm your workspace, so cloud Deals are hidden until access is verified."
        actionLabel="Retry setup"
        onAction={onRetry}
      />
    );
  }
  if (isPreparing) {
    return (
      <EmptyState
        title="Loading Deals"
        text="BRIX is confirming your workspace before showing saved Deal records."
      />
    );
  }
  if (!isAuthenticated && !deals.length) {
    return (
      <EmptyState
        title="No Deals yet"
        text="When a Deal exists in this account, it will appear here. BRIX does not show sample records or another user's work."
      />
    );
  }

  return (
    <section className="deals-surface">
      {recentDeals.length > 0 && (
        <div className="panel wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Recently opened</p>
              <h2>Continue where you left off</h2>
            </div>
          </div>
          <div className="recent-deal-row">
            {recentDeals.map((deal) => (
              <button key={deal.id} className={deal.id === selectedId ? "recent-deal-card active" : "recent-deal-card"} type="button" onClick={() => onOpenDeal(deal.id)}>
                <strong>{dealTitle(deal)}</strong>
                <span>{dealLocation(deal)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="panel wide">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Saved Deals</p>
            <h2>{isProfessional ? "Deal records" : "Authorized Deal records"}</h2>
            <p className="quiet">{isAuthenticated ? "Search, filters, sorting, archive, and restore use canonical account records." : "Local drafts are shown from this device until you sign in."}</p>
          </div>
          <div className="button-row">
            <button className="primary compact" type="button" onClick={onStartIntake}><Plus size={16} /> Add Deal</button>
            <StatusBadge tone="neutral">{isAuthenticated ? `${page.totalCount} matching` : `${deals.length} local`}</StatusBadge>
          </div>
        </div>

        {isAuthenticated && (
          <div className="deal-controls" aria-label="Deal search and filters">
            <label className="field deal-search-field">
              <span>Search Deals</span>
              <input value={search} onChange={(event) => { setSearch(event.target.value); setPageOffset(0); }} placeholder="Name, address, contact, organization" />
            </label>
            <label className="field compact-field">
              <span>Stage</span>
              <select value={filters.stages?.[0] ?? ""} onChange={(event) => updateFilters({ ...filters, stages: event.target.value ? [event.target.value as CanonicalDealStage] : undefined })}>
                <option value="">Any stage</option>
                {dealStageOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="field compact-field">
              <span>Status</span>
              <select value={filters.statuses?.[0] ?? ""} onChange={(event) => updateFilters({ ...filters, statuses: event.target.value ? [event.target.value as CanonicalDealOperatingStatus] : undefined })}>
                <option value="">Any status</option>
                {dealOperatingStatusOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="field compact-field">
              <span>Priority</span>
              <select value={filters.priorities?.[0] ?? ""} onChange={(event) => updateFilters({ ...filters, priorities: event.target.value ? [event.target.value as DealPriority] : undefined })}>
                <option value="">Any priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </label>
            <label className="field compact-field">
              <span>Attention</span>
              <select value={filters.attention ?? "any"} onChange={(event) => updateFilters({ ...filters, attention: event.target.value as "any" | DealAttentionState })}>
                <option value="any">Any</option>
                <option value="overdue">Overdue</option>
                <option value="open_work">Open work</option>
                <option value="none">No open work</option>
              </select>
            </label>
            <label className="field compact-field">
              <span>Sort</span>
              <select value={sort} onChange={(event) => { setSort(event.target.value as DealProjectionSort); setPageOffset(0); }}>
                <option value="updated_desc">Recently updated</option>
                <option value="updated_asc">Oldest updated</option>
                <option value="created_desc">Newest created</option>
                <option value="created_asc">Oldest created</option>
                <option value="name_asc">Deal name</option>
                <option value="address_asc">Property address</option>
                <option value="priority_desc">Priority</option>
                <option value="stage_asc">Stage</option>
              </select>
            </label>
            <label className="toggle-field">
              <input type="checkbox" checked={includeArchived} onChange={(event) => { setIncludeArchived(event.target.checked); setPageOffset(0); }} />
              <span>Show archived Deals</span>
            </label>
          </div>
        )}

        {isAuthenticated && isFiltered && (
          <div className="active-filter-row" aria-label="Active Deal filters">
            {search.trim() && <button type="button" className="filter-chip" onClick={() => { setSearch(""); setPageOffset(0); }}>Search: {search}</button>}
            {filters.stages?.[0] && <button type="button" className="filter-chip" onClick={() => clearOneFilter("stages")}>Stage: {labelForStage(filters.stages[0])}</button>}
            {filters.statuses?.[0] && <button type="button" className="filter-chip" onClick={() => clearOneFilter("statuses")}>Status: {labelForOperatingStatus(filters.statuses[0])}</button>}
            {filters.priorities?.[0] && <button type="button" className="filter-chip" onClick={() => clearOneFilter("priorities")}>Priority: {filters.priorities[0]}</button>}
            {filters.attention && filters.attention !== "any" && <button type="button" className="filter-chip" onClick={() => clearOneFilter("attention")}>Attention: {attentionLabel(filters.attention)}</button>}
            <button type="button" className="secondary compact" onClick={() => { setSearch(""); updateFilters({}); }}>Clear all</button>
          </div>
        )}

        {message && <p className={page.status === "failed" || page.status === "permission" ? "error" : "quiet"} role="status">{message}</p>}
        {isAuthenticated && page.status === "loading" && <p className="quiet" role="status">Loading Deals...</p>}
        {isAuthenticated && page.status === "offline" && <p className="error" role="status">Deals cannot refresh while offline.</p>}
        {isAuthenticated && page.status === "permission" && <EmptyState title="Deals are unavailable" text="Your current access does not allow this Deal list." actionLabel="Retry" onAction={() => void loadPage()} />}
        {isAuthenticated && page.status !== "permission" && page.status !== "loading" && !visibleDeals.length && (
          <EmptyState
            title={isFiltered ? "No matching Deals" : includeArchived ? "No archived Deals" : "No active Deals"}
            text={isFiltered ? "Clear a search term or filter to widen the canonical Deal list." : includeArchived ? "Archived Deals will appear here after you explicitly show archived records." : "Active Deals appear here after they are created or restored."}
            actionLabel={!isFiltered && !includeArchived ? "Add Deal" : undefined}
            onAction={!isFiltered && !includeArchived ? onStartIntake : undefined}
          />
        )}

        {visibleDeals.length > 0 && (
          <div className="deal-list" role="list" aria-label="Saved Deals">
            {visibleDeals.map((deal) => {
            const sourceDeal = isAuthenticated ? null : deals.find((localDeal) => localDeal.id === deal.dealId);
            const analysis = sourceDeal ? analyzeDeal(sourceDeal) : null;
            const secondaryLocation = deal.primaryPropertyAddress && deal.primaryPropertyAddress !== deal.displayName ? deal.primaryPropertyAddress : "Location not entered";
            return (
              <article key={deal.dealId} className={deal.dealId === selectedId ? "deal-list-row active" : "deal-list-row"} role="listitem">
                <div>
                  <strong>{deal.displayName}</strong>
                  <span>{secondaryLocation}</span>
                </div>
                <div>
                  <small>State</small>
                  <b>{deal.archivedAt ? "Archived" : labelForOperatingStatus(deal.status)}</b>
                </div>
                <div>
                  <small>{isAuthenticated ? "Attention" : "Decision"}</small>
                  <b>{isAuthenticated ? attentionLabel(deal.attentionState) : analysis?.decision}</b>
                </div>
                <div>
                  <small>Updated</small>
                  <b>{formatShortDate(deal.updatedAt)}</b>
                </div>
                <div className="deal-row-actions">
                  <button className="primary" type="button" onClick={() => onOpenDeal(deal.dealId)}>Open Deal</button>
                  {isAuthenticated && !deal.archivedAt && <button className="archive-button" type="button" onClick={() => setPendingAction({ type: "archive", deal })}>Archive</button>}
                  {isAuthenticated && deal.archivedAt && <button className="secondary compact" type="button" onClick={() => setPendingAction({ type: "restore", deal })}>Restore</button>}
                </div>
              </article>
            );
          })}
          </div>
        )}

        {isAuthenticated && page.totalCount > 0 && (
          <div className="pagination-row">
            <span>Showing {pageOffset + 1}-{Math.min(pageOffset + pageSize, page.totalCount)} of {page.totalCount}. Active {page.activeCount}, archived {page.archivedCount}.</span>
            <div className="button-row">
              <button className="secondary compact" type="button" disabled={pageOffset === 0 || page.status === "saving"} onClick={() => setPageOffset(Math.max(0, pageOffset - pageSize))}>Previous</button>
              <button className="secondary compact" type="button" disabled={finalPage || page.status === "saving"} onClick={() => setPageOffset(pageOffset + pageSize)}>Next</button>
            </div>
          </div>
        )}
      </div>
      {pendingAction && (
        <div className="modal-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="deal-archive-title">
            <p className="eyebrow">{pendingAction.type === "archive" ? "Archive Deal" : "Restore Deal"}</p>
            <h2 id="deal-archive-title">{pendingAction.type === "archive" ? "Archive this Deal?" : "Restore this Deal?"}</h2>
            <p className="quiet">
              {pendingAction.type === "archive"
                ? "The Deal will leave the active list. Property, people, tasks, notes, and history stay intact."
                : "The same canonical Deal will return to the active list. Review stale assumptions before acting on it."}
            </p>
            <strong>{pendingAction.deal.displayName}</strong>
            <div className="button-row">
              <button className="secondary" type="button" onClick={() => setPendingAction(null)}>Cancel</button>
              <button className={pendingAction.type === "archive" ? "archive-button" : "primary"} type="button" onClick={confirmArchiveOrRestore} disabled={page.status === "saving"}>
                {page.status === "saving" ? "Saving..." : pendingAction.type === "archive" ? "Archive Deal" : "Restore Deal"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

type ProjectionPageState = {
  status: "idle" | "loading" | "ready" | "stale" | "saving" | "offline" | "permission" | "failed";
  deals: DealListProjection[];
  totalCount: number;
  activeCount: number;
  archivedCount: number;
};

function localDealProjection(deal: DealFacts): DealListProjection {
  return {
    dealId: deal.id,
    dealVersion: deal.dealVersion ?? 1,
    workspaceId: "local",
    displayName: dealTitle(deal),
    primaryPropertyId: deal.propertyId,
    primaryPropertyVersion: deal.propertyVersion,
    primaryPropertyAddress: dealLocation(deal),
    stage: deal.status === "passed" ? "passed" : deal.status === "closed" ? "sold" : deal.status === "under_contract" ? "under_contract" : "lead",
    status: deal.status === "passed" ? "passed" : deal.status === "closed" ? "closed_won" : "active",
    priority: "normal",
    source: "local",
    strategyIntent: deal.strategyId,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
    attentionState: "none",
    openWorkCount: 0,
    relationshipCount: 0,
    totalCount: 1,
    activeCount: 1,
    archivedCount: 0,
  };
}

function readDealProjectionFilters(storageKey: string): DealProjectionFilters {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return {
      stages: Array.isArray(parsed.stages) ? parsed.stages.filter(isCanonicalDealStage) : undefined,
      statuses: Array.isArray(parsed.statuses) ? parsed.statuses.filter(isCanonicalDealOperatingStatus) : undefined,
      priorities: Array.isArray(parsed.priorities) ? parsed.priorities.filter(isDealPriority) : undefined,
      attention: parsed.attention === "open_work" || parsed.attention === "overdue" || parsed.attention === "none" || parsed.attention === "any" ? parsed.attention : undefined,
    };
  } catch {
    return {};
  }
}

function writeDealProjectionFilters(storageKey: string, filters: DealProjectionFilters) {
  localStorage.setItem(storageKey, JSON.stringify(filters));
}

function hasDealProjectionFilters(filters: DealProjectionFilters) {
  return Boolean(filters.stages?.length || filters.statuses?.length || filters.priorities?.length || filters.sources?.length || filters.attention && filters.attention !== "any" || filters.propertyText || filters.createdFrom || filters.createdTo || filters.updatedFrom || filters.updatedTo);
}

function labelForStage(stage: CanonicalDealStage) {
  return dealStageOptions.find((item) => item.id === stage)?.label ?? stage;
}

function labelForOperatingStatus(status: CanonicalDealOperatingStatus) {
  return dealOperatingStatusOptions.find((item) => item.id === status)?.label ?? status;
}

function attentionLabel(attention: DealAttentionState | "any") {
  if (attention === "overdue") return "Overdue";
  if (attention === "open_work") return "Open work";
  if (attention === "none") return "No open work";
  return "Any";
}

function isDealPriority(value: unknown): value is DealPriority {
  return value === "low" || value === "normal" || value === "high" || value === "urgent";
}

function isCanonicalDealOperatingStatus(value: unknown): value is CanonicalDealOperatingStatus {
  return typeof value === "string" && dealOperatingStatusOptions.some((item) => item.id === value);
}

function isCanonicalDealStage(value: unknown): value is CanonicalDealStage {
  return typeof value === "string" && dealStageOptions.some((item) => item.id === value);
}

function ManualPropertyIntakeDialog({
  presentationMode,
  storageScope,
  workspaceId,
  isAuthenticated,
  isOnline,
  onClose,
  onOpenSettings,
  onSearchCandidates,
  onComplete,
}: {
  presentationMode: PresentationMode;
  storageScope: string;
  workspaceId?: string;
  isAuthenticated: boolean;
  isOnline: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onSearchCandidates: (workspaceId: string, draft: ManualIntakeDraft) => Promise<ManualPropertyCandidate[]>;
  onComplete: (draft: ManualIntakeDraft) => Promise<DealFacts>;
}) {
  const [draft, setDraft] = useState<ManualIntakeDraft>(() => loadManualIntakeDraft(storageScope) ?? createManualIntakeDraft());
  const [step, setStep] = useState<"property" | "match" | "review" | "complete">("property");
  const [candidates, setCandidates] = useState<ManualPropertyCandidate[]>([]);
  const [status, setStatus] = useState<"draft" | "local" | "searching" | "awaiting_decision" | "creating" | "complete" | "failed" | "offline" | "permission" | "conflict" | "cancelled">("draft");
  const [listingStatus, setListingStatus] = useState<"idle" | "importing" | "complete" | "failed" | "unsupported">("idle");
  const [message, setMessage] = useState("");
  const [listingMessage, setListingMessage] = useState("");
  const [errorSummary, setErrorSummary] = useState<string[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isProfessional = presentationMode === "professional";

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  function updateDraft(update: Partial<ManualIntakeDraft>) {
    const next = saveManualIntakeDraft(storageScope, { ...draft, ...update });
    setDraft(next);
    setStatus("local");
    setMessage("Saved on this device.");
  }

  async function reviewListingUrl() {
    if (!draft.sourceUrl?.trim()) {
      setListingStatus("failed");
      setListingMessage("Paste a listing URL before importing.");
      return;
    }
    setListingStatus("importing");
    setListingMessage("Reviewing the listing URL.");
    try {
      const listingImport = await importListingUrl(draft.sourceUrl);
      const next = saveManualIntakeDraft(storageScope, attachListingImportToDraft(draft, listingImport));
      setDraft(next);
      setListingStatus(listingImport.status === "unsupported" ? "unsupported" : listingImport.status === "failed" ? "failed" : "complete");
      setListingMessage(listingImport.safeMessage);
    } catch (error) {
      setListingStatus("failed");
      setListingMessage(safeDealCommandMessage(error).message);
    }
  }

  function updateProposal(proposalId: string, proposalStatus: "accepted" | "edited" | "rejected" | "deferred") {
    const next = saveManualIntakeDraft(storageScope, applyListingProposal(draft, proposalId, proposalStatus));
    setDraft(next);
    setStatus("local");
    setMessage(proposalStatus === "accepted" || proposalStatus === "edited" ? "Proposal accepted into editable fields." : "Proposal decision saved.");
  }

  async function searchMatches() {
    const errors = validateManualIntakeDraft(draft);
    setErrorSummary(errors);
    if (errors.length) {
      setStatus("failed");
      setMessage("Fix the highlighted fields and try again.");
      return;
    }
    if (!isAuthenticated) {
      setStatus("permission");
      setMessage("Sign in before creating a canonical Property and Deal.");
      return;
    }
    if (!isOnline || !workspaceId) {
      setCandidates([]);
      updateDraft({ duplicateDecision: "create_new_property", selectedPropertyId: undefined });
      setStatus("offline");
      setMessage("Saved on this device. BRIX will re-check existing Properties before syncing.");
      setStep("review");
      return;
    }
    setStatus("searching");
    setMessage("Checking your existing Properties.");
    try {
      const results = await onSearchCandidates(workspaceId, draft);
      setCandidates(results);
      setStatus(results.length ? "awaiting_decision" : "draft");
      setMessage(results.length ? "Review possible matches before creating the Deal." : "No existing Property match was found in this workspace.");
      if (!results.length) updateDraft({ duplicateDecision: "create_new_property", selectedPropertyId: undefined });
      setStep(results.length ? "match" : "review");
    } catch (error) {
      const safe = safeDealCommandMessage(error);
      setStatus(safe.status === "permission" ? "permission" : "failed");
      setMessage(safe.message);
    }
  }

  async function createDealFromIntake() {
    const errors = validateManualIntakeDraft(draft);
    if (draft.duplicateDecision === "use_existing_property" && !draft.selectedPropertyId) errors.push("Choose the existing Property to use.");
    setErrorSummary(errors);
    if (errors.length) {
      setStatus("failed");
      setMessage("Resolve the missing manual intake items before creating the Deal.");
      return;
    }
    setStatus(isOnline ? "creating" : "offline");
    setMessage(isOnline ? "Creating the canonical Property and Deal." : "Saving this intake on your device.");
    try {
      await onComplete(draft);
      clearManualIntakeDraft(storageScope);
    } catch (error) {
      const safe = safeDealCommandMessage(error);
      setStatus(safe.status === "permission" ? "permission" : safe.status === "stale" ? "conflict" : "failed");
      setMessage(safe.message);
    }
  }

  function cancelIntake() {
    if (!window.confirm("Cancel this manual intake? Saved local input for this intake will be removed.")) return;
    clearManualIntakeDraft(storageScope);
    setStatus("cancelled");
    onClose();
  }

  const classificationItems = [
    { label: "Location", value: draft.address ? "User-entered fact, unverified" : "Unknown" },
    { label: "Asking price", value: draft.askingPrice ? "User-entered fact, unverified" : "Unknown" },
    { label: "Expected price", value: draft.expectedPrice ? "User assumption" : "Unknown" },
    { label: "Strategy", value: draft.intendedStrategy ? "User intent" : "Unknown" },
    { label: "Listing URL", value: draft.sourceUrl ? "Source-linked candidate values, unverified" : "Not supplied" },
  ];
  const listingSummary = proposalSummary(draft.listingProposals);

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="manual-intake-dialog" role="dialog" aria-modal="true" aria-labelledby="manual-intake-title">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">Manual Property Intake</p>
            <h2 id="manual-intake-title" ref={headingRef} tabIndex={-1}>{step === "property" ? "Property and opportunity" : step === "match" ? "Possible Property match" : step === "review" ? "Review manual intake" : "Intake complete"}</h2>
            <p className="quiet">{isProfessional ? "Manual intake creates one canonical Deal through the server command." : "Start with what you know. Unknown optional values can stay blank and be verified later."}</p>
          </div>
          <button className="icon-button" type="button" aria-label="Close manual intake" onClick={onClose}><X size={18} /></button>
        </div>

        {message && <p className={status === "failed" || status === "permission" || status === "conflict" ? "error" : "quiet"} role="status" aria-live="polite">{message}</p>}
        {errorSummary.length > 0 && (
          <div className="intake-error-summary" role="alert">
            <strong>Review before continuing</strong>
            {errorSummary.map((item) => <span key={item}>{item}</span>)}
          </div>
        )}
        {!isAuthenticated && (
          <ShellNotice tone="warning" title="Sign in required">
            <span>Manual intake creates protected Property and Deal records in your BRIX account.</span>
            <button className="secondary compact" type="button" onClick={onOpenSettings}>Sign in</button>
          </ShellNotice>
        )}

        {step === "property" && (
          <div className="manual-intake-grid">
            <section className="workspace-card wide source-review-panel">
              <div className="panel-heading-row">
                <div>
                  <p className="eyebrow">Listing URL</p>
                  <h3>Import source candidates</h3>
                  <p className="quiet">BRIX stores the URL, classifies the source, and proposes only values it can safely identify. You decide what enters the Deal.</p>
                </div>
                {draft.listingImport && <span className={draft.listingImport.supportLevel === "unsupported" ? "status-chip warning" : "status-chip info"}>{draft.listingImport.supportLevel}</span>}
              </div>
              <label className="field">
                <span>Listing URL <small>Optional</small></span>
                <input value={draft.sourceUrl ?? ""} onChange={(event) => updateDraft({ sourceUrl: event.target.value, listingImport: undefined, listingProposals: undefined })} />
              </label>
              <div className="button-row">
                <button className="secondary compact" type="button" onClick={() => void reviewListingUrl()} disabled={listingStatus === "importing"}>{listingStatus === "importing" ? "Reviewing..." : "Review URL"}</button>
                {draft.listingImport && <span className="quiet">{listingSummary.accepted} accepted, {listingSummary.deferred} deferred, {listingSummary.rejected} rejected</span>}
              </div>
              {listingMessage && <p className={listingStatus === "failed" || listingStatus === "unsupported" ? "error" : "quiet"} role="status" aria-live="polite">{listingMessage}</p>}
              {draft.listingImport && (
                <div className="source-facts">
                  <DefinitionList items={[
                    { label: "Source", value: draft.listingImport.sourceDisplayName },
                    { label: "Support", value: draft.listingImport.supportLevel },
                    { label: "Retrieved", value: formatIntakeDateTime(draft.listingImport.retrievedAt) },
                    { label: "Adapter", value: draft.listingImport.adapterVersion },
                  ]} />
                  <p className="quiet">{draft.listingImport.licensingNotes}</p>
                </div>
              )}
              {draft.listingProposals && draft.listingProposals.length > 0 && (
                <div className="proposal-list" role="list" aria-label="Listing URL proposed values">
                  {draft.listingProposals.map((proposal) => (
                    <article key={proposal.id} className="proposal-card" role="listitem">
                      <div>
                        <strong>{proposal.label}</strong>
                        <span>{proposal.displayValue}</span>
                        <small>{proposal.classification}; confidence {proposal.confidence}/100; {proposal.verificationState}</small>
                      </div>
                      <div className="button-row">
                        <button className={proposal.status === "accepted" || proposal.status === "edited" ? "primary compact" : "secondary compact"} type="button" onClick={() => updateProposal(proposal.id, "accepted")}>Accept</button>
                        <button className={proposal.status === "edited" ? "primary compact" : "secondary compact"} type="button" onClick={() => updateProposal(proposal.id, "edited")}>Accept/edit</button>
                        <button className={proposal.status === "rejected" ? "primary compact" : "secondary compact"} type="button" onClick={() => updateProposal(proposal.id, "rejected")}>Reject</button>
                        <button className={proposal.status === "deferred" ? "primary compact" : "secondary compact"} type="button" onClick={() => updateProposal(proposal.id, "deferred")}>Defer</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            <label className="field wide">
              <span>Opportunity name <small>Required</small></span>
              <input value={draft.opportunityName} onChange={(event) => updateDraft({ opportunityName: event.target.value })} placeholder="Maple Street duplex lead" />
            </label>
            <label className="field wide">
              <span>Address or descriptive location <small>Required</small></span>
              <input value={draft.address} onChange={(event) => updateDraft({ address: event.target.value })} placeholder="123 Maple St or 10-acre parcel near Highway 8" />
            </label>
            <label className="field">
              <span>Unit number <small>Optional</small></span>
              <input value={draft.unitNumber ?? ""} onChange={(event) => updateDraft({ unitNumber: event.target.value })} />
            </label>
            <label className="field">
              <span>City <small>Optional</small></span>
              <input value={draft.city ?? ""} onChange={(event) => updateDraft({ city: event.target.value })} />
            </label>
            <label className="field">
              <span>State or region <small>Optional</small></span>
              <input value={draft.region ?? ""} onChange={(event) => updateDraft({ region: event.target.value.toUpperCase() })} />
            </label>
            <label className="field">
              <span>Postal code <small>Optional</small></span>
              <input value={draft.postalCode ?? ""} onChange={(event) => updateDraft({ postalCode: event.target.value })} />
            </label>
            <label className="field">
              <span>Property type <small>Optional</small></span>
              <input value={draft.propertyType ?? ""} onChange={(event) => updateDraft({ propertyType: event.target.value })} placeholder="Single family, duplex, land" />
            </label>
            <label className="field">
              <span>Asking price <small>Optional</small></span>
              <input inputMode="decimal" value={draft.askingPrice ?? ""} onChange={(event) => updateDraft({ askingPrice: event.target.value })} />
            </label>
            <label className="field">
              <span>Expected price <small>Optional assumption</small></span>
              <input inputMode="decimal" value={draft.expectedPrice ?? ""} onChange={(event) => updateDraft({ expectedPrice: event.target.value })} />
            </label>
            <label className="field">
              <span>Intended strategy <small>Optional</small></span>
              <select value={draft.intendedStrategy ?? "owner_occupant"} onChange={(event) => updateDraft({ intendedStrategy: event.target.value as StrategyId })}>
                {strategyCatalog.map((strategy) => <option value={strategy.id} key={strategy.id}>{strategy.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Source <small>Optional</small></span>
              <input value={draft.source ?? ""} onChange={(event) => updateDraft({ source: event.target.value })} placeholder="Seller, drive-by, broker call" />
            </label>
            <label className="field">
              <span>Source contact <small>Optional</small></span>
              <input value={draft.sourceContact ?? ""} onChange={(event) => updateDraft({ sourceContact: event.target.value })} />
            </label>
            <label className="field wide">
              <span>Notes <small>Optional</small></span>
              <textarea rows={3} value={draft.notes ?? ""} onChange={(event) => updateDraft({ notes: event.target.value })} />
            </label>
          </div>
        )}

        {step === "match" && (
          <div className="candidate-list" role="list" aria-label="Possible Property matches">
            {candidates.map((candidate) => (
              <article className={draft.selectedPropertyId === candidate.propertyId ? "candidate-card selected" : "candidate-card"} key={candidate.propertyId} role="listitem">
                <div>
                  <strong>{candidate.displayAddress}</strong>
                  <span>{[candidate.city, candidate.region, candidate.postalCode].filter(Boolean).join(", ") || candidate.country}</span>
                </div>
                <p>{candidate.matchReasons.join(", ")}</p>
                {candidate.materialDifferences.length > 0 && <small>Differences: {candidate.materialDifferences.join(", ")}</small>}
                <small>{candidate.activeDealCount} active Deal{candidate.activeDealCount === 1 ? "" : "s"} linked</small>
                <button className="secondary compact" type="button" onClick={() => updateDraft({ duplicateDecision: "use_existing_property", selectedPropertyId: candidate.propertyId })}>Use this Property</button>
              </article>
            ))}
            <button className="secondary" type="button" onClick={() => { updateDraft({ duplicateDecision: "create_new_property", selectedPropertyId: undefined }); setStep("review"); }}>Create a new Property instead</button>
          </div>
        )}

        {step === "review" && (
          <div className="review-grid">
            <section className="workspace-card">
              <p className="eyebrow">Entered values</p>
              <DefinitionList items={[
                { label: "Opportunity", value: draft.opportunityName },
                { label: "Location", value: draft.address },
                { label: "Unit", value: draft.unitNumber },
                { label: "City", value: draft.city },
                { label: "State", value: draft.region },
                { label: "Postal", value: draft.postalCode },
                { label: "Type", value: draft.propertyType },
                { label: "Source", value: draft.source },
                { label: "Listing URL", value: draft.sourceUrl },
              ]} />
            </section>
            <section className="workspace-card">
              <p className="eyebrow">Classification</p>
              <DefinitionList items={classificationItems} />
            </section>
            <section className="workspace-card wide">
              <p className="eyebrow">Duplicate decision</p>
              <div className="button-row">
                <button className={draft.duplicateDecision === "create_new_property" ? "primary compact" : "secondary compact"} type="button" onClick={() => updateDraft({ duplicateDecision: "create_new_property", selectedPropertyId: undefined })}>Create new Property</button>
                {candidates.length > 0 && <button className="secondary compact" type="button" onClick={() => setStep("match")}>Review matches</button>}
              </div>
              <p className="quiet">{draft.duplicateDecision === "use_existing_property" ? "This Deal will use the selected existing Property." : "BRIX will create a new canonical Property for this Deal."}</p>
            </section>
          </div>
        )}

        {step === "complete" && <EmptyState title="Manual intake complete" text="The canonical Deal workspace is opening with the saved Property, source, and manual classifications." />}

        <div className="manual-intake-actions">
          <button className="secondary" type="button" onClick={cancelIntake}>Cancel intake</button>
          {step !== "property" && step !== "complete" && <button className="secondary" type="button" onClick={() => setStep(step === "match" ? "property" : candidates.length ? "match" : "property")}>Back</button>}
          {step === "property" && <button className="primary" type="button" onClick={() => void searchMatches()} disabled={status === "searching"}>{status === "searching" ? "Searching..." : "Next: check matches"}</button>}
          {step === "match" && <button className="primary" type="button" onClick={() => setStep("review")} disabled={!draft.duplicateDecision}>Review intake</button>}
          {step === "review" && <button className="primary" type="button" onClick={() => void createDealFromIntake()} disabled={status === "creating"}>{status === "creating" ? "Creating..." : isOnline ? "Create Deal" : "Save on this device"}</button>}
        </div>
      </section>
    </div>
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

function formatIntakeDateTime(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

type DealWorkspaceSection = "overview" | "property" | "people" | "work" | "notes" | "history";

const dealWorkspaceSections: Array<{ id: DealWorkspaceSection; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "property", label: "Property" },
  { id: "people", label: "People" },
  { id: "work", label: "Work" },
  { id: "notes", label: "Notes" },
  { id: "history", label: "History" },
];

function workspaceSectionFromLocation(): DealWorkspaceSection {
  const value = new URLSearchParams(window.location.search).get("section");
  return dealWorkspaceSections.some((section) => section.id === value) ? value as DealWorkspaceSection : "overview";
}

function dealWorkspaceUrl(dealId: string, section: DealWorkspaceSection) {
  const base = dealPath(dealId);
  return section === "overview" ? base : `${base}?section=${section}`;
}

type DealIQProps = {
  deal?: DealFacts;
  workspaceId?: string;
  userId?: string | null;
  draftScope: OfflineDraftScope;
  offlineDrafts: OfflineDraft[];
  isAuthenticated: boolean;
  isOnline: boolean;
  onChange: (deal: DealFacts) => void;
  onCanonicalSaved: (deal: DealFacts) => void;
  onDelete: (id: string) => void;
  onDraftQueued: (draft: OfflineDraft, message: string) => Promise<void>;
  onDraftRetry: () => Promise<void>;
  onDraftCancel: (draft: OfflineDraft) => Promise<void>;
};

function DealIQ(props: DealIQProps) {
  if (!props.deal) return <Empty title="No deal file yet" text="Add a Deal from the Deals workspace to start with a Property and source record." />;
  return <DealWorkspace {...props} deal={props.deal} />;
}

function DealWorkspace({
  deal,
  workspaceId,
  userId,
  draftScope,
  offlineDrafts,
  isAuthenticated,
  isOnline,
  onCanonicalSaved,
  onDelete,
  onDraftQueued,
  onDraftRetry,
  onDraftCancel,
}: DealIQProps & { deal: DealFacts }) {
  const [section, setSection] = useState<DealWorkspaceSection>(() => workspaceSectionFromLocation());
  const [detail, setDetail] = useState<DealDetailProjection | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "failed" | "permission" | "offline">("loading");
  const [message, setMessage] = useState("");
  const sectionHeadingRef = useRef<HTMLHeadingElement>(null);
  const tabRefs = useRef<Record<DealWorkspaceSection, HTMLButtonElement | null>>({
    overview: null,
    property: null,
    people: null,
    work: null,
    notes: null,
    history: null,
  });
  const canUseCloud = isAuthenticated && Boolean(workspaceId);
  const effectiveDeal = detail?.deal ?? deal;
  const displayName = detail?.displayName ?? deal.address ?? "Untitled Deal";
  const property = detail?.property;
  const isArchived = detail?.stage === "archived" || detail?.operatingStatus === "archived";

  const loadDetail = useCallback(async () => {
    if (!canUseCloud) {
      setDetail(null);
      setLoadStatus("ready");
      setMessage("Sign in to save this Deal workspace to your BRIX account.");
      return;
    }
    if (!isOnline) {
      setLoadStatus("offline");
      setMessage("Connection is unavailable. Saved Deal details remain unchanged until reconnect.");
      return;
    }
    setLoadStatus("loading");
    setMessage("");
    try {
      const loaded = await loadDealDetail(deal.id);
      setDetail(loaded);
      setLoadStatus("ready");
    } catch (error) {
      const safe = safeDealCommandMessage(error);
      setLoadStatus(safe.status === "permission" ? "permission" : "failed");
      setMessage(safe.message);
    }
  }, [canUseCloud, deal.id, isOnline]);

  useEffect(() => {
    setDetail(null);
    setLoadStatus("loading");
    setMessage("");
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    const next = workspaceSectionFromLocation();
    if (next !== section) window.history.replaceState({}, "", dealWorkspaceUrl(deal.id, section));
  }, [deal.id, section]);

  useEffect(() => {
    const onPopState = () => setSection(workspaceSectionFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function selectSection(next: DealWorkspaceSection, options: { replace?: boolean } = {}) {
    setSection(next);
    const url = dealWorkspaceUrl(deal.id, next);
    if (options.replace) window.history.replaceState({}, "", url);
    else window.history.pushState({}, "", url);
    window.requestAnimationFrame(() => sectionHeadingRef.current?.focus({ preventScroll: true }));
  }

  function onSectionKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const lastIndex = dealWorkspaceSections.length - 1;
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? lastIndex
        : event.key === "ArrowRight"
          ? index === lastIndex ? 0 : index + 1
          : index === 0 ? lastIndex : index - 1;
    const next = dealWorkspaceSections[nextIndex].id;
    tabRefs.current[next]?.focus();
    selectSection(next);
  }

  return (
    <section className="deal-workspace" aria-labelledby="deal-workspace-title">
      <header className="deal-workspace-header">
        <div className="deal-title-block">
          <p className="eyebrow">Deal workspace</p>
          <h2 id="deal-workspace-title">{displayName}</h2>
          <p className="quiet">{formatPropertyLine(property, effectiveDeal)}</p>
        </div>
        <div className="deal-header-actions">
          {detail && (
            <>
              <StatusBadge tone="neutral">{labelForStage(detail.stage)}</StatusBadge>
              <StatusBadge tone={detail.operatingStatus === "blocked" || detail.operatingStatus === "archived" ? "warning" : "neutral"}>{labelForOperatingStatus(detail.operatingStatus)}</StatusBadge>
              <StatusBadge tone="neutral">{labelForPriority(detail.priority)}</StatusBadge>
            </>
          )}
          {isArchived && <StatusBadge tone="warning">Archived</StatusBadge>}
          <button className="secondary compact" type="button" onClick={loadDetail} disabled={loadStatus === "loading"}>
            <RefreshCw size={14} /> Reload
          </button>
          <button className="danger compact" type="button" onClick={() => onDelete(deal.id)}>
            <Trash2 size={14} /> {isAuthenticated ? "Archive Deal" : "Delete local draft"}
          </button>
        </div>
      </header>

      {loadStatus === "loading" && <p className="quiet">Loading Deal workspace.</p>}
      {message && <p className={loadStatus === "failed" || loadStatus === "permission" || loadStatus === "offline" ? "error" : "success-text"}>{message}</p>}
      <OfflineDraftPanel drafts={offlineDrafts} onRetry={onDraftRetry} onCancel={onDraftCancel} />

      <nav className="deal-section-tabs" role="tablist" aria-label="Deal workspace sections">
        {dealWorkspaceSections.map((item, index) => (
          <button
            key={item.id}
            ref={(node) => { tabRefs.current[item.id] = node; }}
            className={section === item.id ? "deal-section-tab active" : "deal-section-tab"}
            type="button"
            role="tab"
            id={`deal-tab-${item.id}`}
            aria-selected={section === item.id}
            aria-controls={`deal-section-${item.id}`}
            tabIndex={section === item.id ? 0 : -1}
            onClick={() => selectSection(item.id)}
            onKeyDown={(event) => onSectionKeyDown(event, index)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="deal-section-shell" role="tabpanel" id={`deal-section-${section}`} aria-labelledby={`deal-tab-${section}`}>
        <h3 ref={sectionHeadingRef} tabIndex={-1}>{dealWorkspaceSections.find((item) => item.id === section)?.label}</h3>
        {section === "overview" && <DealOverviewSection deal={effectiveDeal} detail={detail} property={property} onEdit={() => selectSection("property")} />}
        {section === "property" && <DealPropertySection deal={effectiveDeal} detail={detail} property={property} userId={userId} draftScope={draftScope} isAuthenticated={isAuthenticated} isOnline={isOnline} onDraftQueued={onDraftQueued} onSaved={(saved) => { onCanonicalSaved(saved); void loadDetail(); }} />}
        {section === "people" && <RelationshipPanel dealId={deal.id} workspaceId={workspaceId} isAuthenticated={isAuthenticated} isOnline={isOnline} />}
        {section === "work" && <WorkHistoryPanel dealId={deal.id} workspaceId={workspaceId} draftScope={draftScope} isAuthenticated={isAuthenticated} isOnline={isOnline} onDraftQueued={onDraftQueued} section="work" />}
        {section === "notes" && <WorkHistoryPanel dealId={deal.id} workspaceId={workspaceId} draftScope={draftScope} isAuthenticated={isAuthenticated} isOnline={isOnline} onDraftQueued={onDraftQueued} section="notes" />}
        {section === "history" && <WorkHistoryPanel dealId={deal.id} workspaceId={workspaceId} draftScope={draftScope} isAuthenticated={isAuthenticated} isOnline={isOnline} onDraftQueued={onDraftQueued} section="history" />}
      </div>
    </section>
  );
}

function DealOverviewSection({
  deal,
  detail,
  property,
  onEdit,
}: {
  deal: DealFacts;
  detail: DealDetailProjection | null;
  property?: PropertySummary;
  onEdit: () => void;
}) {
  const summaryItems = detail ? [
    { label: "Stage", value: labelForStage(detail.stage) },
    { label: "Status", value: labelForOperatingStatus(detail.operatingStatus) },
    { label: "Priority", value: labelForPriority(detail.priority) },
    { label: "Source", value: readableValue(detail.source) },
    { label: "Deal version", value: String(deal.dealVersion ?? "Reload required") },
    { label: "Loaded", value: formatShortDate(detail.loadedAt) },
  ] : [
    { label: "Status", value: readableValue(deal.status) },
    { label: "Updated", value: formatShortDate(deal.updatedAt) },
    { label: "Mode", value: "Local draft" },
  ];
  return (
    <div className="deal-section-grid">
      <section className="workspace-card">
        <div className="panel-heading-row">
          <div>
            <p className="eyebrow">Core record</p>
            <h4>{detail?.displayName ?? deal.address ?? "Untitled Deal"}</h4>
          </div>
          <button className="secondary compact" type="button" onClick={onEdit}>Edit</button>
        </div>
        <DefinitionList items={summaryItems} />
      </section>
      <section className="workspace-card">
        <p className="eyebrow">Property</p>
        <h4>{formatPropertyLine(property, deal)}</h4>
        <DefinitionList items={[
          { label: "Address", value: property?.displayAddress ?? deal.address ?? "Not set" },
          { label: "City", value: property?.city ?? deal.city ?? "Not set" },
          { label: "State", value: property?.region ?? deal.state ?? "Not set" },
          { label: "ZIP", value: property?.postalCode ?? deal.zip ?? "Not set" },
          { label: "Parcel ID", value: property?.parcelIdentifier ?? "Not set" },
        ]} />
      </section>
      <section className="workspace-card wide">
        <p className="eyebrow">Workspace status</p>
        {detail ? (
          <div className="workspace-count-row">
            <Stat label="People" value={String(detail.relationshipCount)} />
            <Stat label="Open tasks" value={String(detail.openTaskCount)} />
            <Stat label="Open deadlines" value={String(detail.openDeadlineCount)} />
            <Stat label="Pinned notes" value={String(detail.pinnedNoteCount)} />
            <Stat label="Recent history" value={String(detail.recentEventCount)} />
          </div>
        ) : (
          <p className="quiet">This local draft can be reviewed here. Sign in to connect people, work, notes, and saved history.</p>
        )}
      </section>
    </div>
  );
}

function OfflineDraftPanel({
  drafts,
  onRetry,
  onCancel,
}: {
  drafts: OfflineDraft[];
  onRetry: () => Promise<void>;
  onCancel: (draft: OfflineDraft) => Promise<void>;
}) {
  const active = drafts.filter((draft) => draft.status !== "synced" && draft.status !== "cancelled");
  if (active.length === 0) {
    const synced = drafts.filter((draft) => draft.status === "synced").sort((a, b) => (b.lastSyncedAt ?? "").localeCompare(a.lastSyncedAt ?? ""));
    if (synced.length === 0) return null;
    return (
      <section className="draft-sync-panel" aria-label="Draft sync status">
        <div>
          <p className="eyebrow">Saved device work</p>
          <strong>Last synchronized {formatShortDate(synced[0].lastSyncedAt ?? synced[0].updatedAt)}</strong>
        </div>
      </section>
    );
  }
  return (
    <section className="draft-sync-panel" aria-label="Draft sync status">
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">Saved device work</p>
          <h3>{active.length} item{active.length === 1 ? "" : "s"} not yet saved to BRIX</h3>
          <p className="quiet">Local work stays on this device until BRIX confirms synchronization. Conflicts keep server data intact until you review them.</p>
        </div>
        <button className="secondary compact" type="button" onClick={() => void onRetry()}>Retry sync</button>
      </div>
      <div className="draft-sync-list">
        {active.map((draft) => (
          <article className={`draft-sync-card ${draft.status}`} key={draft.localDraftId}>
            <div>
              <strong>{labelForDraftType(draft.draftType)}</strong>
              <span>{labelForDraftStatus(draft.status)}</span>
              <small>{draft.lastAttemptedAt ? `Last tried ${formatShortDate(draft.lastAttemptedAt)}` : `Saved ${formatShortDate(draft.updatedAt)}`}</small>
            </div>
            {draft.status === "conflicted" && <p className="quiet">Review required before BRIX applies this local change.</p>}
            {draft.status === "failed" && <p className="quiet">Retry is available. Your local input is preserved.</p>}
            {draft.status === "conflicted" && (
              <details className="draft-conflict-details">
                <summary>Review conflict</summary>
                <p>BRIX kept the server record unchanged. Reload the latest Deal, compare this saved device item, then retry or cancel the local draft.</p>
              </details>
            )}
            <div className="work-card-actions">
              {(draft.status === "failed" || draft.status === "queued" || draft.status === "conflicted") && <button className="secondary compact" type="button" onClick={() => void onRetry()}>Retry</button>}
              <button className="danger compact" type="button" onClick={() => void onCancel(draft)}>Cancel local draft</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DealPropertySection({
  deal,
  detail,
  property,
  userId,
  draftScope,
  isAuthenticated,
  isOnline,
  onDraftQueued,
  onSaved,
}: {
  deal: DealFacts;
  detail: DealDetailProjection | null;
  property?: PropertySummary;
  userId?: string | null;
  draftScope: OfflineDraftScope;
  isAuthenticated: boolean;
  isOnline: boolean;
  onDraftQueued: (draft: OfflineDraft, message: string) => Promise<void>;
  onSaved: (deal: DealFacts) => void;
}) {
  return (
    <div className="deal-section-grid">
      <section className="workspace-card">
        <p className="eyebrow">Property summary</p>
        <h4>{formatPropertyLine(property, deal)}</h4>
        <DefinitionList items={[
          { label: "Display address", value: property?.displayAddress ?? deal.address ?? "Not set" },
          { label: "Address line 1", value: property?.addressLine1 ?? deal.address ?? "Not set" },
          { label: "Address line 2", value: property?.addressLine2 ?? "Not set" },
          { label: "City", value: property?.city ?? deal.city ?? "Not set" },
          { label: "State", value: property?.region ?? deal.state ?? "Not set" },
          { label: "ZIP", value: property?.postalCode ?? deal.zip ?? "Not set" },
          { label: "Country", value: property?.country ?? "US" },
          { label: "Parcel ID", value: property?.parcelIdentifier ?? "Not set" },
          { label: "Property version", value: String(property?.propertyVersion ?? deal.propertyVersion ?? "Reload required") },
        ]} />
      </section>
      <CanonicalDealEditPanel deal={detail?.deal ?? deal} userId={userId} draftScope={draftScope} isAuthenticated={isAuthenticated} isOnline={isOnline} onDraftQueued={onDraftQueued} onSaved={onSaved} />
    </div>
  );
}

function DefinitionList({ items }: { items: Array<{ label: string; value?: string }> }) {
  return (
    <dl className="definition-list">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value || "Not set"}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatPropertyLine(property: PropertySummary | undefined, deal: DealFacts) {
  const fallback = [deal.address, deal.city, deal.state, deal.zip].filter(Boolean).join(", ");
  if (!property) return fallback || "No property address saved";
  return [property.displayAddress, property.city, property.region, property.postalCode].filter(Boolean).join(", ") || fallback || "No property address saved";
}

function readableValue(value?: string) {
  return value ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Not set";
}

function labelForPriority(priority?: DealPriority) {
  if (priority === "urgent") return "Urgent";
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Normal";
}

function labelForDraftType(type: OfflineDraft["draftType"]) {
  const labels: Record<OfflineDraft["draftType"], string> = {
    new_deal: "New Deal",
    deal_core_update: "Deal edit",
    property_update: "Property edit",
    note_create: "New note",
    note_update: "Note edit",
    task_create: "New task",
    task_update: "Task edit",
    deadline_create: "New deadline",
    deadline_update: "Deadline edit",
  };
  return labels[type];
}

function labelForDraftStatus(status: OfflineDraft["status"]) {
  const labels: Record<OfflineDraft["status"], string> = {
    local: "Saved on this device",
    queued: "Waiting to sync",
    syncing: "Syncing",
    synced: "Saved to BRIX",
    conflicted: "Needs review",
    failed: "Sync failed",
    cancelled: "Cancelled",
  };
  return labels[status];
}

function classifyRecoverableDraftError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  return /network|fetch|offline|unavailable|timeout|Failed to fetch/i.test(raw);
}

const dealStageOptions: Array<{ id: CanonicalDealStage; label: string }> = [
  { id: "lead", label: "Lead" },
  { id: "screening", label: "Screening" },
  { id: "research", label: "Research" },
  { id: "visit_planned", label: "Visit planned" },
  { id: "visited", label: "Visited" },
  { id: "underwriting", label: "Underwriting" },
  { id: "negotiation", label: "Negotiation" },
  { id: "offer_preparation", label: "Offer preparation" },
  { id: "offer_submitted", label: "Offer submitted" },
  { id: "under_contract", label: "Under contract" },
  { id: "due_diligence", label: "Due diligence" },
  { id: "financing", label: "Financing" },
  { id: "closing", label: "Closing" },
  { id: "owned", label: "Owned" },
  { id: "stabilizing", label: "Stabilizing" },
  { id: "operating", label: "Operating" },
  { id: "refinancing", label: "Refinancing" },
  { id: "disposition", label: "Disposition" },
  { id: "sold", label: "Sold" },
  { id: "passed", label: "Passed" },
];

const dealOperatingStatusOptions: Array<{ id: CanonicalDealOperatingStatus; label: string }> = [
  { id: "active", label: "Active" },
  { id: "needs_attention", label: "Needs attention" },
  { id: "waiting", label: "Waiting" },
  { id: "blocked", label: "Blocked" },
  { id: "on_hold", label: "On hold" },
  { id: "passed", label: "Passed" },
  { id: "closed_won", label: "Closed won" },
  { id: "closed_lost", label: "Closed lost" },
];

function CanonicalDealEditPanel({
  deal,
  userId,
  draftScope,
  isAuthenticated,
  isOnline,
  onDraftQueued,
  onSaved,
}: {
  deal: DealFacts;
  userId?: string | null;
  draftScope: OfflineDraftScope;
  isAuthenticated: boolean;
  isOnline: boolean;
  onDraftQueued: (draft: OfflineDraft, message: string) => Promise<void>;
  onSaved: (deal: DealFacts) => void;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "editing" | "saving" | "saved" | "stale" | "validation" | "permission" | "offline" | "failed">("idle");
  const [message, setMessage] = useState("");
  const [property, setProperty] = useState<PropertySummary | null>(null);
  const [dealDraft, setDealDraft] = useState({
    displayName: deal.address,
    priority: "normal" as DealPriority,
    source: deal.sourceUrl ? "listing_url" : "manual",
    stage: "lead" as CanonicalDealStage,
    operatingStatus: "active" as CanonicalDealOperatingStatus,
  });
  const [propertyDraft, setPropertyDraft] = useState({
    displayAddress: deal.address,
    addressLine1: deal.address,
    city: deal.city ?? "",
    region: deal.state ?? "",
    postalCode: deal.zip ?? "",
    parcelIdentifier: "",
  });

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setStatus("loaded");
      setMessage("Sign in to edit canonical Deal and Property records.");
      return;
    }
    if (!isOnline) {
      setStatus("offline");
      setMessage("Connection is unavailable. Reload when you are back online.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const detail = await loadDealDetail(deal.id);
      setProperty(detail.property ?? null);
      setDealDraft({
        displayName: detail.displayName,
        priority: detail.priority,
        source: detail.source,
        stage: detail.stage,
        operatingStatus: detail.operatingStatus,
      });
      setPropertyDraft({
        displayAddress: detail.property?.displayAddress ?? detail.deal.address,
        addressLine1: detail.property?.addressLine1 ?? detail.deal.address,
        city: detail.property?.city ?? detail.deal.city ?? "",
        region: detail.property?.region ?? detail.deal.state ?? "",
        postalCode: detail.property?.postalCode ?? detail.deal.zip ?? "",
        parcelIdentifier: detail.property?.parcelIdentifier ?? "",
      });
      setStatus("loaded");
    } catch (error) {
      const safe = safeDealCommandMessage(error);
      setStatus(safe.status);
      setMessage(safe.message);
    }
  }, [deal.id, isAuthenticated, isOnline]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveCanonicalEdits() {
    if (!isAuthenticated) {
      setMessage("Sign in to save canonical Deal and Property changes.");
      return;
    }
    if (!isOnline) {
      if (isAuthenticated && userId && draftScope.kind === "authenticated") {
        const updatedDeal = { ...deal, address: propertyDraft.displayAddress, city: propertyDraft.city, state: propertyDraft.region, zip: propertyDraft.postalCode };
        await onDraftQueued(createOfflineDraft({
          scope: draftScope,
          workspaceId: draftScope.workspaceId,
          dealId: deal.id,
          propertyId: deal.propertyId,
          draftType: "deal_core_update",
          commandType: "update_canonical_deal",
          baseRecordId: deal.id,
          baseVersion: deal.dealVersion,
          baseValues: { displayName: deal.address, dealVersion: deal.dealVersion },
          payload: {
            deal,
            update: {
              displayName: dealDraft.displayName,
              priority: dealDraft.priority,
              source: dealDraft.source,
              strategyIntent: deal.strategyId,
              strategyId: deal.strategyId,
              facts: updatedDeal,
              verification: deal.verification,
            },
          },
        }), "Deal edits saved on this device and waiting to synchronize with BRIX.");
        if (property) {
          await onDraftQueued(createOfflineDraft({
            scope: draftScope,
            workspaceId: draftScope.workspaceId,
            dealId: deal.id,
            propertyId: property.propertyId,
            draftType: "property_update",
            commandType: "update_canonical_property",
            baseRecordId: property.propertyId,
            baseVersion: property.propertyVersion,
            baseValues: { displayAddress: property.displayAddress, propertyVersion: property.propertyVersion },
            payload: {
              property,
              update: {
                displayAddress: propertyDraft.displayAddress,
                addressLine1: propertyDraft.addressLine1,
                city: propertyDraft.city,
                region: propertyDraft.region,
                postalCode: propertyDraft.postalCode,
                country: property.country,
                parcelIdentifier: propertyDraft.parcelIdentifier,
              },
            },
          }), "Property edits saved on this device and waiting to synchronize with BRIX.");
        }
      }
      setStatus("offline");
      setMessage(isAuthenticated ? "Changes are saved on this device and waiting to synchronize." : "Connection is unavailable. Your onscreen changes are still here; retry when back online.");
      return;
    }
    if (!dealDraft.displayName.trim() || !propertyDraft.displayAddress.trim()) {
      setStatus("validation");
      setMessage("Deal name and Property address are required.");
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      const detailAfterDeal = await updateDealCore(deal, {
        displayName: dealDraft.displayName,
        priority: dealDraft.priority,
        source: dealDraft.source,
        strategyIntent: deal.strategyId,
        strategyId: deal.strategyId,
        facts: { ...deal, address: propertyDraft.displayAddress, city: propertyDraft.city, state: propertyDraft.region, zip: propertyDraft.postalCode },
        verification: deal.verification,
      });
      let nextDetail = detailAfterDeal;
      if (property) {
        await updateProperty(property, {
          displayAddress: propertyDraft.displayAddress,
          addressLine1: propertyDraft.addressLine1,
          city: propertyDraft.city,
          region: propertyDraft.region,
          postalCode: propertyDraft.postalCode,
          country: property.country,
          parcelIdentifier: propertyDraft.parcelIdentifier,
        });
        nextDetail = await loadDealDetail(deal.id);
      }
      if (dealDraft.stage !== nextDetail.stage || dealDraft.operatingStatus !== nextDetail.operatingStatus) {
        nextDetail = await updateDealLifecycle(nextDetail.deal, {
          stage: dealDraft.stage,
          operatingStatus: dealDraft.operatingStatus,
          reason: "deal_detail_edit",
        });
      }
      onSaved(nextDetail.deal);
      setProperty(nextDetail.property ?? null);
      setStatus("saved");
      setMessage("Deal and Property changes saved.");
    } catch (error) {
      const safe = safeDealCommandMessage(error);
      setStatus(safe.status);
      setMessage(safe.message);
    }
  }

  return (
    <section className="panel wide canonical-edit-panel">
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">Deal record</p>
          <h3>Canonical Deal and Property details</h3>
        </div>
        <div className="button-row">
          <button className="secondary compact" type="button" onClick={load} disabled={status === "loading" || status === "saving"}><RefreshCw size={14} /> Reload</button>
          <button className="primary compact" type="button" onClick={saveCanonicalEdits} disabled={!isAuthenticated || status === "loading" || status === "saving"}>Save</button>
        </div>
      </div>
      {message && <p className={status === "saved" ? "success-text" : status === "loaded" ? "quiet" : "error"}>{message}</p>}
      <div className="canonical-edit-grid">
        <label className="field">
          <span>Deal name</span>
          <input value={dealDraft.displayName} onChange={(event) => { setStatus("editing"); setDealDraft({ ...dealDraft, displayName: event.target.value }); }} />
        </label>
        <label className="field">
          <span>Priority</span>
          <select value={dealDraft.priority} onChange={(event) => { setStatus("editing"); setDealDraft({ ...dealDraft, priority: event.target.value as DealPriority }); }}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label className="field">
          <span>Stage</span>
          <select value={dealDraft.stage} onChange={(event) => { setStatus("editing"); setDealDraft({ ...dealDraft, stage: event.target.value as CanonicalDealStage }); }}>
            {dealStageOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Status</span>
          <select value={dealDraft.operatingStatus} onChange={(event) => { setStatus("editing"); setDealDraft({ ...dealDraft, operatingStatus: event.target.value as CanonicalDealOperatingStatus }); }}>
            {dealOperatingStatusOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Property address</span>
          <input value={propertyDraft.displayAddress} onChange={(event) => { setStatus("editing"); setPropertyDraft({ ...propertyDraft, displayAddress: event.target.value, addressLine1: event.target.value }); }} />
        </label>
        <label className="field">
          <span>City</span>
          <input value={propertyDraft.city} onChange={(event) => { setStatus("editing"); setPropertyDraft({ ...propertyDraft, city: event.target.value }); }} />
        </label>
        <label className="field">
          <span>State</span>
          <input value={propertyDraft.region} onChange={(event) => { setStatus("editing"); setPropertyDraft({ ...propertyDraft, region: event.target.value }); }} />
        </label>
        <label className="field">
          <span>ZIP</span>
          <input value={propertyDraft.postalCode} onChange={(event) => { setStatus("editing"); setPropertyDraft({ ...propertyDraft, postalCode: event.target.value }); }} />
        </label>
        <label className="field">
          <span>Parcel ID</span>
          <input value={propertyDraft.parcelIdentifier} onChange={(event) => { setStatus("editing"); setPropertyDraft({ ...propertyDraft, parcelIdentifier: event.target.value }); }} />
        </label>
      </div>
      <p className="quiet">Versions: Deal {deal.dealVersion ?? "reload required"}{property ? `, Property ${property.propertyVersion}` : ""}</p>
    </section>
  );
}

function safeDealCommandMessage(error: unknown): { status: "stale" | "validation" | "permission" | "failed"; message: string } {
  const raw = error instanceof Error ? error.message : "";
  if (/changed after you opened|40001/i.test(raw)) return { status: "stale", message: "This record changed after you opened it. Reload to review the current version, then save again." };
  if (/permission|not have|42501/i.test(raw)) return { status: "permission", message: "You do not have permission to save this Deal." };
  if (/required|not available|invalid|22023/i.test(raw)) return { status: "validation", message: raw.includes("required") ? raw : "Check the highlighted fields and try again." };
  return { status: "failed", message: "BRIX could not save this change. Your onscreen edits are preserved; retry in a moment." };
}

function WorkHistoryPanel({
  dealId,
  workspaceId,
  draftScope,
  isAuthenticated,
  isOnline,
  onDraftQueued,
  section,
}: {
  dealId: string;
  workspaceId?: string;
  draftScope: OfflineDraftScope;
  isAuthenticated: boolean;
  isOnline: boolean;
  onDraftQueued: (draft: OfflineDraft, message: string) => Promise<void>;
  section: "work" | "notes" | "history";
}) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const emptyTask: TaskDraft = { title: "", description: "", taskType: "general", priority: "normal", status: "open", dueAt: "", dueDate: "", isAllDay: false, timezone };
  const emptyDeadline: DeadlineDraft = { title: "", status: "open", dueAt: "", dueDate: "", isAllDay: false, timezone, sourceTerm: "", sourceDescription: "", triggerDate: "", calculationRule: "", verificationState: "unverified" };
  const emptyNote: NoteDraft = { body: "", noteType: "general", pinned: false };
  const [work, setWork] = useState<DealWorkItem[]>([]);
  const [notes, setNotes] = useState<DealNote[]>([]);
  const [timeline, setTimeline] = useState<DealTimelineItem[]>([]);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(emptyTask);
  const [deadlineDraft, setDeadlineDraft] = useState<DeadlineDraft>(emptyDeadline);
  const [noteDraft, setNoteDraft] = useState<NoteDraft>(emptyNote);
  const [editingWork, setEditingWork] = useState<Record<string, { title: string; status: string; priority?: string; dueAt?: string; dueDate?: string; isAllDay: boolean; timezone: string }>>({});
  const [editingNotes, setEditingNotes] = useState<Record<string, { body: string; noteType: string; pinned: boolean }>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "saving" | "saved" | "failed" | "permission" | "offline">("idle");
  const [message, setMessage] = useState("");
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const canUseCloud = isAuthenticated && Boolean(workspaceId);

  const load = useCallback(async () => {
    if (!canUseCloud) {
      if (section === "work") setWork([]);
      if (section === "notes") setNotes([]);
      if (section === "history") setTimeline([]);
      setStatus("ready");
      setMessage("Sign in to save Deal work and history.");
      return;
    }
    if (!isOnline) {
      setStatus("offline");
      setMessage("Connection is unavailable. Saved work remains visible after reconnect.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      if (section === "work") {
        const workRows = await listDealWork(dealId);
        setWork(workRows);
        setEditingWork(Object.fromEntries(workRows.map((item) => [item.recordId, {
          title: item.title,
          status: item.status,
          priority: item.priority,
          dueAt: item.dueAt ? item.dueAt.slice(0, 16) : "",
          dueDate: item.dueDate ?? "",
          isAllDay: item.isAllDay,
          timezone: item.timezone,
        }])));
      }
      if (section === "notes") {
        const noteRows = await listDealNotes(dealId);
        setNotes(noteRows);
        setEditingNotes(Object.fromEntries(noteRows.map((note) => [note.noteId, { body: note.body, noteType: note.noteType, pinned: note.pinned }])));
      }
      if (section === "history") {
        const timelineRows = await loadDealTimeline(dealId);
        setTimeline(timelineRows);
        setHistoryHasMore(timelineRows.length >= 50);
      }
      setStatus("ready");
    } catch (error) {
      const text = error instanceof Error ? error.message : "BRIX could not load Deal work.";
      setStatus(/permission|access|not have/i.test(text) ? "permission" : "failed");
      setMessage(text);
    }
  }, [canUseCloud, dealId, isOnline, section]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<void>, success: string) {
    if (!canUseCloud) {
      setMessage("Sign in to save Deal work and history.");
      return;
    }
    if (!isOnline) {
      setStatus("offline");
      setMessage("Connection is unavailable. Try again when you are back online.");
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      await action();
      setStatus("saved");
      setMessage(success);
      await load();
    } catch (error) {
      const text = error instanceof Error ? error.message : "BRIX could not save this change.";
      setStatus(/changed after you opened/i.test(text) ? "failed" : /permission|access|not have/i.test(text) ? "permission" : "failed");
      setMessage(text);
    }
  }

  function addTask() {
    if (!taskDraft.title.trim()) {
      setMessage("Enter a task title.");
      return;
    }
    if (!isOnline && canUseCloud && workspaceId) {
      void onDraftQueued(createOfflineDraft({
        scope: draftScope,
        workspaceId,
        dealId,
        draftType: "task_create",
        commandType: "create_deal_task",
        payload: { dealId, draft: taskDraft },
      }), "Task saved on this device and waiting to synchronize with BRIX.").then(() => {
        setTaskDraft(emptyTask);
        setStatus("offline");
        setMessage("Task saved on this device.");
      });
      return;
    }
    void run(async () => {
      await createDealTask(dealId, taskDraft);
      setTaskDraft(emptyTask);
    }, "Task saved.");
  }

  function addDeadline() {
    if (!deadlineDraft.title.trim()) {
      setMessage("Enter a deadline title.");
      return;
    }
    if (deadlineDraft.isAllDay ? !deadlineDraft.dueDate : !deadlineDraft.dueAt) {
      setMessage("Add a due date or exact due time.");
      return;
    }
    if (!isOnline && canUseCloud && workspaceId) {
      void onDraftQueued(createOfflineDraft({
        scope: draftScope,
        workspaceId,
        dealId,
        draftType: "deadline_create",
        commandType: "create_deal_deadline",
        payload: { dealId, draft: deadlineDraft },
      }), "Deadline saved on this device and waiting to synchronize with BRIX.").then(() => {
        setDeadlineDraft(emptyDeadline);
        setStatus("offline");
        setMessage("Deadline saved on this device.");
      });
      return;
    }
    void run(async () => {
      await createDealDeadline(dealId, deadlineDraft);
      setDeadlineDraft(emptyDeadline);
    }, "Deadline saved.");
  }

  function addNote() {
    if (!noteDraft.body.trim()) {
      setMessage("Write a note first.");
      return;
    }
    if (!isOnline && canUseCloud && workspaceId) {
      void onDraftQueued(createOfflineDraft({
        scope: draftScope,
        workspaceId,
        dealId,
        draftType: "note_create",
        commandType: "create_deal_note",
        payload: { dealId, draft: noteDraft },
      }), "Note saved on this device and waiting to synchronize with BRIX.").then(() => {
        setNoteDraft(emptyNote);
        setStatus("offline");
        setMessage("Note saved on this device.");
      });
      return;
    }
    void run(async () => {
      await createDealNote(dealId, noteDraft);
      setNoteDraft(emptyNote);
    }, "Note saved.");
  }

  function queueTaskUpdate(item: DealWorkItem) {
    const edit = editingWork[item.recordId];
    if (!edit || !workspaceId) return false;
    if (isOnline || !canUseCloud) return false;
    void onDraftQueued(createOfflineDraft({
      scope: draftScope,
      workspaceId,
      dealId,
      draftType: "task_update",
      commandType: "update_deal_task",
      baseRecordId: item.recordId,
      baseVersion: item.recordVersion,
      baseValues: { title: item.title, status: item.status, priority: item.priority, dueAt: item.dueAt, dueDate: item.dueDate },
      payload: {
        item,
        draft: {
          title: edit.title,
          status: edit.status as TaskDraft["status"],
          priority: edit.priority as TaskDraft["priority"],
          dueAt: edit.dueAt,
          dueDate: edit.dueDate,
          isAllDay: edit.isAllDay,
          timezone: edit.timezone,
        },
      },
    }), "Task update saved on this device and waiting to synchronize with BRIX.").then(() => {
      setStatus("offline");
      setMessage("Task update saved on this device.");
    });
    return true;
  }

  function queueDeadlineUpdate(item: DealWorkItem) {
    const edit = editingWork[item.recordId];
    if (!edit || !workspaceId) return false;
    if (isOnline || !canUseCloud) return false;
    void onDraftQueued(createOfflineDraft({
      scope: draftScope,
      workspaceId,
      dealId,
      draftType: "deadline_update",
      commandType: "update_deal_deadline",
      baseRecordId: item.recordId,
      baseVersion: item.recordVersion,
      baseValues: { title: item.title, status: item.status, dueAt: item.dueAt, dueDate: item.dueDate, timezone: item.timezone },
      payload: {
        item,
        draft: {
          title: edit.title,
          status: edit.status as DeadlineDraft["status"],
          dueAt: edit.dueAt,
          dueDate: edit.dueDate,
          isAllDay: edit.isAllDay,
          timezone: edit.timezone,
        },
      },
    }), "Deadline update saved on this device and waiting to synchronize with BRIX.").then(() => {
      setStatus("offline");
      setMessage("Deadline update saved on this device.");
    });
    return true;
  }

  function queueNoteUpdate(note: DealNote, update: Partial<NoteDraft>) {
    if (!workspaceId) return false;
    if (isOnline || !canUseCloud) return false;
    void onDraftQueued(createOfflineDraft({
      scope: draftScope,
      workspaceId,
      dealId,
      draftType: "note_update",
      commandType: "update_deal_note",
      baseRecordId: note.noteId,
      baseVersion: note.noteVersion,
      baseValues: { body: note.body, noteType: note.noteType, pinned: note.pinned },
      payload: { note, draft: update },
    }), "Note update saved on this device and waiting to synchronize with BRIX.").then(() => {
      setStatus("offline");
      setMessage("Note update saved on this device.");
    });
    return true;
  }

  const pending = work.filter((item) => item.status !== "completed" && item.status !== "cancelled");
  const completed = work.filter((item) => item.status === "completed");
  const heading = section === "work" ? "Tasks and deadlines" : section === "notes" ? "Notes" : "History";
  const reloadText = section === "work" ? "Loading saved tasks and deadlines." : section === "notes" ? "Loading saved notes." : "Loading saved history.";

  async function loadMoreHistory() {
    if (section !== "history" || timeline.length === 0 || !canUseCloud || !isOnline) return;
    const before = timeline[timeline.length - 1]?.occurredAt;
    if (!before) return;
    setStatus("loading");
    try {
      const rows = await loadDealTimeline(dealId, before);
      setTimeline((current) => {
        const seen = new Set(current.map((item) => item.timelineId));
        return [...current, ...rows.filter((item) => !seen.has(item.timelineId))];
      });
      setHistoryHasMore(rows.length >= 50);
      setStatus("ready");
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "BRIX could not load more Deal history.");
    }
  }

  return (
    <section className="panel wide work-history-panel">
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">{heading}</p>
          <h3>{section === "work" ? "What needs attention on this Deal?" : section === "notes" ? "Saved Deal notes" : "Saved Deal activity"}</h3>
        </div>
        <button className="secondary compact" type="button" onClick={load} disabled={status === "loading" || status === "saving"}>
          <RefreshCw size={14} /> Reload
        </button>
      </div>

      {status === "loading" && <p className="quiet">{reloadText}</p>}
      {message && <p className={status === "failed" || status === "permission" || status === "offline" ? "error" : "success-text"}>{message}</p>}
      {!canUseCloud && <StatusBadge tone="warning">Cloud save required</StatusBadge>}

      {section === "work" && <div className="work-history-grid two-up">
        <div className="work-column">
          <h4><CheckSquare size={16} /> Tasks</h4>
          <div className="work-form">
            <input aria-label="Task title" placeholder="Task title" value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} />
            <select aria-label="Task type" value={taskDraft.taskType} onChange={(event) => setTaskDraft({ ...taskDraft, taskType: event.target.value as TaskDraft["taskType"] })}>
              {taskTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <select aria-label="Task priority" value={taskDraft.priority} onChange={(event) => setTaskDraft({ ...taskDraft, priority: event.target.value as TaskDraft["priority"] })}>
              {taskPriorities.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <input aria-label="Task due time" type="datetime-local" value={taskDraft.dueAt ?? ""} onChange={(event) => setTaskDraft({ ...taskDraft, dueAt: event.target.value, isAllDay: false })} />
            <button className="primary compact" type="button" onClick={addTask} disabled={!canUseCloud || status === "saving"}><Plus size={14} /> Add task</button>
          </div>
          <WorkList items={pending.filter((item) => item.recordType === "task")} editing={editingWork} setEditing={setEditingWork} onSave={(item) => {
            const edit = editingWork[item.recordId];
            if (queueTaskUpdate(item)) return;
            void run(() => updateDealTask(item, {
              title: edit?.title,
              status: edit?.status as TaskDraft["status"],
              priority: edit?.priority as TaskDraft["priority"],
              dueAt: edit?.dueAt,
              dueDate: edit?.dueDate,
              isAllDay: edit?.isAllDay,
              timezone: edit?.timezone,
            }), "Task updated.");
          }} onComplete={(item) => void run(() => completeDealTask(item), "Task completed.")} onCancel={(item) => void run(() => cancelDealTask(item), "Task cancelled.")} />
        </div>

        <div className="work-column">
          <h4><CalendarClock size={16} /> Deadlines</h4>
          <div className="work-form">
            <input aria-label="Deadline title" placeholder="Deadline title" value={deadlineDraft.title} onChange={(event) => setDeadlineDraft({ ...deadlineDraft, title: event.target.value })} />
            <input aria-label="Deadline due time" type="datetime-local" value={deadlineDraft.dueAt ?? ""} onChange={(event) => setDeadlineDraft({ ...deadlineDraft, dueAt: event.target.value, isAllDay: false })} />
            <label className="inline-check"><input type="checkbox" checked={deadlineDraft.isAllDay} onChange={(event) => setDeadlineDraft({ ...deadlineDraft, isAllDay: event.target.checked, dueAt: event.target.checked ? "" : deadlineDraft.dueAt })} /> All-day</label>
            {deadlineDraft.isAllDay && <input aria-label="Deadline all-day date" type="date" value={deadlineDraft.dueDate ?? ""} onChange={(event) => setDeadlineDraft({ ...deadlineDraft, dueDate: event.target.value })} />}
            <select aria-label="Deadline verification" value={deadlineDraft.verificationState} onChange={(event) => setDeadlineDraft({ ...deadlineDraft, verificationState: event.target.value as DeadlineDraft["verificationState"] })}>
              {deadlineVerificationStates.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <textarea aria-label="Deadline source description" placeholder="Source or triggering fact" value={deadlineDraft.sourceDescription ?? ""} onChange={(event) => setDeadlineDraft({ ...deadlineDraft, sourceDescription: event.target.value })} />
            <button className="primary compact" type="button" onClick={addDeadline} disabled={!canUseCloud || status === "saving"}><Plus size={14} /> Add deadline</button>
          </div>
          <WorkList items={pending.filter((item) => item.recordType === "deadline")} editing={editingWork} setEditing={setEditingWork} onSave={(item) => {
            const edit = editingWork[item.recordId];
            if (queueDeadlineUpdate(item)) return;
            void run(() => updateDealDeadline(item, {
              title: edit?.title,
              status: edit?.status as DeadlineDraft["status"],
              dueAt: edit?.dueAt,
              dueDate: edit?.dueDate,
              isAllDay: edit?.isAllDay,
              timezone: edit?.timezone,
            }), "Deadline updated.");
          }} onComplete={(item) => void run(() => completeDealDeadline(item), "Deadline completed.")} />
        </div>
        {completed.length > 0 && <p className="quiet wide">{completed.length} completed item{completed.length === 1 ? "" : "s"} saved on this Deal.</p>}
      </div>}

      {section === "notes" && (
        <div className="work-column">
          <h4><FilePenLine size={16} /> Notes</h4>
          <div className="work-form">
            <textarea aria-label="Deal note" placeholder="Save a note for this Deal" value={noteDraft.body} onChange={(event) => setNoteDraft({ ...noteDraft, body: event.target.value })} />
            <select aria-label="Note type" value={noteDraft.noteType} onChange={(event) => setNoteDraft({ ...noteDraft, noteType: event.target.value as NoteDraft["noteType"] })}>
              {noteTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <label className="inline-check"><input type="checkbox" checked={noteDraft.pinned} onChange={(event) => setNoteDraft({ ...noteDraft, pinned: event.target.checked })} /> Pin</label>
            <button className="primary compact" type="button" onClick={addNote} disabled={!canUseCloud || status === "saving"}><Plus size={14} /> Add note</button>
          </div>
          <div className="work-list">
            {notes.length === 0 ? <p className="quiet">No notes saved yet.</p> : notes.map((note) => {
              const edit = editingNotes[note.noteId] ?? { body: note.body, noteType: note.noteType, pinned: note.pinned };
              return (
                <article className={note.pinned ? "work-card pinned" : "work-card"} key={note.noteId}>
                  <textarea aria-label="Edit note" value={edit.body} onChange={(event) => setEditingNotes((current) => ({ ...current, [note.noteId]: { ...edit, body: event.target.value } }))} />
                  <div className="work-card-actions">
                    <button className="secondary compact" type="button" onClick={() => {
                      if (queueNoteUpdate(note, edit as NoteDraft)) return;
                      void run(() => updateDealNote(note, edit as NoteDraft), "Note updated.");
                    }}>Save</button>
                    <button className="secondary compact" type="button" onClick={() => {
                      const update = { pinned: !note.pinned };
                      if (queueNoteUpdate(note, update)) return;
                      void run(() => updateDealNote(note, update), note.pinned ? "Note unpinned." : "Note pinned.");
                    }}><Pin size={14} /> {note.pinned ? "Unpin" : "Pin"}</button>
                    <button className="danger compact" type="button" onClick={() => void run(() => archiveDealNote(note), "Note archived.")}><Archive size={14} /> Archive</button>
                  </div>
                  <small>{formatWorkDate(note.updatedAt)}</small>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {section === "history" && <div className="timeline-panel">
        <h4>Deal history</h4>
        {timeline.length === 0 ? <p className="quiet">No Deal history is available yet. Real saved activity will appear here.</p> : (
          <ol className="timeline-list">
            {timeline.map((item) => (
              <li key={item.timelineId}>
                <strong>{item.safeTitle}</strong>
                <span>{item.safeSummary}</span>
                <small>{formatWorkDate(item.occurredAt)}</small>
              </li>
            ))}
          </ol>
        )}
        {historyHasMore && <button className="secondary compact" type="button" onClick={loadMoreHistory} disabled={status === "loading"}>Load more history</button>}
      </div>}
    </section>
  );
}

function WorkList({
  items,
  editing,
  setEditing,
  onSave,
  onComplete,
  onCancel,
}: {
  items: DealWorkItem[];
  editing: Record<string, { title: string; status: string; priority?: string; dueAt?: string; dueDate?: string; isAllDay: boolean; timezone: string }>;
  setEditing: Dispatch<SetStateAction<Record<string, { title: string; status: string; priority?: string; dueAt?: string; dueDate?: string; isAllDay: boolean; timezone: string }>>>;
  onSave: (item: DealWorkItem) => void;
  onComplete: (item: DealWorkItem) => void;
  onCancel?: (item: DealWorkItem) => void;
}) {
  if (items.length === 0) return <p className="quiet">Nothing open here.</p>;
  return (
    <div className="work-list">
      {items.map((item) => {
        const edit = editing[item.recordId] ?? { title: item.title, status: item.status, priority: item.priority, dueAt: item.dueAt?.slice(0, 16), dueDate: item.dueDate, isAllDay: item.isAllDay, timezone: item.timezone };
        const timing = workTiming(item);
        return (
          <article className={`work-card ${timing}`} key={item.recordId}>
            <input aria-label="Work title" value={edit.title} onChange={(event) => setEditing((current) => ({ ...current, [item.recordId]: { ...edit, title: event.target.value } }))} />
            <div className="work-edit-row">
              <select aria-label="Work status" value={edit.status} onChange={(event) => setEditing((current) => ({ ...current, [item.recordId]: { ...edit, status: event.target.value } }))}>
                {(item.recordType === "task" ? taskStatuses : deadlineStatuses).map((statusOption) => <option value={statusOption.id} key={statusOption.id}>{statusOption.label}</option>)}
              </select>
              {item.recordType === "task" && (
                <select aria-label="Work priority" value={edit.priority ?? "normal"} onChange={(event) => setEditing((current) => ({ ...current, [item.recordId]: { ...edit, priority: event.target.value } }))}>
                  {taskPriorities.map((priority) => <option value={priority.id} key={priority.id}>{priority.label}</option>)}
                </select>
              )}
              <input aria-label="Work due time" type="datetime-local" value={edit.dueAt ?? ""} onChange={(event) => setEditing((current) => ({ ...current, [item.recordId]: { ...edit, dueAt: event.target.value, isAllDay: false } }))} />
            </div>
            <small>{item.isAllDay ? `Due ${item.dueDate} (${item.timezone})` : item.dueAt ? `Due ${formatWorkDate(item.dueAt)} (${item.timezone})` : "No due time"}</small>
            {item.body && <small>{item.body}</small>}
            <div className="work-card-actions">
              <button className="secondary compact" type="button" onClick={() => onSave(item)}>Save</button>
              <button className="secondary compact" type="button" onClick={() => onComplete(item)}>Complete</button>
              {onCancel && <button className="danger compact" type="button" onClick={() => onCancel(item)}>Cancel</button>}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function workTiming(item: DealWorkItem) {
  if (item.status === "blocked") return "blocked";
  if (item.status === "completed") return "completed";
  const due = item.dueAt ? new Date(item.dueAt) : item.dueDate ? new Date(`${item.dueDate}T23:59:59`) : null;
  if (!due || Number.isNaN(due.getTime())) return "unscheduled";
  const delta = due.getTime() - Date.now();
  if (delta < 0) return "overdue";
  if (delta <= 1000 * 60 * 60 * 24 * 3) return "due-soon";
  return "scheduled";
}

function formatWorkDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function RelationshipPanel({
  dealId,
  workspaceId,
  isAuthenticated,
  isOnline,
}: {
  dealId: string;
  workspaceId?: string;
  isAuthenticated: boolean;
  isOnline: boolean;
}) {
  const emptyDraft: RelationshipDraft = {
    targetType: "contact",
    displayName: "",
    email: "",
    phone: "",
    website: "",
    role: "seller_owner",
    status: "active",
    notes: "",
  };
  const [relationships, setRelationships] = useState<DealRelationship[]>([]);
  const [draft, setDraft] = useState<RelationshipDraft>(emptyDraft);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "saving" | "saved" | "failed" | "permission" | "offline">("idle");
  const [message, setMessage] = useState("");
  const [candidates, setCandidates] = useState<DuplicateCandidate[]>([]);
  const [pendingSeparateCreate, setPendingSeparateCreate] = useState(false);
  const [editing, setEditing] = useState<Record<string, { role: DealRelationshipRole; status: DealRelationshipStatus; notes: string }>>({});
  const [showForm, setShowForm] = useState(false);

  const canUseCloud = isAuthenticated && Boolean(workspaceId);

  const load = useCallback(async () => {
    if (!canUseCloud) {
      setRelationships([]);
      setStatus("ready");
      setMessage("Sign in to save people and organizations with this Deal.");
      return;
    }
    if (!isOnline) {
      setStatus("offline");
      setMessage("Connection is unavailable. Saved relationships remain unchanged.");
      return;
    }
    setStatus("loading");
    setMessage("");
    try {
      const rows = await listDealRelationships(dealId);
      setRelationships(rows);
      setEditing(Object.fromEntries(rows.map((relationship) => [relationship.relationshipId, {
        role: relationship.role,
        status: relationship.status,
        notes: relationship.notes ?? "",
      }])));
      setStatus("ready");
    } catch (error) {
      const text = error instanceof Error ? error.message : "BRIX could not load Deal relationships.";
      setStatus(/permission|access|not have/i.test(text) ? "permission" : "failed");
      setMessage(text);
    }
  }, [canUseCloud, dealId, isOnline]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveDraft(options: { allowSeparate: boolean } = { allowSeparate: false }) {
    if (!workspaceId || !isAuthenticated) {
      setMessage("Sign in to save people and organizations with this Deal.");
      return;
    }
    if (!isOnline) {
      setStatus("offline");
      setMessage("Connection is unavailable. Try again when you are back online.");
      return;
    }
    const cleanedName = draft.displayName.trim();
    if (!cleanedName) {
      setMessage(draft.targetType === "contact" ? "Enter the person's name." : "Enter the organization name.");
      return;
    }

    setStatus("saving");
    setMessage("");
    try {
      if (!options.allowSeparate) {
        const duplicateCandidates = await findRelationshipCandidates(workspaceId, { ...draft, displayName: cleanedName });
        if (duplicateCandidates.length > 0) {
          setCandidates(duplicateCandidates);
          setPendingSeparateCreate(true);
          setStatus("ready");
          setMessage("BRIX found possible existing records. Choose one or create a separate record.");
          return;
        }
      }

      await createAndAttachRelationship(workspaceId, dealId, { ...draft, displayName: cleanedName });
      setDraft(emptyDraft);
      setCandidates([]);
      setPendingSeparateCreate(false);
      setShowForm(false);
      setStatus("saved");
      setMessage("Relationship saved.");
      await load();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Relationship was not saved.";
      setStatus(/changed after you opened/i.test(text) ? "failed" : /permission|access|not have/i.test(text) ? "permission" : "failed");
      setMessage(text);
    }
  }

  async function attachExistingCandidate(candidate: DuplicateCandidate) {
    if (!isAuthenticated || !workspaceId) return;
    setStatus("saving");
    try {
      await attachExistingRelationship(dealId, draft.targetType, candidate.id, draft);
      setDraft(emptyDraft);
      setCandidates([]);
      setPendingSeparateCreate(false);
      setShowForm(false);
      setStatus("saved");
      setMessage("Existing record connected to this Deal.");
      await load();
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "Existing record was not connected.");
    }
  }

  async function saveRelationship(relationship: DealRelationship) {
    const next = editing[relationship.relationshipId];
    if (!next) return;
    setStatus("saving");
    try {
      await updateRelationship(relationship, next);
      setStatus("saved");
      setMessage("Relationship updated.");
      await load();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Relationship was not updated.";
      setStatus(/changed after you opened/i.test(text) ? "failed" : /permission|access|not have/i.test(text) ? "permission" : "failed");
      setMessage(text);
    }
  }

  async function removeFromDeal(relationship: DealRelationship) {
    setStatus("saving");
    try {
      await removeRelationship(relationship);
      setStatus("saved");
      setMessage("Relationship removed from this Deal. The person or organization record was kept.");
      await load();
    } catch (error) {
      setStatus("failed");
      setMessage(error instanceof Error ? error.message : "Relationship was not removed.");
    }
  }

  function setRelationshipEdit(id: string, update: Partial<{ role: DealRelationshipRole; status: DealRelationshipStatus; notes: string }>) {
    setEditing((current) => ({ ...current, [id]: { ...current[id], ...update } }));
  }

  return (
    <section className="panel relationships-panel">
      <div className="panel-heading-row">
        <div>
          <p className="eyebrow">People</p>
          <h3>Who is involved in this Deal?</h3>
        </div>
        <div className="relationship-toolbar">
          <button className="secondary compact" type="button" onClick={() => setShowForm((current) => !current)} disabled={!canUseCloud}>
            <Plus size={14} /> {showForm ? "Close" : "Add person"}
          </button>
          <button className="secondary compact" type="button" onClick={load} disabled={status === "loading" || status === "saving"}>
            <RefreshCw size={14} /> Reload
          </button>
        </div>
      </div>

      {status === "loading" && <p className="quiet">Loading saved relationships.</p>}
      {message && <p className={status === "failed" || status === "permission" || status === "offline" ? "error" : "success-text"}>{message}</p>}
      {!canUseCloud && <StatusBadge tone="warning">Cloud save required</StatusBadge>}

      <div className="relationship-list" role="list" aria-label="Deal relationships">
        {relationships.length === 0 && status !== "loading" ? (
          <div className="relationship-empty">
            <strong>No people connected yet</strong>
            <span>Add the seller, broker, lender, inspector, contractor, or other Deal contact when you know them.</span>
          </div>
        ) : relationships.map((relationship) => {
          const current = editing[relationship.relationshipId] ?? { role: relationship.role, status: relationship.status, notes: relationship.notes ?? "" };
          return (
            <article className="relationship-card" role="listitem" key={relationship.relationshipId}>
              <div>
                <strong>{relationship.targetDisplayName}</strong>
                <span>{relationship.targetType === "contact" ? "Person" : "Organization"}</span>
                {(relationship.targetEmail || relationship.targetPhone || relationship.targetWebsite) && (
                  <small>{[relationship.targetEmail, relationship.targetPhone, relationship.targetWebsite].filter(Boolean).join(" | ")}</small>
                )}
              </div>
              <label className="field mini">
                <span>Role</span>
                <select value={current.role} onChange={(event) => setRelationshipEdit(relationship.relationshipId, { role: event.target.value as DealRelationshipRole })}>
                  {relationshipRoles.map((role) => <option value={role.id} key={role.id}>{role.label}</option>)}
                </select>
              </label>
              <label className="field mini">
                <span>Status</span>
                <select value={current.status} onChange={(event) => setRelationshipEdit(relationship.relationshipId, { status: event.target.value as DealRelationshipStatus })}>
                  {relationshipStatuses.map((relationshipStatus) => <option value={relationshipStatus.id} key={relationshipStatus.id}>{relationshipStatus.label}</option>)}
                </select>
              </label>
              <label className="field mini notes-field">
                <span>Deal notes</span>
                <input value={current.notes} onChange={(event) => setRelationshipEdit(relationship.relationshipId, { notes: event.target.value })} />
              </label>
              <div className="relationship-actions">
                <button className="secondary compact" type="button" onClick={() => saveRelationship(relationship)} disabled={status === "saving"}>Save</button>
                <button className="danger compact" type="button" onClick={() => removeFromDeal(relationship)} disabled={status === "saving"}>Remove</button>
              </div>
            </article>
          );
        })}
      </div>

      {showForm && <div className="relationship-form" aria-label="Add Deal relationship">
        <label className="field mini">
          <span>Type</span>
          <select value={draft.targetType} onChange={(event) => {
            setDraft({ ...draft, targetType: event.target.value as RelationshipTargetType });
            setCandidates([]);
            setPendingSeparateCreate(false);
          }}>
            <option value="contact">Person</option>
            <option value="organization">Organization</option>
          </select>
        </label>
        <label className="field mini">
          <span>{draft.targetType === "contact" ? "Person name" : "Organization name"}</span>
          <input value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} />
        </label>
        <label className="field mini">
          <span>Email</span>
          <input type="email" value={draft.email ?? ""} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
        </label>
        <label className="field mini">
          <span>Phone</span>
          <input type="tel" value={draft.phone ?? ""} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
        </label>
        {draft.targetType === "organization" && (
          <label className="field mini">
            <span>Website</span>
            <input value={draft.website ?? ""} onChange={(event) => setDraft({ ...draft, website: event.target.value })} />
          </label>
        )}
        <label className="field mini">
          <span>Role</span>
          <select value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as DealRelationshipRole })}>
            {relationshipRoles.map((role) => <option value={role.id} key={role.id}>{role.label}</option>)}
          </select>
        </label>
        <label className="field mini">
          <span>Status</span>
          <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as RelationshipDraft["status"] })}>
            {relationshipStatuses.map((relationshipStatus) => <option value={relationshipStatus.id} key={relationshipStatus.id}>{relationshipStatus.label}</option>)}
          </select>
        </label>
        <label className="field mini notes-field">
          <span>Deal notes</span>
          <input value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
        </label>
        <button className="primary compact" type="button" onClick={() => saveDraft()} disabled={!canUseCloud || status === "saving"}>
          <Plus size={14} /> Add to Deal
        </button>
      </div>}

      {candidates.length > 0 && (
        <div className="duplicate-candidates" role="status">
          <strong>Possible existing records</strong>
          {candidates.map((candidate) => (
            <article key={candidate.id}>
              <span>{candidate.displayName}</span>
              <small>{candidate.matchReasons.length ? `Matched by ${candidate.matchReasons.join(", ")}` : "Possible duplicate"}</small>
              <button className="secondary compact" type="button" onClick={() => attachExistingCandidate(candidate)} disabled={status === "saving"}>Use existing</button>
            </article>
          ))}
          {pendingSeparateCreate && (
            <button className="secondary compact" type="button" onClick={() => saveDraft({ allowSeparate: true })} disabled={status === "saving"}>
              Create separate record
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function PipelineIQ({ deals, onOpen, onStatusChange }: { deals: DealFacts[]; onOpen: (id: string) => void; onStatusChange: (deal: DealFacts) => void }) {
  if (!deals.length) return <Empty title="No active properties" text="Add a Deal to begin tracking the Property, source, work, and next steps." />;
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
  presentationMode,
  presentationStatus,
  presentationMessage,
  failedPresentationMode,
  onAuthChanged,
  onRecoveryCompleted,
  onSigningOut,
  onSignedOut,
  onPresentationModeChange,
  onPresentationRetry,
}: {
  isAuthenticated: boolean;
  workspaceContext?: WorkspaceContext | null;
  invitationToken?: string | null;
  recoveryActive?: boolean;
  presentationMode: PresentationMode;
  presentationStatus: PresentationPreferenceStatus;
  presentationMessage: string;
  failedPresentationMode: PresentationMode | null;
  onAuthChanged: (userId: string) => void;
  onRecoveryCompleted?: () => void;
  onSigningOut?: () => boolean | void;
  onSignedOut?: () => void;
  onPresentationModeChange: (mode: PresentationMode) => void;
  onPresentationRetry: () => void;
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
  const [showTrustedAccess, setShowTrustedAccess] = useState(() => window.location.pathname === "/account/trusted-access");
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
        if (isCurrent) setInvitationError("BRIX could not load current workspace invitations.");
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
          : "BRIX could not load workspace access. Retry when your connection is stable.");
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

  useEffect(() => {
    if (canUseTrustedAccess && window.location.pathname === "/account/trusted-access") setShowTrustedAccess(true);
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
    return brixLink({ kind: "password-recovery" });
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
      setAccessMessage("Workspace access removed.");
      await loadWorkspaceAccess();
    } catch (error) {
      setAccessError(workspaceAccessError(error));
    } finally {
      setWorkingMembershipId(null);
    }
  }

  async function recordPasswordSecurityEvent() {
    // Canonical event and audit rows are server-owned; Supabase Auth owns password persistence.
    return Promise.resolve();
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
    if (onSigningOut?.() === false) {
      authSubmitInFlightRef.current = false;
      setIsWorking(false);
      return;
    }
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
            <span>Sign in or create an account with the invited email address to accept workspace access.</span>
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
            <PresentationModePanel
              mode={presentationMode}
              status={presentationStatus}
              message={presentationMessage}
              failedMode={failedPresentationMode}
              onChange={onPresentationModeChange}
              onRetry={onPresentationRetry}
            />
            {canUseTrustedAccess && (
              <section className="trusted-access-entry" aria-labelledby="trusted-access-entry-title">
                <div>
                  <p className="eyebrow">Optional sharing</p>
                  <h3 id="trusted-access-entry-title">Workspace Access</h3>
                  <p className="quiet">Share BRIX only when a spouse, partner, advisor, or assistant needs access to your deal work.</p>
                </div>
                <button className="secondary" type="button" onClick={() => setShowTrustedAccess((current) => !current)}>
                  {showTrustedAccess ? "Hide Workspace Access" : "Open Workspace Access"}
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
                <p className="eyebrow">Workspace access</p>
                <h3 id="trusted-access-title">People with access</h3>
                <p className="quiet">Give people only the access level they need.</p>
              </div>
              <button className="secondary compact-button" type="button" onClick={() => loadWorkspaceAccess()} disabled={accessStatus === "loading" || Boolean(workingMembershipId)}>
                {accessStatus === "loading" ? "Loading" : "Retry"}
              </button>
            </div>

            {accessStatus === "loading" && <p className="quiet" role="status">Loading workspace access.</p>}
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
                <span>Invite a partner, advisor, or assistant when you are ready to share BRIX.</span>
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
              <p className="quiet">Only the account owner or an administrator can change workspace access.</p>
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
              <p className="eyebrow">Workspace invitation</p>
              <h3 id="trusted-invitations-title">Share access</h3>
              <p className="quiet">Send an expiring invitation to someone approved to work in this BRIX account.</p>
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
              <div className="invitation-result">
                <label className="field" htmlFor="invitation-link">
                  <span>Invitation link</span>
                  <input id="invitation-link" readOnly value={invitationResult.invitationLink} onFocus={(event) => event.currentTarget.select()} />
                </label>
                {invitationResult.status === "pending" && invitationResult.id && (
                  <button className="secondary compact-button danger-button" type="button" disabled={isInvitationWorking} onClick={() => revokeInvitation(invitationResult.id)}>
                    Revoke invitation
                  </button>
                )}
              </div>
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

function PresentationModePanel({
  mode,
  status,
  message,
  failedMode,
  onChange,
  onRetry,
}: {
  mode: PresentationMode;
  status: PresentationPreferenceStatus;
  message: string;
  failedMode: PresentationMode | null;
  onChange: (mode: PresentationMode) => void;
  onRetry: () => void;
}) {
  const isBusy = status === "loading" || status === "saving";
  const statusTone = status === "failed" || status === "offline" ? "error" : "quiet";
  return (
    <section className="presentation-panel" aria-labelledby="presentation-mode-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Presentation</p>
          <h3 id="presentation-mode-title">Guided or professional mode</h3>
          <p className="quiet">Choose how BRIX presents the same deal data, warnings, actions, and calculations.</p>
        </div>
        <StatusBadge tone={status === "saved" || status === "ready" ? "success" : status === "failed" || status === "offline" ? "warning" : "neutral"}>
          {presentationStatusLabel(status)}
        </StatusBadge>
      </div>
      <fieldset className="presentation-options" disabled={isBusy}>
        <legend className="sr-only">Presentation mode</legend>
        <label className={mode === "guided" ? "presentation-option selected" : "presentation-option"} htmlFor="presentation-guided">
          <input id="presentation-guided" name="presentation-mode" type="radio" value="guided" checked={mode === "guided"} onChange={() => onChange("guided")} />
          <span>
            <strong>Guided</strong>
            <small>Plain-language labels, context, suggested order, and clearer next steps.</small>
          </span>
        </label>
        <label className={mode === "professional" ? "presentation-option selected" : "presentation-option"} htmlFor="presentation-professional">
          <input id="presentation-professional" name="presentation-mode" type="radio" value="professional" checked={mode === "professional"} onChange={() => onChange("professional")} />
          <span>
            <strong>Professional</strong>
            <small>Compact wording, denser surfaces, and faster scanning for experienced users.</small>
          </span>
        </label>
      </fieldset>
      {(message || status === "loading" || status === "saving" || failedMode) && (
        <div className="presentation-status-row" role={status === "failed" || status === "offline" ? "alert" : "status"} aria-live="polite">
          <span className={statusTone}>
            {message || (status === "loading" ? "Loading your account preference." : status === "saving" ? "Saving preference." : "")}
          </span>
          {failedMode && (
            <button className="secondary compact-button" type="button" onClick={onRetry}>
              <RefreshCw size={15} /> Retry {failedMode === "guided" ? "Guided" : "Professional"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function presentationStatusLabel(status: PresentationPreferenceStatus) {
  const labels: Record<PresentationPreferenceStatus, string> = {
    loading: "Loading",
    ready: "Active",
    saving: "Saving",
    saved: "Saved",
    failed: "Retry needed",
    offline: "Offline",
    unsupported: "Unavailable",
  };
  return labels[status];
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
  if (raw.includes("refresh") || raw.includes("changed")) return "Workspace access changed. Refresh and try again.";
  if (raw.includes("permission") || raw.includes("access") || raw.includes("42501")) return "You do not have permission to change workspace access.";
  if (raw.includes("owner")) return "The account owner cannot be changed or removed here.";
  if (raw.includes("role") || raw.includes("access level")) return "That access level is not available for this account.";
  if (raw.includes("active")) return "Only active workspace access can be changed.";
  return "BRIX could not update workspace access. Retry when your connection is stable.";
}

function DealSwitcher({ deals, selectedId, onSelect }: { deals: DealFacts[]; selectedId?: string; onSelect: (id: string) => void }) {
  if (!deals.length) return null;
  return <select aria-label="Deal switcher" className="deal-switcher" value={selectedId} onChange={(event) => onSelect(event.target.value)}>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.address || "Untitled property"}</option>)}</select>;
}

function buildShellSearchResults({
  query,
  deals,
  recentDeals,
  selectedDeal,
  isAuthenticated,
}: {
  query: string;
  deals: DealFacts[];
  recentDeals: DealFacts[];
  selectedDeal?: DealFacts;
  isAuthenticated: boolean;
}) {
  const trimmedQuery = query.trim();
  const results: ShellSearchResult[] = [];
  const add = (result: ShellSearchResult) => {
    if (!results.some((item) => item.key === result.key)) results.push(result);
  };

  if (!trimmedQuery) {
    add({ key: "nav-home", label: "Home", description: "Return to the BRIX account overview.", group: "Navigation", target: "home" });
    add({ key: "nav-deals", label: "Deals", description: "Open the saved Deal workspace.", group: "Navigation", target: "deals" });
    add({ key: "nav-account", label: "Settings", description: "Manage account, access, and security.", group: "Navigation", target: "account" });
    if (isAuthenticated && selectedDeal) add(dealSearchResult(selectedDeal, "Active Deal"));
    if (isAuthenticated) recentDeals.forEach((deal) => add(dealSearchResult(deal, "Recent Deal")));
    return results;
  }

  const normalizedQuery = normalizeSearchText(trimmedQuery);
  for (const item of nav) {
    const searchableText = normalizeSearchText(`${item.label} ${item.purpose}`);
    if (searchableText.includes(normalizedQuery)) {
      add({ key: `nav-${item.id}`, label: item.label, description: item.purpose, group: "Navigation", target: item.id === "deal" ? "deals" : item.id });
    }
  }

  if (!isAuthenticated) return results;

  for (const deal of deals) {
    if (dealMatchesSearch(deal, normalizedQuery)) add(dealSearchResult(deal, "Saved Deal"));
  }

  return results;
}

function dealSearchResult(deal: DealFacts, group: string): ShellSearchResult {
  return {
    key: `deal-${deal.id}`,
    label: dealTitle(deal),
    description: `${dealLocation(deal)} - ${statusLabel(deal.status)}`,
    group,
    target: "deal",
    dealId: deal.id,
  };
}

function dealMatchesSearch(deal: DealFacts, normalizedQuery: string) {
  const strategyName = deal.strategyId ? strategyCatalog[deal.strategyId as StrategyId]?.name ?? "" : "";
  const searchableText = normalizeSearchText([
    deal.address,
    deal.city,
    deal.state,
    deal.zip,
    statusLabel(deal.status),
    strategyName,
  ].filter(Boolean).join(" "));
  return searchableText.includes(normalizedQuery);
}

function buildInvestorAttentionItems({
  isAuthenticated,
  authLifecycle,
  workspaceStatus,
  isOnline,
  deals,
  syncMessage,
  routeMessage,
}: {
  isAuthenticated: boolean;
  authLifecycle: "restoring" | "signed_out" | "bootstrapping" | "ready" | "failed" | "signing_out" | "expired";
  workspaceStatus: "loading" | "ready" | "failed" | "signed_out";
  isOnline: boolean;
  deals: DealFacts[];
  syncMessage: string | null;
  routeMessage: string | null;
}) {
  const items: InvestorAttentionItem[] = [];

  if (!isOnline) {
    items.push({
      key: "offline",
      title: "Connection is unavailable",
      detail: "Cloud Deal updates and account actions are paused until this device reconnects.",
      category: "Failed",
      tone: "warning",
    });
  }

  if (authLifecycle === "signing_out") {
    items.push({
      key: "signing-out",
      title: "Signing out",
      detail: "Protected workspace state is being cleared from this browser.",
      category: "Processing",
      tone: "neutral",
    });
  }

  if (isAuthenticated && (authLifecycle === "bootstrapping" || workspaceStatus === "loading")) {
    items.push({
      key: "workspace-loading",
      title: "Preparing account workspace",
      detail: "Saved Deals stay hidden until workspace access is confirmed.",
      category: "Processing",
      tone: "neutral",
    });
  }

  if (isAuthenticated && (authLifecycle === "failed" || workspaceStatus === "failed")) {
    items.push({
      key: "workspace-failed",
      title: "Account setup needs attention",
      detail: "BRIX could not confirm workspace access. Retry before relying on cloud Deal data.",
      category: "Failed",
      tone: "danger",
      action: "retryWorkspace",
      actionLabel: "Retry setup",
    });
  }

  if (isAuthenticated && authLifecycle === "expired") {
    items.push({
      key: "session-expired",
      title: "Sign in required",
      detail: "The previous session is no longer valid. Sign in again before opening cloud Deals.",
      category: "Failed",
      tone: "danger",
      action: "openSettings",
      actionLabel: "Open settings",
    });
  }

  if (syncMessage?.startsWith("Saving") || syncMessage?.startsWith("Deleting")) {
    items.push({
      key: "cloud-sync-processing",
      title: syncMessage.startsWith("Saving") ? "Saving Deal" : "Deleting Deal",
      detail: syncMessage,
      category: "Processing",
      tone: "neutral",
    });
  } else if (syncMessage?.startsWith("Deal was not")) {
    items.push({
      key: "cloud-sync-failed",
      title: "Cloud update failed",
      detail: syncMessage,
      category: "Failed",
      tone: "danger",
      action: "openDeals",
      actionLabel: "Review Deals",
    });
  }

  if (routeMessage) {
    items.push({
      key: "route-message",
      title: "Deal route needs attention",
      detail: routeMessage,
      category: "Needs attention",
      tone: "warning",
      action: "openDeals",
      actionLabel: "Open Deals",
    });
  }

  if (isAuthenticated && authLifecycle === "ready" && workspaceStatus === "ready") {
    const activeDeals = deals
      .filter((deal) => ["draft", "reviewing", "underwriting", "pursuing", "under_contract"].includes(deal.status))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
      .slice(0, 4);

    for (const deal of activeDeals) {
      items.push({
        key: `deal-${deal.id}`,
        title: attentionTitleForDeal(deal),
        detail: `${dealTitle(deal)} - ${dealLocation(deal)} - ${statusLabel(deal.status)} - updated ${formatShortDate(deal.updatedAt)}.`,
        category: "Needs attention",
        tone: deal.status === "under_contract" ? "warning" : "neutral",
        action: "openDeal",
        actionLabel: "Open Deal",
        dealId: deal.id,
      });
    }
  }

  return items;
}

function attentionTitleForDeal(deal: DealFacts) {
  const labels: Record<DealStatus, string> = {
    draft: "Deal needs first review",
    reviewing: "Deal review is in progress",
    underwriting: "Underwriting is in progress",
    pursuing: "Pursuit is active",
    under_contract: "Contract period is active",
    closed: "Deal is closed",
    passed: "Deal is passed",
  };
  return labels[deal.status];
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function isTextEntryTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
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
  if (module === "deal") return "Deal";
  return nav.find((item) => item.id === module)?.label ?? "BRIX";
}

function dealTitle(deal: DealFacts) {
  return deal.address?.trim() || "Untitled Deal";
}

function dealLocation(deal: DealFacts) {
  const parts = [deal.city, deal.state, deal.zip].filter(Boolean);
  return parts.length ? parts.join(", ") : "Location not entered";
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
