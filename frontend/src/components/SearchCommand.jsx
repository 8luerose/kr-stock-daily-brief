import { Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fallbackStocks } from "../data/fallbackData.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { searchWorkspace } from "../services/apiClient.js";

export function SearchCommand({ candidates, onSelectStock, onOpenLearning }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query);

  useEffect(() => {
    let alive = true;
    if (!debouncedQuery.trim()) {
      setResults([]);
      return undefined;
    }
    searchWorkspace(debouncedQuery).then((nextResults) => {
      if (alive) setResults(nextResults);
    });
    return () => {
      alive = false;
    };
  }, [debouncedQuery]);

  const visibleCandidates = useMemo(() => (candidates?.length ? candidates : fallbackStocks).slice(0, 3), [candidates]);

  function selectResult(result) {
    if (result.type === "term") {
      onOpenLearning();
      setOpen(false);
      return;
    }
    onSelectStock(result.code);
    setQuery(result.name || result.title || result.code);
    setOpen(false);
  }

  return (
    <section className="commandCenter" aria-label="통합 검색">
      <div className="searchBox">
        <Search size={20} />
        <input
          id="universal-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="종목, 테마, 주식 용어를 검색하세요"
          autoComplete="off"
        />
        <span className="searchHint">예측·학습 연결</span>
      </div>

      <p className="searchGuide">추천 검색어: 삼성전자 · 거래량 · 반도체 호재</p>

      {open && query.trim() ? (
        <div className="searchResults" role="listbox" aria-label="검색 결과">
          {results.length ? (
            results.map((result) => (
              <button
                className="resultItem"
                key={result.id}
                type="button"
                onClick={() => selectResult(result)}
                role="option"
              >
                <span>
                  <strong>{result.title || result.name}</strong>
                  <small>{result.code} · {result.market} · {result.theme}</small>
                </span>
                <em>{result.changeRate}</em>
                <p>{result.beginnerLine}</p>
              </button>
            ))
          ) : (
            <div className="emptyResult">
              <Sparkles size={18} />
              <strong>검색 결과가 아직 없습니다.</strong>
              <span>삼성전자, 거래량, 반도체 호재처럼 다시 입력해 보세요.</span>
            </div>
          )}
        </div>
      ) : null}

      <div className="candidateRail" aria-label="오늘 관심 후보">
        {visibleCandidates.map((stock) => (
          <article
            className="candidateCard"
            key={stock.code}
            tabIndex={0}
            onClick={() => onSelectStock(stock.code)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSelectStock(stock.code);
            }}
          >
            <span>{stock.market}</span>
            <strong>{stock.name}</strong>
            <em>{stock.changeRate}</em>
            <p>{stock.beginnerLine}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
