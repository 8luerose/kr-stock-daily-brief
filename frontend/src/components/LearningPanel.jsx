import { BookOpenCheck, MessageCircleQuestion, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { requiredLearningTerms } from "../data/fallbackData.js";

function normalizeTerm(term) {
  return {
    id: term.id,
    term: term.term,
    category: term.category || "학습",
    coreSummary: term.coreSummary || term.plainDefinition || `${term.term}을 차트와 연결해 설명합니다.`,
    longExplanation:
      term.longExplanation ||
      `${term.term}은 주가를 이해할 때 자주 쓰이는 개념입니다.\n가격 움직임, 거래량, 이벤트와 함께 보면 의미가 더 분명해집니다.\n초보자는 단어 뜻보다 차트에서 어떤 행동 기준이 되는지 먼저 익히면 좋습니다.`,
    chartUsage: term.chartUsage || "차트의 가격, 거래량, 보조지표 영역에서 관련 신호를 확인합니다.",
    whyItMatters: term.whyItMatters || "매수 검토, 관망, 리스크 관리 조건을 구분하는 데 도움됩니다.",
    beginnerCheck: term.beginnerCheck || "한 지표만 보지 말고 가격과 거래량을 함께 확인합니다.",
    commonMisunderstanding: term.commonMisunderstanding || term.caution || "숫자 하나를 확정 신호로 오해하면 안 됩니다.",
    scenario: term.scenario || "호재가 있어도 차트 조건이 확인되지 않으면 관망이 더 적절할 수 있습니다.",
    relatedTerms: term.relatedTerms || [],
    relatedQuestions: term.relatedQuestions || term.exampleQuestions || []
  };
}

export function LearningPanel({ terms, compact = false }) {
  const [query, setQuery] = useState("");
  const normalizedTerms = useMemo(() => terms.map(normalizeTerm), [terms]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedTerms;
    return normalizedTerms.filter((term) =>
      [term.term, term.category, term.coreSummary, ...(term.relatedTerms || [])]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [normalizedTerms, query]);
  const [selectedId, setSelectedId] = useState("");
  const selected = filtered.find((term) => term.id === selectedId) || filtered[0] || normalizedTerms[0];

  return (
    <section className={compact ? "learningDock" : "learningPanel"} aria-labelledby="learning-title">
      <div className="panelTitle">
        <span className="iconBubble" aria-hidden="true">
          <BookOpenCheck size={18} />
        </span>
        <div>
          <span className="eyebrow">차트와 연결되는 배우기</span>
          <h2 id="learning-title">모르는 용어를 바로 풀어봅니다</h2>
        </div>
      </div>

      <label className="termSearch" htmlFor="term-search">
        <Search size={18} aria-hidden="true" />
        <input
          id="term-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="거래량, RSI, 이동평균선"
        />
      </label>

      <div className="termRail" role="listbox" aria-label="학습 용어">
        {filtered.slice(0, compact ? 4 : 10).map((term) => (
          <button
            key={term.id}
            type="button"
            className={selected?.id === term.id ? "active" : ""}
            onClick={() => setSelectedId(term.id)}
          >
            <strong>{term.term}</strong>
            <small>{term.category}</small>
          </button>
        ))}
      </div>

      {selected ? (
        <article className="termDetail">
          <h3>{selected.term}</h3>
          <p className="lead">{selected.coreSummary}</p>
          <div className="termSections">
            <section>
              <h4>자세한 설명</h4>
              <p>{selected.longExplanation}</p>
            </section>
            <section>
              <h4>차트에서 보는 법</h4>
              <p>{selected.chartUsage}</p>
            </section>
            <section>
              <h4>왜 중요한지</h4>
              <p>{selected.whyItMatters}</p>
            </section>
            <section>
              <h4>초보자 오해</h4>
              <p>{selected.commonMisunderstanding}</p>
            </section>
            <section>
              <h4>시나리오 예시</h4>
              <p>{selected.scenario}</p>
            </section>
          </div>
          <div className="questionChips">
            <strong className="askEntry">AI에게 물어보기</strong>
            {(selected.relatedQuestions || []).slice(0, 3).map((question) => (
              <a key={question} href={`#home?ask=${encodeURIComponent(question)}`}>
                <MessageCircleQuestion size={14} aria-hidden="true" />
                {question}
              </a>
            ))}
          </div>
        </article>
      ) : null}

      {!compact ? (
        <div className="requiredTerms" aria-label="우선 용어 목록">
          {requiredLearningTerms.map((term) => (
            <span key={term}>{term}</span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
