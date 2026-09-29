#!/bin/zsh
# Typecheck the plugin and write main.js.
# Usage: ./scripts/build.sh

set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

npm run build
