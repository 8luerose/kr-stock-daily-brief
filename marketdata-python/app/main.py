from __future__ import annotations

from datetime import datetime
from fastapi import FastAPI, HTTPException
import FinanceDataReader as fdr

app = FastAPI(title="kr-stock-daily-brief marketdata", version="0.2.0")


def _parse_date(date_str: str) -> str:
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%Y-%m-%d")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid_date: {date_str}") from e


@app.get("/health")
def health():
    return {"status": "UP"}


@app.get("/leaders")
def leaders(date: str):
    d = _parse_date(date)

    try:
        # NOTE: FDR KRX listing-by-date is used for stable operation in this environment.
        df = fdr.StockListing("KRX", d, d)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"fdr_error: {e}") from e

    if df is None or len(df.index) == 0:
        raise HTTPException(status_code=404, detail="no_data")

    if "Name" not in df.columns or "ChagesRatio" not in df.columns:
        raise HTTPException(status_code=502, detail="unexpected_dataframe_columns")

    # normalize
    work = df[["Name", "ChagesRatio"]].copy()
    work["ChagesRatio"] = work["ChagesRatio"].astype(float)

    top_gainer_row = work.sort_values("ChagesRatio", ascending=False).iloc[0]
    top_loser_row = work.sort_values("ChagesRatio", ascending=True).iloc[0]

    return {
        "date": date,
        "topGainer": str(top_gainer_row["Name"]),
        "topLoser": str(top_loser_row["Name"]),
        "source": "finance-datareader(KRX listing snapshot)",
        "notes": "Derived from FDR StockListing('KRX', date, date) ChagesRatio ranking; best effort.",
    }
