import { normalizePath, type Vault } from "obsidian";
import {
  backupFileName,
  gzipEntries,
  isInBackupFolder,
  normalizeBackupFolder,
  normalizeBackupKeepLast,
  oldBackupFiles,
  zipEntries,
  type ArchiveFile,
  type ArchiveFolder,
  type BackupFormat,
} from "./archive";

export class BackupCancelled extends Error {
  constructor() {
    super("Backup stopped.");
    this.name = "BackupCancelled";
  }
}

export async function createBackup(options: {
  vault: Vault;
  vaultName: string;
  format: BackupFormat;
  folder: string;
  keepLast: number;
  now: Date;
  cancelled: () => boolean;
  update: (text: string) => void;
}): Promise<string> {
  const folder = normalizeBackupFolder(options.folder);
  const keepLast = normalizeBackupKeepLast(options.keepLast);
  const items = await listVault(options.vault, folder);
  const files: ArchiveFile[] = [];
  const folders: ArchiveFolder[] = [];
  let index = 0;
  for (const item of items) {
    if (options.cancelled()) throw new BackupCancelled();
    index += 1;
    options.update(`${index} / ${items.length}  ${item.path}`);
    const stat = await options.vault.adapter.stat(item.path);
    const mtimeMs = stat?.mtime ?? options.now.getTime();
    if (item.kind === "folder") {
      folders.push({ path: item.path, mtimeMs });
    } else {
      files.push({
        path: item.path,
        data: new Uint8Array(await options.vault.adapter.readBinary(item.path)),
        mtimeMs,
      });
    }
    await yieldToUi();
  }
  if (options.cancelled()) throw new BackupCancelled();
  options.update("Writing archive…");
  const bytes = options.format === "gzip" ? gzipEntries(files, folders) : zipEntries(files, folders);
  const target = normalizePath(`${folder}/${backupFileName(options.now, options.vaultName, options.format)}`);
  await ensureFolder(options.vault, folder);
  await options.vault.adapter.writeBinary(target, copyBuffer(bytes));
  if (options.cancelled()) throw new BackupCancelled();
  options.update("Removing old backups…");
  const listed = await listPath(options.vault, folder);
  for (const path of oldBackupFiles(listed.files, keepLast)) {
    if (options.cancelled()) throw new BackupCancelled();
    await options.vault.adapter.remove(path);
  }
  return target;
}

async function listVault(vault: Vault, backupFolder: string): Promise<{ path: string; kind: "file" | "folder" }[]> {
  const items: { path: string; kind: "file" | "folder" }[] = [];
  await walk(vault, await listPath(vault, "/"), backupFolder, items);
  return items;
}

async function walk(
  vault: Vault,
  listed: { files: string[]; folders: string[] },
  backupFolder: string,
  items: { path: string; kind: "file" | "folder" }[],
): Promise<void> {
  for (const folder of listed.folders) {
    if (isInBackupFolder(folder, backupFolder)) continue;
    items.push({ path: folder, kind: "folder" });
    await walk(vault, await listPath(vault, folder), backupFolder, items);
  }
  for (const file of listed.files) {
    if (isInBackupFolder(file, backupFolder)) continue;
    items.push({ path: file, kind: "file" });
  }
}

async function listPath(vault: Vault, path: string): Promise<{ files: string[]; folders: string[] }> {
  try {
    return await vault.adapter.list(path || "/");
  } catch (error) {
    if (path === "/") return vault.adapter.list("");
    throw error;
  }
}

async function ensureFolder(vault: Vault, folder: string): Promise<void> {
  const parts = folder.split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    const existing = vault.getAbstractFileByPath(current);
    if (existing) continue;
    try {
      await vault.createFolder(current);
    } catch (error) {
      if (!vault.getAbstractFileByPath(current)) throw error;
    }
  }
}

function copyBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
