package com.krbrief.summaries;

import com.krbrief.marketdata.DailyMarketBrief;
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

  public Optional<DailySummary> latest() {
    return repo.findTopByOrderByDateDesc();
  }

  public SummaryStatsDto stats() {
    Optional<DailySummary> latest = repo.findTopByOrderByDateDesc();
    return new SummaryStatsDto(
        repo.count(),
        latest.map(DailySummary::getDate).orElse(null),
        latest.map(DailySummary::getUpdatedAt).orElse(null));
  }

  @Transactional
  public DailySummary generate(LocalDate date) {
    DailySummary s = repo.findById(date).orElseGet(() -> new DailySummary(date));

    DailyMarketBrief brief =
        marketData
            .getDailyBrief(date)
            .orElseGet(
                () ->
                    new DailyMarketBrief(
                        "TOP_GAINER_" + date,
                        "TOP_LOSER_" + date,
                        "MOST_MENTIONED_" + date,
                        "KOSPI_PICK_" + date,
                        "KOSDAQ_PICK_" + date,
                        "fallback",
                        "marketdata unavailable"));

    // If provider returns '-' (best-effort), fall back to deterministic placeholders.
    String topGainer =
        brief.topGainer() == null || brief.topGainer().isBlank() || "-".equals(brief.topGainer())
            ? "TOP_GAINER_" + date
            : brief.topGainer();
    String topLoser =
        brief.topLoser() == null || brief.topLoser().isBlank() || "-".equals(brief.topLoser())
            ? "TOP_LOSER_" + date
            : brief.topLoser();

    s.setTopGainer(topGainer);
    s.setTopLoser(topLoser);
    s.setMostMentioned(
        brief.mostMentioned() == null || brief.mostMentioned().isBlank()
            ? "MOST_MENTIONED_" + date
            : brief.mostMentioned());
    s.setKospiPick(
        brief.kospiPick() == null || brief.kospiPick().isBlank() ? "KOSPI_PICK_" + date : brief.kospiPick());
    s.setKosdaqPick(
        brief.kosdaqPick() == null || brief.kosdaqPick().isBlank()
            ? "KOSDAQ_PICK_" + date
            : brief.kosdaqPick());

    s.setRawNotes(
        "Source: "
            + brief.source()
            + "\n"
            + (brief.notes() == null ? "" : brief.notes() + "\n"));

    return repo.save(s);
  }

  public LocalDate todaySeoul() {
    return LocalDate.now(ZoneId.of("Asia/Seoul"));
  }
}
