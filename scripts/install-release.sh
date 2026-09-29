#!/bin/zsh
# Install or update Vault Anovem Sync from the latest GitHub release.
# Usage: ./scripts/install-release.sh /path/to/vault

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: ./scripts/install-release.sh /path/to/vault" >&2
  exit 1
fi

vault=$1
if [[ ! -d "$vault/.obsidian" ]]; then
  echo "Not a vault: $vault" >&2
  exit 1
fi

dest="$vault/.obsidian/plugins/vault-anovem-sync"
mkdir -p "$dest"
api="https://api.github.com/repos/alexyuvchenko/obsidian-vault-anovem-sync/releases/latest"
json=$(curl -fsSL -H "Accept: application/vnd.github+json" "$api")

python3 - "$dest" "$json" <<'PY'
import json, pathlib, sys, urllib.request
dest = pathlib.Path(sys.argv[1])
release = json.loads(sys.argv[2])
wanted = {"manifest.json", "main.js", "styles.css"}
assets = {item["name"]: item["browser_download_url"] for item in release.get("assets", [])}
missing = sorted(wanted - assets.keys())
if missing:
    raise SystemExit(f"Release is missing {', '.join(missing)}")
for name in sorted(wanted):
    urllib.request.urlretrieve(assets[name], dest / name)
    print(f"Wrote {dest / name}")
print(release.get("tag_name", ""))
PY

echo "Reload Obsidian and enable Vault Anovem Sync."
