export interface Settings {
  appKey: string;
  refreshToken: string;
  accessToken: string;
  accessTokenExpiresAt: number;
  codeVerifier: string;
  accountEmail: string;
  dropboxFolder: string;
  attachmentsFolder: string;
  lastSyncAt: number;
  lastSyncSummary: string;
  backgroundSync: boolean;
  syncIntervalMinutes: number;
  backupFormat: "zip" | "gzip";
  backupFolder: string;
  backupKeepLast: number;
  conflictMode: ConflictMode;
}

export type ConflictMode = "review" | "merge";

export interface FileRecord {
  hash: string;
  size: number;
  mtime: number;
  dropboxRev: string;
}

export type ConflictKind = "both-changed" | "deleted-local" | "deleted-remote";

export interface ConflictItem {
  path: string;
  kind: ConflictKind;
  localHash?: string | null;
  remoteRev?: string | null;
}

export interface SyncState {
  files: Record<string, FileRecord>;
  conflicts: ConflictItem[];
}

export interface PluginData {
  settings: Settings;
  state: SyncState;
}

export const DEFAULT_SETTINGS: Settings = {
  appKey: "",
  refreshToken: "",
  accessToken: "",
  accessTokenExpiresAt: 0,
  codeVerifier: "",
  accountEmail: "",
  dropboxFolder: "/ObsidianAnovem",
  attachmentsFolder: "",
  lastSyncAt: 0,
  lastSyncSummary: "",
  backgroundSync: true,
  syncIntervalMinutes: 5,
  backupFormat: "zip",
  backupFolder: "backups",
  backupKeepLast: 5,
  conflictMode: "review",
};

export function emptyState(): SyncState {
  return { files: {}, conflicts: [] };
}

export interface RemoteFile {
  relativePath: string;
  dropboxPath: string;
  rev: string;
  size: number;
}

export interface SyncReport {
  uploaded: number;
  downloaded: number;
  merged: number;
  renamed: number;
  trashed: number;
  overlaps: string[];
  conflicts: number;
  failed: string[];
  cancelled: boolean;
}
