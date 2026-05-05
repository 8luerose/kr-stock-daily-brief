import React, { useState } from 'react';
import { Bot, ChevronUp, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';
import styles from './FloatingAiCard.module.css';

export default function FloatingAiCard({ ai, events, stock }) {
  const [expanded, setExpanded] = useState(false);

  if (!ai) return null;

  const goodNews = events?.filter(e => e.type === 'positive') || [];
  const badNews = events?.filter(e => e.type === 'negative') || [];

  return (
    <div className={clsx(styles.container, expanded && styles.expanded, 'animate-slide-up')}>
      {/* Minimized View (1-line summary) */}
      <div className={styles.header} onClick={() => setExpanded(!expanded)}>
        <div className={styles.iconWrapper}>
          <Bot size={24} className={styles.icon} />
        </div>
        <div className={styles.summaryInfo}>
          <span className={styles.direction}>{ai.direction || '분석 중'}</span>
          <p className={styles.conclusion}>{ai.conclusion || '현재 종목의 주요 흐름을 파악하고 있습니다.'}</p>
        </div>
        <button className={styles.toggleBtn}>
          {expanded ? <ChevronDown /> : <ChevronUp />}
        </button>
      </div>

      {/* Expanded View (Conditions & News) */}
      {expanded && (
        <div className={styles.details}>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>매매 검토 시점</h4>
            <div className={styles.conditionGrid}>
              <div className={styles.conditionBox}>
                <CheckCircle2 size={16} className={styles.posIcon} />
                <p>{ai.evidence?.buyCondition || '확인된 매수 조건 없음'}</p>
              </div>
              <div className={styles.conditionBox}>
                <XCircle size={16} className={styles.negIcon} />
                <p>{ai.evidence?.sellCondition || '확인된 매도 조건 없음'}</p>
              </div>
            </div>
            {ai.opposingSignals && (
              <p className={styles.neutralNote}>
                <strong>관망 시나리오:</strong> {ai.opposingSignals}
              </p>
            )}
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>주요 모멘텀</h4>
            <div className={styles.newsGrid}>
              <div className={styles.newsBox}>
                <h5>호재 ({goodNews.length})</h5>
                {goodNews.map((n, i) => <div key={i} className={styles.newsItem}>{n.title}</div>)}
              </div>
              <div className={styles.newsBox}>
                <h5>악재/리스크 ({badNews.length})</h5>
                {badNews.map((n, i) => <div key={i} className={styles.newsItem}>{n.title}</div>)}
              </div>
            </div>
          </div>
          
          <div className={styles.footer}>
            <span>기준일: {stock?.asOf}</span>
            <span>신뢰도: {ai.confidence}</span>
          </div>
        </div>
      )}
    </div>
  );
}
