import React, { useEffect, useState } from 'react';
import { loadLearningTerms } from '../services/apiClient';
import { BookOpen, HelpCircle } from 'lucide-react';
import styles from './LearningPanel.module.css';

export default function LearningPanel() {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadLearningTerms().then(data => {
      if (mounted) {
        setTerms(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className={styles.loading}>학습 데이터를 불러오는 중...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <BookOpen className={styles.headerIcon} size={28} />
        <div>
          <h2>주식 초보자를 위한 개념 학습</h2>
          <p>차트와 AI 설명을 이해하기 위한 필수 개념들을 배워보세요.</p>
        </div>
      </header>

      <div className={styles.grid}>
        {terms.map((term, index) => (
          <div key={term.id || index} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>{term.term}</h3>
              <span className={styles.category}>{term.category}</span>
            </div>
            
            <p className={styles.coreSummary}>{term.coreSummary}</p>
            
            <div className={styles.detailBox}>
              <strong>차트에서 확인하는 법</strong>
              <p>{term.relatedChartZone}</p>
            </div>
            
            <div className={styles.detailBox}>
              <strong>실제 시나리오</strong>
              <p>{term.scenario}</p>
            </div>

            <button className={styles.askAiBtn}>
              <HelpCircle size={16} />
              <span>AI에게 더 물어보기</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
