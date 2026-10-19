"use client";

import Link from "next/link";
import ChatReplyMock from "./ChatReplyMock";
import { HeroScene } from "./Illustrations";

const TRUST = [
  "Answers come from NCERT, H.C. Verma and official JEE papers",
  "Every reply is checked before you see it",
  "Physics, Chemistry and Mathematics for JEE Main and Advanced",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-28 sm:px-8 lg:pb-24 lg:pt-36">
      <div className="altitude-field" />
      {/* Colour comes from the subject palette, not from decoration for its own sake. */}
      <div className="landing-mesh" aria-hidden="true">
        <i className="-left-24 top-10 h-80 w-80 bg-physics" />
        <i className="right-0 top-0 h-96 w-96 bg-chemistry" style={{ animationDelay: "-6s" }} />
        <i className="bottom-0 left-1/3 h-72 w-72 bg-maths" style={{ animationDelay: "-12s" }} />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.02fr_1fr] lg:gap-8">
        <div data-hero className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1.5 text-xs font-semibold text-ink-2 backdrop-blur-sm">
            <span className="flex gap-1" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-physics" />
              <span className="h-2 w-2 rounded-full bg-chemistry" />
              <span className="h-2 w-2 rounded-full bg-maths" />
            </span>
            Your 1:1 tutor for JEE Physics, Chemistry and Maths
          </span>

          <h1 className="mt-6 font-display text-[2.6rem] font-semibold leading-[1.03] tracking-[-0.03em] text-ink sm:text-[3.3rem] lg:text-[3.7rem]">
            <span className="landing-text-reveal block" style={{ animationDelay: "0.1s" }}>
              Stuck on a JEE problem at 11&nbsp;pm?
            </span>
            <span className="landing-text-reveal block text-accent" style={{ animationDelay: "0.25s" }}>
              Ask. Understand. Move on.
            </span>
          </h1>

          <p className="landing-text-reveal mt-6 max-w-lg text-lg leading-relaxed text-ink-2" style={{ animationDelay: "0.4s" }}>
            JeePath explains any doubt step by step, draws the diagram, then gives you real JEE
            questions on that exact topic. It remembers what you got wrong and brings it back
            before you forget it.
          </p>

          <div className="landing-text-reveal mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.55s" }}>
            <Link
              href="/auth?tab=signup"
              className="landing-btn group inline-flex min-h-12 items-center gap-2 rounded-xl bg-accent px-7 text-sm font-semibold text-accent-on shadow-[var(--shadow-card)] transition-colors hover:bg-accent-hover"
            >
              Start free
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <a
              href="#study-studio"
              className="landing-btn inline-flex min-h-12 items-center gap-2 rounded-xl border border-line-strong bg-surface/70 px-6 text-sm font-semibold text-ink backdrop-blur-sm transition-colors hover:bg-hover"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              See a lesson
            </a>
          </div>

          <ul className="landing-text-reveal mt-9 flex flex-col gap-2.5 text-sm text-ink-2" style={{ animationDelay: "0.7s" }}>
            {TRUST.map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div data-hero-mock className="landing-text-reveal relative mx-auto w-full max-w-xl" style={{ animationDelay: "0.5s" }}>
          <HeroScene className="pointer-events-none absolute -inset-x-6 -bottom-10 -top-10 h-[calc(100%+5rem)] w-[calc(100%+3rem)] opacity-95" />
          <div className="relative rounded-3xl border border-line bg-surface/90 p-2 shadow-[var(--shadow-card)] backdrop-blur-md">
            <ChatReplyMock />
          </div>
          <div className="landing-float absolute -left-3 top-8 hidden items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-[var(--shadow-card)] sm:flex">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success/15 text-success" aria-hidden="true">✓</span>
            Checked before sending
          </div>
          <div className="landing-float-slow absolute -right-2 bottom-16 hidden items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-[var(--shadow-card)] sm:flex">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-physics/15 text-physics" aria-hidden="true">◇</span>
            Diagram drawn for you
          </div>
        </div>
      </div>
    </section>
  );
}
