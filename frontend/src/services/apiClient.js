import {
  FALLBACK_AS_OF,
  fallbackAiBrief,
  fallbackCandidates,
  fallbackChart,
  fallbackEvents,
  fallbackLearningTerms,
  fallbackSearchResults,
  fallbackTradeZones
} from "../data/fallbackData.js";

const config = window.__CONFIG__ || {};
const API_BASE_URL = (config.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(
  /\/$/,
  ""
);

const publicKeyFromUrl = new URLSearchParams(window.location.search).get("k") || "";

function withGateParams(path) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (publicKeyFromUrl && !url.searchParams.has("k")) {
    url.searchParams.set("k", publicKeyFromUrl);
  }
  return url.toString();
}

async function request(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.adminKey ? { "X-Admin-Key": options.adminKey } : {}),
    ...options.headers
  };

  const response = await fetch(withGateParams(path), {
    ...options,
    headers,
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    const error = new Error(message || response.statusText);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export async function searchMarket(query, limit = 8) {
  if (!query.trim()) {
    return fallbackCandidates.map((item) => ({
      id: `candidate-${item.code}`,
      type: "stock",
      title: item.name,
      code: item.code,
      market: item.market,
      rate: item.rate,
      tags: [item.theme, "오늘 관심 후보"],
      summary: item.beginnerLine,
      source: "frontend_seed",
      stockCode: item.code,
      stockName: item.name
    }));
  }
  return request(`/api/search?query=${encodeURIComponent(query)}&limit=${limit}`);
}

export async function getLatestSummary() {
  return request("/api/summaries/latest");
}

export async function getSummaryRange(from, to) {
  return request(`/api/summaries?from=${from}&to=${to}`);
}

export async function getSummary(date) {
  return request(`/api/summaries/${date}`);
}

export async function generateToday(adminKey) {
  return request("/api/summaries/generate/today", { method: "POST", adminKey });
}

export async function generateDate(date, adminKey) {
  return request(`/api/summaries/${date}/generate`, { method: "POST", adminKey });
}

export async function archiveDate(date, adminKey) {
  return request(`/api/summaries/${date}/archive`, { method: "PUT", adminKey });
}

export async function backfillSummaries(from, to, adminKey) {
  return request(`/api/summaries/backfill?from=${from}&to=${to}`, { method: "POST", adminKey });
}

export async function getChart(code, range = "6M", interval = "daily") {
  return request(`/api/stocks/${code}/chart?range=${range}&interval=${interval}`);
}

export async function getTradeZones(code, range = "6M", interval = "daily", riskMode = "neutral") {
  return request(`/api/stocks/${code}/trade-zones?range=${range}&interval=${interval}&riskMode=${riskMode}`);
}

export async function getEvents(code, from = "2025-11-01", to = FALLBACK_AS_OF) {
  return request(`/api/stocks/${code}/events?from=${from}&to=${to}`);
}

export async function getLearningTerms(query = "", limit = 12) {
  return request(`/api/learning/terms?query=${encodeURIComponent(query)}&limit=${limit}`);
}

export async function askAi(question, context = {}) {
  return request("/api/ai/chat", {
    method: "POST",
    body: {
      question,
      context,
      responsePolicy: "conclusion_evidence_opposing_signal_risk_confidence_sources_only"
    }
  });
}

export async function askLearningAssistant(question, termId) {
  return request("/api/learning/assistant", {
    method: "POST",
    body: {
      question,
      termId,
      mode: "beginner_chart_connected"
    }
  });
}

export async function getPortfolio() {
  return request("/api/portfolio");
}

export async function addPortfolioItem(item) {
  return request("/api/portfolio/items", { method: "POST", body: item });
}

export function fallbackBundle(selected = fallbackCandidates[0]) {
  return {
    selected,
    candidates: fallbackCandidates,
    chart: {
      ...fallbackChart,
      code: selected.code,
      name: selected.name
    },
    zones: {
      ...fallbackTradeZones,
      code: selected.code,
      name: selected.name
    },
    events: {
      ...fallbackEvents,
      code: selected.code,
      name: selected.name
    },
    ai: fallbackAiBrief,
    learning: fallbackLearningTerms,
    searchResults: fallbackSearchResults
  };
}

export function normalizeAiResponse(response) {
  if (!response) return fallbackAiBrief;
  const structured = response.structured || response;
  return {
    status: response.status || "api",
    conclusion: structured.conclusion || response.answer || fallbackAiBrief.conclusion,
    prediction: structured.prediction || structured.direction || fallbackAiBrief.prediction,
    stage: structured.stage || structured.currentStage || fallbackAiBrief.stage,
    confidence: structured.confidence || response.confidence || fallbackAiBrief.confidence,
    basisDate: structured.basisDate || response.basisDate || FALLBACK_AS_OF,
    thesis: structured.evidence || structured.basis || fallbackAiBrief.thesis,
    opposingSignals: structured.opposingSignals || structured.oppositeSignals || fallbackAiBrief.opposingSignals,
    riskRules: structured.risks || structured.riskRules || fallbackAiBrief.riskRules,
    limitations: response.limitations || structured.limitations || fallbackAiBrief.limitations,
    sources: response.sources || structured.sources || fallbackAiBrief.sources
  };
}
