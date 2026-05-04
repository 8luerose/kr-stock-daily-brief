import { MessageCircleQuestion, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { findLearningTerm } from "../data/fallbackData.js";

export function LearningPanel({ compact = false, terms = [], onAsk }) {
  const [selectedId, setSelectedId] = useState("거래량".toLowerCase());
  const [query, setQuery] = useState("");
  const safeTerms = terms.length ? terms : [findLearningTerm("거래량")];
  const selected =
    safeTerms.find((term) => term.id === selectedId) ||
    safeTerms.find((term) => term.term === "거래량") ||
    safeTerms[0];

  useEffect(() => {
    function onQuestion(event) {
      const match = safeTerms.find((term) => event.detail?.includes(term.term));
      if (match) setSelectedId(match.id);
    }
    window.addEventListener("learning-question", onQuestion);
    return () => window.removeEventListener("learning-question", onQuestion);
  }, [safeTerms]);

  const filteredTerms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return safeTerms.slice(0, compact ? 5 : 14);
    return safeTerms
      .filter((term) => `${term.term} ${term.category} ${term.coreSummary}`.toLowerCase().includes(normalized))
      .slice(0, 14);
  }, [compact, query, safeTerms]);

  return (
    <section className={compact ? "learningPanel compact" : "learningPanel"} aria-label="초보자 학습">
      <div className="panelHead">
        <span className="eyebrow">초보자 학습</span>
        <strong>{compact ? "차트에서 바로 배우기" : "차트와 연결되는 주식 개념"}</strong>
        <p>{selected.coreSummary}</p>
      </div>

      {!compact ? (
        <label className="termSearch">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="용어 검색" />
        </label>
      ) : null}

      <div className="termTabs" role="tablist" aria-label="학습 용어">
        {filteredTerms.map((term) => (
          <button
            aria-selected={selected.id === term.id}
            className={selected.id === term.id ? "selected" : ""}
            key={term.id}
            type="button"
            role="tab"
            onClick={() => setSelectedId(term.id)}
          >
            {term.term}
          </button>
        ))}
      </div>

      <article className="termDetail">
        <h3>{selected.term}</h3>
        <p className="termLead">{selected.coreSummary}</p>
        <dl>
          <div>
            <dt>자세한 설명</dt>
            <dd>{selected.longExplanation}</dd>
          </div>
          <div>
            <dt>차트에서 보는 법</dt>
            <dd>{selected.chartUsage}</dd>
          </div>
          <div>
            <dt>왜 중요한지</dt>
            <dd>{selected.whyItMatters}</dd>
          </div>
          <div>
            <dt>초보자 오해</dt>
            <dd>{selected.commonMisunderstanding}</dd>
          </div>
          {!compact ? (
            <>
              <div>
                <dt>시나리오 예시</dt>
                <dd>{selected.scenario}</dd>
              </div>
              <div>
                <dt>관련 차트 구간</dt>
                <dd>{selected.relatedChartZone}</dd>
              </div>
              <div>
                <dt>관련 질문</dt>
                <dd>{selected.relatedQuestions?.join(" / ")}</dd>
              </div>
            </>
          ) : null}
        </dl>
        <button className="askButton" type="button" onClick={() => onAsk?.(selected.askEntry)}>
          <MessageCircleQuestion size={16} />
          AI에게 물어보기
        </button>
      </article>
    </section>
  );
}
