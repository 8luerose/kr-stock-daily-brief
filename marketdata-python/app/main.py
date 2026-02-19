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

    # 전체 시장 top gainer/loser
    top_gainer_ticker = df["등락률"].idxmax()
    top_loser_ticker = df["등락률"].idxmin()

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
        "topGainer": _name(top_gainer_ticker),
        "topLoser": _name(top_loser_ticker),
        "mostMentioned": _name(most_ticker),
        "kospiPick": _name(kospi_pick_ticker) if kospi_pick_ticker != "-" else "-",
        "kosdaqPick": _name(kosdaq_pick_ticker) if kosdaq_pick_ticker != "-" else "-",
        "topGainerCode": top_gainer_ticker,
        "topLoserCode": top_loser_ticker,
        "mostMentionedCode": most_ticker,
        "kospiPickCode": kospi_pick_ticker if kospi_pick_ticker != "-" else "",
        "kosdaqPickCode": kosdaq_pick_ticker if kosdaq_pick_ticker != "-" else "",
        "source": "pykrx(KRX historical change)",
        "notes": "Derived from get_market_price_change_by_ticker(prev,date,ALL); mostMentioned/kospiPick/kosdaqPick=volume-based.",
    }
