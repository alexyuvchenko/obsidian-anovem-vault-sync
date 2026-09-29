import { Modal, Notice, type App } from "obsidian";
import { errorMessage } from "./errors";
import { decodeUtf8, diffRows, hunkText, mergeLines, textFromApplied, type ApplyChoice, type DiffRow } from "./merge";
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
  private applied = new Map<number, ApplyChoice>();
  private custom = new Map<number, string>();
  private rows: DiffRow[] = [];
  private binary: ArrayBuffer | null = null;
  private saving = false;
  private scrollTop = 0;

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
        if (row.kind === "change") this.applied.set(row.id, { local: true, remote: false });
      }
      this.renderText();
    } catch (error) {
      this.contentEl.empty();
      this.contentEl.createEl("p", { text: errorMessage(error) });
    }
  };

  private renderText(): void {
    const open = this.contentEl.querySelector(".vault-sync-merge-scroll");
    if (open) this.scrollTop = open.scrollTop;
    const { contentEl } = this;
    contentEl.empty();
    const scroll = contentEl.createDiv({ cls: "vault-sync-merge-scroll" });
    const head = scroll.createDiv({ cls: "vault-sync-merge-line is-head" });
    head.createDiv({ text: "This device" });
    head.createDiv({ text: "Result" });
    head.createDiv({ text: "Dropbox" });
    let leftNo = 0;
    let rightNo = 0;
    let resultNo = 0;
    let seenHunk: number | null = null;
    let customShown = new Set<number>();
    for (const line of mergeLines(this.rows)) {
      if (line.hunk !== null && line.hunk !== seenHunk) {
        seenHunk = line.hunk;
        this.hunkBar(scroll, line.hunk);
      }
      const choice = line.hunk === null ? null : this.applied.get(line.hunk) ?? { local: true, remote: false };
      const custom = line.hunk !== null ? this.custom.get(line.hunk) : undefined;
      const row = scroll.createDiv({ cls: "vault-sync-merge-line" });
      if (line.from !== "remote") leftNo += 1;
      if (line.from !== "local") rightNo += 1;
      const leftOn = choice?.local === true;
      const rightOn = choice?.remote === true;
      this.codeCell(row, line.from === "remote" ? null : line.text, line.from === "remote" ? null : leftNo, line.from === "local", false, line.from === "local" && !leftOn);
      if (custom !== undefined && line.hunk !== null && !customShown.has(line.hunk)) {
        customShown.add(line.hunk);
        const count = custom.length === 0 ? 0 : custom.split("\n").length;
        resultNo += count;
        this.codeCell(row, custom, count > 0 ? resultNo - count + 1 : null, true, true);
      } else if (custom !== undefined) {
        this.codeCell(row, null, null, false);
      } else if (line.hunk === null || (line.from === "local" && leftOn) || (line.from === "remote" && rightOn)) {
        resultNo += 1;
        this.codeCell(row, line.text, resultNo, line.hunk !== null, true);
      } else {
        this.codeCell(row, null, null, false);
      }
      this.codeCell(row, line.from === "local" ? null : line.text, line.from === "local" ? null : rightNo, line.from === "remote", false, line.from === "remote" && !rightOn);
    }
    const footer = contentEl.createDiv({ cls: "vault-sync-merge-footer" });
    const accept = footer.createDiv({ cls: "vault-sync-conflict-buttons" });
    const acceptLeft = accept.createEl("button", { text: "Accept left" });
    acceptLeft.onclick = () => this.pickAll({ local: true, remote: false });
    const acceptRight = accept.createEl("button", { text: "Accept right" });
    acceptRight.onclick = () => this.pickAll({ local: false, remote: true });
    const apply = footer.createDiv({ cls: "vault-sync-conflict-buttons" });
    const save = apply.createEl("button", { cls: "mod-cta", text: "Apply" });
    save.onclick = () => {
      void this.save();
    };
    const abort = apply.createEl("button", { text: "Abort" });
    abort.onclick = () => this.close();
    scroll.scrollTop = this.scrollTop;
  }

  private hunkBar(parent: HTMLElement, id: number): void {
    const choice = this.applied.get(id) ?? { local: true, remote: false };
    const bar = parent.createDiv({ cls: "vault-sync-merge-line is-resolve" });
    const left = bar.createDiv({ cls: "vault-sync-merge-resolve" });
    this.applyButton(left, "»", "Apply left change", choice.local, () => this.setApplied(id, "local", true));
    this.applyButton(left, "×", "Ignore left change", !choice.local, () => this.setApplied(id, "local", false));
    const actions = bar.createDiv({ cls: "vault-sync-merge-resolve" });
    const edit = actions.createEl("button", { text: "Edit" });
    edit.onclick = () => this.editHunk(id, actions);
    const right = bar.createDiv({ cls: "vault-sync-merge-resolve" });
    this.applyButton(right, "×", "Ignore right change", !choice.remote, () => this.setApplied(id, "remote", false));
    this.applyButton(right, "«", "Apply right change", choice.remote, () => this.setApplied(id, "remote", true));
  }

  private applyButton(parent: HTMLElement, text: string, title: string, on: boolean, action: () => void): void {
    const button = parent.createEl("button", { text, title });
    if (on) button.addClass("is-on");
    button.onclick = action;
  }

  private codeCell(parent: HTMLElement, text: string | null, number: number | null, changed: boolean, result = false, ignored = false): void {
    const cell = parent.createDiv({ cls: "vault-sync-code-cell" });
    if (text === null) {
      cell.addClass("is-blank");
      return;
    }
    if (changed) cell.addClass(result ? "is-result" : "is-changed");
    if (ignored) cell.addClass("is-ignored");
    if (text.includes("\n")) cell.addClass("is-block");
    cell.createSpan({ cls: "vault-sync-ln", text: number === null ? "" : String(number) });
    cell.createSpan({ cls: "vault-sync-code", text });
  }

  private setApplied(id: number, side: "local" | "remote", on: boolean): void {
    const choice = this.applied.get(id) ?? { local: true, remote: false };
    this.applied.set(id, { ...choice, [side]: on });
    this.custom.delete(id);
    this.renderText();
  }

  private editHunk(id: number, host: HTMLElement): void {
    const row = this.rows.find((item) => item.id === id);
    if (!row || host.querySelector("textarea")) return;
    const area = host.createEl("textarea", { cls: "vault-sync-merge-result" });
    area.value = this.custom.get(id) ?? hunkText(row, this.applied.get(id) ?? { local: true, remote: false });
    area.focus();
    area.onblur = () => {
      this.custom.set(id, area.value);
      this.renderText();
    };
  }

  private pickAll(choice: ApplyChoice): void {
    this.custom.clear();
    for (const row of this.rows) {
      if (row.kind === "change") this.applied.set(row.id, { ...choice });
    }
    this.renderText();
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
      const encoded = new TextEncoder().encode(textFromApplied(this.rows, this.applied, this.custom));
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
