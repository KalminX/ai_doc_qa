import React, { useState, useEffect, useRef } from "react";
import { X, Shield, Trash2, Users, FileText, AlertTriangle, RefreshCw, Layers } from "lucide-react";
import api, { parseApiError } from "../../api/client";
import { StatusBadge } from "../documents/StatusBadge";
import gsap from "gsap";

export const AdminPanelModal = ({ isOpen, onClose, onRefreshWorkspace }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const modalRef = useRef(null);

  const fetchAdminDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/documents/admin/list/");
      setDocuments(res.data.results || res.data || []);
    } catch (err) {
      const msg = parseApiError(err);
      setError(`Admin Fetch Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminDocs();
      if (modalRef.current) {
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, scale: 0.96, y: 15 },
          { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "power2.out" }
        );
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Actions
  const handleDeleteDoc = async (docId, filename) => {
    if (!window.confirm(`Are you sure you want to delete document "${filename}"?`)) return;
    try {
      await api.delete(`/documents/admin/${docId}/`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setActionMessage(`Deleted document "${filename}".`);
      if (onRefreshWorkspace) onRefreshWorkspace();
    } catch (err) {
      alert(`Failed to delete document: ${parseApiError(err)}`);
    }
  };

  const handleDeleteUserDocs = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete ALL documents uploaded by user "${username}"?`)) return;
    try {
      const res = await api.delete(`/documents/admin/user/${userId}/`);
      setDocuments((prev) => prev.filter((d) => d.user_id !== userId));
      setActionMessage(res.data.detail || `Deleted all documents for ${username}.`);
      if (onRefreshWorkspace) onRefreshWorkspace();
    } catch (err) {
      alert(`Failed to delete user documents: ${parseApiError(err)}`);
    }
  };

  const handlePurgeAll = async () => {
    if (!window.confirm("WARNING: Are you sure you want to PURGE ALL DOCUMENTS SYSTEM-WIDE? This action cannot be undone.")) return;
    try {
      const res = await api.delete("/documents/admin/purge-all/");
      setDocuments([]);
      setActionMessage(res.data.detail || "System-wide document purge complete.");
      if (onRefreshWorkspace) onRefreshWorkspace();
    } catch (err) {
      alert(`Failed to purge all documents: ${parseApiError(err)}`);
    }
  };

  const filteredDocs = documents.filter(
    (d) =>
      d.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.user_username || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = documents.reduce((acc, d) => acc + (d.page_count || 0), 0);
  const totalChunks = documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0);
  const uniqueUsers = new Set(documents.map((d) => d.user_id)).size;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-[#0F172A] border border-[#1E293B] rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-[#131B2E] border-b border-[#1F293D]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100 tracking-tight font-mono">
                System Administration Panel
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                System-wide corpus management across all user accounts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-5 bg-[#0B0F19] border-b border-[#1F293D]">
          <div className="p-3.5 bg-[#131B2E] border border-[#1F293D] rounded-xl flex items-center gap-3">
            <FileText size={20} className="text-cyan-400" />
            <div>
              <div className="text-[11px] font-mono text-slate-400">Total Documents</div>
              <div className="text-base font-bold text-slate-100 font-mono">{documents.length}</div>
            </div>
          </div>

          <div className="p-3.5 bg-[#131B2E] border border-[#1F293D] rounded-xl flex items-center gap-3">
            <Users size={20} className="text-emerald-400" />
            <div>
              <div className="text-[11px] font-mono text-slate-400">Active Uploaders</div>
              <div className="text-base font-bold text-slate-100 font-mono">{uniqueUsers} users</div>
            </div>
          </div>

          <div className="p-3.5 bg-[#131B2E] border border-[#1F293D] rounded-xl flex items-center gap-3">
            <Layers size={20} className="text-amber-400" />
            <div>
              <div className="text-[11px] font-mono text-slate-400">Total Text Chunks</div>
              <div className="text-base font-bold text-slate-100 font-mono">{totalChunks}</div>
            </div>
          </div>

          <div className="p-3.5 bg-[#131B2E] border border-[#1F293D] rounded-xl flex items-center gap-3">
            <AlertTriangle size={20} className="text-purple-400" />
            <div>
              <div className="text-[11px] font-mono text-slate-400">Total Pages</div>
              <div className="text-base font-bold text-slate-100 font-mono">{totalPages}</div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-[#131B2E] border-b border-[#1F293D] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search by filename or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#0F172A] border border-[#1F293D] rounded-lg text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminDocs}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Refresh list"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handlePurgeAll}
              className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Trash2 size={14} />
              <span>PURGE ALL DOCUMENTS</span>
            </button>
          </div>
        </div>

        {actionMessage && (
          <div className="px-5 py-2.5 bg-emerald-950/60 border-b border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage("")} className="text-emerald-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Document List Table */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {loading ? (
            <div className="text-center py-12 font-mono text-xs text-slate-400 flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin text-cyan-400" />
              <span>Fetching system-wide corpus registry...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono rounded-xl">
              {error}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 font-mono text-xs text-slate-500">
              No matching documents found in registry.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between p-3.5 bg-[#131B2E] border border-[#1F293D] hover:border-slate-700 rounded-xl gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-slate-800 text-cyan-400 rounded-lg flex-shrink-0 border border-slate-700">
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-xs md:text-sm text-slate-100 truncate leading-tight">
                        {doc.filename}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] font-mono text-slate-400">
                        <span className="text-cyan-400 font-semibold">User: {doc.user_username || `ID ${doc.user_id}`}</span>
                        <span>·</span>
                        <span>{doc.page_count != null ? `${doc.page_count} pgs` : "PDF"}</span>
                        <span>·</span>
                        <span>{doc.chunk_count} chunks</span>
                        <span>·</span>
                        <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={doc.status} />

                    <button
                      onClick={() => handleDeleteUserDocs(doc.user_id, doc.user_username)}
                      className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 text-[11px] font-mono rounded-lg transition-colors flex items-center gap-1"
                      title={`Delete all files uploaded by ${doc.user_username}`}
                    >
                      <Users size={12} />
                      <span>Purge User's Docs</span>
                    </button>

                    <button
                      onClick={() => handleDeleteDoc(doc.id, doc.filename)}
                      className="p-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-lg transition-colors"
                      title="Delete single document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
