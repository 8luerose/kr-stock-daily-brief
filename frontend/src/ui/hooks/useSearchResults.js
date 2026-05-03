import { useEffect, useMemo, useState } from "react";
import { asArray, normalizeSearchResult, searchMatchesItem } from "../AppUtils.js";

export function useSearchResults({ apiClient, enabled, query, baseItems, delayMs = 180, limit = 6 }) {
  const [serverResults, setServerResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q || !enabled) {
      setServerResults([]);
      setLoading(false);
      return undefined;
    }

    setServerResults([]);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiClient.request(`/api/search?query=${encodeURIComponent(q)}&limit=8`, {
          signal: controller.signal
        });
        setServerResults(asArray(data));
      } catch (e) {
        if (!controller.signal.aborted) {
          console.warn("Failed to load search results", e);
          setServerResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, delayMs);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [apiClient, delayMs, enabled, query]);

  const results = useMemo(() => {
    const serverItems = serverResults.map((item) => normalizeSearchResult(item, baseItems)).filter(Boolean);
    return (serverItems.length > 0 ? serverItems : baseItems.filter((item) => searchMatchesItem(item, query))).slice(0, limit);
  }, [baseItems, limit, query, serverResults]);

  return { searchResults: results, searchLoading: loading };
}
