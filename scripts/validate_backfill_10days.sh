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

  backfill_pair="$(python3 - "$summary_json" <<'PY'
import json
import sys

obj = json.load(open(sys.argv[1], encoding="utf-8"))
print(f"{obj.get('topGainer','')}\t{obj.get('topLoser','')}")
PY
)"

  pykrx_pair="$(python3 - "$pykrx_json" <<'PY'
import json
import sys

obj = json.load(open(sys.argv[1], encoding="utf-8"))
print(f"{obj.get('topGainer','')}\t{obj.get('topLoser','')}")
PY
)"

  backfill_gainer="${backfill_pair%%$'\t'*}"
  backfill_loser="${backfill_pair#*$'\t'}"
  pykrx_gainer="${pykrx_pair%%$'\t'*}"
  pykrx_loser="${pykrx_pair#*$'\t'}"

  if [ "$backfill_gainer" = "$pykrx_gainer" ] && [ "$backfill_loser" = "$pykrx_loser" ]; then
    matched=$((matched + 1))
    verdict="MATCH"
  else
    verdict="MISMATCH"
  fi

  echo "[$d] $verdict sourceUsed=$source_used confidence=$confidence"
  echo "  backfill: topGainer='$backfill_gainer' topLoser='$backfill_loser'"
  echo "  pykrx:    topGainer='$pykrx_gainer' topLoser='$pykrx_loser'"
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
