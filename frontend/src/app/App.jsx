import { useEffect } from "react";
import { BookOpen, LineChart, ShieldCheck } from "lucide-react";
import { AdminArchivePanel } from "../components/AdminArchivePanel.jsx";
import { AIPredictionPanel } from "../components/AIPredictionPanel.jsx";
import { AppShell } from "../components/AppShell.jsx";
import { ChartWorkspace } from "../components/ChartWorkspace.jsx";
import { LearningPanel } from "../components/LearningPanel.jsx";
import { PortfolioSandbox } from "../components/PortfolioSandbox.jsx";
import { SearchCommand } from "../components/SearchCommand.jsx";
import { useHashRoute } from "../hooks/useHashRoute.js";
import { useResearchWorkspace } from "../hooks/useResearchWorkspace.js";

const titles = {
  home: "한국 주식 AI 학습",
  learn: "학습 | 한국 주식 AI 학습",
  practice: "실전 | 한국 주식 AI 학습",
  archive: "기록 | 한국 주식 AI 학습",
  admin: "운영 | 한국 주식 AI 학습"
};

function ModeActions({ compact = false, setRoute }) {
  return (
    <div className={compact ? "modeActions compact" : "modeActions"} aria-label="주요 흐름">
      <a className="modeCard learn" href="#learn" onClick={() => setRoute("learn")}>
        <BookOpen size={18} />
        <strong>학습</strong>
        <span>차트 이유</span>
      </a>
      <a className="modeCard practice" href="#practice" onClick={() => setRoute("practice")}>
        <LineChart size={18} />
        <strong>실전</strong>
        <span>검토 조건</span>
      </a>
    </div>
  );
}

function EvidenceRibbon({ workspace }) {
  return (
    <div className="evidenceRibbon" aria-label="데이터 근거">
      <span>기준일 {workspace.asOf}</span>
      <span>{workspace.ai.confidence}</span>
      <span>{workspace.source}</span>
    </div>
  );
}

function HomeSurface({
  candidates,
  interval,
  onAskLearning,
  onIntervalChange,
  onOpenLearning,
  onSelectStock,
  setRoute,
  status,
  terms,
  workspace
}) {
  return (
    <section className="screen homeScreen" aria-label="AI 주식 학습 첫 화면">
      <div className="heroBar">
        <div>
          <span className="eyebrow">AI가 차트 위에서 설명하는 한국 주식</span>
          <h1>검색하고, 차트에서 바로 배웁니다.</h1>
          <p>가격 흐름, 거래량, 호재와 악재, 매수와 매도 검토 조건을 한 화면에서 짧게 확인합니다.</p>
        </div>
        <ModeActions compact setRoute={setRoute} />
      </div>

      <SearchCommand candidates={candidates} onOpenLearning={onOpenLearning} onSelectStock={onSelectStock} />

      {status === "fallback" ? (
        <div className="statePill warning">
          백엔드 연결이 불안정해 앱 내 학습용 예시 데이터로 표시합니다.
        </div>
      ) : null}

      <div className="primaryGrid">
        <ChartWorkspace interval={interval} mode="home" onIntervalChange={onIntervalChange} workspace={workspace} />
        <AIPredictionPanel mode="home" workspace={workspace} />
      </div>

      <EvidenceRibbon workspace={workspace} />

      <div className="supportDeck">
        <LearningPanel compact terms={terms} onAsk={onAskLearning} />
        <PortfolioSandbox workspace={workspace} />
      </div>
    </section>
  );
}

function LearnSurface({
  candidates,
  interval,
  onAskLearning,
  onIntervalChange,
  onOpenLearning,
  onSelectStock,
  terms,
  workspace
}) {
  return (
    <section className="screen learnScreen" aria-label="학습 화면">
      <div className="pageHero">
        <span className="eyebrow">학습</span>
        <h1>용어를 외우지 말고 차트에서 확인합니다.</h1>
        <p>초보자가 자주 놓치는 거래량, 지지선, 전고점, 보조지표를 실제 흐름과 함께 봅니다.</p>
      </div>
      <SearchCommand candidates={candidates} onOpenLearning={onOpenLearning} onSelectStock={onSelectStock} />
      <div className="learningGrid">
        <ChartWorkspace interval={interval} mode="learning" onIntervalChange={onIntervalChange} workspace={workspace} />
        <div className="learnSide">
          <AIPredictionPanel mode="learning" workspace={workspace} />
          <LearningPanel terms={terms} onAsk={onAskLearning} />
        </div>
      </div>
    </section>
  );
}

function PracticeSurface({
  candidates,
  interval,
  onAskLearning,
  onIntervalChange,
  onOpenLearning,
  onSelectStock,
  terms,
  workspace
}) {
  return (
    <section className="screen practiceScreen" aria-label="실전 연습 화면">
      <div className="pageHero">
        <span className="eyebrow">실전</span>
        <h1>조건이 보일 때만 검토합니다.</h1>
        <p>매수, 분할매수, 관망, 매도, 리스크 관리 구간을 차트 위에서 조건형으로 확인합니다.</p>
      </div>
      <SearchCommand candidates={candidates} onOpenLearning={onOpenLearning} onSelectStock={onSelectStock} />
      <div className="primaryGrid">
        <ChartWorkspace interval={interval} mode="practice" onIntervalChange={onIntervalChange} workspace={workspace} />
        <AIPredictionPanel mode="practice" workspace={workspace} />
      </div>
      <div className="supportDeck">
        <LearningPanel compact terms={terms} onAsk={onAskLearning} />
        <PortfolioSandbox workspace={workspace} />
      </div>
    </section>
  );
}

export function App() {
  const [route, setRoute] = useHashRoute();
  const { candidates, interval, setInterval, setSelectedCode, status, terms, workspace } = useResearchWorkspace();

  useEffect(() => {
    document.title = titles[route] || titles.home;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [route]);

  function askLearning(question) {
    setRoute("learn");
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("learning-question", { detail: question }));
    }, 0);
  }

  let content;
  if (route === "archive" || route === "admin") {
    content = <AdminArchivePanel mode={route === "admin" ? "admin" : "archive"} />;
  } else if (route === "learn") {
    content = (
      <LearnSurface
        candidates={candidates}
        interval={interval}
        onAskLearning={askLearning}
        onIntervalChange={setInterval}
        onOpenLearning={() => setRoute("learn")}
        onSelectStock={setSelectedCode}
        terms={terms}
        workspace={workspace}
      />
    );
  } else if (route === "practice") {
    content = (
      <PracticeSurface
        candidates={candidates}
        interval={interval}
        onAskLearning={askLearning}
        onIntervalChange={setInterval}
        onOpenLearning={() => setRoute("learn")}
        onSelectStock={setSelectedCode}
        terms={terms}
        workspace={workspace}
      />
    );
  } else {
    content = (
      <HomeSurface
        candidates={candidates}
        interval={interval}
        onAskLearning={askLearning}
        onIntervalChange={setInterval}
        onOpenLearning={() => setRoute("learn")}
        onSelectStock={setSelectedCode}
        setRoute={setRoute}
        status={status}
        terms={terms}
        workspace={workspace}
      />
    );
  }

  return (
    <AppShell route={route} setRoute={setRoute}>
      {route === "admin" ? (
        <div className="adminTrust">
          <ShieldCheck size={15} />
          <span>운영 기능은 기존 백엔드 API를 호출합니다.</span>
        </div>
      ) : null}
      {content}
    </AppShell>
  );
}
