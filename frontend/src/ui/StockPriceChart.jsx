import React, { useEffect, useRef } from "react";
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

export default function StockPriceChart({ chart, events, darkMode }) {
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !chart || asArray(chart.data).length === 0) return undefined;

    const rootStyle = getComputedStyle(document.documentElement);
    const textColor = rootStyle.getPropertyValue("--text-secondary").trim() || "#4b5563";
    const lineColor = rootStyle.getPropertyValue("--line").trim() || "#e5e7eb";
    const bgColor = rootStyle.getPropertyValue("--bg").trim() || "#f9fafb";

    const instance = createChart(containerRef.current, {
      autoSize: true,
      height: 360,
      layout: { background: { color: bgColor }, textColor },
      grid: { vertLines: { color: lineColor }, horzLines: { color: lineColor } },
      rightPriceScale: { borderColor: lineColor },
      timeScale: { borderColor: lineColor, timeVisible: false }
    });

    const candleData = asArray(chart.data).map((row) => ({
      time: row.date,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume || 0)
    }));
    const candleByTime = new Map(candleData.map((row) => [row.time, row]));

    const candles = instance.addSeries(CandlestickSeries, {
      upColor: "#ef4444",
      downColor: "#3182f6",
      borderUpColor: "#ef4444",
      borderDownColor: "#3182f6",
      wickUpColor: "#ef4444",
      wickDownColor: "#3182f6",
      priceLineVisible: false
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
      candles.createPriceLine({
        price: latest.close * 1.05,
        color: "#f59e0b",
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: false,
        title: "매도 검토"
      });
      candles.createPriceLine({
        price: latest.close * 0.97,
        color: "#10b981",
        lineWidth: 1,
        lineStyle: 1,
        axisLabelVisible: false,
        title: "분할매수 검토"
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

    const ma20 = instance.addSeries(LineSeries, { color: "#10b981", lineWidth: 2, priceLineVisible: false });
    ma20.setData(calculateMa(chart.data, 20));

    const volume = instance.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#9ca3af"
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volume.setData(
      asArray(chart.data).map((row) => ({
        time: row.date,
        value: Number(row.volume || 0),
        color: Number(row.close) >= Number(row.open) ? "rgba(239, 68, 68, 0.32)" : "rgba(49, 130, 246, 0.32)"
      }))
    );

    createSeriesMarkers(
      candles,
      asArray(events?.events).slice(0, 30).map((event) => ({
        time: event.date,
        position: event.type === "price_drop" ? "belowBar" : "aboveBar",
        color: event.severity === "high" ? "#ef4444" : event.severity === "medium" ? "#f59e0b" : "#3182f6",
        shape: event.type === "price_drop" ? "arrowDown" : "arrowUp",
        text: event.title
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
      const date = document.createElement("strong");
      date.textContent = row.time;
      const openHigh = document.createElement("span");
      openHigh.textContent = `시가 ${formatNumber(row.open)} · 고가 ${formatNumber(row.high)}`;
      const lowClose = document.createElement("span");
      lowClose.textContent = `저가 ${formatNumber(row.low)} · 종가 ${formatNumber(row.close)}`;
      const volumeLine = document.createElement("span");
      volumeLine.textContent = `거래량 ${formatNumber(row.volume)}`;
      tooltip.replaceChildren(date, openHigh, lowClose, volumeLine);
      tooltip.classList.add("visible");

      const box = tooltip.getBoundingClientRect();
      const left = Math.min(Math.max(8, param.point.x + 14), Math.max(8, chartWidth - box.width - 8));
      const top = Math.min(Math.max(8, param.point.y + 14), Math.max(8, chartHeight - box.height - 8));
      tooltip.style.transform = `translate(${left}px, ${top}px)`;
    };
    instance.subscribeCrosshairMove(handleCrosshairMove);
    instance.timeScale().fitContent();
    return () => {
      instance.unsubscribeCrosshairMove(handleCrosshairMove);
      instance.remove();
    };
  }, [chart, events, darkMode]);

  return (
    <div className="realChartWrap">
      <div className="chartZoneLegend" aria-hidden="true">
        <span className="legendBuy">분할매수 검토</span>
        <span className="legendSell">매도 검토</span>
        <span className="legendRisk">리스크 기준</span>
      </div>
      <div ref={containerRef} className="realChart" role="img" aria-label={`${chart?.name || "종목"} 캔들 차트`} />
      <div ref={tooltipRef} className="chartTooltip" aria-hidden="true" />
    </div>
  );
}
