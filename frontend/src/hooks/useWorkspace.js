import { useState, useEffect, useCallback } from 'react';
import { loadStockWorkspace } from '../services/apiClient';

export function useWorkspace(initialCode = '005930', initialInterval = 'daily') {
  const [activeCode, setActiveCode] = useState(initialCode);
  const [interval, setInterval] = useState(initialInterval);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    const fetchWorkspace = async () => {
      setLoading(true);
      setError(null);
      try {
        const workspaceData = await loadStockWorkspace(activeCode, interval);
        if (mounted) {
          setData(workspaceData);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || '데이터 로드 실패');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    fetchWorkspace();
    return () => { mounted = false; };
  }, [activeCode, interval, refreshKey]);

  const changeInterval = useCallback((newInterval) => {
    setRefreshKey((key) => key + 1);
    setInterval(newInterval);
  }, []);

  return {
    activeCode,
    interval,
    data,
    loading,
    error,
    changeInterval
  };
}
