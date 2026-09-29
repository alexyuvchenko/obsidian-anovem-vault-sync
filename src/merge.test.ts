import assert from "node:assert/strict";
import test from "node:test";
import { changedSpans, diffRows, foldContext, hunkLabel, mergeBlocks, mergeLines, pendingHunks, seedChoices, textFromApplied, textFromChoices } from "./merge";
import { conflictBackupPath } from "./paths";

test("backup names keep the folder and mark which side", () => {
  assert.equal(
    conflictBackupPath("notes/Daily.md", "20260929-183045", "local"),
    "notes/20260929-183045_Daily_local_backup.md",
  );
  assert.equal(
    conflictBackupPath("notes/Daily.md", "20260929-183045", "dropbox"),
    "notes/20260929-183045_Daily_dropbox_backup.md",
  );
});

test("unchanged lines stay and a changed block can take either side", () => {
  const rows = diffRows("title\nalpha\nend", "title\nbeta\nend");
  assert.equal(rows.filter((row) => row.kind === "change").length, 1);
  const change = rows.find((row) => row.kind === "change");
  assert.ok(change);
  const local = new Map<number, "local" | "remote">([[change.id, "local"]]);
  const remote = new Map<number, "local" | "remote">([[change.id, "remote"]]);
  assert.equal(textFromChoices(rows, local), "title\nalpha\nend");
  assert.equal(textFromChoices(rows, remote), "title\nbeta\nend");
});

test("a change can apply the left side, the right side, or both", () => {
  const rows = diffRows("title\nalpha\nend", "title\nbeta\nend");
  const change = rows.find((row) => row.kind === "change");
  assert.ok(change);
  const both = new Map([[change.id, { local: true, remote: true }]]);
  const neither = new Map([[change.id, { local: false, remote: false }]]);
  assert.equal(textFromApplied(rows, both), "title\nalpha\nbeta\nend");
  assert.equal(textFromApplied(rows, neither), "title\nend");
});

test("changed lines stay aligned across the three panes", () => {
  const lines = mergeLines(diffRows("title\nalpha\nend", "title\nbeta\nend"));
  assert.deepEqual(lines.map((line) => [line.from, line.text]), [
    ["same", "title"],
    ["local", "alpha"],
    ["remote", "beta"],
    ["same", "end"],
  ]);
});

test("a changed table stays one markdown block", () => {
  const local = "| env | link |\n| --- | --- |\n| dev | one |";
  const remote = "| env | link |\n| --- | --- |\n| dev | two |";
  const blocks = mergeBlocks(diffRows(local, remote));
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].kind, "change");
  assert.equal(blocks[0].local, local);
  assert.equal(blocks[0].remote, remote);
});

test("lines that exist on only one side are kept together", () => {
  const local = "title\nonly local\nmiddle\nend";
  const remote = "title\nmiddle\nend\nonly remote";
  const rows = diffRows(local, remote);
  assert.equal(pendingHunks(rows, seedChoices(rows), new Map()).length, 0);
  assert.equal(textFromApplied(rows, seedChoices(rows)), "title\nonly local\nmiddle\nend\nonly remote");
});

test("a line changed on both sides stays undecided", () => {
  const rows = diffRows("title\nalpha\nend", "title\nbeta\nend");
  const pending = pendingHunks(rows, seedChoices(rows), new Map());
  assert.equal(pending.length, 1);
  assert.equal(hunkLabel(pending[0], undefined, false), "Both sides changed. Choose before applying.");
});

test("only the changed word is marked inside a line", () => {
  assert.deepEqual(changedSpans("hello world", "hello there"), [
    { text: "hello ", strong: false },
    { text: "world", strong: true },
  ]);
});

test("unchanged stretches collapse around a change", () => {
  const local = ["same1", "same2", "same3", "same4", "same5", "local", "same6", "same7", "same8"].join("\n");
  const remote = ["same1", "same2", "same3", "same4", "same5", "remote", "same6", "same7", "same8"].join("\n");
  const folded = foldContext(mergeLines(diffRows(local, remote)), 2);
  const folds = folded.filter((item) => item.kind === "fold");
  assert.equal(folds.length, 2);
  assert.deepEqual(
    folds.map((item) => (item.kind === "fold" ? item.count : 0)),
    [3, 1],
  );
});
