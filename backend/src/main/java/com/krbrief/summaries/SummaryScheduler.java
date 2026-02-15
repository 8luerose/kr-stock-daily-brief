package com.krbrief.summaries;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class SummaryScheduler {
  private final DailySummaryService service;

  public SummaryScheduler(DailySummaryService service) {
    this.service = service;
  }

  // Weekdays 15:40 Asia/Seoul
  @Scheduled(cron = "0 40 15 * * MON-FRI", zone = "Asia/Seoul")
  public void generateWeekdaySummary() {
    service.generate(service.todaySeoul());
  }
}
