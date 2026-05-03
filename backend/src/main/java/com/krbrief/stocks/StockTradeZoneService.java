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
    long close = latest.close() == null ? 0L : latest.close();
    String basisDate = chart.asOf() == null || chart.asOf().isBlank() ? latest.date() : chart.asOf();
    int sampleSize = Math.min(data.size(), 20);
    double avgVolume =
        data.subList(Math.max(0, data.size() - sampleSize), data.size()).stream()
            .mapToLong(row -> row.volume() == null ? 0L : row.volume())
            .average()
            .orElse(0);
    String confidence = data.size() >= 60 ? "medium-high" : "medium";

    String buyCondition =
        switch (riskMode) {
          case "aggressive" -> "20일 평균 거래량 이상이 붙고 당일 종가가 회복 구간 상단을 넘을 때 소액 분할 진입을 검토";
          case "conservative" -> "회복 구간 상단 돌파 후 2거래일 이상 거래량이 유지될 때까지 대기";
          default -> "20일선 회복, 전일 대비 거래량 증가, 직전 저점 방어가 동시에 보일 때 매수 검토";
        };

    List<StockTradeZonesDto.TradeZoneDto> zones =
        List.of(
            zone(
                "buy_review",
                "매수 검토 구간",
                close,
                0.985,
                1.015,
                buyCondition,
                "현재가, 20일 거래량 평균, 최근 종가 흐름을 함께 사용",
                "가격은 회복하지만 거래량이 평균 이하이면 신뢰도를 낮춤",
                confidence,
                basisDate,
                "가격만 보지 말고 거래량이 같이 늘어나는지 확인합니다."),
            zone(
                "split_buy",
                "분할매수 검토 구간",
                close,
                0.940,
                0.980,
                "지지선 근처에서 하락 속도가 줄고 반등 거래량이 붙을 때만 나누어 검토",
                "현재가 대비 눌림 구간과 평균 거래량을 함께 사용",
                "지지 구간 이탈 후 거래량이 커지면 분할보다 관망이 우선",
                confidence,
                basisDate,
                "한 번에 들어가지 않고 가격 확인 지점을 여러 번 나눕니다."),
            zone(
                "watch",
                "관망 구간",
                close,
                0.980,
                1.030,
                "가격 방향과 거래량 방향이 엇갈리면 새 신호가 확인될 때까지 대기",
                "최근 종가와 20일 평균 거래량 기준",
                "거래량 없는 상승 또는 종가가 저가 부근에서 끝나는 흐름",
                confidence,
                basisDate,
                "잘 모를 때 쉬는 것도 전략입니다. 방향이 분명해질 때까지 기다립니다."),
            zone(
                "sell_review",
                "매도 검토 구간",
                close,
                1.050,
                1.120,
                "급등 후 거래량 둔화, 긴 윗꼬리, 직전 고점 돌파 실패가 겹칠 때 일부 차익 실현 검토",
                "현재가 대비 과열 구간과 거래량 둔화 가능성",
                "거래량이 강하게 유지되고 고점 돌파가 이어지면 성급한 매도 해석을 낮춤",
                confidence,
                basisDate,
                "이익이 났을 때도 왜 파는지 조건을 정해야 합니다."),
            zone(
                "risk_management",
                "리스크 관리 구간",
                close,
                0.900,
                0.950,
                "전저점 이탈 또는 하락일 거래량 급증 시 비중 축소와 재진입 기준 재설정",
                "현재가 대비 손실 허용 구간과 평균 거래량",
                "일시적 장중 이탈 후 종가 회복이면 다음 거래일까지 확인",
                confidence,
                basisDate,
                "손실을 어디까지 허용할지 미리 정하는 구간입니다."));

    List<String> evidence =
        List.of(
            "기준일: " + basisDate,
            "최근 종가: " + close,
            "최근 샘플 수: " + data.size(),
            "20일 평균 거래량: " + Math.round(avgVolume),
            "판단 성향: " + riskMode);

    return new StockTradeZonesDto(code, chart.name(), interval, range, basisDate, riskMode, confidence, zones, evidence);
  }

  private static StockTradeZonesDto.TradeZoneDto zone(
      String type,
      String label,
      long close,
      double fromRatio,
      double toRatio,
      String condition,
      String evidence,
      String oppositeSignal,
      String confidence,
      String basisDate,
      String beginnerExplanation) {
    return new StockTradeZonesDto.TradeZoneDto(
        type,
        label,
        Math.round(close * fromRatio),
        Math.round(close * toRatio),
        condition,
        evidence,
        oppositeSignal,
        confidence,
        basisDate,
        beginnerExplanation);
  }
}
