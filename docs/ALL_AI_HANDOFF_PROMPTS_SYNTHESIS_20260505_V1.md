# All AI Handoff Prompts Synthesis 20260505 V1

작성일: 2026-05-05

프로젝트 경로:

`/Users/rose/Desktop/git/kr-stock-daily-brief`

## 0. 이 문서의 목적

이 문서는 그동안 다른 AI에게 개발, 재설계, 감사, 반복 개선을 맡기기 위해 작성한 Markdown 프롬프트 문서들을 다시 비교 분석하고, 실제로 다음 AI에게 그대로 전달할 수 있는 하나의 종합 지시문으로 재구성한 문서다.

이번 문서에서는 아래와 같은 일반 문서군 상태표는 다루지 않는다.

- README.md 반영 여부
- OPERATIONS.md 반영 여부
- CHECKLIST.md 반영 여부
- DB_TABLES.md, ERD.md 반영 여부
- 중복 문서 충돌 분석 미완료 같은 일반 감사 문구

대신 아래에 집중한다.

1. 다른 AI에게 전달할 목적으로 작성된 MD 문서 목록화
2. 각 문서의 목적, 강점, 한계 비교
3. 서로 충돌하거나 흩어진 지시를 하나의 기준으로 정리
4. 프론트 > 백엔드 > AI > DevOps 순서의 실행 우선순위 확정
5. 프론트 전면 재설계, 차트 중심 학습, 조건형 매수/매도 검토 UX, AI/RAG/Agentic/Harness, 배포까지 포함한 최종 프롬프트 제공

## 1. 다른 AI에게 전달할 목적으로 작성한 MD 문서 목록

아래 문서들이 다른 AI에게 작업을 넘기거나, 다른 AI의 작업을 감독하거나, `/goal` 반복 개선 루프를 실행시키기 위한 목적으로 작성된 문서다.

| 순서 | 문서 | 성격 | 현재 종합 기준에서의 역할 |
|---:|---|---|---|
| 1 | `docs/AI_DEVELOPMENT_DIRECTION_AND_PROMPT.md` | 제품 방향/초기 인수인계 프롬프트 | 제품 정체성, 사용자, AI/RAG/Agentic 기본 원칙의 출발점 |
| 2 | `docs/AI_HANDOFF_PROMPT.md` | 시니어 풀스택/AI 개발 인수인계 프롬프트 | 기존 기능, 기술 스택, 완료/미완료 체크리스트, commit/push 규칙 |
| 3 | `docs/AI_SELF_REVIEW_QUALITY_PROMPT.md` | 자가 점검/품질 개선 프롬프트 | 점수화, 버튼별 테스트, 하네스 엔지니어링, 품질 반복 루프 |
| 4 | `docs/GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md` | `/goal` 프론트 전면 재설계 품질 루프 | Toss급 UI/UX, 495/500 반복 루프, 검색/차트/AI 중심 프론트 기준 |
| 5 | `docs/GOAL_FRONTEND_QUALITY_LOOP_PROMPT 2.md` | `/goal` 프론트 품질 루프 이전/보조 버전 | 배우기 탭, Pretendard, 애니메이션, 차트 구간 UX 강화 기준 |
| 6 | `docs/FRONTEND_QUALITY_GAP_AUDIT_AND_RECOVERY_PLAN.md` | 프론트 품질 격차 감사/복구 계획 | 기존 기능 손상, 검색/AI/차트 부족, 유지보수성 문제를 P0/P1/P2로 정리 |
| 7 | `docs/FRONTEND_REBUILD_AUDIT_AND_NEXT_AI_PROMPT.md` | 프론트 전면 재설계 감사 및 다음 AI 프롬프트 | 가장 중요한 프론트 재설계 기준. 현재 종합 기준의 1순위 문서 |
| 8 | `docs/PLATFORM_TEAM_MASTER_GOAL_PROMPT.md` | 플랫폼 팀 마스터 목표 프롬프트 | 프론트/백엔드/AI/DevOps 팀 전체 기준과 하네스 루프 |
| 9 | `docs/PLATFORM_IMPLEMENTATION_AUDIT_20260504_V1_report.md` | 독립 기술 감독/감사 프롬프트 포함 보고서 | 완료 보고를 믿지 않고 실제 화면/코드/API 기준으로 재감사하는 기준 |
| 10 | `docs/FRONTEND_FIRST_FULL_REDESIGN_PROMPT_20260505.md` | 프론트 최우선 전면 재설계 프롬프트 | 기존 프론트를 없다고 보고 첫 화면, 차트, 학습, AI UX를 다시 설계하는 최신 프론트 지시 |

## 2. 문서별 비교 분석

### 2.1 `AI_DEVELOPMENT_DIRECTION_AND_PROMPT.md`

핵심 내용:

- 현재 제품을 `한국 주식 일간 브리프 운영 도구`에서 `주식 초보자를 위한 한국 주식 AI 리서치/학습 보조 앱`으로 확장한다.
- 첫 화면은 달력 운영 화면이 아니라 `오늘의 시장 브리프`가 되어야 한다.
- 종목 상세, 일봉/주봉/월봉 차트, 급등/급락 이벤트 마커, AI 질문/답변, 포트폴리오 샌드박스를 제안한다.
- RAG는 출처 기반 답변, Agentic은 Data Collector, Event Detector, Evidence Ranker, Beginner Explainer, Risk Reviewer, Response Composer로 설계한다.
- 투자 표현은 단정형이 아니라 관심 후보, 근거, 리스크, 체크리스트 중심으로 제한한다.

강점:

- 제품 방향이 가장 명확하다.
- 법적/신뢰 리스크를 처음부터 고려한다.
- AI/RAG/Agentic 구조의 기본 골격이 좋다.

한계:

- 프론트 품질 요구가 이후 문서보다 덜 구체적이다.
- 실제 사용자가 원하는 `차트 중심으로 공부되는 경험`과 `매수/매도 검토 구간`은 이후 문서에서 더 강해졌다.

종합 반영:

- 제품 정체성과 AI 안전 원칙의 기준으로 사용한다.

### 2.2 `AI_HANDOFF_PROMPT.md`

핵심 내용:

- 다른 AI가 프로젝트를 이어받기 위한 경로, 기술 스택, 기존 기능, 포트, 주요 파일, commit/push 규칙을 정리한다.
- 기존 기능을 삭제하지 않고 초보자용 AI 리서치 플랫폼으로 확장하도록 지시한다.
- 학습 API, 용어 사전, AI 학습 도우미, 오늘의 브리프 중심 UI 등 당시 완료된 항목과 남은 Phase를 정리한다.
- 그래프 중심 종목 상세, 매수/매도 판단 UX, OHLCV/API/Event Detection, AI/RAG, 포트폴리오 샌드박스, 배포/운영을 로드맵으로 제시한다.

강점:

- 실제 개발 AI가 읽기 좋은 인수인계 구조다.
- 기존 기능 보존, secret 금지, commit/push 등 운영 규칙이 명확하다.
- 백엔드, 프론트, marketdata, Docker 구조를 연결해준다.

한계:

- 이후 사용자 불만인 `프론트가 전혀 바뀌지 않았다`, `버튼이 너무 많다`, `AI가 어디인지 모르겠다`를 충분히 반영하지 못한다.
- 현재 기준에서는 체크리스트 일부가 오래되었을 수 있으므로 완료 여부를 그대로 믿으면 안 된다.

종합 반영:

- 프로젝트 실행 규칙, 기존 기능 보존, commit/push, secret 금지 기준으로 사용한다.

### 2.3 `AI_SELF_REVIEW_QUALITY_PROMPT.md`

핵심 내용:

- 프론트와 백엔드를 스스로 점검하고 점수를 매긴 뒤 개선 계획을 세우도록 한다.
- 기능/버튼별 테스트 매트릭스를 만들고, 기능별 점수와 평가를 남기도록 한다.
- 하네스 엔지니어링 절차: Intent, Data, Draft, Self Review, Risk Review, UX Review, Test Review, Finalize.
- 프론트 최상급 품질, 차트 중심 UX, 매수/매도 검토 구간, 애니메이션, 모바일, 로딩/빈/에러 상태를 강조한다.

강점:

- 자기 점검과 반복 개선 구조가 좋다.
- 버튼별/기능별 테스트 요구가 구체적이다.
- AI 내부 사고 과정 노출 대신 검증된 결과만 보고하도록 유도한다.

한계:

- 완료 기준 점수가 이후 문서의 495/500보다 낮다.
- `프론트 전면 재설계`보다 `품질 개선` 톤이 강하다.

종합 반영:

- 점수화, 테스트 매트릭스, 하네스 엔지니어링 절차에 반영한다.

### 2.4 `GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md`

핵심 내용:

- `/goal`에 넣기 위한 프론트 전면 재설계 품질 루프다.
- 프론트는 싹 다 갈아엎어도 되며, Toss급 UI/UX, 10년차 고연봉 개발자 수준의 완성도를 요구한다.
- 버튼 수 축소, 통합 검색, AI 기능 명확화, 차트 중심 UX, 매수/매도 검토 구간, 배우기 탭 강화, Pretendard, glassmorphism, micro interaction을 요구한다.
- 사용자, 개발자, VC/주주 관점으로 각각 500점 만점 평가하고 495점 미만이면 반복한다.

강점:

- 사용자의 실제 불만이 가장 많이 반영되어 있다.
- 프론트 품질 기준이 강하고 구체적이다.
- "완료라고 말하기 전 반복" 구조가 명확하다.

한계:

- 목표가 강한 만큼 실제 AI가 무한 루프를 제대로 수행하지 못할 가능성이 있다.
- 프론트 중심이어서 백엔드/API/AI 실제 완성 기준은 보완이 필요하다.

종합 반영:

- 프론트 품질과 반복 루프의 핵심 기준으로 사용한다.

### 2.5 `GOAL_FRONTEND_QUALITY_LOOP_PROMPT 2.md`

핵심 내용:

- 배우기 탭 강화, 용어별 핵심요약 1문장, 최소 3줄 설명, 시나리오 예시를 강조한다.
- 버튼 단순화, 모바일 앱 같은 깔끔함, 애니메이션, Pretendard, glassmorphism을 요구한다.
- 차트 중심, 일봉/주봉/월봉, 매수/매도 검토 구간, 마커 hover 설명을 요구한다.
- 495점 미만이면 고품질 사이트 5곳 이상 참고 후 반복하도록 한다.

강점:

- 학습 콘텐츠 요구가 매우 선명하다.
- 프론트 감성, 폰트, 애니메이션, 버튼 단순화 기준이 좋다.

한계:

- 현재 기준에서는 `GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md`가 더 최신이고 더 포괄적이다.

종합 반영:

- 배우기 탭, 용어 설명, Pretendard, 애니메이션 기준에 반영한다.

### 2.6 `FRONTEND_QUALITY_GAP_AUDIT_AND_RECOVERY_PLAN.md`

핵심 내용:

- 이전 AI가 3시간 작업했지만 목표를 충족하지 못했다는 감사 문서다.
- P0: 완료 보고 과장, 기존 기능 손상처럼 보임, 검색 부족, AI/RAG 실체 부족.
- P1: 차트 설득력 약함, 버튼 많음, 오늘 브리프가 없을 때 첫 화면 약함.
- P2: 배우기 탭 얕음, 프론트 코드 비대, 유지보수성 낮음.
- 유지보수성, 재사용성, 가독성 기준을 명시한다.
- App.jsx/styles.css에 계속 밀어넣지 말고 페이지, 컴포넌트, hooks, API client를 분리하라고 지시한다.

강점:

- "실제로 안 된 부분"을 가장 잘 짚는다.
- 유지보수성, 재사용성, 가독성 기준이 명확하다.
- 완료 보고를 믿지 말고 실제 화면/코드/API로 검증하라는 태도가 좋다.

한계:

- 감사/복구 문서라서 하나의 최종 실행 프롬프트로는 길고 산만할 수 있다.

종합 반영:

- P0/P1/P2 문제, 유지보수성 기준, 기존 기능 보존 기준에 반영한다.

### 2.7 `FRONTEND_REBUILD_AUDIT_AND_NEXT_AI_PROMPT.md`

핵심 내용:

- 현재 프론트는 완성 상태가 아니며 다시 처음부터 전면 재설계해야 한다.
- PC 검색/AI 영역 잘림, 헤더 좌측 붙음, 기존 페이지 느낌, AI 기능 불명확 문제를 직접 지적한다.
- 다음 AI에게 `기존 화면 위 덧칠 금지`, `App shell 재구성`, `PC clipping 해결`, `첫 화면 재구성`, `버튼 최소화`, `검색 완성`, `차트 중심 UX`, `AI 기능 강화`, `배우기 탭 강화`를 요구한다.

강점:

- 현재 사용자 불만에 가장 직접적으로 맞닿아 있다.
- 프론트 전면 재설계의 1순위 기준으로 가장 적합하다.
- clipping, spacing, AI 노출 같은 세세한 UX 문제를 놓치지 않는다.

한계:

- 프론트 중심이므로 백엔드/AI/DevOps는 마스터 문서와 함께 봐야 한다.

종합 반영:

- 최종 프롬프트에서 1순위 기준 문서로 지정한다.

### 2.8 `PLATFORM_TEAM_MASTER_GOAL_PROMPT.md`

핵심 내용:

- 프론트, 백엔드, AI, DevOps 팀이 함께 출시급 한국 주식 AI 리서치 웹 플랫폼을 만들도록 한다.
- 핵심 기능: 첫 화면, 검색, 차트, 매수/매도 검토 UX, 배우기, 포트폴리오, 운영/관리자.
- 하네스 루프: Intent, Current State Audit, Multi-Team Scoring, Gap Analysis, Reference Research, Plan, Implement, Fast Verify, Re-score, Report.
- 개발 중에는 무거운 E2E/Docker/smoke를 매번 돌리지 말고 빠른 build/화면 검증을 반복하라고 한다.
- 완료 조건: PC/mobile 잘림 없음, 검색/차트/AI 중심, 기존 기능 보존, 유지보수성, Docker/배포 고려, secret 미커밋, 전 관점 495/500 이상.

강점:

- 전체 팀 기준으로 가장 균형이 좋다.
- DevOps와 배포, secret, healthcheck, API_SPEC 동기화까지 포함한다.
- 하네스 루프가 가장 정리되어 있다.

한계:

- 프론트 사용자의 구체 불만은 `FRONTEND_REBUILD_AUDIT...`이 더 선명하다.

종합 반영:

- 전체 플랫폼 구현의 마스터 기준으로 사용한다.

### 2.9 `PLATFORM_IMPLEMENTATION_AUDIT_20260504_V1_report.md`

핵심 내용:

- 다른 AI의 완료 보고를 믿지 말고 독립 기술 감독관처럼 확인하라고 지시한다.
- 실제 코드, 화면, API, 명령 결과 기준으로만 판단한다.
- 포트폴리오 API, AI chat retrieval, API_SPEC 일치, build/quality, 원격 배포, PC/mobile clipping을 의심 지점으로 둔다.
- 최종 보고 양식: 전체 결론, 미준수 항목, 문서별 준수, 팀별 감독, 검증 명령, 자동 검사가 덮지 못하는 영역, 점수, 다음 작업.

강점:

- "완료 보고 과장"을 막는 감독 프롬프트로 좋다.
- 실제 검증 기준이 명확하다.

한계:

- 개발 프롬프트라기보다 감사 프롬프트다.
- 이번 최종 실행 프롬프트에는 감사 관점을 일부만 통합하면 된다.

종합 반영:

- 완료 보고 검증, 미확인/부분 완료 표현, 실제 화면/코드/API 기준 판단에 반영한다.

### 2.10 `FRONTEND_FIRST_FULL_REDESIGN_PROMPT_20260505.md`

핵심 내용:

- 프론트가 없다고 생각하고 첫 화면부터 정보 구조, 레이아웃, 컴포넌트, 스타일, 사용 흐름을 다시 만들라고 지시한다.
- 우선순위는 Frontend > Backend > AI > DevOps > Docs다.
- 첫 화면 정보 과부하 금지: 통합 검색, 메인 차트, AI 핵심 인사이트, 관심 후보 3개 이하, 학습 진입점만 선명하게.
- 그래프가 메인이며 일봉/주봉/월봉, 거래량, 이동평균선, 이벤트 마커, AI 해석 마커, 매수/매도 검토 구간, hover tooltip을 요구한다.
- AI는 chain-of-thought를 노출하지 말고 한 줄 결론, 근거, 반대 신호, 리스크, 기준일, 신뢰도, 한계, 출처만 보여준다.
- 개발 중 무거운 테스트는 매번 돌리지 않고 빠른 검증을 반복한다.

강점:

- 가장 최신 사용자 의도를 잘 반영한다.
- 프론트 > 백엔드 > AI 우선순위를 명확히 둔다.
- 학습 탭 강화와 AI 사고 과정 비노출을 분명히 한다.

한계:

- 이전 답변에서 인정했듯이, 모든 MD 문서를 완전 비교한 종합본은 아니었다.

종합 반영:

- 이번 최종 프롬프트의 직접 기반으로 삼되, 위 9개 문서의 내용을 추가로 합친다.

## 3. 비교 분석 결론

### 3.1 공통으로 반복된 핵심 요구

모든 프롬프트 문서에서 반복되는 요구는 다음이다.

1. 기존 운영자용 일간 브리프를 버리지 말고 초보자용 한국 주식 AI 리서치 플랫폼으로 확장한다.
2. 첫 화면은 달력/관리자 중심이 아니라 검색, 차트, AI, 오늘의 시장 이해가 중심이어야 한다.
3. 프론트는 기존 화면에 덧칠하지 말고 새 제품처럼 전면 재설계해야 한다.
4. 버튼은 줄이고, 주요 액션은 1~3개만 전면에 보이게 한다.
5. 그래프가 메인이다. 일봉/주봉/월봉, 이벤트 마커, tooltip, 매수/매도 검토 구간이 핵심이다.
6. AI는 제품의 핵심 가치로 보여야 하며, 근거/출처/기준일/신뢰도/한계를 포함해야 한다.
7. AI의 내부 사고 과정이나 chain-of-thought는 노출하지 않는다.
8. 학습 탭은 용어 사전 수준을 넘어, 차트와 연결된 초보자 학습 경험이어야 한다.
9. 기존 기능은 삭제하지 말고 일반 사용자 영역과 관리자 영역으로 분리한다.
10. 유지보수성, 재사용성, 가독성을 위해 컴포넌트, hooks, API client, style token을 분리한다.
11. `.env`, secret, key, webhook은 절대 commit하지 않는다.
12. 개발 중에는 무거운 테스트를 매번 돌리지 말고 빠른 화면/build/API 검증으로 반복한다.
13. 완료 보고는 실제 화면, 코드, API, build 기준으로만 한다.
14. 사용자, 개발자, VC/투자자 관점에서 점수화하고 부족하면 다시 개선한다.

### 3.2 우선순위 정리

최종 우선순위는 아래로 고정한다.

| 우선순위 | 영역 | 이유 |
|---:|---|---|
| 1 | Frontend | 사용자가 가장 크게 불만을 느끼는 영역이고, 서비스의 첫인상과 사용성 대부분을 결정한다. |
| 2 | Backend | 검색, 차트, 이벤트, trade-zones, 포트폴리오, AI chat을 프론트에서 실제로 쓰려면 API가 안정적이어야 한다. |
| 3 | AI | VC 관점에서 확장성을 보여야 하지만, 화면에서 유용하게 보이는 결과 중심으로 붙어야 한다. |
| 4 | DevOps | Docker, healthcheck, secret 방지, 배포 검증이 출시 가능성을 만든다. |
| 5 | Docs | API와 운영 문서는 코드와 맞춰 갱신하되, 개발 속도를 막는 문서 작업은 후순위다. |

### 3.3 최상위 기준 문서

다음 AI가 헷갈리지 않도록 기준 문서의 우선순위를 아래로 정한다.

1. `docs/FRONTEND_REBUILD_AUDIT_AND_NEXT_AI_PROMPT.md`
2. `docs/ALL_AI_HANDOFF_PROMPTS_SYNTHESIS_20260505_V1.md`
3. `docs/FRONTEND_FIRST_FULL_REDESIGN_PROMPT_20260505.md`
4. `docs/PLATFORM_TEAM_MASTER_GOAL_PROMPT.md`
5. `docs/GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md`
6. `docs/AI_DEVELOPMENT_DIRECTION_AND_PROMPT.md`
7. `docs/AI_HANDOFF_PROMPT.md`
8. `docs/AI_SELF_REVIEW_QUALITY_PROMPT.md`

`FRONTEND_REBUILD_AUDIT_AND_NEXT_AI_PROMPT.md`를 1순위로 둔다. 이유는 사용자가 가장 강하게 지적한 현재 프론트 문제를 가장 직접적으로 다루기 때문이다.

## 4. 최종 제품 목표

최종 제품 한 줄:

> 초보자가 한국 주식을 차트, AI 근거, 쉬운 용어 설명, 관심 후보, 조건형 매수/매도 검토 시나리오로 배우고 비교하는 프리미엄 AI 주식 리서치 웹 플랫폼

첫 화면에서 사용자가 5초 안에 이해해야 하는 것:

- 무엇을 검색하면 되는지
- 오늘 어떤 종목/산업/테마를 보면 되는지
- 왜 그 종목을 봐야 하는지
- 차트에서 어떤 구간을 봐야 하는지
- 매수 검토, 관망, 매도 검토, 리스크 관리 구간이 어디인지
- 모르는 용어를 어디에서 배울 수 있는지
- AI가 어떤 근거로 설명하는지

## 5. 프론트 전면 재설계 기준

프론트는 기존 화면을 일부 수정하는 방식으로 접근하지 않는다.

다음 항목은 필요하면 모두 새로 설계한다.

- App shell
- Header
- Navigation
- Command center
- 통합 검색
- Chart workspace
- AI insight panel
- Learning panel
- Portfolio panel
- Admin console
- Layout grid
- Design token
- Component structure
- API client/hook 구조
- Loading/empty/error state
- Animation/micro interaction

단, 기존 기능은 삭제하지 않는다. 일반 사용자 첫 화면에서 숨기고, 관리자/기록/운영 영역으로 정리한다.

### 5.1 첫 화면

첫 화면에 반드시 보일 것:

- 통합 검색
- 메인 차트
- AI 핵심 인사이트
- 오늘 볼 만한 관심 후보 3개 이하
- 초보자 학습 진입점
- 현재 데이터 기준일과 신뢰도

첫 화면에서 숨기거나 접을 것:

- 긴 브리프 전문
- 검증 상세
- 수집 노트
- 생성/백필/보관
- 긴 TOP 리스트
- 외부 링크 반복
- 관리자 버튼

### 5.2 버튼

- 전면 primary action은 1~3개로 제한한다.
- 중복 버튼은 제거한다.
- 생성/백필/보관/검증/보관 같은 운영 기능은 관리자 영역으로 이동한다.
- 버튼 대신 검색, tabs, segmented control, dropdown, drawer, bottom sheet, contextual menu를 우선 사용한다.

### 5.3 통합 검색

검색 대상:

- 기업명
- 종목명
- 종목코드
- 산업
- 테마
- 시장 구분
- 주식 용어
- 오늘 움직인 종목

검색 결과에 반드시 표시:

- 종목명/코드
- 시장
- 최근 등락률
- 관련 산업/테마
- 차트 보기
- AI 설명 진입점
- 초보자용 한 줄 설명

검색 실패 상태:

- 빈 화면 금지
- 추천 검색어 표시
- 오늘 많이 움직인 종목/테마 제안
- AI에게 질문하기 진입점

### 5.4 차트

그래프가 제품의 주인공이다.

필수:

- 일봉
- 주봉
- 월봉
- 가격 흐름
- 거래량
- 이동평균선
- 이벤트 마커
- 공시/뉴스/언급량 마커
- AI 해석 마커
- 매수 검토 구간
- 분할매수 검토 구간
- 관망 구간
- 매도 검토 구간
- 리스크 관리 구간
- hover tooltip
- 모바일 터치 대응

tooltip에 표시:

- 이 구간의 의미
- 초보자 설명
- 근거
- 반대 신호
- 리스크
- 데이터 기준일
- 신뢰도
- 관련 용어 링크

tooltip은 PC와 모바일 모두에서 잘리거나 화면 밖으로 나가면 안 된다.

### 5.5 관심 후보와 매수/매도 검토 UX

사용자는 어디를 봐야 하고, 왜 봐야 하며, 언제 매수/매도를 검토할 수 있는지 알고 싶어 한다.

다만 단정형 투자 지시가 아니라 조건형/교육형/시나리오형으로 제공한다.

금지 표현:

- 지금 사라
- 지금 팔아라
- 무조건 추천
- 반드시 오른다
- 수익 보장

허용 표현:

- 관심 후보
- 살펴볼 만한 이유
- 매수 검토 구간
- 분할매수 검토 구간
- 관망 구간
- 매도 검토 구간
- 리스크 관리 구간
- 이 조건이 확인되면 검토
- 이 반대 신호가 나오면 보류

각 후보 종목에 표시:

- 왜 관심 후보인가
- 관련 산업/테마
- 차트 상태
- 매수 검토 조건
- 매도 검토 조건
- 관망 조건
- 리스크
- 초보자 체크리스트
- AI 근거 요약
- 데이터 기준일
- 신뢰도

### 5.6 배우기

학습은 부가 기능이 아니라 retention의 핵심이다.

각 용어는 아래 구조를 가져야 한다.

1. 핵심 요약 한 줄
2. 최소 3줄 이상의 쉬운 설명
3. 차트에서 어디에 보이는지
4. 왜 중요한지
5. 초보자가 자주 하는 오해
6. 실제 시나리오 예시
7. 관련 차트 구간
8. 관련 질문
9. AI에게 물어보기 진입점

우선 강화할 용어:

- 등락률
- 거래량
- 거래대금
- PER
- PBR
- ROE
- 공시
- DART
- 일봉
- 주봉
- 월봉
- 이동평균선
- 손절
- 분할매수
- 추세
- 저항선
- 지지선
- 변동성
- 거래정지
- 시가총액
- 섹터
- 테마
- 수급

## 6. 백엔드 기준

백엔드는 프론트 경험을 뒷받침하는 API gateway다.

필수 확인/구현:

- 기존 summaries API 보존
- 검색 API
- 종목 차트 API
- 이벤트 API
- trade-zones API
- 포트폴리오 API
- AI chat API
- 용어 학습 API
- 관리자 API와 일반 사용자 API 분리
- API_SPEC 문서 동기화

데이터 정확도 규칙:

- pykrx의 `get_market_price_change_by_ticker()` 등락률을 그대로 믿지 않는다.
- 전일 종가 대비 등락률은 OHLCV 당일/전일 종가로 직접 계산한다.
- 전일 또는 당일 거래량 0인 종목, 비정상 종목코드, 거래정지 의심 종목은 필터링한다.
- `0011T0` 같은 비6자리 숫자 코드는 제외한다.
- KOSPI/KOSDAQ 각각 상승/하락 1위와 TOP3 첫 번째 항목은 반드시 일치해야 한다.

## 7. AI/RAG/Agentic 기준

AI는 화면에서 명확하게 유용해야 한다.

AI는 사고 과정을 그대로 보여주지 않는다.

절대 금지:

- chain-of-thought 노출
- 내부 추론 전문 노출
- "제가 단계별로 생각해보면..." 같은 표현
- 근거 없는 확정 표현
- 출처 없는 단정

사용자에게 보여줄 것:

- 한 줄 결론
- 핵심 근거
- 반대 신호
- 리스크
- 초보자 설명
- 데이터 기준일
- 신뢰도
- 한계
- 출처
- 다음 확인 체크리스트

필수 AI 영역:

- AI 시장 요약
- AI 차트 해석
- AI 매수/매도 검토 구간 설명
- AI 리스크 요약
- AI 용어 설명
- AI 포트폴리오 점검

RAG 대상:

- daily summaries
- stock events
- OHLCV/chart signals
- search results
- learning terms
- portfolio sandbox
- 추후 DART/news/disclosure

Agentic 내부 역할:

- Data Collector
- Event Detector
- Evidence Ranker
- Beginner Explainer
- Risk Reviewer
- Response Composer

이 역할은 사용자에게 사고 과정으로 노출하지 말고, 코드/서비스 구조와 응답 품질에 반영한다.

## 8. DevOps/배포 기준

필수:

- Docker Compose 전체 실행 유지
- `.env.example` 최신화
- secret commit 방지
- healthcheck 유지
- frontend/backend/marketdata/ai-service 실행 경로 문서화
- 로그와 장애 확인 방법 문서화
- 배포 구조 검토
- 최종 단계에서 build/quality/API 검증

금지:

- `.env`
- `.env.*`
- API key
- DB password
- Discord webhook
- OpenAI key
- admin key
- 실제 secret 값 commit

## 9. 하네스 엔지니어링 반복 루프

다음 AI는 아래 루프를 따른다.

1. Intent Understanding
   - 사용자의 불만과 최종 목표를 다시 정리한다.
   - 핵심은 프론트 전면 재설계, 차트 중심, AI 근거, 학습 강화, 버튼 단순화, Toss급 UI/UX, 기존 기능 보존이다.

2. Current State Audit
   - 실제 코드와 화면을 본다.
   - PC 1440px, mobile 390px를 확인한다.
   - 문서의 완료 체크를 그대로 믿지 않는다.

3. Multi-Perspective Scoring
   - 사용자 관점 500점
   - 프론트엔드 개발자 관점 500점
   - 백엔드 개발자 관점 500점
   - AI 엔지니어 관점 500점
   - DevOps 관점 500점
   - VC/투자자 관점 500점

4. Gap Analysis
   - 495점 미만 항목의 원인을 화면/코드/API 기준으로 적는다.
   - 감상평이 아니라 재현 가능한 문제로 남긴다.

5. Reference Research
   - 점수가 부족하면 고품질 서비스 5곳 이상을 참고한다.
   - Toss, 증권 앱, 고품질 핀테크, AI SaaS, 데이터 대시보드, 모바일 앱 수준 웹 UX를 비교한다.

6. Plan
   - 제품 IA, 프론트 구조, 백엔드 API, AI/RAG, DevOps, 검증 범위를 작은 작업 단위로 나눈다.

7. Implement
   - 작은 단위로 구현한다.
   - 기존 기능을 삭제하지 않는다.
   - 일반 사용자 기능과 관리자 기능을 분리한다.
   - 유지보수성, 재사용성, 가독성을 지킨다.

8. Fast Verify
   - 개발 중에는 무거운 테스트를 매번 돌리지 않는다.
   - 빠른 검증을 우선한다.

   빠른 검증:
   - `npm run build`
   - PC 1440px 화면 확인
   - mobile 390px 화면 확인
   - 검색 결과 clipping 없음
   - tooltip clipping 없음
   - AI 패널 잘림 없음
   - 차트 UI 깨짐 없음
   - 학습 탭 내용 충분성 확인
   - 수정한 API만 빠르게 호출

   최종 직전 검증:
   - backend compile/test
   - frontend E2E
   - `make health`
   - `make quality`
   - Docker rebuild/health
   - API 전체 검증

9. Re-score
   - 모든 관점이 495/500 이상인지 다시 평가한다.
   - 하나라도 미달이면 Gap Analysis로 돌아간다.

10. Report
   - 검증된 내용만 보고한다.
   - 실패/미확인 항목은 반드시 실패/미확인으로 쓴다.
   - 완료라고 포장하지 않는다.

실제 작업 세션에서 도구가 멈추거나 시간이 부족하면, 거짓으로 완료 처리하지 말고 다음 루프에서 이어갈 항목을 명확히 남긴다.

## 10. 완료 조건

아래 조건을 모두 만족해야 완료로 본다.

- 첫 화면이 완전히 새 제품처럼 보인다.
- PC와 모바일에서 잘림, 겹침, 끝 붙음이 없다.
- 버튼이 적고 명확하다.
- 검색, 차트, AI가 첫 화면의 핵심이다.
- 그래프가 주인공이다.
- 관심 후보와 매수/매도 검토 구간이 차트 중심으로 이해된다.
- AI 기능이 명확하고 근거 중심이다.
- AI 사고 과정은 노출하지 않는다.
- 배우기 기능이 초보자 retention에 충분하다.
- 기존 브리프/달력/생성/백필/보관/검증 기능이 삭제되지 않았다.
- 일반 사용자와 관리자 기능이 분리되어 있다.
- 유지보수성, 재사용성, 가독성이 좋다.
- Docker/배포/운영을 고려한다.
- `.env`와 secret이 commit되지 않았다.
- 사용자, 프론트, 백엔드, AI, DevOps, VC 관점 모두 495/500 이상이다.

## 11. 다음 AI에게 전달할 최종 종합 프롬프트

아래 프롬프트를 그대로 전달한다.

```text
너는 kr-stock-daily-brief 프로젝트를 이어받아 출시급 웹 플랫폼으로 완성하는 시니어 제품 엔지니어 팀이다.

너는 한 명이지만 아래 역할을 모두 수행한다고 가정한다.
- Toss에서 10년차 이상, 연봉 1억 이상을 받는 프론트엔드 개발자
- 대규모 API와 데이터 정확도를 책임지는 백엔드 개발자
- AI/RAG/Agentic/Harness를 제품에 녹이는 AI 엔지니어
- Docker/배포/운영 안정성을 책임지는 DevOps 엔지니어
- 사용자가 첫 화면에서 감탄할 수 있는 제품 디자이너
- 완료 보고를 믿지 않고 실제 화면/코드/API로 검증하는 독립 감독관

프로젝트 경로:
/Users/rose/Desktop/git/kr-stock-daily-brief

가장 중요한 기준 문서:
1. docs/FRONTEND_REBUILD_AUDIT_AND_NEXT_AI_PROMPT.md
2. docs/ALL_AI_HANDOFF_PROMPTS_SYNTHESIS_20260505_V1.md
3. docs/FRONTEND_FIRST_FULL_REDESIGN_PROMPT_20260505.md
4. docs/PLATFORM_TEAM_MASTER_GOAL_PROMPT.md
5. docs/GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md
6. docs/AI_DEVELOPMENT_DIRECTION_AND_PROMPT.md
7. docs/AI_HANDOFF_PROMPT.md
8. docs/AI_SELF_REVIEW_QUALITY_PROMPT.md

우선순위:
1. Frontend
2. Backend
3. AI
4. DevOps
5. Docs

이번 목표:
기존 화면 위에 덧칠하지 말고, 프론트가 없다고 생각하고 첫 화면부터 전면 재설계해라.
최종 제품은 "초보자가 한국 주식을 차트, AI 근거, 쉬운 용어 설명, 관심 후보, 조건형 매수/매도 검토 시나리오로 배우고 비교하는 프리미엄 AI 주식 리서치 웹 플랫폼"이다.

사용자가 현재 불만인 점:
- 화면이 크게 바뀐 것처럼 보이지 않는다.
- 버튼이 너무 많고 복잡하다.
- Toss처럼 깔끔하고 고급스럽지 않다.
- 애니메이션과 depth가 약하다.
- 첫 화면에서 이 서비스가 무엇이고 왜 좋은지 바로 알기 어렵다.
- 원하는 산업, 테마, 기업, 종목을 검색하는 경험이 부족하다.
- VC 투자자 관점에서 어디가 AI 기능인지, 왜 확장 가능한지 보이지 않는다.
- 그래프를 기준으로 실제 공부되는 느낌이 약하다.
- 학습 탭의 용어 설명이 적고 얕다.
- 기존 기능이 사라졌거나 숨겨진 것처럼 느껴진다.
- PC와 모바일에서 잘림, 겹침, 화면 끝 붙음 같은 세부 품질 문제가 있다.

프론트 지시:
- docs/FRONTEND_REBUILD_AUDIT_AND_NEXT_AI_PROMPT.md를 1순위로 본다.
- 기존 App.jsx/styles.css에 계속 기능을 덧붙이는 방식은 피한다.
- 필요하면 App shell, Header, Search, Chart workspace, AI panel, Learning, Portfolio, Admin, hooks, API client, CSS token을 새로 나눈다.
- 첫 화면은 정보 과부하 금지다.
- 첫 화면에는 통합 검색, 메인 차트, AI 핵심 인사이트, 관심 후보 3개 이하, 학습 진입점, 데이터 기준일만 선명하게 둔다.
- 긴 브리프, 검증 상세, 수집 노트, 생성/백필/보관, 긴 TOP 리스트, 외부 링크 반복은 숨기거나 관리자/기록 영역으로 이동한다.
- 버튼은 모바일 앱처럼 적고 명확해야 한다. 전면 primary action은 1~3개만 둔다.
- Pretendard를 한국어/영어 기본 폰트로 적용한다.
- Toss처럼 단정하고 신뢰감 있으며, 심플하지만 심심하지 않은 UI로 만든다.
- glassmorphism은 과하지 않게 사용한다. 반투명, blur, 얇은 border, 깊이감 있는 shadow, 150~320ms micro interaction을 절제해서 사용한다.
- 장식용 효과로 품질을 덮지 말고, 데이터와 차트가 주인공이 되게 한다.

검색 지시:
- 산업, 테마, 기업명, 종목명, 종목코드, 시장, 주식 용어, 오늘 움직인 종목을 검색하게 만든다.
- 검색 결과에는 종목명/코드, 시장, 최근 등락률, 관련 산업/테마, 차트 보기, AI 설명, 초보자 한 줄 설명을 보여준다.
- 검색 결과가 PC/mobile에서 잘리거나 hero 영역에 갇히면 실패다.
- 검색 실패 시 추천 검색어, 오늘 관심 후보, AI에게 질문하기를 제공한다.

차트 지시:
- 그래프가 제품의 메인이다.
- 일봉/주봉/월봉 전환을 자연스럽게 구현한다.
- 가격, 거래량, 이동평균선, 이벤트 마커, 공시/뉴스/언급량 마커, AI 해석 마커를 보여준다.
- 차트 위에 매수 검토, 분할매수 검토, 관망, 매도 검토, 리스크 관리 구간을 표시한다.
- 마커 hover/tap 시 tooltip에 의미, 초보자 설명, 근거, 반대 신호, 리스크, 기준일, 신뢰도, 관련 용어를 보여준다.
- tooltip은 PC와 모바일 모두에서 절대 잘리면 안 된다.

관심 후보와 매수/매도 UX:
- 사용자는 어디를 봐야 하고, 왜 봐야 하며, 언제 매수/매도를 검토할 수 있는지 알고 싶어 한다.
- 단정형 투자 지시가 아니라 조건형/교육형/시나리오형으로 제공한다.
- 금지 표현: 지금 사라, 지금 팔아라, 무조건 추천, 반드시 오른다, 수익 보장.
- 허용 표현: 관심 후보, 살펴볼 만한 이유, 매수 검토 구간, 분할매수 검토 구간, 관망, 매도 검토 구간, 리스크 관리 구간, 이 조건이 확인되면 검토, 이 반대 신호가 나오면 보류.
- 각 후보에는 왜 관심 후보인지, 산업/테마, 차트 상태, 매수 검토 조건, 매도 검토 조건, 관망 조건, 리스크, 초보자 체크리스트, AI 근거 요약, 기준일, 신뢰도를 보여준다.

학습 지시:
- 학습 탭은 부가 기능이 아니라 초보자 retention의 핵심이다.
- 각 용어에는 핵심 요약 한 줄, 최소 3줄 이상의 쉬운 설명, 차트에서 어디에 보이는지, 왜 중요한지, 초보자 오해, 실제 시나리오 예시, 관련 차트 구간, 관련 질문, AI에게 물어보기 진입점을 제공한다.
- 우선 용어: 등락률, 거래량, 거래대금, PER, PBR, ROE, 공시, DART, 일봉, 주봉, 월봉, 이동평균선, 손절, 분할매수, 추세, 저항선, 지지선, 변동성, 거래정지, 시가총액, 섹터, 테마, 수급.

백엔드 지시:
- 기존 summaries API, 날짜별 조회, 최신 조회, 통계, 인사이트, 생성, 백필, 보관 기능을 삭제하지 않는다.
- 검색 API, 종목 차트 API, 이벤트 API, trade-zones API, 포트폴리오 API, AI chat API, 용어 학습 API가 프론트에서 쓰기 쉬운 구조인지 확인하고 부족하면 구현한다.
- 관리자 API와 일반 사용자 API를 분리한다.
- API_SPEC.md와 실제 controller endpoint를 맞춘다.
- pykrx의 get_market_price_change_by_ticker() 등락률을 그대로 믿지 않는다. OHLCV 당일/전일 종가로 직접 계산한다.
- 거래량 0, 비정상 종목코드, 거래정지 의심 종목을 필터링한다.
- KOSPI/KOSDAQ 상승/하락 1위와 TOP3 첫 항목은 반드시 일치해야 한다.

AI 지시:
- AI는 제품의 핵심 가치로 보여야 하지만 내부 사고 과정은 노출하지 않는다.
- chain-of-thought, 내부 추론 전문, "제가 단계별로 생각해보면..." 같은 표현은 금지한다.
- 사용자에게는 한 줄 결론, 근거, 반대 신호, 리스크, 초보자 설명, 기준일, 신뢰도, 한계, 출처, 다음 확인 체크리스트만 보여준다.
- AI 시장 요약, AI 차트 해석, AI 매수/매도 검토 구간 설명, AI 리스크 요약, AI 용어 설명, AI 포트폴리오 점검을 화면에서 명확히 보이게 한다.
- RAG 대상은 daily summaries, stock events, OHLCV/chart signals, search results, learning terms, portfolio sandbox, 추후 DART/news/disclosure다.
- Agentic 역할은 Data Collector, Event Detector, Evidence Ranker, Beginner Explainer, Risk Reviewer, Response Composer로 구성하되 사용자에게 사고 과정으로 보여주지 않는다.

DevOps 지시:
- Docker Compose 전체 실행을 유지한다.
- .env.example은 최신화하되 실제 secret 값은 절대 넣지 않는다.
- .env, .env.*, API key, DB password, Discord webhook, OpenAI key, admin key는 절대 commit하지 않는다.
- healthcheck, 로그 확인 방법, 장애 확인 방법, 배포 점검 절차를 유지한다.
- 의미 있는 작업 단위로 commit하고 가능하면 push한다.

하네스 엔지니어링 루프:
1. 문서를 읽고 사용자의 불만과 목표를 다시 정리한다.
2. 실제 코드와 화면을 본다. 문서의 완료 체크나 이전 AI의 완료 보고를 믿지 않는다.
3. 사용자, 프론트, 백엔드, AI, DevOps, VC 관점으로 각각 500점 만점 평가한다.
4. 495점 미만 항목의 원인을 화면/코드/API 기준으로 적는다.
5. 부족하면 Toss, 증권 앱, 고품질 핀테크, AI SaaS, 데이터 대시보드 등 5곳 이상을 참고한다.
6. 작은 작업 단위로 계획을 세운다.
7. 구현한다.
8. 개발 중에는 무거운 E2E/Docker/smoke를 매번 돌리지 말고 빠른 build/화면/API 검증을 반복한다.
9. PC 1440px, mobile 390px에서 검색, 차트, tooltip, AI 패널, 학습 탭, 포트폴리오가 잘리거나 겹치지 않는지 확인한다.
10. 다시 점수화한다.
11. 하나라도 495/500 미만이면 다시 Gap Analysis와 구현으로 돌아간다.
12. 실제 도구가 멈추거나 시간이 부족하면 거짓 완료 보고를 하지 말고 미확인/부분 완료/다음 루프 항목을 정확히 남긴다.

빠른 검증:
- npm run build
- PC 1440px 화면 확인
- mobile 390px 화면 확인
- 검색 결과 clipping 없음
- tooltip clipping 없음
- AI 패널 clipping 없음
- 차트 UI 깨짐 없음
- 학습 탭 내용 충분성 확인
- 수정한 API만 빠르게 호출

최종 직전 검증:
- backend compile/test
- frontend E2E
- make health
- make quality
- Docker rebuild/health
- API 전체 검증
- secret 검사
- 투자 금지 표현 검사

완료 조건:
- 첫 화면이 완전히 새 제품처럼 보인다.
- 검색, 차트, AI가 첫 화면의 핵심이다.
- 버튼이 적고 명확하다.
- 그래프가 주인공이다.
- 관심 후보와 매수/매도 검토 구간이 차트 중심으로 이해된다.
- AI 기능이 명확하고 근거 중심이다.
- AI 사고 과정은 노출하지 않는다.
- 배우기 기능이 초보자 retention에 충분하다.
- 기존 브리프/달력/생성/백필/보관/검증 기능이 삭제되지 않았다.
- 일반 사용자와 관리자 기능이 분리되어 있다.
- 유지보수성, 재사용성, 가독성이 좋다.
- PC와 모바일에서 잘림, 겹침, 끝 붙음이 없다.
- .env와 secret이 commit되지 않았다.
- 사용자, 프론트, 백엔드, AI, DevOps, VC 관점 모두 495/500 이상이다.

최종 보고에는 반드시 포함한다:
1. 무엇을 전면 재설계했는지
2. 보존한 기존 기능
3. 새로 구현한 기능
4. 해결한 MD 요구사항 체크리스트
5. 실행한 검증
6. 미실행/실패/미확인 검증
7. 남은 리스크
8. 사용자/프론트/백엔드/AI/DevOps/VC 관점 점수
9. commit hash
10. push 여부
11. 다음 작업
```

## 12. `/goal`에 넣을 짧은 프롬프트

```text
/Users/rose/Desktop/git/kr-stock-daily-brief/docs/ALL_AI_HANDOFF_PROMPTS_SYNTHESIS_20260505_V1.md 를 먼저 읽고 그대로 수행해. 특히 docs/FRONTEND_REBUILD_AUDIT_AND_NEXT_AI_PROMPT.md를 1순위로 두고, 프론트가 없다고 생각하고 검색/차트/AI/학습 중심의 Toss급 한국 주식 AI 리서치 플랫폼으로 전면 재설계해. 기존 기능은 삭제하지 말고 사용자/관리자 영역으로 분리해. 차트에는 일봉/주봉/월봉, 이벤트 마커, 관심 후보, 매수 검토/분할매수/관망/매도 검토/리스크 관리 구간을 조건형으로 보여줘. AI는 chain-of-thought 없이 결론/근거/반대신호/리스크/출처/신뢰도/기준일만 보여줘. 개발 중에는 무거운 테스트를 매번 돌리지 말고 빠른 build/PC 1440/mobile 390 화면 검증으로 반복해. 사용자·프론트·백엔드·AI·DevOps·VC 관점 495/500 미만이면 다시 보완하고, .env와 secret은 절대 commit하지 말고, 완료 시 검증 결과·commit hash·push 여부를 보고해.
```

