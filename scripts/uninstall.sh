#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="web-curl"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

sudo systemctl stop "${SERVICE_NAME}" || true
sudo systemctl disable "${SERVICE_NAME}" || true
sudo rm -f "${SERVICE_FILE}"
sudo systemctl daemon-reload

echo "Web Curl has been uninstalled."
