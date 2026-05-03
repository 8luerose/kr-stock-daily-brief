from __future__ import annotations

from datetime import date
import json
import os
from typing import Any
from urllib import error, request

from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(title="kr-stock-daily-brief ai-service", version="0.1.0")


class ChatRequest(BaseModel):
    question: str = ""
    contextDate: str | None = None
    stockCode: str | None = None
    stockName: str | None = None
    topicType: str | None = None
    topicTitle: str | None = None
    searchResult: dict[str, Any] | None = None
    focus: str | None = None
    summary: dict[str, Any] | None = None
    chart: dict[str, Any] | None = None
    events: list[dict[str, Any]] = Field(default_factory=list)
    terms: list[dict[str, Any]] = Field(default_factory=list)


def _clean(value: Any, fallback: str = "-") -> str:
    text = str(value or "").strip()
    return text if text else fallback


def _compact(value: Any, limit: int = 420) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        text = value
    else:
        text = json.dumps(value, ensure_ascii=False, default=str)
    text = " ".join(text.split())
    return text[:limit]


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


def _search_context_lines(search_result: dict[str, Any] | None) -> list[str]:
    if not search_result:
        return []
    tags = search_result.get("tags") or []
    if isinstance(tags, list):
        tag_text = ", ".join(str(tag) for tag in tags[:5] if str(tag).strip())
    else:
        tag_text = str(tags)
    lines = [
        f"- 분류: {_clean(search_result.get('market') or search_result.get('type'))}",
        f"- 요약: {_clean(search_result.get('summary'))}",
    ]
    if tag_text:
        lines.append(f"- 연결 키워드: {tag_text}")
    source = _clean(search_result.get("source"), "")
    if source:
        lines.append(f"- 검색 출처: {source}")
    return lines


def _build_retrieval_documents(req: ChatRequest, subject: str, code: str, topic_type: str, basis_date: str) -> list[dict[str, str]]:
    documents: list[dict[str, str]] = []

    if req.searchResult:
        documents.append({
            "id": "search-result",
            "type": _clean(req.searchResult.get("type"), topic_type),
            "title": _clean(req.searchResult.get("title"), subject),
            "text": _compact(req.searchResult),
            "basisDate": basis_date,
        })

    if req.summary:
        documents.append({
            "id": "daily-summary",
            "type": "daily_summary",
            "title": f"{basis_date} 저장 브리프",
            "text": _compact(req.summary),
            "basisDate": basis_date,
        })

    if req.chart:
        documents.append({
            "id": "chart-snapshot",
            "type": "chart",
            "title": f"{subject}{f'({code})' if code else ''} 차트 스냅샷",
            "text": _compact(req.chart),
            "basisDate": _clean(req.chart.get("asOf"), basis_date) if isinstance(req.chart, dict) else basis_date,
        })

    for index, event in enumerate((req.events or [])[:6], start=1):
        documents.append({
            "id": f"event-{index}",
            "type": _clean(event.get("type"), "event"),
            "title": _clean(event.get("title"), "이벤트"),
            "text": _compact(event),
            "basisDate": _clean(event.get("date"), basis_date),
        })

    for index, term in enumerate((req.terms or [])[:6], start=1):
        documents.append({
            "id": f"term-{index}",
            "type": "learning_term",
            "title": _clean(term.get("term") or term.get("id"), "용어"),
            "text": _compact(term),
            "basisDate": basis_date,
        })

    return documents


def _build_llm_prompt(req: ChatRequest, subject: str, code: str, topic_type: str, basis_date: str, documents: list[dict[str, str]]) -> list[dict[str, str]]:
    context = "\n".join(
        f"[{doc['id']}] {doc['type']} | {doc['title']} | 기준일 {doc['basisDate']}\n{doc['text']}"
        for doc in documents
    )
    system = (
        "너는 한국 주식 초보자를 위한 AI 리서치 보조자다. "
        "반드시 제공된 검색/브리프/차트/이벤트/용어 근거 안에서만 답하고, "
        "매수 또는 매도를 지시하지 말고 조건/검토/시나리오 표현만 사용한다. "
        "출처가 부족하면 부족하다고 말한다. "
        "답변 구조는 한 줄 결론, 근거, 반대 신호, 리스크, 다음 확인 순서로 작성한다."
    )
    user = (
        f"질문: {_clean(req.question, '시장과 차트 해석')}\n"
        f"대상: {subject}{f'({code})' if code else ''}\n"
        f"분석 범위: {topic_type}\n"
        f"기준일: {basis_date}\n\n"
        f"검색된 근거:\n{context or '제공된 근거가 없습니다.'}"
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def _build_structured_answer(
    req: ChatRequest,
    subject: str,
    code: str,
    basis_date: str,
    confidence: str,
    sources: list[dict[str, str]],
    limitations: list[str],
) -> dict[str, Any]:
    events = req.events or []
    evidence: list[str] = []

    if req.searchResult:
        evidence.append(f"검색 맥락: {_clean(req.searchResult.get('summary'), '검색 결과 요약 없음')}")

    if req.summary:
        summary_bits = [
            f"최대 상승 {req.summary.get('topGainer')}" if req.summary.get("topGainer") else "",
            f"최대 하락 {req.summary.get('topLoser')}" if req.summary.get("topLoser") else "",
            f"최다 언급 {req.summary.get('mostMentioned')}" if req.summary.get("mostMentioned") else "",
        ]
        evidence.append("브리프: " + ", ".join(bit for bit in summary_bits if bit))

    if req.chart and isinstance(req.chart, dict):
        latest = req.chart.get("latest") or {}
        latest_close = latest.get("close") if isinstance(latest, dict) else None
        evidence.append(
            f"차트: {req.chart.get('interval', 'daily')} {req.chart.get('range', '-')}, "
            f"기준일 {req.chart.get('asOf') or basis_date}, 최근 종가 {_clean(latest_close)}"
        )

    for event in events[:3]:
        evidence.append(
            f"이벤트: {event.get('date', basis_date)} {event.get('title', '이벤트')} "
            f"등락률 {_clean(event.get('priceChangeRate'))}%, 거래량 {_clean(event.get('volumeChangeRate'))}%"
        )

    if not evidence:
        evidence.append("제공된 검색, 브리프, 차트, 이벤트 근거가 제한적입니다.")

    if code and events:
        conclusion = f"{subject}({code})은(는) {basis_date} 기준 차트 이벤트가 있어 가격과 거래량을 함께 확인해야 합니다."
    elif code:
        conclusion = f"{subject}({code})은(는) {basis_date} 기준 차트/검색 근거로 조건부 검토가 필요합니다."
    else:
        conclusion = f"{subject}은(는) {basis_date} 기준 검색/브리프 근거로 시장 맥락을 먼저 확인해야 합니다."

    return {
        "conclusion": conclusion,
        "evidence": evidence[:5],
        "opposingSignals": [
            "가격은 오르지만 거래량이 줄어드는 경우",
            "하락일 거래량 급증",
            "공시, 뉴스, 재무 근거가 부족한 경우",
        ],
        "risks": [
            "개인 보유 비중과 투자 기간을 반영하지 않습니다.",
            "차트 이벤트는 원인 후보이며 확정 원인이 아닙니다.",
            "투자 지시가 아니라 교육용 분석 보조입니다.",
        ],
        "sources": sources,
        "confidence": confidence,
        "basisDate": basis_date,
        "limitations": limitations,
    }


def _call_openai_compatible_llm(messages: list[dict[str, str]]) -> tuple[str | None, dict[str, Any]]:
    api_key = os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
    model = os.getenv("LLM_MODEL", "").strip()
    base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    timeout = float(os.getenv("LLM_TIMEOUT_SECONDS", "20"))

    if not api_key or not model:
        return None, {
            "enabled": False,
            "provider": "openai_compatible",
            "model": model or "",
            "fallbackReason": "LLM_API_KEY/OPENAI_API_KEY 또는 LLM_MODEL이 설정되지 않았습니다.",
        }

    payload = json.dumps({
        "model": model,
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 900,
    }).encode("utf-8")
    req = request.Request(
        f"{base_url}/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=timeout) as res:
            data = json.loads(res.read().decode("utf-8"))
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        if not content:
            return None, {
                "enabled": True,
                "provider": "openai_compatible",
                "model": model,
                "fallbackReason": "LLM 응답에 content가 없습니다.",
            }
        return content, {
            "enabled": True,
            "provider": "openai_compatible",
            "model": model,
            "fallbackReason": "",
        }
    except (error.URLError, TimeoutError, json.JSONDecodeError, KeyError) as exc:
        return None, {
            "enabled": True,
            "provider": "openai_compatible",
            "model": model,
            "fallbackReason": f"LLM 호출 실패: {type(exc).__name__}",
        }


@app.get("/health")
def health():
    return {"status": "UP"}


@app.get("/llm/status")
def llm_status():
    api_key_set = bool(os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY"))
    model = os.getenv("LLM_MODEL", "").strip()
    base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    return {
        "provider": "openai_compatible",
        "configured": api_key_set and bool(model),
        "apiKeySet": api_key_set,
        "modelConfigured": bool(model),
        "model": model,
        "baseUrl": base_url,
        "fallbackMode": "rag_fallback_rule_based",
    }


@app.post("/chat")
def chat(req: ChatRequest):
    subject = _clean(req.stockName or req.topicTitle, "선택한 주제")
    code = _clean(req.stockCode, "")
    topic_type = _clean(req.topicType, "market")
    basis_date = _clean(req.contextDate, date.today().isoformat())
    events = req.events or []
    terms = req.terms or []

    event_lines = _event_lines(events)
    term_lines = _term_lines(terms)
    search_context_lines = _search_context_lines(req.searchResult)
    retrieval_documents = _build_retrieval_documents(req, subject, code, topic_type, basis_date)
    answer_parts = [
        f"기준일: {basis_date}",
        f"대상: {subject}{f'({code})' if code else ''}",
        f"분석 범위: {topic_type}",
        "",
        "핵심 해석",
        f"- 질문은 '{_clean(req.question, '차트와 이벤트 해석')}'입니다.",
        "- 이 응답은 현재 저장된 브리프, 차트 이벤트, 용어 사전 연결을 바탕으로 한 교육용 분석입니다.",
    ]

    if search_context_lines:
        answer_parts += ["", "검색 맥락", *search_context_lines]

    if code and event_lines:
        answer_parts += ["", "차트 이벤트 근거", *event_lines]
    elif code:
        answer_parts += ["", "차트 이벤트 근거", "- 확인된 급등/급락/거래량 급증 이벤트가 없거나 아직 전달되지 않았습니다."]
    else:
        answer_parts += ["", "시장/테마 근거", "- 개별 종목 차트가 아닌 검색 맥락과 저장된 브리프를 우선 근거로 사용했습니다."]

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
        {"title": "통합 검색 API", "type": "search", "url": "/api/search"},
        {"title": "초보자 용어 사전", "type": "internal_glossary", "url": "/api/learning/terms"},
    ]
    if code:
        sources.insert(1, {"title": "종목 차트 API", "type": "ohlcv", "url": f"/api/stocks/{code}/chart"})
        sources.insert(2, {"title": "종목 이벤트 API", "type": "events", "url": f"/api/stocks/{code}/events"})

    llm_answer, llm_meta = _call_openai_compatible_llm(
        _build_llm_prompt(req, subject, code, topic_type, basis_date, retrieval_documents)
    )
    used_llm = bool(llm_answer)

    limitations = [
        "투자 지시가 아니라 교육용 분석 보조입니다.",
        "개인 재무 상황, 보유 비중, 투자 기간을 반영하지 않습니다.",
    ]
    if not used_llm:
        limitations.insert(0, "LLM 설정 또는 호출 실패로 규칙형 RAG fallback 응답을 제공합니다.")
    else:
        limitations.insert(0, "LLM 응답은 제공된 retrieval 근거 안에서 생성되도록 제한했습니다.")

    confidence = "medium" if retrieval_documents else "low-medium"
    structured = _build_structured_answer(req, subject, code, basis_date, confidence, sources, limitations)

    return {
        "mode": "rag_llm" if used_llm else "rag_fallback_rule_based",
        "answer": llm_answer or "\n".join(answer_parts),
        "basisDate": basis_date,
        "confidence": confidence,
        "sources": sources,
        "structured": structured,
        "retrieval": {
            "documents": retrieval_documents,
            "sourceCount": len(retrieval_documents),
            "llm": {
                **llm_meta,
                "used": used_llm,
            },
        },
        "limitations": limitations,
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
