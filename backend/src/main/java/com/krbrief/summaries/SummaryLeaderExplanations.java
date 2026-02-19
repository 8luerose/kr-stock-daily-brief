package com.krbrief.summaries;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

final class SummaryLeaderExplanations {
  private static final DateTimeFormatter DART_DATE = DateTimeFormatter.BASIC_ISO_DATE;

  private SummaryLeaderExplanations() {}

  static SummaryDto.LeaderExplanations build(
      LocalDate date,
      String topGainer,
      String topLoser,
      List<SummaryDto.AnomalyDto> anomalies,
      String rawNotes,
      SummaryVerificationLinks verification) {
    return new SummaryDto.LeaderExplanations(
        buildOne("topGainer", date, topGainer, anomalies, rawNotes, verification),
        buildOne("topLoser", date, topLoser, anomalies, rawNotes, verification));
  }

  private static SummaryDto.LeaderExplanation buildOne(
      String leaderKey,
      LocalDate date,
      String leaderName,
      List<SummaryDto.AnomalyDto> anomalies,
      String rawNotes,
      SummaryVerificationLinks verification) {
    String normalizedName = normalizeName(leaderName);
    List<String> flags = flagsForLeader(normalizedName, anomalies);
    boolean caution = hasContinuitySignal(flags);

    LinkedHashSet<String> links = new LinkedHashSet<>();
    addIfPresent(links, explicitEvidenceLink(rawNotes, leaderKey));
    addIfPresent(links, verificationItemLink(verification, leaderKey));
    addIfPresent(links, verification == null ? "" : verification.krxDataPortal());
    addIfPresent(links, buildDartSearchLink(normalizedName, date));

    String explicit = explicitEvidenceLink(rawNotes, leaderKey);
    String level;
    String summary;
    if (!explicit.isBlank()) {
      level = "confirmed";
      summary =
          normalizedName
              + "은(는) 연속성 신호 "
              + signalText(flags)
              + " 상태이며, 명시적으로 매칭된 근거 링크가 확인되어 확인 수준을 confirmed로 표기합니다.";
    } else if (caution) {
      level = "caution";
      summary =
          normalizedName
              + "은(는) 연속성 신호 "
              + signalText(flags)
              + "가 감지되어 수익률 해석에 주의가 필요합니다. 기업행위 확정 근거는 확인되지 않았습니다.";
    } else {
      level = "info";
      summary = normalizedName + "은(는) 가격/거래 연속성 이상 신호가 없어 일반 랭킹 결과로 표시됩니다.";
    }

    return new SummaryDto.LeaderExplanation(level, summary, new ArrayList<>(links));
  }

  private static String verificationItemLink(SummaryVerificationLinks verification, String leaderKey) {
    if (verification == null) return "";
    if ("topGainer".equals(leaderKey)) {
      return verification.topGainerItem() == null ? "" : nullToEmpty(verification.topGainerItem().directUrl());
    }
    if ("topLoser".equals(leaderKey)) {
      return verification.topLoserItem() == null ? "" : nullToEmpty(verification.topLoserItem().directUrl());
    }
    return "";
  }

  private static String explicitEvidenceLink(String rawNotes, String leaderKey) {
    return extractValue(rawNotes, "confirmedEvidence." + leaderKey);
  }

  private static String extractValue(String text, String key) {
    if (text == null || text.isBlank()) return "";
    String marker = key + "=";
    int idx = text.indexOf(marker);
    if (idx < 0) return "";
    int start = idx + marker.length();
    int end = text.indexOf('\n', start);
    if (end < 0) end = text.length();
    String value = text.substring(start, end).trim();
    return "-".equals(value) ? "" : value;
  }

  private static List<String> flagsForLeader(String leaderName, List<SummaryDto.AnomalyDto> anomalies) {
    if (leaderName.isBlank() || anomalies == null) return List.of();
    for (SummaryDto.AnomalyDto anomaly : anomalies) {
      if (anomaly == null) continue;
      if (normalizeName(anomaly.name()).equals(leaderName)) {
        return anomaly.flags() == null ? List.of() : anomaly.flags();
      }
    }
    return List.of();
  }

  private static boolean hasContinuitySignal(List<String> flags) {
    if (flags == null || flags.isEmpty()) return false;
    return flags.contains("zero_volume_streak")
        || flags.contains("huge_gap")
        || flags.contains("suspicious_zero_volume_jump")
        || flags.contains("prior_close_zero");
  }

  private static String signalText(List<String> flags) {
    if (flags == null || flags.isEmpty()) {
      return "없음";
    }
    List<String> labels = new ArrayList<>();
    if (flags.contains("zero_volume_streak")) {
      labels.add("거래량 0 연속");
    }
    if (flags.contains("huge_gap")) {
      labels.add("대규모 수익률 갭");
    }
    if (flags.contains("suspicious_zero_volume_jump")) {
      labels.add("무거래 급등락");
    }
    if (flags.contains("prior_close_zero")) {
      labels.add("전일 종가 0 기준");
    }
    if (labels.isEmpty()) {
      return "없음";
    }
    return String.join(", ", labels);
  }

  private static String buildDartSearchLink(String companyName, LocalDate date) {
    if (companyName.isBlank() || "-".equals(companyName)) {
      return "";
    }
    LocalDate base = date == null ? LocalDate.now() : date;
    String start = base.minusDays(7).format(DART_DATE);
    String end = base.plusDays(7).format(DART_DATE);
    return "https://englishdart.fss.or.kr/dsbb001/main.do?auto=true&corporationType=&textCrpCik=&textCrpNm="
        + URLEncoder.encode(companyName, StandardCharsets.UTF_8)
        + "&startDate="
        + start
        + "&endDate="
        + end;
  }

  private static String normalizeName(String value) {
    if (value == null || value.isBlank()) {
      return "-";
    }
    return value.trim();
  }

  private static String nullToEmpty(String value) {
    return value == null ? "" : value;
  }

  private static void addIfPresent(LinkedHashSet<String> links, String value) {
    if (value == null || value.isBlank()) return;
    links.add(value);
  }
}
