#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
DATE_TODAY="$(TZ=Asia/Seoul date +%F)"
FROM="${FROM:-$DATE_TODAY}"
TO="${TO:-$FROM}"

pass() { echo "[PASS] $*"; }
fail() { echo "[FAIL] $*"; exit 1; }

request() {
  local method="$1"; shift
  local url="$1"; shift
  curl -sS -X "$method" "$url" "$@"
}

status_code() {
  local method="$1"; shift
  local url="$1"; shift
  curl -sS -o /tmp/krbrief_resp.json -w "%{http_code}" -X "$method" "$url" "$@"
}

contains_field() {
  local file="$1"; shift
  local field="$1"; shift
  grep -q "\"$field\"" "$file"
}

echo "== API smoke test start =="

# 0) health
code=$(status_code GET "$BASE_URL/actuator/health")
[[ "$code" == "200" ]] || fail "health expected 200, got $code"
contains_field /tmp/krbrief_resp.json status || fail "health missing status field"
pass "GET /actuator/health"

# 1) POST /api/summaries/generate/today
code=$(status_code POST "$BASE_URL/api/summaries/generate/today")
[[ "$code" == "200" ]] || fail "generate/today expected 200, got $code"
contains_field /tmp/krbrief_resp.json date || fail "generate/today missing date"
pass "POST /api/summaries/generate/today"

# 2) POST /api/summaries/{date}/generate
code=$(status_code POST "$BASE_URL/api/summaries/$DATE_TODAY/generate")
[[ "$code" == "200" ]] || fail "generate/{date} expected 200, got $code"
contains_field /tmp/krbrief_resp.json topGainer || fail "generate/{date} missing topGainer"
pass "POST /api/summaries/{date}/generate"

# 3) GET /api/summaries/{date}
code=$(status_code GET "$BASE_URL/api/summaries/$DATE_TODAY")
[[ "$code" == "200" ]] || fail "get/{date} expected 200, got $code"
contains_field /tmp/krbrief_resp.json rawNotes || fail "get/{date} missing rawNotes"
pass "GET /api/summaries/{date}"

# 4) GET /api/summaries/latest
code=$(status_code GET "$BASE_URL/api/summaries/latest")
[[ "$code" == "200" ]] || fail "latest expected 200, got $code"
contains_field /tmp/krbrief_resp.json date || fail "latest missing date"
pass "GET /api/summaries/latest"

# 5) GET /api/summaries/stats
code=$(status_code GET "$BASE_URL/api/summaries/stats")
[[ "$code" == "200" ]] || fail "stats expected 200, got $code"
contains_field /tmp/krbrief_resp.json totalCount || fail "stats missing totalCount"
pass "GET /api/summaries/stats"

# 6) GET /api/summaries/insights
code=$(status_code GET "$BASE_URL/api/summaries/insights?from=$FROM&to=$TO")
[[ "$code" == "200" ]] || fail "insights expected 200, got $code"
contains_field /tmp/krbrief_resp.json generatedDays || fail "insights missing generatedDays"
pass "GET /api/summaries/insights"

# 7) GET /api/summaries?from&to
code=$(status_code GET "$BASE_URL/api/summaries?from=$FROM&to=$TO")
[[ "$code" == "200" ]] || fail "list expected 200, got $code"
# list may be [] but should be JSON array
head -c 1 /tmp/krbrief_resp.json | grep -q '\[' || fail "list expected array JSON"
pass "GET /api/summaries?from&to"

# 8) PUT /api/summaries/{date}/archive (soft delete)
code=$(status_code PUT "$BASE_URL/api/summaries/$DATE_TODAY/archive")
[[ "$code" == "200" ]] || fail "archive expected 200, got $code"
contains_field /tmp/krbrief_resp.json archivedAt || fail "archive missing archivedAt"
pass "PUT /api/summaries/{date}/archive"

# restore same date by regenerate
code=$(status_code POST "$BASE_URL/api/summaries/$DATE_TODAY/generate")
[[ "$code" == "200" ]] || fail "regen after archive expected 200, got $code"
pass "POST /api/summaries/{date}/generate after archive"

# 9) POST /api/summaries/backfill
code=$(status_code POST "$BASE_URL/api/summaries/backfill?from=$FROM&to=$TO")
[[ "$code" == "200" ]] || fail "backfill expected 200, got $code"
contains_field /tmp/krbrief_resp.json successCount || fail "backfill missing successCount"
pass "POST /api/summaries/backfill"

# 10) Negative test: invalid date
code=$(status_code GET "$BASE_URL/api/summaries/2026-02-29")
[[ "$code" == "400" ]] || fail "invalid date expected 400, got $code"
contains_field /tmp/krbrief_resp.json error || fail "invalid date missing error field"
pass "GET /api/summaries/{invalid-date} returns 400 JSON"

# 11) Learning terms
code=$(status_code GET "$BASE_URL/api/learning/terms?query=PER&limit=5")
[[ "$code" == "200" ]] || fail "learning terms expected 200, got $code"
contains_field /tmp/krbrief_resp.json plainDefinition || fail "learning terms missing plainDefinition"
pass "GET /api/learning/terms"

# 12) Learning assistant
code=$(status_code POST "$BASE_URL/api/learning/assistant" \
  -H "Content-Type: application/json" \
  -d '{"question":"거래량이 왜 중요해?","contextDate":"'"$DATE_TODAY"'","termId":"volume"}')
[[ "$code" == "200" ]] || fail "learning assistant expected 200, got $code"
contains_field /tmp/krbrief_resp.json futureAiEndpoint || fail "learning assistant missing futureAiEndpoint"
contains_field /tmp/krbrief_resp.json limitations || fail "learning assistant missing limitations"
pass "POST /api/learning/assistant"

# 13) Stock chart
code=$(status_code GET "$BASE_URL/api/stocks/005930/chart?range=6M&interval=daily")
[[ "$code" == "200" ]] || fail "stock chart expected 200, got $code"
contains_field /tmp/krbrief_resp.json data || fail "stock chart missing data"
contains_field /tmp/krbrief_resp.json asOf || fail "stock chart missing asOf"
pass "GET /api/stocks/{code}/chart"

# 14) Stock events
EVENT_FROM="$(date -v-90d +%F 2>/dev/null || date -d '90 days ago' +%F)"
code=$(status_code GET "$BASE_URL/api/stocks/005930/events?from=$EVENT_FROM&to=$DATE_TODAY")
[[ "$code" == "200" ]] || fail "stock events expected 200, got $code"
contains_field /tmp/krbrief_resp.json events || fail "stock events missing events"
pass "GET /api/stocks/{code}/events"

# 15) AI chat
code=$(status_code POST "$BASE_URL/api/ai/chat" \
  -H "Content-Type: application/json" \
  -d '{"question":"삼성전자 차트를 초보자 관점으로 설명해줘","contextDate":"'"$DATE_TODAY"'","stockCode":"005930","stockName":"삼성전자","searchResult":{"type":"stock","title":"삼성전자","stockCode":"005930","summary":"반도체와 메모리 업황을 함께 확인해야 하는 대표 종목입니다."}}')
[[ "$code" == "200" ]] || fail "ai chat expected 200, got $code"
contains_field /tmp/krbrief_resp.json mode || fail "ai chat missing mode"
contains_field /tmp/krbrief_resp.json limitations || fail "ai chat missing limitations"
contains_field /tmp/krbrief_resp.json oppositeSignals || fail "ai chat missing oppositeSignals"
contains_field /tmp/krbrief_resp.json retrieval || fail "ai chat missing retrieval"
contains_field /tmp/krbrief_resp.json sourceCount || fail "ai chat missing retrieval sourceCount"
grep -q '"id":"search-result"' /tmp/krbrief_resp.json || fail "ai chat missing search-result retrieval document"
pass "POST /api/ai/chat"

# 16) Unified search
code=$(status_code GET "$BASE_URL/api/search?query=%EB%B0%98%EB%8F%84%EC%B2%B4&limit=5")
[[ "$code" == "200" ]] || fail "search expected 200, got $code"
contains_field /tmp/krbrief_resp.json source || fail "search missing source"
contains_field /tmp/krbrief_resp.json title || fail "search missing title"
pass "GET /api/search"

code=$(status_code GET "$BASE_URL/api/search?query=%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90&limit=5")
[[ "$code" == "200" ]] || fail "search samsung expected 200, got $code"
grep -q '"stockCode":"005930"' /tmp/krbrief_resp.json || fail "search samsung missing 005930"
pass "GET /api/search finds 삼성전자"

echo "== API smoke test done: ALL PASS =="
