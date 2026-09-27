import React, { useState, useEffect } from "react";
import { AppShell } from "../components/layout/AppShell";
import { DocumentHeader } from "../components/workspace/DocumentHeader";
import { QuestionInput } from "../components/workspace/QuestionInput";
import { InsightCard } from "../components/workspace/InsightCard";
import { SourceDetail } from "../components/workspace/SourceDetail";
import { EmptyState } from "../components/workspace/EmptyState";
import { AdminDashboardBanner } from "../components/admin/AdminDashboardBanner";
import { useDocuments } from "../hooks/useDocuments";
import { useQuestions } from "../hooks/useQuestions";
import { useAuth } from "../hooks/useAuth";
import { AlertCircle } from "lucide-react";

export const WorkspacePage = () => {
  const [activeDoc, setActiveDoc] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);

  const { user } = useAuth();
  const isAdmin = user?.is_staff || user?.is_superuser;

  const { documents, loading: docsLoading, uploadDocument, deleteDocument, refresh: refreshDocs } = useDocuments();
  const { qaHistory, loading: qaLoading, error: qaError, askQuestionStream, handleFinishStreaming } = useQuestions(activeDoc?.id || null);

  // Sync activeDoc when documents array updates (e.g. status changes from processing -> indexed)
  useEffect(() => {
    if (activeDoc && documents.length > 0) {
      const updatedDoc = documents.find(d => d.id === activeDoc.id);
      if (updatedDoc && (updatedDoc.status !== activeDoc.status || updatedDoc.chunk_count !== activeDoc.chunk_count)) {
        setActiveDoc(updatedDoc);
      }
    }
  }, [documents, activeDoc]);

  const handleAsk = async (questionText) => {
    await askQuestionStream(questionText);
  };

  const handleDeleteDoc = async (docId) => {
    if (activeDoc?.id === docId) {
      setActiveDoc(null);
    }
    await deleteDocument(docId);
  };

  return (
    <AppShell
      documents={documents}
      activeDoc={activeDoc}
      onSelectDoc={setActiveDoc}
      onUploadDoc={uploadDocument}
      onDeleteDoc={handleDeleteDoc}
      onRefreshDocs={refreshDocs}
    >
      <div className="max-w-4xl mx-auto">
        {/* Render Admin Control Center directly on main page for Admin Users */}
        {isAdmin && (
          <AdminDashboardBanner onRefreshWorkspace={refreshDocs} />
        )}

        <DocumentHeader doc={activeDoc} onRefresh={refreshDocs} />

        <QuestionInput
          onAsk={handleAsk}
          loading={qaLoading}
          placeholder={
            activeDoc
              ? `Query ${activeDoc.filename}...`
              : "Search all indexed documents in corpus..."
          }
        />

        {qaError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
            <span>{qaError}</span>
          </div>
        )}

        {/* Insight Cards list */}
        {qaHistory.length > 0 ? (
          <div className="space-y-4">
            {qaHistory.map((qa) => (
              <InsightCard
                key={qa.id}
                qa={qa}
                onSelectSource={setSelectedSource}
                onFinishStreaming={handleFinishStreaming}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            hasDocuments={documents.length > 0}
            onUploadClick={() => {}}
          />
        )}
      </div>

      <SourceDetail
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </AppShell>
  );
};
