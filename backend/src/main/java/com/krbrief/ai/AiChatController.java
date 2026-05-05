package com.krbrief.ai;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

  public AiChatController(AiChatClient client, AiChatContextEnricher enricher, AiChatLogService logService) {
    this.client = client;
    this.enricher = enricher;
    this.logService = logService;
  }

  @PostMapping("/chat")
  public Map<String, Object> chat(@RequestBody(required = false) Map<String, Object> request) {
    Map<String, Object> enriched = enricher.enrich(request == null ? Map.of() : request);
    LinkedHashMap<String, Object> response = new LinkedHashMap<>(client.chat(enriched));
    response.put("storage", logService.save(enriched, response));
    return response;
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
