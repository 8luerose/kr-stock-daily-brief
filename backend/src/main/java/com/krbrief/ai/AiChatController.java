package com.krbrief.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.krbrief.summaries.DailySummaryService;
import com.krbrief.summaries.SummaryDto;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {
  private final AiChatClient client;
  private final AiChatContextEnricher enricher;
  private final AiChatLogService logService;
  private final DailySummaryService summaryService;
  private final ObjectMapper objectMapper;

  public AiChatController(
      AiChatClient client,
      AiChatContextEnricher enricher,
      AiChatLogService logService,
      DailySummaryService summaryService,
      ObjectMapper objectMapper) {
    this.client = client;
    this.enricher = enricher;
    this.logService = logService;
    this.summaryService = summaryService;
    this.objectMapper = objectMapper;
  }

  @PostMapping("/chat")
  public Map<String, Object> chat(@RequestBody(required = false) Map<String, Object> request) {
    Map<String, Object> enriched = enricher.enrich(request == null ? Map.of() : request);
    LinkedHashMap<String, Object> response = new LinkedHashMap<>(client.chat(enriched));
    response.put("storage", logService.save(enriched, response));
    return response;
  }

  @PostMapping("/ollama/insights")
  public Map<String, Object> ollamaInsights(@RequestBody(required = false) Map<String, Object> request) {
    Map<String, Object> enriched = enricher.enrich(request == null ? Map.of() : request);
    LinkedHashMap<String, Object> response = new LinkedHashMap<>(client.ollamaInsights(enriched));
    response.put("storage", logService.save(enriched, response));
    return response;
  }

  @GetMapping("/ollama/after-market-report/latest")
  public ResponseEntity<Map<String, Object>> latestOllamaAfterMarketReport() {
    return summaryService.latest()
        .map(SummaryDto::from)
        .map(summary -> {
          Map<String, Object> summaryMap =
              objectMapper.convertValue(summary, new TypeReference<Map<String, Object>>() {});
          LinkedHashMap<String, Object> request = new LinkedHashMap<>();
          request.put("question", "최신 저장 브리프를 장후 시장 요약 리포트로 쉽게 설명해줘");
          request.put("topicType", "after_market_report");
          request.put("topicTitle", "매일 장후 시장 요약 리포트");
          request.put("contextDate", summary.effectiveDate() == null ? String.valueOf(summary.date()) : summary.effectiveDate());
          request.put("summary", summaryMap);

          LinkedHashMap<String, Object> response = new LinkedHashMap<>(client.ollamaAfterMarketReport(request));
          response.put("storage", logService.save(request, response));
          return ResponseEntity.ok((Map<String, Object>) response);
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @GetMapping("/status")
  public Map<String, Object> status() {
    return client.status();
  }

  @GetMapping("/chat/history")
  public List<AiChatInteractionDto> history(
      @RequestParam(value = "stockCode", required = false) String stockCode) {
    return logService.history(stockCode);
  }
}
