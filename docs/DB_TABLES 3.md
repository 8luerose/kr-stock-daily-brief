# DB 테이블 명세 (MySQL)

최종 업데이트: 2026-05-03
기준 마이그레이션:
- `V1__init.sql`
- `V2__archive_and_backfill_support.sql`
- `V3__anomaly_aware_ranking_fields.sql`
- `V4__effective_date_and_top_lists.sql`
- `V5__discord_posting_fields.sql`

---

## 1) daily_summaries

일별 시장 브리프와 검증/랭킹/포스팅 메타데이터를 저장한다. 종목 차트, 이벤트, AI 응답, 포트폴리오 샌드박스는 현재 저장 테이블 없이 외부 API/프론트 로컬 상태로 동작한다.

### 현재 DDL

```sql
CREATE TABLE daily_summaries (
  summary_date DATE NOT NULL,
  top_gainer VARCHAR(255) NULL,
  top_loser VARCHAR(255) NULL,
  filtered_top_gainer VARCHAR(255) NULL,
  filtered_top_loser VARCHAR(255) NULL,
  most_mentioned VARCHAR(255) NULL,
  kospi_pick VARCHAR(255) NULL,
  kosdaq_pick VARCHAR(255) NULL,
  raw_notes TEXT NULL,
  ranking_warning TEXT NULL,
  anomalies_text TEXT NULL,
  effective_date VARCHAR(8) NULL,
  top_gainers_json TEXT NULL,
  top_losers_json TEXT NULL,
  most_mentioned_top_json TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived_at TIMESTAMP(6) NULL,
  discord_posted_at TIMESTAMP NULL,
  discord_message_id VARCHAR(64) NULL,
  discord_channel_id VARCHAR(32) NULL,
  discord_thread_id VARCHAR(32) NULL,
  PRIMARY KEY (summary_date)
);
```

### 컬럼 설명

- `summary_date` (DATE, PK): 사용자가 조회하는 브리프 기준일
- `effective_date` (VARCHAR 8): 실제 KRX 계산 영업일 (`YYYYMMDD`)
- `top_gainer`, `top_loser`: 최종 최대 상승/하락 종목명
- `filtered_top_gainer`, `filtered_top_loser`: 이상치 검토 후 최종 랭킹명
- `most_mentioned`: 네이버 종목토론방 기반 최다 언급 종목명
- `kospi_pick`, `kosdaq_pick`: KOSPI/KOSDAQ 대표 상승 픽
- `top_gainers_json`, `top_losers_json`, `most_mentioned_top_json`: TOP3 리스트 JSON
- `raw_notes`: 데이터 출처, 계산일, 검증 결과, 예외 메모
- `ranking_warning`: 랭킹 신뢰도 경고
- `anomalies_text`: 이상치 후보 JSON/text
- `archived_at`: soft delete 시각
- `discord_*`: Discord 포스팅 추적용 메타데이터
- `created_at`, `updated_at`: 생성/수정 시각

### 인덱스/키

- `PRIMARY KEY(summary_date)`

---

## 저장하지 않는 데이터

- 종목 OHLCV: `marketdata-python`에서 pykrx 기반으로 조회
- 종목 이벤트: OHLCV 기반으로 요청 시 계산
- AI 응답: `ai-service`에서 요청 시 생성
- 포트폴리오 샌드박스: 프론트 `localStorage` 기반 MVP
- Qdrant: RAG 확장용 벡터 저장소로 Docker Compose에 포함, 현재 앱 DB 스키마와 별도

---

## 문서 업데이트 규칙

DB 변경 시 아래를 함께 업데이트한다.

1. Flyway migration (`backend/src/main/resources/db/migration/*.sql`)
2. 이 문서 (`docs/DB_TABLES.md`)
3. ERD (`docs/ERD.md`)
4. API 응답 필드 영향이 있으면 `docs/API_SPEC.md`
