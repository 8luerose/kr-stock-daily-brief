import React from 'react';
import { X, ExternalLink, HelpCircle, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import styles from './DeepDiveLearningSheet.module.css';

export default function DeepDiveLearningSheet({ isOpen, onClose, termData }) {
  if (!isOpen || !termData) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.badge}>초보자 딥다이브</span>
            <h2>{termData.term}</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X /></button>
        </div>

        <div className={styles.content}>
          <div className={styles.heroSection}>
            <p className={styles.coreSentence}>
              <strong>핵심 한 줄:</strong> {termData.coreSummary}
            </p>
          </div>

          <div className={styles.detailSection}>
            <h3>📖 쉬운 설명</h3>
            <p>{termData.longExplanation}</p>
            {termData.whyItMatters && <p style={{ marginTop: '8px' }}><strong>왜 중요한가요?</strong> {termData.whyItMatters}</p>}
            <p style={{ marginTop: '8px' }}><strong>어디서 보나요?</strong> {termData.chartUsage}</p>
          </div>

          <div className={styles.gridSection}>
            <div className={styles.card}>
              <HelpCircle className={styles.cardIcon} />
              <h4>자주 하는 오해</h4>
              <p>{termData.commonMisunderstanding}</p>
            </div>
            <div className={styles.card}>
              <AlertTriangle className={styles.cardIcon} />
              <h4>실전 시나리오</h4>
              <p>{termData.scenario}</p>
            </div>
          </div>

          <div className={styles.actionSection}>
            {termData.relatedQuestions?.length > 0 && (
              <div className={styles.questionList}>
                {termData.relatedQuestions.slice(0, 3).map((question) => (
                  <span key={question}>{question}</span>
                ))}
              </div>
            )}
            <button className={styles.aiAskBtn}>
              {termData.askEntry} <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
