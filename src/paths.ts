import type { ConflictKind } from "./types";

export function normalizeRelative(value: string): string {
  return value.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
}

export function pathKey(value: string): string {
  return normalizeRelative(value).toLowerCase();
}

export function normalizeDropboxFolder(input: string): string {
  const trimmed = input.trim().replace(/\\/g, "/");
  if (!trimmed) throw new Error("Set the Dropbox folder.");
  if (trimmed === "/") return "/";
  const parts = trimmed.split("/").filter((part) => part.length > 0);
  if (parts.some((part) => part === "." || part === "..")) {
    throw new Error("Dropbox folder cannot contain . or ..");
  }
  return `/${parts.join("/")}`;
}

export function listPath(folder: string): string {
  return folder === "/" ? "" : folder;
}

export function syncVaultFolder(root: string, vaultName: string): string {
  const parent = normalizeDropboxFolder(root);
  const name = vaultName.replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim() || "vault";
  return parent === "/" ? `/${name}` : `${parent}/${name}`;
}

export function toDropboxPath(root: string, relativePath: string): string {
  const rel = normalizeRelative(relativePath);
  const base = normalizeDropboxFolder(root);
  if (base === "/") return `/${rel}`;
  return rel ? `${base}/${rel}` : base;
}

export function fromDropboxPath(root: string, pathDisplay: string): string | null {
  const full = pathDisplay.startsWith("/") ? pathDisplay : `/${pathDisplay}`;
  const base = normalizeDropboxFolder(root);
  if (base === "/") {
    const rel = full.slice(1);
    return rel.length > 0 ? rel : null;
  }
  if (full.toLowerCase() === base.toLowerCase()) return null;
  const prefix = `${base.toLowerCase()}/`;
  if (!full.toLowerCase().startsWith(prefix)) return null;
  return full.slice(base.length + 1);
}

export function normalizeAttachmentsFolder(input: string): string {
  let folder = normalizeRelative(input);
  if (folder.startsWith("./")) folder = folder.slice(2);
  const parts = folder.split("/").filter((part) => part.length > 0);
  if (parts.length === 0 || parts.some((part) => part === "." || part === ".." || part.startsWith("."))) {
    throw new Error("Set the attachments folder to a folder inside the vault.");
  }
  return parts.join("/");
}

export function isIncluded(relativePath: string, attachmentsFolder: string): boolean {
  const path = normalizeRelative(relativePath);
  if (!path) return false;
  const parts = path.split("/");
  if (parts.some((part) => part.length === 0 || part.startsWith(".") || part === "..")) return false;
  if (path.toLowerCase().endsWith(".md")) return true;
  const folder = normalizeRelative(attachmentsFolder);
  if (!folder || folder === "." || folder.split("/").some((part) => part === "." || part === "..")) {
    return false;
  }
  return path.toLowerCase().startsWith(`${folder.toLowerCase()}/`);
}

export function headerJson(value: unknown): string {
  return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (ch) => {
    return `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

export function conflictText(kind: ConflictKind): string {
  if (kind === "both-changed") {
    return "Changed on this device and in Dropbox. Review keeps lines that exist on only one side, then asks where both sides changed.";
  }
  if (kind === "deleted-local") {
    return "This file is not on this device, and it is still in Dropbox. Review can restore the Dropbox copy.";
  }
  return "This file is on this device and not in Dropbox. Review can send this copy.";
}
