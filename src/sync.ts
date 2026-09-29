import { normalizePath, TFile, type App, type Vault } from "obsidian";
import { DropboxClient, DropboxError } from "./dropbox";
import { sha256Hex } from "./hash";
import { decodeUtf8, mergeWords } from "./merge";
import { isIncluded, normalizeAttachmentsFolder, normalizeDropboxFolder, pathKey, syncVaultFolder, toDropboxPath } from "./paths";
import { planAfterCompare, planManualResolution, planRename, planSync, type Presence } from "./plan";
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

export interface PlanLine {
  path: string;
  action: "upload" | "download" | "merge" | "rename" | "trash" | "conflict";
  note: string;
}

export function summarize(report: SyncReport): string {
  const base = report.cancelled ? "Sync stopped. " : "";
  const quiet = report.uploaded === 0 && report.downloaded === 0 && report.merged === 0 && report.renamed === 0 && report.trashed === 0 && report.conflicts === 0 && report.failed.length === 0;
  if (!report.cancelled && quiet) return "Already in sync.";
  let text = `${base}Uploaded ${report.uploaded}, downloaded ${report.downloaded}, merged ${report.merged}, renamed ${report.renamed}, trashed ${report.trashed}, conflicts ${report.conflicts}.`;
  if (report.overlaps.length > 0) {
    text += ` Kept this device where the same words changed: ${report.overlaps.slice(0, 3).join(", ")}.`;
  }
  if (report.failed.length === 0) return text;
  return `${text} ${report.failed.slice(0, 3).join(" ")}`;
}

function emptyReport(): SyncReport {
  return { uploaded: 0, downloaded: 0, merged: 0, renamed: 0, trashed: 0, overlaps: [], conflicts: 0, failed: [], cancelled: false };
}

export class SyncEngine {
  private remotes = new Map<string, RemoteFile>();
  private pendingRenames = new Map<string, { fromKey: string; fromPath: string; record: FileRecord }>();
  private renamedAway = new Set<string>();
  private initialSync = false;
  private mergeMode = false;

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

  saveResolution = async (relativePath: string, resolved: ArrayBuffer): Promise<void> => {
    const folder = syncVaultFolder(normalizeDropboxFolder(this.settings.dropboxFolder), this.app.vault.getName());
    await this.writeBoth(folder, relativePath, resolved);
    this.state.conflicts = this.state.conflicts.filter((item) => pathKey(item.path) !== pathKey(relativePath));
    await this.persist();
  };

  sync = async (ui: SyncUi): Promise<SyncReport> => {
    const result = await this.run(ui, true);
    return result.report;
  };

  preview = async (ui: SyncUi): Promise<PlanLine[]> => {
    const result = await this.run(ui, false);
    return result.lines;
  };

  private run = async (ui: SyncUi, write: boolean): Promise<{ report: SyncReport; lines: PlanLine[] }> => {
    const report = emptyReport();
    const lines: PlanLine[] = [];
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
      this.mergeMode = this.settings.conflictMode === "merge";
      this.initialSync = this.mergeMode && Object.keys(this.state.files).length === 0;
      ui.update("Reading Dropbox…");
      await yieldToUi();
      const remote = await this.client.listFiles(folder);
      listed = true;
      items = this.collect(attachments, remote.files);
      await this.indexRenames(items, ui);
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
          const outcome = await this.apply(item, folder, previous.get(item.key), write);
          this.count(report, lines, label, outcome);
          if (write && outcome.type === "conflict") {
            nextConflicts.push({
              path: label,
              kind: outcome.kind,
              localHash: outcome.localHash,
              remoteRev: outcome.remoteRev,
            });
          }
        } catch (error) {
          if (error instanceof DropboxError && error.message === "missing") {
            if (item.local) {
              const conflict = conflictOutcome(await this.localHash(item), null);
              this.count(report, lines, label, conflict);
              if (write) nextConflicts.push({ path: item.local.path, kind: "deleted-remote", localHash: conflict.localHash, remoteRev: null });
            } else if (write) this.deleteRecord(item.key);
          } else {
            report.failed.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
        await yieldToUi();
      }
      return { report, lines };
    } finally {
      if (write && listed) {
        const itemKeys = new Set(items.map((item) => item.key));
        for (const [key, conflict] of previous) {
          if (!seen.has(key) && itemKeys.has(key)) nextConflicts.push(conflict);
        }
        const byKey = new Map<string, ConflictItem>();
        for (const conflict of nextConflicts) byKey.set(pathKey(conflict.path), conflict);
        this.state.conflicts = [...byKey.values()];
        report.conflicts = this.state.conflicts.length;
      }
      if (write) await this.persist();
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
    this.remotes.clear();
    for (const remote of remoteFiles) {
      if (!isIncluded(remote.relativePath, attachments)) continue;
      slot(remote.relativePath).remote = remote;
      this.remotes.set(pathKey(remote.relativePath), remote);
    }
    for (const [recordPath, record] of Object.entries(this.state.files)) {
      const item = slot(recordPath);
      item.record = record;
      item.recordPath = recordPath;
    }
    return [...map.values()].sort((a, b) => itemPath(a).localeCompare(itemPath(b)));
  };

  private apply = async (item: Item, folder: string, existing: ConflictItem | undefined, write: boolean): Promise<Outcome> => {
    const local = await inspectLocal(item.local, item.record);
    const localHash = item.local ? local.hash : null;
    const remoteRev = item.remote?.rev ?? null;
    const classified = hasSnapshot(existing)
      ? await this.classifyManual(item, existing, local, localHash, remoteRev)
      : await this.classifyFresh(item, local, localHash, remoteRev);
    if (!write) return classified;
    return this.execute(item, folder, local, classified);
  };

  private classifyManual = async (
    item: Item,
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
        return {
          type: "adopt",
          path: item.local.path,
          bytes: downloaded.bytes,
          record: {
            hash: local.hash,
            size: local.size,
            mtime: local.mtime,
            dropboxRev: downloaded.rev || item.remote.rev,
          },
        };
      }
      action = "hold";
    } else if (action === "compare") {
      action = "hold";
    }
    if (action === "forget") return { type: "forget" };
    if (action === "hold") return conflictOutcome(localHash, remoteRev);
    if (action === "download") return { type: "download" };
    return { type: "upload" };
  };

  private classifyFresh = async (
    item: Item,
    local: LocalView,
    localHash: string | null,
    remoteRev: string | null,
  ): Promise<Outcome> => {
    if (this.renamedAway.has(item.key) && !item.local) return { type: "forget" };
    const rename = this.pendingRenames.get(item.key);
    if (rename && item.local) return { type: "rename", fromPath: rename.fromPath, fromKey: rename.fromKey, record: rename.record };
    const remote: Presence = !item.remote ? "absent" : !item.record ? "untracked" : item.remote.rev === item.record.dropboxRev ? "unchanged" : "changed";
    let action = planSync(local.presence, remote, this.mergeMode ? "merge" : "review", this.initialSync);
    if (action.action === "compare") {
      if (!item.remote || !item.local) return conflictOutcome(localHash, remoteRev);
      const downloaded = await this.client.download(item.remote.dropboxPath);
      const remoteHash = await sha256Hex(downloaded.bytes);
      action = planAfterCompare(remoteHash === local.hash);
      if (action.action === "adopt") {
        return {
          type: "adopt",
          path: item.local.path,
          bytes: local.bytes ?? downloaded.bytes,
          record: {
            hash: local.hash,
            size: local.size,
            mtime: local.mtime,
            dropboxRev: downloaded.rev || item.remote.rev,
          },
        };
      }
    }
    if (action.action === "skip") return this.mergeMode && item.local ? { type: "backfill", path: item.local.path } : { type: "none" };
    if (action.action === "forget") return { type: "forget" };
    if (action.action === "conflict") return conflictOutcome(localHash, remoteRev);
    if (action.action === "download") return { type: "download" };
    if (action.action === "upload") return { type: "upload" };
    if (action.action === "trash-local") return { type: "trash-local" };
    if (action.action === "trash-remote") return { type: "trash-remote" };
    if (action.action === "merge") return this.classifyMerge(item, local, localHash, remoteRev);
    return { type: "none" };
  };

  private classifyMerge = async (
    item: Item,
    local: LocalView,
    localHash: string | null,
    remoteRev: string | null,
  ): Promise<Outcome> => {
    if (!item.local || !item.remote) return conflictOutcome(localHash, remoteRev);
    const downloaded = await this.client.download(item.remote.dropboxPath);
    const remoteHash = await sha256Hex(downloaded.bytes);
    if (remoteHash === local.hash) {
      return {
        type: "adopt",
        path: item.local.path,
        bytes: local.bytes ?? downloaded.bytes,
        record: {
          hash: local.hash,
          size: local.size,
          mtime: local.mtime,
          dropboxRev: downloaded.rev || item.remote.rev,
        },
      };
    }
    const localBytes = local.bytes ?? await this.app.vault.readBinary(item.local);
    const localText = decodeUtf8(localBytes);
    const remoteText = decodeUtf8(downloaded.bytes);
    const baseBytes = await this.readBase(item.recordPath ?? item.local.path);
    const baseText = baseBytes ? decodeUtf8(baseBytes) : null;
    if (localText === null || remoteText === null || baseText === null) return conflictOutcome(localHash, remoteRev);
    const merged = mergeWords(baseText, localText, remoteText);
    const encoded = new TextEncoder().encode(merged.text);
    return {
      type: "merge",
      overlap: merged.overlap,
      path: item.local.path,
      bytes: encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength),
    };
  };

  private execute = async (item: Item, folder: string, local: LocalView, classified: Outcome): Promise<Outcome> => {
    if (classified.type === "backfill") {
      try {
        if (!(await this.readBase(classified.path))) {
          const file = this.app.vault.getAbstractFileByPath(normalizePath(classified.path));
          if (file instanceof TFile) await this.saveBase(classified.path, await this.app.vault.readBinary(file));
        }
      } catch {
        // A missing base falls back to review on the next overlap.
      }
      return { type: "none" };
    }
    if (classified.type === "forget") {
      this.deleteRecord(item.key);
      return { type: "none" };
    }
    if (classified.type === "adopt") {
      await this.agree(classified.path, classified.record, item.recordPath, classified.bytes);
      return { type: "none" };
    }
    if (classified.type === "download") return this.downloadRemote(item, local, item.local ? local.hash : null, item.remote?.rev ?? null);
    if (classified.type === "upload") return this.uploadLocal(item, folder, local, item.local ? local.hash : null, item.remote?.rev ?? null);
    if (classified.type === "trash-local") return this.trashLocal(item);
    if (classified.type === "trash-remote") return this.trashRemote(item);
    if (classified.type === "merge") {
      await this.writeBoth(folder, classified.path, classified.bytes);
      return classified;
    }
    if (classified.type === "rename") return this.rename(item, folder, local, classified);
    return classified;
  };

  private rename = async (
    item: Item,
    folder: string,
    local: LocalView,
    classified: Extract<Outcome, { type: "rename" }>,
  ): Promise<Outcome> => {
    const oldRemote = this.remotes.get(classified.fromKey);
    if (!oldRemote || !item.local) return conflictOutcome(local.hash, null);
    const moved = await this.client.move(oldRemote.dropboxPath, toDropboxPath(folder, item.local.path));
    await this.agree(item.local.path, {
      hash: classified.record.hash,
      size: local.size,
      mtime: local.mtime,
      dropboxRev: moved.rev,
    }, classified.fromPath, local.bytes ?? await this.app.vault.readBinary(item.local));
    await this.removeBase(classified.fromPath);
    return { type: "rename", fromPath: classified.fromPath, fromKey: classified.fromKey, record: classified.record };
  };

  private trashLocal = async (item: Item): Promise<Outcome> => {
    if (!item.local) return { type: "none" };
    await trashVaultFile(this.app, item.local);
    this.deleteRecord(item.key);
    return { type: "trash-local" };
  };

  private trashRemote = async (item: Item): Promise<Outcome> => {
    if (!item.remote) return { type: "none" };
    await this.client.delete(item.remote.dropboxPath);
    this.deleteRecord(item.key);
    return { type: "trash-remote" };
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
      await this.agree(canonical, {
        hash: local.hash,
        size: local.size,
        mtime: local.mtime,
        dropboxRev: downloaded.rev || item.remote.rev,
      }, item.recordPath, downloaded.bytes);
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
          await this.agree(item.local.path, {
            hash,
            size: bytes.byteLength,
            mtime: stableMtime(this.app, item.local.path, local.mtime, bytes.byteLength),
            dropboxRev: downloaded.rev,
          }, item.recordPath, bytes);
          return { type: "none" };
        }
        return conflictOutcome(hash, downloaded.rev || remoteRev);
      }
      const found = await this.client.metadata(apiPath);
      return conflictOutcome(hash, found?.rev ?? remoteRev);
    }
    await this.agree(item.local.path, {
      hash,
      size: bytes.byteLength,
      mtime: stableMtime(this.app, item.local.path, local.mtime, bytes.byteLength),
      dropboxRev: uploaded.rev,
    }, item.recordPath, bytes);
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
      await this.saveBase(path, bytes);
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
    await this.saveBase(file.path, bytes);
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
      if (pathKey(existing) !== key) continue;
      void this.removeBase(existing);
      delete this.state.files[existing];
    }
  };

  private agree = async (path: string, record: FileRecord, previous: string | undefined, bytes: ArrayBuffer): Promise<void> => {
    this.putRecord(path, record, previous);
    await this.saveBase(path, bytes);
  };

  private count = (report: SyncReport, lines: PlanLine[], label: string, outcome: Outcome): void => {
    if (outcome.type === "upload") {
      report.uploaded += 1;
      lines.push({ path: label, action: "upload", note: "Send this copy to Dropbox." });
    } else if (outcome.type === "download") {
      report.downloaded += 1;
      lines.push({ path: label, action: "download", note: "Save the Dropbox copy here." });
    } else if (outcome.type === "merge") {
      report.merged += 1;
      if (outcome.overlap) report.overlaps.push(outcome.path);
      lines.push({
        path: label,
        action: "merge",
        note: outcome.overlap ? "Same words changed. This device is kept there." : "Changes from both sides combine.",
      });
    } else if (outcome.type === "rename") {
      report.renamed += 1;
      lines.push({ path: label, action: "rename", note: `Dropbox path moves from ${outcome.fromPath}.` });
    } else if (outcome.type === "trash-local") {
      report.trashed += 1;
      lines.push({ path: label, action: "trash", note: "Removed in Dropbox. This copy goes to the trash." });
    } else if (outcome.type === "trash-remote") {
      report.trashed += 1;
      lines.push({ path: label, action: "trash", note: "Removed here. The Dropbox copy goes to the trash." });
    } else if (outcome.type === "conflict") {
      lines.push({ path: label, action: "conflict", note: "Needs a review." });
    }
  };

  private indexRenames = async (items: Item[], ui: SyncUi): Promise<void> => {
    this.pendingRenames.clear();
    this.renamedAway.clear();
    if (!this.mergeMode || this.initialSync) return;
    const orphans = items.filter((item) => !item.local && item.record && item.recordPath);
    const used = new Set<string>();
    for (const item of items) {
      if (ui.cancelled()) return;
      if (!item.local || item.record || item.remote) continue;
      const local = await inspectLocal(item.local, undefined);
      const matches = orphans.filter((orphan) => !used.has(orphan.key) && orphan.record?.hash === local.hash);
      const remote = matches.length === 1 ? this.remotes.get(matches[0].key) : undefined;
      const unchanged = !!remote && remote.rev === matches[0].record?.dropboxRev;
      if (!matches[0]?.record || !matches[0].recordPath || !planRename(matches.length, unchanged, false)) continue;
      used.add(matches[0].key);
      this.pendingRenames.set(item.key, { fromKey: matches[0].key, fromPath: matches[0].recordPath, record: matches[0].record });
      this.renamedAway.add(matches[0].key);
    }
  };

  private localHash = async (item: Item): Promise<string | null> => {
    if (!item.local) return null;
    const local = await inspectLocal(item.local, item.record);
    return local.hash;
  };

  private baseFolder = (): string => {
    return normalizePath(`${this.app.vault.configDir}/plugins/vault-anovem-sync/bases`);
  };

  private baseFile = async (relativePath: string): Promise<string> => {
    const encoded = new TextEncoder().encode(pathKey(relativePath));
    const name = await sha256Hex(encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength));
    return `${this.baseFolder()}/${name}`;
  };

  private readBase = async (relativePath: string): Promise<ArrayBuffer | null> => {
    const path = await this.baseFile(relativePath);
    if (!(await this.app.vault.adapter.exists(path))) return null;
    return this.app.vault.adapter.readBinary(path);
  };

  private saveBase = async (relativePath: string, bytes: ArrayBuffer): Promise<void> => {
    try {
      const folder = this.baseFolder();
      if (!(await this.app.vault.adapter.exists(folder))) await this.app.vault.adapter.mkdir(folder);
      await this.app.vault.adapter.writeBinary(await this.baseFile(relativePath), bytes);
    } catch {
      // A missing base falls back to review on the next overlap.
    }
  };

  private removeBase = async (relativePath: string): Promise<void> => {
    try {
      const path = await this.baseFile(relativePath);
      if (await this.app.vault.adapter.exists(path)) await this.app.vault.adapter.remove(path);
    } catch {
      // A leftover base is unused once its record is gone.
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

function conflictOutcome(localHash: string | null, remoteRev: string | null): Extract<Outcome, { type: "conflict" }> {
  const kind: ConflictKind = localHash === null ? "deleted-local" : remoteRev === null ? "deleted-remote" : "both-changed";
  return { type: "conflict", kind, localHash, remoteRev };
}

type Outcome =
  | { type: "upload" | "download" | "forget" | "none" }
  | { type: "backfill"; path: string }
  | { type: "trash-local" | "trash-remote" }
  | { type: "adopt"; path: string; record: FileRecord; bytes: ArrayBuffer }
  | { type: "merge"; overlap: boolean; path: string; bytes: ArrayBuffer }
  | { type: "rename"; fromPath: string; fromKey: string; record: FileRecord }
  | { type: "conflict"; kind: ConflictKind; localHash: string | null; remoteRev: string | null };

async function trashVaultFile(app: App, file: TFile): Promise<void> {
  const manager = app.fileManager as { trashFile?: (target: TFile) => Promise<void> };
  if (typeof manager.trashFile === "function") {
    await manager.trashFile.call(app.fileManager, file);
    return;
  }
  await app.vault.trash(file, false);
}

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
