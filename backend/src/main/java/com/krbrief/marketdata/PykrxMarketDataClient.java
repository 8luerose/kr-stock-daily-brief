package com.krbrief.marketdata;

import java.time.LocalDate;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
@ConditionalOnProperty(name = "marketdata.provider", havingValue = "pykrx")
public class PykrxMarketDataClient implements MarketDataClient {
  private final RestClient http;

  public PykrxMarketDataClient(@Value("${marketdata.baseUrl:http://marketdata:8000}") String baseUrl) {
    this.http = RestClient.builder().baseUrl(baseUrl).build();
  }

  @Override
  public Optional<DailyMarketBrief> getDailyBrief(LocalDate date) {
    try {
      PykrxLeadersResponse res =
          http
              .get()
              .uri(uriBuilder -> uriBuilder.path("/leaders").queryParam("date", date).build())
              .accept(MediaType.APPLICATION_JSON)
              .retrieve()
              .body(PykrxLeadersResponse.class);

      if (res == null) return Optional.empty();
      return Optional.of(
          new DailyMarketBrief(
              res.topGainer(),
              res.topLoser(),
              res.mostMentioned(),
              res.kospiPick(),
              res.kosdaqPick(),
              res.source(),
              res.notes()));
    } catch (Exception e) {
      return Optional.of(
          new DailyMarketBrief(
              "TOP_GAINER_" + date,
              "TOP_LOSER_" + date,
              "-",
              "-",
              "-",
              "pykrx_error",
              "Failed to fetch leaders from marketdata service: " + e.getMessage()));
    }
  }

  public record PykrxLeadersResponse(
      String date,
      String topGainer,
      String topLoser,
      String mostMentioned,
      String kospiPick,
      String kosdaqPick,
      String topGainerCode,
      String topLoserCode,
      String mostMentionedCode,
      String kospiPickCode,
      String kosdaqPickCode,
      String source,
      String notes) {}
}
