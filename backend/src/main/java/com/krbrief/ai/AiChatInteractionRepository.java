package com.krbrief.ai;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiChatInteractionRepository extends JpaRepository<AiChatInteraction, Long> {
  List<AiChatInteraction> findTop20ByOrderByCreatedAtDesc();

  List<AiChatInteraction> findTop20ByStockCodeOrderByCreatedAtDesc(String stockCode);
}
