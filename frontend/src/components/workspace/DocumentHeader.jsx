import React from "react";
import { FileText, Layers, AlertTriangle } from "lucide-react";
import { StatusBadge } from "../documents/StatusBadge";
import { IndexingProgress } from "../documents/IndexingProgress";
import { useAuth } from "../../hooks/useAuth";

export const DocumentHeader = ({ doc, onRefresh }) => {
  const { user } = useAuth();
  const userTier = user?.tier || "free";

  if (!doc) {
    return (
      <div className="flex items-center gap-3 p-4 bg-[#131B2E] border border-[#1F293D] rounded-xl mb-6 shadow-sm">
        <div className="p-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
          <Layers size={20} />
        </div>
        <div>
          <h2 className="font-semibold text-sm md:text-base text-slate-100">Global Search Scope</h2>
          <p className="text-xs text-slate-400 font-mono">
            Querying vector embeddings across all indexed corpus documents
          </p>
        </div>
      </div>
    );
  }

  const isProcessing = doc.status === "uploaded" || doc.status === "processing";

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#131B2E] border border-[#1F293D] rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 text-cyan-400 rounded-lg border border-slate-700">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-sm md:text-base text-slate-100 leading-tight">
              {doc.display_name || doc.title || doc.filename}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-xs font-mono text-slate-400">

              <span>{doc.page_count != null ? `${doc.page_count} pages` : "PDF"}</span>
              <span>·</span>
              <span>{doc.chunk_count ? `${doc.chunk_count} text chunks` : "Indexing"}</span>
            </div>
          </div>
        </div>

        <StatusBadge status={doc.status} />
      </div>

      {/* Real-time WebSocket Progress Bar */}
      {isProcessing && (
        <IndexingProgress
          docId={doc.id}
          initialStatus={doc.status}
          tier={userTier}
          onComplete={onRefresh}
        />
      )}

      {doc.status === "failed" && doc.error_message && (
        <div className="p-3 bg-rose-950/60 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2 font-mono">
          <AlertTriangle size={15} className="text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-rose-400">Indexing Error: </span>
            {doc.error_message}
          </div>
        </div>
      )}
    </div>
  );
};
