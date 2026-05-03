import { useEffect, useState } from "react";
import { asArray, fromForEvents, rangeForInterval } from "../AppUtils.js";

export function useStockResearch({ apiClient, stock, interval, riskMode, chartFailedMessage }) {
  const [stockChart, setStockChart] = useState(null);
  const [stockEvents, setStockEvents] = useState(null);
  const [tradeZones, setTradeZones] = useState(null);
  const [stockChartLoading, setStockChartLoading] = useState(false);
  const [stockChartError, setStockChartError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!stock?.code) {
        setStockChart(null);
        setStockEvents(null);
        setTradeZones(null);
        setStockChartError("");
        return;
      }

      setStockChartLoading(true);
      setStockChartError("");
      try {
        const range = rangeForInterval(interval);
        const chart = await apiClient.request(`/api/stocks/${stock.code}/chart?range=${range}&interval=${interval}`);
        if (!active) return;
        setStockChart(chart);

        try {
          const zones = await apiClient.request(`/api/stocks/${stock.code}/trade-zones?range=${range}&interval=${interval}&riskMode=${riskMode}`);
          if (active) setTradeZones(zones);
        } catch (zoneErr) {
          if (active) {
            console.warn("Failed to load stock trade zones", zoneErr);
            setTradeZones(null);
          }
        }

        const from = fromForEvents(chart);
        const to = chart.asOf || asArray(chart.data).at(-1)?.date || "";
        if (from && to) {
          const events = await apiClient.request(`/api/stocks/${stock.code}/events?from=${from}&to=${to}`);
          if (active) setStockEvents(events);
        } else if (active) {
          setStockEvents(null);
        }
      } catch (e) {
        if (active) {
          console.warn("Failed to load stock research", e);
          setStockChart(null);
          setStockEvents(null);
          setTradeZones(null);
          setStockChartError(chartFailedMessage);
        }
      } finally {
        if (active) setStockChartLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [apiClient, chartFailedMessage, interval, riskMode, stock?.code]);

  return {
    stockChart,
    stockEvents,
    tradeZones,
    stockChartLoading,
    stockChartError
  };
}
