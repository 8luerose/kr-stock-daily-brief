#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 '<prompt>'"
  exit 1
fi

PROMPT="$1"
TIMEOUT_SEC="${OPENCODE_TIMEOUT_SEC:-900}"

# Keep prompt focused and avoid giant multi-agent crawls.
zsh -lic "cd /Users/rose/Desktop/git/kr-stock-daily-brief && opencode run \"$PROMPT\"" &
PID=$!

START=$(date +%s)
while kill -0 "$PID" 2>/dev/null; do
  NOW=$(date +%s)
  ELAPSED=$((NOW-START))
  if [ "$ELAPSED" -gt "$TIMEOUT_SEC" ]; then
    echo "[opencode_reliable_run] timeout after ${TIMEOUT_SEC}s, killing PID=$PID" >&2
    kill -9 "$PID" || true
    exit 124
  fi
  sleep 1
done

wait "$PID"
