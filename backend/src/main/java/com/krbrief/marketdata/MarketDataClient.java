package com.krbrief.marketdata;

import java.time.LocalDate;
import java.util.Optional;

public interface MarketDataClient {
  /**
   * @return best-effort top gainer/loser symbols for the given market date.
   */
  Optional<DailyLeaders> getDailyLeaders(LocalDate date);
}
