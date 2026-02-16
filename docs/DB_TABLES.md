# DB 테이블 명세 (MySQL)

최종 업데이트: 2026-02-16
기준 마이그레이션: `backend/src/main/resources/db/migration/V1__init.sql`

---

## 1) daily_summaries

일별 요약 결과 저장 테이블.

### DDL

```sql
CREATE TABLE IF NOT EXISTS daily_summaries (
  summary_date DATE NOT NULL,
  top_gainer VARCHAR(255) NULL,
  top_loser VARCHAR(255) NULL,
  most_mentioned VARCHAR(255) NULL,
  kospi_pick VARCHAR(255) NULL,
  kosdaq_pick VARCHAR(255) NULL,
  raw_notes TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (summary_date)
);
```

### 컬럼 설명

- `summary_date` (DATE, PK): 요약 기준일
- `top_gainer` (VARCHAR 255): 최대 상승 종목명
- `top_loser` (VARCHAR 255): 최대 하락 종목명
- `most_mentioned` (VARCHAR 255): 가장 많이 언급된 종목명 (v1은 거래량 기반 대체)
- `kospi_pick` (VARCHAR 255): KOSPI 픽
- `kosdaq_pick` (VARCHAR 255): KOSDAQ 픽
- `raw_notes` (TEXT): 출처, 규칙, 예외/실패 정보
- `created_at` (TIMESTAMP(6)): 최초 생성 시각
- `updated_at` (TIMESTAMP(6)): 마지막 갱신 시각

### 인덱스/키

- `PRIMARY KEY(summary_date)`

---

## 데이터 누적 정책

- 삭제 없이 날짜 단위로 누적 저장.
- 같은 날짜 재생성 시 upsert로 갱신.
- 내부용 기준으로 용량은 매우 작음(일반적으로 텍스트 수KB/일 수준).

---

## 문서 업데이트 규칙

DB 변경 시 아래를 한 번에 업데이트:

1) Flyway migration (`db/migration/*.sql`)
2) 이 문서(`docs/DB_TABLES.md`)
3) ERD(`docs/ERD.md`)
4) API 명세(`docs/API_SPEC.md`) - 응답 필드 영향 있을 때
