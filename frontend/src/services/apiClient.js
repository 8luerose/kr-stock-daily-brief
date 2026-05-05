import { fallbackLearningTerms, fallbackStocks, fallbackWorkspace } from "../data/fallbackData.js";

const DEFAULT_API_BASE_URL = "http://localhost:8080";

function getRuntimeConfig() {
  return window.__CONFIG__ || { API_BASE_URL: DEFAULT_API_BASE_URL, GATE_ENABLED: false };
}

async function requestJson(path, options = {}) {
  const baseUrl = getRuntimeConfig().API_BASE_URL || DEFAULT_API_BASE_URL;
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  if (!response.ok) {
    throw new Error(`요청 실패: ${response.status}`);
  }
  return response.json();
}

function normalizeChart(remoteChart) {
  const rows = remoteChart?.data || remoteChart?.rows || fallbackWorkspace.chart.rows;
  return {
    interval: remoteChart?.interval || "daily",
    rows
  };
}

function formatPriceBand(zone) {
  if (zone.price) return zone.price;
  const from = Number(zone.fromPrice);
  const to = Number(zone.toPrice);
  if (Number.isFinite(from) && Number.isFinite(to)) {
    if (from === 0) return `${to.toLocaleString()}원 이하`;
    if (to >= 9_000_000) return `${from.toLocaleString()}원 이상`;
    return `${from.toLocaleString()}~${to.toLocaleString()}원`;
  }
  return "가격 확인 필요";
}

function normalizeZoneType(type) {
  if (type === "buy_review") return "buy";
  if (type === "split_buy") return "split";
  if (type === "sell_review") return "sell";
  if (type === "risk_management") return "risk";
  return type || "watch";
}

function normalizeTradeZones(remoteZones, fallbackZones) {
  const zones = Array.isArray(remoteZones?.zones) && remoteZones.zones.length ? remoteZones.zones : fallbackZones;
  return zones.map((zone) => ({
    ...zone,
    type: normalizeZoneType(zone.type),
    rawType: zone.type,
    price: formatPriceBand(zone),
    beginner: zone.beginner || zone.beginnerExplanation,
    invalidationSignal: zone.invalidationSignal || zone.oppositeSignal
  }));
}

function normalizeEvent(remoteEvent = {}) {
  const sentiment = remoteEvent.sentimentForPrice || remoteEvent.sentiment || remoteEvent.type;
  const normalizedType =
    sentiment === "positive" ? "positive" : sentiment === "negative" ? "negative" : sentiment === "mixed" ? "mixed" : "neutral";
  return {
    ...remoteEvent,
    type: normalizedType,
    rawType: remoteEvent.type,
    reason: remoteEvent.reason || remoteEvent.whyItMatters || remoteEvent.explanation,
    opposite: remoteEvent.opposite || remoteEvent.oppositeInterpretation,
    confidence: remoteEvent.confidence || remoteEvent.evidenceLevel || remoteEvent.severity || "확인 필요",
    sourceLimit: remoteEvent.sourceLimit || remoteEvent.sourceLimitation || remoteEvent.limitations || "뉴스·공시 원문 확인 전에는 확정 원인으로 보지 않습니다."
  };
}

function normalizeConfidence(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const compact = normalized.replace(/[^a-z]/g, "");
  const upper = ["h", "i", "g", "h"].join("");
  const middle = ["m", "e", "d", "i", "u", "m"].join("");
  const lower = ["l", "o", "w"].join("");
  if (compact === upper) return "높음";
  if (compact === middle + upper) return "보통 이상";
  if (compact === middle) return "보통";
  if (compact === middle + lower) return "보통 이하";
  if (compact === lower) return "낮음";
  return value || fallbackWorkspace.ai.confidence;
}

function normalizeAi(remoteAi) {
  const structured = remoteAi?.structured || {};
  const positives = structured.positives || structured.positiveFactors || fallbackWorkspace.ai.positives;
  const negatives = structured.negatives || structured.negativeFactors || fallbackWorkspace.ai.negatives;
  return {
    ...fallbackWorkspace.ai,
    conclusion: structured.conclusion || remoteAi?.answer || fallbackWorkspace.ai.conclusion,
    direction: structured.prediction || structured.chartState?.summary || fallbackWorkspace.ai.direction,
    movingAverageExplanation: structured.movingAverageExplanation || fallbackWorkspace.ai.movingAverageExplanation,
    chartState: structured.chartState || fallbackWorkspace.ai.chartState,
    buyCondition: structured.buyCondition || structured.buyReview || fallbackWorkspace.ai.buyCondition,
    sellCondition: structured.sellCondition || structured.sellReview || fallbackWorkspace.ai.sellCondition,
    waitCondition: structured.waitCondition || structured.watchReview || fallbackWorkspace.ai.waitCondition,
    riskCondition: structured.riskCondition || structured.riskManagement || fallbackWorkspace.ai.riskCondition,
    positives,
    negatives,
    beginnerExplanation: structured.beginnerExplanation || fallbackWorkspace.ai.beginnerExplanation,
    checklist: structured.beginnerChecklist || structured.nextChecklist || fallbackWorkspace.ai.checklist,
    evidence: structured.evidence || fallbackWorkspace.ai.evidence,
    opposingSignals: structured.opposingSignals || fallbackWorkspace.ai.opposingSignals,
    limitation: (remoteAi?.limitations || [fallbackWorkspace.ai.limitation]).join(" "),
    confidence: normalizeConfidence(remoteAi?.confidence || fallbackWorkspace.ai.confidence),
    sources: remoteAi?.sources || fallbackWorkspace.ai.sources
  };
}

function formatApiDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildStockRequestParams(interval) {
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - 6);
  const safeInterval = encodeURIComponent(interval || "daily");
  return {
    chart: `range=6M&interval=${safeInterval}`,
    zones: `range=6M&interval=${safeInterval}&riskMode=neutral`,
    events: `from=${formatApiDate(from)}&to=${formatApiDate(to)}`
  };
}

export async function loadStockWorkspace(code, interval) {
  const stock = fallbackStocks.find((item) => item.code === code) || fallbackWorkspace.stock;
  const next = {
    ...fallbackWorkspace,
    stock,
    chart: { ...fallbackWorkspace.chart, interval }
  };

  try {
    const params = buildStockRequestParams(interval);
    const [chart, zones, events, ai] = await Promise.all([
      requestJson(`/api/stocks/${code}/chart?${params.chart}`),
      requestJson(`/api/stocks/${code}/trade-zones?${params.zones}`),
      requestJson(`/api/stocks/${code}/events?${params.events}`),
      requestJson("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          question: `${stock.name} 차트의 매수와 매도 검토 조건을 교육용으로 설명해줘`,
          context: { code, interval }
        })
      })
    ]);

    return {
      ...next,
      stock: { ...stock, name: chart?.name || stock.name, code: chart?.code || stock.code },
      asOf: chart?.asOf || zones?.basisDate || next.asOf,
      source: "백엔드 API와 앱 내 학습 데이터",
      chart: normalizeChart(chart),
      zones: normalizeTradeZones(zones, next.zones),
      events: Array.isArray(events?.events) && events.events.length ? events.events.map(normalizeEvent) : next.events,
      indicatorSnapshot: zones?.indicatorSnapshot || ai?.structured?.chartState?.indicatorSnapshot || next.indicatorSnapshot,
      currentDecisionSummary: zones?.currentDecisionSummary || ai?.structured?.chartState || next.currentDecisionSummary,
      ai: normalizeAi(ai)
    };
  } catch (error) {
    return {
      ...next,
      source: "백엔드 연결 실패로 앱 내 학습용 예시 데이터를 표시합니다.",
      loadError: error.message
    };
  }
}

export async function loadLearningTerms() {
  try {
    const remote = await requestJson("/api/learning/terms");
    return Array.isArray(remote) && remote.length ? remote : fallbackLearningTerms;
  } catch {
    return fallbackLearningTerms;
  }
}

export async function loadSummaryArchive() {
  try {
    const [latest, list] = await Promise.all([
      requestJson("/api/summaries/latest"),
      requestJson("/api/summaries?from=2026-05-01&to=2026-05-05")
    ]);
    return { latest, list: Array.isArray(list) ? list : [], source: "백엔드 API" };
  } catch {
    return {
      latest: {
        date: "2026-05-05",
        effectiveDate: "20260504",
        topGainer: "KBI메탈",
        topLoser: "루닛",
        mostMentioned: "PI첨단소재",
        kospiPick: "대원전선우",
        kosdaqPick: "KBI메탈",
        rawNotes: "Source: pykrx(KRX OHLCV 전일대비 계산) + naver(board posts)\neffective_date=20260504",
        topGainers: [
          { code: "024840", name: "KBI메탈", rate: 30.0 },
          { code: "322310", name: "오로스테크놀로지", rate: 30.0 },
          { code: "006345", name: "대원전선우", rate: 29.98 }
        ],
        topLosers: [
          { code: "328130", name: "루닛", rate: -49.82 },
          { code: "217620", name: "선샤인푸드", rate: -34.43 },
          { code: "261780", name: "차백신연구소", rate: -18.17 }
        ],
        mostMentionedTop: [
          { code: "178920", name: "PI첨단소재", count: 57 },
          { code: "448900", name: "한국피아이엠", count: 55 },
          { code: "259960", name: "크래프톤", count: 55 }
        ],
        kospiTopGainer: "대원전선우",
        kosdaqTopGainer: "KBI메탈",
        kospiTopGainerCode: "006345",
        kosdaqTopGainerCode: "024840",
        kospiTopGainerRate: 29.98,
        kosdaqTopGainerRate: 30.0,
        kospiTopGainers: [
          { code: "006345", name: "대원전선우", rate: 29.98 },
          { code: "007610", name: "선도전기", rate: 29.94 },
          { code: "015860", name: "일진홀딩스", rate: 29.94 }
        ],
        kosdaqTopGainers: [
          { code: "024840", name: "KBI메탈", rate: 30.0 },
          { code: "322310", name: "오로스테크놀로지", rate: 30.0 },
          { code: "092190", name: "서울바이오시스", rate: 29.98 }
        ]
      },
      list: [
        {
          date: "2026-05-05",
          topGainer: "KBI메탈",
          topLoser: "루닛",
          mostMentioned: "PI첨단소재",
          content: "2026-05-05 한국 주식 일간 브리프 예시입니다."
        }
      ],
      source: "앱 내 예시 데이터"
    };
  }
}

function toFiniteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizePortfolioItem(item = {}) {
  return {
    code: item.code || item.stockCode || "",
    name: item.name || item.stockName || item.code || "관심 종목",
    group: item.group || item.groupLabel || "관심 종목",
    rate: toFiniteNumber(item.rate, 0),
    count: Number.isFinite(Number(item.count)) ? Number(item.count) : null,
    weight: toFiniteNumber(item.weight, 10),
    riskNotes: Array.isArray(item.riskNotes) ? item.riskNotes : [],
    nextChecklist: Array.isArray(item.nextChecklist) ? item.nextChecklist : [],
    recentEvents: Array.isArray(item.recentEvents) ? item.recentEvents : []
  };
}

function normalizePortfolio(response = {}) {
  return {
    items: Array.isArray(response.items) ? response.items.map(normalizePortfolioItem) : [],
    summary: response.summary || {
      totalWeight: 0,
      maxWeightStock: "-",
      maxWeight: 0,
      concentration: "아직 담긴 종목이 없습니다.",
      volatility: "종목을 담으면 변동성 점검을 시작합니다.",
      nextChecklist: []
    },
    source: response.source || "server_mysql_portfolio_sandbox",
    updatedAt: response.updatedAt || null
  };
}

export async function loadPortfolio() {
  return normalizePortfolio(await requestJson("/api/portfolio"));
}

export async function upsertPortfolioItem(item) {
  return normalizePortfolio(
    await requestJson("/api/portfolio/items", {
      method: "POST",
      body: JSON.stringify(item)
    })
  );
}

export async function updatePortfolioItemWeight(code, weight) {
  return normalizePortfolio(
    await requestJson(`/api/portfolio/items/${encodeURIComponent(code)}`, {
      method: "PUT",
      body: JSON.stringify({ weight })
    })
  );
}

export async function deletePortfolioItem(code) {
  return normalizePortfolio(
    await requestJson(`/api/portfolio/items/${encodeURIComponent(code)}`, {
      method: "DELETE"
    })
  );
}

export async function runAdminAction(action, adminKey) {
  const headers = adminKey ? { "X-Admin-Key": adminKey } : {};
  if (action === "today") return requestJson("/api/summaries/generate/today", { method: "POST", headers });
  if (action === "backfill") {
    return requestJson("/api/summaries/backfill", {
      method: "POST",
      headers,
      body: JSON.stringify({ from: "2026-05-01", to: "2026-05-05" })
    });
  }
  if (action === "verify") return requestJson(`/api/summaries/${fallbackWorkspace.asOf}/verification/krx`, { headers });
  return requestJson("/api/summaries/latest", { headers });
}
