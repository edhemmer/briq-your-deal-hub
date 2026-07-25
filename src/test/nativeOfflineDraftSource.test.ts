import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const models = readFileSync("ios/BRIXRealEstateiOS/BRIXRealEstateiOS/AppModels.swift", "utf8");

describe("native offline draft source contract", () => {
  it("defines the same offline draft statuses and supported draft types as the web app", () => {
    for (const status of ["local", "queued", "syncing", "synced", "conflicted", "failed", "cancelled"]) {
      expect(models).toContain(`case ${status}`);
    }
    for (const draftType of [
      'case newDeal = "new_deal"',
      'case dealCoreUpdate = "deal_core_update"',
      'case propertyUpdate = "property_update"',
      'case noteCreate = "note_create"',
      'case noteUpdate = "note_update"',
      'case taskCreate = "task_create"',
      'case taskUpdate = "task_update"',
      'case deadlineCreate = "deadline_create"',
      'case deadlineUpdate = "deadline_update"',
    ]) {
      expect(models).toContain(draftType);
    }
  });

  it("keeps native drafts scoped and excludes unsupported offline commands", () => {
    expect(models).toContain("struct OfflineDraftScope");
    expect(models).toContain("UserDefaultsOfflineDraftStore");
    expect(models).toContain("user:\\(userId ?? \"unknown\"):workspace:\\(workspaceId ?? \"unknown\")");
    expect(models).not.toMatch(/archiveDeal|restoreDeal|deleteDeal|relationship|permission_update/i);
    expect(models).not.toMatch(/password|accessToken|refreshToken|service_role/i);
  });
});
