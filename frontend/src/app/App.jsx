import React, { useState } from 'react';
import { useWorkspace } from '../hooks/useWorkspace';
import SearchCenter from '../components/SearchCenter';
import ChartWorkspace from '../components/ChartWorkspace';
import AiPanel from '../components/AiPanel';
import LearningPanel from '../components/LearningPanel';
import AdminConsole from '../components/AdminConsole';
import styles from './App.module.css';
import { Bot, LineChart, BookOpen, Settings } from 'lucide-react';

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

  const [activeTab, setActiveTab] = useState('chart'); // 'chart', 'learning', 'admin'

  return (
    <div className={styles.appShell}>
      {/* Header / Search Area */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <LineChart size={24} className={styles.logoIcon} />
          <h1>AI Stock</h1>
        </div>
        <div className={styles.searchContainer}>
          <SearchCenter 
            onSearch={handleSearch} 
            results={searchResults} 
            isSearching={isSearching}
            onSelect={changeStock}
          />
        </div>
        <nav className={styles.nav}>
          <button 
            className={`${styles.navButton} ${activeTab === 'chart' ? styles.active : ''}`}
            onClick={() => setActiveTab('chart')}
          >
            <Bot size={20} />
            <span>AI 분석</span>
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'learning' ? styles.active : ''}`}
            onClick={() => setActiveTab('learning')}
          >
            <BookOpen size={20} />
            <span>학습</span>
          </button>
          <button 
            className={`${styles.navButton} ${activeTab === 'admin' ? styles.active : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <Settings size={20} />
            <span>관리</span>
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {loading && !data && (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>AI가 차트를 분석하고 있습니다...</p>
          </div>
        )}
        
        {error && !data && (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>다시 시도</button>
          </div>
        )}

        {data && activeTab === 'chart' && (
          <div className={`${styles.workspace} animate-slide-up`}>
            <div className={styles.chartSection}>
              <ChartWorkspace 
                stock={data.stock} 
                chart={data.chart} 
                zones={data.zones} 
                events={data.events}
                ai={data.ai}
                interval={interval}
                onChangeInterval={changeInterval}
              />
            </div>
            <aside className={styles.sidePanel}>
              <AiPanel ai={data.ai} stock={data.stock} events={data.events} />
            </aside>
          </div>
        )}

        {activeTab === 'learning' && (
          <div className="animate-fade-in">
            <LearningPanel />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="animate-fade-in">
            <AdminConsole asOf={data?.asOf} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
