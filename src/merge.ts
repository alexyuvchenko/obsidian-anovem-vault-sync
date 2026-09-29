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

export function textFromChoices(
  rows: DiffRow[],
  choices: ReadonlyMap<number, "local" | "remote">,
  custom?: ReadonlyMap<number, string>,
): string {
  const lines: string[] = [];
  for (const row of rows) {
    if (row.kind === "change" && custom?.has(row.id)) {
      const edited = custom.get(row.id) ?? "";
      if (edited.length > 0) lines.push(edited);
      continue;
    }
    const picked = row.kind === "change" && choices.get(row.id) === "remote" ? row.remote : row.local;
    if (row.kind === "same") lines.push(row.local);
    else if (picked.length > 0) lines.push(picked);
  }
  return lines.join("\n");
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
