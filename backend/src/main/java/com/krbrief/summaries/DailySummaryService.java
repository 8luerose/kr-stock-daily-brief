package com.krbrief.summaries;

import com.krbrief.marketdata.DailyMarketBrief;
import com.krbrief.marketdata.MarketDataClient;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class DailySummaryService {
  private static final Logger log = LoggerFactory.getLogger(DailySummaryService.class);

  private final DailySummaryRepository repo;
  private final MarketDataClient marketData;
  private final RestClient pykrxHttp;
  private final String provider;

  public DailySummaryService(
      DailySummaryRepository repo,
      MarketDataClient marketData,
      @Value("${marketdata.baseUrl:http://marketdata:8000}") String marketDataBaseUrl,
      @Value("${marketdata.provider:placeholder}") String provider) {
    this.repo = repo;
    this.marketData = marketData;
    this.pykrxHttp = RestClient.builder().baseUrl(marketDataBaseUrl).build();
    this.provider = provider;
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

  public Optional<KrxVerificationArtifactDto> krxVerificationArtifact(LocalDate date) {
    Optional<DailySummary> found = repo.findByDateAndArchivedAtIsNull(date);
    if (found.isEmpty()) {
      return Optional.empty();
    }

    DailySummary row = found.get();
    Optional<DailyMarketBrief> reference = loadPykrxLeaders(date);
    String status = "unverified";
    String reason = "krx_reference_unavailable: failed to fetch pykrx leaders for " + date;
    String refTopGainer = "";
    String refTopLoser = "";

    if (reference.isPresent()) {
      DailyMarketBrief ref = reference.get();
      refTopGainer = nullToEmpty(ref.topGainer());
      refTopLoser = nullToEmpty(ref.topLoser());
      boolean gainerMatched = same(row.getTopGainer(), ref.topGainer());
      boolean loserMatched = same(row.getTopLoser(), ref.topLoser());
      status = gainerMatched && loserMatched ? "verified" : "unverified";
      reason =
          status.equals("verified")
              ? ""
              : "mismatch: topGainer or topLoser differs from KRX reference";
    }

    return Optional.of(
        new KrxVerificationArtifactDto(
            date,
            java.time.Instant.now(),
            status,
            reason,
            new KrxVerificationArtifactDto.SourceIdentity(
                "KRX 전종목 등락률",
                "MDCSTAT01501",
                "https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020101"),
            new KrxVerificationArtifactDto.ComputationBasis(
                "등락률(%)",
                "topGainer = max(등락률)",
                "topLoser = min(등락률)",
                "KRX 등락률 데이터셋 기준. 참조값은 pykrx leaders 브리지를 통해 수집됨."),
            List.of(
                new KrxVerificationArtifactDto.VerificationEvidenceRecord(
                    "topGainer",
                    nullToEmpty(row.getTopGainer()),
                    refTopGainer,
                    !refTopGainer.isBlank() && same(row.getTopGainer(), refTopGainer)),
                new KrxVerificationArtifactDto.VerificationEvidenceRecord(
                    "topLoser",
                    nullToEmpty(row.getTopLoser()),
                    refTopLoser,
                    !refTopLoser.isBlank() && same(row.getTopLoser(), refTopLoser)))));
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

    DailyMarketBrief brief = loadBriefWithVerification(date, 2);

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
    int lowConfidence = 0;
    int fail = 0;

    LocalDate cur = from;
    while (!cur.isAfter(to)) {
      try {
        DailySummary saved = generate(cur);
        String notes = saved.getRawNotes() == null ? "" : saved.getRawNotes();
        String sourceUsed = sourceUsedFromNotes(notes);
        String confidence = confidenceFor(sourceUsed);
        if ("low".equals(confidence)) {
          String reason =
              "naver".equals(sourceUsed)
                  ? "historical accuracy limited for current naver v1 source"
                  : "fallback source used due to marketdata fetch failure";
          results.add(
              new BackfillResultDto(cur, "low_confidence", reason, sourceUsed, confidence));
          lowConfidence++;
        } else {
          results.add(new BackfillResultDto(cur, "success", "", sourceUsed, confidence));
          success++;
        }
      } catch (Exception e) {
        String reason = e.getClass().getSimpleName() + (e.getMessage() == null ? "" : ":" + e.getMessage());
        results.add(new BackfillResultDto(cur, "fail", reason, "fallback", "low"));
        fail++;
      }
      cur = cur.plusDays(1);
    }

    int total = success + lowConfidence + fail;
    return new BackfillResponseDto(from, to, total, success, lowConfidence, fail, results);
  }

  private DailyMarketBrief loadBriefWithVerification(LocalDate date, int maxRetries) {
    if ("placeholder".equalsIgnoreCase(provider)) {
      return loadBriefWithRetry(date, maxRetries);
    }

    Optional<DailyMarketBrief> reference = loadReferenceBrief(date, maxRetries);
    if (reference.isEmpty()) {
      throw new IllegalStateException(
          "verification_reference_unavailable: cannot fetch date-specific leaders for " + date);
    }

    List<String> primaryReasons = new ArrayList<>();
    for (int attempt = 1; attempt <= 2; attempt++) {
      Optional<DailyMarketBrief> candidate = loadPrimaryCandidate(date, maxRetries);
      if (candidate.isPresent()) {
        VerificationResult v = verify(candidate.get(), reference.get());
        if (v.ok()) {
          return appendVerification(candidate.get(), "primary", attempt, true, v.reason());
        }
        primaryReasons.add("attempt=" + attempt + ": " + v.reason());
      } else {
        primaryReasons.add("attempt=" + attempt + ": empty_response");
      }
    }

    List<String> fallbackReasons = new ArrayList<>();
    for (int attempt = 1; attempt <= 2; attempt++) {
      Optional<DailyMarketBrief> candidate = loadPykrxLeaders(date);
      if (candidate.isPresent()) {
        VerificationResult v = verify(candidate.get(), reference.get());
        if (v.ok()) {
          return appendVerification(candidate.get(), "fallback(pykrx)", attempt, true, v.reason());
        }
        fallbackReasons.add("attempt=" + attempt + ": " + v.reason());
      } else {
        fallbackReasons.add("attempt=" + attempt + ": empty_response");
      }
    }

    throw new IllegalStateException(
        "verification_failed: primary="
            + String.join("; ", primaryReasons)
            + " | fallback="
            + String.join("; ", fallbackReasons));
  }

  private Optional<DailyMarketBrief> loadReferenceBrief(LocalDate date, int maxRetries) {
    for (int attempt = 0; attempt <= maxRetries; attempt++) {
      Optional<DailyMarketBrief> pykrx = loadPykrxLeaders(date);
      if (pykrx.isPresent()) return pykrx;
    }
    return Optional.empty();
  }

  private Optional<DailyMarketBrief> loadPrimaryCandidate(LocalDate date, int maxRetries) {
    for (int attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        Optional<DailyMarketBrief> found = marketData.getDailyBrief(date);
        if (found.isPresent()) {
          return found;
        }
      } catch (Exception e) {
        log.warn(
            "primary marketdata fetch failed: date={}, attempt={}, reason={}",
            date,
            attempt,
            e.getClass().getSimpleName() + ":" + (e.getMessage() == null ? "" : e.getMessage()));
      }
    }
    return Optional.empty();
  }

  private DailyMarketBrief loadBriefWithRetry(LocalDate date, int maxRetries) {
    LocalDate today = todaySeoul();
    if (date.isBefore(today)) {
      Optional<DailyMarketBrief> pykrx = loadPykrxLeaders(date);
      if (pykrx.isPresent()) {
        return pykrx.get();
      }
    }

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

  private Optional<DailyMarketBrief> loadPykrxLeaders(LocalDate date) {
    try {
      PykrxLeadersResponse res =
          pykrxHttp
              .get()
              .uri(uriBuilder -> uriBuilder.path("/leaders").queryParam("date", date).build())
              .accept(MediaType.APPLICATION_JSON)
              .retrieve()
              .body(PykrxLeadersResponse.class);

      if (res == null || isBlank(res.topGainer()) || isBlank(res.topLoser())) {
        return Optional.empty();
      }

      return Optional.of(
          new DailyMarketBrief(
              res.topGainer(),
              res.topLoser(),
              blankToDash(res.mostMentioned()),
              blankToDash(res.kospiPick()),
              blankToDash(res.kosdaqPick()),
              "pykrx",
              res.notes()));
    } catch (Exception e) {
      log.info(
          "pykrx leaders unavailable: date={}, reason={}",
          date,
          e.getClass().getSimpleName() + ":" + (e.getMessage() == null ? "" : e.getMessage()));
      return Optional.empty();
    }
  }

  private VerificationResult verify(DailyMarketBrief candidate, DailyMarketBrief reference) {
    List<String> diffs = new ArrayList<>();

    if (!same(candidate.topGainer(), reference.topGainer())) {
      diffs.add("topGainer candidate='" + candidate.topGainer() + "' ref='" + reference.topGainer() + "'");
    }
    if (!same(candidate.topLoser(), reference.topLoser())) {
      diffs.add("topLoser candidate='" + candidate.topLoser() + "' ref='" + reference.topLoser() + "'");
    }
    if (!same(candidate.mostMentioned(), reference.mostMentioned())) {
      diffs.add(
          "mostMentioned candidate='"
              + candidate.mostMentioned()
              + "' ref='"
              + reference.mostMentioned()
              + "'");
    }
    if (!same(candidate.kospiPick(), reference.kospiPick())) {
      diffs.add("kospiPick candidate='" + candidate.kospiPick() + "' ref='" + reference.kospiPick() + "'");
    }
    if (!same(candidate.kosdaqPick(), reference.kosdaqPick())) {
      diffs.add(
          "kosdaqPick candidate='" + candidate.kosdaqPick() + "' ref='" + reference.kosdaqPick() + "'");
    }

    if (diffs.isEmpty()) {
      return new VerificationResult(true, "match=100%");
    }
    return new VerificationResult(false, String.join(", ", diffs));
  }

  private DailyMarketBrief appendVerification(
      DailyMarketBrief brief, String stage, int attempt, boolean matched, String reason) {
    String extra =
        "verification: stage="
            + stage
            + ", attempt="
            + attempt
            + ", matched="
            + matched
            + ", reason="
            + reason;
    String notes = brief.notes() == null || brief.notes().isBlank() ? extra : brief.notes() + "\n" + extra;
    return new DailyMarketBrief(
        brief.topGainer(),
        brief.topLoser(),
        brief.mostMentioned(),
        brief.kospiPick(),
        brief.kosdaqPick(),
        brief.source(),
        notes);
  }

  private boolean same(String a, String b) {
    return (a == null ? "" : a.trim()).equals(b == null ? "" : b.trim());
  }

  private String sourceUsedFromNotes(String notes) {
    if (notes.contains("Source: pykrx") || notes.contains("Source: pykrx(")) {
      return "pykrx";
    }
    if (notes.contains("Source: finance-datareader") || notes.contains("Source: finance-datareader(")) {
      return "fdr";
    }
    if (notes.contains("Source: naver(")) {
      return "naver";
    }
    return "fallback";
  }

  private String confidenceFor(String sourceUsed) {
    if ("pykrx".equals(sourceUsed) || "fdr".equals(sourceUsed)) {
      return "high";
    }
    return "low";
  }

  private static boolean isBlank(String s) {
    return s == null || s.isBlank();
  }

  private static String blankToDash(String s) {
    return isBlank(s) ? "-" : s;
  }

  private static String nullToEmpty(String s) {
    return s == null ? "" : s;
  }

  private record VerificationResult(boolean ok, String reason) {}

  private record PykrxLeadersResponse(
      String date,
      String topGainer,
      String topLoser,
      String mostMentioned,
      String kospiPick,
      String kosdaqPick,
      String source,
      String notes) {}

  public LocalDate todaySeoul() {
    return LocalDate.now(ZoneId.of("Asia/Seoul"));
  }
}
