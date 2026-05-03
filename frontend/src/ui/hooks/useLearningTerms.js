import { useEffect, useMemo, useState } from "react";
import { asArray, pickBriefTerms, termMatches } from "../AppUtils.js";

export function useLearningTerms({ apiClient, enabled, loadFailedMessage }) {
  const [learningTerms, setLearningTerms] = useState([]);
  const [learningError, setLearningError] = useState("");
  const [termQuery, setTermQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(learningTerms.map((term) => term.category).filter(Boolean))),
    [learningTerms]
  );
  const visibleTerms = useMemo(
    () => learningTerms.filter((term) => termMatches(term, termQuery, selectedCategory)).slice(0, 80),
    [learningTerms, selectedCategory, termQuery]
  );
  const selectedTerm = useMemo(
    () =>
      visibleTerms.find((term) => term.id === selectedTermId) ||
      visibleTerms[0] ||
      learningTerms.find((term) => term.id === selectedTermId) ||
      learningTerms[0] ||
      null,
    [learningTerms, selectedTermId, visibleTerms]
  );
  const briefTerms = useMemo(() => pickBriefTerms(learningTerms), [learningTerms]);

  function selectTerm(term) {
    if (!term) return;
    setSelectedTermId(term.id);
  }

  useEffect(() => {
    let mounted = true;

    async function loadLearningTerms() {
      if (!enabled) {
        setLearningTerms([]);
        return;
      }

      setLearningError("");
      try {
        const data = asArray(await apiClient.request("/api/learning/terms?limit=80"));
        if (!mounted) return;
        setLearningTerms(data);
        setSelectedTermId((current) => current || data[0]?.id || "");
      } catch (e) {
        if (!mounted) return;
        console.warn("Failed to load learning terms", e);
        setLearningTerms([]);
        setLearningError(loadFailedMessage);
      }
    }

    loadLearningTerms();
    return () => {
      mounted = false;
    };
  }, [apiClient, enabled, loadFailedMessage]);

  return {
    learningTerms,
    learningError,
    termQuery,
    setTermQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    visibleTerms,
    selectedTerm,
    selectTerm,
    briefTerms
  };
}
