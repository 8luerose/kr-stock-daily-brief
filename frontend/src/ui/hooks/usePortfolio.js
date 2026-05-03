import { useCallback, useMemo, useState } from "react";
import { portfolioRisk } from "../AppUtils.js";

const STORAGE_KEY = "portfolioSandbox";

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const savePortfolio = useCallback((next) => {
    setPortfolio(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const addStockToPortfolio = useCallback(
    (stock) => {
      if (!stock?.code) return;
      const exists = portfolio.some((item) => item.code === stock.code);
      if (exists) return;
      savePortfolio([
        ...portfolio,
        {
          code: stock.code,
          name: stock.name,
          group: stock.group,
          rate: stock.rate,
          count: stock.count,
          weight: 10
        }
      ]);
    },
    [portfolio, savePortfolio]
  );

  const updatePortfolioWeight = useCallback(
    (code, weight) => {
      const value = Math.max(0, Math.min(100, Number(weight || 0)));
      savePortfolio(portfolio.map((item) => (item.code === code ? { ...item, weight: value } : item)));
    },
    [portfolio, savePortfolio]
  );

  const removePortfolioItem = useCallback(
    (code) => {
      savePortfolio(portfolio.filter((item) => item.code !== code));
    },
    [portfolio, savePortfolio]
  );

  const portfolioSummary = useMemo(() => portfolioRisk(portfolio), [portfolio]);

  return {
    portfolio,
    portfolioSummary,
    addStockToPortfolio,
    updatePortfolioWeight,
    removePortfolioItem
  };
}
