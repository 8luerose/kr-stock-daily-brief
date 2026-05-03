# Frontend Quality Loop Report

Date: 2026-05-04

## Status

This report is not a completion report. It replaces the previous overly optimistic
496/500 assessment with the current evidence-based audit.

The frontend and supporting APIs are materially improved, tested, committed, and
pushed, but the project is not yet at the `GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md`
success bar of 495/500 from every required perspective.

## Objective Restatement

The active goal is to make `kr-stock-daily-brief` feel like a launch-ready Korean
stock AI web platform:

- clear first-view product value
- fewer confusing public buttons
- first-view industry/theme/company/stock/term search
- visible AI market and chart interpretation
- chart-first research UX with conditional trade review zones
- stronger beginner learning content
- responsive mobile and desktop quality
- maintainable frontend structure
- verifiable backend, AI, and DevOps support
- commit and push meaningful work

## Current Scores

| Perspective | Score | Current judgment |
|---|---:|---|
| User | 494/500 | First-view button count, search, chart entry, required representative searches, KRX universe stock search, KRX industry search, Naver theme search, richer trade-zone evidence, chart marker evidence, structured AI answers, and event causal scores now pass, but still not Toss-perfect |
| Frontend developer | 493/500 | Home chart flow, HomePage split, App/CSS split, summary detail, pure utilities, API client, domain hooks, assistant/learning hooks, event list causal scores/factors, marker tooltip evidence, and expanded learning-term UI improved; final visual polish and smaller remaining component boundaries remain |
| Backend developer | 494/500 | pykrx KOSPI/KOSDAQ stock universe, KRX sector classification taxonomy, Naver theme taxonomy, search cache/providers, AI status/RAG fallback contract, structured AI answers, expanded learning-term schema, event evidence sources, source-specific causal score contract, news search/article-body/DART search/DART filing-detail/factor signal fields, and support/resistance/volume-aware trade-zone evidence improved; live RAG depth remains incomplete |
| DevOps developer | 493/500 | Strong local quality gate with ops-check, Docker health, API smoke including KRX universe/sectors/themes and LLM status, E2E coverage, investment-language scan, and tracked secret scan |
| VC / shareholder | 473/500 | AI and chart-first/search-first platform direction plus all-stock, KRX industry, Naver theme search, LLM configuration visibility, trade-zone evidence, event evidence sources, source-specific causal scores, news article-body, DART filing-detail, causal factor signals, expanded learning terms, structured AI answers, and frontend state boundaries are clearer, but live LLM/RAG moat is not fully proven |

## Work Completed In The Recovery Loop

### Functional recovery

- Restored public history access and admin-key-gated operations.
- Kept admin-only generation, archive, and backfill out of the general user flow.
- Added representative stock universe fallback so searches such as `삼성전자` return `005930`.
- Added backend and frontend tests for stock/theme search and route behavior.
- Improved today-missing fallback so latest available summary can still populate the user flow.
- Hardened marketdata Naver board mention collection so timeout expiry returns partial results instead of blocking the summary generation path.

### AI and retrieval

- Added an OpenAI-compatible LLM adapter path in `ai-service`.
- Added retrieval document construction for search, summary, chart, events, and learning terms.
- Kept a rule-based RAG fallback when `LLM_API_KEY`/`OPENAI_API_KEY` or `LLM_MODEL` is not configured.
- Updated API docs and smoke tests to require the `retrieval` response contract.

### Frontend structure

- Split major UI sections out of `App.jsx`:
  - `frontend/src/ui/AppSections.jsx`
  - `frontend/src/ui/AppPanels.jsx`
  - `frontend/src/ui/AppConstants.js`
- Extracted the summary detail flow into `frontend/src/ui/SummaryDetailPanel.jsx`.
- Extracted pure formatting, search, date, chart, and decision helper functions into `frontend/src/ui/AppUtils.js`.
- Reduced `App.jsx` from 2218 lines to 959 lines.
- Added `frontend/src/ui/apiClient.js` plus search, stock research, portfolio, and brief data hooks.
- Reduced `App.jsx` again from 845 lines to 657 lines by moving summary/history data loading into `useBriefData`.
- Added `frontend/src/ui/hooks/useLearningTerms.js` for learning term loading, filtering, selection, and brief-term derivation.
- Added `frontend/src/ui/hooks/useAssistantFlows.js` for market assistant, learning assistant, and chart AI request/response state.
- Reduced `App.jsx` again from 657 lines to 511 lines by moving learning and AI flow state out of the page shell.
- Added `frontend/src/ui/HomePage.jsx` for home-only hero and compact chart research rendering.
- Reduced `App.jsx` again from 511 lines to 501 lines while keeping home chart-first behavior unchanged.
- Split the old single 2861-line `styles.css` into imported modules:
  - `styles/foundation.css`
  - `styles/panels.css`
  - `styles/brief-detail.css`
  - `styles/stock-research.css`
  - `styles/product-refresh.css`
- Collapsed repeated evidence links and developer/raw detail controls behind native disclosures.
- Added a dedicated stock `trade-zones` API and connected the chart decision panel to it with client-side fallback.

### First-view UX refresh

- Replaced the dynamic stock-mover headline with a clearer product value headline:
  - `AI가 오늘 한국 주식 흐름을 차트와 근거로 정리합니다`
- Reduced first-viewport visible button count from:
  - Desktop: 19 -> 2
  - Mobile: 10 -> 2
- Converted home-market pulse rows from primary buttons into compact signal cards.
- Hid closed overflow-menu buttons from layout measurement and visual focus.
- Moved the chart-first research panel above the home AI assistant and compacted mobile hero spacing.
- Reordered the home summary so the stock chart and decision zones appear before secondary brief terms and raw detail sections.
- In the latest loop, moved the home chart panel out of the brief-detail card and directly under the hero so search and chart are both visible in the first viewport on 390, 768, 1280, and 1440 widths.

### Search taxonomy loop

- Added `SearchTaxonomyCatalog` for baseline theme, industry, and market results.
- Expanded `StockUniverseCatalog` to a broader representative KOSPI/KOSDAQ universe.
- Added pykrx-backed `GET /api/stocks/universe` for KOSPI/KOSDAQ stock universe lookup.
- Connected unified search to a cached backend KRX stock universe provider with baseline fallback.
- Verified baseline-outside stock search with `유한양행(000100)` returning `source=krx_stock_universe`.
- Added pykrx-backed `GET /api/stocks/sectors` for KRX KOSPI/KOSDAQ sector classification lookup.
- Connected unified search to a cached backend KRX sector taxonomy provider with baseline fallback.
- Verified KRX industry search with `의료·정밀기기` returning `source=krx_sector_classification`.
- Added Naver Finance-backed `GET /api/stocks/themes` for external theme taxonomy lookup.
- Connected unified search to a cached backend Naver theme taxonomy provider with baseline fallback.
- Verified external theme search with `전선` returning `source=naver_theme_taxonomy`.
- Added Korean `네이버` alias support for `NAVER(035420)`.
- Extended backend search tests and API smoke tests for:
  - `삼성전자`, `SK하이닉스`, `현대차`, `네이버`, `NAVER`, `카카오`
  - `유한양행`
  - `의료·정밀기기`
  - `전선`
  - `반도체`, `2차전지`, `금융`, `바이오`
  - `거래량`, `PER`, `DART`
- Documented `GET /api/stocks/universe`, `GET /api/stocks/sectors`, `GET /api/stocks/themes`, `source=krx_stock_universe`, `source=krx_sector_classification`, `source=naver_theme_taxonomy`, `source=stock_universe_baseline`, and `source=search_taxonomy_baseline` in `docs/API_SPEC.md`.
- Created `docs/FRONTEND_LOOP_STATE.md` as the current prompt-to-artifact checklist and loop state.

### Reference research notes

The prompt requires a reference pass when the score is below 495/500. The current loop used these reference signals:

- Toss Design System: mobile-first component discipline, bottom CTA patterns, and restrained action hierarchy (`https://developers-apps-in-toss.toss.im/design/components.html`)
- Robinhood design policy: simple, intuitive investing UX and mobile familiarity as an accessibility strategy (`https://robinhood.com/us/en/policy/design/`)
- Revolut stocks page: stock discovery, charts, market news, curated collections, and risk disclosure as one invest flow (`https://www.revolut.com/en-US/stocks/`)
- Linear homepage/design refresh: low-noise product surfaces, AI workflows, and speed/focus positioning (`https://linear.app/homepage`, `https://linear.app/now/behind-the-latest-design-refresh`)
- Stripe design/dashboard docs: dashboard home surfaces should route users to core workflows and show a relevant business overview (`https://docs.stripe.com/stripe-apps/design`, `https://docs.stripe.com/dashboard/basics`)

## Prompt-To-Artifact Checklist

| Requirement | Evidence | Status |
|---|---|---|
| Read recovery plan | `docs/FRONTEND_QUALITY_GAP_AUDIT_AND_RECOVERY_PLAN.md` reviewed | Done |
| Re-check goal prompt | `docs/GOAL_FRONTEND_QUALITY_LOOP_PROMPT.md` reviewed against current code | Done |
| Meaningful commits | `baa571e`, `40f7dc8`, `2ea8098`, `861b9a1`, `9f234bd`, `6458f0c`, `1562ba9`, `d60a040`, `f1967ed`, plus this search taxonomy/chart-first commit | Done |
| Push to origin | `origin/main` updated through the latest recovery-loop commit | Done |
| Search for representative stock | `scripts/test_all_apis.sh` checks 삼성전자, SK하이닉스, 현대차, 네이버/NAVER, 카카오 | Done |
| Search for KRX universe stock | `scripts/test_all_apis.sh` checks `/api/stocks/universe?query=유한양행` and `/api/search?query=유한양행` -> `000100` | Done |
| Search for KRX industry taxonomy | `scripts/test_all_apis.sh` checks `/api/stocks/sectors?query=의료·정밀기기` and `/api/search?query=의료·정밀기기` -> `source=krx_sector_classification` | Done |
| Search for external theme taxonomy | `scripts/test_all_apis.sh` checks `/api/stocks/themes?query=전선` and `/api/search?query=전선` -> `source=naver_theme_taxonomy` | Done |
| Search for required themes/terms | `scripts/test_all_apis.sh` checks 반도체, 2차전지, 금융, 바이오, 거래량, PER, DART | Done |
| Visible AI panel | Home and search flows expose AI market interpretation | Done |
| AI retrieval contract | `/api/ai/chat` returns `retrieval` and `sourceCount` | Done |
| LLM configuration status | `/api/ai/status` returns configured/apiKey/model booleans without exposing secret values | Done |
| Desktop responsive | Playwright desktop/laptop checks pass | Done |
| Mobile responsive | Playwright tablet/mobile checks pass | Done |
| Backend tests | `./gradlew test` via `make quality` | Done |
| Frontend build/audit | `npm ci --include=dev && npm run build && npm audit` via `make quality` | Done |
| Docker health | `make health` via `make quality` | Done |
| API smoke | `./scripts/test_all_apis.sh` via `make quality` | Done |
| E2E | Playwright `13 passed` via `make quality` | Done |
| First-view button reduction | Desktop first viewport `2`, mobile first viewport `2` from Playwright DOM measurement | Done |
| Chart-first responsive audit | Chart enters first viewport on 390 mobile, 768 tablet, 1280 laptop, and 1440 desktop after the home chart extraction | Done |
| Loop state checklist | `docs/FRONTEND_LOOP_STATE.md` extracts requirements from the four required docs and records current evidence | Done |
| Reference research | Toss, Robinhood, Revolut, Linear, Stripe reviewed for next-loop UI direction | Done |
| 495/500 all perspectives | Current scores remain below 495 | Not done |
| Full Toss-level redesign | Improved, but still not objectively perfect | Not done |
| Real live LLM quality | Adapter and status endpoint exist, but current container has no configured live key/model | Not done |
| Full KRX stock universe | pykrx-backed KOSPI/KOSDAQ stock universe API/cache exists and is smoke-tested | Done |
| KRX industry taxonomy | pykrx-backed KOSPI/KOSDAQ sector classification API/cache exists and is smoke-tested | Done |
| Full external theme taxonomy | Naver Finance-backed theme taxonomy API/cache exists and is smoke-tested | Done |
| Richer trade-zone evidence | `GET /api/stocks/{code}/trade-zones` now includes support, resistance, moving-average, volume-strength, and range-position evidence | Done |
| Trade-zone backend API | `GET /api/stocks/{code}/trade-zones` added, documented, smoke-tested, and used by the chart decision panel | Done |
| Frontend API client split | `frontend/src/ui/apiClient.js` owns authenticated API request/error formatting behavior | Done |
| Frontend hooks split | `useSearchResults`, `useStockResearch`, and `usePortfolio` move search debounce, stock research loading, and portfolio persistence out of `App.jsx` | Done |
| Brief data hook split | `useBriefData` moves selected date, month overview, stats, insights, KRX artifact loading, latest, generate, archive, and backfill flows out of `App.jsx` | Done |
| Assistant/learning hook split | `useLearningTerms` and `useAssistantFlows` move learning term state plus market/learning/chart AI request state out of `App.jsx`; `App.jsx` is now 511 lines | Done |
| HomePage split | `frontend/src/ui/HomePage.jsx` owns the home hero and compact stock research render path; `App.jsx` is now 501 lines | Done |
| Chart marker hover evidence | `StockPriceChart` tooltip now shows marker reason, evidence, confidence, and 기준일 when the hovered date has chart events | Done |
| AI structured answer | `/api/ai/chat` and the AI panel now expose conclusion, evidence, opposing signals, risks, sources, confidence, basis date, and limitations as first-class fields | Done |
| Event evidence sources | `GET /api/stocks/{code}/events` now returns structured price, finance, news, DART disclosure, and discussion evidence sources while preserving legacy links | Done |
| Event causal scoring | `GET /api/stocks/{code}/events` now returns source-specific `causalScores` with score, confidence, basis, interpretation, signal count, matched keywords, signal summary, signal origins, and signal URLs; event list and chart tooltip render the top causal score and available text evidence | Done |
| DART filing-detail signals | `GET /api/stocks/{code}/events` now follows DART disclosure rows to `dsaf001/main.do` and `report/viewer.do`, extracts filing body snippets, and exposes `dart_filing_detail` in `signalOrigins` | Done |
| Causal factor scoring | `GET /api/stocks/{code}/events` now classifies text signals into `causalFactors`, `causalDirection`, and `evidenceLevel`; event list and chart tooltip expose the factor/evidence metadata | Done |
| Learning term expanded schema | `GET /api/learning/terms` now returns `coreSummary`, `longExplanation`, `chartUsage`, `commonMisunderstanding`, and `scenario`; learning UI and assistant use those fields | Done |
| Learning related questions alias | `GET /api/learning/terms` and `POST /api/learning/assistant` now return `relatedQuestions` alongside preserved `exampleQuestions` | Done |
| Playwright dependency stability | `@playwright/test` is exact-pinned to `1.59.1`; npm cache was refreshed after a local partial package install omitted `playwright/lib/program.js` | Done |
| Ops guard | `make ops-check` validates Docker Compose config and fails on tracked env files or obvious secret tokens; CI runs it before stack startup | Done |

## Latest Verification Commands

The latest local state was verified with:

```bash
make quality
```

The command covered:

- backend Gradle tests
- frontend dependency install
- frontend production build
- npm audit
- Docker Compose rebuild
- service health checks
- investment-language safety scan
- API smoke tests
- Playwright E2E across responsive viewports

Result: full pass. The command completed ops-check, backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright E2E with `13 passed`.

The latest search/taxonomy and chart-first loop was verified with:

```bash
git diff --check
python3 -m py_compile marketdata-python/app/main.py
python3 -m py_compile ai-service/app/main.py
./gradlew test
npm run build
./scripts/test_all_apis.sh
make quality
```

Result: backend tests passed, frontend production build passed, API smoke passed including expanded search queries, `유한양행` KRX universe search, `의료·정밀기기` KRX industry search, `전선` Naver theme search, and `/api/ai/status`, investment-language scan passed, and Playwright `13 passed`.

Additional live Docker API checks:

- `GET /api/stocks/universe?query=유한양행&limit=5`: `totalCount=2703`, `stocks[0].code=000100`, `source=pykrx_market_ticker_list`
- `GET /api/search?query=유한양행&limit=5`: `stockCode=000100`, `source=krx_stock_universe`
- `GET /api/stocks/sectors?query=의료·정밀기기&limit=5`: `totalCount=29`, `sectors[0].memberCount=103`, `source=pykrx_market_sector_classifications`
- `GET /api/search?query=의료·정밀기기&limit=8`: `title=의료·정밀기기`, `source=krx_sector_classification`
- `GET /api/stocks/themes?query=전선&limit=5`: `totalCount=264`, `themes[0].name=전선`, `source=naver_finance_theme`
- `GET /api/search?query=전선&limit=8`: `title=전선`, `source=naver_theme_taxonomy`
- `GET /api/ai/status`: `configured=false`, `apiKeySet=false`, `modelConfigured=false`, secret values not returned
- `POST /api/ai/chat`: current environment returns `mode=rag_fallback_rule_based`, `retrieval.sourceCount=2`, `retrieval.llm.used=false`
- `GET /api/stocks/005930/trade-zones`: evidence includes recent support, recent resistance, 20-day average close, 20-day average volume, volume strength, and support-resistance range position
- Frontend decomposition loop `npm run build`: passed after reducing `App.jsx` from 989 lines to 845 lines and adding API client/hooks boundaries
- Frontend decomposition loop `make quality`: backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- Chart marker tooltip loop `npm run build`: passed
- Chart marker tooltip loop targeted Playwright: `chart tab supports interval switching and bounded tooltip display` passed after frontend container rebuild
- Chart marker tooltip loop final `make quality`: backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- AI structured answer loop `python3 -m py_compile ai-service/app/main.py`: passed
- AI structured answer loop `npm run build`: passed
- AI structured answer loop Docker `POST /api/ai/chat`: returned `structured.conclusion`, `evidence`, `opposingSignals`, `risks`, `sources`, `confidence`, `basisDate`, and `limitations`
- AI structured answer loop `./scripts/test_all_apis.sh`: passed with structured answer field checks
- AI structured answer loop targeted Playwright: `theme search result opens visible AI market interpretation` passed with structured UI checks
- AI structured answer loop final `make quality`: backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- Event evidence source loop `python3 -m py_compile marketdata-python/app/main.py`: passed
- Event evidence source loop `./gradlew test --tests com.krbrief.stocks.StockControllerTest`: passed
- Event evidence source loop `npm run build`: passed
- Event evidence source loop Docker `GET /api/stocks/005930/events`: returned `evidenceSources` with `price_history`, `finance_summary`, `news`, `disclosure`, and `discussion`
- Event evidence source loop `./scripts/test_all_apis.sh`: passed with news/disclosure evidence source checks
- Event evidence source loop targeted Playwright: `chart tab supports interval switching and bounded tooltip display` passed with event source UI checks
- Event evidence source loop final `make quality`: backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- Ops guard loop `make ops-check`: passed Docker Compose config validation and tracked env/secret scan
- Ops guard loop `.github/workflows/quality.yml`: now runs `make ops-check` before starting the Docker stack
- Ops guard loop `make quality`: now starts with `ops-check`
- Ops guard loop final `make quality`: ops-check, backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- Brief data hook loop `npm run build`: passed
- Brief data hook loop `npm run test:e2e -- --reporter=line -g "history page|admin direct route"`: `2 passed`
- Brief data hook loop final `make quality`: ops-check, backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- Brief data hook loop `App.jsx`: reduced from 845 lines to 657 lines; `useBriefData.js` added with 236 lines
- Event causal scoring loop `python3 -m py_compile marketdata-python/app/main.py`: passed
- Event causal scoring loop `./gradlew test --tests com.krbrief.stocks.StockControllerTest`: passed
- Event causal scoring loop `npm run build`: passed
- Event causal scoring loop Docker `GET /api/stocks/005930/events`: returned `causalScores[0].sourceType=price_history`, score/confidence/basis/interpretation, and lower-confidence news/disclosure candidates
- Event causal scoring loop final `make quality`: ops-check, backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- Event text causal scoring loop `python3 -m py_compile marketdata-python/app/main.py`: passed
- Event text causal scoring loop `./gradlew test --tests com.krbrief.stocks.StockControllerTest`: passed
- Event text causal scoring loop `npm run build`: passed
- Event text causal scoring loop Docker `GET /api/stocks/005930/events`: returned news causal score with `signalCount=5`, matched keywords including `거래량`, `계약`, `공급`, `공시`, `반도체`, and a text `signalSummary`
- Event text causal scoring loop final `make quality`: ops-check, backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- Event article-body causal scoring loop `python3 -m py_compile marketdata-python/app/main.py`: passed
- Event article-body causal scoring loop `./gradlew test --tests com.krbrief.stocks.StockControllerTest`: passed
- Event article-body causal scoring loop `npm run build`: passed
- Event article-body causal scoring loop Docker `GET /api/stocks/005930/events`: returned `signalOrigins=["article_body","search_result"]`, 3 `signalUrls`, and 27 article-body-backed causal signals for Samsung Electronics sample range
- Event article-body causal scoring loop final `make quality`: ops-check, backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- DART filing-detail causal scoring loop `python3 -m py_compile marketdata-python/app/main.py`: passed
- DART filing-detail causal scoring loop `./gradlew test --tests com.krbrief.stocks.StockControllerTest`: passed
- DART filing-detail causal scoring loop Docker `GET /api/stocks/005930/events?from=2025-11-01&to=2026-05-04`: returned 27 `dart_filing_detail` causal scores, 3 real DART `rcpNo` detail URLs in the sample, and a filing-body `signalSummary`
- DART filing-detail causal scoring loop final `make quality`: ops-check, backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- Playwright dependency recovery: the first full quality run reached API smoke and then failed on a local partial `playwright@1.59.1` install missing `playwright/lib/program.js`; after npm cache refresh and exact pinning, targeted E2E and final `make quality` both passed
- Causal factor scoring loop `python3 -m py_compile marketdata-python/app/main.py`: passed
- Causal factor scoring loop `./gradlew test --tests com.krbrief.stocks.StockControllerTest`: passed
- Causal factor scoring loop `npm ci --include=dev && npm run build`: passed
- Causal factor scoring loop Docker `GET /api/stocks/005930/events?from=2025-11-01&to=2026-05-04`: news sample returned `causalFactors`, `causalDirection=mixed`, `evidenceLevel=body`; DART sample returned `sourceType=disclosure`, `score=62`, `confidence=medium`, `causalFactors` including `투자/증설`, `자본조달/지분 변동`, `수주/공급 계약`, and `주주환원`
- Causal factor scoring loop `./scripts/test_all_apis.sh`: ALL PASS with `causalFactors`, `causalDirection`, and `evidenceLevel` checks
- Causal factor scoring loop `./scripts/verify_investment_language.sh`: passed
- Causal factor scoring loop final `make quality`: ops-check, backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- LearningTerm schema loop `./gradlew test --tests com.krbrief.learning.LearningTermCatalogTest --tests com.krbrief.learning.LearningAssistantServiceTest --tests com.krbrief.search.SearchServiceTest`: passed after adding relevance sorting so `거래량` returns `volume` first
- LearningTerm schema loop `npm ci --include=dev && npm run build`: passed
- LearningTerm schema loop Docker `GET /api/learning/terms?query=PER&limit=5`: returned `coreSummary`, `longExplanation`, `chartUsage`, `commonMisunderstanding`, and `scenario`
- LearningTerm schema loop Docker `GET /api/learning/terms?query=거래량&limit=5`: returned `volume` as the first result
- LearningTerm schema loop Docker `POST /api/learning/assistant`: returned expanded matched term fields and answer sections including `차트에서 보는 법` and `시나리오 예시`
- LearningTerm schema loop final `make quality`: ops-check, backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- Assistant/learning hook split `frontend npm ci --include=dev`: passed with 0 vulnerabilities after clearing a local partial Playwright package cache
- Assistant/learning hook split `frontend npm run build`: passed after reducing `App.jsx` from 657 lines to 511 lines and adding `useLearningTerms`/`useAssistantFlows`
- Assistant/learning hook split final `make quality`: ops-check, backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- LearningTerm `relatedQuestions` alias loop `./gradlew test --tests com.krbrief.learning.LearningTermCatalogTest --tests com.krbrief.learning.LearningAssistantServiceTest --tests com.krbrief.search.SearchServiceTest`: passed
- LearningTerm `relatedQuestions` alias loop `frontend npm run build`: passed
- LearningTerm `relatedQuestions` alias loop final `make quality`: ops-check, backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- HomePage split loop `frontend npm ci --include=dev --prefer-online && npm run build`: passed after adding `HomePage.jsx` and reducing `App.jsx` from 511 lines to 501 lines
- HomePage split loop final `make quality`: ops-check, backend tests, frontend build/audit, Docker rebuild/health, investment scan, API smoke, and Playwright `13 passed`
- The first full `make quality` run after adding Naver themes failed because partial theme matches pushed `삼성전자` out of the `반도체` first-view search results. Search scoring now keeps exact theme matches and representative stock tag matches ahead of external partial theme matches. The final `make quality` run passed with Playwright `13 passed`.

Additional screenshots were captured from the Docker-served frontend:

- `/tmp/krbrief-screens/audit-desktop-css-split.png`
- `/tmp/krbrief-screens/audit-mobile-css-split.png`
- `/tmp/krbrief-screens/audit-desktop-summary-panel.png`
- `/tmp/krbrief-screens/audit-mobile-summary-panel.png`
- `/tmp/krbrief-screens/current-desktop-home-loop2g.png`
- `/tmp/krbrief-screens/current-tablet-home-loop2g.png`
- `/tmp/krbrief-screens/current-mobile-home-loop2g.png`
- `/tmp/krbrief-screens/loop-state-mobile-390.png`
- `/tmp/krbrief-screens/loop-state-tablet-768.png`
- `/tmp/krbrief-screens/loop-state-laptop-1280.png`
- `/tmp/krbrief-screens/loop-state-desktop-1440.png`
- `/tmp/krbrief-screens/frontend-decomposition-mobile-390.png`
- `/tmp/krbrief-screens/frontend-decomposition-tablet-768.png`
- `/tmp/krbrief-screens/frontend-decomposition-laptop-1280.png`
- `/tmp/krbrief-screens/frontend-decomposition-desktop-1440.png`
- `/tmp/krbrief-screens/chart-marker-tooltip-evidence-1440.png`
- `/tmp/krbrief-screens/ai-structured-answer-1440.png`
- `/tmp/krbrief-screens/chart-event-evidence-sources-1440.png`
- `/tmp/krbrief-screens/event-causal-score-1440.png`
- `/tmp/krbrief-screens/event-text-causal-score-1440.png`
- `/tmp/krbrief-screens/event-article-body-causal-score-1440.png`
- `/tmp/krbrief-screens/event-causal-factor-score-1440.png`
- `/tmp/krbrief-screens/learning-term-expanded-schema-1440.png`

Latest viewport metrics:

| Viewport | First-viewport buttons | Search visible | Chart visible | Overflow-x | Console errors |
|---|---:|---|---|---|---:|
| 390x844 | 2 | yes | yes | no | 0 |
| 768x1024 | 2 | yes | yes | no | 0 |
| 1280x800 | 2 | yes | yes | no | 0 |
| 1440x900 | 2 | yes | yes | no | 0 |

## Remaining Gaps

1. The product is better, but still below the prompt's 495/500 bar.
2. The first-view UX is clearer and less button-heavy, but still not a complete Toss-quality redesign.
3. Real LLM/RAG product quality cannot be proven without configured model credentials and live evaluation.
4. Search now has a KRX stock universe, KRX industry taxonomy, and external Naver theme taxonomy; `/api/ai/status` makes live LLM readiness visible, but current live RAG remains blocked by missing non-committed credentials.
5. Trade zones now use support/resistance, moving average, and volume-strength evidence; event causal scoring now uses news search, news article bodies, DART search rows, DART filing-detail bodies, and rule-based causal factor classification, but still needs broader filing section extraction and live LLM-backed judgment.
6. More frontend decomposition is still warranted for smaller section-level components and final visual-system polish.

## Current Head

- Latest recovery-loop commits include `Expand search taxonomy and restore chart-first home`, `Add KRX stock universe search`, `Add KRX sector taxonomy search`, `Add Naver theme taxonomy search`, `Add LLM status visibility`, `Enrich trade zone evidence`, `Split frontend API hooks`, `Enrich chart marker tooltips`, `Structure AI answer summaries`, `Add structured event evidence sources`, `Add operational safety guard`, `Split brief data hook`, `Add event causal scoring`, `Add event text causal signals`, `Add event article body signals`, `Add DART filing detail signals`, `Add causal factor scoring`, the learning term schema commit, `Split assistant learning hooks`, and `Add learning related questions alias`. The HomePage split is ready for the next commit.
- Branch: `main`
- Push status: pushed to `origin/main`

## Next Loop Recommendation

Continue with these in order:

1. Add live LLM verification using configured `LLM_MODEL` and a non-committed API key.
2. If live credentials are not available, expand DART filing section extraction and add stronger LLM-substitute explainability instead of keyword heuristics only.
3. Continue visual polish on mobile/desktop spacing, motion, and data hierarchy.
4. Continue decomposing the remaining large section components after the assistant/learning hook split.
