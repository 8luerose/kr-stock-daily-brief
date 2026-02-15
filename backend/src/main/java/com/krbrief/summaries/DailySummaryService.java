package com.krbrief.summaries;

import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class DailySummaryService {
  private final DailySummaryRepository repo;

  public DailySummaryService(DailySummaryRepository repo) {
    this.repo = repo;
  }

  public List<DailySummary> list(LocalDate from, LocalDate to) {
    return repo.findAllByDateBetweenOrderByDateAsc(from, to);
  }

  public Optional<DailySummary> get(LocalDate date) {
    return repo.findById(date);
  }

  @Transactional
  public DailySummary generate(LocalDate date) {
    // Deterministic placeholder generation. TODO: replace with real scraping + summarization.
    DailySummary s = repo.findById(date).orElseGet(() -> new DailySummary(date));
    s.setTopGainer("TOP_GAINER_" + date);
    s.setTopLoser("TOP_LOSER_" + date);
    s.setMostMentioned("MOST_MENTIONED_" + date);
    s.setKospiPick("KOSPI_PICK_" + date);
    s.setKosdaqPick("KOSDAQ_PICK_" + date);
    s.setRawNotes(
        "Placeholder notes for "
            + date
            + ".\n"
            + "TODO: implement real data fetch (gainers/losers/mentions) + brief generation.");
    return repo.save(s);
  }

  public LocalDate todaySeoul() {
    return LocalDate.now(ZoneId.of("Asia/Seoul"));
  }
}
