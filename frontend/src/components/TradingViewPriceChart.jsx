import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './TradingViewPriceChart.module.css';

function loadTradingViewLibrary() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('browser_only_chart_library'));
  }
  if (window.LightweightCharts) {
    return Promise.resolve(window.LightweightCharts);
  }
  if (window.__tradingViewLibraryPromise) {
    return window.__tradingViewLibraryPromise;
  }
  window.__tradingViewLibraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/vendor/lightweight-charts.standalone.production.js';
    script.async = true;
    script.onload = () => {
      if (window.LightweightCharts) resolve(window.LightweightCharts);
      else reject(new Error('tradingview_library_missing'));
    };
    script.onerror = () => reject(new Error('tradingview_library_load_failed'));
    document.head.appendChild(script);
  });
  return window.__tradingViewLibraryPromise;
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '확인 필요';
  if (!Number.isFinite(Number(value))) return '확인 필요';
  return `${Math.round(Number(value)).toLocaleString()}원`;
}

function formatVolume(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '확인 필요';
  if (number >= 100_000_000) return `${(number / 100_000_000).toFixed(1)}억주`;
  if (number >= 10_000) return `${Math.round(number / 10_000).toLocaleString()}만주`;
  return `${Math.round(number).toLocaleString()}주`;
}

function parsePriceRange(priceStr) {
  if (!priceStr) return null;
  const numbers = String(priceStr).replace(/,/g, '').match(/\d+/g);
  if (!numbers) return null;
  if (String(priceStr).includes('이상')) return [Number(numbers[0]), null];
  if (String(priceStr).includes('이하') || String(priceStr).includes('이탈')) return [null, Number(numbers[0])];
  if (numbers.length >= 2) return [Number(numbers[0]), Number(numbers[1])];
  const value = Number(numbers[0]);
  return [value * 0.99, value * 1.01];
}

function zoneColor(type) {
  if (type === 'buy' || type === 'split') return '#22c55e';
  if (type === 'sell' || type === 'risk') return '#ef4444';
  return '#f59e0b';
}

function zoneMidPrice(zone) {
  const range = parsePriceRange(zone?.price);
  if (!range) return null;
  const [from, to] = range;
  if (Number.isFinite(from) && Number.isFinite(to)) return (from + to) / 2;
  return Number.isFinite(from) ? from : to;
}

function markerForEvent(event) {
  const positive = event?.type === 'positive' || event?.sentimentForPrice === 'positive';
  const negative = event?.type === 'negative' || event?.sentimentForPrice === 'negative';
  return {
    time: event.date,
    position: negative ? 'belowBar' : 'aboveBar',
    color: positive ? '#22c55e' : negative ? '#ef4444' : '#f59e0b',
    shape: negative ? 'arrowDown' : positive ? 'arrowUp' : 'circle',
    text: positive ? '호재 후보' : negative ? '주의 후보' : '확인'
  };
}

function latestEventForDate(events, date) {
  return events.find((event) => event.date === date) || null;
}

function chartContainerSize(element) {
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(320, Math.round(rect.width || element.clientWidth || 320)),
    height: Math.max(320, Math.round(rect.height || element.clientHeight || 420))
  };
}

export default function TradingViewPriceChart({
  chartData,
  zones = [],
  events = [],
  indicatorSnapshot,
  learningMode,
  onTermClick
}) {
  const containerRef = useRef(null);
  const [hover, setHover] = useState(null);
  const [chartError, setChartError] = useState('');

  const prepared = useMemo(() => {
    const rows = (chartData || [])
      .filter((row) => row?.date && Number.isFinite(Number(row.close)))
      .map((row) => ({
        ...row,
        time: row.date,
        open: Number(row.open ?? row.close),
        high: Number(row.high ?? row.close),
        low: Number(row.low ?? row.close),
        close: Number(row.close),
        volume: Number(row.volume || 0),
        ma5: Number(row.ma5),
        ma20: Number(row.ma20),
        ma60: Number(row.ma60)
      }));
    return {
      rows,
      candles: rows.map((row) => ({
        time: row.time,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close
      })),
      volume: rows.map((row) => ({
        time: row.time,
        value: row.volume,
        color: row.close >= row.open ? 'rgba(34, 197, 94, 0.28)' : 'rgba(239, 68, 68, 0.28)'
      })),
      ma5: rows.filter((row) => Number.isFinite(row.ma5)).map((row) => ({ time: row.time, value: row.ma5 })),
      ma20: rows.filter((row) => Number.isFinite(row.ma20)).map((row) => ({ time: row.time, value: row.ma20 })),
      ma60: rows.filter((row) => Number.isFinite(row.ma60)).map((row) => ({ time: row.time, value: row.ma60 }))
    };
  }, [chartData]);

  const dataByTime = useMemo(() => {
    const map = new Map();
    prepared.rows.forEach((row) => map.set(row.time, row));
    return map;
  }, [prepared.rows]);

  const zoneSummaries = useMemo(() => (
    zones
      .map((zone) => ({
        ...zone,
        midPrice: zoneMidPrice(zone),
        color: zoneColor(zone.type)
      }))
      .filter((zone) => Number.isFinite(zone.midPrice))
      .slice(0, 5)
  ), [zones]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || !prepared.candles.length) return undefined;
    let disposed = false;
    let cleanupChart = () => {};

    loadTradingViewLibrary().then((library) => {
      if (disposed) return;
      setChartError('');
      const {
        CandlestickSeries,
        ColorType,
        CrosshairMode,
        HistogramSeries,
        LineSeries,
        LineStyle,
        createChart,
        createSeriesMarkers
      } = library;

      const initialSize = chartContainerSize(element);
      const chart = createChart(element, {
      width: initialSize.width,
      height: initialSize.height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(226, 232, 240, 0.7)',
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.08)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.08)' }
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.26 }
      },
      timeScale: {
        borderVisible: false,
        rightOffset: 8,
        barSpacing: 10,
        minBarSpacing: 4,
        fixLeftEdge: false,
        timeVisible: false
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(148, 163, 184, 0.45)',
          width: 1,
          style: LineStyle.Dotted,
          labelVisible: false
        },
        horzLine: {
          color: 'rgba(148, 163, 184, 0.28)',
          width: 1,
          style: LineStyle.Dotted,
          labelVisible: true
        }
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });
      const resizeObserver = new ResizeObserver(() => {
        const nextSize = chartContainerSize(element);
        chart.applyOptions({ width: nextSize.width, height: nextSize.height });
      });
      resizeObserver.observe(element);

      const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#86efac',
      borderDownColor: '#fca5a5',
      wickUpColor: '#86efac',
      wickDownColor: '#fca5a5',
      priceLineVisible: false,
      lastValueVisible: true
    });
      candleSeries.setData(prepared.candles);

      const ma5Series = chart.addSeries(LineSeries, {
      color: 'rgba(226, 232, 240, 0.82)',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false
    });
      ma5Series.setData(prepared.ma5);

      const ma20Series = chart.addSeries(LineSeries, {
      color: '#60a5fa',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false
    });
      ma20Series.setData(prepared.ma20);

      const ma60Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 1,
      lineStyle: LineStyle.LargeDashed,
      priceLineVisible: false,
      lastValueVisible: false
    });
      ma60Series.setData(prepared.ma60);

      const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      priceLineVisible: false,
      lastValueVisible: false
    });
      volumeSeries.setData(prepared.volume);
      chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 }
    });

      const markerApi = createSeriesMarkers(
      candleSeries,
      events.filter((event) => event?.date).slice(0, 12).map(markerForEvent)
    );

      const priceLines = [];
      const addPriceLine = (price, title, color, style = LineStyle.Dashed) => {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice)) return;
      priceLines.push(candleSeries.createPriceLine({
        price: numericPrice,
        color,
        lineWidth: 1,
        lineStyle: style,
        axisLabelVisible: true,
        title
      }));
    };

      addPriceLine(indicatorSnapshot?.supportLevel, '지지선', '#22c55e');
      addPriceLine(indicatorSnapshot?.resistanceLevel, '저항선', '#ef4444');
      zoneSummaries.forEach((zone) => addPriceLine(zone.midPrice, zone.label || 'AI 구간', zone.color, LineStyle.Dotted));

      chart.subscribeCrosshairMove((param) => {
      if (!param?.time || !param.point) {
        setHover(null);
        return;
      }
      const row = dataByTime.get(String(param.time));
      if (!row) {
        setHover(null);
        return;
      }
      setHover({
        ...row,
        x: param.point.x,
        y: param.point.y,
        event: latestEventForDate(events, row.time)
      });
    });

      chart.timeScale().fitContent();

      cleanupChart = () => {
        resizeObserver.disconnect();
        markerApi.setMarkers([]);
        priceLines.forEach((line) => candleSeries.removePriceLine(line));
        chart.remove();
      };
    }).catch(() => {
      if (!disposed) setChartError('TradingView 차트 라이브러리를 불러오지 못했습니다.');
    });

    return () => {
      disposed = true;
      cleanupChart();
    };
  }, [dataByTime, events, indicatorSnapshot, prepared, zoneSummaries]);

  const latest = prepared.rows[prepared.rows.length - 1];

  return (
    <div className={styles.stage}>
      <div ref={containerRef} className={styles.chart} data-testid="tradingview-price-chart" />
      {chartError && <div className={styles.chartError}>{chartError}</div>}
      <div className={styles.brandBadge}>
        <span>TradingView Lightweight Charts</span>
        <strong>캔들 · 거래량 · MA</strong>
      </div>
      <div className={styles.legend} aria-label="차트 범례">
        <span><i className={styles.candleDot} />캔들</span>
        <span><i className={styles.ma5Dot} />5일선</span>
        <span><i className={styles.ma20Dot} />20일선</span>
        <span><i className={styles.ma60Dot} />60일선</span>
        <span><i className={styles.volumeDot} />거래량</span>
      </div>
      {latest && (
        <div className={styles.latestBar}>
          <span>{latest.time}</span>
          <strong>{formatCurrency(latest.close)}</strong>
          <em>거래량 {formatVolume(latest.volume)}</em>
        </div>
      )}
      {zoneSummaries.length > 0 && (
        <div className={styles.zoneRail} aria-label="AI 거래 구간">
          {zoneSummaries.map((zone) => (
            <div key={`${zone.type}-${zone.label}-${zone.price}`} className={styles.zoneItem}>
              <i style={{ background: zone.color }} />
              <span>{zone.label || 'AI 구간'}</span>
              <strong>{zone.price || formatCurrency(zone.midPrice)}</strong>
            </div>
          ))}
        </div>
      )}
      {hover && (
        <div
          className={styles.tooltip}
          style={{
            left: `clamp(12px, ${hover.x + 18}px, calc(100% - 292px))`,
            top: hover.y > 210 ? `${hover.y - 178}px` : `${hover.y + 18}px`
          }}
        >
          <div className={styles.tooltipDate}>{hover.time}</div>
          <div className={clsx(styles.tooltipPrice, hover.close >= hover.open ? styles.up : styles.down)}>
            {formatCurrency(hover.close)}
          </div>
          <div className={styles.tooltipRows}>
            <span>시가 {formatCurrency(hover.open)}</span>
            <span>고가 {formatCurrency(hover.high)}</span>
            <span>저가 {formatCurrency(hover.low)}</span>
            <span>거래량 {formatVolume(hover.volume)}</span>
          </div>
          <div className={styles.tooltipMa}>
            {Number.isFinite(hover.ma5) && <span>5일선 {formatCurrency(hover.ma5)}</span>}
            {Number.isFinite(hover.ma20) && <span>20일선 {formatCurrency(hover.ma20)}</span>}
            {Number.isFinite(hover.ma60) && <span>60일선 {formatCurrency(hover.ma60)}</span>}
            {learningMode && (
              <button type="button" onClick={() => onTermClick?.('이동평균선')}>
                이동평균선 뜻 보기
              </button>
            )}
          </div>
          {hover.event && (
            <div className={styles.eventNote}>
              <b>{hover.event.title}</b>
              <p>{hover.event.reason || hover.event.explanation || hover.event.desc || '이벤트 근거 확인 필요'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
