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

function normalizeSearchResult(item) {
  if (item.type === "term") {
    return {
      id: item.id || `term-${item.termId || item.title}`,
      type: "term",
      title: item.title || item.term,
      code: "학습",
      market: "용어",
      changeRate: "기초",
      theme: (item.tags || []).join(" · ") || "주식 개념",
      beginnerLine: item.summary || "차트와 연결해서 배우는 용어입니다."
    };
  }
  return {
    id: item.id || `stock-${item.code || item.stockCode}`,
    type: "stock",
    code: item.code || item.stockCode,
    name: item.name || item.stockName || item.title,
    title: item.title || item.stockName || item.name,
    market: item.market || "KRX",
    changeRate: item.rate || item.changeRate || "확인 필요",
    theme: (item.tags || []).join(" · ") || item.theme || "관심 후보",
    beginnerLine: item.summary || item.beginnerLine || "차트와 AI 조건을 함께 확인할 수 있습니다.",
    positive: item.positive || item.goodNews || "호재 요약을 불러오는 중입니다.",
    negative: item.negative || item.badNews || "악재 요약을 불러오는 중입니다."
  };
}

export async function searchWorkspace(query) {
  const normalizedQuery = query.trim().toLowerCase();
  const localStocks = fallbackStocks.filter((stock) => {
    const haystack = `${stock.name} ${stock.code} ${stock.market} ${stock.theme}`.toLowerCase();
    return !normalizedQuery || haystack.includes(normalizedQuery);
  });
  const localTerms = fallbackLearningTerms
    .filter((term) => {
      const haystack = `${term.term} ${term.category} ${term.coreSummary}`.toLowerCase();
      return normalizedQuery && haystack.includes(normalizedQuery);
    })
    .slice(0, 3)
    .map((term) => ({
      id: `term-${term.id}`,
      type: "term",
      title: term.term,
      code: "학습",
      market: term.category,
      changeRate: "개념",
      theme: term.relatedChartZone,
      beginnerLine: term.coreSummary
    }));

  function uniqueResults(items) {
    const seen = new Set();
    return items.filter((item) => {
      const key = item.code ? `${item.type || "stock"}-${item.code}` : item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  try {
    const remote = await requestJson(`/api/search?q=${encodeURIComponent(query)}`);
    const remoteResults = Array.isArray(remote) ? remote.map(normalizeSearchResult) : [];
    return uniqueResults([...remoteResults, ...localStocks, ...localTerms]).slice(0, 5);
  } catch {
    return uniqueResults([...localStocks, ...localTerms]).slice(0, 5);
  }
}

function normalizeChart(remoteChart) {
  const rows = remoteChart?.data || remoteChart?.rows || fallbackWorkspace.chart.rows;
  return {
    interval: remoteChart?.interval || "daily",
    rows
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
  return {
    ...fallbackWorkspace.ai,
    conclusion: structured.conclusion || remoteAi?.answer || fallbackWorkspace.ai.conclusion,
    direction: structured.prediction || fallbackWorkspace.ai.direction,
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
      zones: Array.isArray(zones?.zones) && zones.zones.length ? zones.zones : next.zones,
      events: Array.isArray(events?.events) && events.events.length ? events.events : next.events,
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
        date: fallbackWorkspace.asOf,
        topGainers: fallbackStocks.slice(0, 2).map((stock) => ({ code: stock.code, name: stock.name }))
      },
      list: [
        {
          date: fallbackWorkspace.asOf,
          topGainer: "삼성전자",
          topLoser: "NAVER",
          mostMentioned: "반도체",
          content: "관리자와 기록 영역에 보존되는 브리프 예시입니다."
        }
      ],
      source: "앱 내 예시 데이터"
    };
  }
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
