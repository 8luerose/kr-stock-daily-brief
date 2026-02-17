package com.krbrief.summaries;

import com.krbrief.marketdata.DailyMarketBrief;
import com.krbrief.marketdata.MarketDataClient;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class DailySummaryService {
  private static final Logger log = LoggerFactory.getLogger(DailySummaryService.class);

  private final DailySummaryRepository repo;
  private final MarketDataClient marketData;

  public DailySummaryService(DailySummaryRepository repo, MarketDataClient marketData) {
    this.repo = repo;
    this.marketData = marketData;
  }

  public List<DailySummary> list(LocalDate from, LocalDate to) {
    return repo.findAllByDateBetweenAndArchivedAtIsNullOrderByDateAsc(from, to);
  }

  public Optional<DailySummary> get(LocalDate date) {
    return repo.findByDateAndArchivedAtIsNull(date);
  }

  public Optional<DailySummary> latest() {
    return repo.findTopByArchivedAtIsNullOrderByDateDesc();
  }

  public SummaryStatsDto stats() {
    Optional<DailySummary> latest = repo.findTopByArchivedAtIsNullOrderByDateDesc();
    return new SummaryStatsDto(
        repo.countByArchivedAtIsNull(),
        latest.map(DailySummary::getDate).orElse(null),
        latest.map(DailySummary::getUpdatedAt).orElse(null));
  }

  public SummaryInsightsDto insights(LocalDate from, LocalDate to) {
    List<DailySummary> rows = repo.findAllByDateBetweenAndArchivedAtIsNullOrderByDateAsc(from, to);
    long totalDays = ChronoUnit.DAYS.between(from, to) + 1;
    long generatedDays = rows.size();
    long missingDays = Math.max(0, totalDays - generatedDays);

    Map<String, Long> mentionCounts = new HashMap<>();
    for (DailySummary row : rows) {
      String m = row.getMostMentioned();
      if (m == null || m.isBlank()) continue;
      mentionCounts.put(m, mentionCounts.getOrDefault(m, 0L) + 1);
    }

    String top = null;
    long topCount = 0L;
    for (Map.Entry<String, Long> e : mentionCounts.entrySet()) {
      if (e.getValue() > topCount) {
        top = e.getKey();
        topCount = e.getValue();
      }
    }

    return new SummaryInsightsDto(from, to, totalDays, generatedDays, missingDays, top, topCount);
  }

  @Transactional
  public DailySummary generate(LocalDate date) {
    DailySummary s = repo.findById(date).orElseGet(() -> new DailySummary(date));
    s.setArchivedAt(null);

    DailyMarketBrief brief = loadBriefWithRetry(date, 2);

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

  @Transactional
  public Optional<DailySummary> archive(LocalDate date) {
    Optional<DailySummary> found = repo.findById(date);
    if (found.isEmpty()) return Optional.empty();
    DailySummary s = found.get();
    s.setArchivedAt(java.time.Instant.now());
    return Optional.of(repo.save(s));
  }

  @Transactional
  public BackfillResponseDto backfill(LocalDate from, LocalDate to) {
    java.util.ArrayList<BackfillResultDto> results = new java.util.ArrayList<>();
    int success = 0;
    int fail = 0;

    LocalDate cur = from;
    while (!cur.isAfter(to)) {
      try {
        generate(cur);
        results.add(new BackfillResultDto(cur, "success", ""));
        success++;
      } catch (Exception e) {
        String reason = e.getClass().getSimpleName() + (e.getMessage() == null ? "" : ":" + e.getMessage());
        results.add(new BackfillResultDto(cur, "fail", reason));
        fail++;
      }
      cur = cur.plusDays(1);
    }

    int total = success + fail;
    return new BackfillResponseDto(from, to, total, success, fail, results);
  }

  private DailyMarketBrief loadBriefWithRetry(LocalDate date, int maxRetries) {
    String lastReason = "unknown";

    for (int attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        Optional<DailyMarketBrief> found = marketData.getDailyBrief(date);
        if (found.isPresent()) {
          if (attempt > 0) {
            log.info("marketdata recovered after retry: date={}, attempt={}", date, attempt);
          }
          return found.get();
        }
        lastReason = "empty_response";
      } catch (Exception e) {
        lastReason = e.getClass().getSimpleName() + ":" + (e.getMessage() == null ? "" : e.getMessage());
        log.warn("marketdata fetch failed: date={}, attempt={}, reason={}", date, attempt, lastReason);
      }
    }

    return new DailyMarketBrief(
        "TOP_GAINER_" + date,
        "TOP_LOSER_" + date,
        "MOST_MENTIONED_" + date,
        "KOSPI_PICK_" + date,
        "KOSDAQ_PICK_" + date,
        "fallback",
        "marketdata unavailable after retries; reason=" + lastReason);
  }

  public LocalDate todaySeoul() {
    return LocalDate.now(ZoneId.of("Asia/Seoul"));
  }
}
