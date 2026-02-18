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
    SummaryVerificationItem topGainerItem,
    SummaryVerificationItem topLoserItem,
    SummaryVerificationItem mostMentionedItem,
    SummaryVerificationItem kospiPickItem,
    SummaryVerificationItem kosdaqPickItem,
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
    String topGainerDateLink = naverDateNewsSearch(topGainer, date);
    String topLoserDateLink = naverDateNewsSearch(topLoser, date);
    String mostMentionedDateLink = naverDateNewsSearch(mostMentioned, date);
    String kospiPickDateLink = naverDateNewsSearch(kospiPick, date);
    String kosdaqPickDateLink = naverDateNewsSearch(kosdaqPick, date);
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
        topGainerDateLink,
        topLoserDateLink,
        mostMentionedDateLink,
        kospiPickDateLink,
        kosdaqPickDateLink,
        officialComputableItem(
            topGainer,
            topGainerDateLink,
            "KRX raw top gainer can be recomputed by sorting daily returns via pykrx. No stable public KRX deep-link exists per stock/date, so this uses a date-locked external cross-check link."),
        officialComputableItem(
            topLoser,
            topLoserDateLink,
            "KRX raw top loser can be recomputed by sorting daily returns via pykrx. No stable public KRX deep-link exists per stock/date, so this uses a date-locked external cross-check link."),
        derivedRuleItem(
            mostMentioned,
            mostMentionedDateLink,
            "Derived rule(v1): approximate by highest volume candidate from ranking pages. Not an official most-mentioned metric and cannot be exactly reconstructed from KRX alone."),
        derivedRuleItem(
            kospiPick,
            kospiPickDateLink,
            "Derived rule(v1): pick highest-volume KOSPI riser from crawled lists. Heuristic result; source list/parser changes can alter output."),
        derivedRuleItem(
            kosdaqPick,
            kosdaqPickDateLink,
            "Derived rule(v1): pick highest-volume KOSDAQ riser from crawled lists. Heuristic result; source list/parser changes can alter output."),
        "Primary verification uses KRX artifact endpoint. Naver date-locked links are secondary human cross-check only.");
  }

  private static SummaryVerificationItem officialComputableItem(String value, String directUrl, String note) {
    return new SummaryVerificationItem(
        cleanValue(value),
        "official_computable",
        "pykrx(KRX-based)",
        nullToEmpty(directUrl),
        note);
  }

  private static SummaryVerificationItem derivedRuleItem(String value, String directUrl, String note) {
    return new SummaryVerificationItem(
        cleanValue(value),
        "derived_rule",
        "naver_rule_v1",
        nullToEmpty(directUrl),
        note);
  }

  private static String cleanValue(String value) {
    if (value == null || value.isBlank()) {
      return "-";
    }
    return value;
  }

  private static String nullToEmpty(String value) {
    return value == null ? "" : value;
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
