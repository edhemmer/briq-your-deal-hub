export type BrixDeepLinkDestination =
  | { kind: "home" }
  | { kind: "deals" }
  | { kind: "settings"; panel?: "account" | "trusted-access" }
  | { kind: "password-recovery" }
  | { kind: "invitation"; token: string }
  | { kind: "deal"; dealId: string };

export type BrixDeepLinkResult =
  | { ok: true; destination: BrixDeepLinkDestination; canonicalPath: string; requiresAuth: boolean }
  | { ok: false; reason: "malformed" | "unapproved_scheme" | "unapproved_host" | "unsupported_destination" | "unknown_parameters"; message: string; canonicalPath: "/app" };

const PRODUCTION_HOSTS = new Set(["brixrealestate.app", "www.brixrealestate.app"]);
const DEVELOPMENT_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const SAFE_TOKEN_PATTERN = /^[A-Za-z0-9._~-]{8,512}$/;
const SAFE_DEAL_ID_PATTERN = /^[A-Za-z0-9._:-]{1,160}$/;

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

  const path = normalizePath(url.pathname);
  const params = url.searchParams;

  if (path === "/" || path === "/app" || path === "/home" || path === "/dashboard") {
    return noParamDestination(params, { kind: "home" }, "/app", false);
  }

  if (path === "/deals") {
    return noParamDestination(params, { kind: "deals" }, "/deals", true);
  }

  if (path.startsWith("/deals/")) {
    if (hasUnknownParams(params, [])) return rejected("unknown_parameters", "BRIX could not open that link.");
    const dealId = decodeSegment(path.slice("/deals/".length));
    if (!dealId || !SAFE_DEAL_ID_PATTERN.test(dealId)) return rejected("malformed", "BRIX could not open that Deal link.");
    return { ok: true, destination: { kind: "deal", dealId }, canonicalPath: canonicalDealPath(dealId), requiresAuth: true };
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
  if (destination.kind === "deal") return canonicalDealPath(destination.dealId);
  if (destination.kind === "password-recovery") return "/account?flow=reset-password";
  if (destination.kind === "invitation") return `/account?invite=${encodeURIComponent(destination.token)}`;
  if (destination.kind === "settings" && destination.panel === "trusted-access") return "/account/trusted-access";
  return "/account";
}

export function requiresAuthentication(destination: BrixDeepLinkDestination) {
  return destination.kind === "deals"
    || destination.kind === "deal"
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
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && DEVELOPMENT_HOSTS.has(url.hostname);
}

function isApprovedHost(url: URL) {
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

function currentSafeOrigin() {
  try {
    const current = new URL(globalThis.location?.origin ?? BRIX_PRODUCTION_ORIGIN);
    return isApprovedScheme(current) && isApprovedHost(current) ? current.origin : BRIX_PRODUCTION_ORIGIN;
  } catch {
    return BRIX_PRODUCTION_ORIGIN;
  }
}
