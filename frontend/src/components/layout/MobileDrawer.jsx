import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import gsap from "gsap";

export const MobileDrawer = ({ isOpen, onClose, children }) => {
  const drawerRef = useRef(null);

  useEffect(() => {
    if (isOpen && drawerRef.current) {
      gsap.fromTo(
        drawerRef.current,
        { x: "-100%" },
        { x: "0%", duration: 0.3, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div
        ref={drawerRef}
        className="relative w-4/5 max-w-sm bg-[#0F172A] h-full shadow-2xl z-10 flex flex-col border-r border-[#1E293B]"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700 z-20"
        >
          <X size={18} />
        </button>
        <div className="h-full pt-2">{children}</div>
      </div>
    </div>
  );
};
