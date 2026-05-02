import React, { useEffect, useMemo, useRef, useState } from "react";
import { CandlestickSeries, HistogramSeries, LineSeries, createChart, createSeriesMarkers } from "lightweight-charts";

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

const COPY = {
  brand: "한국 주식 AI 리서치",
  productTagline: "오늘 시장을 초보자 언어로 읽는 브리프",
  todayBrief: "오늘의 시장 브리프",
  marketBrief: "시장 브리프",
  marketOneLine: "오늘 시장에서 눈에 띄는 종목과 확인할 근거를 먼저 보여줍니다.",
  noMarketOneLine: "아직 저장된 브리프가 없습니다. 최신 요약을 불러오거나 관리자 영역에서 생성할 수 있습니다.",
  dataAsOf: "데이터 기준일",
  sourceConfidence: "신뢰도",
  beginnerSignals: "초보자가 지금 확인할 신호",
  chartLoading: "차트 불러오는 중...",
  chartFailed: "차트 데이터를 불러오지 못했습니다.",
  riskMode: "판단 성향",
  aggressive: "공격형",
  neutral: "중립형",
  conservative: "보수형",
  chartSummary: "현재 차트 상태 요약",
  buyConditions: "매수 검토 조건",
  splitBuyConditions: "분할매수 검토 조건",
  watchConditions: "관망 조건",
  sellConditions: "매도 검토 조건",
  stopConditions: "손절/리스크 관리 조건",
  oppositeSignals: "반대 신호",
  evidenceData: "근거 데이터",
  analysisDisclaimer: "교육용 분석 보조 정보이며 매수, 매도 지시나 수익 보장이 아닙니다.",
  askChartAi: "AI로 차트 설명",
  aiResearchTitle: "AI 차트 해석",
  openAdmin: "관리자 영역",
  closeAdmin: "관리자 영역 닫기",
  adminTitle: "운영 관리",
  adminSubtitle: "생성, 보관, 일괄 생성은 접힌 패널에서만 실행합니다.",
  selectedDate: "조회 기준일",
  generateToday: "오늘 생성",
  moveToLatest: "최신 요약",
  toggleDarkOn: "다크 모드",
  toggleDarkOff: "라이트 모드",
  prevMonth: "이전",
  nextMonth: "다음",
  generateSelected: "선택일 생성",
  archiveSelected: "보관",
  backfillRun: "일괄 생성",
  loading: "불러오는 중...",
  noSummary: "이 날짜의 요약이 아직 없습니다.",
  marketClosed: "휴장일",
  marketClosedDesc: "이 날짜는 증권시장 휴장일입니다.",
  generatedAt: "생성 시각",
  topGainer: "최대 상승",
  topLoser: "최대 하락",
  mostMentioned: "최다 언급",
  kospiPick: "코스피 픽",
  kosdaqPick: "코스닥 픽",
  rankingBasis: "랭킹 계산 근거",
  rawFirstGainer: "처음 계산 1위 (상승)",
  rawFirstLoser: "처음 계산 1위 (하락)",
  filteredFirstGainer: "검토 후 1위 (상승, 최종)",
  filteredFirstLoser: "검토 후 1위 (하락, 최종)",
  warningNote: "주의 메모",
  code: "종목코드",
  name: "종목명",
  rate: "등락률(%)",
  signals: "감지 신호",
  description: "설명",
  evidenceLinks: "근거 링크",
  verification: "검증",
  date: "날짜",
  result: "결과값",
  directLink: "바로 확인",
  notes: "주의사항",
  showRawNotes: "원본 노트 보기",
  hideRawNotes: "원본 노트 숨기기",
  developerDetails: "개발자용 상세보기",
  closeDetails: "상세 닫기",
  summaryExists: "요약 있음",
  gatedHint: "이 화면은 비밀키가 필요합니다. URL에 ?k=비밀키 를 추가하세요.",
  cumulativeSummaries: "누적 요약",
  latestDate: "최신 날짜",
  lastUpdated: "최근 갱신",
  monthlyTotalDays: "월 총 일수",
  monthlyGenerated: "생성 완료",
  monthlyMissing: "미생성",
  monthlyTopMentioned: "월 최다 언급",
  days: ["일", "월", "화", "수", "목", "금", "토"],
  verifyField: "항목",
  verifySource: "출처",
  krxArtifact: "KRX 검증",
  krxPortal: "KRX 포털",
  pykrxRepo: "pykrx 저장소",
  actualCalcDate: "실제 계산일",
  topGainersTitle: "상승 TOP3",
  topLosersTitle: "하락 TOP3",
  mostMentionedTitle: "언급 TOP3",
  postCount: "게시물 수",
  naverDaily: "일별",
  naverMain: "종합",
  naverBoard: "토론",
  learningTitle: "초보자 용어 사전",
  learningSubtitle: "브리프를 읽을 때 막히는 단어를 바로 풀어봅니다.",
  learningSearch: "용어 검색",
  learningSearchPlaceholder: "예: 등락률, PER, 거래량",
  allCategories: "전체",
  whyItMatters: "왜 중요한가",
  beginnerCheck: "먼저 확인할 것",
  caution: "주의할 점",
  relatedTerms: "관련 용어",
  exampleQuestions: "바로 물어보기",
  learningLoadFailed: "용어 사전을 불러오지 못했습니다.",
  noTerms: "검색 결과가 없습니다.",
  assistantTitle: "AI 학습 도우미",
  assistantSubtitle: "오늘 브리프와 용어 사전을 묶어 초보자 관점으로 설명합니다.",
  assistantInputPlaceholder: "궁금한 점을 입력하세요. 예: 거래량이 왜 중요해?",
  assistantAsk: "질문",
  assistantAnswer: "답변",
  confidence: "신뢰도",
  sources: "출처",
  limitations: "한계",
  matchedTerms: "연결된 용어",
  briefTermsTitle: "브리프 읽기 전 확인할 용어"
};

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
  return `#stock-${stock.code}`;
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

function calculateMa(data, period) {
  return asArray(data)
    .map((item, index, arr) => {
      if (index < period - 1) return null;
      const windowItems = arr.slice(index - period + 1, index + 1);
      const value = windowItems.reduce((sum, row) => sum + Number(row.close || 0), 0) / period;
      return { time: item.date, value: Number(value.toFixed(2)) };
    })
    .filter(Boolean);
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

function StockPriceChart({ chart, events, darkMode }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !chart || asArray(chart.data).length === 0) return undefined;

    const rootStyle = getComputedStyle(document.documentElement);
    const textColor = rootStyle.getPropertyValue("--text-secondary").trim() || "#4b5563";
    const lineColor = rootStyle.getPropertyValue("--line").trim() || "#e5e7eb";
    const bgColor = rootStyle.getPropertyValue("--bg").trim() || "#f9fafb";

    const instance = createChart(containerRef.current, {
      autoSize: true,
      height: 360,
      layout: { background: { color: bgColor }, textColor },
      grid: { vertLines: { color: lineColor }, horzLines: { color: lineColor } },
      rightPriceScale: { borderColor: lineColor },
      timeScale: { borderColor: lineColor, timeVisible: false }
    });

    const candles = instance.addSeries(CandlestickSeries, {
      upColor: "#ef4444",
      downColor: "#3182f6",
      borderUpColor: "#ef4444",
      borderDownColor: "#3182f6",
      wickUpColor: "#ef4444",
      wickDownColor: "#3182f6"
    });
    candles.setData(
      asArray(chart.data).map((row) => ({
        time: row.date,
        open: Number(row.open),
        high: Number(row.high),
        low: Number(row.low),
        close: Number(row.close)
      }))
    );

    const ma20 = instance.addSeries(LineSeries, { color: "#10b981", lineWidth: 2, priceLineVisible: false });
    ma20.setData(calculateMa(chart.data, 20));

    const volume = instance.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "#9ca3af"
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
    volume.setData(
      asArray(chart.data).map((row) => ({
        time: row.date,
        value: Number(row.volume || 0),
        color: Number(row.close) >= Number(row.open) ? "rgba(239, 68, 68, 0.32)" : "rgba(49, 130, 246, 0.32)"
      }))
    );

    createSeriesMarkers(
      candles,
      asArray(events?.events).slice(0, 30).map((event) => ({
        time: event.date,
        position: event.type === "price_drop" ? "belowBar" : "aboveBar",
        color: event.severity === "high" ? "#ef4444" : event.severity === "medium" ? "#f59e0b" : "#3182f6",
        shape: event.type === "price_drop" ? "arrowDown" : "arrowUp",
        text: event.title
      }))
    );

    instance.timeScale().fitContent();
    return () => instance.remove();
  }, [chart, events, darkMode]);

  return <div ref={containerRef} className="realChart" aria-label={`${chart?.name || "종목"} 캔들 차트`} />;
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

function buildTermQuestion(term) {
  return asArray(term?.exampleQuestions)[0] || `${term?.term || "이 용어"}가 무슨 뜻이야?`;
}

function pickBriefTerms(terms) {
  const ids = ["price-change-rate", "volume", "board-mentions", "kospi", "kosdaq", "disclosure"];
  return ids.map((id) => terms.find((term) => term.id === id)).filter(Boolean);
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
  const [showNotes, setShowNotes] = useState(false);
  const [showDevDetails, setShowDevDetails] = useState(false);
  const [backfillFrom, setBackfillFrom] = useState("2026-02-01");
  const [backfillTo, setBackfillTo] = useState("2026-02-05");
  const [backfillResult, setBackfillResult] = useState(null);
  const [learningTerms, setLearningTerms] = useState([]);
  const [learningError, setLearningError] = useState("");
  const [termQuery, setTermQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
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
    () => learningTerms.filter((term) => termMatches(term, termQuery, selectedCategory)).slice(0, 12),
    [learningTerms, termQuery, selectedCategory]
  );
  const selectedTerm = useMemo(
    () => visibleTerms.find((term) => term.id === selectedTermId) || visibleTerms[0] || learningTerms.find((term) => term.id === selectedTermId) || learningTerms[0] || null,
    [learningTerms, selectedTermId, visibleTerms]
  );
  const briefTerms = useMemo(() => pickBriefTerms(learningTerms), [learningTerms]);
  const stockPicks = useMemo(() => buildStockPicks(summary), [summary]);
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

  function selectTerm(term) {
    setSelectedTermId(term.id);
    setAssistantQuestion(buildTermQuestion(term));
    setAssistantResponse(null);
  }

  function selectStock(stock) {
    if (!stock) return;
    setSelectedStock(stock);
    if (stock.code) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${stockRouteHash(stock)}`);
    }
    window.setTimeout(() => {
      document.getElementById("stock-detail")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
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
    setShowNotes(false);
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

    const hashCode = window.location.hash.startsWith("#stock-")
      ? window.location.hash.replace("#stock-", "")
      : "";
    const matched = hashCode ? stockPicks.find((stock) => stock.code === hashCode) : null;
    setSelectedStock(matched || stockPicks[0]);
  }, [stockPicks]);

  useEffect(() => {
    setAiResearchResponse(null);
    loadStockResearch(currentStock, stockInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStock?.code, stockInterval]);

  const todayStr = useMemo(() => isoDate(new Date()), []);
  const assistantPanel = (
    <div className="assistantBox heroAssistant">
      <div className="assistantHead">
        <div>
          <div className="assistantTitle">{COPY.assistantTitle}</div>
          <div className="assistantSubtitle">{COPY.assistantSubtitle}</div>
        </div>
        <span className="assistantDate">{selected}</span>
      </div>
      <div className="assistantInputRow">
        <input
          value={assistantQuestion}
          onChange={(e) => setAssistantQuestion(e.target.value)}
          placeholder={COPY.assistantInputPlaceholder}
          disabled={assistantLoading}
        />
        <button
          className="btn primary small"
          type="button"
          onClick={() => askLearningAssistant()}
          disabled={assistantLoading}
        >
          {assistantLoading ? COPY.loading : COPY.assistantAsk}
        </button>
      </div>
      {assistantResponse ? (
        <div className="assistantAnswer">
          <div className="assistantAnswerHead">
            <strong>{COPY.assistantAnswer}</strong>
            <span>{COPY.confidence}: {assistantResponse.confidence}</span>
          </div>
          <pre>{assistantResponse.answer}</pre>
          {asArray(assistantResponse.matchedTerms).length > 0 ? (
            <div className="assistantMeta">
              <strong>{COPY.matchedTerms}</strong>
              <div>
                {asArray(assistantResponse.matchedTerms).map((term) => (
                  <button type="button" key={term.id} onClick={() => selectTerm(term)}>
                    {term.term}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {asArray(assistantResponse.sources).length > 0 ? (
            <div className="assistantMeta">
              <strong>{COPY.sources}</strong>
              <div>
                {asArray(assistantResponse.sources).map((source) => (
                  <span key={`${source.type}-${source.title}`}>{source.title}</span>
                ))}
              </div>
            </div>
          ) : null}
          {asArray(assistantResponse.limitations).length > 0 ? (
            <div className="assistantMeta limitations">
              <strong>{COPY.limitations}</strong>
              <ul>
                {asArray(assistantResponse.limitations).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="page">
      <header className="top">
        <div>
          <div className="brand">{COPY.brand}</div>
          <div className="brandSub">{COPY.productTagline}</div>
        </div>
        <div className="actions">
          <button className="btn ghost" onClick={jumpToLatest} disabled={loading}>
            {COPY.moveToLatest}
          </button>
          <button
            className="btn ghost"
            onClick={() => setDarkMode((v) => !v)}
            type="button"
          >
            {darkMode ? COPY.toggleDarkOff : COPY.toggleDarkOn}
          </button>
        </div>
      </header>

      <section className="marketHero">
        <div className="marketHeroMain">
          <div className="eyebrow">{COPY.todayBrief}</div>
          <h1>{getMarketHeadline(summary, selected)}</h1>
          <p>{summary ? COPY.marketOneLine : COPY.noMarketOneLine}</p>
          <div className="heroMeta">
            <span>{COPY.dataAsOf}: {dataAsOf}</span>
            <span>{COPY.sourceConfidence}: {confidenceLabel}</span>
            <span>{COPY.selectedDate}: {selected}</span>
          </div>
        </div>
        <div className="marketPulse" aria-label="주요 종목 흐름">
          {(stockPicks.length > 0 ? stockPicks.slice(0, 5) : [
            { name: COPY.topGainer, group: "상승", rate: 0 },
            { name: COPY.topLoser, group: "하락", rate: 0 },
            { name: COPY.mostMentioned, group: "관심", count: 0 }
          ]).map((stock, index) => {
            const rate = Number(stock.rate || 0);
            const width = stock.count ? Math.min(100, Math.max(18, Number(stock.count))) : Math.min(100, Math.max(18, Math.abs(rate) * 2.2));
            return (
              <button
                type="button"
                key={`${stock.group}-${stock.code || stock.name}-${index}`}
                className={`pulseRow ${currentStock?.code && stock.code === currentStock.code ? "active" : ""}`}
                onClick={() => stock.code ? selectStock(stock) : null}
              >
                <span className="pulseName">{stock.name}</span>
                <span className="pulseGroup">{stock.group}</span>
                <span className="pulseTrack">
                  <span
                    className={`pulseFill ${rate < 0 ? "down" : stock.count ? "mention" : "up"}`}
                    style={{ width: `${width}%` }}
                  />
                </span>
                <strong>{stock.count ? `${formatNumber(stock.count)}건` : formatRate(stock.rate)}</strong>
              </button>
            );
          })}
        </div>
      </section>

      {assistantPanel}

      <section className="card overview">
        <div className="overviewItem">
          <span className="label">{COPY.cumulativeSummaries}</span>
          <strong>{stats?.totalCount ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">{COPY.latestDate}</span>
          <strong>{stats?.latestDate ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">{COPY.lastUpdated}</span>
          <strong>{stats?.latestUpdatedAt ?? "-"}</strong>
        </div>
      </section>

      <section className="card overview insights">
        <div className="overviewItem">
          <span className="label">{COPY.monthlyTotalDays}</span>
          <strong>{insights?.totalDays ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">{COPY.monthlyGenerated}</span>
          <strong>{insights?.generatedDays ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">{COPY.monthlyMissing}</span>
          <strong>{insights?.missingDays ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">{COPY.monthlyTopMentioned}</span>
          <strong>
            {insights?.topMostMentioned
              ? `${insights.topMostMentioned} (${insights.topMostMentionedCount}회)`
              : "-"}
          </strong>
        </div>
      </section>

      <main className="main">
        <div className="sideStack">
        <section className="card adminPanel">
          <button
            type="button"
            className="adminToggle"
            onClick={() => setShowAdminPanel((v) => !v)}
            aria-expanded={showAdminPanel}
          >
            <span>
              <strong>{COPY.adminTitle}</strong>
              <small>{COPY.adminSubtitle}</small>
            </span>
            <span>{showAdminPanel ? COPY.closeAdmin : COPY.openAdmin}</span>
          </button>
          {showAdminPanel ? (
            <div className="adminBody">
              <div className="adminDateRow">
                <label className="fieldLabel" htmlFor="selected-date">{COPY.selectedDate}</label>
                <input
                  id="selected-date"
                  type="date"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="dateInput"
                  disabled={loading}
                />
              </div>
              <div className="adminActions">
                <button className="btn primary" onClick={() => generate(todayStr)} disabled={loading}>
                  {COPY.generateToday}
                </button>
                <button className="btn" onClick={() => generate(selected)} disabled={loading}>
                  {COPY.generateSelected}
                </button>
                {adminKey ? (
                  <button className="btn ghost" onClick={archiveSelected} disabled={loading}>
                    {COPY.archiveSelected}
                  </button>
                ) : null}
              </div>
              {adminKey ? (
                <div className="backfillBar compact">
                  <input type="date" value={backfillFrom} onChange={(e) => setBackfillFrom(e.target.value)} />
                  <input type="date" value={backfillTo} onChange={(e) => setBackfillTo(e.target.value)} />
                  <button className="btn ghost" onClick={runBackfill} disabled={loading}>
                    {COPY.backfillRun}
                  </button>
                </div>
              ) : null}
              {backfillResult ? (
                <div className="hint compact">
                  완료: 성공 {backfillResult.successCount}, 저신뢰 {backfillResult.lowConfidenceCount}, 실패 {backfillResult.failCount}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="card calendar">
          <div className="calendarHead">
            <button className="btn ghost" onClick={() => setMonth(addMonths(month, -1))}>
              {COPY.prevMonth}
            </button>
            <div className="monthLabel">{monthLabel}</div>
            <button className="btn ghost" onClick={() => setMonth(addMonths(month, 1))}>
              {COPY.nextMonth}
            </button>
          </div>

          <div className="dow">
            {COPY.days.map((x) => (
              <div key={x} className="dowCell">
                {x}
              </div>
            ))}
          </div>

          <div className="grid">
            {days.map((d) => {
              const dStr = isoDate(d);
              const inMonth = d.getMonth() === month.getMonth();
              const isSelected = dStr === selected;
              const isToday = dStr === todayStr;
              const hasSummary = monthHasSummary.has(dStr);
              return (
                <button
                  key={dStr}
                  className={[
                    "day",
                    inMonth ? "inMonth" : "outMonth",
                    isSelected ? "selected" : "",
                    isToday ? "today" : "",
                    hasSummary ? "hasSummary" : ""
                  ].join(" ")}
                  onClick={() => setSelected(dStr)}
                >
                  <div className="dayNum">{d.getDate()}</div>
                  {hasSummary ? <div className="dot" title={COPY.summaryExists} /> : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card learningPanel">
          <div className="panelHead">
            <div>
              <div className="panelTitle">{COPY.learningTitle}</div>
              <div className="panelSubtitle">{COPY.learningSubtitle}</div>
            </div>
          </div>

          {learningError ? <div className="hint">{learningError}</div> : null}

          <label className="fieldLabel" htmlFor="term-search">{COPY.learningSearch}</label>
          <input
            id="term-search"
            className="searchInput"
            value={termQuery}
            onChange={(e) => setTermQuery(e.target.value)}
            placeholder={COPY.learningSearchPlaceholder}
          />

          <div className="categoryTabs" aria-label="용어 카테고리">
            <button
              type="button"
              className={`categoryTab ${selectedCategory === "" ? "active" : ""}`}
              onClick={() => setSelectedCategory("")}
            >
              {COPY.allCategories}
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                className={`categoryTab ${selectedCategory === category ? "active" : ""}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {visibleTerms.length === 0 ? (
            <div className="empty compact">{COPY.noTerms}</div>
          ) : (
            <div className="termList">
              {visibleTerms.map((term) => (
                <button
                  type="button"
                  key={term.id}
                  className={`termButton ${selectedTerm?.id === term.id ? "active" : ""}`}
                  onClick={() => selectTerm(term)}
                >
                  <span>{term.term}</span>
                  <small>{term.category}</small>
                </button>
              ))}
            </div>
          )}

          {selectedTerm ? (
            <div className="termDetail">
              <div className="termCategory">{selectedTerm.category}</div>
              <h3>{selectedTerm.term}</h3>
              <p>{selectedTerm.plainDefinition}</p>
              <div className="termInfo">
                <strong>{COPY.whyItMatters}</strong>
                <span>{selectedTerm.whyItMatters}</span>
              </div>
              <div className="termInfo">
                <strong>{COPY.beginnerCheck}</strong>
                <span>{selectedTerm.beginnerCheck}</span>
              </div>
              <div className="termInfo caution">
                <strong>{COPY.caution}</strong>
                <span>{selectedTerm.caution}</span>
              </div>
              <div className="relatedTerms">
                <span>{COPY.relatedTerms}</span>
                <div>
                  {asArray(selectedTerm.relatedTerms).slice(0, 5).map((term) => (
                    <button type="button" key={term} onClick={() => setTermQuery(term)}>
                      {term}
                    </button>
                  ))}
                </div>
              </div>
              <div className="questionList">
                <span>{COPY.exampleQuestions}</span>
                {asArray(selectedTerm.exampleQuestions).slice(0, 2).map((question) => (
                  <button
                    type="button"
                    key={question}
                    onClick={() => askLearningAssistant(question, selectedTerm.id)}
                    disabled={assistantLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>
        </div>

        <section className="card detail">
          <div className="detailHead">
            <div>
              <div className="detailTitle">{COPY.marketBrief}</div>
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
                      >
                        {term.term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {summary.marketClosed === true && (
                <div className="marketClosedBanner">
                  <div className="marketClosedIcon">📭</div>
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
                <div className="kvItem">
                  <span>{COPY.topGainer}</span>
                  <strong>{valueOrDash(summary.topGainer)}</strong>
                  <div className={`leaderExplanation ${getLeaderExplanation(summary, "topGainer").level}`}>
                    <div>{getLeaderExplanation(summary, "topGainer").summary}</div>
                    <div className="leaderLinks">
                      {COPY.evidenceLinks}: {buildEvidenceLinks(summary.verification?.topGainerDateSearch, summary.verification?.topGainerYahooFinance).length === 0 ? (
                        "-"
                      ) : (
                        buildEvidenceLinks(summary.verification?.topGainerDateSearch, summary.verification?.topGainerYahooFinance).map((x, idx) => (
                          <React.Fragment key={x.href}>
                            {idx > 0 ? " | " : ""}
                            <a href={x.href} target="_blank" rel="noreferrer">{x.label}</a>
                          </React.Fragment>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="kvItem">
                  <span>{COPY.topLoser}</span>
                  <strong>{valueOrDash(summary.topLoser)}</strong>
                  <div className={`leaderExplanation ${getLeaderExplanation(summary, "topLoser").level}`}>
                    <div>{getLeaderExplanation(summary, "topLoser").summary}</div>
                    <div className="leaderLinks">
                      {COPY.evidenceLinks}: {buildEvidenceLinks(summary.verification?.topLoserDateSearch, summary.verification?.topLoserYahooFinance).length === 0 ? (
                        "-"
                      ) : (
                        buildEvidenceLinks(summary.verification?.topLoserDateSearch, summary.verification?.topLoserYahooFinance).map((x, idx) => (
                          <React.Fragment key={x.href}>
                            {idx > 0 ? " | " : ""}
                            <a href={x.href} target="_blank" rel="noreferrer">{x.label}</a>
                          </React.Fragment>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <div className="kvItem">
                  <span>{COPY.mostMentioned}</span>
                  <strong>{valueOrDash(summary.mostMentioned)}</strong>
                  <div className="leaderLinks">
                    {COPY.evidenceLinks}: {buildEvidenceLinks(summary.verification?.mostMentionedDateSearch, summary.verification?.mostMentionedYahooFinance).length === 0 ? (
                      "-"
                    ) : (
                      buildEvidenceLinks(summary.verification?.mostMentionedDateSearch, summary.verification?.mostMentionedYahooFinance).map((x, idx) => (
                        <React.Fragment key={x.href}>
                          {idx > 0 ? " | " : ""}
                          <a href={x.href} target="_blank" rel="noreferrer">{x.label}</a>
                        </React.Fragment>
                      ))
                    )}
                  </div>
                </div>
                <div className="kvItem">
                  <span>{COPY.kospiPick}</span>
                  <strong>{valueOrDash(summary.kospiPick)}</strong>
                  <div className="leaderLinks">
                    {COPY.evidenceLinks}: {buildEvidenceLinks(summary.verification?.kospiPickDateSearch, summary.verification?.kospiPickYahooFinance).length === 0 ? (
                      "-"
                    ) : (
                      buildEvidenceLinks(summary.verification?.kospiPickDateSearch, summary.verification?.kospiPickYahooFinance).map((x, idx) => (
                        <React.Fragment key={x.href}>
                          {idx > 0 ? " | " : ""}
                          <a href={x.href} target="_blank" rel="noreferrer">{x.label}</a>
                        </React.Fragment>
                      ))
                    )}
                  </div>
                </div>
                <div className="kvItem">
                  <span>{COPY.kosdaqPick}</span>
                  <strong>{valueOrDash(summary.kosdaqPick)}</strong>
                  <div className="leaderLinks">
                    {COPY.evidenceLinks}: {buildEvidenceLinks(summary.verification?.kosdaqPickDateSearch, summary.verification?.kosdaqPickYahooFinance).length === 0 ? (
                      "-"
                    ) : (
                      buildEvidenceLinks(summary.verification?.kosdaqPickDateSearch, summary.verification?.kosdaqPickYahooFinance).map((x, idx) => (
                        <React.Fragment key={x.href}>
                          {idx > 0 ? " | " : ""}
                          <a href={x.href} target="_blank" rel="noreferrer">{x.label}</a>
                        </React.Fragment>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {(topGainers.length > 0 || topLosers.length > 0 || topMentioned.length > 0) ? (
                <div className="topListsSection">
                  {topGainers.length > 0 && (
                    <div className="topList">
                      <h4>{COPY.topGainersTitle}</h4>
                      <ul>
                        {topGainers.map((item, idx) => {
                          const stock = stockFromEntry(item, "상승 TOP3");
                          return (
                            <li key={item.code || idx}>
                              <button type="button" className="topListButton" onClick={() => selectStock(stock)}>
                                <span className="itemName">{item.name}({item.code})</span>
                                <span className="itemRate gain">{formatRate(item.rate)}</span>
                              </button>
                              <span className="itemLinks">
                                {buildNaverLinks(item.code, summary.effectiveDate).map((link) => (
                                  <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="linkBadge">{link.label}</a>
                                ))}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {topLosers.length > 0 && (
                    <div className="topList">
                      <h4>{COPY.topLosersTitle}</h4>
                      <ul>
                        {topLosers.map((item, idx) => {
                          const stock = stockFromEntry(item, "하락 TOP3");
                          return (
                            <li key={item.code || idx}>
                              <button type="button" className="topListButton" onClick={() => selectStock(stock)}>
                                <span className="itemName">{item.name}({item.code})</span>
                                <span className="itemRate loss">{formatRate(item.rate)}</span>
                              </button>
                              <span className="itemLinks">
                                {buildNaverLinks(item.code, summary.effectiveDate).map((link) => (
                                  <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="linkBadge">{link.label}</a>
                                ))}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  {topMentioned.length > 0 && (
                    <div className="topList">
                      <h4>{COPY.mostMentionedTitle}</h4>
                      <ul>
                        {topMentioned.map((item, idx) => {
                          const stock = stockFromEntry(item, "언급 TOP3");
                          return (
                            <li key={item.code || idx}>
                              <button type="button" className="topListButton" onClick={() => selectStock(stock)}>
                                <span className="itemName">{item.name}({item.code})</span>
                                <span className="itemCount">{formatNumber(item.count)}{COPY.postCount}</span>
                              </button>
                              <span className="itemLinks">
                                {buildNaverLinks(item.code, summary.effectiveDate).map((link) => (
                                  <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="linkBadge">{link.label}</a>
                                ))}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}

              {currentStock ? (
                <section id="stock-detail" className="stockResearch">
                  <div className="stockResearchHead">
                    <div>
                      <span className="stockGroup">{currentStock.group}</span>
                      <h3>{currentStock.name} {currentStock.code ? <small>{currentStock.code}</small> : null}</h3>
                    </div>
                    <div className="intervalTabs" aria-label="차트 기간">
                      {[
                        ["daily", "일봉"],
                        ["weekly", "주봉"],
                        ["monthly", "월봉"]
                      ].map(([value, label]) => (
                        <button
                          type="button"
                          key={value}
                          className={stockInterval === value ? "active" : ""}
                          onClick={() => setStockInterval(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="stockResearchGrid">
                    <div className="chartPreview">
                      <div className="chartBasis">
                        {stockChart?.name || currentStock.name} · {stockChart?.asOf || dataAsOf} · 20일선/거래량/이벤트
                      </div>
                      {stockChartLoading ? <div className="chartState">{COPY.chartLoading}</div> : null}
                      {stockChartError ? <div className="chartState errorText">{stockChartError}</div> : null}
                      {!stockChartLoading && !stockChartError && stockChart ? (
                        <StockPriceChart chart={stockChart} events={stockEvents} darkMode={darkMode} />
                      ) : null}
                    </div>
                    <div className="stockSignalPanel">
                      <div className="riskTabs" aria-label={COPY.riskMode}>
                        {[
                          ["aggressive", COPY.aggressive],
                          ["neutral", COPY.neutral],
                          ["conservative", COPY.conservative]
                        ].map(([value, label]) => (
                          <button
                            type="button"
                            key={value}
                            className={riskMode === value ? "active" : ""}
                            onClick={() => setRiskMode(value)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="stockMetricRow">
                        <span>랭킹</span>
                        <strong>{currentStock.group}</strong>
                      </div>
                      <div className="stockMetricRow">
                        <span>등락률</span>
                        <strong>{formatRate(currentStock.rate)}</strong>
                      </div>
                      {currentStock.count !== undefined && currentStock.count !== null ? (
                        <div className="stockMetricRow">
                          <span>언급량</span>
                          <strong>{formatNumber(currentStock.count)}건</strong>
                        </div>
                      ) : null}
                      <div className="beginnerSignalList">
                        <strong>{COPY.chartSummary}</strong>
                        <p>{decisionPanel.summary}</p>
                      </div>
                      <div className="decisionZones">
                        <div className="zone buy"><span>{COPY.buyConditions}</span><p>{decisionPanel.buy}</p></div>
                        <div className="zone split"><span>{COPY.splitBuyConditions}</span><p>{decisionPanel.splitBuy}</p></div>
                        <div className="zone neutral"><span>{COPY.watchConditions}</span><p>{decisionPanel.watch}</p></div>
                        <div className="zone watch"><span>{COPY.sellConditions}</span><p>{decisionPanel.sell}</p></div>
                        <div className="zone risk"><span>{COPY.stopConditions}</span><p>{decisionPanel.stop}</p></div>
                        <div className="zone opposite"><span>{COPY.oppositeSignals}</span><p>{decisionPanel.opposite}</p></div>
                      </div>
                      <div className="beginnerSignalList">
                        <strong>{COPY.evidenceData}</strong>
                        <ul>
                          {decisionPanel.evidence.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </div>
                      {asArray(stockEvents?.events).length > 0 ? (
                        <div className="eventList">
                          {asArray(stockEvents.events).slice(0, 4).map((event) => (
                            <a
                              key={`${event.date}-${event.type}`}
                              href={asArray(event.evidenceLinks)[0] || "#"}
                              target="_blank"
                              rel="noreferrer"
                              title={event.explanation}
                            >
                              <span>{event.date}</span>
                              <strong>{event.title}</strong>
                            </a>
                          ))}
                        </div>
                      ) : null}
                      <div className="analysisDisclaimer">{COPY.analysisDisclaimer} 신뢰도: {decisionPanel.confidence}</div>
                      <button
                        type="button"
                        className="btn primary small"
                        onClick={askChartAi}
                        disabled={aiResearchLoading || !currentStock.code}
                      >
                        {aiResearchLoading ? COPY.loading : COPY.askChartAi}
                      </button>
                      {aiResearchResponse ? (
                        <div className="aiResearchAnswer">
                          <strong>{COPY.aiResearchTitle}</strong>
                          <pre>{aiResearchResponse.answer}</pre>
                          <div className="assistantMeta limitations">
                            <strong>{COPY.limitations}</strong>
                            <ul>
                              {asArray(aiResearchResponse.limitations).map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ) : null}
                      <div className="stockLinks">
                        {buildNaverLinks(currentStock.code, summary.effectiveDate).map((link) => (
                          <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

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

                <button className="btn ghost small" onClick={() => setShowDevDetails((v) => !v)}>
                  {showDevDetails ? COPY.closeDetails : COPY.developerDetails}
                </button>
                
                {showDevDetails && (
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
                )}
              </div>

              <div className="notesWrap">
                <button className="btn ghost small" onClick={() => setShowNotes((v) => !v)}>
                  {showNotes ? COPY.hideRawNotes : COPY.showRawNotes}
                </button>
                {showNotes ? <pre className="content">{valueOrDash(summary.rawNotes)}</pre> : null}
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
