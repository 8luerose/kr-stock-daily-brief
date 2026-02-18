package com.krbrief.summaries;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers(disabledWithoutDocker = true)
class SummaryApiTest {
  @Container
  static final MySQLContainer<?> mysql =
      new MySQLContainer<>("mysql:8.0")
          .withDatabaseName("testdb")
          .withUsername("test")
          .withPassword("test");

  @DynamicPropertySource
  static void props(DynamicPropertyRegistry r) {
    r.add("spring.datasource.url", mysql::getJdbcUrl);
    r.add("spring.datasource.username", mysql::getUsername);
    r.add("spring.datasource.password", mysql::getPassword);
  }

  @Autowired MockMvc mvc;

  @Test
  void generate_then_getByDate() throws Exception {
    mvc.perform(post("/api/summaries/2026-02-15/generate"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.date").value("2026-02-15"))
        .andExpect(jsonPath("$.topGainer").value("TOP_GAINER_2026-02-15"))
        .andExpect(jsonPath("$.verification.date").value("2026-02-15"))
        .andExpect(jsonPath("$.verification.krxDataPortal").value("https://data.krx.co.kr/"))
        .andExpect(jsonPath("$.verification.topGainerDateSearch").value(org.hamcrest.Matchers.containsString("ds=2026.02.15")))
        .andExpect(jsonPath("$.verification.topLoserDateSearch").value(org.hamcrest.Matchers.containsString("de=2026.02.15")))
        .andExpect(jsonPath("$.verification.mostMentionedDateSearch").value(org.hamcrest.Matchers.containsString("ds=2026.02.15")))
        .andExpect(jsonPath("$.verification.kospiPickDateSearch").value(org.hamcrest.Matchers.containsString("de=2026.02.15")))
        .andExpect(jsonPath("$.verification.kosdaqPickDateSearch").value(org.hamcrest.Matchers.containsString("ds=2026.02.15")))
        .andExpect(jsonPath("$.verification.verificationLimitations").value(org.hamcrest.Matchers.containsString("KRX official pages")))
        .andExpect(jsonPath("$.content").exists())
        .andExpect(jsonPath("$.generatedAt").exists());

    mvc.perform(get("/api/summaries/2026-02-15"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.date").value("2026-02-15"));
  }

  @Test
  void list_range() throws Exception {
    mvc.perform(post("/api/summaries/2026-02-01/generate")).andExpect(status().isOk());
    mvc.perform(post("/api/summaries/2026-02-02/generate")).andExpect(status().isOk());

    mvc.perform(get("/api/summaries?from=2026-02-01&to=2026-02-28"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].date").value("2026-02-01"));
  }
}
