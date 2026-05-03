# Frontend Loop State

작성일: 2026-05-04

이 문서는 `FRONTEND_QUALITY_GAP_AUDIT_AND_RECOVERY_PLAN.md`,
`GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md`, `API_SPEC.md`, `ROADMAP.md`를 읽은 뒤
추출한 실행 체크리스트다. 구현, 검증, 점수 산정, 완료 판단은 이 체크리스트를
기준으로 한다.

## 0. 문서 읽기 게이트

- [x] `docs/FRONTEND_QUALITY_GAP_AUDIT_AND_RECOVERY_PLAN.md` 전체 확인
- [x] `docs/GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md` 전체 확인
- [x] `docs/API_SPEC.md` 전체 확인
- [x] `docs/ROADMAP.md` 전체 확인
- [x] 구현 시작 전 요구사항을 이 문서에 섹션별 체크리스트로 추출
- [x] 이 문서 기준으로 코드/브라우저/API 감사 결과를 계속 갱신
- [x] 이 문서 기준으로 기능/버튼별 검증표를 계속 갱신
- [x] 이 문서 기준으로 모바일/PC 점수와 남은 실패 항목을 계속 갱신

## 1. 현재 목표 체크리스트

- [ ] `/Users/rose/Desktop/git/kr-stock-daily-brief`를 출시 전 완성도의 한국 주식 AI 웹 플랫폼으로 만든다.
- [ ] 프론트 완성도를 Toss급 UI/UX 수준으로 끌어올린다.
- [x] 모바일과 PC에서 시각적으로 잘리지 않고, 끝에 붙지 않고, 겹치지 않게 만든다.
- [x] 첫 화면을 chart-first, search-first, AI-first로 만든다.
- [x] 전면 노출 버튼을 핵심 1~3개 중심으로 줄인다.
- [ ] 전체 종목/기업/산업/테마/용어 검색을 제공한다.
- [x] 삼성전자 검색을 보장한다.
- [x] SK하이닉스 검색을 보장한다.
- [x] 현대차 검색을 보장한다.
- [x] 네이버/NAVER 검색을 보장한다.
- [x] 카카오 검색을 보장한다.
- [x] 반도체 검색을 보장한다.
- [x] 2차전지 검색을 보장한다.
- [x] 금융 검색을 보장한다.
- [x] 바이오 검색을 보장한다.
- [x] 거래량 검색을 보장한다.
- [x] PER 검색을 보장한다.
- [x] DART 검색을 보장한다.
- [ ] 실제 LLM 연동을 검증한다.
- [ ] 실제 RAG retrieval과 source-grounded answer를 검증한다.
- [ ] 차트 이벤트 원인 분석을 제공한다.
- [ ] 일봉 차트를 제공한다.
- [ ] 주봉 차트를 제공한다.
- [ ] 월봉 차트를 제공한다.
- [x] 차트가 빈 화면처럼 보이지 않게 한다.
- [x] 마커 hover에 이유를 표시한다.
- [x] 마커 hover에 근거를 표시한다.
- [x] 마커 hover에 신뢰도를 표시한다.
- [x] 마커 hover에 기준일을 표시한다.
- [ ] 매수 검토 구간을 표시한다.
- [ ] 분할매수 검토 구간을 표시한다.
- [ ] 관망 구간을 표시한다.
- [ ] 매도 검토 구간을 표시한다.
- [ ] 리스크 관리 구간을 표시한다.
- [x] AI 답변에 결론을 포함한다.
- [x] AI 답변에 근거를 포함한다.
- [x] AI 답변에 반대 신호를 포함한다.
- [x] AI 답변에 리스크를 포함한다.
- [x] AI 답변에 출처를 포함한다.
- [x] AI 답변에 신뢰도를 포함한다.
- [x] AI 답변에 데이터 기준일을 포함한다.
- [x] AI 답변에 한계를 포함한다.
- [x] App.jsx를 페이지/컴포넌트/hooks/API client 중심으로 더 분해한다.
- [x] styles.css 또는 스타일 모듈을 디자인 토큰/컴포넌트 책임 기준으로 정리한다.
- [ ] 기존 기능 100% 무회귀를 확인한다.
- [ ] Docker/health/API smoke를 유지한다.
- [ ] CI/CD 또는 운영 배포 안정성 체크를 강화한다.
- [ ] 투자자문 리스크 방지 문구와 검토를 유지한다.
- [ ] 실사용자 만족도 수준 UX를 목표로 검증한다.
- [ ] 유지보수성, 재사용성, 가독성을 계속 개선한다.

## 2. 반드시 보존할 기존 기능

- [ ] 최신 브리프 조회 보존
- [ ] 날짜별 브리프 조회 보존
- [ ] 브리프 히스토리 보존
- [ ] 달력 UI/달력 조회 보존
- [ ] 요약 생성 기능 보존
- [ ] 과거 백필 기능 보존
- [ ] 보관/soft delete 기능 보존
- [ ] 검증 상세 보존
- [ ] 수집 노트 보존
- [ ] 용어 학습 보존
- [ ] AI 질문 보존
- [ ] 종목 검색 보존
- [ ] 차트 보존
- [ ] 일봉 전환 보존
- [ ] 주봉 전환 보존
- [ ] 월봉 전환 보존
- [ ] 이벤트 API 보존
- [ ] 포트폴리오 기능 보존
- [ ] Docker Compose 실행 보존
- [ ] health check 보존
- [ ] API smoke 보존
- [ ] 관리자 기능은 삭제하지 않고 일반 사용자와 분리
- [ ] `.env`, `.env.*`, secret, key, password, webhook은 commit 금지
- [ ] 기존 사용자 변경은 되돌리지 않음

## 3. `GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md` 요구사항

### 3.1 핵심 목표와 제품 감성

- [ ] 프론트를 출시 가능한 한국 주식 AI 웹 플랫폼 수준으로 전면 재설계
- [ ] 버튼 과다, 복잡함, 혼란을 구조적으로 해소
- [ ] 첫 화면 5초 안에 서비스 정체성과 사용 가치를 이해 가능
- [ ] 사용자가 산업, 테마, 기업, 종목명을 바로 검색 가능
- [ ] VC가 봐도 AI 기능과 확장성이 즉시 보임
- [ ] Toss 10년차 이상 프론트/백엔드/DevOps 수준의 완성도 지향
- [ ] 단순히 돌아가는 앱이 아니라 프리미엄 웹 플랫폼처럼 보임
- [ ] 프론트 품질을 최우선으로 판단
- [ ] 백엔드 수정은 프론트 경험 완성에 필요한 API/adapter/mock/문서 동기화 목적일 때 수행
- [ ] 프론트가 별로면 레이아웃, 컴포넌트, CSS, IA, 버튼 구조, 정보 구조를 다시 변경
- [ ] 495점 이상 전까지 완료 보고 금지
- [ ] Toss처럼 사소한 UI/UX까지 품질 확보
- [ ] 단정하고 신뢰감 있으며 심플하지만 심심하지 않은 화면
- [ ] 모바일 앱처럼 버튼 수가 적고 명확한 화면
- [ ] 주요 액션은 1~3개만 전면 노출
- [ ] 나머지 기능은 탭, 바텀시트, 오버플로 메뉴, 접힌 관리자 패널, 검색 중심 UX로 정리
- [ ] 글래스모피즘은 반투명 패널, 미세 blur, 얇은 border, 깊이감 shadow, 고급 hover/active, 절제된 배경 레이어 수준으로 제한
- [ ] 장식용 오브, 의미 없는 그래디언트, 과한 배경 효과로 품질을 덮지 않음
- [ ] 그래프와 데이터가 주인공
- [ ] AI 기능은 숨기지 않고 명확히 노출
- [ ] 한국어/영어 모두 Pretendard 우선

### 3.2 첫 화면

- [ ] 첫 화면에서 서비스 정체성이 즉시 보임
- [ ] "오늘 한국 주식시장을 AI와 차트로 이해하는 플랫폼" 느낌
- [ ] 달력 중심 화면에서 탈피
- [ ] 운영자 중심 화면에서 탈피
- [ ] 오늘 시장 핵심 요약 표시
- [ ] 산업/테마/기업/종목 통합 검색 표시
- [ ] 메인 차트 또는 대표 종목 차트 표시
- [ ] AI 분석 패널 표시
- [ ] 상승 TOP 종목 표시
- [ ] 하락 TOP 종목 표시
- [ ] 언급 TOP 종목 표시
- [ ] 배우기/용어/차트 해석 진입점 표시
- [ ] 사용자가 검색/차트/AI 질문 중 무엇을 하면 되는지 즉시 이해

### 3.3 버튼 수 축소

- [ ] 전면 노출 버튼은 정말 중요한 것만 유지
- [ ] 생성 버튼은 일반 사용자에게 보이지 않게 분리
- [ ] 백필 버튼은 일반 사용자에게 보이지 않게 분리
- [ ] 보관 버튼은 일반 사용자에게 보이지 않게 분리
- [ ] 관리자 기능은 접힌 관리자 패널 또는 개발자 모드 또는 URL key admin 영역으로 분리
- [ ] 검색을 버튼 대체 UI로 활용
- [ ] 탭을 버튼 대체 UI로 활용
- [ ] segmented control을 버튼 대체 UI로 활용
- [ ] dropdown을 버튼 대체 UI로 활용
- [ ] toggle을 버튼 대체 UI로 활용
- [ ] bottom sheet를 버튼 대체 UI로 활용
- [ ] contextual action을 버튼 대체 UI로 활용
- [ ] 같은 의미 버튼 반복 제거

### 3.4 검색 기능

- [x] 산업 검색 가능
- [x] 테마 검색 가능
- [x] 기업명 검색 가능
- [x] 종목명 검색 가능
- [x] 종목 코드 검색 가능
- [x] 시장 구분 KOSPI 검색 가능
- [x] 시장 구분 KOSDAQ 검색 가능
- [x] 용어 검색 가능
- [ ] 오늘 움직인 종목 검색 가능
- [ ] 검색창이 첫 화면 핵심 인터랙션
- [ ] 검색 결과에 종목명/코드 표시
- [ ] 검색 결과에 시장 표시
- [ ] 검색 결과에 최근 등락률 표시
- [ ] 검색 결과에 관련 테마/산업 표시
- [ ] 검색 결과에서 AI 설명 진입점 제공
- [ ] 검색 결과에서 차트 보기 진입점 제공
- [ ] mock 또는 fallback은 코드/문서에 명확히 표시
- [ ] 향후 실제 API 연결 지점 명시
- [ ] 검색 실패 시 대체 행동 제공

### 3.5 AI 기능

- [x] AI 기능이 작은 버튼 하나에 숨지 않음
- [x] AI 패널이 제품 핵심 가치처럼 보임
- [ ] "AI 시장 해석" 노출
- [ ] "AI 차트 판단" 노출
- [ ] "AI 리스크 요약" 노출
- [ ] "AI에게 이 종목 물어보기" 노출
- [ ] "왜 올랐는지 AI가 근거로 설명" 흐름 제공
- [x] AI 답변에 한 줄 결론 표시
- [x] AI 답변에 근거 표시
- [x] AI 답변에 반대 신호 표시
- [x] AI 답변에 리스크 표시
- [x] AI 답변에 출처 표시
- [x] AI 답변에 신뢰도 표시
- [x] AI 답변에 데이터 기준일 표시
- [ ] AI가 실제로 유용하다는 체감 제공

### 3.6 차트 중심 UX

- [ ] 그래프가 페이지의 메인
- [ ] 일봉 전환이 자연스럽고 명확
- [ ] 주봉 전환이 자연스럽고 명확
- [ ] 월봉 전환이 자연스럽고 명확
- [ ] 차트가 비어 보이지 않음
- [ ] 가격 흐름 표시
- [ ] 거래량 표시
- [ ] 이동평균선 표시
- [ ] 상승 이벤트 마커 표시
- [ ] 하락 이벤트 마커 표시
- [ ] 공시/뉴스/언급량 마커 표시
- [ ] 매수 검토 구간 표시
- [ ] 분할매수 검토 구간 표시
- [ ] 관망 구간 표시
- [ ] 매도 검토 구간 표시
- [ ] 손절/리스크 관리 구간 표시
- [ ] 마커 hover 시 AI 설명 툴팁 표시
- [ ] 툴팁이 화면 밖으로 나가지 않음
- [ ] 모바일 차트 조작이 답답하지 않음

### 3.7 매수/매도 판단 UX

- [ ] 직접적 수익 보장 표현 금지
- [ ] 무조건적 투자 지시 금지
- [ ] 단정 대신 검토/조건/시나리오 방식 표현
- [ ] 매수 검토 구간에 조건 표시
- [ ] 매수 검토 구간에 근거 표시
- [ ] 매수 검토 구간에 반대 신호 표시
- [ ] 매수 검토 구간에 신뢰도 표시
- [ ] 매수 검토 구간에 데이터 기준일 표시
- [ ] 매수 검토 구간에 초보자 설명 표시
- [ ] 분할매수 검토 구간에 조건/근거/반대신호/신뢰도/기준일/초보자 설명 표시
- [ ] 관망 구간에 조건/근거/반대신호/신뢰도/기준일/초보자 설명 표시
- [ ] 매도 검토 구간에 조건/근거/반대신호/신뢰도/기준일/초보자 설명 표시
- [ ] 리스크 관리 구간에 조건/근거/반대신호/신뢰도/기준일/초보자 설명 표시

### 3.8 배우기 탭

- [ ] 배우기 탭을 초보자 retention 기능으로 강화
- [ ] 용어 첫 줄 핵심 요약 1문장 제공
- [ ] 용어 최소 3줄 이상의 쉬운 설명 제공
- [ ] 용어별 왜 중요한가 제공
- [ ] 용어별 차트에서 언제 확인하는가 제공
- [ ] 용어별 초보자가 자주 하는 오해 제공
- [ ] 용어별 실제 시나리오 예시 제공
- [ ] 용어별 관련 질문 제공
- [ ] 등락률 용어 강화
- [ ] 거래량 용어 강화
- [ ] 거래대금 용어 강화
- [ ] PER 용어 강화
- [ ] PBR 용어 강화
- [ ] ROE 용어 강화
- [ ] 공시 용어 강화
- [ ] DART 용어 강화
- [ ] 일봉 용어 강화
- [ ] 월봉 용어 강화
- [ ] 이동평균선 용어 강화
- [ ] 손절 용어 강화
- [ ] 분할매수 용어 강화
- [ ] 추세 용어 강화
- [ ] 저항선 용어 강화
- [ ] 지지선 용어 강화
- [ ] 긴 텍스트는 접힘/요약/예시 구조로 설계

### 3.9 애니메이션과 depth

- [ ] 평면적이고 템플릿 같은 화면 인상 제거
- [ ] 과한 효과 금지
- [ ] 탭 전환 micro-interaction
- [ ] 검색 포커스 micro-interaction
- [ ] 카드 hover micro-interaction
- [ ] 차트 마커 hover micro-interaction
- [ ] AI 패널 등장 micro-interaction
- [ ] 학습 항목 expand/collapse micro-interaction
- [ ] 로딩 skeleton
- [ ] empty state motion
- [ ] 버튼 press interaction
- [ ] 애니메이션 150ms~320ms 범위
- [ ] reduced motion 고려

### 3.10 폰트와 반응형 텍스트

- [ ] 한국어 Pretendard 우선
- [ ] 영어 Pretendard 우선
- [ ] 숫자 Pretendard 우선
- [ ] font fallback 제공
- [ ] font-size 재정리
- [ ] line-height 재정리
- [ ] font-weight 재정리
- [ ] 좁은 화면에서 글자 겹침 없음
- [ ] 좁은 화면에서 글자 답답함 없음

### 3.11 하네스 루프와 점수

- [ ] Intent Understanding 기록
- [ ] Current State Audit 기록
- [ ] 실제 코드 읽기
- [ ] 로컬 서버 실행
- [ ] 브라우저 직접 확인
- [ ] API 직접 확인
- [ ] 사용자 관점 500점 채점
- [ ] 프론트 개발자 관점 500점 채점
- [ ] 백엔드 개발자 관점 500점 채점
- [ ] DevOps 관점 500점 채점
- [ ] VC/투자자 관점 500점 채점
- [ ] 495점 미만 항목의 재현 가능한 원인 기록
- [ ] 고품질 사이트 5곳 이상 조사
- [ ] Toss 참고
- [ ] 고품질 핀테크 참고
- [ ] 투자/증권 앱 참고
- [ ] AI SaaS 참고
- [ ] 데이터 대시보드 참고
- [ ] 모바일 앱 수준 웹 UX 참고
- [ ] Reference Research에서 UI/UX 분석
- [ ] Reference Research에서 IA 분석
- [ ] Reference Research에서 버튼 수 분석
- [ ] Reference Research에서 검색 경험 분석
- [ ] Reference Research에서 AI 노출 분석
- [ ] Reference Research에서 애니메이션 분석
- [ ] Reference Research에서 모바일 반응형 분석
- [ ] Reference Research에서 에러/빈 상태 분석
- [ ] Re-architecture Plan 기록
- [ ] Implement 기록
- [ ] Test 기록
- [ ] Re-score 기록
- [ ] 모든 관점 495점 이상 전 완료 금지

## 4. `FRONTEND_QUALITY_GAP_AUDIT_AND_RECOVERY_PLAN.md` 요구사항

### 4.1 P0 이슈

- [ ] 이전 496/500 완료 평가는 신뢰하지 않음
- [ ] `FRONTEND_QUALITY_LOOP_REPORT.md`를 완료 보고서가 아니라 증거 기반 진행 보고서로 유지
- [ ] 점수를 실제 코드/브라우저/API 기준으로 다시 산정
- [ ] 각 점수 항목별 근거 기록
- [ ] 브라우저 스크린샷 기록
- [ ] API 결과 기록
- [ ] 테스트 결과 기록
- [ ] 실패 케이스 기록
- [ ] 일반 사용자용 브리프 히스토리 복구/유지
- [ ] 관리자용 운영 모드 별도 진입점 제공
- [ ] adminKey 없는 상태에서 안내 화면 제공
- [ ] 생성/백필/보관은 관리자 영역에 유지
- [ ] 기존 기능 접근 경로 유지
- [x] 전체 KOSPI/KOSDAQ 종목명 검색 인덱스 구축
- [x] 전체 KOSPI/KOSDAQ 종목코드 검색 인덱스 구축
- [x] 시장 구분 검색 인덱스 구축
- [x] 산업/테마 taxonomy 테이블 또는 캐시 추가
- [ ] 검색 결과 타입을 stock/company/industry/theme/market/term으로 분리
- [x] 종목 검색 결과 클릭 시 종목 상세/차트로 이동
- [x] 산업/테마 검색 결과 클릭 시 상세/관련 종목/AI 분석으로 이동
- [ ] 용어 검색 결과 클릭 시 배우기 상세로 이동
- [ ] 검색 실패 시 대체 행동 제공
- [x] ai-service 실제 LLM adapter 추가
- [x] RAG 검색 계층 구현
- [x] RAG 대상 daily_summaries 포함
- [x] RAG 대상 stock_events 포함
- [x] RAG 대상 OHLCV/chart signals 포함
- [x] RAG 대상 learning terms 포함
- [x] RAG 대상 stock universe 포함
- [ ] RAG 대상 DART/news 후보 포함
- [x] 규칙형 응답은 fallback으로만 사용
- [ ] AI 응답마다 retrieval log 저장
- [x] AI 응답마다 source list 저장
- [x] AI 응답마다 confidence 저장
- [x] AI 응답마다 limitation 저장

### 4.2 P1 이슈

- [ ] 차트가 메인 경험으로 설득력 있게 보이도록 강화
- [ ] trade zone API는 단순 현재가 비율을 넘어 더 많은 시장 신호 사용
- [ ] trade zone 데이터에 type 포함
- [ ] trade zone 데이터에 priceRange 포함
- [ ] trade zone 데이터에 condition 포함
- [ ] trade zone 데이터에 evidence 포함
- [ ] trade zone 데이터에 oppositeSignal 포함
- [ ] trade zone 데이터에 confidence 포함
- [ ] trade zone 데이터에 basisDate 포함
- [ ] trade zone 데이터에 beginnerExplanation 포함
- [x] 차트 마커 hover에 이벤트 제목 표시
- [x] 차트 마커 hover에 왜 올랐는지/내렸는지 표시
- [x] 차트 마커 hover에 거래량 변화 표시
- [x] 차트 마커 hover에 관련 뉴스/공시/토론방 근거 표시
- [ ] 차트 마커 hover에 AI 해석 표시
- [x] 차트 마커 hover에 신뢰도 표시
- [ ] 모바일 차트 height 최적화
- [ ] 모바일 gesture 최적화
- [ ] 모바일 tooltip 위치 최적화
- [ ] 첫 화면 primary action 3개 이하
- [ ] 최신 요약은 필요 시 overflow 또는 접힌 패널로 이동
- [ ] 다크 모드는 필요 시 overflow 또는 접힌 패널로 이동
- [ ] 외부 링크는 카드 반복 대신 근거 보기/더보기로 통합
- [ ] 모바일 bottom nav 또는 compact segmented nav 사용 검토
- [ ] 페이지별 핵심 메시지를 하나로 축소
- [ ] 오늘 브리프가 없으면 최신 영업일 브리프 자동 표시
- [ ] 오늘 브리프 없음 문구는 최신 영업일 데이터 표시로 안내
- [ ] 최신 차트와 AI 설명은 항상 보이게 함
- [ ] 빈 상태에서도 검색/AI 질문/최신 브리프 보기 중 하나를 바로 할 수 있게 함

### 4.3 P2 이슈

- [ ] glossary schema 확장
- [ ] 용어 데이터에 `coreSummary` 제공
- [ ] 용어 데이터에 `longExplanation` 제공
- [ ] 용어 데이터에 `whyItMatters` 제공
- [ ] 용어 데이터에 `chartUsage` 제공
- [ ] 용어 데이터에 `commonMisunderstanding` 제공
- [ ] 용어 데이터에 `scenario` 제공
- [ ] 용어 데이터에 `relatedQuestions` 제공
- [ ] 프론트 임시 생성 학습 콘텐츠를 backend 데이터 기반으로 전환
- [ ] "이 용어가 지금 차트에서 어디에 보여?" 기능을 AI와 연결
- [ ] `HomePage` 분리
- [ ] `ResearchPage` 분리
- [ ] `LearningPage` 분리
- [ ] `PortfolioPage` 분리
- [ ] `AdminPage` 분리
- [ ] `UniversalSearch` 재사용 컴포넌트 분리
- [ ] `AiInsightPanel` 재사용 컴포넌트 분리
- [ ] `StockPulseList` 재사용 컴포넌트 분리
- [ ] `StockChartSection` 재사용 컴포넌트 분리
- [ ] `DecisionZonePanel` 재사용 컴포넌트 분리
- [ ] `TermDetail` 재사용 컴포넌트 분리
- [ ] `BriefHistory` 재사용 컴포넌트 분리
- [ ] `AdminOperationsPanel` 재사용 컴포넌트 분리
- [ ] `useSummary` hook 분리
- [ ] `useSearch` hook 분리
- [ ] `useStockResearch` hook 분리
- [ ] `useAiChat` hook 분리
- [ ] `usePortfolioSandbox` hook 분리
- [ ] CSS를 컴포넌트 단위 또는 design token 기반으로 정리

### 4.4 유지보수성, 재사용성, 가독성

- [ ] 한 파일에 화면/API/상태/스타일 책임을 몰아넣지 않음
- [ ] 페이지 단위와 컴포넌트 단위 분리
- [ ] 변경 이유가 명확한 작은 PR/commit 단위 개발
- [ ] API response shape 변경 시 타입/문서/테스트 동시 갱신
- [ ] 하드코딩 seed 데이터는 임시임을 명확히 표시
- [ ] 임시 구현은 TODO와 제거 조건 기록
- [ ] 검색창 재사용 컴포넌트화
- [ ] AI 패널 재사용 컴포넌트화
- [ ] 차트 패널 재사용 컴포넌트화
- [ ] 용어 상세 재사용 컴포넌트화
- [ ] 상태 뱃지 재사용 컴포넌트화
- [ ] 근거 링크 UI 재사용 컴포넌트화
- [ ] copy text와 UI token 분리
- [ ] stock/term/theme/industry 공통 모델 정의
- [ ] 버튼 스타일과 상태 처리 중복 제거
- [ ] loading/empty/error state 공통 패턴화
- [ ] 컴포넌트 역할이 한눈에 보임
- [ ] 함수명은 사용자 행동 또는 도메인 의미를 드러냄
- [ ] 복잡한 계산은 helper로 분리
- [ ] CSS class naming은 구조와 책임을 드러냄
- [ ] 주석은 복잡한 도메인 판단이나 임시 제약 설명에만 사용
- [ ] 신규 UI는 390px에서 확인
- [ ] 신규 UI는 768px에서 확인
- [ ] 신규 UI는 1280px에서 확인
- [ ] 신규 UI는 1440px에서 확인
- [ ] 모든 버튼 클릭 결과가 명확
- [ ] 모든 주요 UI에 loading 상태 존재
- [ ] 모든 주요 UI에 empty 상태 존재
- [ ] 모든 주요 UI에 error 상태 존재
- [ ] 차트 데이터 없음 상태에서도 다음 행동이 명확
- [x] AI 응답은 출처, 기준일, 신뢰도, 한계를 표시

## 5. `API_SPEC.md` 요구사항

### 5.1 문서 운영과 공통 정책

- [ ] 신규 API는 문서에 endpoint/req/res/error를 먼저 추가
- [ ] 구현 후 실제 응답 예시로 문서 갱신
- [ ] 기존 API 변경 시 파라미터/응답 필드/에러 코드 즉시 반영
- [ ] README와 문서 동기화
- [ ] 배포 전 코드와 문서 1:1 확인
- [ ] local base URL은 `http://localhost:8080`
- [ ] Content-Type은 `application/json`
- [ ] 날짜 포맷은 `YYYY-MM-DD`
- [ ] Optional Gate 사용 시 `/api/**`에 `?k=PUBLIC_KEY` 필요
- [ ] `SummaryDto` anomaly-aware 필드 유지

### 5.2 Summary API

- [ ] `GET /api/summaries/stats` 200 응답에 `totalCount` 포함
- [ ] `GET /api/summaries/stats` 200 응답에 `latestDate` 포함
- [ ] `GET /api/summaries/stats` 200 응답에 `latestUpdatedAt` 포함
- [ ] `GET /api/summaries/insights?from&to` 지원
- [ ] insights 응답에 `from`, `to`, `totalDays`, `generatedDays`, `missingDays`, `topMostMentioned`, `topMostMentionedCount` 포함
- [ ] insights에서 `from > to`는 400
- [ ] `GET /api/summaries?from&to` 지원
- [ ] summary list는 날짜 오름차순 목록 반환
- [ ] summary list에서 `from > to`는 400
- [ ] `GET /api/summaries/latest` 지원
- [ ] latest에 저장 요약 없으면 404
- [ ] `GET /api/summaries/{date}` 지원
- [ ] date 형식/값 오류는 400 JSON
- [ ] 해당 날짜 데이터 없음은 404
- [ ] `POST /api/summaries/{date}/generate` 지원
- [ ] date generate는 upsert
- [ ] `PUT /api/summaries/{date}/archive` 지원
- [ ] archive는 physical delete 대신 soft delete
- [ ] archive 응답에 `archivedAt` 포함
- [ ] archive 대상 없음은 404
- [ ] `POST /api/summaries/backfill?from&to` 지원
- [ ] backfill은 날짜 순회 upsert
- [ ] 과거 날짜는 pykrx sidecar `/leaders?date=` 우선
- [ ] pykrx 실패 시 naver/fallback 사용
- [ ] backfill 응답에 `successCount`, `lowConfidenceCount`, `failCount`, `results` 포함
- [ ] backfill `sourceUsed`는 `pykrx|fdr|naver|fallback`
- [ ] backfill `confidence`는 `high|low`
- [ ] `POST /api/summaries/generate/today` 지원
- [ ] today generate는 Asia/Seoul 기준

### 5.3 Learning API

- [ ] `GET /api/learning/terms?query=&category=&limit=` 지원
- [ ] terms query는 용어/설명 검색
- [ ] terms category는 시장/차트/재무/공시/뉴스/리스크 지원
- [ ] terms limit 기본 80, 최대 120
- [ ] term 응답에 `id` 포함
- [ ] term 응답에 `term` 포함
- [ ] term 응답에 `category` 포함
- [ ] term 응답에 `plainDefinition` 포함
- [ ] term 응답에 `whyItMatters` 포함
- [ ] term 응답에 `beginnerCheck` 포함
- [ ] term 응답에 `caution` 포함
- [ ] term 응답에 `relatedTerms` 포함
- [ ] term 응답에 `exampleQuestions` 포함
- [ ] `GET /api/learning/terms/{id}` 지원
- [ ] 없는 용어는 404
- [ ] `POST /api/learning/assistant` 지원
- [ ] learning assistant는 현재 내부 용어 사전 기반 규칙형 응답
- [ ] learning assistant는 향후 `/api/ai/chat` 또는 ai-service 라우팅 연결점 유지
- [ ] learning assistant 응답에 `mode`, `answer`, `confidence`, `matchedTerms`, `sources`, `limitations`, `nextQuestions`, `futureAiEndpoint` 포함
- [ ] learning assistant는 투자 판단 직접 지시 금지
- [ ] learning assistant는 기준일, 출처, 한계, 연결 용어 포함

### 5.4 Stock/Chart API

- [ ] `GET /api/stocks/{code}/chart?range=&interval=` 지원
- [ ] chart code는 6자리 한국 종목 코드
- [ ] chart range는 `1M|3M|6M|1Y|3Y`
- [ ] chart interval은 `daily|weekly|monthly`
- [ ] chart 응답에 `code`, `name`, `interval`, `range`, `priceBasis`, `adjusted`, `asOf`, `data` 포함
- [ ] chart 데이터에 `date`, `open`, `high`, `low`, `close`, `volume` 포함
- [ ] chart 잘못된 code/range/interval은 400
- [ ] chart marketdata 실패는 502
- [ ] `GET /api/stocks/{code}/events?from&to` 지원
- [ ] events code는 6자리 한국 종목 코드
- [ ] events는 가격 급등/급락/거래량 급증 후보 제공
- [ ] events는 교육용 분석 보조 신호이며 매수/매도 지시가 아님
- [ ] event 응답에 `date`, `type`, `severity`, `priceChangeRate`, `volumeChangeRate`, `title`, `explanation`, `evidenceLinks` 포함
- [ ] events 잘못된 code/date range는 400
- [ ] events marketdata 실패는 502
- [ ] `GET /api/stocks/{code}/trade-zones?range=&interval=&riskMode=` 지원
- [ ] trade-zones range는 `1M|3M|6M|1Y|3Y`
- [ ] trade-zones interval은 `daily|weekly|monthly`
- [ ] trade-zones riskMode는 `aggressive|neutral|conservative`
- [ ] trade-zones 응답에 `code`, `name`, `interval`, `range`, `basisDate`, `riskMode`, `confidence`, `zones`, `evidence` 포함
- [ ] zone 응답에 `type`, `label`, `fromPrice`, `toPrice`, `condition`, `evidence`, `oppositeSignal`, `confidence`, `basisDate`, `beginnerExplanation` 포함
- [ ] trade-zones는 직접 투자 지시가 아니라 교육용 검토 구간으로 표현
- [ ] trade-zones 잘못된 code/range/interval/riskMode는 400
- [ ] trade-zones marketdata 실패 또는 차트 데이터 없음은 502
- [x] `GET /api/stocks/universe?query=&limit=` 지원
- [x] stock universe 응답에 `asOf`, `source`, `totalCount`, `count`, `adjustmentNote`, `stocks` 포함
- [x] stock universe `stocks[]`에 `code`, `name`, `market` 포함
- [x] stock universe는 pykrx KOSPI/KOSDAQ ticker list 기반
- [x] stock universe 조회 실패는 502

### 5.5 AI/RAG API

- [x] `GET /api/ai/status` 지원
- [x] `POST /api/ai/chat` 지원
- [x] AI request에 `question`, `contextDate`, `stockCode`, `stockName`, `focus`, `events`, `terms` 지원
- [x] ai-service는 검색/브리프/차트/이벤트/용어를 retrieval 문서로 정리
- [x] `LLM_API_KEY` 또는 `OPENAI_API_KEY`와 `LLM_MODEL`이 있으면 OpenAI-compatible chat completions adapter 호출
- [x] LLM 설정 없음 또는 실패 시 규칙형 RAG fallback
- [x] AI 응답 `mode`는 `rag_llm` 또는 `rag_fallback_rule_based`
- [x] AI 응답에 `answer`, `basisDate`, `confidence`, `sources`, `retrieval`, `limitations`, `oppositeSignals`, `nextQuestions` 포함
- [x] `retrieval.documents`에 답변 생성 근거 기록
- [x] `retrieval.sourceCount` 제공
- [x] `retrieval.llm.enabled` 제공
- [x] `retrieval.llm.used` 제공
- [x] `retrieval.llm.provider` 제공
- [x] `retrieval.llm.model` 제공
- [x] `retrieval.llm.fallbackReason` 제공
- [x] AI 응답에는 기준일, 출처, 신뢰도, 한계, 반대 신호 포함
- [ ] AI는 조건, 리스크, 대안 시나리오로 설명
- [ ] AI는 개인화 투자 조언 금지
- [ ] AI는 수익 보장 금지

### 5.6 Search API

- [ ] `GET /api/search?query=&limit=` 지원
- [ ] query는 필수
- [ ] limit 기본 8, 최대 20
- [ ] 검색 대상은 기업명
- [ ] 검색 대상은 종목 코드
- [ ] 검색 대상은 산업
- [ ] 검색 대상은 테마
- [ ] 검색 대상은 시장 구분
- [ ] 검색 대상은 용어
- [ ] 검색 대상은 오늘 움직인 종목
- [ ] search 응답에 `id`, `type`, `title`, `code`, `market`, `rate`, `tags`, `summary`, `source`, `stockCode`, `stockName`, `termId` 포함
- [ ] `source=latest_summary` 지원
- [ ] `source=learning_terms` 지원
- [x] `source=krx_stock_universe` 지원
- [x] `source=krx_sector_classification` 지원
- [x] `source=naver_theme_taxonomy` 지원
- [x] `source=stock_universe_baseline` 지원
- [x] `source=search_taxonomy_baseline` 지원
- [x] baseline 대표 기업/종목 검색 보장
- [x] baseline 주요 테마 검색 보장
- [x] baseline 주요 산업 검색 보장
- [x] baseline KOSPI/KOSDAQ 검색 보장
- [x] 전체 KRX 종목 universe API/cache 연결
- [x] KRX 업종 taxonomy API/cache 연결
- [x] 외부 테마 taxonomy API/cache 연결

### 5.7 DTO와 검증 가이드

- [ ] `SummaryDto.date` 유지
- [ ] `SummaryDto.topGainer` 유지
- [ ] `SummaryDto.topLoser` 유지
- [ ] `SummaryDto.rawTopGainer` 유지
- [ ] `SummaryDto.rawTopLoser` 유지
- [ ] `SummaryDto.filteredTopGainer` 유지
- [ ] `SummaryDto.filteredTopLoser` 유지
- [ ] `SummaryDto.rankingWarning` 유지
- [ ] `SummaryDto.anomalies` 유지
- [ ] `SummaryDto.mostMentioned` 유지
- [ ] `SummaryDto.kospiPick` 유지
- [ ] `SummaryDto.kosdaqPick` 유지
- [ ] `SummaryDto.rawNotes` 유지
- [ ] `SummaryDto.createdAt` 유지
- [ ] `SummaryDto.updatedAt` 유지
- [ ] `SummaryDto.archivedAt` 유지
- [ ] `SummaryDto.verification` 유지
- [ ] `SummaryDto.leaderExplanations` 유지
- [ ] `SummaryDto.content` UI 호환 필드 유지
- [ ] `SummaryDto.generatedAt` UI 호환 필드 유지
- [ ] 검증은 `primaryKrxArtifact`와 KRX Data Portal 우선
- [ ] 각 필드는 `*DateSearch` 직접 종목 링크로 교차 확인
- [ ] KRX 딥링크 한계와 Naver 코드 기반 링크 사용 근거 유지

## 6. `ROADMAP.md` 요구사항

### 6.1 Phase 0. 신뢰성 마감

- [ ] 휴장일/비거래일 정책 확정
- [ ] 백필 대량 생성 안정화
- [ ] pykrx OHLCV 전일대비 계산 회귀 테스트 유지
- [ ] KOSPI/KOSDAQ 상승/하락 TOP3 첫 항목과 1위 필드 일치 검증
- [ ] 기존 API와 `docs/API_SPEC.md` 동기화

### 6.2 Phase 1. 초보자용 제품 전환

- [x] 주요 주식 용어 사전 API 추가
- [x] 브리프 화면에 초보자 용어 사전 패널 추가
- [x] 브리프 안에 `AI 학습 도우미` 연결 지점 추가
- [x] 첫 화면을 달력 중심에서 `오늘의 시장 브리프` 중심으로 재배치
- [x] 운영 버튼을 관리자 영역 또는 접힌 패널로 분리
- [ ] 어려운 필드명을 초보자 언어로 계속 정리
- [x] TOP3 종목 카드 클릭 후 종목 상세 화면으로 연결

### 6.3 Phase 2. 종목 상세 + 차트 이벤트

- [x] 종목별 OHLCV 조회 API 설계/구현
- [x] 급등/급락/거래량 급증 이벤트 탐지 API 설계/구현
- [x] 검증된 차트 라이브러리 도입
- [x] 캔들차트 구현
- [x] 20일 이동평균선 구현
- [x] 거래량 구현
- [x] 이벤트 마커 구현
- [x] 공격형/중립형/보수형 시나리오별 조건형 매수/분할매수/관망/매도/손절 UX 구현
- [x] 차트 마커 호버 상세 툴팁 고도화
- [ ] 이벤트별 공시/뉴스/언급량 근거 링크 저장 고도화

### 6.4 Phase 3. AI/RAG 기능

- [x] AI 응답 형식의 선행 연결점 추가
- [x] `ai-service` FastAPI 추가
- [x] vector store(Qdrant) Docker Compose 연결
- [x] RAG 대상 1차 정의
- [x] `/api/ai/chat` 구현
- [ ] Risk Reviewer 단계로 매수/매도 단정, 과장, 출처 없는 표현 제거

### 6.5 Phase 4. 포트폴리오 샌드박스

- [x] 관심 종목 저장
- [x] 가상 비중 입력
- [x] 집중도, 변동성 리스크 요약
- [x] 초보자용 위험 설명과 다음 확인 체크리스트 제공
- [ ] 섹터 분류 기반 집중도 고도화
- [ ] 포트폴리오 내 종목별 이벤트/차트 리스크 비교 고도화

### 6.6 Phase 5. 배포/운영

- [x] Docker Compose 전체 실행 보장
- [x] `.env.example` 갱신
- [x] healthcheck 추가
- [x] README/PRD/API_SPEC 최신화
- [x] 운영/배포 가이드 문서화
- [ ] 주요 UX 브라우저 검증 자동화

### 6.7 원칙

- [ ] "지금 사라/팔아라" 형태의 투자 지시 금지
- [x] AI 답변에 출처 표시
- [x] AI 답변에 신뢰도 표시
- [x] AI 답변에 한계 표시
- [x] AI 답변에 데이터 기준일 표시
- [ ] 모르면 모른다고 말함
- [ ] 근거 없는 확정 표현 금지
- [ ] 초보자가 앱을 열었을 때 운영 도구가 아니라 시장 이해 도구로 느껴짐

## 7. 필수 검증 체크리스트

- [x] `npm run build`
- [x] `./gradlew test`
- [x] `make health`
- [x] `./scripts/test_all_apis.sh`
- [x] `./scripts/verify_investment_language.sh`
- [x] 390px viewport 확인
- [x] 768px viewport 확인
- [x] 1280px viewport 확인
- [x] 1440px viewport 확인
- [x] 주요 버튼별 클릭 검증
- [x] 삼성전자 검색 결과 검증
- [x] SK하이닉스 검색 결과 검증
- [x] 현대차 검색 결과 검증
- [x] 네이버/NAVER 검색 결과 검증
- [x] 카카오 검색 결과 검증
- [x] 반도체 검색 결과 검증
- [x] 2차전지 검색 결과 검증
- [x] 금융 검색 결과 검증
- [x] 바이오 검색 결과 검증
- [x] 거래량 검색 결과 검증
- [x] PER 검색 결과 검증
- [x] DART 검색 결과 검증
- [x] 유한양행 검색 결과 검증
- [x] KRX stock universe API 결과 검증
- [x] 일봉 차트 전환 검증
- [x] 주봉 차트 전환 검증
- [x] 월봉 차트 전환 검증
- [x] 마커 hover 검증
- [x] 차트 API 실패 상태 검증
- [ ] 이벤트 없음 상태 검증
- [x] Docker health 검증
- [x] API smoke 검증
- [x] Playwright 또는 브라우저 직접 시각 검증
- [x] 스크린샷 경로 기록
- [x] 테스트 로그 요약 기록

## 8. 기능/버튼별 검증표

| 영역 | 기능/버튼 | 기대 동작 | 실제 결과 | 점수 | 평가 | 개선 필요 |
|---|---|---|---|---:|---|---|
| First View | 서비스 가치 인지 | 5초 안에 목적 이해 | 정상 | 88/100 | H1, 검색, 차트가 첫 화면에 들어옴. Toss급 최종 polish는 부족 | 예 |
| Search | 산업 검색 | 관련 산업/테마 표시 | 정상 | 86/100 | 금융, 반도체, 2차전지, 바이오 smoke 통과. full taxonomy는 아님 | 예 |
| Search | 기업/종목 검색 | 종목 결과 표시 | 정상 | 88/100 | 삼성전자, SK하이닉스, 현대차, 네이버/NAVER, 카카오 smoke 통과 | 예 |
| AI | AI 분석 패널 | AI 기능이 명확히 보임 | 정상 | 88/100 | structured 결론/근거/반대 신호/리스크/출처/신뢰도/기준일/한계 UI 및 API 검증. live LLM 검증 없음 | 예 |
| Navigation | 탭 전환 | 부드럽게 전환 | 정상 | 86/100 | Playwright navigation/skip/admin/history 흐름 통과 | 예 |
| Learn | 용어 상세 | 핵심요약/3줄 설명/시나리오 표시 | 부분 정상 | 78/100 | UI 보강은 있음. backend schema가 목표 구조 전체를 보장하지 않음 | 예 |
| Chart | 일봉 | 차트 표시 | 정상 | 90/100 | Playwright interval test와 viewport screenshot 통과 | 아니오 |
| Chart | 주봉 | 차트 표시 | 정상 | 88/100 | Playwright interval test 통과 | 아니오 |
| Chart | 월봉 | 차트 표시 | 정상 | 88/100 | Playwright interval test 통과 | 아니오 |
| Chart | 마커 hover | 툴팁 표시 | 정상 | 88/100 | 이유, 근거, 신뢰도, 기준일 tooltip 검증 통과. 뉴스/공시 원문 연결 고도화는 남음 | 예 |
| Trade UX | 매수 검토 구간 | 조건/근거 표시 | 정상 | 82/100 | trade-zones API smoke 통과. 신호 산식은 아직 heuristic | 예 |
| Trade UX | 매도 검토 구간 | 조건/근거 표시 | 정상 | 82/100 | trade-zones API smoke 통과. 신호 산식은 아직 heuristic | 예 |
| Buttons | 주요 버튼 수 | 전면 버튼 1~3개 유지 | 정상 | 92/100 | 390/768/1280/1440 첫 viewport 버튼 2개 | 아니오 |
| Mobile | 390px 화면 | 겹침 없음 | 정상 | 88/100 | search/chart first viewport, overflow-x 없음, console error 없음 | 예 |
| Motion | 애니메이션 | 고급스럽고 과하지 않음 | 부분 정상 | 78/100 | hover/surface/transition은 있음. 고급 앱 수준 motion audit는 부족 | 예 |

## 9. 현재 루프 기록

### 9.1 직전 구현 상태

- [x] 대표 stock universe baseline 확장 구현
- [x] 산업/테마/시장 taxonomy baseline 추가 구현
- [x] 검색 API smoke에 대표 검색어 추가
- [x] 검색 단위 테스트 추가
- [x] API 명세 search source 문서 갱신
- [x] frontend 검색 fallback 테마 확장
- [x] `네이버` alias를 `NAVER(035420)` 대표 종목 검색에 연결
- [x] 홈 차트 패널을 브리프 상세보다 먼저 독립 노출
- [x] 390/768/1280/1440 첫 viewport에서 검색과 차트 노출 확인
- [x] 전체 KRX 종목 universe API/cache 구현
- [x] 통합 검색이 `source=krx_stock_universe` 결과를 사용
- [x] baseline 밖 종목 `유한양행(000100)` 검색 검증
- [x] KRX 업종 taxonomy API/cache 구현
- [x] 통합 검색이 `source=krx_sector_classification` 결과를 사용
- [x] Naver Finance 외부 테마 taxonomy API/cache 구현
- [x] 통합 검색이 `source=naver_theme_taxonomy` 결과를 사용
- [ ] live LLM key/model 환경에서 `rag_llm` 실동작 검증은 아직 미완료
- [x] trade zone은 최근 지지/저항/20일 평균/거래량 강도 기반 evidence로 1차 고도화
- [x] frontend API 호출, 검색 debounce, 종목 리서치 로딩, 포트폴리오 저장을 API client/hooks로 분리
- [x] AI chat 응답에 structured 결론/근거/반대 신호/리스크/출처/신뢰도/기준일/한계 계약 추가
- [ ] Toss-perfect 시각 품질은 아직 객관적 달성 아님

### 9.2 직전 검증 로그

- [x] `git diff --check`: 통과
- [x] `backend ./gradlew test --tests com.krbrief.search.SearchServiceTest`: 통과
- [x] `frontend npm run build`: 통과
- [x] `make quality`: exit 0으로 완료
- [x] `make quality` 내부 Playwright E2E: `13 passed`
- [x] 새 상태 문서 작성 이후 `./gradlew test`: 통과
- [x] 새 상태 문서 작성 이후 `npm run build`: 통과
- [x] 새 상태 문서 작성 이후 `make health`: 통과
- [x] 새 상태 문서 작성 이후 `./scripts/verify_investment_language.sh`: 통과
- [x] 새 상태 문서 작성 이후 `./scripts/test_all_apis.sh`: 검색어 13개 포함 통과
- [x] 최종 `make quality`: backend test, frontend build/audit, Docker rebuild/health, investment scan, API smoke, Playwright `13 passed`
- [x] KRX universe 루프 `python3 -m py_compile marketdata-python/app/main.py`: 통과
- [x] KRX universe 루프 `./gradlew test --tests com.krbrief.search.SearchServiceTest --tests com.krbrief.stocks.StockControllerTest`: 통과
- [x] Docker 기준 `GET /api/stocks/universe?query=유한양행&limit=5`: `totalCount=2703`, `000100` 반환
- [x] Docker 기준 `GET /api/search?query=유한양행&limit=5`: `source=krx_stock_universe`, `000100` 반환
- [x] KRX universe 루프 `./scripts/test_all_apis.sh`: `GET /api/stocks/universe`, `GET /api/search finds 유한양행` 포함 통과
- [x] KRX taxonomy 루프 `python3 -m py_compile marketdata-python/app/main.py`: 통과
- [x] KRX taxonomy 루프 `./gradlew test --tests com.krbrief.search.SearchServiceTest --tests com.krbrief.stocks.StockControllerTest`: 통과
- [x] Docker 기준 `GET /api/stocks/sectors?query=의료·정밀기기&limit=5`: `source=pykrx_market_sector_classifications`, `totalCount=29`, `memberCount=103` 반환
- [x] Docker 기준 `GET /api/search?query=의료·정밀기기&limit=8`: `source=krx_sector_classification` 반환
- [x] KRX taxonomy 루프 `./scripts/test_all_apis.sh`: `GET /api/stocks/sectors`, `GET /api/search finds 의료·정밀기기` 포함 통과
- [x] Theme taxonomy 루프 `python3 -m py_compile marketdata-python/app/main.py`: 통과
- [x] Theme taxonomy 루프 `./gradlew test --tests com.krbrief.search.SearchServiceTest --tests com.krbrief.stocks.StockControllerTest`: 통과
- [x] Docker 기준 `GET /api/stocks/themes?query=전선&limit=5`: `source=naver_finance_theme`, `totalCount=264`, `name=전선` 반환
- [x] Docker 기준 `GET /api/search?query=전선&limit=8`: `source=naver_theme_taxonomy` 반환
- [x] Theme taxonomy 루프 `./scripts/test_all_apis.sh`: `GET /api/stocks/themes`, `GET /api/search finds 전선` 포함 통과
- [x] Theme taxonomy 루프 1차 `make quality`: Playwright 4개 viewport에서 `반도체` 검색 결과가 Naver 세부 테마로 채워져 `삼성전자` 누락
- [x] Theme taxonomy 루프 scoring 수정: 외부 테마 부분 일치를 대표 종목 tag match 뒤로 이동, 정확 일치 테마는 유지
- [x] Theme taxonomy 루프 최종 `make quality`: backend test, frontend build/audit, Docker rebuild/health, investment scan, API smoke, Playwright `13 passed`
- [x] LLM status 루프 `python3 -m py_compile ai-service/app/main.py`: 통과
- [x] LLM status 루프 `./gradlew test --tests com.krbrief.ai.AiChatControllerTest`: 통과
- [x] Docker 기준 `GET /api/ai/status`: `configured=false`, `apiKeySet=false`, `modelConfigured=false`, secret 값 미노출
- [x] Docker 기준 `POST /api/ai/chat`: `mode=rag_fallback_rule_based`, `retrieval.sourceCount=2`, `retrieval.llm.used=false`
- [ ] live `rag_llm` 검증은 현재 컨테이너에 `LLM_API_KEY`/`OPENAI_API_KEY`와 `LLM_MODEL`이 없어 차단됨
- [x] Trade-zone evidence 루프 `./gradlew test --tests com.krbrief.stocks.StockTradeZoneServiceTest --tests com.krbrief.stocks.StockControllerTest`: 통과
- [x] Docker 기준 `GET /api/stocks/005930/trade-zones`: 최근 지지선, 최근 저항선, 20일 평균 종가, 거래량 강도, 범위 내 위치 evidence 반환
- [x] Frontend decomposition 루프 `npm run build`: 통과
- [x] Frontend decomposition 루프 `App.jsx`: 989줄 -> 845줄, API client/hooks 4개 파일로 분리
- [x] Frontend decomposition 루프 `make quality`: backend test, frontend build/audit, Docker rebuild/health, investment scan, API smoke, Playwright `13 passed`
- [x] Frontend decomposition 루프 390/768/1280/1440 viewport screenshot 재캡처
- [x] Chart marker tooltip 루프 `npm run build`: 통과
- [x] Chart marker tooltip 루프 `npm run test:e2e -- --reporter=line -g "chart tab supports interval switching"`: 통과
- [x] Chart marker tooltip 루프 최종 `make quality`: backend test, frontend build/audit, Docker rebuild/health, investment scan, API smoke, Playwright `13 passed`
- [x] Chart marker tooltip 루프 스크린샷: `/tmp/krbrief-screens/chart-marker-tooltip-evidence-1440.png`
- [x] AI structured answer 루프 `python3 -m py_compile ai-service/app/main.py`: 통과
- [x] AI structured answer 루프 `npm run build`: 통과
- [x] AI structured answer 루프 Docker 기준 `POST /api/ai/chat`: `structured.conclusion/evidence/opposingSignals/risks/sources/confidence/basisDate/limitations` 반환
- [x] AI structured answer 루프 `./scripts/test_all_apis.sh`: structured answer 필드 포함 통과
- [x] AI structured answer 루프 `npm run test:e2e -- --reporter=line -g "theme search result opens visible AI market interpretation"`: 통과
- [x] AI structured answer 루프 최종 `make quality`: backend test, frontend build/audit, Docker rebuild/health, investment scan, API smoke, Playwright `13 passed`
- [x] AI structured answer 루프 스크린샷: `/tmp/krbrief-screens/ai-structured-answer-1440.png`

### 9.3 최신 viewport 계측

| viewport | first viewport buttons | search visible | chart visible | overflow-x | console errors | screenshot |
|---|---:|---|---|---|---|---|
| 390x900 | 2 | yes | yes | no | 0 | `/tmp/krbrief-screens/frontend-decomposition-mobile-390.png` |
| 768x1000 | 2 | yes | yes | no | 0 | `/tmp/krbrief-screens/frontend-decomposition-tablet-768.png` |
| 1280x900 | 2 | yes | yes | no | 0 | `/tmp/krbrief-screens/frontend-decomposition-laptop-1280.png` |
| 1440x1000 | 2 | yes | yes | no | 0 | `/tmp/krbrief-screens/frontend-decomposition-desktop-1440.png` |

### 9.4 최신 API 검색 검증

- [x] `삼성전자` -> `"stockCode":"005930"`
- [x] `SK하이닉스` -> `"stockCode":"000660"`
- [x] `현대차` -> `"stockCode":"005380"`
- [x] `네이버` -> `"stockCode":"035420"`
- [x] `NAVER` -> `"stockCode":"035420"`
- [x] `카카오` -> `"stockCode":"035720"`
- [x] `반도체` -> `"title":"반도체"`
- [x] `2차전지` -> `"title":"2차전지"`
- [x] `금융` -> `"title":"증권/금융"`
- [x] `바이오` -> `"title":"바이오"`
- [x] `거래량` -> `"termId":"volume"`
- [x] `PER` -> `"termId":"per"`
- [x] `DART` -> `"termId":"dart"`
- [x] `유한양행` -> `"stockCode":"000100"`, `source=krx_stock_universe`
- [x] `의료·정밀기기` -> `source=krx_sector_classification`
- [x] `전선` -> `source=naver_theme_taxonomy`

## 10. 현재 점수

현재 점수는 완료 점수가 아니라 다음 루프의 기준점이다.

| 관점 | 점수 | 근거 | 495 미만 원인 |
|---|---:|---|---|
| 사용자 | 493/500 | 첫 화면 버튼 2개, 검색/차트 첫 viewport 진입, 대표 검색어, KRX universe 종목, KRX 업종, Naver 테마 검색, trade-zone 근거, 마커 tooltip, AI structured 답변 검증 | Toss급 최종 polish, live AI 체감 부족 |
| 프론트 개발자 | 483/500 | 홈 차트 구조 개선, App/CSS 분해, API client, 검색/종목 리서치/포트폴리오 hooks, 마커 tooltip/AI structured E2E 강화 | assistant/history/summary 상태 훅 분리와 최종 visual polish 미완 |
| 백엔드 개발자 | 491/500 | pykrx KOSPI/KOSDAQ stock universe, KRX 업종 taxonomy, Naver 테마 taxonomy, AI status/RAG fallback structured contract, trade-zone 지지/저항/거래량 근거 연결 | live RAG 검증 부족 |
| DevOps 개발자 | 490/500 | make quality, Docker health, API smoke, E2E, investment scan, KRX universe/sector/theme smoke, LLM status smoke 통과 | CI/CD와 운영 배포 안정성 자동화 증거 부족 |
| VC/투자자 | 458/500 | AI/RAG 구조, chart-first/search-first 방향, 전체 종목/KRX 업종/Naver 테마 검색, LLM 설정 가시성, trade-zone 근거, 차트 이벤트 tooltip, AI 답변 구조화 | 실제 LLM/RAG moat와 product polish 증거 부족 |

## 11. 다음 루프 계획

1. 이번 AI structured answer 루프 변경분을 의미 있는 단위로 commit/push한다.
2. 다음 구현 루프는 live LLM/RAG 검증을 우선하되, secret이 없으면 assistant/history/summary 상태 훅 분리를 진행한다.
3. chart marker hover의 뉴스/공시 원문 근거 연결을 더 고도화한다.
4. LearningTerm schema를 목표 문서의 `coreSummary/longExplanation/chartUsage/commonMisunderstanding/scenario` 구조로 확장한다.
5. App state/API 호출을 hooks와 API client로 더 분리한다.
