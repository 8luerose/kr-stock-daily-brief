import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ReferenceDot, ReferenceArea, ReferenceLine, Label 
} from 'recharts';
import clsx from 'clsx';
import styles from './ImmersiveChart.module.css';

function CustomTooltip({ active, payload, learningMode }) {
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
            <div className={styles.learningTooltip}>
              <strong>거래량이란?</strong> 주식이 거래된 수량. 급증하면 추세 변화 신호일 수 있습니다.
            </div>
          )}
        </div>
        
        {data.event && (
          <div className={styles.tooltipEvent}>
            <span className={clsx(styles.eventBadge, data.event.type === 'positive' ? styles.badgePos : styles.badgeNeg)}>
              {data.event.type === 'positive' ? '호재' : '악재'}
            </span>
            <strong>{data.event.title}</strong>
            <p>{data.event.desc}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function ImmersiveChart({ stock, chart, zones, events, ai, interval, onChangeInterval, learningMode }) {
  
  const chartData = useMemo(() => {
    if (!chart?.rows) return [];
    return chart.rows.map(row => {
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

  // Mock annotations if zones not fully provided
  const buyZoneStart = chartData.length > 20 ? chartData[chartData.length - 15].date : null;
  const buyZoneEnd = chartData.length > 5 ? chartData[chartData.length - 5].date : null;
  const resistancePrice = maxPrice - (maxPrice - minPrice) * 0.1;

  return (
    <div className={styles.container}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 100, right: 0, left: 0, bottom: 50 }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="buyZoneGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-positive)" stopOpacity={0.15}/>
              <stop offset="100%" stopColor="var(--color-positive)" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="date" hide />
          <YAxis domain={[minPrice - padding, maxPrice + padding]} hide />
          
          <Tooltip 
            content={<CustomTooltip learningMode={learningMode} />} 
            cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
            isAnimationActive={false}
          />

          {/* AI Annotations: Reference Areas */}
          {buyZoneStart && buyZoneEnd && (
            <ReferenceArea x1={buyZoneStart} x2={buyZoneEnd} fill="url(#buyZoneGradient)" strokeOpacity={0}>
               <Label value="매수 검토 구간" position="insideTopLeft" fill="var(--color-positive)" fontSize={12} fontWeight="bold" offset={10} />
            </ReferenceArea>
          )}

          {/* AI Annotations: Reference Lines */}
          <ReferenceLine y={resistancePrice} stroke="var(--color-warning)" strokeDasharray="3 3" strokeOpacity={0.5}>
            <Label value="단기 저항선" position="insideTopLeft" fill="var(--color-warning)" fontSize={11} offset={5} />
          </ReferenceLine>
          
          <Area type="monotone" dataKey="close" stroke="none" fill="url(#chartGradient)" />
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
              const color = entry.event.type === 'positive' ? 'var(--color-positive)' : 'var(--color-negative)';
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
    </div>
  );
}
