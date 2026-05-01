from __future__ import annotations

import re
import time


def _is_normal_ticker(code: str) -> bool:
    """Return True if code is a standard 6-digit Korean stock code."""
    return bool(re.match(r'^[0-9]{6}$', str(code)))
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from functools import lru_cache

import os

from fastapi import FastAPI, HTTPException
from pykrx import stock
import pandas as pd

# --- KRX access hardening ---
# pykrx >= 1.2.5 supports KRX login session via KRX_ID/KRX_PW env vars.
# When set, pykrx handles login automatically. When not set, fall back to
# the monkey-patch below (persistent session + browser headers) so that
# unauthenticated requests still work as well as possible.

NAVER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)

if not os.getenv("KRX_ID"):
    # No KRX credentials → use monkey-patch fallback
    try:
        import requests
        from pykrx.website.comm import webio as _webio

        _KRX_HDRS = {
            "User-Agent": NAVER_UA,
            "Referer": "https://data.krx.co.kr/",
            "Origin": "https://data.krx.co.kr",
        }

        _krx_session = requests.Session()
        _krx_session.headers.update(_KRX_HDRS)
        # Warm up cookies
        try:
            _krx_session.get(
                "https://data.krx.co.kr/contents/MDC/MDI/outerLoader/index.cmd?menuId=MDC0201020101",
                timeout=10,
            )
        except Exception:
            pass

        # Make webio use our session (has .get/.post).
        _webio.requests = _krx_session  # type: ignore

        _orig_get_init = _webio.Get.__init__
        _orig_post_init = _webio.Post.__init__

        def _get_init(self):
            _orig_get_init(self)
            self.headers.update(_KRX_HDRS)

        def _post_init(self, headers=None):
            _orig_post_init(self, headers=headers)
            self.headers.update(_KRX_HDRS)

        _webio.Get.__init__ = _get_init  # type: ignore
        _webio.Post.__init__ = _post_init  # type: ignore
    except Exception:
        pass

app = FastAPI(title="kr-stock-daily-brief marketdata", version="0.6.2")



def _parse_date(date_str: str) -> str:
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%Y%m%d")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid_date: {date_str}") from e


def _format_ymd_dot(ymd: str) -> str:
    return f"{ymd[0:4]}.{ymd[4:6]}.{ymd[6:8]}"


def _previous_business_day(ymd: str) -> str:
    """Best-effort previous business day.

    Prefer pykrx calendar, but fall back to a simple weekday-only rule if pykrx
    calendar lookup fails (e.g., upstream KRX calendar returns empty).
    """
    d = datetime.strptime(ymd, "%Y%m%d").date() - timedelta(days=1)
    try:
        # prev=True: if holiday/weekend, go to previous business day
        return stock.get_nearest_business_day_in_a_week(d.strftime("%Y%m%d"), prev=True)
    except Exception:
        # Fallback: skip weekends only.
        while d.weekday() >= 5:  # 5=Sat, 6=Sun
            d -= timedelta(days=1)
        return d.strftime("%Y%m%d")


def _effective_business_day_or_previous(ymd: str) -> tuple[str, str]:
    """Return (effective_ymd, note).

    정책(2안): 요청 날짜는 유지하되, 실제 계산은 직전 영업일로 보정.

    We prefer pykrx calendar, but if that fails we fall back to a simple
    weekday-only rule to keep the API responsive.
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


@lru_cache(maxsize=50000)
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


def _naver_today_movers(sosok: int) -> tuple[list[dict], list[dict]]:
    """Best-effort top movers for *today* from Naver sise pages.

    Returns (gainers, losers) lists with fields: code, name, rate, volume.
    """

    def _parse_table(url: str) -> list[dict]:
        html = _naver_fetch(url)
        # Try to locate the first HTML table that contains 종목명.
        tables = pd.read_html(html)
        target = None
        for t in tables:
            if "종목명" in t.columns:
                target = t
                break
        if target is None:
            return []

        out = []
        for _, row in target.iterrows():
            name = str(row.get("종목명", "")).strip()
            if not name or name == "nan":
                continue

            # 등락률 may be like "+29.96%" or 29.96
            rate_raw = row.get("등락률")
            rate = None
            try:
                rate = float(str(rate_raw).replace("%", "").replace(",", "").replace("+", ""))
            except Exception:
                rate = 0.0

            vol_raw = row.get("거래량")
            vol = 0
            try:
                vol = int(str(vol_raw).replace(",", ""))
            except Exception:
                vol = 0

            out.append({"name": name, "rate": round(rate, 2), "volume": vol})
        return out

    rise_url = f"https://finance.naver.com/sise/sise_rise.nhn?sosok={sosok}"
    fall_url = f"https://finance.naver.com/sise/sise_fall.nhn?sosok={sosok}"

    rise = _parse_table(rise_url)
    fall = _parse_table(fall_url)

    # Naver pages are already sorted, but keep deterministic sorting.
    rise.sort(key=lambda x: (x.get("rate", 0), x.get("volume", 0), x.get("name", "")), reverse=True)
    fall.sort(key=lambda x: (x.get("rate", 0), -x.get("volume", 0), x.get("name", "")))

    # code is not easily available from read_html output; keep blank.
    gainers = [{"code": "", "name": x["name"], "rate": x["rate"], "volume": x["volume"]} for x in rise[:3]]
    losers = [{"code": "", "name": x["name"], "rate": x["rate"], "volume": x["volume"]} for x in fall[:3]]
    return gainers, losers


def _top_rate_lists_from_rates(rates: dict, universe: set[str] | None = None, n: int = 3) -> tuple[list[dict], list[dict]]:
    """Build top gainers/losers from a pre-calculated {ticker: rate} dict."""
    filtered = {t: r for t, r in rates.items() if universe is None or t in universe}
    if not filtered:
        return [], []
    sorted_items = sorted(filtered.items(), key=lambda x: x[1], reverse=True)
    gainers = [{"code": t, "name": _name(t), "rate": r} for t, r in sorted_items[:n]]
    losers = [{"code": t, "name": _name(t), "rate": r} for t, r in sorted_items[-n:]][::-1]
    return gainers, losers


def _calc_prev_close_rate(eff_ymd: str, prev_ymd: str) -> dict:
    """eff_ymd의 전일대비 등락률을 모든 종목에 대해 계산.
    OHLCV에서 전일종가와 당일종가를 읽어서 직접 계산.
    returns: {ticker: rate} dict
    """
    rates = {}
    for market in ("KOSPI", "KOSDAQ"):
        market_tickers = stock.get_market_ticker_list(eff_ymd, market=market)
        if not market_tickers:
            continue
        try:
            df = stock.get_market_ohlcv_by_ticker(eff_ymd, market=market)
            df_prev = stock.get_market_ohlcv_by_ticker(prev_ymd, market=market)
            if df is not None and df_prev is not None:
                for ticker in market_tickers:
                    if _is_normal_ticker(ticker) and ticker in df.index and ticker in df_prev.index:
                        curr_close = df.loc[ticker, "종가"]
                        prev_close_val = df_prev.loc[ticker, "종가"]
                        if prev_close_val and prev_close_val > 0:
                            prev_vol = df_prev.loc[ticker, "거래량"] if "거래량" in df_prev.columns else 0
                            curr_vol = df.loc[ticker, "거래량"] if "거래량" in df.columns else 0
                            if prev_vol > 0 and curr_vol > 0:
                                rates[ticker] = round((curr_close - prev_close_val) / prev_close_val * 100, 2)
        except Exception:
            pass
    return rates


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

    kospi_top_gainer_ticker = ""
    kospi_top_loser_ticker = ""
    kosdaq_top_gainer_ticker = ""
    kosdaq_top_loser_ticker = ""
    kospi_top_gainers: list[dict] = []
    kospi_top_losers: list[dict] = []
    kosdaq_top_gainers: list[dict] = []
    kosdaq_top_losers: list[dict] = []
    top_gainers: list[dict] = []
    top_losers: list[dict] = []
    top_gainer_ticker = ""
    top_loser_ticker = ""
    kospi_top_gainer_rate = 0.0
    kospi_top_loser_rate = 0.0
    kosdaq_top_gainer_rate = 0.0
    kosdaq_top_loser_rate = 0.0
    df_change = None
    prev = ""

    try:
        prev = _previous_business_day(effective_ymd)

        # --- pykrx primary path ---
        # Use OHLCV-based previous-close rate instead of pykrx's "등락률"
        # (which uses KRX's "비교 기준가", not the actual previous close)
        rates = _calc_prev_close_rate(effective_ymd, prev)

        if not rates:
            raise ValueError("empty_rates")

        # Get ticker sets for each market
        kospi_tickers = set(stock.get_market_ticker_list(effective_ymd, market="KOSPI"))
        kosdaq_tickers = set(stock.get_market_ticker_list(effective_ymd, market="KOSDAQ"))

        kospi_top_gainers, kospi_top_losers = _top_rate_lists_from_rates(rates, kospi_tickers, n=3)
        kosdaq_top_gainers, kosdaq_top_losers = _top_rate_lists_from_rates(rates, kosdaq_tickers, n=3)
        top_gainers, top_losers = _top_rate_lists_from_rates(rates, n=3)

        if not kospi_top_gainers and not kosdaq_top_gainers and not top_gainers:
            raise ValueError("empty_dataframe")

        df_change = True  # sentinel: pykrx succeeded

    except Exception as e:
        today_ymd = datetime.now().strftime("%Y%m%d")
        if requested_ymd == today_ymd:
            # Fallback (today only): use Naver sise_rise/sise_fall pages.
            prev = _previous_business_day(effective_ymd)
            kospi_g, kospi_l = _naver_today_movers(0)
            kosdaq_g, kosdaq_l = _naver_today_movers(1)

            top_gainers = (kospi_g + kosdaq_g)[:3]
            top_losers = (kospi_l + kosdaq_l)[:3]
            kospi_top_gainers = kospi_g[:3]
            kospi_top_losers = kospi_l[:3]
            kosdaq_top_gainers = kosdaq_g[:3]
            kosdaq_top_losers = kosdaq_l[:3]
            df_change = None
        else:
            raise HTTPException(status_code=502, detail=f"pykrx_error: {e}") from e

    # Derive top1 tickers/rates from TOP3 lists (consistent by construction)
    kospi_top_gainer_ticker = kospi_top_gainers[0]["code"] if kospi_top_gainers else ""
    kospi_top_loser_ticker = kospi_top_losers[0]["code"] if kospi_top_losers else ""
    kosdaq_top_gainer_ticker = kosdaq_top_gainers[0]["code"] if kosdaq_top_gainers else ""
    kosdaq_top_loser_ticker = kosdaq_top_losers[0]["code"] if kosdaq_top_losers else ""
    top_gainer_ticker = top_gainers[0]["code"] if top_gainers else ""
    top_loser_ticker = top_losers[0]["code"] if top_losers else ""

    kospi_top_gainer_rate = kospi_top_gainers[0]["rate"] if kospi_top_gainers else 0.0
    kospi_top_loser_rate = kospi_top_losers[0]["rate"] if kospi_top_losers else 0.0
    kosdaq_top_gainer_rate = kosdaq_top_gainers[0]["rate"] if kosdaq_top_gainers else 0.0
    kosdaq_top_loser_rate = kosdaq_top_losers[0]["rate"] if kosdaq_top_losers else 0.0

    # Mentions universe (naver board posts — unchanged)
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

    kospi_top_gainer_name = _name(kospi_top_gainer_ticker) if kospi_top_gainer_ticker else "-"
    kospi_top_loser_name = _name(kospi_top_loser_ticker) if kospi_top_loser_ticker else "-"
    kosdaq_top_gainer_name = _name(kosdaq_top_gainer_ticker) if kosdaq_top_gainer_ticker else "-"
    kosdaq_top_loser_name = _name(kosdaq_top_loser_ticker) if kosdaq_top_loser_ticker else "-"
    top_gainer_name = top_gainers[0]["name"] if top_gainers else "-"
    top_loser_name = top_losers[0]["name"] if top_losers else "-"

    source = (
        "pykrx(KRX OHLCV 전일대비 계산) + naver(board posts)"
        if df_change is not None
        else "naver(sise_rise/sise_fall) + naver(board posts)"
    )

    notes_parts = [
        f"source={source}",
        f"effective_date={effective_ymd}",
        f"prev_date={prev}",
        "mostMentioned=naver_board_posts(universe=traded_value_topN)",
        f"mentions_universe_size={len(universe)}",
    ]
    if adjust_note:
        notes_parts.append(adjust_note)

    return {
        "date": date,
        "effectiveDate": effective_ymd,
        "rawTopGainer": top_gainer_name,
        "rawTopLoser": top_loser_name,
        "filteredTopGainer": top_gainer_name,
        "filteredTopLoser": top_loser_name,
        "topGainer": top_gainer_name,
        "topLoser": top_loser_name,
        "mostMentioned": _name(most_ticker) if most_ticker else "-",
        "kospiPick": kospi_top_gainer_name,
        "kosdaqPick": kosdaq_top_gainer_name,
        "topGainerCode": top_gainer_ticker,
        "topLoserCode": top_loser_ticker,
        "rawTopGainerCode": top_gainer_ticker,
        "rawTopLoserCode": top_loser_ticker,
        "filteredTopGainerCode": top_gainer_ticker,
        "filteredTopLoserCode": top_loser_ticker,
        "mostMentionedCode": most_ticker,
        "kospiPickCode": kospi_top_gainer_ticker,
        "kosdaqPickCode": kosdaq_top_gainer_ticker,
        "kospiTopGainer": kospi_top_gainer_name,
        "kosdaqTopGainer": kosdaq_top_gainer_name,
        "kospiTopLoser": kospi_top_loser_name,
        "kosdaqTopLoser": kosdaq_top_loser_name,
        "kospiTopGainerCode": kospi_top_gainer_ticker,
        "kosdaqTopGainerCode": kosdaq_top_gainer_ticker,
        "kospiTopLoserCode": kospi_top_loser_ticker,
        "kosdaqTopLoserCode": kosdaq_top_loser_ticker,
        "kospiTopGainerRate": kospi_top_gainer_rate,
        "kospiTopLoserRate": kospi_top_loser_rate,
        "kosdaqTopGainerRate": kosdaq_top_gainer_rate,
        "kosdaqTopLoserRate": kosdaq_top_loser_rate,
        "topGainers": top_gainers,
        "topLosers": top_losers,
        "kospiTopGainers": kospi_top_gainers,
        "kospiTopLosers": kospi_top_losers,
        "kosdaqTopGainers": kosdaq_top_gainers,
        "kosdaqTopLosers": kosdaq_top_losers,
        "mostMentionedTop": most_mentioned_list,
        "anomalies": [],
        "rankingWarning": "",
        "source": source,
        "notes": "\n".join(notes_parts),
    }
