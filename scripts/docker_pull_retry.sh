#!/usr/bin/env bash
set -euo pipefail

# Purpose: make Docker base-image pulls more reliable when they sometimes hang.
# Usage:
#   ./scripts/docker_pull_retry.sh node:20-alpine
#   ./scripts/docker_pull_retry.sh python:3.11-slim
# Env:
#   MAX_TRIES=5   # default 5
#   TIME_LIMIT=180 # seconds per try (default 180)

IMAGE="${1:-}"
if [ -z "$IMAGE" ]; then
  echo "usage: $0 <image:tag>" >&2
  exit 2
fi

MAX_TRIES="${MAX_TRIES:-5}"
TIME_LIMIT="${TIME_LIMIT:-180}"

try_pull() {
  local img="$1"
  local limit="$2"

  # Run docker pull in background so we can kill if it hangs.
  docker pull "$img" &
  local pid=$!

  local elapsed=0
  while kill -0 "$pid" 2>/dev/null; do
    if [ "$elapsed" -ge "$limit" ]; then
      echo "[WARN] pull timed out after ${limit}s, killing pid=$pid" >&2
      kill -9 "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
      return 124
    fi
    sleep 1
    elapsed=$((elapsed+1))
  done

  wait "$pid"
}

for i in $(seq 1 "$MAX_TRIES"); do
  echo "== docker pull try $i/$MAX_TRIES: $IMAGE (limit ${TIME_LIMIT}s) =="
  if try_pull "$IMAGE" "$TIME_LIMIT"; then
    echo "[OK] pulled: $IMAGE"
    exit 0
  fi
  echo "[WARN] pull failed or timed out; retrying..." >&2
  sleep 2

done

echo "[FAIL] could not pull $IMAGE after $MAX_TRIES tries" >&2
exit 1
