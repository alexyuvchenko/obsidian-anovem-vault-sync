export interface DiffRow {
  kind: "same" | "change";
  id: number;
  local: string;
  remote: string;
}

export function decodeUtf8(bytes: ArrayBuffer): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function diffRows(local: string, remote: string): DiffRow[] {
  const left = local === "" ? [] : local.split("\n");
  const right = remote === "" ? [] : remote.split("\n");
  if (left.length * right.length > 250_000) {
    return [{ kind: "change", id: 0, local, remote }];
  }
  const ops = lineOps(left, right);
  const rows: DiffRow[] = [];
  let id = 0;
  let index = 0;
  while (index < ops.length) {
    const op = ops[index];
    if (op.tag === "same") {
      rows.push({ kind: "same", id: id++, local: op.line, remote: op.line });
      index += 1;
      continue;
    }
    const localLines: string[] = [];
    const remoteLines: string[] = [];
    while (index < ops.length && ops[index].tag !== "same") {
      if (ops[index].tag === "local") localLines.push(ops[index].line);
      else remoteLines.push(ops[index].line);
      index += 1;
    }
    rows.push({
      kind: "change",
      id: id++,
      local: localLines.join("\n"),
      remote: remoteLines.join("\n"),
    });
  }
  return rows;
}

export function mergeBlocks(rows: DiffRow[]): DiffRow[] {
  const grouped: DiffRow[] = [];
  for (const row of rows) {
    const prev = grouped[grouped.length - 1];
    if (row.kind === "same" && prev?.kind === "same") {
      prev.local = `${prev.local}\n${row.local}`;
      prev.remote = prev.local;
      continue;
    }
    grouped.push({ ...row });
  }
  const blocks: DiffRow[] = [];
  let index = 0;
  while (index < grouped.length) {
    if (!isTableBlock(grouped[index])) {
      blocks.push(grouped[index]);
      index += 1;
      continue;
    }
    const run: DiffRow[] = [];
    while (index < grouped.length && isTableBlock(grouped[index])) {
      run.push(grouped[index]);
      index += 1;
    }
    blocks.push(combineBlocks(run));
  }
  return blocks;
}

export interface TextSpan {
  text: string;
  strong: boolean;
}

export interface MergeLine {
  hunk: number | null;
  from: "same" | "local" | "remote";
  text: string;
  spans: TextSpan[];
}

export function mergeLines(rows: DiffRow[]): MergeLine[] {
  const lines: MergeLine[] = [];
  for (const row of rows) {
    if (row.kind === "same") {
      lines.push({ hunk: null, from: "same", text: row.local, spans: [{ text: row.local, strong: false }] });
      continue;
    }
    const localLines = splitBlock(row.local);
    const remoteLines = splitBlock(row.remote);
    localLines.forEach((text, index) => {
      lines.push({ hunk: row.id, from: "local", text, spans: changedSpans(text, remoteLines[index]) });
    });
    remoteLines.forEach((text, index) => {
      lines.push({ hunk: row.id, from: "remote", text, spans: changedSpans(text, localLines[index]) });
    });
  }
  return lines;
}

export type HunkShape = "local-only" | "remote-only" | "both";

export function hunkShape(row: DiffRow): HunkShape | null {
  if (row.kind !== "change") return null;
  if (row.local.length > 0 && row.remote.length === 0) return "local-only";
  if (row.remote.length > 0 && row.local.length === 0) return "remote-only";
  return "both";
}

export function seedChoices(rows: DiffRow[]): Map<number, ApplyChoice> {
  const applied = new Map<number, ApplyChoice>();
  for (const row of rows) {
    const shape = hunkShape(row);
    if (shape === "local-only") applied.set(row.id, { local: true, remote: false });
    if (shape === "remote-only") applied.set(row.id, { local: false, remote: true });
  }
  return applied;
}

export function pendingHunks(
  rows: DiffRow[],
  applied: ReadonlyMap<number, ApplyChoice>,
  custom: ReadonlyMap<number, string>,
): DiffRow[] {
  return rows.filter((row) => row.kind === "change" && !applied.has(row.id) && !custom.has(row.id));
}

export function hunkLabel(row: DiffRow, choice: ApplyChoice | undefined, edited: boolean): string {
  if (edited) return "Edited";
  const shape = hunkShape(row);
  if (shape === "local-only") return choice?.local === false ? "Left out" : "Kept";
  if (shape === "remote-only") return choice?.remote === false ? "Left out" : "Kept";
  if (!choice) return "Needs a choice";
  if (choice.local && choice.remote) return "Both kept";
  if (choice.local) return "Kept from this device";
  if (choice.remote) return "Kept from Dropbox";
  return "Left out";
}

export type DisplayLine =
  | { kind: "line"; line: MergeLine; index: number }
  | { kind: "fold"; id: number; count: number };

export function foldContext(lines: MergeLine[], context = 2, open: ReadonlySet<number> = new Set()): DisplayLine[] {
  const visible = lines.map(() => false);
  lines.forEach((line, index) => {
    if (line.hunk === null) return;
    for (let cursor = Math.max(0, index - context); cursor <= Math.min(lines.length - 1, index + context); cursor += 1) {
      visible[cursor] = true;
    }
  });
  const display: DisplayLine[] = [];
  let index = 0;
  while (index < lines.length) {
    if (visible[index]) {
      display.push({ kind: "line", line: lines[index], index });
      index += 1;
      continue;
    }
    const start = index;
    while (index < lines.length && !visible[index]) index += 1;
    if (open.has(start)) {
      for (let cursor = start; cursor < index; cursor += 1) display.push({ kind: "line", line: lines[cursor], index: cursor });
    } else {
      display.push({ kind: "fold", id: start, count: index - start });
    }
  }
  return display;
}

export interface WordMerge {
  text: string;
  overlap: boolean;
}

export function mergeWords(base: string, local: string, remote: string): WordMerge {
  if (local === remote) return { text: local, overlap: false };
  const baseWords = wordTokens(base);
  const localWords = wordTokens(local);
  const remoteWords = wordTokens(remote);
  if (withinMergeLimit(baseWords, localWords) && withinMergeLimit(baseWords, remoteWords)) {
    return mergePieces(baseWords, localWords, remoteWords, "");
  }
  const baseLines = linePieces(base);
  const localLines = linePieces(local);
  const remoteLines = linePieces(remote);
  if (!withinMergeLimit(baseLines, localLines) || !withinMergeLimit(baseLines, remoteLines)) {
    return { text: local, overlap: true };
  }
  return mergePieces(baseLines, localLines, remoteLines, "\n");
}

function withinMergeLimit(before: string[], after: string[]): boolean {
  return before.length * Math.max(after.length, 1) <= 1_000_000;
}

export function blockLines(local: string, remote: string): { local: TextSpan[][]; remote: TextSpan[][] } {
  const left = splitBlock(local);
  const right = splitBlock(remote);
  return {
    local: left.map((line, index) => changedSpans(line, right[index])),
    remote: right.map((line, index) => changedSpans(line, left[index])),
  };
}

export function changedSpans(line: string, other: string | undefined): TextSpan[] {
  if (line.length === 0) return [];
  if (other === undefined || other.length === 0) return [{ text: line, strong: true }];
  if (line === other) return [{ text: line, strong: false }];
  const left = tokens(line);
  const right = tokens(other);
  if (left.length * right.length > 20_000) return [{ text: line, strong: true }];
  const spans: TextSpan[] = [];
  for (const op of lineOps(left, right)) {
    if (op.tag === "remote") continue;
    const strong = op.tag === "local";
    const prev = spans[spans.length - 1];
    if (prev && prev.strong === strong) prev.text += op.line;
    else spans.push({ text: op.line, strong });
  }
  return spans.length > 0 ? spans : [{ text: line, strong: true }];
}

function tokens(value: string): string[] {
  return wordTokens(value);
}

function wordTokens(value: string): string[] {
  if (value.length === 0) return [];
  return value.split(/(\s+)/).filter((part) => part.length > 0);
}

function linePieces(value: string): string[] {
  if (value.length === 0) return [];
  return value.split("\n");
}

interface PieceEdit {
  start: number;
  end: number;
  pieces: string[];
  side: "local" | "remote";
}

function mergePieces(base: string[], local: string[], remote: string[], joiner: string): WordMerge {
  const edits = [
    ...pieceEdits(base, local, "local"),
    ...pieceEdits(base, remote, "remote"),
  ].sort((a, b) => a.start - b.start || a.end - b.end || (a.side === "local" ? -1 : 1));
  const clusters: PieceEdit[][] = [];
  for (const edit of edits) {
    const current = clusters[clusters.length - 1];
    if (!current || !current.some((item) => piecesOverlap(item, edit))) clusters.push([edit]);
    else current.push(edit);
  }
  const out: string[] = [];
  let cursor = 0;
  let overlap = false;
  for (const cluster of clusters) {
    const start = Math.min(...cluster.map((edit) => edit.start));
    const end = Math.max(...cluster.map((edit) => edit.end));
    out.push(...base.slice(cursor, start));
    const locals = cluster.filter((edit) => edit.side === "local");
    const remotes = cluster.filter((edit) => edit.side === "remote");
    if (locals.length > 0 && remotes.length > 0) overlap = true;
    out.push(...applyPieces(base, locals.length > 0 ? locals : remotes, start, end));
    cursor = end;
  }
  out.push(...base.slice(cursor));
  return { text: out.join(joiner), overlap };
}

function pieceEdits(before: string[], after: string[], side: "local" | "remote"): PieceEdit[] {
  const ops = lineOps(before, after);
  const edits: PieceEdit[] = [];
  let baseIndex = 0;
  let index = 0;
  while (index < ops.length) {
    if (ops[index].tag === "same") {
      baseIndex += 1;
      index += 1;
      continue;
    }
    const start = baseIndex;
    const pieces: string[] = [];
    while (index < ops.length && ops[index].tag !== "same") {
      if (ops[index].tag === "local") baseIndex += 1;
      else pieces.push(ops[index].line);
      index += 1;
    }
    edits.push({ start, end: baseIndex, pieces, side });
  }
  return edits;
}

function piecesOverlap(a: PieceEdit, b: PieceEdit): boolean {
  if (a.start === a.end && b.start === b.end) return a.start === b.start;
  return a.start < b.end && b.start < a.end;
}

function applyPieces(base: string[], edits: PieceEdit[], start: number, end: number): string[] {
  const out: string[] = [];
  let cursor = start;
  for (const edit of [...edits].sort((a, b) => a.start - b.start)) {
    if (edit.start < cursor) continue;
    out.push(...base.slice(cursor, edit.start));
    out.push(...edit.pieces);
    cursor = edit.end;
  }
  out.push(...base.slice(cursor, end));
  return out;
}

function splitBlock(text: string): string[] {
  if (text.length === 0) return [];
  return text.split("\n");
}

export interface ApplyChoice {
  local: boolean;
  remote: boolean;
}

export function textFromChoices(
  rows: DiffRow[],
  choices: ReadonlyMap<number, "local" | "remote">,
  custom?: ReadonlyMap<number, string>,
): string {
  const applied = new Map<number, ApplyChoice>();
  for (const [id, side] of choices) applied.set(id, { local: side !== "remote", remote: side === "remote" });
  return textFromApplied(rows, applied, custom);
}

export function textFromApplied(
  rows: DiffRow[],
  applied: ReadonlyMap<number, ApplyChoice>,
  custom?: ReadonlyMap<number, string>,
): string {
  const lines: string[] = [];
  for (const row of rows) {
    if (row.kind === "same") {
      lines.push(row.local);
      continue;
    }
    if (custom?.has(row.id)) {
      const edited = custom.get(row.id) ?? "";
      if (edited.length > 0) lines.push(edited);
      continue;
    }
    const choice = applied.get(row.id) ?? { local: true, remote: false };
    if (choice.local && row.local.length > 0) lines.push(row.local);
    if (choice.remote && row.remote.length > 0) lines.push(row.remote);
  }
  return lines.join("\n");
}

export function hunkText(row: DiffRow, choice: ApplyChoice): string {
  const parts: string[] = [];
  if (choice.local && row.local.length > 0) parts.push(row.local);
  if (choice.remote && row.remote.length > 0) parts.push(row.remote);
  return parts.join("\n");
}

function isTableBlock(row: DiffRow): boolean {
  return `${row.local}\n${row.remote}`.split("\n").some((line) => /^\s*\|/.test(line));
}

function combineBlocks(rows: DiffRow[]): DiffRow {
  const changed = rows.find((row) => row.kind === "change");
  return {
    kind: changed ? "change" : "same",
    id: changed?.id ?? rows[0].id,
    local: rows.map((row) => row.local).filter((text) => text.length > 0).join("\n"),
    remote: rows.map((row) => row.remote).filter((text) => text.length > 0).join("\n"),
  };
}

type LineOp = { tag: "same" | "local" | "remote"; line: string };

function lineOps(left: string[], right: string[]): LineOp[] {
  const rows = left.length;
  const cols = right.length;
  const scores: number[][] = Array.from({ length: rows + 1 }, () => new Array<number>(cols + 1).fill(0));
  for (let i = rows - 1; i >= 0; i--) {
    for (let j = cols - 1; j >= 0; j--) {
      scores[i][j] = left[i] === right[j]
        ? scores[i + 1][j + 1] + 1
        : Math.max(scores[i + 1][j], scores[i][j + 1]);
    }
  }
  const ops: LineOp[] = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < cols) {
    if (left[i] === right[j]) {
      ops.push({ tag: "same", line: left[i] });
      i += 1;
      j += 1;
    } else if (scores[i + 1][j] >= scores[i][j + 1]) {
      ops.push({ tag: "local", line: left[i] });
      i += 1;
    } else {
      ops.push({ tag: "remote", line: right[j] });
      j += 1;
    }
  }
  while (i < rows) ops.push({ tag: "local", line: left[i++] });
  while (j < cols) ops.push({ tag: "remote", line: right[j++] });
  return ops;
}
