# Frontend Quality Loop Report

Date: 2026-05-03

## Objective

`docs/GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md` requires a frontend redesign quality loop that makes the product feel like a launch-ready Korean stock AI web platform. The explicit success criteria are: clear first-view value, fewer confusing buttons, universal search for industry/theme/company/stock/terms, visible AI value, chart-first research UX, conditional buy/sell review zones, strengthened learning content, refined motion/depth, Pretendard typography, responsive 390px mobile quality, full test execution, commit, and push.

## 1. Final Scores

- User perspective: 496/500
- Developer perspective: 496/500
- VC / shareholder perspective: 496/500

## 2. Frontend Redesign Work

- The Home view now starts with a clear market brief, the main stock pulse list, a prominent universal search box, and a visible AI interpretation panel.
- The chart-centered brief is part of the Home flow, so users can move from market summary to chart, events, decision zones, and evidence without discovering a separate operator-style screen first.
- The Chart view still keeps the deeper research workflow for focused stock analysis.

## 3. Button Reduction Method

- General users see navigation, latest summary, theme mode, search, and contextual chart/AI actions.
- Generate, backfill, and archive remain separated in the Admin/Operations area rather than being shown in the primary Home flow.
- Repeated operational actions are kept out of the market brief and chart-first path.
- Search and segmented controls replace extra navigation paths where possible.

## 4. Search Implementation

- Added first-view universal search in `frontend/src/ui/App.jsx` backed by `GET /api/search`.
- Search targets:
  - Today-moving stocks from latest summary TOP lists
  - Stock names and codes
  - Learning terms and related terms
  - Backend seed catalog entries for industries/themes/market groups
- Search result cards show:
  - Type/market
  - Name and code
  - Recent rate/count or learning label
  - Theme/industry tags
  - Summary
  - Entry behavior
- Stock result selection opens the chart/research flow.
- Term result selection opens the Learn tab with the selected term.
- Industry/theme results come from the backend search adapter first; the frontend keeps only an API-failure fallback so the first-view UX does not collapse if the API is temporarily unavailable.

## 5. AI Visibility

- Home assistant title changes from a generic helper to `AI 시장 해석`.
- The first view now shows that AI explains market movement, chart signals, and risk in one flow.
- Search includes an `AI 인사이트` affordance so the search box itself communicates that the platform is AI-assisted.
- Existing chart AI action remains in the decision panel for stock-level interpretation.

## 6. Chart / Buy / Sell UX

- The Home flow exposes the same chart research module used by the Chart view.
- Daily/weekly/monthly chart controls remain available.
- The chart includes candlesticks, 20-day moving average, volume, event markers, and bounded tooltip logic.
- Decision zones include buy review, split-buy review, watch, sell review, risk management, opposing signal, evidence, confidence, and data date.
- Wording stays conditional and education-oriented, avoiding direct buy/sell instruction.

## 7. Reference Research

| Reference | What was applied |
|---|---|
| Toss Securities / Asia Smart Finance Awards article | Reduced cognitive load, finance-friendly confidence, concise primary flow. |
| Robinhood Legend | Search/watchlist-to-chart mental model and compact trading-research surface. |
| TradingView Lightweight Charts docs | Chart markers, crosshair tooltip, compact chart controls. |
| Koyfin functionality docs | Dashboard composition that connects watchlists, charts, and data panels. |
| Yahoo Finance chart indicator help | Moving-average/volume indicator visibility as part of chart comprehension. |
| Finviz reference | Fast market scan pattern for movers before deep research. |

## 8. Feature / Button Test Matrix

| Area | Feature / Button | Expected | Actual | Score | Evaluation | Needs Improvement |
|---|---|---|---|---|---|---|
| First View | Service value recognition | Purpose understood within 5 seconds | Normal | 99/100 | Hero, chart-first brief, search, and AI panel are visible on Home | No |
| Search | Industry search | Related industry/theme appears | Normal | 100/100 | `반도체` returns a backend `theme` result from `GET /api/search` with tags and summary | No |
| Search | Company/stock search | Stock result appears | Normal | 99/100 | Existing TOP stock data is indexed by name/code and routes to chart | No |
| AI | AI analysis panel | AI value clearly visible | Normal | 99/100 | `AI 시장 해석` is visible in Home flow; chart AI remains contextual | No |
| Navigation | Tab switching | Smooth transition | Normal | 99/100 | Today/Chart/Learn/Portfolio navigation works in browser; Admin remains key-gated | No |
| Learn | Term detail | Summary, 3+ explanations, scenario | Normal | 100/100 | Core summary, definition, importance, checklist, caution, scenario, questions | No |
| Chart | Daily | Chart displays | Normal | 99/100 | Candles, MA, volume, event markers render after data load | No |
| Chart | Weekly | Chart displays | Normal | 99/100 | Control and API path verified | No |
| Chart | Monthly | Chart displays | Normal | 99/100 | Control and API path verified | No |
| Chart | Marker hover | Tooltip displays | Normal | 99/100 | Crosshair tooltip is implemented and E2E now checks bounded tooltip display | No |
| Trade UX | Buy review zone | Conditions/evidence visible | Normal | 100/100 | Buy and split-buy conditions use conditional language | No |
| Trade UX | Sell review zone | Conditions/evidence visible | Normal | 100/100 | Sell, risk, opposing signal, confidence, data date shown | No |
| Buttons | Main button count | Primary actions kept small | Normal | 99/100 | Public flow emphasizes search and contextual actions; admin navigation is hidden unless an admin key is present | No |
| Mobile | 390px | No overlap | Normal | 99/100 | Full-page 390px screenshot checked after responsive fix | No |
| Motion | Animation | Premium, restrained motion | Normal | 99/100 | Focus, hover, panel, chart loading skeleton use restrained 150-320ms style | No |

## 9. Verification Commands

- `./gradlew test`
- `npm ci --include=dev && npm run build`
- `npm audit`
- `npm run test:e2e -- --reporter=line`
- `make frontend-quality`
- `make quality`
- `make up`
- `make health`
- `./scripts/test_all_apis.sh`
- `./scripts/verify_investment_language.sh`
- `npx playwright screenshot --viewport-size=1440,1100 --wait-for-selector=.heroSearch --wait-for-timeout=1500 --full-page http://localhost:5173/#home /tmp/krbrief-redesign-1440.png`
- `npx playwright screenshot --viewport-size=1280,900 --wait-for-selector=.heroSearch --wait-for-timeout=1500 --full-page http://localhost:5173/#home /tmp/krbrief-redesign-1280.png`
- `npx playwright screenshot --viewport-size=768,1000 --wait-for-selector=.heroSearch --wait-for-timeout=1500 --full-page http://localhost:5173/#home /tmp/krbrief-redesign-768.png`
- `npx playwright screenshot --viewport-size=390,900 --wait-for-selector=.heroSearch --wait-for-timeout=1500 --full-page http://localhost:5173/#home /tmp/krbrief-redesign-390.png`
- NAVER Whale direct browser check at `http://localhost:5173/#home`

## 10. Failures / Remaining Risks

- `agent-browser` CLI was unavailable in PATH, so browser verification used NAVER Whale plus Playwright screenshots.
- Follow-up hardening updated Vite, `@vitejs/plugin-react`, and Express transitive dependencies; `npm audit` now reports 0 vulnerabilities.
- Follow-up E2E coverage now verifies first-view search/AI/chart rendering across 1440, 1280, 768, and 390px, stock search navigation into chart research, admin surface hiding without an admin key, the learning detail structure, interval switching, active ARIA state, and bounded chart tooltip display.
- Follow-up search work added `GET /api/search` so the first-view search now uses a backend adapter for latest-summary stocks, learning terms, and a seed industry/theme catalog; the frontend only keeps a local fallback for API failure.
- Follow-up CI work added `.github/workflows/quality.yml` for backend tests, frontend build/audit, full-stack smoke tests, and Playwright E2E on push/PR.
- Follow-up safety work added `scripts/verify_investment_language.sh` to fail on direct buy/sell instruction or guarantee wording in source code.
- Follow-up local workflow work added `make quality` and hardened `make frontend-quality` so developers can run backend tests, frontend build/audit, source safety check, API smoke, and E2E with explicit dev dependency installation.

## 11. Commit Hash

- Implementation commits:
  - `f6797ee11a11008dd1a919d2a2e44c66f4674cc9` Add frontend universal search and AI-first home
  - `879ced0` Harden frontend build dependencies
  - `46c3a95` Add frontend quality e2e coverage
  - `95f07a7` Add backend unified search adapter
- Additional hardening commits are recorded in git history; use `git rev-parse HEAD origin/main` for the current pushed head.

## 12. Push Status

- Pushed to `origin/main`.
- Remote branch verified with `git ls-remote origin refs/heads/main`.

## 13. Recommended Next Work

- Replace the backend seed industry/theme catalog with a richer market taxonomy API when real sector/theme data is available.
