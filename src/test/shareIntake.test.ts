import { describe, expect, it } from "vitest";
import {
  createSharedIntakePayload,
  createSharedIntakeReview,
  loadSharedIntakeHandoff,
  nativeShareActivationRules,
  parseSharedIntakePayload,
  prepareManualDraftFromSharedIntake,
  redactedDiagnostics,
  resolveSharedIntakeDeepLink,
  routeSharedIntakePayload,
  saveSharedIntakeHandoff,
  serializeSharedIntakePayload,
  sharedIntakeDeepLink,
  sharedIntakeDiagnosticsEvent,
  transitionSharedIntake,
} from "../core/shareIntake";
import { loadManualIntakeDraft } from "../core/propertyIntake";

describe("shared intake payload contract", () => {
  it("creates URL payloads that route to Listing URL intake without creating a Deal", () => {
    const payload = createSharedIntakePayload({ url: "https://example.com/listing#photos", sourcePlatform: "ios", now: "2026-07-26T00:00:00.000Z" });

    expect(payload.contentType).toBe("url");
    expect(payload.normalizedUrl).toBe("https://example.com/listing");
    expect(payload.status).toBe("received_locally");
    expect(payload.result?.dealId).toBeUndefined();
    expect(routeSharedIntakePayload(payload)).toBe("listing_url");
    expect(sharedIntakeDeepLink(payload.handoffId)).toBe(`/share-intake/${encodeURIComponent(payload.handoffId)}`);
  });

  it("supports text, file, image, email file, and mixed URL plus text", () => {
    expect(createSharedIntakePayload({ text: "Call seller about 123 Main" }).contentType).toBe("text");
    expect(createSharedIntakePayload({ file: fileRef("listing.pdf", "application/pdf") }).contentType).toBe("file");
    expect(createSharedIntakePayload({ file: fileRef("kitchen.png", "image/png") }).contentType).toBe("image");
    expect(createSharedIntakePayload({ file: fileRef("message.eml", "message/rfc822") }).contentType).toBe("email_file");
    expect(createSharedIntakePayload({ url: "https://example.com/home", text: "Worth comparing" }).contentType).toBe("mixed_url_text");
  });

  it("rejects unsupported payloads, oversized content, invalid MIME, and malformed serialization", () => {
    expect(() => createSharedIntakePayload({})).toThrow(/share a url/i);
    expect(() => createSharedIntakePayload({ text: "x".repeat(8_001) })).toThrow(/too large/i);
    expect(() => createSharedIntakePayload({ file: fileRef("script.js", "text/javascript") })).toThrow(/unsupported/i);
    expect(() => createSharedIntakePayload({ file: fileRef("huge.pdf", "application/pdf", 5 * 1024 * 1024 + 1) })).toThrow(/too large/i);
    expect(() => parseSharedIntakePayload("{nope")).toThrow(/malformed/i);
    expect(() => parseSharedIntakePayload(JSON.stringify({ version: 99 }))).toThrow(/malformed/i);
  });

  it("serializes deterministically and validates schema version", () => {
    const payload = createSharedIntakePayload({ text: "https://example.com/listing\nPossible lead", now: "2026-07-26T00:00:00.000Z" });
    const serialized = serializeSharedIntakePayload(payload);
    const roundTrip = parseSharedIntakePayload(serialized);

    expect(serializeSharedIntakePayload(payload)).toBe(serialized);
    expect(roundTrip.version).toBe(1);
    expect(roundTrip.payloadHash).toBe(payload.payloadHash);
  });
});

describe("shared intake state, auth, deep-link, and duplicate behavior", () => {
  it("enforces deterministic handoff transitions", () => {
    const payload = createSharedIntakePayload({ url: "https://example.com/a" });

    const open = transitionSharedIntake(payload, "awaiting_app_open");
    const auth = transitionSharedIntake(open, "awaiting_authentication");
    const workspace = transitionSharedIntake(auth, "awaiting_workspace");
    const review = transitionSharedIntake(workspace, "awaiting_review");
    const queued = transitionSharedIntake(review, "queued");
    const syncing = transitionSharedIntake(queued, "syncing");
    const complete = transitionSharedIntake(syncing, "complete");

    expect(complete.status).toBe("complete");
    expect(() => transitionSharedIntake(complete, "queued")).toThrow(/invalid/i);
    expect(() => transitionSharedIntake(payload, "complete")).toThrow(/invalid/i);
  });

  it("resolves authentication, workspace, permission, and repeated app-open states safely", () => {
    const payload = createSharedIntakePayload({ text: "Seller text" });
    const signedOut = createSharedIntakeReview(payload);

    expect(signedOut.actions).toContain("create_new_deal");
    saveSharedIntakeHandoff(payload);
    expect(resolveSharedIntakeDeepLink(payload.handoffId, loadSharedIntakeHandoff)).toMatchObject({ ok: true });
    expect(resolveSharedIntakeDeepLink("share_missing1", loadSharedIntakeHandoff)).toMatchObject({ ok: false, reason: "unknown" });

    const scoped = { ...payload, authenticatedUserId: "user-a", workspaceId: "workspace-a" };
    saveSharedIntakeHandoff(scoped);
    expect(resolveSharedIntakeDeepLink(payload.handoffId, loadSharedIntakeHandoff, { userId: "user-b", workspaceId: "workspace-a" })).toMatchObject({ ok: false, reason: "unauthorized" });
    expect(resolveSharedIntakeDeepLink(payload.handoffId, loadSharedIntakeHandoff, { userId: "user-a", workspaceId: "workspace-b" })).toMatchObject({ ok: false, reason: "unauthorized" });
  });

  it("preserves original context, uses existing manual draft storage, and remains idempotent", () => {
    const first = createSharedIntakePayload({ url: "https://example.com/one", text: "Call agent", now: "2026-07-26T00:00:00.000Z" });
    const second = createSharedIntakePayload({ url: "https://example.com/one", text: "Call agent", now: "2026-07-26T00:00:00.000Z" });

    expect(first.payloadHash).toBe(second.payloadHash);
    expect(first.idempotencyKey).toBe(second.idempotencyKey);
    const draft = prepareManualDraftFromSharedIntake(first, "test-scope");
    const loaded = loadManualIntakeDraft("test-scope");

    expect(draft.sourceUrl).toBe("https://example.com/one");
    expect(loaded?.sourceUrl).toBe("https://example.com/one");
    expect(routeSharedIntakePayload(first)).toBe("listing_url");
  });

  it("does not leak raw text, tokens, or bytes through diagnostics or deep links", () => {
    const payload = createSharedIntakePayload({ text: "Private seller note with https://example.com/a", file: undefined });
    const diagnostics = redactedDiagnostics(payload);
    const event = sharedIntakeDiagnosticsEvent("intake.share_received", payload);

    expect(JSON.stringify(diagnostics)).not.toContain("Private seller note");
    expect(JSON.stringify(event)).not.toContain("Private seller note");
    expect(sharedIntakeDeepLink(payload.handoffId)).not.toContain("Private");
  });

  it("declares restrained native activation rules", () => {
    expect(nativeShareActivationRules.maxUrls).toBe(1);
    expect(nativeShareActivationRules.maxFiles).toBe(1);
    expect(nativeShareActivationRules.rejectedKinds).toContain("multiple_unrelated_files");
    expect(nativeShareActivationRules.mainAppUrlScheme).toBe("brixrealestate");
  });
});

function fileRef(originalFilename: string, declaredMimeType: string, byteSize = 100) {
  return {
    localReference: `tmp/${originalFilename}`,
    originalFilename,
    declaredMimeType,
    byteSize,
    contentHash: "abc123",
  };
}
