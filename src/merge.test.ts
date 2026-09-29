import assert from "node:assert/strict";
import test from "node:test";
import { diffRows, textFromChoices } from "./merge";
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
