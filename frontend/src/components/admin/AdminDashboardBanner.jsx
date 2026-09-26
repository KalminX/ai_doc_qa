import React, { useState, useEffect } from "react";
import { Shield, Trash2, Users, FileText, Layers, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import api, { parseApiError } from "../../api/client";
import { StatusBadge } from "../documents/StatusBadge";

export const AdminDashboardBanner = ({ onRefreshWorkspace }) => {
  const [adminDocs, setAdminDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const fetchAllDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/documents/admin/list/");
      setAdminDocs(res.data.results || res.data || []);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDocs();
  }, []);

  const handleDeleteDoc = async (docId, filename) => {
    if (!window.confirm(`Admin: Delete document "${filename}" from server local disk and database?`)) return;
    try {
      await api.delete(`/documents/admin/${docId}/`);
      setAdminDocs((prev) => prev.filter((d) => d.id !== docId));
      setStatusMsg(`Deleted "${filename}".`);
      if (onRefreshWorkspace) onRefreshWorkspace();
    } catch (err) {
      alert(`Delete failed: ${parseApiError(err)}`);
    }
  };

  const handleDeleteUserDocs = async (userId, username) => {
    if (!window.confirm(`Admin: Delete ALL documents uploaded by user "${username}"?`)) return;
    try {
      const res = await api.delete(`/documents/admin/user/${userId}/`);
      setAdminDocs((prev) => prev.filter((d) => d.user_id !== userId));
      setStatusMsg(res.data.detail || `Purged all files for user ${username}.`);
      if (onRefreshWorkspace) onRefreshWorkspace();
    } catch (err) {
      alert(`User purge failed: ${parseApiError(err)}`);
    }
  };

  const handlePurgeAll = async () => {
    if (!window.confirm("CRITICAL ADMIN ACTION: Delete ALL documents system-wide across all users?")) return;
    try {
      const res = await api.delete("/documents/admin/purge-all/");
      setAdminDocs([]);
      setStatusMsg(res.data.detail || "All documents purged system-wide.");
      if (onRefreshWorkspace) onRefreshWorkspace();
    } catch (err) {
      alert(`System purge failed: ${parseApiError(err)}`);
    }
  };

  const filteredDocs = adminDocs.filter(
    (d) =>
      d.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.user_username || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = adminDocs.reduce((acc, d) => acc + (d.page_count || 0), 0);
  const totalChunks = adminDocs.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const uploaderCount = new Set(adminDocs.map((d) => d.user_id)).size;

  return (
    <div className="mb-6 bg-[#131B2E] border-2 border-rose-500/40 rounded-2xl p-5 shadow-xl text-slate-100 font-sans">
      {/* Admin Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1F293D]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl">
            <Shield size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-100 font-mono tracking-tight">
                ADMIN CONTROL CENTER
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-950 border border-rose-500/50 text-rose-400">
                SYSTEM STAFF
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              System-wide corpus oversight, user file inspection, and disk purge controls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <span>{expanded ? "Hide Registry" : `Inspect Registry (${adminDocs.length})`}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            onClick={handlePurgeAll}
            className="px-3.5 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Trash2 size={14} />
            <span>PURGE ALL SYSTEM DOCS</span>
          </button>
        </div>
      </div>

      {/* System Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
        <div className="bg-[#0F172A] border border-[#1F293D] p-3 rounded-xl flex items-center gap-2.5">
          <FileText size={18} className="text-cyan-400" />
          <div>
            <div className="text-[10px] font-mono text-slate-400">System Docs</div>
            <div className="text-sm font-bold font-mono text-slate-100">{adminDocs.length}</div>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1F293D] p-3 rounded-xl flex items-center gap-2.5">
          <Users size={18} className="text-emerald-400" />
          <div>
            <div className="text-[10px] font-mono text-slate-400">Uploaders</div>
            <div className="text-sm font-bold font-mono text-slate-100">{uploaderCount} users</div>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1F293D] p-3 rounded-xl flex items-center gap-2.5">
          <Layers size={18} className="text-amber-400" />
          <div>
            <div className="text-[10px] font-mono text-slate-400">Vector Chunks</div>
            <div className="text-sm font-bold font-mono text-slate-100">{totalChunks}</div>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1F293D] p-3 rounded-xl flex items-center gap-2.5">
          <Shield size={18} className="text-purple-400" />
          <div>
            <div className="text-[10px] font-mono text-slate-400">Total Pages</div>
            <div className="text-sm font-bold font-mono text-slate-100">{totalPages}</div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="mt-3 p-2.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono rounded-xl flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg("")} className="text-emerald-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      {/* Expandable System Corpus Registry Table */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-[#1F293D] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              placeholder="Filter by filename or uploader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#1F293D] rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
            <button
              onClick={fetchAllDocs}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono border border-slate-700"
              title="Refresh Registry"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {loading ? (
              <div className="text-center py-6 text-xs font-mono text-slate-400">Loading system registry...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-6 text-xs font-mono text-slate-500">No documents found</div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between p-3 bg-[#0F172A] border border-[#1F293D] hover:border-slate-700 rounded-xl gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <h5 className="font-semibold text-xs text-slate-100 truncate">{doc.filename}</h5>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-400">
                      <span className="text-cyan-400 font-bold">User: {doc.user_username || `ID ${doc.user_id}`}</span>
                      <span>·</span>
                      <span>{doc.page_count != null ? `${doc.page_count} pgs` : "PDF"}</span>
                      <span>·</span>
                      <span>{doc.chunk_count} chunks</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={doc.status} />

                    <button
                      onClick={() => handleDeleteUserDocs(doc.user_id, doc.user_username)}
                      className="px-2 py-1 bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-[10px] font-mono rounded-lg transition-colors"
                      title={`Purge all files uploaded by ${doc.user_username}`}
                    >
                      Purge User Files
                    </button>

                    <button
                      onClick={() => handleDeleteDoc(doc.id, doc.filename)}
                      className="p-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-lg transition-colors"
                      title="Delete single document"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
