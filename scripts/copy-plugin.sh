#!/bin/zsh
# Copy manifest.json, main.js, and styles.css into each vault.
# Usage: ./scripts/copy-plugin.sh [vault ...]
# With no arguments, copies into the iCloud nexus vault and the Google Drive nexus vault.

set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
plugin="vault-anovem-sync"

for file in manifest.json main.js styles.css; do
  if [[ ! -f "$root/$file" ]]; then
    echo "Missing $root/$file. Run ./scripts/build.sh first." >&2
    exit 1
  fi
done

if [[ $# -eq 0 ]]; then
  set -- \
    "$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents/nexus" \
    "$HOME/Library/CloudStorage/GoogleDrive-lexaun@gmail.com/My Drive/nexus"
fi

for vault in "$@"; do
  if [[ ! -d "$vault/.obsidian" ]]; then
    echo "Not a vault: $vault" >&2
    exit 1
  fi
  dest="$vault/.obsidian/plugins/$plugin"
  mkdir -p "$dest"
  cp "$root/manifest.json" "$root/main.js" "$root/styles.css" "$dest/"
  echo "Copied to $dest"
done
