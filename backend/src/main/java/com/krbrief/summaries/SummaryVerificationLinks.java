package com.krbrief.summaries;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

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

  public static SummaryVerificationLinks from(
      LocalDate date,
      String primaryKrxArtifact,
      String topGainer,
      String topLoser,
      String mostMentioned,
      String kospiPick,
      String kosdaqPick,
      String rawNotes) {
    String dateText = date == null ? "" : date.toString();

    String topGainerCode = codeFromNotes(rawNotes, "topGainer");
    String topLoserCode = codeFromNotes(rawNotes, "topLoser");
    String mostMentionedCode = codeFromNotes(rawNotes, "mostMentioned");
    String kospiPickCode = codeFromNotes(rawNotes, "kospiPick");
    String kosdaqPickCode = codeFromNotes(rawNotes, "kosdaqPick");

    String topGainerDirect = naverItemDayLink(topGainerCode);
    String topLoserDirect = naverItemDayLink(topLoserCode);
    String mostMentionedDirect = naverItemDayLink(mostMentionedCode);
    String kospiPickDirect = naverItemDayLink(kospiPickCode);
    String kosdaqPickDirect = naverItemDayLink(kosdaqPickCode);

    return new SummaryVerificationLinks(
        dateText,
        nullToEmpty(primaryKrxArtifact),
        "Primary=KRX verification artifact (date-locked)",
        "Secondary=Naver stock day page by ticker code (no search links)",
        "https://data.krx.co.kr/",
        "https://data.krx.co.kr/contents/MDC/MAIN/main/index.cmd",
        "https://github.com/sharebook-kr/pykrx",
        "",
        "",
        "",
        "",
        "",
        topGainerDirect,
        topLoserDirect,
        mostMentionedDirect,
        kospiPickDirect,
        kosdaqPickDirect,
        officialComputableItem(
            topGainer,
            primaryAnchor(primaryKrxArtifact, "topGainer"),
            appendTickerNote(
                "KRX date-locked artifact is primary evidence.",
                topGainerCode,
                topGainerDirect)),
        officialComputableItem(
            topLoser,
            primaryAnchor(primaryKrxArtifact, "topLoser"),
            appendTickerNote(
                "KRX date-locked artifact is primary evidence.",
                topLoserCode,
                topLoserDirect)),
        derivedRuleItem(
            mostMentioned,
            secondaryOrPrimary(mostMentionedDirect, primaryAnchor(primaryKrxArtifact, "mostMentioned")),
            appendTickerNote(
                "Derived rule(v1); not an official exchange metric.",
                mostMentionedCode,
                mostMentionedDirect)),
        derivedRuleItem(
            kospiPick,
            secondaryOrPrimary(kospiPickDirect, primaryAnchor(primaryKrxArtifact, "kospiPick")),
            appendTickerNote(
                "Derived rule(v1); heuristic pick.",
                kospiPickCode,
                kospiPickDirect)),
        derivedRuleItem(
            kosdaqPick,
            secondaryOrPrimary(kosdaqPickDirect, primaryAnchor(primaryKrxArtifact, "kosdaqPick")),
            appendTickerNote(
                "Derived rule(v1); heuristic pick.",
                kosdaqPickCode,
                kosdaqPickDirect)),
        "Primary verification is date-locked KRX artifact. Secondary links are direct Naver stock pages by ticker code (when code is available); no Naver search links are used.");
  }

  private static String primaryAnchor(String primaryKrxArtifact, String field) {
    if (primaryKrxArtifact == null || primaryKrxArtifact.isBlank()) return "";
    return primaryKrxArtifact + "#" + field;
  }

  private static String secondaryOrPrimary(String secondary, String primary) {
    if (secondary != null && !secondary.isBlank()) return secondary;
    return primary == null ? "" : primary;
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

  private static String naverItemDayLink(String tickerCode) {
    if (tickerCode == null || tickerCode.isBlank() || "-".equals(tickerCode)) {
      return "";
    }
    return "https://finance.naver.com/item/sise_day.naver?code="
        + URLEncoder.encode(tickerCode, StandardCharsets.UTF_8);
  }

  private static String codeFromNotes(String rawNotes, String key) {
    if (rawNotes == null || rawNotes.isBlank()) return "";
    int codesIdx = rawNotes.indexOf("codes:");
    if (codesIdx < 0) return "";
    String codesPart = rawNotes.substring(codesIdx);

    String marker = key + "=";
    int idx = codesPart.indexOf(marker);
    if (idx < 0) return "";

    int start = idx + marker.length();
    int end = codesPart.indexOf(',', start);
    int nl = codesPart.indexOf('\n', start);
    int cr = codesPart.indexOf('\r', start);
    if (end < 0 || (nl >= 0 && nl < end)) end = nl;
    if (end < 0 || (cr >= 0 && cr < end)) end = cr;
    if (end < 0) end = codesPart.length();

    String value = codesPart.substring(start, end).trim();
    if ("-".equals(value)) return "";
    return value;
  }

  private static String appendTickerNote(String base, String code, String directUrl) {
    if (code == null || code.isBlank() || directUrl == null || directUrl.isBlank()) {
      return base + " Ticker code unavailable for direct Naver stock link.";
    }
    return base + " Ticker code=" + code + ".";
  }
}
