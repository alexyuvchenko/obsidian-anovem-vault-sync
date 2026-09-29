import type { App } from "obsidian";
import { normalizeAttachmentsFolder } from "./paths";

export async function configuredAttachmentFolder(app: App): Promise<string> {
  try {
    const raw = await app.vault.adapter.read(`${app.vault.configDir}/app.json`);
    const parsed = JSON.parse(raw) as { attachmentFolderPath?: unknown };
    if (typeof parsed.attachmentFolderPath !== "string") return "";
    return normalizeAttachmentsFolder(parsed.attachmentFolderPath);
  } catch {
    return "";
  }
}
