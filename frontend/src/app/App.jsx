import { useEffect } from "react";
import { BadgeCheck, BookOpen, ChevronRight, LineChart, Sparkles, TriangleAlert } from "lucide-react";
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

function HomeDashboard({
  candidates,
  interval,
  onAskLearning,
  onIntervalChange,
  onOpenLearning,
  onSelectMode,
  onSelectStock,
  status,
  terms,
  workspace
}) {
  return (
    <section className="homeStage" aria-label="AI 주식 학습 첫 화면">
      <div className="homeHero">
        <div className="choiceCopy homeCopy">
          <span className="eyebrow">차트 위에서 배우는 한국 주식</span>
          <h1>검색하면 차트 위에 이유와 조건이 붙습니다.</h1>
          <p>종목, 테마, 주식 용어를 입력하면 AI가 왜 올랐고 왜 쉬었는지, 어떤 조건에서 검토할지 차트와 함께 보여줍니다.</p>
        </div>
        <div className="homeActionDock" aria-label="주요 이동">
          <a className="choiceButton primary" href="#learn" onClick={() => onSelectMode("learn")}>
            <BookOpen size={22} />
            <strong>학습</strong>
            <span>차트 이유 보기</span>
            <ChevronRight size={18} />
          </a>
          <a className="choiceButton" href="#practice" onClick={() => onSelectMode("practice")}>
            <LineChart size={22} />
            <strong>실전</strong>
            <span>검토 조건 보기</span>
            <ChevronRight size={18} />
          </a>
        </div>
      </div>

      <SearchCommand candidates={candidates} onOpenLearning={onOpenLearning} onSelectStock={onSelectStock} />

      {status === "fallback" ? <div className="softStatus warning">백엔드 연결이 불안정해 예시 데이터로 표시합니다.</div> : null}

      <div className="productGrid homeProductGrid">
        <ChartWorkspace interval={interval} mode="practice" onIntervalChange={onIntervalChange} workspace={workspace} />
        <AIPredictionPanel mode="practice" workspace={workspace} />
      </div>

      <div className="homeLearningCue">
        <LearningPanel compact terms={terms} onAsk={onAskLearning} />
        <article className="homeSourceCard" aria-label="근거와 한계">
          <Sparkles size={18} />
          <span>근거와 한계</span>
          <strong>차트, 이벤트, 학습 용어를 함께 연결합니다.</strong>
          <p>기준일 {workspace.asOf}. {workspace.source}를 우선 사용하고, 연결이 불안정하면 화면에 예시 데이터 상태를 표시합니다.</p>
        </article>
      </div>
    </section>
  );
}

function ModeExperience({
  candidates,
  interval,
  mode,
  onAskLearning,
  onIntervalChange,
  onOpenLearning,
  onSelectStock,
  status,
  terms,
  workspace
}) {
  const isPractice = mode === "practice";
  const firstZone = workspace.zones[0];
  const cautionZone = workspace.zones.find((zone) => zone.type === "sell" || zone.type === "risk") || workspace.zones[2];
  return (
    <section className="experienceStage">
      <div className="experienceIntro">
        <span className="eyebrow">{isPractice ? "실전 연습" : "학습 모드"}</span>
        <h1>{isPractice ? "조건이 맞을 때만 검토합니다." : "차트 이유부터 천천히 배웁니다."}</h1>
        <p>
          {isPractice
            ? "검색한 종목의 차트, AI 예측, 호재와 악재, 매수와 매도 검토 조건을 한 화면에서 확인합니다."
            : "차트 위 AI 주석을 보며 왜 올랐고 왜 쉬었는지 이해하고, 바로 아래에서 관련 용어를 이어서 배웁니다."}
        </p>
      </div>

      <div className="insightStrip" aria-label="현재 화면 요약">
        <article>
          <Sparkles size={16} />
          <span>AI 방향</span>
          <strong>{workspace.ai.phase}</strong>
        </article>
        <article>
          <BadgeCheck size={16} />
          <span>검토 기준</span>
          <strong>{firstZone?.label || "매수 검토"}</strong>
        </article>
        <article>
          <TriangleAlert size={16} />
          <span>반대 신호</span>
          <strong>{cautionZone?.label || "리스크 관리"}</strong>
        </article>
      </div>

      <SearchCommand candidates={candidates} onOpenLearning={onOpenLearning} onSelectStock={onSelectStock} />

      {status === "loading" ? <div className="softStatus">차트와 AI 조건을 불러오는 중입니다.</div> : null}
      {status === "fallback" ? <div className="softStatus warning">백엔드 연결이 불안정해 예시 데이터로 표시합니다.</div> : null}

      <div className="productGrid">
        <ChartWorkspace interval={interval} mode={isPractice ? "practice" : "learning"} onIntervalChange={onIntervalChange} workspace={workspace} />
        <AIPredictionPanel mode={isPractice ? "practice" : "learning"} workspace={workspace} />
      </div>

      <details className="featureDrawer" open={!isPractice}>
        <summary>
          <span>{isPractice ? "학습과 샌드박스 더 보기" : "학습 내용과 샌드박스"}</span>
          <strong>{isPractice ? "필요할 때 열어 확인" : "차트 개념을 이어서 보기"}</strong>
        </summary>
        {isPractice ? (
          <div className="supportGrid">
            <LearningPanel compact terms={terms} onAsk={onAskLearning} />
            <PortfolioSandbox workspace={workspace} />
          </div>
        ) : (
          <>
            <LearningPanel terms={terms} onAsk={onAskLearning} />
            <div className="supportGrid singleFocus">
              <PortfolioSandbox workspace={workspace} />
            </div>
          </>
        )}
      </details>
    </section>
  );
}

export function App() {
  const [route, setRoute] = useHashRoute();
  const workspaceState = useResearchWorkspace();
  const { candidates, interval, setInterval, setSelectedCode, status, terms, workspace } = workspaceState;

  useEffect(() => {
    document.title = titles[route] || titles.home;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [route]);

  function askLearning(question) {
    setRoute("learn");
    window.setTimeout(() => {
      const event = new CustomEvent("learning-question", { detail: question });
      window.dispatchEvent(event);
    }, 0);
  }

  if (route === "archive" || route === "admin") {
    return (
      <AppShell route={route} setRoute={setRoute}>
        <AdminArchivePanel mode={route === "admin" ? "admin" : "archive"} />
      </AppShell>
    );
  }

  if (route === "learn") {
    return (
      <AppShell route={route} setRoute={setRoute}>
        <ModeExperience
          candidates={candidates}
          interval={interval}
          mode="learn"
          onAskLearning={askLearning}
          onIntervalChange={setInterval}
          onOpenLearning={() => setRoute("learn")}
          onSelectStock={setSelectedCode}
          status={status}
          terms={terms}
          workspace={workspace}
        />
      </AppShell>
    );
  }

  if (route === "practice") {
    return (
      <AppShell route={route} setRoute={setRoute}>
        <ModeExperience
          candidates={candidates}
          interval={interval}
          mode="practice"
          onAskLearning={askLearning}
          onIntervalChange={setInterval}
          onOpenLearning={() => setRoute("learn")}
          onSelectStock={setSelectedCode}
          status={status}
          terms={terms}
          workspace={workspace}
        />
      </AppShell>
    );
  }

  return (
    <AppShell route={route} setRoute={setRoute}>
      <HomeDashboard
        candidates={candidates}
        interval={interval}
        onAskLearning={askLearning}
        onIntervalChange={setInterval}
        onOpenLearning={() => setRoute("learn")}
        onSelectMode={(nextMode) => {
          setRoute(nextMode);
        }}
        onSelectStock={setSelectedCode}
        status={status}
        terms={terms}
        workspace={workspace}
      />
    </AppShell>
  );
}
