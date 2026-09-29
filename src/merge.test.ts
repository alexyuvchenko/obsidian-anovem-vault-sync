import assert from "node:assert/strict";
import test from "node:test";
import { diffRows, mergeBlocks, mergeLines, textFromApplied, textFromChoices } from "./merge";
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
