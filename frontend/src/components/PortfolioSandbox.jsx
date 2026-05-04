import { PieChart } from "lucide-react";

export function PortfolioSandbox({ workspace }) {
  return (
    <section className="portfolioSandbox" aria-label="포트폴리오 샌드박스">
      <div className="panelHead">
        <span className="eyebrow">학습용 샌드박스</span>
        <strong>관심 비중 점검</strong>
        <p>실계좌 연결 없이 관심 종목의 쏠림과 리스크를 연습합니다.</p>
      </div>
      <div className="portfolioBars">
        {workspace.portfolio.items.map((item) => (
          <article key={item.name}>
            <span>{item.name}</span>
            <div className="barTrack">
              <i style={{ width: `${item.weight}%` }} />
            </div>
            <em>{item.weight}% · 위험 {item.risk}</em>
          </article>
        ))}
      </div>
      <div className="portfolioNext">
        <PieChart size={17} />
        <span>{workspace.portfolio.nextChecklist[0]}</span>
      </div>
    </section>
  );
}
