import React, { useEffect, useMemo, useState } from "react";
import { AiInsightPanel, AdminOperationsPanel, BriefHistoryCalendar } from "./AppPanels.jsx";
import { COPY, PAGE_LABELS } from "./AppConstants.js";
import { HistoryOverview, LearningPanel, PortfolioPanel } from "./AppSections.jsx";
import { HomePage } from "./HomePage.jsx";
import { SummaryDetailPanel } from "./SummaryDetailPanel.jsx";
import { createApiClient } from "./apiClient.js";
import { useBriefData } from "./hooks/useBriefData.js";
import { useAssistantFlows } from "./hooks/useAssistantFlows.js";
import { useLearningTerms } from "./hooks/useLearningTerms.js";
import { usePortfolio } from "./hooks/usePortfolio.js";
import { useSearchResults } from "./hooks/useSearchResults.js";
import { useStockResearch } from "./hooks/useStockResearch.js";
import {
  addMonths,
  asArray,
  buildDecisionPanel,
  buildEvidenceLinks,
  buildNaverLinks,
  buildSearchItems,
  buildStockPicks,
  buildTermCoreSummary,
  buildTermScenario,
  filterMostMentioned,
  formatEffectiveDate,
  formatNumber,
  formatRate,
  getConfig,
  getConfidenceLabel,
  getDataAsOf,
  getLeaderExplanation,
  getMarketHeadline,
  isoDate,
  pageFromHash,
  resolveApiLink,
  sortTopGainers,
  sortTopLosers,
  stockFromEntry,
  stockRouteHash,
  valueOrDash
} from "./AppUtils.js";

export default function App() {
  const cfg = useMemo(() => getConfig(), []);
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const k = urlParams.get("k") || "";
  const adminKey = urlParams.get("adminKey") || urlParams.get("ak") || "";
  const apiClient = useMemo(
    () => createApiClient({ apiBaseUrl: cfg.apiBaseUrl, accessKey: k, adminKey }),
    [adminKey, cfg.apiBaseUrl, k]
  );
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

  const {
    month,
    setMonth,
    selected,
    setSelected,
    summary,
    krxArtifact,
    krxArtifactError,
    stats,
    insights,
    monthHasSummary,
    loading,
    error,
    setError,
    backfillFrom,
    setBackfillFrom,
    backfillTo,
    setBackfillTo,
    backfillResult,
    days,
    monthLabel,
    todayStr,
    generate,
    archiveSelected,
    runBackfill,
    jumpToLatest
  } = useBriefData({ apiClient, gateEnabled: cfg.gateEnabled, accessKey: k });
  const {
    learningTerms,
    learningError,
    termQuery,
    setTermQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    visibleTerms,
    selectedTerm,
    selectTerm: selectLearningTerm,
    briefTerms
  } = useLearningTerms({
    apiClient,
    enabled: !(cfg.gateEnabled && !k),
    loadFailedMessage: COPY.learningLoadFailed
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockInterval, setStockInterval] = useState("daily");
  const [riskMode, setRiskMode] = useState("neutral");
  const { portfolio, portfolioSummary, addStockToPortfolio, updatePortfolioWeight, removePortfolioItem } = usePortfolio();

  const stockPicks = useMemo(() => buildStockPicks(summary), [summary]);
  const searchItems = useMemo(() => buildSearchItems(summary, learningTerms), [learningTerms, summary]);
  const { searchResults, searchLoading } = useSearchResults({
    apiClient,
    enabled: !(cfg.gateEnabled && !k),
    query: searchQuery,
    baseItems: searchItems
  });
  const topGainers = useMemo(() => sortTopGainers(summary?.topGainers).slice(0, 3), [summary]);
  const topLosers = useMemo(() => sortTopLosers(summary?.topLosers).slice(0, 3), [summary]);
  const topMentioned = useMemo(() => filterMostMentioned(summary?.mostMentionedTop).slice(0, 3), [summary]);
  const currentStock = selectedStock || stockPicks[0] || null;
  const { stockChart, stockEvents, tradeZones, stockChartLoading, stockChartError } = useStockResearch({
    apiClient,
    stock: currentStock,
    interval: stockInterval,
    riskMode,
    chartFailedMessage: COPY.chartFailed
  });
  const dataAsOf = useMemo(() => getDataAsOf(summary, selected), [summary, selected]);
  const confidenceLabel = useMemo(() => getConfidenceLabel(summary), [summary]);
  const decisionPanel = useMemo(
    () => buildDecisionPanel(stockChart, stockEvents, riskMode, tradeZones),
    [riskMode, stockChart, stockEvents, tradeZones]
  );
  const {
    assistantQuestion,
    setAssistantQuestion,
    assistantResponse,
    assistantLoading,
    askAssistant,
    askMarketAssistant,
    askLearningAssistant,
    primeLearningAssistant,
    aiResearchLoading,
    aiResearchResponse,
    askChartAi
  } = useAssistantFlows({
    apiClient,
    activePage,
    selected,
    summary,
    briefTerms,
    selectedTerm,
    currentStock,
    stockInterval,
    stockChart,
    stockEvents,
    tradeZones,
    dataAsOf,
    riskMode,
    setError
  });

  function selectTerm(term) {
    if (!term) return;
    selectLearningTerm(term);
    primeLearningAssistant(term);
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

  function addCurrentStockToPortfolio() {
    addStockToPortfolio(currentStock);
  }

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
        <div className="homeLaunchGrid">
          <div className="homeLaunchContent">
            <HomePage
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
              stockInterval={stockInterval}
              setStockInterval={setStockInterval}
              stockChart={stockChart}
              stockEvents={stockEvents}
              stockChartLoading={stockChartLoading}
              stockChartError={stockChartError}
              darkMode={darkMode}
              riskMode={riskMode}
              setRiskMode={setRiskMode}
              decisionPanel={decisionPanel}
              addCurrentStockToPortfolio={addCurrentStockToPortfolio}
              askChartAi={askChartAi}
              aiResearchLoading={aiResearchLoading}
              aiResearchResponse={aiResearchResponse}
              asArray={asArray}
              formatNumber={formatNumber}
              formatRate={formatRate}
              buildNaverLinks={buildNaverLinks}
            />
          </div>
          <aside className="homeLaunchAi" aria-label="AI 시장 해석">
            {assistantPanel}
          </aside>
        </div>
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
    </div>
  );
}
