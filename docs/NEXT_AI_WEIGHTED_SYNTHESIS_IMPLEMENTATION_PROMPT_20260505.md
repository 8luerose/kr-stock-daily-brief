# Next AI 핵심 구현 프롬프트

작성일: 2026-05-05

프로젝트 경로:

`/Users/rose/Desktop/git/kr-stock-daily-brief`

## 0. 목적

이 문서는 다른 AI에게 그대로 전달할 짧은 실행 프롬프트다.

목표는 프론트를 다시 갈아엎는 것이 아니다. 현재 몰입형 앱 UI 방향을 유지하면서, 부족한 백엔드/AI/학습 설명과 PC 반응형 완성도를 정확히 보강한다.

품질 기준은 `토스에서 10년차 이상, 연봉 1억 이상을 받는 프론트엔드, 백엔드, DevOps, AI 엔지니어가 함께 만든 서비스`처럼 보이게 하는 것이다. 단순히 기능이 붙은 앱이 아니라, 사용자가 "AI가 진짜 차트와 근거를 읽어준다"고 느끼게 만들어라.

## 1. 반드시 우선 참고할 문서

최근 문서일수록 우선순위를 높게 둔다.

1. `docs/NEXT_AI_BACKEND_LEARNING_ENRICHMENT_PROMPT_20260505.md`
2. `docs/API_SPEC.md`
3. `docs/DB_TABLES.md`
4. `docs/ERD.md`
5. `docs/PC_RESPONSIVE_REFINEMENT_PROMPT_20260505.md`
6. `docs/NEXT_AI_UI_FIX_PROMPT_20260505.md`
7. `docs/FRONTEND_FOLLOWUP_IMPLEMENTATION_PROMPT_20260505_V1.md`

예전 문서에 있는 `프론트 전체 삭제`, `프론트 전면 재작성`, `처음부터 다시 설계` 지시는 이번 작업에서 제외한다. 다만 차트 중심, AI 근거 설명, 초보자 학습, 조건형 매수/매도 검토, 투자 표현 안전성은 유지한다.

## 2. 이번 작업의 핵심 부족분

아래 5개를 먼저 실제 코드와 화면에서 확인하고 부족한 부분만 구현한다.

1. 이동평균선이 왜 중요한지 설명이 부족하다.
2. 언제 매수 검토, 관망, 매도 검토, 리스크 관리를 해야 하는지 AI 설명이 부족하다.
3. 이벤트가 호재인지 악재인지, 왜 그렇게 볼 수 있는지 설명이 부족하다.
4. 학습 탭이 용어 사전 수준에 머물고, 차트와 연결된 학습 경험이 약하다.
5. 모바일은 괜찮지만 PC 1440px에서 같은 수준의 몰입형 사용 경험이 부족하다.

## 3. 백엔드 구현 지시

우선 확인 파일:

- `backend/src/main/java/com/krbrief/stocks/StockTradeZoneService.java`
- `backend/src/main/java/com/krbrief/stocks/StockTradeZonesDto.java`
- `backend/src/main/java/com/krbrief/stocks/StockEventsDto.java`
- `backend/src/main/java/com/krbrief/ai/AiChatContextEnricher.java`
- `backend/src/main/java/com/krbrief/learning/LearningTermCatalog.java`
- `backend/src/main/java/com/krbrief/portfolio/PortfolioService.java`

`GET /api/stocks/{code}/trade-zones`를 보강한다. 기존 필드는 깨지 말고 새 필드를 추가한다.

필수로 설명할 지표:

- 5일, 20일, 60일 이동평균선
- 현재가가 20일선 위인지 아래인지
- 20일선 기울기
- 최근 지지선과 저항선
- 거래량 강도
- 현재 추세 단계

추가할 구조 예시:

- `indicatorSnapshot`
  - `basisDate`
  - `latestClose`
  - `movingAverages`
  - `priceVsMa20`
  - `ma20Slope`
  - `trendStage`
  - `volumeStrength`
  - `supportLevel`
  - `resistanceLevel`
  - `beginnerExplanation`
- `currentDecisionSummary`
  - `state`
  - `summary`
  - `buyReviewCondition`
  - `sellReviewCondition`
  - `watchCondition`
  - `riskCondition`
  - `oppositeSignal`
  - `confidence`
  - `limitations`

5대 거래 구간은 반드시 유지한다.

- 매수 검토 구간
- 분할매수 검토 구간
- 관망 구간
- 매도 검토 구간
- 리스크 관리 구간

각 구간에는 `condition`, `evidence`, `oppositeSignal`, `confidence`, `basisDate`, `beginnerExplanation`, `goodScenario`, `badScenario`를 최대한 포함한다.

## 4. 이벤트와 호재/악재 설명

`GET /api/stocks/{code}/events`는 가격/거래량 이벤트를 단순 표시하지 말고, 사용자가 아래를 이해하게 만들어야 한다.

- 호재로 볼 수 있는 이유
- 악재로 볼 수 있는 이유
- 중립 또는 확인 필요로 봐야 하는 이유
- 반대 해석
- 근거 수준
- 신뢰도
- 출처 한계

추가 또는 보강할 필드:

- `sentimentForPrice`
- `positiveReasons`
- `negativeReasons`
- `neutralReasons`
- `whyItMatters`
- `oppositeInterpretation`
- `evidenceLevel`
- `sourceLimitations`

뉴스/공시 본문 확인이 약하면 절대 확정 원인처럼 쓰지 말고 `후보 근거`, `확인 필요`, `낮은 신뢰도`로 표시한다.

## 5. AI 응답 구현 지시

우선 확인 파일:

- `backend/src/main/java/com/krbrief/ai/AiChatContextEnricher.java`
- `backend/src/main/java/com/krbrief/ai/AiChatController.java`
- `ai-service/app/main.py`

`/api/ai/chat`은 context가 부족해도 backend가 검색, 최신 브리프, 차트, 이벤트, trade-zones, indicatorSnapshot, 학습 용어를 보강해야 한다.

AI structured 응답은 아래 항목을 포함한다.

- `conclusion`
- `movingAverageExplanation`
- `chartState`
- `buyReview`
- `sellReview`
- `watchReview`
- `riskManagement`
- `positiveFactors`
- `negativeFactors`
- `opposingSignals`
- `beginnerExplanation`
- `beginnerChecklist`
- `sources`
- `confidence`
- `basisDate`
- `limitations`

AI는 내부 사고 과정을 보여주지 않는다. 근거 없는 확정 표현을 하지 않는다. "지금 사라/팔아라" 대신 "이 조건이 확인되면 검토", "이 반대 신호가 나오면 보류"라고 말한다.

## 6. 학습 콘텐츠 보강

`LearningTermCatalog`를 확인하고 얕은 항목만 보강한다.

특히 아래 용어는 차트와 연결해 설명한다.

- 이동평균선
- 거래량
- 거래대금
- 등락률
- 지지선
- 저항선
- 추세
- 손절
- 분할매수
- 일봉
- 주봉
- 월봉
- 공시
- DART
- PER
- PBR
- ROE

각 용어에는 `coreSummary`, `plainDefinition`, `longExplanation`, `whyItMatters`, `chartUsage`, `commonMisunderstanding`, `scenario`, `relatedQuestions`를 포함한다.

이동평균선 설명에는 반드시 아래를 넣는다.

- 5일선은 단기 흐름
- 20일선은 약 한 달 평균 흐름
- 60일선은 중기 흐름
- 이동평균선 위라고 무조건 좋은 것은 아님
- 이동평균선 아래라고 무조건 나쁜 것은 아님
- 거래량, 지지선, 저항선, 이벤트와 함께 봐야 함

## 7. 프론트 구현 지시

프론트는 전면 재작성하지 않는다. 현재 UI 방향을 유지하고 새 백엔드/AI 필드만 자연스럽게 노출한다.

우선 확인 파일:

- `frontend/src/app/App.jsx`
- `frontend/src/app/App.module.css`
- `frontend/src/components/ImmersiveChart.jsx`
- `frontend/src/components/FloatingAiCard.jsx`
- `frontend/src/components/DeepDiveLearningSheet.jsx`
- `frontend/src/components/PortfolioSandbox.jsx`
- 각 `.module.css`

해야 할 일:

- 차트 또는 AI 카드에서 이동평균선 설명을 볼 수 있게 한다.
- 5대 거래 구간의 조건, 근거, 반대 신호, 초보자 설명이 잘리지 않게 한다.
- 이벤트가 호재/악재인지와 이유를 보여준다.
- 학습 시트에서 차트에서 보는 법, 흔한 오해, 시나리오가 보이게 한다.
- PC 1440px에서도 모바일처럼 정돈된 몰입형 경험이 나오게 한다.

반응형 규칙:

- FloatingAiCard는 첫 진입 시 요약 상태로 시작한다.
- FloatingAiCard는 하단 중앙에 안정적으로 배치한다.
- 우측 상단 버튼들은 flex column 그룹으로 묶어 겹치지 않게 한다.
- 텍스트는 `white-space: nowrap` 때문에 잘리면 안 된다.
- 설명 텍스트에는 `white-space: normal`, `word-break: keep-all`, `overflow-wrap: anywhere`를 상황에 맞게 쓴다.
- flex 자식에는 필요하면 `min-width: 0`, `flex: 1`을 준다.
- PortfolioSandbox는 내용이 잘리거나 아래가 빈 공란으로 보이면 안 된다.

## 8. 테스트 지시

테스트와 스모크 테스트에 많은 시간을 쓰지 마라. 구현 중에는 필요한 것만 빠르게 확인한다.

개발 중 빠른 확인:

- `git diff --check`
- 수정한 backend 단위 테스트 1~2개
- 수정한 frontend build 1회
- 바꾼 API curl 1~2개
- PC 1440px와 mobile 390px 화면만 빠르게 확인

무거운 검증은 마지막에만 한다.

- `./gradlew test`
- `npm run build`
- `npm run test:e2e`
- `./scripts/test_all_apis.sh`
- `./scripts/verify_investment_language.sh`
- `make health`

LLM credential이 없으면 live LLM 벤치마크에 시간을 쓰지 말고 fallback 상태라고 보고한다.

## 9. 완료 조건

- 이동평균선 설명이 화면과 AI 응답에 반영됨
- 매수 검토, 관망, 매도 검토, 리스크 관리 조건이 근거와 함께 설명됨
- 호재/악재 이유와 반대 해석이 보임
- 학습 용어가 차트와 연결됨
- PC 1440px와 mobile 390px에서 잘림, 겹침, 화면 밖 이탈이 없음
- 기존 브리프, 검색, 차트, 학습, 포트폴리오, 관리자 기능이 삭제되지 않음
- `.env`와 secret이 commit되지 않음

## 10. 최종 보고 양식

1. 구현한 백엔드/AI/학습 보강
2. 이동평균선, 매수/매도 검토, 호재/악재 설명 개선 내용
3. 프론트 변경 내용
4. PC 1440px와 mobile 390px 확인 결과
5. 짧게 실행한 테스트 결과
6. 남은 리스크
7. secret commit 여부
8. commit hash와 push 여부

커밋 메시지 예시:

`[FEAT]: (1) 차트 지표 설명과 거래 구간 근거 보강 / (2) AI 학습형 응답 구조 확장 / (3) PC와 모바일 설명 UI 검증`

## 11. 짧은 `/goal`

```text
/Users/rose/Desktop/git/kr-stock-daily-brief/docs/NEXT_AI_WEIGHTED_SYNTHESIS_IMPLEMENTATION_PROMPT_20260505.md 를 기준으로 구현해. 최신 MD 요구를 우선하고 오래된 프론트 전면 재작성 지시는 제외해. 현재 몰입형 UI는 유지하면서 이동평균선 설명, 매수/매도 검토 조건, 호재/악재 이유, 초보자 학습 시나리오를 백엔드/API/AI/화면에 반영해. 토스 10년차 연봉 1억급 프론트·백엔드·DevOps·AI 엔지니어가 만든 수준으로 마감하되, 테스트와 스모크 테스트에 많은 시간 쓰지 말고 마지막에만 핵심 검증해. .env와 secret은 절대 commit하지 말고 완료 시 commit hash와 push 여부를 보고해.
```
