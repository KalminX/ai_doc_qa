import React from "react";
import { Menu, Cpu, LogOut, Zap, ShieldCheck, Shield } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const TopBar = ({ onMenuClick, activeDocName, onOpenAdminPanel }) => {
  const { user, logout } = useAuth();
  const isPro = user?.tier === "pro";
  const isAdmin = user?.is_staff || user?.is_superuser;

  return (
    <header className="h-14 border-b border-[#1E293B] bg-[#0F172A] px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 font-sans">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-950/40">
            <Cpu size={16} />
          </div>
          <span className="font-bold text-base text-slate-100 tracking-tight font-mono">
            DocIQ
          </span>
        </div>

        {activeDocName && (
          <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-slate-800 text-xs">
            <span className="text-slate-400 font-mono">Scope:</span>
            <span className="truncate max-w-[240px] font-medium text-slate-200">
              {activeDocName}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Admin Panel Button */}
            {isAdmin && (
              <button
                onClick={onOpenAdminPanel}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900 transition-colors shadow-xs"
              >
                <Shield size={13} className="text-rose-400" />
                <span>Admin Panel</span>
              </button>
            )}

            {/* User Tier Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                isPro
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-400 shadow-xs"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              {isPro ? <Zap size={11} className="text-emerald-400" /> : <ShieldCheck size={11} />}
              {isPro ? "PRO" : "FREE"}
            </span>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-semibold text-[11px]">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <span className="hidden md:inline font-medium text-slate-300">{user.username}</span>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors ml-1"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
