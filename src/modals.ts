import { Modal, Notice, type App } from "obsidian";
import { errorMessage } from "./errors";
import { decodeUtf8, diffRows, textFromChoices, type DiffRow } from "./merge";
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
  private rows: DiffRow[] = [];
  private result: HTMLTextAreaElement | null = null;
  private manual = false;
  private binary: ArrayBuffer | null = null;
  private saving = false;

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
      this.rows = diffRows(localText ?? "", remoteText ?? "");
      for (const row of this.rows) {
        if (row.kind === "change") this.choices.set(row.id, "local");
      }
      this.renderText();
    } catch (error) {
      this.contentEl.empty();
      this.contentEl.createEl("p", { text: errorMessage(error) });
    }
  };

  private renderText(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("p", {
      text: "Left is this device. Right is Dropbox. Pick a side for each change, or edit the result. Save replaces both copies.",
    });
    const columns = contentEl.createDiv({ cls: "vault-sync-merge-columns" });
    columns.createEl("div", { cls: "vault-sync-merge-heading", text: "This device" });
    columns.createEl("div", { cls: "vault-sync-merge-heading", text: "Dropbox" });
    for (const row of this.rows) {
      if (row.kind === "same") {
        const same = columns.createDiv({ cls: "vault-sync-merge-same" });
        same.createEl("pre", { text: row.local });
        continue;
      }
      this.hunk(columns, row, "local");
      this.hunk(columns, row, "remote");
    }
    const buttons = contentEl.createDiv({ cls: "vault-sync-conflict-buttons" });
    const useLocal = buttons.createEl("button", { text: "Use this device" });
    useLocal.onclick = () => this.pickAll("local");
    const useRemote = buttons.createEl("button", { text: "Use Dropbox" });
    useRemote.onclick = () => this.pickAll("remote");
    contentEl.createEl("div", { cls: "vault-sync-merge-heading", text: "Result" });
    this.result = contentEl.createEl("textarea", { cls: "vault-sync-merge-result" });
    this.markChoices();
    this.result.value = textFromChoices(this.rows, this.choices);
    this.result.addEventListener("input", () => {
      this.manual = true;
    });
    this.saveButton(contentEl);
  }

  private hunk(parent: HTMLElement, row: DiffRow, side: "local" | "remote"): void {
    const block = parent.createDiv({ cls: "vault-sync-merge-hunk" });
    block.createEl("pre", { text: side === "local" ? row.local : row.remote });
    const button = block.createEl("button", { text: side === "local" ? "Accept left" : "Accept right" });
    button.onclick = () => {
      this.choices.set(row.id, side);
      this.markChoices();
      if (!this.manual && this.result) this.result.value = textFromChoices(this.rows, this.choices);
    };
  }

  private markChoices(): void {
    const blocks = this.contentEl.querySelectorAll(".vault-sync-merge-hunk");
    let index = 0;
    for (const row of this.rows) {
      if (row.kind !== "change") continue;
      const choice = this.choices.get(row.id);
      const left = blocks[index] as HTMLElement | undefined;
      const right = blocks[index + 1] as HTMLElement | undefined;
      left?.toggleClass("is-chosen", choice === "local");
      right?.toggleClass("is-chosen", choice === "remote");
      index += 2;
    }
  }

  private pickAll(side: "local" | "remote"): void {
    for (const row of this.rows) {
      if (row.kind === "change") this.choices.set(row.id, side);
    }
    this.manual = false;
    this.markChoices();
    if (this.result) this.result.value = textFromChoices(this.rows, this.choices);
  }

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
      const encoded = new TextEncoder().encode(this.result?.value ?? "");
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
