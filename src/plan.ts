import type { ConflictKind, ConflictMode } from "./types";

export type Presence = "absent" | "unchanged" | "changed" | "untracked";

export type Plan =
  | { action: "skip" }
  | { action: "upload" }
  | { action: "download" }
  | { action: "adopt" }
  | { action: "compare" }
  | { action: "forget" }
  | { action: "merge" }
  | { action: "rename" }
  | { action: "trash-local" }
  | { action: "trash-remote" }
  | { action: "conflict"; kind: ConflictKind };

export function planSync(local: Presence, remote: Presence, mode: ConflictMode = "review", initial = false): Plan {
  if (local === "absent" && remote === "absent") return { action: "forget" };
  if (mode === "merge" && initial && local !== "absent") return { action: "upload" };
  if (mode === "merge" && initial && remote !== "absent") return { action: "download" };
  if (local === "untracked" && remote === "absent") return { action: "upload" };
  if (local === "absent" && remote === "untracked") return { action: "download" };
  if (local === "untracked") return { action: "compare" };
  if (remote === "untracked") return { action: "compare" };
  if (local === "unchanged" && remote === "unchanged") return { action: "skip" };
  if (local === "changed" && remote === "unchanged") return { action: "upload" };
  if (local === "unchanged" && remote === "changed") return { action: "download" };
  if (local === "changed" && remote === "changed") return mode === "merge" ? { action: "merge" } : { action: "compare" };
  if (mode === "merge" && local === "absent" && remote === "unchanged") return { action: "trash-remote" };
  if (mode === "merge" && local === "unchanged" && remote === "absent") return { action: "trash-local" };
  if (local === "absent") return { action: "conflict", kind: "deleted-local" };
  return { action: "conflict", kind: "deleted-remote" };
}

export function planRename(matches: number, oldRemoteUnchanged: boolean, newRemoteExists: boolean): boolean {
  return matches === 1 && oldRemoteUnchanged && !newRemoteExists;
}

export function planAfterCompare(equal: boolean): Plan {
  if (equal) return { action: "adopt" };
  return { action: "conflict", kind: "both-changed" };
}

export interface ConflictSnapshot {
  localHash: string | null;
  remoteRev: string | null;
}

export type ManualAction = "hold" | "upload" | "download" | "forget" | "compare";

export function planManualResolution(
  snapshot: ConflictSnapshot,
  localHash: string | null,
  remoteRev: string | null,
): ManualAction {
  if (localHash === null && remoteRev === null) return "forget";
  const localSame = localHash === snapshot.localHash;
  const remoteSame = remoteRev === snapshot.remoteRev;
  if (localSame && remoteSame) return "hold";
  if (!localSame && remoteSame) {
    if (localHash === null) return "hold";
    return "upload";
  }
  if (localSame && !remoteSame) {
    if (remoteRev === null || localHash === null) return "hold";
    return "download";
  }
  if (localHash === null || remoteRev === null) return "hold";
  return "compare";
}
