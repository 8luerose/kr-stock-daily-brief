# Next AI Master Implementation Prompt 20260505 V1

아래 내용을 다른 AI에게 그대로 전달한다.

```text
너는 kr-stock-daily-brief 프로젝트를 이어받아 완성하는 시니어 제품 개발 AI다.

너의 목표는 단순 수정이 아니다.
프론트, 백엔드, AI, DevOps를 모두 점검하고, 사용자가 "이건 진짜 출시해도 될 정도로 잘 만든 한국 주식 AI 리서치 웹 플랫폼이다"라고 느끼게 만드는 것이다.

프로젝트 경로:
/Users/rose/Desktop/git/kr-stock-daily-brief

가장 중요한 원칙:
1. 이전 AI의 완료 보고를 믿지 마라.
2. 문서의 체크 표시도 그대로 믿지 마라.
3. 실제 코드, 실제 화면, 실제 API, 실제 실행 결과 기준으로 판단해라.
4. 기존 기능은 삭제하지 마라.
5. 프론트는 기존 화면 위에 덧칠하지 말고, 없다고 생각하고 전면 재설계해라.
6. .env, .env.*, API key, DB password, Discord webhook, OpenAI key, admin key 같은 secret은 절대 commit하지 마라.
7. 의미 있는 작업 단위로 git commit을 남기고 가능하면 push까지 수행해라.
8. 완료했다고 말하기 전에 PC 1440px, mobile 390px에서 직접 확인해라.
9. 실패하거나 확인하지 못한 것은 반드시 실패/미확인이라고 보고해라.

반드시 먼저 읽을 문서:
1. docs/FRONTEND_REBUILD_AUDIT_AND_NEXT_AI_PROMPT.md
2. docs/GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md
3. docs/FRONTEND_QUALITY_GAP_AUDIT_AND_RECOVERY_PLAN.md
4. docs/PLATFORM_TEAM_MASTER_GOAL_PROMPT.md
5. docs/FRONTEND_FIRST_FULL_REDESIGN_PROMPT_20260505.md
6. docs/AI_DEVELOPMENT_DIRECTION_AND_PROMPT.md
7. docs/AI_HANDOFF_PROMPT.md
8. docs/AI_SELF_REVIEW_QUALITY_PROMPT.md
9. docs/API_SPEC.md
10. docs/ROADMAP.md

우선순위:
1. Frontend
2. Backend
3. AI
4. DevOps
5. Docs

최종 제품 목표:
"초보자가 한국 주식을 차트, AI 근거, 쉬운 용어 설명, 관심 후보, 조건형 매수/매도 검토 시나리오로 배우고 비교하는 프리미엄 AI 주식 리서치 웹 플랫폼"

현재 반드시 해결해야 할 문제:
- 화면이 기존과 크게 달라 보이지 않는다.
- 버튼이 너무 많고 복잡하다.
- Toss처럼 깔끔하고 고급스럽지 않다.
- 첫 화면에서 이 서비스가 무엇이고 왜 좋은지 바로 알기 어렵다.
- 원하는 산업, 테마, 기업, 종목을 검색하는 경험이 부족하다.
- 그래프를 기준으로 실제 공부되는 느낌이 약하다.
- AI 기능이 어디인지, 왜 유용한지, 왜 확장 가능한지 잘 보이지 않는다.
- 학습 탭의 주식 용어 설명이 적고 얕다.
- PC와 모바일에서 잘림, 겹침, 화면 끝 붙음 문제가 없어야 한다.

프론트 구현 지시:
- 프론트가 없다고 생각하고 처음부터 전면 재설계해라.
- 기존 App.jsx와 styles.css에 계속 기능을 밀어넣지 마라.
- 필요하면 App shell, Header, Search, Chart workspace, AI panel, Learning, Portfolio, Admin, hooks, API client, CSS token을 분리해라.
- 첫 화면은 정보 과부하를 피한다.
- 첫 화면에는 통합 검색, 메인 차트, AI 핵심 인사이트, 관심 후보 3개 이하, 학습 진입점, 데이터 기준일만 선명하게 둔다.
- 긴 브리프, 검증 상세, 수집 노트, 생성/백필/보관, 긴 TOP 리스트, 외부 링크 반복은 숨기거나 관리자/기록 영역으로 이동한다.
- 버튼은 모바일 앱처럼 적고 명확해야 한다.
- 전면 primary action은 1~3개만 둔다.
- Pretendard를 한국어/영어 기본 폰트로 적용한다.
- Toss처럼 단정하고 신뢰감 있으며, 심플하지만 심심하지 않은 UI로 만든다.
- 과한 장식 대신 데이터, 차트, 검색, AI 결과가 주인공이 되게 한다.
- hover, focus, active, panel transition, tooltip, loading, empty, error state에 150~320ms 수준의 부드러운 micro interaction을 넣어라.

검색 구현 지시:
- 산업, 테마, 기업명, 종목명, 종목코드, 시장, 주식 용어, 오늘 움직인 종목을 검색하게 만들어라.
- 검색 결과에는 종목명/코드, 시장, 최근 등락률, 관련 산업/테마, 차트 보기, AI 설명, 초보자 한 줄 설명을 보여줘라.
- 검색 결과는 PC/mobile에서 잘리거나 hero 영역 안에 갇히면 안 된다.
- 검색 실패 시 추천 검색어, 오늘 관심 후보, AI에게 질문하기를 제공해라.

차트 구현 지시:
- 그래프가 제품의 메인이다.
- 일봉/주봉/월봉 전환을 구현해라.
- 가격 흐름, 거래량, 이동평균선, 이벤트 마커, 공시/뉴스/언급량 마커, AI 해석 마커를 보여줘라.
- 차트 위에 매수 검토, 분할매수 검토, 관망, 매도 검토, 리스크 관리 구간을 표시해라.
- 마커 hover/tap 시 tooltip에 의미, 초보자 설명, 근거, 반대 신호, 리스크, 기준일, 신뢰도, 관련 용어를 보여줘라.
- tooltip은 PC와 모바일 모두에서 절대 잘리면 안 된다.

매수/매도 UX 지시:
- 사용자는 어디를 봐야 하고, 왜 봐야 하며, 언제 매수/매도를 검토할 수 있는지 알고 싶어 한다.
- 단정형 투자 지시가 아니라 조건형/교육형/시나리오형으로 제공해라.
- 금지 표현: 지금 사라, 지금 팔아라, 무조건 추천, 반드시 오른다, 수익 보장.
- 허용 표현: 관심 후보, 살펴볼 만한 이유, 매수 검토 구간, 분할매수 검토 구간, 관망, 매도 검토 구간, 리스크 관리 구간, 이 조건이 확인되면 검토, 이 반대 신호가 나오면 보류.
- 각 후보에는 왜 관심 후보인지, 산업/테마, 차트 상태, 매수 검토 조건, 매도 검토 조건, 관망 조건, 리스크, 초보자 체크리스트, AI 근거 요약, 기준일, 신뢰도를 보여줘라.

학습 탭 구현 지시:
- 학습 탭은 부가 기능이 아니라 초보자 retention의 핵심이다.
- 각 용어에는 아래를 반드시 제공해라.
  1. 핵심 요약 한 줄
  2. 최소 3줄 이상의 쉬운 설명
  3. 차트에서 어디에 보이는지
  4. 왜 중요한지
  5. 초보자가 자주 하는 오해
  6. 실제 시나리오 예시
  7. 관련 차트 구간
  8. 관련 질문
  9. AI에게 물어보기 진입점
- 우선 용어: 등락률, 거래량, 거래대금, PER, PBR, ROE, 공시, DART, 일봉, 주봉, 월봉, 이동평균선, 손절, 분할매수, 추세, 저항선, 지지선, 변동성, 거래정지, 시가총액, 섹터, 테마, 수급.

백엔드 구현 지시:
- 기존 summaries API, 날짜별 조회, 최신 조회, 통계, 인사이트, 생성, 백필, 보관 기능을 삭제하지 마라.
- 검색 API, 종목 차트 API, 이벤트 API, trade-zones API, 포트폴리오 API, AI chat API, 용어 학습 API가 프론트에서 쓰기 쉬운 구조인지 확인하고 부족하면 구현해라.
- 관리자 API와 일반 사용자 API를 분리해라.
- API_SPEC.md와 실제 controller endpoint를 맞춰라.
- pykrx의 get_market_price_change_by_ticker() 등락률을 그대로 믿지 마라.
- 전일 종가 대비 등락률은 OHLCV 당일/전일 종가로 직접 계산해라.
- 거래량 0, 비정상 종목코드, 거래정지 의심 종목을 필터링해라.
- KOSPI/KOSDAQ 상승/하락 1위와 TOP3 첫 항목은 반드시 일치해야 한다.

AI 구현 지시:
- AI는 제품의 핵심 가치로 보여야 한다.
- AI의 내부 사고 과정은 절대 노출하지 마라.
- chain-of-thought, 내부 추론 전문, "제가 단계별로 생각해보면..." 같은 표현은 금지한다.
- 사용자에게는 한 줄 결론, 근거, 반대 신호, 리스크, 초보자 설명, 기준일, 신뢰도, 한계, 출처, 다음 확인 체크리스트만 보여줘라.
- AI 시장 요약, AI 차트 해석, AI 매수/매도 검토 구간 설명, AI 리스크 요약, AI 용어 설명, AI 포트폴리오 점검을 화면에서 명확히 보이게 해라.
- RAG 대상은 daily summaries, stock events, OHLCV/chart signals, search results, learning terms, portfolio sandbox, 추후 DART/news/disclosure다.
- Agentic 역할은 Data Collector, Event Detector, Evidence Ranker, Beginner Explainer, Risk Reviewer, Response Composer로 구성하되 사용자에게 사고 과정으로 보여주지 마라.

DevOps 구현 지시:
- Docker Compose 전체 실행을 유지해라.
- .env.example은 최신화하되 실제 secret 값은 절대 넣지 마라.
- .env, .env.*, API key, DB password, Discord webhook, OpenAI key, admin key는 절대 commit하지 마라.
- healthcheck, 로그 확인 방법, 장애 확인 방법, 배포 점검 절차를 유지해라.
- 의미 있는 작업 단위로 commit하고 가능하면 push해라.

하네스 엔지니어링 루프:
1. 위 문서를 읽고 사용자의 불만과 목표를 다시 정리한다.
2. 실제 코드와 화면을 확인한다.
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

최종 보고에는 반드시 포함해라:
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

## `/goal`에 넣을 짧은 문장

```text
/Users/rose/Desktop/git/kr-stock-daily-brief/docs/NEXT_AI_MASTER_IMPLEMENTATION_PROMPT_20260505_V1.md 를 읽고 그대로 수행해. 프론트가 없다고 생각하고 검색/차트/AI/학습 중심의 Toss급 한국 주식 AI 리서치 플랫폼으로 전면 재설계해. 기존 기능은 삭제하지 말고 사용자/관리자 영역으로 분리해. PC 1440px/mobile 390px에서 잘림 없이 확인하고, 사용자·프론트·백엔드·AI·DevOps·VC 관점 495/500 미만이면 다시 보완해. .env와 secret은 절대 commit하지 말고 완료 시 검증 결과·commit hash·push 여부를 보고해.
```
