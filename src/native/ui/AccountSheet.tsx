"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogOut, ChevronRight, Flame } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { SECONDARY_NAV_ITEMS } from "@/components/navigation/navItems";
import { NativeHaptics } from "../platform";
import { registerOverlayHandler } from "../shell/NativeBackHandler";
import { bottomSheetVariants } from "../motion/presets";

interface AccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
  streakDays?: number;
}

export function AccountSheet({ isOpen, onClose, streakDays = 0 }: AccountSheetProps) {
  const { data, logout } = useApp();
  const user = data?.user;

  // Register with back button handler to close on back press
  useEffect(() => {
    if (isOpen) {
      registerOverlayHandler({
        hasOpenOverlay: () => true,
        closeOverlay: onClose,
      });
    } else {
      registerOverlayHandler(null);
    }
    return () => {
      registerOverlayHandler(null);
    };
  }, [isOpen, onClose]);

  const handleItemClick = () => {
    void NativeHaptics.impact("light");
    onClose();
  };

  const handleSignOut = async () => {
    void NativeHaptics.impact("medium");
    onClose();
    await logout();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs select-none"
          />

          {/* Bottom Sheet */}
          <motion.div
            variants={bottomSheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-x-0 bottom-0 z-50 max-w-md mx-auto bg-white rounded-t-3xl border-t border-[#e2e8f0] shadow-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] flex flex-col gap-4 select-none"
          >
            {/* Sheet Handle */}
            <div className="w-10 h-1 bg-[#cbd5e1] rounded-full mx-auto" />

            {/* Profile Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0f172a] text-white flex items-center justify-center font-bold text-base">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : "JP"}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0f172a]">
                    {user?.name || "JEE Aspirant"}
                  </h3>
                  <p className="text-xs text-[#64748b]">
                    {user?.email || "Target JEE 2027"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close sheet"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] active:bg-[#e2e8f0]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Streak Badge in Sheet */}
            {streakDays > 0 && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200/80 rounded-xl px-3.5 py-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-900">
                    {streakDays} Day Study Streak
                  </span>
                </div>
                <span className="text-[11px] font-bold text-amber-700">Active</span>
              </div>
            )}

            {/* Secondary Navigation Items */}
            <div className="flex flex-col divide-y divide-[#f1f5f9] rounded-2xl border border-[#e2e8f0] overflow-hidden">
              {SECONDARY_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleItemClick}
                    className="p-3.5 flex items-center justify-between hover:bg-[#f8fafc] active:bg-[#f1f5f9] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-[#0f172a]">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0f172a]">{item.label}</p>
                        {item.hint && (
                          <p className="text-[10px] text-[#64748b]">{item.hint}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
                  </Link>
                );
              })}
            </div>

            {/* Sign Out */}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full p-3.5 rounded-2xl border border-red-100 bg-red-50/50 flex items-center justify-between text-red-600 hover:bg-red-50 active:bg-red-100/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4" />
                <span className="text-xs font-bold">Sign Out</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
