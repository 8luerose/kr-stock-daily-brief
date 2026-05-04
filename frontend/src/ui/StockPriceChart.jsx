import React, { useEffect, useMemo, useRef } from "react";
import { CandlestickSeries, HistogramSeries, LineSeries, createChart, createSeriesMarkers } from "lightweight-charts";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("ko-KR");
}

function formatRate(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function confidenceFromSeverity(severity) {
  if (severity === "high") return "높음";
  if (severity === "medium") return "보통";
  return "낮음";
}

function causalScoreMeta(score) {
  if (!score) return "";
  const factors = asArray(score.causalFactors).slice(0, 3).join(" · ");
  const evidenceLabel = {
    market_data: "시장자료",
    body: "본문",
    search: "검색",
    none: ""
  }[score.evidenceLevel] || "";
  return [factors ? `요인 ${factors}` : "", evidenceLabel ? `근거 수준 ${evidenceLabel}` : ""].filter(Boolean).join(" · ");
}

function markerText(event, compact = false) {
  if (compact) return "";
  if (event.type === "price_drop") return "AI 급락";
  if (event.type === "volume_spike") return "AI 거래";
  return "AI 급등";
}

function appendLine(parent, text, className = "") {
  const line = document.createElement("span");
  if (className) line.className = className;
  line.textContent = text;
  parent.push(line);
}

function calculateMa(data, period) {
  return asArray(data)
    .map((item, index, arr) => {
      if (index < period - 1) return null;
      const windowItems = arr.slice(index - period + 1, index + 1);
      const value = windowItems.reduce((sum, row) => sum + Number(row.close || 0), 0) / period;
      return { time: item.date, value: Number(value.toFixed(2)) };
    })
    .filter(Boolean);
}

function calculateIndicators(data) {
  const rows = asArray(data);
  let obv = 0;
  let avgGain = 0;
  let avgLoss = 0;
  let ema12 = null;
  let ema26 = null;
  let signal = null;
  const out = [];

  rows.forEach((row, index) => {
    const close = Number(row.close || 0);
    const prevClose = Number(rows[index - 1]?.close || close);
    const change = close - prevClose;
    obv += change > 0 ? Number(row.volume || 0) : change < 0 ? -Number(row.volume || 0) : 0;

    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    if (index === 1) {
      avgGain = gain;
      avgLoss = loss;
    } else if (index > 1) {
      avgGain = (avgGain * 13 + gain) / 14;
      avgLoss = (avgLoss * 13 + loss) / 14;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = index < 14 ? null : 100 - 100 / (1 + rs);

    ema12 = ema12 === null ? close : close * (2 / 13) + ema12 * (1 - 2 / 13);
    ema26 = ema26 === null ? close : close * (2 / 27) + ema26 * (1 - 2 / 27);
    const macd = ema12 - ema26;
    signal = signal === null ? macd : macd * (2 / 10) + signal * (1 - 2 / 10);

    out.push({
      time: row.date,
      obv,
      rsi: rsi === null ? null : Number(rsi.toFixed(1)),
      macd: Number(macd.toFixed(2)),
      signal: Number((signal || 0).toFixed(2))
    });
  });
  return out;
}

function latestIndicatorSummary(indicators) {
  const latest = indicators.at(-1);
  if (!latest) return [];
  const rsiState = latest.rsi === null
    ? "RSI 대기"
    : latest.rsi >= 70
      ? "RSI 과열"
      : latest.rsi <= 30
        ? "RSI 침체"
        : "RSI 중립";
  const macdState = latest.macd >= latest.signal ? "MACD 상향" : "MACD 둔화";
  const obvState = latest.obv >= 0 ? "OBV 매수 우위" : "OBV 매도 우위";
  return [
    { label: "OBV", value: obvState },
    { label: "RSI", value: `${latest.rsi ?? "-"} · ${rsiState}` },
    { label: "MACD", value: `${latest.macd} / ${latest.signal} · ${macdState}` }
  ];
}

function zoneColor(type) {
  if (type === "buy_review") return "#10b981";
  if (type === "split_buy") return "#14b8a6";
  if (type === "watch") return "#3182f6";
  if (type === "sell_review") return "#f59e0b";
  if (type === "risk_management") return "#ef4444";
  return "#9ca3af";
}

function zoneShortLabel(zone) {
  if (zone.type === "buy_review") return "매수 검토";
  if (zone.type === "split_buy") return "분할매수";
  if (zone.type === "watch") return "관망";
  if (zone.type === "sell_review") return "매도 검토";
  if (zone.type === "risk_management") return "리스크";
  return zone.label || "구간";
}

export default function StockPriceChart({ chart, events, tradeZones, decisionPanel, darkMode }) {
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const indicators = useMemo(() => calculateIndicators(chart?.data), [chart?.data]);
  const indicatorSummary = latestIndicatorSummary(indicators);

  useEffect(() => {
    if (!containerRef.current || !chart || asArray(chart.data).length === 0) return undefined;

    const rootStyle = getComputedStyle(document.documentElement);
    const textColor = rootStyle.getPropertyValue("--text-secondary").trim() || "#4b5563";
    const lineColor = rootStyle.getPropertyValue("--line").trim() || "#e5e7eb";
    const bgColor = rootStyle.getPropertyValue("--bg").trim() || "#f9fafb";
    const initialWidth = Math.max(320, containerRef.current.clientWidth || 720);
    const initialHeight = Math.max(300, containerRef.current.clientHeight || 360);
    const instance = createChart(containerRef.current, {
      width: initialWidth,
      height: initialHeight,
      layout: { background: { color: bgColor }, textColor },
      grid: { vertLines: { color: lineColor }, horzLines: { color: lineColor } },
      rightPriceScale: { borderColor: lineColor },
      timeScale: { borderColor: lineColor, timeVisible: false }
    });
    const resizeChart = () => {
      if (!containerRef.current) return;
      instance.applyOptions({
        width: Math.max(320, containerRef.current.clientWidth || initialWidth),
        height: Math.max(300, containerRef.current.clientHeight || initialHeight)
      });
    };
    window.addEventListener("resize", resizeChart);

    const candleData = asArray(chart.data).map((row) => ({
      time: row.date,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume || 0)
    }));
    const candleByTime = new Map(candleData.map((row) => [row.time, row]));
    const indicatorByTime = new Map(indicators.map((row) => [row.time, row]));
    const eventsByTime = new Map();
    asArray(events?.events).forEach((event) => {
      if (!event?.date) return;
      const list = eventsByTime.get(event.date) || [];
      list.push(event);
      eventsByTime.set(event.date, list);
    });

    const candles = instance.addSeries(CandlestickSeries, {
      upColor: "#ef4444",
      downColor: "#3182f6",
      borderUpColor: "#ef4444",
      borderDownColor: "#3182f6",
      wickUpColor: "#ef4444",
      wickDownColor: "#3182f6",
      priceLineVisible: false,
      lastValueVisible: false
    });
    candles.setData(candleData);

    const latest = candleData.at(-1);
    const recentLow = Math.min(...candleData.slice(-40).map((row) => row.low).filter((low) => Number.isFinite(low) && low > 0));
    if (latest && Number.isFinite(latest.close)) {
      candles.createPriceLine({
        price: latest.close,
        color: textColor,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "현재가"
      });
      asArray(tradeZones?.zones).forEach((zone) => {
        const price = Number(zone.toPrice || zone.fromPrice || 0);
        if (!Number.isFinite(price) || price <= 0) return;
        candles.createPriceLine({
          price,
          color: zoneColor(zone.type),
          lineWidth: 1,
          lineStyle: zone.type === "watch" ? 2 : 1,
          axisLabelVisible: false,
          title: zoneShortLabel(zone)
        });
      });
    }
    if (Number.isFinite(recentLow)) {
      candles.createPriceLine({
        price: recentLow,
        color: "#ef4444",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: false,
        title: "리스크 기준"
      });
    }

    const ma20 = instance.addSeries(LineSeries, { color: "#10b981", lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    ma20.setData(calculateMa(chart.data, 20));

    const volume = instance.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#9ca3af",
      lastValueVisible: false
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volume.setData(
      asArray(chart.data).map((row) => ({
        time: row.date,
        value: Number(row.volume || 0),
        color: Number(row.close) >= Number(row.open) ? "rgba(239, 68, 68, 0.32)" : "rgba(49, 130, 246, 0.32)"
      }))
    );

    const compactMarkers = containerRef.current.clientWidth < 560;
    const markerLimit = compactMarkers ? 4 : 10;
    createSeriesMarkers(
      candles,
      asArray(events?.events).slice(-markerLimit).map((event) => ({
        time: event.date,
        position: event.type === "price_drop" ? "belowBar" : "aboveBar",
        color: event.severity === "high" ? "#ef4444" : event.severity === "medium" ? "#f59e0b" : "#3182f6",
        shape: event.type === "price_drop" ? "arrowDown" : "arrowUp",
        text: markerText(event, compactMarkers)
      }))
    );

    const tooltip = tooltipRef.current;
    const handleCrosshairMove = (param) => {
      if (!tooltip || !param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        if (tooltip) tooltip.classList.remove("visible");
        return;
      }

      const row = candleByTime.get(param.time);
      if (!row) {
        tooltip.classList.remove("visible");
        return;
      }

      const chartWidth = containerRef.current.clientWidth;
      const chartHeight = containerRef.current.clientHeight;
      const lines = [];
      const date = document.createElement("strong");
      date.textContent = `기준일 ${row.time}`;
      lines.push(date);
      appendLine(lines, `시가 ${formatNumber(row.open)} · 고가 ${formatNumber(row.high)}`);
      appendLine(lines, `저가 ${formatNumber(row.low)} · 종가 ${formatNumber(row.close)}`);
      appendLine(lines, `거래량 ${formatNumber(row.volume)}`);
      const indicator = indicatorByTime.get(row.time);
      if (indicator) {
        appendLine(lines, `관련 지표: OBV ${formatNumber(indicator.obv)} · RSI ${indicator.rsi ?? "-"} · MACD ${indicator.macd}/${indicator.signal}`, "tooltipEventText");
      }

      const dayEvents = asArray(eventsByTime.get(row.time));
      if (dayEvents.length > 0) {
        appendLine(lines, `마커 근거 ${dayEvents.length}건`, "tooltipEventHead");
        dayEvents.slice(0, 2).forEach((event) => {
          const sources = asArray(event.evidenceSources);
          const links = sources.length > 0 ? sources.map((source) => source.url).filter(Boolean) : asArray(event.evidenceLinks);
          const sourceLabels = sources.length > 0
            ? sources.slice(0, 3).map((source) => source.title).filter(Boolean).join(" · ")
            : `출처 ${links.length || 0}개`;
          appendLine(lines, `${event.title || "차트 이벤트"} · 신뢰도 ${confidenceFromSeverity(event.severity)}`, "tooltipEventTitle");
          appendLine(lines, `이유: ${event.explanation || "가격/거래량 변화가 감지됐습니다."}`, "tooltipEventText");
          appendLine(
            lines,
            `근거: 등락률 ${formatRate(event.priceChangeRate)} · 거래량 ${formatRate(event.volumeChangeRate)} · ${sourceLabels}`,
            "tooltipEventText"
          );
          const topCausal = asArray(event.causalScores)[0];
          if (topCausal) {
            appendLine(
              lines,
              `원인 점수: ${topCausal.label} ${topCausal.score}/100 · ${topCausal.confidence}`,
              "tooltipEventText"
            );
            const textCausal = asArray(event.causalScores).find((score) => Number(score.signalCount || 0) > 0);
            if (textCausal?.signalSummary) {
              const origins = asArray(textCausal.signalOrigins).join("/");
              appendLine(lines, `텍스트 근거${origins ? `(${origins})` : ""}: ${textCausal.signalSummary}`, "tooltipEventText");
              const meta = causalScoreMeta(textCausal);
              if (meta) appendLine(lines, meta, "tooltipEventText");
            }
          }
          appendLine(lines, `반대 신호: ${decisionPanel?.opposite || "가격과 거래량 방향이 엇갈리면 신뢰도를 낮춥니다."}`, "tooltipEventText");
          appendLine(lines, `리스크: 전저점 이탈, 거래량 급증, 공시 근거 부족 여부를 확인`, "tooltipEventText");
          appendLine(lines, "관련 용어: 거래량 · 이동평균선 · RSI · MACD", "tooltipEventText");
        });
      }

      tooltip.replaceChildren(...lines);
      tooltip.classList.add("visible");

      const box = tooltip.getBoundingClientRect();
      const left = Math.min(Math.max(8, param.point.x + 14), Math.max(8, chartWidth - box.width - 8));
      const top = Math.min(Math.max(8, param.point.y + 14), Math.max(8, chartHeight - box.height - 8));
      tooltip.style.transform = `translate(${left}px, ${top}px)`;
    };
    instance.subscribeCrosshairMove(handleCrosshairMove);
    instance.timeScale().fitContent();
    return () => {
      window.removeEventListener("resize", resizeChart);
      instance.unsubscribeCrosshairMove(handleCrosshairMove);
      instance.remove();
    };
  }, [chart, events, tradeZones, decisionPanel, darkMode, indicators]);

  return (
    <div className="realChartWrap">
      <div className="chartZoneLegend" aria-hidden="true">
        <span className="legendBuy">매수/분할매수</span>
        <span className="legendWatch">관망</span>
        <span className="legendSell">매도 검토</span>
        <span className="legendRisk">리스크 기준</span>
      </div>
      <div ref={containerRef} className="realChart" role="img" aria-label={`${chart?.name || "종목"} 캔들 차트`} />
      <div className="indicatorStrip" aria-label="차트 보조지표">
        {indicatorSummary.map((item) => (
          <span key={item.label}>
            <strong>{item.label}</strong>
            {item.value}
          </span>
        ))}
      </div>
      <div ref={tooltipRef} className="chartTooltip" aria-hidden="true" />
    </div>
  );
}
