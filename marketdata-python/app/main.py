from __future__ import annotations

from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from pykrx import stock

app = FastAPI(title="kr-stock-daily-brief marketdata", version="0.3.0")


def _parse_date(date_str: str) -> str:
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%Y%m%d")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid_date: {date_str}") from e


def _previous_business_day(ymd: str) -> str:
    d = datetime.strptime(ymd, "%Y%m%d").date() - timedelta(days=7)
    return stock.get_nearest_business_day_in_a_week(d.strftime("%Y%m%d"))


@app.get("/health")
def health():
    return {"status": "UP"}


@app.get("/leaders")
def leaders(date: str):
    ymd = _parse_date(date)

    try:
        # from previous business day to target day
        prev = _previous_business_day(ymd)
        df = stock.get_market_price_change_by_ticker(prev, ymd, market="ALL")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"pykrx_error: {e}") from e

    if df is None or len(df.index) == 0:
        raise HTTPException(status_code=404, detail="no_data")

    if "등락률" not in df.columns:
        raise HTTPException(status_code=502, detail="unexpected_dataframe_columns")

    top_gainer_ticker = df["등락률"].idxmax()
    top_loser_ticker = df["등락률"].idxmin()

    def name(ticker: str) -> str:
        try:
            return stock.get_market_ticker_name(ticker)
        except Exception:
            return ticker

    return {
        "date": date,
        "topGainer": name(top_gainer_ticker),
        "topLoser": name(top_loser_ticker),
        "source": "pykrx(KRX historical change)",
        "notes": "Derived from get_market_price_change_by_ticker(prev, date, ALL).",
    }
