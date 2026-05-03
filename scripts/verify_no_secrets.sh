#!/usr/bin/env bash
set -euo pipefail

echo "== Secret safety check =="

tracked_env_files="$(
  git ls-files \
    '.env' '.env.*' \
    'backend/.env' 'backend/.env.*' \
    'frontend/.env' 'frontend/.env.*' \
    'ai-service/.env' 'ai-service/.env.*' \
    'marketdata-python/.env' 'marketdata-python/.env.*' \
    2>/dev/null | grep -Ev '(^|/)\.env\.example$' || true
)"

if [[ -n "$tracked_env_files" ]]; then
  echo "[FAIL] Tracked environment files are not allowed:"
  echo "$tracked_env_files"
  exit 1
fi

secret_pattern='-----BEGIN ((RSA|DSA|EC|OPENSSH) )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{32,}'

if git grep -n -I -E -- \
  "$secret_pattern" \
  -- . \
  ':(exclude)docs/**' \
  ':(exclude)scripts/verify_no_secrets.sh' \
  ':(exclude)frontend/package-lock.json' \
  >/tmp/krbrief_secret_scan.txt; then
  echo "[FAIL] Potential secret material found:"
  cat /tmp/krbrief_secret_scan.txt
  exit 1
fi

echo "[PASS] No tracked env files or obvious secret tokens found."
