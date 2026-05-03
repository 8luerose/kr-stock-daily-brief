import React, { useEffect, useMemo, useState } from "react";
import { AiInsightPanel, AdminOperationsPanel, BriefHistoryCalendar } from "./AppPanels.jsx";
import { COPY, PAGE_LABELS, SEARCH_THEME_FALLBACKS } from "./AppConstants.js";
import { HistoryOverview, LearningPanel, MarketHero, PortfolioPanel, StockResearchPanel } from "./AppSections.jsx";

function naverMainFromDayUrl(dayUrl) {
  if (!dayUrl) return "";
  return dayUrl.replace("/item/sise_day.naver?code=", "/item/main.naver?code=");
}

function buildTwoNaverLinks(dayUrl) {
  const day = dayUrl || "";
  const main = naverMainFromDayUrl(dayUrl);
  // Return at most 2 unique links.
  const out = [];
  if (day) out.push({ href: day, label: "네이버(일별)" });
  if (main && main !== day) out.push({ href: main, label: "네이버(종합)" });
  return out.slice(0, 2);
}

function buildEvidenceLinks(naverDayUrl, yahooUrl) {
  const links = [];
  
  // 네이버 링크 (최대 1개)
  const naverLinks = buildTwoNaverLinks(naverDayUrl);
  if (naverLinks.length > 0) {
    links.push(naverLinks[0]); // 네이버 일별만 사용
  }
  
  // Yahoo Finance 링크 (1개)
  if (yahooUrl) {
    links.push({ href: yahooUrl, label: "Yahoo Finance" });
  }
  
  return links.slice(0, 2); // 총 2개로 제한
}

function valueOrDash(v) {
  return v && String(v).trim() ? v : "-";
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("ko-KR");
}

function formatRate(value) {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function stockRouteHash(stock) {
  if (!stock?.code) return "#stock";
  return `#research-stock-${stock.code}`;
}

function pageFromHash(hash) {
  const value = (hash || "").replace(/^#/, "");
  if (value.startsWith("research")) return "research";
  if (value === "history") return "history";
  if (value === "learning") return "learning";
  if (value === "portfolio") return "portfolio";
  if (value === "admin") return "admin";
  return "home";
}

function stockFromEntry(item, group) {
  if (!item) return null;
  return {
    code: item.code || "",
    name: item.name || "",
    rate: item.rate,
    count: item.count,
    group
  };
}

function buildStockPicks(summary) {
  if (!summary) return [];
  return [
    ...sortTopGainers(summary.topGainers).slice(0, 3).map((item) => stockFromEntry(item, "상승 TOP3")),
    ...sortTopLosers(summary.topLosers).slice(0, 3).map((item) => stockFromEntry(item, "하락 TOP3")),
    ...filterMostMentioned(summary.mostMentionedTop).slice(0, 3).map((item) => stockFromEntry(item, "언급 TOP3"))
  ].filter(Boolean);
}

function getDataAsOf(summary, selected) {
  if (!summary) return selected;
  return formatEffectiveDate(summary.effectiveDate) || summary.date || selected;
}

function getConfidenceLabel(summary) {
  if (!summary) return "대기";
  if (summary.marketClosed) return "휴장";
  if (summary.rankingWarning || asArray(summary.anomalies).length > 0) return "주의 필요";
  if (summary.rawNotes && summary.rawNotes.includes("Source: pykrx")) return "높음";
  return "중간";
}

function getMarketHeadline(summary, selected) {
  if (!summary) return `${selected} 브리프가 아직 없습니다.`;
  if (summary.marketClosed) return `${selected} 한국 증시는 휴장일입니다.`;
  const gainer = valueOrDash(summary.topGainer);
  const loser = valueOrDash(summary.topLoser);
  const mentioned = valueOrDash(summary.mostMentioned);
  return `${gainer} 상승, ${loser} 하락, ${mentioned} 관심 집중`;
}

function getStockSignalLines(stock) {
  if (!stock) return [];
  const lines = [];
  if (stock.rate !== undefined && stock.rate !== null) {
    const rate = Number(stock.rate);
    if (Number.isFinite(rate)) {
      if (rate > 0) {
        lines.push(`등락률 ${formatRate(rate)}: 상승 원인이 공시, 뉴스, 거래량 증가와 연결되는지 확인`);
        lines.push("급등 후 거래량이 줄면 단기 과열 가능성도 함께 점검");
      } else {
        lines.push(`등락률 ${formatRate(rate)}: 하락 원인이 일시 이슈인지 구조적 변화인지 구분`);
        lines.push("전저점 이탈 여부와 거래량 증가 여부를 함께 확인");
      }
    }
  }
  if (stock.count !== undefined && stock.count !== null) {
    lines.push(`토론방 언급 ${formatNumber(stock.count)}건: 관심도는 높지만 공식 근거와 분리해서 확인`);
    lines.push("언급량 증가가 거래량, 공시, 뉴스와 같은 방향인지 확인");
  }
  return lines.length > 0 ? lines : ["선택한 종목의 거래량, 공시, 뉴스, 시장 전체 흐름을 함께 확인"];
}

function rangeForInterval(interval) {
  if (interval === "monthly") return "3Y";
  if (interval === "weekly") return "1Y";
  return "6M";
}

function fromForEvents(chart) {
  const data = asArray(chart?.data);
  if (data.length === 0) return "";
  return data[Math.max(0, data.length - 90)]?.date || data[0]?.date || "";
}

function summarizeChart(chart, events) {
  const data = asArray(chart?.data);
  if (data.length < 2) {
    return {
      trend: "차트 데이터가 부족해 추세 판단을 보류합니다.",
      changeRate: null,
      latest: null,
      volumeRate: null
    };
  }
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const first = data[0];
  const changeRate = prev.close ? ((latest.close - prev.close) / prev.close) * 100 : 0;
  const rangeRate = first.close ? ((latest.close - first.close) / first.close) * 100 : 0;
  const avgVolume = data.slice(-20).reduce((sum, row) => sum + Number(row.volume || 0), 0) / Math.min(20, data.length);
  const volumeRate = avgVolume ? (latest.volume / avgVolume) * 100 : 0;
  const eventCount = asArray(events?.events).length;
  const trend =
    rangeRate >= 12
      ? "중기 상승 흐름이 강합니다. 추격보다 눌림과 거래량 지속 여부가 중요합니다."
      : rangeRate <= -12
        ? "중기 하락 압력이 큽니다. 반등보다 하락 추세 완화 신호를 먼저 확인해야 합니다."
        : "뚜렷한 한 방향보다 변동 구간에 가깝습니다. 지지, 저항, 거래량 변화를 함께 봅니다.";
  return { trend, changeRate, rangeRate, latest, volumeRate, eventCount };
}

function buildDecisionPanel(chart, events, riskMode) {
  const s = summarizeChart(chart, events);
  const eventCount = s.eventCount || 0;
  const modeText = riskMode === "aggressive" ? "공격형" : riskMode === "conservative" ? "보수형" : "중립형";
  const buy =
    riskMode === "aggressive"
      ? "20일선 근처에서 반등하고 거래량이 평균 이상으로 붙으면 소액 분할 진입을 검토할 수 있음"
      : riskMode === "conservative"
        ? "20일선과 직전 고점을 모두 회복하고 거래량이 2거래일 이상 유지될 때까지 기다리는 편이 적합"
        : "20일선 회복, 전일 대비 거래량 증가, 직전 저점 방어가 동시에 보이면 매수 검토 구간으로 볼 수 있음";
  return {
    summary: s.trend,
    buy,
    splitBuy: "한 번에 진입하지 않고 지지선 확인, 거래량 유지, 눌림 반등을 나누어 확인할 때 분할매수 검토 구간으로 볼 수 있음",
    watch: "가격 방향과 거래량 방향이 엇갈리거나 주요 이벤트 근거가 부족하면 새 신호가 확인될 때까지 관망이 우선",
    sell: "급등 후 거래량 감소, 긴 윗꼬리 반복, 직전 고점 돌파 실패가 겹치면 일부 차익 실현을 검토할 수 있음",
    stop: "전저점 이탈 또는 하락일 거래량 급증이 나오면 비중 축소, 손절 기준, 재진입 조건을 다시 세워야 함",
    opposite: "가격은 오르지만 거래량이 줄거나, 거래량은 늘지만 종가가 저가 근처에서 끝나면 상승 해석을 낮춰야 함",
    evidence: [
      `기준일: ${s.latest?.date || chart?.asOf || "-"}`,
      `최근 등락률: ${s.changeRate === null ? "-" : formatRate(s.changeRate)}`,
      `20일 평균 대비 거래량: ${s.volumeRate ? `${s.volumeRate.toFixed(0)}%` : "-"}`,
      `감지 이벤트: ${eventCount}건`,
      `시나리오: ${modeText}`
    ],
    confidence: asArray(chart?.data).length >= 60 ? "중간-높음" : "중간"
  };
}

function portfolioRisk(items) {
  const list = asArray(items);
  const totalWeight = list.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  const maxItem = list.reduce((max, item) => (Number(item.weight || 0) > Number(max?.weight || 0) ? item : max), null);
  const volatileCount = list.filter((item) => Math.abs(Number(item.rate || 0)) >= 10).length;
  return {
    totalWeight,
    maxItem,
    volatileCount,
    concentration:
      Number(maxItem?.weight || 0) >= 50
        ? "한 종목 비중이 큽니다. 급락 이벤트가 생기면 전체 변동성이 커질 수 있습니다."
        : "비중이 한 종목에 과도하게 몰리지는 않았습니다.",
    volatility:
      volatileCount > 0
        ? `${volatileCount}개 종목이 큰 변동률 구간입니다. 이벤트 근거와 손실 허용 기준을 먼저 확인합니다.`
        : "큰 변동률 종목은 아직 적습니다. 다만 이벤트 발생 시 비중 변화를 다시 확인합니다."
  };
}

function formatEffectiveDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return null;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function buildNaverLinks(code, effectiveDate) {
  if (!code) return [];
  const dailyPage = calcPageFromEffectiveDate(effectiveDate, 10);
  const boardPage = calcPageFromEffectiveDate(effectiveDate, 20);
  
  const links = [
    { 
      href: dailyPage 
        ? `https://finance.naver.com/item/sise_day.naver?code=${code}&page=${dailyPage}` 
        : `https://finance.naver.com/item/sise_day.naver?code=${code}`, 
      label: COPY.naverDaily 
    },
    { href: `https://finance.naver.com/item/main.naver?code=${code}`, label: COPY.naverMain },
    { 
      href: boardPage 
        ? `https://finance.naver.com/item/board.naver?code=${code}&page=${boardPage}` 
        : `https://finance.naver.com/item/board.naver?code=${code}`, 
      label: COPY.naverBoard 
    }
  ];
  return links;
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

// TOP3 정렬 유틸리티 함수
function sortTopGainers(arr) {
  return [...asArray(arr)].sort((a, b) => (b.rate || 0) - (a.rate || 0));
}

function sortTopLosers(arr) {
  // 더 음수일수록 1위 (오름차순)
  return [...asArray(arr)].sort((a, b) => (a.rate || 0) - (b.rate || 0));
}

function sortMostMentioned(arr) {
  return [...asArray(arr)].sort((a, b) => (b.count || 0) - (a.count || 0));
}

function filterMostMentioned(arr) {
  return sortMostMentioned(asArray(arr)).filter(item => (item.count || 0) > 0);
}

function normalizeText(value) {
  return (value || "").trim().toLowerCase();
}

function termMatches(term, query, category) {
  const q = normalizeText(query);
  const c = normalizeText(category);
  if (c && normalizeText(term.category) !== c) return false;
  if (!q) return true;
  const haystack = [
    term.id,
    term.term,
    term.category,
    term.plainDefinition,
    term.whyItMatters,
    term.beginnerCheck,
    term.caution,
    ...asArray(term.relatedTerms),
    ...asArray(term.exampleQuestions)
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function buildTermCoreSummary(term) {
  if (!term) return "";
  return `${term.term}은(는) ${term.plainDefinition}`;
}

function buildTermScenario(term) {
  if (!term) return "";
  const name = term.term;
  const category = term.category;
  if (category === "차트") {
    return `예: ${name} 신호를 봤다면 바로 매수하기보다 거래량, 지지선, 전일 흐름을 함께 확인합니다. 조건이 두세 가지 이상 맞을 때만 소액으로 검토하고, 반대 신호가 나오면 관망합니다.`;
  }
  if (category === "매매") {
    return `예: ${name}을(를) 사용할 때는 주문 전 목표 가격, 손실 제한, 전체 비중을 먼저 정합니다. 체결 후에는 계획과 다르게 움직이는지 확인하고, 감정적으로 추가 주문하지 않습니다.`;
  }
  if (category === "리스크") {
    return `예: ${name}이(가) 커진 종목은 수익 기회보다 먼저 손실 가능 금액을 계산합니다. 거래량과 뉴스 근거가 약하면 비중을 줄이고, 기준을 이탈하면 다시 판단합니다.`;
  }
  if (category === "재무") {
    return `예: ${name} 지표가 좋아 보여도 같은 업종 평균, 최근 실적 흐름, 일회성 요인을 같이 봅니다. 숫자 하나만으로 저평가나 우량주라고 단정하지 않습니다.`;
  }
  if (category === "공시/뉴스") {
    return `예: ${name}이(가) 등장하면 제목만 보지 말고 원문 날짜, 금액, 조건, 정정 여부를 확인합니다. 이후 가격과 거래량이 같은 방향으로 반응하는지 봅니다.`;
  }
  if (category === "상품") {
    return `예: ${name} 상품을 고를 때는 추종 대상, 보수, 거래량, 괴리율, 보유 기간을 먼저 봅니다. 구조를 이해하지 못하면 매수하지 않고 더 단순한 상품부터 비교합니다.`;
  }
  return `예: ${name}을(를) 볼 때는 오늘 브리프의 종목 움직임과 연결해 생각합니다. 시장 전체 흐름인지 개별 이슈인지 나눈 뒤 다음 행동을 정합니다.`;
}

function buildTermQuestion(term) {
  return asArray(term?.exampleQuestions)[0] || `${term?.term || "이 용어"}가 무슨 뜻이야?`;
}

function pickBriefTerms(terms) {
  const ids = ["price-change-rate", "volume", "board-mentions", "kospi", "kosdaq", "disclosure"];
  return ids.map((id) => terms.find((term) => term.id === id)).filter(Boolean);
}

function buildSearchItems(summary, terms) {
  const stocks = buildStockPicks(summary).map((stock) => ({
    id: `stock-${stock.code}`,
    type: "stock",
    title: stock.name,
    code: stock.code,
    market: stock.group?.includes("언급") ? "관심 종목" : "오늘 움직인 종목",
    rate: stock.count ? `${formatNumber(stock.count)}건` : formatRate(stock.rate),
    tags: [stock.group, stock.code].filter(Boolean),
    summary: getStockSignalLines(stock)[0],
    stock
  }));
  const glossary = asArray(terms).map((term) => ({
    id: `term-${term.id}`,
    type: "term",
    title: term.term,
    code: term.category,
    market: "용어",
    rate: "학습",
    tags: [term.category, ...asArray(term.relatedTerms).slice(0, 2)].filter(Boolean),
    summary: buildTermCoreSummary(term),
    term
  }));
  return [...stocks, ...SEARCH_THEME_FALLBACKS, ...glossary];
}

function normalizeSearchResult(item, localItems) {
  if (!item) return null;
  if (item.type === "stock") {
    const stock = localItems.find((local) => local.type === "stock" && local.code === item.code)?.stock || {
      code: item.stockCode || item.code || "",
      name: item.stockName || item.title || "",
      rate: item.rate,
      group: item.market
    };
    return { ...item, stock };
  }
  if (item.type === "term") {
    const term = localItems.find((local) => local.type === "term" && local.term?.id === item.termId)?.term;
    return { ...item, term };
  }
  return item;
}

function searchMatchesItem(item, query) {
  const q = normalizeText(query);
  if (!q) return false;
  return [
    item.title,
    item.code,
    item.market,
    item.rate,
    item.summary,
    ...asArray(item.tags)
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

// effectiveDate(YYYYMMDD)로부터 page 파라미터 계산
// 네이버 일별시세는 한 페이지에 약 10일, 토론은 페이지당 게시물 수가 다름
// 휴리스틱: 오늘부터 해당일까지의 일수 차이를 이용해 근사 페이지 계산
function calcPageFromEffectiveDate(effectiveDate, pageSize = 10) {
  if (!effectiveDate || effectiveDate.length !== 8) return null;
  
  try {
    const year = parseInt(effectiveDate.slice(0, 4), 10);
    const month = parseInt(effectiveDate.slice(4, 6), 10) - 1;
    const day = parseInt(effectiveDate.slice(6, 8), 10);
    const targetDate = new Date(year, month, day);
    const today = new Date();
    
    // 일수 차이 계산
    const diffTime = today.getTime() - targetDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 거래일 근사 (주말 제외 대략 5/7 비율 적용)
    const approxTradingDays = Math.floor(diffDays * (5 / 7));
    
    // 페이지 계산 (pageSize일당 1페이지)
    const page = Math.max(1, Math.ceil(approxTradingDays / pageSize));
    return page;
  } catch {
    return null;
  }
}

function LinkOrDash({ href, label }) {
  if (!href) return <span>-</span>;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="link">
      {label}
    </a>
  );
}

function EvidenceDisclosure({ links, compact = false }) {
  if (links.length === 0) return <span className="evidenceEmpty">근거 없음</span>;
  return (
    <details className={`evidenceDisclosure ${compact ? "compact" : ""}`}>
      <summary>{COPY.evidenceLinks}</summary>
      <div>
        {links.map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className={compact ? "linkBadge" : undefined}>
            {link.label}
          </a>
        ))}
      </div>
    </details>
  );
}

function LeaderMetricCard({ label, value, explanation, links }) {
  return (
    <div className="kvItem">
      <span>{label}</span>
      <strong>{valueOrDash(value)}</strong>
      {explanation ? (
        <div className={`leaderExplanation ${explanation.level}`}>
          <div>{explanation.summary}</div>
          <div className="leaderLinks">
            <EvidenceDisclosure links={links} />
          </div>
        </div>
      ) : (
        <div className="leaderLinks">
          <EvidenceDisclosure links={links} />
        </div>
      )}
    </div>
  );
}

function TopListColumn({ title, items, group, valueType, effectiveDate, onSelect }) {
  if (items.length === 0) return null;

  return (
    <div className="topList">
      <h4>{title}</h4>
      <ul>
        {items.map((item, idx) => {
          const stock = stockFromEntry(item, group);
          return (
            <li key={item.code || idx}>
              <button type="button" className="topListButton" onClick={() => onSelect(stock)}>
                <span className="itemName">{item.name}({item.code})</span>
                {valueType === "count" ? (
                  <span className="itemCount">{formatNumber(item.count)}{COPY.postCount}</span>
                ) : (
                  <span className={`itemRate ${Number(item.rate) < 0 ? "loss" : "gain"}`}>{formatRate(item.rate)}</span>
                )}
              </button>
              <div className="itemLinks">
                <EvidenceDisclosure links={buildNaverLinks(item.code, effectiveDate)} compact />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function resolveApiLink(href, apiBaseUrl, k) {
  if (!href) return "";
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  try {
    const url = new URL(apiBaseUrl + href);
    if (k) {
      url.searchParams.set("k", k);
    }
    return url.toString();
  } catch {
    return href;
  }
}

function getLeaderExplanation(summary, key) {
  const node = summary?.leaderExplanations?.[key];
  return {
    level: node?.level || "info",
    summary: node?.summary || "설명 데이터가 없습니다.",
    evidenceLinks: asArray(node?.evidenceLinks)
  };
}

function isoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildCalendarDays(monthDate) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  // Week starts on Sunday to keep it simple.
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - start.getDay());

  const gridEnd = new Date(end);
  gridEnd.setDate(end.getDate() + (6 - end.getDay()));

  const days = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getConfig() {
  const cfg = window.__CONFIG__ || {};
  return {
    apiBaseUrl: (cfg.API_BASE_URL || "http://localhost:8080").replace(/\/$/, ""),
    gateEnabled: Boolean(cfg.GATE_ENABLED)
  };
}

export default function App() {
  const cfg = useMemo(() => getConfig(), []);
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const k = urlParams.get("k") || "";
  const adminKey = urlParams.get("adminKey") || urlParams.get("ak") || "";
  const [activePage, setActivePage] = useState(() => pageFromHash(window.location.hash));

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    try {
      localStorage.setItem("theme", darkMode ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [darkMode]);

  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => isoDate(new Date()));

  // Current day detail
  const [summary, setSummary] = useState(null);
  const [krxArtifact, setKrxArtifact] = useState(null);
  const [krxArtifactError, setKrxArtifactError] = useState("");

  // Dashboard stats
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);

  // Month overview (used to mark days with existing summaries)
  const [monthHasSummary, setMonthHasSummary] = useState(() => new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backfillFrom, setBackfillFrom] = useState("2026-02-01");
  const [backfillTo, setBackfillTo] = useState("2026-02-05");
  const [backfillResult, setBackfillResult] = useState(null);
  const [learningTerms, setLearningTerms] = useState([]);
  const [learningError, setLearningError] = useState("");
  const [termQuery, setTermQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [serverSearchResults, setServerSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantResponse, setAssistantResponse] = useState(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockInterval, setStockInterval] = useState("daily");
  const [riskMode, setRiskMode] = useState("neutral");
  const [stockChart, setStockChart] = useState(null);
  const [stockEvents, setStockEvents] = useState(null);
  const [stockChartLoading, setStockChartLoading] = useState(false);
  const [stockChartError, setStockChartError] = useState("");
  const [aiResearchLoading, setAiResearchLoading] = useState(false);
  const [aiResearchResponse, setAiResearchResponse] = useState(null);
  const [portfolio, setPortfolio] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("portfolioSandbox") || "[]");
    } catch {
      return [];
    }
  });

  const days = useMemo(() => buildCalendarDays(month), [month]);
  const monthLabel = useMemo(
    () =>
      month.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long"
      }),
    [month]
  );
  const categories = useMemo(
    () => Array.from(new Set(learningTerms.map((term) => term.category).filter(Boolean))),
    [learningTerms]
  );
  const visibleTerms = useMemo(
    () => learningTerms.filter((term) => termMatches(term, termQuery, selectedCategory)).slice(0, 80),
    [learningTerms, termQuery, selectedCategory]
  );
  const selectedTerm = useMemo(
    () => visibleTerms.find((term) => term.id === selectedTermId) || visibleTerms[0] || learningTerms.find((term) => term.id === selectedTermId) || learningTerms[0] || null,
    [learningTerms, selectedTermId, visibleTerms]
  );
  const briefTerms = useMemo(() => pickBriefTerms(learningTerms), [learningTerms]);
  const stockPicks = useMemo(() => buildStockPicks(summary), [summary]);
  const searchItems = useMemo(() => buildSearchItems(summary, learningTerms), [learningTerms, summary]);
  const searchResults = useMemo(
    () => {
      const serverItems = serverSearchResults.map((item) => normalizeSearchResult(item, searchItems)).filter(Boolean);
      return (serverItems.length > 0 ? serverItems : searchItems.filter((item) => searchMatchesItem(item, searchQuery))).slice(0, 6);
    },
    [searchItems, searchQuery, serverSearchResults]
  );
  const topGainers = useMemo(() => sortTopGainers(summary?.topGainers).slice(0, 3), [summary]);
  const topLosers = useMemo(() => sortTopLosers(summary?.topLosers).slice(0, 3), [summary]);
  const topMentioned = useMemo(() => filterMostMentioned(summary?.mostMentionedTop).slice(0, 3), [summary]);
  const currentStock = selectedStock || stockPicks[0] || null;
  const dataAsOf = useMemo(() => getDataAsOf(summary, selected), [summary, selected]);
  const confidenceLabel = useMemo(() => getConfidenceLabel(summary), [summary]);
  const decisionPanel = useMemo(
    () => buildDecisionPanel(stockChart, stockEvents, riskMode),
    [riskMode, stockChart, stockEvents]
  );
  const portfolioSummary = useMemo(() => portfolioRisk(portfolio), [portfolio]);

  async function apiFetch(path, opts = {}) {
    const url = new URL(cfg.apiBaseUrl + path);
    if (k) url.searchParams.set("k", k);

    const headers = new Headers(opts.headers || {});
    if (adminKey) headers.set("X-Admin-Key", adminKey);

    const res = await fetch(url.toString(), { ...opts, headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function load(dateStr) {
    setLoading(true);
    setError("");
    setKrxArtifact(null);
    setKrxArtifactError("");
    try {
      const s = await apiFetch(`/api/summaries/${dateStr}`);
      setSummary(s);
      setLoading(false);

      try {
        const artifact = await apiFetch(`/api/summaries/${dateStr}/verification/krx`);
        setKrxArtifact(artifact);
      } catch (artifactErr) {
        setKrxArtifact(null);
        setKrxArtifactError(artifactErr.message || String(artifactErr));
      }
    } catch (e) {
      // 404 = no summary yet
      if (String(e.message).includes("404")) {
        if (dateStr === isoDate(new Date())) {
          try {
            const latest = await apiFetch("/api/summaries/latest");
            setSummary(latest);
            if (latest?.date && latest.date !== dateStr) {
              setSelected(latest.date);
              const [y, m, d] = latest.date.split("-").map(Number);
              setMonth(new Date(y, m - 1, d));
            }
            return;
          } catch {
            // fall through to the empty state when there is no stored summary.
          }
        }
        setSummary(null);
      }
      else setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    // If gated and no key, skip stats call.
    if (cfg.gateEnabled && !k) {
      setStats(null);
      return;
    }

    try {
      const s = await apiFetch("/api/summaries/stats");
      setStats(s);
    } catch (e) {
      console.warn("Failed to load stats", e);
      setStats(null);
    }
  }

  async function loadInsights(monthDate) {
    if (cfg.gateEnabled && !k) {
      setInsights(null);
      return;
    }

    const from = isoDate(startOfMonth(monthDate));
    const to = isoDate(endOfMonth(monthDate));

    try {
      const data = await apiFetch(`/api/summaries/insights?from=${from}&to=${to}`);
      setInsights(data);
    } catch (e) {
      console.warn("Failed to load insights", e);
      setInsights(null);
    }
  }

  async function loadMonthOverview(monthDate) {
    // If gated and no key, don't spam the API.
    if (cfg.gateEnabled && !k) {
      setMonthHasSummary(new Set());
      return;
    }

    const from = isoDate(startOfMonth(monthDate));
    const to = isoDate(endOfMonth(monthDate));

    try {
      const list = await apiFetch(`/api/summaries?from=${from}&to=${to}`);
      const set = new Set(list.map((x) => x.date));
      setMonthHasSummary(set);
    } catch (e) {
      // Month overview is non-critical; show error only if we have nothing else.
      console.warn("Failed to load month overview", e);
      setMonthHasSummary(new Set());
    }
  }

  async function loadLearningTerms() {
    if (cfg.gateEnabled && !k) {
      setLearningTerms([]);
      return;
    }

    setLearningError("");
    try {
      const data = await apiFetch("/api/learning/terms?limit=80");
      setLearningTerms(data);
      if (!selectedTermId && data.length > 0) {
        setSelectedTermId(data[0].id);
        setAssistantQuestion(buildTermQuestion(data[0]));
      }
    } catch (e) {
      console.warn("Failed to load learning terms", e);
      setLearningTerms([]);
      setLearningError(COPY.learningLoadFailed);
    }
  }

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || (cfg.gateEnabled && !k)) {
      setServerSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }

    setServerSearchResults([]);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await apiFetch(`/api/search?query=${encodeURIComponent(q)}&limit=8`, { signal: controller.signal });
        setServerSearchResults(asArray(data));
      } catch (e) {
        if (!controller.signal.aborted) {
          console.warn("Failed to load search results", e);
          setServerSearchResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [cfg.apiBaseUrl, k, searchQuery, cfg.gateEnabled]);

  function selectTerm(term) {
    setSelectedTermId(term.id);
    setAssistantQuestion(buildTermQuestion(term));
    setAssistantResponse(null);
  }

  function selectStock(stock) {
    if (!stock) return;
    setActivePage("research");
    setSelectedStock(stock);
    if (stock.code) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${stockRouteHash(stock)}`);
    }
    window.setTimeout(() => {
      document.getElementById("stock-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  async function askMarketAssistant(questionOverride, itemOverride) {
    const question = (questionOverride || assistantQuestion || "오늘 시장을 초보자 관점으로 설명해줘").trim();
    if (!question) return;

    setAssistantLoading(true);
    setAssistantResponse(null);
    setError("");
    try {
      const data = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          contextDate: selected,
          topicType: itemOverride?.type || "market",
          topicTitle: itemOverride?.title || "오늘 시장",
          searchResult: itemOverride
            ? {
                type: itemOverride.type,
                title: itemOverride.title,
                code: itemOverride.code,
                market: itemOverride.market,
                tags: asArray(itemOverride.tags),
                summary: itemOverride.summary,
                source: itemOverride.source
              }
            : null,
          summary: summary
            ? {
                date: summary.date,
                topGainer: summary.topGainer,
                topLoser: summary.topLoser,
                mostMentioned: summary.mostMentioned
              }
            : null,
          terms: briefTerms
        })
      });
      setAssistantQuestion(question);
      setAssistantResponse(data);
    } catch (e) {
      setAssistantQuestion(question);
      setAssistantResponse({
        answer: formatApiError(e),
        confidence: "low",
        sources: [],
        limitations: ["AI 서비스 응답을 받지 못했습니다."]
      });
    } finally {
      setAssistantLoading(false);
      window.setTimeout(() => {
        document.querySelector(".heroAssistant")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }

  function askAssistant() {
    if (activePage === "home") {
      askMarketAssistant();
      return;
    }
    askLearningAssistant();
  }

  async function selectSearchResult(item) {
    if (!item) return;
    if (item.type === "stock" && item.stock) {
      setSearchQuery(item.title);
      selectStock(item.stock);
      return;
    }
    if (item.type === "term" && item.term) {
      setSearchQuery(item.title);
      selectTerm(item.term);
      navigatePage("learning");
      return;
    }
    setSearchQuery(item.title);
    navigatePage("home");
    await askMarketAssistant(`${item.title}이(가) 오늘 시장에서 왜 중요한지 초보자 관점으로 설명해줘`, item);
  }

  async function askLearningAssistant(questionOverride, termIdOverride) {
    const question = (questionOverride || assistantQuestion || buildTermQuestion(selectedTerm)).trim();
    if (!question) return;

    setAssistantLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/learning/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          contextDate: selected,
          termId: termIdOverride || selectedTerm?.id || ""
        })
      });
      setAssistantQuestion(question);
      setAssistantResponse(data);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setAssistantLoading(false);
    }
  }

  async function loadStockResearch(stock, interval) {
    if (!stock?.code) {
      setStockChart(null);
      setStockEvents(null);
      setStockChartError("");
      return;
    }

    setStockChartLoading(true);
    setStockChartError("");
    try {
      const range = rangeForInterval(interval);
      const chart = await apiFetch(`/api/stocks/${stock.code}/chart?range=${range}&interval=${interval}`);
      setStockChart(chart);

      const from = fromForEvents(chart);
      const to = chart.asOf || asArray(chart.data).at(-1)?.date || "";
      if (from && to) {
        const events = await apiFetch(`/api/stocks/${stock.code}/events?from=${from}&to=${to}`);
        setStockEvents(events);
      } else {
        setStockEvents(null);
      }
    } catch (e) {
      console.warn("Failed to load stock research", e);
      setStockChart(null);
      setStockEvents(null);
      setStockChartError(COPY.chartFailed);
    } finally {
      setStockChartLoading(false);
    }
  }

  async function askChartAi() {
    if (!currentStock?.code) return;
    setAiResearchLoading(true);
    setAiResearchResponse(null);
    try {
      const data = await apiFetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${currentStock.name} 차트와 이벤트를 초보자 관점으로 설명해줘`,
          contextDate: stockChart?.asOf || dataAsOf,
          stockCode: currentStock.code,
          stockName: currentStock.name,
          focus: riskMode,
          summary: summary
            ? {
                date: summary.date,
                topGainer: summary.topGainer,
                topLoser: summary.topLoser,
                mostMentioned: summary.mostMentioned
              }
            : null,
          chart: stockChart
            ? {
                interval: stockChart.interval,
                range: stockChart.range,
                asOf: stockChart.asOf,
                latest: asArray(stockChart.data).at(-1)
              }
            : null,
          events: asArray(stockEvents?.events).slice(0, 8),
          terms: briefTerms
        })
      });
      setAiResearchResponse(data);
    } catch (e) {
      setAiResearchResponse({
        answer: formatApiError(e),
        confidence: "low",
        sources: [],
        limitations: ["AI 서비스 응답을 받지 못했습니다."]
      });
    } finally {
      setAiResearchLoading(false);
    }
  }

  function savePortfolio(next) {
    setPortfolio(next);
    try {
      localStorage.setItem("portfolioSandbox", JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function addCurrentStockToPortfolio() {
    if (!currentStock?.code) return;
    const exists = portfolio.some((item) => item.code === currentStock.code);
    const next = exists
      ? portfolio
      : [
          ...portfolio,
          {
            code: currentStock.code,
            name: currentStock.name,
            group: currentStock.group,
            rate: currentStock.rate,
            count: currentStock.count,
            weight: 10
          }
        ];
    savePortfolio(next);
  }

  function updatePortfolioWeight(code, weight) {
    const value = Math.max(0, Math.min(100, Number(weight || 0)));
    savePortfolio(portfolio.map((item) => (item.code === code ? { ...item, weight: value } : item)));
  }

  function removePortfolioItem(code) {
    savePortfolio(portfolio.filter((item) => item.code !== code));
  }

  function formatApiError(err) {
    const msg = err.message || String(err);
    if (msg.includes("409") || msg.includes("summary_already_exists")) {
      return "이미 생성된 요약이 있습니다. 재생성은 관리자만 가능합니다.";
    }
    if (msg.includes("403") || msg.includes("forbidden") || msg.includes("admin_only")) {
      return "관리자 권한이 필요합니다. URL에 ?ak=관리자키 를 추가하세요.";
    }
    if (msg.includes("HTTP 401")) return "인증이 필요합니다.";
    if (msg.includes("HTTP 404")) return "데이터를 찾을 수 없습니다.";
    if (msg.includes("HTTP 500")) return "서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.";
    return msg;
  }

  async function generate(dateStr) {
    setLoading(true);
    setError("");
    try {
      const s = await apiFetch(`/api/summaries/${dateStr}/generate`, { method: "POST" });
      setSummary(s);

      // Refresh month overview so the dot appears immediately.
      await loadMonthOverview(month);
      await loadStats();
      await loadInsights(month);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function archiveSelected() {
    setLoading(true);
    setError("");
    try {
      await apiFetch(`/api/summaries/${selected}/archive`, { method: "PUT" });
      setSummary(null);
      await loadMonthOverview(month);
      await loadStats();
      await loadInsights(month);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function runBackfill() {
    setLoading(true);
    setError("");
    try {
      const r = await apiFetch(`/api/summaries/backfill?from=${backfillFrom}&to=${backfillTo}`, {
        method: "POST"
      });
      setBackfillResult(r);
      await loadMonthOverview(month);
      await loadStats();
      await loadInsights(month);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function jumpToLatest() {
    setLoading(true);
    setError("");
    try {
      const s = await apiFetch("/api/summaries/latest");
      setSummary(s);
      await loadStats();
      setSelected(s.date);
      const [y, m, d] = s.date.split("-").map(Number);
      setMonth(new Date(y, m - 1, d));
    } catch (e) {
      if (String(e.message).includes("404")) setError("아직 생성된 요약이 없습니다.");
      else setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    loadMonthOverview(month);
    loadInsights(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadLearningTerms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stockPicks.length === 0) {
      setSelectedStock(null);
      return;
    }

    const hashCode = window.location.hash.startsWith("#research-stock-")
      ? window.location.hash.replace("#research-stock-", "")
      : "";
    const matched = hashCode ? stockPicks.find((stock) => stock.code === hashCode) : null;
    setSelectedStock(matched || stockPicks[0]);
  }, [stockPicks]);

  useEffect(() => {
    const onHashChange = () => setActivePage(pageFromHash(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    setAiResearchResponse(null);
    loadStockResearch(currentStock, stockInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStock?.code, stockInterval]);

  const todayStr = useMemo(() => isoDate(new Date()), []);
  const primaryNavItems = [
    ["home", PAGE_LABELS.home],
    ["research", PAGE_LABELS.research]
  ];
  const menuNavItems = [
    ["history", PAGE_LABELS.history],
    ["learning", PAGE_LABELS.learning],
    ["portfolio", PAGE_LABELS.portfolio]
  ];
  const visibleMenuItems = adminKey ? [...menuNavItems, ["admin", PAGE_LABELS.admin]] : menuNavItems;
  const isMenuActive = visibleMenuItems.some(([page]) => page === activePage);
  const showsCalendar = activePage === "history" || activePage === "admin";
  const showsDetail = activePage === "research" || activePage === "home" || activePage === "history" || activePage === "admin";
  const usesResearchLayout = activePage === "research" || activePage === "home" || showsCalendar;

  useEffect(() => {
    const pageLabel = PAGE_LABELS[activePage] || PAGE_LABELS.home;
    document.title = `${pageLabel} | ${COPY.brand}`;
  }, [activePage]);

  function navigatePage(page) {
    setActivePage(page);
    const hash = page === "home" ? "#home" : `#${page}`;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  }

  const assistantPanel = (
    <AiInsightPanel
      activePage={activePage}
      copy={COPY}
      selected={selected}
      assistantQuestion={assistantQuestion}
      setAssistantQuestion={setAssistantQuestion}
      assistantLoading={assistantLoading}
      assistantResponse={assistantResponse}
      askAssistant={askAssistant}
      selectTerm={selectTerm}
    />
  );

  return (
    <div className="page">
      <a className="skipLink" href="#main-content">본문으로 건너뛰기</a>
      <header className="top">
        <div>
          <div className="brand">{COPY.brand}</div>
          <div className="brandSub">{COPY.productTagline}</div>
        </div>
        <div className="actions">
          <nav className="appNav" aria-label="주요 화면">
            {primaryNavItems.map(([page, label]) => (
              <button
                key={page}
                type="button"
                className={activePage === page ? "active" : ""}
                aria-current={activePage === page ? "page" : undefined}
                onClick={() => navigatePage(page)}
              >
                {label}
              </button>
            ))}
          </nav>
          <details className={`navMenu ${isMenuActive ? "active" : ""}`}>
            <summary>메뉴</summary>
            <div className="navMenuPanel">
              {visibleMenuItems.map(([page, label]) => (
                <button
                  key={page}
                  type="button"
                  className={activePage === page ? "active" : ""}
                  aria-current={activePage === page ? "page" : undefined}
                  onClick={(e) => {
                    navigatePage(page);
                    e.currentTarget.closest("details")?.removeAttribute("open");
                  }}
                >
                  {label}
                </button>
              ))}
              <button type="button" onClick={jumpToLatest} disabled={loading}>
                {COPY.moveToLatest}
              </button>
              <button type="button" onClick={() => setDarkMode((v) => !v)}>
                {darkMode ? COPY.toggleDarkOff : COPY.toggleDarkOn}
              </button>
            </div>
          </details>
        </div>
      </header>

      {activePage === "home" ? (
        <MarketHero
          copy={COPY}
          summary={summary}
          selected={selected}
          dataAsOf={dataAsOf}
          confidenceLabel={confidenceLabel}
          headline={getMarketHeadline(summary, selected)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchLoading={searchLoading}
          searchResults={searchResults}
          selectSearchResult={selectSearchResult}
          stockPicks={stockPicks}
          currentStock={currentStock}
          selectStock={selectStock}
          asArray={asArray}
          formatNumber={formatNumber}
          formatRate={formatRate}
        />
      ) : null}

      {(activePage === "home" || activePage === "learning") ? assistantPanel : null}

      {activePage === "history" ? (
        <HistoryOverview copy={COPY} stats={stats} insights={insights} />
      ) : null}

      <main
        id="main-content"
        tabIndex="-1"
        className={`main ${usesResearchLayout ? "researchLayout" : "singleLayout"}`}
      >
        {activePage !== "home" ? (
        <div className="sideStack">
        {activePage === "admin" ? (
        <AdminOperationsPanel
          copy={COPY}
          showAdminPanel={showAdminPanel}
          setShowAdminPanel={setShowAdminPanel}
          forceOpen={activePage === "admin"}
          adminKey={adminKey}
          selected={selected}
          setSelected={setSelected}
          loading={loading}
          todayStr={todayStr}
          generate={generate}
          archiveSelected={archiveSelected}
          backfillFrom={backfillFrom}
          setBackfillFrom={setBackfillFrom}
          backfillTo={backfillTo}
          setBackfillTo={setBackfillTo}
          runBackfill={runBackfill}
          backfillResult={backfillResult}
        />
        ) : null}

        {showsCalendar ? (
        <BriefHistoryCalendar
          activePage={activePage}
          copy={COPY}
          selected={selected}
          monthLabel={monthLabel}
          setMonth={setMonth}
          addMonths={addMonths}
          days={days}
          isoDate={isoDate}
          month={month}
          todayStr={todayStr}
          monthHasSummary={monthHasSummary}
          setSelected={setSelected}
        />
        ) : null}

        {activePage === "learning" ? (
          <LearningPanel
            copy={COPY}
            learningError={learningError}
            termQuery={termQuery}
            setTermQuery={setTermQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            visibleTerms={visibleTerms}
            selectedTerm={selectedTerm}
            selectTerm={selectTerm}
            buildTermCoreSummary={buildTermCoreSummary}
            buildTermScenario={buildTermScenario}
            askLearningAssistant={askLearningAssistant}
            assistantLoading={assistantLoading}
            asArray={asArray}
          />
        ) : null}

        {activePage === "portfolio" ? (
          <PortfolioPanel
            copy={COPY}
            currentStock={currentStock}
            addCurrentStockToPortfolio={addCurrentStockToPortfolio}
            portfolio={portfolio}
            updatePortfolioWeight={updatePortfolioWeight}
            removePortfolioItem={removePortfolioItem}
            portfolioSummary={portfolioSummary}
          />
        ) : null}
        </div>
        ) : null}

        {showsDetail ? (
        <section className="card detail">
          <div className="detailHead">
            <div>
              <div className="detailTitle">{activePage === "home" ? "차트 중심 브리프" : COPY.marketBrief}</div>
              <div className="detailSub">{selected} 기준</div>
            </div>
          </div>

          {cfg.gateEnabled && !k ? (
            <div className="hint">{COPY.gatedHint}</div>
          ) : null}

          {error ? <div className="error">{error}</div> : null}
          {loading ? <div className="loading">{COPY.loading}</div> : null}

          {!loading && !summary ? (
            <div className="empty">{COPY.noSummary}</div>
          ) : null}

          {!loading && summary ? (
            <div className="summary">
              <div className="meta">
                {COPY.generatedAt}: {summary.generatedAt}
                {summary.effectiveDate && summary.effectiveDate !== summary.date?.replace(/-/g, "") && (
                  <span className="effectiveDate"> | {COPY.actualCalcDate}: {formatEffectiveDate(summary.effectiveDate)}</span>
                )}
              </div>

              {briefTerms.length > 0 ? (
                <div className="briefTerms">
                  <div className="briefTermsTitle">{COPY.briefTermsTitle}</div>
                  <div className="briefTermButtons">
                    {briefTerms.map((term) => (
                      <button
                        type="button"
                        key={term.id}
                        onClick={() => selectTerm(term)}
                        className={selectedTerm?.id === term.id ? "active" : ""}
                        aria-pressed={selectedTerm?.id === term.id}
                      >
                        {term.term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {summary.marketClosed === true && (
                <div className="marketClosedBanner">
                  <div className="marketClosedIcon" aria-hidden="true">휴장</div>
                  <div>
                    <div className="marketClosedTitle">{COPY.marketClosed}</div>
                    <div className="marketClosedDesc">{summary.marketClosedReason || COPY.marketClosedDesc}</div>
                    {Array.isArray(summary.marketClosedEvidenceLinks) && summary.marketClosedEvidenceLinks.length > 0 ? (
                      <div className="marketClosedLinks">
                        {COPY.evidenceLinks}: {summary.marketClosedEvidenceLinks.slice(0, 2).map((href, idx) => (
                          <React.Fragment key={href}>
                            {idx > 0 ? " | " : ""}
                            <a href={href} target="_blank" rel="noreferrer">공식 근거</a>
                          </React.Fragment>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="kvGrid">
                <LeaderMetricCard
                  label={COPY.topGainer}
                  value={summary.topGainer}
                  explanation={getLeaderExplanation(summary, "topGainer")}
                  links={buildEvidenceLinks(summary.verification?.topGainerDateSearch, summary.verification?.topGainerYahooFinance)}
                />
                <LeaderMetricCard
                  label={COPY.topLoser}
                  value={summary.topLoser}
                  explanation={getLeaderExplanation(summary, "topLoser")}
                  links={buildEvidenceLinks(summary.verification?.topLoserDateSearch, summary.verification?.topLoserYahooFinance)}
                />
                <LeaderMetricCard
                  label={COPY.mostMentioned}
                  value={summary.mostMentioned}
                  links={buildEvidenceLinks(summary.verification?.mostMentionedDateSearch, summary.verification?.mostMentionedYahooFinance)}
                />
                <LeaderMetricCard
                  label={COPY.kospiPick}
                  value={summary.kospiPick}
                  links={buildEvidenceLinks(summary.verification?.kospiPickDateSearch, summary.verification?.kospiPickYahooFinance)}
                />
                <LeaderMetricCard
                  label={COPY.kosdaqPick}
                  value={summary.kosdaqPick}
                  links={buildEvidenceLinks(summary.verification?.kosdaqPickDateSearch, summary.verification?.kosdaqPickYahooFinance)}
                />
              </div>

              {(topGainers.length > 0 || topLosers.length > 0 || topMentioned.length > 0) ? (
                <div className="topListsSection">
                  <TopListColumn title={COPY.topGainersTitle} items={topGainers} group="상승 TOP3" valueType="rate" effectiveDate={summary.effectiveDate} onSelect={selectStock} />
                  <TopListColumn title={COPY.topLosersTitle} items={topLosers} group="하락 TOP3" valueType="rate" effectiveDate={summary.effectiveDate} onSelect={selectStock} />
                  <TopListColumn title={COPY.mostMentionedTitle} items={topMentioned} group="언급 TOP3" valueType="count" effectiveDate={summary.effectiveDate} onSelect={selectStock} />
                </div>
              ) : null}

              <StockResearchPanel
                copy={COPY}
                currentStock={currentStock}
                stockInterval={stockInterval}
                setStockInterval={setStockInterval}
                stockChart={stockChart}
                stockEvents={stockEvents}
                stockChartLoading={stockChartLoading}
                stockChartError={stockChartError}
                darkMode={darkMode}
                dataAsOf={dataAsOf}
                riskMode={riskMode}
                setRiskMode={setRiskMode}
                decisionPanel={decisionPanel}
                addCurrentStockToPortfolio={addCurrentStockToPortfolio}
                askChartAi={askChartAi}
                aiResearchLoading={aiResearchLoading}
                aiResearchResponse={aiResearchResponse}
                summary={summary}
                asArray={asArray}
                formatNumber={formatNumber}
                formatRate={formatRate}
                buildNaverLinks={buildNaverLinks}
              />

              <div className="notesWrap">
                <h4>{COPY.rankingBasis}</h4>
                <div className="verifyMeta">
                  <div>{COPY.rawFirstGainer}: {valueOrDash(summary.rawTopGainer || summary.topGainer)}</div>
                  <div>{COPY.rawFirstLoser}: {valueOrDash(summary.rawTopLoser || summary.topLoser)}</div>
                  <div>{COPY.filteredFirstGainer}: {valueOrDash(summary.filteredTopGainer || summary.topGainer)}</div>
                  <div>{COPY.filteredFirstLoser}: {valueOrDash(summary.filteredTopLoser || summary.topLoser)}</div>
                  {summary.rankingWarning && <div className="warning">{COPY.warningNote}: {valueOrDash(summary.rankingWarning)}</div>}
                </div>
                
                {asArray(summary.anomalies).length > 0 && (
                  <div className="anomalyTableWrap">
                    <table className="anomalyTable">
                      <thead>
                        <tr>
                          <th>{COPY.code}</th>
                          <th>{COPY.name}</th>
                          <th>{COPY.rate}</th>
                          <th>{COPY.signals}</th>
                          <th>{COPY.description}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {asArray(summary.anomalies).map((a) => (
                          <tr key={`${a.symbol}-${a.rate}`}>
                            <td>{valueOrDash(a.symbol)}</td>
                            <td>{valueOrDash(a.name)}</td>
                            <td>{valueOrDash(a.rate)}</td>
                            <td>{valueOrDash(asArray(a.flags).join(", "))}</td>
                            <td>{valueOrDash(a.oneLineReason)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="notesWrap">
                <h4>{COPY.verification}</h4>
                <div className="verifySimple">
                  <div className="verifySimpleRow">
                    <span className="label">{COPY.date}</span>
                    <strong>{valueOrDash(summary.verification?.date || summary.date)}</strong>
                  </div>
                  
                  {summary.verification?.topGainerDateSearch && (
                    <div className="verifySimpleRow">
                      <span className="label">{COPY.topGainer} {COPY.directLink}</span>
                      <LinkOrDash href={summary.verification.topGainerDateSearch} label="네이버 증권 열기" />
                    </div>
                  )}
                  
                  {summary.verification?.topLoserDateSearch && (
                    <div className="verifySimpleRow">
                      <span className="label">{COPY.topLoser} {COPY.directLink}</span>
                      <LinkOrDash href={summary.verification.topLoserDateSearch} label="네이버 증권 열기" />
                    </div>
                  )}
                  
                  {summary.verification?.krxDataPortal && (
                    <div className="verifySimpleRow">
                      <span className="label">{COPY.krxPortal}</span>
                      <LinkOrDash href={summary.verification.krxDataPortal} label="KRX 데이터 포털" />
                    </div>
                  )}
                  
                  {summary.verification?.verificationLimitations && (
                    <div className="verifySimpleRow notes">
                      <span className="label">{COPY.notes}</span>
                      <span>{summary.verification.verificationLimitations}</span>
                    </div>
                  )}
                </div>

                <details className="disclosureBlock">
                  <summary>{COPY.developerDetails}</summary>
                  <div className="devDetails">
                    <div className="verifyMeta">
                      <div>KRX 검증 아티팩트: <LinkOrDash href={resolveApiLink(summary.verification?.primaryKrxArtifact, cfg.apiBaseUrl, k)} label="열기" /></div>
                      <div>KRX 아티팩트 상태: {valueOrDash(krxArtifact?.status)}</div>
                      <div>KRX 아티팩트 사유: {valueOrDash(krxArtifact?.unverifiedReason || krxArtifactError)}</div>
                      <div>데이터셋: {valueOrDash(krxArtifact?.rawSourceIdentity?.datasetName)} ({valueOrDash(krxArtifact?.rawSourceIdentity?.datasetCode)})</div>
                      <div>KRX 마켓 오버뷰: <LinkOrDash href={summary.verification?.krxMarketOverview} label="열기" /></div>
                      <div>pykrx 저장소: <LinkOrDash href={summary.verification?.pykrxRepo} label="열기" /></div>
                    </div>
                    
                    <div className="verifyTableWrap">
                      <table className="verifyTable">
                        <thead>
                          <tr>
                            <th>{COPY.verifyField}</th>
                            <th>{COPY.result}</th>
                            <th>{COPY.verifySource}</th>
                            <th>{COPY.directLink}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: "topGainer", label: COPY.topGainer },
                            { key: "topLoser", label: COPY.topLoser },
                            { key: "mostMentioned", label: COPY.mostMentioned },
                            { key: "kospiPick", label: COPY.kospiPick },
                            { key: "kosdaqPick", label: COPY.kosdaqPick }
                          ].map((item) => {
                            const v = summary.verification;
                            const itemKey = item.key + "Item";
                            const dateSearchKey = item.key + "DateSearch";
                            const itemData = v?.[itemKey];
                            return (
                              <tr key={item.key}>
                                <td>{item.label}</td>
                                <td>{valueOrDash(itemData?.value || summary[item.key])}</td>
                                <td><code>{valueOrDash(itemData?.sourceName)}</code></td>
                                <td><LinkOrDash href={v?.[dateSearchKey] || itemData?.directUrl} label={v?.[dateSearchKey] || itemData?.directUrl ? "열기" : "-"} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </details>
              </div>

              <details className="notesWrap disclosureBlock">
                <summary>{COPY.showRawNotes}</summary>
                <pre className="content">{valueOrDash(summary.rawNotes)}</pre>
              </details>
            </div>
          ) : null}
        </section>
        ) : null}
      </main>
    </div>
  );
}
