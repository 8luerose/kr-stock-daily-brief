import { CalendarDays, KeyRound, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { loadSummaryArchive, runAdminAction } from "../services/apiClient.js";

export function AdminArchivePanel({ mode = "archive" }) {
  const [archive, setArchive] = useState(null);
  const [adminKey, setAdminKey] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    loadSummaryArchive().then((nextArchive) => {
      if (alive) setArchive(nextArchive);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function handleAction(action) {
    setMessage("요청을 보내는 중입니다.");
    try {
      await runAdminAction(action, adminKey);
      setMessage("요청이 정상 전달되었습니다.");
    } catch (error) {
      setMessage(`실패했습니다. ${error.message}`);
    }
  }

  if (!archive) {
    return <section className="archivePanel loading">기록을 불러오는 중입니다.</section>;
  }

  return (
    <section className={mode === "admin" ? "adminPanel" : "archivePanel"} aria-label="기록과 운영">
      <div className="pageIntro">
        <span className="eyebrow">{mode === "admin" ? "운영" : "기록"}</span>
        <h1>{mode === "admin" ? "관리자 기능은 별도 화면에 보존했습니다" : "브리프와 달력 기록"}</h1>
        <p>일반 사용자 첫 화면에서는 숨기고, 기존 브리프·생성·백필·검증 흐름은 이곳에서 접근합니다.</p>
      </div>

      <div className="archiveGrid">
        <section className="calendar">
          <CalendarDays size={20} />
          <strong>최근 기준일</strong>
          <span>{archive.latest?.date || archive.latest?.effectiveDate || "확인 필요"}</span>
          <p>출처: {archive.source}</p>
        </section>

        <section className="detail">
          <strong>최근 브리프</strong>
          {archive.list.slice(0, 4).map((item) => (
            <article key={item.date}>
              <span>{item.date}</span>
              <p>{item.content || `${item.topGainer || "상승 종목"} · ${item.mostMentioned || "주요 테마"}`}</p>
            </article>
          ))}
        </section>
      </div>

      {mode === "admin" ? (
        <div className="adminBox">
          <label>
            <KeyRound size={16} />
            <input
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="관리자 키가 필요합니다"
              type="password"
            />
          </label>
          <div className="adminActions">
            <button type="button" onClick={() => handleAction("latest")}>최신 조회</button>
            <button type="button" onClick={() => handleAction("today")}>오늘 생성</button>
            <button type="button" onClick={() => handleAction("backfill")}>기간 채우기</button>
            <button type="button" onClick={() => handleAction("verify")}>검증 확인</button>
          </div>
          <p className="adminMessage">
            <ShieldCheck size={16} />
            {message || "관리 작업은 백엔드 기존 API를 호출합니다."}
          </p>
          <p className="quietLine">
            <RotateCcw size={15} />
            생성, 백필, 보관, 검증 기능은 삭제하지 않았고 이 영역으로 분리했습니다.
          </p>
        </div>
      ) : null}
    </section>
  );
}
