# API Portfolio and AI Enrichment Addendum

작성일: 2026-05-05

이 문서는 `docs/API_SPEC.md`에 합쳐야 하는 추가 API 명세다.

## 1. Portfolio Sandbox API

목적:

- 포트폴리오 샌드박스를 브라우저 `localStorage` 임시 저장에서 서버 저장 기반으로 확장한다.
- 실계좌/실거래 연동이 아니라 교육용 가상 비중 샌드박스다.
- 각 종목은 최근 이벤트, 변동성, 다음 확인 체크리스트를 함께 제공한다.

### GET `/api/portfolio`

서버에 저장된 가상 포트폴리오를 조회한다.

응답 예:

```json
{
  "items": [
    {
      "code": "000660",
      "name": "SK하이닉스",
      "group": "반도체 대표 종목",
      "rate": 3.2,
      "count": null,
      "weight": 10,
      "riskNotes": ["가상 비중이 과도하게 높지는 않지만, 동일 섹터 집중 여부를 함께 확인해야 합니다."],
      "nextChecklist": ["SK하이닉스의 최근 이벤트와 거래량 급증 여부 확인"],
      "recentEvents": [
        {
          "date": "2026-01-08",
          "type": "volume_spike",
          "severity": "low",
          "title": "거래량 급증",
          "explanation": "최근 20거래일 평균 대비 거래량이 크게 늘었습니다."
        }
      ]
    }
  ],
  "summary": {
    "totalWeight": 10,
    "maxWeightStock": "SK하이닉스",
    "maxWeight": 10,
    "concentration": "비중이 한 종목에 과도하게 몰리지는 않았습니다.",
    "volatility": "큰 변동률 종목은 아직 적지만, 이벤트 발생 시 비중을 다시 점검하세요.",
    "nextChecklist": ["비중이 가장 큰 종목의 최근 이벤트 확인"]
  },
  "source": "server_mysql_portfolio_sandbox",
  "updatedAt": "2026-05-05T00:00:00Z"
}
```

### POST `/api/portfolio/items`

관심 종목을 추가하거나 기존 종목 정보를 갱신한다.

Request:

```json
{
  "code": "000660",
  "name": "SK하이닉스",
  "group": "반도체 대표 종목",
  "rate": 3.2,
  "count": null,
  "weight": 10
}
```

### PUT `/api/portfolio/items/{code}`

가상 비중을 수정한다.

Request:

```json
{ "weight": 25 }
```

### DELETE `/api/portfolio/items/{code}`

가상 포트폴리오에서 종목을 제거한다.

## 2. AI Chat Context Auto Enrichment

목적:

- 사용자가 context를 충분히 보내지 않아도 backend가 질문을 해석해 검색/브리프/차트/이벤트 근거를 보강한다.
- `/api/ai/chat`이 retrieval 문서 0개로 쉽게 떨어지는 문제를 줄인다.

동작:

1. `context.query`가 있으면 검색 API로 관련 결과를 가져온다.
2. `context.query`가 없으면 질문에서 대표 키워드를 감지한다.
3. 검색 결과 첫 번째 항목을 `context.searchResult`로 추가한다.
4. 검색 결과 목록을 `context.searchResults`로 추가한다.
5. 최신 브리프 요약을 `context.summary`로 추가한다.
6. 종목 코드가 있으면 차트 최신값과 최근 이벤트를 `context.chart`, `context.events`로 추가한다.
7. AI service에는 `retrievalPolicy=backend_auto_enriched_search_summary_chart_events`를 함께 전달한다.

주의:

- 이 기능은 투자 판단을 자동 지시하기 위한 기능이 아니다.
- AI 답변은 계속 교육용 분석 보조로 제한해야 한다.
- 답변에는 근거, 반대 신호, 리스크, 출처, 신뢰도, 기준일, 한계를 포함해야 한다.

