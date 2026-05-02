package com.krbrief.ai;

import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiChatController {
  private final AiChatClient client;

  public AiChatController(AiChatClient client) {
    this.client = client;
  }

  @PostMapping("/chat")
  public Map<String, Object> chat(@RequestBody(required = false) Map<String, Object> request) {
    return client.chat(request == null ? Map.of() : request);
  }
}
