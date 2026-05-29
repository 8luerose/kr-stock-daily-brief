import { useState, useEffect, useCallback, useRef } from 'react';
import { loadStockAi, loadStockCoreWorkspace, loadStockOllamaInsights, prefetchStockWorkspaces } from '../services/apiClient';

export function useWorkspace(initialCode = '005930', initialInterval = 'daily') {
  const [activeCode, setActiveCode] = useState(initialCode);
  const [interval, setInterval] = useState(initialInterval);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const fetchWorkspace = async () => {
      setLoading(!hasLoadedRef.current);
      setError(null);
      try {
        const workspaceData = await loadStockCoreWorkspace(activeCode, interval);
        if (mounted && requestId === requestIdRef.current) {
          hasLoadedRef.current = true;
          setData(workspaceData);
          setLoading(false);
          prefetchStockWorkspaces(activeCode, interval);
          const loadAiLayer = async () => {
            let ollamaInsights = null;
            try {
              ollamaInsights = await loadStockOllamaInsights(workspaceData, interval);
              if (!mounted || requestId !== requestIdRef.current) return;
              setData((current) => {
                if (!current || current.stock?.code !== workspaceData.stock?.code || current.chart?.interval !== workspaceData.chart?.interval) {
                  return current;
                }
                return {
                  ...current,
                  ai: {
                    ...current.ai,
                    ollamaInsights,
                    modeLabel: ollamaInsights.modeLabel,
                    llmModel: ollamaInsights.model,
                    llmProvider: 'ollama',
                    llmUsed: ollamaInsights.mode === 'ollama_llm'
                  }
                };
              });
            } catch {
              // Keep the instant rule-based workspace visible while the slower AI layer fails or retries later.
            }

            if (ollamaInsights?.mode === 'ollama_llm') return;

            try {
              const ai = await loadStockAi(workspaceData, interval);
              if (!mounted || requestId !== requestIdRef.current) return;
              setData((current) => {
                if (!current || current.stock?.code !== workspaceData.stock?.code || current.chart?.interval !== workspaceData.chart?.interval) {
                  return current;
                }
                return { ...current, ai: { ...ai, ollamaInsights: current.ai?.ollamaInsights } };
              });
            } catch {
              // The core chart remains usable without the secondary AI chat response.
            }
          };
          loadAiLayer();
        }
      } catch (err) {
        if (mounted && requestId === requestIdRef.current) {
          setError(err.message || '데이터 로드 실패');
          setLoading(false);
        }
      }
    };
    fetchWorkspace();
    return () => { mounted = false; };
  }, [activeCode, interval]);

  const changeInterval = useCallback((newInterval) => {
    setInterval((current) => (current === newInterval ? current : newInterval));
  }, []);

  const changeStock = useCallback((code) => {
    setActiveCode((current) => (current === code ? current : code));
  }, []);

  return {
    activeCode,
    interval,
    data,
    loading,
    error,
    changeStock,
    changeInterval
  };
}
