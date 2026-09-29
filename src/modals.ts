import { Modal, TFile, type App } from "obsidian";
import { conflictText } from "./paths";
import type VaultSyncPlugin from "./main";

export class SyncProgressModal extends Modal {
  cancelled = false;
  private finished = false;
  private line: HTMLElement | null = null;

  constructor(app: App, private readonly title = "Syncing") {
    super(app);
  }

  onOpen(): void {
    this.setTitle(this.title);
    this.line = this.contentEl.createEl("p", { cls: "vault-sync-progress-line", text: "Starting…" });
    const buttons = this.contentEl.createDiv({ cls: "modal-button-container" });
    const stop = buttons.createEl("button", { text: "Stop" });
    stop.onclick = () => this.close();
  }

  setStatus(text: string): void {
    this.line?.setText(text);
  }

  finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.close();
  }

  onClose(): void {
    if (!this.finished) this.cancelled = true;
  }
}

export class ConflictModal extends Modal {
  constructor(
    app: App,
    private readonly plugin: VaultSyncPlugin,
  ) {
    super(app);
  }

  onOpen(): void {
    this.setTitle("Sync conflicts");
    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    const conflicts = this.plugin.state.conflicts;
    if (conflicts.length === 0) {
      contentEl.createEl("p", { text: "No conflicts." });
      return;
    }
    contentEl.createEl("p", {
      text: "Resolve these in the vault, then sync again. A conflict is left unchanged until you edit or delete the file.",
    });
    for (const conflict of conflicts) {
      const row = contentEl.createDiv({ cls: "vault-sync-conflict" });
      row.createEl("div", { cls: "vault-sync-conflict-path", text: conflict.path });
      row.createEl("div", { cls: "setting-item-description", text: conflictText(conflict.kind) });
      const file = this.app.vault.getAbstractFileByPath(conflict.path);
      if (file instanceof TFile) {
        const buttons = row.createDiv({ cls: "vault-sync-conflict-buttons" });
        const open = buttons.createEl("button", { text: "Open" });
        open.onclick = () => {
          void this.app.workspace.getLeaf(false).openFile(file);
          this.close();
        };
      }
    }
  }
}
