import { ArrowUpRight, BookOpen, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fallbackStocks } from "../data/fallbackData.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import { searchWorkspace } from "../services/apiClient.js";

export function SearchCommand({ candidates, onSelectStock, onOpenLearning }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query);
  const visibleCandidates = useMemo(() => (candidates?.length ? candidates : fallbackStocks).slice(0, 3), [candidates]);

  useEffect(() => {
    let alive = true;
    const nextQuery = debouncedQuery.trim();
    if (!nextQuery) {
      setResults([]);
      return undefined;
    }
    searchWorkspace(nextQuery).then((nextResults) => {
      if (alive) setResults(nextResults);
    });
    return () => {
      alive = false;
    };
  }, [debouncedQuery]);

  function selectResult(result) {
    if (result.type === "term") {
      onOpenLearning?.();
    } else {
      onSelectStock?.(result.code);
      setQuery(result.name || result.title || result.code);
    }
    setOpen(false);
  }

  return (
    <section className="commandCenter" aria-label="통합 검색">
      <div className="commandGlass">
        <label className="searchBox" htmlFor="universal-search">
          <Search size={21} />
          <input
            id="universal-search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="삼성전자, 거래량, 반도체 호재"
            autoComplete="off"
          />
          <span>차트 연결</span>
        </label>
        <div className="candidateRail" aria-label="오늘 관심 후보">
          {visibleCandidates.map((stock) => (
            <button className="candidateCard" key={stock.code} type="button" onClick={() => onSelectStock?.(stock.code)}>
              <span>{stock.market}</span>
              <strong>{stock.name}</strong>
              <em>{stock.changeRate}</em>
              <ArrowUpRight size={15} />
            </button>
          ))}
        </div>
      </div>

      {open && query.trim() ? (
        <div className="searchResults" role="listbox" aria-label="검색 결과">
          {results.length ? (
            results.map((result) => (
              <button className="resultItem" key={result.id} type="button" onClick={() => selectResult(result)} role="option">
                <span className="resultMeta">{result.market || "학습"} · {result.code}</span>
                <strong>{result.title || result.name}</strong>
                <em>{result.changeRate}</em>
                <p>{result.beginnerLine}</p>
                <small>호재 {result.positive || "차트 근거 확인"} · 악재 {result.negative || "반대 신호 확인"}</small>
              </button>
            ))
          ) : (
            <div className="emptyResult">
              <Sparkles size={18} />
              <strong>결과가 비었습니다.</strong>
              <p>삼성전자, 거래량, 반도체 호재처럼 다시 검색하거나 아래 관심 후보를 눌러보세요.</p>
              <button type="button" onClick={onOpenLearning}>
                <BookOpen size={15} />
                용어부터 보기
              </button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
