import React from "react";
import { Cpu, Search } from "lucide-react";

export const EmptyState = ({ hasDocuments, onUploadClick }) => {
  if (!hasDocuments) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-[#131B2E] border border-[#1F293D] rounded-2xl shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 text-cyan-400 border border-slate-700 flex items-center justify-center mb-4">
          <Cpu size={28} />
        </div>
        <h3 className="text-base font-semibold text-slate-100 mb-1">
          Document Corpus Empty
        </h3>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed font-mono">
          Upload PDF textbooks, research papers, or technical manuals in the sidebar to begin vector indexing and Q&A retrieval.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-[#131B2E]/50 border border-dashed border-[#1F293D] rounded-2xl">
      <div className="w-10 h-10 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center mb-3 border border-slate-700">
        <Search size={20} />
      </div>
      <h3 className="text-sm font-semibold text-slate-200 mb-1">
        Ready for natural language query
      </h3>
      <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-mono">
        Enter a question above to perform similarity vector search across your indexed documents.
      </p>
    </div>
  );
};
