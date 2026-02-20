#!/usr/bin/env bash
set -euo pipefail

# Pull required base images inside Colima VM sequentially.
# Purpose: avoid intermittent host->colima pull stalls / connection limits.
# Usage:
#   ./scripts/pull_images_colima_one_by_one.sh
# Env:
#   IMAGES="node:20-alpine python:3.11-slim eclipse-temurin:17-jdk eclipse-temurin:17-jre" (optional)

IMAGES_DEFAULT=(
  "node:20-alpine"
  "python:3.11-slim"
  "eclipse-temurin:17-jdk"
  "eclipse-temurin:17-jre"
)

if [ -n "${IMAGES:-}" ]; then
  # shellcheck disable=SC2206
  IMAGES_ARR=($IMAGES)
else
  IMAGES_ARR=("${IMAGES_DEFAULT[@]}")
fi

echo "== Pulling images inside Colima VM, sequentially =="

for img in "${IMAGES_ARR[@]}"; do
  echo "---- pulling: ${img} ----"
  # Single image per SSH invocation to minimize parallel sessions.
  colima ssh -- bash -lc "docker pull ${img}"
  echo "[OK] ${img}"
  echo
  sleep 1

  # Show brief disk usage occasionally
  if command -v colima >/dev/null 2>&1; then
    colima ssh -- bash -lc "df -h / | tail -n 1" || true
  fi

done

echo "== Done =="
