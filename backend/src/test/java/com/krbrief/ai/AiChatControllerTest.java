package com.krbrief.ai;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AiChatController.class)
class AiChatControllerTest {
  @Autowired MockMvc mvc;

  @MockBean AiChatClient client;

  @Test
  void chat_proxiesAiServiceResponse() throws Exception {
    when(client.chat(anyMap()))
        .thenReturn(
            Map.of(
                "mode", "rag_ready_rule_based",
                "answer", "기준일: 2026-05-03",
                "confidence", "medium",
                "sources", List.of(Map.of("title", "종목 차트 API", "type", "ohlcv")),
                "grounding", Map.of("policy", "retrieval_only_with_explicit_limitations"),
                "limitations", List.of("교육용 분석 보조입니다."),
                "oppositeSignals", List.of("거래량 없는 상승")));

    mvc.perform(
            post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"question\":\"왜 올랐어?\",\"stockCode\":\"005930\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mode").value("rag_ready_rule_based"))
        .andExpect(jsonPath("$.sources").isArray())
        .andExpect(jsonPath("$.grounding.policy").value("retrieval_only_with_explicit_limitations"))
        .andExpect(jsonPath("$.limitations").isArray())
        .andExpect(jsonPath("$.oppositeSignals").isArray());
  }

  @Test
  void status_proxiesAiServiceLlmStatusWithoutSecretValue() throws Exception {
    when(client.status())
        .thenReturn(
            Map.of(
                "provider", "openai_compatible",
                "configured", false,
                "apiKeySet", false,
                "modelConfigured", false,
                "model", "",
                "fallbackMode", "rag_fallback_rule_based"));

    mvc.perform(get("/api/ai/status"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.provider").value("openai_compatible"))
        .andExpect(jsonPath("$.configured").value(false))
        .andExpect(jsonPath("$.fallbackMode").value("rag_fallback_rule_based"));
  }
}
