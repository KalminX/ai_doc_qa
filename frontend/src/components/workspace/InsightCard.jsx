import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Terminal, FileCheck, Radio } from "lucide-react";
import { CitationStrip } from "./CitationStrip";
import gsap from "gsap";

export const InsightCard = ({ qa, onSelectSource, onFinishStreaming }) => {
  const [displayedText, setDisplayedText] = useState(
    qa.isStreaming ? "" : qa.answer || qa.fullAnswer || ""
  );
  const cardRef = useRef(null);
  const cursorRef = useRef(null);
  const streamBadgeRef = useRef(null);

  // GSAP card entrance reveal
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
      );
    }
  }, []);

  // GSAP streaming badge pulse
  useEffect(() => {
    if (qa.isStreaming && streamBadgeRef.current) {
      gsap.to(streamBadgeRef.current, {
        opacity: 0.4,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }
  }, [qa.isStreaming]);

  // GSAP cursor pulse
  useEffect(() => {
    if (qa.isStreaming && cursorRef.current) {
      gsap.to(cursorRef.current, {
        opacity: 0.2,
        duration: 0.4,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    }
  }, [qa.isStreaming]);

  // Simulated ChatGPT Typewriter Stream using GSAP / requestAnimationFrame ticker
  useEffect(() => {
    if (!qa.isStreaming) {
      setDisplayedText(qa.answer || qa.fullAnswer || "");
      return;
    }

    const fullText = qa.fullAnswer || qa.answer || "";
    if (!fullText) return;

    let currentIndex = displayedText.length;
    if (currentIndex >= fullText.length) return;

    const interval = setInterval(() => {
      // Step 2-4 characters per tick for smooth 60fps ChatGPT typing simulation
      currentIndex += Math.floor(Math.random() * 3) + 2;

      if (currentIndex >= fullText.length) {
        currentIndex = fullText.length;
        clearInterval(interval);
        setDisplayedText(fullText);
        if (onFinishStreaming) {
          onFinishStreaming(qa.id, fullText);
        }
      } else {
        setDisplayedText(fullText.slice(0, currentIndex));
      }
    }, 22);

    return () => clearInterval(interval);
  }, [qa.answer, qa.fullAnswer, qa.isStreaming, onFinishStreaming, qa.id, displayedText.length]);

  return (
    <div
      ref={cardRef}
      className={`bg-[#131B2E] border rounded-2xl p-5 md:p-6 mb-6 shadow-lg shadow-slate-950/40 transition-all ${
        qa.isStreaming
          ? "border-cyan-500/50 shadow-cyan-950/20"
          : "border-[#1F293D] hover:border-slate-700"
      }`}
    >
      {/* Question header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1F293D]">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-1.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg mt-0.5 flex-shrink-0">
            <Terminal size={16} />
          </div>
          <h3 className="font-semibold text-sm md:text-base text-slate-100 leading-snug">
            {qa.question}
          </h3>
        </div>

        {qa.isStreaming && (
          <div
            ref={streamBadgeRef}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-500/50 text-cyan-400"
          >
            <Radio size={12} className="animate-pulse" />
            <span>AI TYPING...</span>
          </div>
        )}
      </div>

      {/* Answer content with KaTeX math rendering */}
      <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed mb-5 font-sans">
        {displayedText ? (
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {displayedText}
          </ReactMarkdown>
        ) : qa.isStreaming ? (
          <p className="text-xs font-mono text-cyan-400/80 animate-pulse">
            Querying vector index & buffering response stream...
          </p>
        ) : null}

        {qa.isStreaming && (
          <span
            ref={cursorRef}
            className="inline-block w-2.5 h-4 bg-cyan-400 ml-1 translate-y-0.5 rounded-xs"
          />
        )}
      </div>

      {/* Sources footer */}
      {qa.sources && qa.sources.length > 0 && (
        <div className="pt-3 border-t border-[#1F293D]">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FileCheck size={13} className="text-emerald-400" />
            <span>Retrieved Citations ({qa.sources.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {qa.sources.map((source, idx) => (
              <CitationStrip
                key={idx}
                source={source}
                onClick={onSelectSource}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
