# API 명세서 (kr-stock-daily-brief)

최종 업데이트: 2026-02-16
기준 코드: `backend/src/main/java/com/krbrief/summaries/SummaryController.java`

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

## 7) 오늘(서울 기준) 생성/갱신

### `POST /api/summaries/generate/today`

`Asia/Seoul` 기준 오늘 날짜로 요약 생성(upsert).

#### 성공 응답 (200)

생성된 `SummaryDto` 반환.

---

## DTO 스키마 (`SummaryDto`)

- `date: LocalDate`
- `topGainer: String | null`
- `topLoser: String | null`
- `mostMentioned: String | null`
- `kospiPick: String | null`
- `kosdaqPick: String | null`
- `rawNotes: String | null`
- `createdAt: Instant`
- `updatedAt: Instant`
- `content: String` (UI 호환 필드)
- `generatedAt: Instant` (UI 호환 필드, 현재 `updatedAt`와 동일)
