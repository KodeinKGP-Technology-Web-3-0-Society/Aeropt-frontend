"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";

type SidebarUser = {
  name: string;
  badge: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { label: "Study Session", href: "/chat", icon: ChatIcon },
  { label: "Practice", href: "/pratice", icon: LayersIcon },
  { label: "Progress", href: "/progress", icon: ChartIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

const fallbackUser: SidebarUser = {
  name: "Arjun Mehta",
  badge: "JEE Advanced",
};

function BrandIcon() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#6258ff] text-white shadow-[0_0_18px_rgba(98,88,255,0.35)]">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
        <path
          d="M7 13.8a2.8 2.8 0 1 0 2.65 1.9h4.7A2.8 2.8 0 1 0 17 12.1V9.65A2.8 2.8 0 1 0 14.35 6H9.65A2.8 2.8 0 1 0 7 9.65v4.15Zm3-6.3h4m1.5 1.55v3.9m-6.2 3.25h5.4M7 9.65v4.15"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    </span>
  );
}

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path d="m4 11 8-7 8 7v8.5a.5.5 0 0 1-.5.5H15v-5H9v5H4.5a.5.5 0 0 1-.5-.5V11Z" />
    </svg>
  );
}

function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path d="M5 6.5h14v10H8.7L5 19.5v-13Z" />
    </svg>
  );
}

function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path d="m12 4 8 4-8 4-8-4 8-4Zm-6 8 6 3 6-3m-12 4 6 3 6-3" />
    </svg>
  );
}

function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path d="M4 19h16M7 16V9m5 7V5m5 11v-4" />
    </svg>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...props}>
      <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0-4v2m0 11v2m7.5-7.5h-2m-11 0h-2m12.8-5.3-1.4 1.4m-7.8 7.8-1.4 1.4m0-10.6 1.4 1.4m7.8 7.8 1.4 1.4" />
    </svg>
  );
}

function SidebarUserCard({ user }: { user: SidebarUser }) {
  return (
    <div className="flex items-center gap-2.5 px-1 pb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#58d36f] to-[#1c6f32]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#0b3317]" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-white">{user.name}</p>
        <p className="mt-1 inline-flex rounded border border-[#3d3d91] bg-[#11113a] px-2 py-0.5 text-[9px] font-medium text-[#8584ff]">
          {user.badge}
        </p>
      </div>
    </div>
  );
}

export default function StudySidebar({ user = fallbackUser }: { user?: SidebarUser }) {
  const pathname = usePathname();

  return (
    <aside className="study-sidebar flex min-h-screen w-[204px] flex-col px-3 py-5 text-slate-100">
      <div className="mb-8 flex items-center gap-2 px-1">
        <BrandIcon />
        <span className="text-base font-semibold tracking-normal text-white">Prepwise</span>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`sidebar-item ${pathname === item.href ? "sidebar-item-active" : ""}`}
          >
            <item.icon className="h-[15px] w-[15px]" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <SidebarUserCard user={user} />
      </div>
    </aside>
  );
}
