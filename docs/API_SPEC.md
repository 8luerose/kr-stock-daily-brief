# API 명세서 (kr-stock-daily-brief)

최종 업데이트: 2026-05-03
기준 코드:
- `backend/src/main/java/com/krbrief/summaries/SummaryController.java`
- `backend/src/main/java/com/krbrief/learning/LearningController.java`
- `backend/src/main/java/com/krbrief/stocks/StockController.java`
- `backend/src/main/java/com/krbrief/ai/AiChatController.java`

---

## 문서 운영 계획 (중요)

이 문서는 **개발 전에 명세를 먼저 업데이트**하고, 이후 코드 반영 시 다시 동기화한다.

- 신규 API 추가 시:
  1) 이 문서에 endpoint/req/res/error를 먼저 추가
  2) 구현 후 실제 응답 예시로 갱신
- 기존 API 변경 시:
  1) 변경 내용(파라미터/응답 필드/에러 코드) 즉시 반영
  2) README와 함께 동기화
- 배포 전 점검:
  - 구현 코드와 문서가 1:1로 맞는지 확인

---

## 공통

- Base URL (local): `http://localhost:8080`
- Content-Type: `application/json`
- 날짜 포맷: `YYYY-MM-DD` (ISO)
- Optional Gate 사용 시 모든 `/api/**` 호출에 `?k=PUBLIC_KEY` 필요
- `SummaryDto`에는 anomaly-aware 필드가 포함됨:
  - `rawTopGainer`, `rawTopLoser`
  - `filteredTopGainer`, `filteredTopLoser`
  - `anomalies[]` (`symbol`, `name`, `rate`, `flags`, `oneLineReason`)
  - `rankingWarning`
  - `leaderExplanations` (`topGainer`, `topLoser` 각각 `level`, `summary`, `evidenceLinks`)

---

## 1) 통계 조회

### `GET /api/summaries/stats`

요약 누적 개수와 최신 요약 메타 정보 조회.

#### 성공 응답 (200)

```json
{
  "totalCount": 12,
  "latestDate": "2026-02-16",
  "latestUpdatedAt": "2026-02-16T08:11:13.000Z"
}
```

---

## 2) 기간 인사이트 조회

### `GET /api/summaries/insights?from=YYYY-MM-DD&to=YYYY-MM-DD`

기간 내 요약 누적 현황/최다 언급 종목 집계.

#### Query Parameters

- `from` (required): 시작일
- `to` (required): 종료일

#### 성공 응답 (200)

```json
{
  "from": "2026-02-01",
  "to": "2026-02-29",
  "totalDays": 29,
  "generatedDays": 12,
  "missingDays": 17,
  "topMostMentioned": "SK증권",
  "topMostMentionedCount": 4
}
```

#### 실패 응답

- 400 Bad Request: `from > to`

---

## 3) 월/기간 조회

### `GET /api/summaries?from=YYYY-MM-DD&to=YYYY-MM-DD`

기간 내 요약 목록(날짜 오름차순) 조회.

#### Query Parameters

- `from` (required): 시작일
- `to` (required): 종료일

#### 성공 응답 (200)

```json
[
  {
    "date": "2026-02-16",
    "topGainer": "SK증권우",
    "topLoser": "코퍼스코리아",
    "mostMentioned": "SK증권",
    "kospiPick": "SK증권",
    "kosdaqPick": "좋은사람들",
    "rawNotes": "Source: naver(finance.naver.com)...",
    "createdAt": "2026-02-16T08:11:13.000Z",
    "updatedAt": "2026-02-16T08:11:13.000Z",
    "verification": {
      "date": "2026-02-16",
      "krxDataPortal": "https://data.krx.co.kr/",
      "krxMarketOverview": "https://data.krx.co.kr/contents/MDC/MAIN/main/index.cmd",
      "pykrxRepo": "https://github.com/sharebook-kr/pykrx",
      "topGainerSearch": "",
      "topLoserSearch": "",
      "mostMentionedSearch": "",
      "kospiPickSearch": "",
      "kosdaqPickSearch": "",
      "topGainerDateSearch": "https://finance.naver.com/item/sise_day.naver?code=001510",
      "topLoserDateSearch": "https://finance.naver.com/item/sise_day.naver?code=009070",
      "mostMentionedDateSearch": "https://finance.naver.com/item/sise_day.naver?code=001510",
      "kospiPickDateSearch": "https://finance.naver.com/item/sise_day.naver?code=001510",
      "kosdaqPickDateSearch": "https://finance.naver.com/item/sise_day.naver?code=094820",
      "verificationLimitations": "Primary verification uses date-locked KRX artifact and portal links. Per-field links are direct Naver stock day pages by ticker code (no Naver search links)."
    },
    "leaderExplanations": {
      "topGainer": {
        "level": "caution",
        "summary": "처음 계산 1위 종목은 변동폭이 매우 커서 확인이 필요합니다.",
        "evidenceLinks": [
          "/api/summaries/2026-02-16/verification/krx#topGainer",
          "https://data.krx.co.kr/"
        ]
      },
      "topLoser": {
        "level": "info",
        "summary": "가격/거래 연속성 이상 신호가 없어 일반 랭킹 결과로 표시됩니다.",
        "evidenceLinks": [
          "/api/summaries/2026-02-16/verification/krx#topLoser"
        ]
      }
    },
    "content": "Daily summary for 2026-02-16...",
    "generatedAt": "2026-02-16T08:11:13.000Z"
  }
]
```

#### 실패 응답

- 400 Bad Request: `from > to`

---

## 4) 최신 요약 조회

### `GET /api/summaries/latest`

가장 최근(최대 날짜) 요약 1건 조회.

#### 성공 응답 (200)

`SummaryDto` 1건 반환.

#### 실패 응답

- 404 Not Found: 저장된 요약이 없음

---

## 5) 단일 날짜 조회

### `GET /api/summaries/{date}`

특정 날짜 요약 조회.

#### Path Parameters

- `date` (required): `YYYY-MM-DD`

#### 성공 응답 (200)

`SummaryDto` 1건 반환 (위와 동일 구조)

#### 실패 응답

- 404 Not Found: 해당 날짜 데이터 없음
- 400 Bad Request: 날짜 형식/값이 잘못됨

예시:

```json
{
  "error": "invalid_date",
  "message": "date must be YYYY-MM-DD and a real calendar date",
  "param": "date",
  "value": "2026-02-29"
}
```

---

## 6) 특정 날짜 생성/갱신

### `POST /api/summaries/{date}/generate`

특정 날짜 요약 생성(이미 있으면 업데이트). 사실상 upsert.

#### Path Parameters

- `date` (required): `YYYY-MM-DD`

#### 성공 응답 (200)

생성된 `SummaryDto` 반환.

---

## 7) 요약 보관(삭제 대체)

### `PUT /api/summaries/{date}/archive`

실수 복구를 위해 물리 삭제 대신 보관(soft delete) 처리.

#### 성공 응답 (200)

보관된 `SummaryDto` 반환 (`archivedAt` 채워짐)

#### 실패 응답

- 404 Not Found: 해당 날짜 데이터 없음

---

## 8) 과거 백필 생성

### `POST /api/summaries/backfill?from=YYYY-MM-DD&to=YYYY-MM-DD`

기간 내 날짜를 순회하며 요약 생성(upsert) 수행.

백필 날짜가 `today(Asia/Seoul)` 이전이면 pykrx sidecar `/leaders?date=YYYY-MM-DD`를 우선 사용하고,
pykrx 실패 시 기존 소스(naver) 및 내부 fallback을 사용.

#### 성공 응답 (200)

```json
{
  "from": "2026-02-01",
  "to": "2026-02-05",
  "totalDays": 5,
  "successCount": 1,
  "lowConfidenceCount": 4,
  "failCount": 0,
  "results": [
    {
      "date": "2026-02-01",
      "status": "success",
      "reason": "",
      "sourceUsed": "pykrx",
      "confidence": "high"
    },
    {
      "date": "2026-02-02",
      "status": "low_confidence",
      "reason": "historical accuracy limited for current naver v1 source",
      "sourceUsed": "naver",
      "confidence": "low"
    }
  ]
}
```

`results[*]` 필드:

- `sourceUsed`: `pykrx | fdr | naver | fallback`
- `confidence`: `high | low` (`pykrx`면 `high`, 그 외 `low`)

---

## 9) 오늘(서울 기준) 생성/갱신

### `POST /api/summaries/generate/today`

`Asia/Seoul` 기준 오늘 날짜로 요약 생성(upsert).

#### 성공 응답 (200)

생성된 `SummaryDto` 반환.

---

## 10) 초보자 용어 목록 조회

### `GET /api/learning/terms?query=&category=&limit=`

브리프를 읽을 때 필요한 주요 주식 용어와 초보자용 설명을 조회한다.

#### Query Parameters

- `query` (optional): 용어/설명 검색어. 예: `PER`, `거래량`, `공시`
- `category` (optional): `시장`, `차트`, `재무`, `공시/뉴스`, `리스크`
- `limit` (optional): 반환 개수. 기본 80, 최대 120

#### 성공 응답 (200)

```json
[
  {
    "id": "price-change-rate",
    "term": "등락률",
    "category": "시장",
    "plainDefinition": "전일 종가와 비교해 오늘 가격이 몇 퍼센트 오르거나 내렸는지 보여주는 숫자입니다.",
    "whyItMatters": "하루 동안 시장이 어떤 종목에 강하게 반응했는지 빠르게 볼 수 있습니다.",
    "beginnerCheck": "등락률만 보지 말고 거래량, 공시, 뉴스, 시장 전체 흐름을 같이 확인하세요.",
    "caution": "가격이 낮거나 거래가 적은 종목은 등락률이 과장되어 보일 수 있습니다.",
    "relatedTerms": ["상승률", "하락률", "전일대비", "rate"],
    "exampleQuestions": ["등락률이 높으면 좋은 종목인가요?", "전일대비 등락률은 어떻게 계산해요?"]
  }
]
```

---

## 11) 초보자 용어 단건 조회

### `GET /api/learning/terms/{id}`

용어 ID로 단건 조회한다.

#### Path Parameters

- `id` (required): 예: `per`, `volume`, `board-mentions`

#### 성공 응답 (200)

`LearningTermDto` 1건 반환.

#### 실패 응답

- 404 Not Found: 해당 용어 없음

---

## 12) 학습 도우미 응답

### `POST /api/learning/assistant`

현재는 내부 용어 사전 기반의 규칙형 응답을 반환한다. 이후 LLM/RAG를 붙일 때 같은 입력을 `/api/ai/chat` 또는 `ai-service`로 라우팅하는 연결 지점으로 사용한다.

#### Request Body

```json
{
  "question": "거래량이 왜 중요해?",
  "contextDate": "2026-05-03",
  "termId": "volume"
}
```

#### 성공 응답 (200)

```json
{
  "mode": "rule_based_learning_preview",
  "answer": "질문: 거래량이 왜 중요해?\n\n기준일: 2026-05-03\n\n핵심 설명\n- 거래량: 하루 동안 거래된 주식 수입니다...",
  "confidence": "medium",
  "matchedTerms": [
    {
      "id": "volume",
      "term": "거래량",
      "category": "시장",
      "plainDefinition": "하루 동안 거래된 주식 수입니다.",
      "whyItMatters": "가격 움직임에 실제 참여가 있었는지 확인하는 기본 지표입니다.",
      "beginnerCheck": "급등/급락이 거래량 증가와 함께 나타났는지 확인하세요.",
      "caution": "거래량이 갑자기 늘었다고 항상 좋은 신호는 아닙니다.",
      "relatedTerms": ["거래 주식 수", "volume", "수급"],
      "exampleQuestions": ["거래량이 늘면 왜 중요해요?", "거래량 없이 오른 종목은 어떻게 봐야 해요?"]
    }
  ],
  "sources": [
    {
      "title": "앱 내부 초보자 용어 사전",
      "type": "internal_glossary",
      "url": "/api/learning/terms"
    }
  ],
  "limitations": [
    "현재 응답은 LLM이 아니라 내부 용어 사전 기반의 규칙형 학습 응답입니다.",
    "개별 종목의 매수, 매도, 가격, 시점 판단을 직접 지시하지 않습니다."
  ],
  "nextQuestions": ["거래량이 늘면 왜 중요해요?", "거래량 없이 오른 종목은 어떻게 봐야 해요?"],
  "futureAiEndpoint": "/api/ai/chat"
}
```

#### 응답 정책

- 투자 판단을 직접 지시하지 않는다.
- 답변에는 기준일, 출처, 한계, 연결된 용어를 포함한다.
- LLM/RAG 도입 시에도 이 응답 정책을 유지한다.

---

## 13) 종목 차트 조회

### `GET /api/stocks/{code}/chart?range=1M|3M|6M|1Y|3Y&interval=daily|weekly|monthly`

종목별 OHLCV 차트 데이터를 조회한다. backend는 공개 API 게이트웨이 역할을 하고, 실제 데이터는 `marketdata-python`의 pykrx 기반 엔드포인트를 호출한다.

#### Path Parameters

- `code` (required): 6자리 한국 종목 코드. 예: `005930`

#### Query Parameters

- `range` (optional): `1M | 3M | 6M | 1Y | 3Y`, 기본 `6M`
- `interval` (optional): `daily | weekly | monthly`, 기본 `daily`

#### 성공 응답 (200)

```json
{
  "code": "005930",
  "name": "삼성전자",
  "interval": "daily",
  "range": "6M",
  "priceBasis": "close",
  "adjusted": false,
  "asOf": "2026-05-03",
  "data": [
    { "date": "2026-05-03", "open": 0, "high": 0, "low": 0, "close": 0, "volume": 0 }
  ]
}
```

#### 실패 응답

- 400 Bad Request: 종목 코드/range/interval이 잘못됨
- 502 Bad Gateway: marketdata 조회 실패

---

## 14) 종목 이벤트 조회

### `GET /api/stocks/{code}/events?from=YYYY-MM-DD&to=YYYY-MM-DD`

가격 급등/급락, 거래량 급증 같은 차트 이벤트 후보를 조회한다. 이벤트는 교육용 분석 보조 신호이며 매수/매도 지시가 아니다.

#### Path Parameters

- `code` (required): 6자리 한국 종목 코드. 예: `005930`

#### Query Parameters

- `from` (required): 시작일
- `to` (required): 종료일

#### 성공 응답 (200)

```json
{
  "code": "005930",
  "name": "삼성전자",
  "events": [
    {
      "date": "2026-05-03",
      "type": "volume_spike",
      "severity": "medium",
      "priceChangeRate": 3.2,
      "volumeChangeRate": 230.5,
      "title": "거래량 급증",
      "explanation": "최근 20거래일 평균 대비 거래량이 크게 증가했습니다.",
      "evidenceLinks": [
        "https://finance.naver.com/item/sise_day.naver?code=005930",
        "https://finance.naver.com/item/main.naver?code=005930"
      ]
    }
  ]
}
```

#### 실패 응답

- 400 Bad Request: 종목 코드/date range가 잘못됨
- 502 Bad Gateway: marketdata 조회 실패

---

## 15) 종목 거래 구간 조회

### `GET /api/stocks/{code}/trade-zones?range=1M|3M|6M|1Y|3Y&interval=daily|weekly|monthly&riskMode=aggressive|neutral|conservative`

차트 기반 매수 검토, 분할매수 검토, 관망, 매도 검토, 리스크 관리 구간을 조건/근거/반대 신호/초보자 설명과 함께 반환한다. 직접적인 투자 지시가 아니라 교육용 검토 구간이다.

#### Path Parameters

- `code` (required): 6자리 한국 종목 코드. 예: `005930`

#### Query Parameters

- `range` (optional): `1M | 3M | 6M | 1Y | 3Y`, 기본 `6M`
- `interval` (optional): `daily | weekly | monthly`, 기본 `daily`
- `riskMode` (optional): `aggressive | neutral | conservative`, 기본 `neutral`

#### 성공 응답 (200)

```json
{
  "code": "005930",
  "name": "삼성전자",
  "interval": "daily",
  "range": "6M",
  "basisDate": "2026-05-03",
  "riskMode": "neutral",
  "confidence": "medium-high",
  "zones": [
    {
      "type": "buy_review",
      "label": "매수 검토 구간",
      "fromPrice": 69000,
      "toPrice": 71000,
      "condition": "20일선 회복, 전일 대비 거래량 증가, 직전 저점 방어가 동시에 보일 때 매수 검토",
      "evidence": "현재가, 20일 거래량 평균, 최근 종가 흐름을 함께 사용",
      "oppositeSignal": "가격은 회복하지만 거래량이 평균 이하이면 신뢰도를 낮춤",
      "confidence": "medium-high",
      "basisDate": "2026-05-03",
      "beginnerExplanation": "가격만 보지 말고 거래량이 같이 늘어나는지 확인합니다."
    }
  ],
  "evidence": ["기준일: 2026-05-03", "최근 종가: 70000"]
}
```

#### 실패 응답

- 400 Bad Request: 종목 코드/range/interval/riskMode가 잘못됨
- 502 Bad Gateway: marketdata 조회 실패 또는 차트 데이터 없음

---

## 16) 종목 universe 조회

### `GET /api/stocks/universe?query=&limit=`

KRX KOSPI/KOSDAQ 상장 종목 universe를 조회한다. backend는 공개 API 게이트웨이 역할을 하고,
실제 목록은 `marketdata-python`의 pykrx `get_market_ticker_list` 기반 엔드포인트를 호출한다.
통합 검색은 이 universe를 캐시해서 대표 baseline 밖의 종목명/종목코드도 찾는다.

#### Query Parameters

- `query` (optional): 종목명, 종목코드, 시장 구분 검색어. 예: `유한양행`, `000100`, `KOSPI`
- `limit` (optional): 반환 개수. 기본 80, 최대 5000

#### 성공 응답 (200)

```json
{
  "asOf": "2026-05-03",
  "source": "pykrx_market_ticker_list",
  "totalCount": 2800,
  "count": 1,
  "adjustmentNote": "",
  "stocks": [
    { "code": "000100", "name": "유한양행", "market": "KOSPI" }
  ]
}
```

#### 응답 정책

- `totalCount`는 pykrx가 반환한 KOSPI/KOSDAQ 전체 universe 개수다.
- `count`는 필터와 limit 적용 후 실제 반환된 개수다.
- marketdata 조회 실패 시 backend는 502를 반환한다.
- 통합 검색은 이 API가 실패하면 `source=stock_universe_baseline` 대표 종목 목록으로 fallback한다.

#### 실패 응답

- 502 Bad Gateway: marketdata/pykrx universe 조회 실패

---

## 17) 업종 taxonomy 조회

### `GET /api/stocks/sectors?query=&limit=`

KRX KOSPI/KOSDAQ 업종 분류 taxonomy를 조회한다. backend는 공개 API 게이트웨이 역할을 하고,
실제 업종 구성은 `marketdata-python`의 pykrx `get_market_sector_classifications` 기반 엔드포인트를 호출한다.
통합 검색은 이 taxonomy를 캐시해서 KRX 업종명과 대표 구성 종목명을 함께 찾는다.

#### Query Parameters

- `query` (optional): 업종명, 시장 구분, 대표 구성 종목명/코드 검색어. 예: `의료·정밀기기`, `금융`, `KOSDAQ`
- `limit` (optional): 반환 개수. 기본 80, 최대 500

#### 성공 응답 (200)

```json
{
  "asOf": "2026-05-03",
  "source": "pykrx_market_sector_classifications",
  "totalCount": 20,
  "count": 1,
  "adjustmentNote": "",
  "sectors": [
    {
      "name": "의료·정밀기기",
      "type": "industry",
      "market": "KRX",
      "markets": ["KOSDAQ"],
      "memberCount": 120,
      "rate": 0.42,
      "topStocks": [
        { "code": "214150", "name": "클래시스", "market": "KOSDAQ", "marketCap": 3500000000000, "rate": 1.2 }
      ],
      "summary": "KRX 업종 분류 기준 120개 상장 종목이 포함됩니다."
    }
  ]
}
```

#### 응답 정책

- `totalCount`는 pykrx가 반환한 KOSPI/KOSDAQ 업종 taxonomy 개수다.
- `count`는 필터와 limit 적용 후 실제 반환된 개수다.
- `topStocks`는 시가총액 기준 상위 구성 종목이다.
- marketdata 조회 실패 시 backend는 502를 반환한다.
- 통합 검색은 이 API가 실패하면 `source=search_taxonomy_baseline` 산업/테마/시장 baseline으로 fallback한다.

#### 실패 응답

- 502 Bad Gateway: marketdata/pykrx sector classification 조회 실패

---

## 18) 테마 taxonomy 조회

### `GET /api/stocks/themes?query=&limit=`

Naver Finance 테마별 시세 taxonomy를 조회한다. backend는 공개 API 게이트웨이 역할을 하고,
실제 테마 목록은 `marketdata-python`이 Naver Finance 테마 표를 파싱해 제공한다.
통합 검색은 이 taxonomy를 캐시해서 대표 baseline 밖의 세부 테마명과 주도주를 함께 찾는다.

#### Query Parameters

- `query` (optional): 테마명 또는 주도주 검색어. 예: `전선`, `반도체 장비`, `전력설비`
- `limit` (optional): 반환 개수. 기본 80, 최대 500

#### 성공 응답 (200)

```json
{
  "asOf": "2026-05-03",
  "source": "naver_finance_theme",
  "totalCount": 260,
  "count": 1,
  "themes": [
    {
      "name": "전선",
      "type": "theme",
      "market": "테마",
      "rate": "+9.20%",
      "threeDayRate": "+7.40%",
      "risingCount": 7,
      "flatCount": 0,
      "fallingCount": 1,
      "leaders": ["KBI메탈", "대원전선"],
      "summary": "Naver Finance 테마 시세 기준입니다."
    }
  ]
}
```

#### 응답 정책

- `totalCount`는 Naver Finance 테마별 시세에서 파싱한 전체 테마 개수다.
- `count`는 필터와 limit 적용 후 실제 반환된 개수다.
- `leaders`는 Naver Finance 표의 주도주 컬럼이다.
- marketdata 조회 실패 시 backend는 502를 반환한다.
- 통합 검색은 이 API가 실패하면 `source=search_taxonomy_baseline` 테마 fallback baseline으로 동작한다.

#### 실패 응답

- 502 Bad Gateway: Naver Finance theme taxonomy 조회 실패

---

## 19) AI/RAG 준비형 채팅

### `GET /api/ai/status`

ai-service의 OpenAI-compatible LLM 설정 상태를 secret 값 없이 확인한다.
운영자는 이 응답으로 현재 `rag_llm` 호출이 가능한지, 아니면 규칙형 RAG fallback 상태인지 확인한다.

#### 성공 응답 (200)

```json
{
  "provider": "openai_compatible",
  "configured": false,
  "apiKeySet": false,
  "modelConfigured": false,
  "model": "",
  "baseUrl": "https://api.openai.com/v1",
  "fallbackMode": "rag_fallback_rule_based"
}
```

#### 응답 정책

- API key 값은 절대 반환하지 않는다.
- `configured=true`는 API key와 `LLM_MODEL`이 모두 설정된 상태를 뜻한다.
- `configured=false`이면 `/api/ai/chat`은 `mode=rag_fallback_rule_based`로 응답할 수 있다.

### `POST /api/ai/chat`

차트, 이벤트, 브리프, 용어 사전 컨텍스트를 받아 AI 분석 응답 형식으로 반환한다. `ai-service`는 요청에 포함된 검색/브리프/차트/이벤트/용어를 retrieval 문서로 정리하고, `LLM_API_KEY` 또는 `OPENAI_API_KEY`와 `LLM_MODEL`이 설정되어 있으면 OpenAI-compatible chat completions adapter를 호출한다. LLM 설정이 없거나 실패하면 규칙형 RAG fallback 응답을 반환한다.

#### 요청 예시

```json
{
  "question": "삼성전자 차트와 이벤트를 초보자 관점으로 설명해줘",
  "contextDate": "2026-04-30",
  "stockCode": "005930",
  "stockName": "삼성전자",
  "focus": "neutral",
  "events": [
    {
      "date": "2026-04-30",
      "type": "volume_spike",
      "severity": "medium",
      "title": "거래량 급증"
    }
  ],
  "terms": []
}
```

#### 성공 응답 (200)

```json
{
  "mode": "rag_llm | rag_fallback_rule_based",
  "answer": "기준일: 2026-04-30\n대상: 삼성전자(005930)...",
  "basisDate": "2026-04-30",
  "confidence": "medium",
  "sources": [
    { "title": "종목 차트 API", "type": "ohlcv", "url": "/api/stocks/005930/chart" }
  ],
  "retrieval": {
    "documents": [
      {
        "id": "event-1",
        "type": "volume_spike",
        "title": "거래량 급증",
        "basisDate": "2026-04-30"
      }
    ],
    "sourceCount": 1,
    "llm": {
      "enabled": true,
      "used": true,
      "provider": "openai_compatible",
      "model": "설정된 LLM_MODEL",
      "fallbackReason": ""
    }
  },
  "limitations": [
    "LLM 응답은 제공된 retrieval 근거 안에서 생성되도록 제한했습니다.",
    "투자 지시가 아니라 교육용 분석 보조입니다."
  ],
  "oppositeSignals": ["거래량 없는 상승"],
  "nextQuestions": ["이 이벤트가 거래량과 같이 나온 건 왜 중요해?"]
}
```

#### 응답 정책

- 반드시 기준일, 출처, 신뢰도, 한계, 반대 신호를 포함한다.
- `retrieval.documents`에는 답변 생성에 사용한 검색/브리프/차트/이벤트/용어 근거를 남긴다.
- `LLM_MODEL` 또는 API key가 없으면 `mode=rag_fallback_rule_based`로 동작한다.
- “지금 사라/팔아라”가 아니라 조건, 리스크, 대안 시나리오로 설명한다.
- 개인화 투자 조언이나 수익 보장을 하지 않는다.

---

## 20) 통합 검색

### `GET /api/search?query=&limit=`

첫 화면 검색창에서 기업명, 종목 코드, 산업, 테마, 시장 구분, 용어, 오늘 움직인 종목을 함께 검색한다.

#### Query Parameters

- `query` (required): 검색어. 예: `반도체`, `005930`, `삼성전자`, `PER`, `KOSDAQ`
- `limit` (optional): 반환 개수. 기본 8, 최대 20

#### 성공 응답 (200)

```json
[
  {
    "id": "theme-semiconductor",
    "type": "theme",
    "title": "반도체",
    "code": "THEME",
    "market": "테마",
    "rate": "+2.4%",
    "tags": ["AI 반도체", "장비", "소부장"],
    "summary": "AI 수요, 설비투자, 환율 변화를 함께 보는 대표 성장 테마입니다.",
    "source": "search_taxonomy_baseline",
    "stockCode": null,
    "stockName": null,
    "termId": null
  }
]
```

#### 응답 정책

- `source=latest_summary`: 최신 저장 브리프의 상승/하락/언급 TOP 종목
- `source=learning_terms`: 내부 초보자 용어 사전
- `source=krx_stock_universe`: pykrx KOSPI/KOSDAQ 종목 universe 기반 검색 결과
- `source=krx_sector_classification`: pykrx KRX 업종 분류 taxonomy 기반 산업 검색 결과
- `source=naver_theme_taxonomy`: Naver Finance 테마별 시세 기반 테마 검색 결과
- `source=stock_universe_baseline`: 대표 KOSPI/KOSDAQ 종목 fallback baseline
- `source=search_taxonomy_baseline`: 산업/테마/시장 구분 fallback baseline

#### 현재 검색 보장 범위

- 대표 기업/종목: 삼성전자, SK하이닉스, 현대차, NAVER(네이버), 카카오, LG에너지솔루션, 에코프로비엠, 삼성바이오로직스, 셀트리온, 한화에어로스페이스 등
- KRX universe 종목: marketdata/pykrx 연결 가능 시 KOSPI/KOSDAQ 전체 상장 종목명/종목코드
- KRX 업종 taxonomy: marketdata/pykrx 연결 가능 시 KOSPI/KOSDAQ 업종명, 시장, 시가총액 상위 구성 종목명/코드
- Naver theme taxonomy: marketdata/Naver Finance 연결 가능 시 테마별 시세 전체 테마명과 주도주
- 주요 테마: 반도체, 2차전지, AI, 바이오, 방산, 로봇, 원전, 엔터, 조선, 화장품
- 주요 산업: 자동차, 증권/금융, 인터넷/플랫폼, 철강/소재, 헬스케어, 게임/콘텐츠
- 시장 구분: KOSPI, KOSDAQ

---

## DTO 스키마 (`SummaryDto`)

- `date: LocalDate`
- `topGainer: String | null`
- `topLoser: String | null`
- `rawTopGainer: String | null`
- `rawTopLoser: String | null`
- `filteredTopGainer: String | null`
- `filteredTopLoser: String | null`
- `rankingWarning: String | null`
- `anomalies: AnomalyDto[]`
- `mostMentioned: String | null`
- `kospiPick: String | null`
- `kosdaqPick: String | null`
- `rawNotes: String | null`
- `createdAt: Instant`
- `updatedAt: Instant`
- `archivedAt: Instant | null`
- `verification: SummaryVerificationLinks`
- `leaderExplanations: LeaderExplanations`
  - `topGainer.level|topLoser.level: info | caution | confirmed`
  - `topGainer.summary|topLoser.summary: String` (초보자용 한 줄 설명)
  - `topGainer.evidenceLinks|topLoser.evidenceLinks: String[]`
- `content: String` (UI 호환 필드)
- `generatedAt: Instant` (UI 호환 필드, 현재 `updatedAt`와 동일)

`SummaryVerificationLinks`:

- `date: LocalDate` (검증 대상 날짜)
- `krxDataPortal: String` (공식 KRX 데이터 포털)
- `krxMarketOverview: String` (공식 KRX 마켓 오버뷰)
- `pykrxRepo: String` (데이터 산출 방식 참고용)
- `primaryKrxArtifact: String` (예: `/api/summaries/{date}/verification/krx`)
- `topGainerSearch|topLoserSearch|mostMentionedSearch|kospiPickSearch|kosdaqPickSearch: String`
  (레거시 필드; 현재는 빈 문자열)
- `topGainerDateSearch|topLoserDateSearch|mostMentionedDateSearch|kospiPickDateSearch|kosdaqPickDateSearch: String`
  (직접 종목 링크: `https://finance.naver.com/item/sise_day.naver?code=...`)
- `verificationLimitations: String` (공식 링크의 한계/폴백 근거)

검증 가이드:

1. 먼저 `primaryKrxArtifact`와 `krxDataPortal`(공식 KRX)로 당일 근거를 확인한다.
2. 각 필드는 `*DateSearch`(직접 종목 일봉 링크)에서 종목 코드 기준으로 교차 확인한다.
3. KRX에서 종목+날짜 단일 딥링크가 안정적으로 제공되지 않아, 종목 단위 직접 링크는 코드 기반 Naver 페이지를 사용한다.
