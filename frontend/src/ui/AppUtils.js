import { COPY, SEARCH_THEME_FALLBACKS } from "./AppConstants.js";

function naverMainFromDayUrl(dayUrl) {
  if (!dayUrl) return "";
  return dayUrl.replace("/item/sise_day.naver?code=", "/item/main.naver?code=");
}

function buildTwoNaverLinks(dayUrl) {
  const day = dayUrl || "";
  const main = naverMainFromDayUrl(dayUrl);
  const out = [];
  if (day) out.push({ href: day, label: "네이버(일별)" });
  if (main && main !== day) out.push({ href: main, label: "네이버(종합)" });
  return out.slice(0, 2);
}

export function buildEvidenceLinks(naverDayUrl, yahooUrl) {
  const links = [];
  const naverLinks = buildTwoNaverLinks(naverDayUrl);
  if (naverLinks.length > 0) links.push(naverLinks[0]);
  if (yahooUrl) links.push({ href: yahooUrl, label: "Yahoo Finance" });
  return links.slice(0, 2);
}

export function valueOrDash(v) {
  return v && String(v).trim() ? v : "-";
}

export function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("ko-KR");
}

export function formatRate(value) {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function stockRouteHash(stock) {
  if (!stock?.code) return "#stock";
  return `#research-stock-${stock.code}`;
}

export function pageFromHash(hash) {
  const value = (hash || "").replace(/^#/, "");
  if (value.startsWith("research")) return "research";
  if (value === "history") return "history";
  if (value === "learning") return "learning";
  if (value === "portfolio") return "portfolio";
  if (value === "admin") return "admin";
  return "home";
}

export function stockFromEntry(item, group) {
  if (!item) return null;
  return {
    code: item.code || "",
    name: item.name || "",
    rate: item.rate,
    count: item.count,
    group
  };
}

export function buildStockPicks(summary) {
  if (!summary) return [];
  return [
    ...sortTopGainers(summary.topGainers).slice(0, 3).map((item) => stockFromEntry(item, "상승 TOP3")),
    ...sortTopLosers(summary.topLosers).slice(0, 3).map((item) => stockFromEntry(item, "하락 TOP3")),
    ...filterMostMentioned(summary.mostMentionedTop).slice(0, 3).map((item) => stockFromEntry(item, "언급 TOP3"))
  ].filter(Boolean);
}

export function getDataAsOf(summary, selected) {
  if (!summary) return selected;
  return formatEffectiveDate(summary.effectiveDate) || summary.date || selected;
}

export function getConfidenceLabel(summary) {
  if (!summary) return "대기";
  if (summary.marketClosed) return "휴장";
  if (summary.rankingWarning || asArray(summary.anomalies).length > 0) return "주의 필요";
  if (summary.rawNotes && summary.rawNotes.includes("Source: pykrx")) return "높음";
  return "중간";
}

export function getMarketHeadline(summary, selected) {
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

export function rangeForInterval(interval) {
  if (interval === "monthly") return "3Y";
  if (interval === "weekly") return "1Y";
  return "6M";
}

export function fromForEvents(chart) {
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

export function buildDecisionPanel(chart, events, riskMode, tradeZones) {
  const s = summarizeChart(chart, events);
  const eventCount = s.eventCount || 0;
  const modeText = riskMode === "aggressive" ? "공격형" : riskMode === "conservative" ? "보수형" : "중립형";
  const zones = asArray(tradeZones?.zones);
  const zoneByType = (type) => zones.find((zone) => zone.type === type);
  const zoneText = (type, fallback) => {
    const zone = zoneByType(type);
    if (!zone) return fallback;
    const priceRange = zone.fromPrice && zone.toPrice
      ? ` (${formatNumber(zone.fromPrice)}~${formatNumber(zone.toPrice)}원)`
      : "";
    const beginner = zone.beginnerExplanation ? ` ${zone.beginnerExplanation}` : "";
    return `${zone.condition}${priceRange}.${beginner}`;
  };
  const buy =
    riskMode === "aggressive"
      ? "20일선 근처에서 반등하고 거래량이 평균 이상으로 붙으면 소액 분할 진입을 검토할 수 있음"
      : riskMode === "conservative"
        ? "20일선과 직전 고점을 모두 회복하고 거래량이 2거래일 이상 유지될 때까지 기다리는 편이 적합"
        : "20일선 회복, 전일 대비 거래량 증가, 직전 저점 방어가 동시에 보이면 매수 검토 구간으로 볼 수 있음";
  const fallbackEvidence = [
    `기준일: ${s.latest?.date || chart?.asOf || "-"}`,
    `최근 등락률: ${s.changeRate === null ? "-" : formatRate(s.changeRate)}`,
    `20일 평균 대비 거래량: ${s.volumeRate ? `${s.volumeRate.toFixed(0)}%` : "-"}`,
    `감지 이벤트: ${eventCount}건`,
    `시나리오: ${modeText}`
  ];
  return {
    summary: tradeZones ? `${s.trend} 전용 trade-zones API 기준 구간을 함께 반영했습니다.` : s.trend,
    buy: zoneText("buy_review", buy),
    splitBuy: zoneText("split_buy", "한 번에 진입하지 않고 지지선 확인, 거래량 유지, 눌림 반등을 나누어 확인할 때 분할매수 검토 구간으로 볼 수 있음"),
    watch: zoneText("watch", "가격 방향과 거래량 방향이 엇갈리거나 주요 이벤트 근거가 부족하면 새 신호가 확인될 때까지 관망이 우선"),
    sell: zoneText("sell_review", "급등 후 거래량 감소, 긴 윗꼬리 반복, 직전 고점 돌파 실패가 겹치면 일부 차익 실현을 검토할 수 있음"),
    stop: zoneText("risk_management", "전저점 이탈 또는 하락일 거래량 급증이 나오면 비중 축소, 손절 기준, 재진입 조건을 다시 세워야 함"),
    opposite: zoneByType("risk_management")?.oppositeSignal || "가격은 오르지만 거래량이 줄거나, 거래량은 늘지만 종가가 저가 근처에서 끝나면 상승 해석을 낮춰야 함",
    evidence: asArray(tradeZones?.evidence).length > 0 ? tradeZones.evidence : fallbackEvidence,
    confidence: tradeZones?.confidence || (asArray(chart?.data).length >= 60 ? "중간-높음" : "중간")
  };
}

export function portfolioRisk(items) {
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

export function formatEffectiveDate(yyyymmdd) {
  if (!yyyymmdd || yyyymmdd.length !== 8) return null;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export function buildNaverLinks(code, effectiveDate) {
  if (!code) return [];
  const dailyPage = calcPageFromEffectiveDate(effectiveDate, 10);
  const boardPage = calcPageFromEffectiveDate(effectiveDate, 20);
  return [
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
}

export function asArray(v) {
  return Array.isArray(v) ? v : [];
}

export function sortTopGainers(arr) {
  return [...asArray(arr)].sort((a, b) => (b.rate || 0) - (a.rate || 0));
}

export function sortTopLosers(arr) {
  return [...asArray(arr)].sort((a, b) => (a.rate || 0) - (b.rate || 0));
}

function sortMostMentioned(arr) {
  return [...asArray(arr)].sort((a, b) => (b.count || 0) - (a.count || 0));
}

export function filterMostMentioned(arr) {
  return sortMostMentioned(asArray(arr)).filter((item) => (item.count || 0) > 0);
}

function normalizeText(value) {
  return (value || "").trim().toLowerCase();
}

export function termMatches(term, query, category) {
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

export function buildTermCoreSummary(term) {
  if (!term) return "";
  return `${term.term}은(는) ${term.plainDefinition}`;
}

export function buildTermScenario(term) {
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

export function buildTermQuestion(term) {
  return asArray(term?.exampleQuestions)[0] || `${term?.term || "이 용어"}가 무슨 뜻이야?`;
}

export function pickBriefTerms(terms) {
  const ids = ["price-change-rate", "volume", "board-mentions", "kospi", "kosdaq", "disclosure"];
  return ids.map((id) => terms.find((term) => term.id === id)).filter(Boolean);
}

export function buildSearchItems(summary, terms) {
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

export function normalizeSearchResult(item, localItems) {
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

export function searchMatchesItem(item, query) {
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

function calcPageFromEffectiveDate(effectiveDate, pageSize = 10) {
  if (!effectiveDate || effectiveDate.length !== 8) return null;

  try {
    const year = parseInt(effectiveDate.slice(0, 4), 10);
    const month = parseInt(effectiveDate.slice(4, 6), 10) - 1;
    const day = parseInt(effectiveDate.slice(6, 8), 10);
    const targetDate = new Date(year, month, day);
    const today = new Date();
    const diffTime = today.getTime() - targetDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const approxTradingDays = Math.floor(diffDays * (5 / 7));
    return Math.max(1, Math.ceil(approxTradingDays / pageSize));
  } catch {
    return null;
  }
}

export function resolveApiLink(href, apiBaseUrl, k) {
  if (!href) return "";
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  try {
    const url = new URL(apiBaseUrl + href);
    if (k) url.searchParams.set("k", k);
    return url.toString();
  } catch {
    return href;
  }
}

export function getLeaderExplanation(summary, key) {
  const node = summary?.leaderExplanations?.[key];
  return {
    level: node?.level || "info",
    summary: node?.summary || "설명 데이터가 없습니다.",
    evidenceLinks: asArray(node?.evidenceLinks)
  };
}

export function isoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function buildCalendarDays(monthDate) {
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
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

export function getConfig() {
  const cfg = window.__CONFIG__ || {};
  return {
    apiBaseUrl: (cfg.API_BASE_URL || "http://localhost:8080").replace(/\/$/, ""),
    gateEnabled: Boolean(cfg.GATE_ENABLED)
  };
}
