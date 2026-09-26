import React, { useRef } from "react";
import { FileText, Trash2, ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import gsap from "gsap";

export const DocumentCard = ({ doc, isActive, onSelect, onDelete }) => {
  const cardRef = useRef(null);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!cardRef.current) {
      onDelete(doc.id);
      return;
    }

    // GSAP delete exit transition: scale down + fade + collapse height
    gsap.to(cardRef.current, {
      opacity: 0,
      scale: 0.92,
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      marginBottom: 0,
      duration: 0.3,
      ease: "power2.inOut",
      onComplete: () => {
        onDelete(doc.id);
      },
    });
  };

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect(doc)}
      className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer overflow-hidden ${
        isActive
          ? "bg-[#1E293B] border-cyan-500/60 text-white shadow-lg shadow-cyan-950/20"
          : "bg-[#131B2E] hover:bg-[#1A243B] border-[#1F293D] hover:border-slate-600 text-slate-200"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div
          className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
            isActive
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "bg-slate-800/80 text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-800"
          }`}
        >
          <FileText size={18} />
        </div>
        <div className="min-w-0">
          <h4 className="font-semibold text-xs md:text-sm truncate leading-tight tracking-tight text-slate-100">
            {doc.display_name || doc.title || doc.filename}
          </h4>
          <div className="flex items-center gap-2 mt-1.5">

            <span className="text-[11px] font-mono text-slate-400">
              {doc.page_count != null ? `${doc.page_count} pgs` : "PDF"}
            </span>
            <StatusBadge status={doc.status} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Delete document"
          >
            <Trash2 size={15} />
          </button>
        )}
        <ChevronRight
          size={16}
          className={`transition-transform duration-200 group-hover:translate-x-0.5 ${
            isActive ? "text-cyan-400" : "text-slate-600"
          }`}
        />
      </div>
    </div>
  );
};
