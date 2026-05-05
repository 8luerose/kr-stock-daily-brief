package com.krbrief.ai;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {
  private final AiChatClient client;
  private final AiChatContextEnricher enricher;

  public AiChatController(AiChatClient client, AiChatContextEnricher enricher) {
    this.client = client;
    this.enricher = enricher;
  }

  @PostMapping("/chat")
  public Map<String, Object> chat(@RequestBody(required = false) Map<String, Object> request) {
    return client.chat(enricher.enrich(request == null ? Map.of() : request));
  }

  @GetMapping("/status")
  public Map<String, Object> status() {
    return client.status();
  }
}
