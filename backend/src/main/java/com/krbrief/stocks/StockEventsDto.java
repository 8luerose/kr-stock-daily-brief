package com.krbrief.stocks;

import java.util.List;

public record StockEventsDto(
    String code,
    String name,
    String from,
    String to,
    List<StockEventDto> events) {
  public record StockEventDto(
      String date,
      String type,
      String severity,
      Double priceChangeRate,
      Double volumeChangeRate,
      String title,
      String explanation,
      List<String> evidenceLinks,
      List<EvidenceSourceDto> evidenceSources,
      List<CausalScoreDto> causalScores) {}

  public record EvidenceSourceDto(
      String type,
      String title,
      String url,
      String description) {}

  public record CausalScoreDto(
      String sourceType,
      String label,
      Integer score,
      String confidence,
      String basis,
      String interpretation,
      Integer signalCount,
      List<String> matchedSignals,
      List<String> causalFactors,
      String causalDirection,
      String evidenceLevel,
      String signalSummary,
      List<String> signalOrigins,
      List<String> signalUrls) {}
}
