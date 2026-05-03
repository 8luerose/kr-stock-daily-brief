import React from "react";
import { COPY } from "./AppConstants.js";
import { StockResearchPanel } from "./AppSections.jsx";

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

function LeaderMetricCard({ label, value, explanation, links, valueOrDash }) {
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

function TopListColumn({ title, items, group, valueType, effectiveDate, onSelect, stockFromEntry, formatNumber, formatRate, buildNaverLinks }) {
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

export function SummaryDetailPanel({
  activePage,
  cfg,
  k,
  error,
  loading,
  summary,
  selected,
  briefTerms,
  selectedTerm,
  selectTerm,
  topGainers,
  topLosers,
  topMentioned,
  selectStock,
  currentStock,
  stockInterval,
  setStockInterval,
  stockChart,
  stockEvents,
  stockChartLoading,
  stockChartError,
  darkMode,
  dataAsOf,
  riskMode,
  setRiskMode,
  decisionPanel,
  addCurrentStockToPortfolio,
  askChartAi,
  aiResearchLoading,
  aiResearchResponse,
  krxArtifact,
  krxArtifactError,
  formatEffectiveDate,
  buildEvidenceLinks,
  buildNaverLinks,
  resolveApiLink,
  getLeaderExplanation,
  stockFromEntry,
  valueOrDash,
  formatNumber,
  formatRate,
  asArray
}) {
  return (
    <section className="card detail">
      {activePage === "home" ? null : <div className="detailHead">
        <div>
          <div className="detailTitle">{COPY.marketBrief}</div>
          <div className="detailSub">{selected} 기준</div>
        </div>
      </div>}

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
                  <a
                    href="#learning"
                    key={term.id}
                    onClick={() => selectTerm(term)}
                    className={selectedTerm?.id === term.id ? "active" : ""}
                  >
                    {term.term}
                  </a>
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
              valueOrDash={valueOrDash}
            />
            <LeaderMetricCard
              label={COPY.topLoser}
              value={summary.topLoser}
              explanation={getLeaderExplanation(summary, "topLoser")}
              links={buildEvidenceLinks(summary.verification?.topLoserDateSearch, summary.verification?.topLoserYahooFinance)}
              valueOrDash={valueOrDash}
            />
            <LeaderMetricCard
              label={COPY.mostMentioned}
              value={summary.mostMentioned}
              links={buildEvidenceLinks(summary.verification?.mostMentionedDateSearch, summary.verification?.mostMentionedYahooFinance)}
              valueOrDash={valueOrDash}
            />
            <LeaderMetricCard
              label={COPY.kospiPick}
              value={summary.kospiPick}
              links={buildEvidenceLinks(summary.verification?.kospiPickDateSearch, summary.verification?.kospiPickYahooFinance)}
              valueOrDash={valueOrDash}
            />
            <LeaderMetricCard
              label={COPY.kosdaqPick}
              value={summary.kosdaqPick}
              links={buildEvidenceLinks(summary.verification?.kosdaqPickDateSearch, summary.verification?.kosdaqPickYahooFinance)}
              valueOrDash={valueOrDash}
            />
          </div>

          {(topGainers.length > 0 || topLosers.length > 0 || topMentioned.length > 0) ? (
            <div className="topListsSection">
              <TopListColumn title={COPY.topGainersTitle} items={topGainers} group="상승 TOP3" valueType="rate" effectiveDate={summary.effectiveDate} onSelect={selectStock} stockFromEntry={stockFromEntry} formatNumber={formatNumber} formatRate={formatRate} buildNaverLinks={buildNaverLinks} />
              <TopListColumn title={COPY.topLosersTitle} items={topLosers} group="하락 TOP3" valueType="rate" effectiveDate={summary.effectiveDate} onSelect={selectStock} stockFromEntry={stockFromEntry} formatNumber={formatNumber} formatRate={formatRate} buildNaverLinks={buildNaverLinks} />
              <TopListColumn title={COPY.mostMentionedTitle} items={topMentioned} group="언급 TOP3" valueType="count" effectiveDate={summary.effectiveDate} onSelect={selectStock} stockFromEntry={stockFromEntry} formatNumber={formatNumber} formatRate={formatRate} buildNaverLinks={buildNaverLinks} />
            </div>
          ) : null}

          <StockResearchPanel
            copy={COPY}
            homeCompact={activePage === "home"}
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
  );
}
