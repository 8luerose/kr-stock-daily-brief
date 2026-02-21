#!/usr/bin/env python3
"""Verify backend-generated leaders against Naver Finance HTML for the *effective* trading date.

What this script does
- Calls backend: POST /api/summaries/{requestedDate}/generate
- Uses response.summary.effectiveDate (YYYYMMDD) as the trading date to verify
- Verifies:
  * topGainers/topLosers: daily return computed from Naver item/sise_day.naver (close + 전일비)
  * mostMentionedTop: count of board posts on Naver item/board.naver on that date (cap pages)

No backend/frontend behavior is changed; this is an external verification harness.

Notes
- If backend is gated with PUBLIC_KEY, pass it via env PUBLIC_KEY (adds ?k=PUBLIC_KEY to API calls)
- Naver pages are HTML; parsing here is intentionally lightweight (stdlib only).
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple


NAVER_BASE = "https://finance.naver.com"
KRX_JSON_ENDPOINT = "https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd"
KRX_REFERER = "https://data.krx.co.kr/contents/MDC/MDI/outerLoader/index.cmd"
DEFAULT_BACKEND = "http://localhost:8080"


@dataclass
class CheckResult:
    label: str
    code: str
    expected: Optional[float]
    # Two independent verifiers (Naver HTML vs KRX Data Portal JSON)
    actual_naver: Optional[float]
    actual_krx: Optional[float]
    ok: bool
    detail: str
    url: str


def _http_get(url: str, timeout_s: float = 10.0, extra_headers: Optional[Dict[str, str]] = None) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.7",
    }
    if extra_headers:
        headers.update(extra_headers)

    req = urllib.request.Request(url, headers=headers, method="GET")
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        data = resp.read()
    # Naver pages are typically euc-kr, but often declare charset; utf-8 decoding works frequently.
    # Try utf-8 first, then fallback to euc-kr.
    for enc in ("utf-8", "euc-kr", "cp949"):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def _http_post_json(url: str, payload: Optional[dict] = None, timeout_s: float = 30.0, extra_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    body = b""
    headers = {
        "User-Agent": "kr-brief-verifier/1.0",
        "Accept": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        data = resp.read().decode("utf-8")
    return json.loads(data)


def _http_post_form(url: str, form: Dict[str, str], timeout_s: float = 30.0, extra_headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    """POST application/x-www-form-urlencoded and parse JSON response."""
    body = urllib.parse.urlencode(form).encode("utf-8")
    headers = {
        "User-Agent": "kr-brief-verifier/1.0",
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    }
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        data = resp.read().decode("utf-8")
    return json.loads(data)


def _to_yyyymmdd_dotted(effective_yyyymmdd: str) -> str:
    # "20260220" -> "2026.02.20"
    return f"{effective_yyyymmdd[0:4]}.{effective_yyyymmdd[4:6]}.{effective_yyyymmdd[6:8]}"


def _parse_float_maybe(x: Any) -> Optional[float]:
    if x is None:
        return None
    if isinstance(x, (int, float)):
        return float(x)
    s = str(x).strip()
    if not s:
        return None
    s = s.replace("%", "")
    # keep leading sign
    m = re.search(r"[-+]?\d+(?:\.\d+)?", s)
    return float(m.group(0)) if m else None


def _parse_int_maybe(x: Any) -> Optional[int]:
    if x is None:
        return None
    if isinstance(x, int):
        return x
    s = str(x).strip().replace(",", "")
    if not s:
        return None
    m = re.search(r"\d+", s)
    return int(m.group(0)) if m else None


def _extract_code(obj: Any) -> Optional[str]:
    if obj is None:
        return None
    if isinstance(obj, str):
        # sometimes code itself is stored as the value
        if re.fullmatch(r"\d{6}", obj.strip()):
            return obj.strip()
        return None
    if isinstance(obj, dict):
        for k in ("code", "ticker", "symbol"):
            v = obj.get(k)
            if isinstance(v, str) and re.fullmatch(r"\d{6}", v.strip()):
                return v.strip()
    return None


def _extract_name(obj: Any) -> Optional[str]:
    if isinstance(obj, dict):
        for k in ("name", "stockName"):
            v = obj.get(k)
            if isinstance(v, str) and v.strip():
                return v.strip()
    return None


def _find_sise_day_row_for_date(html: str, date_dotted: str) -> Optional[Tuple[int, int, str]]:
    """Return (close, diff_abs, direction) where direction in {"up","down","flat"}.

    Implementation detail
    - We find the <tr> containing the date, then parse the first numeric <span> values *after* the date.
      On Naver's `sise_day`, those are typically: 종가, 전일비, 시가, 고가, 저가, 거래량.
    """

    tr_blocks = re.findall(r"<tr[^>]*>.*?</tr>", html, flags=re.DOTALL | re.IGNORECASE)
    for tr in tr_blocks:
        if date_dotted not in tr:
            continue

        # direction from the 'blind' text inside the 전일비 cell.
        # Examples seen on Naver: 상승, 하락, 보합, 상한가, 하한가
        direction = "flat"
        m_dir = re.search(r"class=\"blind\"\s*>\s*([^<\s]+)\s*</span>", tr)
        if m_dir:
            t = m_dir.group(1)
            if ("하락" in t) or ("하한" in t):
                direction = "down"
            elif ("상승" in t) or ("상한" in t):
                direction = "up"
            else:
                direction = "flat"

        # Slice the row after the date cell to avoid picking unrelated numbers.
        idx = tr.find(date_dotted)
        tail = tr[idx:]
        # first few numeric spans in the tail: close, diff, open, high, low, volume
        span_nums = re.findall(r"<span[^>]*>\s*([0-9][0-9,]*)\s*</span>", tail, flags=re.IGNORECASE)
        if len(span_nums) < 2:
            # fallback: any numeric text inside tail
            span_nums = re.findall(r">\s*([0-9][0-9,]*)\s*<", tail)
        if len(span_nums) < 2:
            continue

        try:
            close = int(span_nums[0].replace(",", ""))
            diff_abs = int(span_nums[1].replace(",", ""))
        except ValueError:
            continue

        return close, diff_abs, direction

    return None


def _compute_rate_from_close_diff(close: int, diff_abs: int, direction: str) -> Optional[float]:
    if direction == "up":
        prev = close - diff_abs
    elif direction == "down":
        prev = close + diff_abs
    else:
        prev = close
    if prev == 0:
        return None
    return (close - prev) / prev * 100.0


def _krx_rate_for_code(strt_dd: str, end_dd: str, code: str) -> Optional[float]:
    """Fetch KRX (Data Portal) FLUC_RT for a single code in the 전종목등락률 dataset.

    This matches pykrx's underlying source more closely than Naver HTML.
    """
    payload = {
        "bld": "dbms/MDC/STAT/standard/MDCSTAT01602",
        "strtDd": strt_dd,
        "endDd": end_dd,
        "mktId": "ALL",
        "adjStkPrc": "1",
    }
    try:
        js = _http_post_form(
            KRX_JSON_ENDPOINT,
            payload,
            timeout_s=20.0,
            extra_headers={
                "Referer": KRX_REFERER,
            },
        )
    except Exception:
        # We'll treat as unavailable.
        return None

    rows = js.get("OutBlock_1")
    if not isinstance(rows, list):
        return None

    for r in rows:
        if not isinstance(r, dict):
            continue
        if r.get("ISU_SRT_CD") == code:
            return _parse_float_maybe(r.get("FLUC_RT"))
    return None


def verify_sise_day_rate(
    code: str,
    effective_yyyymmdd: str,
    expected_rate: Optional[float],
    max_pages: int = 5,
    sleep_s: float = 0.05,
) -> CheckResult:
    """Verify daily return.

    We compute:
    - actual_naver: from Naver sise_day (close + 전일비)
    - actual_krx: from KRX Data Portal JSON (FLUC_RT)

    Pass condition:
    - OK if expected_rate matches KRX within tolerance (±0.2pp)
      (because backend/pykrx is KRX-based)
    - We still report Naver rate to surface discrepancies.
    """

    date_dotted = _to_yyyymmdd_dotted(effective_yyyymmdd)

    # KRX reference (pykrx-like)
    # Use prev = D-1 business day (string arithmetic is OK because backend already computed effectiveDate)
    d = _dt.datetime.strptime(effective_yyyymmdd, "%Y%m%d").date() - _dt.timedelta(days=1)
    prev_dd = d.strftime("%Y%m%d")
    actual_krx = _krx_rate_for_code(prev_dd, effective_yyyymmdd, code)

    # Naver HTML reference
    actual_naver: Optional[float] = None
    last_url = ""
    for page in range(1, max_pages + 1):
        url = f"{NAVER_BASE}/item/sise_day.naver?code={urllib.parse.quote(code)}&page={page}"
        last_url = url
        try:
            html = _http_get(url, timeout_s=10.0)
        except Exception as e:
            return CheckResult(
                label="sise_day",
                code=code,
                expected=expected_rate,
                actual_naver=None,
                actual_krx=actual_krx,
                ok=False,
                detail=f"HTTP error fetching Naver sise_day page={page}: {e}",
                url=url,
            )

        row = _find_sise_day_row_for_date(html, date_dotted)
        if row is not None:
            close, diff_abs, direction = row
            actual_naver = _compute_rate_from_close_diff(close, diff_abs, direction)
            break
        time.sleep(sleep_s)

    # Decision based on KRX rate match
    ok = False
    detail_parts = []

    if expected_rate is None:
        detail_parts.append("expected missing")
    else:
        if actual_krx is None:
            detail_parts.append("KRX rate unavailable")
        else:
            delta_krx = abs(actual_krx - expected_rate)
            ok = delta_krx <= 0.2
            detail_parts.append(
                f"KRX rate={actual_krx:.2f}% (expected={expected_rate:.2f}%, |Δ|={delta_krx:.2f}pp)"
            )

    if actual_naver is None:
        detail_parts.append(f"Naver row {date_dotted} not found within first {max_pages} pages")
    else:
        detail_parts.append(f"Naver rate={actual_naver:.2f}%")

    return CheckResult(
        label="sise_day",
        code=code,
        expected=expected_rate,
        actual_naver=actual_naver,
        actual_krx=actual_krx,
        ok=ok,
        detail="; ".join(detail_parts),
        url=last_url,
    )


def _count_board_posts_on_date(html: str, date_dotted: str) -> int:
    # Board page has per-row <td class="date">YYYY.MM.DD HH:MM</td>
    # We count occurrences for the date prefix.
    return len(re.findall(re.escape(date_dotted) + r"\s+\d{2}:\d{2}", html))


def verify_board_count(code: str, effective_yyyymmdd: str, expected_count: Optional[int], max_pages: int = 3, sleep_s: float = 0.05) -> CheckResult:
    date_dotted = _to_yyyymmdd_dotted(effective_yyyymmdd)
    total = 0
    last_url = ""
    for page in range(1, max_pages + 1):
        url = f"{NAVER_BASE}/item/board.naver?code={urllib.parse.quote(code)}&page={page}"
        last_url = url
        try:
            html = _http_get(url, timeout_s=10.0)
        except Exception as e:
            return CheckResult(
                label="board",
                code=code,
                expected=float(expected_count) if expected_count is not None else None,
                actual_naver=None,
                actual_krx=None,
                ok=False,
                detail=f"HTTP error fetching Naver board page={page}: {e}",
                url=url,
            )
        total += _count_board_posts_on_date(html, date_dotted)
        time.sleep(sleep_s)

    if expected_count is None:
        ok = False
        detail = f"Counted {total} posts on {date_dotted} (expected missing)"
        exp_f = None
    else:
        ok = (total == expected_count)
        detail = f"Counted {total} posts on {date_dotted} across pages 1..{max_pages} (expected {expected_count})"
        exp_f = float(expected_count)

    return CheckResult(
        label="board",
        code=code,
        expected=exp_f,
        actual_naver=float(total),
        actual_krx=None,
        ok=ok,
        detail=detail,
        url=last_url,
    )


def _backend_url(base: str, path: str, public_key: Optional[str]) -> str:
    url = base.rstrip("/") + path
    if public_key:
        join = "&" if ("?" in url) else "?"
        url = f"{url}{join}k={urllib.parse.quote(public_key)}"
    return url


def generate_summary(base: str, requested_date: str, public_key: Optional[str]) -> Dict[str, Any]:
    url = _backend_url(base, f"/api/summaries/{requested_date}/generate", public_key)
    return _http_post_json(url, payload=None, timeout_s=60.0)


def _fmt_ok(ok: bool) -> str:
    return "OK" if ok else "MISMATCH"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--backend",
        default=os.environ.get("BACKEND_URL", DEFAULT_BACKEND),
        help=f"Backend base URL (default: {DEFAULT_BACKEND})",
    )
    ap.add_argument(
        "--public-key",
        default=os.environ.get("PUBLIC_KEY") or os.environ.get("BACKEND_PUBLIC_KEY"),
        help="Optional PUBLIC_KEY gate (adds ?k=... to API calls)",
    )
    ap.add_argument(
        "--dates",
        nargs="+",
        default=["2026-02-02", "2026-02-09", "2026-02-16", "2026-02-20"],
        help="Requested ISO dates to verify",
    )
    ap.add_argument("--out", default="scripts/verify_report.md", help="Output report markdown path")
    ap.add_argument("--max-sise-pages", type=int, default=5, help="Max Naver sise_day pages to scan per code")
    ap.add_argument("--max-board-pages", type=int, default=3, help="Max Naver board pages to scan per code")
    args = ap.parse_args()

    report_lines: List[str] = []
    report_lines.append("# Naver HTML Verification Report\n")
    report_lines.append(f"Generated at: `{_dt.datetime.now().isoformat(timespec='seconds')}`\n")
    report_lines.append(f"Backend: `{args.backend}`\n")
    if args.public_key:
        report_lines.append("PUBLIC_KEY gate: enabled (`k=***`)\n")
    else:
        report_lines.append("PUBLIC_KEY gate: not set\n")

    mismatches: List[str] = []

    for requested_date in args.dates:
        print(f"[verify] requested_date={requested_date} ...", file=sys.stderr)
        report_lines.append(f"\n## Requested date: `{requested_date}`\n")
        try:
            summary = generate_summary(args.backend, requested_date, args.public_key)
        except urllib.error.HTTPError as e:
            body = ""
            try:
                body = e.read().decode("utf-8", errors="replace")
            except Exception:
                pass
            report_lines.append(f"Backend error: HTTP {e.code} {e.reason}\n\n```\n{body}\n```\n")
            mismatches.append(f"{requested_date}: backend HTTP error {e.code}")
            continue
        except Exception as e:
            report_lines.append(f"Backend error: {e}\n")
            mismatches.append(f"{requested_date}: backend error {e}")
            continue

        effective = str(summary.get("effectiveDate") or "")
        report_lines.append(f"- effectiveDate: `{effective}`\n")
        report_lines.append(f"- marketClosed: `{summary.get('marketClosed')}`\n")

        # leaders to show (and codes if present)
        def _leader_line(field: str) -> str:
            val = summary.get(field)
            code = _extract_code(summary.get(field + "Item") or summary.get(field + "Stock") or summary.get(field + "Meta"))
            return f"  - {field}: `{val}`" + (f" (code: `{code}`)" if code else "")

        report_lines.append("\n### Backend leaders (for context)\n")
        for f in ("topGainer", "topLoser", "mostMentioned", "kospiPick", "kosdaqPick"):
            report_lines.append(_leader_line(f) + "\n")

        # Verify gainers/losers
        report_lines.append("\n### topGainers / topLosers rate verification\n")
        report_lines.append("| side | rank | code | name | expectedRate(%) | naverRate(%) | krxRate(%) | result | detail |\n")
        report_lines.append("|---|---:|---|---|---:|---:|---:|---|---|\n")

        def _iter_entries(key: str) -> List[dict]:
            arr = summary.get(key)
            return arr if isinstance(arr, list) else []

        for side_key, label in (("topGainers", "Gainer"), ("topLosers", "Loser")):
            entries = _iter_entries(side_key)[:3]
            for i, e in enumerate(entries, start=1):
                code = _extract_code(e) or (e.get("code") if isinstance(e, dict) else None)
                name = _extract_name(e) or (e.get("name") if isinstance(e, dict) else None)
                expected_rate = _parse_float_maybe(e.get("rate") if isinstance(e, dict) else None)
                if not code:
                    cr = CheckResult(
                        label="sise_day",
                        code="(missing)",
                        expected=expected_rate,
                        actual_naver=None,
                        actual_krx=None,
                        ok=False,
                        detail=f"Backend entry missing code: {e}",
                        url="",
                    )
                else:
                    print(f"  [sise_day] {side_key}[{i}] code={code} ...", file=sys.stderr)
                    cr = verify_sise_day_rate(
                        code=code,
                        effective_yyyymmdd=effective,
                        expected_rate=expected_rate,
                        max_pages=args.max_sise_pages,
                    )

                if not cr.ok:
                    mismatches.append(f"{requested_date} {side_key}[{i}] {code}: {cr.detail} ({cr.url})")

                naver_rate_txt = f"{cr.actual_naver:.2f}" if cr.actual_naver is not None else ""
                krx_rate_txt = f"{cr.actual_krx:.2f}" if cr.actual_krx is not None else ""
                report_lines.append(
                    f"| {label} | {i} | `{code or ''}` | {name or ''} | {expected_rate if expected_rate is not None else ''} | {naver_rate_txt} | {krx_rate_txt} | {_fmt_ok(cr.ok)} | {cr.detail} ([link]({cr.url})) |\n"
                )

        # Verify mostMentionedTop counts
        report_lines.append("\n### mostMentionedTop vs Naver board (post count)\n")
        report_lines.append("| rank | code | name | expectedCount | actualCount | result | detail |\n")
        report_lines.append("|---:|---|---|---:|---:|---|---|\n")
        mm_entries = _iter_entries("mostMentionedTop")[:3]
        for i, e in enumerate(mm_entries, start=1):
            code = _extract_code(e) or (e.get("code") if isinstance(e, dict) else None)
            name = _extract_name(e) or (e.get("name") if isinstance(e, dict) else None)
            expected_count = _parse_int_maybe(e.get("count") if isinstance(e, dict) else None)
            if not code:
                cr = CheckResult(
                    label="board",
                    code="(missing)",
                    expected=float(expected_count) if expected_count is not None else None,
                    actual_naver=None,
                    actual_krx=None,
                    ok=False,
                    detail=f"Backend entry missing code: {e}",
                    url="",
                )
            else:
                print(f"  [board] mostMentionedTop[{i}] code={code} ...", file=sys.stderr)
                cr = verify_board_count(
                    code=code,
                    effective_yyyymmdd=effective,
                    expected_count=expected_count,
                    max_pages=args.max_board_pages,
                )
            if not cr.ok:
                mismatches.append(f"{requested_date} mostMentionedTop[{i}] {code}: {cr.detail} ({cr.url})")
            report_lines.append(
                f"| {i} | `{code or ''}` | {name or ''} | {expected_count if expected_count is not None else ''} | {int(cr.actual_naver) if cr.actual_naver is not None else ''} | {_fmt_ok(cr.ok)} | {cr.detail} ([link]({cr.url})) |\n"
            )

    # Summary section
    report_lines.append("\n---\n")
    report_lines.append("## Summary\n")
    if mismatches:
        report_lines.append(f"- Overall: **MISMATCHES FOUND** ({len(mismatches)})\n")
        report_lines.append("\n### Mismatch list\n")
        for m in mismatches:
            report_lines.append(f"- {m}\n")
    else:
        report_lines.append("- Overall: **ALL OK**\n")

    report_lines.append("\n---\n")
    report_lines.append("## Plan if mismatched\n")
    report_lines.extend(
        [
            "1. **Confirm effectiveDate alignment**: ensure backend’s `effectiveDate` matches the intended trading day (weekend/holiday roll-forward).\n",
            "2. **Switch verification source (if Naver HTML is unstable)**: add an alternative verifier using KRX Data Portal JSON / pykrx outputs, then compare backend vs KRX as primary truth.\n",
            "3. **Harden Naver parsing**:\n",
            "   - Parse using a DOM parser (BeautifulSoup/lxml) in a dedicated venv;\n",
            "   - For sise_day: verify the columns by header names rather than positional heuristics;\n",
            "   - For 전일비: explicitly parse 상승/하락/보합/상한가/하한가 labels + numeric.\n",
            "4. **Increase evidence capture**: store raw HTML snapshots for the exact pages/rows that mismatched (timestamped under `scripts/evidence/`).\n",
            "5. **Tune network behavior**: increase timeouts/retries, add backoff, and optionally increase max pages (board cap may miss older posts if volume is huge).\n",
            "6. **Document known exceptions**: corporate actions, trading halts, abnormal price limits, or data corrections may cause small discrepancies—record these with links.\n",
        ]
    )

    out_path = args.out
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("".join(report_lines))

    print(f"Wrote report: {out_path}")
    if mismatches:
        print(f"MISMATCHES: {len(mismatches)}")
        return 2
    print("ALL OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
