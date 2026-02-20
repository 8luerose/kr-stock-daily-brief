package com.krbrief.summaries;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record SummaryDto(
    LocalDate date,
    Boolean marketClosed,
    String marketClosedReason,
    java.util.List<String> marketClosedEvidenceLinks,
    String topGainer,
    String topLoser,
    String rawTopGainer,
    String rawTopLoser,
    String filteredTopGainer,
    String filteredTopLoser,
    String rankingWarning,
    List<AnomalyDto> anomalies,
    String mostMentioned,
    String kospiPick,
    String kosdaqPick,
    String rawNotes,
    Instant createdAt,
    Instant updatedAt,
    Instant archivedAt,
    SummaryVerificationLinks verification,
    LeaderExplanations leaderExplanations,
    String content,
    Instant generatedAt) {
  public static SummaryDto from(DailySummary s) {
    String rawNotes = s.getRawNotes();
    boolean isMarketClosed = rawNotes != null && rawNotes.contains("Source: market_closed");
    String marketClosedReason = null;
    java.util.List<String> marketClosedEvidenceLinks = java.util.List.of();
    if (isMarketClosed && rawNotes != null) {
      int idx = rawNotes.indexOf("휴장일:");
      if (idx >= 0) {
        int end = rawNotes.indexOf('\n', idx);
        marketClosedReason = end < 0 ? rawNotes.substring(idx) : rawNotes.substring(idx, end);
      }

      int linkIdx = rawNotes.indexOf("휴장 근거:");
      if (linkIdx >= 0) {
        int end = rawNotes.indexOf('\n', linkIdx);
        String line = end < 0 ? rawNotes.substring(linkIdx) : rawNotes.substring(linkIdx, end);
        // e.g. "휴장 근거: url1 | url2"
        int colon = line.indexOf(':');
        if (colon >= 0 && colon + 1 < line.length()) {
          String rest = line.substring(colon + 1).trim();
          if (!rest.isBlank()) {
            String[] parts = rest.split("\\s*\\|\\s*");
            java.util.List<String> links = new java.util.ArrayList<>();
            for (String p : parts) {
              String u = p.trim();
              if (!u.isBlank()) {
                links.add(u);
              }
            }
            marketClosedEvidenceLinks = links;
          }
        }
      }
    }

    SummaryVerificationLinks verification =
        SummaryVerificationLinks.from(
            s.getDate(),
            s.getDate() == null ? "" : "/api/summaries/" + s.getDate() + "/verification/krx",
            s.getTopGainer(),
            s.getTopLoser(),
            s.getMostMentioned(),
            s.getKospiPick(),
            s.getKosdaqPick(),
            rawNotes);
    List<AnomalyDto> anomalies = SummaryAnomalyCodec.decode(s.getAnomaliesText());

    return new SummaryDto(
        s.getDate(),
        isMarketClosed,
        marketClosedReason,
        marketClosedEvidenceLinks,
        s.getTopGainer(),
        s.getTopLoser(),
        s.getTopGainer(),
        s.getTopLoser(),
        firstNonBlank(s.getFilteredTopGainer(), s.getTopGainer()),
        firstNonBlank(s.getFilteredTopLoser(), s.getTopLoser()),
        s.getRankingWarning(),
        anomalies,
        s.getMostMentioned(),
        s.getKospiPick(),
        s.getKosdaqPick(),
        rawNotes,
        s.getCreatedAt(),
        s.getUpdatedAt(),
        s.getArchivedAt(),
        verification,
        SummaryLeaderExplanations.build(
            s.getDate(), s.getTopGainer(), s.getTopLoser(), anomalies, rawNotes, verification),
        s.renderContent(),
        s.getUpdatedAt());
  }

  private static String firstNonBlank(String primary, String fallback) {
    if (primary != null && !primary.isBlank()) {
      return primary;
    }
    return fallback == null ? "" : fallback;
  }

  public record AnomalyDto(
      String symbol,
      String name,
      double rate,
      List<String> flags,
      String oneLineReason) {}

  public record LeaderExplanations(LeaderExplanation topGainer, LeaderExplanation topLoser) {}

  public record LeaderExplanation(String level, String summary, List<String> evidenceLinks) {}
}
