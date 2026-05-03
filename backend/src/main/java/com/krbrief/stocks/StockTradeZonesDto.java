package com.krbrief.stocks;

import java.util.List;

public record StockTradeZonesDto(
    String code,
    String name,
    String interval,
    String range,
    String basisDate,
    String riskMode,
    String confidence,
    List<TradeZoneDto> zones,
    List<String> evidence) {

  public record TradeZoneDto(
      String type,
      String label,
      Long fromPrice,
      Long toPrice,
      String condition,
      String evidence,
      String oppositeSignal,
      String confidence,
      String basisDate,
      String beginnerExplanation) {}
}
