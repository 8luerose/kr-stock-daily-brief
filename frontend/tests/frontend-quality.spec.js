import { expect, test } from "@playwright/test";

const APP_URL = process.env.APP_URL || "http://localhost:5173";

async function stubBackend(page) {
  await page.route("http://localhost:8080/api/**", (route) => {
    const url = route.request().url();
    if (url.includes("/api/ai/chat") || url.includes("/api/learning/assistant")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          answer: "조건형 교육용 답변입니다. 가격, 거래량, 공시 근거를 함께 확인하세요.",
          confidence: "medium",
          sources: [{ type: "fallback", title: "교육용 기본 데이터" }],
          limitations: ["실시간 투자 지시가 아닙니다."],
          structured: {
            conclusion: "관심 후보로 두고 근거를 확인합니다.",
            evidence: ["거래량", "이동평균선"],
            opposingSignals: ["거래량 둔화"],
            risks: ["전저점 이탈"],
            confidence: "medium"
          }
        })
      });
    }
    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "stubbed_not_found" })
    });
  });
}

async function openApp(page, hash = "#home") {
  await stubBackend(page);
  await page.goto(`${APP_URL}/${hash}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".top")).toBeVisible();
}

async function expectNoHorizontalOverflow(page) {
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflowX).toBe(false);
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 900 }
]) {
  test(`research home renders search, chart, AI, and learning entry on ${viewport.name}`, async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openApp(page, "#home");

    await expect(page).toHaveTitle("리서치 | 한국 주식 AI 리서치");
    await expect(page.locator(".marketHero")).toBeVisible();
    await expect(page.locator(".heroSearch")).toBeVisible();
    await expect(page.locator(".heroAssistant .assistantTitle")).toHaveText("AI 시장 해석");
    await expect(page.locator(".stockResearch")).toBeVisible();
    await expect(page.locator(".realChart canvas").first()).toBeVisible({ timeout: 20000 });
    await expect(page.locator(".candidateSection")).toContainText("오늘 관심 후보");
    await expect(page.locator(".learningDock")).toContainText("모르는 용어");
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });
}

test("universal search keeps results readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openApp(page, "#home");

  await page.fill("#universal-search", "반도체");
  await expect(page.locator(".searchResults")).toBeVisible();
  await expect(page.locator(".searchResults")).toContainText("삼성전자");
  await expect(page.locator(".searchResults")).toContainText("차트 보기");
  await expectNoHorizontalOverflow(page);
});

test("chart tooltip stays inside chart bounds", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openApp(page, "#home");
  await expect(page.locator(".realChart canvas").first()).toBeVisible({ timeout: 20000 });

  await page.evaluate(() => document.querySelector(".realChart")?.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(200);
  const chartBox = await page.locator(".realChart").boundingBox();
  expect(chartBox).not.toBeNull();
  await page.mouse.move(chartBox.x + chartBox.width * 0.48, chartBox.y + chartBox.height * 0.45);
  await expect(page.locator(".chartTooltip.visible")).toBeVisible();

  const bounds = await page.evaluate(() => {
    const chart = document.querySelector(".realChart").getBoundingClientRect();
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

  await expect(page).toHaveTitle("배우기 | 한국 주식 AI 리서치");
  await expect(page.locator(".learningPanel")).toBeVisible();
  await expect(page.locator("#term-search")).toBeVisible();
  await expect(page.locator(".termDetail")).toBeVisible();
  await expect(page.getByText("핵심요약")).toBeVisible();
  await expect(page.getByText("자세한 설명")).toBeVisible();
  await expect(page.getByText("차트에서 보는 법")).toBeVisible();
  await expect(page.getByText("시나리오 예시")).toBeVisible();
  await expect(page.getByText("바로 물어보기")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("history and admin keep legacy operations out of public home", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openApp(page, "#history");

  await expect(page).toHaveTitle("기록 | 한국 주식 AI 리서치");
  await expect(page.locator(".calendar")).toBeVisible();
  await expect(page.locator(".detail")).toBeVisible();
  await expect(page.locator(".adminActions button")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.goto(`${APP_URL}/#admin`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle("운영 | 한국 주식 AI 리서치");
  await expect(page.locator(".adminPanel")).toBeVisible();
  await expect(page.locator(".adminPanel")).toContainText("관리자 키가 필요합니다");
  await expect(page.locator(".calendar")).toBeVisible();
  await expect(page.locator(".adminActions button")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});
