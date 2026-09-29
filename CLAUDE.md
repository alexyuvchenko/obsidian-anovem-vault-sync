# Vault Anovem Sync

Obsidian plugin (`vault-anovem-sync`) for Mac and iPhone. It syncs Markdown notes and one attachments folder both ways through Dropbox, and it can archive the whole vault to a timestamped file.

The Mac vault can stay on Google Drive. The iPhone vault can stay on iCloud. The plugin reads the open vault and copies files through Dropbox. It does not read the other device's drive. Requires Obsidian 1.5.0 or newer (`isDesktopOnly` is false).

## Commands

Node.js 22 or newer is required. The default `node` on this machine may be older; use nvm 22 before building or testing.

```bash
npm install
npm test
./scripts/build.sh
./scripts/install-release.sh "/path/to/vault"
```

- `npm test` bundles `src/*.test.ts` with esbuild and runs them under `node --test`. Output goes to `dist-test/`.
- `./scripts/build.sh` runs `npm run build`: `tsc -noEmit` then a production esbuild bundle to `main.js`.
- `npm run dev` watches and writes `main.js` with an inline sourcemap.
- `./scripts/install-release.sh` downloads `manifest.json`, `main.js`, and `styles.css` from the latest GitHub release into `.obsidian/plugins/vault-anovem-sync/` in the vault you pass.

Plugin files Obsidian loads live at the repo root: `manifest.json`, `main.js`, `styles.css`. `main.js` is generated.

## Layout

| Path | Role |
| --- | --- |
| `src/main.ts` | Plugin class, commands, ribbon, background sync |
| `src/sync.ts` | `SyncEngine`: list, compare, upload, download, conflicts |
| `src/plan.ts` | Pure sync decisions (`planSync`, `planAfterCompare`, `planManualResolution`) |
| `src/paths.ts` | Path normalization and which files are included |
| `src/dropbox.ts` | Dropbox HTTP client and OAuth token refresh |
| `src/hash.ts` | SHA-256 and PKCE helpers |
| `src/app-key.ts` | App key must be exactly 15 alphanumeric characters |
| `src/archive.ts` | Zip and gzip-tar bytes, timestamps, backup names |
| `src/backup.ts` | Walk the vault and write the archive file |
| `src/settings.ts`, `src/modals.ts` | Settings tab and progress / conflict UI |
| `src/types.ts` | `Settings`, `SyncState`, `PluginData` persisted with `loadData` / `saveData` |

Keep sync decisions in `plan.ts` and path rules in `paths.ts` so they stay testable without Obsidian.

## Sync rules

Included files are every `.md` note, plus every file inside the attachments folder. Names that start with `.` are left out, including `.obsidian`.

Each vault is stored under the Dropbox folder in a subfolder named after the vault. Default Dropbox folder is `/ObsidianAnovem`. The Mac and iPhone copies of a vault need the same vault name. Compare paths case-insensitively (`pathKey`).

`planSync` decides upload, download, adopt, compare, forget, or conflict. Conflicts stay in place until **Review** saves a merged copy. Lines that exist on only one side start kept. Lines that differ on both sides stay undecided until that save. The save writes the result on this device and in Dropbox, and writes `{timestamp}_{name}_local_backup` and `{timestamp}_{name}_dropbox_backup` beside the file in both places. A later edit on one side, with the other side unchanged since the conflict, still sends or receives that side (`planManualResolution`).

Background sync defaults to every 5 minutes while Obsidian is open, and again when the app becomes visible. It does not run after Obsidian is closed.

## Backup

**Backup vault** writes the whole vault, including `.obsidian`, into the backup folder inside the vault. The default folder is `backups`. That folder is not packed into the archive.

File name: `{YYYYMMDD-HHmmss}_{vault name}.zip` or `.gzip`. A `.gzip` file is a gzip-compressed tar. Format is a setting.

## Secrets

Settings store the Dropbox app key, refresh token, and access token in plugin data. The app key is 15 characters. Do not add the App secret, a generated access token, or live credentials to the repo.
