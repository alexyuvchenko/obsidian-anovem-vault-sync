import { Modal, Notice, type App } from "obsidian";
import { errorMessage } from "./errors";
import {
  decodeUtf8,
  diffRows,
  foldContext,
  hunkLabel,
  hunkText,
  mergeLines,
  pendingHunks,
  seedChoices,
  textFromApplied,
  type ApplyChoice,
  type DiffRow,
  type MergeLine,
  type TextSpan,
} from "./merge";
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
    const count = this.plugin.state.conflicts.length;
    this.setTitle(count === 0 ? "Sync conflicts" : `Sync conflicts (${count})`);
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
      text: "Review keeps lines that exist on only one side. Where both sides changed the same lines, choose before applying. Apply writes that result in both places and keeps a backup of each previous copy.",
    });
    for (const conflict of conflicts) {
      const row = contentEl.createDiv({ cls: "vault-sync-conflict" });
      row.createEl("div", { cls: "vault-sync-conflict-path", text: conflict.path });
      row.createEl("div", { cls: "setting-item-description", text: conflictText(conflict.kind) });
      const buttons = row.createDiv({ cls: "vault-sync-conflict-buttons" });
      const open = buttons.createEl("button", { text: "Review" });
      open.onclick = () => {
        this.close();
        this.plugin.reviewConflict(conflict.path, () => this.plugin.showConflicts());
      };
    }
  }
}

export class ConflictResolveModal extends Modal {
  private applied = new Map<number, ApplyChoice>();
  private custom = new Map<number, string>();
  private openFolds = new Set<number>();
  private rows: DiffRow[] = [];
  private binary: ArrayBuffer | null = null;
  private mode: "text" | "binary" = "text";
  private saving = false;
  private scrollTop = 0;
  private focusPending = false;

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
        this.renderSideChoice("This file is not text. Choose which copy to keep.", sides.local, sides.remote);
        return;
      }
      if (!sides.local || !sides.remote) {
        const message = sides.local
          ? "This file is on this device and not in Dropbox. Nothing is written until you apply."
          : "This file is not on this device, and it is still in Dropbox. Nothing is written until you apply.";
        this.renderSideChoice(message, sides.local, sides.remote);
        return;
      }
      this.rows = diffRows(localText ?? "", remoteText ?? "");
      this.applied = seedChoices(this.rows);
      this.focusPending = true;
      this.renderText();
    } catch (error) {
      this.contentEl.empty();
      this.contentEl.createEl("p", { text: errorMessage(error) });
    }
  };

  private renderText(): void {
    const open = this.contentEl.querySelector(".vault-sync-merge-scroll");
    if (open) this.scrollTop = open.scrollTop;
    const focusPending = this.focusPending;
    this.focusPending = false;
    const { contentEl } = this;
    contentEl.empty();
    const pending = pendingHunks(this.rows, this.applied, this.custom);
    contentEl.createEl("p", {
      cls: "vault-sync-merge-summary",
      text: pending.length === 0
        ? "Every change has a choice. Apply writes the result on this device and in Dropbox."
        : `${pending.length} ${pending.length === 1 ? "change differs" : "changes differ"} on both sides. Choose each one before applying. Lines that exist on only one side are already kept.`,
    });
    const scroll = contentEl.createDiv({ cls: "vault-sync-merge-scroll" });
    const head = scroll.createDiv({ cls: "vault-sync-merge-line is-head" });
    head.createDiv({ text: "This device" });
    head.createDiv({ text: "Result" });
    head.createDiv({ text: "Dropbox" });
    const lines = mergeLines(this.rows);
    const numbers = lineNumbers(lines);
    let resultNo = 0;
    let seenHunk: number | null = null;
    const customShown = new Set<number>();
    for (const item of foldContext(lines, 2, this.openFolds)) {
      if (item.kind === "fold") {
        const fold = scroll.createDiv({ cls: "vault-sync-merge-fold" });
        fold.createSpan({ text: `${item.count} unchanged ${item.count === 1 ? "line" : "lines"}` });
        fold.createSpan({ cls: "vault-sync-fold-action", text: "Expand" });
        fold.onclick = () => {
          this.openFolds.add(item.id);
          this.renderText();
        };
        continue;
      }
      const line = item.line;
      if (line.hunk !== null && line.hunk !== seenHunk) {
        seenHunk = line.hunk;
        this.hunkBar(scroll, line.hunk);
      }
      const choice = line.hunk === null ? undefined : this.applied.get(line.hunk);
      const custom = line.hunk !== null ? this.custom.get(line.hunk) : undefined;
      const row = scroll.createDiv({ cls: "vault-sync-merge-line" });
      const leftOn = choice?.local === true;
      const rightOn = choice?.remote === true;
      const numbered = numbers[item.index];
      this.codeCell(row, line.from === "remote" ? null : line.text, line.from === "remote" ? null : numbered.left, line.from === "local", false, choice !== undefined && line.from === "local" && !leftOn, line.spans);
      if (custom !== undefined && line.hunk !== null && !customShown.has(line.hunk)) {
        customShown.add(line.hunk);
        const count = custom.length === 0 ? 0 : custom.split("\n").length;
        resultNo += count;
        this.codeCell(row, custom, count > 0 ? resultNo - count + 1 : null, true, true);
      } else if (custom !== undefined) {
        this.codeCell(row, null, null, false);
      } else if (line.hunk === null || (line.from === "local" && leftOn) || (line.from === "remote" && rightOn)) {
        resultNo += 1;
        this.codeCell(row, line.text, resultNo, line.hunk !== null, true, false, line.spans);
      } else {
        this.codeCell(row, null, null, false);
      }
      this.codeCell(row, line.from === "local" ? null : line.text, line.from === "local" ? null : numbered.right, line.from === "remote", false, choice !== undefined && line.from === "remote" && !rightOn, line.spans);
    }
    const footer = contentEl.createDiv({ cls: "vault-sync-merge-footer" });
    const accept = footer.createDiv({ cls: "vault-sync-conflict-buttons" });
    const previous = accept.createEl("button", { text: "Previous" });
    previous.onclick = () => this.jumpHunk(-1);
    const next = accept.createEl("button", { text: "Next" });
    next.onclick = () => this.jumpHunk(1);
    const acceptLeft = accept.createEl("button", { text: "Keep this device" });
    acceptLeft.onclick = () => this.pickAll({ local: true, remote: false });
    const acceptRight = accept.createEl("button", { text: "Keep Dropbox" });
    acceptRight.onclick = () => this.pickAll({ local: false, remote: true });
    const apply = footer.createDiv({ cls: "vault-sync-conflict-buttons" });
    const save = apply.createEl("button", { cls: "mod-cta", text: pending.length === 0 ? "Apply" : `Choose ${pending.length}` });
    save.disabled = pending.length > 0;
    save.onclick = () => {
      void this.save();
    };
    const abort = apply.createEl("button", { text: "Abort" });
    abort.onclick = () => this.close();
    if (focusPending) {
      window.requestAnimationFrame(() => {
        const target = scroll.querySelector(".is-pending") ?? scroll.querySelector("[data-hunk]");
        target?.scrollIntoView({ block: "center" });
      });
    } else {
      scroll.scrollTop = this.scrollTop;
    }
  }

  private hunkBar(parent: HTMLElement, id: number): void {
    const row = this.rows.find((item) => item.id === id);
    const choice = this.applied.get(id);
    const edited = this.custom.has(id);
    const bar = parent.createDiv({ cls: "vault-sync-merge-line is-resolve" });
    bar.dataset.hunk = String(id);
    if (!choice && !edited) bar.addClass("is-pending");
    const left = bar.createDiv({ cls: "vault-sync-merge-resolve" });
    this.applyButton(left, "»", "Keep this device's change", choice?.local === true, () => this.setApplied(id, "local", true));
    this.applyButton(left, "×", "Leave out this device's change", choice !== undefined && !choice.local, () => this.setApplied(id, "local", false));
    const actions = bar.createDiv({ cls: "vault-sync-merge-resolve" });
    if (row) actions.createSpan({ cls: "vault-sync-hunk-label", text: hunkLabel(row, choice, edited) });
    const edit = actions.createEl("button", { text: "Edit" });
    edit.onclick = () => this.editHunk(id, actions);
    const right = bar.createDiv({ cls: "vault-sync-merge-resolve" });
    this.applyButton(right, "×", "Leave out Dropbox's change", choice !== undefined && !choice.remote, () => this.setApplied(id, "remote", false));
    this.applyButton(right, "«", "Keep Dropbox's change", choice?.remote === true, () => this.setApplied(id, "remote", true));
  }

  private jumpHunk(step: number): void {
    const bars = Array.from(this.contentEl.querySelectorAll<HTMLElement>("[data-hunk]"));
    if (bars.length === 0) return;
    const pending = bars.filter((bar) => bar.hasClass("is-pending"));
    const list = pending.length > 0 ? pending : bars;
    const current = list.findIndex((bar) => bar.hasClass("is-current"));
    const next = list[(current + step + list.length) % list.length];
    for (const bar of bars) bar.removeClass("is-current");
    next.addClass("is-current");
    next.scrollIntoView({ block: "center" });
  }

  private applyButton(parent: HTMLElement, text: string, title: string, on: boolean, action: () => void): void {
    const button = parent.createEl("button", { text, title });
    if (on) button.addClass("is-on");
    button.onclick = action;
  }

  private codeCell(
    parent: HTMLElement,
    text: string | null,
    number: number | null,
    changed: boolean,
    result = false,
    ignored = false,
    spans?: TextSpan[],
  ): void {
    const cell = parent.createDiv({ cls: "vault-sync-code-cell" });
    if (text === null) {
      cell.addClass("is-blank");
      return;
    }
    if (changed) cell.addClass(result ? "is-result" : "is-changed");
    if (ignored) cell.addClass("is-ignored");
    if (text.includes("\n")) cell.addClass("is-block");
    cell.createSpan({ cls: "vault-sync-ln", text: number === null ? "" : String(number) });
    const code = cell.createSpan({ cls: "vault-sync-code" });
    const parts = spans && spans.length > 0 ? spans : [{ text, strong: false }];
    for (const span of parts) {
      const node = code.createSpan({ text: span.text });
      if (span.strong) node.addClass("is-strong");
    }
  }

  private setApplied(id: number, side: "local" | "remote", on: boolean): void {
    const choice = this.applied.get(id) ?? { local: false, remote: false };
    this.applied.set(id, { ...choice, [side]: on });
    this.custom.delete(id);
    this.renderText();
  }

  private editHunk(id: number, host: HTMLElement): void {
    const row = this.rows.find((item) => item.id === id);
    if (!row || host.querySelector("textarea")) return;
    const area = host.createEl("textarea", { cls: "vault-sync-merge-result" });
    area.value = this.custom.get(id) ?? hunkText(row, this.applied.get(id) ?? { local: true, remote: true });
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

  private renderSideChoice(message: string, local: ArrayBuffer | null, remote: ArrayBuffer | null): void {
    this.mode = "binary";
    this.binary = null;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("p", { text: message });
    const buttons = contentEl.createDiv({ cls: "vault-sync-conflict-buttons" });
    const choose = (bytes: ArrayBuffer, button: HTMLButtonElement): void => {
      this.binary = bytes;
      for (const item of Array.from(buttons.querySelectorAll<HTMLButtonElement>("button"))) item.removeClass("is-on");
      button.addClass("is-on");
      const save = contentEl.querySelector<HTMLButtonElement>(".vault-sync-binary-save");
      if (save) save.disabled = false;
    };
    if (local) {
      const keep = buttons.createEl("button", { text: "Keep this device" });
      keep.onclick = () => choose(local, keep);
    }
    if (remote) {
      const keep = buttons.createEl("button", { text: "Keep Dropbox" });
      keep.onclick = () => choose(remote, keep);
    }
    const saveRow = contentEl.createDiv({ cls: "modal-button-container" });
    const save = saveRow.createEl("button", { cls: "mod-cta vault-sync-binary-save", text: "Apply" });
    save.disabled = true;
    save.onclick = () => {
      void this.save();
    };
    const abort = saveRow.createEl("button", { text: "Abort" });
    abort.onclick = () => this.close();
  }

  private save = async (): Promise<void> => {
    if (this.saving) return;
    if (this.mode === "binary" && !this.binary) {
      new Notice("Choose which copy to keep.");
      return;
    }
    if (this.mode === "text" && pendingHunks(this.rows, this.applied, this.custom).length > 0) {
      new Notice("Choose the lines that differ on both sides.");
      return;
    }
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

function lineNumbers(lines: MergeLine[]): Array<{ left: number | null; right: number | null }> {
  let left = 0;
  let right = 0;
  return lines.map((line) => ({
    left: line.from === "remote" ? null : (left += 1),
    right: line.from === "local" ? null : (right += 1),
  }));
}
