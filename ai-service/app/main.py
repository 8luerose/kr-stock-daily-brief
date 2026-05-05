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
    indicatorSnapshot: dict[str, Any] | None = None
    tradeZones: dict[str, Any] | None = None
    currentDecisionSummary: dict[str, Any] | None = None
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
        sentiment = _clean(event.get("sentimentForPrice") or event.get("sentiment"), "확인 필요")
        positive = event.get("positiveReasons") or []
        negative = event.get("negativeReasons") or []
        positive_text = f" 호재 후보: {_clean(positive[0], '')}" if isinstance(positive, list) and positive else ""
        negative_text = f" 악재/리스크 후보: {_clean(negative[0], '')}" if isinstance(negative, list) and negative else ""
        lines.append(
            f"- {event.get('date', '-')}: {event.get('title', '이벤트')} "
            f"({event.get('severity', 'unknown')}, {sentiment}) - {event.get('explanation', '설명 없음')}"
            f"{positive_text}{negative_text}"
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

    if req.indicatorSnapshot:
        documents.append({
            "id": "indicator-snapshot",
            "type": "indicator_snapshot",
            "title": f"{subject} 이동평균선과 지지/저항 분석",
            "text": _compact(req.indicatorSnapshot),
            "basisDate": _clean(req.indicatorSnapshot.get("basisDate"), basis_date),
        })

    if req.tradeZones:
        documents.append({
            "id": "trade-zones",
            "type": "trade_zones",
            "title": f"{subject} 조건형 매수/매도 검토 구간",
            "text": _compact(req.tradeZones),
            "basisDate": _clean(req.tradeZones.get("basisDate"), basis_date),
        })

    if req.currentDecisionSummary:
        documents.append({
            "id": "current-decision-summary",
            "type": "decision_summary",
            "title": f"{subject} 현재 검토 조건 요약",
            "text": _compact(req.currentDecisionSummary),
            "basisDate": basis_date,
        })

    for index, event in enumerate((req.events or [])[:6], start=1):
        event_date = _clean(event.get("date"), basis_date)
        event_title = _clean(event.get("title"), "이벤트")
        documents.append({
            "id": f"event-{index}",
            "type": _clean(event.get("type"), "event"),
            "title": event_title,
            "text": _compact(event),
            "basisDate": event_date,
        })
        for source_index, source in enumerate((event.get("evidenceSources") or [])[:4], start=1):
            if not isinstance(source, dict):
                continue
            source_type = _clean(source.get("type"), "event_evidence")
            documents.append({
                "id": f"event-{index}-evidence-{source_index}",
                "type": source_type,
                "title": _clean(source.get("title"), f"{event_title} 근거"),
                "text": _compact({
                    "eventTitle": event_title,
                    "description": source.get("description"),
                    "url": source.get("url"),
                }),
                "basisDate": event_date,
            })
        for score_index, score in enumerate((event.get("causalScores") or [])[:4], start=1):
            if not isinstance(score, dict):
                continue
            source_type = _clean(score.get("sourceType"), "causal_score")
            documents.append({
                "id": f"event-{index}-causal-{score_index}",
                "type": f"causal_{source_type}",
                "title": _clean(score.get("label"), f"{event_title} 원인 후보"),
                "text": _compact({
                    "eventTitle": event_title,
                    "score": score.get("score"),
                    "confidence": score.get("confidence"),
                    "basis": score.get("basis"),
                    "interpretation": score.get("interpretation"),
                    "signalSummary": score.get("signalSummary"),
                    "causalFactors": score.get("causalFactors"),
                    "causalDirection": score.get("causalDirection"),
                    "evidenceLevel": score.get("evidenceLevel"),
                    "signalOrigins": score.get("signalOrigins"),
                    "signalUrls": score.get("signalUrls"),
                }),
                "basisDate": event_date,
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


def _count_documents_by_type(documents: list[dict[str, str]]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for doc in documents:
        doc_type = _clean(doc.get("type"), "unknown")
        counts[doc_type] = counts.get(doc_type, 0) + 1
    return counts


def _build_grounding_report(
    req: ChatRequest,
    documents: list[dict[str, str]],
    basis_date: str,
    used_llm: bool,
    llm_meta: dict[str, Any],
) -> dict[str, Any]:
    ids = {doc["id"] for doc in documents}
    supported_claims: list[dict[str, Any]] = []

    def add_claim(claim: str, candidates: list[str]) -> None:
        matched = [doc_id for doc_id in candidates if doc_id in ids]
        if matched:
            supported_claims.append({"claim": claim, "documentIds": matched})

    add_claim("검색 결과 요약을 근거로 사용", ["search-result"])
    add_claim("저장 브리프 요약을 근거로 사용", ["daily-summary"])
    add_claim("차트 snapshot을 근거로 사용", ["chart-snapshot"])
    add_claim("이동평균선 indicator snapshot을 근거로 사용", ["indicator-snapshot"])
    add_claim("조건형 매수/매도 검토 구간을 근거로 사용", ["trade-zones", "current-decision-summary"])
    event_ids = sorted(doc_id for doc_id in ids if doc_id.startswith("event-") and "-evidence-" not in doc_id and "-causal-" not in doc_id)
    evidence_ids = sorted(doc_id for doc_id in ids if "-evidence-" in doc_id)
    causal_ids = sorted(doc_id for doc_id in ids if "-causal-" in doc_id)
    term_ids = sorted(doc_id for doc_id in ids if doc_id.startswith("term-"))
    add_claim("차트 이벤트를 근거로 사용", event_ids[:6])
    add_claim("뉴스/공시/DART/토론 evidence 후보를 근거로 사용", evidence_ids[:8])
    add_claim("출처별 원인 점수와 텍스트 신호를 근거로 사용", causal_ids[:8])
    add_claim("초보자 용어 사전을 근거로 사용", term_ids[:6])

    missing: list[str] = []
    if not documents:
        missing.append("retrieval 문서가 없어 답변 근거가 제한적입니다.")
    if req.stockCode and "chart-snapshot" not in ids:
        missing.append("차트 snapshot이 요청에 포함되지 않았습니다.")
    if req.stockCode and "indicator-snapshot" not in ids:
        missing.append("이동평균선 indicator snapshot이 요청에 포함되지 않았습니다.")
    if req.stockCode and "trade-zones" not in ids:
        missing.append("조건형 매수/매도 검토 구간이 요청에 포함되지 않았습니다.")
    if req.stockCode and not event_ids:
        missing.append("차트 이벤트 후보가 요청에 포함되지 않았습니다.")
    if req.events and not evidence_ids and not causal_ids:
        missing.append("이벤트 원인 후보의 뉴스/공시/DART evidence가 요청에 포함되지 않았습니다.")
    if not used_llm:
        reason = _clean(llm_meta.get("fallbackReason"), "LLM 설정 또는 호출 실패")
        missing.append(f"실제 LLM grounded generation 미사용: {reason}")

    return {
        "policy": "retrieval_only_with_explicit_limitations",
        "basisDate": basis_date,
        "sourceCoverage": _count_documents_by_type(documents),
        "supportedClaims": supported_claims,
        "missingEvidence": missing,
        "confidence": "medium" if supported_claims else "low",
        "llmUsed": used_llm,
    }


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
        "근거 문장에는 반드시 최소 2개의 retrieval 문서 id를 대괄호 형식으로 함께 언급한다. "
        "답변 구조는 한 줄 결론, 이동평균선 해석, 매수 검토 조건, 관망 조건, 매도 검토 조건, 리스크 관리, "
        "호재/악재 후보 이유, 반대 신호, 초보자 체크리스트, 다음 확인 순서로 작성한다."
    )
    user = (
        f"질문: {_clean(req.question, '시장과 차트 해석')}\n"
        f"대상: {subject}{f'({code})' if code else ''}\n"
        f"분석 범위: {topic_type}\n"
        f"기준일: {basis_date}\n\n"
        f"검색된 근거:\n{context or '제공된 근거가 없습니다.'}"
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def _moving_average_explanation(indicator: dict[str, Any] | None) -> str:
    if not indicator:
        return "이동평균선 근거가 부족합니다. 5일선은 단기, 20일선은 약 한 달, 60일선은 중기 흐름을 보는 기준입니다."
    moving = indicator.get("movingAverages") or {}
    price_vs = indicator.get("priceVsMa20") or {}
    return (
        f"5일선은 단기 흐름({ _clean(moving.get('ma5')) }), "
        f"20일선은 약 한 달 평균 흐름({ _clean(moving.get('ma20')) }), "
        f"60일선은 중기 흐름({ _clean(moving.get('ma60')) })입니다. "
        f"현재가는 20일선 대비 { _clean(price_vs.get('position'), 'unknown') } 상태이고 "
        f"거리는 { _clean(price_vs.get('distanceRate'), '-') }%입니다. "
        "이동평균선 위라고 무조건 좋거나 아래라고 무조건 나쁜 것은 아니며 거래량, 지지선, 저항선, 이벤트를 함께 봐야 합니다."
    )


def _decision_field(decision: dict[str, Any] | None, key: str, fallback: str) -> str:
    if isinstance(decision, dict):
        value = decision.get(key)
        if value:
            return str(value)
    return fallback


def _trade_zones(req: ChatRequest) -> list[dict[str, Any]]:
    if not isinstance(req.tradeZones, dict):
        return []
    zones = req.tradeZones.get("zones") or []
    return [zone for zone in zones if isinstance(zone, dict)]


def _zone_by_type(zones: list[dict[str, Any]], *types: str) -> dict[str, Any]:
    wanted = set(types)
    for zone in zones:
        if zone.get("type") in wanted:
            return zone
    return {}


def _zone_condition(zone: dict[str, Any], fallback: str) -> str:
    return _clean(zone.get("condition") or zone.get("summary"), fallback)


def _event_factors(events: list[dict[str, Any]], key: str, fallback: str) -> list[str]:
    values: list[str] = []
    for event in events[:5]:
        raw = event.get(key) or []
        if isinstance(raw, str):
            raw = [raw]
        if isinstance(raw, list):
            for item in raw[:3]:
                text = _clean(item, "")
                if text and text not in values:
                    values.append(text)
    return values or [fallback]


def _beginner_checklist(zones: list[dict[str, Any]], decision: dict[str, Any] | None) -> list[str]:
    checklist: list[str] = []
    if isinstance(decision, dict):
        why = decision.get("why") or []
        if isinstance(why, list):
            checklist.extend(str(item) for item in why[:4] if str(item).strip())
    for zone in zones[:5]:
        raw = zone.get("beginnerChecklist") or []
        if isinstance(raw, list):
            checklist.extend(str(item) for item in raw[:2] if str(item).strip())
    fallback = [
        "20일선 위/아래 위치를 먼저 확인합니다.",
        "거래량이 20일 평균보다 많은지 봅니다.",
        "지지선과 저항선을 가격 기준으로 적어 둡니다.",
        "호재/악재 뉴스가 실제 가격 반응으로 이어졌는지 확인합니다.",
    ]
    seen: set[str] = set()
    result = []
    for item in checklist + fallback:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result[:8]


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
    indicator = req.indicatorSnapshot if isinstance(req.indicatorSnapshot, dict) else None
    decision = req.currentDecisionSummary if isinstance(req.currentDecisionSummary, dict) else None
    zones = _trade_zones(req)
    buy_zone = _zone_by_type(zones, "buy_review", "buy")
    split_zone = _zone_by_type(zones, "split_buy", "split")
    watch_zone = _zone_by_type(zones, "watch")
    sell_zone = _zone_by_type(zones, "sell_review", "sell")
    risk_zone = _zone_by_type(zones, "risk_management", "risk")
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
            f"등락률 {_clean(event.get('priceChangeRate'))}%, 거래량 {_clean(event.get('volumeChangeRate'))}%, "
            f"해석 {_clean(event.get('sentimentForPrice'), '확인 필요')}"
        )

    if indicator:
        evidence.append("지표: " + _clean(indicator.get("beginnerSummary"), "이동평균선 근거가 전달되었습니다."))

    if not evidence:
        evidence.append("제공된 검색, 브리프, 차트, 이벤트 근거가 제한적입니다.")

    if code and decision:
        conclusion = f"{subject}({code})은(는) {basis_date} 기준 {_clean(decision.get('summary'), '조건부 검토가 필요합니다.')}"
    elif code and events:
        conclusion = f"{subject}({code})은(는) {basis_date} 기준 차트 이벤트가 있어 가격과 거래량을 함께 확인해야 합니다."
    elif code:
        conclusion = f"{subject}({code})은(는) {basis_date} 기준 차트/검색 근거로 조건부 검토가 필요합니다."
    else:
        conclusion = f"{subject}은(는) {basis_date} 기준 검색/브리프 근거로 시장 맥락을 먼저 확인해야 합니다."

    buy_review = _decision_field(
        decision,
        "buyReviewCondition",
        _zone_condition(buy_zone, "가격 회복, 거래량 증가, 주요 지지선 방어가 함께 나올 때만 매수 검토합니다."),
    )
    sell_review = _decision_field(
        decision,
        "sellReviewCondition",
        _zone_condition(sell_zone, "급등 후 거래량 둔화, 긴 윗꼬리, 직전 고점 돌파 실패가 겹치면 매도 검토합니다."),
    )
    watch_review = _decision_field(
        decision,
        "watchCondition",
        _zone_condition(watch_zone, "가격과 거래량 신호가 엇갈리거나 근거 링크가 부족하면 새 데이터가 쌓일 때까지 기다립니다."),
    )
    risk_management = _decision_field(
        decision,
        "riskCondition",
        _zone_condition(risk_zone, "전저점 이탈이나 하락일 거래량 급증 시 손실 허용 기준을 다시 세웁니다."),
    )
    positive_factors = _event_factors(events, "positiveReasons", "가격/거래량 조합상 호재 후보가 있으면 공시와 뉴스 원문으로 확인합니다.")
    negative_factors = _event_factors(events, "negativeReasons", "하락 거래량, 저항선 실패, 출처 부족은 악재 또는 리스크 후보입니다.")
    opposing_signals = _event_factors(events, "oppositeSignals", _decision_field(decision, "oppositeSignal", "거래량 없는 상승, 20일선 재이탈, 출처 부족을 반대 신호로 봅니다."))
    beginner_checklist = _beginner_checklist(zones, decision)
    beginner_explanation = _clean(
        (indicator or {}).get("beginnerExplanation") or (decision or {}).get("beginnerExplanation"),
        "초보자는 5일선, 20일선, 60일선의 역할을 나누어 보고 거래량, 지지선, 저항선, 이벤트를 함께 확인해야 합니다.",
    )

    return {
        "conclusion": conclusion,
        "movingAverageExplanation": _moving_average_explanation(indicator),
        "chartState": {
            "state": _clean((decision or {}).get("state"), "watch"),
            "summary": _clean((decision or {}).get("summary"), conclusion),
            "indicatorSnapshot": indicator or {},
        },
        "buyReview": buy_review,
        "sellReview": sell_review,
        "watchReview": watch_review,
        "riskManagement": risk_management,
        "buyCondition": buy_review,
        "sellCondition": sell_review,
        "waitCondition": watch_review,
        "riskCondition": risk_management,
        "positiveFactors": positive_factors,
        "negativeFactors": negative_factors,
        "positives": positive_factors,
        "negatives": negative_factors,
        "opposingSignals": opposing_signals,
        "beginnerExplanation": beginner_explanation,
        "beginnerChecklist": beginner_checklist,
        "nextChecklist": beginner_checklist,
        "tradeZones": zones,
        "evidence": evidence[:5],
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


def _first_env(*keys: str) -> str:
    for key in keys:
        value = os.getenv(key, "").strip()
        if value:
            return value
    return ""


def _join_api_path(base_url: str, path: str) -> str:
    base = base_url.rstrip("/")
    suffix = path.lstrip("/")
    if base.endswith("/v1") and suffix.startswith("v1/"):
        suffix = suffix[3:]
    return f"{base}/{suffix}"


def _call_openai_compatible_llm(messages: list[dict[str, str]]) -> tuple[str | None, dict[str, Any]]:
    api_key = _first_env("LLM_API_KEY", "OPENAI_API_KEY")
    model = os.getenv("LLM_MODEL", "").strip()
    base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    timeout = float(os.getenv("LLM_TIMEOUT_SECONDS", "45"))

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


def _anthropic_messages(messages: list[dict[str, str]]) -> tuple[str, list[dict[str, str]]]:
    system_parts: list[str] = []
    chat_messages: list[dict[str, str]] = []
    for message in messages:
        role = _clean(message.get("role"), "user")
        content = _clean(message.get("content"), "")
        if role == "system":
            system_parts.append(content)
            continue
        chat_messages.append({
            "role": "assistant" if role == "assistant" else "user",
            "content": content,
        })
    if not chat_messages:
        chat_messages.append({"role": "user", "content": "제공된 근거를 바탕으로 한국 주식 분석을 요약해줘."})
    return "\n\n".join(system_parts), chat_messages


def _extract_anthropic_text(data: dict[str, Any]) -> str:
    content = data.get("content")
    if isinstance(content, str):
        return content.strip()
    if not isinstance(content, list):
        return ""
    parts: list[str] = []
    for block in content:
        if isinstance(block, dict) and block.get("type") == "text":
            text = _clean(block.get("text"), "")
            if text:
                parts.append(text)
    return "\n".join(parts).strip()


def _call_anthropic_compatible_llm(messages: list[dict[str, str]]) -> tuple[str | None, dict[str, Any]]:
    api_key = _first_env("ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_API_KEY")
    model = _first_env(
        "ANTHROPIC_MODEL",
        "ANTHROPIC_DEFAULT_SONNET_MODEL",
        "ANTHROPIC_DEFAULT_OPUS_MODEL",
        "ANTHROPIC_DEFAULT_HAIKU_MODEL",
    )
    base_url = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com").rstrip("/")
    version = os.getenv("ANTHROPIC_VERSION", "2023-06-01").strip()
    timeout = float(os.getenv("LLM_TIMEOUT_SECONDS", os.getenv("ANTHROPIC_TIMEOUT_SECONDS", "45")))

    if not api_key or not model:
        return None, {
            "enabled": False,
            "provider": "anthropic_compatible",
            "model": model or "",
            "fallbackReason": "ANTHROPIC_AUTH_TOKEN/ANTHROPIC_API_KEY 또는 ANTHROPIC_MODEL이 설정되지 않았습니다.",
        }

    system, chat_messages = _anthropic_messages(messages)
    payload_data: dict[str, Any] = {
        "model": model,
        "messages": chat_messages,
        "temperature": 0.2,
        "max_tokens": 900,
    }
    if system:
        payload_data["system"] = system

    payload = json.dumps(payload_data).encode("utf-8")
    req = request.Request(
        _join_api_path(base_url, "/v1/messages"),
        data=payload,
        headers={
            "x-api-key": api_key,
            "anthropic-version": version,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=timeout) as res:
            data = json.loads(res.read().decode("utf-8"))
        content = _extract_anthropic_text(data)
        if not content:
            return None, {
                "enabled": True,
                "provider": "anthropic_compatible",
                "model": model,
                "fallbackReason": "LLM 응답에 text content가 없습니다.",
            }
        return content, {
            "enabled": True,
            "provider": "anthropic_compatible",
            "model": model,
            "fallbackReason": "",
        }
    except (error.URLError, TimeoutError, json.JSONDecodeError, KeyError) as exc:
        return None, {
            "enabled": True,
            "provider": "anthropic_compatible",
            "model": model,
            "fallbackReason": f"LLM 호출 실패: {type(exc).__name__}",
        }


def _llm_status() -> dict[str, Any]:
    openai_key_set = bool(_first_env("LLM_API_KEY", "OPENAI_API_KEY"))
    openai_model = os.getenv("LLM_MODEL", "").strip()
    openai_base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    anthropic_key_set = bool(_first_env("ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_API_KEY"))
    anthropic_model = _first_env(
        "ANTHROPIC_MODEL",
        "ANTHROPIC_DEFAULT_SONNET_MODEL",
        "ANTHROPIC_DEFAULT_OPUS_MODEL",
        "ANTHROPIC_DEFAULT_HAIKU_MODEL",
    )
    anthropic_base_url = os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com").rstrip("/")
    preferred = os.getenv("LLM_PROVIDER", "").strip().lower()

    openai_configured = openai_key_set and bool(openai_model)
    anthropic_configured = anthropic_key_set and bool(anthropic_model)
    if preferred in {"anthropic", "anthropic_compatible"} and anthropic_configured:
        provider = "anthropic_compatible"
    elif preferred in {"openai", "openai_compatible"} and openai_configured:
        provider = "openai_compatible"
    elif openai_configured:
        provider = "openai_compatible"
    elif anthropic_configured:
        provider = "anthropic_compatible"
    elif preferred in {"anthropic", "anthropic_compatible"}:
        provider = "anthropic_compatible"
    else:
        provider = "openai_compatible"

    if provider == "anthropic_compatible":
        api_key_set = anthropic_key_set
        model = anthropic_model
        base_url = anthropic_base_url
    else:
        api_key_set = openai_key_set
        model = openai_model
        base_url = openai_base_url

    return {
        "provider": provider,
        "configured": api_key_set and bool(model),
        "apiKeySet": api_key_set,
        "modelConfigured": bool(model),
        "model": model,
        "baseUrl": base_url,
        "availableProviders": {
            "openaiCompatible": {
                "apiKeySet": openai_key_set,
                "modelConfigured": bool(openai_model),
                "configured": openai_configured,
            },
            "anthropicCompatible": {
                "apiKeySet": anthropic_key_set,
                "modelConfigured": bool(anthropic_model),
                "configured": anthropic_configured,
            },
        },
        "fallbackMode": "rag_fallback_rule_based",
    }


def _call_configured_llm(messages: list[dict[str, str]]) -> tuple[str | None, dict[str, Any]]:
    status = _llm_status()
    if status["provider"] == "anthropic_compatible":
        return _call_anthropic_compatible_llm(messages)
    return _call_openai_compatible_llm(messages)


@app.get("/health")
def health():
    return {"status": "UP"}


@app.get("/llm/status")
def llm_status():
    return _llm_status()


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

    if req.indicatorSnapshot:
        answer_parts += ["", "이동평균선 해석", f"- {_moving_average_explanation(req.indicatorSnapshot)}"]

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
        sources.insert(3, {"title": "조건형 거래 구간 API", "type": "trade_zones", "url": f"/api/stocks/{code}/trade-zones"})

    llm_answer, llm_meta = _call_configured_llm(
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
    grounding = _build_grounding_report(req, retrieval_documents, basis_date, used_llm, llm_meta)

    return {
        "mode": "rag_llm" if used_llm else "rag_fallback_rule_based",
        "answer": llm_answer or "\n".join(answer_parts),
        "basisDate": basis_date,
        "confidence": confidence,
        "sources": sources,
        "structured": structured,
        "grounding": grounding,
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
