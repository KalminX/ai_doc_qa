import React from "react";
import { FileText } from "lucide-react";

export const CitationStrip = ({ source, onClick }) => {
  const percent = Math.round((source.similarity_score || 0) * 100);

  return (
    <button
      onClick={() => onClick(source)}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] border border-[#334155] hover:border-cyan-500/60 rounded-lg text-xs text-slate-200 transition-all group"
    >
      <FileText size={14} className="text-cyan-400 group-hover:scale-110 transition-transform" />
      <span className="font-semibold truncate max-w-[140px] text-slate-100">
        {source.document}
      </span>
      <span className="font-mono text-cyan-400">p.{source.page}</span>
      {percent > 0 && (
        <span className="text-[10px] font-mono bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400">
          {percent}% match
        </span>
      )}
    </button>
  );
};
