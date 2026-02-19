#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/date_check.sh 2026-02-02 2026-02-09 2026-02-13
#   BASE_URL=http://localhost:8080 ./scripts/date_check.sh

BASE_URL="${BASE_URL:-http://localhost:8080}"
DATES=("$@")
if [ ${#DATES[@]} -eq 0 ]; then
  DATES=("2026-02-02" "2026-02-09" "2026-02-13")
fi

pass=0
fail=0

echo "== Regression by fixed dates =="
echo "BASE_URL=$BASE_URL"
echo "DATES=${DATES[*]}"

for d in "${DATES[@]}"; do
  echo "\n[$d] generate + verify"
  body="$(curl -sS -m 120 -X POST "$BASE_URL/api/summaries/$d/generate" || true)"
  if [ -z "$body" ]; then
    echo "  FAIL: empty response"
    fail=$((fail+1))
    continue
  fi

  ok="$(python3 - <<'PY' "$body"
import json,sys
try:
    j=json.loads(sys.argv[1])
except Exception:
    print('parse_fail')
    raise SystemExit
req=['topGainer','topLoser','mostMentioned','kospiPick','kosdaqPick','verification','leaderExplanations']
missing=[k for k in req if k not in j]
if missing:
    print('missing:' + ','.join(missing))
else:
    le=j.get('leaderExplanations') or {}
    tg=(le.get('topGainer') or {}).get('summary')
    tl=(le.get('topLoser') or {}).get('summary')
    v=j.get('verification') or {}
    links=[v.get('topGainerDateSearch'),v.get('topLoserDateSearch'),v.get('mostMentionedDateSearch'),v.get('kospiPickDateSearch'),v.get('kosdaqPickDateSearch')]
    link_ok=all(isinstance(x,str) and x.startswith('https://finance.naver.com/item/sise_day.naver?code=') for x in links)
    print('ok' if tg and tl and link_ok else 'bad_values')
PY
)"

  if [ "$ok" = "ok" ]; then
    echo "  PASS"
    pass=$((pass+1))
  else
    echo "  FAIL: $ok"
    fail=$((fail+1))
  fi

done

echo "\n== Result =="
echo "pass=$pass fail=$fail total=${#DATES[@]}"
[ "$fail" -eq 0 ]
