import { Archive, CalendarDays, DatabaseZap, FileClock, KeyRound, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  archiveDate,
  backfillSummaries,
  generateDate,
  generateToday,
  getSummaryRange
} from "../services/apiClient.js";
import { StateBlock } from "./StateBlock.jsx";

function todayKst() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function monthStart() {
  const [year, month] = todayKst().split("-");
  return `${year}-${month}-01`;
}

export function HistoryAdminPanel({ admin = false }) {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayKst());
  const [selectedDate, setSelectedDate] = useState(todayKst());
  const [adminKey, setAdminKey] = useState(() => window.localStorage.getItem("krbrief_admin_key") || "");
  const [summaries, setSummaries] = useState([]);
  const [state, setState] = useState({ loading: false, error: "", message: "" });

  useEffect(() => {
    let alive = true;
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    getSummaryRange(from, to)
      .then((items) => {
        if (!alive) return;
        setSummaries(Array.isArray(items) ? items : []);
      })
      .catch((error) => {
        if (!alive) return;
        setState((prev) => ({ ...prev, error: error.message || "summary_range_failed" }));
      })
      .finally(() => {
        if (alive) setState((prev) => ({ ...prev, loading: false }));
      });
    return () => {
      alive = false;
    };
  }, [from, to]);

  const selectedSummary = useMemo(
    () => summaries.find((item) => String(item.date) === selectedDate) || summaries[0],
    [selectedDate, summaries]
  );

  const runAdmin = async (task) => {
    window.localStorage.setItem("krbrief_admin_key", adminKey);
    setState((prev) => ({ ...prev, message: "요청 중입니다.", error: "" }));
    try {
      const result = await task(adminKey);
      setState((prev) => ({ ...prev, message: `완료: ${result?.date || "요청 반영"}` }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message || "admin_request_failed", message: "" }));
    }
  };

  return (
    <section className={admin ? "adminPanel" : "historyPanel"} aria-labelledby={admin ? "admin-title" : "history-title"}>
      <div className="panelTitle">
        <span className="iconBubble" aria-hidden="true">
          {admin ? <DatabaseZap size={18} /> : <CalendarDays size={18} />}
        </span>
        <div>
          <span className="eyebrow">{admin ? "관리자와 기록 분리" : "기존 브리프 보존"}</span>
          <h2 id={admin ? "admin-title" : "history-title"}>{admin ? "운영 콘솔" : "브리프 기록"}</h2>
        </div>
      </div>

      <div className="historyFilters">
        <label>
          시작일
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          종료일
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
      </div>

      {state.loading ? <StateBlock title="브리프를 불러오는 중입니다" description="날짜별 기록을 확인합니다." /> : null}
      {state.error ? (
        <StateBlock
          tone="error"
          title={admin ? "운영 요청 또는 기록 조회 실패" : "기록 조회 실패"}
          description="백엔드가 실행 중인지, public key가 필요한지 확인하세요."
        />
      ) : null}

      <div className="historyGrid">
        <div className="calendar" aria-label="브리프 날짜 목록">
          {summaries.length ? (
            summaries.map((summary) => (
              <button
                key={summary.date}
                type="button"
                className={summary.date === selectedSummary?.date ? "active" : ""}
                onClick={() => setSelectedDate(summary.date)}
              >
                <strong>{summary.date}</strong>
                <small>
                  상승 {summary.topGainer || "-"} · 하락 {summary.topLoser || "-"}
                </small>
              </button>
            ))
          ) : (
            <StateBlock
              tone="empty"
              title="표시할 기록이 없습니다"
              description="백엔드 데이터가 없으면 관리자 영역에서 생성 또는 백필을 실행할 수 있습니다."
            />
          )}
        </div>

        <article className="detail">
          <span className="eyebrow">요약 상세</span>
          <h3>{selectedSummary?.date || "기록 없음"}</h3>
          <div className="summaryFacts">
            <span>상승: {selectedSummary?.topGainer || "-"}</span>
            <span>하락: {selectedSummary?.topLoser || "-"}</span>
            <span>언급: {selectedSummary?.mostMentioned || "-"}</span>
          </div>
          <p>{selectedSummary?.content || "일반 사용자 첫 화면에서는 긴 브리프 전문을 숨기고 기록 영역에서만 확인합니다."}</p>
        </article>
      </div>

      {admin ? (
        <div className="adminConsole">
          <label className="adminKey">
            <KeyRound size={17} aria-hidden="true" />
            <input
              type="password"
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="관리자 키가 필요합니다"
            />
          </label>
          <details>
            <summary>
              <FileClock size={16} aria-hidden="true" />
              생성·백필·보관 작업
            </summary>
            <div className="adminActions">
              <button type="button" onClick={() => runAdmin(() => generateToday(adminKey))}>
                <RefreshCw size={16} aria-hidden="true" />
                오늘 생성
              </button>
              <button type="button" onClick={() => runAdmin(() => generateDate(selectedDate, adminKey))}>
                <DatabaseZap size={16} aria-hidden="true" />
                선택일 생성
              </button>
              <button type="button" onClick={() => runAdmin(() => archiveDate(selectedDate, adminKey))}>
                <Archive size={16} aria-hidden="true" />
                선택일 보관
              </button>
              <button type="button" onClick={() => runAdmin(() => backfillSummaries(from, to, adminKey))}>
                <CalendarDays size={16} aria-hidden="true" />
                기간 백필
              </button>
            </div>
          </details>
          {state.message ? <p className="inlineNotice">{state.message}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
