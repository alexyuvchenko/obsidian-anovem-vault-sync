import { requestUrl, type RequestUrlParam, type RequestUrlResponse } from "obsidian";
import { normalizeAppKey } from "./app-key";
import { codeChallenge, randomVerifier } from "./hash";
import { fromDropboxPath, headerJson, listPath } from "./paths";
import type { RemoteFile, Settings } from "./types";

const CHUNK = 8 * 1024 * 1024;

interface UploadCommit {
  path: string;
  mode: "add" | "overwrite" | { update: string };
}

export class DropboxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DropboxError";
  }
}

export class DropboxClient {
  constructor(
    private readonly settings: Settings,
    private readonly save: () => Promise<void>,
  ) {}

  authorizationUrl = async (): Promise<string> => {
    const key = this.readAppKey();
    const verifier = randomVerifier();
    this.settings.codeVerifier = verifier;
    await this.save();
    const challenge = await codeChallenge(verifier);
    const params = new URLSearchParams({
      client_id: key,
      response_type: "code",
      token_access_type: "offline",
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
  };

  exchangeCode = async (code: string): Promise<void> => {
    const verifier = this.settings.codeVerifier;
    if (!verifier) throw new DropboxError("Open the Dropbox authorization page again, then paste the new code.");
    const body = new URLSearchParams({
      code: code.trim(),
      grant_type: "authorization_code",
      client_id: this.readAppKey(),
      code_verifier: verifier,
    });
    const token = await this.tokenRequest(body);
    if (!token.refresh_token) {
      throw new DropboxError("Dropbox did not return a refresh token. Open the authorization page again.");
    }
    this.settings.refreshToken = token.refresh_token;
    this.settings.accessToken = token.access_token;
    this.settings.accessTokenExpiresAt = Date.now() + token.expires_in * 1000;
    this.settings.codeVerifier = "";
    this.settings.accountEmail = await this.accountEmail();
    await this.save();
  };

  disconnect = async (): Promise<void> => {
    this.settings.refreshToken = "";
    this.settings.accessToken = "";
    this.settings.accessTokenExpiresAt = 0;
    this.settings.codeVerifier = "";
    this.settings.accountEmail = "";
    await this.save();
  };

  listFiles = async (folder: string): Promise<{ missing: boolean; files: RemoteFile[] }> => {
    const first = await this.rpc("files/list_folder", {
      path: listPath(folder),
      recursive: true,
      include_deleted: false,
      include_mounted_folders: true,
      limit: 2000,
    });
    if (first.missing) return { missing: true, files: [] };
    const files: RemoteFile[] = [];
    let page = first.body as ListPage;
    for (;;) {
      for (const entry of page.entries) {
        if (entry[".tag"] !== "file") continue;
        const relativePath = fromDropboxPath(folder, entry.path_display);
        if (relativePath === null) continue;
        files.push({
          relativePath,
          dropboxPath: entry.path_display,
          rev: entry.rev,
          size: entry.size,
        });
      }
      if (!page.has_more) break;
      const next = await this.rpc("files/list_folder/continue", { cursor: page.cursor });
      if (next.missing) throw new DropboxError("Dropbox folder listing ended early.");
      page = next.body as ListPage;
    }
    return { missing: false, files };
  };

  download = async (dropboxPath: string): Promise<{ bytes: ArrayBuffer; rev: string; size: number }> => {
    const res = await this.content("files/download", { path: dropboxPath });
    if (res.status === 409 && isNotFound(res.text)) throw new DropboxError("missing");
    if (res.status < 200 || res.status >= 300) throw new DropboxError(errorText(res.text, res.status));
    const meta = JSON.parse(header(res, "dropbox-api-result") || "{}") as { rev?: string; size?: number };
    if (meta.rev) {
      return { bytes: res.arrayBuffer, rev: meta.rev, size: meta.size ?? res.arrayBuffer.byteLength };
    }
    const found = await this.metadata(dropboxPath);
    if (!found) throw new DropboxError("Dropbox download did not return a revision.");
    return { bytes: res.arrayBuffer, rev: found.rev, size: found.size };
  };

  metadata = async (
    dropboxPath: string,
  ): Promise<{ rev: string; size: number; pathDisplay: string } | null> => {
    const res = await this.rpc("files/get_metadata", { path: dropboxPath });
    if (res.missing) return null;
    const body = res.body as { ".tag"?: string; rev?: string; size?: number; path_display?: string };
    if (body[".tag"] !== "file" || !body.rev || !body.path_display) return null;
    return { rev: body.rev, size: body.size ?? 0, pathDisplay: body.path_display };
  };

  upload = async (
    dropboxPath: string,
    bytes: ArrayBuffer,
    mode: UploadCommit["mode"],
  ): Promise<{ conflict: true } | { conflict: false; rev: string; size: number }> => {
    const commit: UploadCommit = { path: dropboxPath, mode };
    const result = bytes.byteLength <= CHUNK
      ? await this.simpleUpload(commit, bytes)
      : await this.sessionUpload(commit, bytes);
    return result;
  };

  private simpleUpload = async (
    commit: UploadCommit,
    bytes: ArrayBuffer,
  ): Promise<{ conflict: true } | { conflict: false; rev: string; size: number }> => {
    const res = await this.content("files/upload", uploadArg(commit), bytes);
    return readUpload(res);
  };

  private sessionUpload = async (
    commit: UploadCommit,
    bytes: ArrayBuffer,
  ): Promise<{ conflict: true } | { conflict: false; rev: string; size: number }> => {
    const chunks: ArrayBuffer[] = [];
    for (let offset = 0; offset < bytes.byteLength; offset += CHUNK) {
      chunks.push(bytes.slice(offset, Math.min(offset + CHUNK, bytes.byteLength)));
    }
    const started = await this.content("files/upload_session/start", { close: false }, chunks[0]);
    if (started.status < 200 || started.status >= 300) {
      throw new DropboxError(errorText(started.text, started.status));
    }
    const sessionId = (JSON.parse(started.text) as { session_id: string }).session_id;
    let cursor = chunks[0].byteLength;
    for (let i = 1; i < chunks.length - 1; i++) {
      const appended = await this.content(
        "files/upload_session/append_v2",
        { cursor: { session_id: sessionId, offset: cursor }, close: false },
        chunks[i],
      );
      if (appended.status < 200 || appended.status >= 300) {
        throw new DropboxError(errorText(appended.text, appended.status));
      }
      cursor += chunks[i].byteLength;
    }
    const last = chunks[chunks.length - 1];
    const finished = await this.content(
      "files/upload_session/finish",
      {
        cursor: { session_id: sessionId, offset: cursor },
        commit: uploadArg(commit),
      },
      last,
    );
    return readUpload(finished);
  };

  private accountEmail = async (): Promise<string> => {
    const res = await this.rpc("users/get_current_account", null);
    const body = res.body as { email?: string };
    return body.email ?? "";
  };

  private readAppKey = (): string => {
    try {
      const key = normalizeAppKey(this.settings.appKey);
      this.settings.appKey = key;
      return key;
    } catch (error) {
      throw new DropboxError(error instanceof Error ? error.message : String(error));
    }
  };

  private refresh = async (): Promise<void> => {
    if (!this.settings.refreshToken || !this.settings.appKey.trim()) {
      throw new DropboxError("Connect Dropbox in the plugin settings.");
    }
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: this.settings.refreshToken,
      client_id: this.readAppKey(),
    });
    const token = await this.tokenRequest(body);
    if (token.refresh_token) this.settings.refreshToken = token.refresh_token;
    this.settings.accessToken = token.access_token;
    this.settings.accessTokenExpiresAt = Date.now() + token.expires_in * 1000;
    await this.save();
  };

  private accessToken = async (): Promise<string> => {
    if (this.settings.accessToken && this.settings.accessTokenExpiresAt > Date.now() + 120_000) {
      return this.settings.accessToken;
    }
    await this.refresh();
    return this.settings.accessToken;
  };

  private tokenRequest = async (body: URLSearchParams): Promise<TokenResponse> => {
    const res = await requestUrl({
      url: "https://api.dropboxapi.com/oauth2/token",
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      throw: false,
    });
    const parsed = parseJson(res.text) as TokenResponse & { error?: string; error_description?: string };
    if (res.status < 200 || res.status >= 300 || !parsed.access_token) {
      throw new DropboxError(parsed.error_description || parsed.error || `Dropbox authorization failed (${res.status}).`);
    }
    return parsed;
  };

  private rpc = async (
    endpoint: string,
    args: unknown,
  ): Promise<{ missing: boolean; body: unknown }> => {
    const send = async () => {
      const token = await this.accessToken();
      return requestUrl({
        url: `https://api.dropboxapi.com/2/${endpoint}`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: args === null ? "null" : JSON.stringify(args),
        throw: false,
      });
    };
    const res = await this.withRetry(send);
    if (res.status === 409 && isNotFound(res.text)) return { missing: true, body: null };
    if (res.status < 200 || res.status >= 300) throw new DropboxError(errorText(res.text, res.status));
    return { missing: false, body: parseJson(res.text) };
  };

  private content = async (
    endpoint: string,
    arg: unknown,
    body?: ArrayBuffer,
  ): Promise<RequestUrlResponse> => {
    const send = async () => {
      const token = await this.accessToken();
      const payload: RequestUrlParam = {
        url: `https://content.dropboxapi.com/2/${endpoint}`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
          "Dropbox-API-Arg": headerJson(arg),
        },
        throw: false,
      };
      if (body !== undefined) payload.body = body;
      return requestUrl(payload);
    };
    return this.withRetry(send);
  };

  private withRetry = async (send: () => Promise<RequestUrlResponse>): Promise<RequestUrlResponse> => {
    let delay = 1000;
    let refreshed = false;
    let res = await send();
    for (let attempt = 0; attempt < 3; attempt++) {
      if (res.status === 401 && !refreshed) {
        refreshed = true;
        await this.refresh();
        res = await send();
        continue;
      }
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(header(res, "retry-after"));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : delay);
        delay *= 2;
        res = await send();
        continue;
      }
      return res;
    }
    return res;
  };
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

interface ListEntry {
  ".tag": string;
  path_display: string;
  rev: string;
  size: number;
}

interface ListPage {
  entries: ListEntry[];
  cursor: string;
  has_more: boolean;
}

function uploadArg(commit: UploadCommit): Record<string, unknown> {
  const mode = commit.mode === "add" || commit.mode === "overwrite"
    ? { ".tag": commit.mode }
    : { ".tag": "update", update: commit.mode.update };
  return {
    path: commit.path,
    mode,
    autorename: false,
    mute: true,
    strict_conflict: false,
  };
}

function readUpload(
  res: RequestUrlResponse,
): { conflict: true } | { conflict: false; rev: string; size: number } {
  if (res.status === 409 && res.text.includes("conflict")) return { conflict: true };
  if (res.status < 200 || res.status >= 300) throw new DropboxError(errorText(res.text, res.status));
  const meta = parseJson(res.text) as { rev?: string; size?: number };
  if (!meta.rev) throw new DropboxError("Dropbox upload did not return a revision.");
  return { conflict: false, rev: meta.rev, size: meta.size ?? 0 };
}

function parseJson(text: string): unknown {
  if (!text) return {};
  return JSON.parse(text) as unknown;
}

function isNotFound(text: string): boolean {
  return text.includes("not_found");
}

function errorText(text: string, status: number): string {
  const parsed = text ? safeParse(text) : null;
  if (parsed && typeof parsed === "object") {
    const record = parsed as { error_summary?: string; error_description?: string };
    if (record.error_summary) return record.error_summary;
    if (record.error_description) return record.error_description;
  }
  return text || `Dropbox request failed (${status}).`;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function header(res: RequestUrlResponse, name: string): string | undefined {
  const want = name.toLowerCase();
  for (const key of Object.keys(res.headers)) {
    if (key.toLowerCase() === want) return res.headers[key];
  }
  return undefined;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
