package com.krbrief.marketdata;

import java.time.LocalDate;
import java.util.Optional;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "marketdata.provider", havingValue = "placeholder", matchIfMissing = true)
public class PlaceholderMarketDataClient implements MarketDataClient {
  @Override
  public Optional<DailyLeaders> getDailyLeaders(LocalDate date) {
    return Optional.of(
        new DailyLeaders(
            "TOP_GAINER_" + date,
            "TOP_LOSER_" + date,
            "placeholder",
            "TODO: implement real data fetch (gainers/losers)"
        )
    );
  }
}
