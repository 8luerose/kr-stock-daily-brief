import { ArrowUpRight, ChartNoAxesCombined, GraduationCap, Search, Sparkles } from "lucide-react";
import { StateBlock } from "./StateBlock.jsx";

function resultIcon(type) {
  if (type === "term") return GraduationCap;
  if (type === "theme" || type === "industry") return Sparkles;
  return ChartNoAxesCombined;
}

export function SearchCommand({ query, setQuery, results, state, onSelect, candidates }) {
  const hasQuery = Boolean(query.trim());
  const visibleResults = hasQuery ? results : [];

  return (
    <section className="commandCenter" aria-labelledby="search-title">
      <div className="commandCopy">
        <span className="eyebrow">AI가 차트 위에 설명하는 한국 주식 학습</span>
        <h1 id="search-title">검색하면 차트 위에서 상승과 하락 이유, 매수와 매도 검토 조건을 바로 봅니다.</h1>
        <p>
          초보자가 이해할 수 있도록 호재, 악재, 반대 신호, 리스크를 조건형으로 정리합니다.
        </p>
      </div>

      <div className="searchBox">
        <label htmlFor="universal-search">통합 검색</label>
        <div className="searchInput">
          <Search size={20} aria-hidden="true" />
          <input
            id="universal-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="예: 삼성전자, 반도체, 거래량, RSI"
            autoComplete="off"
          />
          {state.loading ? <span className="pulseDot" aria-label="검색 중" /> : null}
        </div>
        <div className="quickTerms" aria-label="추천 검색어">
          {["삼성전자", "거래량", "RSI"].map((term) => (
            <button key={term} type="button" onClick={() => setQuery(term)}>
              {term}
            </button>
          ))}
        </div>
      </div>

      {hasQuery || state.error ? (
        <div className="searchResults" aria-live="polite">
          {state.error ? (
            <StateBlock
              tone="error"
              title="검색 API를 불러오지 못했습니다"
              description="추천 후보와 fallback 데이터를 표시합니다. 백엔드 연결 뒤 자동으로 실제 결과를 사용합니다."
            />
          ) : null}
          {hasQuery && !visibleResults.length && !state.loading ? (
            <>
              <StateBlock
                tone="empty"
                title="검색 결과가 없습니다"
                description="추천 검색어를 눌러 차트 해석, 용어 학습, 오늘 관심 후보로 이어갈 수 있습니다."
              />
              <div className="emptySuggestions" aria-label="검색 실패 추천">
                {(candidates || []).slice(0, 3).map((candidate) => (
                  <button
                    key={candidate.code}
                    type="button"
                    onClick={() =>
                      onSelect({
                        id: candidate.code,
                        type: "stock",
                        title: candidate.name,
                        code: candidate.code,
                        market: candidate.market,
                        rate: candidate.rate,
                        tags: [candidate.theme],
                        summary: candidate.beginnerLine,
                        stockCode: candidate.code,
                        stockName: candidate.name
                      })
                    }
                  >
                    {candidate.name}
                    <small>{candidate.rate}</small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            visibleResults.slice(0, 4).map((item) => {
              const Icon = resultIcon(item.type);
              return (
                <button key={item.id} type="button" className="resultRow" onClick={() => onSelect(item)}>
                  <span className="resultIcon" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <span className="resultMain">
                    <strong>
                      {item.title}
                      <small>{item.code}</small>
                    </strong>
                    <em>{item.summary}</em>
                    <span className="tagLine">
                      {(item.tags || []).slice(0, 3).map((tag) => (
                        <i key={tag}>{tag}</i>
                      ))}
                    </span>
                  </span>
                  <span className="resultSide">
                    <b>{item.rate || "-"}</b>
                    <small>{item.market || "KRX"}</small>
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </span>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </section>
  );
}
