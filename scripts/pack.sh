#!/usr/bin/env bash
#
# Build Web Curl and produce a deployable archive for scripts/install.sh.
#
# The archive contains a single top-level `web-curl/` directory with the built
# app (`dist/`) and production dependencies (`node_modules/`), so a deploy host
# can run `node dist/server/index.js` directly after extracting it.
#
# Run `npm run build` first, or use `npm run package`, which chains both.
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

NAME="web-curl"
ARCHIVE="${ROOT}/${NAME}.tar.gz"

if [ ! -f "dist/server/index.js" ]; then
  echo "[pack] dist/server/index.js not found. Run 'npm run build' first." >&2
  exit 1
fi

STAGE="$(mktemp -d)"
trap 'rm -rf "${STAGE}"' EXIT
DEST="${STAGE}/${NAME}"
mkdir -p "${DEST}"

echo "[pack] Staging build output"
cp -R dist "${DEST}/"
cp package.json package-lock.json "${DEST}/"

echo "[pack] Installing production dependencies"
(cd "${DEST}" && npm ci --omit=dev --ignore-scripts)

echo "[pack] Creating ${ARCHIVE}"
rm -f "${ARCHIVE}"
tar -czf "${ARCHIVE}" -C "${STAGE}" "${NAME}"

echo "[pack] Done: ${ARCHIVE}"
