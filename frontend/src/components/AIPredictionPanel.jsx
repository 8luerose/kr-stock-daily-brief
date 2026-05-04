import { BrainCircuit, CheckCircle2, Gauge, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";

function list(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [String(value)];
}

export function AIPredictionPanel({ selected, aiBrief, zones, events, meta, dataState }) {
  const positiveEvents = (events?.events || []).filter((item) => item.type !== "negative").slice(0, 2);
  const negativeEvents = (events?.events || []).filter((item) => item.type === "negative").slice(0, 2);
  const buyZone = (zones?.zones || []).find((zone) => zone.type === "buy_watch") || zones?.zones?.[0];
  const sellZone = (zones?.zones || []).find((zone) => zone.type === "sell_watch");
  const riskZone = (zones?.zones || []).find((zone) => zone.type === "risk");

  return (
    <aside className="aiPanel" aria-labelledby="ai-title">
      <div className="panelTitle">
        <span className="iconBubble" aria-hidden="true">
          <BrainCircuit size={18} />
        </span>
        <div>
          <span className="eyebrow">AI 예측 요약</span>
          <h2 id="ai-title">{selected.name} 학습 리포트</h2>
        </div>
      </div>

      <div className="aiConclusion">
        <span className="stagePill">{aiBrief.stage || "조건 확인 구간"}</span>
        <strong>{aiBrief.conclusion}</strong>
        <p>{aiBrief.prediction}</p>
        <div className="confidenceMeter" aria-label={`신뢰도 ${meta.confidence}`}>
          <span style={{ width: meta.confidence }} />
        </div>
        <small>
          {dataState.ai === "api" ? "AI service 응답" : "fallback 표시"} · 기준일 {meta.asOf} · 신뢰도 {meta.confidence}
        </small>
      </div>

      <div className="decisionStack">
        <article>
          <CheckCircle2 size={17} aria-hidden="true" />
          <div>
            <h3>매수 검토 조건</h3>
            <p>{buyZone?.condition || "20일선 지지와 거래량 증가가 함께 확인될 때만 검토합니다."}</p>
          </div>
        </article>
        <article>
          <Gauge size={17} aria-hidden="true" />
          <div>
            <h3>관망 조건</h3>
            <p>호재가 있어도 전고점 돌파와 거래대금 증가가 확인되지 않으면 관망이 더 적절할 수 있습니다.</p>
          </div>
        </article>
        <article>
          <TriangleAlert size={17} aria-hidden="true" />
          <div>
            <h3>매도 검토 조건</h3>
            <p>{sellZone?.condition || "급등 뒤 거래량 둔화와 긴 윗꼬리가 반복되면 매도 검토 조건을 점검합니다."}</p>
          </div>
        </article>
        <article>
          <ShieldAlert size={17} aria-hidden="true" />
          <div>
            <h3>리스크 관리</h3>
            <p>{riskZone?.condition || "전저점 이탈 또는 악재 후 거래량 증가가 이어지면 방어 기준을 먼저 봅니다."}</p>
          </div>
        </article>
      </div>

      <section className="goodBadGrid" aria-label="호재와 악재">
        <article className="good">
          <h3>호재</h3>
          {positiveEvents.length ? (
            positiveEvents.map((event) => (
              <div key={`${event.date}-${event.title}`} className="newsItem">
                <strong>{event.title}</strong>
                <p>{event.explanation}</p>
                <small>{event.date} · 차트에서 거래량과 돌파 여부 확인</small>
              </div>
            ))
          ) : (
            <div className="newsItem">
              <strong>{selected.positive}</strong>
              <p>차트에서 거래량 증가와 이동평균선 지지를 함께 확인합니다.</p>
              <small>{meta.asOf} · 신뢰도 {meta.confidence}</small>
            </div>
          )}
        </article>
        <article className="bad">
          <h3>악재</h3>
          {negativeEvents.length ? (
            negativeEvents.map((event) => (
              <div key={`${event.date}-${event.title}`} className="newsItem">
                <strong>{event.title}</strong>
                <p>{event.explanation}</p>
                <small>{event.date} · 반대 가능성은 재돌파와 거래대금 회복</small>
              </div>
            ))
          ) : (
            <div className="newsItem">
              <strong>{selected.negative}</strong>
              <p>지지선 이탈과 거래량 증가가 동시에 나오는지 확인합니다.</p>
              <small>{meta.asOf} · 신뢰도 {meta.confidence}</small>
            </div>
          )}
        </article>
      </section>

      <div className="aiChecklist">
        <h3>
          <Sparkles size={16} aria-hidden="true" />
          초보자 체크리스트
        </h3>
        <ul>
          {list(aiBrief.thesis).slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
          {list(aiBrief.opposingSignals).slice(0, 2).map((item) => (
            <li key={item}>반대 신호: {item}</li>
          ))}
        </ul>
      </div>

      <div className="evidenceFooter" aria-label="AI 근거와 한계">
        <div>
          <strong>근거</strong>
          <span>{list(aiBrief.sources).join(" · ") || "daily summaries · chart OHLCV · event markers"}</span>
        </div>
        <div>
          <strong>한계</strong>
          <span>{list(aiBrief.limitations)[0] || "실시간 체결과 공시 원문 반영은 백엔드 연결 상태에 따라 달라질 수 있습니다."}</span>
        </div>
      </div>

      <p className="safetyNote">
        교육용 조건 설명입니다. 확정적 매수·매도 지시, 수익 보장, 내부 사고 과정은 제공하지 않습니다.
      </p>
    </aside>
  );
}
