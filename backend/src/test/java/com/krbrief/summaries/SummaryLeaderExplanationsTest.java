package com.krbrief.summaries;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class SummaryLeaderExplanationsTest {

  @Test
  void infoLevelWhenNoContinuitySignals() {
    SummaryVerificationLinks links =
        SummaryVerificationLinks.from(
            LocalDate.of(2026, 2, 9),
            "/api/summaries/2026-02-09/verification/krx",
            "테스트상승",
            "테스트하락",
            "C",
            "D",
            "E",
            "codes: topGainer=111111, topLoser=222222, mostMentioned=333333, kospiPick=444444, kosdaqPick=555555");

    SummaryDto.LeaderExplanations explanations =
        SummaryLeaderExplanations.build(
            LocalDate.of(2026, 2, 9), "테스트상승", "테스트하락", List.of(), "", links);

    assertEquals("info", explanations.topGainer().level());
    assertTrue(explanations.topGainer().summary().contains("일반 랭킹"));
    assertTrue(explanations.topGainer().evidenceLinks().stream().anyMatch(x -> x.contains("data.krx.co.kr")));
  }

  @Test
  void cautionLevelWhenContinuitySignalExists() {
    SummaryDto.AnomalyDto topLoserAnomaly =
        new SummaryDto.AnomalyDto(
            "001000", "테스트하락", -87.3, List.of("zero_volume_streak", "huge_gap"), "reason");

    SummaryVerificationLinks links =
        SummaryVerificationLinks.from(
            LocalDate.of(2026, 2, 9),
            "/api/summaries/2026-02-09/verification/krx",
            "테스트상승",
            "테스트하락",
            "C",
            "D",
            "E",
            "codes: topGainer=111111, topLoser=222222, mostMentioned=333333, kospiPick=444444, kosdaqPick=555555");

    SummaryDto.LeaderExplanations explanations =
        SummaryLeaderExplanations.build(
            LocalDate.of(2026, 2, 9),
            "테스트상승",
            "테스트하락",
            List.of(topLoserAnomaly),
            "",
            links);

    assertEquals("caution", explanations.topLoser().level());
    assertTrue(explanations.topLoser().summary().contains("주의"));
    assertTrue(explanations.topLoser().summary().contains("기업행위 확정 근거"));
  }

  @Test
  void confirmedLevelOnlyWithExplicitEvidenceMatch() {
    SummaryDto.AnomalyDto topGainerAnomaly =
        new SummaryDto.AnomalyDto("009999", "테스트상승", 90.1, List.of("huge_gap"), "reason");

    SummaryVerificationLinks links =
        SummaryVerificationLinks.from(
            LocalDate.of(2026, 2, 9),
            "/api/summaries/2026-02-09/verification/krx",
            "테스트상승",
            "테스트하락",
            "C",
            "D",
            "E",
            "codes: topGainer=111111, topLoser=222222, mostMentioned=333333, kospiPick=444444, kosdaqPick=555555");

    SummaryDto.LeaderExplanations explanations =
        SummaryLeaderExplanations.build(
            LocalDate.of(2026, 2, 9),
            "테스트상승",
            "테스트하락",
            List.of(topGainerAnomaly),
            "confirmedEvidence.topGainer=https://dart.fss.or.kr/example",
            links);

    assertEquals("confirmed", explanations.topGainer().level());
    assertTrue(explanations.topGainer().summary().contains("confirmed"));
    assertTrue(
        explanations.topGainer().evidenceLinks().stream()
            .anyMatch(x -> x.equals("https://dart.fss.or.kr/example")));
  }
}
