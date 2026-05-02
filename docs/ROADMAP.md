# 제품 로드맵

작성일: 2026-05-03

현재 방향은 `한국 주식 일간 브리프 운영 도구`를 버리지 않고, 이를 `주식 초보자를 위한 한국 주식 AI 리서치/학습 보조 앱`으로 확장하는 것이다.

## Phase 0. 신뢰성 마감

- [ ] 휴장일/비거래일 정책 확정
- [ ] 백필 대량 생성 안정화
- [ ] pykrx OHLCV 전일대비 계산 회귀 테스트 유지
- [ ] KOSPI/KOSDAQ 상승/하락 TOP3 첫 항목과 1위 필드 일치 검증
- [ ] 기존 API와 `docs/API_SPEC.md` 동기화

## Phase 1. 초보자용 제품 전환

- [x] 주요 주식 용어 사전 API 추가
- [x] 브리프 화면에 초보자 용어 사전 패널 추가
- [x] 브리프 안에 `AI 학습 도우미` 연결 지점 추가
- [x] 첫 화면을 달력 중심에서 `오늘의 시장 브리프` 중심으로 재배치
- [x] 운영 버튼(생성/백필/보관)을 관리자 영역 또는 접힌 패널로 분리
- [ ] 어려운 필드명을 초보자 언어로 계속 정리
- [x] TOP3 종목 카드 클릭 후 종목 상세 화면으로 연결

## Phase 2. 종목 상세 + 차트 이벤트

- [x] 종목별 OHLCV 조회 API 설계/구현
  - 예: `GET /api/stocks/{code}/chart?range=1M|3M|6M|1Y|3Y&interval=daily|weekly|monthly`
- [x] 급등/급락/거래량 급증 이벤트 탐지 API 설계/구현
  - 예: `GET /api/stocks/{code}/events?from=YYYY-MM-DD&to=YYYY-MM-DD`
- [x] `lightweight-charts` 등 검증된 차트 라이브러리 도입
- [x] 캔들차트, 20일 이동평균선, 거래량, 이벤트 마커 구현
- [x] 공격형/중립형/보수형 시나리오별 조건형 매수/분할매수/관망/매도/손절 UX 구현
- [ ] 차트 마커 호버 상세 툴팁 고도화
- [ ] 이벤트별 공시/뉴스/언급량 근거 링크 저장 고도화

## Phase 3. AI/RAG 기능

- [x] AI 응답 형식의 선행 연결점 추가: `POST /api/learning/assistant`
- [ ] `ai-service` FastAPI 추가 검토
- [ ] vector store(Qdrant 또는 pgvector) Docker Compose 연결
- [ ] RAG 대상 정의
  - 저장된 daily summaries
  - 종목 이벤트
  - OHLCV 기반 지표
  - 네이버 종목토론방 언급량
  - DART 공시
  - 앱 내부 용어 사전
- [ ] `/api/ai/chat` 또는 `/api/research/ask` 구현
- [ ] Risk Reviewer 단계로 매수/매도 단정, 과장, 출처 없는 표현 제거

## Phase 4. 포트폴리오 샌드박스

- [ ] 관심 종목 저장
- [ ] 가상 비중 입력
- [ ] 섹터 집중도, 변동성, 최근 이벤트 요약
- [ ] 초보자용 위험 설명과 다음 확인 체크리스트 제공

## Phase 5. 배포/운영

- [x] Docker Compose 전체 실행 보장
- [ ] `.env.example` 갱신
- [ ] healthcheck 추가
- [ ] README/PRD/API_SPEC 최신화
- [ ] 주요 UX 브라우저 검증 자동화

## 원칙

- "지금 사라/팔아라" 형태의 투자 지시는 만들지 않는다.
- AI 답변은 출처, 신뢰도, 한계, 데이터 기준일을 함께 보여준다.
- 모르면 모른다고 말하고, 근거 없는 확정 표현을 만들지 않는다.
- 초보자가 앱을 열었을 때 운영 도구가 아니라 시장 이해 도구로 느껴져야 한다.
