import { useState, useEffect, useCallback } from 'react';
import { loadStockWorkspace, searchWorkspace } from '../services/apiClient';

export function useWorkspace(initialCode = '005930', initialInterval = 'daily') {
  const [activeCode, setActiveCode] = useState(initialCode);
  const [interval, setInterval] = useState(initialInterval);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
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

  const handleSearch = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchWorkspace(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const changeStock = useCallback((code) => {
    setActiveCode(code);
    setSearchResults([]);
  }, []);

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
    searchResults,
    isSearching,
    handleSearch,
    changeStock,
    changeInterval
  };
}
