import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const app = readFileSync("src/App.tsx", "utf8");
const offlineDrafts = readFileSync("src/core/offlineDrafts.ts", "utf8");

describe("Specification 003 offline draft UI source", () => {
  it("supports only the approved offline/native draft actions for this slice", () => {
    for (const draftType of [
      '"new_deal"',
      '"deal_core_update"',
      '"property_update"',
      '"note_create"',
      '"note_update"',
      '"task_create"',
      '"task_update"',
      '"deadline_create"',
      '"deadline_update"',
    ]) {
      expect(offlineDrafts).toContain(draftType);
      expect(app).toContain(draftType);
    }

    for (const excluded of ["archive_create", "restore_create", "delete_create", "relationship_create", "permission_update"]) {
      expect(offlineDrafts).not.toContain(excluded);
    }
  });

  it("uses quiet saved-work UI language and keeps reliability claims out of the user surface", () => {
    expect(app).toContain("Saved device work");
    expect(app).toContain("Cancel local draft");
    expect(app).toContain("Retry sync");
    expect(app).toContain("You have saved device work that has not reached BRIX. Sign out anyway?");
    expect(app).not.toContain("Trusted Access");
    expect(app).not.toContain("Trusted invitation");
    expect(app).not.toContain("trusted people");
    expect(app).not.toContain("trusted partner");
    expect(app).not.toContain("trusted access");
    expect(app).not.toMatch(/trustworthy|reliability badge|live badge/i);
  });

  it("queues edits instead of mutating unsupported archived records while offline", () => {
    expect(app).toContain("queueTaskUpdate");
    expect(app).toContain("queueDeadlineUpdate");
    expect(app).toContain("queueNoteUpdate");
    expect(app).toContain("archiveDealNote");
    expect(app).not.toContain('draftType: "note_archive"');
    expect(app).not.toContain('commandType: "archive_deal_note"');
  });
});
