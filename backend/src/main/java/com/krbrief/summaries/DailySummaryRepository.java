package com.krbrief.summaries;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DailySummaryRepository extends JpaRepository<DailySummary, LocalDate> {
  List<DailySummary> findAllByDateBetweenOrderByDateAsc(LocalDate from, LocalDate to);
}

