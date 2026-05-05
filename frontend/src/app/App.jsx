import React, { useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import { loadLearningTerms } from '../services/apiClient';
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
  const [termData, setTermData] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);

  const handleToggleLearningMode = () => {
    if (!learningMode) {
      setLearningMode(true);
      // Just toggle the mode, don't open the sheet automatically unless a term is selected
    } else {
      setLearningMode(false);
      setLearningSheetOpen(false);
    }
  };

  const handleSelectTerm = async (termName) => {
    try {
      const terms = await loadLearningTerms();
      const found = terms.find(t => t.term === termName || t.title === termName);
      if (found) {
        setTermData(found);
      } else {
        // Create a fallback object if not found
        setTermData({
          term: termName,
          coreSummary: '용어 설명을 준비 중입니다.',
          longExplanation: '학습 콘텐츠가 아직 등록되지 않았습니다.',
          chartUsage: '차트에서 어떻게 보는지 업데이트 예정입니다.',
          commonMisunderstanding: '알려진 오해가 없습니다.',
          scenario: '실전 시나리오는 준비 중입니다.',
          askEntry: `${termName}에 대해 질문하기`
        });
      }
      setLearningMode(true);
      setLearningSheetOpen(true);
    } catch (err) {
      console.error(err);
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
            indicatorSnapshot={data.indicatorSnapshot}
            decisionSummary={data.currentDecisionSummary}
            interval={interval}
            onChangeInterval={changeInterval}
            learningMode={learningMode}
            onTermClick={handleSelectTerm}
          />
        )}
      </div>

      {/* Loading Overlay */}
      {loading && !data && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
        </div>
      )}

      {/* Error / Fallback Toast */}
      {error && (
        <div className={styles.errorToast}>
          {error}
        </div>
      )}

      {/* Floating UI Layer */}
      <div className={styles.uiLayer}>
        <SpotlightSearch 
          onSearch={handleSearch} 
          results={searchResults} 
          isSearching={isSearching}
          onSelect={changeStock}
          onSelectTerm={handleSelectTerm}
        />
        
        {data && !loading && (
          <FloatingAiCard ai={data.ai} events={data.events} asOf={data.asOf} />
        )}

        <div className={styles.rightActionGroup}>
          <FloatingLearningMode 
            isActive={learningMode} 
            onToggle={handleToggleLearningMode} 
          />

          <button 
            className={styles.floatingIconBtn}
            onClick={() => setPortfolioOpen(true)}
            aria-label="Open Portfolio"
          >
            <Briefcase size={20} />
          </button>
        </div>
      </div>

      <DeepDiveLearningSheet 
        isOpen={learningSheetOpen} 
        onClose={() => setLearningSheetOpen(false)} 
        termData={termData}
      />

      <PortfolioSandbox 
        isOpen={portfolioOpen} 
        onClose={() => setPortfolioOpen(false)} 
        activeCode={activeCode} 
        stockName={data?.stock?.name}
        activeStock={data?.stock}
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
