# API 명세서 (kr-stock-daily-brief)

최종 업데이트: 2026-05-03
기준 코드:
- `backend/src/main/java/com/krbrief/summaries/SummaryController.java`
- `backend/src/main/java/com/krbrief/learning/LearningController.java`

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
