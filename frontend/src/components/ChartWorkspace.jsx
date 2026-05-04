import { useEffect, useMemo, useRef, useState } from "react";
import { CandlestickSeries, createChart, HistogramSeries, LineSeries } from "lightweight-charts";
import { AlertTriangle, BadgeCheck, CircleDollarSign, Info, ShieldAlert, TrendingUp } from "lucide-react";

const zoneMeta = {
  buy_watch: { className: "buy", icon: CircleDollarSign, short: "매수 검토" },
  split_buy: { className: "split", icon: BadgeCheck, short: "분할매수" },
  hold: { className: "hold", icon: Info, short: "관망" },
  sell_watch: { className: "sell", icon: TrendingUp, short: "매도 검토" },
  risk: { className: "risk", icon: ShieldAlert, short: "리스크" }
};

const annotationPositions = [
  { left: 13, top: 22 },
  { left: 37, top: 13 },
  { left: 58, top: 28 },
  { left: 74, top: 15 },
  { left: 69, top: 55 }
];

function ma(rows, period) {
  return rows
    .map((row, index) => {
      if (index + 1 < period) return null;
      const slice = rows.slice(index + 1 - period, index + 1);
      const value = slice.reduce((sum, item) => sum + Number(item.close || 0), 0) / period;
      return { time: row.date, value: Math.round(value) };
    })
    .filter(Boolean);
}

function formatPrice(value) {
  if (value == null) return "-";
  return Number(value).toLocaleString("ko-KR");
}

function formatVolume(value) {
  if (!value) return "-";
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`;
  if (value >= 10000) return `${Math.round(value / 10000).toLocaleString("ko-KR")}만`;
  return Number(value).toLocaleString("ko-KR");
}

function latestMa(rows, period) {
  const values = ma(rows, period);
  return values[values.length - 1]?.value || 0;
}

function calcRsi(rows, period = 14) {
  if (rows.length < period + 1) return 50;
  const slice = rows.slice(-period - 1);
  let gain = 0;
  let loss = 0;
  for (let index = 1; index < slice.length; index += 1) {
    const diff = Number(slice[index].close) - Number(slice[index - 1].close);
    if (diff >= 0) gain += diff;
    else loss += Math.abs(diff);
  }
  if (!loss) return 74;
  const rs = gain / loss;
  return Math.max(0, Math.min(100, 100 - 100 / (1 + rs)));
}

function calcObv(rows) {
  return rows.reduce((value, row, index) => {
    if (index === 0) return 0;
    const prev = rows[index - 1];
    if (Number(row.close) > Number(prev.close)) return value + Number(row.volume || 0);
    if (Number(row.close) < Number(prev.close)) return value - Number(row.volume || 0);
    return value;
  }, 0);
}

function indicatorItems(rows) {
  if (!rows.length) return [];
  const latest = rows[rows.length - 1];
  const previous = rows[rows.length - 2] || latest;
  const ma5 = latestMa(rows, 5);
  const ma20 = latestMa(rows, 20);
  const rsi = calcRsi(rows);
  const macdLike = ma5 && ma20 ? ((ma5 - ma20) / ma20) * 100 : 0;
  const volumeRate =
    previous.volume && latest.volume ? ((Number(latest.volume) - Number(previous.volume)) / Number(previous.volume)) * 100 : 0;
  const obv = calcObv(rows);

  return [
    {
      label: "거래량",
      value: formatVolume(Number(latest.volume || 0)),
      helper: `${volumeRate >= 0 ? "+" : ""}${volumeRate.toFixed(1)}%`,
      tone: volumeRate >= 0 ? "up" : "down",
      note: "가격 움직임에 실제 참여가 붙었는지 확인합니다."
    },
    {
      label: "RSI",
      value: rsi.toFixed(1),
      helper: rsi >= 70 ? "과열 근접" : rsi >= 55 ? "상승 힘 유지" : "중립",
      tone: rsi >= 70 ? "warn" : "up",
      note: "높다고 바로 매도하지 말고 추세와 거래량을 같이 봅니다."
    },
    {
      label: "MACD",
      value: `${macdLike >= 0 ? "+" : ""}${macdLike.toFixed(2)}%`,
      helper: macdLike >= 0 ? "모멘텀 개선" : "모멘텀 둔화",
      tone: macdLike >= 0 ? "up" : "down",
      note: "방향 전환 가능성을 보되, 늦게 반응할 수 있습니다."
    },
    {
      label: "OBV",
      value: formatVolume(Math.abs(obv)),
      helper: obv >= 0 ? "수급 우상향" : "수급 약화",
      tone: obv >= 0 ? "up" : "down",
      note: "가격이 오를 때 거래량이 같이 붙는지 보는 보조 신호입니다."
    }
  ];
}

function zonePercent(zone, min, max) {
  const top = Math.max(zone.fromPrice || min, zone.toPrice || min);
  const bottom = Math.min(zone.fromPrice || max, zone.toPrice || max);
  const span = Math.max(1, max - min);
  return {
    top: `${Math.max(2, ((max - top) / span) * 72 + 10)}%`,
    height: `${Math.max(5, ((top - bottom) / span) * 72)}%`
  };
}

function IndicatorBoard({ rows }) {
  const items = useMemo(() => indicatorItems(rows), [rows]);
  return (
    <div className="indicatorBoard" aria-label="차트 보조지표 요약">
      {items.map((item) => (
        <article key={item.label} className={item.tone}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <small>{item.helper}</small>
          <p>{item.note}</p>
        </article>
      ))}
    </div>
  );
}

function DecisionBoard({ zones, meta }) {
  return (
    <div className="decisionBoard" aria-label="조건형 매수 매도 검토표">
      {zones.slice(0, 5).map((zone) => {
        const metaInfo = zoneMeta[zone.type] || zoneMeta.hold;
        const Icon = metaInfo.icon || Info;
        return (
          <article key={`${zone.type}-${zone.fromPrice}`} className={metaInfo.className}>
            <div>
              <Icon size={16} aria-hidden="true" />
              <strong>{zone.label}</strong>
              <small>{formatPrice(zone.fromPrice)}원부터 {formatPrice(zone.toPrice)}원</small>
            </div>
            <p>{zone.condition}</p>
            <em>반대 신호: {zone.oppositeSignal}</em>
            <small>기준일 {zone.basisDate || meta.asOf} · 신뢰도 {zone.confidence || meta.confidence}</small>
          </article>
        );
      })}
    </div>
  );
}

export function ChartWorkspace({ selected, chart, zones, events, meta }) {
  const chartRef = useRef(null);
  const apiRef = useRef(null);
  const [activeNote, setActiveNote] = useState(null);
  const [timeframe, setTimeframe] = useState("일봉");

  const sourceRows = useMemo(() => chart?.data || [], [chart?.data]);
  const rows = useMemo(() => {
    if (timeframe === "주봉") {
      return sourceRows.filter((_, index) => index % 2 === 0 || index === sourceRows.length - 1);
    }
    if (timeframe === "월봉") {
      return sourceRows.filter((_, index) => index % 4 === 0 || index === sourceRows.length - 1);
    }
    return sourceRows;
  }, [sourceRows, timeframe]);
  const priceRange = useMemo(() => {
    if (!rows.length) return { min: 0, max: 1 };
    return rows.reduce(
      (acc, row) => ({
        min: Math.min(acc.min, Number(row.low || row.close || acc.min)),
        max: Math.max(acc.max, Number(row.high || row.close || acc.max))
      }),
      { min: Number(rows[0].low || rows[0].close), max: Number(rows[0].high || rows[0].close) }
    );
  }, [rows]);

  const latest = rows[rows.length - 1];
  const first = rows[0];
  const rate =
    latest && first ? (((Number(latest.close) - Number(first.open)) / Number(first.open)) * 100).toFixed(2) : "0.00";

  useEffect(() => {
    if (!chartRef.current || !rows.length) return undefined;

    const chartApi = createChart(chartRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: "#6b7280",
        fontFamily: "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif"
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: "rgba(148, 163, 184, 0.16)" }
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.24 }
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
        secondsVisible: false,
        rightOffset: 2
      },
      crosshair: {
        mode: 1
      }
    });

    const candleSeries = chartApi.addSeries(CandlestickSeries, {
      upColor: "#ef4444",
      downColor: "#2563eb",
      borderVisible: false,
      wickUpColor: "#ef4444",
      wickDownColor: "#2563eb"
    });
    candleSeries.setData(
      rows.map((row) => ({
        time: row.date,
        open: Number(row.open),
        high: Number(row.high),
        low: Number(row.low),
        close: Number(row.close)
      }))
    );

    const volumeSeries = chartApi.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      color: "rgba(37, 99, 235, 0.28)"
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 }
    });
    volumeSeries.setData(
      rows.map((row) => ({
        time: row.date,
        value: Number(row.volume || 0),
        color: Number(row.close) >= Number(row.open) ? "rgba(239, 68, 68, 0.34)" : "rgba(37, 99, 235, 0.34)"
      }))
    );

    chartApi.addSeries(LineSeries, { color: "#0f766e", lineWidth: 2, priceLineVisible: false }).setData(ma(rows, 5));
    chartApi.addSeries(LineSeries, { color: "#7c3aed", lineWidth: 2, priceLineVisible: false }).setData(ma(rows, 20));
    chartApi.timeScale().fitContent();
    apiRef.current = chartApi;

    return () => {
      chartApi.remove();
      apiRef.current = null;
    };
  }, [rows]);

  const annotations = useMemo(() => {
    const zoneItems = zones?.zones?.length ? zones.zones : [];
    const eventItems = events?.events?.length ? events.events : [];
    return zoneItems.slice(0, 5).map((zone, index) => {
      const event = eventItems[index % Math.max(1, eventItems.length)];
      return {
        ...zone,
        ...annotationPositions[index],
        event,
        id: `${zone.type}-${index}`
      };
    });
  }, [events?.events, zones?.zones]);

  const eventPins = useMemo(
    () =>
      (events?.events || []).slice(0, 4).map((event, index) => ({
        ...event,
        left: [23, 43, 63, 82][index] || 70,
        top: event.type === "negative" ? 66 : 47
      })),
    [events?.events]
  );

  return (
    <section className="chartWorkspace" aria-labelledby="chart-title">
      <div className="chartHeader">
        <div>
          <span className="eyebrow">차트 위 AI 주석</span>
          <h2 id="chart-title">
            {selected.name}
            <small>{selected.code}</small>
          </h2>
        </div>
        <div className="chartTools">
          <div className="timeframeControl" aria-label="차트 기간 선택">
            {["일봉", "주봉", "월봉"].map((frame) => (
              <button
                key={frame}
                type="button"
                className={timeframe === frame ? "active" : ""}
                onClick={() => setTimeframe(frame)}
              >
                {frame}
              </button>
            ))}
          </div>
          <div className="priceDigest" aria-label="가격 요약">
            <strong>{formatPrice(latest?.close)}원</strong>
            <span className={Number(rate) >= 0 ? "up" : "down"}>{Number(rate) >= 0 ? "+" : ""}{rate}%</span>
            <small>기준일 {meta.asOf}</small>
          </div>
        </div>
      </div>

      <div className="chartFrame">
        <div className="zoneLayer" aria-hidden="true">
          {(zones?.zones || []).map((zone) => {
            const style = zonePercent(zone, priceRange.min, priceRange.max);
            const metaInfo = zoneMeta[zone.type] || zoneMeta.hold;
            return (
              <span
                key={`${zone.type}-${zone.fromPrice}`}
                className={`zoneBand ${metaInfo.className}`}
                style={style}
              />
            );
          })}
        </div>
        <div className="realChart" ref={chartRef} aria-label={`${selected.name} ${timeframe} 차트`} />

        <div className="annotationLayer">
          {annotations.map((note) => {
            const metaInfo = zoneMeta[note.type] || zoneMeta.hold;
            const Icon = metaInfo.icon || AlertTriangle;
            return (
              <button
                key={note.id}
                type="button"
                className={`chartNote ${metaInfo.className}`}
                style={{ left: `${note.left}%`, top: `${note.top}%` }}
                onMouseEnter={() => setActiveNote(note)}
                onFocus={() => setActiveNote(note)}
                onClick={() => setActiveNote(note)}
              >
                <Icon size={14} aria-hidden="true" />
                <span>{note.label}</span>
              </button>
            );
          })}
        </div>

        <div className="eventLayer" aria-label="호재 악재 이벤트 마커">
          {eventPins.map((event) => (
            <button
              key={`${event.date}-${event.title}`}
              type="button"
              className={`eventPin ${event.type === "negative" ? "bad" : "good"}`}
              style={{ left: `${event.left}%`, top: `${event.top}%` }}
              onMouseEnter={() =>
                setActiveNote({
                  label: event.type === "negative" ? "악재 마커" : "호재 마커",
                  condition: event.title,
                  evidence: event.explanation,
                  oppositeSignal:
                    event.type === "negative"
                      ? "재돌파와 거래대금 회복이 나오면 악재 영향은 줄어들 수 있습니다."
                      : "호재에도 거래량이 줄고 전고점을 못 넘으면 관망합니다.",
                  beginnerExplanation: "뉴스만 보지 말고 차트에서 가격과 거래량이 같은 방향으로 확인되는지 봅니다.",
                  confidence: event.causalScores?.[0]?.confidence || meta.confidence,
                  basisDate: event.date
                })
              }
              onFocus={() =>
                setActiveNote({
                  label: event.type === "negative" ? "악재 마커" : "호재 마커",
                  condition: event.title,
                  evidence: event.explanation,
                  oppositeSignal:
                    event.type === "negative"
                      ? "재돌파와 거래대금 회복이 나오면 악재 영향은 줄어들 수 있습니다."
                      : "호재에도 거래량이 줄고 전고점을 못 넘으면 관망합니다.",
                  beginnerExplanation: "뉴스만 보지 말고 차트에서 가격과 거래량이 같은 방향으로 확인되는지 봅니다.",
                  confidence: event.causalScores?.[0]?.confidence || meta.confidence,
                  basisDate: event.date
                })
              }
            >
              {event.type === "negative" ? "악재" : "호재"}
            </button>
          ))}
        </div>

        <div className={`chartTooltip ${activeNote ? "visible" : ""}`} role="tooltip">
          {activeNote ? (
            <>
              <strong>{activeNote.label}</strong>
              <p>{activeNote.condition}</p>
              <dl>
                <div>
                  <dt>왜 움직였나</dt>
                  <dd>{activeNote.event?.explanation || activeNote.evidence}</dd>
                </div>
                <div>
                  <dt>반대 신호</dt>
                  <dd>{activeNote.oppositeSignal}</dd>
                </div>
                <div>
                  <dt>초보자 설명</dt>
                  <dd>{activeNote.beginnerExplanation}</dd>
                </div>
              </dl>
              <small>
                기준일 {activeNote.basisDate || meta.asOf} · 신뢰도 {activeNote.confidence || meta.confidence}
              </small>
            </>
          ) : (
            <>
              <strong>조건형 해석 대기</strong>
              <p>매수 검토, 관망, 매도 검토, 리스크 조건을 함께 표시합니다.</p>
            </>
          )}
        </div>
      </div>

      <IndicatorBoard rows={rows} />

      <div className="chartLegend" aria-label="차트 범례">
        <span><i className="line ma5" />5일선</span>
        <span><i className="line ma20" />20일선</span>
        <span><i className="band buy" />매수 검토</span>
        <span><i className="band sell" />매도 검토</span>
        <span><i className="band risk" />리스크 관리</span>
        <span><i className="dot good" />호재·뉴스</span>
        <span><i className="dot bad" />악재·공시</span>
      </div>

      <DecisionBoard zones={zones?.zones || []} meta={meta} />

      <div className="chartSummaryGrid">
        {(zones?.evidence || []).slice(0, 3).map((item) => (
          <article key={item}>
            <strong>{item}</strong>
            <p>가격, 거래량, 이동평균선을 함께 확인하는 교육용 근거입니다.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
