# PRD — 한국 주식 시장 일일 요약 프로그램 (kr-stock-daily-brief)

최종 업데이트: 2026-02-16  
문서 소유: 개발 스레드(한국 주식 시장 요약 프로그램 개발)

---

## 1. 제품 개요

### 1.1 제품명
- **KR Stock Daily Brief**

### 1.2 한 줄 설명
- 한국 주식 시장 데이터를 바탕으로 매일 요약을 생성하고, 달력 UI에서 날짜별로 조회/누적 관리하는 내부용 웹앱.

### 1.3 목표
- 평일 장 마감 이후, 요약이 자동 생성되어 달력에 누적 표시되도록 한다.
- 수동 생성/조회도 언제든 가능하도록 한다.
- Docker 기반으로 어디서든 동일하게 실행되도록 한다.

---

## 2. 문제 정의

현재 사용자는 다음 문제를 겪는다:
- 매일 시장 핵심 포인트(상승/하락/관심 종목)를 수동으로 확인해야 함
- 과거 날짜 요약을 한 곳에서 누적/조회하기 어려움
- 개발/운영 환경마다 실행 방식이 달라 관리 부담이 큼

해결 방향:
- 자동 생성 + 달력 기반 조회 + 표준화된 Docker 실행 환경 제공

---

## 3. 대상 사용자 / 사용 맥락

### 3.1 대상
- 내부 사용자(개인/소규모 팀)

### 3.2 사용 맥락
- 장 마감 후 요약 확인
- 특정 날짜(과거 포함) 기록 비교
- 운영 중 오류 발생 시 스레드 알림으로 상태 확인

---

## 4. 범위

### 4.1 In Scope (A/MVP)
- 날짜별 요약 생성/저장/조회
- 달력 UI + 날짜 선택 상세 보기
- 수동 생성(특정 날짜, 오늘)
- 자동 생성(평일 15:40 KST)
- MySQL 영구 저장(누적)
- PUBLIC_KEY 쿼리 게이트(옵션)
- Docker Compose + Makefile
- API/ERD/DB 문서화

### 4.2 Out of Scope (B/차기)
- 고정밀 “most mentioned” (뉴스/커뮤니티 실집계)
- 정식 투자 시그널/매매 추천 엔진
- 사용자 계정/권한 시스템
- 모바일 앱 네이티브 버전

---

## 5. 핵심 기능 요구사항

### FR-1. 요약 생성
- 사용자는 특정 날짜 요약을 생성할 수 있어야 한다.
- 시스템은 생성 결과를 DB에 upsert해야 한다.
- 오늘 날짜 생성 API를 제공해야 한다.

### FR-2. 요약 조회
- 사용자는 기간 조회(from~to)로 월 단위 요약 목록을 조회할 수 있어야 한다.
- 사용자는 날짜별 단건 조회를 할 수 있어야 한다.

### FR-3. 달력 UI
- 월 달력에서 날짜를 선택하면 해당 날짜 상세 요약을 보여줘야 한다.
- 데이터가 있는 날짜는 dot 표시로 시각화해야 한다.
- 생성 직후 dot 표시가 즉시 갱신되어야 한다.

### FR-4. 자동 생성 스케줄
- 평일 15:40 Asia/Seoul 기준 자동 생성이 수행되어야 한다.
- 생성 성공/실패 상태를 리포트할 수 있어야 한다.

### FR-5. 접근 게이트(옵션)
- `PUBLIC_KEY`가 설정되면 API/UI 접근에 `k` 파라미터 검증을 적용해야 한다.

### FR-6. 데이터 누적
- 삭제 없이 날짜 단위 누적 저장되어야 한다.
- 동일 날짜 재생성 시 업데이트로 처리한다.

---

## 6. 비기능 요구사항

### NFR-1. 실행 환경
- Docker Compose로 backend/frontend/mysql 일괄 기동 가능해야 한다.

### NFR-2. 안정성
- backend health endpoint가 `UP` 상태를 제공해야 한다.
- 외부 데이터 소스 실패 시 fallback/notes로 원인 기록이 가능해야 한다.

### NFR-3. 성능
- 월 조회 API는 내부용 기준에서 즉시 응답(수백 ms~수초) 수준을 목표로 한다.

### NFR-4. 유지보수성
- API/ERD/DB 명세 문서를 코드 변경과 함께 갱신한다.

---

## 7. 데이터 소스 정책 (현재)

### 7.1 기본 소스
- `MARKETDATA_PROVIDER=naver` (v1)
- Naver Finance HTML 페이지 크롤링 기반(best-effort)

### 7.2 v1 규칙
- topGainer/topLoser: 상승/하락 상위 페이지 기반
- mostMentioned: 상위 리스트 내 거래량 최대 종목(대체 규칙)
- KOSPI/KOSDAQ pick: 각 시장 상승 리스트 내 거래량 최대

### 7.3 리스크
- HTML 구조 변경 시 파싱 실패 가능
- 과거 특정 날짜를 정밀 재현하는 데 한계

---

## 8. API 요약

- `GET /api/summaries?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/summaries/{date}`
- `POST /api/summaries/{date}/generate`
- `POST /api/summaries/generate/today`

(상세는 `docs/API_SPEC.md` 참조)

---

## 9. DB 요약

핵심 테이블:
- `daily_summaries` (PK: `summary_date`)

주요 컬럼:
- `top_gainer`, `top_loser`, `most_mentioned`, `kospi_pick`, `kosdaq_pick`, `raw_notes`, `created_at`, `updated_at`

(상세는 `docs/DB_TABLES.md`, ERD는 `docs/ERD.md` 참조)

---

## 10. 운영/배포 정책

- 기본 실행: `make up`
- 점검: `make health`, `make generate-today`, `make check-month MONTH=YYYY-MM`
- 인터넷 공개 시 reverse proxy/TLS 앞단 권장

---

## 11. 성공 지표 (MVP)

- 평일 자동 생성 성공률 ≥ 95%
- 생성 API 성공 응답률 ≥ 99%(내부망 기준)
- 월 조회 시 달력 dot 표시 정확도 ≥ 99%
- 장애 발생 시 스레드 리포트로 원인 식별 가능

---

## 12. 향후 로드맵 (B)

1) most mentioned 고도화(뉴스/커뮤니티 실제 언급량)
2) 전일 대비 정확도 강화(히스토리 소스 정밀화)
3) 리트라이/회복 전략 강화
4) 데이터 소스 다중화(소스 장애 시 자동 전환)

---

## 13. 문서 갱신 규칙

API/DB/요구사항 변경 시 반드시 함께 갱신:
- `docs/PRD.md`
- `docs/API_SPEC.md`
- `docs/ERD.md`
- `docs/DB_TABLES.md`
