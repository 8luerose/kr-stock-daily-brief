package com.krbrief.search;

import com.krbrief.stocks.StockResearchClient;
import com.krbrief.stocks.StockSectorUniverseDto;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class MarketSearchTaxonomyProvider implements SearchTaxonomyProvider {
  private static final Logger log = LoggerFactory.getLogger(MarketSearchTaxonomyProvider.class);
  private static final Duration CACHE_TTL = Duration.ofHours(6);

  private final StockResearchClient client;
  private volatile CacheEntry cache;

  public MarketSearchTaxonomyProvider(StockResearchClient client) {
    this.client = client;
  }

  @Override
  public List<SearchResultDto> list() {
    CacheEntry current = cache;
    if (current != null && current.expiresAt().isAfter(Instant.now())) {
      return current.items();
    }

    try {
      StockSectorUniverseDto res = client.sectors(null, 500);
      List<SearchResultDto> merged = mergeWithBaseline(res);
      cache = new CacheEntry(merged, Instant.now().plus(CACHE_TTL));
      return merged;
    } catch (RuntimeException e) {
      log.warn("Falling back to baseline search taxonomy after sector classification load failed: {}", e.toString());
      return SearchTaxonomyCatalog.baseline();
    }
  }

  private List<SearchResultDto> mergeWithBaseline(StockSectorUniverseDto res) {
    Map<String, SearchResultDto> out = new LinkedHashMap<>();
    for (SearchResultDto item : SearchTaxonomyCatalog.baseline()) {
      out.put(item.id(), item);
    }
    if (res == null || res.sectors() == null) {
      return List.copyOf(out.values());
    }

    for (StockSectorUniverseDto.StockSectorDto sector : res.sectors()) {
      if (sector == null || isBlank(sector.name())) continue;
      SearchResultDto item = toSearchResult(sector, res.asOf());
      out.putIfAbsent(item.id(), item);
    }
    return List.copyOf(out.values());
  }

  private SearchResultDto toSearchResult(StockSectorUniverseDto.StockSectorDto sector, String asOf) {
    String topNames = topStockNames(sector.topStocks());
    String title = sector.name();
    String summary = isBlank(sector.summary())
        ? "KRX 업종 분류 기준 상장 종목 묶음입니다."
        : sector.summary();
    if (!isBlank(asOf)) {
      summary = summary + " 기준일: " + asOf + ".";
    }

    List<String> tags = new ArrayList<>();
    if (sector.markets() != null) {
      sector.markets().stream().filter(v -> !isBlank(v)).limit(2).forEach(tags::add);
    }
    tags.add("KRX 업종");
    if (!isBlank(topNames)) {
      tags.add(topNames);
    }

    return new SearchResultDto(
        "industry-krx-" + Integer.toHexString(title.hashCode()),
        "industry",
        title,
        "IND",
        isBlank(sector.market()) ? "KRX" : sector.market(),
        formatRate(sector.rate()),
        tags,
        summary,
        "krx_sector_classification",
        null,
        null,
        null);
  }

  private String topStockNames(List<StockSectorUniverseDto.StockSectorMemberDto> stocks) {
    if (stocks == null || stocks.isEmpty()) return "";
    return stocks.stream()
        .filter(item -> item != null && !isBlank(item.name()))
        .limit(3)
        .map(StockSectorUniverseDto.StockSectorMemberDto::name)
        .reduce((a, b) -> a + ", " + b)
        .orElse("");
  }

  private String formatRate(Double value) {
    if (value == null || !Double.isFinite(value)) return "KRX 업종";
    return String.format(Locale.ROOT, "%+.2f%%", value);
  }

  private boolean isBlank(String value) {
    return value == null || value.isBlank();
  }

  private record CacheEntry(List<SearchResultDto> items, Instant expiresAt) {}
}
