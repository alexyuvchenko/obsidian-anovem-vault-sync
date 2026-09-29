import assert from "node:assert/strict";
import test from "node:test";
import { planAfterCompare, planManualResolution, planRename, planSync } from "./plan";

test("new local file uploads", () => {
  assert.deepEqual(planSync("untracked", "absent"), { action: "upload" });
});

test("new remote file downloads", () => {
  assert.deepEqual(planSync("absent", "untracked"), { action: "download" });
});

test("same file on both sides with no history is compared", () => {
  assert.deepEqual(planSync("untracked", "untracked"), { action: "compare" });
});

test("unchanged file is skipped", () => {
  assert.deepEqual(planSync("unchanged", "unchanged"), { action: "skip" });
});

test("local edit uploads when Dropbox is unchanged", () => {
  assert.deepEqual(planSync("changed", "unchanged"), { action: "upload" });
});

test("Dropbox edit downloads when local is unchanged", () => {
  assert.deepEqual(planSync("unchanged", "changed"), { action: "download" });
});

test("both sides edited is merged against the last shared copy", () => {
  assert.deepEqual(planSync("changed", "changed"), { action: "merge" });
});

test("the first sync uploads this vault and downloads files that exist only in Dropbox", () => {
  assert.deepEqual(planSync("untracked", "untracked", true), { action: "upload" });
  assert.deepEqual(planSync("untracked", "absent", true), { action: "upload" });
  assert.deepEqual(planSync("absent", "untracked", true), { action: "download" });
});

test("equal bytes are recorded without a write", () => {
  assert.deepEqual(planAfterCompare(true), { action: "adopt" });
});

test("different bytes become a conflict", () => {
  assert.deepEqual(planAfterCompare(false), { action: "conflict", kind: "both-changed" });
});

test("a deletion of an unchanged copy goes to the trash", () => {
  assert.deepEqual(planSync("absent", "unchanged"), { action: "trash-remote" });
  assert.deepEqual(planSync("unchanged", "absent"), { action: "trash-local" });
});

test("a deletion beside an edit stays a conflict", () => {
  assert.deepEqual(planSync("absent", "changed"), { action: "conflict", kind: "deleted-local" });
  assert.deepEqual(planSync("changed", "absent"), { action: "conflict", kind: "deleted-remote" });
});

test("a rename is one matching unchanged Dropbox file at the old path", () => {
  assert.equal(planRename(1, true, false), true);
  assert.equal(planRename(1, true, true), false);
  assert.equal(planRename(2, true, false), false);
  assert.equal(planRename(1, false, false), false);
});

test("a file gone on both sides drops its record", () => {
  assert.deepEqual(planSync("absent", "absent"), { action: "forget" });
});

const both = { localHash: "local", remoteRev: "rev-a" };

test("an open conflict stays until the file is edited", () => {
  assert.equal(planManualResolution(both, "local", "rev-a"), "hold");
});

test("editing the file sends that version", () => {
  assert.equal(planManualResolution(both, "edited", "rev-a"), "upload");
});

test("an edit on the other device is downloaded when this file was not touched", () => {
  assert.equal(planManualResolution(both, "local", "rev-b"), "download");
});

test("both sides changing again stays a conflict", () => {
  assert.equal(planManualResolution(both, "edited", "rev-b"), "compare");
});

test("deleting the local file does not delete Dropbox", () => {
  assert.equal(planManualResolution(both, null, "rev-a"), "hold");
});

test("a file restored into the vault is sent", () => {
  assert.equal(planManualResolution({ localHash: null, remoteRev: "rev-a" }, "restored", "rev-a"), "upload");
});

test("deleting a file that is already gone from Dropbox clears it", () => {
  assert.equal(planManualResolution({ localHash: "local", remoteRev: null }, null, null), "forget");
});

test("editing a file missing from Dropbox sends it again", () => {
  assert.equal(planManualResolution({ localHash: "local", remoteRev: null }, "edited", null), "upload");
});
