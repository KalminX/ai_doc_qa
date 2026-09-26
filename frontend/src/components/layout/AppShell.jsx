import React, { useState } from "react";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { MobileDrawer } from "./MobileDrawer";
import { BottomNav } from "./BottomNav";
import { AdminPanelModal } from "../admin/AdminPanelModal";

export const AppShell = ({
  documents,
  activeDoc,
  onSelectDoc,
  onUploadDoc,
  onDeleteDoc,
  onRefreshDocs,
  children,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-100 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-80 flex-col border-r border-[#1E293B]">
        <Sidebar
          documents={documents}
          activeDoc={activeDoc}
          onSelectDoc={onSelectDoc}
          onUploadDoc={onUploadDoc}
          onDeleteDoc={onDeleteDoc}
          onRefreshDocs={onRefreshDocs}
        />
      </aside>

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Sidebar
          documents={documents}
          activeDoc={activeDoc}
          onSelectDoc={(doc) => {
            onSelectDoc(doc);
            setDrawerOpen(false);
          }}
          onUploadDoc={async (file) => {
            await onUploadDoc(file);
            setDrawerOpen(false);
          }}
          onDeleteDoc={onDeleteDoc}
          onRefreshDocs={onRefreshDocs}
        />
      </MobileDrawer>


      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <TopBar
          onMenuClick={() => setDrawerOpen(true)}
          activeDocName={activeDoc?.filename || "Global Corpus"}
          onOpenAdminPanel={() => setAdminModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      {/* Admin Panel Modal */}
      <AdminPanelModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onRefreshWorkspace={onRefreshDocs}
      />
    </div>
  );
};
