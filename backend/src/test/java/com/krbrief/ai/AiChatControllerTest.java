package com.krbrief.ai;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.when;
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
                "limitations", List.of("교육용 분석 보조입니다."),
                "oppositeSignals", List.of("거래량 없는 상승")));

    mvc.perform(
            post("/api/ai/chat")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"question\":\"왜 올랐어?\",\"stockCode\":\"005930\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mode").value("rag_ready_rule_based"))
        .andExpect(jsonPath("$.sources").isArray())
        .andExpect(jsonPath("$.limitations").isArray())
        .andExpect(jsonPath("$.oppositeSignals").isArray());
  }
}
