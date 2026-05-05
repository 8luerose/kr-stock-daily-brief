import { Activity, AlertTriangle, CheckCircle2, CircleHelp, Newspaper, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { fallbackWorkspace } from "../data/fallbackData.js";

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

function buildPoints(rows, width, height, top = 64, bottom = 102) {
  const minPrice = Math.min(...rows.map((row) => row.low)) * 0.985;
  const maxPrice = Math.max(...rows.map((row) => row.high)) * 1.012;
  const chartHeight = height - top - bottom;
  return rows.map((row, index) => {
    const x = 48 + (index / Math.max(rows.length - 1, 1)) * (width - 102);
    const y = top + (1 - (row.close - minPrice) / (maxPrice - minPrice || 1)) * chartHeight;
    return { ...row, x, y };
  });
}

function polyline(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function indicatorLine(points, top, height, phase = 0) {
  return points
    .map((point, index) => {
      const wave = Math.sin(index * 0.78 + phase) * height * 0.24;
      const drift = (index / Math.max(points.length - 1, 1)) * height * 0.16;
      return `${point.x},${top + height / 2 + wave - drift}`;
    })
    .join(" ");
}

function zoneText(zone) {
  return zone.price || `${zone.fromPrice?.toLocaleString("ko-KR")}~${zone.toPrice?.toLocaleString("ko-KR")}원`;
}

export function ChartWorkspace({ interval, onIntervalChange, workspace, mode }) {
  const [activeNote, setActiveNote] = useState("rise");
  const rows = workspace.chart.rows;
  const width = 1120;
  const height = 700;
  const points = useMemo(() => buildPoints(rows, width, height), [rows]);
  const ma20 = useMemo(() => buildPoints(movingAverage(rows, 5), width, height), [rows]);
  const ma60 = useMemo(() => buildPoints(movingAverage(rows, 9), width, height), [rows]);
  const latest = rows[rows.length - 1];
  const first = rows[0];
  const change = ((latest.close - first.close) / first.close) * 100;
  const maxVolume = Math.max(...rows.map((row) => row.volume));
  const volumeBars = points.map((point) => ({
    x: point.x,
    h: Math.max(9, (point.volume / maxVolume) * 68),
    up: point.close >= point.open
  }));

  const notes = [
    {
      id: "rise",
      x: 62,
      y: 18,
      label: "왜 올랐나",
      title: "가격 돌파와 거래량 증가",
      body: "상승 구간에서 가격만 오른 것이 아니라 거래량 막대도 함께 커졌습니다. 초보자는 이 조합을 먼저 확인합니다.",
      icon: TrendingUp
    },
    {
      id: "pause",
      x: 46,
      y: 38,
      label: "왜 쉬었나",
      title: "전고점 앞 속도 조절",
      body: "상단 가격대에서 거래량이 줄면 좋은 뉴스가 있어도 잠시 쉬는 흐름이 나올 수 있습니다.",
      icon: Activity
    },
    {
      id: "bad",
      x: 80,
      y: 30,
      label: "악재 확인",
      title: "호재 반영 뒤 반대 신호",
      body: "기대가 이미 가격에 반영된 뒤에는 긴 윗꼬리와 거래량 둔화를 악재처럼 함께 봅니다.",
      icon: Newspaper
    },
    {
      id: "risk",
      x: 23,
      y: 52,
      label: "리스크",
      title: "지지선 이탈 기준",
      body: "주요 지지선 아래에서 종가가 반복되면 수익보다 방어 기준을 먼저 세워야 합니다.",
      icon: AlertTriangle
    }
  ];

  const active = notes.find((note) => note.id === activeNote) || notes[0];
  const ActiveIcon = active.icon;
  const allZones = useMemo(() => {
    const nextZones = Array.isArray(workspace.zones) && workspace.zones.length ? [...workspace.zones] : [];
    fallbackWorkspace.zones.forEach((fallbackZone) => {
      if (!nextZones.some((zone) => zone.type === fallbackZone.type || zone.label === fallbackZone.label)) {
        nextZones.push(fallbackZone);
      }
    });
    return nextZones;
  }, [workspace.zones]);
  const visibleZones = allZones.slice(0, mode === "learning" ? 3 : 5);

  return (
    <section className="chartWorkspace" aria-label="AI 차트 해석">
      <div className="chartTop">
        <div>
          <span className="eyebrow">AI 차트 주석</span>
          <h2>{workspace.stock.name}</h2>
          <p>기준일 {workspace.asOf} 차트와 거래량을 함께 확인합니다.</p>
        </div>
        <div className="timeSegment" aria-label="차트 주기">
          {intervals.map((item) => (
            <button
              aria-pressed={interval === item.id}
              className={interval === item.id ? "selected" : ""}
              key={item.id}
              type="button"
              onClick={() => onIntervalChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chartFrame">
        <div className="terminalBar" aria-label="종목 현재 상태">
          <span>{workspace.stock.market}</span>
          <strong>{workspace.stock.name}</strong>
          <em>{formatPrice(latest.close)}</em>
          <b>{change.toFixed(1)}%</b>
        </div>
        <svg
          className="priceChart"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMaxYMid slice"
          role="img"
          aria-label="가격 흐름과 AI 주석 차트"
        >
          <defs>
            <linearGradient id="priceFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4f9cff" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#4f9cff" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((line) => (
            <line className="gridLine" key={line} x1="48" x2="1066" y1={96 + line * 88} y2={96 + line * 88} />
          ))}

          <rect className="zone buy" x="676" y="178" width="166" height="98" rx="8" />
          <rect className="zone watch" x="842" y="144" width="110" height="140" rx="8" />
          <rect className="zone sell" x="952" y="104" width="86" height="148" rx="8" />
          <rect className="zone risk" x="128" y="330" width="154" height="76" rx="8" />
          <text className="zoneText" x="690" y="166">매수 검토</text>
          <text className="zoneText" x="854" y="132">관망</text>
          <text className="zoneText" x="962" y="92">매도 검토</text>
          <text className="zoneText" x="140" y="318">리스크 관리</text>

          <polygon className="area" points={`${polyline(points)} 1066,430 48,430`} />
          <polyline className="priceLine" points={polyline(points)} />
          <polyline className="maLine blue" points={polyline(ma20)} />
          <polyline className="maLine amber" points={polyline(ma60)} />

          {points.map((point, index) => (
            <circle className={point.close >= point.open ? "candle up" : "candle down"} key={point.date} cx={point.x} cy={point.y} r={index % 3 === 0 ? 4.4 : 3.1} />
          ))}

          {volumeBars.map((bar, index) => (
            <rect className={bar.up ? "volumeBar up" : "volumeBar down"} key={`${points[index].date}-volume`} x={bar.x - 6} y={486 - bar.h} width="10" height={bar.h} rx="3" />
          ))}

          <circle className="eventMarker good" cx="446" cy="220" r="8" />
          <circle className="eventMarker bad" cx="904" cy="172" r="8" />
          <text className="markerLabel" x="456" y="214">호재</text>
          <text className="markerLabel" x="914" y="166">악재</text>

          <path className="handArrow" d="M790 112 C746 130 708 150 684 186" />
          <path className="handArrow" d="M552 260 C586 270 624 266 654 240" />
          <path className="handArrow" d="M258 320 C220 336 188 360 164 402" />
          <path className="handArrow red" d="M972 154 C948 180 924 208 906 246" />
          <text className="handLabel" x="746" y="102">거래량 붙은 돌파</text>
          <text className="handLabel" x="442" y="250">속도 조절</text>
          <text className="handLabel" x="118" y="306">지지선 기준</text>
          <text className="handLabel" x="908" y="142">반대 신호</text>

          <line className="indicatorDivider" x1="48" x2="1066" y1="518" y2="518" />
          <line className="indicatorDivider" x1="48" x2="1066" y1="582" y2="582" />
          <polyline className="indicator obv" points={indicatorLine(points, 512, 52, 0.2)} />
          <polyline className="indicator rsi" points={indicatorLine(points, 574, 50, 1.4)} />
          <polyline className="indicator macd" points={indicatorLine(points, 634, 48, 2.5)} />
          <text className="axisLabel" x="48" y="502">거래량</text>
          <text className="axisLabel" x="48" y="548">OBV · 수급이 가격을 받치는지 확인</text>
          <text className="axisLabel" x="48" y="612">RSI · 과열과 추세 힘 확인</text>
          <text className="axisLabel" x="48" y="672">MACD · 모멘텀 둔화 확인</text>
        </svg>

        {notes.map((note) => (
          <button
            className={`chartNote ${activeNote === note.id ? "active" : ""}`}
            key={note.id}
            type="button"
            style={{ left: `${note.x}%`, top: `${note.y}%` }}
            onClick={() => setActiveNote(note.id)}
            onFocus={() => setActiveNote(note.id)}
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

      <div className="aiLedger" aria-label="차트 아래 AI 판단 요약">
        <div>
          <span>추세 판단</span>
          <strong>{workspace.ai.phase}</strong>
        </div>
        <div>
          <span>진입 신호</span>
          <strong>{workspace.ai.buyCondition}</strong>
        </div>
        <div>
          <span>반대 신호</span>
          <strong>{workspace.ai.opposingSignals?.[0] || workspace.ai.waitCondition}</strong>
        </div>
      </div>

      <div className="chartMeta">
        <span>{formatPrice(latest.close)} · {change.toFixed(1)}%</span>
        <span>기준일 {workspace.asOf}</span>
        <span>{workspace.ai.confidence}</span>
      </div>

      <div className="zoneBoard" aria-label="매수와 매도 검토 조건">
        {visibleZones.map((zone) => (
          <article className={`zoneCard ${zone.type}`} key={zone.id || zone.label}>
            <div>
              {zone.type === "buy" || zone.type === "split" ? <CheckCircle2 size={15} /> : null}
              {zone.type === "watch" ? <CircleHelp size={15} /> : null}
              {zone.type === "sell" || zone.type === "risk" ? <AlertTriangle size={15} /> : null}
              <strong>{zone.label}</strong>
            </div>
            <span>{zoneText(zone)}</span>
            <p>{zone.condition}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
