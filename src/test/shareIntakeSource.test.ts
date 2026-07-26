import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("share extension source foundation", () => {
  it("keeps the native extension as a handoff source, not a Supabase writer", () => {
    const payloadSource = readFileSync("ios/BRIXRealEstateiOS/ShareExtension/ShareIntakePayload.swift", "utf8");
    const controllerSource = readFileSync("ios/BRIXRealEstateiOS/ShareExtension/ShareViewController.swift", "utf8");
    const appStateSource = readFileSync("ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AppState.swift", "utf8");
    const authContinuitySource = readFileSync("ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AuthContinuity.swift", "utf8");
    const combined = `${payloadSource}\n${controllerSource}`;

    expect(payloadSource).toContain("ShareIntakePayload");
    expect(payloadSource).toContain("group.BrixRE.BRIX-Real-Estate");
    expect(payloadSource).toContain("brixrealestate://share-intake/");
    expect(controllerSource).toContain("extensionContext?.open");
    expect(authContinuitySource).toContain("case sharedIntake(handoffId: String)");
    expect(authContinuitySource).toContain("share-intake");
    expect(appStateSource).toContain("Sign in to review the shared property source.");
    expect(combined).not.toMatch(/supabase|service_role|Authorization|accessToken|refreshToken/i);
  });

  it("declares restrained activation rules for one supported shared item", () => {
    const plist = readFileSync("ios/BRIXRealEstateiOS/ShareExtension/Info.plist", "utf8");

    expect(plist).toContain("com.apple.share-services");
    expect(plist).toContain("NSExtensionActivationSupportsWebURLWithMaxCount");
    expect(plist).toContain("<integer>1</integer>");
    expect(plist).toContain("NSExtensionActivationSupportsFileWithMaxCount");
    expect(plist).toContain("NSExtensionActivationSupportsImageWithMaxCount");
    expect(plist).not.toContain("NSExtensionActivationSupportsMovieWithMaxCount");
  });

  it("reuses completed intake modules instead of introducing duplicate canonical systems", () => {
    const shareContract = readFileSync("src/core/shareIntake.ts", "utf8");

    expect(shareContract).toContain("listing_url");
    expect(shareContract).toContain("file_evidence");
    expect(shareContract).toContain("email_intake");
    expect(shareContract).toContain("prepareManualDraftFromSharedIntake");
    expect(shareContract).not.toContain("create_canonical_deal");
    expect(shareContract).not.toContain("supabase.rpc");
    expect(shareContract).not.toContain("invokeBrixFunction");
  });
});
