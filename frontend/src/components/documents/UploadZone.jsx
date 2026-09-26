import React, { useState, useRef, useEffect } from "react";
import { FileUp, Loader2, AlertCircle } from "lucide-react";
import { parseApiError } from "../../api/client";
import gsap from "gsap";

export const UploadZone = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const iconRef = useRef(null);

  useEffect(() => {
    if (isDragging && containerRef.current) {
      gsap.to(containerRef.current, { scale: 1.02, borderColor: "#06B6D4", duration: 0.2 });
    } else if (containerRef.current) {
      gsap.to(containerRef.current, { scale: 1.0, borderColor: "#1F293D", duration: 0.2 });
    }
  }, [isDragging]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF documents are supported.");
      return;
    }
    setError(null);
    setUploading(true);

    if (iconRef.current) {
      gsap.to(iconRef.current, { rotation: 360, duration: 1, repeat: -1, ease: "linear" });
    }

    try {
      await onUpload(file);
    } catch (err) {
      const msg = parseApiError(err);
      console.error("[UploadZone] Upload error:", msg);
      setError(msg);
    } finally {
      setUploading(false);
      if (iconRef.current) {
        gsap.killTweensOf(iconRef.current);
        gsap.set(iconRef.current, { rotation: 0 });
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#131B2E] hover:bg-[#18233C] border-[#1F293D] hover:border-cyan-500/50 group`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="flex items-center justify-center gap-3">
          <div
            ref={iconRef}
            className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileUp size={18} />
            )}
          </div>
          <div className="text-left min-w-0">
            <p className="text-xs font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
              {uploading ? "Ingesting document..." : "Upload PDF Document"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Max 50 MB · Vector indexing
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5 font-mono bg-rose-950/60 p-2.5 rounded-lg border border-rose-500/30">
          <AlertCircle size={14} className="flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
