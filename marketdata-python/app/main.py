from __future__ import annotations

from datetime import datetime, timedelta
from functools import lru_cache
from fastapi import FastAPI, HTTPException
from pykrx import stock

app = FastAPI(title="kr-stock-daily-brief marketdata", version="0.5.0")


def _is_trading_day(ymd: str) -> tuple[bool, str | None]:
    """pykrx로 해당 날짜가 실제 거래일인지 확인합니다.

    반환: (is_trading_day, reason_if_closed)
    - pykrx 호출 실패 시에는 안전상 비거래일로 처리합니다.
    """
    try:
        # get_nearest_business_day_in_a_week은 가장 가까운 영업일을 반환하므로
        # 요청일과 결과가 같으면 거래일로 판단.
        nearest = stock.get_nearest_business_day_in_a_week(ymd, direction="next")
        if nearest == ymd:
            return True, None
        return False, "주말/공휴일로 추정됩니다."
    except Exception as e:
        # pykrx 에러 시 '평일이면 거래일'로 가정하면
        # 실제 공휴일/임시휴장일에 잘못된 랭킹이 생성될 수 있어 위험합니다.
        return False, f"영업일 확인 실패로 안전상 휴장 처리했습니다 ({type(e).__name__})."


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


@lru_cache(maxsize=4096)
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

    # 거래일 확인: 비거래일인 경우 market_closed 응답 반환
    is_trading, closed_reason = _is_trading_day(ymd)
    if not is_trading:
        # 1) KRX (공식) - 공개 접근 가능한 증시일정/휴장일 안내 페이지
        #    ※ data.krx.co.kr(정보데이터시스템)은 로그인/POST 필요로 1:1 딥링크가 불안정할 수 있어
        #    사용자 클릭 확인용으로는 krx.co.kr 공개 페이지를 우선 제공합니다.
        krx_url = "https://www.krx.co.kr/contents/MKD/01/0110/01100305/MKD01100305.jsp"

        # 2) 네이버(2차) - 날짜 1:1로 바로 매칭되는 JSON 엔드포인트(클릭 시 해당 날짜만 반환)
        #    startTime/endTime: YYYYMMDD
        naver_url = (
            "https://api.finance.naver.com/siseJson.naver?symbol=KOSPI"
            f"&requestType=1&startTime={ymd}&endTime={ymd}&timeframe=day"
        )
        return {
            "date": date,
            "marketClosed": True,
            "marketClosedReason": (closed_reason or "해당 날짜는 한국 증권시장 휴장일입니다 (주말/공휴일).")
            + " (근거 링크 2개 제공)",
            "evidenceLinks": [krx_url, naver_url],
            "rawTopGainer": "-",
            "rawTopLoser": "-",
            "filteredTopGainer": "-",
            "filteredTopLoser": "-",
            "topGainer": "-",
            "topLoser": "-",
            "mostMentioned": "-",
            "kospiPick": "-",
            "kosdaqPick": "-",
            "topGainerCode": "",
            "topLoserCode": "",
            "rawTopGainerCode": "",
            "rawTopLoserCode": "",
            "filteredTopGainerCode": "",
            "filteredTopLoserCode": "",
            "mostMentionedCode": "",
            "kospiPickCode": "",
            "kosdaqPickCode": "",
            "anomalies": [],
            "rankingWarning": "휴장일으로 랭킹 데이터가 없습니다.",
            "source": "pykrx(market_closed)",
            "notes": "휴장일 감지: pykrx 영업일 확인 결과 비거래일로 판정됨.",
        }

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

    # Performance guard: anomaly deep-check on extreme movers only.
    # (Checking all tickers calls OHLCV API thousands of times and can timeout.)
    top_n = 20
    candidate_codes = set(df["등락률"].nlargest(top_n).index.tolist())
    candidate_codes.update(df["등락률"].nsmallest(top_n).index.tolist())
    candidate_codes.update([top_gainer_ticker, top_loser_ticker])

    for ticker in candidate_codes:
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
        if zero_days >= 2 and abs(rate) >= 25.0:
            flags.append("zero_volume_streak")
        if abs(rate) >= 80.0:
            flags.append("huge_gap")
        if volume == 0 and abs(rate) >= 20.0:
            flags.append("suspicious_zero_volume_jump")

        exclude_from_ranking = any(
            f in flags for f in ["prior_close_zero", "zero_volume_streak", "suspicious_zero_volume_jump"]
        )
        if exclude_from_ranking:
            anomaly_codes.add(ticker)
        if flags:
            anomalies.append(
                {
                    "symbol": ticker,
                    "name": _name(ticker),
                    "rate": round(rate, 2),
                    "flags": flags,
                    "oneLineReason": _build_one_line_reason(rate, flags, zero_days),
                }
            )

    anomalies.sort(key=lambda x: abs(float(x.get("rate", 0.0))), reverse=True)

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
