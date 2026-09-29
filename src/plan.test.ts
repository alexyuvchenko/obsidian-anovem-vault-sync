import assert from "node:assert/strict";
import test from "node:test";
import { planAfterCompare, planManualResolution, planSync } from "./plan";

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

test("both sides edited is compared before any write", () => {
  assert.deepEqual(planSync("changed", "changed"), { action: "compare" });
});

test("equal bytes are recorded without a write", () => {
  assert.deepEqual(planAfterCompare(true), { action: "adopt" });
});

test("different bytes become a conflict", () => {
  assert.deepEqual(planAfterCompare(false), { action: "conflict", kind: "both-changed" });
});

test("local deletion is a conflict", () => {
  assert.deepEqual(planSync("absent", "unchanged"), { action: "conflict", kind: "deleted-local" });
  assert.deepEqual(planSync("absent", "changed"), { action: "conflict", kind: "deleted-local" });
});

test("remote deletion is a conflict", () => {
  assert.deepEqual(planSync("unchanged", "absent"), { action: "conflict", kind: "deleted-remote" });
  assert.deepEqual(planSync("changed", "absent"), { action: "conflict", kind: "deleted-remote" });
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
