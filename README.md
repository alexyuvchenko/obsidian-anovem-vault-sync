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

**Sync both ways** still runs immediately. It is in the command palette, the ↔ icon on the left ribbon, and the plugin settings.

| This device | Dropbox | Result |
| --- | --- | --- |
| New or edited | Unchanged | Uploaded |
| Unchanged | New or edited | Downloaded |
| Same content on both, first sync | Same content | Recorded, nothing written |
| Changed on both | Changed | Left in place and listed as a conflict |
| Removed here only | Still present | Left in place and listed as a conflict |
| Still present | Removed there only | Left in place and listed as a conflict |

### Conflicts

The conflict list opens when Obsidian starts if any conflicts are already recorded, and again after a sync that still has conflicts. The plugin does not pick a side on its own.

**Open** shows the note as three aligned panes: this device, the result, and Dropbox. Changed lines are red. Lines kept in the result are blue. **»** applies the left change, **«** applies the right change, and **×** leaves that side out. A change can include either side or both. **Apply** writes that result over the file on this device and in Dropbox.

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
