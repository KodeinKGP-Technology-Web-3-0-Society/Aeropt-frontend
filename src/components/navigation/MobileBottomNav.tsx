"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  );
}

function HomeIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <path d="m4 11 8-7 8 7v8.5a.5.5 0 0 1-.5.5H15v-5H9v5H4.5a.5.5 0 0 1-.5-.5V11Z" />
    </Svg>
  );
}

function StudyIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <path d="M12 6.5C10.5 5.3 8.4 4.75 5 4.75v12.5c3.4 0 5.5.55 7 1.75 1.5-1.2 3.6-1.75 7-1.75V4.75c-3.4 0-5.5.55-7 1.75Z" />
      <path d="M12 6.5V19" />
    </Svg>
  );
}

function ChatIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <path d="M5.5 6.5h13a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H11l-4 3v-3H5.5A1.5 1.5 0 0 1 4 15V8a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M8.5 10.5h7M8.5 13h4.5" />
    </Svg>
  );
}

function DoubtIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.6a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 16.8h.01" />
    </Svg>
  );
}

function ProgressIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <path d="M5 19V13M10 19V9M15 19v-4M20 19V6" />
    </Svg>
  );
}

interface NavItem {
  label: string;
  href: string;
  icon: (p: SVGProps<SVGSVGElement>) => React.JSX.Element;
  also?: string[];
}

const ITEMS: NavItem[] = [
  { label: "Home", href: "/home", icon: HomeIcon, also: ["/dashboard"] },
  { label: "Study", href: "/study", icon: StudyIcon, also: ["/lesson", "/assess"] },
  { label: "Chat", href: "/chat", icon: ChatIcon },
  { label: "Doubt", href: "/doubt", icon: DoubtIcon },
  { label: "Progress", href: "/progress", icon: ProgressIcon, also: ["/plan", "/readiness", "/calendar"] },
];

function isItemActive(item: NavItem, pathname: string): boolean {
  return [item.href, ...(item.also ?? [])].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`),
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-lg supports-[backdrop-filter]:bg-surface/85 md:hidden pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
    >
      <div className="mx-auto flex h-14 max-w-md items-center justify-around px-2">
        {ITEMS.map((item) => {
          const active = isItemActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
                active ? "text-accent" : "text-muted hover:text-ink"
              }`}
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-all duration-150 ${
                  active ? "bg-accent-soft scale-105" : "group-hover:bg-hover"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform ${
                    active ? "stroke-[2.2] text-accent" : "stroke-[1.8]"
                  }`}
                />
              </span>
              <span
                className={`mt-0.5 text-[10px] tracking-tight ${
                  active ? "font-semibold text-accent" : "font-medium text-ink-2"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
