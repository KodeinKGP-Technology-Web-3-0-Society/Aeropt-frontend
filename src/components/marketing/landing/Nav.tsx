import Link from "next/link";
import JeePathLogo from "@/components/JeePathLogo";

export default function Nav() {
  return (
    <header data-nav data-scrolled="false" className="fixed inset-x-0 top-0 z-50 border-b border-transparent bg-surface/0 transition-all duration-300 data-[scrolled=true]:border-line data-[scrolled=true]:bg-surface/95 data-[scrolled=true]:backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex min-h-11 items-center" aria-label="JeePath home">
          <JeePathLogo size={28} textClassName="text-lg" domain />
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium" aria-label="Main">
          <a href="#study-studio" className="hidden min-h-11 items-center rounded-lg px-3 text-ink-2 transition-colors hover:text-ink md:inline-flex">Study Studio</a>
          <a href="#syllabus" className="hidden min-h-11 items-center rounded-lg px-3 text-ink-2 transition-colors hover:text-ink md:inline-flex">Syllabus</a>
          <a href="#how-it-works" className="hidden min-h-11 items-center rounded-lg px-3 text-ink-2 transition-colors hover:text-ink md:inline-flex">How it works</a>
          <Link href="/auth" className="inline-flex min-h-11 items-center rounded-lg px-3 text-ink-2 transition-colors hover:text-ink">Log in</Link>
          <Link href="/auth?tab=signup" className="landing-btn ml-1 inline-flex min-h-11 items-center rounded-xl bg-accent px-4 font-semibold text-accent-on transition-colors hover:bg-accent-hover">
            Start free
          </Link>
        </nav>
      </div>
    </header>
  );
}
