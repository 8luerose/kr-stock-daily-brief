from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(title="kr-stock-daily-brief ai-service", version="0.1.0")


class ChatRequest(BaseModel):
    question: str = ""
    contextDate: str | None = None
    stockCode: str | None = None
    stockName: str | None = None
    focus: str | None = None
    summary: dict[str, Any] | None = None
    chart: dict[str, Any] | None = None
    events: list[dict[str, Any]] = Field(default_factory=list)
    terms: list[dict[str, Any]] = Field(default_factory=list)


def _clean(value: Any, fallback: str = "-") -> str:
    text = str(value or "").strip()
    return text if text else fallback


def _event_lines(events: list[dict[str, Any]]) -> list[str]:
    lines: list[str] = []
    for event in events[:5]:
        lines.append(
            f"- {event.get('date', '-')}: {event.get('title', '이벤트')} "
            f"({event.get('severity', 'unknown')}) - {event.get('explanation', '설명 없음')}"
        )
    return lines


def _term_lines(terms: list[dict[str, Any]]) -> list[str]:
    lines: list[str] = []
    for term in terms[:5]:
        name = term.get("term") or term.get("id") or "용어"
        definition = term.get("plainDefinition") or term.get("definition") or ""
        if definition:
            lines.append(f"- {name}: {definition}")
    return lines


@app.get("/health")
def health():
    return {"status": "UP"}


@app.post("/chat")
def chat(req: ChatRequest):
    subject = _clean(req.stockName, "선택한 종목")
    code = _clean(req.stockCode, "")
    basis_date = _clean(req.contextDate, date.today().isoformat())
    events = req.events or []
    terms = req.terms or []

    event_lines = _event_lines(events)
    term_lines = _term_lines(terms)
    answer_parts = [
        f"기준일: {basis_date}",
        f"대상: {subject}{f'({code})' if code else ''}",
        "",
        "핵심 해석",
        f"- 질문은 '{_clean(req.question, '차트와 이벤트 해석')}'입니다.",
        "- 이 응답은 현재 저장된 브리프, 차트 이벤트, 용어 사전 연결을 바탕으로 한 교육용 분석입니다.",
    ]

    if event_lines:
        answer_parts += ["", "차트 이벤트 근거", *event_lines]
    else:
        answer_parts += ["", "차트 이벤트 근거", "- 확인된 급등/급락/거래량 급증 이벤트가 없거나 아직 전달되지 않았습니다."]

    if term_lines:
        answer_parts += ["", "초보자 용어 연결", *term_lines]

    answer_parts += [
        "",
        "검토 조건",
        "- 매수 검토: 가격 회복, 거래량 증가, 주요 지지선 방어가 함께 나올 때만 검토합니다.",
        "- 분할매수 검토: 조건이 일부만 충족되면 한 번에 진입하지 않고 작은 비중으로 나누어 확인합니다.",
        "- 관망: 가격과 거래량 신호가 엇갈리거나 근거 링크가 부족하면 새 데이터가 쌓일 때까지 기다립니다.",
        "- 매도 검토: 급등 후 거래량 둔화, 긴 윗꼬리 반복, 직전 고점 돌파 실패가 겹치면 검토합니다.",
        "- 리스크 관리: 전저점 이탈이나 하락일 거래량 급증 시 손실 허용 기준을 다시 세웁니다.",
        "",
        "반대 신호",
        "- 가격은 오르지만 거래량이 줄면 추세 신뢰도를 낮춰야 합니다.",
        "- 이벤트 제목만 보고 판단하지 말고 공시, 뉴스, 재무 상황을 함께 확인해야 합니다.",
    ]

    sources = [
        {"title": "앱 저장 일간 브리프", "type": "daily_summary", "url": "/api/summaries/latest"},
        {"title": "종목 차트 API", "type": "ohlcv", "url": f"/api/stocks/{code}/chart" if code else "/api/stocks/{code}/chart"},
        {"title": "종목 이벤트 API", "type": "events", "url": f"/api/stocks/{code}/events" if code else "/api/stocks/{code}/events"},
        {"title": "초보자 용어 사전", "type": "internal_glossary", "url": "/api/learning/terms"},
    ]

    return {
        "mode": "rag_ready_rule_based",
        "answer": "\n".join(answer_parts),
        "basisDate": basis_date,
        "confidence": "medium" if events else "low-medium",
        "sources": sources,
        "limitations": [
            "현재 ai-service는 외부 LLM 호출 없이 규칙형 응답을 제공합니다.",
            "투자 지시가 아니라 교육용 분석 보조입니다.",
            "개인 재무 상황, 보유 비중, 투자 기간을 반영하지 않습니다.",
        ],
        "oppositeSignals": [
            "거래량 없는 상승",
            "하락일 거래량 급증",
            "직전 저점 이탈",
            "공시/뉴스 근거 부족",
        ],
        "nextQuestions": [
            "이 이벤트가 거래량과 같이 나온 건 왜 중요해?",
            "보수형 시나리오에서는 어떤 조건을 기다려야 해?",
            "반대 신호가 나오면 어떤 데이터를 먼저 봐야 해?",
        ],
    }
