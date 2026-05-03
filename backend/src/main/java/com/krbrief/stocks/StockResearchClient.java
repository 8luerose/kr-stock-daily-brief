package com.krbrief.stocks;

import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Component
public class StockResearchClient {
  private final RestClient http;

  public StockResearchClient(@Value("${marketdata.baseUrl:http://marketdata:8000}") String baseUrl) {
    this.http = RestClient.builder().baseUrl(baseUrl).build();
  }

  public StockChartDto chart(String code, String range, String interval) {
    try {
      StockChartDto res =
          http
              .get()
              .uri(
                  uriBuilder ->
                      uriBuilder
                          .path("/stocks/{code}/chart")
                          .queryParam("range", range)
                          .queryParam("interval", interval)
                          .build(code))
              .accept(MediaType.APPLICATION_JSON)
              .retrieve()
              .body(StockChartDto.class);
      if (res == null) {
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "marketdata_empty_chart_response");
      }
      return res;
    } catch (ResponseStatusException e) {
      throw e;
    } catch (RestClientException e) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "marketdata_chart_error", e);
    }
  }

  public StockEventsDto events(String code, LocalDate from, LocalDate to) {
    try {
      StockEventsDto res =
          http
              .get()
              .uri(
                  uriBuilder ->
                      uriBuilder
                          .path("/stocks/{code}/events")
                          .queryParam("from", from)
                          .queryParam("to", to)
                          .build(code))
              .accept(MediaType.APPLICATION_JSON)
              .retrieve()
              .body(StockEventsDto.class);
      if (res == null) {
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "marketdata_empty_events_response");
      }
      return res;
    } catch (ResponseStatusException e) {
      throw e;
    } catch (RestClientException e) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "marketdata_events_error", e);
    }
  }

  public StockUniverseDto universe(String query, int limit) {
    try {
      StockUniverseDto res =
          http
              .get()
              .uri(
                  uriBuilder -> {
                    var builder = uriBuilder.path("/stocks/universe").queryParam("limit", limit);
                    if (query != null && !query.isBlank()) {
                      builder.queryParam("query", query);
                    }
                    return builder.build();
                  })
              .accept(MediaType.APPLICATION_JSON)
              .retrieve()
              .body(StockUniverseDto.class);
      if (res == null) {
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "marketdata_empty_universe_response");
      }
      return res;
    } catch (ResponseStatusException e) {
      throw e;
    } catch (RestClientException e) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "marketdata_universe_error", e);
    }
  }
}
