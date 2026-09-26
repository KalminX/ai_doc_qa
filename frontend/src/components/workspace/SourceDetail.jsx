import React, { useEffect, useRef } from "react";
import { X, FileText, Bookmark } from "lucide-react";
import gsap from "gsap";

export const SourceDetail = ({ source, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (source && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.95, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: "power2.out" }
      );
    }
  }, [source]);

  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#131B2E] border-b border-[#1F293D]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">
                {source.document}
              </h3>
              <p className="text-xs font-mono text-cyan-400">Page {source.page}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content excerpt */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex items-center gap-2 mb-3 text-xs font-mono text-slate-400 uppercase tracking-wider">
            <Bookmark size={14} className="text-emerald-400" />
            <span>Retrieved Context Excerpt</span>
          </div>
          <div className="bg-[#131B2E] p-4 rounded-xl border border-[#1F293D] text-xs md:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-mono">
            {source.text}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1F293D] bg-[#0F172A] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium rounded-lg transition-colors border border-slate-700"
          >
            Close Excerpt
          </button>
        </div>
      </div>
    </div>
  );
};
