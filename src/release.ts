export const RELEASE_REPO = "alexyuvchenko/obsidian-vault-anovem-sync";

export const PLUGIN_FILES = ["manifest.json", "main.js", "styles.css"] as const;

export type PluginFile = (typeof PLUGIN_FILES)[number];

export interface ReleasePlan {
  version: string;
  current: string;
  files: Record<PluginFile, string>;
}

export function compareVersions(left: string, right: string): number {
  const a = versionParts(left);
  const b = versionParts(right);
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function parseLatestRelease(body: unknown, current: string): ReleasePlan | null {
  if (!body || typeof body !== "object") throw new Error("GitHub did not return a release.");
  const release = body as { tag_name?: unknown; assets?: unknown };
  const version = versionLabel(release.tag_name);
  if (!version) throw new Error("GitHub release has no version.");
  if (compareVersions(version, current) <= 0) return null;
  if (!Array.isArray(release.assets)) throw new Error("GitHub release has no plugin files.");
  const files = {} as Record<PluginFile, string>;
  for (const name of PLUGIN_FILES) {
    const asset = release.assets.find((item) => {
      return !!item && typeof item === "object" && (item as { name?: unknown }).name === name;
    }) as { browser_download_url?: unknown } | undefined;
    const url = asset?.browser_download_url;
    if (typeof url !== "string" || !url.startsWith("https://")) {
      throw new Error(`GitHub release is missing ${name}.`);
    }
    files[name] = url;
  }
  return { version, current, files };
}

function versionLabel(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^v/i, "");
}

function versionParts(value: string): number[] {
  return versionLabel(value).split(".").map((part) => {
    const match = /^(\d+)/.exec(part);
    return match ? Number(match[1]) : 0;
  });
}
