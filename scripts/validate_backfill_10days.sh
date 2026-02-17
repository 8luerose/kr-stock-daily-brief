#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
PYKRX_URL="${PYKRX_URL:-http://localhost:8000}"

tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

collect_dates() {
  python3 <<'PY'
import datetime

year = 2024
month = 2
out = []
d = datetime.date(year, month, 1)
while d.month == month and len(out) < 10:
    if d.weekday() < 5:
        out.append(d.isoformat())
    d += datetime.timedelta(days=1)

for d in out:
    print(d)
PY
}

target_dates=()
while IFS= read -r line; do
  target_dates+=("$line")
done <<EOF
$(collect_dates)
EOF

if [ "${#target_dates[@]}" -eq 0 ]; then
  echo "No target business dates found."
  exit 1
fi

echo "== Validate backfill vs pykrx leaders (2024-02 business days x10) =="
echo "BASE_URL=$BASE_URL"
echo "PYKRX_URL=$PYKRX_URL"

total=0
compared=0
matched=0
pykrx_unavailable=0

for d in "${target_dates[@]}"; do
  total=$((total + 1))

  backfill_json="$tmpdir/backfill_$d.json"
  summary_json="$tmpdir/summary_$d.json"
  pykrx_json="$tmpdir/pykrx_$d.json"

  curl -fsS -X POST "$BASE_URL/api/summaries/backfill?from=$d&to=$d" > "$backfill_json"
  curl -fsS "$BASE_URL/api/summaries/$d" > "$summary_json"

  pykrx_code=$(curl -s -o "$pykrx_json" -w "%{http_code}" "$PYKRX_URL/leaders?date=$d" || true)
  if [ "$pykrx_code" != "200" ]; then
    pykrx_unavailable=$((pykrx_unavailable + 1))
    echo "[$d] SKIP pykrx unavailable (http=$pykrx_code)"
    continue
  fi

  compared=$((compared + 1))

  source_used="$(python3 - "$backfill_json" <<'PY'
import json
import sys

obj = json.load(open(sys.argv[1], encoding="utf-8"))
results = obj.get("results") or []
print((results[0].get("sourceUsed") if results else "") or "")
PY
)"

  confidence="$(python3 - "$backfill_json" <<'PY'
import json
import sys

obj = json.load(open(sys.argv[1], encoding="utf-8"))
results = obj.get("results") or []
print((results[0].get("confidence") if results else "") or "")
PY
)"

  backfill_row="$(python3 - "$summary_json" <<'PY'
import json,sys
obj=json.load(open(sys.argv[1],encoding='utf-8'))
vals=[obj.get('topGainer',''),obj.get('topLoser',''),obj.get('mostMentioned',''),obj.get('kospiPick',''),obj.get('kosdaqPick','')]
print('\t'.join(vals))
PY
)"

  ref_row="$(python3 - "$pykrx_json" <<'PY'
import json,sys
obj=json.load(open(sys.argv[1],encoding='utf-8'))
vals=[obj.get('topGainer',''),obj.get('topLoser',''),obj.get('mostMentioned',''),obj.get('kospiPick',''),obj.get('kosdaqPick','')]
print('\t'.join(vals))
PY
)"

  if [ "$backfill_row" = "$ref_row" ]; then
    matched=$((matched + 1))
    verdict="MATCH"
  else
    verdict="MISMATCH"
  fi

  IFS=$'\t' read -r b_g b_l b_m b_kp b_kd <<< "$backfill_row"
  IFS=$'\t' read -r r_g r_l r_m r_kp r_kd <<< "$ref_row"

  echo "[$d] $verdict sourceUsed=$source_used confidence=$confidence"
  echo "  backfill: topGainer='$b_g' topLoser='$b_l' mostMentioned='$b_m' kospiPick='$b_kp' kosdaqPick='$b_kd'"
  echo "  ref:      topGainer='$r_g' topLoser='$r_l' mostMentioned='$r_m' kospiPick='$r_kp' kosdaqPick='$r_kd'"
done

match_rate="$(python3 - "$matched" "$compared" <<'PY'
import sys

matched = int(sys.argv[1])
compared = int(sys.argv[2])
if compared == 0:
    print("0.00")
else:
    print(f"{(matched * 100.0 / compared):.2f}")
PY
)"

echo "== Result Summary =="
echo "targetDates=${#target_dates[@]} compared=$compared matched=$matched pykrxUnavailable=$pykrx_unavailable"
echo "matchRate=${match_rate}% (matched/compared)"
echo "dates=$(IFS=,; echo "${target_dates[*]}")"
