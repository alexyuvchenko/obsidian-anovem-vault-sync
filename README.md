# Vault Anovem Sync

Obsidian plugin for Mac and iPhone. It syncs Markdown notes and one attachments folder both ways through Dropbox, and it can archive the whole vault to a timestamped file.

The Mac vault can stay on Google Drive. The iPhone vault can stay on iCloud. The plugin reads the open vault and copies files through Dropbox. It does not read the other device's drive.

Requires Obsidian 1.5.0 or newer.

## Install

From a vault that already has the plugin, open settings and click **Install or update**, or run **Install or update plugin from GitHub**. That downloads `manifest.json`, `main.js`, and `styles.css` from the latest [GitHub release](https://github.com/alexyuvchenko/obsidian-vault-anovem-sync/releases), writes them into this vault, and reloads the plugin. Obsidian stays open.

To install into a vault that does not have the plugin yet:

```bash
./scripts/install-release.sh "/path/to/vault"
```

`manifest.json` is the plugin version. `package.json` and `versions.json` must carry the same number. Change it in all three with:

```bash
node scripts/version.mjs 0.2.0
```

That updates `manifest.json`, `package.json`, `versions.json`, and `package-lock.json`, then stages them, commits `Bump version to 0.2.0`, tags the commit `v0.2.0`, and pushes the tag to `origin`. The release workflow rejects any other tag. `npm run version:check` checks the files without a tag.

Reload Obsidian. Turn off Restricted mode and enable **Vault Anovem Sync**.

## Connect Dropbox

Do this once on the Mac and once on the iPhone. Both devices use the same app key, the same Dropbox folder, and the same attachments folder path.

1. Create a Scoped access app in the [Dropbox App Console](https://www.dropbox.com/developers/apps).
2. Open **Permissions**, enable `files.metadata.read`, `files.content.read`, `files.content.write`, and `account_info.read`, then click **Submit**.
3. In the plugin settings, paste only the **App key**. It is 15 characters. Do not paste the App secret or a generated access token.
4. Set **Dropbox folder** to `/ObsidianAnovem` on every device. Each vault is stored in its own subfolder there, named after the vault. The Mac and the iPhone copy of a vault need the same vault name. For an app whose access is limited to its own folder, `/ObsidianAnovem` is inside that app folder.
5. Set **Attachments folder** to a folder inside the vault, such as `attachments`. Use the same path, including capital letters, on every device.
6. Click **Open Dropbox**, approve access, paste the authorization code, and click **Connect**.

## Sync

Sync includes every Markdown note, plus every file inside the attachments folder. Files whose names start with `.` are left out, including `.obsidian`.

Background sync is on by default. While Obsidian is open, the vault syncs every 5 minutes and again when you return to the app. You can keep editing. One run uploads notes changed on this device and downloads notes changed in Dropbox. It does not run after Obsidian is closed. Change the interval, or turn it off, under **Background sync** in the plugin settings.

**Sync both ways** still runs immediately. It is in the command palette, the ↔ icon on the left ribbon, and the plugin settings. **Preview sync** lists the plan and does not write.

Choose **Conflict resolving** in the plugin settings.

**Review** is the default. A file changed on both sides, or removed on only one side, stays in place until you review it.

**Merge** compares this device, Dropbox, and the last version both sides agreed on. The first sync in this mode uploads this vault and downloads files that exist only in Dropbox. Later syncs transfer only what changed.

| This device | Dropbox | Merge result |
| --- | --- | --- |
| New or edited | Unchanged | Uploaded |
| Unchanged | New or edited | Downloaded |
| Same content on both, first sync | Same content | Uploaded |
| Changed on both | Changed | Merged word by word. Where both sides changed the same words, this device is kept and the summary says so |
| Renamed here, same bytes | Unchanged at the old path | Renamed in Dropbox |
| Removed here, Dropbox unchanged | Still present | Dropbox copy goes to the Dropbox trash |
| Unchanged | Removed there | This copy goes to the Obsidian trash, using the vault's deleted-files setting |
| Removed here | Edited there, or the reverse | Left in place and listed as a conflict |

### Conflicts

The conflict list opens when Obsidian starts if any conflicts are already recorded, and again after a sync that still has conflicts. The status bar shows the count and opens that list. A note that is open and conflicted shows a **Review** banner. **Review sync conflict in the active note** does the same from the command palette.

With **Merge** on, a note that changed on both devices is merged against the last synced copy. Words changed on only one side are kept from that side. Words changed on both sides stay as they are on this device, and the sync summary names that note. A file that is not text, a deletion beside an edit, or a note with no saved base copy stays a conflict for review.

**Review** lists each remaining conflict on its own. Unchanged lines stay folded between them. A line that exists on only one side is already kept, and you can leave it out. Where both sides changed the same lines, the two copies sit side by side. **Keep this device**, **Keep Dropbox**, **Keep both**, or **Leave out** picks what is saved, and **Edit** replaces that text with your own. Changed words are marked. **Apply** stays off until each disagreement has a choice, then writes the result on this device and in Dropbox. When several places disagree, **This device for all** and **Dropbox for all** choose those places and leave one-sided lines as they are. On a narrow screen the two copies stack.

A file missing on one side asks you to keep this device or keep Dropbox. Nothing is written until you apply.

Before replacing the file, each existing copy is saved beside it and uploaded:

```text
notes/20260929-183045_Daily_local_backup.md
notes/20260929-183045_Daily_dropbox_backup.md
```

The timestamp is local time, `YYYYMMDD-HHmmss`. The side name keeps both previous copies. A later sync leaves those backups alone once they match on both sides.

Editing a conflicted file outside this tool still sends that edit on the next sync if Dropbox has not changed again. Deleting it here, while Dropbox is unchanged, still drops the Dropbox copy on the next sync.

## Backup

**Backup vault** writes the whole vault, including `.obsidian`, to a file in a folder inside the vault. The default folder is `backups`. That folder is not packed into the archive.

The file name is `{timestamp}_{vault name}.zip` or `{timestamp}_{vault name}.gzip`.

```text
20260929-152630_My Vault.zip
20260929-152630_My Vault.gzip
```

The timestamp is the local date and time, `YYYYMMDD-HHmmss`. Choose **zip** or **gzip** in the plugin settings. A `.gzip` file is a gzip-compressed tar of the vault.

On the Mac the file stays with the Google Drive vault. On the iPhone it stays with the iCloud vault.

Run it from the archive ribbon icon, the command **Backup vault**, or the button in plugin settings.

## Build

```bash
npm install
npm test
./scripts/build.sh
```

`./scripts/build.sh` runs `npm run build` and writes `main.js`. Node.js 22 or newer is required.
