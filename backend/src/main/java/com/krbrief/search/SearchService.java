package com.krbrief.search;

import com.krbrief.learning.LearningTermCatalog;
import com.krbrief.learning.LearningTermDto;
import com.krbrief.summaries.DailySummaryService;
import com.krbrief.summaries.SummaryDto;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class SearchService {
  private static final int DEFAULT_LIMIT = 8;
  private static final int MAX_LIMIT = 20;

  private final DailySummaryService summaries;
  private final LearningTermCatalog terms;

  public SearchService(DailySummaryService summaries, LearningTermCatalog terms) {
    this.summaries = summaries;
    this.terms = terms;
  }

  public List<SearchResultDto> search(String query, Integer limit) {
    String q = normalize(query);
    if (q.isBlank()) {
      return List.of();
    }

    int safeLimit = normalizeLimit(limit);
    Map<String, SearchResultDto> results = new LinkedHashMap<>();
    addLatestSummaryStocks(results);
    addSeedCatalog(results);
    addLearningTerms(results, query);

    return results.values().stream()
        .filter(item -> searchableText(item).contains(q))
        .sorted(Comparator.comparingInt(item -> score(item, q)))
        .limit(safeLimit)
        .toList();
  }

  private void addLatestSummaryStocks(Map<String, SearchResultDto> results) {
    summaries.latest().map(SummaryDto::from).ifPresent(summary -> {
      addLeaderEntries(results, "오늘 움직인 종목", "상승 TOP3", summary.topGainers());
      addLeaderEntries(results, "오늘 움직인 종목", "하락 TOP3", summary.topLosers());
      addMentionedEntries(results, summary.mostMentionedTop());
    });
  }

  private void addLeaderEntries(
      Map<String, SearchResultDto> results,
      String market,
      String group,
      List<SummaryDto.LeaderEntryDto> entries) {
    if (entries == null) return;
    for (SummaryDto.LeaderEntryDto entry : entries) {
      if (entry == null || isBlank(entry.code()) || isBlank(entry.name())) continue;
      String id = "stock-" + entry.code();
      results.putIfAbsent(
          id,
          new SearchResultDto(
              id,
              "stock",
              entry.name(),
              entry.code(),
              market,
              formatRate(entry.rate()),
              List.of(group, entry.code()),
              group + "에 포함된 종목입니다. 차트와 AI 설명으로 근거를 확인할 수 있습니다.",
              "latest_summary",
              entry.code(),
              entry.name(),
              null));
    }
  }

  private void addMentionedEntries(Map<String, SearchResultDto> results, List<SummaryDto.MostMentionedEntryDto> entries) {
    if (entries == null) return;
    for (SummaryDto.MostMentionedEntryDto entry : entries) {
      if (entry == null || isBlank(entry.code()) || isBlank(entry.name())) continue;
      String id = "stock-" + entry.code();
      results.putIfAbsent(
          id,
          new SearchResultDto(
              id,
              "stock",
              entry.name(),
              entry.code(),
              "관심 종목",
              entry.count() == null ? "-" : entry.count() + "건",
              List.of("언급 TOP3", entry.code()),
              "오늘 언급량이 높게 잡힌 종목입니다. 차트와 이벤트를 함께 확인할 수 있습니다.",
              "latest_summary",
              entry.code(),
              entry.name(),
              null));
    }
  }

  private void addSeedCatalog(Map<String, SearchResultDto> results) {
    for (SearchResultDto item : seedCatalog()) {
      results.putIfAbsent(item.id(), item);
    }
  }

  private void addLearningTerms(Map<String, SearchResultDto> results, String query) {
    for (LearningTermDto term : terms.list(query, null, 20)) {
      String id = "term-" + term.id();
      results.putIfAbsent(
          id,
          new SearchResultDto(
              id,
              "term",
              term.term(),
              term.category(),
              "용어",
              "학습",
              compactTags(term.category(), term.relatedTerms()),
              term.plainDefinition(),
              "learning_terms",
              null,
              null,
              term.id()));
    }
  }

  private List<SearchResultDto> seedCatalog() {
    return List.of(
        seed("theme-semiconductor", "theme", "반도체", "THEME", "테마", "+2.4%", List.of("AI 반도체", "장비", "소부장"),
            "AI 수요, 설비투자, 환율 변화를 함께 보는 대표 성장 테마입니다."),
        seed("theme-battery", "theme", "2차전지", "THEME", "테마", "-1.1%", List.of("소재", "전기차", "수급"),
            "원재료 가격, 전기차 수요, 정책 뉴스가 주가 변동과 자주 연결됩니다."),
        seed("industry-finance", "industry", "증권/금융", "IND", "산업", "+0.8%", List.of("금리", "거래대금", "배당"),
            "금리, 증시 거래대금, 배당 기대가 함께 움직이는 산업군입니다."),
        seed("market-kospi", "market", "KOSPI", "KOSPI", "시장", "시장", List.of("대형주", "유가증권", "지수"),
            "대형주 중심 한국 주식시장 흐름을 확인하는 대표 시장 구분입니다."),
        seed("market-kosdaq", "market", "KOSDAQ", "KOSDAQ", "시장", "시장", List.of("성장주", "중소형주", "지수"),
            "기술주와 중소형 성장주 변동성을 확인하는 대표 시장 구분입니다."));
  }

  private SearchResultDto seed(
      String id, String type, String title, String code, String market, String rate, List<String> tags, String summary) {
    return new SearchResultDto(id, type, title, code, market, rate, tags, summary, "backend_seed_catalog", null, null, null);
  }

  private List<String> compactTags(String category, List<String> related) {
    List<String> out = new ArrayList<>();
    if (!isBlank(category)) out.add(category);
    if (related != null) {
      related.stream().filter(v -> !isBlank(v)).limit(2).forEach(out::add);
    }
    return out;
  }

  private int score(SearchResultDto item, String q) {
    if (normalize(item.title()).equals(q) || normalize(item.code()).equals(q)) return 0;
    if (normalize(item.title()).contains(q) || normalize(item.code()).contains(q)) return 1;
    if ("stock".equals(item.type())) return 2;
    if ("theme".equals(item.type()) || "industry".equals(item.type())) return 3;
    return 4;
  }

  private String searchableText(SearchResultDto item) {
    return normalize(String.join(" ", safe(item.title()), safe(item.code()), safe(item.market()), safe(item.rate()),
        safe(item.summary()), String.join(" ", item.tags() == null ? List.of() : item.tags())));
  }

  private int normalizeLimit(Integer limit) {
    if (limit == null || limit <= 0) return DEFAULT_LIMIT;
    return Math.min(limit, MAX_LIMIT);
  }

  private String formatRate(Double rate) {
    if (rate == null || !Double.isFinite(rate)) return "-";
    return String.format(Locale.ROOT, "%+.2f%%", rate);
  }

  private String normalize(String value) {
    return safe(value).trim().toLowerCase(Locale.ROOT);
  }

  private String safe(String value) {
    return value == null ? "" : value;
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }
}
