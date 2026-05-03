#!/usr/bin/env bash
set -euo pipefail

RESULT_DIR="${BACKEND_TEST_RESULTS_DIR:-backend/build/test-results/test}"

escape_annotation() {
  local value="$1"
  value="${value//'%'/'%25'}"
  value="${value//$'\r'/'%0D'}"
  value="${value//$'\n'/'%0A'}"
  printf "%s" "$value"
}

echo "== Backend test XML failures/errors =="

if [[ ! -d "$RESULT_DIR" ]]; then
  echo "No backend test results directory found: $RESULT_DIR"
  exit 0
fi

found=0
while IFS= read -r -d '' file; do
  if ! grep -Eq '<(failure|error)( |>)' "$file"; then
    continue
  fi
  found=1
  summary="$(
    awk '/<(failure|error)( |>)/,/<\/(failure|error)>/ {print}' "$file" \
      | head -c 1800 \
      | tr '\r\n' '  '
  )"
  if [[ -z "$summary" ]]; then
    summary="$(grep -E '<testsuite ' "$file" | head -1 | head -c 1800)"
  fi
  echo "$file"
  echo "$summary"
  echo "::error file=$file,title=Backend test failure::$(escape_annotation "$summary")"
done < <(find "$RESULT_DIR" -name '*.xml' -print0)

if [[ "$found" == "0" ]]; then
  echo "No XML failure/error nodes found."
fi
