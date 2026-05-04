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
        <h1 id="search-title">종목, 테마, 용어를 검색하면 매수와 매도 검토 조건까지 한 화면에서 봅니다.</h1>
        <p>
          등락 이유, 호재와 악재, 반대 신호를 차트 위 주석과 교육용 조건으로 정리합니다.
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
          {["삼성전자", "반도체", "거래량", "RSI"].map((term) => (
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
            <StateBlock
              tone="empty"
              title="검색 결과가 없습니다"
              description="반도체, 거래량, RSI처럼 종목명이나 용어를 바꿔 검색해 보세요."
            />
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
