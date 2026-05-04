import { useEffect } from "react";
import { BookOpen, ChevronRight, LineChart, Search, Sparkles } from "lucide-react";
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

function HomeLanding({ onSelectMode }) {
  return (
    <section className="choiceStage" aria-label="서비스 시작">
      <div className="choiceCopy">
        <span className="eyebrow">차트 위에서 배우는 한국 주식</span>
        <h1>AI가 차트 위에 해석을 붙여줍니다.</h1>
        <p>복잡한 메뉴 대신 학습과 실전 중 하나만 고르세요. 검색, 차트 주석, 예측 조건, 호재와 악재는 다음 화면에서 이어집니다.</p>
        <div className="choiceActions" aria-label="서비스 모드 선택">
          <a className="choiceButton primary" href="#learn" onClick={() => onSelectMode("learn")}>
            <BookOpen size={22} />
            <strong>학습</strong>
            <span>용어와 차트 이유를 같이 보기</span>
            <ChevronRight size={18} />
          </a>
          <a className="choiceButton" href="#practice" onClick={() => onSelectMode("practice")}>
            <LineChart size={22} />
            <strong>실전</strong>
            <span>매수와 매도 검토 조건 보기</span>
            <ChevronRight size={18} />
          </a>
        </div>
      </div>

      <div className="landingPreview" aria-label="AI 차트 주석 미리보기">
        <div className="previewSearch">
          <Search size={18} />
          <span>삼성전자 · 거래량 · 반도체 호재</span>
        </div>
        <div className="previewChart">
          <svg viewBox="0 0 560 310" role="img" aria-label="AI 주석이 붙은 차트 미리보기">
            <defs>
              <linearGradient id="previewFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3182f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3182f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 1, 2].map((line) => (
              <line className="previewGrid" key={line} x1="32" x2="528" y1={68 + line * 66} y2={68 + line * 66} />
            ))}
            <rect className="previewZone buy" x="332" y="98" width="86" height="62" rx="8" />
            <rect className="previewZone risk" x="76" y="188" width="88" height="46" rx="8" />
            <polygon className="previewArea" points="34,228 68,220 102,212 136,224 170,218 204,202 238,176 272,178 306,142 340,132 374,112 408,126 442,96 476,84 518,92 528,250 34,250" />
            <polyline className="previewLine" points="34,228 68,220 102,212 136,224 170,218 204,202 238,176 272,178 306,142 340,132 374,112 408,126 442,96 476,84 518,92" />
            <path className="previewArrow" d="M390 82 C372 92 356 106 344 126" />
            <path className="previewArrow" d="M150 174 C128 184 108 196 92 214" />
            <text className="previewLabel" x="356" y="74">거래량 동반 상승</text>
            <text className="previewLabel" x="72" y="164">지지선 확인</text>
            {[62, 94, 128, 182, 236, 304, 366, 442, 492].map((x, index) => (
              <rect className={index % 3 === 0 ? "previewVolume hot" : "previewVolume"} key={x} x={x} y={250 - ((index % 4) + 1) * 11} width="9" height={((index % 4) + 1) * 11} rx="3" />
            ))}
          </svg>
          <div className="previewBubble">
            <Sparkles size={16} />
            <strong>왜 움직였나</strong>
            <span>가격 돌파와 거래량 증가가 함께 나온 구간입니다.</span>
          </div>
        </div>
        <div className="previewMeta">
          <span>AI 예측</span>
          <strong>조건 확인 후 검토</strong>
          <em>기준일 2026-05-05 · 신뢰도 보통</em>
        </div>
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

      <SearchCommand candidates={candidates} onOpenLearning={onOpenLearning} onSelectStock={onSelectStock} />

      {status === "loading" ? <div className="softStatus">차트와 AI 조건을 불러오는 중입니다.</div> : null}
      {status === "fallback" ? <div className="softStatus warning">백엔드 연결이 불안정해 예시 데이터로 표시합니다.</div> : null}

      <div className="productGrid">
        <ChartWorkspace interval={interval} mode={isPractice ? "practice" : "learning"} onIntervalChange={onIntervalChange} workspace={workspace} />
        <AIPredictionPanel mode={isPractice ? "practice" : "learning"} workspace={workspace} />
      </div>

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
    </section>
  );
}

export function App() {
  const [route, setRoute] = useHashRoute();
  const workspaceState = useResearchWorkspace();
  const { candidates, interval, setInterval, setSelectedCode, status, terms, workspace } = workspaceState;

  useEffect(() => {
    document.title = titles[route] || titles.home;
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
      <HomeLanding
        onSelectMode={(nextMode) => {
          setRoute(nextMode);
        }}
      />
    </AppShell>
  );
}
