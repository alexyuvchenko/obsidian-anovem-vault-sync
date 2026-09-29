import { addIcon, MarkdownView, Notice, Platform, Plugin, requestUrl } from "obsidian";
import { normalizeBackupFolder, type BackupFormat } from "./archive";
import { BackupCancelled, createBackup } from "./backup";
import { DropboxClient } from "./dropbox";
import { errorMessage } from "./errors";
import { ConflictModal, ConflictResolveModal, SyncPlanModal, SyncProgressModal } from "./modals";
import { pathKey } from "./paths";
import { PLUGIN_FILES, RELEASE_REPO, parseLatestRelease } from "./release";
import { VaultSyncSettingTab } from "./settings";
import { summarize, SyncEngine } from "./sync";
import { DEFAULT_SETTINGS, emptyState, type PluginData, type Settings, type SyncState } from "./types";
import { configuredAttachmentFolder } from "./vault-config";

const SYNC_ICON = "vault-anovem-sync";

addIcon(
  SYNC_ICON,
  `<g fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 50h64"/><path d="M18 50 32 36"/><path d="M18 50 32 64"/><path d="M82 50 68 36"/><path d="M82 50 68 64"/></g>`,
);

export default class VaultSyncPlugin extends Plugin {
  settings: Settings = DEFAULT_SETTINGS;
  state: SyncState = emptyState();
  client!: DropboxClient;
  engine!: SyncEngine;
  private running = false;
  private statusBar: HTMLElement | null = null;
  private conflictStatus: HTMLElement | null = null;
  private backgroundTimer: number | null = null;
  private lastBackgroundAt = 0;

  async onload(): Promise<void> {
    const data = (await this.loadData()) as Partial<PluginData> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data?.settings);
    this.state = data?.state?.files ? { files: data.state.files, conflicts: data.state.conflicts ?? [] } : emptyState();
    if (!this.settings.attachmentsFolder) {
      const detected = await configuredAttachmentFolder(this.app);
      if (detected) this.settings.attachmentsFolder = detected;
    }
    this.client = new DropboxClient(this.settings, () => this.persist());
    this.engine = new SyncEngine(this.app, this.settings, this.state, () => this.persist(), this.client);
    this.addSettingTab(new VaultSyncSettingTab(this.app, this));
    this.addCommand({
      id: "sync",
      name: "Sync both ways",
      callback: () => {
        void this.syncNow();
      },
    });
    this.addCommand({
      id: "preview-sync",
      name: "Preview sync",
      callback: () => {
        void this.previewNow();
      },
    });
    this.addCommand({
      id: "show-conflicts",
      name: "Show sync conflicts",
      callback: () => this.showConflicts(),
    });
    this.addCommand({
      id: "review-conflict",
      name: "Review sync conflict in the active note",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        const open = !!file && this.state.conflicts.some((conflict) => pathKey(conflict.path) === pathKey(file.path));
        if (checking) return open;
        if (file && open) this.reviewConflict(file.path);
        return open;
      },
    });
    this.addCommand({
      id: "update-plugin",
      name: "Install or update plugin from GitHub",
      callback: () => {
        void this.updateFromGitHub();
      },
    });
    this.addCommand({
      id: "backup",
      name: "Backup vault",
      callback: () => {
        void this.backupNow();
      },
    });
    this.addRibbonIcon(SYNC_ICON, "Sync both ways", () => {
      void this.syncNow();
    });
    this.addRibbonIcon("archive", "Backup vault", () => {
      void this.backupNow();
    });
    if (!Platform.isMobile) {
      this.statusBar = this.addStatusBarItem();
      this.statusBar.setText(this.settings.lastSyncSummary || "Sync");
      this.conflictStatus = this.addStatusBarItem();
      this.conflictStatus.addClass("vault-sync-conflict-status");
      this.conflictStatus.onclick = () => this.showConflicts();
    }
    this.registerEvent(this.app.workspace.on("file-open", () => this.refreshConflictBanner()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.refreshConflictBanner()));
    this.refreshConflictChrome();
    this.scheduleBackgroundSync();
    this.app.workspace.onLayoutReady(() => {
      this.refreshConflictChrome();
      if (this.state.conflicts.length > 0) this.showConflicts();
      const start = window.setTimeout(() => void this.syncNow("background"), 5000);
      this.register(() => window.clearTimeout(start));
    });
    const onVisible = (): void => {
      if (document.visibilityState === "visible") void this.syncNow("background");
    };
    document.addEventListener("visibilitychange", onVisible);
    this.register(() => document.removeEventListener("visibilitychange", onVisible));
    await this.persist();
  }

  scheduleBackgroundSync = (): void => {
    if (this.backgroundTimer !== null) {
      window.clearInterval(this.backgroundTimer);
      this.backgroundTimer = null;
    }
    if (!this.settings.backgroundSync) return;
    const minutes = normalizeSyncMinutes(this.settings.syncIntervalMinutes);
    this.settings.syncIntervalMinutes = minutes;
    this.backgroundTimer = window.setInterval(() => {
      void this.syncNow("background");
    }, minutes * 60 * 1000);
    this.registerInterval(this.backgroundTimer);
  };

  persist = async (): Promise<void> => {
    await this.saveData({ settings: this.settings, state: this.state });
  };

  syncNow = async (source: "manual" | "background" = "manual"): Promise<void> => {
    if (source === "background") {
      if (!this.settings.backgroundSync || !this.settings.refreshToken || this.running) return;
      if (Date.now() - this.lastBackgroundAt < 15000) return;
      this.lastBackgroundAt = Date.now();
    } else if (this.running) {
      new Notice("A sync or backup is already running.");
      return;
    }
    const background = source === "background";
    const conflictsBefore = this.state.conflicts.length;
    this.running = true;
    const modal = background ? null : new SyncProgressModal(this.app);
    modal?.open();
    try {
      const report = await this.engine.sync({
        cancelled: () => modal?.cancelled ?? false,
        update: (text) => {
          modal?.setStatus(text);
          this.statusBar?.setText(text);
        },
      });
      this.settings.lastSyncAt = Date.now();
      this.settings.lastSyncSummary = summarize(report);
      await this.persist();
      this.statusBar?.setText(this.settings.lastSyncSummary);
      modal?.finish();
      const conflictsChanged = this.state.conflicts.length !== conflictsBefore;
      const moved = report.uploaded > 0 || report.downloaded > 0 || report.failed.length > 0 || report.cancelled;
      if (!background || moved || conflictsChanged) new Notice(this.settings.lastSyncSummary);
      this.refreshConflictChrome();
      if (this.state.conflicts.length > 0 && (!background || conflictsChanged)) this.showConflicts();
    } catch (error) {
      modal?.finish();
      const message = errorMessage(error);
      this.settings.lastSyncSummary = message;
      this.statusBar?.setText(message);
      if (!background || this.settings.refreshToken) new Notice(message);
      await this.persist();
    } finally {
      this.running = false;
    }
  };

  previewNow = async (): Promise<void> => {
    if (this.running) {
      new Notice("A sync or backup is already running.");
      return;
    }
    this.running = true;
    const modal = new SyncProgressModal(this.app, "Previewing sync");
    modal.open();
    try {
      const lines = await this.engine.preview({
        cancelled: () => modal.cancelled,
        update: (text) => {
          modal.setStatus(text);
          this.statusBar?.setText(text);
        },
      });
      modal.finish();
      new SyncPlanModal(this.app, lines, () => {
        void this.syncNow();
      }).open();
    } catch (error) {
      modal.finish();
      new Notice(errorMessage(error));
    } finally {
      this.running = false;
    }
  };

  showConflicts(): void {
    new ConflictModal(this.app, this).open();
  }

  reviewConflict(path: string, onDone?: () => void): void {
    new ConflictResolveModal(this.app, this, path, () => {
      this.refreshConflictChrome();
      onDone?.();
    }).open();
  }

  refreshConflictChrome(): void {
    const count = this.state.conflicts.length;
    if (this.conflictStatus) {
      this.conflictStatus.toggleClass("is-clear", count === 0);
      this.conflictStatus.setText(count === 0 ? "" : `${count} ${count === 1 ? "conflict" : "conflicts"}`);
    }
    this.refreshConflictBanner();
  }

  onunload(): void {
    document.querySelectorAll(".vault-sync-conflict-banner").forEach((el) => el.remove());
  }

  private refreshConflictBanner(): void {
    document.querySelectorAll(".vault-sync-conflict-banner").forEach((el) => el.remove());
    const file = this.app.workspace.getActiveFile();
    if (!file || !this.state.conflicts.some((conflict) => pathKey(conflict.path) === pathKey(file.path))) return;
    const view = this.app.workspace.getActiveViewOfType(MarkdownView) ?? this.app.workspace.getMostRecentLeaf()?.view;
    if (!view) return;
    for (const host of bannerHosts(view.containerEl)) {
      const banner = host.createDiv({ cls: "vault-sync-conflict-banner" });
      host.prepend(banner);
      banner.createSpan({ text: "This note has a sync conflict." });
      const review = banner.createEl("button", { text: "Review" });
      review.onclick = () => this.reviewConflict(file.path);
    }
  }

  updateFromGitHub = async (): Promise<void> => {
    try {
      const listed = await requestUrl({
        url: `https://api.github.com/repos/${RELEASE_REPO}/releases/latest`,
        headers: { Accept: "application/vnd.github+json" },
      });
      const plan = parseLatestRelease(listed.json, this.manifest.version);
      if (!plan) {
        new Notice(`Vault Anovem Sync ${this.manifest.version} is current.`);
        return;
      }
      const dir = this.manifest.dir;
      if (!dir) throw new Error("Plugin folder is missing.");
      for (const name of PLUGIN_FILES) {
        const downloaded = await requestUrl({ url: plan.files[name] });
        await this.app.vault.adapter.writeBinary(`${dir}/${name}`, downloaded.arrayBuffer);
      }
      new Notice(`Installed ${plan.version}. Reloading the plugin.`);
      await reloadPlugin(this.app, this.manifest.id);
    } catch (error) {
      new Notice(errorMessage(error));
    }
  };

  backupNow = async (): Promise<void> => {
    if (this.running) {
      new Notice("A sync or backup is already running.");
      return;
    }
    this.running = true;
    const modal = new SyncProgressModal(this.app, "Backup");
    modal.open();
    try {
      const format: BackupFormat = this.settings.backupFormat === "gzip" ? "gzip" : "zip";
      const folder = normalizeBackupFolder(this.settings.backupFolder);
      this.settings.backupFolder = folder;
      const path = await createBackup({
        vault: this.app.vault,
        vaultName: this.app.vault.getName(),
        format,
        folder,
        now: new Date(),
        cancelled: () => modal.cancelled,
        update: (text) => {
          modal.setStatus(text);
          this.statusBar?.setText(text);
        },
      });
      await this.persist();
      modal.finish();
      this.statusBar?.setText(this.settings.lastSyncSummary || "Sync");
      new Notice(`Backup saved to ${path}`);
    } catch (error) {
      modal.finish();
      this.statusBar?.setText(this.settings.lastSyncSummary || "Sync");
      new Notice(error instanceof BackupCancelled ? error.message : errorMessage(error));
    } finally {
      this.running = false;
    }
  };
}

async function reloadPlugin(app: VaultSyncPlugin["app"], id: string): Promise<void> {
  const plugins = (app as VaultSyncPlugin["app"] & {
    plugins: {
      disablePlugin(pluginId: string): Promise<void>;
      enablePlugin(pluginId: string): Promise<void>;
    };
  }).plugins;
  await plugins.disablePlugin(id);
  await plugins.enablePlugin(id);
}

function bannerHosts(container: HTMLElement): HTMLElement[] {
  const found = [".markdown-source-view", ".markdown-reading-view"]
    .map((selector) => container.querySelector(selector))
    .filter((node): node is HTMLElement => node instanceof HTMLElement);
  if (found.length > 0) return found;
  const content = container.querySelector(".view-content");
  return [content instanceof HTMLElement ? content : container];
}

function normalizeSyncMinutes(value: number): number {
  if (!Number.isFinite(value)) return 5;
  return Math.min(240, Math.max(1, Math.round(value)));
}
