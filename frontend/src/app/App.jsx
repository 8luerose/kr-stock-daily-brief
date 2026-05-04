import { useEffect, useState } from "react";
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
  learn: "배우기 | 한국 주식 AI 학습",
  archive: "기록 | 한국 주식 AI 학습",
  admin: "운영 | 한국 주식 AI 학습"
};

export function App() {
  const [route, setRoute] = useHashRoute();
  const [mode, setMode] = useState("learning");
  const workspaceState = useResearchWorkspace();
  const { candidates, interval, setInterval, setSelectedCode, status, terms, workspace } = workspaceState;

  useEffect(() => {
    document.title = titles[route] || titles.home;
  }, [route]);

  function askLearning(question) {
    setMode("learning");
    setRoute("home");
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
        <LearningPanel terms={terms} onAsk={askLearning} />
      </AppShell>
    );
  }

  return (
    <AppShell route={route} setRoute={setRoute}>
      <section className="homeStage">
        <div className="heroCopy">
          <span className="eyebrow">차트 위에서 배우는 한국 주식</span>
          <h1>차트로 배우고, 조건으로 검토합니다.</h1>
          <p>학습과 실전 중 하나를 고르면 검색, 차트 주석, AI 예측, 호재와 악재가 한 흐름으로 이어집니다.</p>
          <div className="modeSwitch" aria-label="서비스 모드 선택">
            <button
              className={mode === "learning" ? "selected" : ""}
              type="button"
              onClick={() => setMode("learning")}
            >
              학습
            </button>
            <button
              className={mode === "practice" ? "selected" : ""}
              type="button"
              onClick={() => setMode("practice")}
            >
              실전
            </button>
          </div>
        </div>

        <SearchCommand
          candidates={candidates}
          onOpenLearning={() => setRoute("learn")}
          onSelectStock={setSelectedCode}
        />

        {status === "loading" ? <div className="softStatus">차트와 AI 조건을 불러오는 중입니다.</div> : null}
        {status === "fallback" ? <div className="softStatus warning">백엔드 연결이 불안정해 예시 데이터로 표시합니다.</div> : null}

        <div className="productGrid">
          <ChartWorkspace interval={interval} mode={mode === "practice" ? "practice" : "learning"} onIntervalChange={setInterval} workspace={workspace} />
          <AIPredictionPanel mode={mode === "practice" ? "practice" : "learning"} workspace={workspace} />
        </div>

        <div className="supportGrid">
          <LearningPanel compact terms={terms} onAsk={askLearning} />
          <PortfolioSandbox workspace={workspace} />
        </div>
      </section>
    </AppShell>
  );
}
