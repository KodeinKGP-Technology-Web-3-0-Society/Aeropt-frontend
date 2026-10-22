"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRIMARY_NAV_ITEMS, isRouteActive } from "./navItems";

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-lg supports-[backdrop-filter]:bg-surface/85 md:hidden pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]"
    >
      <div className="mx-auto flex h-14 max-w-md items-center justify-around px-2">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const active = isRouteActive(item, pathname);
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
