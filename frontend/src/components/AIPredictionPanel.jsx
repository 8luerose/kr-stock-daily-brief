import { AlertCircle, BadgeCheck, Eye, ListChecks, Newspaper, ShieldAlert } from "lucide-react";

export function AIPredictionPanel({ workspace, mode }) {
  const ai = workspace.ai;
  const conditions = [
    { id: "buy", icon: BadgeCheck, label: "매수 검토 조건", text: ai.buyCondition, tone: "good" },
    { id: "sell", icon: AlertCircle, label: "매도 검토 조건", text: ai.sellCondition, tone: "bad" },
    { id: "wait", icon: Eye, label: "관망 조건", text: ai.waitCondition, tone: "watch" },
    { id: "risk", icon: ShieldAlert, label: "리스크 관리", text: ai.riskCondition, tone: "risk" }
  ];

  return (
    <aside className="aiPanel" aria-label="AI 예측과 조건">
      <div className="aiHead">
        <span className="eyebrow">AI 예측 요약</span>
        <strong>{ai.phase}</strong>
        <p>{ai.direction}</p>
        <div className="confidenceDial">
          <span style={{ "--confidence": ai.confidence }}>{ai.confidence}</span>
          <em>조건 신뢰도</em>
        </div>
      </div>

      <div className="aiConditions">
        {conditions.slice(0, mode === "home" ? 3 : 4).map((item) => {
          const Icon = item.icon;
          return (
            <article className={`signalCard ${item.tone}`} key={item.id}>
              <Icon size={16} />
              <span>{item.label}</span>
              <p>{item.text}</p>
            </article>
          );
        })}
      </div>

      <div className="newsSplit" aria-label="호재와 악재">
        <section>
          <span className="miniTitle good"><Newspaper size={14} /> 호재</span>
          <ul>
            {ai.positives.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <span className="miniTitle bad"><AlertCircle size={14} /> 악재</span>
          <ul>
            {ai.negatives.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="checklist">
        <span><ListChecks size={15} /> 다음 확인</span>
        {ai.checklist.slice(0, 3).map((item) => (
          <label key={item}>
            <input type="checkbox" />
            {item}
          </label>
        ))}
      </div>

      <footer className="aiMeta">
        <span>기준일 {workspace.asOf}</span>
        <span>신뢰도 {ai.confidence}</span>
        <span>{ai.limitation}</span>
      </footer>
    </aside>
  );
}
