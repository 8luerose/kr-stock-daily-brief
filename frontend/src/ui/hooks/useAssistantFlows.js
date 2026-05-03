import { useEffect, useState } from "react";
import { formatApiError } from "../apiClient.js";
import { asArray, buildTermQuestion } from "../AppUtils.js";

export function useAssistantFlows({
  apiClient,
  activePage,
  selected,
  summary,
  briefTerms,
  selectedTerm,
  currentStock,
  stockInterval,
  stockChart,
  stockEvents,
  tradeZones,
  dataAsOf,
  riskMode,
  setError
}) {
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantResponse, setAssistantResponse] = useState(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [aiResearchLoading, setAiResearchLoading] = useState(false);
  const [aiResearchResponse, setAiResearchResponse] = useState(null);
  const [primedTermId, setPrimedTermId] = useState("");

  function primeLearningAssistant(term) {
    if (!term) return;
    setAssistantQuestion(buildTermQuestion(term));
    setAssistantResponse(null);
    setPrimedTermId(term.id || "");
  }

  async function askMarketAssistant(questionOverride, itemOverride) {
    const question = (questionOverride || assistantQuestion || "오늘 시장을 초보자 관점으로 설명해줘").trim();
    if (!question) return;

    setAssistantLoading(true);
    setAssistantResponse(null);
    setError("");
    try {
      const data = await apiClient.request("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          contextDate: selected,
          topicType: itemOverride?.type || "market",
          topicTitle: itemOverride?.title || "오늘 시장",
          searchResult: itemOverride
            ? {
                type: itemOverride.type,
                title: itemOverride.title,
                code: itemOverride.code,
                market: itemOverride.market,
                tags: asArray(itemOverride.tags),
                summary: itemOverride.summary,
                source: itemOverride.source
              }
            : null,
          summary: summary
            ? {
                date: summary.date,
                topGainer: summary.topGainer,
                topLoser: summary.topLoser,
                mostMentioned: summary.mostMentioned
              }
            : null,
          terms: briefTerms
        })
      });
      setAssistantQuestion(question);
      setAssistantResponse(data);
    } catch (e) {
      setAssistantQuestion(question);
      setAssistantResponse({
        answer: formatApiError(e),
        confidence: "low",
        sources: [],
        limitations: ["AI 서비스 응답을 받지 못했습니다."]
      });
    } finally {
      setAssistantLoading(false);
      window.setTimeout(() => {
        document.querySelector(".heroAssistant")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  }

  async function askLearningAssistant(questionOverride, termIdOverride) {
    const question = (questionOverride || assistantQuestion || buildTermQuestion(selectedTerm)).trim();
    if (!question) return;

    setAssistantLoading(true);
    setError("");
    try {
      const data = await apiClient.request("/api/learning/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          contextDate: selected,
          termId: termIdOverride || selectedTerm?.id || ""
        })
      });
      setAssistantQuestion(question);
      setAssistantResponse(data);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setAssistantLoading(false);
    }
  }

  function askAssistant() {
    if (activePage === "home") {
      askMarketAssistant();
      return;
    }
    askLearningAssistant();
  }

  async function askChartAi() {
    if (!currentStock?.code) return;
    setAiResearchLoading(true);
    setAiResearchResponse(null);
    try {
      const data = await apiClient.request("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${currentStock.name} 차트와 이벤트를 초보자 관점으로 설명해줘`,
          contextDate: stockChart?.asOf || dataAsOf,
          stockCode: currentStock.code,
          stockName: currentStock.name,
          focus: riskMode,
          summary: summary
            ? {
                date: summary.date,
                topGainer: summary.topGainer,
                topLoser: summary.topLoser,
                mostMentioned: summary.mostMentioned
              }
            : null,
          chart: stockChart
            ? {
                interval: stockChart.interval,
                range: stockChart.range,
                asOf: stockChart.asOf,
                latest: asArray(stockChart.data).at(-1),
                tradeZones
              }
            : null,
          events: asArray(stockEvents?.events).slice(0, 8),
          terms: briefTerms
        })
      });
      setAiResearchResponse(data);
    } catch (e) {
      setAiResearchResponse({
        answer: formatApiError(e),
        confidence: "low",
        sources: [],
        limitations: ["AI 서비스 응답을 받지 못했습니다."]
      });
    } finally {
      setAiResearchLoading(false);
    }
  }

  useEffect(() => {
    if (!assistantQuestion && selectedTerm?.id && primedTermId !== selectedTerm.id) {
      setAssistantQuestion(buildTermQuestion(selectedTerm));
      setPrimedTermId(selectedTerm.id);
    }
  }, [assistantQuestion, primedTermId, selectedTerm]);

  useEffect(() => {
    setAiResearchResponse(null);
  }, [currentStock?.code, stockInterval, riskMode]);

  return {
    assistantQuestion,
    setAssistantQuestion,
    assistantResponse,
    assistantLoading,
    askAssistant,
    askMarketAssistant,
    askLearningAssistant,
    primeLearningAssistant,
    aiResearchLoading,
    aiResearchResponse,
    askChartAi
  };
}
