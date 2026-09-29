import { Modal, Notice, type App } from "obsidian";
import { errorMessage } from "./errors";
import {
  blockLines,
  decodeUtf8,
  diffRows,
  hunkLabel,
  hunkShape,
  hunkText,
  mergeBlocks,
  pendingHunks,
  seedChoices,
  textFromApplied,
  type ApplyChoice,
  type DiffRow,
  type TextSpan,
} from "./merge";
import { conflictText } from "./paths";
import type { PlanLine } from "./sync";
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

export class SyncPlanModal extends Modal {
  constructor(
    app: App,
    private readonly lines: PlanLine[],
    private readonly onSync: () => void,
  ) {
    super(app);
  }

  onOpen(): void {
    this.setTitle("Sync plan");
    const { contentEl } = this;
    if (this.lines.length === 0) {
      contentEl.createEl("p", { text: "Already in sync. Nothing would change." });
    } else {
      contentEl.createEl("p", { text: "This is what a sync would do. Nothing has been written." });
      const list = contentEl.createDiv({ cls: "vault-sync-plan" });
      for (const line of this.lines) {
        const row = list.createDiv({ cls: "vault-sync-plan-row" });
        row.createSpan({ cls: "vault-sync-plan-action", text: planAction(line.action) });
        const body = row.createDiv();
        body.createDiv({ cls: "vault-sync-conflict-path", text: line.path });
        body.createDiv({ cls: "setting-item-description", text: line.note });
      }
    }
    const buttons = contentEl.createDiv({ cls: "modal-button-container" });
    if (this.lines.length > 0) {
      const sync = buttons.createEl("button", { cls: "mod-cta", text: "Sync both ways" });
      sync.onclick = () => {
        this.close();
        this.onSync();
      };
    }
    const close = buttons.createEl("button", { text: "Close" });
    close.onclick = () => this.close();
  }
}

function planAction(action: PlanLine["action"]): string {
  if (action === "upload") return "Upload";
  if (action === "download") return "Download";
  if (action === "merge") return "Merge";
  if (action === "rename") return "Rename";
  if (action === "trash") return "Trash";
  return "Review";
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
  private editing: number | null = null;
  private draft = "";
  private focusEdit = false;

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
      this.rows = mergeBlocks(diffRows(localText ?? "", remoteText ?? ""));
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
    const focusEdit = this.focusEdit;
    this.focusPending = false;
    this.focusEdit = false;
    const { contentEl } = this;
    contentEl.empty();
    const pending = pendingHunks(this.rows, this.applied, this.custom);
    const disagreements = this.rows.filter((row) => hunkShape(row) === "both");
    contentEl.createEl("p", {
      cls: "vault-sync-merge-summary",
      text: disagreements.length === 0
        ? "These copies only add different lines, and those lines are already kept. Apply writes the note on this device and in Dropbox."
        : pending.length === 0
          ? "Every disagreement has a choice. Apply writes the note on this device and in Dropbox."
          : "Lines found on only one side are already kept. Choose each place where both sides changed.",
    });
    const scroll = contentEl.createDiv({ cls: "vault-sync-merge-scroll" });
    for (const row of this.rows) {
      if (row.kind === "same") this.renderContext(scroll, row);
      else if (hunkShape(row) === "both") this.renderChoice(scroll, row);
      else this.renderSingle(scroll, row);
    }
    const footer = contentEl.createDiv({ cls: "vault-sync-merge-footer" });
    const nav = footer.createDiv({ cls: "vault-sync-merge-nav" });
    const previous = nav.createEl("button", { text: "Previous" });
    previous.onclick = () => this.jumpHunk(-1);
    const next = nav.createEl("button", { text: "Next" });
    next.onclick = () => this.jumpHunk(1);
    const status = nav.createSpan({
      cls: pending.length === 0 ? "vault-sync-merge-status" : "vault-sync-merge-status is-pending",
      text: pending.length === 0 ? "Ready to apply" : `${pending.length} still ${pending.length === 1 ? "needs" : "need"} a choice`,
    });
    status.setAttr("aria-live", "polite");
    const apply = footer.createDiv({ cls: "vault-sync-merge-nav" });
    if (disagreements.length > 1) {
      const allLocal = apply.createEl("button", {
        text: "This device for all",
        title: "Where both sides changed, keep this device. Lines that exist on only one side stay as they are.",
      });
      allLocal.onclick = () => this.keepDisagreements({ local: true, remote: false });
      const allRemote = apply.createEl("button", {
        text: "Dropbox for all",
        title: "Where both sides changed, keep Dropbox. Lines that exist on only one side stay as they are.",
      });
      allRemote.onclick = () => this.keepDisagreements({ local: false, remote: true });
    }
    const save = apply.createEl("button", { cls: "mod-cta", text: "Apply" });
    save.disabled = pending.length > 0;
    save.onclick = () => {
      void this.save();
    };
    const cancel = apply.createEl("button", { text: "Cancel" });
    cancel.onclick = () => this.close();
    if (focusEdit) {
      window.requestAnimationFrame(() => {
        const area = scroll.querySelector("textarea");
        if (area instanceof HTMLTextAreaElement) {
          area.focus();
          area.scrollIntoView({ block: "center" });
        }
      });
    } else if (focusPending) {
      window.requestAnimationFrame(() => {
        const target = scroll.querySelector(".is-pending") ?? scroll.querySelector("[data-hunk]");
        target?.scrollIntoView({ block: "center" });
      });
    } else {
      scroll.scrollTop = this.scrollTop;
    }
  }

  private renderContext(parent: HTMLElement, row: DiffRow): void {
    const lines = row.local.split("\n");
    const limit = 2;
    if (lines.length <= limit * 2 + 1 || this.openFolds.has(row.id)) {
      parent.createDiv({ cls: "vault-sync-context", text: row.local });
      if (lines.length > limit * 2 + 1) {
        const fold = parent.createDiv({ cls: "vault-sync-fold" });
        const button = fold.createEl("button", { text: "Hide unchanged lines" });
        button.onclick = () => {
          this.openFolds.delete(row.id);
          this.renderText();
        };
      }
      return;
    }
    parent.createDiv({ cls: "vault-sync-context", text: lines.slice(0, limit).join("\n") });
    const fold = parent.createDiv({ cls: "vault-sync-fold" });
    const hidden = lines.length - limit * 2;
    const button = fold.createEl("button", { text: `Show ${hidden} unchanged ${hidden === 1 ? "line" : "lines"}` });
    button.onclick = () => {
      this.openFolds.add(row.id);
      this.renderText();
    };
    parent.createDiv({ cls: "vault-sync-context", text: lines.slice(-limit).join("\n") });
  }

  private renderSingle(parent: HTMLElement, row: DiffRow): void {
    const shape = hunkShape(row);
    const remote = shape === "remote-only";
    const choice = this.applied.get(row.id);
    const edited = this.custom.has(row.id);
    const kept = remote ? choice?.remote !== false : choice?.local !== false;
    const card = parent.createDiv({ cls: "vault-sync-change is-single" });
    card.dataset.hunk = String(row.id);
    if (kept || edited) card.addClass("is-done");
    const head = card.createDiv({ cls: "vault-sync-change-head" });
    const title = head.createDiv({ cls: "vault-sync-change-title" });
    title.createSpan({ text: remote ? "Only in Dropbox" : "Only on this device" });
    title.createSpan({ cls: "vault-sync-change-state", text: hunkLabel(row, choice, edited) });
    const actions = head.createDiv({ cls: "vault-sync-head-actions" });
    const toggle = actions.createEl("button", { text: edited ? "Keep original" : kept ? "Leave out" : "Keep" });
    toggle.onclick = () => this.toggleKept(row, edited ? true : !kept);
    const edit = actions.createEl("button", { text: edited ? "Edit again" : "Edit" });
    if (edited || this.editing === row.id) edit.addClass("is-on");
    edit.onclick = () => this.startEdit(row);
    const body = card.createDiv({ cls: "vault-sync-side-body" });
    if (!kept || edited) body.addClass("is-dim");
    this.writeLines(body, remote ? row.remote : row.local);
    if (this.editing === row.id) this.renderEditor(card, row.id);
    else if (edited) this.renderCustom(card, this.custom.get(row.id) ?? "");
  }

  private renderChoice(parent: HTMLElement, row: DiffRow): void {
    const choice = this.applied.get(row.id);
    const edited = this.custom.has(row.id);
    const editing = this.editing === row.id;
    const pending = !choice && !edited;
    const card = parent.createDiv({ cls: "vault-sync-change" });
    card.dataset.hunk = String(row.id);
    if (pending) card.addClass("is-pending");
    else card.addClass("is-done");
    const head = card.createDiv({ cls: "vault-sync-change-head" });
    const title = head.createDiv({ cls: "vault-sync-change-title" });
    title.createSpan({ text: "Both sides changed" });
    const state = title.createSpan({ cls: "vault-sync-change-state", text: hunkLabel(row, choice, edited) });
    if (pending) state.addClass("is-pending");
    const actions = card.createDiv({ cls: "vault-sync-change-actions" });
    this.choiceButton(actions, "Keep this device", !edited && choice?.local === true && choice.remote === false, () => this.choose(row.id, { local: true, remote: false }));
    this.choiceButton(actions, "Keep Dropbox", !edited && choice?.remote === true && choice.local === false, () => this.choose(row.id, { local: false, remote: true }));
    this.choiceButton(actions, "Keep both", !edited && choice?.local === true && choice.remote === true, () => this.choose(row.id, { local: true, remote: true }));
    this.choiceButton(actions, "Leave out", !edited && choice?.local === false && choice?.remote === false, () => this.choose(row.id, { local: false, remote: false }));
    const edit = actions.createEl("button", { text: edited ? "Edit again" : "Edit" });
    if (edited || editing) edit.addClass("is-on");
    edit.onclick = () => this.startEdit(row);
    const spans = blockLines(row.local, row.remote);
    const sides = card.createDiv({ cls: "vault-sync-change-sides" });
    this.renderSide(sides, "This device", "local", spans.local, !edited && !editing && choice?.local === true, !edited && !editing && choice !== undefined && !choice.local);
    this.renderSide(sides, "Dropbox", "remote", spans.remote, !edited && !editing && choice?.remote === true, !edited && !editing && choice !== undefined && !choice.remote);
    const caption = this.savedCaption(row, choice, edited, editing);
    if (caption) card.createDiv({ cls: "vault-sync-saved", text: caption });
    if (editing) this.renderEditor(card, row.id);
    else if (edited) this.renderCustom(card, this.custom.get(row.id) ?? "");
  }

  private renderSide(parent: HTMLElement, label: string, kind: "local" | "remote", lines: TextSpan[][], kept: boolean, dim: boolean): void {
    const side = parent.createDiv({ cls: `vault-sync-side is-${kind}` });
    if (kept) side.addClass("is-kept");
    if (dim) side.addClass("is-dim");
    side.createDiv({ cls: "vault-sync-side-label", text: label });
    const body = side.createDiv({ cls: "vault-sync-side-body" });
    this.writeSpans(body, lines);
  }

  private renderEditor(parent: HTMLElement, id: number): void {
    const box = parent.createDiv({ cls: "vault-sync-result" });
    box.createDiv({ cls: "vault-sync-result-label", text: "Edit the text that will be saved" });
    const area = box.createEl("textarea", { cls: "vault-sync-merge-editor" });
    area.value = this.draft;
    area.oninput = () => {
      this.draft = area.value;
    };
    const actions = box.createDiv({ cls: "vault-sync-change-actions" });
    const use = actions.createEl("button", { cls: "mod-cta", text: "Use this text" });
    use.onclick = () => {
      this.custom.set(id, this.draft);
      this.editing = null;
      this.renderText();
    };
    const cancel = actions.createEl("button", { text: "Cancel" });
    cancel.onclick = () => {
      this.editing = null;
      this.renderText();
    };
  }

  private renderCustom(parent: HTMLElement, text: string): void {
    const box = parent.createDiv({ cls: "vault-sync-result" });
    box.createDiv({ cls: "vault-sync-result-label", text: "Text that will be saved" });
    if (text.length === 0) {
      box.createDiv({ cls: "vault-sync-side-empty", text: "These lines will be left out." });
      return;
    }
    const body = box.createDiv({ cls: "vault-sync-side-body" });
    this.writeLines(body, text);
  }

  private savedCaption(row: DiffRow, choice: ApplyChoice | undefined, edited: boolean, editing: boolean): string | null {
    if (editing || edited || !choice) return null;
    if (choice.local && choice.remote) return "Saving this device's text, then Dropbox's text.";
    if (choice.local) return "Saving the text from this device.";
    if (choice.remote) return "Saving the text from Dropbox.";
    return row.local.length > 0 || row.remote.length > 0 ? "These lines will be left out." : null;
  }

  private writeLines(parent: HTMLElement, text: string): void {
    const lines = text.length === 0 ? [] : text.split("\n");
    if (lines.length === 0) {
      parent.createDiv({ cls: "vault-sync-side-empty", text: "Nothing on this side" });
      return;
    }
    for (const line of lines) {
      const row = parent.createDiv({ cls: "vault-sync-side-line" });
      if (line.length === 0) row.addClass("is-blank");
      else row.setText(line);
    }
  }

  private writeSpans(parent: HTMLElement, lines: TextSpan[][]): void {
    if (lines.length === 0) {
      parent.createDiv({ cls: "vault-sync-side-empty", text: "Nothing on this side" });
      return;
    }
    for (const spans of lines) {
      const row = parent.createDiv({ cls: "vault-sync-side-line" });
      if (spans.length === 0 || spans.every((span) => span.text.length === 0)) {
        row.addClass("is-blank");
        continue;
      }
      for (const span of spans) {
        const node = row.createSpan({ text: span.text });
        if (span.strong) node.addClass("is-strong");
      }
    }
  }

  private choiceButton(parent: HTMLElement, text: string, on: boolean, action: () => void): void {
    const button = parent.createEl("button", { text });
    if (on) button.addClass("is-on");
    button.onclick = action;
  }

  private choose(id: number, choice: ApplyChoice): void {
    this.editing = null;
    this.applied.set(id, choice);
    this.custom.delete(id);
    this.renderText();
  }

  private toggleKept(row: DiffRow, on: boolean): void {
    this.editing = null;
    this.applied.set(row.id, hunkShape(row) === "remote-only" ? { local: false, remote: on } : { local: on, remote: false });
    this.custom.delete(row.id);
    this.renderText();
  }

  private startEdit(row: DiffRow): void {
    if (this.editing === row.id) return;
    const choice = this.applied.get(row.id) ?? { local: true, remote: true };
    this.draft = this.custom.get(row.id) ?? hunkText(row, choice.local || choice.remote ? choice : { local: true, remote: true });
    this.editing = row.id;
    this.focusEdit = true;
    this.renderText();
  }

  private keepDisagreements(choice: ApplyChoice): void {
    this.editing = null;
    for (const row of this.rows) {
      if (hunkShape(row) !== "both") continue;
      this.applied.set(row.id, { ...choice });
      this.custom.delete(row.id);
    }
    this.renderText();
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

  private renderSideChoice(message: string, local: ArrayBuffer | null, remote: ArrayBuffer | null): void {
    this.mode = "binary";
    this.binary = null;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("p", { cls: "vault-sync-merge-summary", text: message });
    const sides = contentEl.createDiv({ cls: "vault-sync-change-sides vault-sync-file-choice" });
    const choose = (bytes: ArrayBuffer, button: HTMLButtonElement): void => {
      this.binary = bytes;
      for (const item of Array.from(sides.querySelectorAll<HTMLButtonElement>("button"))) item.removeClass("is-on");
      button.addClass("is-on");
      const save = contentEl.querySelector<HTMLButtonElement>(".vault-sync-binary-save");
      if (save) save.disabled = false;
    };
    if (local) {
      const side = sides.createDiv({ cls: "vault-sync-side is-local" });
      side.createDiv({ cls: "vault-sync-side-label", text: "This device" });
      side.createDiv({ cls: "vault-sync-side-empty", text: "Keep the copy stored on this device." });
      const keep = side.createEl("button", { text: "Keep this device" });
      keep.onclick = () => choose(local, keep);
    }
    if (remote) {
      const side = sides.createDiv({ cls: "vault-sync-side is-remote" });
      side.createDiv({ cls: "vault-sync-side-label", text: "Dropbox" });
      side.createDiv({ cls: "vault-sync-side-empty", text: "Keep the copy stored in Dropbox." });
      const keep = side.createEl("button", { text: "Keep Dropbox" });
      keep.onclick = () => choose(remote, keep);
    }
    const footer = contentEl.createDiv({ cls: "vault-sync-merge-footer" });
    const apply = footer.createDiv({ cls: "vault-sync-merge-nav" });
    const save = apply.createEl("button", { cls: "mod-cta vault-sync-binary-save", text: "Apply" });
    save.disabled = true;
    save.onclick = () => {
      void this.save();
    };
    const cancel = apply.createEl("button", { text: "Cancel" });
    cancel.onclick = () => this.close();
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
