from __future__ import annotations

from datetime import datetime
from fastapi import FastAPI, HTTPException

from pykrx import stock

app = FastAPI(title="kr-stock-daily-brief marketdata", version="0.1.0")


def _parse_date(date_str: str) -> str:
    try:
        # pykrx expects YYYYMMDD
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%Y%m%d")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid_date: {date_str}") from e


@app.get("/health")
def health():
    return {"status": "UP"}


@app.get("/leaders")
def leaders(date: str):
    ymd = _parse_date(date)

    try:
        df = stock.get_market_ohlcv_by_ticker(ymd, market="ALL")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"pykrx_error: {e}") from e

    if df is None or len(df.index) == 0:
        raise HTTPException(status_code=404, detail="no_data")

    # Some pykrx versions include "등락률"; fall back to percent change if absent.
    if "등락률" in df.columns:
        change_col = "등락률"
    else:
        # (종가-시가)/시가*100 as a crude proxy (not perfect vs prev close)
        if "종가" not in df.columns or "시가" not in df.columns:
            raise HTTPException(status_code=502, detail="unexpected_dataframe_columns")
        df = df.copy()
        df["등락률"] = (df["종가"] - df["시가"]) / df["시가"] * 100
        change_col = "등락률"

    top_gainer_ticker = df[change_col].idxmax()
    top_loser_ticker = df[change_col].idxmin()

    def name(ticker: str) -> str:
        try:
            return stock.get_market_ticker_name(ticker)
        except Exception:
            return ticker

    return {
        "date": date,
        "topGainer": name(top_gainer_ticker),
        "topLoser": name(top_loser_ticker),
        "source": "pykrx(KRX) via otp-download",
        "notes": "Derived from KRX market OHLCV by ticker; internal-use best effort.",
    }
