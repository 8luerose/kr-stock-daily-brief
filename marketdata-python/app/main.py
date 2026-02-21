from __future__ import annotations

import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from functools import lru_cache

from fastapi import FastAPI, HTTPException
from pykrx import stock

app = FastAPI(title="kr-stock-daily-brief marketdata", version="0.6.1")


NAVER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


def _parse_date(date_str: str) -> str:
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%Y%m%d")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid_date: {date_str}") from e


def _format_ymd_dot(ymd: str) -> str:
    return f"{ymd[0:4]}.{ymd[4:6]}.{ymd[6:8]}"


def _previous_business_day(ymd: str) -> str:
    d = datetime.strptime(ymd, "%Y%m%d").date() - timedelta(days=1)
    # prev=True: if holiday/weekend, go to previous business day
    return stock.get_nearest_business_day_in_a_week(d.strftime("%Y%m%d"), prev=True)


def _effective_business_day_or_previous(ymd: str) -> tuple[str, str]:
    """Return (effective_ymd, note).

    정책(2안): 요청 날짜는 유지하되, 실제 계산은 직전 영업일로 보정.

    pykrx signature: get_nearest_business_day_in_a_week(date, prev=True|False)
    """
    try:
        # If ymd is a trading day, prev=True returns itself.
        nearest_prev = stock.get_nearest_business_day_in_a_week(ymd, prev=True)
        if nearest_prev == ymd:
            return ymd, ""

        effective = nearest_prev
        return effective, f"adjusted_to_previous_business_day: requested={ymd}, effective={effective}"
    except Exception as e:
        effective = _previous_business_day(ymd)
        return effective, (
            f"adjusted_fallback: requested={ymd}, effective={effective}, reason=pykrx_calendar_error({type(e).__name__})"
        )


def _name(ticker: str) -> str:
    try:
        return stock.get_market_ticker_name(ticker)
    except Exception:
        return ticker


def _safe_float(value) -> float:
    try:
        return float(value)
    except Exception:
        return 0.0


def _naver_fetch(url: str, timeout: int = 5) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": NAVER_UA})
    with urllib.request.urlopen(req, timeout=timeout) as f:
        raw = f.read()

    try:
        return raw.decode("euc-kr", "ignore")
    except Exception:
        return raw.decode("utf-8", "ignore")


_BOARD_DATE_RE = re.compile(r'<span class="tah p10 gray03">(\d{4}\.\d{2}\.\d{2})')


_SISE_TR_RE = re.compile(r"<tr[^>]*>.*?</tr>", re.IGNORECASE | re.DOTALL)


def _naver_sise_day_rate(code: str, ymd: str, max_pages: int = 3) -> float | None:
    """Compute daily rate (%) from Naver item/sise_day for given date (ymd=YYYYMMDD)."""
    target = _format_ymd_dot(ymd)
    last_html = ""

    for page in range(1, max_pages + 1):
        url = f"https://finance.naver.com/item/sise_day.naver?code={code}&page={page}"
        try:
            html = _naver_fetch(url)
            last_html = html
        except Exception:
            continue

        for tr in _SISE_TR_RE.findall(html):
            if target not in tr:
                continue

            # direction (상승/하락/보합/상한가/하한가)
            direction = "flat"
            m_dir = re.search(r'class="blind"\s*>\s*([^<\s]+)\s*</span>', tr)
            if m_dir:
                t = m_dir.group(1)
                if ("하락" in t) or ("하한" in t):
                    direction = "down"
                elif ("상승" in t) or ("상한" in t):
                    direction = "up"

            # numeric spans after date: close, diff, open, high, low, volume
            idx = tr.find(target)
            tail = tr[idx:] if idx >= 0 else tr
            nums = re.findall(r"<span[^>]*>\s*([0-9][0-9,]*)\s*</span>", tail)
            if len(nums) < 2:
                continue

            close = int(nums[0].replace(",", ""))
            diff_abs = int(nums[1].replace(",", ""))

            if direction == "up":
                prev_close = close - diff_abs
            elif direction == "down":
                prev_close = close + diff_abs
            else:
                prev_close = close

            if prev_close <= 0:
                return None
            return (close - prev_close) / prev_close * 100.0

    return None


@lru_cache(maxsize=20000)
def _naver_board_posts_on_date(ticker: str, ymd: str, max_pages: int = 3) -> int:
    """Count posts on Naver item board for the given ticker and date.

    Cap pages for latency/abuse control. In very hot tickers, this may undercount,
    but we're using this as a ranking heuristic (top3) among traded-value top universe.
    """
    target = _format_ymd_dot(ymd)
    count = 0

    seen_target = False
    for page in range(1, max_pages + 1):
        url = f"https://finance.naver.com/item/board.naver?code={ticker}&page={page}"
        html = _naver_fetch(url)
        dates = _BOARD_DATE_RE.findall(html)
        if not dates:
            break

        for d in dates:
            if d == target:
                count += 1
                seen_target = True

        last = dates[-1]
        if last < target and seen_target:
            break

        first = dates[0]
        if first < target and not seen_target:
            break

    return count


def _top_rate_lists(df, n: int = 3) -> tuple[list[dict], list[dict]]:
    gainers = []
    losers = []

    for ticker, row in df["등락률"].nlargest(n).items():
        gainers.append({"code": ticker, "name": _name(ticker), "rate": round(_safe_float(row), 2)})

    for ticker, row in df["등락률"].nsmallest(n).items():
        losers.append({"code": ticker, "name": _name(ticker), "rate": round(_safe_float(row), 2)})

    return gainers, losers


def _top_traded_value_universe(ymd: str, n: int = 200) -> list[str]:
    ohlcv = stock.get_market_ohlcv_by_ticker(ymd, market="ALL")
    if ohlcv is None or len(ohlcv.index) == 0:
        return []

    if "거래대금" in ohlcv.columns:
        s = ohlcv["거래대금"]
    else:
        close = ohlcv["종가"] if "종가" in ohlcv.columns else 0
        vol = ohlcv["거래량"] if "거래량" in ohlcv.columns else 0
        s = close * vol

    s = s.dropna()
    return s.nlargest(n).index.tolist()


def _most_mentioned_by_board_posts(
    tickers: list[str],
    ymd: str,
    topk: int = 3,
    max_pages: int = 3,
    timeout_seconds: float = 15.0,
) -> list[dict]:
    if not tickers:
        return []

    started = time.time()
    results: list[dict] = []

    max_workers = 64
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        fut_map = {ex.submit(_naver_board_posts_on_date, t, ymd, max_pages): t for t in tickers}

        for fut in as_completed(fut_map):
            t = fut_map[fut]
            if time.time() - started > timeout_seconds:
                # Stop collecting; use partial results.
                break
            try:
                c = int(fut.result() or 0)
            except Exception:
                c = 0
            results.append({"code": t, "name": _name(t), "count": c})

    results.sort(key=lambda x: (x.get("count", 0), x.get("code", "")), reverse=True)
    return results[:topk]


@app.get("/health")
def health():
    return {"status": "UP"}


@app.get("/leaders")
def leaders(
    date: str,
    mentionsUniverse: int = 200,
    mentionsMaxPages: int = 3,
    mentionsTimeoutSeconds: float = 15.0,
):
    requested_ymd = _parse_date(date)
    effective_ymd, adjust_note = _effective_business_day_or_previous(requested_ymd)

    # Leader ranking policy: match NAVER sise_day exactly.
    # Strategy: use pykrx to pick a reasonable candidate set, then compute rates from Naver HTML.
    try:
        prev = _previous_business_day(effective_ymd)
        df_change = stock.get_market_price_change_by_ticker(prev, effective_ymd, market="ALL")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"pykrx_error: {e}") from e

    if df_change is None or len(df_change.index) == 0:
        raise HTTPException(status_code=404, detail="no_data")

    if "등락률" not in df_change.columns:
        raise HTTPException(status_code=502, detail="unexpected_dataframe_columns: missing 등락률")

    # Candidate pool size: smaller to keep Naver HTML fetch cost bounded.
    # (We only need a small pool to correctly identify top3 in most cases.)
    candidate_n = 60
    candidates = set(df_change["등락률"].nlargest(candidate_n).index.tolist())
    candidates.update(df_change["등락률"].nsmallest(candidate_n).index.tolist())

    # Compute Naver rate for candidates
    scored = []
    for code in candidates:
        rate = _naver_sise_day_rate(code, effective_ymd, max_pages=3)
        if rate is None:
            continue
        scored.append({"code": code, "name": _name(code), "rate": round(rate, 2)})

    if not scored:
        raise HTTPException(status_code=502, detail="naver_rate_empty")

    scored_sorted = sorted(scored, key=lambda x: x["rate"], reverse=True)
    top_gainers = scored_sorted[:3]
    top_losers = list(sorted(scored, key=lambda x: x["rate"]))[:3]

    top_gainer_ticker = top_gainers[0]["code"]
    top_loser_ticker = top_losers[0]["code"]

    # Mentions universe
    try:
        universe = _top_traded_value_universe(effective_ymd, n=max(1, min(mentionsUniverse, 2000)))
    except Exception:
        universe = []

    most_mentioned_list = _most_mentioned_by_board_posts(
        universe,
        effective_ymd,
        topk=3,
        max_pages=max(1, min(mentionsMaxPages, 50)),
        timeout_seconds=max(1.0, min(mentionsTimeoutSeconds, 120.0)),
    )
    most_ticker = most_mentioned_list[0]["code"] if most_mentioned_list else ""

    notes_parts = [
        "Source: pykrx(KRX historical change)",
        f"effective_date={effective_ymd}",
        f"prev_date={prev}",
        "mostMentioned=naver_board_posts(universe=traded_value_topN)",
        f"mentions_universe_size={len(universe)}",
        f"mentions_max_pages={mentionsMaxPages}",
        f"mentions_timeout_seconds={mentionsTimeoutSeconds}",
    ]
    if adjust_note:
        notes_parts.append(adjust_note)

    notes_parts.append(
        "codes: "
        f"topGainer={top_gainer_ticker}, topLoser={top_loser_ticker}, mostMentioned={most_ticker}, "
        f"kospiPick={top_gainer_ticker}, kosdaqPick={top_gainer_ticker}"
    )

    return {
        "date": date,
        "effectiveDate": effective_ymd,
        "rawTopGainer": _name(top_gainer_ticker),
        "rawTopLoser": _name(top_loser_ticker),
        "filteredTopGainer": _name(top_gainer_ticker),
        "filteredTopLoser": _name(top_loser_ticker),
        "topGainer": _name(top_gainer_ticker),
        "topLoser": _name(top_loser_ticker),
        "mostMentioned": _name(most_ticker) if most_ticker else "-",
        "kospiPick": _name(top_gainer_ticker),
        "kosdaqPick": _name(top_gainer_ticker),
        "topGainerCode": top_gainer_ticker,
        "topLoserCode": top_loser_ticker,
        "rawTopGainerCode": top_gainer_ticker,
        "rawTopLoserCode": top_loser_ticker,
        "filteredTopGainerCode": top_gainer_ticker,
        "filteredTopLoserCode": top_loser_ticker,
        "mostMentionedCode": most_ticker,
        "kospiPickCode": top_gainer_ticker,
        "kosdaqPickCode": top_gainer_ticker,
        "topGainers": top_gainers,
        "topLosers": top_losers,
        "mostMentionedTop": most_mentioned_list,
        "anomalies": [],
        "rankingWarning": "",
        "source": "pykrx(KRX historical change) + naver(item board)",
        "notes": "\n".join(notes_parts),
    }
