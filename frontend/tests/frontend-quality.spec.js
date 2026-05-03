import { expect, test } from "@playwright/test";

const APP_URL = process.env.APP_URL || "http://localhost:5173";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "laptop", width: 1280, height: 900 },
  { name: "tablet", width: 768, height: 1000 },
  { name: "mobile", width: 390, height: 900 }
];

async function expectNoHorizontalOverflow(page) {
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflowX).toBe(false);
}

for (const viewport of viewports) {
  test(`home renders search, AI, chart, and responsive layout on ${viewport.name}`, async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(`${APP_URL}/#home`, { waitUntil: "networkidle" });

    await expect(page.locator(".marketHero")).toBeVisible();
    await expect(page).toHaveTitle("오늘 | 한국 주식 AI 리서치");
    await expect(page.locator(".appNav button[aria-current='page']")).toHaveText("오늘");
    await expect(page.getByRole("button", { name: "운영" })).toHaveCount(0);
    await expect(page.locator(".heroSearch")).toBeVisible();
    await expect(page.getByText("AI 시장 해석")).toBeVisible();
    await expect(page.locator(".realChart canvas").first()).toBeVisible();
    await expect(page.getByRole("img", { name: /캔들 차트/ }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.fill("#universal-search", "반도체");
    await expect(page.locator(".searchResults")).toBeVisible();
    await expect(page.locator(".searchResults button").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    expect(errors).toEqual([]);
  });
}

test("learning tab exposes beginner structure and assistant entry points", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${APP_URL}/#learning`, { waitUntil: "networkidle" });

  await expect(page).toHaveTitle("배우기 | 한국 주식 AI 리서치");
  await expect(page.locator(".learningPanel")).toBeVisible();
  await expect(page.locator("#term-search")).toBeVisible();
  await expect(page.locator(".termDetail")).toBeVisible();
  await expect(page.getByText("핵심요약")).toBeVisible();
  await expect(page.getByText("왜 중요한가")).toBeVisible();
  await expect(page.getByText("시나리오 예시")).toBeVisible();
  await expect(page.getByText("바로 물어보기")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("keyboard users can skip repeated navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${APP_URL}/#home`, { waitUntil: "networkidle" });

  await page.keyboard.press("Tab");
  await expect(page.locator(".skipLink")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("stock search result opens chart research flow", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${APP_URL}/#home`, { waitUntil: "networkidle" });

  const stockName = (await page.locator(".pulseName").first().textContent())?.trim();
  expect(stockName).toBeTruthy();

  await page.fill("#universal-search", stockName);
  await expect(page.locator(".searchResults button").first()).toBeVisible();
  await page.locator(".searchResults button").first().click();

  await expect(page.locator("#stock-detail")).toBeVisible();
  await expect(page.locator(".stockResearch")).toBeVisible();
  await expect(page.locator(".realChart canvas").first()).toBeVisible();
});

test("admin surface stays hidden without admin key", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${APP_URL}/#admin`, { waitUntil: "networkidle" });

  await expect(page.locator(".marketHero")).toBeVisible();
  await expect(page.locator(".adminPanel")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "운영" })).toHaveCount(0);
  await expect(page.locator(".appNav button[aria-current='page']")).toHaveText("오늘");
});

test("empty market pulse fallback rows are not clickable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.route("**/api/summaries/2026-05-03", (route) => {
    route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "not_found" })
    });
  });

  await page.goto(`${APP_URL}/#home`, { waitUntil: "networkidle" });

  await expect(page.locator(".empty")).toContainText("요약이 아직 없습니다");
  await expect(page.locator(".pulseRow").first()).toBeDisabled();
  await expectNoHorizontalOverflow(page);
});

test("chart tab supports interval switching and bounded tooltip display", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${APP_URL}/#research`, { waitUntil: "networkidle" });

  await expect(page.locator(".stockResearch")).toBeVisible();
  await expect(page.locator(".realChart canvas").first()).toBeVisible();

  await page.getByRole("button", { name: "주봉" }).click();
  await expect(page.locator(".intervalTabs button.active", { hasText: "주봉" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "주봉" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "월봉" }).click();
  await expect(page.locator(".intervalTabs button.active", { hasText: "월봉" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "월봉" })).toHaveAttribute("aria-pressed", "true");

  const chart = page.locator(".realChart").first();
  const box = await chart.boundingBox();
  expect(box).not.toBeNull();

  for (const ratio of [0.25, 0.4, 0.55, 0.7]) {
    await page.mouse.move(box.x + box.width * ratio, box.y + box.height * 0.46);
    if (await page.locator(".chartTooltip.visible").count()) break;
  }

  await expect(page.locator(".chartTooltip.visible")).toBeVisible();
  const tooltipBox = await page.locator(".chartTooltip.visible").boundingBox();
  expect(tooltipBox).not.toBeNull();
  expect(tooltipBox.x).toBeGreaterThanOrEqual(box.x);
  expect(tooltipBox.y).toBeGreaterThanOrEqual(box.y);
  expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(box.x + box.width + 1);
  expect(tooltipBox.y + tooltipBox.height).toBeLessThanOrEqual(box.y + box.height + 1);
});

test("chart API failure exposes an accessible error state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.route("**/api/stocks/*/chart?**", (route) => {
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "chart_failed" })
    });
  });

  await page.goto(`${APP_URL}/#research`, { waitUntil: "networkidle" });

  await expect(page.locator(".stockResearch")).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: /차트 데이터를 불러오지 못했습니다/ })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
