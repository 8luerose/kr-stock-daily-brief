import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useWorkspace } from '../hooks/useWorkspace';
import { loadLearningTerms, loadStockOptions } from '../services/apiClient';
import ImmersiveChart from '../components/ImmersiveChart';
import FloatingAiCard from '../components/FloatingAiCard';
import DeepDiveLearningSheet from '../components/DeepDiveLearningSheet';
import HiddenAdminSheet from '../components/HiddenAdminSheet';
import { Activity } from 'lucide-react';
import styles from './App.module.css';

function intervalLabel(interval) {
  if (interval === 'weekly') return '1주';
  if (interval === 'monthly') return '1개월';
  return '1일';
}

function buildPipelineToast({ data, activeCode, interval, loading }) {
  const waitingAiSteps = [
    { label: '차트', state: 'waiting' },
    { label: '뉴스', state: 'waiting' },
    { label: 'AI 판단', state: 'waiting' }
  ];
  if (!data && loading) {
    return {
      title: '차트를 준비하고 있습니다',
      detail: '종목 가격과 최근 뉴스를 먼저 불러옵니다.',
      tone: 'loading',
      steps: waitingAiSteps
    };
  }
  if (!data) return null;

  if (data.stock?.code !== activeCode) {
    return {
      title: `${activeCode} 차트 불러오는 중`,
      detail: `${intervalLabel(interval)} 차트와 AI 판단에 필요한 기본 정보를 준비합니다.`,
      tone: 'loading',
      steps: waitingAiSteps
    };
  }

  const aiStatus = data.ai?.aiLayerStatus || (data.ai?.ollamaInsights ? 'ready' : '');
  const ollamaStatus = data.ai?.ollamaInsightsStatus
    || (data.ai?.ollamaInsights ? 'ready'
      : aiStatus === 'ollama_failed' ? 'failed'
        : aiStatus === 'ollama_delayed' ? 'delayed'
          : aiStatus === 'loading' ? 'loading' : 'waiting');
  const reportStatus = data.ai?.marketReportStatus || (data.ai?.marketReport ? 'ready' : '');
  const insights = data.ai?.ollamaInsights;
  if (ollamaStatus === 'loading') {
    return {
      title: `${data.stock?.name || activeCode} AI 판단 준비 중`,
      detail: '차트 흐름과 뉴스를 함께 보고 매수, 관망, 매도 기준을 정리합니다.',
      tone: 'loading',
      steps: [
        { label: '차트', state: 'ready' },
        { label: '뉴스', state: 'loading' },
        { label: 'AI 판단', state: 'loading' }
      ]
    };
  }
  if (ollamaStatus === 'failed' || ollamaStatus === 'delayed') {
    return {
      title: 'AI 판단이 늦어지고 있습니다',
      detail: ollamaStatus === 'delayed'
        ? '차트는 먼저 볼 수 있습니다. AI 답변이 도착하면 자동으로 바뀝니다.'
        : '지금은 차트 기준 판단을 먼저 보여주고 있습니다.',
      tone: 'delayed',
      steps: [
        { label: '차트', state: 'ready' },
        { label: '뉴스', state: 'waiting' },
        { label: 'AI 판단', state: 'delayed' }
      ]
    };
  }
  if (reportStatus === 'loading') {
    return {
      title: '오늘 시장 흐름을 확인하고 있습니다',
      detail: '장마감 브리프를 읽고 이 종목 판단에 필요한 내용만 정리합니다.',
      tone: 'loading',
      steps: [
        { label: '차트', state: 'ready' },
        { label: '뉴스', state: 'ready' },
        { label: 'AI 판단', state: 'loading' }
      ]
    };
  }
  if (ollamaStatus === 'ready') return null;
  return null;
}

function App() {
  const {
    activeCode,
    interval,
    data,
    loading,
    error,
    changeStock,
    changeInterval,
    refreshAi
  } = useWorkspace();

  const [learningMode, setLearningMode] = useState(false);
  const [learningSheetOpen, setLearningSheetOpen] = useState(false);
  const [termData, setTermData] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [aiCardExpanded, setAiCardExpanded] = useState(false);
  const [chartPanelOpen, setChartPanelOpen] = useState(false);
  const [stockOptions, setStockOptions] = useState([]);
  const pipelineToast = useMemo(
    () => buildPipelineToast({ data, activeCode, interval, loading }),
    [activeCode, data, interval, loading]
  );

  const chartContext = useMemo(() => {
    if (!data) return null;
    const latest = data.chart?.rows?.[data.chart.rows.length - 1] || null;
    return {
      stockName: data.stock?.name,
      code: data.stock?.code,
      asOf: data.asOf,
      interval,
      latestClose: latest?.close,
      latestVolume: latest?.volume,
      ma20: data.indicatorSnapshot?.movingAverages?.ma20,
      supportLevel: data.indicatorSnapshot?.supportLevel,
      resistanceLevel: data.indicatorSnapshot?.resistanceLevel,
      priceVsMa20: data.indicatorSnapshot?.priceVsMa20,
      summary: data.currentDecisionSummary?.summary,
      buyCondition: data.currentDecisionSummary?.buyReviewCondition,
      riskCondition: data.currentDecisionSummary?.riskCondition
    };
  }, [data, interval]);

  useEffect(() => {
    let mounted = true;
    loadStockOptions()
      .then((options) => {
        if (mounted) setStockOptions(options);
      })
      .catch(() => {
        if (mounted) setStockOptions([]);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setAiCardExpanded(false);
    setChartPanelOpen(false);
  }, [activeCode, interval]);

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
            stockOptions={stockOptions}
            onChangeStock={changeStock}
            learningMode={learningMode}
            onTermClick={handleSelectTerm}
            aiCardExpanded={aiCardExpanded}
            onPanelOpenChange={setChartPanelOpen}
            onRefreshAi={refreshAi}
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

      {pipelineToast && !chartPanelOpen && (
        <div
          className={clsx(styles.pipelineToast, styles[`pipelineToast_${pipelineToast.tone}`])}
          data-testid="pipeline-toast"
          role="status"
          aria-live="polite"
        >
          <Activity size={16} aria-hidden="true" />
          <div className={styles.pipelineToastBody}>
            <strong>{pipelineToast.title}</strong>
            <span>{pipelineToast.detail}</span>
          </div>
          <div className={styles.pipelineToastSteps} aria-label="데이터와 AI 준비 단계">
            {pipelineToast.steps.map((step) => (
              <span
                key={step.label}
                className={styles[`pipelineStep_${step.state}`] || ''}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Floating UI Layer */}
      <div className={styles.uiLayer}>
        {data && !loading && !chartPanelOpen && (
          <FloatingAiCard
            ai={data.ai}
            events={data.events}
            asOf={data.asOf}
            onExpandedChange={setAiCardExpanded}
            onRefreshAi={refreshAi}
          />
        )}
      </div>

      <DeepDiveLearningSheet 
        isOpen={learningSheetOpen} 
        onClose={() => setLearningSheetOpen(false)} 
        termData={termData}
        chartContext={chartContext}
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
