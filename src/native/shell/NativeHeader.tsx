"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Flame } from "lucide-react";
import { JeePathMark } from "@/components/JeePathLogo";
import { useApp } from "@/components/AppContext";
import { AccountSheet } from "../ui/AccountSheet";
import { NativeHaptics } from "../platform";

interface NativeHeaderProps {
  streakDays?: number;
  title?: string;
  subtitle?: string;
}

export function NativeHeader({ streakDays = 0, title, subtitle }: NativeHeaderProps) {
  const [accountSheetOpen, setAccountSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useApp();
  const user = data?.user;

  const isFullScreenRoom =
    pathname?.startsWith("/study/room") ||
    pathname?.startsWith("/lesson/room") ||
    pathname?.startsWith("/assess") ||
    pathname?.startsWith("/chat/session");

  const handleAvatarClick = () => {
    void NativeHaptics.impact("light");
    setAccountSheetOpen(true);
  };

  const handleBack = () => {
    void NativeHaptics.impact("light");
    router.back();
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 border-b border-[#e2e8f0] px-4 py-2.5 backdrop-blur-md pt-[max(0.65rem,env(safe-area-inset-top,0px))]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {isFullScreenRoom ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleBack}
                aria-label="Back"
                className="w-9 h-9 -ml-1 rounded-xl flex items-center justify-center text-[#0f172a] hover:bg-[#f1f5f9] active:bg-[#e2e8f0]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-[#0f172a] truncate">
                  {title || "Session"}
                </h1>
                {subtitle && (
                  <p className="text-[10px] text-[#64748b] truncate">{subtitle}</p>
                )}
              </div>
            </div>
          ) : (
            <Link
              href="/home"
              onClick={() => void NativeHaptics.selection()}
              className="flex items-center gap-2 group select-none"
            >
              <JeePathMark size={28} />
              <span className="font-extrabold text-base tracking-tight text-[#0f172a]">
                Jee<span className="text-[#0d9488]">Path</span>
              </span>
            </Link>
          )}

          {/* Right controls: Streak + Avatar */}
          <div className="flex items-center gap-2">
            {streakDays > 0 && !isFullScreenRoom && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-semibold select-none">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{streakDays}</span>
              </div>
            )}

            {/* Avatar Button */}
            <button
              type="button"
              onClick={handleAvatarClick}
              aria-label="Open Account Menu"
              className="w-8 h-8 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs shadow-xs hover:ring-2 hover:ring-teal-500/50 active:scale-95 transition-all select-none"
            >
              {user?.name ? user.name.slice(0, 1).toUpperCase() : "J"}
            </button>
          </div>
        </div>
      </header>

      {/* Account Bottom Sheet */}
      <AccountSheet
        isOpen={accountSheetOpen}
        onClose={() => setAccountSheetOpen(false)}
        streakDays={streakDays}
      />
    </>
  );
}
