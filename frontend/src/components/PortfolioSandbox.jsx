import { PieChart, ShieldCheck } from "lucide-react";

export function PortfolioSandbox({ workspace }) {
  return (
    <section className="portfolioSandbox" aria-label="포트폴리오 샌드박스">
      <div className="panelHead">
        <span className="eyebrow">학습용 샌드박스</span>
        <strong>관심 비중 점검</strong>
        <p>실계좌 연결 없이 호재와 악재가 관심 비중에 주는 영향을 연습합니다.</p>
      </div>

      <div className="portfolioBars">
        {workspace.portfolio.items.map((item) => (
          <article key={item.name}>
            <div>
              <span>{item.name}</span>
              <em>{item.weight}% · 위험 {item.risk}</em>
            </div>
            <div className="barTrack">
              <i style={{ width: `${item.weight}%` }} />
            </div>
            <p>{item.note}</p>
          </article>
        ))}
      </div>

      <div className="portfolioNext">
        <PieChart size={17} />
        <span>{workspace.portfolio.nextChecklist[0]}</span>
      </div>
      <div className="portfolioNext muted">
        <ShieldCheck size={17} />
        <span>서버 저장이 없으면 학습용 화면 상태로만 표시합니다.</span>
      </div>
    </section>
  );
}
