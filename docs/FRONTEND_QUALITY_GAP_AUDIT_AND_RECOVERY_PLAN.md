# Frontend Quality Gap Audit and Recovery Plan

작성일: 2026-05-04

상태: 초기 품질 갭 감사 문서다. 2026-05-04 최신 완료 루프에서 주요 P0/P1 항목은
`docs/FRONTEND_LOOP_STATE.md`와 `docs/FRONTEND_QUALITY_LOOP_REPORT.md` 기준으로
완성 단계까지 복구했다. 이 문서는 왜 복구가 필요했는지 남기는 이력 자료로 유지한다.

기준 문서:

- `docs/GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md`
- `docs/FRONTEND_QUALITY_LOOP_REPORT.md`
- 실제 코드, 로컬 브라우저, API, 테스트 결과

## 1. 요청 요약

3시간 동안 다른 AI가 코딩한 결과가 기존 목표 문서의 기준을 충족했는지 확인하고, 기존 기능 손상 여부와 프론트 품질 문제를 사용자, 개발자, 벤처캐피탈 투자자 관점에서 엄격하게 점검한다.

추가 기준:

- 유지보수가 쉬워야 한다.
- 재사용성이 좋아야 한다.
- 가독성이 좋아야 한다.
- 프론트, 백엔드, DevOps 모두 출시 가능한 웹 플랫폼 수준으로 정리되어야 한다.

## 2. 핵심 결론

현재 결과는 완성이 아니라 `부분 반영 후 너무 일찍 완료 보고한 상태`다.

`docs/FRONTEND_QUALITY_LOOP_REPORT.md`에는 사용자, 개발자, VC 관점 모두 `496/500`으로 적혀 있지만, 실제 코드와 브라우저 확인 결과는 그 점수를 뒷받침하지 못한다.

엄격한 재평가 점수:

| 관점 | 점수 | 판정 |
|---|---:|---|
| 사용자 | 285/500 | 목적은 조금 보이나 여전히 복잡하고 기존 기능이 사라진 느낌 |
| 개발자 - 프론트 | 300/500 | 기능은 붙었지만 구조가 비대하고 UX 완성도 낮음 |
| 개발자 - 백엔드 | 335/500 | API는 늘었지만 검색, AI, RAG가 얕음 |
| 개발자 - DevOps | 360/500 | Docker health/API는 통과하나 로컬 프론트 빌드 재현성 부족 |
| VC/투자자 | 245/500 | AI 플랫폼처럼 보이기엔 AI 실체와 확장성이 약함 |

현재 상태는 495점 이상이 아니므로, 목표 문서의 하네스 루프에 따라 다시 Reference Research, Re-architecture Plan, Implementation, Verification, Re-score 단계를 반복해야 한다.

## 3. 직접 확인한 검증 결과

통과:

- `make health`
- `./gradlew test`
- `./scripts/test_all_apis.sh`
- `./scripts/verify_investment_language.sh`
- Docker Compose 서비스 health

실패 또는 주의:

- `frontend`에서 `npm run build` 실행 시 `vite: command not found`
- 현재 workspace에는 frontend dev dependency가 설치되어 있지 않아 로컬 빌드 재현성이 부족함
- `GET /api/search?query=삼성전자` 결과가 빈 배열
- `GET /api/search?query=반도체` 결과는 하드코딩된 seed catalog 1개
- `ai-service`는 외부 LLM 호출 없이 규칙형 응답
- 현재 git status에 중복 문서가 untracked 상태로 남아 있음

## 4. P0 문제점

### P0-1. 완료 보고서의 496/500 평가는 실제와 맞지 않음

문제 위치:

- `docs/FRONTEND_QUALITY_LOOP_REPORT.md`

문제:

- 문서에는 사용자, 개발자, VC 모두 496/500이라고 적혀 있다.
- 실제 구현은 검색, AI, 차트, 기존 기능 보존, 첫 화면 품질에서 목표 기준을 충족하지 못한다.
- 495점 미만이면 다시 루프를 돌려야 하는데, 너무 일찍 종료했다.

해결법:

- 기존 보고서를 완료 보고서가 아니라 `실패 감사 보고서`로 재분류한다.
- 점수를 실제 기준으로 다시 매긴다.
- 각 항목마다 근거를 남긴다.
- 브라우저 스크린샷, API 결과, 테스트 결과, 실패 케이스를 함께 기록한다.

### P0-2. 기존 기능이 사라진 것처럼 보임

문제 위치:

- `frontend/src/ui/App.jsx`
- admin 접근 차단 로직
- admin nav 숨김 로직
- 생성, 백필, 보관, 달력 UI

문제:

- 기존 달력 중심 운영 UI가 일반 사용자 화면에서 사실상 사라졌다.
- 생성, 백필, 보관 기능은 adminKey가 없으면 발견하기 어렵다.
- 운영자는 기존 기능이 삭제된 것으로 느낄 수 있다.

해결법:

- 일반 사용자용 `브리프 히스토리`를 복구한다.
- 관리자용 `운영 모드`는 별도 진입점으로 둔다.
- adminKey가 없을 때도 "관리자 키가 필요합니다" 안내 화면을 제공한다.
- 생성, 백필, 보관 기능은 관리자 영역에 두되 기존 기능 접근 경로는 유지한다.

### P0-3. 검색 기능이 핵심 요구를 충족하지 못함

문제 위치:

- `backend/src/main/java/com/krbrief/search/SearchService.java`
- `frontend/src/ui/App.jsx`

문제:

- 목표 문서에는 산업, 테마, 기업, 종목 검색이 핵심 기능으로 정의되어 있다.
- 현재 검색은 최신 요약 TOP 종목, 용어, 하드코딩 seed catalog 중심이다.
- `삼성전자` 같은 대표 종목이 검색되지 않는다.
- `반도체` 검색 결과는 실제 산업 데이터가 아니라 seed catalog다.
- 테마 검색 결과를 눌러도 테마 상세 페이지나 AI 분석 결과로 자연스럽게 연결되지 않는다.

해결법:

- 전체 KOSPI/KOSDAQ 종목명, 종목코드, 시장 구분 검색 인덱스를 구축한다.
- 산업/테마 taxonomy 테이블 또는 캐시를 추가한다.
- 검색 결과 타입을 명확히 분리한다.
  - stock
  - company
  - industry
  - theme
  - market
  - term
- 검색 결과 클릭 시 실제 화면 전환을 보장한다.
  - 종목: 종목 상세/차트
  - 산업/테마: 산업 상세/관련 종목/AI 분석
  - 용어: 배우기 상세
- 검색이 실패하면 "데이터 없음"이 아니라 대체 행동을 제공한다.
  - "전체 종목 데이터가 아직 연결되지 않았습니다"
  - "오늘 움직인 종목에서 먼저 찾아볼까요?"

### P0-4. AI 기능이 실제 AI/RAG/Agentic 수준이 아님

문제 위치:

- `ai-service/app/main.py`
- `backend/src/main/java/com/krbrief/ai/AiChatClient.java`
- `frontend/src/ui/App.jsx`

문제:

- 현재 ai-service는 `rag_ready_rule_based` 모드다.
- 외부 LLM 호출이 없다.
- vector store가 떠 있어도 실제 RAG 검색과 답변 생성에 제대로 사용된다고 보기 어렵다.
- VC 관점에서는 "AI가 어디 있나"보다 "이게 진짜 AI인가"가 더 큰 문제다.

해결법:

- ai-service에 실제 LLM adapter를 추가한다.
- RAG 검색 계층을 구현한다.
  - daily_summaries
  - stock_events
  - OHLCV/chart signals
  - learning terms
  - stock universe
  - DART/news 후보
- 답변 구조를 고정한다.
  - 한 줄 결론
  - 근거
  - 반대 신호
  - 리스크
  - 출처
  - 신뢰도
  - 데이터 기준일
  - 한계
- 규칙형 응답은 fallback으로만 사용한다.
- AI 응답마다 retrieval log, source list, confidence, limitation을 저장한다.

## 5. P1 문제점

### P1-1. 차트가 메인이지만 아직 설득력이 약함

문제 위치:

- `frontend/src/ui/StockPriceChart.jsx`

문제:

- 차트는 `lightweight-charts`로 구현되어 있다.
- 그러나 매수/매도 검토 라인은 현재가 기준 단순 비율이다.
  - 매도 검토: 현재가 +5%
  - 분할매수 검토: 현재가 -3%
- 이벤트 마커 텍스트가 비어 있다.
- hover tooltip은 OHLCV만 보여주고 이벤트 원인, AI 설명, 근거 링크를 보여주지 않는다.

해결법:

- backend 또는 marketdata에서 판단 구간 API를 만든다.
  - `GET /api/stocks/{code}/trade-zones`
- 구간 데이터에는 아래 필드를 포함한다.
  - type
  - priceRange
  - condition
  - evidence
  - oppositeSignal
  - confidence
  - basisDate
  - beginnerExplanation
- 차트 마커 hover 시 아래 정보를 보여준다.
  - 이벤트 제목
  - 왜 올랐는지/내렸는지
  - 거래량 변화
  - 관련 뉴스/공시/토론방 근거
  - AI 해석
  - 신뢰도
- 모바일에서 차트 조작이 답답하지 않도록 height, gesture, tooltip 위치를 별도로 최적화한다.

### P1-2. 버튼이 여전히 많고 Toss스럽지 않음

문제 위치:

- `frontend/src/ui/App.jsx`
- `frontend/src/ui/styles.css`

문제:

- 상단에 네비게이션 4개, 최신 요약, 다크 모드가 노출된다.
- 본문에는 종목 버튼, 용어 버튼, 외부 링크, 검증 상세, 수집 노트 버튼이 계속 노출된다.
- 목표 문서의 "전면 노출 버튼은 1~3개" 기준에 미달한다.
- 사용자는 "검색하거나, 차트를 보거나, AI에게 물어보면 된다"를 즉시 이해하기 어렵다.

해결법:

- 첫 화면 primary action은 3개만 남긴다.
  - 검색
  - AI에게 묻기
  - 차트 보기
- 최신 요약, 다크 모드, 외부 링크, 검증 상세는 overflow menu 또는 접힌 패널로 이동한다.
- 외부 링크는 카드마다 반복하지 않고 `더보기` 또는 `근거 보기`로 통합한다.
- 모바일 앱처럼 bottom nav 또는 compact segmented nav를 사용한다.
- 페이지별 핵심 메시지를 하나로 줄인다.

### P1-3. 오늘 브리프가 없을 때 첫 화면이 비어 보임

문제:

- 오늘 날짜에 브리프가 없으면 "브리프가 아직 없습니다"가 먼저 보인다.
- 목표 문서에는 "차트가 비어 보이면 실패"라고 되어 있다.

해결법:

- 오늘 브리프가 없으면 최신 영업일 브리프를 자동 표시한다.
- 문구는 이렇게 바꾼다.
  - "오늘 브리프는 아직 생성 전이라 최신 영업일 데이터를 보여드려요."
- 최신 차트와 AI 설명은 항상 보이게 한다.
- 빈 상태에서도 사용자는 검색, AI 질문, 최신 브리프 보기 중 하나를 바로 할 수 있어야 한다.

## 6. P2 문제점

### P2-1. 배우기 탭은 개선됐지만 데이터 구조가 아직 얕음

문제 위치:

- `backend/src/main/java/com/krbrief/learning/LearningTermDto.java`
- `backend/src/main/java/com/krbrief/learning/LearningTermCatalog.java`
- `frontend/src/ui/App.jsx`

문제:

- 용어 수는 늘었지만 각 항목이 실제 학습 콘텐츠로 충분히 깊지 않다.
- 시나리오 일부는 프론트 함수에서 임시 생성된다.
- 목표 문서가 요구한 아래 구조가 데이터로 완전히 보장되지 않는다.
  - 첫 줄 핵심 요약
  - 최소 3줄 이상 설명
  - 왜 중요한가
  - 차트에서 언제 확인하는가
  - 초보자가 자주 하는 오해
  - 실제 시나리오
  - 관련 질문

해결법:

- glossary schema를 확장한다.
- 각 용어 데이터를 아래처럼 만든다.
  - `coreSummary`
  - `longExplanation`
  - `whyItMatters`
  - `chartUsage`
  - `commonMisunderstanding`
  - `scenario`
  - `relatedQuestions`
- 프론트에서 임시 생성하지 않고 backend 데이터 기반으로 표시한다.
- "이 용어가 지금 차트에서 어디에 보여?" 기능을 AI와 연결한다.

### P2-2. 프론트 코드가 비대하고 유지보수성이 낮음

문제 위치:

- `frontend/src/ui/App.jsx`
- `frontend/src/ui/styles.css`

문제:

- `App.jsx`는 약 2,243줄이다.
- `styles.css`는 약 2,776줄이다.
- 화면, 상태, API 호출, 이벤트 처리, 렌더링이 한 파일에 과도하게 몰려 있다.
- 기능을 추가할수록 사이드 이펙트와 회귀 위험이 커진다.

해결법:

- 페이지 단위로 분리한다.
  - `HomePage`
  - `ResearchPage`
  - `LearningPage`
  - `PortfolioPage`
  - `AdminPage`
- 재사용 컴포넌트로 분리한다.
  - `UniversalSearch`
  - `AiInsightPanel`
  - `StockPulseList`
  - `StockChartSection`
  - `DecisionZonePanel`
  - `TermDetail`
  - `BriefHistory`
  - `AdminOperationsPanel`
- hooks로 상태와 API를 분리한다.
  - `useSummary`
  - `useSearch`
  - `useStockResearch`
  - `useAiChat`
  - `usePortfolioSandbox`
- CSS도 컴포넌트 단위 또는 design token 기반으로 정리한다.

## 7. 사용자 관점 평가

점수: 285/500

좋은 점:

- 첫 화면에 검색, AI, 브리프, 차트 방향은 일부 보인다.
- 상승/하락 TOP3와 차트 진입점이 있다.
- 배우기 탭이 존재한다.

부족한 점:

- 첫 화면에서 무엇을 하면 되는지 아직 명확하지 않다.
- 오늘 브리프가 없으면 서비스 가치가 약하게 보인다.
- 삼성전자 같은 대표 종목 검색이 실패한다.
- 산업/테마 검색이 실제 분석 화면으로 이어지지 않는다.
- 버튼과 링크가 많아 초보자가 부담을 느낄 수 있다.
- AI가 실제로 분석해준다는 체감이 약하다.

사용자 관점 해결 방향:

- 검색 중심 첫 화면으로 다시 설계한다.
- 최신 영업일 차트를 항상 보여준다.
- 첫 화면 메시지를 하나로 줄인다.
- "왜 움직였는지", "무엇을 확인해야 하는지", "AI에게 물어보기"를 한 흐름으로 만든다.

## 8. 개발자 관점 평가

### 8.1 프론트엔드

점수: 300/500

문제:

- `App.jsx`가 너무 크다.
- CSS가 너무 크고 책임 분리가 약하다.
- UI 구조가 아직 버튼과 카드 중심이다.
- 차트, AI, 검색, 운영 UI가 서로 느슨하게 붙어 있다.
- 재사용 가능한 컴포넌트 설계가 부족하다.

해결 방향:

- 페이지, 컴포넌트, hooks, utils로 분리한다.
- 디자인 토큰과 컴포넌트 규칙을 정리한다.
- 검색, AI, 차트, 학습, 포트폴리오를 각각 독립적으로 테스트 가능하게 만든다.
- 접근성, 모바일, 빈 상태, 로딩 상태, 에러 상태를 컴포넌트 단위로 검증한다.

### 8.2 백엔드

점수: 335/500

문제:

- 검색 API가 실제 기업/산업 검색으로 보기 어렵다.
- AI API는 gateway 형태는 있으나 실제 RAG/LLM 품질이 부족하다.
- chart/event API는 있지만 trade zone, evidence, confidence 구조가 부족하다.

해결 방향:

- stock universe table/cache를 만든다.
- industry/theme taxonomy를 만든다.
- chart event와 trade zone API를 분리한다.
- AI service가 사용할 retrieval endpoint를 명확히 만든다.
- source, confidence, basisDate를 모든 분석 API에 포함한다.

### 8.3 DevOps

점수: 360/500

문제:

- Docker 서비스는 동작하지만 로컬 frontend build 재현성이 부족하다.
- untracked duplicate docs가 남아 있다.
- frontend dependency install과 build 검증 절차가 문서와 실제에서 어긋난다.

해결 방향:

- `make frontend-quality`에서 dependency 존재 여부를 검사한다.
- `npm ci --include=dev`를 명확히 문서화한다.
- CI에서 backend test, frontend build, API smoke, Playwright e2e를 모두 실행한다.
- duplicate docs는 확인 후 정리한다.
- `.env`는 계속 git ignore 유지한다.

## 9. VC/투자자 관점 평가

점수: 245/500

좋은 점:

- 한국 주식 초보자 대상이라는 방향은 괜찮다.
- 시장 브리프, 차트, 용어, AI, 포트폴리오 샌드박스 방향은 확장성이 있다.

부족한 점:

- AI가 실제 차별화로 보이지 않는다.
- 검색이 약해서 플랫폼 확장성이 약해 보인다.
- 데이터 소스와 신뢰도 체계가 아직 부족하다.
- 차트 기반 판단 UX가 투자 앱 수준으로 강하지 않다.
- 프론트 완성도가 "프리미엄 플랫폼"처럼 느껴지지 않는다.

VC 관점 해결 방향:

- 첫 화면에서 AI 가치가 즉시 보여야 한다.
  - "왜 움직였는지 AI가 근거로 설명"
  - "차트에서 매수/관망/매도 검토 구간을 설명"
  - "초보자가 놓치기 쉬운 리스크 요약"
- 검색 가능한 데이터 범위를 크게 확장한다.
- RAG와 source-grounded answer를 실제 구현한다.
- 품질 지표를 제품 내외부에 남긴다.
  - AI 응답 신뢰도
  - 근거 링크 수
  - 이벤트 탐지 정확도
  - 검색 coverage
  - UI task success rate

## 10. 유지보수성, 재사용성, 가독성 필수 기준

앞으로 개발하는 AI는 아래 기준을 반드시 지켜야 한다.

### 10.1 유지보수성

- 하나의 파일에 화면, API, 상태, 스타일 책임을 몰아넣지 않는다.
- 페이지 단위와 컴포넌트 단위를 분리한다.
- 변경 이유가 명확한 작은 PR 단위로 개발한다.
- API response shape가 바뀌면 관련 타입, 문서, 테스트를 함께 갱신한다.
- 하드코딩 seed 데이터는 실제 데이터 연결 전 임시임을 명확히 표시한다.
- 임시 구현은 TODO와 제거 조건을 남긴다.

### 10.2 재사용성

- 검색창, AI 패널, 차트 패널, 용어 상세, 상태 뱃지, 근거 링크 UI는 재사용 컴포넌트로 만든다.
- copy text와 UI token을 분리한다.
- stock, term, theme, industry 타입을 공통 모델로 정의한다.
- 같은 버튼 스타일과 상태 처리를 중복 구현하지 않는다.
- loading, empty, error state를 공통 패턴으로 만든다.

### 10.3 가독성

- 컴포넌트는 한눈에 역할이 보여야 한다.
- 함수명은 사용자 행동 또는 도메인 의미를 드러내야 한다.
- 복잡한 계산은 별도 helper로 분리한다.
- CSS class naming은 화면 구조와 컴포넌트 책임이 드러나야 한다.
- 주석은 당연한 설명이 아니라 복잡한 도메인 판단이나 임시 제약을 설명할 때만 쓴다.

### 10.4 품질 기준

- 신규 UI는 390px, 768px, 1280px, 1440px에서 확인한다.
- 모든 버튼은 클릭 결과가 명확해야 한다.
- 모든 주요 UI는 loading, empty, error 상태를 가져야 한다.
- 차트는 데이터 없음 상태에서도 다음 행동이 명확해야 한다.
- AI 응답은 출처, 기준일, 신뢰도, 한계를 표시해야 한다.

## 11. 복구 로드맵

### Phase 1. 기존 기능 복구와 정보구조 정리

목표:

- 기존 기능이 사라진 것처럼 보이는 문제 해결
- 일반 사용자 UX와 관리자 UX 분리

작업:

- `브리프 히스토리` 화면 추가
- 달력 조회 기능 복구
- `운영 모드` 진입점 추가
- adminKey 없을 때 안내 화면 추가
- 생성, 백필, 보관은 관리자 영역으로 유지

검증:

- 일반 사용자가 날짜별 브리프를 볼 수 있는지
- 운영자가 생성/백필/보관을 찾을 수 있는지
- adminKey 없는 상태에서 혼란스럽지 않은지

### Phase 2. 첫 화면 전면 재설계

목표:

- 사용자가 5초 안에 서비스 가치를 이해
- 차트, 검색, AI가 첫 화면의 중심이 되도록 개선

작업:

- 오늘 브리프가 없으면 최신 영업일 브리프 자동 표시
- first view primary action 3개 이하로 축소
- chart-first hero 구성
- AI 가치 문구를 명확히 표시
- 운영 지표는 홈에서 제거하거나 접기

검증:

- 390px 모바일에서 첫 화면이 명확한지
- 차트가 비어 보이지 않는지
- 사용자가 바로 검색/AI/차트 행동을 할 수 있는지

### Phase 3. 검색 재구현

목표:

- 산업, 테마, 기업, 종목 검색을 실제로 가능하게 함

작업:

- stock universe API/cache 구현
- 대표 종목 검색 보장
- industry/theme taxonomy 추가
- 검색 결과 클릭 flow 완성
- theme/industry detail view 추가

검증:

- 삼성전자, SK하이닉스, 현대차, 네이버, 카카오 검색
- 반도체, 2차전지, 금융, 바이오 검색
- 종목코드 검색
- 용어 검색

### Phase 4. 차트와 판단 UX 강화

목표:

- 그래프를 봤을 때 사용자가 "오 좋다"라고 느끼는 수준으로 개선

작업:

- event marker tooltip에 AI 설명 추가
- 매수/분할매수/관망/매도/리스크 구간을 데이터 기반으로 구현
- event list와 chart marker를 연결
- evidence link를 tooltip과 panel에 표시

검증:

- 일봉, 주봉, 월봉 전환
- 마커 hover
- 모바일 tooltip 위치
- 차트 API 실패 상태
- 이벤트 없음 상태

### Phase 5. 실제 AI/RAG 구현

목표:

- 규칙형 응답이 아니라 source-grounded AI 리서치 경험 제공

작업:

- LLM adapter 추가
- RAG retrieval 구현
- vector store 연결
- source, confidence, limitation 저장
- risk reviewer 단계 추가
- answer harness 구현

검증:

- 같은 질문 반복 시 근거 일관성 확인
- 출처 없는 확정 표현 차단
- 매수/매도 단정 표현 차단
- 데이터 기준일 누락 차단

### Phase 6. 프론트 구조 리팩터링

목표:

- 유지보수 쉽고 재사용성과 가독성이 높은 구조로 변경

작업:

- `App.jsx` 분해
- CSS 분해
- hooks 분리
- 공통 컴포넌트 작성
- 테스트 작성

검증:

- 기능별 테스트 가능 여부
- 컴포넌트 재사용 여부
- 신규 기능 추가 시 수정 범위가 작아졌는지

## 12. 하네스 엔지니어링 루프

다음 AI는 아래 루프를 완료 전까지 반복해야 한다.

1. Intent Understanding
   - 사용자의 불만을 다시 정리한다.
   - 핵심은 기존 기능 손상, 버튼 과다, Toss스럽지 않음, 검색 부재, AI 실체 부족, 차트 설득력 부족이다.

2. Current State Audit
   - 실제 코드를 읽는다.
   - 로컬 브라우저에서 화면을 본다.
   - API를 직접 호출한다.
   - 추측으로 평가하지 않는다.

3. Multi-Perspective Scoring
   - 사용자 관점 500점
   - 프론트 개발자 관점 500점
   - 백엔드 개발자 관점 500점
   - DevOps 관점 500점
   - VC/투자자 관점 500점

4. Gap Analysis
   - 495점 미만 항목의 원인을 코드와 화면 기준으로 적는다.
   - 감상평이 아니라 재현 가능한 문제로 남긴다.

5. Reference Research
   - 495점 미만이면 고품질 사이트 5곳 이상을 다시 조사한다.
   - Toss, 고품질 핀테크, 증권 앱, AI SaaS, 데이터 대시보드를 비교한다.
   - 버튼 수, IA, 검색, AI 노출, 차트 UX, 모바일, 애니메이션, 빈 상태를 분석한다.

6. Re-architecture Plan
   - 현재 구조를 유지할지 갈아엎을지 결정한다.
   - 프론트 품질이 낮으면 구조를 전면 변경해도 된다.
   - 단, 기존 기능은 보존해야 한다.

7. Implementation
   - 작은 단위로 구현한다.
   - 기존 기능을 없애지 않는다.
   - 유지보수성, 재사용성, 가독성을 지킨다.

8. Verification
   - frontend build
   - backend test
   - API smoke test
   - investment language safety check
   - Playwright 또는 브라우저 시각 검증
   - 모바일 390px 확인

9. Re-score
   - 모든 관점이 495점 이상인지 다시 확인한다.
   - 하나라도 495점 미만이면 다시 4번으로 돌아간다.

10. Final Report
   - 모든 관점이 495점 이상일 때만 최종 보고한다.
   - 실패한 항목이 있으면 절대 "완료"라고 말하지 않는다.

## 13. 다음 AI에게 줄 작업 지시

```text
너는 kr-stock-daily-brief 프로젝트를 이어받는 시니어 프론트엔드, 백엔드, DevOps, AI 엔지니어다.

프로젝트 경로:
/Users/rose/Desktop/git/kr-stock-daily-brief

반드시 먼저 읽을 문서:
1. docs/GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md
2. docs/FRONTEND_QUALITY_GAP_AUDIT_AND_RECOVERY_PLAN.md
3. docs/FRONTEND_QUALITY_LOOP_REPORT.md
4. docs/API_SPEC.md
5. docs/ROADMAP.md

현재 판단:
- 이전 완료 보고서의 496/500 평가는 신뢰하지 마라.
- 실제 구현은 사용자, 개발자, VC 관점에서 모두 495점 미만이다.
- 기존 기능이 사라진 것처럼 보이고, 검색/AI/차트/첫 화면 품질이 부족하다.

절대 규칙:
- 기존 기능을 없애지 마라.
- .env, .env.*, API key, DB password, Discord webhook, OpenAI key, admin key는 절대 git에 올리지 마라.
- 유지보수하기 쉽고 재사용성과 가독성이 좋은 구조로 만들어라.
- App.jsx와 styles.css에 계속 기능을 밀어넣지 마라.
- 페이지, 컴포넌트, hooks, API client를 분리하라.
- 작은 단위로 구현하고 테스트하라.
- 기능이 실패하면 보고서에 실패라고 적어라.

우선순위:
1. 기존 달력/브리프 히스토리/생성/백필/보관 접근성 복구
2. 첫 화면을 chart-first, search-first, AI-first로 재설계
3. 삼성전자 같은 대표 종목이 검색되는 stock universe 구현
4. 산업/테마 검색 결과가 실제 상세 화면과 AI 분석으로 이어지게 구현
5. 차트 마커 hover에 AI 설명, 근거, 신뢰도, 기준일 표시
6. ai-service를 실제 LLM/RAG 기반으로 확장
7. App.jsx와 styles.css를 유지보수 가능한 구조로 분해
8. 390px, 768px, 1280px, 1440px에서 검증

하네스 루프:
1. 실제 코드와 화면을 점검한다.
2. 사용자, 프론트 개발자, 백엔드 개발자, DevOps, VC 관점에서 점수를 매긴다.
3. 495/500 미만 항목을 찾는다.
4. 좋은 서비스 5곳 이상을 조사한다.
5. 부족한 이유를 쓰고 계획을 세운다.
6. 구현한다.
7. 테스트한다.
8. 다시 점수 매긴다.
9. 모든 관점이 495/500 이상일 때만 최종 보고한다.

최종 보고에는 반드시 포함하라:
- 변경한 코드
- 보존한 기존 기능
- 새로 추가한 기능
- 실행 방법
- 테스트 결과
- 남은 리스크
- 다음 작업
- 사용자/개발자/VC 관점 점수
```

## 14. 최종 판단

현재 구현은 방향성은 일부 반영했지만, 목표 문서의 기준을 충족하지 못했다.

가장 큰 문제는 다음 5가지다.

1. 기존 기능이 사라진 것처럼 보인다.
2. 검색이 실제 플랫폼 검색이 아니다.
3. AI 기능이 실제 RAG/Agentic 수준이 아니다.
4. 차트가 핵심 경험으로 충분히 강하지 않다.
5. 프론트 구조가 유지보수, 재사용성, 가독성 측면에서 아직 약하다.

따라서 다음 작업은 새 기능을 더 얹는 것이 아니라, 기존 기능을 복구하면서 정보구조, 검색, AI, 차트, 프론트 아키텍처를 다시 잡는 것이다.
