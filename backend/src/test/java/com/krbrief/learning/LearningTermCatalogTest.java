package com.krbrief.learning;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class LearningTermCatalogTest {

  @Test
  void list_canSearchBeginnerTerms() {
    LearningTermCatalog catalog = new LearningTermCatalog();

    var terms = catalog.list("PER", null, 10);

    assertFalse(terms.isEmpty());
    assertTrue(terms.stream().anyMatch(term -> term.id().equals("per")));
    assertTrue(terms.stream().anyMatch(term -> term.plainDefinition().contains("주당순이익")));
  }

  @Test
  void match_usesPreferredTermFirst() {
    LearningTermCatalog catalog = new LearningTermCatalog();

    var terms = catalog.match("거래량은 왜 중요해요?", "per");

    assertFalse(terms.isEmpty());
    assertEquals("per", terms.get(0).id());
    assertTrue(terms.stream().anyMatch(t -> t.id().equals("volume")));
  }
}
