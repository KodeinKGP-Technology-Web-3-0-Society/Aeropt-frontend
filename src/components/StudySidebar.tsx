"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import { useApp } from "@/components/AppContext";
import NavLiquidGlass from "@/components/NavLiquidGlass";

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

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Roadmap", href: "/roadmap", icon: MapIcon },
  { label: "Study Session", href: "/chat", icon: ChatIcon },
  { label: "Practice", href: "/practice", icon: LayersIcon },
  { label: "Progress", href: "/progress", icon: ChartIcon },
  { label: "Settings", href: "/settings", icon: GearIcon },
];

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m4 11 8-7 8 7v8.5a.5.5 0 0 1-.5.5H15v-5H9v5H4.5a.5.5 0 0 1-.5-.5V11Z" />
    </svg>
  );
}

function MapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 6.5 9 4.5l6 2 6-2v13l-6 2-6-2-6 2V6.5Zm6-1.3v13m6-11v13" />
    </svg>
  );
}

function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 6.5h14v10H8.7L5 19.5v-13Z" />
    </svg>
  );
}

function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 4 8 4-8 4-8-4 8-4Zm-6 8 6 3 6-3m-12 4 6 3 6-3" />
    </svg>
  );
}

function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19h16M7 16V9m5 7V5m5 11v-4" />
    </svg>
  );
}

function GearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4.5v1.6m0 11.8v1.6m7.5-7.5h-1.6m-11.8 0H4.5m12.8-5.3-1.1 1.1M8.3 15.7 7.2 16.8m0-9.6 1.1 1.1m7.4 7.4 1.1 1.1" />
    </svg>
  );
}

function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v1.6M12 19.4V21M4.2 4.2l1.1 1.1M18.7 18.7l1.1 1.1M3 12h1.6M19.4 12H21M4.2 19.8l1.1-1.1M18.7 5.3l1.1-1.1" />
    </svg>
  );
}

function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 14.5A7.5 7.5 0 1 1 9.5 4 6.2 6.2 0 0 0 20 14.5Z" />
    </svg>
  );
}

function formatStage(stage?: string | null): string {
  if (!stage) return "";
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function StudySidebar({ studyContext }: { studyContext?: StudySidebarContext }) {
  const pathname = usePathname();
  const { data, logout, appTheme, setAppTheme } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const menuFirstRef = useRef<HTMLAnchorElement>(null);
  const user = data.user;
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const onChat = pathname.startsWith("/chat");
  const contextLabel = studyContext?.conceptName
    ? [
        studyContext.conceptName,
        studyContext.stage ? formatStage(studyContext.stage) : null,
        studyContext.proficiencyPct != null ? `${studyContext.proficiencyPct}%` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (profileOpen) {
      menuFirstRef.current?.focus();
    } else {
      profileButtonRef.current?.blur();
    }
  }, [profileOpen]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-3">
      <div className="pointer-events-auto relative flex h-12 w-[min(72rem,calc(100%-1.5rem))] items-center justify-between gap-2 overflow-visible rounded-full px-2">
        <NavLiquidGlass />
        <nav className="relative z-10 flex min-w-0 items-center gap-0.5 overflow-x-auto" aria-label="Primary">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`group flex h-11 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold tracking-wide transition-[color,background-color,gap] duration-300 ${
                  active
                    ? "gap-2 bg-accent-soft text-accent"
                    : "gap-2 text-muted hover:bg-hover hover:text-ink max-xl:gap-0 max-xl:hover:gap-2"
                } focus-visible:gap-2`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span
                  className={`grid overflow-hidden transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    active
                      ? "grid-cols-[1fr]"
                      : "grid-cols-[1fr] max-xl:grid-cols-[0fr] max-xl:group-hover:grid-cols-[1fr] max-xl:group-focus-visible:grid-cols-[1fr]"
                  }`}
                >
                  <span className="min-w-0 overflow-hidden whitespace-nowrap">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setAppTheme(appTheme === "dark" ? "light" : "dark")}
            title={appTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={appTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-hover cursor-pointer"
          >
            {appTheme === "dark" ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </button>

          <div className="relative" ref={profileRef}>
            <button
              ref={profileButtonRef}
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-[10px] font-bold tracking-wide text-accent-on cursor-pointer"
            >
              {initials || "U"}
            </button>
            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+10px)] w-52 overflow-hidden rounded-2xl border border-line bg-surface py-1.5 shadow-[var(--shadow-card)]"
              >
                <div className="px-3 py-2">
                  <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
                  <p className="truncate text-[11px] text-muted">{user.email}</p>
                </div>
                <Link
                  ref={menuFirstRef}
                  href="/settings"
                  role="menuitem"
                  onClick={() => setProfileOpen(false)}
                  className="block px-3 py-2.5 text-xs font-medium text-ink-2 hover:bg-hover"
                >
                  Profile & settings
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void logout()}
                  className="block w-full px-3 py-2.5 text-left text-xs font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {onChat && contextLabel ? (
        <div
          className="app-nav-context pointer-events-auto max-w-[min(64rem,100%)] truncate rounded-full px-3 py-1.5 text-[11px] font-medium"
          title={contextLabel}
        >
          {contextLabel}
          {studyContext?.slideProgress
            ? ` · slide ${studyContext.slideProgress.current}/${studyContext.slideProgress.total}`
            : ""}
        </div>
      ) : null}
    </header>
  );
}
