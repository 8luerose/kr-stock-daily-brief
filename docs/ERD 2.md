# ERD (kr-stock-daily-brief)

최종 업데이트: 2026-02-16

---

## ERD 다이어그램 (Mermaid)

```mermaid
erDiagram
    DAILY_SUMMARIES {
        DATE summary_date PK "요약 기준일"
        VARCHAR top_gainer "최대 상승 종목"
        VARCHAR top_loser "최대 하락 종목"
        VARCHAR most_mentioned "가장 많이 언급(현재 v1은 거래량 대체)"
        VARCHAR kospi_pick "KOSPI 픽"
        VARCHAR kosdaq_pick "KOSDAQ 픽"
        TEXT raw_notes "출처/규칙/에러 메모"
        TIMESTAMP created_at "생성 시각(UTC)"
        TIMESTAMP updated_at "수정 시각(UTC)"
    }
```

---

## 설계 메모

- 현재는 단일 핵심 테이블(`daily_summaries`)만 사용.
- 1일 1행 구조 (`summary_date` PK)로 누적 저장.
- 생성 API는 upsert 동작이라 동일 날짜 재생성 시 `updated_at`만 갱신 가능.
- 추후 확장 예정(선택):
  - `data_sources` (원천 데이터 추적)
  - `generation_jobs` (배치 이력/에러 로그)
  - `mentions_raw` (most mentioned 고도화용 원천)
