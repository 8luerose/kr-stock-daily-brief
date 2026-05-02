# ERD (kr-stock-daily-brief)

최종 업데이트: 2026-05-03

---

## ERD 다이어그램 (Mermaid)

```mermaid
erDiagram
    DAILY_SUMMARIES {
        DATE summary_date PK "브리프 기준일"
        VARCHAR effective_date "실제 KRX 계산 영업일 YYYYMMDD"
        VARCHAR top_gainer "최종 최대 상승 종목"
        VARCHAR top_loser "최종 최대 하락 종목"
        VARCHAR filtered_top_gainer "이상치 검토 후 상승 1위"
        VARCHAR filtered_top_loser "이상치 검토 후 하락 1위"
        VARCHAR most_mentioned "종목토론방 최다 언급 종목"
        VARCHAR kospi_pick "KOSPI 대표 픽"
        VARCHAR kosdaq_pick "KOSDAQ 대표 픽"
        TEXT top_gainers_json "상승 TOP3 JSON"
        TEXT top_losers_json "하락 TOP3 JSON"
        TEXT most_mentioned_top_json "언급 TOP3 JSON"
        TEXT raw_notes "출처/계산/검증 메모"
        TEXT ranking_warning "랭킹 경고"
        TEXT anomalies_text "이상치 후보"
        TIMESTAMP created_at "생성 시각 UTC"
        TIMESTAMP updated_at "수정 시각 UTC"
        TIMESTAMP archived_at "보관 시각 UTC"
        TIMESTAMP discord_posted_at "Discord 포스팅 시각"
        VARCHAR discord_message_id "Discord 메시지 ID"
        VARCHAR discord_channel_id "Discord 채널 ID"
        VARCHAR discord_thread_id "Discord 스레드 ID"
    }
```

---

## 외부/비영속 구성요소

```mermaid
flowchart LR
    UI[React Frontend] --> Backend[Spring Backend]
    Backend --> MySQL[(MySQL daily_summaries)]
    Backend --> Marketdata[FastAPI marketdata]
    Backend --> AI[FastAPI ai-service]
    AI --> Qdrant[(Qdrant - RAG 확장용)]
    Marketdata --> KRX[pykrx/KRX]
    Marketdata --> Naver[Naver Finance Board]
```

---

## 설계 메모

- 핵심 영속 테이블은 현재 `daily_summaries` 1개다.
- 종목 차트와 이벤트는 저장하지 않고 요청 시 pykrx OHLCV 기반으로 조회/계산한다.
- 포트폴리오 샌드박스는 실계좌 연동 없이 브라우저 `localStorage`에만 저장한다.
- Qdrant는 RAG 인덱싱 확장용으로 준비되어 있으며, 현재 MySQL ERD와 직접 FK 관계는 없다.
- 추후 확장 후보:
  - `stock_events` (이벤트 캐시/근거 링크 저장)
  - `watchlist_items` (로그인 도입 시 관심 종목 서버 저장)
  - `ai_chat_logs` (비식별 AI 품질 개선 로그)
