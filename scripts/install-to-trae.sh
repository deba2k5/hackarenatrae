#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> TraeGuardian: building extension..."
cd "$ROOT"
npm run compile --prefix extension
npm run build:webview --prefix frontend

cd "$ROOT/extension"
npx @vscode/vsce package --no-dependencies
VSIX="$(ls -t traeguardian-*.vsix 2>/dev/null | head -1)"
if [[ -z "$VSIX" ]]; then
  echo "No .vsix produced" >&2
  exit 1
fi

echo "==> Installing $VSIX into Trae IDE..."
if command -v trae >/dev/null 2>&1; then
  trae --install-extension "$(pwd)/$VSIX"
  echo "==> Done. Reload Trae IDE."
else
  echo "Install the Trae shell command first, then run:"
  echo "  trae --install-extension $(pwd)/$VSIX"
fi
