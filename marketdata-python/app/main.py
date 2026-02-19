from __future__ import annotations

from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from pykrx import stock

app = FastAPI(title="kr-stock-daily-brief marketdata", version="0.4.0")


def _parse_date(date_str: str) -> str:
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%Y%m%d")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid_date: {date_str}") from e


def _previous_business_day(ymd: str) -> str:
    # Use immediate prior business day (D-1 business day), not a week-back anchor.
    d = datetime.strptime(ymd, "%Y%m%d").date() - timedelta(days=1)
    return stock.get_nearest_business_day_in_a_week(d.strftime("%Y%m%d"))


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


def _safe_int(value) -> int:
    try:
        return int(value)
    except Exception:
        return 0


def _build_one_line_reason(rate: float, flags: list[str], zero_days: int) -> str:
    direction = "급등" if rate >= 0 else "급락"
    parts = []
    if "prior_close_zero" in flags:
        parts.append("전일 종가가 0원으로 산정되어 수익률 왜곡 가능성이 큽니다")
    if "zero_volume_streak" in flags:
        parts.append(f"직전 {zero_days}거래일 연속 거래량 0으로 거래정지/재상장 구간일 가능성이 있습니다")
    if "huge_gap" in flags:
        parts.append(f"당일 등락률 {rate:.2f}% {direction}은 연속성 단절 구간에서 자주 나타나는 비정상 점프입니다")
    if not parts:
        parts.append("가격·거래 연속성 이상 신호가 감지되었습니다")
    return " / ".join(parts)


def _zero_volume_streak(ymd: str, ticker: str, lookback_days: int = 14) -> int:
    start = (datetime.strptime(ymd, "%Y%m%d") - timedelta(days=lookback_days)).strftime("%Y%m%d")
    try:
        ohlcv = stock.get_market_ohlcv_by_date(start, ymd, ticker)
    except Exception:
        return 0

    if ohlcv is None or len(ohlcv.index) < 2 or "거래량" not in ohlcv.columns:
        return 0

    volumes = ohlcv["거래량"].tolist()[:-1]
    streak = 0
    for v in reversed(volumes):
        if _safe_int(v) == 0:
            streak += 1
            continue
        break
    return streak


@app.get("/health")
def health():
    return {"status": "UP"}


@app.get("/leaders")
def leaders(date: str):
    ymd = _parse_date(date)

    try:
        prev = _previous_business_day(ymd)
        df = stock.get_market_price_change_by_ticker(prev, ymd, market="ALL")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"pykrx_error: {e}") from e

    if df is None or len(df.index) == 0:
        raise HTTPException(status_code=404, detail="no_data")

    need_cols = ["등락률", "거래량"]
    for c in need_cols:
        if c not in df.columns:
            raise HTTPException(status_code=502, detail=f"unexpected_dataframe_columns: missing {c}")

    # 전체 시장 raw top gainer/loser
    top_gainer_ticker = df["등락률"].idxmax()
    top_loser_ticker = df["등락률"].idxmin()

    anomalies = []
    anomaly_codes = set()

    for ticker in df.index.tolist():
        row = df.loc[ticker]
        rate = _safe_float(row.get("등락률", 0.0))
        volume = _safe_int(row.get("거래량", 0))
        close = _safe_float(row.get("종가", 0.0))
        change = _safe_float(row.get("변동폭", 0.0))
        prev_close = close - change
        zero_days = _zero_volume_streak(ymd, ticker, lookback_days=14)

        flags = []
        if prev_close <= 0:
            flags.append("prior_close_zero")
        if zero_days >= 3 and (abs(rate) >= 30.0 or volume == 0):
            flags.append("zero_volume_streak")
        if abs(rate) >= 80.0:
            flags.append("huge_gap")
        if volume == 0 and abs(rate) >= 30.0:
            flags.append("suspicious_zero_volume_jump")

        if flags:
            anomaly_codes.add(ticker)
            anomalies.append(
                {
                    "symbol": ticker,
                    "name": _name(ticker),
                    "rate": round(rate, 2),
                    "flags": flags,
                    "oneLineReason": _build_one_line_reason(rate, flags, zero_days),
                }
            )

    normal_df = df[~df.index.isin(anomaly_codes)]
    ranking_warning = ""
    if len(normal_df.index) == 0:
        ranking_warning = "전체 후보가 이상치로 분류되어 raw 등락률 1위를 fallback으로 사용했습니다."
        filtered_gainer_ticker = top_gainer_ticker
        filtered_loser_ticker = top_loser_ticker
    else:
        filtered_gainer_ticker = normal_df["등락률"].idxmax()
        filtered_loser_ticker = normal_df["등락률"].idxmin()

    # 거래량 최대를 mostMentioned 대체치로 사용
    most_ticker = df["거래량"].idxmax()

    # 코스피/코스닥 pick: 각 시장에서 거래량 최대
    kospi = set(stock.get_market_ticker_list(ymd, market="KOSPI"))
    kosdaq = set(stock.get_market_ticker_list(ymd, market="KOSDAQ"))

    kospi_df = df[df.index.isin(kospi)]
    kosdaq_df = df[df.index.isin(kosdaq)]

    kospi_pick_ticker = kospi_df["거래량"].idxmax() if len(kospi_df.index) > 0 else "-"
    kosdaq_pick_ticker = kosdaq_df["거래량"].idxmax() if len(kosdaq_df.index) > 0 else "-"

    return {
        "date": date,
        "rawTopGainer": _name(top_gainer_ticker),
        "rawTopLoser": _name(top_loser_ticker),
        "filteredTopGainer": _name(filtered_gainer_ticker),
        "filteredTopLoser": _name(filtered_loser_ticker),
        "topGainer": _name(top_gainer_ticker),
        "topLoser": _name(top_loser_ticker),
        "mostMentioned": _name(most_ticker),
        "kospiPick": _name(kospi_pick_ticker) if kospi_pick_ticker != "-" else "-",
        "kosdaqPick": _name(kosdaq_pick_ticker) if kosdaq_pick_ticker != "-" else "-",
        "topGainerCode": top_gainer_ticker,
        "topLoserCode": top_loser_ticker,
        "rawTopGainerCode": top_gainer_ticker,
        "rawTopLoserCode": top_loser_ticker,
        "filteredTopGainerCode": filtered_gainer_ticker,
        "filteredTopLoserCode": filtered_loser_ticker,
        "mostMentionedCode": most_ticker,
        "kospiPickCode": kospi_pick_ticker if kospi_pick_ticker != "-" else "",
        "kosdaqPickCode": kosdaq_pick_ticker if kosdaq_pick_ticker != "-" else "",
        "anomalies": anomalies,
        "rankingWarning": ranking_warning,
        "source": "pykrx(KRX historical change)",
        "notes": "Derived from get_market_price_change_by_ticker(prev,date,ALL); mostMentioned/kospiPick/kosdaqPick=volume-based.",
    }
