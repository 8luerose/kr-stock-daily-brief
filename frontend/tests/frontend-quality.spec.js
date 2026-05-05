import { expect, test } from "@playwright/test";

const APP_URL = process.env.APP_URL || "http://localhost:5173";

const chartRows = [
  ["2026-02-02", 69200, 71200, 68800, 70600, 12600000],
  ["2026-02-09", 70600, 72400, 69900, 71900, 14100000],
  ["2026-02-16", 71900, 74700, 71200, 74200, 19300000],
  ["2026-02-23", 74200, 76100, 73100, 75600, 17400000],
  ["2026-03-02", 75600, 79400, 74900, 78900, 26800000]
].map(([date, open, high, low, close, volume]) => ({ date, open, high, low, close, volume }));

async function stubBackend(page) {
  await page.route("http://localhost:8080/api/**", async (route) => {
    const url = route.request().url();
    const json = (body) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });

    if (url.includes("/api/search")) {
      return json([
        {
          id: "stock-005930",
          type: "stock",
          title: "삼성전자",
          code: "005930",
          market: "KOSPI",
          rate: "+1.55%",
          tags: ["반도체", "AI 메모리"],
          summary: "차트와 AI 설명으로 근거를 확인할 수 있습니다."
        },
        {
          id: "term-volume",
          type: "term",
          title: "거래량",
          summary: "가격 움직임의 신뢰도를 확인합니다."
        }
      ]);
    }
    if (url.includes("/chart")) {
      return json({ code: "005930", name: "삼성전자", interval: "daily", asOf: "2026-05-05", data: chartRows });
    }
    if (url.includes("/trade-zones")) {
      return json({
        code: "005930",
        name: "삼성전자",
        basisDate: "2026-05-05",
        confidence: "86%",
        zones: [
          { type: "buy", label: "매수 검토", price: "86,000~88,500원" }
        ]
      });
    }
    if (url.includes("/events")) {
      return json({ events: [{ date: "2026-03-02", type: "positive", title: "거래량 동반 돌파" }] });
    }
    if (url.includes("/learning/terms")) {
      return json([{
        id: "volume", term: "거래량", coreSummary: "주식이 거래된 수량", longExplanation: "관심의 크기"
      }]);
    }
    if (url.includes("/ai/chat")) {
      return json({
        structured: {
          conclusion: "가격 흐름은 우상향",
          prediction: "20일선 지지",
          evidence: ["20일선 지지"]
        },
        confidence: "86%"
      });
    }
    return json({});
  });
}

async function openApp(page) {
  page.on('console', msg => {
    if (msg.type() === 'error') console.error('BROWSER ERROR:', msg.text());
  });
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  await stubBackend(page);
  await page.goto(`${APP_URL}/`, { waitUntil: "networkidle" });
  await page.waitForSelector('input[placeholder="종목명, 테마, 용어 검색..."]');
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 900 }
]) {
  test(`home shows chart, search, and AI card on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openApp(page);

    await expect(page.locator('input[placeholder="종목명, 테마, 용어 검색..."]')).toBeVisible();
    await expect(page.locator('.recharts-responsive-container')).toBeVisible();

    await expect(page.locator('text=매매 검토 시점')).toBeVisible();
    await expect(page.locator('text=주요 모멘텀')).toBeVisible();
    await expect(page.locator('button[aria-label="Open Portfolio"]')).toBeVisible();
  });
}

test("search results display correctly and open learning sheet", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApp(page);

  await page.fill('input[placeholder="종목명, 테마, 용어 검색..."]', "거래량");
  
  // Wait for dropdown
  const termItem = page.locator('li', { hasText: '거래량' }).first();
  await expect(termItem).toBeVisible();

  // Click term
  await termItem.click();

  // DeepDiveLearningSheet should be open
  await expect(page.locator('h2', { hasText: '거래량' })).toBeVisible();
  await expect(page.locator('text=핵심 한 줄:')).toBeVisible();
});

test("portfolio sandbox opens and works", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApp(page);

  await page.click('button[aria-label="Open Portfolio"]');

  // Sandbox sheet should be open
  await expect(page.locator('h2', { hasText: '포트폴리오 샌드박스' })).toBeVisible();
  await expect(page.locator('text=가상 비중 설정 (%)')).toBeVisible();
  await expect(page.locator('text=학습용 임시 샌드박스')).toBeVisible();

  // Click Add
  await page.click('button:has-text("가상 포트폴리오에 담기")');

  // AI review section appears
  await expect(page.locator('text=AI 포트폴리오 점검')).toBeVisible();
});

test("admin sheet opens on double click", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApp(page);

  // Double click top left secret toggle
  const secretToggle = page.locator('button[aria-label="Open Admin"]');
  await secretToggle.dblclick();

  // Admin sheet should be open
  await expect(page.locator('h2', { hasText: '관리자 콘솔' })).toBeVisible();
});
