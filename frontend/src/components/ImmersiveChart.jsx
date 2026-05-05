import React, { useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ReferenceDot, ReferenceArea, Label
} from 'recharts';
import clsx from 'clsx';
import styles from './ImmersiveChart.module.css';

function CustomTooltip({ active, payload, learningMode, onTermClick }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipDate}>{data.date}</div>
        <div className={styles.tooltipPrice}>
          {data.close.toLocaleString()}원
        </div>
        <div className={styles.tooltipVolume}>
          거래량 {data.volume.toLocaleString()}
          {learningMode && (
            <div
              className={styles.learningTooltip}
              onClick={() => onTermClick('거래량')}
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
            >
              <strong>거래량이란?</strong> 주식이 거래된 수량. 급증하면 추세 변화 신호일 수 있습니다. (자세히 보기)
            </div>
          )}
        </div>

        {(data.ma5 || data.ma20 || data.ma60) && (
          <div className={styles.tooltipMa}>
            {data.ma5 && <span>5일선 {Math.round(data.ma5).toLocaleString()}원</span>}
            {data.ma20 && <span>20일선 {Math.round(data.ma20).toLocaleString()}원</span>}
            {data.ma60 && <span>60일선 {Math.round(data.ma60).toLocaleString()}원</span>}
            {learningMode && (
              <button type="button" className={styles.termLink} onClick={() => onTermClick('이동평균선')}>
                이동평균선 자세히
              </button>
            )}
          </div>
        )}

        {data.event && (
          <div className={styles.tooltipEvent}>
            <span className={clsx(styles.eventBadge, data.event.type === 'positive' ? styles.badgePos : data.event.type === 'negative' ? styles.badgeNeg : styles.badgeNeutral)}>
              {data.event.type === 'positive' ? '호재' : data.event.type === 'negative' ? '악재' : '확인 필요'}
            </span>
            <strong>{data.event.title}</strong>
            <p>{data.event.reason || data.event.desc}</p>
            {data.event.opposite && <p className={styles.oppositeSignal}>반대 신호: {data.event.opposite}</p>}
            {data.event.confidence && <p className={styles.confidenceInfo}>{data.event.confidence}</p>}
          </div>
        )}
      </div>
    );
  }
  return null;
}

// "86,000~88,500원" -> [86000, 88500]
// "90,000원 이상" -> [90000, 999999]
// "82,000원 이탈" -> [0, 82000]
function parsePriceRange(priceStr) {
  if (!priceStr) return null;
  const numbers = priceStr.replace(/,/g, '').match(/\d+/g);
  if (!numbers) return null;

  if (priceStr.includes('이상')) return [parseInt(numbers[0], 10), 9999999];
  if (priceStr.includes('이하') || priceStr.includes('이탈')) return [0, parseInt(numbers[0], 10)];
  if (numbers.length >= 2) return [parseInt(numbers[0], 10), parseInt(numbers[1], 10)];

  const val = parseInt(numbers[0], 10);
  return [val - val * 0.02, val + val * 0.02]; // fallback 2% band
}

export default function ImmersiveChart({ stock, chart, zones, events, ai, indicatorSnapshot, interval, onChangeInterval, learningMode, onTermClick }) {

  const chartData = useMemo(() => {
    if (!chart?.rows) return [];

    // Compute moving averages used by the visual chart layer.
    let temp = chart.rows.map(row => ({ ...row }));
    for (let i = 0; i < temp.length; i++) {
      if (i >= 4) {
        let sum = 0;
        for (let j = 0; j < 5; j++) sum += temp[i - j].close;
        temp[i].ma5 = sum / 5;
      }
      if (i >= 19) {
        let sum = 0;
        for (let j = 0; j < 20; j++) sum += temp[i - j].close;
        temp[i].ma20 = sum / 20;
      }
      if (i >= 59) {
        let sum = 0;
        for (let j = 0; j < 60; j++) sum += temp[i - j].close;
        temp[i].ma60 = sum / 60;
      }
    }

    return temp.map(row => {
      const event = events?.find(e => e.date === row.date);
      return {
        ...row,
        event: event || null,
      };
    });
  }, [chart, events]);

  if (!chartData || chartData.length === 0) return null;

  const minPrice = Math.min(...chartData.map(d => d.close));
  const maxPrice = Math.max(...chartData.map(d => d.close));
  const padding = (maxPrice - minPrice) * 0.2;

  const getZoneColor = (type) => {
    if (type === 'buy' || type === 'split') return 'var(--color-positive)';
    if (type === 'sell' || type === 'risk') return 'var(--color-negative)';
    return 'var(--color-warning)'; // watch
  };

  return (
    <div className={styles.container}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 112, right: 28, left: 28, bottom: 56 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={[minPrice - padding, maxPrice + padding]} hide />

          <Tooltip
            content={<CustomTooltip learningMode={learningMode} onTermClick={onTermClick} />}
            cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
            isAnimationActive={false}
          />

          {/* AI Zones as Horizontal Bands */}
          {zones && zones.map((zone, idx) => {
            const range = parsePriceRange(zone.price);
            if (!range) return null;
              const color = getZoneColor(zone.type);
            // Limit Y values so they don't paint over the entire screen infinitely
            const safeY1 = Math.max(range[0], minPrice - padding);
            const safeY2 = Math.min(range[1], maxPrice + padding);

            return (
              <ReferenceArea
                key={idx}
                y1={safeY1}
                y2={safeY2}
                fill={color}
                fillOpacity={0.05}
                strokeOpacity={0}
              >
                <Label
                  value={zone.label}
                  position="insideLeft"
                  fill={color}
                  fontSize={11}
                  fontWeight="bold"
                  offset={10}
                  opacity={0.8}
                />
              </ReferenceArea>
            );
          })}

          <Area type="monotone" dataKey="close" stroke="none" fill="url(#chartGradient)" />

          {/* Moving Average Lines */}
          <Line
            type="monotone"
            dataKey="ma5"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={1}
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="ma20"
            stroke="var(--color-text-secondary)"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="ma60"
            stroke="rgba(245, 158, 11, 0.85)"
            strokeWidth={1}
            strokeDasharray="6 5"
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="close"
            stroke="var(--color-accent)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 8, fill: 'var(--color-accent)', stroke: 'var(--color-bg-base)', strokeWidth: 3 }}
          />

          {/* Event Dots */}
          {chartData.map((entry, idx) => {
            if (entry.event) {
              const color = entry.event.type === 'positive' ? 'var(--color-positive)' : entry.event.type === 'negative' ? 'var(--color-negative)' : 'var(--color-warning)';
              return (
                <ReferenceDot
                  key={idx}
                  x={entry.date}
                  y={entry.close}
                  r={6}
                  fill={color}
                  stroke="var(--color-bg-base)"
                  strokeWidth={2}
                />
              );
            }
            return null;
          })}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Interval Selector Overlaid on Chart */}
      <div className={styles.intervalSelector}>
        {['daily', 'weekly', 'monthly'].map(intv => (
          <button
            key={intv}
            className={clsx(styles.intervalBtn, interval === intv && styles.intervalActive)}
            onClick={() => onChangeInterval(intv)}
          >
            {intv === 'daily' ? '1일' : intv === 'weekly' ? '1주' : '1월'}
          </button>
        ))}
        {learningMode && (
          <div className={styles.learningTooltipSelector}>
            <strong>캔들 주기(봉)</strong>: 주가의 흐름을 묶어서 보는 단위입니다.
          </div>
        )}
      </div>

      {/* Hero Stock Info */}
      <div className={styles.heroInfo}>
        <div className={styles.heroCode}>{stock.code}</div>
        <h1 className={styles.heroName}>{stock.name}</h1>
        <div className={clsx(styles.heroRate, parseFloat(stock.changeRate) > 0 ? styles.pos : styles.neg)}>
          {stock.changeRate}
        </div>
      </div>

      {indicatorSnapshot?.beginnerSummary && (
        <button type="button" className={styles.indicatorSummary} onClick={() => onTermClick('이동평균선')}>
          {indicatorSnapshot.beginnerSummary}
        </button>
      )}
    </div>
  );
}
