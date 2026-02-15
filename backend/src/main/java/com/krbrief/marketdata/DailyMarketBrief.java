package com.krbrief.marketdata;

/** Daily market brief data used to generate a DailySummary. */
public record DailyMarketBrief(
    String topGainer,
    String topLoser,
    String mostMentioned,
    String kospiPick,
    String kosdaqPick,
    String source,
    String notes
) {}
