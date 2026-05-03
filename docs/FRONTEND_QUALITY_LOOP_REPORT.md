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
| User | 465/500 | First-view value, button count, and chart access are clearer, but still not Toss-perfect |
| Frontend developer | 462/500 | App structure, CSS, summary detail, and pure utilities are decomposed; domain hooks and design system cleanup remain |
| Backend developer | 450/500 | Search, AI adapter, trade-zone contract, and marketdata timeout behavior improved, but full taxonomy/RAG depth is incomplete |
| DevOps developer | 480/500 | Strong local quality gate, Docker health, API smoke, E2E coverage, and reduced smoke-test hang risk |
| VC / shareholder | 418/500 | AI is more visible and adapter-ready, but live LLM/RAG moat is not fully proven |

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
| Meaningful commits | `baa571e`, `40f7dc8`, `2ea8098`, `861b9a1`, `9f234bd`, `6458f0c`, `1562ba9` and follow-up utility extraction work | Done |
| Push to origin | `origin/main` updated through the latest recovery-loop commit | Done |
| Search for representative stock | `scripts/test_all_apis.sh` checks 삼성전자 -> `005930` | Done |
| Visible AI panel | Home and search flows expose AI market interpretation | Done |
| AI retrieval contract | `/api/ai/chat` returns `retrieval` and `sourceCount` | Done |
| Desktop responsive | Playwright desktop/laptop checks pass | Done |
| Mobile responsive | Playwright tablet/mobile checks pass | Done |
| Backend tests | `./gradlew test` via `make quality` | Done |
| Frontend build/audit | `npm ci --include=dev && npm run build && npm audit` via `make quality` | Done |
| Docker health | `make health` via `make quality` | Done |
| API smoke | `./scripts/test_all_apis.sh` via `make quality` | Done |
| E2E | Playwright `13 passed` via `make quality` | Done |
| First-view button reduction | Desktop first viewport `2`, mobile first viewport `2` from Playwright DOM measurement | Done |
| Chart-first responsive audit | Chart enters first viewport on 1440 desktop, 768 tablet, and 390 mobile after the home refresh | Done |
| Reference research | Toss, Robinhood, Revolut, Linear, Stripe reviewed for next-loop UI direction | Done |
| 495/500 all perspectives | Current scores remain below 495 | Not done |
| Full Toss-level redesign | Improved, but still not objectively perfect | Not done |
| Real live LLM quality | Adapter exists, but no configured live key/model verification | Not done |
| Full KRX taxonomy | Representative fallback exists, not full stock/sector taxonomy | Not done |
| Trade-zone backend API | `GET /api/stocks/{code}/trade-zones` added, documented, smoke-tested, and used by the chart decision panel | Done |

## Latest Verification Commands

The latest pushed state was verified with:

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

Result: all passed through API smoke, and the Playwright E2E suite was rerun immediately after with `13 passed`.

The current utility extraction was additionally verified before the next commit with:

```bash
npm run build
npm run test:e2e -- --reporter=line
```

Result: frontend production build passed, and Playwright `13 passed`.

Additional screenshots were captured from the Docker-served frontend:

- `/tmp/krbrief-screens/audit-desktop-css-split.png`
- `/tmp/krbrief-screens/audit-mobile-css-split.png`
- `/tmp/krbrief-screens/audit-desktop-summary-panel.png`
- `/tmp/krbrief-screens/audit-mobile-summary-panel.png`
- `/tmp/krbrief-screens/current-desktop-home-loop2g.png`
- `/tmp/krbrief-screens/current-tablet-home-loop2g.png`
- `/tmp/krbrief-screens/current-mobile-home-loop2g.png`

## Remaining Gaps

1. The product is better, but still below the prompt's 495/500 bar.
2. The first-view UX is clearer and less button-heavy, but still not a complete Toss-quality redesign.
3. Real LLM/RAG product quality cannot be proven without configured model credentials and live evaluation.
4. Search still needs a real full KRX stock, industry, and theme taxonomy.
5. Trade zones now have an API contract, but the first version is still heuristic and should be upgraded with richer market signals.
6. More frontend decomposition is still warranted, especially smaller domain hooks and a clearer visual system boundary.

## Current Head

- Latest pushed commit: check `git log -1 --oneline` after the latest recovery-loop push.
- Branch: `main`
- Push status: pushed to `origin/main`

## Next Loop Recommendation

Continue with these in order:

1. Split remaining stock research, assistant, and history state flows into smaller domain hooks.
2. Enrich the new `trade-zones` API with support/resistance, event, and volume-derived market signals.
3. Add live LLM verification using configured `LLM_MODEL` and a non-committed API key.
4. Expand search from representative fallback to complete KRX stock/sector/theme taxonomy.
5. Run another mobile and desktop visual audit before any completion claim.
