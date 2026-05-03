package com.krbrief.search;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.krbrief.learning.LearningTermCatalog;
import com.krbrief.summaries.DailySummary;
import com.krbrief.summaries.DailySummaryService;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class SearchServiceTest {

  @Test
  void search_returnsThemeAndLearningResults() {
    SearchService service = new SearchService(mock(DailySummaryService.class), new LearningTermCatalog());

    var themeResults = service.search("반도체", 10);
    var termResults = service.search("PER", 10);

    assertTrue(themeResults.stream().anyMatch(item -> item.type().equals("theme") && item.title().equals("반도체")));
    assertTrue(termResults.stream().anyMatch(item -> item.type().equals("term") && item.termId().equals("per")));
  }

  @Test
  void search_includesLatestSummaryStocks() {
    DailySummary latest = new DailySummary(LocalDate.of(2026, 5, 3));
    latest.setTopGainersJson("[{\"code\":\"005930\",\"name\":\"삼성전자\",\"rate\":3.2}]");
    DailySummaryService summaries = mock(DailySummaryService.class);
    when(summaries.latest()).thenReturn(Optional.of(latest));

    SearchService service = new SearchService(summaries, new LearningTermCatalog());

    var results = service.search("삼성전자", 10);

    assertFalse(results.isEmpty());
    assertTrue(results.stream().anyMatch(item -> item.type().equals("stock") && item.stockCode().equals("005930")));
  }

  @Test
  void search_includesRepresentativeStocksWithoutLatestSummary() {
    DailySummaryService summaries = mock(DailySummaryService.class);
    when(summaries.latest()).thenReturn(Optional.empty());
    SearchService service = new SearchService(summaries, new LearningTermCatalog());

    var byName = service.search("삼성전자", 10);
    var byCode = service.search("005930", 10);

    assertTrue(byName.stream().anyMatch(item -> item.type().equals("stock") && item.stockCode().equals("005930")));
    assertTrue(byCode.stream().anyMatch(item -> item.type().equals("stock") && item.title().equals("삼성전자")));
  }

  @Test
  void search_includesThemeRelatedRepresentativeStocks() {
    DailySummaryService summaries = mock(DailySummaryService.class);
    when(summaries.latest()).thenReturn(Optional.empty());
    SearchService service = new SearchService(summaries, new LearningTermCatalog());

    var results = service.search("반도체", 10);

    assertTrue(results.stream().anyMatch(item -> item.type().equals("theme") && item.title().equals("반도체")));
    assertTrue(results.stream().anyMatch(item -> item.type().equals("stock") && item.stockCode().equals("005930")));
    assertTrue(results.stream().anyMatch(item -> item.type().equals("stock") && item.stockCode().equals("000660")));
  }

  @Test
  void search_coversRepresentativeIndustryThemeAndCompanyQueries() {
    DailySummaryService summaries = mock(DailySummaryService.class);
    when(summaries.latest()).thenReturn(Optional.empty());
    SearchService service = new SearchService(summaries, new LearningTermCatalog());

    assertTrue(service.search("SK하이닉스", 10).stream()
        .anyMatch(item -> item.type().equals("stock") && item.stockCode().equals("000660")));
    assertTrue(service.search("현대차", 10).stream()
        .anyMatch(item -> item.type().equals("stock") && item.stockCode().equals("005380")));
    assertTrue(service.search("NAVER", 10).stream()
        .anyMatch(item -> item.type().equals("stock") && item.stockCode().equals("035420")));
    assertTrue(service.search("네이버", 10).stream()
        .anyMatch(item -> item.type().equals("stock") && item.stockCode().equals("035420")));
    assertTrue(service.search("카카오", 10).stream()
        .anyMatch(item -> item.type().equals("stock") && item.stockCode().equals("035720")));
    assertTrue(service.search("2차전지", 10).stream()
        .anyMatch(item -> item.type().equals("theme") && item.title().equals("2차전지")));
    assertTrue(service.search("금융", 10).stream()
        .anyMatch(item -> item.type().equals("industry") && item.title().equals("증권/금융")));
    assertTrue(service.search("바이오", 10).stream()
        .anyMatch(item -> item.type().equals("theme") && item.title().equals("바이오")));
    assertTrue(service.search("조선", 10).stream()
        .anyMatch(item -> item.type().equals("theme") && item.title().equals("조선")));
    assertTrue(service.search("거래량", 10).stream()
        .anyMatch(item -> item.type().equals("term") && item.termId().equals("volume")));
    assertTrue(service.search("PER", 10).stream()
        .anyMatch(item -> item.type().equals("term") && item.termId().equals("per")));
    assertTrue(service.search("DART", 10).stream()
        .anyMatch(item -> item.type().equals("term") && item.termId().equals("dart")));
  }
}
