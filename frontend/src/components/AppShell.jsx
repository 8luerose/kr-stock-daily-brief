import { Archive, BookOpen, LineChart, ShieldCheck } from "lucide-react";
import { ThreeMarketStage } from "./ThreeMarketStage.jsx";

export function AppShell({ children, route, setRoute }) {
  return (
    <div className="appShell">
      <ThreeMarketStage />
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => setRoute("home")}>
          <span className="brandMark">차</span>
          <span>
            <strong>차트해석</strong>
            <small>한국 주식 AI 학습</small>
          </span>
        </a>
        {route === "home" ? null : (
          <nav className="quietNav" aria-label="보조 화면">
            <a className={route === "learn" ? "active" : ""} href="#learn">
              <BookOpen size={16} />
              학습
            </a>
            <a className={route === "practice" ? "active" : ""} href="#practice">
              <LineChart size={16} />
              실전
            </a>
            <a className={route === "archive" ? "active" : ""} href="#archive">
              <Archive size={16} />
              기록
            </a>
            <a className={route === "admin" ? "active" : ""} href="#admin">
              <ShieldCheck size={16} />
              운영
            </a>
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
