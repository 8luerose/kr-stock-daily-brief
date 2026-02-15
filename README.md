# kr-stock-daily-brief (MVP)

MVP: stores and serves daily summaries from MySQL, with a small UI to browse a month calendar and generate today's summary.

## Stack

- Backend: Java 17, Spring Boot 3 (Gradle, Flyway, JPA)
- Frontend: React + JavaScript (Vite build, Node runtime server)
- DB: MySQL
- Orchestration: Docker Compose + Makefile wrappers

## Quickstart (Docker)

1. Start everything:

```bash
make up
make health
```

2. Open:

- UI: `http://localhost:5173`
- API: `http://localhost:8080/api/summaries?from=2026-02-01&to=2026-02-29`

## API

- `GET /api/summaries?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/summaries/{date}`
- `POST /api/summaries/{date}/generate`

Notes:
- Dates are ISO `YYYY-MM-DD`.
- `POST .../generate` is idempotent: it upserts the summary for that date.
- Responses include structured fields (`topGainer`, `topLoser`, `mostMentioned`, `kospiPick`, `kosdaqPick`, `rawNotes`, `createdAt`, `updatedAt`) and also `content`/`generatedAt` for the current MVP UI.

## Scheduler

Backend generates a summary automatically on weekdays at **15:40 Asia/Seoul**.

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
- `make backend-test`: run backend API tests

If you use Colima on macOS, you may need:

```bash
make backend-test DOCKER_SOCK="$HOME/.colima/default/docker.sock"
```

## Deploy Notes

- Configure environment variables (or `.env`) for `DB_*`, `BACKEND_PORT`, `FRONTEND_PORT`, and optionally `PUBLIC_KEY`.
- For internet-facing deploys, put a reverse proxy (nginx/Caddy/ALB) in front and terminate TLS there.
  - Set `API_BASE_URL` for the frontend to the public backend origin (for example `https://api.example.com`).
