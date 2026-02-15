package com.krbrief.summaries;

import com.krbrief.marketdata.DailyLeaders;
import com.krbrief.marketdata.MarketDataClient;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class DailySummaryService {
  private final DailySummaryRepository repo;
  private final MarketDataClient marketData;

  public DailySummaryService(DailySummaryRepository repo, MarketDataClient marketData) {
    this.repo = repo;
    this.marketData = marketData;
  }

  public List<DailySummary> list(LocalDate from, LocalDate to) {
    return repo.findAllByDateBetweenOrderByDateAsc(from, to);
  }

  public Optional<DailySummary> get(LocalDate date) {
    return repo.findById(date);
  }

  @Transactional
  public DailySummary generate(LocalDate date) {
    DailySummary s = repo.findById(date).orElseGet(() -> new DailySummary(date));

    DailyLeaders leaders =
        marketData
            .getDailyLeaders(date)
            .orElseGet(
                () ->
                    new DailyLeaders(
                        "TOP_GAINER_" + date,
                        "TOP_LOSER_" + date,
                        "fallback",
                        "marketdata unavailable"));

    // If provider returns '-' (best-effort), fall back to deterministic placeholders.
    String topGainer = leaders.topGainer() == null || leaders.topGainer().isBlank() || "-".equals(leaders.topGainer())
        ? "TOP_GAINER_" + date
        : leaders.topGainer();
    String topLoser = leaders.topLoser() == null || leaders.topLoser().isBlank() || "-".equals(leaders.topLoser())
        ? "TOP_LOSER_" + date
        : leaders.topLoser();

    s.setTopGainer(topGainer);
    s.setTopLoser(topLoser);

    // TODO: implement real mention tracking + picks.
    s.setMostMentioned("MOST_MENTIONED_" + date);
    s.setKospiPick("KOSPI_PICK_" + date);
    s.setKosdaqPick("KOSDAQ_PICK_" + date);

    s.setRawNotes(
        "Source: "
            + leaders.source()
            + "\n"
            + (leaders.notes() == null ? "" : leaders.notes() + "\n")
            + "\n"
            + "TODO: implement real data fetch (mentions/picks) + brief generation.");

    return repo.save(s);
  }

  public LocalDate todaySeoul() {
    return LocalDate.now(ZoneId.of("Asia/Seoul"));
  }
}
