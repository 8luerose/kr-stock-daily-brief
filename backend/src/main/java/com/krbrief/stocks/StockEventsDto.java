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
      List<String> evidenceLinks) {}
}
