import React from 'react';
import { X, ExternalLink, HelpCircle, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import styles from './DeepDiveLearningSheet.module.css';

export default function DeepDiveLearningSheet({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.badge}>초보자 딥다이브</span>
            <h2>거래량 (Volume)</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X /></button>
        </div>

        <div className={styles.content}>
          <div className={styles.heroSection}>
            <p className={styles.coreSentence}>
              <strong>핵심 한 줄:</strong> 주식이 특정 기간 동안 사고팔린 총 수량입니다. 주가의 힘을 나타내는 '에너지'와 같습니다.
            </p>
          </div>

          <div className={styles.detailSection}>
            <h3>📖 쉬운 설명</h3>
            <p>
              거래량이 늘어났다는 것은 그 주식에 대한 사람들의 관심이 뜨거워졌다는 뜻입니다. 
              바닥권에서 거래량이 폭발하면 상승의 신호일 수 있고, 고점에서 거래량이 터지면 하락의 신호일 수 있습니다.
              주가는 속일 수 있어도 거래량은 속일 수 없다는 격언이 있습니다.
            </p>
          </div>

          <div className={styles.gridSection}>
            <div className={styles.card}>
              <HelpCircle className={styles.cardIcon} />
              <h4>자주 하는 오해</h4>
              <p>초보자들은 흔히 '주가'만 봅니다. 하지만 거래량이 수반되지 않은 주가 상승은 금방 힘을 잃고 떨어지기 쉽습니다.</p>
            </div>
            <div className={styles.card}>
              <AlertTriangle className={styles.cardIcon} />
              <h4>실전 시나리오</h4>
              <p>악재 뉴스가 나왔는데도 거래량이 터지면서 주가가 버틴다면? 누군가 밑에서 강하게 매집하고 있을 가능성을 의심해볼 수 있습니다.</p>
            </div>
          </div>

          <div className={styles.actionSection}>
            <button className={styles.aiAskBtn}>
              AI에게 내 종목 거래량 분석해달라고 하기 <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
