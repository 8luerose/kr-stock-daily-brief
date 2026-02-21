# kr-stock-daily-brief (MVP)

MVP: stores and serves daily summaries from MySQL, with a small UI to browse a month calendar and generate today's summary.

## Stack

- Backend: Java 17, Spring Boot 3 (Gradle, Flyway, JPA)
- Frontend: React + JavaScript (Vite build, Node runtime server)
- DB: MySQL
- Orchestration: Docker Compose + Makefile wrappers

## Market Data (current)

Historical dates are generated with **pykrx sidecar** first (`marketdata-python /leaders`),
then fallback provider (`MARKETDATA_PROVIDER`, default `naver`) if pykrx is unavailable.

- Primary calculation:
  - Top gainer/loser: `pykrx.get_market_price_change_by_ticker(prev_business_day, date, ALL)`
  - mostMentioned: highest volume (derived rule)
  - KOSPI/KOSDAQ pick: highest volume inside each market (derived rule)
- Ranking transparency fields:
  - `rawTopGainer/rawTopLoser`
  - `filteredTopGainer/filteredTopLoser`
  - `anomalies[]` + `rankingWarning`
  - `leaderExplanations.topGainer/topLoser` (`level`, `summary`, `evidenceLinks`)
- Policy:
  - Extreme return alone does not auto-exclude a mover.
  - Explanations are deterministic (rule-based, no LLM token required).

Note: verification links use direct Naver stock day pages (`item/sise_day.naver?code=...`) and KRX portal/artifact references.

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
- `POST .../generate` behavior:
  - If the date does **not** exist yet → creates the summary.
  - If the date **already exists** → **admin-only regenerate** (otherwise returns `409 summary_already_exists_admin_only_regenerate`).
- Market data fetch uses retry/fallback for resilience (fallback reason is recorded in `rawNotes`).
- For backfill dates before today (`Asia/Seoul`), backend tries pykrx sidecar (`/leaders?date=YYYY-MM-DD`) first, then falls back to existing provider (default naver) and internal fallback placeholders.
- `rawNotes` stores source/rules/fallback reason (debug + trust trace).
- failed fetch means external source retrieval/parsing failed; service retries, then falls back with reason.
- Responses include structured fields (`topGainer`, `topLoser`, `mostMentioned`, `kospiPick`, `kosdaqPick`, `rawNotes`, `createdAt`, `updatedAt`) and also `content`/`generatedAt` for the current MVP UI.
- Responses also include anomaly-aware fields: `rawTopGainer`, `rawTopLoser`, `filteredTopGainer`, `filteredTopLoser`, `anomalies`, `rankingWarning`.
- Responses include `leaderExplanations` for top gainer/loser with beginner-friendly one-line Korean summaries and evidence links.
- Responses include `verification` links. `verification.*DateSearch` now points to direct Naver stock day pages by ticker code (no Naver search links).
- Backfill result rows include `sourceUsed` (`pykrx|fdr|naver|fallback`) and `confidence` (`high|low`).

### Date-specific verification quick guide

- Primary source: open `verification.primaryKrxArtifact` (date-locked evidence endpoint) and `verification.krxDataPortal`.
- Field cross-check: open `verification.topGainerDateSearch`, `verification.topLoserDateSearch`, `verification.mostMentionedDateSearch`, `verification.kospiPickDateSearch`, `verification.kosdaqPickDateSearch` (direct Naver item/day links).
- Limitation: KRX does not provide a stable public deep-link for every `stock + exact date` combination, so KRX is exposed as portal + artifact, with stock-level direct links provided by ticker-based Naver pages.

## Scheduler

A cron job is configured to auto-generate a summary on weekdays at **15:40 Asia/Seoul**.
(If you don't see auto-generation, ensure the OpenClaw cron is enabled and the backend is running.)

## Admin-only operations (ADMIN_KEY)

This project supports a lightweight “admin key” guard for operations that can overwrite data.

- Set `ADMIN_KEY` (non-empty) to enable admin checks.
- Admin is recognized by either:
  - HTTP header: `X-Admin-Key: <ADMIN_KEY>`
  - or query param: `adminKey=<ADMIN_KEY>` (useful for quick manual calls)

Admin-only endpoints/operations:
- Regenerating an **existing** date via `POST /api/summaries/{date}/generate`
- `POST /api/summaries/backfill`
- `PUT /api/summaries/{date}/archive`

Frontend convenience:
- Add `?ak=<ADMIN_KEY>` (or `?adminKey=<ADMIN_KEY>`) to the UI URL. The frontend will attach `X-Admin-Key` automatically.

Example:

```bash
ADMIN_KEY=sekret make up
open "http://localhost:5173/?ak=sekret"

# non-admin regenerate (existing date) -> 409
curl -i -X POST "http://localhost:8080/api/summaries/2026-02-16/generate"

# admin regenerate -> 200
curl -i -H "X-Admin-Key: sekret" -X POST "http://localhost:8080/api/summaries/2026-02-16/generate"
```

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
- `./scripts/recheck_past_dates.sh [YYYY-MM-DD ...]`: re-run past dates and verify values/explanations/source links stay consistent
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
