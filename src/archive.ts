import { Zip, ZipDeflate, gzipSync, gunzipSync, unzipSync } from "fflate";

export type BackupFormat = "zip" | "gzip";

const BLOCK = 512;

export interface ArchiveFile {
  path: string;
  data: Uint8Array;
  mtimeMs: number;
}

export interface ArchiveFolder {
  path: string;
  mtimeMs: number;
}

export function formatTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export function sanitizeVaultName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || "vault";
}

export function backupFileName(date: Date, vaultName: string, format: BackupFormat): string {
  return `${formatTimestamp(date)}_${sanitizeVaultName(vaultName)}.${format}`;
}

export function normalizeBackupFolder(input: string): string {
  const folder = input.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (!folder) return "backups";
  const parts = folder.split("/");
  if (parts.some((part) => part.length === 0 || part === "." || part === "..")) {
    throw new Error("Backup folder must be a folder inside the vault.");
  }
  return parts.join("/");
}

export function isInBackupFolder(path: string, folder: string): boolean {
  const key = path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").toLowerCase();
  const root = folder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!key || !root) return false;
  return key === root || key.startsWith(`${root}/`);
}

export function zipEntries(files: ArchiveFile[], folders: ArchiveFolder[]): Uint8Array {
  const parts: Uint8Array[] = [];
  let failure: Error | null = null;
  const zip = new Zip((error, chunk) => {
    if (error) failure = error instanceof Error ? error : new Error(String(error));
    else if (chunk.length > 0) parts.push(chunk);
  });
  for (const folder of folders) addZip(zip, folderPath(folder.path), new Uint8Array(0), folder.mtimeMs);
  for (const file of files) addZip(zip, file.path, file.data, file.mtimeMs);
  zip.end();
  if (failure) throw failure;
  return concat(parts);
}

export function gzipEntries(files: ArchiveFile[], folders: ArchiveFolder[]): Uint8Array {
  const parts: Uint8Array[] = [];
  for (const folder of folders) parts.push(...tarFolderParts(folder.path, folder.mtimeMs));
  for (const file of files) parts.push(...tarFileParts(file.path, file.data, file.mtimeMs));
  parts.push(tarEnd());
  return gzipBytes(concat(parts));
}

export function readTar(data: Uint8Array): { path: string; data: Uint8Array }[] {
  const files: { path: string; data: Uint8Array }[] = [];
  let offset = 0;
  let longName: string | null = null;
  while (offset + BLOCK <= data.length) {
    const header = data.subarray(offset, offset + BLOCK);
    offset += BLOCK;
    if (isZero(header)) break;
    const size = parseOctal(header.subarray(124, 136));
    const type = String.fromCharCode(header[156]);
    const name = textField(header.subarray(0, 100));
    const prefix = textField(header.subarray(345, 500));
    const content = data.slice(offset, offset + size);
    offset += size + padding(size);
    if (type === "L") {
      const end = content.indexOf(0);
      longName = new TextDecoder().decode(end >= 0 ? content.subarray(0, end) : content);
      continue;
    }
    const path = longName ?? (prefix ? `${prefix}/${name}` : name);
    longName = null;
    if (type === "5") continue;
    files.push({ path, data: content });
  }
  return files;
}

export function roundTripZip(files: ArchiveFile[]): Record<string, Uint8Array> {
  return unzipSync(zipEntries(files, []));
}

export function roundTripGzip(files: ArchiveFile[], folders: ArchiveFolder[] = []): { path: string; data: Uint8Array }[] {
  return readTar(gunzipSync(gzipEntries(files, folders)));
}

function addZip(zip: Zip, path: string, data: Uint8Array, mtimeMs: number): void {
  const entry = new ZipDeflate(path);
  entry.mtime = new Date(mtimeMs);
  zip.add(entry);
  entry.push(data, true);
}

function folderPath(path: string): string {
  return path.endsWith("/") ? path : `${path}/`;
}

function gzipBytes(data: Uint8Array): Uint8Array {
  return gzipSync(data);
}

function tarFileParts(path: string, data: Uint8Array, mtimeMs: number): Uint8Array[] {
  const parts = tarHeaderParts(path, data.length, mtimeMs, "0");
  parts.push(data);
  const extra = padding(data.length);
  if (extra > 0) parts.push(new Uint8Array(extra));
  return parts;
}

function tarFolderParts(path: string, mtimeMs: number): Uint8Array[] {
  const folder = path.endsWith("/") ? path.slice(0, -1) : path;
  return tarHeaderParts(folder, 0, mtimeMs, "5");
}

function tarHeaderParts(path: string, size: number, mtimeMs: number, typeflag: "0" | "5"): Uint8Array[] {
  const located = locateName(path);
  const parts: Uint8Array[] = [];
  if (located.long) parts.push(...longNameParts(path));
  parts.push(header(located.name, located.prefix, size, Math.floor(mtimeMs / 1000), typeflag));
  return parts;
}

function tarEnd(): Uint8Array {
  return new Uint8Array(BLOCK * 2);
}

function locateName(path: string): { name: string; prefix: string; long: boolean } {
  if (byteLength(path) <= 100) return { name: path, prefix: "", long: false };
  const pieces = path.split("/");
  for (let index = pieces.length - 1; index >= 1; index -= 1) {
    const name = pieces.slice(index).join("/");
    const prefix = pieces.slice(0, index).join("/");
    if (byteLength(name) <= 100 && byteLength(prefix) <= 155) return { name, prefix, long: false };
  }
  return { name: shortName(path), prefix: "", long: true };
}

function longNameParts(path: string): Uint8Array[] {
  const content = utf8(`${path}\0`);
  const padded = new Uint8Array(content.length + padding(content.length));
  padded.set(content);
  return [header("././@LongLink", "", content.length, 0, "L"), padded];
}

function header(name: string, prefix: string, size: number, mtimeSec: number, typeflag: string): Uint8Array {
  const block = new Uint8Array(BLOCK);
  writeText(block, 0, name, 100);
  writeOctal(block, 100, 8, 0o644);
  writeOctal(block, 108, 8, 0);
  writeOctal(block, 116, 8, 0);
  writeOctal(block, 124, 12, size);
  writeOctal(block, 136, 12, mtimeSec);
  block.fill(0x20, 148, 156);
  block[156] = typeflag.charCodeAt(0);
  writeText(block, 257, "ustar", 5);
  block[262] = 0;
  block[263] = "0".charCodeAt(0);
  block[264] = "0".charCodeAt(0);
  writeText(block, 345, prefix, 155);
  let sum = 0;
  for (let index = 0; index < BLOCK; index += 1) sum += block[index];
  const checksum = sum.toString(8).padStart(6, "0");
  for (let index = 0; index < 6; index += 1) block[148 + index] = checksum.charCodeAt(index);
  block[154] = 0;
  block[155] = 0x20;
  return block;
}

function shortName(path: string): string {
  const base = path.split("/").pop() || "file";
  let result = "";
  for (const char of base) {
    if (byteLength(result + char) > 100) break;
    result += char;
  }
  return result || "file";
}

function writeText(block: Uint8Array, offset: number, text: string, max: number): void {
  const bytes = utf8(text);
  block.set(bytes.subarray(0, Math.min(bytes.length, max)), offset);
}

function writeOctal(block: Uint8Array, offset: number, length: number, value: number): void {
  const text = Math.max(0, Math.floor(value)).toString(8).padStart(length - 1, "0");
  for (let index = 0; index < length - 1; index += 1) block[offset + index] = text.charCodeAt(index);
  block[offset + length - 1] = 0;
}

function padding(size: number): number {
  return (BLOCK - (size % BLOCK)) % BLOCK;
}

function parseOctal(bytes: Uint8Array): number {
  const text = textField(bytes).trim();
  if (!text) return 0;
  return Number.parseInt(text, 8) || 0;
}

function textField(bytes: Uint8Array): string {
  const end = bytes.indexOf(0);
  return new TextDecoder().decode(end >= 0 ? bytes.subarray(0, end) : bytes);
}

function isZero(bytes: Uint8Array): boolean {
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] !== 0) return false;
  }
  return true;
}

function byteLength(text: string): number {
  return utf8(text).length;
}

function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function concat(parts: Uint8Array[]): Uint8Array {
  let size = 0;
  for (const part of parts) size += part.length;
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
