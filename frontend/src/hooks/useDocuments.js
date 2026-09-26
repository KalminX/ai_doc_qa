import { useState, useEffect, useCallback } from "react";
import api from "../api/client";

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await api.get("/documents/");
      setDocuments(res.data.results || res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Auto-poll if any document is in "uploaded" or "processing" state
  useEffect(() => {
    const hasProcessing = documents.some(
      (doc) => doc.status === "uploaded" || doc.status === "processing"
    );
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 4000);

    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/documents/upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    await fetchDocuments();
    return res.data;
  };

  const deleteDocument = async (id) => {
    await api.delete(`/documents/${id}/`);
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  return {
    documents,
    loading,
    error,
    refresh: fetchDocuments,
    uploadDocument,
    deleteDocument,
  };
};
