"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Route, MessageCircle, User } from "lucide-react";
import { NativeHaptics } from "../platform";
import { setLastTab } from "../store/appPrefs";

export type TabId = "home" | "path" | "doubt" | "me";

interface TabItem {
  id: TabId;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const TABS: TabItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/m/home",
    icon: Home,
  },
  {
    id: "path",
    label: "Path",
    href: "/m/path",
    icon: Route,
  },
  {
    id: "doubt",
    label: "Doubt",
    href: "/m/doubt",
    icon: MessageCircle,
  },
  {
    id: "me",
    label: "Me",
    href: "/m/me",
    icon: User,
  },
];

export function TabBar({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  const handleTabPress = (tabId: TabId) => {
    void NativeHaptics.selection();
    void setLastTab(tabId);
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-[#e2e8f0] pb-[env(safe-area-inset-bottom)] ${className}`}
    >
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-1">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={() => handleTabPress(tab.id)}
              className="flex flex-col items-center justify-center relative py-1 focus:outline-none transition-colors duration-150 select-none group"
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive
                      ? "text-[#0d9488] scale-110"
                      : "text-[#64748b] group-active:scale-95 group-active:text-[#0f172a]"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isActive && (
                  <span className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#0d9488]" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium mt-1 tracking-tight transition-colors duration-150 ${
                  isActive ? "text-[#0d9488] font-semibold" : "text-[#64748b]"
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
