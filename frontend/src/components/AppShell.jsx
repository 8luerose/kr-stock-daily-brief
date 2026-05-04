import { BarChart3, BookOpen, BriefcaseBusiness, History, ShieldCheck, Sparkles } from "lucide-react";

const navItems = [
  { id: "home", label: "리서치", icon: BarChart3 },
  { id: "learning", label: "배우기", icon: BookOpen },
  { id: "portfolio", label: "샌드박스", icon: BriefcaseBusiness },
  { id: "history", label: "기록", icon: History },
  { id: "admin", label: "운영", icon: ShieldCheck }
];

const titles = {
  home: "AI 차트 리서치",
  learning: "초보자 학습",
  portfolio: "포트폴리오 샌드박스",
  history: "브리프 기록",
  admin: "운영 콘솔"
};

export function AppShell({ route, go, children, meta }) {
  return (
    <div className="appShell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="한국 주식 AI 학습 홈">
          <span className="brandMark" aria-hidden="true">
            <Sparkles size={18} />
          </span>
          <span>
            <strong>한국 주식 AI 학습</strong>
            <small>{titles[route] || titles.home}</small>
          </span>
        </a>

        <nav className="navTabs" aria-label="주요 화면">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={route === item.id ? "active" : ""}
                onClick={() => go(item.id)}
                aria-current={route === item.id ? "page" : undefined}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="topMeta" aria-label="데이터 상태">
          <span>{meta.asOf}</span>
          <b>{meta.confidence}</b>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
