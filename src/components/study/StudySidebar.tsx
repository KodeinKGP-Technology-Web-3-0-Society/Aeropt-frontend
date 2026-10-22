"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type SVGProps } from "react";
import { useApp } from "@/components/AppContext";
import PastSessionsPanel from "@/components/study/PastSessionsPanel";
import { fetchProgressCached } from "@/lib/api/progress";
import { JeePathMark } from "@/components/JeePathLogo";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import {
  PRIMARY_NAV_ITEMS as PRIMARY,
  SECONDARY_NAV_ITEMS as SECONDARY,
  isRouteActive as isActive,
} from "@/components/navigation/navItems";
import { isNative } from "@/native/platform";
import { NativeHeader } from "@/native/shell/NativeHeader";
import { TabBar } from "@/native/shell/TabBar";

export type StudySidebarContext = {
  conceptName?: string | null;
  conceptId?: string | null;
  nodeId?: string | null;
  stage?: string | null;
  stageIndex?: number;
  stageTotal?: number;
  slideProgress?: { current: number; total: number } | null;
  proficiencyPct?: number | null;
  weakPrereq?: string | null;
  journeyType?: string | null;
};

/* ── icons (1.8 stroke, 24 grid) ───────────────────────────────────────────── */

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props} />
  );
}
function SunIcon(p: SVGProps<SVGSVGElement>) {
  return <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 3v1.6M12 19.4V21M4.2 4.2l1.1 1.1M18.7 18.7l1.1 1.1M3 12h1.6M19.4 12H21M4.2 19.8l1.1-1.1M18.7 5.3l1.1-1.1" /></Svg>;
}
function MoonIcon(p: SVGProps<SVGSVGElement>) {
  return <Svg {...p}><path d="M20 14.5A7.5 7.5 0 1 1 9.5 4 6.2 6.2 0 0 0 20 14.5Z" /></Svg>;
}
function FlameIcon(p: SVGProps<SVGSVGElement>) {
  return <Svg {...p}><path d="M12 21c3.6 0 6-2.4 6-5.8 0-3.9-3.4-5.6-4.2-9.7-2.4 1.5-3.4 4.3-3.3 6.5-1-.6-1.8-1.7-2-3C6.9 10.6 6 12.6 6 15.2 6 18.6 8.4 21 12 21Z" /></Svg>;
}
function MenuIcon(p: SVGProps<SVGSVGElement>) {
  return <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;
}

function Logo() {
  return (
    <Link href="/home" className="flex shrink-0 items-center gap-2 rounded-lg pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label="JeePath home">
      <JeePathMark size={28} />
      <span className="font-display text-[17px] font-bold tracking-tight text-ink max-sm:hidden">
        Jee<span className="text-accent">Path</span>
      </span>
    </Link>
  );
}

/** Current streak, from the same progress record as /progress. */
function StreakChip() {
  const [streak, setStreak] = useState<{ days: number; today: boolean } | null>(null);
  useEffect(() => {
    let live = true;
    fetchProgressCached()
      .then((r) => live && setStreak({ days: r.overview.streak_days, today: r.overview.active_today }))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  if (!streak) return null;
  const label = streak.days
    ? `${streak.days}-day streak${streak.today ? "" : ". Study today to keep it"}`
    : "No streak yet. Answer a question to start one";
  return (
    <Link
      href="/progress"
      title={label}
      aria-label={label}
      className={`flex h-11 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium tabular-nums transition-colors hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        streak.days && streak.today ? "text-ink" : "text-muted"
      }`}
    >
      <FlameIcon className={`h-4 w-4 ${streak.days ? "text-[#F59E0B]" : ""}`} />
      <span>{streak.days === 0 ? "No streak" : streak.days === 1 ? "1-day streak" : `${streak.days}-day streak`}</span>
    </Link>
  );
}

export default function StudySidebar({ studyContext }: { studyContext?: StudySidebarContext }) {
  const pathname = usePathname();
  const { data, logout, appTheme, setAppTheme } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const user = data.user;
  const initials =
    user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U";

  const onChat = ["/chat", "/lesson", "/doubt", "/assess"].some((p) => pathname.startsWith(p));
  const contextLabel = studyContext?.conceptName
    ? [
        studyContext.conceptName,
        studyContext.stage ? studyContext.stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null,
        studyContext.proficiencyPct != null ? `${studyContext.proficiencyPct}%` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  // Close the menu on outside click, Escape, and navigation.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const [streak, setStreak] = useState<{ days: number; today: boolean } | null>(null);
  useEffect(() => {
    let live = true;
    fetchProgressCached()
      .then((r) => live && setStreak({ days: r.overview.streak_days, today: r.overview.active_today }))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const isAndroidApp = process.env.NEXT_PUBLIC_BUILD_TARGET === "android" || isNative();
  if (isAndroidApp) {
    return (
      <>
        <NativeHeader
          streakDays={streak?.days ?? 0}
          title={studyContext?.conceptName || undefined}
          subtitle={contextLabel || undefined}
        />
        <TabBar />
      </>
    );
  }

  const linkClass = (active: boolean) =>
    `flex h-11 items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
      active ? "bg-accent-soft text-accent" : "text-ink-2 hover:bg-hover hover:text-ink"
    }`;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-line bg-surface/90 backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-3 sm:px-5">
          <Logo />

          <nav className="ml-2 hidden items-center gap-0.5 md:flex" aria-label="Primary">
            {PRIMARY.map((item) => {
              const active = isActive(item, pathname);
              return (
                <Link key={item.href} href={item.href} title={item.hint} aria-current={active ? "page" : undefined} className={linkClass(active)}>
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="max-lg:sr-only">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <StreakChip />
            <PastSessionsPanel />
            <button
              type="button"
              onClick={() => setAppTheme(appTheme === "dark" ? "light" : "dark")}
              title={appTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={appTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-hover hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent max-sm:hidden"
            >
              {appTheme === "dark" ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
            </button>

            <div className="relative ml-1" ref={menuRef}>
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Open menu"
                className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-line py-0.5 pl-0.5 pr-2 transition-colors hover:bg-hover md:pr-0.5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[11px] font-bold tracking-wide text-accent-on">
                  {initials}
                </span>
                <MenuIcon className="h-4 w-4 text-ink-2 md:hidden" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] w-64 overflow-hidden rounded-2xl border border-line bg-surface py-1.5 shadow-[var(--shadow-card)]"
                >
                  <div className="border-b border-line px-4 pb-2.5 pt-1.5">
                    <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  {/* On small screens the primary links live here too. */}
                  <div className="border-b border-line py-1 md:hidden">
                    {PRIMARY.map((item) => (
                      <Link key={item.href} href={item.href} role="menuitem" onClick={() => setMenuOpen(false)}
                        aria-current={isActive(item, pathname) ? "page" : undefined}
                        className={`flex items-center gap-3 px-4 py-2.5 text-sm ${isActive(item, pathname) ? "font-semibold text-accent" : "text-ink-2 hover:bg-hover hover:text-ink"}`}>
                        <item.icon className="h-[18px] w-[18px]" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                  <div className="py-1">
                    {SECONDARY.map((item) => (
                      <Link key={item.href} href={item.href} role="menuitem" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-2 hover:bg-hover hover:text-ink">
                        <item.icon className="h-[18px] w-[18px]" />
                        <span className="flex flex-col">
                          {item.label}
                          {item.hint && <span className="text-[11px] text-muted">{item.hint}</span>}
                        </span>
                      </Link>
                    ))}
                    <button type="button" role="menuitem" onClick={() => setAppTheme(appTheme === "dark" ? "light" : "dark")}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-ink-2 hover:bg-hover hover:text-ink sm:hidden">
                      {appTheme === "dark" ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
                      {appTheme === "dark" ? "Light mode" : "Dark mode"}
                    </button>
                  </div>
                  <div className="border-t border-line pt-1">
                    <button type="button" role="menuitem" onClick={() => void logout()}
                      className="block w-full cursor-pointer px-4 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger/10">
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {onChat && contextLabel ? (
        <div className="pointer-events-none flex justify-center px-3 pt-2">
          <div className="app-nav-context pointer-events-auto max-w-[min(64rem,100%)] truncate rounded-full px-3 py-1.5 text-[11px] font-medium" title={contextLabel}>
            {contextLabel}
            {studyContext?.slideProgress ? ` · slide ${studyContext.slideProgress.current}/${studyContext.slideProgress.total}` : ""}
          </div>
        </div>
      ) : null}
      </header>
      <MobileBottomNav />
    </>
  );
}
