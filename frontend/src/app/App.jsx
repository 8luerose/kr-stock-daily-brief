import React, { useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import SpotlightSearch from '../components/SpotlightSearch';
import ImmersiveChart from '../components/ImmersiveChart';
import FloatingAiCard from '../components/FloatingAiCard';
import FloatingLearningMode from '../components/FloatingLearningMode';
import DeepDiveLearningSheet from '../components/DeepDiveLearningSheet';
import HiddenAdminSheet from '../components/HiddenAdminSheet';
import PortfolioSandbox from '../components/PortfolioSandbox';
import { Briefcase } from 'lucide-react';
import clsx from 'clsx';
import styles from './App.module.css';

function App() {
  const {
    activeCode,
    interval,
    data,
    loading,
    error,
    searchResults,
    isSearching,
    handleSearch,
    changeStock,
    changeInterval
  } = useWorkspace();

  const [learningMode, setLearningMode] = useState(false);
  const [learningSheetOpen, setLearningSheetOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);

  const handleToggleLearningMode = () => {
    if (!learningMode) {
      setLearningMode(true);
      setLearningSheetOpen(true);
    } else {
      setLearningMode(false);
      setLearningSheetOpen(false);
    }
  };

  return (
    <div className={styles.appContainer}>
      {/* Background Hero Layer */}
      <div className={styles.chartLayer}>
        {data && (
          <ImmersiveChart 
            stock={data.stock} 
            chart={data.chart} 
            zones={data.zones} 
            events={data.events}
            ai={data.ai}
            interval={interval}
            onChangeInterval={changeInterval}
            learningMode={learningMode}
          />
        )}
      </div>

      {/* Loading Overlay */}
      {loading && !data && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      )}

      {/* Floating UI Layer */}
      <div className={styles.uiLayer}>
        <SpotlightSearch 
          onSearch={handleSearch} 
          results={searchResults} 
          isSearching={isSearching}
          onSelect={changeStock}
        />
        
        {data && !loading && (
          <FloatingAiCard ai={data.ai} events={data.events} stock={data.stock} />
        )}

        <FloatingLearningMode 
          isActive={learningMode} 
          onToggle={handleToggleLearningMode} 
        />

        <button 
          className={clsx(styles.floatingIconBtn, styles.portfolioBtn)}
          onClick={() => setPortfolioOpen(true)}
          aria-label="Open Portfolio"
        >
          <Briefcase size={20} />
        </button>
      </div>

      <DeepDiveLearningSheet 
        isOpen={learningSheetOpen} 
        onClose={() => setLearningSheetOpen(false)} 
      />

      <PortfolioSandbox 
        isOpen={portfolioOpen} 
        onClose={() => setPortfolioOpen(false)} 
        activeCode={activeCode} 
      />

      <HiddenAdminSheet isOpen={adminOpen} onClose={() => setAdminOpen(false)} asOf={data?.asOf} />

      {/* Hidden toggle for admin in top left corner (developer friendly) */}
      <button 
        className={styles.secretAdminToggle} 
        onDoubleClick={() => setAdminOpen(true)}
        aria-label="Open Admin"
      />
    </div>
  );
}

export default App;
