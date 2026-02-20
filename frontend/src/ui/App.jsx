import React, { useEffect, useMemo, useState } from "react";

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
  brand: "주식 일간 브리프",
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
  mostMentioned: "최다 거래",
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
  monthlyTopMentioned: "월 최다 거래",
  days: ["일", "월", "화", "수", "목", "금", "토"],
  verifyField: "항목",
  verifySource: "출처",
  krxArtifact: "KRX 검증",
  krxPortal: "KRX 포털",
  pykrxRepo: "pykrx 저장소"
};

function valueOrDash(v) {
  return v && String(v).trim() ? v : "-";
}

function asArray(v) {
  return Array.isArray(v) ? v : [];
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

  const days = useMemo(() => buildCalendarDays(month), [month]);
  const monthLabel = useMemo(
    () =>
      month.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long"
      }),
    [month]
  );

  async function apiFetch(path, opts = {}) {
    const url = new URL(cfg.apiBaseUrl + path);
    if (k) url.searchParams.set("k", k);
    const res = await fetch(url.toString(), opts);
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
      setError(e.message || String(e));
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
      setError(e.message || String(e));
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
      setError(e.message || String(e));
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

  const todayStr = useMemo(() => isoDate(new Date()), []);

  return (
    <div className="page">
      <header className="top">
        <div className="brand">{COPY.brand}</div>
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
          <button
            className="btn primary"
            onClick={() => generate(todayStr)}
            disabled={loading}
          >
            {COPY.generateToday}
          </button>
        </div>
      </header>

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

        <section className="card detail">
          <div className="detailHead">
            <div className="detailTitle">{selected}</div>
            <div className="actions">
              <button className="btn primary" onClick={() => generate(selected)} disabled={loading}>
                {COPY.generateSelected}
              </button>
              <button className="btn ghost" onClick={archiveSelected} disabled={loading}>
                {COPY.archiveSelected}
              </button>
            </div>
          </div>

          {cfg.gateEnabled && !k ? (
            <div className="hint">{COPY.gatedHint}</div>
          ) : null}

          <div className="backfillBar">
            <input type="date" value={backfillFrom} onChange={(e) => setBackfillFrom(e.target.value)} />
            <input type="date" value={backfillTo} onChange={(e) => setBackfillTo(e.target.value)} />
            <button className="btn ghost" onClick={runBackfill} disabled={loading}>
              {COPY.backfillRun}
            </button>
          </div>
          {backfillResult ? (
            <div className="hint">
              완료: 성공 {backfillResult.successCount}, 저신뢰 {backfillResult.lowConfidenceCount}, 실패 {backfillResult.failCount}
            </div>
          ) : null}

          {error ? <div className="error">{error}</div> : null}
          {loading ? <div className="loading">{COPY.loading}</div> : null}

          {!loading && !summary ? (
            <div className="empty">{COPY.noSummary}</div>
          ) : null}

          {!loading && summary ? (
            <div className="summary">
              <div className="meta">{COPY.generatedAt}: {summary.generatedAt}</div>

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
