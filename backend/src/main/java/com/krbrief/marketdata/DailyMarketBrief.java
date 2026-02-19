package com.krbrief.marketdata;

import java.util.List;

/** Daily market brief data used to generate a DailySummary. */
public record DailyMarketBrief(
    String topGainer,
    String topLoser,
    String filteredTopGainer,
    String filteredTopLoser,
    String mostMentioned,
    String kospiPick,
    String kosdaqPick,
    String source,
    String notes,
    List<AnomalyCandidate> anomalies,
    String rankingWarning) {

  public DailyMarketBrief(
      String topGainer,
      String topLoser,
      String mostMentioned,
      String kospiPick,
      String kosdaqPick,
      String source,
      String notes) {
    this(
        topGainer,
        topLoser,
        topGainer,
        topLoser,
        mostMentioned,
        kospiPick,
        kosdaqPick,
        source,
        notes,
        List.of(),
        "");
  }

  public record AnomalyCandidate(
      String symbol,
      String name,
      double rate,
      List<String> flags,
      String oneLineReason) {}
}
