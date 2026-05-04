import { Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

const intervals = [
  { id: "daily", label: "일봉" },
  { id: "weekly", label: "주봉" },
  { id: "monthly", label: "월봉" }
];

function formatPrice(value) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function movingAverage(rows, period) {
  return rows.map((row, index) => {
    const start = Math.max(0, index - period + 1);
    const slice = rows.slice(start, index + 1);
    const close = slice.reduce((sum, item) => sum + item.close, 0) / slice.length;
    return { ...row, close };
  });
}

function buildPoints(rows, width, height, top = 34, bottom = 92) {
  const minPrice = Math.min(...rows.map((row) => row.low)) * 0.985;
  const maxPrice = Math.max(...rows.map((row) => row.high)) * 1.015;
  const chartHeight = height - top - bottom;
  return rows.map((row, index) => {
    const x = 42 + (index / Math.max(rows.length - 1, 1)) * (width - 94);
    const y = top + (1 - (row.close - minPrice) / (maxPrice - minPrice || 1)) * chartHeight;
    return { ...row, x, y };
  });
}

function toPolyline(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function ChartWorkspace({ interval, onIntervalChange, workspace, mode }) {
  const [activeNote, setActiveNote] = useState("move");
  const rows = workspace.chart.rows;
  const width = 920;
  const height = 460;
  const points = useMemo(() => buildPoints(rows, width, height), [rows]);
  const ma20 = useMemo(() => buildPoints(movingAverage(rows, 5), width, height), [rows]);
  const ma60 = useMemo(() => buildPoints(movingAverage(rows, 9), width, height), [rows]);
  const latest = rows[rows.length - 1];
  const first = rows[0];
  const change = ((latest.close - first.close) / first.close) * 100;
  const maxVolume = Math.max(...rows.map((row) => row.volume));
  const volumeBars = points.map((point) => ({
    x: point.x,
    h: Math.max(8, (point.volume / maxVolume) * 58),
    up: point.close >= point.open
  }));

  const notes = [
    {
      id: "move",
      x: 65,
      y: 26,
      label: "왜 올랐나",
      title: "거래량이 붙은 상승",
      body: "3월 초 돌파 구간에서 가격과 거래량이 같이 움직였습니다. 초보자는 가격만 보지 말고 아래 거래량 막대가 커졌는지 같이 봅니다.",
      icon: TrendingUp
    },
    {
      id: "pullback",
      x: 48,
      y: 48,
      label: "왜 쉬었나",
      title: "전고점 근처 관망",
      body: "상단 가격대에서 거래량이 줄면 호재가 있어도 속도 조절이 나올 수 있습니다. 전고점을 넘는 종가 확인이 필요합니다.",
      icon: Activity
    },
    {
      id: "risk",
      x: 24,
      y: 63,
      label: "리스크",
      title: "지지선 이탈 확인",
      body: "82,000원 부근 지지선이 반복 이탈하면 먼저 방어 기준을 세웁니다. 반대로 빠르게 회복하면 다시 평가합니다.",
      icon: AlertTriangle
    }
  ];

  const active = notes.find((note) => note.id === activeNote) || notes[0];
  const ActiveIcon = active.icon;

  return (
    <section className="chartWorkspace" aria-label="AI 차트 해석">
      <div className="chartHeader">
        <div>
          <span className="eyebrow">AI 차트 주석</span>
          <h2>{workspace.stock.name} 흐름</h2>
          <p>{workspace.ai.conclusion}</p>
        </div>
        <div className="timeSegment" aria-label="차트 주기">
          {intervals.map((item) => (
            <button
              key={item.id}
              className={interval === item.id ? "selected" : ""}
              type="button"
              aria-pressed={interval === item.id}
              onClick={() => onIntervalChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chartFrame">
        <svg className="priceChart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="가격, 거래량, AI 주석 차트">
          <defs>
            <linearGradient id="priceFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#3182f6" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#3182f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((line) => (
            <line
              className="gridLine"
              key={line}
              x1="42"
              x2="872"
              y1={58 + line * 78}
              y2={58 + line * 78}
            />
          ))}

          <rect className="zone buy" x="598" y="130" width="132" height="82" rx="6" />
          <rect className="zone watch" x="730" y="108" width="86" height="106" rx="6" />
          <rect className="zone risk" x="110" y="252" width="130" height="62" rx="6" />
          <text className="zoneText" x="606" y="122">매수 검토</text>
          <text className="zoneText" x="738" y="100">관망</text>
          <text className="zoneText" x="118" y="244">리스크 관리</text>

          <polygon className="area" points={`${toPolyline(points)} 872,368 42,368`} />
          <polyline className="priceLine" points={toPolyline(points)} />
          <polyline className="maLine blue" points={toPolyline(ma20)} />
          <polyline className="maLine amber" points={toPolyline(ma60)} />

          {points.map((point, index) => (
            <circle className={point.close >= point.open ? "candle up" : "candle down"} key={point.date} cx={point.x} cy={point.y} r={index % 3 === 0 ? 4.5 : 3.2} />
          ))}

          {volumeBars.map((bar, index) => (
            <rect
              className={bar.up ? "volumeBar up" : "volumeBar down"}
              key={`${points[index].date}-volume`}
              x={bar.x - 7}
              y={388 - bar.h}
              width="10"
              height={bar.h}
              rx="3"
            />
          ))}

          <path className="handArrow" d="M680 92 C646 100 622 118 606 146" />
          <path className="handArrow" d="M426 186 C452 196 488 200 518 188" />
          <path className="handArrow" d="M214 238 C186 250 164 266 146 290" />
          <text className="handLabel" x="674" y="84">전고점 재돌파 확인</text>
          <text className="handLabel" x="382" y="178">거래량 둔화, 잠시 관망</text>
          <text className="handLabel" x="120" y="232">지지선이 기준</text>

          <text className="axisLabel" x="42" y="424">거래량</text>
          <text className="axisLabel" x="770" y="424">RSI 62 · MACD 개선 · OBV 우상향</text>
        </svg>

        {notes.map((note) => (
          <button
            className={`chartNote ${activeNote === note.id ? "active" : ""}`}
            key={note.id}
            type="button"
            style={{ left: `${note.x}%`, top: `${note.y}%` }}
            onClick={() => setActiveNote(note.id)}
            onFocus={() => setActiveNote(note.id)}
            aria-label={`${note.label} 설명 보기`}
          >
            {note.label}
          </button>
        ))}

        <div className="chartTooltip visible" style={{ left: `${active.x}%`, top: `${active.y}%` }}>
          <ActiveIcon size={16} />
          <strong>{active.title}</strong>
          <span>{active.body}</span>
        </div>
      </div>

      <div className="chartFooter">
        <span>{formatPrice(latest.close)} · {change.toFixed(1)}%</span>
        <span>기준일 {workspace.asOf}</span>
        <span>{workspace.source}</span>
      </div>

      <div className="zoneBoard" aria-label="매수와 매도 검토 조건">
        {workspace.zones.slice(0, mode === "practice" ? 5 : 3).map((zone) => (
          <article className={`zoneCard ${zone.type}`} key={zone.id || zone.label}>
            <strong>{zone.label}</strong>
            <span>{zone.price || `${zone.fromPrice?.toLocaleString("ko-KR")}~${zone.toPrice?.toLocaleString("ko-KR")}원`}</span>
            <p>{zone.condition}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
