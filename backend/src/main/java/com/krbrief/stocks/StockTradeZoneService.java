package com.krbrief.stocks;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StockTradeZoneService {
  private final StockResearchClient client;

  public StockTradeZoneService(StockResearchClient client) {
    this.client = client;
  }

  public StockTradeZonesDto tradeZones(String code, String range, String interval, String riskMode) {
    StockChartDto chart = client.chart(code, range, interval);
    List<StockChartDto.StockOhlcvDto> data = chart.data() == null ? List.of() : chart.data();
    if (data.isEmpty()) {
      throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY, "marketdata_empty_chart_response");
    }

    StockChartDto.StockOhlcvDto latest = data.get(data.size() - 1);
    long close = value(latest.close());
    String basisDate = chart.asOf() == null || chart.asOf().isBlank() ? latest.date() : chart.asOf();
    MarketSignals signals = marketSignals(data, close);
    String confidence = data.size() >= 60 && signals.avgVolume20() > 0 ? "medium-high" : "medium";

    String buyCondition =
        switch (riskMode) {
          case "aggressive" -> "20일 평균 종가 회복과 거래량 강도 100% 이상이 동시에 보이면 소액 분할 진입을 검토";
          case "conservative" -> "저항선 돌파 후 2거래일 이상 종가와 거래량이 유지될 때까지 대기";
          default -> "20일 평균 종가 회복, 거래량 강도 개선, 최근 지지선 방어가 동시에 보일 때 매수 검토";
        };

    List<StockTradeZonesDto.TradeZoneDto> zones =
        List.of(
            zone(
                "buy_review",
                "매수 검토 구간",
                Math.max(Math.round(signals.avgClose20() * 0.995), Math.round(close * 0.985)),
                Math.min(Math.round(signals.resistance() * 1.005), Math.round(close * 1.030)),
                buyCondition,
                String.format(
                    "20일 평균 종가 %.0f, 최근 저항선 %d, 거래량 강도 %.0f%%를 함께 사용",
                    signals.avgClose20(), signals.resistance(), signals.volumeRatio()),
                "가격은 회복하지만 거래량 강도가 100% 미만이면 신뢰도를 낮춤",
                confidence,
                basisDate,
                "가격만 보지 말고 거래량이 같이 늘어나는지 확인합니다."),
            zone(
                "split_buy",
                "분할매수 검토 구간",
                Math.round(signals.support() * 0.995),
                Math.min(Math.round(signals.avgClose20() * 0.995), Math.round(close * 0.985)),
                "지지선 근처에서 하락 속도가 줄고 반등 거래량이 붙을 때만 나누어 검토",
                String.format("최근 지지선 %d, 20일 평균 종가 %.0f, 거래량 강도 %.0f%% 기준", signals.support(), signals.avgClose20(), signals.volumeRatio()),
                "지지선 이탈 후 거래량이 커지면 분할보다 관망이 우선",
                confidence,
                basisDate,
                "한 번에 들어가지 않고 가격 확인 지점을 여러 번 나눕니다."),
            zone(
                "watch",
                "관망 구간",
                Math.min(Math.round(signals.avgClose20() * 0.990), Math.round(close * 0.980)),
                Math.max(Math.round(signals.avgClose20() * 1.010), Math.round(close * 1.030)),
                "가격 방향과 거래량 방향이 엇갈리면 새 신호가 확인될 때까지 대기",
                String.format("지지-저항 범위 내 위치 %.0f%%, 20일 평균 거래량 %.0f 기준", signals.rangePosition(), signals.avgVolume20()),
                "거래량 없는 상승 또는 종가가 저가 부근에서 끝나는 흐름",
                confidence,
                basisDate,
                "잘 모를 때 쉬는 것도 전략입니다. 방향이 분명해질 때까지 기다립니다."),
            zone(
                "sell_review",
                "매도 검토 구간",
                Math.max(Math.round(signals.resistance() * 0.990), Math.round(close * 1.030)),
                Math.max(Math.round(signals.resistance() * 1.030), Math.round(close * 1.120)),
                "급등 후 거래량 둔화, 긴 윗꼬리, 직전 고점 돌파 실패가 겹칠 때 일부 차익 실현 검토",
                String.format("최근 저항선 %d, 거래량 강도 %.0f%%, 범위 위치 %.0f%% 기준", signals.resistance(), signals.volumeRatio(), signals.rangePosition()),
                "거래량이 강하게 유지되고 고점 돌파가 이어지면 성급한 매도 해석을 낮춤",
                confidence,
                basisDate,
                "이익이 났을 때도 왜 파는지 조건을 정해야 합니다."),
            zone(
                "risk_management",
                "리스크 관리 구간",
                Math.round(signals.support() * 0.970),
                Math.round(signals.support()),
                "전저점 이탈 또는 하락일 거래량 급증 시 비중 축소와 재진입 기준 재설정",
                String.format("최근 지지선 %d, 전저점 이탈 여부, 하락일 거래량 급증 여부 기준", signals.support()),
                "일시적 장중 이탈 후 종가 회복이면 다음 거래일까지 확인",
                confidence,
                basisDate,
                "손실을 어디까지 허용할지 미리 정하는 구간입니다."));

    List<String> evidence =
        List.of(
            "기준일: " + basisDate,
            "최근 종가: " + close,
            "최근 샘플 수: " + data.size(),
            "최근 지지선: " + signals.support(),
            "최근 저항선: " + signals.resistance(),
            "20일 평균 종가: " + Math.round(signals.avgClose20()),
            "20일 평균 거래량: " + Math.round(signals.avgVolume20()),
            "거래량 강도: " + Math.round(signals.volumeRatio()) + "%",
            "지지-저항 범위 내 위치: " + Math.round(signals.rangePosition()) + "%",
            "판단 성향: " + riskMode);

    return new StockTradeZonesDto(code, chart.name(), interval, range, basisDate, riskMode, confidence, zones, evidence);
  }

  private static StockTradeZonesDto.TradeZoneDto zone(
      String type,
      String label,
      long fromPrice,
      long toPrice,
      String condition,
      String evidence,
      String oppositeSignal,
      String confidence,
      String basisDate,
      String beginnerExplanation) {
    long low = Math.min(fromPrice, toPrice);
    long high = Math.max(fromPrice, toPrice);
    return new StockTradeZonesDto.TradeZoneDto(
        type,
        label,
        low,
        high,
        condition,
        evidence,
        oppositeSignal,
        confidence,
        basisDate,
        beginnerExplanation);
  }

  private static MarketSignals marketSignals(List<StockChartDto.StockOhlcvDto> data, long close) {
    int sampleSize = Math.min(data.size(), 20);
    List<StockChartDto.StockOhlcvDto> sample = data.subList(Math.max(0, data.size() - sampleSize), data.size());
    double avgVolume20 = sample.stream().mapToLong(row -> value(row.volume())).average().orElse(0);
    double avgClose20 = sample.stream().mapToLong(row -> value(row.close())).filter(v -> v > 0).average().orElse(close);
    long support = sample.stream().mapToLong(row -> value(row.low())).filter(v -> v > 0).min().orElse(Math.round(close * 0.95));
    long resistance = sample.stream().mapToLong(row -> value(row.high())).filter(v -> v > 0).max().orElse(Math.round(close * 1.05));
    long latestVolume = value(data.get(data.size() - 1).volume());
    double volumeRatio = avgVolume20 <= 0 ? 0 : latestVolume / avgVolume20 * 100.0;
    double range = Math.max(1, resistance - support);
    double rangePosition = Math.max(0, Math.min(100, (close - support) / range * 100.0));
    return new MarketSignals(support, resistance, avgClose20, avgVolume20, volumeRatio, rangePosition);
  }

  private static long value(Long value) {
    return value == null ? 0L : value;
  }

  private record MarketSignals(
      long support,
      long resistance,
      double avgClose20,
      double avgVolume20,
      double volumeRatio,
      double rangePosition) {}
}
