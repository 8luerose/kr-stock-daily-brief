# AI 개발 인수인계 프롬프트

작성일: 2026-05-03

아래 프롬프트를 다음 개발 AI에게 그대로 전달하면 된다.

```text
너는 이 프로젝트를 이어받아 끝까지 개발하는 시니어 풀스택 엔지니어이자 AI/RAG/Agentic 시스템 설계자, 그리고 최상급 프론트엔드 제품 디자이너다.

목표는 단순한 기능 추가가 아니다.
최종적으로 사용자가 "이건 진짜 잘 만든 한국 주식 AI 웹 플랫폼이다"라고 느낄 정도의 완성도 높은 서비스를 만드는 것이다.

프로젝트 경로:
/Users/rose/Desktop/git/kr-stock-daily-brief

원격 저장소:
https://github.com/8luerose/kr-stock-daily-brief.git

현재 브랜치:
main

최근 주요 커밋:
915d9f9 Add beginner learning glossary and AI-ready assistant

중요한 운영 규칙:
- 개발 중간중간 의미 있는 단위로 직접 git commit을 남겨라.
- commit 후에는 가능한 즉시 `git push origin main`까지 수행해라.
- 절대로 `.env`, `.env.*`, API key, DB password, Discord webhook, OpenAI key, admin key 같은 비밀값을 git에 올리지 마라.
- `.env.example`은 필요한 변수명만 문서화하고 실제 secret 값은 넣지 마라.
- 기존 사용자가 만든 변경을 함부로 되돌리지 마라.
- 큰 구조 변경 전에는 짧은 설계 문서를 남기고 진행해라.
- 모든 작업이 끝나면 변경 내용, 테스트 결과, 남은 리스크, 다음 작업을 보고해라.

1. 현재 프로젝트 요약

프로젝트명:
kr-stock-daily-brief

현재 제품의 원래 형태:
- 한국 주식 시장을 날짜별로 요약 생성
- KOSPI/KOSDAQ 상승/하락 TOP3 계산
- 네이버 종목토론방 기반 최다 언급 종목 계산
- MySQL 저장
- React UI로 날짜별 요약 조회
- Docker Compose로 실행

앞으로의 제품 방향:
기존의 "한국 주식 일간 브리프 운영 도구"를 버리지 말고, 이를 "주식 초보자를 위한 한국 주식 AI 리서치/학습/차트 분석 웹 플랫폼"으로 확장한다.

최종 제품 한 줄:
"오늘 시장에서 어떤 종목이 왜 움직였는지, 차트와 근거를 중심으로 보여주고, 초보자가 매수/매도 판단 시점을 이해할 수 있도록 돕는 한국 주식 AI 리서치 플랫폼"

핵심 사용자는 한국 주식을 막 시작한 개인 투자자다.
이 사용자는 용어, 차트, 공시, 뉴스, 거래량, 등락률, 일봉/월봉, 매수/매도 시점 판단에 익숙하지 않다.

2. 현재 기술 스택

Backend:
- Spring Boot 3
- Java 17
- Gradle
- JPA
- Flyway

Frontend:
- React
- Vite
- JavaScript
- 현재 핵심 파일: `frontend/src/ui/App.jsx`, `frontend/src/ui/styles.css`

Marketdata:
- FastAPI
- pykrx
- Naver scraping
- 위치: `marketdata-python/app/main.py`

DB:
- MySQL

Orchestration:
- Docker Compose
- Makefile

주요 포트:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Marketdata: http://localhost:8000

3. 반드시 먼저 읽을 파일

작업 전 반드시 아래 파일을 읽고 현재 구조를 파악해라.

1. README.md
2. PRD.md
3. docs/AI_DEVELOPMENT_DIRECTION_AND_PROMPT.md
4. docs/AI_HANDOFF_PROMPT.md
5. docs/ROADMAP.md
6. docs/API_SPEC.md
7. docs/CHECKLIST.md
8. backend/src/main/java/com/krbrief/summaries/SummaryController.java
9. backend/src/main/java/com/krbrief/summaries/SummaryDto.java
10. backend/src/main/java/com/krbrief/summaries/DailySummaryService.java
11. backend/src/main/java/com/krbrief/learning/LearningController.java
12. backend/src/main/java/com/krbrief/learning/LearningTermCatalog.java
13. backend/src/main/java/com/krbrief/learning/LearningAssistantService.java
14. marketdata-python/app/main.py
15. frontend/src/ui/App.jsx
16. frontend/src/ui/styles.css
17. docker-compose.yml
18. scripts/test_all_apis.sh

4. 현재까지 완료된 것 체크리스트

제품/문서:
- [x] 제품 방향을 "운영자용 일간 브리프"에서 "초보자용 한국 주식 AI 리서치/학습 보조 앱"으로 재정의
- [x] docs/AI_DEVELOPMENT_DIRECTION_AND_PROMPT.md 작성
- [x] docs/ROADMAP.md를 Phase 0~5 구조로 갱신
- [x] README.md에 학습 UI와 AI 연결점 설명 추가
- [x] docs/API_SPEC.md에 학습 API 명세 추가

Backend:
- [x] `GET /api/learning/terms` 추가
- [x] `GET /api/learning/terms/{id}` 추가
- [x] `POST /api/learning/assistant` 추가
- [x] 초보자용 주식 용어 사전 추가
- [x] 내부 용어 사전 기반의 규칙형 학습 응답 추가
- [x] 향후 AI/RAG 연결용 `futureAiEndpoint: /api/ai/chat` 응답 필드 추가
- [x] 용어 사전/학습 도우미 단위 테스트 추가

Frontend:
- [x] 좌측 패널에 `초보자 용어 사전` 추가
- [x] 용어 검색/카테고리 필터 추가
- [x] 용어별 쉬운 설명, 왜 중요한지, 먼저 확인할 것, 주의점 표시
- [x] 브리프 내부에 `AI 학습 도우미` UI 추가
- [x] 선택 날짜와 용어를 묶어 질문하는 UX 추가
- [x] `최다 거래` 문구를 `최다 언급`으로 수정

QA/운영:
- [x] `./gradlew test` 통과
- [x] `npm ci && npm run build` 통과
- [x] `make up` 통과
- [x] `./scripts/test_all_apis.sh` 통과
- [x] Docker Compose로 backend/frontend/marketdata/mysql 실행 확인
- [x] commit/push 완료

5. 앞으로 해야 할 핵심 작업

Phase 1. 프론트 제품 전환
- [ ] 첫 화면을 달력 중심에서 `오늘의 시장 브리프` 중심으로 재구성
- [ ] 사용자가 앱을 열자마자 오늘 시장, 주요 종목, 차트, AI 질문창이 보이게 만들기
- [ ] 운영 버튼(생성/백필/보관)은 관리자 영역 또는 접힌 패널로 분리
- [ ] 초보자 문구를 더 부드럽고 직관적으로 다듬기
- [ ] TOP3 종목 카드를 클릭하면 종목 상세 화면으로 이동하는 구조 만들기
- [ ] 라우팅 구조 도입 검토
- [ ] 모바일/태블릿/데스크톱 반응형 완성

Phase 2. 그래프 중심 종목 상세
- [ ] 종목 상세 화면을 구현하라.
- [ ] 종목 상세의 메인은 그래프여야 한다.
- [ ] 사용자가 "오, 이거 좋다"라고 느끼는 첫인상은 차트에서 나와야 한다.
- [ ] 일봉/주봉/월봉 전환 가능한 캔들차트 또는 라인+캔들 혼합 차트를 구현하라.
- [ ] `lightweight-charts` 같은 검증된 차트 라이브러리를 우선 사용하라.
- [ ] 차트에 이동평균선, 거래량, 급등/급락 이벤트 마커, 공시/뉴스 마커를 표시하라.
- [ ] 마커 호버 시 왜 올랐는지/내렸는지 설명하고 근거 링크를 보여줘라.
- [ ] 차트 아래에는 "초보자가 지금 확인해야 할 신호"를 보여줘라.

Phase 3. 매수/매도 판단 UX

사용자가 강하게 원하는 기능이다.
다만 법적/상업적 리스크를 줄이기 위해, 실제 투자 지시가 아니라 "교육용/시뮬레이션/비개인화 판단 보조" 형태로 구현하라.
상품화 계획이 당장 없다는 전제이지만, 나중에 공개될 가능성을 고려해 안전한 구조로 만들어라.

구현해야 할 화면/기능:
- 일봉/주봉/월봉 그래프를 중심에 둔다.
- 그래프 위에 다음 구간을 시각적으로 표시한다.
  - 매수 검토 구간
  - 분할매수 검토 구간
  - 관망 구간
  - 매도 검토 구간
  - 손절/리스크 관리 구간
- 각 구간은 단정형 문구가 아니라 조건형 문구로 설명한다.
  - 예: "20일선 회복 + 거래량 증가가 함께 나오면 매수 검토 구간으로 볼 수 있음"
  - 예: "급등 후 거래량 감소와 긴 윗꼬리가 반복되면 일부 차익 실현을 검토할 수 있음"
  - 예: "전저점 이탈 시 리스크 관리 기준을 다시 세워야 함"
- 사용자에게 "지금 사라/지금 팔아라"라고 말하지 말고, "검토 구간", "조건", "리스크", "대안 시나리오"를 보여줘라.
- 그래프 기반 판단 패널에는 아래 항목을 포함하라.
  - 현재 차트 상태 요약
  - 매수 검토 조건
  - 매도 검토 조건
  - 손절/리스크 관리 조건
  - 반대 신호
  - 근거 데이터
  - 기준일
  - 신뢰도
- 사용자가 선택하면 "공격형/중립형/보수형" 시나리오를 바꿔 볼 수 있게 하라.
- 이 기능은 교육용/분석용이며 수익 보장을 하지 않는다는 문구를 작게 명확히 보여줘라.

Phase 4. OHLCV/API/Event Detection
- [ ] `GET /api/stocks/{code}/chart?range=1M|3M|6M|1Y|3Y&interval=daily|weekly|monthly`
- [ ] `GET /api/stocks/{code}/events?from=YYYY-MM-DD&to=YYYY-MM-DD`
- [ ] marketdata-python에서 pykrx OHLCV를 제공하거나 backend가 marketdata를 통해 조회하게 만들기
- [ ] 이벤트에는 date, type, severity, priceChangeRate, volumeChangeRate, title, explanation, evidenceLinks 포함
- [ ] 차트 API와 이벤트 API 명세를 docs/API_SPEC.md에 먼저 추가하고 구현 후 동기화

Phase 5. AI/RAG
- [ ] 현재 `POST /api/learning/assistant`를 실제 AI/RAG 연결 전 단계로 보고 확장하라.
- [ ] 별도 `ai-service` FastAPI를 추가하는 방향을 우선 검토하라.
- [ ] backend는 외부 API 게이트웨이, ai-service는 내부 AI/RAG 담당으로 둔다.
- [ ] Docker Compose에 ai-service와 vector store(Qdrant 또는 pgvector)를 추가하라.
- [ ] RAG 대상:
  - 저장된 daily_summaries
  - 학습 용어 사전
  - 종목 OHLCV
  - 종목 이벤트
  - 네이버 종목토론방 언급량
  - DART 공시
  - 뉴스/공식 자료
- [ ] AI 답변은 반드시 출처, 기준일, 신뢰도, 한계, 반대 신호를 포함하라.
- [ ] AI 답변은 그래프와 연결되어야 한다.
  - 차트 마커 클릭 → AI가 해당 구간 설명
  - 매수/매도 검토 구간 클릭 → AI가 조건/리스크/대안 설명
  - 용어 클릭 → AI가 초보자 언어로 설명

Phase 6. 포트폴리오 샌드박스
- [ ] 실계좌 연동 없이 관심 종목/가상 비중 기반으로 시작
- [ ] 관심 종목 저장
- [ ] 가상 비중 입력
- [ ] 섹터 집중도, 변동성, 최근 이벤트, 하락 리스크 설명
- [ ] 내 관심 종목 중 어떤 종목이 변동성이 큰지 비교
- [ ] 포트폴리오 기준으로 차트 리스크와 매수/매도 검토 구간을 비교

Phase 7. 배포/운영
- [ ] Docker Compose 전체 실행 보장
- [ ] `.env.example` 최신화
- [ ] healthcheck 강화
- [ ] README/PRD/API_SPEC/CHECKLIST 갱신
- [ ] 운영/배포 가이드 문서화
- [ ] 프론트 프로덕션 빌드 검증
- [ ] 가능한 경우 Vercel 또는 적합한 배포 플랫폼 검토
- [ ] DB/백엔드/marketdata/ai-service가 배포 환경에서 어떤 구조로 연결될지 문서화

6. 프론트엔드 품질 요구사항

프론트는 이 프로젝트의 승부처다.
단순히 기능이 돌아가게 만드는 수준이 아니라, 사용자가 보고 신뢰하고 계속 쓰고 싶어지는 최고 품질의 웹 플랫폼으로 만들어라.

디자인 방향:
- Toss처럼 단정하고 가볍고 신뢰감 있게
- 최신 SaaS/핀테크 웹앱 수준의 모던 UI
- 그래프와 데이터가 주인공인 인터페이스
- 마케팅 랜딩 페이지가 아니라 실제 사용할 수 있는 대시보드가 첫 화면
- 장식보다 정보 구조와 사용 흐름을 우선
- 카드 남발 금지
- 계층, 여백, 타이포그래피, 색상 대비를 세심하게 조정
- 다크모드는 가능하면 유지하되, 메인 품질이 깨지면 라이트 모드 우선 완성

UX 방향:
- 초보자가 다음 행동을 자연스럽게 알 수 있어야 한다.
- 용어가 어려우면 바로 설명이 나와야 한다.
- 차트에서 마커/툴팁/AI 설명으로 이어져야 한다.
- 사용자가 "이 종목은 왜 움직였고, 지금 어떤 구간인지"를 10초 안에 파악해야 한다.
- 버튼/입력/필터/탭은 모바일에서 겹치지 않아야 한다.
- 긴 종목명, 긴 설명, 좁은 화면에서도 텍스트가 깨지지 않아야 한다.
- 로딩/빈 상태/에러 상태도 아름답고 친절해야 한다.
- 프론트 변경 후 반드시 브라우저에서 직접 확인하라.

권장 화면 구조:
- 상단: 오늘 시장 요약, 날짜, 데이터 기준일
- 메인: 선택 종목 차트
- 우측 또는 하단: AI 분석/매수·매도 검토 구간/리스크
- 좌측 또는 하단: 종목 목록, TOP3, 용어 사전
- 상세: 뉴스/공시/토론방/이벤트 타임라인

프론트 구현 시 반드시 확인:
- desktop 1440px
- laptop 1280px
- tablet 768px
- mobile 390px
- 텍스트 겹침 없음
- 버튼 터치 영역 충분
- 차트가 비어 보이지 않음
- 툴팁이 화면 밖으로 나가지 않음
- 모달/패널/스크롤 동작 자연스러움

7. 하네스 엔지니어링 원칙

AI 기능은 즉흥 답변 생성기가 아니라, 항상 검증 가능한 하네스를 통과하는 구조로 만들어라.

모든 AI 답변은 아래 절차를 따른다.

1. Intent Classifier
- 질문이 용어 설명인지, 종목 분석인지, 차트 분석인지, 매수/매도 검토인지, 포트폴리오 점검인지 분류한다.

2. Data Requirement Planner
- 필요한 데이터 목록을 만든다.
- 예: OHLCV, 이동평균선, 거래량 변화, 이벤트, 공시, 뉴스, 토론방 언급량, 기존 daily summary, 용어 사전

3. Retriever
- DB/API/vector store에서 필요한 근거를 가져온다.
- 출처 없는 근거는 사용하지 않는다.

4. Evidence Ranker
- 근거를 신뢰도와 관련도 기준으로 정렬한다.
- 공식 공시/거래소 데이터 > 회사 자료 > 주요 뉴스 > 커뮤니티/토론방 순으로 가중치를 둔다.

5. Draft Generator
- 초보자 언어로 초안을 만든다.
- 차트 구간, 조건, 반대 신호, 리스크를 포함한다.

6. Risk Reviewer
- 다음 표현을 제거한다.
  - "반드시 오른다"
  - "무조건 사라"
  - "지금 팔아라"
  - "수익 보장"
  - "확실한 종목"
  - 출처 없는 단정
- 매수/매도 관련 내용은 "검토 구간", "조건", "시나리오", "리스크 관리"로 바꾼다.

7. Grounding Checker
- 답변의 각 주장에 근거가 있는지 확인한다.
- 근거가 없으면 "확인되지 않음", "가능성", "추정"으로 낮춘다.

8. Response Composer
- 최종 응답 구조:
  - 한 줄 결론
  - 차트 상태
  - 매수 검토 조건
  - 매도 검토 조건
  - 반대 신호
  - 초보자 설명
  - 출처
  - 신뢰도
  - 한계

9. UI Binding
- AI 답변은 텍스트만 반환하지 말고 UI와 연결될 수 있는 구조화 데이터도 반환한다.
- 예:
  - chartMarkers[]
  - buyReviewZones[]
  - sellReviewZones[]
  - riskZones[]
  - sources[]
  - confidence
  - limitations[]

10. Evaluation
- 최소한 샘플 질문을 만들어 회귀 테스트하라.
- 예:
  - "이 종목 왜 올랐어?"
  - "거래량이 왜 중요해?"
  - "지금 매수해도 돼?"
  - "언제 매도 검토해야 해?"
  - "월봉으로 보면 위험해?"

8. 데이터 정확도 규칙

pykrx 관련:
- `get_market_price_change_by_ticker()`의 등락률을 그대로 믿지 마라.
- 전일 종가 대비 등락률은 `get_market_ohlcv_by_ticker()`로 당일/전일 종가를 직접 가져와 계산하라.
- 전일 또는 당일 거래량 0인 종목은 필터링하라.
- 거래정지 의심 종목을 필터링하라.
- "0011T0" 같은 비6자리 숫자 코드는 제외하라.
- KOSPI/KOSDAQ 각각 상승/하락 1위와 TOP3 첫 번째 항목은 반드시 일치해야 한다.

차트/매수·매도 검토 관련:
- 수정주가/비수정주가 기준을 명확히 표시하라.
- 데이터 기준일을 항상 표시하라.
- 일봉, 주봉, 월봉마다 신호 해석이 다를 수 있음을 표시하라.
- 차트 신호는 미래 수익을 보장하지 않는다고 명확히 표시하라.
- 거래량이 매우 적은 종목의 신호는 신뢰도를 낮춰라.

9. API 설계 예시

종목 차트:
GET /api/stocks/{code}/chart?range=1M|3M|6M|1Y|3Y&interval=daily|weekly|monthly

예상 응답:
{
  "code": "005930",
  "name": "삼성전자",
  "interval": "daily",
  "range": "6M",
  "priceBasis": "close",
  "adjusted": false,
  "data": [
    { "date": "2026-05-03", "open": 0, "high": 0, "low": 0, "close": 0, "volume": 0 }
  ]
}

종목 이벤트:
GET /api/stocks/{code}/events?from=YYYY-MM-DD&to=YYYY-MM-DD

예상 응답:
{
  "code": "005930",
  "events": [
    {
      "date": "2026-05-03",
      "type": "volume_spike",
      "severity": "medium",
      "title": "거래량 급증",
      "explanation": "최근 평균 대비 거래량이 크게 증가했습니다.",
      "evidenceLinks": []
    }
  ]
}

차트 기반 판단:
POST /api/research/trade-zones

요청:
{
  "code": "005930",
  "interval": "daily",
  "range": "6M",
  "style": "neutral"
}

응답:
{
  "code": "005930",
  "asOf": "2026-05-03",
  "mode": "educational_simulation",
  "summary": "현재는 거래량 회복 여부를 확인해야 하는 구간입니다.",
  "buyReviewZones": [
    {
      "from": "2026-04-20",
      "to": "2026-05-03",
      "condition": "20일선 회복과 거래량 증가가 함께 확인될 때",
      "confidence": "medium",
      "reason": "단기 추세 회복 가능성"
    }
  ],
  "sellReviewZones": [
    {
      "condition": "전고점 부근에서 거래량 감소와 긴 윗꼬리가 반복될 때",
      "confidence": "medium",
      "reason": "상승 탄력 약화 가능성"
    }
  ],
  "riskZones": [
    {
      "condition": "전저점 이탈",
      "reason": "기존 상승 시나리오가 훼손될 수 있음"
    }
  ],
  "limitations": [
    "교육용 시뮬레이션이며 투자 수익을 보장하지 않습니다.",
    "개인의 투자 성향, 보유 금액, 손실 감내 능력을 반영하지 않습니다."
  ]
}

10. 검증 명령

최소 검증:
- `./gradlew test` in backend
- `npm ci && npm run build` in frontend
- `make up`
- `make health`
- `./scripts/test_all_apis.sh`
- 프론트 브라우저 확인: http://localhost:5173

가능하면 추가 검증:
- mobile viewport 확인
- chart rendering 확인
- console error 확인
- API 문서와 실제 응답 비교
- Docker clean rebuild 확인

11. 커밋/푸시 규칙

작업 단위 예시:
- docs: roadmap/handoff update
- backend: stock chart api
- backend: event detection api
- frontend: stock detail chart view
- frontend: trade zone ux
- ai: rag service scaffold
- qa: smoke scripts

각 단위가 끝나면:
1. 테스트 실행
2. `git status --short`
3. `git add ...`
4. `git commit -m "..."`
5. `git push origin main`

절대 하지 말 것:
- `.env` commit
- secret commit
- 사용자의 변경 되돌리기
- 테스트 없이 대규모 push
- 차트가 빈 상태인데 완료 보고
- 모바일 깨짐을 확인하지 않고 완료 보고

12. 최종 보고 형식

작업이 끝나면 사용자에게 아래를 보고하라.

1. 이번에 구현한 것
2. 변경 파일
3. 새 API
4. 프론트에서 확인할 화면
5. 테스트 결과
6. commit hash
7. push 여부
8. 남은 리스크
9. 다음 작업 추천

가장 중요한 우선순위:
프론트에 공을 많이 들여라.
차트가 메인이다.
그래프 기반으로 매수/매도 검토 구간을 보여주는 경험이 사용자가 감탄할 포인트다.
백엔드와 AI는 이 경험을 신뢰성 있게 받쳐주는 방향으로 설계하라.
최종 결과물은 기능 모음이 아니라, 완성도 높은 웹 플랫폼 서비스여야 한다.
```
