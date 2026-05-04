import { useCallback, useEffect, useMemo, useState } from "react";
import {
  askAi,
  fallbackBundle,
  getChart,
  getEvents,
  getLatestSummary,
  getLearningTerms,
  getPortfolio,
  getTradeZones,
  normalizeAiResponse,
  searchMarket
} from "../services/apiClient.js";
import { FALLBACK_AS_OF, fallbackCandidates, fallbackLearningTerms } from "../data/fallbackData.js";
import { useDebouncedValue } from "./useDebouncedValue.js";

function monthStart(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function todayKst() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

const initial = fallbackBundle();

export function useResearchWorkspace() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [searchResults, setSearchResults] = useState(initial.searchResults);
  const [searchState, setSearchState] = useState({ loading: false, error: "" });
  const [selected, setSelected] = useState(initial.selected);
  const [chart, setChart] = useState(initial.chart);
  const [zones, setZones] = useState(initial.zones);
  const [events, setEvents] = useState(initial.events);
  const [aiBrief, setAiBrief] = useState(initial.ai);
  const [learningTerms, setLearningTerms] = useState(initial.learning);
  const [summary, setSummary] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [dataState, setDataState] = useState({
    chart: "fallback",
    ai: "fallback",
    learning: "fallback",
    summary: "fallback",
    portfolio: "not_loaded",
    error: ""
  });

  useEffect(() => {
    let alive = true;
    setSearchState({ loading: true, error: "" });
    searchMarket(debouncedQuery, 8)
      .then((items) => {
        if (!alive) return;
        const next = Array.isArray(items) && items.length > 0 ? items : initial.searchResults;
        setSearchResults(next);
      })
      .catch((error) => {
        if (!alive) return;
        setSearchResults(initial.searchResults);
        setSearchState({ loading: false, error: error.message || "search_failed" });
      })
      .finally(() => {
        if (alive) setSearchState((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      alive = false;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    let alive = true;
    getLatestSummary()
      .then((next) => {
        if (!alive) return;
        setSummary(next);
        setDataState((prev) => ({ ...prev, summary: "api" }));
      })
      .catch(() => {
        if (!alive) return;
        setDataState((prev) => ({ ...prev, summary: "fallback" }));
      });

    getLearningTerms("", 12)
      .then((terms) => {
        if (!alive) return;
        setLearningTerms(Array.isArray(terms) && terms.length > 0 ? terms : fallbackLearningTerms);
        setDataState((prev) => ({ ...prev, learning: "api" }));
      })
      .catch(() => {
        if (!alive) return;
        setLearningTerms(fallbackLearningTerms);
        setDataState((prev) => ({ ...prev, learning: "fallback" }));
      });

    getPortfolio()
      .then((next) => {
        if (!alive) return;
        setPortfolio(next);
        setDataState((prev) => ({ ...prev, portfolio: "api" }));
      })
      .catch(() => {
        if (!alive) return;
        setDataState((prev) => ({ ...prev, portfolio: "fallback" }));
      });

    return () => {
      alive = false;
    };
  }, []);

  const selectSearchResult = useCallback((item) => {
    if (item?.type === "term") {
      window.location.hash = "#learning";
      setQuery(item.title || "");
      return;
    }
    if (!item?.stockCode && !item?.code?.match(/^\d{6}$/)) {
      setQuery(item?.title || "");
      return;
    }
    const code = item.stockCode || item.code;
    setSelected({
      id: code,
      code,
      name: item.stockName || item.title || code,
      market: item.market || "KRX",
      rate: item.rate || "-",
      theme: item.tags?.[0] || "관심 후보",
      beginnerLine: item.summary || "차트와 AI 주석으로 움직임을 확인합니다.",
      positive: "호재는 이벤트와 거래량 증가가 함께 확인될 때 더 신뢰할 수 있습니다.",
      negative: "악재는 지지선 이탈과 거래량 증가가 함께 나타날 때 리스크가 커집니다.",
      confidence: "82%"
    });
  }, []);

  useEffect(() => {
    let alive = true;
    const fallback = fallbackBundle(selected);
    setDataState((prev) => ({ ...prev, chart: "loading", ai: "loading", error: "" }));
    Promise.allSettled([
      getChart(selected.code),
      getTradeZones(selected.code),
      getEvents(selected.code, monthStart(new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)), todayKst()),
      askAi(`초보자에게 ${selected.name} 차트와 매수/매도 검토 조건을 설명해줘`, {
        stockCode: selected.code,
        stockName: selected.name,
        query: selected.name
      })
    ]).then((results) => {
      if (!alive) return;
      const [chartResult, zonesResult, eventsResult, aiResult] = results;
      const nextChart = chartResult.status === "fulfilled" ? chartResult.value : fallback.chart;
      const nextZones = zonesResult.status === "fulfilled" ? zonesResult.value : fallback.zones;
      const nextEvents = eventsResult.status === "fulfilled" ? eventsResult.value : fallback.events;
      const nextAi = aiResult.status === "fulfilled" ? normalizeAiResponse(aiResult.value) : fallback.ai;
      setChart(nextChart?.data?.length ? nextChart : fallback.chart);
      setZones(nextZones?.zones?.length ? nextZones : fallback.zones);
      setEvents(nextEvents?.events?.length ? nextEvents : fallback.events);
      setAiBrief(nextAi);
      setDataState((prev) => ({
        ...prev,
        chart: chartResult.status === "fulfilled" ? "api" : "fallback",
        ai: aiResult.status === "fulfilled" ? "api" : "fallback",
        error:
          chartResult.status === "rejected" || aiResult.status === "rejected"
            ? "일부 API 응답을 받지 못해 화면에 fallback을 표시합니다."
            : ""
      }));
    });
    return () => {
      alive = false;
    };
  }, [selected]);

  const candidates = useMemo(() => {
    if (summary?.topGainers?.length) {
      return summary.topGainers.slice(0, 3).map((item) => ({
        id: item.code,
        code: item.code,
        name: item.name,
        market: "오늘 움직인 종목",
        rate: item.rate == null ? "-" : `${item.rate > 0 ? "+" : ""}${item.rate.toFixed(2)}%`,
        theme: "상승 TOP3",
        beginnerLine: "오늘 등락률 상위 종목입니다. 차트와 이벤트 원인을 함께 확인합니다.",
        positive: "등락률 상위는 재료와 수급이 같이 붙었는지 확인해야 합니다.",
        negative: "급등 이후 거래량 둔화가 나오면 추격보다 관망 조건을 봅니다.",
        confidence: "80%"
      }));
    }
    return fallbackCandidates;
  }, [summary]);

  const meta = useMemo(
    () => ({
      asOf: chart?.asOf || zones?.basisDate || summary?.effectiveDate || FALLBACK_AS_OF,
      confidence: zones?.confidence || aiBrief?.confidence || selected.confidence || "82%",
      source:
        dataState.chart === "api" || dataState.summary === "api"
          ? "backend API 기반"
          : "fallback 표시 중",
      apiBase: window.__CONFIG__?.API_BASE_URL || "http://localhost:8080"
    }),
    [aiBrief?.confidence, chart?.asOf, dataState.chart, dataState.summary, selected.confidence, summary?.effectiveDate, zones?.basisDate, zones?.confidence]
  );

  return {
    query,
    setQuery,
    searchResults,
    searchState,
    selected,
    setSelected,
    selectSearchResult,
    candidates,
    chart,
    zones,
    events,
    aiBrief,
    learningTerms,
    portfolio,
    dataState,
    meta
  };
}
