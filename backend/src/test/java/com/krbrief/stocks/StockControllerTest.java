package com.krbrief.stocks;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(StockController.class)
class StockControllerTest {
  @Autowired MockMvc mvc;

  @MockBean StockResearchClient client;

  @Test
  void chart_returnsGatewayResponse() throws Exception {
    when(client.chart(eq("005930"), eq("6M"), eq("daily")))
        .thenReturn(
            new StockChartDto(
                "005930",
                "삼성전자",
                "daily",
                "6M",
                "close",
                false,
                "2026-05-01",
                List.of(new StockChartDto.StockOhlcvDto("2026-05-01", 100L, 110L, 90L, 105L, 1000L))));

    mvc.perform(get("/api/stocks/005930/chart?range=6M&interval=daily"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code").value("005930"))
        .andExpect(jsonPath("$.data[0].close").value(105));
  }

  @Test
  void events_returnsGatewayResponse() throws Exception {
    when(client.events(eq("005930"), eq(LocalDate.parse("2026-04-01")), eq(LocalDate.parse("2026-05-01"))))
        .thenReturn(
            new StockEventsDto(
                "005930",
                "삼성전자",
                "2026-04-01",
                "2026-05-01",
                List.of(
                    new StockEventsDto.StockEventDto(
                        "2026-04-12",
                        "volume_spike",
                        "medium",
                        3.2,
                        230.5,
                        "거래량 급증",
                        "최근 20거래일 평균 대비 거래량이 크게 증가했습니다.",
                        List.of("https://finance.naver.com/item/main.naver?code=005930")))));

    mvc.perform(get("/api/stocks/005930/events?from=2026-04-01&to=2026-05-01"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.events[0].type").value("volume_spike"))
        .andExpect(jsonPath("$.events[0].evidenceLinks").isArray());
  }

  @Test
  void invalidInputs_return400() throws Exception {
    mvc.perform(get("/api/stocks/abc/chart")).andExpect(status().isBadRequest());
    mvc.perform(get("/api/stocks/005930/chart?range=2Y")).andExpect(status().isBadRequest());
    mvc.perform(get("/api/stocks/005930/events?from=2026-05-01&to=2026-04-01"))
        .andExpect(status().isBadRequest());
  }
}
