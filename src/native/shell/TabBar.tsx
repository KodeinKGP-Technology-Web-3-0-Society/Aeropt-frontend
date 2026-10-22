"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NativeHaptics } from "../platform";
import { setLastTab } from "../store/appPrefs";
import { PRIMARY_NAV_ITEMS, isRouteActive } from "@/components/navigation/navItems";

export function TabBar({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  // Full-screen pages hide the tab bar completely
  const isFullScreen =
    pathname?.startsWith("/study/room") ||
    pathname?.startsWith("/lesson/room") ||
    pathname?.startsWith("/assess") ||
    pathname?.startsWith("/chat/session");

  if (isFullScreen) {
    return null;
  }

  const handleTabPress = (itemHref: string) => {
    void NativeHaptics.selection();
    const tabName = itemHref.replace("/", "");
    void setLastTab(tabName);
  };

  return (
    <nav
      aria-label="Native Bottom Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-[#e2e8f0] pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md ${className}`}
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-15 px-1 items-center">
        {PRIMARY_NAV_ITEMS.map((tab) => {
          const isActive = isRouteActive(tab, pathname || "");
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => handleTabPress(tab.href)}
              className="flex flex-col items-center justify-center relative py-1 focus:outline-none transition-colors duration-150 select-none group"
            >
              <div
                className={`relative flex items-center justify-center h-8 w-11 rounded-full transition-all duration-150 ${
                  isActive ? "bg-teal-50" : "group-hover:bg-[#f1f5f9]"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive
                      ? "text-[#0d9488] scale-105 stroke-[2.2]"
                      : "text-[#64748b] group-active:scale-95 group-active:text-[#0f172a]"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-medium mt-0.5 tracking-tight transition-colors duration-150 ${
                  isActive ? "text-[#0d9488] font-bold" : "text-[#64748b]"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
