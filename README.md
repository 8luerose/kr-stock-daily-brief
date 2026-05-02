# kr-stock-daily-brief (MVP)

**목표:** 한국 주식 시장을 날짜별로 요약 생성하고(MySQL에 저장), 초보자도 이해하기 쉬운 **일간 브리프 + 용어 학습 UI**에서 조회한다.

- 데이터 계산: `marketdata` 서비스(`/leaders`)가 “상승/하락/언급 TOP”을 산출
- 저장/제공: `backend`가 요약을 생성/저장하고 REST API로 제공
- 표시/학습: `frontend`에서 월 달력, 일간 브리프, 초보자 용어 사전, 학습 도우미를 제공
- AI 확장점: `/api/learning/assistant`는 현재 내부 용어 사전 기반 응답을 제공하며, 이후 `/api/ai/chat` RAG 서비스로 교체/확장한다.

> 추가 목표: Discord **웹훅(Webhook)**으로 지정 **스레드**에 자동 포스팅

---

## Stack

- Backend: Java 17, Spring Boot 3 (Gradle, Flyway, JPA)
- Frontend: React + JavaScript (Vite)
- Marketdata: FastAPI + pykrx + Naver(크롤링)
- DB: MySQL
- Orchestration: Docker Compose + Makefile wrappers

---

## 빠른 시작(로컬, Docker)

```bash
make up
make health
```

열기:
- UI: http://localhost:5173
- API(예시): http://localhost:8080/api/summaries?from=2026-02-01&to=2026-02-29

오늘 생성:
```bash
curl -X POST "http://localhost:8080/api/summaries/generate/today"
```

특정 날짜 생성:
```bash
curl -X POST "http://localhost:8080/api/summaries/2026-02-26/generate"
```

---

## 시스템 동작(핵심 플로우)

### 1) marketdata: 리더 계산 API
- 서비스: `marketdata-python` (port 8000)
- 핵심 엔드포인트: `GET /leaders?date=YYYY-MM-DD`
- 계산 규칙(현재 코드 기준)
  - **topGainer/topLoser**: pykrx 등락률(전영업일→해당일)에서 상위/하위
  - **mostMentioned**: 네이버 금융 종목토론방(board.naver) 게시물 수 top(거래대금 상위 유니버스에서 TOP3)

응답 예시(축약):
```json
{
  "date": "2026-02-26",
  "effectiveDate": "20260226",
  "topGainer": "젠큐릭스",
  "topLoser": "캐리",
  "mostMentioned": "한화비전",
  "topGainers": [{"code":"229000","name":"젠큐릭스","rate":68.91}],
  "topLosers": [{"code":"313760","name":"캐리","rate":-35.42}],
  "mostMentionedTop": [{"code":"489790","name":"한화비전","count":60}],
  "source": "pykrx(KRX historical change) + naver(item board)",
  "notes": "..."
}
```

### 2) backend: 요약 생성/저장/조회 API
- 서비스: Spring Boot (port 8080)
- 동작: `POST /api/summaries/{date}/generate` 호출 시
  1) marketdata에서 리더 데이터를 받아서
  2) 날짜 1건 요약을 생성하고
  3) MySQL에 저장한 후
  4) 저장된 결과를 JSON으로 반환

### 3) frontend: 브리프 + 학습 UI
- 서비스: Vite/React (port 5173)
- 월 달력에서 날짜를 선택하면 backend API로 조회해서 표시
- 브리프 옆에서 `등락률`, `거래량`, `PER`, `공시`, `종목토론방 언급량` 같은 핵심 용어를 바로 확인
- 학습 도우미에서 선택 날짜와 용어를 묶어 초보자용 설명/주의점/출처/한계를 확인
- 운영 버튼
  - 오늘 생성
  - 선택일 생성
  - 일괄 생성(backfill)
  - 보관(archive)

---

## API (Backend)

조회:
- `GET /api/summaries?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/summaries/{date}`
- `GET /api/summaries/latest`
- `GET /api/summaries/stats`
- `GET /api/summaries/insights?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/summaries/{date}/verification/krx`

생성/운영:
- `POST /api/summaries/{date}/generate`
- `POST /api/summaries/generate/today`
- `POST /api/summaries/backfill?from=YYYY-MM-DD&to=YYYY-MM-DD` (admin)
- `PUT /api/summaries/{date}/archive` (admin)

학습/AI 연결:
- `GET /api/learning/terms`
- `GET /api/learning/terms/{id}`
- `POST /api/learning/assistant`

정책:
- 날짜 포맷은 ISO `YYYY-MM-DD`
- 미래 날짜는 생성/백필/보관 모두 차단
- 이미 존재하는 날짜의 재생성은 admin만 허용(일반 요청은 409)
- 학습 도우미는 투자 지시가 아니라 용어 설명/체크리스트/주의점 제공 목적이다.

---

## Scheduler (Backend)

- 평일 1회 자동 생성 (기본: 15:40 Asia/Seoul)
- 구현: `SummaryScheduler`의 Spring `@Scheduled`

---

## Admin-only operations (ADMIN_KEY)

운영자가 데이터를 덮어쓰거나(재생성) 대량 작업(백필)을 실행할 때 보호 장치.

- Admin 인식 방법
  - HTTP header: `X-Admin-Key: <ADMIN_KEY>`
  - 또는 query param: `adminKey=<ADMIN_KEY>`
  - 또는 trusted CIDR에서의 요청(로컬/도커 내부)

Admin-only:
- 기존 날짜 재생성(=이미 존재하는 date에 대해 generate)
- backfill
- archive

---

## Discord 자동 포스팅 (계획)

**방식:** Discord Webhook URL로 POST 해서, 생성된 요약을 지정 스레드에 올린다.

- (제안) 환경변수
  - `DISCORD_WEBHOOK_URL`
  - `DISCORD_THREAD_ID` (있으면 `?thread_id=` 방식으로 스레드에 포스팅)

포스팅 예시(개념):
- 제목: `[2026-02-26] 한국 주식 일간 브리프`
- 본문: topGainer/topLoser/mostMentioned + TOP3 + 근거 링크

---

## Environment Variables

Copy `.env.example` to `.env` and adjust values for your environment.

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_NAME` | Yes | Database name |
| `DB_USER` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `DB_ROOT_PASSWORD` | Yes | MySQL root password |
| `BACKEND_PORT` | Yes | Backend API port (default: 8080) |
| `FRONTEND_PORT` | Yes | Frontend UI port (default: 5173) |
| `MARKETDATA_PORT` | Yes | Market data service port (default: 8000) |
| `API_BASE_URL` | Yes | Backend URL accessible from frontend |
| `MARKETDATA_PROVIDER` | No | Provider: `pykrx` or `naver` (default: pykrx) |
| `MARKETDATA_BASE_URL` | No | Market data service URL (Docker internal) |
| `PUBLIC_KEY` | No | Access gate key (leave empty to disable) |
| `ADMIN_KEY` | Recommended | Admin key for protected operations |
| `APP_ADMIN_TRUSTED_CIDRS` | No | Comma-separated CIDRs for trusted admin bypass |

---

## Make Targets

- `make up`: build + start services
- `make down`: stop services
- `make logs`: tail logs
- `make generate-today`: generate today summary (Asia/Seoul date)
- `make latest`: get latest saved summary

---

## Docs

- PRD: `./PRD.md`
- (추가 문서가 생기면) `docs/` 폴더에 정리
