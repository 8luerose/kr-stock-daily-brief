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
}
