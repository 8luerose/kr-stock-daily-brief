import { expect, test } from "@playwright/test";

const APP_URL = process.env.APP_URL || "http://localhost:5173";

const chartRows = [
  ["2026-01-05", 72000, 73800, 71400, 73200, 12000000],
  ["2026-01-12", 73200, 75600, 73000, 75100, 15000000],
  ["2026-01-19", 75100, 78600, 74800, 77900, 21000000],
  ["2026-01-26", 77900, 80100, 76800, 79200, 18000000],
  ["2026-02-02", 79200, 82600, 78800, 82100, 26000000],
  ["2026-02-09", 82100, 84300, 81000, 83600, 22000000],
  ["2026-02-16", 83600, 85900, 82400, 85200, 24000000],
  ["2026-02-23", 85200, 87500, 84600, 86900, 28000000],
  ["2026-03-02", 86900, 91200, 86000, 90100, 34000000],
  ["2026-03-09", 90100, 91800, 88400, 89200, 21000000],
  ["2026-03-16", 89200, 92500, 88900, 91800, 25000000],
  ["2026-03-23", 91800, 93900, 90400, 92900, 23000000],
  ["2026-03-30", 92900, 94100, 91000, 91600, 19000000],
  ["2026-04-06", 91600, 95600, 91200, 94900, 31000000],
  ["2026-04-13", 94900, 96200, 92500, 93100, 18000000],
  ["2026-04-20", 93100, 98100, 92800, 97200, 33000000]
].map(([date, open, high, low, close, volume]) => ({ date, open, high, low, close, volume }));

async function stubBackend(page) {
  await page.route("http://localhost:8080/api/**", (route) => {
    const url = route.request().url();
    if (url.includes("/api/search")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "stock-005930",
            type: "stock",
            title: "삼성전자",
            code: "005930",
            market: "KOSPI",
            rate: "+1.55%",
            tags: ["반도체", "AI 메모리"],
            summary: "차트와 AI 설명으로 근거를 확인할 수 있습니다.",
            source: "test",
            stockCode: "005930",
            stockName: "삼성전자"
          },
          {
            id: "term-volume",
            type: "term",
            title: "거래량",
            code: "학습",
            market: "용어",
            rate: "기초",
            tags: ["차트"],
            summary: "가격 움직임의 신뢰도를 확인합니다.",
            source: "test",
            termId: "volume"
          }
        ])
      });
    }
    if (url.includes("/chart")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: "005930",
          name: "삼성전자",
          interval: "daily",
          range: "6M",
          asOf: "2026-05-05",
          data: chartRows
        })
      });
    }
    if (url.includes("/trade-zones")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: "005930",
          name: "삼성전자",
          basisDate: "2026-05-05",
          confidence: "86%",
          evidence: ["20일선 지지와 거래량 증가", "전고점 부근 매물 확인", "RSI 과열 전 추세 유지"],
          zones: [
            {
              type: "buy_watch",
              label: "매수 검토",
              fromPrice: 93000,
              toPrice: 95000,
              condition: "20일선 지지와 거래량 증가가 함께 확인되면 매수 검토 구간입니다.",
              evidence: "지지선 회복",
              oppositeSignal: "전저점 이탈",
              beginnerExplanation: "평균선 위에서 거래량이 늘면 관심이 붙은 것입니다.",
              confidence: "medium-high",
              basisDate: "2026-05-05"
            },
            {
              type: "sell_watch",
              label: "매도 검토",
              fromPrice: 98200,
              toPrice: 101500,
              condition: "급등 이후 거래량 둔화와 긴 윗꼬리가 반복되면 매도 검토 시점입니다.",
              evidence: "전고점 매물",
              oppositeSignal: "거래대금 재확대",
              beginnerExplanation: "힘이 약해지는지 봅니다.",
              confidence: "medium",
              basisDate: "2026-05-05"
            },
            {
              type: "risk",
              label: "리스크 관리",
              fromPrice: 88500,
              toPrice: 90000,
              condition: "주요 지지선이 깨지면 리스크 관리 기준을 먼저 세웁니다.",
              evidence: "지지선 이탈",
              oppositeSignal: "빠른 회복",
              beginnerExplanation: "방어선을 미리 정합니다.",
              confidence: "medium",
              basisDate: "2026-05-05"
            }
          ]
        })
      });
    }
    if (url.includes("/events")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          code: "005930",
          name: "삼성전자",
          events: [
            {
              date: "2026-03-02",
              type: "positive",
              title: "거래량 동반 돌파",
              explanation: "전고점 돌파 시도와 거래량 증가가 함께 나타났습니다."
            },
            {
              date: "2026-04-13",
              type: "negative",
              title: "전고점 부근 매물 부담",
              explanation: "상단 저항선 근처에서 거래량이 줄며 관망 신호가 생겼습니다."
            }
          ]
        })
      });
    }
    if (url.includes("/learning/terms")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "volume",
            term: "거래량",
            category: "차트 지표",
            coreSummary: "얼마나 많은 주식이 거래됐는지 보여주는 관심의 크기입니다.",
            longExplanation: "거래량은 가격 움직임에 실제 참여가 있었는지 확인하게 해줍니다.\n가격이 오르는데 거래량도 늘면 더 신뢰할 수 있습니다.\n반대로 거래량 없는 상승은 힘이 약할 수 있습니다.",
            chartUsage: "캔들 아래 막대 그래프에서 확인합니다.",
            whyItMatters: "가격 움직임의 신뢰도를 판단합니다.",
            commonMisunderstanding: "거래량이 많으면 무조건 좋다고 보는 실수입니다.",
            scenario: "20일선 돌파 때 거래량이 평균보다 크면 검토 조건 하나가 충족됩니다.",
            relatedQuestions: ["거래량 없는 상승은 위험해?"]
          }
        ])
      });
    }
    if (url.includes("/ai/chat")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          answer: "현재 국면은 상승 추세 유지 속 단기 조정입니다.",
          confidence: "86%",
          structured: {
            conclusion: "현재 국면은 상승 추세 유지 속 단기 조정입니다.",
            prediction: "20일선 지지와 거래량 재확대가 함께 확인되면 관심 후보로 유지할 수 있습니다.",
            evidence: ["20일선 지지", "거래량 증가", "전고점 확인"],
            opposingSignals: ["전저점 이탈", "거래량 없는 반등"],
            risks: ["지지선 이탈"]
          },
          limitations: ["교육용 조건 설명입니다."],
          sources: ["chart", "events"]
        })
      });
    }
    if (url.includes("/portfolio")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], summary: { totalWeight: 0, nextChecklist: [] }, source: "test" })
      });
    }
    if (url.includes("/summaries?")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            date: "2026-05-05",
            topGainer: "삼성전자",
            topLoser: "에코프로비엠",
            mostMentioned: "반도체",
            content: "기록 영역에 보존되는 브리프입니다."
          }
        ])
      });
    }
    if (url.includes("/summaries/latest")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          date: "2026-05-05",
          effectiveDate: "2026-05-05",
          topGainers: [
            { code: "005930", name: "삼성전자", rate: 1.55 },
            { code: "000660", name: "SK하이닉스", rate: 2.1 }
          ],
          topLosers: [],
          mostMentionedTop: []
        })
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
}

async function openApp(page, hash = "#home") {
  await stubBackend(page);
  await page.goto(`${APP_URL}/${hash}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".topbar")).toBeVisible();
}

async function expectNoHorizontalOverflow(page) {
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflowX).toBe(false);
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 900 }
]) {
  test(`home shows search, annotated chart, AI conditions, news, and learning on ${viewport.name}`, async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openApp(page, "#home");

    await expect(page).toHaveTitle("리서치 | 한국 주식 AI 학습");
    await expect(page.locator(".commandCenter")).toBeVisible();
    await expect(page.locator("#universal-search")).toBeVisible();
    await expect(page.locator(".chartWorkspace")).toBeVisible();
    await expect(page.locator(".realChart canvas").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "매수 검토" })).toBeVisible();
    await expect(page.locator(".aiPanel")).toContainText("매수 검토 조건");
    await expect(page.locator(".aiPanel")).toContainText("호재");
    await expect(page.locator(".aiPanel")).toContainText("악재");
    await expect(page.locator(".learningDock")).toContainText("AI에게 물어보기");
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });
}

test("mobile search results stay readable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openApp(page, "#home");

  await page.fill("#universal-search", "반도체");
  await expect(page.locator(".searchResults")).toBeVisible();
  await expect(page.locator(".searchResults")).toContainText("삼성전자");
  await expect(page.locator(".searchResults")).toContainText("차트와 AI 설명");
  await expectNoHorizontalOverflow(page);
});

test("chart tooltip stays bounded on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openApp(page, "#home");
  await page.locator(".chartWorkspace").scrollIntoViewIfNeeded();
  await page.locator(".chartNote").first().focus();
  await expect(page.locator(".chartTooltip.visible")).toBeVisible();

  const bounds = await page.evaluate(() => {
    const chart = document.querySelector(".chartFrame").getBoundingClientRect();
    const tooltip = document.querySelector(".chartTooltip.visible").getBoundingClientRect();
    return {
      insideX: tooltip.left >= chart.left - 1 && tooltip.right <= chart.right + 1,
      insideY: tooltip.top >= chart.top - 1 && tooltip.bottom <= chart.bottom + 1
    };
  });
  expect(bounds.insideX).toBe(true);
  expect(bounds.insideY).toBe(true);
});

test("learning page exposes beginner term structure", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openApp(page, "#learning");

  await expect(page).toHaveTitle("배우기 | 한국 주식 AI 학습");
  await expect(page.locator(".learningPanel")).toBeVisible();
  await expect(page.getByText("자세한 설명")).toBeVisible();
  await expect(page.getByText("차트에서 보는 법")).toBeVisible();
  await expect(page.getByText("왜 중요한지")).toBeVisible();
  await expect(page.getByText("초보자 오해")).toBeVisible();
  await expect(page.getByText("시나리오 예시")).toBeVisible();
  await expect(page.getByText("AI에게 물어보기")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("history and admin preserve old operational flow outside public home", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openApp(page, "#history");

  await expect(page).toHaveTitle("기록 | 한국 주식 AI 학습");
  await expect(page.locator(".calendar")).toBeVisible();
  await expect(page.locator(".detail")).toBeVisible();
  await expect(page.locator(".adminActions button")).toHaveCount(0);

  await page.goto(`${APP_URL}/#admin`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle("운영 | 한국 주식 AI 학습");
  await expect(page.locator(".adminPanel")).toBeVisible();
  await expect(page.getByPlaceholder("관리자 키가 필요합니다")).toBeVisible();
  await expect(page.locator(".adminActions button")).toHaveCount(4);
  await expectNoHorizontalOverflow(page);
});
