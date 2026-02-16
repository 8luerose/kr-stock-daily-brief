package com.krbrief.summaries;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/summaries")
@Validated
public class SummaryController {
  private final DailySummaryService service;

  public SummaryController(DailySummaryService service) {
    this.service = service;
  }

  @GetMapping
  public List<SummaryDto> list(
      @RequestParam("from") @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam("to") @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    if (from.isAfter(to)) {
      throw new ResponseStatusException(BAD_REQUEST, "from_must_be_on_or_before_to");
    }
    return service.list(from, to).stream().map(SummaryDto::from).toList();
  }

  @GetMapping("/insights")
  public SummaryInsightsDto insights(
      @RequestParam("from") @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam("to") @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    if (from.isAfter(to)) {
      throw new ResponseStatusException(BAD_REQUEST, "from_must_be_on_or_before_to");
    }
    return service.insights(from, to);
  }

  @GetMapping("/latest")
  public ResponseEntity<SummaryDto> latest() {
    return service.latest().map(s -> ResponseEntity.ok(SummaryDto.from(s)))
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @GetMapping("/stats")
  public SummaryStatsDto stats() {
    return service.stats();
  }

  @GetMapping("/{date:\\d{4}-\\d{2}-\\d{2}}")
  public ResponseEntity<SummaryDto> get(
      @PathVariable("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    return service.get(date).map(s -> ResponseEntity.ok(SummaryDto.from(s)))
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @PostMapping("/{date:\\d{4}-\\d{2}-\\d{2}}/generate")
  public SummaryDto generate(
      @PathVariable("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    return SummaryDto.from(service.generate(date));
  }

  @PostMapping("/generate/today")
  public SummaryDto generateToday() {
    return SummaryDto.from(service.generate(service.todaySeoul()));
  }
}
