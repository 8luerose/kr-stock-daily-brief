import { BriefcaseBusiness, CirclePlus, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { addPortfolioItem } from "../services/apiClient.js";

function fallbackItems(selected) {
  return [
    {
      code: selected.code,
      name: selected.name,
      group: selected.theme,
      rate: Number(String(selected.rate || "0").replace("%", "")) || 0,
      weight: 35,
      riskNotes: ["단일 종목 비중이 커지면 이벤트 리스크가 포트폴리오에 직접 반영됩니다."],
      nextChecklist: ["20일선 지지 여부", "거래량 재확대", "악재 공시 확인"],
      recentEvents: []
    }
  ];
}

export function PortfolioPanel({ selected, portfolio, dataState }) {
  const [weight, setWeight] = useState(25);
  const [message, setMessage] = useState("");

  const items = portfolio?.items?.length ? portfolio.items : fallbackItems(selected);
  const summary = useMemo(() => {
    const total = items.reduce((sum, item) => sum + Number(item.weight || 0), 0);
    const maxItem = items.reduce((best, item) => (Number(item.weight || 0) > Number(best.weight || 0) ? item : best), items[0]);
    return portfolio?.summary || {
      totalWeight: total,
      maxWeightStock: maxItem?.name || selected.name,
      maxWeight: maxItem?.weight || weight,
      concentration: total > 80 ? "집중도 높음" : "학습용 분산",
      volatility: "중간",
      nextChecklist: ["관심 후보별 호재/악재가 같은 섹터에 몰려 있는지 확인", "전저점 이탈 조건을 종목별로 분리"]
    };
  }, [items, portfolio?.summary, selected.name, weight]);

  const addSelected = async () => {
    setMessage("저장 중입니다.");
    try {
      await addPortfolioItem({
        code: selected.code,
        name: selected.name,
        group: selected.theme,
        rate: Number(String(selected.rate || "0").replace("%", "")) || 0,
        weight
      });
      setMessage("포트폴리오 샌드박스에 반영했습니다.");
    } catch {
      setMessage("백엔드 저장 실패로 화면에는 학습용 fallback을 유지합니다.");
    }
  };

  return (
    <section className="portfolioPanel" aria-labelledby="portfolio-title">
      <div className="panelTitle">
        <span className="iconBubble" aria-hidden="true">
          <BriefcaseBusiness size={18} />
        </span>
        <div>
          <span className="eyebrow">실계좌 미연동 학습용</span>
          <h2 id="portfolio-title">포트폴리오 샌드박스</h2>
        </div>
      </div>

      <div className="sandboxControl">
        <label>
          {selected.name} 가상 비중
          <input
            type="range"
            min="5"
            max="70"
            value={weight}
            onChange={(event) => setWeight(Number(event.target.value))}
          />
        </label>
        <strong>{weight}%</strong>
        <button type="button" onClick={addSelected}>
          <CirclePlus size={16} aria-hidden="true" />
          관심 후보 담기
        </button>
      </div>

      {message ? <p className="inlineNotice">{message}</p> : null}

      <div className="portfolioSummary">
        <article>
          <span>총 가상 비중</span>
          <strong>{Number(summary.totalWeight || 0).toFixed(0)}%</strong>
        </article>
        <article>
          <span>최대 비중</span>
          <strong>{summary.maxWeightStock}</strong>
          <small>{Number(summary.maxWeight || 0).toFixed(0)}%</small>
        </article>
        <article>
          <span>집중도</span>
          <strong>{summary.concentration}</strong>
        </article>
      </div>

      <div className="portfolioList">
        {items.map((item) => (
          <article key={item.code}>
            <div>
              <strong>{item.name}</strong>
              <small>{item.code} · {item.group}</small>
            </div>
            <b>{Number(item.weight || 0).toFixed(0)}%</b>
            <ul>
              {(item.riskNotes || []).slice(0, 2).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="aiChecklist">
        <h3>
          <ShieldCheck size={16} aria-hidden="true" />
          다음 확인 체크리스트
        </h3>
        <ul>
          {(summary.nextChecklist || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <p className="safetyNote">
        {dataState.portfolio === "api" ? "백엔드 포트폴리오 API 기반입니다." : "서버 응답이 없으면 임시 fallback으로 표시합니다."}
      </p>
    </section>
  );
}
