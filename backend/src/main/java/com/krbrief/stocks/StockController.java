package com.krbrief.stocks;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/stocks")
@Validated
public class StockController {
  private static final Pattern CODE = Pattern.compile("^\\d{6}$");
  private static final Set<String> RANGES = Set.of("1M", "3M", "6M", "1Y", "3Y");
  private static final Set<String> INTERVALS = Set.of("daily", "weekly", "monthly");

  private final StockResearchClient client;

  public StockController(StockResearchClient client) {
    this.client = client;
  }

  @GetMapping("/{code}/chart")
  public StockChartDto chart(
      @PathVariable String code,
      @RequestParam(name = "range", defaultValue = "6M") String range,
      @RequestParam(name = "interval", defaultValue = "daily") String interval) {
    String safeCode = validateCode(code);
    String safeRange = range.toUpperCase();
    String safeInterval = interval.toLowerCase();
    if (!RANGES.contains(safeRange)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_range");
    }
    if (!INTERVALS.contains(safeInterval)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_interval");
    }
    return client.chart(safeCode, safeRange, safeInterval);
  }

  @GetMapping("/{code}/events")
  public StockEventsDto events(
      @PathVariable String code,
      @RequestParam("from") @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam("to") @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    String safeCode = validateCode(code);
    if (from.isAfter(to)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "from_must_be_on_or_before_to");
    }
    return client.events(safeCode, from, to);
  }

  private static String validateCode(String code) {
    if (code == null || !CODE.matcher(code).matches()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_stock_code");
    }
    return code;
  }
}
