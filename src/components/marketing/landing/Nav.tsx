import Link from "next/link";
import JeePathLogo from "@/components/JeePathLogo";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "#what-you-get", label: "Features" },
  { href: "#study-studio", label: "Study Studio" },
  { href: "#syllabus", label: "Syllabus" },
  { href: "#faq", label: "FAQ" },
];

export default function Nav() {
  return (
    <header data-nav data-scrolled="false" className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-surface/0 transition-all duration-300 data-[scrolled=true]:border-line data-[scrolled=true]:bg-surface/85 data-[scrolled=true]:backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex min-h-11 items-center" aria-label="JeePath home">
          <JeePathLogo size={28} textClassName="text-lg" domain />
        </Link>
        <nav className="flex items-center gap-0.5 text-sm font-medium" aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hidden min-h-11 items-center rounded-lg px-3 text-ink-2 transition-colors hover:text-ink lg:inline-flex">
              {l.label}
            </a>
          ))}
          <ThemeToggle />
          <Link href="/auth" className="inline-flex min-h-11 items-center rounded-lg px-3 text-ink-2 transition-colors hover:text-ink">Log in</Link>
          <Link href="/auth?tab=signup" className="landing-btn ml-1 inline-flex min-h-11 items-center rounded-xl bg-accent px-4 font-semibold text-accent-on shadow-xs transition-colors hover:bg-accent-hover">
            Start free
          </Link>
        </nav>
      </div>
    </header>
  );
}
