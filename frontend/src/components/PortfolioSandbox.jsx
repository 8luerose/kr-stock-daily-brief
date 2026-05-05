import React, { useState } from 'react';
import { X, PieChart, PlusCircle, AlertOctagon, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import styles from './PortfolioSandbox.module.css';

export default function PortfolioSandbox({ isOpen, onClose, activeCode }) {
  const [weight, setWeight] = useState(10);
  const [added, setAdded] = useState(false);

  return (
    <div className={clsx(styles.overlay, isOpen && styles.open)}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <PieChart size={20} className={styles.icon} />
            <h2>포트폴리오 샌드박스</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X /></button>
        </div>

        <div className={styles.content}>
          <p className={styles.desc}>현재 보고 있는 종목을 가상의 포트폴리오에 담고 AI 리스크를 점검해보세요.</p>

          <div className={styles.addSection}>
            <div className={styles.stockInfo}>
              <span className={styles.code}>{activeCode}</span>
              <span className={styles.name}>삼성전자</span>
            </div>
            
            <div className={styles.weightControl}>
              <label>가상 비중 설정 (%)</label>
              <input 
                type="range" 
                min="1" 
                max="100" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
              />
              <div className={styles.weightVal}>{weight}%</div>
            </div>

            <button 
              className={clsx(styles.addBtn, added && styles.addedBtn)}
              onClick={() => setAdded(true)}
            >
              <PlusCircle size={18} /> {added ? '담기 완료' : '가상 포트폴리오에 담기'}
            </button>
          </div>

          {added && (
            <div className={styles.aiReviewSection}>
              <h3>🤖 AI 포트폴리오 점검</h3>
              
              <div className={styles.reviewCard}>
                <AlertOctagon size={18} className={styles.warnIcon} />
                <div>
                  <h4>비중 주의</h4>
                  <p>이 종목의 비중이 30%를 넘어가면 단기 변동성 리스크가 포트폴리오 전체에 영향을 줄 수 있습니다.</p>
                </div>
              </div>

              <div className={styles.reviewCard}>
                <TrendingUp size={18} className={styles.posIcon} />
                <div>
                  <h4>수익성 시나리오</h4>
                  <p>최근 호재(실적 개선)가 반영될 경우, 전체 포트폴리오 수익률을 약 +2.5% 방어할 수 있는 구조입니다.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
