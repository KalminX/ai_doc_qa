import React, { useState } from "react";
import { Search, Layers, Database, Sparkles, Loader2 } from "lucide-react";
import { DocumentCard } from "../documents/DocumentCard";
import { UploadZone } from "../documents/UploadZone";
import api, { parseApiError } from "../../api/client";

export const Sidebar = ({
  documents,
  activeDoc,
  onSelectDoc,
  onUploadDoc,
  onDeleteDoc,
  onRefreshDocs,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [renaming, setRenaming] = useState(false);

  const filteredDocs = documents.filter((doc) => {
    const titleToSearch = doc.display_name || doc.title || doc.filename;
    return titleToSearch.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleAutoRename = async () => {
    setRenaming(true);
    try {
      const res = await api.post("/documents/rename-all/");
      alert(res.data.detail || "Documents auto-renamed with Gemini!");
      if (onRefreshDocs) onRefreshDocs();
    } catch (err) {
      alert(`Auto-rename error: ${parseApiError(err)}`);
    } finally {
      setRenaming(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0F172A] text-slate-200 border-r border-[#1E293B] p-4">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-cyan-400" />
          <h2 className="font-semibold text-xs tracking-wider uppercase text-slate-300 font-mono">
            Document Corpus
          </h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          {documents.length} files
        </span>
      </div>

      {/* Upload Zone */}
      <div className="mb-3">
        <UploadZone onUpload={onUploadDoc} />
      </div>

      {/* Gemini Clean Titles Trigger Button */}
      <button
        onClick={handleAutoRename}
        disabled={renaming || documents.length === 0}
        className="w-full mb-3 py-2 px-3 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        title="Use Gemini AI to clean filename rubbish and format neat publication titles"
      >
        {renaming ? (
          <Loader2 size={14} className="animate-spin text-cyan-400" />
        ) : (
          <Sparkles size={14} className="text-cyan-400" />
        )}
        <span>{renaming ? "Renaming Titles..." : "Gemini Clean Titles"}</span>
      </button>

      {/* Filter Input */}
      <div className="relative mb-3">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="text"
          placeholder="Filter corpus..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#131B2E] border border-[#1F293D] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-mono transition-colors"
        />
      </div>

      {/* Select All Docs option */}
      <div
        onClick={() => onSelectDoc(null)}
        className={`flex items-center gap-2.5 p-3 mb-3 rounded-xl border cursor-pointer transition-all text-xs font-medium ${
          activeDoc === null
            ? "bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-sm"
            : "bg-[#131B2E] border-[#1F293D] text-slate-300 hover:border-slate-600 hover:bg-[#18233C]"
        }`}
      >
        <Layers size={16} className={activeDoc === null ? "text-cyan-400" : "text-slate-400"} />
        <span>Global Search (All Documents)</span>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-8 text-xs font-mono text-slate-500">
            No matching documents
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              isActive={activeDoc?.id === doc.id}
              onSelect={onSelectDoc}
              onDelete={onDeleteDoc}
            />
          ))
        )}
      </div>
    </div>
  );
};
