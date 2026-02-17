#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
KEY="${PUBLIC_KEY_TEST:-secret}"

ok() { echo "[OK] $*"; }
fail() { echo "[FAIL] $*"; exit 1; }

echo "== PUBLIC_KEY OFF test =="
docker compose up -d --build >/dev/null
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/summaries/stats")
[[ "$code" == "200" ]] || fail "PUBLIC_KEY off expected 200, got $code"
ok "PUBLIC_KEY off => stats 200"

echo "== PUBLIC_KEY ON test =="
PUBLIC_KEY="$KEY" docker compose up -d --build >/dev/null
code_no_key=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/summaries/stats")
[[ "$code_no_key" == "403" ]] || fail "PUBLIC_KEY on without key expected 403, got $code_no_key"
ok "PUBLIC_KEY on without key => 403"

code_with_key=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/summaries/stats?k=$KEY")
[[ "$code_with_key" == "200" ]] || fail "PUBLIC_KEY on with key expected 200, got $code_with_key"
ok "PUBLIC_KEY on with key => 200"

echo "All PUBLIC_KEY QA checks passed."
