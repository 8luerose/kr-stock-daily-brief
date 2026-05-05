import { expect, test } from "@playwright/test";
import { fallbackWorkspace } from "../src/data/fallbackData.js";

const APP_URL = process.env.APP_URL || "http://localhost:5173";

const chartRows = fallbackWorkspace.chart.rows;
const tradeZones = fallbackWorkspace.zones;

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
    if (url.includes("/api/portfolio")) {
      const method = route.request().method();
      if (method === "GET") {
        return json({
          items: [],
          summary: {
            totalWeight: 0,
            maxWeightStock: "-",
            maxWeight: 0,
            concentration: "아직 담긴 종목이 없습니다.",
            volatility: "종목을 담으면 변동성 점검을 시작합니다.",
            nextChecklist: []
          },
          source: "server_mysql_portfolio_sandbox",
          updatedAt: "2026-05-05T00:00:00Z"
        });
      }
      return json({
        items: [{
          code: "005930",
          name: "삼성전자",
          group: "반도체",
          rate: 1.55,
          count: null,
          weight: 10,
          riskNotes: ["서버 리스크 점검: 동일 섹터 집중 여부를 함께 확인해야 합니다."],
          nextChecklist: ["삼성전자의 최근 이벤트와 거래량 급증 여부 확인", "비중이 손실 허용 범위에 맞는지 점검"],
          recentEvents: [{
            date: "2026-03-02",
            type: "volume_spike",
            severity: "medium",
            title: "거래량 동반 돌파",
            explanation: "거래량이 평균보다 크게 늘었습니다."
          }]
        }],
        summary: {
          totalWeight: 10,
          maxWeightStock: "삼성전자",
          maxWeight: 10,
          concentration: "비중이 한 종목에 과도하게 몰리지는 않았습니다.",
          volatility: "큰 변동률 종목은 아직 적습니다.",
          nextChecklist: ["비중이 가장 큰 종목의 최근 이벤트 확인"]
        },
        source: "server_mysql_portfolio_sandbox",
        updatedAt: "2026-05-05T00:00:00Z"
      });
    }
    if (url.includes("/chart")) {
      const requestUrl = new URL(url);
      const interval = requestUrl.searchParams.get("interval") || "daily";
      return json({ code: "005930", name: "삼성전자", interval, asOf: "2026-05-05", data: chartRows });
    }
    if (url.includes("/trade-zones")) {
      return json({
        code: "005930",
        name: "삼성전자",
        basisDate: "2026-05-05",
        confidence: "86%",
        zones: tradeZones
      });
    }
    if (url.includes("/events")) {
      return json({
        events: [{
          date: "2026-03-02",
          type: "positive",
          title: "거래량 동반 돌파",
          reason: "가격 상승과 거래량 증가가 함께 나타났습니다.",
          opposite: "다음 거래일에 거래량 없이 종가가 밀리면 실패 돌파일 수 있습니다.",
          confidence: "근거 수준 보통",
          sourceLimit: "공시 원문 확인 전에는 확정 원인으로 보지 않습니다."
        }]
      });
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

async function expectChartSvgPainted(page) {
  const svg = page.locator(".recharts-wrapper svg").first();
  await expect(svg).toBeVisible();

  const paint = await svg.evaluate((node) => ({
    primitives: node.querySelectorAll("path,line,circle,rect,text").length,
    circles: node.querySelectorAll("circle").length,
    text: node.textContent || ""
  }));

  expect(paint.primitives).toBeGreaterThan(8);
  expect(paint.circles).toBeGreaterThan(0);
  expect(paint.text).toContain("매수 검토");
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

function intersects(a, b) {
  if (!a || !b) return false;
  return !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
}

async function readResponsiveMetrics(page) {
  return page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.x),
        y: Math.round(r.y),
        width: Math.round(r.width),
        height: Math.round(r.height)
      };
    };
    const byButtonText = (text) => Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === text);
    const searchInput = document.querySelector('input[placeholder="종목명, 테마, 용어 검색..."]');
    const aiButton = document.querySelector('button[aria-label="AI 요약 펼치기"], button[aria-label="AI 요약 접기"]');
    const dropdown = document.querySelector('ul')?.closest('[class*="dropdown"]');
    const visibleElements = Array.from(document.querySelectorAll('body *')).filter((el) => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return r.width > 1 && r.height > 1 && style.display !== 'none' && style.visibility !== 'hidden';
    });
    const textOverflow = visibleElements.filter((el) => {
      const style = getComputedStyle(el);
      return style.whiteSpace === 'nowrap' && el.scrollWidth > el.clientWidth + 1;
    });
    const viewportOverflow = visibleElements.filter((el) => {
      const r = el.getBoundingClientRect();
      const isChartPaint = ['g', 'circle', 'path', 'rect'].includes(el.tagName.toLowerCase()) && el.closest('.recharts-wrapper');
      return !isChartPaint && (r.left < -1 || r.top < -1 || r.right > window.innerWidth + 1 || r.bottom > window.innerHeight + 1);
    });

    return {
      search: rect(searchInput?.closest('[class*="container"]')),
      dropdown: rect(dropdown),
      aiCard: rect(aiButton?.parentElement),
      learning: rect(document.querySelector('button[aria-label="Toggle Learning Mode"]')),
      portfolio: rect(document.querySelector('button[aria-label="Open Portfolio"]')),
      interval: rect(byButtonText('1일')?.parentElement),
      textOverflowCount: textOverflow.length,
      viewportOverflowCount: viewportOverflow.length
    };
  });
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
    await expectChartSvgPainted(page);
    await expect(page.getByTestId("chart-ma-panel")).toContainText("5일선: 단기 흐름");
    await expect(page.getByTestId("chart-ma-panel")).toContainText("20일선: 약 한 달 평균");
    await expect(page.getByTestId("chart-ma-panel")).toContainText("60일선: 중기 흐름");
    await expect(page.getByTestId("chart-condition-panel")).toContainText("매수 검토");
    await expect(page.getByTestId("chart-condition-panel")).toContainText("관망");
    await expect(page.getByTestId("chart-condition-panel")).toContainText("매도 검토");
    await expect(page.getByTestId("chart-condition-panel")).toContainText("리스크 관리");
    await expect(page.getByTestId("chart-beginner-guide")).toContainText("처음 볼 3가지");
    await expect(page.getByTestId("chart-event-panel")).toContainText("호재 후보");

    await expect(page.locator('button[aria-label="AI 요약 펼치기"]')).toBeVisible();
    await expect(page.locator('text=매매 검토 시점')).toHaveCount(0);
    await page.click('button[aria-label="AI 요약 펼치기"]');
    await expect(page.locator('text=매매 검토 시점')).toBeVisible();
    await expect(page.locator('text=주요 모멘텀')).toBeVisible();
    await expect(page.locator('text=신뢰도: 86%')).toBeVisible();
    await expect(page.locator('button[aria-label="Open Portfolio"]')).toBeVisible();
  });
}

test("daily weekly monthly controls refetch and keep chart painted", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApp(page);

  for (const [label, interval] of [
    ["1일", "daily"],
    ["1주", "weekly"],
    ["1개월", "monthly"]
  ]) {
    const requestPromise = page.waitForRequest((request) =>
      request.url().includes("/api/stocks/005930/chart")
      && request.url().includes(`interval=${interval}`)
    );

    await page.getByRole("button", { name: label }).click();
    await requestPromise;
    await expect(page.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
    await expectChartSvgPainted(page);
  }
});

test("search results display correctly and open learning sheet", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApp(page);

  await page.fill('input[placeholder="종목명, 테마, 용어 검색..."]', "거래량");
  
  // Wait for dropdown
  const termItem = page.locator('[class*="dropdown"] li', { hasText: '거래량' }).first();
  await expect(termItem).toBeVisible();

  // Click term
  await termItem.click();

  // DeepDiveLearningSheet should be open
  await expect(page.locator('h2', { hasText: '거래량' })).toBeVisible();
  await expect(page.locator('text=핵심 한 줄:')).toBeVisible();
});

for (const viewport of [
  { name: "desktop-1440", width: 1440, height: 1000 },
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "tablet-1024", width: 1024, height: 768 },
  { name: "mobile-390", width: 390, height: 900 }
]) {
  test(`responsive layout has no clipping or action overlap on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openApp(page);

    await page.fill('input[placeholder="종목명, 테마, 용어 검색..."]', "삼성");
    await expect(page.locator('li', { hasText: '삼성전자' })).toBeVisible();

    const metrics = await readResponsiveMetrics(page);
    expect(metrics.textOverflowCount).toBe(0);
    expect(metrics.viewportOverflowCount).toBe(0);
    expect(intersects(metrics.learning, metrics.portfolio)).toBe(false);
    expect(intersects(metrics.learning, metrics.interval)).toBe(false);
    expect(intersects(metrics.portfolio, metrics.interval)).toBe(false);
    expect(intersects(metrics.search, metrics.learning)).toBe(false);
    expect(intersects(metrics.search, metrics.portfolio)).toBe(false);
    expect(intersects(metrics.dropdown, metrics.aiCard)).toBe(false);
  });
}

test("portfolio sandbox opens and works", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openApp(page);

  await page.click('button[aria-label="Open Portfolio"]');

  // Sandbox sheet should be open
  const sandboxSheet = page.getByTestId('portfolio-sandbox-sheet');
  await expect(sandboxSheet.locator('h2', { hasText: '포트폴리오 샌드박스' })).toBeVisible();
  await expect(sandboxSheet.getByTestId('portfolio-stock-info')).toContainText('005930');
  await expect(sandboxSheet.getByTestId('portfolio-stock-info')).toContainText('삼성전자');
  await expect(sandboxSheet.locator('text=가상 비중 설정 (%)')).toBeVisible();
  await expect(sandboxSheet.locator('text=학습용 가상 샌드박스')).toBeVisible();

  // Click Add
  const saveRequest = page.waitForRequest((request) =>
    request.url().includes('/api/portfolio/items') && request.method() === 'POST'
  );
  await page.click('button:has-text("가상 포트폴리오에 담기")');
  await saveRequest;

  // AI review section appears
  await expect(page.locator('text=AI 포트폴리오 점검')).toBeVisible();
  await expect(page.locator('text=서버 리스크 점검')).toBeVisible();
  await expect(page.locator('text=총 가상 비중')).toBeVisible();
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
