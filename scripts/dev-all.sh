#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start Browser Tools server (no-op if already running)
bash "$SCRIPT_DIR/mcp-start.sh"

# Start Next.js dev server in the foreground
npm run dev


