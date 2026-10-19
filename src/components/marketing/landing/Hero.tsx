"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import ChatReplyMock from "./ChatReplyMock";

interface FormulaItem {
  tex: string;
  name: string;
  x: string;
  y: string;
  delay: number;
  subject: "physics" | "chemistry" | "maths";
  animClass: string;
  depth: number;
}

const FORMULAS: FormulaItem[] = [
  // Physics
  { tex: "F = ma", name: "Newton's Second Law", x: "7%", y: "16%", delay: 0, subject: "physics", animClass: "landing-formula-anim-1", depth: 14 },
  { tex: "E = mc²", name: "Mass-Energy Equivalence", x: "86%", y: "14%", delay: 0.4, subject: "physics", animClass: "landing-formula-anim-2", depth: 18 },
  { tex: "\\vec{\\tau} = \\vec{r} \\times \\vec{F}", name: "Torque Vector Cross Product", x: "4%", y: "48%", delay: 0.8, subject: "physics", animClass: "landing-formula-anim-3", depth: 10 },
  { tex: "K_{\\text{max}} = h\\nu - \\Phi", name: "Photoelectric Equation", x: "82%", y: "58%", delay: 1.2, subject: "physics", animClass: "landing-formula-anim-1", depth: 16 },
  
  // Chemistry
  { tex: "PV = nRT", name: "Ideal Gas State Equation", x: "76%", y: "76%", delay: 0.6, subject: "chemistry", animClass: "landing-formula-anim-2", depth: 12 },
  { tex: "\\Delta G^\\circ = -RT \\ln K", name: "Gibbs Free Energy & Equilibrium", x: "89%", y: "36%", delay: 1.0, subject: "chemistry", animClass: "landing-formula-anim-3", depth: 20 },
  { tex: "pH = -\\log[H^+]", name: "Sørensen pH Scale", x: "14%", y: "82%", delay: 1.4, subject: "chemistry", animClass: "landing-formula-anim-1", depth: 15 },
  { tex: "\\Delta H = \\Delta U + \\Delta n_g RT", name: "Reaction Enthalpy Relation", x: "71%", y: "26%", delay: 0.7, subject: "chemistry", animClass: "landing-formula-anim-2", depth: 11 },

  // Mathematics
  { tex: "\\int x^n dx = \\frac{x^{n+1}}{n+1}", name: "Fundamental Integral Power Rule", x: "6%", y: "66%", delay: 0.3, subject: "maths", animClass: "landing-formula-anim-2", depth: 16 },
  { tex: "\\sin^2\\theta + \\cos^2\\theta = 1", name: "Pythagorean Trigonometric Identity", x: "13%", y: "32%", delay: 1.1, subject: "maths", animClass: "landing-formula-anim-3", depth: 9 },
  { tex: "e^{i\\pi} + 1 = 0", name: "Euler's Beauty Identity", x: "24%", y: "18%", delay: 0.5, subject: "maths", animClass: "landing-formula-anim-1", depth: 13 },
  { tex: "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1", name: "Fundamental Squeeze Limit", x: "84%", y: "88%", delay: 1.3, subject: "maths", animClass: "landing-formula-anim-2", depth: 17 },
];

function FloatingFormula({
  item,
  mouseX,
  mouseY,
}: {
  item: FormulaItem;
  mouseX: number;
  mouseY: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const offsetX = (mouseX - 0.5) * -item.depth;
  const offsetY = (mouseY - 0.5) * -item.depth;

  return (
    <div
      className={`landing-formula group absolute z-10 cursor-pointer ${item.animClass}`}
      style={{
        left: item.x,
        top: item.y,
        animationDelay: `${item.delay}s`,
        transform: `translate3d(${offsetX}px, ${offsetY}px, 0)`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${item.name}: ${item.tex}`}
    >
      <div
        className="flex items-center gap-1.5 rounded-full border border-line/70 bg-surface/85 px-3 py-1.5 font-mono text-xs backdrop-blur-md shadow-xs transition-all duration-300 hover:border-line-strong hover:bg-surface"
        style={{
          color: `var(--${item.subject})`,
          boxShadow: isHovered ? `0 8px 24px -4px var(--${item.subject})` : undefined,
        }}
      >
        <span className="font-bold">{item.tex}</span>
      </div>

      {/* Concept Tooltip on hover */}
      <div
        className={`pointer-events-none absolute left-1/2 -top-8 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2.5 py-1 text-[10px] font-semibold text-surface shadow-md transition-all duration-200 ${
          isHovered ? "opacity-100 -translate-y-1" : "opacity-0 translate-y-1"
        }`}
      >
        <span>{item.name}</span>
        <span className="ml-1.5 uppercase tracking-wider text-muted font-mono text-[9px]">
          {item.subject}
        </span>
      </div>
    </div>
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

      {/* Floating formula pills — multi-axis interactive parallax on mouse */}
      <div className="absolute inset-0 hidden md:block pointer-events-auto" aria-hidden="false">
        {FORMULAS.map((f) => (
          <FloatingFormula
            key={f.tex}
            item={f}
            mouseX={mousePos.x}
            mouseY={mousePos.y}
          />
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
