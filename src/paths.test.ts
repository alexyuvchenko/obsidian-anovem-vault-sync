import assert from "node:assert/strict";
import test from "node:test";
import {
  fromDropboxPath,
  headerJson,
  isIncluded,
  normalizeAttachmentsFolder,
  normalizeDropboxFolder,
  syncVaultFolder,
  toDropboxPath,
} from "./paths";

test("dropbox folder normalization", () => {
  assert.equal(normalizeDropboxFolder("Vault"), "/Vault");
  assert.equal(normalizeDropboxFolder("/Vault/"), "/Vault");
  assert.equal(normalizeDropboxFolder("/"), "/");
  assert.throws(() => normalizeDropboxFolder(""));
  assert.throws(() => normalizeDropboxFolder("/Vault/../Other"));
});

test("each vault is a folder inside ObsidianAnovem", () => {
  assert.equal(syncVaultFolder("/ObsidianAnovem", "My Vault"), "/ObsidianAnovem/My Vault");
  assert.equal(syncVaultFolder("/ObsidianAnovem/", "Notes/Home"), "/ObsidianAnovem/Notes Home");
  assert.equal(syncVaultFolder("/", "Vault"), "/Vault");
});

test("paths map into and out of the dropbox folder", () => {
  assert.equal(toDropboxPath("/Vault", "notes/a.md"), "/Vault/notes/a.md");
  assert.equal(toDropboxPath("/", "a.md"), "/a.md");
  assert.equal(fromDropboxPath("/Vault", "/Vault/notes/a.md"), "notes/a.md");
  assert.equal(fromDropboxPath("/vault", "/Vault/A.md"), "A.md");
  assert.equal(fromDropboxPath("/Vault", "/Other/a.md"), null);
  assert.equal(fromDropboxPath("/", "/a.md"), "a.md");
});

test("scope is markdown plus the attachments folder", () => {
  assert.equal(isIncluded("Note.md", "attachments"), true);
  assert.equal(isIncluded("folder/Note.MD", "attachments"), true);
  assert.equal(isIncluded("picture.png", "attachments"), false);
  assert.equal(isIncluded("attachments/picture.png", "attachments"), true);
  assert.equal(isIncluded("Attachments/sub/picture.png", "attachments"), true);
  assert.equal(isIncluded("attachments-extra/picture.png", "attachments"), false);
  assert.equal(isIncluded(".obsidian/app.json", "attachments"), false);
  assert.equal(isIncluded("notes/.hidden.md", "attachments"), false);
  assert.equal(isIncluded("attachments/.DS_Store", "attachments"), false);
});

test("scope includes CSS snippets under .obsidian/snippets", () => {
  assert.equal(isIncluded(".obsidian/snippets/wide.css", "attachments"), true);
  assert.equal(isIncluded(".Obsidian/Snippets/theme.css", "attachments"), true);
  assert.equal(isIncluded(".obsidian/snippets/sub/extra.css", "attachments"), true);
  assert.equal(isIncluded(".obsidian/snippets/.hidden.css", "attachments"), false);
  assert.equal(isIncluded(".obsidian/snippets", "attachments"), false);
  assert.equal(isIncluded(".obsidian/community-plugins.json", "attachments"), false);
  assert.equal(isIncluded(".obsidian/plugins/foo/main.js", "attachments"), false);
});

test("attachments folder must be inside the vault", () => {
  assert.equal(normalizeAttachmentsFolder("attachments"), "attachments");
  assert.equal(normalizeAttachmentsFolder("./meta/attachments/"), "meta/attachments");
  assert.throws(() => normalizeAttachmentsFolder("./"));
  assert.throws(() => normalizeAttachmentsFolder(".hidden"));
});

test("dropbox headers escape non-ascii", () => {
  assert.equal(headerJson({ path: "/Vault/café.md" }), '{"path":"/Vault/caf\\u00e9.md"}');
});
