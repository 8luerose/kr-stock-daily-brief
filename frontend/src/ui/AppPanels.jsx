import React from "react";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasStructuredAnswer(value) {
  return value && typeof value === "object" && Boolean(value.conclusion);
}

function coverageCount(value) {
  if (!value || typeof value !== "object") return 0;
  return Object.values(value).reduce((sum, count) => sum + Number(count || 0), 0);
}

export function AiInsightPanel({
  activePage,
  copy,
  selected,
  summary,
  currentStock,
  decisionPanel,
  dataAsOf,
  assistantQuestion,
  setAssistantQuestion,
  assistantLoading,
  assistantResponse,
  askAssistant,
  selectTerm
}) {
  const marketSignal = summary
    ? `${summary.topGainer || "-"} 상승, ${summary.topLoser || "-"} 하락, ${summary.mostMentioned || "-"} 관심`
    : "최신 저장 브리프를 기다리는 중";
  const chartSignal = currentStock?.name
    ? `${currentStock.name}: ${decisionPanel?.summary || "차트 데이터를 확인하는 중"}`
    : "대표 종목 차트를 선택하면 판단 근거를 표시";
  const riskSignal = decisionPanel?.stop || "전저점 이탈, 거래량 급감, 근거 부족 구간은 리스크 관리 대상으로 표시";

  return (
    <div className="assistantBox heroAssistant">
      <div className="assistantHead">
        <div>
          <div className="assistantTitle">{activePage === "home" ? copy.aiMarketPanel : copy.assistantTitle}</div>
          <div className="assistantSubtitle">{activePage === "home" ? copy.aiMarketOneLine : copy.assistantSubtitle}</div>
        </div>
        <span className="assistantDate">{selected}</span>
      </div>
      {activePage === "home" ? (
        <div className="assistantSignalGrid" aria-label="AI 리서치 요약">
          <div className="assistantSignalCard">
            <span>{copy.aiMarketPanel}</span>
            <strong>{marketSignal}</strong>
          </div>
          <div className="assistantSignalCard">
            <span>AI 차트 판단</span>
            <strong>{chartSignal}</strong>
          </div>
          <div className="assistantSignalCard">
            <span>AI 리스크 요약</span>
            <strong>{riskSignal}</strong>
            <small>{copy.dataAsOf}: {dataAsOf || selected}</small>
          </div>
        </div>
      ) : null}
      <div className="assistantInputRow">
        <input
          aria-label={copy.assistantQuestionLabel}
          value={assistantQuestion}
          onChange={(event) => setAssistantQuestion(event.target.value)}
          placeholder={copy.assistantInputPlaceholder}
          disabled={assistantLoading}
        />
        <button className="btn primary small" type="button" onClick={askAssistant} disabled={assistantLoading}>
          {assistantLoading ? copy.loading : copy.assistantAsk}
        </button>
      </div>
      {assistantResponse ? (
        <div className="assistantAnswer">
          <div className="assistantAnswerHead">
            <strong>{copy.assistantAnswer}</strong>
            <span>{copy.confidence}: {assistantResponse.confidence}</span>
          </div>
          {hasStructuredAnswer(assistantResponse.structured) ? (
            <div className="assistantStructured">
              <div className="structuredConclusion">
                <span>결론</span>
                <strong>{assistantResponse.structured.conclusion}</strong>
              </div>
              <div className="structuredGrid">
                <div>
                  <span>근거</span>
                  <ul>
                    {asArray(assistantResponse.structured.evidence).slice(0, 4).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span>반대 신호</span>
                  <ul>
                    {asArray(assistantResponse.structured.opposingSignals).slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span>리스크</span>
                  <ul>
                    {asArray(assistantResponse.structured.risks).slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span>기준/신뢰도</span>
                  <p>
                    기준일 {assistantResponse.structured.basisDate || assistantResponse.basisDate || selected}
                    <br />
                    신뢰도 {assistantResponse.structured.confidence || assistantResponse.confidence}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <pre>{assistantResponse.answer}</pre>
          {asArray(assistantResponse.matchedTerms).length > 0 ? (
            <div className="assistantMeta">
              <strong>{copy.matchedTerms}</strong>
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
              <strong>{copy.sources}</strong>
              <div>
                {asArray(assistantResponse.sources).map((source) => (
                  <span key={`${source.type}-${source.title}`}>{source.title}</span>
                ))}
              </div>
            </div>
          ) : null}
          {assistantResponse.grounding ? (
            <div className="assistantMeta">
              <strong>근거 검증</strong>
              <div>
                <span>근거 문서 {coverageCount(assistantResponse.grounding.sourceCoverage)}개</span>
                <span>{assistantResponse.grounding.llmUsed ? "LLM 사용" : "규칙형 RAG"}</span>
                <span>{assistantResponse.grounding.confidence}</span>
              </div>
              {asArray(assistantResponse.grounding.supportedClaims).length > 0 ? (
                <ul>
                  {asArray(assistantResponse.grounding.supportedClaims).slice(0, 3).map((item) => (
                    <li key={item.claim}>{item.claim}</li>
                  ))}
                </ul>
              ) : null}
              {asArray(assistantResponse.grounding.missingEvidence).length > 0 ? (
                <small>{asArray(assistantResponse.grounding.missingEvidence)[0]}</small>
              ) : null}
            </div>
          ) : null}
          {asArray(assistantResponse.limitations).length > 0 ? (
            <div className="assistantMeta limitations">
              <strong>{copy.limitations}</strong>
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
}

export function AdminOperationsPanel({
  copy,
  showAdminPanel,
  setShowAdminPanel,
  forceOpen = false,
  adminKey,
  selected,
  setSelected,
  loading,
  todayStr,
  generate,
  archiveSelected,
  backfillFrom,
  setBackfillFrom,
  backfillTo,
  setBackfillTo,
  runBackfill,
  backfillResult
}) {
  return (
    <section className="card adminPanel">
      <button
        type="button"
        className="adminToggle"
        onClick={() => setShowAdminPanel((value) => !value)}
        aria-expanded={showAdminPanel}
      >
        <span>
          <strong>{copy.adminTitle}</strong>
          <small>{copy.adminSubtitle}</small>
        </span>
        <span>{showAdminPanel || forceOpen ? copy.closeAdmin : copy.openAdmin}</span>
      </button>
      {showAdminPanel || forceOpen ? (
        <div className="adminBody">
          {!adminKey ? (
            <div className="hint compact adminKeyHint">{copy.adminKeyRequired}</div>
          ) : (
            <>
              <div className="adminDateRow">
                <label className="fieldLabel" htmlFor="selected-date">{copy.selectedDate}</label>
                <input
                  id="selected-date"
                  type="date"
                  value={selected}
                  onChange={(event) => setSelected(event.target.value)}
                  className="dateInput"
                  disabled={loading}
                />
              </div>
              <div className="adminActions">
                <button className="btn primary" onClick={() => generate(todayStr)} disabled={loading}>
                  {copy.generateToday}
                </button>
                <button className="btn" onClick={() => generate(selected)} disabled={loading}>
                  {copy.generateSelected}
                </button>
                <button className="btn ghost" onClick={archiveSelected} disabled={loading}>
                  {copy.archiveSelected}
                </button>
              </div>
              <div className="backfillBar compact">
                <input type="date" aria-label="일괄 생성 시작일" value={backfillFrom} onChange={(event) => setBackfillFrom(event.target.value)} />
                <input type="date" aria-label="일괄 생성 종료일" value={backfillTo} onChange={(event) => setBackfillTo(event.target.value)} />
                <button className="btn ghost" onClick={runBackfill} disabled={loading}>
                  {copy.backfillRun}
                </button>
              </div>
            </>
          )}
          {backfillResult ? (
            <div className="hint compact">
              완료: 성공 {backfillResult.successCount}, 저신뢰 {backfillResult.lowConfidenceCount}, 실패 {backfillResult.failCount}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function BriefHistoryCalendar({
  activePage,
  copy,
  selected,
  monthLabel,
  setMonth,
  addMonths,
  days,
  isoDate,
  month,
  todayStr,
  monthHasSummary,
  setSelected
}) {
  return (
    <section className="card calendar">
      <div className="panelHead compact">
        <div>
          <div className="panelTitle">{activePage === "admin" ? copy.adminTitle : copy.historyTitle}</div>
          <div className="panelSubtitle">{copy.selectedDate}: {selected}</div>
        </div>
      </div>
      <div className="calendarHead">
        <button className="btn ghost" onClick={() => setMonth(addMonths(month, -1))}>
          {copy.prevMonth}
        </button>
        <div className="monthLabel">{monthLabel}</div>
        <button className="btn ghost" onClick={() => setMonth(addMonths(month, 1))}>
          {copy.nextMonth}
        </button>
      </div>

      <div className="dow">
        {copy.days.map((day) => (
          <div key={day} className="dowCell">
            {day}
          </div>
        ))}
      </div>

      <div className="grid">
        {days.map((day) => {
          const dayString = isoDate(day);
          const inMonth = day.getMonth() === month.getMonth();
          const isSelected = dayString === selected;
          const isToday = dayString === todayStr;
          const hasSummary = monthHasSummary.has(dayString);
          return (
            <button
              key={dayString}
              className={[
                "day",
                inMonth ? "inMonth" : "outMonth",
                isSelected ? "selected" : "",
                isToday ? "today" : "",
                hasSummary ? "hasSummary" : ""
              ].join(" ")}
              aria-label={`${dayString}${hasSummary ? " 요약 있음" : ""}`}
              onClick={() => setSelected(dayString)}
            >
              <div className="dayNum">{day.getDate()}</div>
              {hasSummary ? <div className="dot" title={copy.summaryExists} /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
