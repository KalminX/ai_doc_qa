import React from "react";
import { CheckCircle2, Loader2, AlertTriangle, UploadCloud } from "lucide-react";

export const StatusBadge = ({ status }) => {
  switch (status) {
    case "indexed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
          <CheckCircle2 size={10} />
          INDEXED
        </span>
      );
    case "processing":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
          <Loader2 size={10} className="animate-spin" />
          PROCESSING
        </span>
      );
    case "uploaded":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-950/60 border border-amber-500/40 text-amber-400">
          <UploadCloud size={10} />
          QUEUED
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-950/60 border border-rose-500/40 text-rose-400">
          <AlertTriangle size={10} />
          FAILED
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-800 text-slate-400">
          {status?.toUpperCase() || "UNKNOWN"}
        </span>
      );
  }
};
