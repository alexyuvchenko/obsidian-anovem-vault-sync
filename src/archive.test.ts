import assert from "node:assert/strict";
import test from "node:test";
import { strFromU8 } from "fflate";
import {
  backupFileName,
  formatTimestamp,
  isInBackupFolder,
  normalizeBackupFolder,
  normalizeBackupKeepLast,
  oldBackupFiles,
  roundTripGzip,
  roundTripZip,
  sanitizeVaultName,
} from "./archive";

test("backup file name uses a timestamp, the vault name, and the format", () => {
  const date = new Date(2026, 8, 29, 15, 26, 30);
  assert.equal(formatTimestamp(date), "20260929-152630");
  assert.equal(backupFileName(date, "My Vault", "zip"), "20260929-152630_My Vault.zip");
  assert.equal(backupFileName(date, "Notes/Vault", "gzip"), "20260929-152630_Notes Vault.gzip");
  assert.equal(sanitizeVaultName("   "), "vault");
});

test("backup folder stays inside the vault", () => {
  assert.equal(normalizeBackupFolder(""), "backups");
  assert.equal(normalizeBackupFolder("/Vault Backups/"), "Vault Backups");
  assert.throws(() => normalizeBackupFolder("../outside"));
  assert.equal(isInBackupFolder("backups/old.zip", "backups"), true);
  assert.equal(isInBackupFolder("Backups/old.zip", "backups"), true);
  assert.equal(isInBackupFolder("notes/backups.md", "backups"), false);
});

test("old backups beyond the keep count are removed", () => {
  assert.equal(normalizeBackupKeepLast(0), 5);
  assert.equal(normalizeBackupKeepLast(3), 3);
  assert.equal(normalizeBackupKeepLast(200), 100);
  assert.deepEqual(
    oldBackupFiles(
      [
        "backups/notes.md",
        "backups/20260927-100000_My Vault.zip",
        "backups/20260929-150000_My Vault.zip",
        "backups/20260928-120000_My Vault.gzip",
      ],
      2,
    ),
    ["backups/20260927-100000_My Vault.zip"],
  );
});

test("zip archive keeps vault files", () => {
  const packed = roundTripZip([
    { path: "Note.md", data: utf8("# Hello"), mtimeMs: 1_700_000_000_000 },
    { path: "attachments/picture.png", data: Uint8Array.from([1, 2, 3, 4]), mtimeMs: 1_700_000_000_000 },
  ]);
  assert.equal(strFromU8(packed["Note.md"]), "# Hello");
  assert.deepEqual(packed["attachments/picture.png"], Uint8Array.from([1, 2, 3, 4]));
});

test("gzip archive is a gzip-compressed tar of the vault", () => {
  const files = roundTripGzip(
    [{ path: "folder/Note.md", data: utf8("body"), mtimeMs: 1_700_000_000_000 }],
    [{ path: "folder", mtimeMs: 1_700_000_000_000 }],
  );
  assert.deepEqual(files, [{ path: "folder/Note.md", data: utf8("body") }]);
});

test("long vault paths survive the gzip archive", () => {
  const path = `${"notes/".repeat(30)}Very long note title.md`;
  const files = roundTripGzip([{ path, data: utf8("long"), mtimeMs: 0 }]);
  assert.equal(files[0]?.path, path);
  assert.equal(strFromU8(files[0]?.data ?? new Uint8Array()), "long");
});

function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
