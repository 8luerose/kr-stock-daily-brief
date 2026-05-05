import React, { useState } from 'react';
import { Bot, ChevronUp, ChevronDown, CheckCircle2, XCircle, ShieldAlert, Clock3 } from 'lucide-react';
import clsx from 'clsx';
import styles from './FloatingAiCard.module.css';

export default function FloatingAiCard({ ai, events, asOf }) {
  const [expanded, setExpanded] = useState(false);

  if (!ai) return null;

  return (
    <div className={clsx(styles.container, expanded && styles.expanded)}>
      {/* Minimized View (1-line summary) */}
      <button
        type="button"
        className={styles.header}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={expanded ? 'AI 요약 접기' : 'AI 요약 펼치기'}
      >
        <div className={styles.iconWrapper}>
          <Bot size={24} className={styles.icon} />
        </div>
        <div className={styles.summaryInfo}>
          <span className={styles.direction}>{ai.direction || '분석 중'}</span>
          <p className={styles.conclusion}>{ai.conclusion || '현재 종목의 주요 흐름을 파악하고 있습니다.'}</p>
        </div>
        <span className={styles.toggleBtn} aria-hidden="true">
          {expanded ? <ChevronDown /> : <ChevronUp />}
        </span>
      </button>

      {/* Expanded View (Conditions & News) */}
      {expanded && (
        <div className={styles.details}>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>매매 검토 시점</h4>
            <div className={styles.conditionGrid}>
              <div className={styles.conditionBox}>
                <CheckCircle2 size={16} className={styles.posIcon} />
                <p><strong>매수 검토:</strong> {ai.buyCondition || '확인된 매수 조건 없음'}</p>
              </div>
              <div className={styles.conditionBox}>
                <XCircle size={16} className={styles.negIcon} />
                <p><strong>매도 검토:</strong> {ai.sellCondition || '확인된 매도 조건 없음'}</p>
              </div>
              <div className={styles.conditionBox}>
                <Clock3 size={16} className={styles.waitIcon} />
                <p><strong>관망:</strong> {ai.waitCondition || '방향이 엇갈리면 다음 신호 확인'}</p>
              </div>
              <div className={styles.conditionBox}>
                <ShieldAlert size={16} className={styles.negIcon} />
                <p><strong>리스크 관리:</strong> {ai.riskCondition || '전저점 이탈과 하락 거래량 확인'}</p>
              </div>
            </div>
            {ai.movingAverageExplanation && (
              <p className={styles.maNote}>
                <strong>이동평균선:</strong> {ai.movingAverageExplanation}
              </p>
            )}
            {(ai.waitCondition || ai.opposingSignals?.length > 0) && (
              <p className={styles.neutralNote}>
                <strong>관망 시나리오:</strong> {ai.waitCondition || ai.opposingSignals?.[0]}
              </p>
            )}
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>주요 모멘텀</h4>
            <div className={styles.newsGrid}>
              <div className={styles.newsBox}>
                <h5>호재 ({ai.positives?.length || 0})</h5>
                {ai.positives?.map((n, i) => <div key={i} className={styles.newsItem}>{n}</div>)}
              </div>
              <div className={styles.newsBox}>
                <h5>악재/리스크 ({ai.negatives?.length || 0})</h5>
                {ai.negatives?.map((n, i) => <div key={i} className={styles.newsItem}>{n}</div>)}
              </div>
            </div>
          </div>

          {ai.checklist?.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>초보자 확인 순서</h4>
              <ul className={styles.checklist}>
                {ai.checklist.slice(0, 5).map((item, index) => (
                  <li key={`${item}-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className={styles.footer}>
            <span>기준일: {asOf}</span>
            <span>신뢰도: {ai.confidence}</span>
          </div>
        </div>
      )}
    </div>
  );
}
