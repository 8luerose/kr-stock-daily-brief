import React, { useEffect, useMemo, useState } from "react";

function valueOrDash(v) {
  return v && String(v).trim() ? v : "-";
}

function LinkOrDash({ href, label }) {
  if (!href) return <span>-</span>;
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {label}
    </a>
  );
}

function pickVerificationLink(v, datedKey, legacyKey) {
  return v?.[datedKey] || v?.[legacyKey] || "";
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

  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => isoDate(new Date()));

  // Current day detail
  const [summary, setSummary] = useState(null);

  // Dashboard stats
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);

  // Month overview (used to mark days with existing summaries)
  const [monthHasSummary, setMonthHasSummary] = useState(() => new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [backfillFrom, setBackfillFrom] = useState("2026-02-01");
  const [backfillTo, setBackfillTo] = useState("2026-02-05");
  const [backfillResult, setBackfillResult] = useState(null);

  const days = useMemo(() => buildCalendarDays(month), [month]);
  const monthLabel = useMemo(
    () =>
      month.toLocaleString(undefined, {
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
    try {
      const s = await apiFetch(`/api/summaries/${dateStr}`);
      setSummary(s);
    } catch (e) {
      // 404 = no summary yet
      if (String(e.message).includes("404")) setSummary(null);
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
        <div className="brand">KR Stock Daily Brief</div>
        <div className="actions">
          <button className="btn ghost" onClick={jumpToLatest} disabled={loading}>
            최신 요약 이동
          </button>
          <button
            className="btn"
            onClick={() => generate(todayStr)}
            disabled={loading}
            title="Generate today's summary"
          >
            Generate (today)
          </button>
        </div>
      </header>

      <section className="card overview">
        <div className="overviewItem">
          <span className="label">누적 요약</span>
          <strong>{stats?.totalCount ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">최신 날짜</span>
          <strong>{stats?.latestDate ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">최근 갱신</span>
          <strong>{stats?.latestUpdatedAt ?? "-"}</strong>
        </div>
      </section>

      <section className="card overview insights">
        <div className="overviewItem">
          <span className="label">월 총 일수</span>
          <strong>{insights?.totalDays ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">생성 완료 일수</span>
          <strong>{insights?.generatedDays ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">미생성 일수</span>
          <strong>{insights?.missingDays ?? "-"}</strong>
        </div>
        <div className="overviewItem">
          <span className="label">월 최다 언급</span>
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
              Prev
            </button>
            <div className="monthLabel">{monthLabel}</div>
            <button className="btn ghost" onClick={() => setMonth(addMonths(month, 1))}>
              Next
            </button>
          </div>

          <div className="dow">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((x) => (
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
                  {hasSummary ? <div className="dot" title="Summary exists" /> : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card detail">
          <div className="detailHead">
            <div className="detailTitle">{selected}</div>
            <div className="actions">
              <button className="btn" onClick={() => generate(selected)} disabled={loading}>
                Generate (selected)
              </button>
              <button className="btn ghost" onClick={archiveSelected} disabled={loading}>
                Archive (selected)
              </button>
            </div>
          </div>

          {cfg.gateEnabled && !k ? (
            <div className="hint">
              This UI is gated. Add <code>?k=PUBLIC_KEY</code> to the URL.
            </div>
          ) : null}

          <div className="backfillBar">
            <input type="date" value={backfillFrom} onChange={(e) => setBackfillFrom(e.target.value)} />
            <input type="date" value={backfillTo} onChange={(e) => setBackfillTo(e.target.value)} />
            <button className="btn ghost" onClick={runBackfill} disabled={loading}>
              Backfill run
            </button>
          </div>
          {backfillResult ? (
            <div className="hint">
              backfill: success {backfillResult.successCount}, low-confidence {backfillResult.lowConfidenceCount}, fail {backfillResult.failCount}
            </div>
          ) : null}

          {error ? <div className="error">{error}</div> : null}
          {loading ? <div className="loading">Loading...</div> : null}

          {!loading && !summary ? (
            <div className="empty">No summary for this date yet.</div>
          ) : null}

          {!loading && summary ? (
            <div className="summary">
              <div className="meta">Generated at: {summary.generatedAt}</div>

              <div className="kvGrid">
                <div className="kvItem">
                  <span>Top Gainer</span>
                  <strong>{valueOrDash(summary.topGainer)}</strong>
                </div>
                <div className="kvItem">
                  <span>Top Loser</span>
                  <strong>{valueOrDash(summary.topLoser)}</strong>
                </div>
                <div className="kvItem">
                  <span>Most Mentioned</span>
                  <strong>{valueOrDash(summary.mostMentioned)}</strong>
                </div>
                <div className="kvItem">
                  <span>KOSPI Pick</span>
                  <strong>{valueOrDash(summary.kospiPick)}</strong>
                </div>
                <div className="kvItem">
                  <span>KOSDAQ Pick</span>
                  <strong>{valueOrDash(summary.kosdaqPick)}</strong>
                </div>
              </div>

              <div className="notesWrap">
                <button className="btn ghost" onClick={() => setShowNotes((v) => !v)}>
                  {showNotes ? "rawNotes 접기" : "rawNotes 보기"}
                </button>
                {showNotes ? <pre className="content">{valueOrDash(summary.rawNotes)}</pre> : null}
              </div>

              <div className="notesWrap">
                <h4>검증 링크</h4>
                <ul className="verifyLinks">
                  <li>
                    KRX 데이터 포털(공식): <LinkOrDash href={summary.verification?.krxDataPortal} label="열기" />
                  </li>
                  <li>
                    KRX 마켓 오버뷰(공식): <LinkOrDash href={summary.verification?.krxMarketOverview} label="열기" />
                  </li>
                  <li>
                    pykrx 저장소: <LinkOrDash href={summary.verification?.pykrxRepo} label="열기" />
                  </li>
                  <li>
                    Top Gainer 날짜고정 검색 ({summary.verification?.date || summary.date}):{" "}
                    <LinkOrDash
                      href={pickVerificationLink(summary.verification, "topGainerDateSearch", "topGainerSearch")}
                      label={valueOrDash(summary.topGainer)}
                    />
                  </li>
                  <li>
                    Top Loser 날짜고정 검색 ({summary.verification?.date || summary.date}):{" "}
                    <LinkOrDash
                      href={pickVerificationLink(summary.verification, "topLoserDateSearch", "topLoserSearch")}
                      label={valueOrDash(summary.topLoser)}
                    />
                  </li>
                  <li>
                    Most Mentioned 날짜고정 검색 ({summary.verification?.date || summary.date}):{" "}
                    <LinkOrDash
                      href={pickVerificationLink(summary.verification, "mostMentionedDateSearch", "mostMentionedSearch")}
                      label={valueOrDash(summary.mostMentioned)}
                    />
                  </li>
                  <li>
                    KOSPI Pick 날짜고정 검색 ({summary.verification?.date || summary.date}):{" "}
                    <LinkOrDash
                      href={pickVerificationLink(summary.verification, "kospiPickDateSearch", "kospiPickSearch")}
                      label={valueOrDash(summary.kospiPick)}
                    />
                  </li>
                  <li>
                    KOSDAQ Pick 날짜고정 검색 ({summary.verification?.date || summary.date}):{" "}
                    <LinkOrDash
                      href={pickVerificationLink(summary.verification, "kosdaqPickDateSearch", "kosdaqPickSearch")}
                      label={valueOrDash(summary.kosdaqPick)}
                    />
                  </li>
                  <li>
                    제한사항: {valueOrDash(summary.verification?.verificationLimitations)}
                  </li>
                </ul>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
