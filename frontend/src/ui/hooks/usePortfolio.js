import { useCallback, useEffect, useMemo, useState } from "react";
import { portfolioRisk } from "../AppUtils.js";

const STORAGE_KEY = "portfolioSandbox";

export function usePortfolio(apiClient) {
  const [portfolio, setPortfolio] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [serverSummary, setServerSummary] = useState(null);
  const [portfolioSource, setPortfolioSource] = useState("local_fallback");

  const persistLocal = useCallback((next) => {
    setPortfolio(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const applyServerResponse = useCallback((data) => {
    const next = Array.isArray(data?.items) ? data.items : [];
    setPortfolio(next);
    setServerSummary(data?.summary || null);
    setPortfolioSource(data?.source || "server_mysql_portfolio_sandbox");
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!apiClient) return;
      try {
        const data = await apiClient.request("/api/portfolio");
        if (!cancelled) applyServerResponse(data);
      } catch {
        if (!cancelled) setPortfolioSource("local_fallback");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [apiClient, applyServerResponse]);

  const addStockToPortfolio = useCallback(
    async (stock) => {
      if (!stock?.code) return;
      const exists = portfolio.some((item) => item.code === stock.code);
      if (exists) return;
      const fallback = [
        ...portfolio,
        {
          code: stock.code,
          name: stock.name,
          group: stock.group,
          rate: stock.rate,
          count: stock.count,
          weight: 10
        }
      ];
      try {
        const data = await apiClient.request("/api/portfolio/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fallback[fallback.length - 1])
        });
        applyServerResponse(data);
      } catch {
        setPortfolioSource("local_fallback");
        persistLocal(fallback);
      }
    },
    [apiClient, applyServerResponse, persistLocal, portfolio]
  );

  const updatePortfolioWeight = useCallback(
    async (code, weight) => {
      const value = Math.max(0, Math.min(100, Number(weight || 0)));
      const fallback = portfolio.map((item) => (item.code === code ? { ...item, weight: value } : item));
      try {
        const data = await apiClient.request(`/api/portfolio/items/${code}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ weight: value })
        });
        applyServerResponse(data);
      } catch {
        setPortfolioSource("local_fallback");
        persistLocal(fallback);
      }
    },
    [apiClient, applyServerResponse, persistLocal, portfolio]
  );

  const removePortfolioItem = useCallback(
    async (code) => {
      const fallback = portfolio.filter((item) => item.code !== code);
      try {
        const data = await apiClient.request(`/api/portfolio/items/${code}`, { method: "DELETE" });
        applyServerResponse(data);
      } catch {
        setPortfolioSource("local_fallback");
        persistLocal(fallback);
      }
    },
    [apiClient, applyServerResponse, persistLocal, portfolio]
  );

  const localSummary = useMemo(() => portfolioRisk(portfolio), [portfolio]);
  const portfolioSummary = serverSummary || localSummary;

  return {
    portfolio,
    portfolioSummary,
    portfolioSource,
    addStockToPortfolio,
    updatePortfolioWeight,
    removePortfolioItem
  };
}
