import { normalizePath, TFile, type App, type Vault } from "obsidian";
import { formatTimestamp } from "./archive";
import { DropboxClient, DropboxError } from "./dropbox";
import { sha256Hex } from "./hash";
import { conflictBackupPath, isIncluded, normalizeAttachmentsFolder, normalizeDropboxFolder, pathKey, syncVaultFolder, toDropboxPath } from "./paths";
import { planAfterCompare, planManualResolution, planSync, type Presence } from "./plan";
import type { ConflictItem, ConflictKind, FileRecord, RemoteFile, Settings, SyncReport, SyncState } from "./types";

export interface SyncUi {
  cancelled: () => boolean;
  update: (text: string) => void;
}

interface Item {
  key: string;
  local?: TFile;
  remote?: RemoteFile;
  record?: FileRecord;
  recordPath?: string;
}

interface LocalView {
  presence: Presence;
  hash: string;
  bytes?: ArrayBuffer;
  mtime: number;
  size: number;
}

export function summarize(report: SyncReport): string {
  const base = report.cancelled ? "Sync stopped. " : "";
  if (!report.cancelled && report.uploaded === 0 && report.downloaded === 0 && report.conflicts === 0 && report.failed.length === 0) {
    return "Already in sync.";
  }
  const text = `${base}Uploaded ${report.uploaded}, downloaded ${report.downloaded}, conflicts ${report.conflicts}.`;
  if (report.failed.length === 0) return text;
  return `${text} ${report.failed.slice(0, 3).join(" ")}`;
}

export class SyncEngine {
  constructor(
    private readonly app: App,
    private readonly settings: Settings,
    private readonly state: SyncState,
    private readonly persist: () => Promise<void>,
    private readonly client: DropboxClient,
  ) {}

  readConflictBytes = async (relativePath: string): Promise<{ local: ArrayBuffer | null; remote: ArrayBuffer | null }> => {
    const normalized = normalizePath(relativePath);
    const file = this.app.vault.getAbstractFileByPath(normalized);
    const local = file instanceof TFile ? await this.app.vault.readBinary(file) : null;
    const folder = syncVaultFolder(normalizeDropboxFolder(this.settings.dropboxFolder), this.app.vault.getName());
    const meta = await this.client.metadata(toDropboxPath(folder, normalized));
    if (!meta) return { local, remote: null };
    const downloaded = await this.client.download(meta.pathDisplay);
    return { local, remote: downloaded.bytes };
  };

  saveResolution = async (relativePath: string, resolved: ArrayBuffer, now: Date): Promise<string[]> => {
    const sides = await this.readConflictBytes(relativePath);
    const folder = syncVaultFolder(normalizeDropboxFolder(this.settings.dropboxFolder), this.app.vault.getName());
    const stamp = formatTimestamp(now);
    const backups: string[] = [];
    if (sides.local) backups.push(await this.writeBoth(folder, conflictBackupPath(relativePath, stamp, "local"), sides.local));
    if (sides.remote) backups.push(await this.writeBoth(folder, conflictBackupPath(relativePath, stamp, "dropbox"), sides.remote));
    await this.writeBoth(folder, relativePath, resolved);
    this.state.conflicts = this.state.conflicts.filter((item) => pathKey(item.path) !== pathKey(relativePath));
    await this.persist();
    return backups;
  };

  sync = async (ui: SyncUi): Promise<SyncReport> => {
    const report: SyncReport = { uploaded: 0, downloaded: 0, conflicts: 0, failed: [], cancelled: false };
    const nextConflicts: ConflictItem[] = [];
    const seen = new Set<string>();
    let listed = false;
    let items: Item[] = [];
    const previous = new Map(this.state.conflicts.map((conflict) => [pathKey(conflict.path), conflict]));
    try {
      if (!this.settings.refreshToken) throw new Error("Connect Dropbox in Vault Anovem Sync settings.");
      const root = normalizeDropboxFolder(this.settings.dropboxFolder);
      const folder = syncVaultFolder(root, this.app.vault.getName());
      const attachments = normalizeAttachmentsFolder(this.settings.attachmentsFolder);
      this.settings.dropboxFolder = root;
      this.settings.attachmentsFolder = attachments;
      ui.update("Reading Dropbox…");
      await yieldToUi();
      const remote = await this.client.listFiles(folder);
      listed = true;
      items = this.collect(attachments, remote.files);
      let index = 0;
      for (const item of items) {
        if (ui.cancelled()) {
          report.cancelled = true;
          break;
        }
        index += 1;
        const label = itemPath(item);
        ui.update(`${index} / ${items.length}  ${label}`);
        seen.add(item.key);
        try {
          const outcome = await this.apply(item, folder, previous.get(item.key));
          if (outcome.type === "upload") report.uploaded += 1;
          if (outcome.type === "download") report.downloaded += 1;
          if (outcome.type === "conflict") {
            nextConflicts.push({
              path: itemPath(item),
              kind: outcome.kind,
              localHash: outcome.localHash,
              remoteRev: outcome.remoteRev,
            });
          }
        } catch (error) {
          if (error instanceof DropboxError && error.message === "missing") {
            if (item.local) nextConflicts.push({ path: item.local.path, kind: "deleted-remote" });
            else this.deleteRecord(item.key);
          } else {
            report.failed.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
        await yieldToUi();
      }
      return report;
    } finally {
      if (listed) {
        const itemKeys = new Set(items.map((item) => item.key));
        for (const [key, conflict] of previous) {
          if (!seen.has(key) && itemKeys.has(key)) nextConflicts.push(conflict);
        }
        const byKey = new Map<string, ConflictItem>();
        for (const conflict of nextConflicts) byKey.set(pathKey(conflict.path), conflict);
        this.state.conflicts = [...byKey.values()];
        report.conflicts = this.state.conflicts.length;
      }
      await this.persist();
    }
  };

  private collect = (attachments: string, remoteFiles: RemoteFile[]): Item[] => {
    const map = new Map<string, Item>();
    const slot = (relativePath: string): Item => {
      const key = pathKey(relativePath);
      let item = map.get(key);
      if (!item) {
        item = { key };
        map.set(key, item);
      }
      return item;
    };
    for (const file of this.app.vault.getFiles()) {
      if (!isIncluded(file.path, attachments)) continue;
      slot(file.path).local = file;
    }
    for (const remote of remoteFiles) {
      if (!isIncluded(remote.relativePath, attachments)) continue;
      slot(remote.relativePath).remote = remote;
    }
    for (const [recordPath, record] of Object.entries(this.state.files)) {
      const item = slot(recordPath);
      item.record = record;
      item.recordPath = recordPath;
    }
    return [...map.values()].sort((a, b) => itemPath(a).localeCompare(itemPath(b)));
  };

  private apply = async (item: Item, folder: string, existing?: ConflictItem): Promise<Outcome> => {
    const local = await inspectLocal(item.local, item.record);
    const localHash = item.local ? local.hash : null;
    const remoteRev = item.remote?.rev ?? null;
    if (hasSnapshot(existing)) return this.applyManual(item, folder, existing, local, localHash, remoteRev);
    return this.applyFresh(item, folder, local, localHash, remoteRev);
  };

  private applyManual = async (
    item: Item,
    folder: string,
    existing: ConflictItem,
    local: LocalView,
    localHash: string | null,
    remoteRev: string | null,
  ): Promise<Outcome> => {
    let action = planManualResolution(
      { localHash: existing.localHash ?? null, remoteRev: existing.remoteRev ?? null },
      localHash,
      remoteRev,
    );
    if (action === "compare" && item.remote && item.local) {
      const downloaded = await this.client.download(item.remote.dropboxPath);
      const remoteHash = await sha256Hex(downloaded.bytes);
      if (remoteHash === local.hash) {
        this.putRecord(item.local.path, {
          hash: local.hash,
          size: local.size,
          mtime: local.mtime,
          dropboxRev: downloaded.rev || item.remote.rev,
        }, item.recordPath);
        return { type: "none" };
      }
      action = "hold";
    } else if (action === "compare") {
      action = "hold";
    }
    if (action === "forget") {
      this.deleteRecord(item.key);
      return { type: "none" };
    }
    if (action === "hold") return conflictOutcome(localHash, remoteRev);
    if (action === "download") return this.downloadRemote(item, local, localHash, remoteRev);
    return this.uploadLocal(item, folder, local, localHash, remoteRev);
  };

  private applyFresh = async (
    item: Item,
    folder: string,
    local: LocalView,
    localHash: string | null,
    remoteRev: string | null,
  ): Promise<Outcome> => {
    const remote: Presence = !item.remote ? "absent" : !item.record ? "untracked" : item.remote.rev === item.record.dropboxRev ? "unchanged" : "changed";
    let action = planSync(local.presence, remote);
    if (action.action === "compare") {
      if (!item.remote || !item.local) return conflictOutcome(localHash, remoteRev);
      const downloaded = await this.client.download(item.remote.dropboxPath);
      const remoteHash = await sha256Hex(downloaded.bytes);
      action = planAfterCompare(remoteHash === local.hash);
      if (action.action === "adopt") {
        this.putRecord(item.local.path, {
          hash: local.hash,
          size: local.size,
          mtime: local.mtime,
          dropboxRev: downloaded.rev || item.remote.rev,
        }, item.recordPath);
      }
    }
    if (action.action === "skip" || action.action === "adopt") return { type: "none" };
    if (action.action === "forget") {
      this.deleteRecord(item.key);
      return { type: "none" };
    }
    if (action.action === "conflict") return conflictOutcome(localHash, remoteRev);
    if (action.action === "download") return this.downloadRemote(item, local, localHash, remoteRev);
    if (action.action !== "upload") return { type: "none" };
    return this.uploadLocal(item, folder, local, localHash, remoteRev);
  };

  private downloadRemote = async (
    item: Item,
    local: LocalView,
    localHash: string | null,
    remoteRev: string | null,
  ): Promise<Outcome> => {
    if (!item.remote) return conflictOutcome(localHash, remoteRev);
    const downloaded = await this.client.download(item.remote.dropboxPath);
    const remoteHash = await sha256Hex(downloaded.bytes);
    const canonical = item.local?.path ?? item.remote.relativePath;
    if (item.local && remoteHash === local.hash) {
      this.putRecord(canonical, {
        hash: local.hash,
        size: local.size,
        mtime: local.mtime,
        dropboxRev: downloaded.rev || item.remote.rev,
      }, item.recordPath);
      return { type: "none" };
    }
    await writeLocal(this.app.vault, canonical, downloaded.bytes);
    await this.rememberWritten(canonical, downloaded.rev || item.remote.rev, downloaded.bytes);
    return { type: "download" };
  };

  private uploadLocal = async (
    item: Item,
    folder: string,
    local: LocalView,
    localHash: string | null,
    remoteRev: string | null,
  ): Promise<Outcome> => {
    if (!item.local) return conflictOutcome(localHash, remoteRev);
    const bytes = local.bytes ?? await this.app.vault.readBinary(item.local);
    const apiPath = item.remote?.dropboxPath ?? toDropboxPath(folder, item.local.path);
    const mode = item.remote ? { update: item.remote.rev } : "add" as const;
    const uploaded = await this.client.upload(apiPath, bytes, mode);
    const hash = local.hash || await sha256Hex(bytes);
    if (uploaded.conflict) {
      if (mode === "add") {
        const downloaded = await this.client.download(apiPath);
        const remoteHash = await sha256Hex(downloaded.bytes);
        if (remoteHash === hash) {
          this.putRecord(item.local.path, {
            hash,
            size: bytes.byteLength,
            mtime: stableMtime(this.app, item.local.path, local.mtime, bytes.byteLength),
            dropboxRev: downloaded.rev,
          }, item.recordPath);
          return { type: "none" };
        }
        return conflictOutcome(hash, downloaded.rev || remoteRev);
      }
      const found = await this.client.metadata(apiPath);
      return conflictOutcome(hash, found?.rev ?? remoteRev);
    }
    this.putRecord(item.local.path, {
      hash,
      size: bytes.byteLength,
      mtime: stableMtime(this.app, item.local.path, local.mtime, bytes.byteLength),
      dropboxRev: uploaded.rev,
    }, item.recordPath);
    return { type: "upload" };
  };

  private writeBoth = async (folder: string, relativePath: string, bytes: ArrayBuffer): Promise<string> => {
    const normalized = normalizePath(relativePath);
    await writeLocal(this.app.vault, normalized, bytes);
    const uploaded = await this.client.upload(toDropboxPath(folder, normalized), bytes, "overwrite");
    if (uploaded.conflict) throw new Error(`Dropbox rejected ${normalized}.`);
    await this.rememberWritten(normalized, uploaded.rev, bytes);
    return normalized;
  };

  private rememberWritten = async (path: string, rev: string, bytes: ArrayBuffer): Promise<void> => {
    const writtenHash = await sha256Hex(bytes);
    const file = this.app.vault.getAbstractFileByPath(normalizePath(path));
    if (!(file instanceof TFile)) {
      this.putRecord(path, { hash: writtenHash, size: bytes.byteLength, mtime: 0, dropboxRev: rev });
      return;
    }
    const mtime = file.stat.mtime;
    const check = await sha256Hex(await this.app.vault.readBinary(file));
    const again = this.app.vault.getAbstractFileByPath(file.path);
    const stable = check === writtenHash && again instanceof TFile && again.stat.mtime === mtime;
    this.putRecord(file.path, {
      hash: writtenHash,
      size: bytes.byteLength,
      mtime: stable ? mtime : 0,
      dropboxRev: rev,
    });
  };

  private putRecord = (canonical: string, record: FileRecord, previousPath?: string): void => {
    const key = pathKey(canonical);
    for (const existing of Object.keys(this.state.files)) {
      if (existing !== canonical && pathKey(existing) === key) delete this.state.files[existing];
    }
    if (previousPath && previousPath !== canonical) delete this.state.files[previousPath];
    this.state.files[canonical] = record;
  };

  private deleteRecord = (key: string): void => {
    for (const existing of Object.keys(this.state.files)) {
      if (pathKey(existing) === key) delete this.state.files[existing];
    }
  };
}

async function inspectLocal(file: TFile | undefined, record: FileRecord | undefined): Promise<LocalView> {
  if (!file) return { presence: "absent", hash: "", mtime: 0, size: 0 };
  const mtime = file.stat.mtime;
  const size = file.stat.size;
  if (record && record.mtime !== 0 && record.mtime === mtime && record.size === size) {
    return { presence: "unchanged", hash: record.hash, mtime, size };
  }
  const bytes = await file.vault.readBinary(file);
  const hash = await sha256Hex(bytes);
  if (!record) return { presence: "untracked", hash, bytes, mtime, size };
  if (hash === record.hash) {
    record.mtime = mtime;
    record.size = size;
    return { presence: "unchanged", hash, bytes, mtime, size };
  }
  return { presence: "changed", hash, bytes, mtime, size };
}

function stableMtime(app: App, path: string, mtime: number, size: number): number {
  const after = app.vault.getAbstractFileByPath(normalizePath(path));
  if (after instanceof TFile && after.stat.mtime === mtime && after.stat.size === size) return mtime;
  return 0;
}

async function writeLocal(vault: Vault, path: string, bytes: ArrayBuffer): Promise<void> {
  const normalized = normalizePath(path);
  const existing = vault.getAbstractFileByPath(normalized);
  if (existing instanceof TFile) {
    await vault.modifyBinary(existing, bytes);
    return;
  }
  if (existing) throw new Error(`${normalized} is not a file.`);
  await ensureFolder(vault, normalized);
  await vault.createBinary(normalized, bytes);
}

async function ensureFolder(vault: Vault, filePath: string): Promise<void> {
  const slash = filePath.lastIndexOf("/");
  if (slash <= 0) return;
  const parts = filePath.slice(0, slash).split("/");
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    const existing = vault.getAbstractFileByPath(current);
    if (existing instanceof TFile) throw new Error(`${current} is a file, so ${filePath} cannot be saved.`);
    if (existing) continue;
    try {
      await vault.createFolder(current);
    } catch (error) {
      if (!vault.getAbstractFileByPath(current)) throw error;
    }
  }
}

function itemPath(item: Item): string {
  return item.local?.path ?? item.remote?.relativePath ?? item.recordPath ?? item.key;
}

function hasSnapshot(conflict: ConflictItem | undefined): conflict is ConflictItem {
  return !!conflict && "localHash" in conflict && "remoteRev" in conflict;
}

function conflictOutcome(localHash: string | null, remoteRev: string | null): Outcome {
  const kind: ConflictKind = localHash === null ? "deleted-local" : remoteRev === null ? "deleted-remote" : "both-changed";
  return { type: "conflict", kind, localHash, remoteRev };
}

type Outcome =
  | { type: "upload" | "download" | "none" }
  | { type: "conflict"; kind: ConflictKind; localHash: string | null; remoteRev: string | null };

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
