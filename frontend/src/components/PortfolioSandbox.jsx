import React, { useState, useEffect } from 'react';
import { X, PieChart, PlusCircle, AlertOctagon, TrendingUp, Info } from 'lucide-react';
import clsx from 'clsx';
import styles from './PortfolioSandbox.module.css';

export default function PortfolioSandbox({ isOpen, onClose, activeCode, stockName }) {
  const [weight, setWeight] = useState(10);
  const [added, setAdded] = useState(false);

  // Reset state when stock changes
  useEffect(() => {
    setAdded(false);
    setWeight(10);
  }, [activeCode]);

  return (
    <div className={clsx(styles.overlay, isOpen && styles.open)}>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet} data-testid="portfolio-sandbox-sheet">
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <PieChart size={20} className={styles.icon} />
            <h2>포트폴리오 샌드박스</h2>
          </div>
          <button onClick={onClose} className={styles.closeBtn}><X /></button>
        </div>

        <div className={styles.content}>
          <div className={styles.sandboxWarning}>
            <Info size={14} /> 본 기능은 실계좌 연동이 아닌 <strong>학습용 임시 샌드박스</strong>입니다. (저장되지 않습니다)
          </div>
          <p className={styles.desc}>현재 보고 있는 종목을 가상의 포트폴리오에 담고 AI 리스크를 점검해보세요.</p>

          <div className={styles.addSection}>
            <div className={styles.stockInfo} data-testid="portfolio-stock-info">
              <span className={styles.code}>{activeCode}</span>
              <span className={styles.name}>{stockName || '로딩 중'}</span>
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
                  <h4>비중 점검</h4>
                  <p>
                    {weight > 30 
                      ? `${stockName}의 비중이 ${weight}%로 높아 단기 변동성 리스크가 포트폴리오 전체에 크게 영향을 줄 수 있습니다.` 
                      : `${stockName}의 비중이 ${weight}%로 적절히 분산되어 방어력이 양호할 수 있습니다.`}
                  </p>
                </div>
              </div>

              <div className={styles.reviewCard}>
                <TrendingUp size={18} className={styles.posIcon} />
                <div>
                  <h4>시나리오 체크리스트</h4>
                  <p>최근 발생한 이벤트(또는 호재)가 반영될 경우 포트폴리오 방어에 기여할 수 있지만, 반대 신호(지지선 이탈 등)가 나오면 즉시 비중 축소를 검토해야 합니다.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
