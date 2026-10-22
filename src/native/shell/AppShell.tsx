"use client";

import React from "react";
import { TabBar } from "./TabBar";
import { ToastProvider } from "../ui/NativeToast";

interface AppShellProps {
  children: React.ReactNode;
  showTabBar?: boolean;
  className?: string;
  header?: React.ReactNode;
}

export function AppShell({
  children,
  showTabBar = true,
  className = "",
  header,
}: AppShellProps) {
  return (
    <ToastProvider>
      <div className="min-h-[100dvh] w-full bg-[#f8fafc] text-[#0f172a] flex flex-col items-center justify-start overflow-x-hidden">
        {/*
          Laptop / desktop preview wrapper:
          On wide screens (desktop browser testing), centers the app in a realistic 420px mobile viewport.
          On actual phone screen or Capacitor WebView, expands to 100% full width and 100dvh height.
        */}
        <div className="w-full max-w-md min-h-[100dvh] bg-[#f6f7f9] flex flex-col relative shadow-xl border-x border-[#e2e8f0]/80">
          {/* Top safe-area inset bar */}
          <div className="h-[env(safe-area-inset-top,0px)] bg-white/80 sticky top-0 z-30" />

          {/* Optional screen header */}
          {header && (
            <header className="sticky top-[env(safe-area-inset-top,0px)] z-30 bg-white/95 border-b border-[#e2e8f0] px-4 py-3">
              {header}
            </header>
          )}

          {/* Main scrollable body */}
          <main
            className={`flex-1 flex flex-col ${
              showTabBar ? "pb-20" : "pb-[env(safe-area-inset-bottom,0px)]"
            } ${className}`}
          >
            {children}
          </main>

          {/* Bottom Tab Bar */}
          {showTabBar && <TabBar />}
        </div>
      </div>
    </ToastProvider>
  );
}
