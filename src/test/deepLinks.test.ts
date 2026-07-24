import { describe, expect, it } from "vitest";
import { brixLink, parseBrixDeepLink, pathForBrixDestination, requiresAuthentication } from "../core/deepLinks";

describe("BRIX deep-link routing", () => {
  it("accepts only documented production and development destinations", () => {
    expect(parseBrixDeepLink("https://brixrealestate.app/app")).toMatchObject({
      ok: true,
      destination: { kind: "home" },
      canonicalPath: "/app",
      requiresAuth: false,
    });
    expect(parseBrixDeepLink("https://www.brixrealestate.app/deals/deal-1")).toMatchObject({
      ok: true,
      destination: { kind: "deal", dealId: "deal-1" },
      canonicalPath: "/deals/deal-1",
      requiresAuth: true,
    });
    expect(parseBrixDeepLink("http://localhost:5173/account/trusted-access")).toMatchObject({
      ok: true,
      destination: { kind: "settings", panel: "trusted-access" },
      canonicalPath: "/account/trusted-access",
      requiresAuth: true,
    });
  });

  it("supports password recovery, workspace invitations, and auth return destinations", () => {
    expect(parseBrixDeepLink("https://brixrealestate.app/account?flow=reset-password")).toMatchObject({
      ok: true,
      destination: { kind: "password-recovery" },
      canonicalPath: "/account?flow=reset-password",
      requiresAuth: false,
    });
    expect(parseBrixDeepLink("https://brixrealestate.app/account?invite=raw-token-1")).toMatchObject({
      ok: true,
      destination: { kind: "invitation", token: "raw-token-1" },
      canonicalPath: "/account?invite=raw-token-1",
      requiresAuth: true,
    });
    expect(parseBrixDeepLink("https://brixrealestate.app/auth/callback?next=%2Fdeals%2Fdeal-2")).toMatchObject({
      ok: true,
      destination: { kind: "deal", dealId: "deal-2" },
      canonicalPath: "/deals/deal-2",
      requiresAuth: true,
    });
  });

  it("rejects unsupported routes, open redirects, unsafe schemes, hostile hosts, and unknown params", () => {
    expect(parseBrixDeepLink("https://brixrealestate.app/contractiq")).toMatchObject({ ok: false, canonicalPath: "/app" });
    expect(parseBrixDeepLink("https://evil.example/deals/deal-1")).toMatchObject({ ok: false, reason: "unapproved_host" });
    expect(parseBrixDeepLink("javascript:alert(1)")).toMatchObject({ ok: false, reason: "unapproved_scheme" });
    expect(parseBrixDeepLink("https://brixrealestate.app/deals?next=https://evil.example")).toMatchObject({ ok: false, reason: "unknown_parameters" });
    expect(parseBrixDeepLink("https://brixrealestate.app/auth/callback?next=https%3A%2F%2Fevil.example%2Fdeals%2Fdeal-1")).toMatchObject({ ok: false });
  });

  it("rejects malformed or path-traversing Deal identifiers", () => {
    expect(parseBrixDeepLink("https://brixrealestate.app/deals/%2F..%2Fsecret")).toMatchObject({ ok: false, reason: "malformed" });
    expect(parseBrixDeepLink("https://brixrealestate.app/deals/a%5Cb")).toMatchObject({ ok: false, reason: "malformed" });
    expect(parseBrixDeepLink("https://brixrealestate.app/deals/")).toMatchObject({ ok: true, destination: { kind: "deals" } });
  });

  it("builds canonical BRIX links without leaking to unapproved origins", () => {
    expect(pathForBrixDestination({ kind: "settings", panel: "trusted-access" })).toBe("/account/trusted-access");
    expect(requiresAuthentication({ kind: "settings", panel: "trusted-access" })).toBe(true);
    expect(brixLink({ kind: "deal", dealId: "deal-1" }, "https://brixrealestate.app")).toBe("https://brixrealestate.app/deals/deal-1");
  });
});
