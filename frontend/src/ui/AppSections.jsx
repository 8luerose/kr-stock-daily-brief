import React from "react";
import StockPriceChart from "./StockPriceChart.jsx";

function eventEvidenceSources(event) {
  const sources = Array.isArray(event?.evidenceSources) ? event.evidenceSources : [];
  if (sources.length > 0) return sources;
  return (Array.isArray(event?.evidenceLinks) ? event.evidenceLinks : []).map((url, index) => ({
    type: index === 0 ? "price_history" : "source",
    title: index === 0 ? "시세" : `근거 ${index + 1}`,
    url,
    description: ""
  }));
}

function primaryEventHref(event) {
  return eventEvidenceSources(event)[0]?.url || "#";
}

function eventCausalScores(event) {
  return Array.isArray(event?.causalScores) ? event.causalScores : [];
}

function causalScoreMeta(score) {
  if (!score) return "";
  const factors = Array.isArray(score.causalFactors) ? score.causalFactors.slice(0, 2).join("/") : "";
  const evidenceLabel = {
    market_data: "시장자료",
    body: "본문",
    search: "검색",
    none: ""
  }[score.evidenceLevel] || "";
  const parts = [];
  if (factors) parts.push(`요인 ${factors}`);
  if (evidenceLabel) parts.push(`근거 ${evidenceLabel}`);
  return parts.join(" · ");
}

export function MarketHero({
  copy,
  summary,
  selected,
  dataAsOf,
  confidenceLabel,
  headline,
  searchQuery,
  setSearchQuery,
  searchLoading,
  searchResults,
  selectSearchResult,
  askMarketAssistant,
  stockPicks,
  currentStock,
  selectStock,
  asArray,
  formatNumber,
  formatRate
}) {
  const pulseItems = stockPicks.length > 0 ? stockPicks.slice(0, 3) : [
    { name: copy.topGainer, group: "상승", rate: 0 },
    { name: copy.topLoser, group: "하락", rate: 0 },
    { name: copy.mostMentioned, group: "관심", count: 0 }
  ];
  const quickTerms = ["등락률", "거래량", "손절"];
  const emptySuggestions = stockPicks.length > 0
    ? stockPicks.slice(0, 3).map((stock) => stock.name)
    : ["반도체", "거래량", "DART"];

  return (
    <section className="marketHero">
      <div className="marketHeroMain">
        <div className="eyebrow">{copy.todayBrief}</div>
        <h1>{copy.heroTitle}</h1>
        <p>{summary ? copy.heroSubtitle : copy.noMarketOneLine}</p>
        {summary ? <div className="heroMarketLine"><span>{copy.aiInsight}</span>{headline}</div> : null}
        <div className="heroMeta">
          <span>{copy.dataAsOf}: {dataAsOf}</span>
          <span>{copy.sourceConfidence}: {confidenceLabel}</span>
          <span>{copy.selectedDate}: {selected}</span>
        </div>
        <div className="heroSearch" role="search">
          <label htmlFor="universal-search">{copy.universalSearch}</label>
          <div className="heroSearchBox">
            <input
              id="universal-search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={copy.universalSearchPlaceholder}
              autoComplete="off"
            />
            <span>{copy.aiInsight}</span>
          </div>
          {searchQuery.trim() ? (
            <div className="searchResults" aria-live="polite">
              {searchLoading ? <div className="searchEmpty">{copy.loading}</div> : null}
              {!searchLoading && searchResults.length === 0 ? (
                <div className="searchEmpty">
                  <p>{copy.searchEmpty}</p>
                  <div className="searchSuggestionRow" aria-label="추천 검색어">
                    {emptySuggestions.map((keyword) => (
                      <button type="button" key={keyword} onClick={() => setSearchQuery(keyword)}>
                        {keyword}
                      </button>
                    ))}
                    {searchQuery.trim() ? (
                      <button
                        type="button"
                        onClick={() => askMarketAssistant?.(`${searchQuery.trim()}을 초보자 관점에서 설명해줘`, {
                          id: `empty-${searchQuery.trim()}`,
                          type: "search-empty",
                          title: searchQuery.trim(),
                          market: "검색",
                          summary: "검색 결과가 없어서 AI가 시장/용어 맥락으로 설명합니다.",
                          tags: [searchQuery.trim()]
                        })}
                      >
                        AI에게 질문
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <button type="button" key={item.id} onClick={() => selectSearchResult(item)}>
                    <span className="searchType">{item.market}</span>
                    <strong>{item.title} <small>{item.code}</small></strong>
                    <p>{item.summary}</p>
                    <em>{item.rate}</em>
                    <span className="searchTags">{asArray(item.tags).slice(0, 3).join(" · ")}</span>
                    <span className="searchActions">
                      {item.type === "stock" ? "차트 보기 · AI 설명 · 초보자 한 줄" : item.type === "term" ? "용어 학습 · AI 질문" : "테마 해석 · AI 질문"}
                    </span>
                  </button>
                ))
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="heroLearningEntrypoints" aria-label="학습 바로가기">
          {quickTerms.map((term) => (
            <a href="#learning" key={term} onClick={() => setSearchQuery(term)}>
              {term} 배우기
            </a>
          ))}
        </div>
      </div>
      <div className="marketPulse" role="list" aria-label="주요 종목 흐름">
        {pulseItems.map((stock, index) => {
          const rate = Number(stock.rate || 0);
          const width = stock.count
            ? Math.min(100, Math.max(18, Number(stock.count)))
            : Math.min(100, Math.max(18, Math.abs(rate) * 2.2));
          const content = (
            <>
              <span className="pulseName">{stock.name}</span>
              <span className="pulseGroup">{stock.group}</span>
              <span className="pulseTrack">
                <span
                  className={`pulseFill ${rate < 0 ? "down" : stock.count ? "mention" : "up"}`}
                  style={{ width: `${width}%` }}
                />
              </span>
              <strong>{stock.count ? `${formatNumber(stock.count)}건` : formatRate(stock.rate)}</strong>
            </>
          );

          if (!stock.code) {
            return (
              <button type="button" key={`${stock.group}-${stock.name}-${index}`} className="pulseRow" disabled>
                {content}
              </button>
            );
          }

          return (
            <button
              type="button"
              key={`${stock.group}-${stock.code || stock.name}-${index}`}
              className={`pulseRow ${currentStock?.code && stock.code === currentStock.code ? "active" : ""}`}
              aria-label={`${stock.name} ${stock.group} ${stock.count ? `${formatNumber(stock.count)}건` : formatRate(stock.rate)}`}
              aria-pressed={currentStock?.code && stock.code === currentStock.code}
              onClick={() => selectStock(stock)}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function HistoryOverview({ copy, stats, insights }) {
  return (
    <>
      <section className="card overview">
        <div className="overviewItem">
          <span className="label">{copy.cumulativeSummaries}</span>
          <strong>{stats?.totalCount ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">{copy.latestDate}</span>
          <strong>{stats?.latestDate ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">{copy.lastUpdated}</span>
          <strong>{stats?.latestUpdatedAt ?? "-"}</strong>
        </div>
      </section>

      <section className="card overview insights">
        <div className="overviewItem">
          <span className="label">{copy.monthlyTotalDays}</span>
          <strong>{insights?.totalDays ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">{copy.monthlyGenerated}</span>
          <strong>{insights?.generatedDays ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">{copy.monthlyMissing}</span>
          <strong>{insights?.missingDays ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">{copy.monthlyTopMentioned}</span>
          <strong>
            {insights?.topMostMentioned
              ? `${insights.topMostMentioned} (${insights.topMostMentionedCount}회)`
              : "-"}
          </strong>
        </div>
      </section>
    </>
  );
}

export function LearningPanel({
  copy,
  learningError,
  termQuery,
  setTermQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  visibleTerms,
  selectedTerm,
  selectTerm,
  buildTermCoreSummary,
  buildTermScenario,
  askLearningAssistant,
  assistantLoading,
  asArray
}) {
  return (
    <section className="card learningPanel">
      <div className="panelHead">
        <div>
          <div className="panelTitle">{copy.learningTitle}</div>
          <div className="panelSubtitle">{copy.learningSubtitle}</div>
        </div>
      </div>

      {learningError ? <div className="hint">{learningError}</div> : null}

      <label className="fieldLabel" htmlFor="term-search">{copy.learningSearch}</label>
      <input
        id="term-search"
        className="searchInput"
        value={termQuery}
        onChange={(event) => setTermQuery(event.target.value)}
        placeholder={copy.learningSearchPlaceholder}
      />

      <div className="learningFilterRow">
        <label className="fieldLabel" htmlFor="term-category">분류</label>
        <select
          id="term-category"
          className="categorySelect"
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
        >
          <option value="">{copy.allCategories}</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div className="learningGrid">
        {visibleTerms.length === 0 ? (
          <div className="empty compact">{copy.noTerms}</div>
        ) : (
          <div className="termList">
            {visibleTerms.map((term) => (
              <button
                type="button"
                key={term.id}
                className={`termButton ${selectedTerm?.id === term.id ? "active" : ""}`}
                aria-pressed={selectedTerm?.id === term.id}
                onClick={() => selectTerm(term)}
              >
                <span>{term.term}</span>
                <small>{term.category}</small>
              </button>
            ))}
          </div>
        )}

        {selectedTerm ? (
          <div className="termDetail">
            <div className="termCategory">{selectedTerm.category}</div>
            <h3>{selectedTerm.term}</h3>
            <div className="termLead">
              <strong>{copy.coreSummary}</strong>
              <p>{buildTermCoreSummary(selectedTerm)}</p>
            </div>
            <div className="termInfo">
              <strong>뜻</strong>
              <span>{selectedTerm.plainDefinition}</span>
            </div>
            <div className="termInfo">
              <strong>{copy.longExplanation}</strong>
              <span>{selectedTerm.longExplanation || `${selectedTerm.plainDefinition} ${selectedTerm.whyItMatters}`}</span>
            </div>
            <div className="termInfo">
              <strong>{copy.chartUsage}</strong>
              <span>{selectedTerm.chartUsage || selectedTerm.beginnerCheck}</span>
            </div>
            <div className="termInfo">
              <strong>{copy.whyItMatters}</strong>
              <span>{selectedTerm.whyItMatters}</span>
            </div>
            <div className="termInfo">
              <strong>{copy.beginnerCheck}</strong>
              <span>{selectedTerm.beginnerCheck}</span>
            </div>
            <div className="termInfo caution">
              <strong>{copy.caution}</strong>
              <span>{selectedTerm.commonMisunderstanding || selectedTerm.caution}</span>
            </div>
            <div className="termInfo scenario">
              <strong>{copy.scenarioExample}</strong>
              <span>{buildTermScenario(selectedTerm)}</span>
            </div>
            <div className="relatedTerms">
              <span>{copy.relatedTerms}</span>
              <div>
                {asArray(selectedTerm.relatedTerms).slice(0, 5).map((term) => (
                  <button type="button" key={term} onClick={() => setTermQuery(term)}>
                    {term}
                  </button>
                ))}
              </div>
            </div>
            <div className="questionList">
              <span>{copy.exampleQuestions}</span>
              {(asArray(selectedTerm.exampleQuestions).length > 0
                ? asArray(selectedTerm.exampleQuestions)
                : asArray(selectedTerm.relatedQuestions)
              ).slice(0, 3).map((question) => (
                <button
                  type="button"
                  key={question}
                  onClick={() => askLearningAssistant(question, selectedTerm.id)}
                  disabled={assistantLoading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function PortfolioPanel({
  copy,
  currentStock,
  addCurrentStockToPortfolio,
  portfolio,
  updatePortfolioWeight,
  removePortfolioItem,
  portfolioSummary,
  portfolioSource
}) {
  const maxWeightName = portfolioSummary.maxItem?.name || portfolioSummary.maxWeightStock || "-";
  const maxWeightValue = portfolioSummary.maxItem?.weight ?? portfolioSummary.maxWeight ?? 0;
  return (
    <section className="card portfolioPanel">
      <div className="panelHead">
        <div>
          <div className="panelTitle">{copy.portfolioTitle}</div>
          <div className="panelSubtitle">{copy.portfolioSubtitle}</div>
        </div>
      </div>
      <button type="button" className="btn primary small fullWidth" onClick={addCurrentStockToPortfolio} disabled={!currentStock?.code}>
        {currentStock?.name ? `${currentStock.name} ${copy.addToPortfolio}` : copy.addToPortfolio}
      </button>
      {portfolio.length === 0 ? (
        <div className="empty compact">관심 종목을 추가하면 비중과 변동성 리스크를 비교합니다.</div>
      ) : (
        <div className="portfolioList">
          {portfolio.map((item) => (
            <div className="portfolioItem" key={item.code}>
              <div>
                <strong>{item.name}</strong>
                <span>{item.code} · {item.group}</span>
                {Array.isArray(item.riskNotes) && item.riskNotes.length > 0 ? (
                  <small>{item.riskNotes[0]}</small>
                ) : null}
                {Array.isArray(item.nextChecklist) && item.nextChecklist.length > 0 ? (
                  <small>다음 확인: {item.nextChecklist.slice(0, 2).join(" · ")}</small>
                ) : null}
              </div>
              <label>
                {copy.virtualWeight}
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={item.weight}
                  onChange={(event) => updatePortfolioWeight(item.code, event.target.value)}
                />
              </label>
              <button type="button" onClick={() => removePortfolioItem(item.code)}>제외</button>
            </div>
          ))}
        </div>
      )}
      <div className="portfolioRisk">
        <div className="portfolioAiCheck">
          <span>AI 포트폴리오 점검</span>
          <p>
            현재 관심 종목은 비중, 변동성, 최근 이벤트를 기준으로 조건형 리스크 시나리오를 먼저 세워야 합니다.
          </p>
        </div>
        <div>
          <span>{copy.concentration}</span>
          <p>{portfolioSummary.concentration}</p>
        </div>
        <div>
          <span>{copy.volatility}</span>
          <p>{portfolioSummary.volatility}</p>
        </div>
        <small>총 가상 비중 {portfolioSummary.totalWeight}% · 최대 비중 {maxWeightName} {maxWeightValue}%</small>
        {Array.isArray(portfolioSummary.nextChecklist) && portfolioSummary.nextChecklist.length > 0 ? (
          <small>다음 체크리스트: {portfolioSummary.nextChecklist.join(" · ")}</small>
        ) : null}
        <small>저장 방식: {portfolioSource === "server_mysql_portfolio_sandbox" ? "서버 샌드박스" : "브라우저 임시 저장"}</small>
      </div>
    </section>
  );
}

export function StockResearchPanel({
  copy,
  homeCompact = false,
  currentStock,
  stockInterval,
  setStockInterval,
  stockChart,
  stockEvents,
  tradeZones,
  stockChartLoading,
  stockChartError,
  darkMode,
  dataAsOf,
  riskMode,
  setRiskMode,
  decisionPanel,
  addCurrentStockToPortfolio,
  askChartAi,
  aiResearchLoading,
  aiResearchResponse,
  summary,
  asArray,
  formatNumber,
  formatRate,
  buildNaverLinks
}) {
  if (!currentStock) return null;

  return (
    <section id="stock-detail" className={`stockResearch ${homeCompact ? "homeCompact" : ""}`}>
      <div className="stockResearchHead">
        <div>
          <span className="stockGroup">{currentStock.group}</span>
          <h3>{currentStock.name} {currentStock.code ? <small>{currentStock.code}</small> : null}</h3>
        </div>
        <div className="intervalTabs" aria-label="차트 기간">
          {[
            ["daily", "일봉"],
            ["weekly", "주봉"],
            ["monthly", "월봉"]
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={stockInterval === value ? "active" : ""}
              aria-pressed={stockInterval === value}
              onClick={() => setStockInterval(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="stockResearchGrid">
        <div className="chartPreview">
          <div className="chartBasis">
            {stockChart?.name || currentStock.name} · {stockChart?.asOf || dataAsOf} · MA/거래량/OBV/RSI/MACD/이벤트
          </div>
          {stockChartLoading ? <div className="chartState" role="status">{copy.chartLoading}</div> : null}
          {stockChartError ? <div className="chartState errorText" role="alert">{stockChartError}</div> : null}
          {stockChart ? (
            <StockPriceChart chart={stockChart} events={stockEvents} tradeZones={tradeZones} decisionPanel={decisionPanel} darkMode={darkMode} />
          ) : null}
        </div>
        <div className="stockSignalPanel">
          <div className="riskTabs" aria-label={copy.riskMode}>
            {[
              ["aggressive", copy.aggressive],
              ["neutral", copy.neutral],
              ["conservative", copy.conservative]
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={riskMode === value ? "active" : ""}
                aria-pressed={riskMode === value}
                onClick={() => setRiskMode(value)}
              >
              {label}
            </button>
          ))}
          </div>
          <div className="stockMetricRow">
            <span>랭킹</span>
            <strong>{currentStock.group}</strong>
          </div>
          <div className="stockMetricRow">
            <span>등락률</span>
            <strong>{formatRate(currentStock.rate)}</strong>
          </div>
          {currentStock.count !== undefined && currentStock.count !== null ? (
            <div className="stockMetricRow">
              <span>언급량</span>
              <strong>{formatNumber(currentStock.count)}건</strong>
            </div>
          ) : null}
          <div className="beginnerSignalList">
            <strong>{copy.chartSummary}</strong>
            <p>{decisionPanel.summary}</p>
          </div>
          <div className="decisionZones">
            <div className="zone buy"><span>{copy.buyConditions}</span><p>{decisionPanel.buy}</p></div>
            <div className="zone split"><span>{copy.splitBuyConditions}</span><p>{decisionPanel.splitBuy}</p></div>
            <div className="zone neutral"><span>{copy.watchConditions}</span><p>{decisionPanel.watch}</p></div>
            <div className="zone watch"><span>{copy.sellConditions}</span><p>{decisionPanel.sell}</p></div>
            <div className="zone risk"><span>{copy.stopConditions}</span><p>{decisionPanel.stop}</p></div>
            <div className="zone opposite"><span>{copy.oppositeSignals}</span><p>{decisionPanel.opposite}</p></div>
          </div>
          <div className="beginnerSignalList">
            <strong>{copy.evidenceData}</strong>
            <ul>
              {decisionPanel.evidence.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          {asArray(stockEvents?.events).length > 0 ? (
            <div className="eventList">
              {asArray(stockEvents.events).slice(0, 4).map((event) => {
                const causalScores = eventCausalScores(event);
                const topCausal = causalScores[0];
                const textCausal = causalScores.find((score) => Number(score.signalCount || 0) > 0);
                const causalMeta = causalScoreMeta(textCausal || topCausal);
                return (
                  <a
                    key={`${event.date}-${event.type}`}
                    href={primaryEventHref(event)}
                    target="_blank"
                    rel="noreferrer"
                    title={event.explanation}
                  >
                    <span>{event.date}</span>
                    <strong>{event.title}</strong>
                    <em>
                      {eventEvidenceSources(event).slice(0, 4).map((source) => source.title).join(" · ")}
                    </em>
                    {topCausal ? (
                      <small>
                        원인 점수 {topCausal.label} {topCausal.score}/100 · {topCausal.confidence}
                        {textCausal ? ` · 텍스트 근거 ${textCausal.signalCount}건` : ""}
                        {textCausal?.signalOrigins?.length ? ` · ${textCausal.signalOrigins.join("/")}` : ""}
                        {causalMeta ? ` · ${causalMeta}` : ""}
                      </small>
                    ) : null}
                  </a>
                );
              })}
            </div>
          ) : null}
          <div className="analysisDisclaimer">{copy.analysisDisclaimer} 신뢰도: {decisionPanel.confidence}</div>
          <button
            type="button"
            className="btn ghost small"
            onClick={addCurrentStockToPortfolio}
            disabled={!currentStock.code}
          >
            {copy.addToPortfolio}
          </button>
          <button
            type="button"
            className="btn primary small"
            onClick={askChartAi}
            disabled={aiResearchLoading || !currentStock.code}
          >
            {aiResearchLoading ? copy.loading : copy.askChartAi}
          </button>
          {aiResearchResponse ? (
            <div className="aiResearchAnswer">
              <strong>{copy.aiResearchTitle}</strong>
              <pre>{aiResearchResponse.answer}</pre>
              <div className="assistantMeta limitations">
                <strong>{copy.limitations}</strong>
                <ul>
                  {asArray(aiResearchResponse.limitations).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
          <div className="stockLinks">
            {buildNaverLinks(currentStock.code, summary.effectiveDate).map((link) => (
              <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
