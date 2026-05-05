# PLATFORM_IMPLEMENTATION_FIX_20260505_V1_report

작성일: 2026-05-05

기준 문서:

- `docs/PLATFORM_IMPLEMENTATION_AUDIT_20260504_V1_report.md`
- `docs/PLATFORM_TEAM_MASTER_GOAL_PROMPT.md`
- `docs/API_PORTFOLIO_AI_ENRICHMENT_20260505.md`

## 1. 이번 수정 목표

감사 보고서에서 `출시 전 필수 수정` 또는 `출시 전 권장 수정`으로 분류한 항목 중, 빠르게 직접 개선 가능한 항목을 우선 처리했다.

우선 처리한 항목:

1. 포트폴리오 샌드박스를 브라우저 `localStorage` 단독 저장에서 서버 API 기반으로 확장
2. 포트폴리오 리스크에 최근 이벤트와 다음 확인 체크리스트 연결
3. AI chat 요청에 context가 부족해도 backend가 검색/브리프/차트/이벤트 근거를 자동 보강
4. 홈 화면에서 기존 브리프 상세가 바로 노출되어 정보 밀도가 과도했던 문제 완화
5. 추가 API 명세 문서화

## 2. 구현한 변경 사항

### 2.1 Backend Portfolio Sandbox API

추가 파일:

- `backend/src/main/resources/db/migration/V7__portfolio_sandbox.sql`
- `backend/src/main/java/com/krbrief/portfolio/PortfolioItem.java`
- `backend/src/main/java/com/krbrief/portfolio/PortfolioItemRepository.java`
- `backend/src/main/java/com/krbrief/portfolio/PortfolioItemRequest.java`
- `backend/src/main/java/com/krbrief/portfolio/PortfolioItemDto.java`
- `backend/src/main/java/com/krbrief/portfolio/PortfolioRiskSummaryDto.java`
- `backend/src/main/java/com/krbrief/portfolio/PortfolioResponse.java`
- `backend/src/main/java/com/krbrief/portfolio/PortfolioService.java`
- `backend/src/main/java/com/krbrief/portfolio/PortfolioController.java`

추가 API:

- `GET /api/portfolio`
- `POST /api/portfolio/items`
- `PUT /api/portfolio/items/{code}`
- `DELETE /api/portfolio/items/{code}`

의미:

- 포트폴리오 샌드박스가 서버 MySQL 저장 기반으로 확장됐다.
- 각 종목 응답에 `riskNotes`, `nextChecklist`, `recentEvents`를 포함한다.
- 최근 이벤트는 기존 `StockResearchClient.events()`를 통해 조회하고, 실패하면 빈 배열로 fallback한다.

### 2.2 Frontend Portfolio API 연동

수정 파일:

- `frontend/src/ui/hooks/usePortfolio.js`
- `frontend/src/ui/App.jsx`
- `frontend/src/ui/AppSections.jsx`

변경 내용:

- 프론트 포트폴리오는 먼저 `/api/portfolio`에서 서버 데이터를 조회한다.
- 서버 API가 실패하면 기존처럼 `localStorage` fallback을 사용한다.
- 종목 추가, 비중 수정, 삭제도 서버 API를 우선 사용한다.
- 포트폴리오 UI에 다음 정보를 추가 표시한다.
  - 종목별 리스크 노트
  - 종목별 다음 확인 체크리스트
  - 전체 포트폴리오 다음 체크리스트
  - 저장 방식: `서버 샌드박스` 또는 `브라우저 임시 저장`

### 2.3 AI Chat Context Auto Enrichment

추가/수정 파일:

- `backend/src/main/java/com/krbrief/ai/AiChatContextEnricher.java`
- `backend/src/main/java/com/krbrief/ai/AiChatController.java`

변경 내용:

- `/api/ai/chat` 요청이 들어오면 backend가 AI service에 전달하기 전 context를 보강한다.
- `context.query`가 있으면 검색 API 결과를 자동 첨부한다.
- `context.query`가 없으면 질문 문장 안에서 대표 키워드를 감지한다.
- 최신 브리프 요약을 `context.summary`로 첨부한다.
- 종목 코드가 확인되면 차트 최신값과 최근 이벤트도 첨부한다.
- AI service에는 `retrievalPolicy=backend_auto_enriched_search_summary_chart_events`를 전달한다.

해결하려는 문제:

- 사용자가 질문만 보냈을 때 retrieval 문서가 0개가 되어 `출처 부족`으로 떨어지는 문제를 줄인다.

### 2.4 Home 정보 밀도 완화

수정 파일:

- `frontend/src/ui/App.jsx`
- `frontend/src/ui/HomePage.jsx`

변경 내용:

- 홈 화면에서는 기존 `SummaryDetailPanel`을 바로 노출하지 않도록 변경했다.
- 홈 첫 화면은 검색, AI, 차트 중심으로 유지하고, 상세 브리프/검증/수집 노트 성격의 정보는 history/research/admin 쪽으로 분리한다.
- 요약이 없을 때는 홈에 간단한 empty 안내를 추가했다.

의미:

- `기존 브리프 UI가 첫 화면 아래에 크게 남아 있어 전면 재설계처럼 보이지 않는다`는 문제를 줄였다.

### 2.5 API 명세 보강

추가 파일:

- `docs/API_PORTFOLIO_AI_ENRICHMENT_20260505.md`

내용:

- Portfolio Sandbox API 명세
- AI Chat Context Auto Enrichment 동작 방식

## 3. 해결된 체크리스트

| 문서 요구사항 | 이전 상태 | 현재 상태 |
|---|---|---|
| 포트폴리오 샌드박스 API 설계 | 미완료 | 부분 완료 |
| 관심 종목 서버 저장 | 미완료 | 완료 |
| 가상 비중 서버 저장 | 미완료 | 완료 |
| 포트폴리오 리스크 설명 | 부분 완료 | 개선 |
| 다음 확인 체크리스트 | 미확인/미완료 | 부분 완료 |
| 최근 이벤트 기반 리스크 설명 | 미완료 | 부분 완료 |
| AI chat context 부족 시 retrieval 0개 문제 | 미완료 | 개선 |
| 홈 정보 밀도 감소 | 미완료 | 개선 |
| API 추가 명세 문서화 | 미완료 | 부분 완료 |

## 4. 아직 남은 리스크

| 영역 | 남은 리스크 | 이유 |
|---|---|---|
| Backend | 컴파일 미확인 | `./gradlew compileJava`가 실행 중 출력 없이 멈춰 중단 |
| Frontend | 최종 build 미확인 | `npm run build`가 `transforming...` 단계에서 오래 멈춰 중단 |
| DevOps | Docker rebuild 미확인 | 빠른 수정 범위라 전체 rebuild는 아직 수행하지 않음 |
| AI | ai-service 내부 RAG 품질은 추가 확인 필요 | backend context 보강은 했지만 ai-service ranking 자체는 별도 영역 |
| Portfolio | 멀티 사용자/인증은 없음 | 현재는 단일 샌드박스 테이블 기준 |
| API docs | 기존 `API_SPEC.md`에 직접 병합은 미완료 | 추가 명세 문서로 먼저 분리 작성 |

## 5. 실행한 빠른 검증

| 명령 | 결과 | 비고 |
|---|---|---|
| `node --check frontend/src/ui/hooks/usePortfolio.js` | 통과 | 수정한 JS hook 문법 확인 |
| `./gradlew compileJava --no-daemon --console=plain` | 중단 | 출력 없이 장시간 멈춤 |
| `npm run build` | 중단 | Vite `transforming...` 단계에서 장시간 멈춤 |

## 6. 다음 필수 작업

1. Gradle/Vite가 멈추는 원인을 먼저 해결한다.
2. backend compile을 통과시킨다.
3. frontend build를 통과시킨다.
4. Docker compose rebuild 후 `/api/portfolio`를 실제 호출한다.
5. `/api/ai/chat`에 context 없이 질문을 보내 retrieval 문서가 자동 보강되는지 확인한다.
6. `docs/API_SPEC.md`에 이번 API addendum을 병합한다.
7. 최종 직전에 `make quality`를 실행한다.

