import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, ReferenceDot, Area
} from 'recharts';
import { Info, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import styles from './ChartWorkspace.module.css';
import clsx from 'clsx';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={styles.tooltip}>
        <p className={styles.tooltipDate}>{data.date}</p>
        <p className={styles.tooltipPrice}>
          종가: {data.close?.toLocaleString()}원
        </p>
        <p className={styles.tooltipVolume}>
          거래량: {data.volume?.toLocaleString()}
        </p>
        {data.event && (
          <div className={styles.tooltipEvent}>
            <strong>{data.event.title}</strong>
            <p>{data.event.desc}</p>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function ChartWorkspace({ stock, chart, zones, events, ai, interval, onChangeInterval }) {
  
  // Merge chart data with events and zones
  const chartData = useMemo(() => {
    if (!chart?.rows) return [];
    return chart.rows.map(row => {
      const event = events?.find(e => e.date === row.date);
      const zone = zones?.find(z => z.startDate <= row.date && z.endDate >= row.date);
      return {
        ...row,
        event: event || null,
        zone: zone || null,
      };
    });
  }, [chart, events, zones]);

  if (!chartData || chartData.length === 0) {
    return <div className={styles.emptyChart}>차트 데이터가 없습니다.</div>;
  }

  // Calculate min/max for YAxis to add padding
  const minPrice = Math.min(...chartData.map(d => d.close));
  const maxPrice = Math.max(...chartData.map(d => d.close));
  const domainPadding = (maxPrice - minPrice) * 0.1;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.stockInfo}>
          <h2 className={styles.stockName}>{stock.name}</h2>
          <span className={styles.stockCode}>{stock.code}</span>
          <span className={clsx(styles.rate, parseFloat(stock.changeRate) > 0 ? styles.pos : styles.neg)}>
            {parseFloat(stock.changeRate) > 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
            {stock.changeRate}
          </span>
        </div>
        
        <div className={styles.intervalControls}>
          {['daily', 'weekly', 'monthly'].map(intv => (
            <button 
              key={intv}
              className={clsx(styles.intervalBtn, interval === intv && styles.activeInterval)}
              onClick={() => onChangeInterval(intv)}
            >
              {intv === 'daily' ? '일봉' : intv === 'weekly' ? '주봉' : '월봉'}
            </button>
          ))}
        </div>
      </header>

      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              yAxisId="price"
              domain={[minPrice - domainPadding, maxPrice + domainPadding]} 
              hide 
            />
            <YAxis 
              yAxisId="volume"
              orientation="right"
              hide
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            <Area yAxisId="price" type="monotone" dataKey="close" stroke="none" fillOpacity={1} fill="url(#colorClose)" />
            <Line yAxisId="price" type="monotone" dataKey="close" stroke="var(--color-accent)" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: 'var(--color-accent)', stroke: 'var(--color-bg-base)', strokeWidth: 2 }} />
            
            <Bar yAxisId="volume" dataKey="volume" fill="var(--color-border)" barSize={4} />

            {/* AI Custom Annotations / Markers */}
            {chartData.map((entry, index) => {
              if (entry.event) {
                return (
                  <ReferenceDot 
                    key={`event-${index}`}
                    yAxisId="price"
                    x={entry.date} 
                    y={entry.close} 
                    r={5} 
                    fill="var(--color-warning)" 
                    stroke="var(--color-bg-base)"
                    strokeWidth={2}
                  />
                );
              }
              return null;
            })}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Floating AI Hand-drawn style annotations overlay */}
        <div className={styles.aiOverlay}>
          <div className={styles.aiNote}>
            <AlertTriangle size={16} className={styles.aiIcon} />
            <p>
              <strong>AI 포인트</strong>: {ai?.conclusion || '현재 구간의 흐름을 분석 중입니다.'}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={clsx(styles.dot, styles.dotAccent)}></div>
          <span>종가 흐름</span>
        </div>
        <div className={styles.legendItem}>
          <div className={clsx(styles.dot, styles.dotWarning)}></div>
          <span>주요 이벤트/호재/악재</span>
        </div>
        <div className={styles.legendItem}>
          <Info size={14} className={styles.infoIcon} />
          <span>차트를 탭하여 상세 정보를 확인하세요</span>
        </div>
      </div>
    </div>
  );
}
