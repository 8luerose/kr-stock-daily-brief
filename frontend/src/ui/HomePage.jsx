import React from "react";
import { MarketHero, StockResearchPanel } from "./AppSections.jsx";

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
  stockPicks,
  currentStock,
  selectStock,
  stockInterval,
  setStockInterval,
  stockChart,
  stockEvents,
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
  asArray,
  formatNumber,
  formatRate,
  buildNaverLinks
}) {
  return (
    <>
      <MarketHero
        copy={copy}
        summary={summary}
        selected={selected}
        dataAsOf={dataAsOf}
        confidenceLabel={confidenceLabel}
        headline={headline}
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

      {summary && currentStock ? (
        <StockResearchPanel
          copy={copy}
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
    </>
  );
}
