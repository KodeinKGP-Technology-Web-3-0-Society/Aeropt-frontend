import type { ComponentType, SVGProps } from "react";

export type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  also?: string[];
  hint?: string;
};

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

export function HomeIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <path d="m4 11 8-7 8 7v8.5a.5.5 0 0 1-.5.5H15v-5H9v5H4.5a.5.5 0 0 1-.5-.5V11Z" />
    </Svg>
  );
}

export function StudyIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <path d="M12 6.5C10.5 5.3 8.4 4.75 5 4.75v12.5c3.4 0 5.5.55 7 1.75 1.5-1.2 3.6-1.75 7-1.75V4.75c-3.4 0-5.5.55-7 1.75Z" />
      <path d="M12 6.5V19" />
    </Svg>
  );
}

export function ChatIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <path d="M5.5 6.5h13a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5H11l-4 3v-3H5.5A1.5 1.5 0 0 1 4 15V8a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M8.5 10.5h7M8.5 13h4.5" />
    </Svg>
  );
}

export function PlanIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <path d="M8 5h10.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H8a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M9.5 9.5h7M9.5 13h7M9.5 16.5h4.5" />
    </Svg>
  );
}

export function ProgressIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <path d="M5 19V13M10 19V9M15 19v-4M20 19V6" />
    </Svg>
  );
}

export function DoubtIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.6a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6M12 16.8h.01" />
    </Svg>
  );
}

export function ReadinessIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <path d="M5 19V9.5L12 5l7 4.5V19" />
      <path d="M9.5 19v-5h5v5" />
    </Svg>
  );
}

export function GearIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...p}>
      <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
      <path d="M19.4 13.3a1.4 1.4 0 0 0 .3 1.5l.1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.4 1.4 0 0 0-1.5-.3 1.4 1.4 0 0 0-.9 1.3v.2a1.7 1.7 0 0 1-3.4 0v-.1a1.4 1.4 0 0 0-.9-1.3 1.4 1.4 0 0 0-1.5.3l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.4 1.4 0 0 0 .3-1.5 1.4 1.4 0 0 0-1.3-.9h-.2a1.7 1.7 0 0 1 0-3.4h.1a1.4 1.4 0 0 0 1.3-.9 1.4 1.4 0 0 0-.3-1.5l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.4 1.4 0 0 0 1.5.3h.1a1.4 1.4 0 0 0 .8-1.3v-.2a1.7 1.7 0 0 1 3.4 0v.1a1.4 1.4 0 0 0 .8 1.3 1.4 1.4 0 0 0 1.5-.3l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.4 1.4 0 0 0-.3 1.5v.1a1.4 1.4 0 0 0 1.3.8h.2a1.7 1.7 0 0 1 0 3.4h-.1a1.4 1.4 0 0 0-1.3.9Z" />
    </Svg>
  );
}

// Five primary destinations, mirrored identically in web header and app bottom nav
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/home", icon: HomeIcon, also: ["/dashboard"] },
  { label: "Study", href: "/study", icon: StudyIcon, also: ["/study/room"] },
  { label: "Chat", href: "/chat", icon: ChatIcon, also: ["/chat/session"], hint: "Ask the tutor anything, any time" },
  { label: "Plan", href: "/plan", icon: PlanIcon, also: ["/lesson", "/assess", "/calendar"] },
  { label: "Progress", href: "/progress", icon: ProgressIcon, also: ["/readiness"] },
];

// Secondary items living in the account menu/sheet
export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "Doubt solver", href: "/doubt", icon: DoubtIcon, hint: "One question, with your working checked" },
  { label: "Exam readiness", href: "/readiness", icon: ReadinessIcon },
  { label: "Settings", href: "/settings", icon: GearIcon },
];

export function isRouteActive(item: NavItem, pathname: string): boolean {
  return [item.href, ...(item.also ?? [])].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}?`)
  );
}
