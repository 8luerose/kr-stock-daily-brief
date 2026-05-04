import { expect, test } from "@playwright/test";

const APP_URL = process.env.APP_URL || "http://localhost:5173";

const chartRows = [
  ["2026-02-02", 69200, 71200, 68800, 70600, 12600000],
  ["2026-02-09", 70600, 72400, 69900, 71900, 14100000],
  ["2026-02-16", 71900, 74700, 71200, 74200, 19300000],
  ["2026-02-23", 74200, 76100, 73100, 75600, 17400000],
  ["2026-03-02", 75600, 79400, 74900, 78900, 26800000],
  ["2026-03-09", 78900, 80400, 77500, 78200, 18100000],
  ["2026-03-16", 78200, 81200, 77900, 80700, 22400000],
  ["2026-03-23", 80700, 82600, 79100, 81800, 21900000],
  ["2026-03-30", 81800, 83100, 80200, 81100, 16900000],
  ["2026-04-06", 81100, 85300, 80700, 84600, 30400000],
  ["2026-04-13", 84600, 85800, 82300, 83200, 18800000],
  ["2026-04-20", 83200, 87200, 82900, 86600, 32700000],
  ["2026-04-27", 86600, 89100, 85800, 88400, 34500000],
  ["2026-05-04", 88400, 90200, 87100, 89500, 29800000]
].map(([date, open, high, low, close, volume]) => ({ date, open, high, low, close, volume }));

async function stubBackend(page) {
  await page.route("http://localhost:8080/api/**", (route) => {
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
          summary: "차트와 AI 설명으로 근거를 확인할 수 있습니다.",
          stockCode: "005930",
          stockName: "삼성전자"
        },
        {
          id: "term-volume",
          type: "term",
          title: "거래량",
          code: "학습",
          market: "용어",
          rate: "개념",
          tags: ["차트"],
          summary: "가격 움직임의 신뢰도를 확인합니다.",
          termId: "volume"
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
          {
            id: "buy",
            type: "buy",
            label: "매수 검토",
            price: "86,000~88,500원",
            condition: "20일선 지지와 거래량 증가가 함께 확인되면 매수 검토 구간입니다."
          },
          {
            id: "split",
            type: "split",
            label: "분할매수 검토",
            price: "83,000~85,000원",
            condition: "지지선 부근에서 하락 폭이 줄면 나누어 검토합니다."
          },
          {
            id: "watch",
            type: "watch",
            label: "관망",
            price: "88,500~90,000원",
            condition: "전고점 돌파 전 거래량이 줄면 다음 신호를 기다립니다."
          },
          {
            id: "sell",
            type: "sell",
            label: "매도 검토",
            price: "90,000원 이상",
            condition: "거래량 둔화와 긴 윗꼬리가 반복되면 매도 검토 조건입니다."
          }
        ]
      });
    }
    if (url.includes("/events")) {
      return json({ events: [{ date: "2026-03-02", type: "positive", title: "거래량 동반 돌파" }] });
    }
    if (url.includes("/learning/terms")) return json([]);
    if (url.includes("/ai/chat")) {
      return json({
        answer: "현재 국면은 상승 추세 유지 속 단기 조정입니다.",
        confidence: "86%",
        structured: {
          conclusion: "가격 흐름은 우상향이지만 전고점 부근에서는 속도 조절을 확인해야 합니다.",
          prediction: "20일선 지지와 거래량 재확대가 함께 확인되면 관심 후보로 유지할 수 있습니다.",
          evidence: ["20일선 지지"],
          opposingSignals: ["전저점 이탈"]
        },
        limitations: ["교육용 조건 설명입니다."],
        sources: ["chart"]
      });
    }
    if (url.includes("/summaries?")) {
      return json([
        {
          date: "2026-05-05",
          topGainer: "삼성전자",
          topLoser: "NAVER",
          mostMentioned: "반도체",
          content: "기록 영역에 보존되는 브리프입니다."
        }
      ]);
    }
    if (url.includes("/summaries/latest")) {
      return json({ date: "2026-05-05", effectiveDate: "2026-05-05", topGainers: [] });
    }
    return json({});
  });
}

async function openApp(page, hash = "#home") {
  await stubBackend(page);
  await page.goto(`${APP_URL}/${hash}`, { waitUntil: "networkidle" });
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
  test(`home is a two-choice entry on ${viewport.name}`, async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openApp(page);

    await expect(page).toHaveTitle("한국 주식 AI 학습");
    await expect(page.locator(".choiceButton")).toHaveCount(2);
    await expect(page.locator('.choiceButton[href="#learn"]')).toContainText("학습");
    await expect(page.locator('.choiceButton[href="#practice"]')).toContainText("실전");
    await expect(page.locator(".landingPreview")).toContainText("AI 예측");
    await expect(page.locator("#universal-search")).toHaveCount(0);
    await expect(page.locator(".quietNav a")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });

  test(`practice contains AI chart workflow on ${viewport.name}`, async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => errors.push(error.message));

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openApp(page, "#practice");

    await expect(page).toHaveTitle("실전 | 한국 주식 AI 학습");
    await expect(page.locator("#universal-search")).toBeVisible();
    await expect(page.locator(".threeStage")).toBeVisible();
    await expect(page.locator(".priceChart")).toBeVisible();
    await expect(page.locator(".chartTooltip")).toContainText("거래량");
    await expect(page.locator(".aiPanel")).toContainText("매수 검토 조건");
    await expect(page.locator(".aiPanel")).toContainText("매도 검토 조건");
    await expect(page.locator(".aiPanel")).toContainText("호재");
    await expect(page.locator(".aiPanel")).toContainText("악재");
    await expect(page.locator(".learningPanel.compact")).toContainText("초보자 학습");
    await expect(page.locator(".portfolioSandbox")).toContainText("관심 비중 점검");
    await expectNoHorizontalOverflow(page);
    expect(errors).toEqual([]);
  });
}

test("search results stay readable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openApp(page, "#practice");

  await page.fill("#universal-search", "반도체");
  await expect(page.locator(".searchResults")).toBeVisible();
  await expect(page.locator(".searchResults")).toContainText("삼성전자");
  await expect(page.locator(".searchResults")).toContainText("차트와 AI 설명");
  await expectNoHorizontalOverflow(page);
});

test("learning route exposes beginner structure", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await openApp(page, "#learn");

  await expect(page).toHaveTitle("학습 | 한국 주식 AI 학습");
  await expect(page.locator("#universal-search")).toBeVisible();
  await expect(page.locator(".priceChart")).toBeVisible();
  await expect(page.locator(".aiPanel")).toContainText("매수 검토 조건");
  await expect(page.locator(".learningPanel")).toBeVisible();
  await expect(page.getByText("자세한 설명")).toBeVisible();
  await expect(page.getByText("차트에서 보는 법")).toBeVisible();
  await expect(page.getByText("왜 중요한지")).toBeVisible();
  await expect(page.getByText("초보자 오해")).toBeVisible();
  await expect(page.getByText("시나리오 예시")).toBeVisible();
  await expect(page.getByText("AI에게 물어보기")).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("archive and admin preserve old operational flow outside the first screen", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openApp(page, "#archive");

  await expect(page).toHaveTitle("기록 | 한국 주식 AI 학습");
  await expect(page.locator(".calendar")).toBeVisible();
  await expect(page.locator(".detail")).toContainText("브리프");
  await expect(page.locator(".adminActions button")).toHaveCount(0);

  await page.goto(`${APP_URL}/#admin`, { waitUntil: "networkidle" });
  await expect(page).toHaveTitle("운영 | 한국 주식 AI 학습");
  await expect(page.locator(".adminPanel")).toBeVisible();
  await expect(page.getByPlaceholder("관리자 키가 필요합니다")).toBeVisible();
  await expect(page.locator(".adminActions button")).toHaveCount(4);
  await expectNoHorizontalOverflow(page);
});
