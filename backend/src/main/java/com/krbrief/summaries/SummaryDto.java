package com.krbrief.summaries;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record SummaryDto(
    LocalDate date,
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
    // Back-compat fields for the current UI.
    String content,
    Instant generatedAt) {
  public static SummaryDto from(DailySummary s) {
    SummaryVerificationLinks verification =
        SummaryVerificationLinks.from(
            s.getDate(),
            s.getDate() == null ? "" : "/api/summaries/" + s.getDate() + "/verification/krx",
            s.getTopGainer(),
            s.getTopLoser(),
            s.getMostMentioned(),
            s.getKospiPick(),
            s.getKosdaqPick(),
            s.getRawNotes());
    List<AnomalyDto> anomalies = SummaryAnomalyCodec.decode(s.getAnomaliesText());

    return new SummaryDto(
        s.getDate(),
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
        s.getRawNotes(),
        s.getCreatedAt(),
        s.getUpdatedAt(),
        s.getArchivedAt(),
        verification,
        SummaryLeaderExplanations.build(
            s.getDate(), s.getTopGainer(), s.getTopLoser(), anomalies, s.getRawNotes(), verification),
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
