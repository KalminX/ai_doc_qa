import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../api/client";
import {
  getQaHistoryByScope,
  saveQaToIdb,
  deleteQaFromIdb,
  clearScopeQaIdb,
} from "../utils/idb";

export const useQuestions = (activeDocId = null) => {
  const [qaHistory, setQaHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeDocScope = activeDocId ? `doc_${activeDocId}` : "doc_global";

  // Load chat history from IndexedDB specifically for the current active book/scope
  useEffect(() => {
    let isMounted = true;
    const loadScopeHistory = async () => {
      try {
        const stored = await getQaHistoryByScope(activeDocScope);
        if (isMounted) {
          setQaHistory(stored.map((item) => ({ ...item, isStreaming: false })));
        }
      } catch (err) {
        console.error("[useQuestions] Error loading IndexedDB history for scope:", activeDocScope, err);
      }
    };

    loadScopeHistory();
    return () => {
      isMounted = false;
    };
  }, [activeDocScope]);

  const askQuestionStream = useCallback(
    async (question) => {
      setLoading(true);
      setError(null);

      const tempId = `${activeDocScope}_${Date.now()}`;

      // Initial chat entry for typewriter stream
      const initialQa = {
        id: tempId,
        docScope: activeDocScope,
        question,
        answer: "",
        fullAnswer: "",
        sources: [],
        isStreaming: true,
        timestamp: new Date().toISOString(),
      };

      setQaHistory((prev) => [initialQa, ...prev]);

      try {
        const token = localStorage.getItem("access_token");
        const payload = { question };
        if (activeDocId) {
          payload.document_id = activeDocId;
        }

        const response = await fetch(`${API_BASE_URL}/questions/stream/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status} error`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const lines = part.split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const jsonStr = trimmed.replace(/^data:\s*/, "");
              if (!jsonStr) continue;

              try {
                const parsed = JSON.parse(jsonStr);

                if (parsed.type === "sources") {
                  setQaHistory((prev) =>
                    prev.map((item) =>
                      item.id === tempId ? { ...item, sources: parsed.sources } : item
                    )
                  );
                } else if (parsed.type === "chunk") {
                  setQaHistory((prev) =>
                    prev.map((item) => {
                      if (item.id !== tempId) return item;
                      const updatedFull = item.fullAnswer + parsed.text;
                      return {
                        ...item,
                        fullAnswer: updatedFull,
                        answer: updatedFull,
                      };
                    })
                  );
                } else if (parsed.type === "error") {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                console.error("Parse stream chunk error:", e);
              }
            }
          }
        }
      } catch (err) {
        const msg = err.message || "Streaming request failed";
        console.error("[useQuestions] Question error:", msg);
        setError(msg);
        setQaHistory((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  answer: `Error: ${msg}`,
                  fullAnswer: `Error: ${msg}`,
                  isStreaming: false,
                }
              : item
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [activeDocId, activeDocScope]
  );

  // Callback when GSAP typewriter stream completes for a specific card
  const handleFinishStreaming = useCallback(
    async (id, finalAnswer) => {
      setQaHistory((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const completedItem = {
              ...item,
              docScope: activeDocScope,
              answer: finalAnswer || item.fullAnswer || item.answer,
              isStreaming: false,
            };
            // Save to IndexedDB under docScope
            saveQaToIdb(completedItem);
            return completedItem;
          }
          return item;
        })
      );
    },
    [activeDocScope]
  );

  const clearHistory = useCallback(async () => {
    setQaHistory([]);
    await clearScopeQaIdb(activeDocScope);
  }, [activeDocScope]);

  const deleteHistoryItem = useCallback(async (id) => {
    setQaHistory((prev) => prev.filter((item) => item.id !== id));
    await deleteQaFromIdb(id);
  }, []);

  return {
    qaHistory,
    loading,
    error,
    askQuestionStream,
    handleFinishStreaming,
    clearHistory,
    deleteHistoryItem,
  };
};
