# PRD — kr-stock-daily-brief

## 1. 목적 / 한 줄 요약
**한국 주식 시장을 매일 1회 요약 생성하고(자동/수동), DB에 저장한 뒤 프론트 화면에서 달력 형태로 조회**할 수 있게 한다. (추가 목표: Discord 스레드 자동 포스팅)

---

## 2. 사용자 / 사용 시나리오
### 주요 사용자
- 운영자(=관리자): 요약 생성/백필/보관 등 운영 작업 수행
- 일반 사용자: 생성된 요약을 프론트에서 열람

### 핵심 시나리오
1) 사용자는 프론트에서 월 달력을 열고, 특정 날짜 요약을 클릭해 본다.
2) 요약이 없으면 운영자가 “오늘 생성” 또는 “선택일 생성”을 눌러 생성한다.
3) 생성된 결과는 MySQL에 저장되고, 이후 재조회 시 DB 값이 나온다.
4) (추가) 생성이 완료되면 Discord 지정 스레드에 자동으로 요약이 포스팅된다.

---

## 3. 범위 (Scope)
### 포함 (MVP)
- **요약 생성 + 저장(MySQL) + 조회 API**
- **프론트(UI) 달력 조회 + 버튼(생성/백필/보관)**
- marketdata(데이터 계산) 서비스: `/leaders?date=YYYY-MM-DD`
- 운영 안전장치: 미래 날짜 차단, 관리자 키 기반 보호

### 포함 (추가 목표)
- Discord **웹훅(Webhook) 기반** 자동 포스팅(스레드)

### 제외 (현재)
- 사용자 로그인/권한(관리자 키 외)
- 장중 실시간 스트리밍/초단타 업데이트
- 고급 분석(섹터/수급/재무/뉴스 요약 LLM)

---

## 4. 데이터 소스 / 계산 규칙(현재 코드 기준)
### marketdata 서비스 (`marketdata-python`, FastAPI)
- Endpoint: `GET /leaders?date=YYYY-MM-DD`
- 계산
  - **topGainer/topLoser**: pykrx 등락률 데이터 기반(전영업일→해당일)
  - **mostMentioned**: 네이버 금융 종목토론방(board.naver) 게시물 수 기반(거래대금 상위 유니버스에서 Top3)
- 응답에는 TOP3 리스트, 종목코드, 근거 노트(notes) 등이 포함된다.

---

## 5. Backend 기능 요구사항 (API + 저장)
### 저장 단위
- 날짜(YYYY-MM-DD) 1건 = 1개의 Daily Summary
- 저장 내용(대표)
  - topGainer/topLoser/mostMentioned/kospiPick/kosdaqPick
  - topGainers/topLosers/mostMentionedTop (TOP3 리스트 JSON)
  - rawNotes (출처/근거/추적)
  - archivedAt (soft delete)

### API(현재 구현)
- 조회
  - `GET /api/summaries?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - `GET /api/summaries/{date}`
  - `GET /api/summaries/latest`
  - `GET /api/summaries/stats`
  - `GET /api/summaries/insights?from&to`
  - `GET /api/summaries/{date}/verification/krx`
- 생성/운영
  - `POST /api/summaries/{date}/generate`
  - `POST /api/summaries/generate/today`
  - `POST /api/summaries/backfill?from&to` (admin)
  - `PUT /api/summaries/{date}/archive` (admin)

### 정책
- 미래 날짜: generate/archive/backfill 모두 차단(400)
- 이미 존재하는 날짜 재생성(regenerate): admin만 허용(일반 요청은 409)

---

## 6. Frontend(UI) 요구사항
- 첫 화면에서 오늘의 시장 브리프, 데이터 기준일, 주요 종목 흐름, AI 학습 도우미 입력창 표시
- 월 달력 뷰로 날짜별 “요약 존재 여부” 표시
- 날짜 클릭 시 요약 상세(필드 + TOP3 + 근거 링크) 표시
- TOP3 종목 클릭 시 종목 상세 리서치 패널로 연결
- 운영 버튼
  - 오늘 생성
  - 선택일 생성
  - 일괄 생성(backfill)
  - 보관(archive)
  - 운영 버튼은 일반 브리프 화면이 아니라 접힌 운영 관리 영역에 배치

---

## 7. Discord 자동 포스팅 (추가 목표: Webhook)
> 목적: 생성된 ‘오늘 요약’을 팀이 보는 Discord **스레드**에 자동으로 공유.

### 방식
- Discord **Webhook URL**로 HTTP POST
- 스레드에 보내려면 일반적으로 `?thread_id=<THREAD_ID>`가 붙은 형태로 실행한다.

### 환경변수(제안)
- `DISCORD_WEBHOOK_URL` (필수)
  - 예: `https://discord.com/api/webhooks/.../...`
- `DISCORD_THREAD_ID` (선택)
  - 있으면 전송 시 `?thread_id=...` 방식으로 스레드에 포스팅

### 포스팅 포맷(예시)
- 제목: `📌 [2026-02-26] 한국 주식 일간 브리프`
- 본문 예시(최소)
  - 최대 상승: 젠큐릭스 (+68.91%)
  - 최대 하락: 캐리 (-35.42%)
  - 최다 언급(토론방): 한화비전 (60)
  - TOP3 링크: (네이버 일별/종합 등)
  - 생성 시각/출처: pykrx + naver

### 중복 방지(제안)
- DB에 `discordPostedAt`, `discordMessageId` 같은 필드를 추가하거나,
- 최소한 “해당 date에 이미 포스팅했으면 skip”하도록 서버에서 체크.

---

## 8. 스케줄링
- 평일 1회 자동 생성(예: 15:40 Asia/Seoul)
- 정확한 시간은 운영 정책에 따라 조정 가능(마감 후 최종 1회)

---

## 9. 보안 / 운영
- Admin-only 작업은 `ADMIN_KEY`로 보호
- `.env`는 git에 포함하지 않음(.gitignore)

---

## 10. 마일스톤(추천)
1) (완료) 요약 생성/저장/조회 + UI 달력 동작
2) (다음) Discord webhook 자동 포스팅 + 중복방지
3) (다음) 운영 편의(재시도/모니터링/포스팅 상태 표시)
