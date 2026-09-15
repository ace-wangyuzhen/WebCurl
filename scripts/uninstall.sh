#!/usr/bin/env bash
#
# Stop and remove a Web Curl instance started by scripts/install.sh.
#
# install.sh runs the server with nohup (not systemd): it records the pid in
# app.pid, writes logs to app.log, and extracts the build archive into APP_HOME
# (pack.sh archives a single top-level web-curl/ directory). This script
# reverses that — it stops the process and deletes what install.sh created:
# the extracted package, the downloaded archive, app.pid and app.log.
#
# Configuration (env vars; match how install.sh was invoked):
#   APP_HOME      Directory install.sh used (default: this script's directory).
#   ENTRY         Entrypoint inside the archive (default: dist/server/index.js).
#   ARCHIVE_NAME  Downloaded archive filename (default: web-curl.tar.gz).
#   KEEP_LOG      Set to 1 to keep app.log (default: remove it).
#
set -euo pipefail

APP_HOME="${APP_HOME:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
ENTRY_REL="${ENTRY:-dist/server/index.js}"
ARCHIVE_NAME="${ARCHIVE_NAME:-web-curl.tar.gz}"

PID_FILE="${APP_HOME}/app.pid"
LOG_FILE="${APP_HOME}/app.log"
ARCHIVE="${APP_HOME}/${ARCHIVE_NAME}"

log() { echo "[web-curl] $*"; }

# --- Stop the running instance ----------------------------------------------
if [ -f "${PID_FILE}" ]; then
  PID="$(cat "${PID_FILE}" 2>/dev/null || true)"
  if [ -n "${PID}" ] && kill -0 "${PID}" >/dev/null 2>&1; then
    log "Stopping Web Curl (pid ${PID})"
    kill "${PID}" >/dev/null 2>&1 || true
    for _ in $(seq 1 10); do
      kill -0 "${PID}" >/dev/null 2>&1 || break
      sleep 1
    done
    if kill -0 "${PID}" >/dev/null 2>&1; then
      log "Process still alive; sending SIGKILL"
      kill -9 "${PID}" >/dev/null 2>&1 || true
    fi
  else
    log "No live process for the pid in ${PID_FILE}"
  fi
else
  log "No pid file at ${PID_FILE}; nothing to stop"
fi

# --- Remove the extracted build ---------------------------------------------
# Locate the entrypoint the same way install.sh does, then walk up to the
# package root (…/<root>/dist/server/index.js -> …/<root>).
ENTRY="${APP_HOME}/${ENTRY_REL}"
if [ ! -f "${ENTRY}" ]; then
  ENTRY="$(find "${APP_HOME}" -type f -path "*/${ENTRY_REL}" 2>/dev/null | head -n1 || true)"
fi

if [ -n "${ENTRY}" ] && [ -f "${ENTRY}" ]; then
  RUN_DIR="$(cd "$(dirname "${ENTRY}")/../.." && pwd)"
  if [ "${RUN_DIR}" = "${APP_HOME}" ]; then
    # Flat extraction: only drop the build dir, never APP_HOME itself.
    log "Removing ${APP_HOME}/dist"
    rm -rf "${APP_HOME}/dist"
  elif [ "${RUN_DIR#"${APP_HOME}"/}" != "${RUN_DIR}" ]; then
    # Extracted into a sub-directory of APP_HOME (the packaged web-curl/ root).
    log "Removing extracted package ${RUN_DIR}"
    rm -rf "${RUN_DIR}"
  else
    log "Extracted package at ${RUN_DIR} is outside ${APP_HOME}; leaving it."
  fi
else
  log "No extracted build found under ${APP_HOME}"
fi

# --- Remove archive, pid and log --------------------------------------------
if [ -f "${ARCHIVE}" ]; then
  log "Removing ${ARCHIVE}"
  rm -f "${ARCHIVE}"
fi

rm -f "${PID_FILE}"

if [ "${KEEP_LOG:-0}" != "1" ] && [ -f "${LOG_FILE}" ]; then
  log "Removing ${LOG_FILE}"
  rm -f "${LOG_FILE}"
fi

log "Web Curl has been uninstalled."
