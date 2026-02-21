package com.krbrief.summaries;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "daily_summaries")
public class DailySummary {
  @Id
  @Column(name = "summary_date", nullable = false)
  private LocalDate date;

  @Column(name = "top_gainer")
  private String topGainer;

  @Column(name = "top_loser")
  private String topLoser;

  @Column(name = "filtered_top_gainer")
  private String filteredTopGainer;

  @Column(name = "filtered_top_loser")
  private String filteredTopLoser;

  @Column(name = "most_mentioned")
  private String mostMentioned;

  @Column(name = "kospi_pick")
  private String kospiPick;

  @Column(name = "kosdaq_pick")
  private String kosdaqPick;

  @Column(name = "raw_notes", columnDefinition = "TEXT")
  private String rawNotes;

  @Column(name = "ranking_warning", columnDefinition = "TEXT")
  private String rankingWarning;

  @Column(name = "anomalies_text", columnDefinition = "TEXT")
  private String anomaliesText;

  @Column(name = "effective_date")
  private String effectiveDate;

  @Column(name = "top_gainers_json", columnDefinition = "TEXT")
  private String topGainersJson;

  @Column(name = "top_losers_json", columnDefinition = "TEXT")
  private String topLosersJson;

  @Column(name = "most_mentioned_top_json", columnDefinition = "TEXT")
  private String mostMentionedTopJson;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "archived_at")
  private Instant archivedAt;

  protected DailySummary() {}

  public DailySummary(LocalDate date) {
    this.date = date;
  }

  public LocalDate getDate() {
    return date;
  }

  public String getTopGainer() {
    return topGainer;
  }

  public void setTopGainer(String topGainer) {
    this.topGainer = topGainer;
  }

  public String getTopLoser() {
    return topLoser;
  }

  public void setTopLoser(String topLoser) {
    this.topLoser = topLoser;
  }

  public String getFilteredTopGainer() {
    return filteredTopGainer;
  }

  public void setFilteredTopGainer(String filteredTopGainer) {
    this.filteredTopGainer = filteredTopGainer;
  }

  public String getFilteredTopLoser() {
    return filteredTopLoser;
  }

  public void setFilteredTopLoser(String filteredTopLoser) {
    this.filteredTopLoser = filteredTopLoser;
  }

  public String getMostMentioned() {
    return mostMentioned;
  }

  public void setMostMentioned(String mostMentioned) {
    this.mostMentioned = mostMentioned;
  }

  public String getKospiPick() {
    return kospiPick;
  }

  public void setKospiPick(String kospiPick) {
    this.kospiPick = kospiPick;
  }

  public String getKosdaqPick() {
    return kosdaqPick;
  }

  public void setKosdaqPick(String kosdaqPick) {
    this.kosdaqPick = kosdaqPick;
  }

  public String getRawNotes() {
    return rawNotes;
  }

  public void setRawNotes(String rawNotes) {
    this.rawNotes = rawNotes;
  }

  public String getRankingWarning() {
    return rankingWarning;
  }

  public void setRankingWarning(String rankingWarning) {
    this.rankingWarning = rankingWarning;
  }

  public String getAnomaliesText() {
    return anomaliesText;
  }

  public void setAnomaliesText(String anomaliesText) {
    this.anomaliesText = anomaliesText;
  }

  public String getEffectiveDate() {
    return effectiveDate;
  }

  public void setEffectiveDate(String effectiveDate) {
    this.effectiveDate = effectiveDate;
  }

  public String getTopGainersJson() {
    return topGainersJson;
  }

  public void setTopGainersJson(String topGainersJson) {
    this.topGainersJson = topGainersJson;
  }

  public String getTopLosersJson() {
    return topLosersJson;
  }

  public void setTopLosersJson(String topLosersJson) {
    this.topLosersJson = topLosersJson;
  }

  public String getMostMentionedTopJson() {
    return mostMentionedTopJson;
  }

  public void setMostMentionedTopJson(String mostMentionedTopJson) {
    this.mostMentionedTopJson = mostMentionedTopJson;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public Instant getArchivedAt() {
    return archivedAt;
  }

  public void setArchivedAt(Instant archivedAt) {
    this.archivedAt = archivedAt;
  }

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    this.createdAt = now;
    this.updatedAt = now;
  }

  @PreUpdate
  void onUpdate() {
    this.updatedAt = Instant.now();
  }

  public String renderContent() {
    StringBuilder sb = new StringBuilder();
    sb.append("Daily summary for ").append(date).append("\n\n");
    sb.append("- Top gainer: ").append(nullToDash(topGainer)).append("\n");
    sb.append("- Top loser: ").append(nullToDash(topLoser)).append("\n");
    sb.append("- Filtered top gainer: ").append(nullToDash(filteredTopGainer)).append("\n");
    sb.append("- Filtered top loser: ").append(nullToDash(filteredTopLoser)).append("\n");
    sb.append("- Most mentioned: ").append(nullToDash(mostMentioned)).append("\n");
    sb.append("- KOSPI pick: ").append(nullToDash(kospiPick)).append("\n");
    sb.append("- KOSDAQ pick: ").append(nullToDash(kosdaqPick)).append("\n");
    if (rawNotes != null && !rawNotes.isBlank()) {
      sb.append("\nNotes:\n").append(rawNotes.strip()).append("\n");
    }
    return sb.toString();
  }

  private static String nullToDash(String s) {
    return s == null || s.isBlank() ? "-" : s;
  }
}
