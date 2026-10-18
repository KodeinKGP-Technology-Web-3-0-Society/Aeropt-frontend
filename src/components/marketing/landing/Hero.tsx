"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import ChatReplyMock from "./ChatReplyMock";

const FORMULAS = [
  { tex: "F = ma", x: "8%", y: "18%", delay: 0, subject: "physics" },
  { tex: "E = mc²", x: "85%", y: "12%", delay: 0.6, subject: "physics" },
  { tex: "PV = nRT", x: "78%", y: "72%", delay: 1.2, subject: "chemistry" },
  { tex: "∫ x² dx = x³/3", x: "5%", y: "68%", delay: 0.3, subject: "maths" },
  { tex: "ΔG = ΔH − TΔS", x: "88%", y: "42%", delay: 0.9, subject: "chemistry" },
  { tex: "sin²θ + cos²θ = 1", x: "12%", y: "44%", delay: 1.5, subject: "maths" },
];

function FloatingFormula({
  tex,
  x,
  y,
  delay,
  subject,
}: {
  tex: string;
  x: string;
  y: string;
  delay: number;
  subject: string;
}) {
  return (
    <span
      className="landing-formula pointer-events-none absolute select-none whitespace-nowrap rounded-full border border-line/60 bg-surface/70 px-3 py-1.5 font-mono text-[11px] backdrop-blur-sm"
      style={{
        left: x,
        top: y,
        animationDelay: `${delay}s`,
        color: `var(--${subject})`,
      }}
      aria-hidden="true"
    >
      {tex}
    </span>
  );
}

const SUBJECTS = [
  { name: "Physics", color: "var(--physics)" },
  { name: "Chemistry", color: "var(--chemistry)" },
  { name: "Mathematics", color: "var(--maths)" },
];

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const el = heroRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };
    el.addEventListener("mousemove", onMove, { passive: true });
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden px-5 pb-20 pt-28 sm:px-8 lg:pb-28 lg:pt-36"
    >
      {/* Altitude contour-line field background */}
      <div className="altitude-field" />

      {/* Floating formula pills — parallax on mouse */}
      <div
        className="absolute inset-0 hidden lg:block"
        style={{
          transform: `translate(${(mousePos.x - 0.5) * -8}px, ${(mousePos.y - 0.5) * -8}px)`,
          transition: "transform 600ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
        aria-hidden="true"
      >
        {FORMULAS.map((f) => (
          <FloatingFormula key={f.tex} {...f} />
        ))}
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center text-center">
        <div data-hero className="flex flex-col items-center">
          {/* Subject badges */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {SUBJECTS.map((s) => (
              <span
                key={s.name}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-semibold backdrop-blur-sm"
                style={{ color: s.color }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
              </span>
            ))}
          </div>

          <h1 className="font-display text-[2.6rem] font-semibold leading-[1.02] tracking-[-0.03em] text-ink sm:text-[3.4rem] lg:text-[3.75rem]">
            <span className="landing-text-reveal" style={{ animationDelay: "0.1s" }}>
              A JEE tutor that explains
            </span>
            <br />
            <span className="landing-text-reveal" style={{ animationDelay: "0.25s" }}>
              it until it{" "}
              <span className="text-accent">clicks.</span>
            </span>
          </h1>

          <p className="landing-text-reveal mt-6 max-w-lg text-lg leading-relaxed text-ink-2" style={{ animationDelay: "0.4s" }}>
            Physics, Chemistry, and Mathematics — one topic at a time. Ask any
            doubt and get a clear, step-by-step answer with a diagram. Practise
            real JEE questions and see what to study next.
          </p>

          <div className="landing-text-reveal mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.55s" }}>
            <Link
              href="/auth?tab=signup"
              className="landing-btn group relative inline-flex min-h-12 items-center gap-2 overflow-hidden rounded-xl bg-accent px-7 text-sm font-semibold text-accent-on transition-colors hover:bg-accent-hover"
            >
              <span className="relative z-10">Start free</span>
              <svg
                className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 16 16"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
            <a
              href="#what-you-get"
              className="landing-btn inline-flex min-h-12 items-center rounded-xl border border-line px-6 text-sm font-semibold text-ink transition-colors hover:bg-hover"
            >
              See how it works
            </a>
          </div>
        </div>

        <div data-hero-mock className="landing-text-reveal mt-12 w-full max-w-2xl" style={{ animationDelay: "0.7s" }}>
          <ChatReplyMock />
        </div>
      </div>
    </section>
  );
}
