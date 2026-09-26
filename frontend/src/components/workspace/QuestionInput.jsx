import React, { useState, useRef } from "react";
import { Search, ArrowUp, Loader2 } from "lucide-react";
import gsap from "gsap";

export const QuestionInput = ({ onAsk, loading, placeholder }) => {
  const [question, setQuestion] = useState("");
  const inputContainerRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    onAsk(question);
    setQuestion("");
  };

  const handleFocus = () => {
    if (inputContainerRef.current) {
      gsap.to(inputContainerRef.current, {
        borderColor: "rgba(6, 182, 212, 0.6)",
        boxShadow: "0 0 15px rgba(6, 182, 212, 0.15)",
        duration: 0.2,
      });
    }
  };

  const handleBlur = () => {
    if (inputContainerRef.current) {
      gsap.to(inputContainerRef.current, {
        borderColor: "#1F293D",
        boxShadow: "none",
        duration: 0.2,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mb-6">
      <div
        ref={inputContainerRef}
        className="relative flex items-center bg-[#131B2E] border border-[#1F293D] rounded-2xl transition-all"
      >
        <div className="absolute left-4 text-cyan-500 flex items-center pointer-events-none">
          <Search size={18} />
        </div>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || "Query indexed document corpus..."}
          disabled={loading}
          className="w-full pl-12 pr-14 py-3.5 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none transition-all disabled:opacity-60 font-sans"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="absolute right-2 p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-all font-bold shadow-md shadow-cyan-950/40"
          title="Execute Query"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <ArrowUp size={18} />
          )}
        </button>
      </div>
    </form>
  );
};
