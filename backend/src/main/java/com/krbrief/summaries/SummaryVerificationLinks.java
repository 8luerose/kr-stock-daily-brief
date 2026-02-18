package com.krbrief.summaries;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public record SummaryVerificationLinks(
    String date,
    String primaryKrxArtifact,
    String primarySourceTier,
    String secondarySourceTier,
    String krxDataPortal,
    String krxMarketOverview,
    String pykrxRepo,
    String topGainerSearch,
    String topLoserSearch,
    String mostMentionedSearch,
    String kospiPickSearch,
    String kosdaqPickSearch,
    String topGainerDateSearch,
    String topLoserDateSearch,
    String mostMentionedDateSearch,
    String kospiPickDateSearch,
    String kosdaqPickDateSearch,
    String verificationLimitations) {

  private static final DateTimeFormatter NAVER_DATE = DateTimeFormatter.ofPattern("yyyy.MM.dd");

  public static SummaryVerificationLinks from(
      LocalDate date,
      String primaryKrxArtifact,
      String topGainer,
      String topLoser,
      String mostMentioned,
      String kospiPick,
      String kosdaqPick) {
    String dateText = date == null ? "" : date.toString();
    return new SummaryVerificationLinks(
        dateText,
        primaryKrxArtifact,
        "Primary=KRX official verification artifact",
        "Secondary=Naver date-locked links (human cross-check only)",
        "https://data.krx.co.kr/",
        "https://data.krx.co.kr/contents/MDC/MAIN/main/index.cmd",
        "https://github.com/sharebook-kr/pykrx",
        naverFinanceSearch(topGainer),
        naverFinanceSearch(topLoser),
        naverFinanceSearch(mostMentioned),
        naverFinanceSearch(kospiPick),
        naverFinanceSearch(kosdaqPick),
        naverDateNewsSearch(topGainer, date),
        naverDateNewsSearch(topLoser, date),
        naverDateNewsSearch(mostMentioned, date),
        naverDateNewsSearch(kospiPick, date),
        naverDateNewsSearch(kosdaqPick, date),
        "Primary verification uses KRX artifact endpoint. Naver date-locked links are secondary human cross-check only.");
  }

  private static String naverFinanceSearch(String keyword) {
    if (keyword == null || keyword.isBlank() || "-".equals(keyword)) {
      return "";
    }
    return "https://finance.naver.com/search/search.naver?query="
        + URLEncoder.encode(keyword, StandardCharsets.UTF_8);
  }

  private static String naverDateNewsSearch(String keyword, LocalDate date) {
    if (keyword == null || keyword.isBlank() || "-".equals(keyword) || date == null) {
      return "";
    }
    String datePart = date.format(NAVER_DATE);
    String query = keyword + " 주가";
    return "https://search.naver.com/search.naver?where=news&sm=tab_opt&sort=0&photo=0&field=0&pd=3&ds="
        + datePart
        + "&de="
        + datePart
        + "&query="
        + URLEncoder.encode(query, StandardCharsets.UTF_8);
  }
}
