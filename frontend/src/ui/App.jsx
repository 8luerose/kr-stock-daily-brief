import React, { useEffect, useMemo, useState } from "react";
import { AiInsightPanel, AdminOperationsPanel, BriefHistoryCalendar } from "./AppPanels.jsx";
import { COPY, PAGE_LABELS } from "./AppConstants.js";
import { HistoryOverview, LearningPanel, MarketHero, PortfolioPanel, StockResearchPanel } from "./AppSections.jsx";
import { SummaryDetailPanel } from "./SummaryDetailPanel.jsx";
import {
  addMonths,
  asArray,
  buildCalendarDays,
  buildDecisionPanel,
  buildEvidenceLinks,
  buildNaverLinks,
  buildSearchItems,
  buildStockPicks,
  buildTermCoreSummary,
  buildTermQuestion,
  buildTermScenario,
  endOfMonth,
  filterMostMentioned,
  formatEffectiveDate,
  formatNumber,
  formatRate,
  fromForEvents,
  getConfig,
  getConfidenceLabel,
  getDataAsOf,
  getLeaderExplanation,
  getMarketHeadline,
  isoDate,
  normalizeSearchResult,
  pageFromHash,
  pickBriefTerms,
  portfolioRisk,
  rangeForInterval,
  resolveApiLink,
  searchMatchesItem,
  startOfMonth,
  sortTopGainers,
  sortTopLosers,
  stockFromEntry,
  stockRouteHash,
  termMatches,
  valueOrDash
} from "./AppUtils.js";

export default function App() {
  const cfg = useMemo(() => getConfig(), []);
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const k = urlParams.get("k") || "";
  const adminKey = urlParams.get("adminKey") || urlParams.get("ak") || "";
  const [activePage, setActivePage] = useState(() => pageFromHash(window.location.hash));

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try {
      localStorage.setItem("theme", darkMode ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [darkMode]);

  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => isoDate(new Date()));

  // Current day detail
  const [summary, setSummary] = useState(null);
  const [krxArtifact, setKrxArtifact] = useState(null);
  const [krxArtifactError, setKrxArtifactError] = useState("");

  // Dashboard stats
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);

  // Month overview (used to mark days with existing summaries)
  const [monthHasSummary, setMonthHasSummary] = useState(() => new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backfillFrom, setBackfillFrom] = useState("2026-02-01");
  const [backfillTo, setBackfillTo] = useState("2026-02-05");
  const [backfillResult, setBackfillResult] = useState(null);
  const [learningTerms, setLearningTerms] = useState([]);
  const [learningError, setLearningError] = useState("");
  const [termQuery, setTermQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [serverSearchResults, setServerSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantResponse, setAssistantResponse] = useState(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockInterval, setStockInterval] = useState("daily");
  const [riskMode, setRiskMode] = useState("neutral");
  const [stockChart, setStockChart] = useState(null);
  const [stockEvents, setStockEvents] = useState(null);
  const [tradeZones, setTradeZones] = useState(null);
  const [stockChartLoading, setStockChartLoading] = useState(false);
  const [stockChartError, setStockChartError] = useState("");
  const [aiResearchLoading, setAiResearchLoading] = useState(false);
  const [aiResearchResponse, setAiResearchResponse] = useState(null);
  const [portfolio, setPortfolio] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("portfolioSandbox") || "[]");
    } catch {
      return [];
    }
  });

  const days = useMemo(() => buildCalendarDays(month), [month]);
  const monthLabel = useMemo(
    () =>
      month.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long"
      }),
    [month]
  );
  const categories = useMemo(
    () => Array.from(new Set(learningTerms.map((term) => term.category).filter(Boolean))),
    [learningTerms]
  );
  const visibleTerms = useMemo(
    () => learningTerms.filter((term) => termMatches(term, termQuery, selectedCategory)).slice(0, 80),
    [learningTerms, termQuery, selectedCategory]
  );
  const selectedTerm = useMemo(
    () => visibleTerms.find((term) => term.id === selectedTermId) || visibleTerms[0] || learningTerms.find((term) => term.id === selectedTermId) || learningTerms[0] || null,
    [learningTerms, selectedTermId, visibleTerms]
  );
  const briefTerms = useMemo(() => pickBriefTerms(learningTerms), [learningTerms]);
  const stockPicks = useMemo(() => buildStockPicks(summary), [summary]);
  const searchItems = useMemo(() => buildSearchItems(summary, learningTerms), [learningTerms, summary]);
  const searchResults = useMemo(
    () => {
      const serverItems = serverSearchResults.map((item) => normalizeSearchResult(item, searchItems)).filter(Boolean);
      return (serverItems.length > 0 ? serverItems : searchItems.filter((item) => searchMatchesItem(item, searchQuery))).slice(0, 6);
    },
    [searchItems, searchQuery, serverSearchResults]
  );
  const topGainers = useMemo(() => sortTopGainers(summary?.topGainers).slice(0, 3), [summary]);
  const topLosers = useMemo(() => sortTopLosers(summary?.topLosers).slice(0, 3), [summary]);
  const topMentioned = useMemo(() => filterMostMentioned(summary?.mostMentionedTop).slice(0, 3), [summary]);
  const currentStock = selectedStock || stockPicks[0] || null;
  const dataAsOf = useMemo(() => getDataAsOf(summary, selected), [summary, selected]);
  const confidenceLabel = useMemo(() => getConfidenceLabel(summary), [summary]);
  const decisionPanel = useMemo(
    () => buildDecisionPanel(stockChart, stockEvents, riskMode, tradeZones),
    [riskMode, stockChart, stockEvents, tradeZones]
  );
  const portfolioSummary = useMemo(() => portfolioRisk(portfolio), [portfolio]);

  async function apiFetch(path, opts = {}) {
    const url = new URL(cfg.apiBaseUrl + path);
    if (k) url.searchParams.set("k", k);

    const headers = new Headers(opts.headers || {});
    if (adminKey) headers.set("X-Admin-Key", adminKey);

    const res = await fetch(url.toString(), { ...opts, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function load(dateStr) {
    setLoading(true);
    setError("");
    setKrxArtifact(null);
    setKrxArtifactError("");
    try {
      const s = await apiFetch(`/api/summaries/${dateStr}`);
      setSummary(s);
      setLoading(false);

      try {
        const artifact = await apiFetch(`/api/summaries/${dateStr}/verification/krx`);
        setKrxArtifact(artifact);
      } catch (artifactErr) {
        setKrxArtifact(null);
        setKrxArtifactError(artifactErr.message || String(artifactErr));
      }
    } catch (e) {
      // 404 = no summary yet
      if (String(e.message).includes("404")) {
        if (dateStr === isoDate(new Date())) {
          try {
            const latest = await apiFetch("/api/summaries/latest");
            setSummary(latest);
            if (latest?.date && latest.date !== dateStr) {
              setSelected(latest.date);
              const [y, m, d] = latest.date.split("-").map(Number);
              setMonth(new Date(y, m - 1, d));
            }
            return;
          } catch {
            // fall through to the empty state when there is no stored summary.
          }
        }
        setSummary(null);
      }
      else setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    // If gated and no key, skip stats call.
    if (cfg.gateEnabled && !k) {
      setStats(null);
      return;
    }

    try {
      const s = await apiFetch("/api/summaries/stats");
      setStats(s);
    } catch (e) {
      console.warn("Failed to load stats", e);
      setStats(null);
    }
  }

  async function loadInsights(monthDate) {
    if (cfg.gateEnabled && !k) {
      setInsights(null);
      return;
    }

    const from = isoDate(startOfMonth(monthDate));
    const to = isoDate(endOfMonth(monthDate));

    try {
      const data = await apiFetch(`/api/summaries/insights?from=${from}&to=${to}`);
      setInsights(data);
    } catch (e) {
      console.warn("Failed to load insights", e);
      setInsights(null);
    }
  }

  async function loadMonthOverview(monthDate) {
    // If gated and no key, don't spam the API.
    if (cfg.gateEnabled && !k) {
      setMonthHasSummary(new Set());
      return;
    }

    const from = isoDate(startOfMonth(monthDate));
    const to = isoDate(endOfMonth(monthDate));

    try {
      const list = await apiFetch(`/api/summaries?from=${from}&to=${to}`);
      const set = new Set(list.map((x) => x.date));
      setMonthHasSummary(set);
    } catch (e) {
      // Month overview is non-critical; show error only if we have nothing else.
      console.warn("Failed to load month overview", e);
      setMonthHasSummary(new Set());
    }
  }

  async function loadLearningTerms() {
    if (cfg.gateEnabled && !k) {
      setLearningTerms([]);
      return;
    }

    setLearningError("");
    try {
      const data = await apiFetch("/api/learning/terms?limit=80");
      setLearningTerms(data);
      if (!selectedTermId && data.length > 0) {
        setSelectedTermId(data[0].id);
        setAssistantQuestion(buildTermQuestion(data[0]));
      }
    } catch (e) {
      console.warn("Failed to load learning terms", e);
      setLearningTerms([]);
      setLearningError(COPY.learningLoadFailed);
    }
  }

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || (cfg.gateEnabled && !k)) {
      setServerSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }

    setServerSearchResults([]);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await apiFetch(`/api/search?query=${encodeURIComponent(q)}&limit=8`, { signal: controller.signal });
        setServerSearchResults(asArray(data));
      } catch (e) {
        if (!controller.signal.aborted) {
          console.warn("Failed to load search results", e);
          setServerSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [cfg.apiBaseUrl, k, searchQuery, cfg.gateEnabled]);

  function selectTerm(term) {
    setSelectedTermId(term.id);
    setAssistantQuestion(buildTermQuestion(term));
    setAssistantResponse(null);
  }

  function selectStock(stock) {
    if (!stock) return;
    setActivePage("research");
    setSelectedStock(stock);
    if (stock.code) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${stockRouteHash(stock)}`);
    }
    window.setTimeout(() => {
      document.getElementById("stock-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  async function askMarketAssistant(questionOverride, itemOverride) {
    const question = (questionOverride || assistantQuestion || "오늘 시장을 초보자 관점으로 설명해줘").trim();
    if (!question) return;

    setAssistantLoading(true);
    setAssistantResponse(null);
    setError("");
    try {
      const data = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          contextDate: selected,
          topicType: itemOverride?.type || "market",
          topicTitle: itemOverride?.title || "오늘 시장",
          searchResult: itemOverride
            ? {
                type: itemOverride.type,
                title: itemOverride.title,
                code: itemOverride.code,
                market: itemOverride.market,
                tags: asArray(itemOverride.tags),
                summary: itemOverride.summary,
                source: itemOverride.source
              }
            : null,
          summary: summary
            ? {
                date: summary.date,
                topGainer: summary.topGainer,
                topLoser: summary.topLoser,
                mostMentioned: summary.mostMentioned
              }
            : null,
          terms: briefTerms
        })
      });
      setAssistantQuestion(question);
      setAssistantResponse(data);
    } catch (e) {
      setAssistantQuestion(question);
      setAssistantResponse({
        answer: formatApiError(e),
        confidence: "low",
        sources: [],
        limitations: ["AI 서비스 응답을 받지 못했습니다."]
      });
    } finally {
      setAssistantLoading(false);
      window.setTimeout(() => {
        document.querySelector(".heroAssistant")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }

  function askAssistant() {
    if (activePage === "home") {
      askMarketAssistant();
      return;
    }
    askLearningAssistant();
  }

  async function selectSearchResult(item) {
    if (!item) return;
    if (item.type === "stock" && item.stock) {
      setSearchQuery(item.title);
      selectStock(item.stock);
      return;
    }
    if (item.type === "term" && item.term) {
      setSearchQuery(item.title);
      selectTerm(item.term);
      navigatePage("learning");
      return;
    }
    setSearchQuery(item.title);
    navigatePage("home");
    await askMarketAssistant(`${item.title}이(가) 오늘 시장에서 왜 중요한지 초보자 관점으로 설명해줘`, item);
  }

  async function askLearningAssistant(questionOverride, termIdOverride) {
    const question = (questionOverride || assistantQuestion || buildTermQuestion(selectedTerm)).trim();
    if (!question) return;

    setAssistantLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/learning/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          contextDate: selected,
          termId: termIdOverride || selectedTerm?.id || ""
        })
      });
      setAssistantQuestion(question);
      setAssistantResponse(data);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setAssistantLoading(false);
    }
  }

  async function loadStockResearch(stock, interval) {
    if (!stock?.code) {
      setStockChart(null);
      setStockEvents(null);
      setTradeZones(null);
      setStockChartError("");
      return;
    }

    setStockChartLoading(true);
    setStockChartError("");
    try {
      const range = rangeForInterval(interval);
      const chart = await apiFetch(`/api/stocks/${stock.code}/chart?range=${range}&interval=${interval}`);
      setStockChart(chart);
      try {
        const zones = await apiFetch(`/api/stocks/${stock.code}/trade-zones?range=${range}&interval=${interval}&riskMode=${riskMode}`);
        setTradeZones(zones);
      } catch (zoneErr) {
        console.warn("Failed to load stock trade zones", zoneErr);
        setTradeZones(null);
      }

      const from = fromForEvents(chart);
      const to = chart.asOf || asArray(chart.data).at(-1)?.date || "";
      if (from && to) {
        const events = await apiFetch(`/api/stocks/${stock.code}/events?from=${from}&to=${to}`);
        setStockEvents(events);
      } else {
        setStockEvents(null);
      }
    } catch (e) {
      console.warn("Failed to load stock research", e);
      setStockChart(null);
      setStockEvents(null);
      setTradeZones(null);
      setStockChartError(COPY.chartFailed);
    } finally {
      setStockChartLoading(false);
    }
  }

  async function askChartAi() {
    if (!currentStock?.code) return;
    setAiResearchLoading(true);
    setAiResearchResponse(null);
    try {
      const data = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${currentStock.name} 차트와 이벤트를 초보자 관점으로 설명해줘`,
          contextDate: stockChart?.asOf || dataAsOf,
          stockCode: currentStock.code,
          stockName: currentStock.name,
          focus: riskMode,
          summary: summary
            ? {
                date: summary.date,
                topGainer: summary.topGainer,
                topLoser: summary.topLoser,
                mostMentioned: summary.mostMentioned
              }
            : null,
          chart: stockChart
            ? {
                interval: stockChart.interval,
                range: stockChart.range,
                asOf: stockChart.asOf,
                latest: asArray(stockChart.data).at(-1),
                tradeZones
              }
            : null,
          events: asArray(stockEvents?.events).slice(0, 8),
          terms: briefTerms
        })
      });
      setAiResearchResponse(data);
    } catch (e) {
      setAiResearchResponse({
        answer: formatApiError(e),
        confidence: "low",
        sources: [],
        limitations: ["AI 서비스 응답을 받지 못했습니다."]
      });
    } finally {
      setAiResearchLoading(false);
    }
  }

  function savePortfolio(next) {
    setPortfolio(next);
    try {
      localStorage.setItem("portfolioSandbox", JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function addCurrentStockToPortfolio() {
    if (!currentStock?.code) return;
    const exists = portfolio.some((item) => item.code === currentStock.code);
    const next = exists
      ? portfolio
      : [
          ...portfolio,
          {
            code: currentStock.code,
            name: currentStock.name,
            group: currentStock.group,
            rate: currentStock.rate,
            count: currentStock.count,
            weight: 10
          }
        ];
    savePortfolio(next);
  }

  function updatePortfolioWeight(code, weight) {
    const value = Math.max(0, Math.min(100, Number(weight || 0)));
    savePortfolio(portfolio.map((item) => (item.code === code ? { ...item, weight: value } : item)));
  }

  function removePortfolioItem(code) {
    savePortfolio(portfolio.filter((item) => item.code !== code));
  }

  function formatApiError(err) {
    const msg = err.message || String(err);
    if (msg.includes("409") || msg.includes("summary_already_exists")) {
      return "이미 생성된 요약이 있습니다. 재생성은 관리자만 가능합니다.";
    }
    if (msg.includes("403") || msg.includes("forbidden") || msg.includes("admin_only")) {
      return "관리자 권한이 필요합니다. URL에 ?ak=관리자키 를 추가하세요.";
    }
    if (msg.includes("HTTP 401")) return "인증이 필요합니다.";
    if (msg.includes("HTTP 404")) return "데이터를 찾을 수 없습니다.";
    if (msg.includes("HTTP 500")) return "서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.";
    return msg;
  }

  async function generate(dateStr) {
    setLoading(true);
    setError("");
    try {
      const s = await apiFetch(`/api/summaries/${dateStr}/generate`, { method: "POST" });
      setSummary(s);

      // Refresh month overview so the dot appears immediately.
      await loadMonthOverview(month);
      await loadStats();
      await loadInsights(month);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function archiveSelected() {
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/api/summaries/${selected}/archive`, { method: "PUT" });
      setSummary(null);
      await loadMonthOverview(month);
      await loadStats();
      await loadInsights(month);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function runBackfill() {
    setLoading(true);
    setError("");
    try {
      const r = await apiFetch(`/api/summaries/backfill?from=${backfillFrom}&to=${backfillTo}`, {
        method: "POST"
      });
      setBackfillResult(r);
      await loadMonthOverview(month);
      await loadStats();
      await loadInsights(month);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function jumpToLatest() {
    setLoading(true);
    setError("");
    try {
      const s = await apiFetch("/api/summaries/latest");
      setSummary(s);
      await loadStats();
      setSelected(s.date);
      const [y, m, d] = s.date.split("-").map(Number);
      setMonth(new Date(y, m - 1, d));
    } catch (e) {
      if (String(e.message).includes("404")) setError("아직 생성된 요약이 없습니다.");
      else setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    loadMonthOverview(month);
    loadInsights(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLearningTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stockPicks.length === 0) {
      setSelectedStock(null);
      return;
    }

    const hashCode = window.location.hash.startsWith("#research-stock-")
      ? window.location.hash.replace("#research-stock-", "")
      : "";
    const matched = hashCode ? stockPicks.find((stock) => stock.code === hashCode) : null;
    setSelectedStock(matched || stockPicks[0]);
  }, [stockPicks]);

  useEffect(() => {
    const onHashChange = () => setActivePage(pageFromHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    setAiResearchResponse(null);
    loadStockResearch(currentStock, stockInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStock?.code, stockInterval, riskMode]);

  const todayStr = useMemo(() => isoDate(new Date()), []);
  const primaryNavItems = [
    ["home", PAGE_LABELS.home],
    ["research", PAGE_LABELS.research]
  ];
  const menuNavItems = [
    ["history", PAGE_LABELS.history],
    ["learning", PAGE_LABELS.learning],
    ["portfolio", PAGE_LABELS.portfolio]
  ];
  const visibleMenuItems = adminKey ? [...menuNavItems, ["admin", PAGE_LABELS.admin]] : menuNavItems;
  const isMenuActive = visibleMenuItems.some(([page]) => page === activePage);
  const showsCalendar = activePage === "history" || activePage === "admin";
  const showsDetail = activePage === "research" || activePage === "home" || activePage === "history" || activePage === "admin";
  const usesResearchLayout = activePage === "research" || activePage === "home" || showsCalendar;

  useEffect(() => {
    const pageLabel = PAGE_LABELS[activePage] || PAGE_LABELS.home;
    document.title = `${pageLabel} | ${COPY.brand}`;
  }, [activePage]);

  function navigatePage(page) {
    setActivePage(page);
    const hash = page === "home" ? "#home" : `#${page}`;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  }

  const assistantPanel = (
    <AiInsightPanel
      activePage={activePage}
      copy={COPY}
      selected={selected}
      assistantQuestion={assistantQuestion}
      setAssistantQuestion={setAssistantQuestion}
      assistantLoading={assistantLoading}
      assistantResponse={assistantResponse}
      askAssistant={askAssistant}
      selectTerm={selectTerm}
    />
  );

  return (
    <div className="page">
      <a className="skipLink" href="#main-content">본문으로 건너뛰기</a>
      <header className="top">
        <div>
          <div className="brand">{COPY.brand}</div>
          <div className="brandSub">{COPY.productTagline}</div>
        </div>
        <div className="actions">
          <nav className="appNav" aria-label="주요 화면">
            {primaryNavItems.map(([page, label]) => (
              <button
                key={page}
                type="button"
                className={activePage === page ? "active" : ""}
                aria-current={activePage === page ? "page" : undefined}
                onClick={() => navigatePage(page)}
              >
                {label}
              </button>
            ))}
          </nav>
          <details className={`navMenu ${isMenuActive ? "active" : ""}`}>
            <summary>메뉴</summary>
            <div className="navMenuPanel">
              {visibleMenuItems.map(([page, label]) => (
                <button
                  key={page}
                  type="button"
                  className={activePage === page ? "active" : ""}
                  aria-current={activePage === page ? "page" : undefined}
                  onClick={(e) => {
                    navigatePage(page);
                    e.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                >
                  {label}
                </button>
              ))}
              <button type="button" onClick={jumpToLatest} disabled={loading}>
                {COPY.moveToLatest}
              </button>
              <button type="button" onClick={() => setDarkMode((v) => !v)}>
                {darkMode ? COPY.toggleDarkOff : COPY.toggleDarkOn}
              </button>
            </div>
          </details>
        </div>
      </header>

      {activePage === "home" ? (
        <MarketHero
          copy={COPY}
          summary={summary}
          selected={selected}
          dataAsOf={dataAsOf}
          confidenceLabel={confidenceLabel}
          headline={getMarketHeadline(summary, selected)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchLoading={searchLoading}
          searchResults={searchResults}
          selectSearchResult={selectSearchResult}
          stockPicks={stockPicks}
          currentStock={currentStock}
          selectStock={selectStock}
          asArray={asArray}
          formatNumber={formatNumber}
          formatRate={formatRate}
        />
      ) : null}

      {activePage === "home" && summary && currentStock ? (
        <StockResearchPanel
          copy={COPY}
          homeCompact
          currentStock={currentStock}
          stockInterval={stockInterval}
          setStockInterval={setStockInterval}
          stockChart={stockChart}
          stockEvents={stockEvents}
          stockChartLoading={stockChartLoading}
          stockChartError={stockChartError}
          darkMode={darkMode}
          dataAsOf={dataAsOf}
          riskMode={riskMode}
          setRiskMode={setRiskMode}
          decisionPanel={decisionPanel}
          addCurrentStockToPortfolio={addCurrentStockToPortfolio}
          askChartAi={askChartAi}
          aiResearchLoading={aiResearchLoading}
          aiResearchResponse={aiResearchResponse}
          summary={summary}
          asArray={asArray}
          formatNumber={formatNumber}
          formatRate={formatRate}
          buildNaverLinks={buildNaverLinks}
        />
      ) : null}

      {activePage === "learning" ? assistantPanel : null}

      {activePage === "history" ? (
        <HistoryOverview copy={COPY} stats={stats} insights={insights} />
      ) : null}

      <main
        id="main-content"
        tabIndex="-1"
        className={`main ${usesResearchLayout ? "researchLayout" : "singleLayout"}`}
      >
        {activePage !== "home" ? (
        <div className="sideStack">
        {activePage === "admin" ? (
        <AdminOperationsPanel
          copy={COPY}
          showAdminPanel={showAdminPanel}
          setShowAdminPanel={setShowAdminPanel}
          forceOpen={activePage === "admin"}
          adminKey={adminKey}
          selected={selected}
          setSelected={setSelected}
          loading={loading}
          todayStr={todayStr}
          generate={generate}
          archiveSelected={archiveSelected}
          backfillFrom={backfillFrom}
          setBackfillFrom={setBackfillFrom}
          backfillTo={backfillTo}
          setBackfillTo={setBackfillTo}
          runBackfill={runBackfill}
          backfillResult={backfillResult}
        />
        ) : null}

        {showsCalendar ? (
        <BriefHistoryCalendar
          activePage={activePage}
          copy={COPY}
          selected={selected}
          monthLabel={monthLabel}
          setMonth={setMonth}
          addMonths={addMonths}
          days={days}
          isoDate={isoDate}
          month={month}
          todayStr={todayStr}
          monthHasSummary={monthHasSummary}
          setSelected={setSelected}
        />
        ) : null}

        {activePage === "learning" ? (
          <LearningPanel
            copy={COPY}
            learningError={learningError}
            termQuery={termQuery}
            setTermQuery={setTermQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            visibleTerms={visibleTerms}
            selectedTerm={selectedTerm}
            selectTerm={selectTerm}
            buildTermCoreSummary={buildTermCoreSummary}
            buildTermScenario={buildTermScenario}
            askLearningAssistant={askLearningAssistant}
            assistantLoading={assistantLoading}
            asArray={asArray}
          />
        ) : null}

        {activePage === "portfolio" ? (
          <PortfolioPanel
            copy={COPY}
            currentStock={currentStock}
            addCurrentStockToPortfolio={addCurrentStockToPortfolio}
            portfolio={portfolio}
            updatePortfolioWeight={updatePortfolioWeight}
            removePortfolioItem={removePortfolioItem}
            portfolioSummary={portfolioSummary}
          />
        ) : null}
        </div>
        ) : null}

        {showsDetail ? (
          <SummaryDetailPanel
            activePage={activePage}
            cfg={cfg}
            k={k}
            error={error}
            loading={loading}
            summary={summary}
            selected={selected}
            briefTerms={briefTerms}
            selectedTerm={selectedTerm}
            selectTerm={selectTerm}
            topGainers={topGainers}
            topLosers={topLosers}
            topMentioned={topMentioned}
            selectStock={selectStock}
            currentStock={currentStock}
            stockInterval={stockInterval}
            setStockInterval={setStockInterval}
            stockChart={stockChart}
            stockEvents={stockEvents}
            stockChartLoading={stockChartLoading}
            stockChartError={stockChartError}
            darkMode={darkMode}
            dataAsOf={dataAsOf}
            riskMode={riskMode}
            setRiskMode={setRiskMode}
            decisionPanel={decisionPanel}
            addCurrentStockToPortfolio={addCurrentStockToPortfolio}
            askChartAi={askChartAi}
            aiResearchLoading={aiResearchLoading}
            aiResearchResponse={aiResearchResponse}
            krxArtifact={krxArtifact}
            krxArtifactError={krxArtifactError}
            formatEffectiveDate={formatEffectiveDate}
            buildEvidenceLinks={buildEvidenceLinks}
            buildNaverLinks={buildNaverLinks}
            resolveApiLink={resolveApiLink}
            getLeaderExplanation={getLeaderExplanation}
            stockFromEntry={stockFromEntry}
            valueOrDash={valueOrDash}
            formatNumber={formatNumber}
            formatRate={formatRate}
            asArray={asArray}
          />
        ) : null}
      </main>

      {activePage === "home" ? assistantPanel : null}
    </div>
  );
}
