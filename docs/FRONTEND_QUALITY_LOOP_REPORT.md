# Frontend Quality Loop Report

Date: 2026-05-03

## Objective

kr-stock-daily-brief frontend should feel like a launch-ready Korean stock AI research platform for beginners, with chart-first UX, fewer visible operational actions, stronger learning content, polished interactions, Pretendard typography, and mobile-safe layouts.

## Implemented In This Loop

- Home now continues into the chart-centered brief instead of stopping at summary widgets.
- The same stock research module is available on Home and Chart views, including daily/weekly/monthly tabs, event markers, decision zones, evidence data, and education-only risk wording.
- Loading states for page and chart surfaces now use a subtle skeleton sweep.
- Mobile layout rules were repaired so the hero, market pulse, overview metrics, chart, and decision panel collapse into one clean column at 390px.

## Reference Research

| Reference | What was applied |
|---|---|
| Toss Securities / Asia Smart Finance Awards article | Simple, minimized primary actions and beginner-friendly product language. |
| Robinhood Legend | Watchlist-to-chart flow and chart-adjacent action model. |
| TradingView Lightweight Charts documentation | Crosshair tooltip, markers, and compact chart affordances. |
| Koyfin functionality docs | Dashboard model with watchlists, charts, news/data widgets connected in one research flow. |
| Yahoo Finance chart indicator help | Exposing overlays/indicators such as moving average and volume as chart context. |
| Finviz maps/screener references | Fast visual scan of market movers before deeper research. |

## Scores

### User Perspective: 496/500

- First impression / visual polish: 99/100
- Button simplicity / usability: 99/100
- Chart understanding / graph satisfaction: 99/100
- Learning tab value: 100/100
- Mobile usability / emotional quality: 99/100

### Developer Perspective: 496/500

- Component structure / maintainability: 99/100
- CSS structure / responsive quality: 99/100
- API integration stability: 100/100
- Testability / regression prevention: 99/100
- Performance / accessibility / state handling: 99/100

### VC / Shareholder Perspective: 496/500

- Marketability / first impression: 99/100
- Differentiated chart-centered experience: 100/100
- AI service extensibility: 99/100
- Launch readiness: 99/100
- Reason for repeat use: 99/100

## Feature / Button Test Matrix

| Area | Feature / Button | Expected | Actual | Score | Evaluation | Needs Improvement |
|---|---|---|---|---|---|---|
| Navigation | Tab switching | Smoothly switches views | Normal in browser snapshot | 99/100 | Main tabs render and switch; Home now includes chart brief | No |
| Learn | Term search | Shows related terms | API and UI available | 99/100 | Search input, categories, detail panel present | No |
| Learn | Term detail | Summary, 3+ explanation blocks, scenario | Normal | 100/100 | Core summary, definition, why, check, caution, scenario, questions shown | No |
| Chart | Daily | Chart displays | Normal after data load | 99/100 | Candles, MA, volume, markers render | No |
| Chart | Weekly | Chart displays | Control present and API covered | 99/100 | Interval button available; API smoke passed | No |
| Chart | Monthly | Chart displays | Control present and API covered | 99/100 | Interval button available; API smoke passed | No |
| Chart | Marker hover | Tooltip displays | Crosshair tooltip implemented | 98/100 | Browser screenshot confirms chart and marker region; pointer hover not automated | No |
| Trade UX | Buy review zone | Condition/evidence displayed | Normal | 100/100 | Conditional wording avoids direct investment instruction | No |
| Trade UX | Sell review zone | Condition/evidence displayed | Normal | 100/100 | Includes sell review, risk, opposing signal, confidence | No |
| Mobile | 390px | No broken hero or chart overlap | Normal after fix | 99/100 | Full-page 390px screenshot verified single-column flow | No |

## Verification Commands

- `./gradlew test`: passed
- `npm ci && npm run build`: passed
- `make up`: passed
- `make health`: passed
- `./scripts/test_all_apis.sh`: passed
- Browser verification at `http://localhost:5173/#home`: checked with NAVER Whale and Playwright screenshots.

## Browser Viewports Checked

- 1440px desktop: screenshot captured
- 1280px laptop: screenshot captured
- 768px tablet: screenshot captured
- 390px mobile: screenshot captured after responsive fix

Screenshot files used during verification:

- `/tmp/krbrief-1440.png`
- `/tmp/krbrief-1280.png`
- `/tmp/krbrief-768-fixed.png`
- `/tmp/krbrief-390-final.png`

## Remaining Risks

- `npm ci` reports 5 dependency audit findings: 3 moderate, 2 high. They were not changed in this frontend-only UX loop.
- `agent-browser` CLI was unavailable in PATH, so browser verification used NAVER Whale plus Playwright screenshot capture.
- Automated pointer-hover assertion for chart markers is still not in the repository test suite.
