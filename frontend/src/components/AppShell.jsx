import { Archive, BookOpen, LineChart, ShieldCheck } from "lucide-react";
import { ThreeMarketStage } from "./ThreeMarketStage.jsx";

const navItems = [
  { id: "learn", label: "학습", icon: BookOpen },
  { id: "practice", label: "실전", icon: LineChart },
  { id: "archive", label: "기록", icon: Archive },
  { id: "admin", label: "운영", icon: ShieldCheck }
];

export function AppShell({ children, route, setRoute }) {
  return (
    <div className="appShell">
      <ThreeMarketStage />
      <header className="topbar">
        <a className="brand" href="#home" onClick={() => setRoute("home")} aria-label="홈으로 이동">
          <span className="brandMark">차</span>
          <span>
            <strong>차트해석</strong>
            <small>AI 주식 학습</small>
          </span>
        </a>

        {route === "home" ? null : (
          <nav className="quietNav" aria-label="보조 화면">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a className={route === item.id ? "active" : ""} href={`#${item.id}`} key={item.id}>
                  <Icon size={16} />
                  {item.label}
                </a>
              );
            })}
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
