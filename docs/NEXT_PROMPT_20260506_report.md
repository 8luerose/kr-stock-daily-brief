# NEXT_PROMPT_20260506_report

작성일: 2026-05-06

프로젝트 경로:

`/Users/rose/Desktop/git/kr-stock-daily-brief`

## 다른 AI에게 전달할 요청 명령어

```text
/Users/rose/Desktop/git/kr-stock-daily-brief/docs/NEXT_PROMPT_20260506_report.md 파일을 먼저 읽고, 현재 코드와 실제 실행 결과를 대조한 뒤 부족한 부분을 구현해줘. 특히 성능 개선 방식, DB 저장 시점, AI 사용 흐름, LLM 모델 변경 방법, 매수/매도 도움 가능성, 초보자 학습 강화, 한국어 말투 개선, 전체 아키텍처, 발견된 에러와 남은 부족점을 빠짐없이 확인해줘. 테스트와 스모크 테스트에는 많은 시간을 쓰지 말고, 변경 범위에 맞는 최소 확인만 한 뒤 마지막에 핵심 검증 결과를 보고해줘.
```

## 다른 AI에게 전달할 프롬프트

```markdown
# kr-stock-daily-brief 다음 작업 프롬프트

너는 이 프로젝트를 이어받는 시니어 프론트엔드, 백엔드, DevOps, AI 엔지니어다.

품질 기준은 토스에서 10년차 이상, 연봉 1억 이상을 받는 엔지니어들이 함께 만든 서비스처럼 보이게 하는 것이다. 단, 지금은 전면 재작성보다 현재 구조를 정확히 이해하고 부족한 부분을 고치는 것이 우선이다.

프로젝트 경로:

`/Users/rose/Desktop/git/kr-stock-daily-brief`

## 1. 현재 성능 개선 내용

최근 커밋 기준으로 속도 개선은 주로 프론트 데이터 로딩 구조에서 이루어졌다.

### 기존 문제

- 기업이나 기간을 바꿀 때 차트, 거래 구간, 이벤트, AI 응답이 한 흐름에 묶여 느리게 느껴졌다.
- 이전 요청이 늦게 끝나면 최신 선택 상태를 덮어쓸 위험이 있었다.
- 일봉, 주봉, 월봉 전환 시 같은 데이터를 반복 요청할 수 있었다.
- AI 응답까지 기다리느라 핵심 차트 표시가 늦어질 수 있었다.

### 원인

- 화면에 필요한 핵심 데이터와 AI 설명 데이터가 같은 체감 흐름에 있었다.
- 요청 캐시가 부족했고, 기간 전환 시 다음에 필요한 데이터를 미리 준비하지 않았다.
- 응답 순서를 보장하는 request id 방어가 약했다.

### 해결 방식

- `frontend/src/services/apiClient.js`에서 `coreWorkspaceCache`, `aiWorkspaceCache`를 사용해 같은 종목/기간 데이터 재요청을 줄였다.
- `loadStockCoreWorkspaceRemote()`에서 차트, trade-zones, events를 `Promise.all`로 동시에 가져온다.
- `useWorkspace.js`에서 핵심 데이터가 먼저 오면 화면을 표시하고, AI 응답은 뒤에서 비동기로 붙인다.
- `requestIdRef`로 오래된 응답이 최신 선택을 덮지 못하게 막았다.
- `prefetchStockWorkspaces()`로 현재 기간 외 일봉/주봉/월봉 데이터를 미리 불러와 기간 버튼 반응을 빠르게 만들었다.
- 이미 한 번 로딩한 뒤에는 전체 로딩 화면을 다시 크게 띄우지 않도록 `hasLoadedRef`를 사용한다.
- AI 쪽은 `LLM_MAX_TOKENS`, `LLM_TIMEOUT_SECONDS`, GLM-5-Turbo 계열 설정으로 응답 길이와 대기 시간을 줄였다.

### 다음 AI가 확인할 것

- 실제 브라우저에서 기업 선택과 일봉/주봉/월봉 전환이 즉시 반응하는지 확인한다.
- 캐시가 오래된 데이터를 계속 보여주지 않는지 확인한다.
- AI 응답 실패 시 차트 화면까지 같이 실패하지 않는지 확인한다.

## 2. DB 저장 시점과 저장 방식

### 기업 선택 시

기업을 선택하는 것만으로는 DB에 저장하지 않는다.

프론트의 `activeCode` 상태가 바뀌고, 그 종목 코드로 아래 API를 즉시 조회한다.

- `/api/stocks/{code}/chart`
- `/api/stocks/{code}/trade-zones`
- `/api/stocks/{code}/events`
- `/api/ai/chat`

이 데이터는 화면 표시용이며, 현재 구조에서는 차트, 이벤트, trade-zones, AI 응답을 DB에 영구 저장하지 않는다.

### 장마감 요약 저장 시

장마감 브리프는 `backend/src/main/java/com/krbrief/summaries/SummaryScheduler.java`에서 평일 15:40 Asia/Seoul에 실행된다.

과정:

1. `marketdata /market-status`로 영업일인지 확인한다.
2. 영업일이면 `DailySummaryService.generate(today)`를 호출한다.
3. marketdata에서 KRX/pykrx/Naver 기반 리더 데이터를 가져온다.
4. `daily_summaries` 테이블에 날짜별 요약, 상승/하락/언급 종목, TOP 리스트 JSON, 기준일, 검증 메모를 저장한다.
5. Discord webhook이 설정되어 있으면 저장 후 best-effort로 포스팅하고 메시지 ID를 다시 저장한다.

수동 저장도 가능하다.

- 오늘 생성: `POST /api/summaries/generate/today`
- 특정일 생성: `POST /api/summaries/{date}/generate`
- 백필: `POST /api/summaries/backfill`

### 포트폴리오 저장 시

포트폴리오 샌드박스는 사용자가 관심 종목을 추가하거나 비중을 바꾸는 순간 DB에 저장한다.

- 추가/갱신: `POST /api/portfolio/items`
- 비중 수정: `PUT /api/portfolio/items/{code}`
- 삭제: `DELETE /api/portfolio/items/{code}`

저장 테이블은 `portfolio_items`다.

중요한 구분:

- 기업 선택은 화면 상태 변경이다.
- 포트폴리오 추가는 DB 저장이다.
- 장마감 브리프 생성은 `daily_summaries` 저장이다.
- AI 응답은 현재 DB에 저장하지 않는다.

## 3. AI 사용 흐름

AI는 사용자가 기업을 선택하거나 AI 설명이 필요한 시점에 사용된다.

전체 흐름:

1. 사용자가 기업을 선택한다.
2. 프론트가 차트, 이벤트, 거래 구간을 먼저 가져온다.
3. 화면은 핵심 차트를 먼저 표시한다.
4. 이후 프론트가 `/api/ai/chat`을 호출한다.
5. 백엔드 `AiChatContextEnricher`가 부족한 context를 보강한다.
6. 보강되는 내용은 검색 결과, 최신 브리프, 차트 최신값, 이벤트, trade-zones, 이동평균선 지표, 학습 용어다.
7. 백엔드는 ai-service `/chat`으로 넘긴다.
8. ai-service는 retrieval 문서를 만들고 LLM 설정이 있으면 LLM을 호출한다.
9. LLM 설정이 없거나 실패하면 규칙형 RAG fallback으로 응답한다.
10. 프론트는 structured 응답을 `normalizeAi()`로 정리해 AI 카드와 설명 UI에 표시한다.

AI 응답은 아래를 포함해야 한다.

- 한 줄 결론
- 이동평균선 해석
- 매수 검토 조건
- 관망 조건
- 매도 검토 조건
- 리스크 관리
- 호재/악재 후보 이유
- 반대 신호
- 초보자 체크리스트
- 출처, 기준일, 신뢰도, 한계

## 4. AI LLM 모델 변경 방법

모델은 코드 수정 없이 환경변수로 바꿀 수 있다.

주요 변수:

- `LLM_PROVIDER`
- `LLM_API_KEY`
- `ZAI_API_KEY`
- `OPENAI_API_KEY`
- `LLM_MODEL`
- `LLM_BASE_URL`
- `LLM_TIMEOUT_SECONDS`
- `LLM_MAX_TOKENS`
- `ANTHROPIC_AUTH_TOKEN`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_VERSION`

현재 Docker 기본 방향은 `anthropic_compatible`이고, `ANTHROPIC_DEFAULT_SONNET_MODEL` 기본값은 `glm-5-turbo`, `ANTHROPIC_BASE_URL` 기본값은 `https://api.z.ai/api/anthropic`다.

변경 방법:

1. 로컬 `.env` 또는 배포 secret manager에 모델 관련 값을 넣는다.
2. `.env`는 절대 commit하지 않는다.
3. `docker compose up -d --build ai-service backend` 또는 `make up`으로 반영한다.
4. `/api/ai/status` 또는 ai-service `/llm/status`로 provider, model, configured 상태를 확인한다.

## 5. AI가 매수/매도에 실제 도움이 되는지

현재 AI는 직접 투자 지시가 아니라 교육용 판단 보조로는 도움이 된다.

도움이 되는 부분:

- 이동평균선, 거래량, 지지선, 저항선을 한 문장으로 풀어준다.
- 매수 검토, 관망, 매도 검토, 리스크 관리 조건을 조건형으로 정리한다.
- 호재/악재 후보와 반대 해석을 같이 보여준다.
- 출처 부족이나 신뢰도 한계를 표시한다.

현재 한계:

- 개인의 보유 수량, 평균 단가, 투자 기간, 손실 감내 수준은 반영하지 않는다.
- 실시간 장중 데이터 기반 자동 매매 신호가 아니다.
- 이벤트 원인도 후보 근거이며 확정 원인이 아닐 수 있다.
- AI 응답이 실제 투자 성과를 보장하지 않는다.

더 도움이 되게 하려면:

- 사용자 포트폴리오 비중, 관심 종목, 보유 기간 같은 개인 맥락을 선택 입력으로 받는다.
- 매수/매도 단정 대신 `내 조건에서 확인할 체크리스트`를 만든다.
- 이벤트 근거를 공시, 뉴스 본문, 가격 반응, 거래량 반응으로 나누어 보여준다.
- 같은 질문에 대해 공격형, 중립형, 보수형 시나리오를 따로 제공한다.
- Risk Reviewer를 강화해 과장, 단정, 수익 보장 문구를 자동 차단한다.

## 6. 초보자 학습을 더 도움되게 만드는 방법

학습은 용어 사전만으로 끝나면 부족하다. 차트와 연결되어야 한다.

해야 할 일:

- 용어를 클릭하면 현재 차트에서 어디에 해당하는지 보여준다.
- `이동평균선`, `거래량`, `지지선`, `저항선`, `손절`, `분할매수`는 실제 차트 예시와 연결한다.
- 각 용어는 아래 구조를 가져야 한다.
  - 한 줄 요약
  - 쉬운 설명
  - 차트에서 보는 위치
  - 왜 중요한지
  - 초보자가 자주 하는 오해
  - 실제 상황 예시
  - 다음 질문
- AI 답변 안의 어려운 용어를 누르면 학습 패널이 열리게 한다.
- "이 신호가 나오면 무조건 산다"가 아니라 "이 조건을 확인한다"는 식으로 가르친다.

## 7. 한국어 문장과 친근한 말투 개선

현재 문장 중 일부는 AI스럽고 번역투처럼 느껴질 수 있다.

개선 원칙:

- 영어식 용어를 바로 쓰지 말고 쉬운 한국어로 먼저 풀어쓴다.
- `positive`, `negative`, `neutral` 같은 표현은 사용자 화면에서 `좋게 볼 수 있는 이유`, `주의할 이유`, `아직 판단 보류`로 바꾼다.
- `retrieval`, `source grounded`, `indicator snapshot` 같은 내부 용어는 사용자에게 노출하지 않는다.
- 한 문장이 길면 두 문장으로 나눈다.
- 초보자에게 말하듯 친근하되, 투자 판단은 단정하지 않는다.

예시:

- 어려움: `indicator snapshot 기반으로 trendStage가 buy_review입니다.`
- 개선: `지금은 20일선 위에 있고 거래량도 붙어서 관심을 가져볼 수 있는 구간입니다. 다만 저항선을 넘는지 한 번 더 확인해야 해요.`

- 어려움: `sentimentForPrice가 positive입니다.`
- 개선: `가격에는 좋게 해석될 수 있는 재료가 있습니다. 다만 뉴스 제목만으로 확정하면 안 되고, 공시와 다음 거래일 거래량을 같이 봐야 해요.`

- 어려움: `risk management condition triggered`
- 개선: `지지선을 깨고 내려가면 손실을 어디까지 허용할지 먼저 정해야 합니다. 이때는 새로 사는 것보다 리스크 관리가 먼저예요.`

## 8. 전체 아키텍처 설명

유저부터 DB까지 흐름은 아래처럼 이해하면 된다.

1. 사용자가 프론트에서 기업을 선택한다.
2. React 상태의 `activeCode`가 바뀐다.
3. 프론트가 backend REST API를 호출한다.
4. backend는 marketdata-python에서 KRX/pykrx/Naver 데이터를 가져온다.
5. backend는 차트, 이벤트, trade-zones를 만들어 프론트로 돌려준다.
6. 프론트는 차트를 먼저 그린다.
7. 프론트가 AI 설명을 요청한다.
8. backend가 검색, 브리프, 차트, 이벤트, 학습 용어를 AI context로 보강한다.
9. ai-service가 LLM 또는 fallback 응답을 만든다.
10. 프론트가 AI 응답을 카드와 학습 UI에 표시한다.

DB 저장 흐름은 별도다.

- `daily_summaries`: 장마감 스케줄, 수동 생성, 백필 때 저장된다.
- `portfolio_items`: 포트폴리오 샌드박스에서 종목을 추가/수정/삭제할 때 저장된다.
- 차트, 이벤트, trade-zones, AI 응답은 현재 기본적으로 요청 시 계산/생성되며 DB에 영구 저장하지 않는다.
- Qdrant는 RAG 확장용으로 준비되어 있으나, 현재 핵심 앱 DB는 MySQL의 `daily_summaries`, `portfolio_items` 중심이다.

## 9. 발견된 에러와 주의할 점

현재 문서 작성 시점의 정적 확인 기준으로 새로 확인된 치명적 에러는 없다.

다만 다음 리스크는 남아 있다.

- 기업 선택 자체는 DB에 저장되지 않으므로, 사용자가 선택 기록이 저장된다고 오해할 수 있다.
- AI 응답은 LLM 설정이 없거나 실패하면 fallback으로 동작한다.
- Qdrant는 준비되어 있지만 실제 고도화된 RAG 저장/검색 계층은 더 확인해야 한다.
- AI 문장이 아직 내부 용어와 번역투를 포함할 수 있다.
- 실시간 투자 조언이나 개인화 매수/매도 지시는 제공하지 않는다.
- 테스트를 많이 돌리지 말라는 조건 때문에, 큰 변경 후에는 최소 핵심 검증만 하고 남은 리스크를 솔직히 보고해야 한다.

## 10. 지금까지 한 것

- 기업 선택 시 실제 종목 코드 기준으로 차트, 이벤트, trade-zones를 다시 불러오는 흐름을 만들었다.
- 저장된 일간 브리프 기준으로 주요 기업 선택 옵션을 만들었다.
- 차트, trade-zones, events를 병렬 로딩해 체감 속도를 개선했다.
- AI 응답을 핵심 차트 로딩 뒤 비동기로 붙여 첫 화면 대기 시간을 줄였다.
- 기간 전환 속도를 위해 다른 interval 데이터를 미리 불러온다.
- GLM 계열 LLM 설정을 docker-compose 환경변수로 연결했다.
- AI context에 이동평균선, 거래 구간, 이벤트, 학습 용어를 넣는 구조를 만들었다.
- 포트폴리오 샌드박스는 DB 저장 기반으로 동작한다.

## 11. 앞으로 해야 할 것

우선순위:

1. 실제 브라우저에서 기업 선택, 기간 전환, AI 카드 표시 속도를 확인한다.
2. 사용자가 기업 선택이 DB 저장이라고 오해하지 않도록 UI 문구를 명확히 한다.
3. AI 답변에서 내부 용어와 번역투를 줄이고 한국어 친화 문장으로 바꾼다.
4. 초보자 학습 패널을 현재 차트 위치와 더 직접 연결한다.
5. 매수/매도 도움은 직접 지시가 아니라 개인 조건 체크리스트 방식으로 강화한다.
6. LLM 모델 변경 방법을 README 또는 운영 문서에도 짧게 동기화한다.
7. fallback 응답과 live LLM 응답의 품질 차이를 화면에서 표시할지 검토한다.
8. AI 응답을 저장할지, 저장한다면 개인정보 없이 어떤 형태로 저장할지 설계한다.
9. Qdrant를 실제 RAG 검색에 얼마나 쓰는지 확인하고 부족하면 구현한다.
10. 발견된 에러와 남은 리스크를 최종 보고서에 솔직히 작성한다.

## 12. 테스트 지시

테스트와 스모크 테스트에 많은 시간을 쓰지 마라.

변경 중에는 아래만 빠르게 확인한다.

- 바꾼 파일 문법 확인
- 바꾼 API 1~2개 curl 확인
- 프론트 build 1회
- 핵심 브라우저 흐름 1회

마지막에만 필요한 범위로 실행한다.

- `git diff --check`
- `npm run build`
- 필요한 backend 단위 테스트
- 필요한 e2e 1개 또는 핵심 smoke 1개

전체 `make quality`나 무거운 LLM benchmark는 꼭 필요할 때만 실행하고, 시간이 오래 걸리면 실행하지 못한 이유를 보고한다.

## 13. 최종 보고 형식

마지막 보고에는 아래를 포함하라.

1. 무엇을 확인했는지
2. 무엇을 고쳤는지
3. 성능 개선이 실제로 어떻게 작동하는지
4. DB 저장 시점과 저장되지 않는 데이터
5. AI 사용 흐름
6. LLM 모델 변경 방법
7. AI가 매수/매도 판단에 어느 정도 도움 되는지
8. 초보자 학습 개선 내용
9. 한국어 말투 개선 내용
10. 전체 아키텍처 설명
11. 발견된 에러
12. 부족한 점 전체 목록
13. 앞으로 해야 할 일
14. 실행한 테스트
15. commit hash와 push 여부
```
