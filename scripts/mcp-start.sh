#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/.mcp"
PID_FILE="$LOG_DIR/server.pid"
LOG_FILE="$LOG_DIR/server.log"

mkdir -p "$LOG_DIR"

echo "[mcp-start] Ensuring no stale Browser Tools server is running..."
pkill -f '@agentdeskai/browser-tools-server' >/dev/null 2>&1 || true

if [ -f "$PID_FILE" ]; then
  if kill -0 "$(cat "$PID_FILE")" >/dev/null 2>&1; then
    echo "[mcp-start] Existing server appears to be running (pid $(cat "$PID_FILE")). Skipping start."
    exit 0
  else
    rm -f "$PID_FILE"
  fi
fi

echo "[mcp-start] Starting @agentdeskai/browser-tools-server in background..."
nohup npx -y @agentdeskai/browser-tools-server@latest >"$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"
echo "[mcp-start] Started (pid $SERVER_PID). Logs: $LOG_FILE"

# Give it a moment to initialize
sleep 1

if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
  echo "[mcp-start] Server process is running. If the Browser Tools MCP panel still can't connect, try reopening DevTools and the panel."
else
  echo "[mcp-start] Server process exited unexpectedly. Check logs at $LOG_FILE" >&2
  exit 1
fi


