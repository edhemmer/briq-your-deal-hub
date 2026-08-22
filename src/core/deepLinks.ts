export type BrixDeepLinkDestination =
  | { kind: "home" }
  | { kind: "deals" }
  | { kind: "settings"; panel?: "account" | "trusted-access" }
  | { kind: "password-recovery" }
  | { kind: "invitation"; token: string }
  | { kind: "deal"; dealId: string; section?: BrixDealSection; focus?: BrixDealFocus }
  | { kind: "share-intake"; handoffId: string };

export type BrixDealSection = "overview" | "property" | "underwriting" | "strategies" | "financeiq" | "work" | "history";

export type BrixDealFocus =
  | "deal_overview"
  | "property_detail"
  | "underwriting_summary"
  | "underwriting_input"
  | "underwriting_output"
  | "formula_lineage"
  | "snapshot_detail"
  | "scenario_detail"
  | "sensitivity_detail"
  | "strategy_overview"
  | "strategy_result"
  | "strategy_comparison"
  | "financeiq_overview"
  | "financing_structure"
  | "financing_condition"
  | "financing_covenant"
  | "financing_comparison"
  | "recommendation_detail"
  | "risk_detail"
  | "missing_input_detail"
  | "assumption_detail"
  | "conflict_detail"
  | "task_detail"
  | "deadline_detail"
  | "history_entry"
  | "report_preview"
  | "source_record"
  | "evidence_item"
  | "evidence_anchor"
  | "professional_review"
  | "governing_workflow";

export type BrixDeepLinkResult =
  | { ok: true; destination: BrixDeepLinkDestination; canonicalPath: string; requiresAuth: boolean }
  | { ok: false; reason: "malformed" | "unapproved_scheme" | "unapproved_host" | "unsupported_destination" | "unknown_parameters"; message: string; canonicalPath: "/app" };

const PRODUCTION_HOSTS = new Set(["brixrealestate.app", "www.brixrealestate.app"]);
const DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const SAFE_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{8,512}$/;
const SAFE_DEAL_ID_PATTERN = /^[A-Za-z0-9._:-]{1,160}$/;
const SAFE_SHARE_HANDOFF_PATTERN = /^share_[A-Za-z0-9._:-]{8,160}$/;
const SAFE_DEAL_SECTIONS: readonly BrixDealSection[] = ["overview", "property", "underwriting", "strategies", "financeiq", "work", "history"];
const SAFE_DEAL_FOCUS_TYPES: readonly BrixDealFocus[] = [
  "deal_overview",
  "property_detail",
  "underwriting_summary",
  "underwriting_input",
  "underwriting_output",
  "formula_lineage",
  "snapshot_detail",
  "scenario_detail",
  "sensitivity_detail",
  "strategy_overview",
  "strategy_result",
  "strategy_comparison",
  "financeiq_overview",
  "financing_structure",
  "financing_condition",
  "financing_covenant",
  "financing_comparison",
  "recommendation_detail",
  "risk_detail",
  "missing_input_detail",
  "assumption_detail",
  "conflict_detail",
  "task_detail",
  "deadline_detail",
  "history_entry",
  "report_preview",
  "source_record",
  "evidence_item",
  "evidence_anchor",
  "professional_review",
  "governing_workflow",
];

export const BRIX_PRODUCTION_ORIGIN = "https://brixrealestate.app";

export function parseBrixDeepLink(input: string | URL, base = globalThis.location?.origin ?? BRIX_PRODUCTION_ORIGIN): BrixDeepLinkResult {
  let url: URL;
  try {
    url = input instanceof URL ? new URL(input.href) : new URL(input, base);
  } catch {
    return rejected("malformed", "BRIX could not open that link.");
  }

  if (!isApprovedScheme(url)) return rejected("unapproved_scheme", "BRIX could not open that link.");
  if (!isApprovedHost(url)) return rejected("unapproved_host", "BRIX could not open that link.");
  if (url.username || url.password) return rejected("malformed", "BRIX could not open that link.");

  const path = pathForParsedUrl(url);
  const params = url.searchParams;

  if (path === "/" || path === "/app" || path === "/home" || path === "/dashboard") {
    return noParamDestination(params, { kind: "home" }, "/app", false);
  }

  if (path === "/deals") {
    return noParamDestination(params, { kind: "deals" }, "/deals", true);
  }

  if (path.startsWith("/deals/")) {
    if (hasUnknownParams(params, ["section", "focus"])) return rejected("unknown_parameters", "BRIX could not open that link.");
    const dealId = decodeSegment(path.slice("/deals/".length));
    if (!dealId || !SAFE_DEAL_ID_PATTERN.test(dealId)) return rejected("malformed", "BRIX could not open that Deal link.");
    const rawSection = params.get("section")?.trim();
    const rawFocus = params.get("focus")?.trim();
    if (rawSection && !isSafeDealSection(rawSection)) return rejected("malformed", "BRIX could not open that Deal link.");
    if (rawFocus && !isSafeDealFocus(rawFocus)) return rejected("malformed", "BRIX could not open that Deal link.");
    const section = rawSection && isSafeDealSection(rawSection) ? rawSection : undefined;
    const focus = rawFocus && isSafeDealFocus(rawFocus) ? rawFocus : undefined;
    const destination = {
      kind: "deal",
      dealId,
      ...(section ? { section } : {}),
      ...(focus ? { focus } : {}),
    } satisfies BrixDeepLinkDestination;
    return { ok: true, destination, canonicalPath: pathForBrixDestination(destination), requiresAuth: true };
  }

  if (path.startsWith("/share-intake/")) {
    if (hasUnknownParams(params, [])) return rejected("unknown_parameters", "BRIX could not open that shared item.");
    const handoffId = decodeSegment(path.slice("/share-intake/".length));
    if (!handoffId || !SAFE_SHARE_HANDOFF_PATTERN.test(handoffId)) return rejected("malformed", "This shared item could not be opened safely.");
    return { ok: true, destination: { kind: "share-intake", handoffId }, canonicalPath: `/share-intake/${encodeURIComponent(handoffId)}`, requiresAuth: true };
  }

  if (path === "/settings" || path === "/account") {
    if (params.has("flow")) {
      if (hasUnknownParams(params, ["flow"]) || params.get("flow") !== "reset-password") {
        return rejected("unknown_parameters", "BRIX could not open that link.");
      }
      return { ok: true, destination: { kind: "password-recovery" }, canonicalPath: "/account?flow=reset-password", requiresAuth: false };
    }

    if (params.has("invite")) {
      if (hasUnknownParams(params, ["invite"])) return rejected("unknown_parameters", "BRIX could not open that link.");
      const token = params.get("invite")?.trim() ?? "";
      if (!SAFE_TOKEN_PATTERN.test(token)) return rejected("malformed", "This link has expired.");
      return { ok: true, destination: { kind: "invitation", token }, canonicalPath: `/account?invite=${encodeURIComponent(token)}`, requiresAuth: true };
    }

    return noParamDestination(params, { kind: "settings", panel: "account" }, "/account", false);
  }

  if (path === "/settings/trusted-access" || path === "/account/trusted-access") {
    return noParamDestination(params, { kind: "settings", panel: "trusted-access" }, "/account/trusted-access", true);
  }

  if (path === "/auth/callback") {
    const next = params.get("next") ?? params.get("redirectTo") ?? "/app";
    if (hasUnknownParams(params, ["next", "redirectTo"])) return rejected("unknown_parameters", "BRIX could not open that link.");
    const parsed = parseBrixDeepLink(next, base);
    if (!parsed.ok) return rejected("unsupported_destination", "BRIX could not open that link.");
    return parsed;
  }

  return rejected("unsupported_destination", "BRIX could not open that link.");
}

export function brixLink(destination: BrixDeepLinkDestination, origin = currentSafeOrigin()) {
  return `${origin}${pathForBrixDestination(destination)}`;
}

export function pathForBrixDestination(destination: BrixDeepLinkDestination) {
  if (destination.kind === "home") return "/app";
  if (destination.kind === "deals") return "/deals";
  if (destination.kind === "deal") {
    const params = new URLSearchParams();
    if (destination.section) params.set("section", destination.section);
    if (destination.focus) params.set("focus", destination.focus);
    const suffix = Array.from(params.keys()).length > 0 ? `?${params.toString()}` : "";
    return `${canonicalDealPath(destination.dealId)}${suffix}`;
  }
  if (destination.kind === "share-intake") return `/share-intake/${encodeURIComponent(destination.handoffId)}`;
  if (destination.kind === "password-recovery") return "/account?flow=reset-password";
  if (destination.kind === "invitation") return `/account?invite=${encodeURIComponent(destination.token)}`;
  if (destination.kind === "settings" && destination.panel === "trusted-access") return "/account/trusted-access";
  return "/account";
}

export function requiresAuthentication(destination: BrixDeepLinkDestination) {
  return destination.kind === "deals"
    || destination.kind === "deal"
    || destination.kind === "share-intake"
    || destination.kind === "invitation"
    || (destination.kind === "settings" && destination.panel === "trusted-access");
}

function noParamDestination(
  params: URLSearchParams,
  destination: BrixDeepLinkDestination,
  canonicalPath: string,
  requiresAuth: boolean,
): BrixDeepLinkResult {
  if (hasUnknownParams(params, [])) return rejected("unknown_parameters", "BRIX could not open that link.");
  return { ok: true, destination, canonicalPath, requiresAuth };
}

function rejected(reason: Extract<BrixDeepLinkResult, { ok: false }>["reason"], message: string): BrixDeepLinkResult {
  return { ok: false, reason, message, canonicalPath: "/app" };
}

function isApprovedScheme(url: URL) {
  if (url.protocol === "brixrealestate:") return true;
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && DEVELOPMENT_HOSTS.has(url.hostname);
}

function isApprovedHost(url: URL) {
  if (url.protocol === "brixrealestate:") return url.hostname === "share-intake" || url.hostname === "app";
  return PRODUCTION_HOSTS.has(url.hostname) || DEVELOPMENT_HOSTS.has(url.hostname);
}

function hasUnknownParams(params: URLSearchParams, allowed: string[]) {
  const allowedSet = new Set(allowed);
  return Array.from(params.keys()).some((key) => !allowedSet.has(key));
}

function normalizePath(pathname: string) {
  const path = pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
  return path || "/";
}

function pathForParsedUrl(url: URL) {
  const path = normalizePath(url.pathname);
  if (url.protocol !== "brixrealestate:") return path;
  if (url.hostname === "share-intake") return normalizePath(`/share-intake${path}`);
  return path;
}

function decodeSegment(segment: string) {
  if (!segment || segment.includes("/")) return null;
  try {
    const decoded = decodeURIComponent(segment);
    return decoded.includes("/") || decoded.includes("\\") || decoded.includes("?") || decoded.includes("#") ? null : decoded;
  } catch {
    return null;
  }
}

function canonicalDealPath(dealId: string) {
  return `/deals/${encodeURIComponent(dealId)}`;
}

function isSafeDealSection(value: string): value is BrixDealSection {
  return SAFE_DEAL_SECTIONS.includes(value as BrixDealSection);
}

function isSafeDealFocus(value: string): value is BrixDealFocus {
  return SAFE_DEAL_FOCUS_TYPES.includes(value as BrixDealFocus);
}

function currentSafeOrigin() {
  try {
    const current = new URL(globalThis.location?.origin ?? BRIX_PRODUCTION_ORIGIN);
    return isApprovedScheme(current) && isApprovedHost(current) ? current.origin : BRIX_PRODUCTION_ORIGIN;
  } catch {
    return BRIX_PRODUCTION_ORIGIN;
  }
}
