import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ReferenceDot, ReferenceArea, Label
} from 'recharts';
import clsx from 'clsx';
import styles from './ImmersiveChart.module.css';

function formatCurrency(value) {
  if (!Number.isFinite(Number(value))) return '확인 필요';
  return `${Math.round(Number(value)).toLocaleString()}원`;
}

function getEventLabel(type) {
  if (type === 'positive') return '호재 후보';
  if (type === 'negative') return '악재 후보';
  return '확인 필요';
}

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
            <p className={styles.sourceLimit}>
              {data.event.sourceLimit || '뉴스·공시 원문 확인 전에는 확정 원인으로 보지 않습니다.'}
            </p>
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

export default function ImmersiveChart({ stock, chart, zones, events, ai, indicatorSnapshot, decisionSummary, interval, onChangeInterval, learningMode, onTermClick, children }) {
  const [activePanel, setActivePanel] = useState('none'); // 'none', 'guide', 'ai'
  const [guideTab, setGuideTab] = useState('ma'); // 'ma', 'beginner', 'event'

  const chartData = useMemo(() => {
    if (!chart?.rows) return [];

    const eventsMap = new Map();
    if (events) {
      events.forEach(e => eventsMap.set(e.date, e));
    }

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
      temp[i].event = eventsMap.get(temp[i].date) || null;
    }

    return temp;
  }, [chart, events]);

  if (!chartData || chartData.length === 0) return null;

  const minPrice = Math.min(...chartData.map(d => d.close));
  const maxPrice = Math.max(...chartData.map(d => d.close));
  const padding = (maxPrice - minPrice) * 0.2;
  const latestPoint = chartData[chartData.length - 1];
  const latestMa20 = indicatorSnapshot?.movingAverages?.ma20 || latestPoint?.ma20;
  const priceVsMa20 = indicatorSnapshot?.priceVsMa20?.position
    || (Number.isFinite(latestMa20) && latestPoint?.close >= latestMa20 ? 'above' : 'below');
  const ma20Distance = indicatorSnapshot?.priceVsMa20?.distanceRate;
  const ma20StatusText = priceVsMa20 === 'above'
    ? `현재가 ${formatCurrency(latestPoint?.close)}은 20일선 ${formatCurrency(latestMa20)} 위입니다.`
    : `현재가 ${formatCurrency(latestPoint?.close)}은 20일선 ${formatCurrency(latestMa20)} 아래입니다.`;
  const ma20DistanceText = Number.isFinite(Number(ma20Distance))
    ? `20일선과 약 ${Math.abs(Number(ma20Distance)).toFixed(1)}% 차이`
    : '20일선과의 거리는 데이터 확인 필요';
  const beginnerChecklist = [
    '현재가가 20일선 위인지 아래인지',
    '거래량이 평균보다 늘었는지',
    '저항선 근처에서 밀리는지'
  ];
  const conditionRows = [
    {
      type: 'buy',
      label: '매수 검토',
      short: '20일선 위 + 거래량 증가 확인',
      fallback: decisionSummary?.buyReviewCondition || ai?.buyCondition || '20일선 위 종가 유지와 거래량 재확대가 함께 확인되면 검토합니다.'
    },
    {
      type: 'split',
      label: '분할매수 검토',
      short: '지지선 부근 하락 둔화 확인',
      fallback: '지지선 부근에서 하락 폭이 줄고 거래량 과열이 없으면 나누어 검토합니다.'
    },
    {
      type: 'watch',
      label: '관망',
      short: '거래량 없는 돌파는 보류',
      fallback: decisionSummary?.watchCondition || ai?.waitCondition || '거래량이 동반되지 않거나 전고점 돌파가 확인되지 않으면 관망합니다.'
    },
    {
      type: 'sell',
      label: '매도 검토',
      short: '거래량 둔화와 윗꼬리 반복 확인',
      fallback: decisionSummary?.sellReviewCondition || ai?.sellCondition || '급등 뒤 거래량 둔화와 긴 윗꼬리가 반복되면 검토합니다.'
    },
    {
      type: 'risk',
      label: '리스크 관리',
      short: '지지선 이탈 시 관리 기준 확인',
      fallback: decisionSummary?.riskCondition || ai?.riskCondition || '주요 지지선이 깨지면 리스크 관리 기준을 먼저 확인합니다.'
    }
  ].map((item) => {
    const matched = zones?.find((zone) => zone.type === item.type);
    return {
      ...item,
      price: matched?.price,
      condition: matched?.condition || item.fallback,
      opposite: matched?.oppositeSignal || matched?.invalidationSignal || matched?.opposite
    };
  });
  const visibleEvents = (events || []).slice(0, 2);

  const getZoneColor = (type) => {
    if (type === 'buy' || type === 'split') return 'var(--color-positive)';
    if (type === 'sell' || type === 'risk') return 'var(--color-negative)';
    return 'var(--color-warning)'; // watch
  };

  return (
    <div className={styles.container}>
      <div className={styles.chartWrapper}>
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

            <Line type="monotone" dataKey="ma5" stroke="rgba(255,255,255,0.7)" strokeWidth={1} dot={false} />
            <Line type="monotone" dataKey="ma20" stroke="var(--color-text-secondary)" strokeWidth={1} strokeDasharray="3 3" dot={false} />
            <Line type="monotone" dataKey="ma60" stroke="rgba(245, 158, 11, 0.85)" strokeWidth={1} strokeDasharray="6 5" dot={false} />
            <Line type="monotone" dataKey="close" stroke="var(--color-accent)" strokeWidth={3} dot={false} activeDot={{ r: 8, fill: 'var(--color-accent)', stroke: 'var(--color-bg-base)', strokeWidth: 3 }} />

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
      </div>

      {/* Top Unified Toolbar */}
      <div className={styles.topToolbar}>
        <div className={styles.intervalGroup}>
          {['daily', 'weekly', 'monthly'].map(intv => (
            <button
              type="button"
              key={intv}
              className={clsx(styles.intervalBtn, interval === intv && styles.intervalActive)}
              onClick={() => onChangeInterval(intv)}
              aria-pressed={interval === intv}
            >
              {intv === 'daily' ? '1일' : intv === 'weekly' ? '1주' : '1개월'}
            </button>
          ))}
        </div>

        <div className={styles.actionGroup}>
          <div className={styles.actionItem}>
            <button 
              className={clsx(styles.actionBtn, activePanel === 'guide' && styles.actionBtnActive)}
              onClick={() => setActivePanel(activePanel === 'guide' ? 'none' : 'guide')}
            >
              <span>💡</span> 차트 가이드 <span className={styles.chevron}>▼</span>
            </button>
            {activePanel === 'guide' && (
              <div className={styles.dropdownPanel}>
                <div className={styles.panelTabs}>
                  <button className={clsx(guideTab === 'ma' && styles.activeTab)} onClick={() => setGuideTab('ma')}>이동평균선</button>
                  <button className={clsx(guideTab === 'beginner' && styles.activeTab)} onClick={() => setGuideTab('beginner')}>체크리스트</button>
                  {visibleEvents.length > 0 && <button className={clsx(guideTab === 'event' && styles.activeTab)} onClick={() => setGuideTab('event')}>이벤트 해석</button>}
                </div>
                
                <div className={styles.panelBody}>
                  {guideTab === 'ma' && (
                    <section className={styles.maSection}>
                      <div className={styles.legendGrid}>
                        <span className={styles.legendItem}><i className={styles.priceLine} />현재가</span>
                        <span className={styles.legendItem}><i className={styles.ma5Line} />5일선</span>
                        <span className={styles.legendItem}><i className={styles.ma20Line} />20일선</span>
                        <span className={styles.legendItem}><i className={styles.ma60Line} />60일선</span>
                      </div>
                      <p className={styles.maStatus}>
                        <strong>{ma20StatusText}</strong> {ma20DistanceText}. 위라고 무조건 좋은 것도, 아래라고 무조건 나쁜 것도 아니며 거래량, 지지선, 저항선을 함께 봅니다.
                      </p>
                      <button type="button" className={styles.maDetailButton} onClick={() => onTermClick('이동평균선')}>
                        이동평균선 뜻 보기
                      </button>
                    </section>
                  )}

                  {guideTab === 'beginner' && (
                    <section className={styles.beginnerSection}>
                      <ol className={styles.beginnerList}>
                        {beginnerChecklist.map((item) => <li key={item}>{item}</li>)}
                      </ol>
                      <p className={styles.subtext}>반대 신호가 나오면 결론을 보류하고 다음 거래량과 종가를 다시 확인합니다.</p>
                    </section>
                  )}

                  {guideTab === 'event' && (
                    <section className={styles.eventSection}>
                      {visibleEvents.map((event) => (
                        <article key={event.id || `${event.date}-${event.title}`} className={styles.eventItem}>
                          <div className={styles.eventHeader}>
                            <span className={clsx(styles.eventBadge, event.type === 'positive' ? styles.badgePos : event.type === 'negative' ? styles.badgeNeg : styles.badgeNeutral)}>
                              {getEventLabel(event.type)}
                            </span>
                            <strong>{event.title}</strong>
                          </div>
                          <p className={styles.subtext}>
                            <strong>{event.type === 'positive' ? '호재 판단 이유: ' : event.type === 'negative' ? '악재 판단 이유: ' : '판단 이유: '}</strong>
                            {event.reason || event.desc || 'AI가 시장 반응과 거래량을 종합해 주요 이벤트로 판단했습니다.'}
                          </p>
                          {event.opposite && <p className={styles.subtext} style={{marginTop: 4, opacity: 0.8}}>반대 해석: {event.opposite}</p>}
                        </article>
                      ))}
                    </section>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles.actionItem}>
            <button 
              className={clsx(styles.actionBtn, activePanel === 'ai' && styles.actionBtnActive)}
              onClick={() => setActivePanel(activePanel === 'ai' ? 'none' : 'ai')}
            >
              <span>🤖</span> AI 검토 조건 <span className={styles.chevron}>▼</span>
            </button>
            {activePanel === 'ai' && (
              <div className={clsx(styles.dropdownPanel, styles.dropdownRight)}>
                <div className={styles.conditionGrid}>
                  {conditionRows.map((row) => (
                    <article key={row.type} className={clsx(styles.conditionItem, styles[`condition-${row.type}`])}>
                      <div className={styles.conditionHeader}>
                        <strong>{row.label}</strong>
                        {row.price && <span>{row.price}</span>}
                      </div>
                      <p className={styles.conditionDetail}>{row.condition}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* External unified controls (Learning Mode, Portfolio, etc.) */}
          {children}
        </div>
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
