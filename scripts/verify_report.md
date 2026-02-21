# Naver HTML Verification Report
Generated at: `2026-02-21T17:37:22`
Backend: `http://localhost:8080`
PUBLIC_KEY gate: not set

## Requested date: `2026-02-20`
- effectiveDate: `20260220`
- marketClosed: `False`

### Backend leaders (for context)
  - topGainer: `이앤에치`
  - topLoser: `제일바이오`
  - mostMentioned: `삼영엠텍`
  - kospiPick: `이앤에치`
  - kosdaqPick: `이앤에치`

### topGainers / topLosers rate verification
| side | rank | code | name | expectedRate(%) | naverRate(%) | result | detail |
|---|---:|---|---|---:|---:|---|---|
| Gainer | 1 | `341310` | 이앤에치 | 50.0 | 50.00 |  | OK | Naver rate=50.00% (expected=50.00%, |Δ|=0.00pp) ([link](https://finance.naver.com/item/sise_day.naver?code=341310&page=1)) |
| Gainer | 2 | `009290` | 광동제약 | 30.0 | 30.00 |  | OK | Naver rate=30.00% (expected=30.00%, |Δ|=0.00pp) ([link](https://finance.naver.com/item/sise_day.naver?code=009290&page=1)) |
| Gainer | 3 | `085620` | 미래에셋생명 | 29.98 | 29.98 |  | OK | Naver rate=29.98% (expected=29.98%, |Δ|=0.00pp) ([link](https://finance.naver.com/item/sise_day.naver?code=085620&page=1)) |
| Loser | 1 | `052670` | 제일바이오 | -25.32 | -25.32 |  | OK | Naver rate=-25.32% (expected=-25.32%, |Δ|=0.00pp) ([link](https://finance.naver.com/item/sise_day.naver?code=052670&page=1)) |
| Loser | 2 | `250930` | 예선테크 | -19.15 | -19.15 |  | OK | Naver rate=-19.15% (expected=-19.15%, |Δ|=0.00pp) ([link](https://finance.naver.com/item/sise_day.naver?code=250930&page=1)) |
| Loser | 3 | `313760` | 캐리 | -17.21 | -17.21 |  | OK | Naver rate=-17.21% (expected=-17.21%, |Δ|=0.00pp) ([link](https://finance.naver.com/item/sise_day.naver?code=313760&page=1)) |

### mostMentionedTop vs Naver board (post count)
| rank | code | name | expectedCount | actualCount | result | detail |
|---:|---|---|---:|---:|---|---|
| 1 | `054540` | 삼영엠텍 | 58 | 58 | OK | Counted 58 posts on 2026.02.20 across pages 1..3 (expected 58) ([link](https://finance.naver.com/item/board.naver?code=054540&page=3)) |
| 2 | `058610` | 에스피지 | 56 | 56 | OK | Counted 56 posts on 2026.02.20 across pages 1..3 (expected 56) ([link](https://finance.naver.com/item/board.naver?code=058610&page=3)) |
| 3 | `003540` | 대신증권 | 54 | 54 | OK | Counted 54 posts on 2026.02.20 across pages 1..3 (expected 54) ([link](https://finance.naver.com/item/board.naver?code=003540&page=3)) |

---
## Summary
- Overall: **ALL OK**

---
## Plan if mismatched
1. **Confirm effectiveDate alignment**: ensure backend’s `effectiveDate` matches the intended trading day (weekend/holiday roll-forward).
2. **Switch verification source (if Naver HTML is unstable)**: add an alternative verifier using KRX Data Portal JSON / pykrx outputs, then compare backend vs KRX as primary truth.
3. **Harden Naver parsing**:
   - Parse using a DOM parser (BeautifulSoup/lxml) in a dedicated venv;
   - For sise_day: verify the columns by header names rather than positional heuristics;
   - For 전일비: explicitly parse 상승/하락/보합/상한가/하한가 labels + numeric.
4. **Increase evidence capture**: store raw HTML snapshots for the exact pages/rows that mismatched (timestamped under `scripts/evidence/`).
5. **Tune network behavior**: increase timeouts/retries, add backoff, and optionally increase max pages (board cap may miss older posts if volume is huge).
6. **Document known exceptions**: corporate actions, trading halts, abnormal price limits, or data corrections may cause small discrepancies—record these with links.
