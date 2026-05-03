import { useEffect, useMemo, useState } from "react";
import { formatApiError } from "../apiClient.js";
import { buildCalendarDays, endOfMonth, isoDate, startOfMonth } from "../AppUtils.js";

export function useBriefData({ apiClient, gateEnabled, accessKey }) {
  const todayStr = useMemo(() => isoDate(new Date()), []);
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(() => todayStr);
  const [summary, setSummary] = useState(null);
  const [krxArtifact, setKrxArtifact] = useState(null);
  const [krxArtifactError, setKrxArtifactError] = useState("");
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [monthHasSummary, setMonthHasSummary] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backfillFrom, setBackfillFrom] = useState("2026-02-01");
  const [backfillTo, setBackfillTo] = useState("2026-02-05");
  const [backfillResult, setBackfillResult] = useState(null);
  const gated = gateEnabled && !accessKey;

  const days = useMemo(() => buildCalendarDays(month), [month]);
  const monthLabel = useMemo(
    () =>
      month.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long"
      }),
    [month]
  );

  async function load(dateStr) {
    setLoading(true);
    setError("");
    setKrxArtifact(null);
    setKrxArtifactError("");
    try {
      const data = await apiClient.request(`/api/summaries/${dateStr}`);
      setSummary(data);
      setLoading(false);

      try {
        const artifact = await apiClient.request(`/api/summaries/${dateStr}/verification/krx`);
        setKrxArtifact(artifact);
      } catch (artifactErr) {
        setKrxArtifact(null);
        setKrxArtifactError(artifactErr.message || String(artifactErr));
      }
    } catch (e) {
      if (String(e.message).includes("404")) {
        if (dateStr === isoDate(new Date())) {
          try {
            const latest = await apiClient.request("/api/summaries/latest");
            setSummary(latest);
            if (latest?.date && latest.date !== dateStr) {
              setSelected(latest.date);
              const [y, m, d] = latest.date.split("-").map(Number);
              setMonth(new Date(y, m - 1, d));
            }
            return;
          } catch {
            // Fall through to the empty state when there is no stored summary.
          }
        }
        setSummary(null);
      } else {
        setError(e.message || String(e));
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    if (gated) {
      setStats(null);
      return;
    }

    try {
      const data = await apiClient.request("/api/summaries/stats");
      setStats(data);
    } catch (e) {
      console.warn("Failed to load stats", e);
      setStats(null);
    }
  }

  async function loadInsights(monthDate) {
    if (gated) {
      setInsights(null);
      return;
    }

    const from = isoDate(startOfMonth(monthDate));
    const to = isoDate(endOfMonth(monthDate));

    try {
      const data = await apiClient.request(`/api/summaries/insights?from=${from}&to=${to}`);
      setInsights(data);
    } catch (e) {
      console.warn("Failed to load insights", e);
      setInsights(null);
    }
  }

  async function loadMonthOverview(monthDate) {
    if (gated) {
      setMonthHasSummary(new Set());
      return;
    }

    const from = isoDate(startOfMonth(monthDate));
    const to = isoDate(endOfMonth(monthDate));

    try {
      const list = await apiClient.request(`/api/summaries?from=${from}&to=${to}`);
      setMonthHasSummary(new Set(list.map((item) => item.date)));
    } catch (e) {
      console.warn("Failed to load month overview", e);
      setMonthHasSummary(new Set());
    }
  }

  async function generate(dateStr) {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.request(`/api/summaries/${dateStr}/generate`, { method: "POST" });
      setSummary(data);
      await loadMonthOverview(month);
      await loadStats();
      await loadInsights(month);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function archiveSelected() {
    setLoading(true);
    setError("");
    try {
      await apiClient.request(`/api/summaries/${selected}/archive`, { method: "PUT" });
      setSummary(null);
      await loadMonthOverview(month);
      await loadStats();
      await loadInsights(month);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function runBackfill() {
    setLoading(true);
    setError("");
    try {
      const result = await apiClient.request(`/api/summaries/backfill?from=${backfillFrom}&to=${backfillTo}`, {
        method: "POST"
      });
      setBackfillResult(result);
      await loadMonthOverview(month);
      await loadStats();
      await loadInsights(month);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }

  async function jumpToLatest() {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.request("/api/summaries/latest");
      setSummary(data);
      await loadStats();
      setSelected(data.date);
      const [y, m, d] = data.date.split("-").map(Number);
      setMonth(new Date(y, m - 1, d));
    } catch (e) {
      if (String(e.message).includes("404")) setError("아직 생성된 요약이 없습니다.");
      else setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  useEffect(() => {
    loadMonthOverview(month);
    loadInsights(month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    month,
    setMonth,
    selected,
    setSelected,
    summary,
    krxArtifact,
    krxArtifactError,
    stats,
    insights,
    monthHasSummary,
    loading,
    error,
    setError,
    backfillFrom,
    setBackfillFrom,
    backfillTo,
    setBackfillTo,
    backfillResult,
    days,
    monthLabel,
    todayStr,
    generate,
    archiveSelected,
    runBackfill,
    jumpToLatest
  };
}
