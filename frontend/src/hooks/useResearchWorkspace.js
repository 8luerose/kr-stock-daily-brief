import { useEffect, useMemo, useState } from "react";
import { fallbackStocks, fallbackWorkspace } from "../data/fallbackData.js";
import { loadLearningTerms, loadStockWorkspace } from "../services/apiClient.js";

export function useResearchWorkspace() {
  const [selectedCode, setSelectedCode] = useState(fallbackWorkspace.stock.code);
  const [interval, setInterval] = useState("daily");
  const [workspace, setWorkspace] = useState(fallbackWorkspace);
  const [terms, setTerms] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    loadStockWorkspace(selectedCode, interval).then((nextWorkspace) => {
      if (!alive) return;
      setWorkspace(nextWorkspace);
      setStatus(nextWorkspace.loadError ? "fallback" : "ready");
    });
    return () => {
      alive = false;
    };
  }, [interval, selectedCode]);

  useEffect(() => {
    let alive = true;
    loadLearningTerms().then((nextTerms) => {
      if (alive) setTerms(nextTerms);
    });
    return () => {
      alive = false;
    };
  }, []);

  const candidates = useMemo(() => fallbackStocks.slice(0, 3), []);

  return {
    candidates,
    interval,
    selectedCode,
    setInterval,
    setSelectedCode,
    status,
    terms,
    workspace
  };
}
