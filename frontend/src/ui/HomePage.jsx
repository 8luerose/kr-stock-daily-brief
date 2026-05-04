import React, { useMemo } from "react";
import StockPriceChart from "./StockPriceChart.jsx";

function quickExplanation(item) {
  if (item?.type === "term") return "용어 학습 · AI 질문";
  if (item?.type === "stock") return "차트 보기 · AI 설명";
  return "테마 해석 · 후보 비교";
}

function zoneCards(decisionPanel) {
  return [
    ["buy", "매수 검토", decisionPanel.buy],
    ["split", "분할매수", decisionPanel.splitBuy],
    ["watch", "관망", decisionPanel.watch],
    ["sell", "매도 검토", decisionPanel.sell],
    ["risk", "리스크 관리", decisionPanel.stop]
  ];
}

function sourceLabels(stockEvents) {
  const events = Array.isArray(stockEvents?.events) ? stockEvents.events : [];
  const labels = events
    .flatMap((event) => Array.isArray(event.evidenceSources) ? event.evidenceSources : [])
    .map((source) => source.title)
    .filter(Boolean);
  return Array.from(new Set(labels)).slice(0, 4);
}

export function HomePage({
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
  stockInterval,
  setStockInterval,
  stockChart,
  stockEvents,
  tradeZones,
  stockChartLoading,
  stockChartError,
  darkMode,
  riskMode,
  setRiskMode,
  decisionPanel,
  addCurrentStockToPortfolio,
  askChartAi,
  aiResearchLoading,
  aiResearchResponse,
  assistantQuestion,
  setAssistantQuestion,
  assistantResponse,
  assistantLoading,
  askAssistant,
  learningTerms,
  selectedTerm,
  selectTerm,
  navigatePage,
  asArray,
  formatNumber,
  formatRate,
  buildNaverLinks
}) {
  const visiblePicks = asArray(stockPicks).slice(0, 3);
  const learningPreview = useMemo(() => {
    const priority = ["등락률", "거래량", "이동평균선", "분할매수", "손절", "수급"];
    const byTerm = new Map(asArray(learningTerms).map((term) => [term.term, term]));
    return priority.map((term) => byTerm.get(term)).filter(Boolean).slice(0, 4);
  }, [asArray, learningTerms]);
  const sources = sourceLabels(stockEvents);
  const naverLinks = buildNaverLinks(currentStock?.code, summary?.effectiveDate).slice(0, 2);

  return (
    <div className="productHome">
      <section className="marketHero">
        <div className="marketHeroMain">
          <div className="eyebrow">AI chart research workspace</div>
          <h1>오늘 볼 종목을 검색하고, 차트 위에서 근거를 확인하세요.</h1>
          <p>
            한국 주식 흐름을 검색, 캔들 차트, AI 해석, 쉬운 용어 학습으로 연결합니다.
            매수·매도는 확정 지시가 아니라 조건형 검토 시나리오로만 보여줍니다.
          </p>

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
              <button
                type="button"
                onClick={() => askMarketAssistant?.(searchQuery ? `${searchQuery}을 초보자 관점으로 설명해줘` : undefined)}
                disabled={assistantLoading}
              >
                AI 질문
              </button>
            </div>

            {searchQuery.trim() ? (
              <div className="searchResults" aria-live="polite">
                {searchLoading ? <div className="searchEmpty">{copy.loading}</div> : null}
                {!searchLoading && searchResults.length === 0 ? (
                  <div className="searchEmpty">
                    <p>{copy.searchEmpty}</p>
                    <div className="searchSuggestionRow" aria-label="추천 검색어">
                      {["반도체", "거래량", "DART", ...visiblePicks.map((stock) => stock.name)].slice(0, 5).map((keyword) => (
                        <button type="button" key={keyword} onClick={() => setSearchQuery(keyword)}>
                          {keyword}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => askMarketAssistant?.(`${searchQuery.trim()}을 초보자 관점에서 설명해줘`, {
                          id: `empty-${searchQuery.trim()}`,
                          type: "search-empty",
                          title: searchQuery.trim(),
                          market: "검색",
                          summary: "검색 결과가 없어 AI가 시장, 용어, 종목 맥락으로 설명합니다.",
                          tags: [searchQuery.trim()]
                        })}
                      >
                        AI에게 질문
                      </button>
                    </div>
                  </div>
                ) : null}
                {searchResults.slice(0, 8).map((item) => (
                  <button type="button" key={item.id} onClick={() => selectSearchResult(item)}>
                    <span className="searchType">{item.market}</span>
                    <strong>{item.title} <small>{item.code}</small></strong>
                    <em>{item.rate}</em>
                    <p>{item.summary}</p>
                    <span className="searchTags">{asArray(item.tags).slice(0, 4).join(" · ")}</span>
                    <span className="searchActions">{quickExplanation(item)}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="heroMeta">
            <span>{copy.dataAsOf}: {dataAsOf}</span>
            <span>{copy.sourceConfidence}: {confidenceLabel}</span>
            <span>{copy.selectedDate}: {selected}</span>
          </div>
        </div>

        <aside className="heroAssistant" aria-label="AI 리서치 요약">
          <div className="assistantHead compact">
            <div>
              <div className="assistantTitle">{copy.aiMarketPanel}</div>
              <div className="assistantSubtitle">{headline}</div>
            </div>
            <span className="assistantDate">{dataAsOf}</span>
          </div>
          <div className="assistantSignalGrid">
            <div className="assistantSignalCard">
              <span>현재 국면</span>
              <strong>{decisionPanel.summary}</strong>
            </div>
            <div className="assistantSignalCard">
              <span>핵심 관찰</span>
              <strong>{decisionPanel.evidence.slice(0, 2).join(" · ")}</strong>
            </div>
            <div className="assistantSignalCard">
              <span>반대 신호</span>
              <strong>{decisionPanel.opposite}</strong>
            </div>
          </div>

          <div className="assistantInputRow">
            <input
              aria-label={copy.assistantQuestionLabel}
              value={assistantQuestion}
              onChange={(event) => setAssistantQuestion(event.target.value)}
              placeholder={copy.assistantInputPlaceholder}
              disabled={assistantLoading}
            />
            <button className="btn primary small" type="button" onClick={askAssistant} disabled={assistantLoading}>
              {assistantLoading ? copy.loading : copy.assistantAsk}
            </button>
          </div>

          {assistantResponse ? (
            <div className="assistantAnswer">
              <div className="assistantAnswerHead">
                <strong>{copy.assistantAnswer}</strong>
                <span>{copy.confidence}: {assistantResponse.confidence}</span>
              </div>
              {assistantResponse.structured?.conclusion ? (
                <div className="assistantStructured">
                  <div className="structuredConclusion">
                    <span>결론</span>
                    <strong>{assistantResponse.structured.conclusion}</strong>
                  </div>
                  <div className="structuredGrid">
                    <div>
                      <span>근거</span>
                      <ul>{asArray(assistantResponse.structured.evidence).slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
                    </div>
                    <div>
                      <span>리스크</span>
                      <ul>{asArray(assistantResponse.structured.risks).slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
                    </div>
                  </div>
                </div>
              ) : null}
              <pre>{assistantResponse.answer}</pre>
            </div>
          ) : null}
        </aside>
      </section>

      {!summary ? (
        <div className="empty compact">저장된 최신 브리프가 없어 기본 학습용 종목과 차트로 화면을 유지합니다. 운영 기능은 관리자 영역에 있습니다.</div>
      ) : null}

      <section id="stock-detail" className="stockResearch homeCompact">
        <div className="stockResearchHead">
          <div>
            <span className="stockGroup">{currentStock?.group || "관심 후보"}</span>
            <h2>{currentStock?.name || "대표 종목"} {currentStock?.code ? <small>{currentStock.code}</small> : null}</h2>
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

        <div className="chartWorkspace">
          <div className="chartPreview">
            <div className="chartBasis">
              {stockChart?.name || currentStock?.name} · {stockChart?.asOf || dataAsOf} · 가격/거래량/MA/OBV/RSI/MACD/AI 마커
            </div>
            {stockChartLoading ? <div className="chartNotice" role="status">{copy.chartLoading}</div> : null}
            {stockChartError ? <div className="chartNotice errorText" role="alert">{stockChartError} 기본 학습 차트를 함께 표시합니다.</div> : null}
            <StockPriceChart chart={stockChart} events={stockEvents} tradeZones={tradeZones} decisionPanel={decisionPanel} darkMode={darkMode} />
          </div>

          <aside className="stockSignalPanel">
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

            <div className="stockMetricGrid">
              <div>
                <span>등락률</span>
                <strong>{formatRate(currentStock?.rate)}</strong>
              </div>
              <div>
                <span>언급/관심</span>
                <strong>{currentStock?.count ? `${formatNumber(currentStock.count)}건` : currentStock?.group || "관심"}</strong>
              </div>
            </div>

            <div className="decisionZones">
              {zoneCards(decisionPanel).map(([type, label, text]) => (
                <div className={`zone ${type}`} key={type}>
                  <span>{label}</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>

            <div className="beginnerSignalList">
              <strong>{copy.evidenceData}</strong>
              <ul>
                {decisionPanel.evidence.slice(0, 5).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>

            {sources.length > 0 ? (
              <div className="sourcePills" aria-label="근거 출처">
                {sources.map((label) => <span key={label}>{label}</span>)}
              </div>
            ) : null}

            <div className="analysisDisclaimer">{copy.analysisDisclaimer} 신뢰도: {decisionPanel.confidence}</div>
            <div className="primaryActionRow">
              <button type="button" className="btn ghost small" onClick={addCurrentStockToPortfolio} disabled={!currentStock?.code}>
                {copy.addToPortfolio}
              </button>
              <button type="button" className="btn primary small" onClick={askChartAi} disabled={aiResearchLoading || !currentStock?.code}>
                {aiResearchLoading ? copy.loading : copy.askChartAi}
              </button>
            </div>
            {aiResearchResponse ? (
              <div className="aiResearchAnswer">
                <strong>{copy.aiResearchTitle}</strong>
                <pre>{aiResearchResponse.answer}</pre>
              </div>
            ) : null}
            {naverLinks.length > 0 ? (
              <div className="stockLinks">
                {naverLinks.map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="homeLowerGrid" aria-label="관심 후보와 학습">
        <div className="candidateSection">
          <div className="sectionHead">
            <span>오늘 관심 후보</span>
            <strong>3개만 먼저 비교</strong>
          </div>
          <div className="candidateGrid">
            {visiblePicks.map((stock) => (
              <button
                type="button"
                key={`${stock.code}-${stock.group}`}
                className={`candidateCard ${currentStock?.code === stock.code ? "active" : ""}`}
                onClick={() => selectStock(stock)}
              >
                <span>{stock.group}</span>
                <strong>{stock.name}</strong>
                <em>{stock.code} · {stock.count ? `${formatNumber(stock.count)}건` : formatRate(stock.rate)}</em>
                <p>{stock.summary || "거래량, 이벤트, 이동평균선 위치를 함께 확인할 후보입니다."}</p>
                <small>조건 확인: 지지선 · 거래량 · 반대 신호</small>
              </button>
            ))}
          </div>
        </div>

        <div className="learningDock">
          <div className="sectionHead">
            <span>모르는 용어는 바로 학습</span>
            <strong>차트 보면서 익히기</strong>
          </div>
          <div className="learningChipGrid">
            {learningPreview.map((term) => (
              <button
                type="button"
                key={term.id}
                className={selectedTerm?.id === term.id ? "active" : ""}
                onClick={() => {
                  selectTerm(term);
                  navigatePage("learning");
                }}
              >
                <strong>{term.term}</strong>
                <span>{term.coreSummary || term.plainDefinition}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
