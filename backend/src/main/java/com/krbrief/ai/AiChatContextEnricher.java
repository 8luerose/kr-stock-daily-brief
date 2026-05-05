package com.krbrief.ai;

import com.krbrief.learning.LearningTermCatalog;
import com.krbrief.search.SearchResultDto;
import com.krbrief.search.SearchService;
import com.krbrief.stocks.StockChartDto;
import com.krbrief.stocks.StockEventsDto;
import com.krbrief.stocks.StockResearchClient;
import com.krbrief.stocks.StockTradeZoneService;
import com.krbrief.stocks.StockTradeZonesDto;
import com.krbrief.summaries.DailySummaryService;
import com.krbrief.summaries.SummaryDto;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class AiChatContextEnricher {
  private static final ZoneId KST = ZoneId.of("Asia/Seoul");
  private static final List<String> KEYWORDS =
      List.of(
          "반도체",
          "삼성전자",
          "SK하이닉스",
          "2차전지",
          "바이오",
          "금융",
          "거래량",
          "거래대금",
          "PER",
          "PBR",
          "ROE",
          "DART",
          "공시",
          "KOSPI",
          "KOSDAQ",
          "일봉",
          "주봉",
          "월봉",
          "손절",
          "분할매수",
          "거래정지");

  private final SearchService searchService;
  private final DailySummaryService dailySummaryService;
  private final StockResearchClient stockResearchClient;
  private final StockTradeZoneService stockTradeZoneService;
  private final LearningTermCatalog learningTermCatalog;

  public AiChatContextEnricher(
      SearchService searchService,
      DailySummaryService dailySummaryService,
      StockResearchClient stockResearchClient,
      StockTradeZoneService stockTradeZoneService,
      LearningTermCatalog learningTermCatalog) {
    this.searchService = searchService;
    this.dailySummaryService = dailySummaryService;
    this.stockResearchClient = stockResearchClient;
    this.stockTradeZoneService = stockTradeZoneService;
    this.learningTermCatalog = learningTermCatalog;
  }

  public Map<String, Object> enrich(Map<String, Object> request) {
    LinkedHashMap<String, Object> enriched = new LinkedHashMap<>(request == null ? Map.of() : request);
    LinkedHashMap<String, Object> context = mutableMap(enriched.get("context"));
    String question = text(enriched.get("question"));
    String query =
        firstNonBlank(
            text(context.get("query")),
            text(context.get("ticker")),
            text(context.get("code")),
            text(enriched.get("topicTitle")),
            text(enriched.get("stockName")),
            detectKeyword(question));

    List<SearchResultDto> searchResults = List.of();
    if (!query.isBlank() && !context.containsKey("searchResult") && !context.containsKey("searchResults")) {
      searchResults = searchService.search(query, 6);
      if (!searchResults.isEmpty()) {
        context.put("query", query);
        context.put("searchResult", toMap(searchResults.get(0)));
        context.put("searchResults", searchResults.stream().map(this::toMap).toList());
      }
    }

    if (!context.containsKey("summary")) {
      dailySummaryService.latest().map(SummaryDto::from).ifPresent(summary -> context.put("summary", summaryMap(summary)));
    }
    if (!context.containsKey("terms") && !enriched.containsKey("terms")) {
      context.put("terms", learningTermCatalog.match(question, text(context.get("termId"))));
    }

    String stockCode =
        firstNonBlank(
            text(context.get("stockCode")),
            text(context.get("code")),
            text(enriched.get("stockCode")),
            firstStockCode(searchResults));
    if (!stockCode.isBlank()) {
      context.putIfAbsent("stockCode", stockCode);
      enrichStockContext(context, stockCode);
    }

    context.putIfAbsent("retrievalPolicy", "backend_auto_enriched_search_summary_chart_events");
    enriched.put("context", context);
    exposeTopLevel(enriched, context, "searchResult");
    exposeTopLevel(enriched, context, "summary");
    exposeTopLevel(enriched, context, "stockCode");
    exposeTopLevel(enriched, context, "stockName");
    exposeTopLevel(enriched, context, "chart");
    exposeTopLevel(enriched, context, "events");
    exposeTopLevel(enriched, context, "tradeZones");
    exposeTopLevel(enriched, context, "indicatorSnapshot");
    exposeTopLevel(enriched, context, "currentDecisionSummary");
    exposeTopLevel(enriched, context, "terms");
    return enriched;
  }

  private void exposeTopLevel(LinkedHashMap<String, Object> enriched, Map<String, Object> context, String key) {
    if (!enriched.containsKey(key) && context.containsKey(key)) {
      enriched.put(key, context.get(key));
    }
  }

  private void enrichStockContext(LinkedHashMap<String, Object> context, String stockCode) {
    try {
      StockChartDto chart = null;
      if (!context.containsKey("chart") || !context.containsKey("stockName")) {
        chart = stockResearchClient.chart(stockCode, "6M", "daily");
        List<StockChartDto.StockOhlcvDto> rows = chart.data() == null ? List.of() : chart.data();
        StockChartDto.StockOhlcvDto latest = rows.isEmpty() ? null : rows.get(rows.size() - 1);
        LinkedHashMap<String, Object> chartMap = new LinkedHashMap<>();
        chartMap.put("code", chart.code());
        chartMap.put("name", chart.name());
        chartMap.put("interval", chart.interval());
        chartMap.put("range", chart.range());
        chartMap.put("asOf", chart.asOf());
        if (latest != null) {
          LinkedHashMap<String, Object> latestMap = new LinkedHashMap<>();
          latestMap.put("date", latest.date());
          latestMap.put("close", latest.close());
          latestMap.put("volume", latest.volume());
          chartMap.put("latest", latestMap);
        }
        context.putIfAbsent("chart", chartMap);
        context.putIfAbsent("stockName", chart.name());
      }

      if (!context.containsKey("tradeZones")
          || !context.containsKey("indicatorSnapshot")
          || !context.containsKey("currentDecisionSummary")) {
        if (chart == null) {
          chart = stockResearchClient.chart(stockCode, "6M", "daily");
        }
        StockTradeZonesDto tradeZones = stockTradeZoneService.tradeZonesFromChart(chart, "6M", "daily", "neutral");
        context.putIfAbsent("tradeZones", tradeZoneMap(tradeZones));
        context.putIfAbsent("indicatorSnapshot", tradeZones.indicatorSnapshot());
        context.putIfAbsent("currentDecisionSummary", tradeZones.currentDecisionSummary());
      }

      if (!context.containsKey("events")) {
        LocalDate to = LocalDate.now(KST);
        LocalDate from = to.minusDays(120);
        StockEventsDto events = stockResearchClient.events(stockCode, from, to).withDerivedNarratives();
        context.putIfAbsent("events", (events.events() == null ? List.<StockEventsDto.StockEventDto>of() : events.events()).stream()
            .limit(5)
            .map(event -> {
              LinkedHashMap<String, Object> out = new LinkedHashMap<>();
              out.put("date", event.date());
              out.put("type", event.type());
              out.put("severity", event.severity());
              out.put("title", event.title());
              out.put("explanation", event.explanation());
              out.put("priceChangeRate", event.priceChangeRate());
              out.put("volumeChangeRate", event.volumeChangeRate());
              out.put("sentimentForPrice", event.sentimentForPrice());
              out.put("positiveReasons", event.positiveReasons());
              out.put("negativeReasons", event.negativeReasons());
              out.put("neutralReasons", event.neutralReasons());
              out.put("whyItMatters", event.whyItMatters());
              out.put("oppositeInterpretation", event.oppositeInterpretation());
              out.put("oppositeSignals", event.oppositeSignals());
              out.put("evidenceLevel", event.evidenceLevel());
              out.put("sourceLimitations", event.sourceLimitations());
              out.put("whyItMoved", event.whyItMoved());
              out.put("verificationChecklist", event.verificationChecklist());
              out.put("evidenceSources", event.evidenceSources());
              out.put("causalScores", event.causalScores());
              return out;
            })
            .toList());
      }
    } catch (RuntimeException e) {
      context.putIfAbsent("stockContextWarning", "stock_context_unavailable");
    }
  }

  private LinkedHashMap<String, Object> tradeZoneMap(StockTradeZonesDto tradeZones) {
    LinkedHashMap<String, Object> out = new LinkedHashMap<>();
    out.put("code", tradeZones.code());
    out.put("name", tradeZones.name());
    out.put("basisDate", tradeZones.basisDate());
    out.put("riskMode", tradeZones.riskMode());
    out.put("confidence", tradeZones.confidence());
    out.put("indicatorSnapshot", tradeZones.indicatorSnapshot());
    out.put("currentDecisionSummary", tradeZones.currentDecisionSummary());
    out.put("evidence", tradeZones.evidence());
    out.put("zones", tradeZones.zones());
    return out;
  }

  private LinkedHashMap<String, Object> summaryMap(SummaryDto summary) {
    LinkedHashMap<String, Object> out = new LinkedHashMap<>();
    out.put("date", summary.date());
    out.put("topGainer", summary.topGainer());
    out.put("topLoser", summary.topLoser());
    out.put("mostMentioned", summary.mostMentioned());
    out.put("effectiveDate", summary.effectiveDate());
    return out;
  }

  private LinkedHashMap<String, Object> toMap(SearchResultDto item) {
    LinkedHashMap<String, Object> out = new LinkedHashMap<>();
    out.put("id", item.id());
    out.put("type", item.type());
    out.put("title", item.title());
    out.put("code", item.code());
    out.put("market", item.market());
    out.put("rate", item.rate());
    out.put("tags", item.tags());
    out.put("summary", item.summary());
    out.put("source", item.source());
    out.put("stockCode", item.stockCode());
    out.put("stockName", item.stockName());
    out.put("termId", item.termId());
    return out;
  }

  @SuppressWarnings("unchecked")
  private LinkedHashMap<String, Object> mutableMap(Object value) {
    if (value instanceof Map<?, ?> map) {
      LinkedHashMap<String, Object> out = new LinkedHashMap<>();
      map.forEach((k, v) -> out.put(String.valueOf(k), v));
      return out;
    }
    return new LinkedHashMap<>();
  }

  private String firstStockCode(List<SearchResultDto> results) {
    return results.stream()
        .filter(item -> "stock".equals(item.type()))
        .map(SearchResultDto::stockCode)
        .filter(value -> value != null && !value.isBlank())
        .findFirst()
        .orElse("");
  }

  private String detectKeyword(String question) {
    String q = question == null ? "" : question;
    return KEYWORDS.stream().filter(q::contains).findFirst().orElse("");
  }

  private String firstNonBlank(String... values) {
    for (String value : values) {
      if (value != null && !value.isBlank()) return value.trim();
    }
    return "";
  }

  private String text(Object value) {
    return value == null ? "" : String.valueOf(value).trim();
  }
}
