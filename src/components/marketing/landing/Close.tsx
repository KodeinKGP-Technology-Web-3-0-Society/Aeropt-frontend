/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import JeePathLogo from "@/components/JeePathLogo";

export default function Close() {
  return (
    <>
      {/* <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl items-stretch lg:grid-cols-2">
          <img
            src="/landing/books.jpg"
            alt="A stack of worn textbooks."
            width={1600}
            height={1064}
            loading="lazy"
            className="h-64 w-full object-cover object-left transition-[filter] dark:brightness-75 dark:contrast-110 sm:h-80 lg:h-full lg:min-h-[440px]"
          />
          <div data-reveal className="relative flex flex-col justify-center overflow-hidden px-5 py-16 sm:px-12 lg:py-20">
            <div className="landing-mesh" aria-hidden="true">
              <i className="-right-16 -top-16 h-64 w-64 bg-chemistry" />
              <i className="-bottom-20 left-0 h-64 w-64 bg-physics" style={{ animationDelay: "-8s" }} />
            </div>
            <h2 className="relative font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl">
              Start with the chapter you keep putting off.
            </h2>
            <p className="relative mt-4 max-w-md text-lg leading-relaxed text-ink-2">
              It takes a minute to set up. Your first lesson starts right after.
            </p>
            <div className="relative mt-8">
              <Link
                href="/auth?tab=signup"
                className="landing-btn inline-flex min-h-12 items-center rounded-xl bg-accent px-7 text-sm font-semibold text-accent-on shadow-[var(--shadow-card)] transition-colors hover:bg-accent-hover"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 text-sm text-muted sm:flex-row sm:items-center">
          <JeePathLogo size={22} textClassName="text-base" />
          <p>JEE Physics, Chemistry and Mathematics. Photograph via Unsplash.</p>
          <div className="flex gap-2">
            <Link href="/auth" className="inline-flex min-h-11 items-center px-2 hover:text-ink">Log in</Link>
            <Link href="/auth?tab=signup" className="inline-flex min-h-11 items-center px-2 hover:text-ink">Sign up</Link>
          </div>
        </div>
      </footer> */}
    </>
  );
}
