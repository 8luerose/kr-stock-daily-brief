import React from 'react';
import { Bot, CheckCircle, XCircle, AlertTriangle, Info, Clock, ExternalLink } from 'lucide-react';
import styles from './AiPanel.module.css';

export default function AiPanel({ ai, stock, events }) {
  if (!ai) return null;

  const goodNews = events?.filter(e => e.type === 'positive') || [];
  const badNews = events?.filter(e => e.type === 'negative') || [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Bot className={styles.headerIcon} />
        <h2>AI 예측 요약</h2>
      </header>

      <section className={styles.section}>
        <div className={styles.directionBox}>
          <p className={styles.directionLabel}>현재 국면 및 방향</p>
          <h3 className={styles.directionValue}>{ai.direction || '방향성 탐색 중'}</h3>
        </div>
        <p className={styles.conclusion}>{ai.conclusion}</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>매매 검토 시점</h3>
        <ul className={styles.conditionList}>
          <li className={styles.conditionItem}>
            <CheckCircle className={styles.iconPos} size={16} />
            <div>
              <strong>매수 검토 시점</strong>
              <p>{ai.evidence?.buyCondition || '뚜렷한 매수 검토 조건이 아직 없습니다.'}</p>
            </div>
          </li>
          <li className={styles.conditionItem}>
            <XCircle className={styles.iconNeg} size={16} />
            <div>
              <strong>매도 검토 시점</strong>
              <p>{ai.evidence?.sellCondition || '뚜렷한 매도 검토 조건이 아직 없습니다.'}</p>
            </div>
          </li>
          <li className={styles.conditionItem}>
            <Info className={styles.iconNeutral} size={16} />
            <div>
              <strong>관망 조건</strong>
              <p>{ai.opposingSignals || '시장 변동성을 지켜볼 필요가 있습니다.'}</p>
            </div>
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>호재와 악재 요약</h3>
        <div className={styles.newsContainer}>
          <div className={styles.newsBox}>
            <h4 className={styles.newsTitlePos}>호재</h4>
            {goodNews.length > 0 ? (
              <ul className={styles.newsList}>
                {goodNews.map((n, i) => <li key={i}>{n.title}</li>)}
              </ul>
            ) : (
              <p className={styles.emptyText}>최근 확인된 뚜렷한 호재가 없습니다.</p>
            )}
          </div>
          <div className={styles.newsBox}>
            <h4 className={styles.newsTitleNeg}>악재 및 리스크</h4>
            {badNews.length > 0 ? (
              <ul className={styles.newsList}>
                {badNews.map((n, i) => <li key={i}>{n.title}</li>)}
              </ul>
            ) : (
              <p className={styles.emptyText}>최근 확인된 뚜렷한 악재가 없습니다.</p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.footerInfo}>
        <div className={styles.infoRow}>
          <Clock size={14} />
          <span>기준: {stock.asOf || '최근'}</span>
        </div>
        <div className={styles.infoRow}>
          <AlertTriangle size={14} />
          <span>신뢰도: {ai.confidence || '보통'}</span>
        </div>
        <div className={styles.limitation}>
          * {ai.limitation || 'AI의 예측은 참고용이며, 투자 결과에 대한 법적 책임을 지지 않습니다.'}
        </div>
      </section>
    </div>
  );
}
