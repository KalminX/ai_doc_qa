import React from "react";
import { BookOpen, Search } from "lucide-react";

export const BottomNav = ({ activeTab, onTabChange, onOpenDrawer }) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-[#0F172A] border-t border-[#1E293B] flex items-center justify-around z-30 px-2 text-slate-300">
      <button
        onClick={onOpenDrawer}
        className="flex flex-col items-center gap-1 p-1 text-[11px] font-mono text-slate-400 hover:text-cyan-400"
      >
        <BookOpen size={18} />
        <span>Corpus</span>
      </button>

      <button
        onClick={() => onTabChange("search")}
        className={`flex flex-col items-center gap-1 p-1 text-[11px] font-mono ${
          activeTab === "search" ? "text-cyan-400 font-bold" : "text-slate-400"
        }`}
      >
        <Search size={18} />
        <span>Query</span>
      </button>
    </div>
  );
};
