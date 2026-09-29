import { Component, MarkdownRenderer, Modal, Notice, type App } from "obsidian";
import { errorMessage } from "./errors";
import { decodeUtf8, diffRows, mergeBlocks, textFromChoices, type DiffRow } from "./merge";
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
      text: "Open a file to merge this device and Dropbox. Saving writes that result in both places and keeps a backup of each previous copy.",
    });
    for (const conflict of conflicts) {
      const row = contentEl.createDiv({ cls: "vault-sync-conflict" });
      row.createEl("div", { cls: "vault-sync-conflict-path", text: conflict.path });
      row.createEl("div", { cls: "setting-item-description", text: conflictText(conflict.kind) });
      const buttons = row.createDiv({ cls: "vault-sync-conflict-buttons" });
      const open = buttons.createEl("button", { text: "Open" });
      open.onclick = () => {
        this.close();
        new ConflictResolveModal(this.app, this.plugin, conflict.path, () => this.plugin.showConflicts()).open();
      };
    }
  }
}

export class ConflictResolveModal extends Modal {
  private choices = new Map<number, "local" | "remote">();
  private custom = new Map<number, string>();
  private rows: DiffRow[] = [];
  private binary: ArrayBuffer | null = null;
  private saving = false;
  private markdown = new Component();

  constructor(
    app: App,
    private readonly plugin: VaultSyncPlugin,
    private readonly path: string,
    private readonly onDone: () => void,
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("vault-sync-merge-modal");
    this.setTitle(this.path);
    this.contentEl.createEl("p", { text: "Reading this device and Dropbox…" });
    void this.load();
  }

  private load = async (): Promise<void> => {
    try {
      const sides = await this.plugin.engine.readConflictBytes(this.path);
      if (!sides.local && !sides.remote) throw new Error("This file is gone on this device and in Dropbox.");
      const localText = sides.local ? decodeUtf8(sides.local) : "";
      const remoteText = sides.remote ? decodeUtf8(sides.remote) : "";
      if ((sides.local && localText === null) || (sides.remote && remoteText === null)) {
        this.renderBinary(sides.local, sides.remote);
        return;
      }
      this.rows = mergeBlocks(diffRows(localText ?? "", remoteText ?? ""));
      for (const row of this.rows) {
        if (row.kind === "change") this.choices.set(row.id, "local");
      }
      await this.renderText();
    } catch (error) {
      this.contentEl.empty();
      this.contentEl.createEl("p", { text: errorMessage(error) });
    }
  };

  onClose(): void {
    this.markdown.unload();
  }

  private renderText = async (): Promise<void> => {
    this.markdown.unload();
    this.markdown = new Component();
    this.markdown.load();
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("p", {
      text: "Dropbox is on the left, the merged note is in the center, and this device is on the right. Red is only in Dropbox. Green is only on this device.",
    });
    const buttons = contentEl.createDiv({ cls: "vault-sync-conflict-buttons" });
    const useRemote = buttons.createEl("button", { text: "Use Dropbox" });
    useRemote.onclick = () => {
      void this.pickAll("remote");
    };
    const useLocal = buttons.createEl("button", { text: "Use this device" });
    useLocal.onclick = () => {
      void this.pickAll("local");
    };
    const board = contentEl.createDiv({ cls: "vault-sync-merge-board" });
    board.createDiv({ cls: "vault-sync-merge-head", text: "Dropbox" });
    board.createDiv({ cls: "vault-sync-merge-head", text: "Result" });
    board.createDiv({ cls: "vault-sync-merge-head", text: "This device" });
    for (const row of this.rows) {
      const changed = row.kind === "change";
      const choice = this.choices.get(row.id) === "remote" ? "remote" : "local";
      const resultText = this.custom.get(row.id) ?? (choice === "remote" ? row.remote : row.local);
      await this.pane(board, row.remote, changed ? "vault-sync-diff-dropbox" : "");
      const center = board.createDiv({ cls: "vault-sync-merge-cell" });
      if (changed) {
        center.addClass(this.custom.has(row.id) ? "vault-sync-diff-edited" : choice === "remote" ? "vault-sync-diff-dropbox" : "vault-sync-diff-local");
        const actions = center.createDiv({ cls: "vault-sync-merge-actions" });
        const takeRemote = actions.createEl("button", { text: "Use Dropbox" });
        takeRemote.onclick = () => {
          void this.choose(row.id, "remote");
        };
        const takeLocal = actions.createEl("button", { text: "Use this device" });
        takeLocal.onclick = () => {
          void this.choose(row.id, "local");
        };
        const edit = actions.createEl("button", { text: "Edit" });
        edit.onclick = () => this.editResult(row, center);
      }
      await this.renderMarkdown(center, changed ? resultText : row.local);
      await this.pane(board, row.local, changed ? "vault-sync-diff-local" : "");
    }
    this.saveButton(contentEl);
  };

  private pane = async (board: HTMLElement, markdown: string, diffClass: string): Promise<void> => {
    const cell = board.createDiv({ cls: "vault-sync-merge-cell" });
    if (diffClass) cell.addClass(diffClass);
    await this.renderMarkdown(cell, markdown);
  };

  private renderMarkdown = async (parent: HTMLElement, markdown: string): Promise<void> => {
    const host = parent.createDiv({ cls: "vault-sync-md" });
    if (markdown.length === 0) {
      host.createEl("p", { cls: "vault-sync-merge-empty", text: "Nothing on this side." });
      return;
    }
    await MarkdownRenderer.render(this.app, markdown, host, this.path, this.markdown);
  };

  private choose = async (id: number, side: "local" | "remote"): Promise<void> => {
    this.choices.set(id, side);
    this.custom.delete(id);
    await this.renderText();
  };

  private editResult(row: DiffRow, cell: HTMLElement): void {
    cell.querySelector(".vault-sync-md")?.remove();
    const choice = this.choices.get(row.id) === "remote" ? row.remote : row.local;
    const area = cell.createEl("textarea", { cls: "vault-sync-merge-result" });
    area.value = this.custom.get(row.id) ?? choice;
    area.focus();
    area.onblur = () => {
      this.custom.set(row.id, area.value);
      void this.renderText();
    };
  }

  private pickAll = async (side: "local" | "remote"): Promise<void> => {
    this.custom.clear();
    for (const row of this.rows) {
      if (row.kind === "change") this.choices.set(row.id, side);
    }
    await this.renderText();
  };

  private renderBinary(local: ArrayBuffer | null, remote: ArrayBuffer | null): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("p", { text: "This file is not text. Choose which copy becomes the resolved file." });
    const buttons = contentEl.createDiv({ cls: "vault-sync-conflict-buttons" });
    if (local) {
      const keep = buttons.createEl("button", { text: "Use this device" });
      keep.onclick = () => {
        this.binary = local;
      };
    }
    if (remote) {
      const keep = buttons.createEl("button", { text: "Use Dropbox" });
      keep.onclick = () => {
        this.binary = remote;
      };
    }
    this.binary = local ?? remote;
    this.saveButton(contentEl);
  }

  private saveButton(parent: HTMLElement): void {
    const buttons = parent.createDiv({ cls: "modal-button-container" });
    const save = buttons.createEl("button", { cls: "mod-cta", text: "Save resolved copy" });
    save.onclick = () => {
      void this.save();
    };
  }

  private save = async (): Promise<void> => {
    if (this.saving) return;
    this.saving = true;
    try {
      const encoded = new TextEncoder().encode(textFromChoices(this.rows, this.choices, this.custom));
      const bytes = this.binary ?? encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength);
      const backups = await this.plugin.engine.saveResolution(this.path, bytes, new Date());
      new Notice(backups.length > 0 ? `Resolved ${this.path}. Backups: ${backups.join(", ")}` : `Resolved ${this.path}.`);
      this.close();
      this.onDone();
    } catch (error) {
      this.saving = false;
      new Notice(errorMessage(error));
    }
  };
}
