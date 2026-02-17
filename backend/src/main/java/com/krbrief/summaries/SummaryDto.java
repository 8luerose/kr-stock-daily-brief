package com.krbrief.summaries;

import java.time.Instant;
import java.time.LocalDate;

public record SummaryDto(
    LocalDate date,
    String topGainer,
    String topLoser,
    String mostMentioned,
    String kospiPick,
    String kosdaqPick,
    String rawNotes,
    Instant createdAt,
    Instant updatedAt,
    Instant archivedAt,
    SummaryVerificationLinks verification,
    // Back-compat fields for the current UI.
    String content,
    Instant generatedAt) {
  public static SummaryDto from(DailySummary s) {
    return new SummaryDto(
        s.getDate(),
        s.getTopGainer(),
        s.getTopLoser(),
        s.getMostMentioned(),
        s.getKospiPick(),
        s.getKosdaqPick(),
        s.getRawNotes(),
        s.getCreatedAt(),
        s.getUpdatedAt(),
        s.getArchivedAt(),
        SummaryVerificationLinks.from(
            s.getTopGainer(), s.getTopLoser(), s.getMostMentioned(), s.getKospiPick(), s.getKosdaqPick()),
        s.renderContent(),
        s.getUpdatedAt());
  }
}
