import React, { useEffect, useState, useRef } from "react";
import { Loader2, Zap, Clock } from "lucide-react";
import gsap from "gsap";

export const IndexingProgress = ({ docId, initialStatus, tier = "free", onComplete }) => {
  const [progressData, setProgressData] = useState({
    status: initialStatus || "processing",
    stage: "extraction",
    progress: 10,
    message: "Connecting to real-time indexing pipeline...",
    processed_chunks: 0,
    total_chunks: 0,
    tier: tier,
  });

  const barRef = useRef(null);

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, {
        width: `${Math.max(5, progressData.progress)}%`,
        duration: 0.4,
        ease: "power2.out",
      });
    }
  }, [progressData.progress]);

  useEffect(() => {
    if (!docId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//localhost:8000/ws/documents/${docId}/`;

    console.log(`[WebSocket] Connecting to ${wsUrl}`);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log(`[WebSocket] Connected to document group doc_${docId}`);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "indexing_progress") {
          setProgressData(data);
          if (data.status === "indexed" && onComplete) {
            setTimeout(() => onComplete(), 1500);
          }
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    socket.onerror = (err) => {
      console.error("[WebSocket Error]", err);
    };

    socket.onclose = () => {
      console.log(`[WebSocket] Disconnected from doc_${docId}`);
    };

    return () => {
      socket.close();
    };
  }, [docId, onComplete]);

  const isPro = (progressData.tier || tier) === "pro";

  return (
    <div className="bg-[#131B2E] border border-[#1F293D] rounded-2xl p-4 md:p-5 mb-6 shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Loader2 size={16} className="animate-spin text-cyan-400" />
          <h4 className="font-medium text-xs md:text-sm text-slate-100 font-mono">
            {progressData.message}
          </h4>
        </div>

        {/* Tier badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
            isPro
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400"
              : "bg-slate-800 border-slate-700 text-slate-400"
          }`}
        >
          {isPro ? <Zap size={11} /> : <Clock size={11} />}
          {isPro ? "PRO INDEXING" : "STANDARD INDEXING"}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-2.5 bg-slate-900 rounded-full overflow-hidden mb-2 border border-slate-800">
        <div
          ref={barRef}
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
          style={{ width: "5%" }}
        />
      </div>

      <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
        <span>
          {progressData.total_chunks > 0
            ? `Vectorizing ${progressData.processed_chunks} / ${progressData.total_chunks} chunks`
            : "Parsing document structure..."}
        </span>
        <span className="font-bold text-cyan-400">
          {progressData.progress}%
        </span>
      </div>
    </div>
  );
};
