import React, { useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import SpotlightSearch from '../components/SpotlightSearch';
import ImmersiveChart from '../components/ImmersiveChart';
import FloatingAiCard from '../components/FloatingAiCard';
import FloatingLearningMode from '../components/FloatingLearningMode';
import HiddenAdminSheet from '../components/HiddenAdminSheet';
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
  const [adminOpen, setAdminOpen] = useState(false);

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
          onToggle={() => setLearningMode(!learningMode)} 
        />
      </div>

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
