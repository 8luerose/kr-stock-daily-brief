package com.krbrief.summaries;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class SummaryVerificationLinksTest {

  @Test
  void buildsDateLockedLinksForAllFields() {
    SummaryVerificationLinks links =
        SummaryVerificationLinks.from(
            LocalDate.of(2026, 2, 15), "/api/summaries/2026-02-15/verification/krx", "A", "B", "C", "D", "E");

    assertEquals("/api/summaries/2026-02-15/verification/krx", links.primaryKrxArtifact());
    assertTrue(links.primarySourceTier().contains("Primary=KRX"));
    assertTrue(links.secondarySourceTier().contains("Secondary=Naver"));
    assertTrue(links.topGainerDateSearch().contains("ds=2026.02.15"));
    assertTrue(links.topLoserDateSearch().contains("de=2026.02.15"));
    assertTrue(links.mostMentionedDateSearch().contains("ds=2026.02.15"));
    assertTrue(links.kospiPickDateSearch().contains("de=2026.02.15"));
    assertTrue(links.kosdaqPickDateSearch().contains("ds=2026.02.15"));
  }

  @Test
  void keepsLegacySearchLinksWhenDateMissing() {
    SummaryVerificationLinks links = SummaryVerificationLinks.from(null, "", "A", "B", "C", "D", "E");

    assertEquals("", links.date());
    assertEquals("", links.topGainerDateSearch());
    assertEquals("", links.topLoserDateSearch());
    assertEquals("", links.mostMentionedDateSearch());
    assertEquals("", links.kospiPickDateSearch());
    assertEquals("", links.kosdaqPickDateSearch());
    assertTrue(links.topGainerSearch().contains("finance.naver.com/search"));
    assertTrue(links.topLoserSearch().contains("finance.naver.com/search"));
    assertTrue(links.mostMentionedSearch().contains("finance.naver.com/search"));
    assertTrue(links.kospiPickSearch().contains("finance.naver.com/search"));
    assertTrue(links.kosdaqPickSearch().contains("finance.naver.com/search"));
  }
}
