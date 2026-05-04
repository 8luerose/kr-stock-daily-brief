import { BadgeCheck, CircleAlert, ListChecks, Newspaper } from "lucide-react";

export function AIPredictionPanel({ workspace, mode }) {
  const ai = workspace.ai;

  return (
    <aside className="aiPanel" aria-label="AI 예측과 조건">
      <div className="panelHead">
        <span className="eyebrow">AI 예측 요약</span>
        <strong>{ai.phase}</strong>
        <p>{ai.direction}</p>
      </div>

      <div className="signalStack">
        <article className="signalCard primary">
          <BadgeCheck size={17} />
          <span>매수 검토 조건</span>
          <p>{ai.buyCondition}</p>
        </article>
        <article className="signalCard">
          <CircleAlert size={17} />
          <span>매도 검토 조건</span>
          <p>{ai.sellCondition}</p>
        </article>
        {mode === "practice" ? (
          <article className="signalCard">
            <ListChecks size={17} />
            <span>관망 조건</span>
            <p>{ai.waitCondition}</p>
          </article>
        ) : null}
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
          <span className="miniTitle bad"><CircleAlert size={14} /> 악재</span>
          <ul>
            {ai.negatives.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="checklist">
        <span>초보자 체크</span>
        {ai.checklist.map((item) => (
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
