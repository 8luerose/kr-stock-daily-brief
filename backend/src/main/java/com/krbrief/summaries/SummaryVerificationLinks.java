package com.krbrief.summaries;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public record SummaryVerificationLinks(
    String krxDataPortal,
    String pykrxRepo,
    String topGainerSearch,
    String topLoserSearch,
    String mostMentionedSearch,
    String kospiPickSearch,
    String kosdaqPickSearch) {

  public static SummaryVerificationLinks from(
      String topGainer, String topLoser, String mostMentioned, String kospiPick, String kosdaqPick) {
    return new SummaryVerificationLinks(
        "https://data.krx.co.kr/",
        "https://github.com/sharebook-kr/pykrx",
        naverFinanceSearch(topGainer),
        naverFinanceSearch(topLoser),
        naverFinanceSearch(mostMentioned),
        naverFinanceSearch(kospiPick),
        naverFinanceSearch(kosdaqPick));
  }

  private static String naverFinanceSearch(String keyword) {
    if (keyword == null || keyword.isBlank() || "-".equals(keyword)) {
      return "";
    }
    return "https://finance.naver.com/search/search.naver?query="
        + URLEncoder.encode(keyword, StandardCharsets.UTF_8);
  }
}
