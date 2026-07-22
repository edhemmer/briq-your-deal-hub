import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const iosRoot = join(root, "ios", "BRIXRealEstateiOS");
const appState = readFileSync(join(iosRoot, "BRIXRealEstateiOS", "AppState.swift"), "utf8");
const authContinuity = readFileSync(join(iosRoot, "BRIXRealEstateiOS", "AuthContinuity.swift"), "utf8");
const appEntry = readFileSync(join(iosRoot, "BRIXRealEstateiOS", "BRIXRealEstateiOSApp.swift"), "utf8");
const entitlements = readFileSync(join(iosRoot, "BRIXRealEstateiOS", "BRIXRealEstateiOS.entitlements"), "utf8");
const infoPlist = readFileSync(join(iosRoot, "BRIXRealEstateiOS", "Info.plist"), "utf8");

describe("native authentication continuity source gates", () => {
  it("stores native Supabase session material through Keychain, not UserDefaults", () => {
    expect(authContinuity).toContain("KeychainAuthSessionStore");
    expect(authContinuity).toContain("SecItemCopyMatching");
    expect(authContinuity).toContain("SecItemAdd");
    expect(appState).not.toContain('UserDefaults.standard.set(accessToken');
    expect(appState).not.toContain('UserDefaults.standard.set(refreshToken');
    expect(appState).not.toContain('string(forKey: "brix.accessToken")');
    expect(appState).not.toContain('string(forKey: "brix.refreshToken")');
  });

  it("keeps anonymous local drafts separate from authenticated cloud state", () => {
    expect(appState).toContain('anonymousDraftsKey = "brix.anonymousDrafts"');
    expect(appState).toContain("clearProtectedDealState()");
    expect(appState).toContain("loadAnonymousDrafts()");
    expect(appState).toContain("saveAnonymousDrafts()");
    expect(appState).not.toContain('"brix.deals"');
  });

  it("routes only approved BRIX auth deep links", () => {
    expect(authContinuity).toContain('"brixrealestate.app"');
    expect(authContinuity).toContain('"www.brixrealestate.app"');
    expect(authContinuity).toContain("allowedSchemes");
    expect(authContinuity).toContain(".passwordRecovery");
    expect(authContinuity).toContain(".invitation");
    expect(appEntry).toContain(".onOpenURL");
  });

  it("declares native associated domains and a BRIX URL scheme", () => {
    expect(entitlements).toContain("com.apple.developer.associated-domains");
    expect(entitlements).toContain("applinks:brixrealestate.app");
    expect(entitlements).toContain("applinks:www.brixrealestate.app");
    expect(infoPlist).toContain("CFBundleURLTypes");
    expect(infoPlist).toContain("brixrealestate");
  });
});
