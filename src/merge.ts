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

export function textFromChoices(rows: DiffRow[], choices: ReadonlyMap<number, "local" | "remote">): string {
  const lines: string[] = [];
  for (const row of rows) {
    const picked = row.kind === "change" && choices.get(row.id) === "remote" ? row.remote : row.local;
    if (row.kind === "same") lines.push(row.local);
    else if (picked.length > 0) lines.push(picked);
  }
  return lines.join("\n");
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
