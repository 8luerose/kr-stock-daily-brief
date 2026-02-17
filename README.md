# kr-stock-daily-brief (MVP)

MVP: stores and serves daily summaries from MySQL, with a small UI to browse a month calendar and generate today's summary.

## Stack

- Backend: Java 17, Spring Boot 3 (Gradle, Flyway, JPA)
- Frontend: React + JavaScript (Vite build, Node runtime server)
- DB: MySQL
- Orchestration: Docker Compose + Makefile wrappers

## Market Data (v1)

Default `MARKETDATA_PROVIDER` is **naver**.

- Source: Naver Finance HTML pages (best-effort crawling)
- v1 rules:
  - Top gainer/loser: from Naver "상승/하락" ranking pages
  - mostMentioned: approximated as highest volume among those ranking pages
  - KOSPI/KOSDAQ pick: highest volume among KOSPI/KOSDAQ rising lists

Note: this is internal-use and may break if Naver changes their HTML.

## Quickstart (Docker)

1. Start everything:

```bash
make up
make health
```

2. Open:

- UI: `http://localhost:5173`
- API: `http://localhost:8080/api/summaries?from=2026-02-01&to=2026-02-29`

3. Generate a day manually (example):

```bash
curl -X POST "http://localhost:8080/api/summaries/2026-02-16/generate"
# or
curl -X POST "http://localhost:8080/api/summaries/generate/today"
# or
make generate-today
```

## API

- `GET /api/summaries/stats`
- `GET /api/summaries/insights?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/summaries?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/summaries/latest`
- `GET /api/summaries/{date}`
- `POST /api/summaries/{date}/generate`
- `PUT /api/summaries/{date}/archive` (soft delete)
- `POST /api/summaries/backfill?from=YYYY-MM-DD&to=YYYY-MM-DD` (returns success/lowConfidence/fail counts)
- `POST /api/summaries/generate/today`

Notes:
- Dates are ISO `YYYY-MM-DD`.
- `POST .../generate` is idempotent: it upserts the summary for that date.
- Market data fetch uses retry/fallback for resilience (fallback reason is recorded in `rawNotes`).
- For backfill dates before today (`Asia/Seoul`), backend tries pykrx sidecar (`/leaders?date=YYYY-MM-DD`) first, then falls back to existing provider (default naver) and internal fallback placeholders.
- `rawNotes` stores source/rules/fallback reason (debug + trust trace).
- failed fetch means external source retrieval/parsing failed; service retries, then falls back with reason.
- Responses include structured fields (`topGainer`, `topLoser`, `mostMentioned`, `kospiPick`, `kosdaqPick`, `rawNotes`, `createdAt`, `updatedAt`) and also `content`/`generatedAt` for the current MVP UI.
- Backfill result rows include `sourceUsed` (`pykrx|naver|fallback`) and `confidence` (`high|low`).

## Scheduler

A cron job is configured to auto-generate a summary on weekdays at **15:40 Asia/Seoul**.
(If you don't see auto-generation, ensure the OpenClaw cron is enabled and the backend is running.)

## Optional Gate (PUBLIC_KEY)

If `PUBLIC_KEY` is set (non-empty), then:

- Backend requires query param `k=PUBLIC_KEY` for all `/api/**` requests.
- Frontend requires `k=PUBLIC_KEY` in the browser URL for UI routes (HTML routes). Static assets are still served.

Example:

```bash
PUBLIC_KEY=secret make up
open "http://localhost:5173/?k=secret"
curl "http://localhost:8080/api/summaries?from=2026-02-01&to=2026-02-29&k=secret"
```

## Make Targets

- `make up`: build + start services
- `make down`: stop services
- `make logs`: tail logs
- `make generate-today`: generate today summary (Asia/Seoul date)
- `make check-month MONTH=YYYY-MM`: query monthly summaries quickly
- `make latest`: get latest saved summary
- `./scripts/qa_public_key.sh`: PUBLIC_KEY on/off 회귀 점검
- `./scripts/validate_backfill_10days.sh`: 최근 과거 10개 영업일 백필 결과를 pykrx `/leaders` 기준과 비교하여 matchRate 출력
- `make qa`: 전체 API 스모크 + PUBLIC_KEY 회귀 점검
- `make backend-test`: run backend API tests

If you use Colima on macOS, you may need:

```bash
make backend-test DOCKER_SOCK="$HOME/.colima/default/docker.sock"
```

## Documentation

- PRD: `docs/PRD.md`
- API 명세: `docs/API_SPEC.md`
- ERD: `docs/ERD.md`
- DB 테이블 명세: `docs/DB_TABLES.md`
- 점검 체크리스트: `docs/CHECKLIST.md`

## Deploy Notes

- Configure environment variables (or `.env`) for `DB_*`, `BACKEND_PORT`, `FRONTEND_PORT`, and optionally `PUBLIC_KEY`.
- For internet-facing deploys, put a reverse proxy (nginx/Caddy/ALB) in front and terminate TLS there.
  - Set `API_BASE_URL` for the frontend to the public backend origin (for example `https://api.example.com`).
