#!/usr/bin/env bash
#
# Fetch a packaged Web Curl build from BOS, unpack it, and launch the server in
# the background with nohup.
#
# Behaviour:
#   - Downloads a .tar.gz build archive with wget and extracts it.
#   - Picks the first free port starting at 8359, incrementing until one is free.
#   - Runs `node dist/server/index.js` via nohup; stdout/stderr go to app.log and
#     the background pid is written to app.pid.
#
# Configuration (env vars; the archive URL may also be the first argument):
#   BOS_URL         URL of the .tar.gz build archive (required).
#   APP_HOME        Download + run directory (default: this script's directory).
#   PORT_BASE       First port to try (default: 8359).
#   HOST            Bind + health-check host (default: 0.0.0.0).
#   ENTRY           Server entrypoint inside the archive (default: dist/server/index.js).
#   MAX_PORT_TRIES  How many ports to try before giving up (default: 100).
#
set -euo pipefail

BOS_URL="${BOS_URL:-${1:-}}"
APP_HOME="${APP_HOME:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
PORT_BASE="${PORT_BASE:-8359}"
HOST="${HOST:-0.0.0.0}"
ENTRY_REL="${ENTRY:-dist/server/index.js}"
MAX_PORT_TRIES="${MAX_PORT_TRIES:-100}"
HEALTH_PATH="/api/health"

LOG_FILE="${APP_HOME}/app.log"
PID_FILE="${APP_HOME}/app.pid"

log() { echo "[web-curl] $*"; }
die() { echo "[web-curl] ERROR: $*" >&2; exit 1; }

# --- Preconditions ----------------------------------------------------------
command -v node >/dev/null 2>&1 || die "node is not installed."
NODE_MAJOR="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
[ "${NODE_MAJOR}" = "24" ] || die "Web Curl requires Node.js 24. Found: $(node --version)"
command -v wget >/dev/null 2>&1 || die "wget is not installed."
[ -n "${BOS_URL}" ] || die "Set BOS_URL (or pass the archive URL as the first argument)."

mkdir -p "${APP_HOME}"

# --- Download & unpack -------------------------------------------------------
ARCHIVE="${APP_HOME}/$(basename "${BOS_URL%%\?*}")"
case "${ARCHIVE}" in
  *.tar.gz | *.tgz) : ;;
  *) ARCHIVE="${APP_HOME}/web-curl.tar.gz" ;;
esac

log "Downloading ${BOS_URL}"
wget -q -O "${ARCHIVE}" "${BOS_URL}" || die "Download failed: ${BOS_URL}"

log "Extracting $(basename "${ARCHIVE}")"
tar -xzf "${ARCHIVE}" -C "${APP_HOME}" || die "Failed to extract ${ARCHIVE}"

# Locate the entrypoint (works whether or not the archive has a top-level dir).
ENTRY="${APP_HOME}/${ENTRY_REL}"
if [ ! -f "${ENTRY}" ]; then
  ENTRY="$(find "${APP_HOME}" -type f -path "*/${ENTRY_REL}" 2>/dev/null | head -n1 || true)"
fi
[ -n "${ENTRY}" ] && [ -f "${ENTRY}" ] || die "Could not find ${ENTRY_REL} after extraction."
# Package root sits two levels above dist/server (…/<root>/dist/server/index.js).
RUN_DIR="$(cd "$(dirname "${ENTRY}")/../.." && pwd)"
log "Server entrypoint: ${ENTRY}"

# --- Stop a previously started instance --------------------------------------
if [ -f "${PID_FILE}" ]; then
  OLD_PID="$(cat "${PID_FILE}" 2>/dev/null || true)"
  if [ -n "${OLD_PID}" ] && kill -0 "${OLD_PID}" >/dev/null 2>&1; then
    log "Stopping previous instance (pid ${OLD_PID})"
    kill "${OLD_PID}" >/dev/null 2>&1 || true
    for _ in $(seq 1 10); do
      kill -0 "${OLD_PID}" >/dev/null 2>&1 || break
      sleep 1
    done
  fi
fi

# --- Pick a free port --------------------------------------------------------
port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltnH "( sport = :${port} )" 2>/dev/null | grep -q .
  elif command -v lsof >/dev/null 2>&1; then
    lsof -iTCP:"${port}" -sTCP:LISTEN -Pn >/dev/null 2>&1
  else
    # Fallback: a successful TCP connect means something is already listening.
    (exec 3<>"/dev/tcp/${HOST}/${port}") >/dev/null 2>&1 &&
      { exec 3>&- 3<&-; return 0; } || return 1
  fi
}

PORT="${PORT_BASE}"
tries=0
while port_in_use "${PORT}"; do
  log "Port ${PORT} is in use, trying $((PORT + 1))"
  PORT=$((PORT + 1))
  tries=$((tries + 1))
  [ "${PORT}" -le 65535 ] || die "Ran out of ports while searching from ${PORT_BASE}."
  [ "${tries}" -lt "${MAX_PORT_TRIES}" ] ||
    die "No free port found after ${MAX_PORT_TRIES} attempts from ${PORT_BASE}."
done
log "Using port ${PORT}"

# --- Launch in the background ------------------------------------------------
log "Starting Web Curl (logs: ${LOG_FILE})"
cd "${RUN_DIR}"
HOST="${HOST}" PORT="${PORT}" nohup node "${ENTRY}" > "${LOG_FILE}" 2>&1 &
APP_PID=$!
echo "${APP_PID}" > "${PID_FILE}"
log "Started with pid ${APP_PID} (recorded in ${PID_FILE})"

# --- Health check ------------------------------------------------------------
if ! command -v curl >/dev/null 2>&1; then
  log "curl not found; skipping health check. Web Curl should be at http://${HOST}:${PORT}"
  exit 0
fi

for _ in $(seq 1 30); do
  if ! kill -0 "${APP_PID}" >/dev/null 2>&1; then
    die "Process exited during startup. Check ${LOG_FILE}."
  fi
  if curl -fsS "http://${HOST}:${PORT}${HEALTH_PATH}" >/dev/null 2>&1; then
    log "Web Curl is running at http://${HOST}:${PORT} (pid ${APP_PID})"
    exit 0
  fi
  sleep 1
done

die "Web Curl did not become healthy in time. Check ${LOG_FILE}."
