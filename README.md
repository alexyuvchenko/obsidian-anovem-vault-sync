# Vault Anovem Sync

Obsidian plugin for Mac and iPhone. It syncs Markdown notes and one attachments folder both ways through Dropbox, and it can archive the whole vault to a timestamped file.

The Mac vault can stay on Google Drive. The iPhone vault can stay on iCloud. The plugin reads the open vault and copies files through Dropbox. It does not read the other device's drive.

Requires Obsidian 1.5.0 or newer.

## Install

Copy the plugin into the vault that is open in Obsidian:

```bash
./scripts/copy-plugin.sh
```

That copies `manifest.json`, `main.js`, and `styles.css` into `.obsidian/plugins/vault-anovem-sync/` for the iCloud `nexus` vault and the Google Drive `nexus` vault. To copy into another vault, pass its folder:

```bash
./scripts/copy-plugin.sh "/path/to/vault"
```

Quit Obsidian and open it again. Turn off Restricted mode and enable **Vault Anovem Sync**.

If `main.js` is missing, build it first. See [Build](#build).

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

Conflicts are resolved in the vault, then synced again. The plugin does not pick a side and does not delete the Dropbox copy on its own.

- **Changed on both devices.** Edit the file, then sync again. That version is sent. If you leave the file and the other device edits it, that version is downloaded.
- **Missing on this device, still in Dropbox.** Put the file back in the vault, then sync again.
- **On this device, missing from Dropbox.** Edit it and sync again to send it, or delete it here and sync again to drop it.

**Show sync conflicts** lists these files. **Open** opens a note that is on this device.

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
