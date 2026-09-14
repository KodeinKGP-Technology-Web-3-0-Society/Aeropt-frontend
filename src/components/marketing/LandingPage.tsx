"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useApp } from "@/components/AppContext";
import PrepwiseLogo from "@/components/PrepwiseLogo";
import MarkdownMath from "@/components/MarkdownMath";
import Reveal from "@/components/marketing/Reveal";
import ScrollProgress from "@/components/marketing/ScrollProgress";
import CompareRow from "@/components/marketing/CompareRow";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  );
}

function IconGrounded() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5V6a2 2 0 0 1 2-2h11a1 1 0 0 1 1 1v13" />
      <path d="M6.5 19.5H18a1 1 0 0 0 1-1V17H7a1.5 1.5 0 0 0 0 3z" />
      <path d="M8 7h6M8 10h6" />
    </svg>
  );
}
function IconAdaptive() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3.2M12 17.8V21M4.9 4.9l2.3 2.3M16.8 16.8l2.3 2.3M3 12h3.2M17.8 12H21M4.9 19.1l2.3-2.3M16.8 7.2l2.3-2.3" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}
function IconPractice() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11.5l2 2 4-4.2" />
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  );
}
function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-7M20 20H4" />
    </svg>
  );
}

const COMPARISONS = [
  { usual: "Same explanation for every student who asks", prepwise: "Reads your last few attempts before deciding how to teach this one" },
  { usual: "Answers the exact question you typed", prepwise: "Finds the shaky prerequisite behind it and teaches that first, if that's the real problem" },
  { usual: "A general chatbot with a JEE prompt bolted on", prepwise: "A retrieval pipeline built specifically around the JEE Physics syllabus" },
  { usual: "Forgets everything the moment you close the tab", prepwise: "Opens your next session already knowing what you struggled with last time" },
  { usual: "Sounds equally confident whether it's right or not", prepwise: "Tells you plainly when a question is outside what it covers" },
];

const FEATURES = [
  {
    icon: IconAdaptive,
    title: "Two ways to teach, chosen for you",
    body: "Solid prerequisites but shaky on this topic? It asks a guiding question and lets you reason there yourself. Starting from zero? It explains from first principles instead. Your last few attempts decide which — not a setting you manage.",
  },
  {
    icon: IconPractice,
    title: "Practice that grades itself",
    body: "Answer, tap Correct or Incorrect, and your proficiency score updates immediately — weighted so a mistake costs more than a lucky guess earns. Three wrong in a row quietly drops in a short quiz on the actual gap before you move on.",
  },
  {
    icon: IconDashboard,
    title: "One dashboard, the real picture",
    body: "A live proficiency score per concept, a streak that reflects actual study days, and a concept map that shows exactly which chapters are solid and which are still soft.",
  },
  {
    icon: IconGrounded,
    title: "Built for one exam, done properly",
    body: "Prepwise covers JEE Physics — Mechanics through Modern Physics — in real depth, rather than spreading thin across every subject at once.",
  },
];

export default function LandingPage() {
  const { appTheme, setAppTheme } = useApp();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const altitudeFieldRef = useRef<HTMLDivElement | null>(null);

  // Subtle parallax on the hero's contour-line field — genuinely tied to
  // scroll position, not a one-shot reveal. Capped and slow (0.08x) so it
  // reads as depth, not motion sickness; transform only, mutated directly on
  // the node (no React state per scroll tick, no CSS-variable-on-parent
  // recalculation).
  useEffect(() => {
    const scroller = scrollRef.current;
    const field = altitudeFieldRef.current;
    if (!scroller || !field) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let ticking = false;
    const update = () => {
      ticking = false;
      const y = Math.min(scroller.scrollTop * 0.08, 48);
      field.style.transform = `translateY(${y}px)`;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={scrollRef} className="relative h-screen overflow-y-auto bg-canvas font-sans">
      <ScrollProgress scrollRef={scrollRef} />
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-2.5">
          <PrepwiseLogo size={36} />
          <span className="font-display text-lg font-bold tracking-tight text-ink">Prepwise</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAppTheme(appTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="landing-btn flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:bg-hover"
          >
            {appTheme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <Link
            href="/auth"
            className="landing-btn hidden rounded-full px-4 py-2 text-sm font-medium text-ink-2 hover:text-ink sm:inline-block"
          >
            Log in
          </Link>
          <Link
            href="/auth?tab=signup"
            className="landing-btn inline-flex items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-on hover:bg-accent-hover"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div ref={altitudeFieldRef} className="altitude-field" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="hero-enter">
            <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              JEE Physics · Main &amp; Advanced
            </p>
            <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Knows where you&apos;re stuck<br />before you do.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-2">
              Prepwise reads your last few attempts before it answers your next question. If the real
              gap is a shaky prerequisite three chapters back, that&apos;s what gets taught first —
              not just the topic you happened to ask about.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/auth?tab=signup"
                className="landing-btn inline-flex min-h-12 items-center rounded-full bg-accent px-7 text-[15px] font-semibold text-accent-on hover:bg-accent-hover"
              >
                Start studying free
              </Link>
              <Link href="/auth" className="landing-btn text-[15px] font-semibold text-ink-2 hover:text-ink">
                Log in →
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">No credit card. Built for one exam, not fifty.</p>
          </div>

          <Reveal delay={120} className="lg:justify-self-end">
            <div className="w-full max-w-md rounded-[22px] border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
              <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                Study Session
              </p>
              <div className="mb-3 ml-auto w-fit max-w-[80%] rounded-lg border border-line bg-hover px-4 py-2.5 text-sm text-ink">
                Explain projectile motion
              </div>
              <div className="w-full max-w-[92%] rounded-lg border border-line bg-canvas px-4 py-3 text-sm leading-relaxed text-ink">
                <p className="mb-1">
                  Split the motion into two independent parts — horizontal at constant velocity,
                  vertical under gravity. The range works out to:
                </p>
                <MarkdownMath content={"$$R = \\dfrac{v^2\\sin(2\\theta)}{g}$$"} className="markdown-math text-sm" />
              </div>
              <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-muted">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                Grounded in your syllabus, not a guess
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Honesty callout ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <Reveal as="div" className="grid gap-10 border-t border-line pt-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              It tells you when it doesn&apos;t know.
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink-2">
              Most tutoring bots answer everything with the same confidence, whether or not it&apos;s
              actually right. Ask Prepwise something outside the syllabus it covers, and it says so
              plainly — instead of inventing an answer that sounds correct.
            </p>
          </div>
          <div className="rounded-[18px] border border-line bg-surface p-5">
            <div className="mb-3 ml-auto w-fit max-w-[85%] rounded-lg border border-line bg-hover px-4 py-2.5 text-sm text-ink">
              What&apos;s the boiling point of methanol?
            </div>
            <div className="w-full max-w-[92%] rounded-lg border border-line bg-canvas px-4 py-3 text-sm leading-relaxed text-ink-2">
              This looks outside what this tutor currently covers — I&apos;m built specifically for
              JEE Physics. Ask me about mechanics, electromagnetism, optics, or modern physics and
              I&apos;ll ground the answer in your syllabus.
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Feature grid ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <Reveal as="h2" className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          How it actually works
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 70} as="article" className="rounded-2xl border border-line bg-surface p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon />
                </div>
                <h3 className="text-base font-semibold text-ink">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{f.body}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── Why switch ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <Reveal as="div">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">Why switch</p>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Not another chatbot with a JEE prompt.
          </h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-0 text-sm font-semibold uppercase tracking-wider text-muted sm:grid-cols-[1fr_1.3fr] sm:gap-8">
          <p>The usual way</p>
          <p className="mt-2 sm:mt-0">Prepwise</p>
        </div>
        <div className="mt-1">
          {COMPARISONS.map((row, i) => (
            <CompareRow key={row.usual} usual={row.usual} prepwise={row.prepwise} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <Reveal as="div" className="rounded-[28px] border border-line bg-surface px-8 py-14 text-center sm:px-14">
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Stop guessing what to study next.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-ink-2">
            Tell Prepwise one thing you&apos;re stuck on. It&apos;ll tell you what&apos;s actually behind it.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth?tab=signup"
              className="landing-btn inline-flex min-h-12 items-center rounded-full bg-accent px-8 text-[15px] font-semibold text-accent-on hover:bg-accent-hover"
            >
              Start studying free
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="mx-auto max-w-6xl px-5 pb-10 pt-4 sm:px-8">
        <div className="flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-sm text-muted sm:flex-row">
          <div className="flex items-center gap-2">
            <PrepwiseLogo size={22} />
            <span>Prepwise</span>
          </div>
          <p>© {new Date().getFullYear()} Prepwise. Built for JEE Physics.</p>
        </div>
      </footer>
    </div>
  );
}
