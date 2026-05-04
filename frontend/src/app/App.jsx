import { Activity, Database, Layers3, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { AIPredictionPanel } from "../components/AIPredictionPanel.jsx";
import { AppShell } from "../components/AppShell.jsx";
import { ChartWorkspace } from "../components/ChartWorkspace.jsx";
import { HistoryAdminPanel } from "../components/HistoryAdminPanel.jsx";
import { LearningPanel } from "../components/LearningPanel.jsx";
import { PortfolioPanel } from "../components/PortfolioPanel.jsx";
import { SearchCommand } from "../components/SearchCommand.jsx";
import { aiPipeline } from "../data/fallbackData.js";
import { useHashRoute } from "../hooks/useHashRoute.js";
import { useResearchWorkspace } from "../hooks/useResearchWorkspace.js";

function CandidateStrip({ candidates, selected, onSelect }) {
  return (
    <section className="candidateSection" aria-labelledby="candidate-title">
      <div className="sectionHead">
        <div>
          <span className="eyebrow">관심 후보 3개 이하</span>
          <h2 id="candidate-title">검색 전 바로 볼 종목</h2>
        </div>
        <small>등락률, 거래량, 이벤트 기준</small>
      </div>
      <div className="candidateGrid">
        {candidates.slice(0, 3).map((candidate) => (
          <button
            key={candidate.code}
            type="button"
            className={candidate.code === selected.code ? "active" : ""}
            onClick={() => onSelect(candidate)}
          >
            <span>
              <strong>{candidate.name}</strong>
              <small>{candidate.market} · {candidate.theme}</small>
            </span>
            <b>{candidate.rate}</b>
            <em>{candidate.beginnerLine}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function AiArchitectureNote({ meta, dataState }) {
  return (
    <section className="architectureNote" aria-labelledby="architecture-title">
      <div className="sectionHead">
        <div>
          <span className="eyebrow">RAG/Agentic 확장 구조</span>
          <h2 id="architecture-title">화면은 간단하게, 근거 흐름은 분리합니다</h2>
        </div>
      </div>
      <div className="pipeline">
        {aiPipeline.map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>
      <div className="sourceGrid">
        <article>
          <Database size={17} aria-hidden="true" />
          <strong>데이터</strong>
          <p>{meta.source}. 차트·이벤트·요약·학습 용어를 같은 어댑터로 연결합니다.</p>
        </article>
        <article>
          <Activity size={17} aria-hidden="true" />
          <strong>AI</strong>
          <p>{dataState.ai === "api" ? "AI service 응답 기반" : "AI service 미응답 시 fallback 표시"}. 내부 사고 과정은 노출하지 않습니다.</p>
        </article>
        <article>
          <ShieldCheck size={17} aria-hidden="true" />
          <strong>안전 표현</strong>
          <p>확정 추천 대신 조건형 검토, 반대 신호, 리스크, 한계를 함께 보여줍니다.</p>
        </article>
      </div>
    </section>
  );
}

function HomePage({
  query,
  setQuery,
  searchResults,
  searchState,
  selectSearchResult,
  selected,
  setSelected,
  candidates,
  chart,
  zones,
  events,
  aiBrief,
  learningTerms,
  meta,
  dataState
}) {
  return (
    <>
      <div className="productStage">
        <div className="stageMain">
          <SearchCommand
            query={query}
            setQuery={setQuery}
            results={searchResults}
            state={searchState}
            onSelect={selectSearchResult}
            candidates={candidates}
          />
          <ChartWorkspace selected={selected} chart={chart} zones={zones} events={events} meta={meta} />
          <CandidateStrip candidates={candidates} selected={selected} onSelect={setSelected} />
        </div>
        <AIPredictionPanel
          selected={selected}
          aiBrief={aiBrief}
          zones={zones}
          events={events}
          meta={meta}
          dataState={dataState}
        />
      </div>

      <div className="lowerGrid">
        <LearningPanel terms={learningTerms} compact />
        <AiArchitectureNote meta={meta} dataState={dataState} />
      </div>
    </>
  );
}

export function App() {
  const { route, go } = useHashRoute();
  const workspace = useResearchWorkspace();

  useEffect(() => {
    const label =
      {
        home: "리서치",
        learning: "배우기",
        portfolio: "샌드박스",
        history: "기록",
        admin: "운영"
      }[route] || "리서치";
    document.title = `${label} | 한국 주식 AI 학습`;
  }, [route]);

  return (
    <AppShell route={route} go={go} meta={workspace.meta}>
      <div className="pageBackdrop" aria-hidden="true">
        <span />
        <span />
      </div>

      {route === "home" ? <HomePage {...workspace} /> : null}
      {route === "learning" ? <LearningPanel terms={workspace.learningTerms} /> : null}
      {route === "portfolio" ? (
        <PortfolioPanel selected={workspace.selected} portfolio={workspace.portfolio} dataState={workspace.dataState} />
      ) : null}
      {route === "history" ? <HistoryAdminPanel /> : null}
      {route === "admin" ? <HistoryAdminPanel admin /> : null}

      <footer className="footerNote">
        <Layers3 size={16} aria-hidden="true" />
        <span>
          교육용 AI 리서치 화면입니다. 백엔드의 브리프, 달력, 생성, 백필, 보관, 검증 API는 기록과 운영
          영역에 보존됩니다.
        </span>
      </footer>
    </AppShell>
  );
}
