#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="web-curl"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

NODE_MAJOR="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
if [ "${NODE_MAJOR}" != "24" ]; then
  echo "Web Curl requires Node.js 24. Found: $(node --version)" >&2
  exit 1
fi

echo "Installing dependencies..."
npm ci

echo "Building client and server..."
npm run build

echo "Installing the systemd unit..."
UNIT_TMP="$(mktemp)"
sed "s|/opt/web-curl|${APP_DIR}|g" deploy/web-curl.service.example > "${UNIT_TMP}"
sudo install -m 0644 "${UNIT_TMP}" "${SERVICE_FILE}"
rm -f "${UNIT_TMP}"

sudo systemctl daemon-reload
sudo systemctl enable --now "${SERVICE_NAME}"

echo "Waiting for the service to become healthy..."
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8080/api/health >/dev/null 2>&1; then
    echo "Web Curl is running at http://127.0.0.1:8080"
    exit 0
  fi
  sleep 1
done

echo "Web Curl did not become healthy. Check: systemctl status ${SERVICE_NAME}" >&2
exit 1
