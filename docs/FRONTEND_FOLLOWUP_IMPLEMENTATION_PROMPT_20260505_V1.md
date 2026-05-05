# Frontend Follow-up Implementation Prompt 20260505 V1

이 문서는 `/Users/rose/Desktop/git/kr-stock-daily-brief/docs/FRONTEND_RESET_FROM_SCRATCH_GOAL_PROMPT_20260505_V1.md`를 기반으로 만든 후속 구현 프롬프트다.

중요한 변화가 있다.

이제 프론트를 다시 지우고 처음부터 만들지 않는다.
현재 다른 AI가 구현한 몰입형 차트 UI 방향은 마음에 든다.
따라서 이번 목표는 `전면 재시작`이 아니라 `현재 새 프론트 디자인을 보존하면서 기능 문제, 미구현 요구사항, 검증 체계를 완성하는 것`이다.

---

## 0. 다른 AI에게 전달할 실행 프롬프트

아래 내용을 그대로 읽고 수행하라.

```text
/Users/rose/Desktop/git/kr-stock-daily-brief/docs/FRONTEND_FOLLOWUP_IMPLEMENTATION_PROMPT_20260505_V1.md 이 문서 하나를 기준으로 수행해.

기존 reset 문서의 최종 목표는 유지하되, 이제 프론트를 지우고 다시 처음부터 만들지 마라.
현재 구현된 몰입형 차트 중심 UI는 마음에 든다.
이 방향을 보존하면서 기능 문제와 미구현 요구사항을 고쳐라.

백엔드 기능은 삭제하지 말고 보존해라.
.env와 secret은 절대 commit하지 마라.
개발 초반에 E2E, Docker, make quality, 전체 API 테스트에 시간을 쓰지 마라.
먼저 실제 기능과 화면 문제를 고쳐라.

반드시 아래 루프를 반복해라.
1. 이 문서와 기존 reset 문서를 읽고 요구사항을 확인한다.
2. 현재 구현된 항목과 미구현 항목을 나눈다.
3. 미구현/오작동 항목을 우선순위대로 구현한다.
4. PC 1440px와 mobile 390px에서 화면 잘림, 겹침, 사용 흐름을 빠르게 확인한다.
5. 사용자, 프론트, 백엔드, DevOps, AI, 투자자 관점에서 각각 500점 만점으로 평가한다.
6. 하나라도 495점 미만이거나 기능상 문제가 남아 있으면 다시 구현 단계로 돌아간다.
7. 핵심 구현이 끝난 뒤 마지막에만 build, E2E, Docker, make quality, API, secret 검증을 실행한다.

완료 보고에는 구현한 것, 고친 기능 문제, 아직 남은 리스크, 실행한 검증, 실패/미확인 검증, commit hash, push 여부를 반드시 포함해라.
```

---

## 1. 현재 구현 상태 요약

현재 프론트는 기존 카드형 대시보드 느낌에서 벗어나 몰입형 차트 앱 형태로 크게 바뀌었다.

확인한 주요 파일:

- `frontend/src/app/App.jsx`
- `frontend/src/components/ImmersiveChart.jsx`
- `frontend/src/components/SpotlightSearch.jsx`
- `frontend/src/components/FloatingAiCard.jsx`
- `frontend/src/components/FloatingLearningMode.jsx`
- `frontend/src/components/DeepDiveLearningSheet.jsx`
- `frontend/src/components/PortfolioSandbox.jsx`
- `frontend/src/components/HiddenAdminSheet.jsx`
- `frontend/src/hooks/useWorkspace.js`
- `frontend/src/services/apiClient.js`
- `frontend/src/data/fallbackData.js`
- `frontend/tests/frontend-quality.spec.js`

최신 커밋 흐름상 현재 프론트는 아래 방향으로 구현되어 있다.

- 몰입형 전체 화면 차트 UI
- Recharts 기반 메인 차트
- Spotlight 검색
- 플로팅 AI 카드
- 차트 위 직접 주석과 매수/관망 구간
- 초보자 학습 모드
- 딥다이브 학습 시트
- 포트폴리오 샌드박스
- 숨겨진 관리자 콘솔

---

## 2. 구현된 항목

### 2.1 제품 방향

- 버튼이 적은 앱형 UI로 바뀌었다.
- 차트가 첫 화면의 중심이 되었다.
- 기존 “긴 브리프/운영 버튼이 많은 화면” 느낌은 상당히 제거되었다.
- 어두운 전체 화면 차트, 플로팅 검색, 플로팅 AI 카드로 새 제품처럼 보인다.
- 기존 reset 문서의 “그래프가 메인이다”, “밋밋한 2D 화면처럼 보이면 실패다” 요구에는 상당히 가까워졌다.

### 2.2 프론트 구조

- `App.jsx`에서 화면을 `SpotlightSearch`, `ImmersiveChart`, `FloatingAiCard`, `FloatingLearningMode`, `DeepDiveLearningSheet`, `PortfolioSandbox`, `HiddenAdminSheet`로 분리했다.
- `useWorkspace` 훅에서 종목, 주기, 데이터 로딩, 검색을 관리한다.
- `apiClient.js`에서 검색, 차트, 이벤트, 거래 구간, AI, 학습, 요약/관리자 API 호출을 정리했다.
- CSS Module 기반으로 컴포넌트별 스타일이 분리되어 있다.

### 2.3 첫 화면

- 통합 검색에 해당하는 `SpotlightSearch`가 있다.
- 메인 차트에 해당하는 `ImmersiveChart`가 있다.
- AI 예측 요약에 해당하는 `FloatingAiCard`가 있다.
- 초보자 설명 토글에 해당하는 `FloatingLearningMode`가 있다.
- 포트폴리오 진입 버튼이 있다.
- 일반 사용자가 긴 브리프 전문이나 관리자 버튼을 바로 보지 않게 되었다.

### 2.4 검색

- 기업명, 종목코드, 테마, 용어 기반 검색을 시도한다.
- 원격 `/api/search` 호출 후 fallback 검색 결과와 합친다.
- 검색 결과 없음 상태에서 추천 칩과 AI 질문 버튼을 보여준다.
- 검색 결과에는 종목명, 코드, 초보자 설명, 등락률 일부가 표시된다.

### 2.5 차트

- Recharts 기반으로 가격 흐름을 표시한다.
- 일/주/月 주기 전환 버튼이 있다.
- 이벤트 지점을 `ReferenceDot`으로 표시한다.
- 매수 검토 구간에 해당하는 `ReferenceArea`가 있다.
- 저항선에 해당하는 `ReferenceLine`이 있다.
- 학습 모드에서 tooltip 안에 거래량 설명이 나타난다.

### 2.6 AI 패널

- 플로팅 AI 카드가 현재 방향성과 결론을 보여준다.
- 확장 시 호재/악재, 매매 검토 시점, 관망 시나리오, 기준일, 신뢰도를 보여주려는 구조가 있다.
- 내부 사고 과정 또는 chain-of-thought 노출은 확인되지 않았다.

### 2.7 학습

- 초보자 설명 토글이 있다.
- 딥다이브 학습 시트가 있다.
- 거래량에 대한 핵심 설명, 쉬운 설명, 오해, 시나리오가 표시된다.

### 2.8 포트폴리오 샌드박스

- 포트폴리오 샌드박스 시트가 있다.
- 현재 종목을 가상 포트폴리오에 담고 비중을 조절하는 UI가 있다.
- AI 포트폴리오 점검 카드가 나타난다.

### 2.9 관리자 기능 보존

- `HiddenAdminSheet`가 존재한다.
- 관리자 키 입력 후 브리프 생성, 데이터 백필, 데이터 검증을 호출하는 구조가 있다.
- `apiClient.js`에 `loadSummaryArchive`, `runAdminAction`이 남아 있다.

---

## 3. 구현되지 않았거나 부족한 항목

아래 항목은 현재 코드 기준으로 보이는 부족점이다.
실제 실행 화면에서도 다시 확인해야 한다.

### 3.1 첫 화면 필수 정보가 접혀 있거나 불완전함

- AI 카드가 기본적으로 접혀 있어, 첫 화면에서 매수/매도 검토 조건과 호재/악재가 바로 보이지 않을 수 있다.
- 기존 reset 문서는 첫 화면에서 AI 예측, AI 차트 해석, 호재/악재, 초보자 학습 진입점이 바로 보여야 한다고 했다.
- 현재 UI는 멋지지만 “접힌 AI 카드” 때문에 정보 발견성이 떨어질 수 있다.

### 3.2 차트 구간 표시가 아직 부분 구현

- `ImmersiveChart.jsx`에서 실제 `zones` 데이터를 충분히 쓰지 않고, `buyZoneStart`, `buyZoneEnd`, `resistancePrice`를 임시 계산한다.
- 문서 요구사항인 매수 검토, 분할매수 검토, 관망, 매도 검토, 리스크 관리 구간 5개가 차트 위에 모두 안정적으로 표시되는 구조는 아니다.
- 공시/뉴스/언급량 마커도 명확히 분리되지 않았다.
- RSI, MACD, OBV, 이동평균선 같은 보조지표가 실제 차트 레인으로 충분히 연결되지 않았다.

### 3.3 AI 카드 데이터 연결 버그 가능성

- `FloatingAiCard.jsx`는 `ai.evidence?.buyCondition`, `ai.evidence?.sellCondition`을 읽는다.
- 그러나 `fallbackData.js`의 `ai.evidence`는 배열이고, 매수/매도 조건은 `ai.buyCondition`, `ai.sellCondition`에 있다.
- 이 때문에 카드 확장 시 “확인된 매수 조건 없음”이 뜰 수 있다.
- `FloatingAiCard.jsx`의 기준일은 `stock?.asOf`를 읽는데, `asOf`는 workspace 루트에 있고 stock 객체에는 없을 수 있다.

### 3.4 검색에서 용어 선택과 AI 질문 동작이 불완전함

- `SpotlightSearch.jsx`에서 `item.type === 'term'`인 경우 선택 동작이 없다.
- 검색 결과 없음 상태의 “AI에게 물어보기” 버튼은 실제 질문 제출 또는 학습 시트 연결이 없다.
- 검색 결과에 호재 요약, 악재 요약, 관련 산업/테마, 차트 보기, AI 예측 보기 버튼이 충분히 드러나지 않는다.

### 3.5 학습 기능이 거래량 하나에 강하게 고정됨

- `DeepDiveLearningSheet.jsx`는 거래량 학습 콘텐츠가 하드코딩되어 있다.
- 기존 reset 문서의 필수 용어 27개가 실제 시트에서 탐색/상세 표시되는 구조가 아니다.
- `loadLearningTerms()`는 있지만 현재 학습 시트와 충분히 연결되지 않았다.
- 관련 차트 구간, 관련 질문, AI에게 물어보기 진입점이 실제 상호작용으로 완성되지 않았다.

### 3.6 포트폴리오 샌드박스가 하드코딩됨

- `PortfolioSandbox.jsx`는 `activeCode`를 받지만 종목명은 “삼성전자”로 고정되어 있다.
- 비중을 조절해도 실제 포트폴리오 목록, 리스크 비교, 호재/악재 영향이 동적으로 계산되지 않는다.
- “약 +2.5% 방어” 같은 표현은 실제 데이터 근거가 부족해 보일 수 있다.

### 3.7 관리자/기록 기능 접근성이 부족함

- 관리자 콘솔은 왼쪽 위 숨은 버튼 더블클릭으로만 열린다.
- 일반 사용자는 숨기는 것이 맞지만, 운영자에게도 너무 발견하기 어렵다.
- 기존 브리프/달력/보관 기록을 보는 archive 화면은 현재 새 UI에서 명확히 연결되어 있지 않다.
- `loadSummaryArchive()`는 존재하지만 화면에서 적극적으로 쓰이지 않는다.

### 3.8 에러와 fallback 상태가 사용자에게 충분히 보이지 않음

- `useWorkspace`에는 `error` 상태가 있지만 `App.jsx`에서 사용자에게 표시되지 않는다.
- 백엔드 연결 실패 시 fallback 데이터가 표시되어도 사용자에게 명확히 알려주지 않을 수 있다.
- 로딩은 초기 데이터가 없을 때만 강하게 보이고, 종목 전환 중에는 상태 피드백이 약할 수 있다.

### 3.9 테스트가 현재 UI와 맞지 않음

- `frontend/tests/frontend-quality.spec.js`는 `.topbar`, `.modeCard`, `#universal-search`, `.priceChart`, `.aiPanel`, `.zoneBoard`, `#learn`, `#practice`, `#archive`, `#admin` 같은 이전 UI 기준 selector를 검사한다.
- 현재 새 UI는 CSS Module과 몰입형 앱 구조를 사용하므로 테스트가 실제 UI와 맞지 않을 가능성이 높다.
- 후속 AI는 테스트를 현재 UI 기준으로 다시 작성해야 한다.

### 3.10 모바일 전체 화면 앱 구조 리스크

- `frontend/src/styles/index.css`에서 `html, body`가 `overflow: hidden`이다.
- 몰입형 앱에는 맞지만, 모바일에서 시트, 검색 결과, AI 카드가 겹치거나 닫기 어려울 수 있다.
- PC 1440px과 mobile 390px에서 검색 드롭다운, AI 카드 확장, 학습 시트, 포트폴리오 시트, 관리자 시트를 모두 확인해야 한다.

---

## 4. 우선순위별 앞으로의 계획

### 4.1 1순위: 기능 오작동 수정

1. `FloatingAiCard`가 `ai.buyCondition`, `ai.sellCondition`, `ai.waitCondition`, `ai.riskCondition`, `ai.positives`, `ai.negatives`, `ai.checklist`, `workspace.asOf`를 올바르게 표시하도록 고친다.
2. AI 카드는 첫 화면에서 최소한 매수 검토 조건, 매도 검토 조건, 호재/악재 숫자 또는 요약이 보이도록 기본 상태를 조정한다.
3. 검색 결과에서 term 선택 시 학습 시트를 열고 해당 용어를 보여준다.
4. 검색 결과 없음 상태의 “AI에게 물어보기” 버튼이 실제 동작하도록 연결한다.
5. `error`와 fallback 상태를 화면에 짧고 예쁘게 표시한다.

### 4.2 2순위: 차트 요구사항 완성

1. 백엔드 `trade-zones` 응답의 zones 5개를 실제 차트 위 `ReferenceArea` 또는 주석 레이어로 모두 표시한다.
2. 매수 검토, 분할매수 검토, 관망, 매도 검토, 리스크 관리가 색상과 문구로 구분되게 만든다.
3. 이벤트 마커에 호재, 악재, 공시, 뉴스, 언급량 타입을 구분한다.
4. tooltip에 왜 올랐는지, 왜 내렸는지, 반대 신호, 기준일, 신뢰도를 표시한다.
5. RSI, MACD, OBV, 이동평균선이 실제 데이터 또는 계산값으로 표시되도록 한다.

### 4.3 3순위: 학습 기능 확장

1. `loadLearningTerms()` 결과를 `DeepDiveLearningSheet`에 연결한다.
2. 기존 reset 문서의 필수 용어 27개를 검색/탭/시트에서 탐색 가능하게 한다.
3. 각 용어에 핵심 한 줄, 최소 3줄 쉬운 설명, 차트에서 보는 법, 왜 중요한지, 초보자 오해, 시나리오, 관련 차트 구간, 관련 질문, AI에게 물어보기를 표시한다.
4. 차트 tooltip에서 용어를 누르면 학습 시트가 해당 용어로 열린다.

### 4.4 4순위: 포트폴리오 샌드박스 완성

1. 현재 active stock의 이름, 코드, 등락률, 호재/악재를 샌드박스에 연결한다.
2. 여러 관심 종목을 담고 비중 합계가 100%를 넘지 않게 한다.
3. 변동성, 특정 섹터 쏠림, 호재/악재 영향, 다음 확인 체크리스트를 계산 또는 fallback으로 표시한다.
4. 서버 저장이 없으면 “학습용 임시 상태”임을 명확히 표시한다.
5. 실계좌 연동처럼 보이는 표현은 쓰지 않는다.

### 4.5 5순위: 관리자/기록 보존 방식 정리

1. 일반 사용자 첫 화면에는 보이지 않되, 운영자는 명확히 접근할 수 있는 관리자 진입점을 만든다.
2. 기존 브리프, 달력, 생성, 백필, 보관, 검증 기능을 별도 운영 시트 또는 기록 시트에서 접근 가능하게 한다.
3. `loadSummaryArchive()`를 실제 기록 화면에 연결한다.
4. 관리자 키는 화면 상태로만 입력받고 commit 대상에 포함하지 않는다.

### 4.6 6순위: 테스트와 검증 갱신

1. `frontend/tests/frontend-quality.spec.js`를 현재 UI selector와 흐름에 맞게 다시 작성한다.
2. CSS Module 환경에서 안정적인 테스트를 위해 `data-testid` 또는 접근 가능한 label을 주요 컴포넌트에 추가한다.
3. 테스트는 처음부터 돌리지 말고, 핵심 구현 이후 마지막에 실행한다.
4. 최종에는 `npm run build`, backend test, frontend E2E, `make health`, `make quality`, Docker health, API 전체 검증, secret 검사, 투자 금지 표현 검사를 실행한다.

---

## 5. 하네스 엔지니어링 반복 루프

후속 AI는 아래 루프를 실제로 반복해야 한다.

### 5.1 루프 시작

1. 이 문서와 기존 reset 문서를 읽는다.
2. 현재 UI를 PC 1440px, mobile 390px에서 본다.
3. 기능상 막히는 흐름을 우선 확인한다.
4. 구현된 것과 미구현을 다시 나눈다.

### 5.2 구현 우선순위

아래 순서대로 고친다.

1. 실제 기능 오작동
2. 첫 화면 필수 정보 누락
3. 차트 구간/마커/tooltip 누락
4. 검색/학습 연결 누락
5. 포트폴리오 샌드박스 하드코딩
6. 관리자/기록 보존 흐름
7. 모바일 겹침/잘림
8. 테스트 갱신

### 5.3 빠른 화면 확인

개발 중에는 아래만 빠르게 확인한다.

- PC 1440px 첫 화면
- mobile 390px 첫 화면
- 검색 결과 열림/빈 상태
- AI 카드 접힘/펼침
- 차트 tooltip
- 학습 시트
- 포트폴리오 시트
- 관리자 시트

개발 중에는 아래를 반복하지 않는다.

- Docker rebuild 반복
- `make quality` 반복
- 전체 API 테스트 반복
- 긴 E2E 반복

### 5.4 자체 점수 평가

각 반복 끝에서 아래 점수를 매긴다.

- 사용자 500점: 첫인상, 검색 이해도, 차트 학습 경험, AI 조건 이해도, 모바일 사용성
- 프론트 500점: 컴포넌트 구조, 상태 관리, CSS Module 구조, 반응형, 접근성, 테스트 가능성
- 백엔드 500점: 기존 API 보존, API 계약 연결, fallback 표시, 데이터 기준일/출처/신뢰도 연결
- DevOps 500점: secret 미커밋, Docker/health 보존, 빌드 가능성, 배포 위험
- AI 500점: AI 기능 가시성, 근거/반대 신호/한계 표시, 내부 사고 비노출, 투자 표현 안전성
- 투자자 500점: 차별성, 재방문 이유, 학습/포트폴리오 확장성, 출시 가능성

하나라도 495점 미만이면 다시 구현한다.
디자인이 별로라고 판단되거나 기능이 덜 구현되었다면 멈추지 말고 다시 고친다.

### 5.5 최종 검증

핵심 구현이 끝난 뒤에만 실행한다.

```bash
cd frontend && npm run build
cd backend && ./gradlew test
cd frontend && npm run test:e2e
make health
make quality
./scripts/verify_no_secrets.sh
./scripts/verify_investment_language.sh
./scripts/test_all_apis.sh
```

환경 문제로 실행하지 못하면 “미확인”이라고 적는다.
실패하면 실패 원인과 수정 여부를 적는다.

---

## 6. 완료 조건

아래 조건을 모두 만족해야 완료라고 말한다.

- 현재 몰입형 차트 UI 방향을 보존했다.
- 전면 삭제나 전면 재시작을 하지 않았다.
- 첫 화면에서 검색, 차트, AI 예측, 호재/악재, 학습 진입점이 보인다.
- AI 카드에서 매수 검토, 매도 검토, 관망, 리스크 관리 조건이 실제 데이터 구조와 맞게 보인다.
- 차트 위에 5개 검토 구간이 실제 zones 데이터와 연결되어 보인다.
- tooltip이 PC와 모바일에서 잘리지 않는다.
- 검색 결과에서 종목과 용어가 각각 올바르게 동작한다.
- 검색 실패 상태가 추천 검색어와 AI 질문 진입점으로 이어진다.
- 학습 시트가 27개 기본 용어를 다룬다.
- 포트폴리오 샌드박스가 현재 종목과 비중을 실제 화면 상태로 반영한다.
- 관리자/기록 기능이 일반 첫 화면과 분리되어 보존된다.
- 기존 백엔드 API를 삭제하지 않았다.
- `.env`와 secret을 commit하지 않았다.
- 현재 UI 기준으로 E2E 테스트가 갱신되었다.
- 최종 검증 결과와 미확인 항목을 솔직히 보고했다.
- 사용자, 프론트, 백엔드, DevOps, AI, 투자자 관점이 모두 495/500 이상이다.

---

## 7. 최종 보고 양식

완료 후 아래 형식으로 보고한다.

1. 이번에 고친 기능 문제
2. 현재 디자인을 보존한 방식
3. 구현된 요구사항
4. 아직 남은 요구사항
5. 백엔드 보존 여부
6. 관리자/기록 기능 보존 여부
7. 실행한 빠른 화면 확인
8. 실행한 최종 검증
9. 실패/미실행/미확인 검증
10. 남은 리스크
11. 사용자/프론트/백엔드/DevOps/AI/투자자 점수
12. commit hash
13. push 여부
14. 다음 작업

---

## 8. 커밋 규칙

커밋 전에는 반드시 최근 커밋을 확인한다.

```bash
git log --oneline -10
```

커밋 메시지는 기존 흐름을 따른다.

예시:

```text
[FEAT]: (1) AI 카드 조건 표시 오류 수정 / (2) 차트 검토 구간을 실제 데이터와 연결 / (3) 검색과 학습 시트 흐름 보강
```

`.env`, `.env.*`, API key, DB password, Discord webhook, OpenAI key, admin key 같은 secret은 절대 commit하지 않는다.
사용자나 다른 AI가 만든 unrelated 변경은 되돌리지 않는다.
