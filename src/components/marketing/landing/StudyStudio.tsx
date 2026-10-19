"use client";

import { useState } from "react";

interface StudioTab {
  id: string;
  badge: string;
  badgeColor: string;
  tabLabel: string;
  title: string;
  description: string;
  highlights: string[];
}

const TABS: StudioTab[] = [
  {
    id: "lessons",
    badge: "SOCRATIC DIALECTIC",
    badgeColor: "text-accent bg-accent/10 border-accent/20",
    tabLabel: "01 / Socratic Lessons",
    title: "Step-by-step guidance that never spoils the solution",
    description:
      "One physical idea at a time. The tutor diagnoses where your mental model diverges, asks calibrating questions, and lets you experience the eureka moment yourself.",
    highlights: [
      "Breaks multi-step problems into intuitive first-principles",
      "Validates algebraic rearrangements in real-time via SymPy",
      "Adapts pedagogical tone dynamically based on your confidence",
    ],
  },
  {
    id: "practice",
    badge: "INSTANT STEP VERIFICATION",
    badgeColor: "text-success bg-success/10 border-success/20",
    tabLabel: "02 / Instant Practice",
    title: "Immediate verification the millisecond you submit",
    description:
      "No waiting for answer keys. You get granular feedback on your exact step, with dimensional checks and mathematical justification explaining why an answer is right or wrong.",
    highlights: [
      "Real JEE Main & Advanced calibrated question formats",
      "Automated dimensional consistency and arithmetic checks",
      "Step-level hints available if you pause or hesitate",
    ],
  },
  {
    id: "mastery",
    badge: "EPISODIC LEARNING MEMORY",
    badgeColor: "text-warning bg-warning/10 border-warning/20",
    tabLabel: "03 / Retention & Streaks",
    title: "Retention radar that tracks your conceptual gaps",
    description:
      "Every doubt, hesitation, and mistake is captured in episodic learner memory. It calculates forgetting curves so weak topics resurface right before you lose them.",
    highlights: [
      "Decay-weighted mastery scores across all 1,016 syllabus topics",
      "Streak protection with daily focused 25-minute sprints",
      "Targeted warm-ups generated from yesterday's errors",
    ],
  },
  {
    id: "roadmap",
    badge: "ADAPTIVE ROADMAP",
    badgeColor: "text-physics bg-physics/10 border-physics/20",
    tabLabel: "04 / Exam Roadmap",
    title: "A calibrated trajectory up to your exam date",
    description:
      "Tell JeePath your exam year (JEE 2026 / 2027). It calculates prerequisite dependencies and schedules daily chapters, automatically rebalancing if coaching school tests intervene.",
    highlights: [
      "Strict dependency ordering (e.g. Vectors before Mechanics)",
      "High-yield weightage prioritization for score optimization",
      "Dynamic catch-up buffering when life or school interferes",
    ],
  },
];

const FORMULAS_MARQUEE = [
  { tex: "F = -\\frac{dU}{dx}", label: "Conservative Force", sub: "Physics" },
  { tex: "\\Delta G^\\circ = -RT \\ln K", label: "Equilibrium Constant", sub: "Chemistry" },
  { tex: "\\int \\sec x \\, dx = \\ln|\\sec x + \\tan x|", label: "Standard Integral", sub: "Maths" },
  { tex: "\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 I_{\\text{enc}}", label: "Ampère's Law", sub: "Physics" },
  { tex: "K_{\\text{max}} = h\\nu - \\Phi", label: "Photoelectric Effect", sub: "Physics" },
  { tex: "pH = pK_a + \\log\\frac{[A^-]}{[HA]}", label: "Henderson-Hasselbalch", sub: "Chemistry" },
  { tex: "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1", label: "Fundamental Limit", sub: "Maths" },
  { tex: "\\vec{\\tau} = \\vec{r} \\times \\vec{F}", label: "Torque Vector", sub: "Physics" },
  { tex: "PV = nRT", label: "Ideal Gas Law", sub: "Chemistry" },
  { tex: "\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\varepsilon_0}", label: "Gauss's Law", sub: "Physics" },
];

export default function StudyStudio() {
  const [activeTab, setActiveTab] = useState<string>("lessons");
  const [selectedPracticeOption, setSelectedPracticeOption] = useState<number | null>(1); // default option 2 is correct

  const tab = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <section id="study-studio" className="relative scroll-mt-16 border-t border-line bg-canvas px-5 py-24 sm:px-8 lg:py-32 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-accent/[0.04] blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span
            data-reveal
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent shadow-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            STUDY STUDIO SHOWCASE
          </span>
          <h2
            data-reveal
            className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl"
          >
            Everything you need for an evening of study
          </h2>
          <p data-reveal className="mt-4 text-base leading-relaxed text-ink-2 sm:text-lg">
            No cluttered split layouts or compressed cards. Experience the full depth of real Socratic lessons, instant verified practice, and long-term memory in one seamless workspace.
          </p>
        </div>

        {/* Studio Tab Navigation Switcher */}
        <div data-reveal className="mt-12 flex justify-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-line bg-surface/90 p-1.5 shadow-sm backdrop-blur-md">
            {TABS.map((t) => {
              const active = t.id === activeTab;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  type="button"
                  className={`landing-btn relative rounded-xl px-4 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                    active
                      ? "bg-ink text-surface shadow-md"
                      : "text-ink-2 hover:bg-hover hover:text-ink"
                  }`}
                >
                  {t.tabLabel}
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3D Interactive Feature Stage */}
        <div className="mt-12 grid items-stretch gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Feature Narrative & Highlights */}
          <div data-reveal className="flex flex-col justify-between rounded-3xl border border-line bg-surface p-7 sm:p-9 lg:col-span-5 shadow-sm">
            <div>
              <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold tracking-wide ${tab.badgeColor}`}>
                {tab.badge}
              </span>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl leading-snug">
                {tab.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-ink-2 sm:text-base">
                {tab.description}
              </p>

              {/* Highlights Checkmarks */}
              <div className="mt-6 space-y-3 pt-6 border-t border-line/60">
                {tab.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold mt-0.5">
                      ✓
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-ink-2 leading-relaxed">
                      {h}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Micro-Badge Strip */}
            <div className="mt-8 rounded-2xl bg-canvas p-4 border border-line/80 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted">Execution speed</p>
                <p className="text-sm font-bold text-ink tabular-nums">&lt; 15ms local cache</p>
              </div>
              <div className="h-7 w-px bg-line" />
              <div>
                <p className="text-[11px] font-medium text-muted">Syllabus precision</p>
                <p className="text-sm font-bold text-accent">100% NCERT / PYQ</p>
              </div>
              <div className="h-7 w-px bg-line" />
              <div>
                <p className="text-[11px] font-medium text-muted">Hallucination check</p>
                <p className="text-sm font-bold text-success">SymPy Verified</p>
              </div>
            </div>
          </div>

          {/* Right Column: Full-Height High-Fidelity 3D Interactive Mockup */}
          <div data-reveal className="landing-mockup-wrapper relative flex flex-col rounded-3xl border border-line bg-surface shadow-[0_24px_70px_-20px_oklch(22%_0.03_250/0.25)] lg:col-span-7 overflow-hidden min-h-[460px]">
            {/* Window Top Bar */}
            <div className="flex items-center justify-between border-b border-line bg-canvas/70 px-5 py-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]/80 border border-[#e0443e]/40" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/80 border border-[#dea123]/40" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]/80 border border-[#1aab29]/40" />
                <span className="ml-3 truncate text-xs font-semibold text-ink-2">
                  JeePath Workspace · {tab.tabLabel.replace(/^\d+\s*\/\s*/, "")}
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success border border-success/20">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                Active Room
              </span>
            </div>

            {/* Dynamic Interactive Stage Body based on activeTab */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              {activeTab === "lessons" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* Subject Tag & Concept */}
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-physics/10 px-2.5 py-1 text-xs font-bold text-physics border border-physics/20">
                      Physics · Rotational Dynamics
                    </span>
                    <span className="text-xs text-muted">Session duration: 18m</span>
                  </div>

                  {/* Socratic Dialectic Steps */}
                  <div className="rounded-2xl border border-line bg-canvas p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink text-surface text-xs font-bold">
                        Q
                      </div>
                      <div className="text-sm font-medium text-ink leading-relaxed">
                        Why does a solid cylinder roll down an inclined plane faster than a hollow cylinder of the same mass and radius?
                      </div>
                    </div>

                    <div className="border-t border-line/60 pt-3 flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-on text-xs font-bold">
                        T
                      </div>
                      <div className="space-y-2 text-sm text-ink-2 leading-relaxed">
                        <p>
                          Let us think in terms of energy partition. The total kinetic energy splits into translational and rotational components:
                        </p>
                        <div className="rounded-xl border border-line bg-surface p-3 font-mono text-center text-xs text-ink shadow-xs">
                          {"E_k = \\frac{1}{2} M v^2 + \\frac{1}{2} I \\omega^2 = \\frac{1}{2} M v^2 \\left(1 + \\frac{k^2}{R^2}\\right)"}
                        </div>
                        <p className="text-xs text-accent font-medium">
                          ✦ Question for you: Which object has a smaller radius of gyration <span className="font-mono font-bold">$k$</span> relative to <span className="font-mono font-bold">$R$</span>?
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Input Mock */}
                  <div className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/[0.03] p-2.5 shadow-xs">
                    <input
                      type="text"
                      readOnly
                      aria-label="Student response demo"
                      value="The solid cylinder has more mass concentrated near the axis, so k is smaller."
                      className="flex-1 bg-transparent text-xs sm:text-sm font-medium text-ink focus:outline-hidden"
                    />
                    <span className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-accent-on shadow-xs">
                      Send
                    </span>
                  </div>
                </div>
              )}

              {activeTab === "practice" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-chemistry/10 px-2.5 py-1 text-xs font-bold text-chemistry border border-chemistry/20">
                      Chemistry · Chemical Equilibrium
                    </span>
                    <span className="text-xs font-semibold text-muted">Question 3 of 8 · Multi-choice</span>
                  </div>

                  <p className="text-sm sm:text-base font-semibold text-ink leading-relaxed">
                    For the exothermic Haber synthesis: <br />
                    <span className="font-mono text-xs sm:text-sm text-ink-2 inline-block my-1.5 bg-canvas px-3 py-1 rounded-lg border border-line">
                      {"N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g), \\quad \\Delta H < 0"}
                    </span>
                    <br />
                    Which adjustment will maximize the equilibrium yield of ammonia according to Le Chatelier&apos;s principle?
                  </p>

                  {/* Interactive Options */}
                  <div className="grid gap-2.5">
                    {[
                      { id: 0, text: "Increasing temperature while keeping pressure constant" },
                      { id: 1, text: "Increasing total pressure and lowering the temperature", correct: true },
                      { id: 2, text: "Adding an inert gas (Argon) at constant pressure" },
                      { id: 3, text: "Removing N₂(g) continuously from the reactor" },
                    ].map((opt) => {
                      const isSelected = selectedPracticeOption === opt.id;
                      const isCorrect = opt.correct;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedPracticeOption(opt.id)}
                          className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs sm:text-sm transition-all ${
                            isSelected && isCorrect
                              ? "border-success bg-success/10 text-ink font-semibold shadow-xs"
                              : isSelected
                              ? "border-warning bg-warning/10 text-ink"
                              : "border-line bg-canvas/60 text-ink-2 hover:border-line-strong hover:bg-canvas"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                isSelected && isCorrect
                                  ? "bg-success text-surface"
                                  : "border border-line bg-surface text-ink-2"
                              }`}
                            >
                              {isSelected && isCorrect ? "✓" : String.fromCharCode(65 + opt.id)}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isSelected && isCorrect && (
                            <span className="text-[11px] font-bold text-success uppercase tracking-wider">
                              Verified
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Instant Verification Toast */}
                  <div className="rounded-xl border border-success/30 bg-success/10 p-3 flex items-center justify-between text-xs text-success font-medium">
                    <span>✓ High pressure shifts equilibrium to fewer gas moles (4 → 2). Lower T favors exothermic reaction.</span>
                    <span className="font-bold tabular-nums">4.2ms</span>
                  </div>
                </div>
              )}

              {activeTab === "mastery" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning border border-warning/20">
                      Learner Retention Radar · Mathematics
                    </span>
                    <span className="text-xs font-bold text-success">🔥 14-Day Consistent Streak</span>
                  </div>

                  {/* Stat Cards Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-line bg-canvas p-3">
                      <p className="text-[11px] text-muted">Weekly Accuracy</p>
                      <p className="text-xl font-bold text-ink tabular-nums mt-0.5">91.4%</p>
                    </div>
                    <div className="rounded-xl border border-line bg-canvas p-3">
                      <p className="text-[11px] text-muted">Mastered Concepts</p>
                      <p className="text-xl font-bold text-ink tabular-nums mt-0.5">84 / 106</p>
                    </div>
                    <div className="rounded-xl border border-line bg-canvas p-3">
                      <p className="text-[11px] text-muted">Next Scheduled Review</p>
                      <p className="text-xl font-bold text-accent mt-0.5">Tonight</p>
                    </div>
                  </div>

                  {/* Retention Bars */}
                  <div className="rounded-2xl border border-line bg-canvas p-4 space-y-3">
                    <p className="text-xs font-semibold text-ink">Calculus Mastery Breakdown</p>
                    {[
                      { topic: "Limits & L'Hôpital Rule", score: 94, state: "Retained" },
                      { topic: "Integration by Substitution", score: 86, state: "Stable" },
                      { topic: "Definite Integral as Limit of a Sum", score: 62, state: "Review Due" },
                      { topic: "Differential Equations (Linear Form)", score: 48, state: "Needs Practice" },
                    ].map((row) => (
                      <div key={row.topic} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-ink-2">{row.topic}</span>
                          <span className={`font-semibold ${row.score >= 80 ? "text-success" : row.score >= 60 ? "text-warning" : "text-danger"}`}>
                            {row.score}% · {row.state}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-line overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              row.score >= 80 ? "bg-success" : row.score >= 60 ? "bg-warning" : "bg-danger"
                            }`}
                            style={{ width: `${row.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "roadmap" && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-physics/10 px-2.5 py-1 text-xs font-bold text-physics border border-physics/20">
                      Adaptive Roadmap · Target: JEE Advanced
                    </span>
                    <span className="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                      Trajectory: Top 1,000 AIR
                    </span>
                  </div>

                  {/* Timeline Schedule */}
                  <div className="rounded-2xl border border-line bg-canvas p-4 space-y-3">
                    <p className="text-xs font-semibold text-ink">Upcoming Daily Schedule</p>
                    {[
                      { day: "Today (Mon)", title: "Rotational Dynamics: Rolling without Slipping", status: "In Progress", duration: "25 min" },
                      { day: "Tue", title: "Thermodynamics: Second Law & Carnot Efficiency", status: "Upcoming", duration: "30 min" },
                      { day: "Wed", title: "Electrostatics: Gauss's Law & Spherical Shells", status: "Upcoming", duration: "25 min" },
                      { day: "Thu", title: "Spaced Review: Center of Mass & Collision PYQs", status: "Spaced Review", duration: "20 min" },
                    ].map((item, idx) => (
                      <div key={item.day} className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 text-xs">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-md font-bold text-[11px] ${
                            idx === 0 ? "bg-accent text-accent-on" : "bg-hover text-ink-2"
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-ink">{item.title}</p>
                            <p className="text-[11px] text-muted">{item.day} · {item.duration}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                          idx === 0 ? "bg-accent/10 text-accent border border-accent/20" : "bg-hover text-ink-2"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-line bg-surface p-3 flex items-center justify-between text-xs text-ink-2">
                    <span>⚡ Automatically re-balances daily workload when school exams take extra time.</span>
                  </div>
                </div>
              )}

              {/* Floating Bottom Badge */}
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-muted">
                <span>Interactive Live Preview · Switch tabs above</span>
                <span className="font-medium text-ink">JeePath Engine v2.4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Continuous 3D Scrolling Formula Rail */}
        <div data-reveal className="mt-20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Live JEE Syllabus Knowledge Stream
            </span>
            <span className="text-xs font-medium text-accent">
              Continuously calibrated across 1,016 topics →
            </span>
          </div>

          <div className="relative w-full overflow-hidden rounded-2xl border border-line bg-surface/50 py-4 shadow-inner backdrop-blur-xs">
            {/* Edge fade gradients */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-canvas to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-canvas to-transparent" />

            {/* Continuous marquee */}
            <div className="flex gap-4 animate-marquee whitespace-nowrap">
              {[...FORMULAS_MARQUEE, ...FORMULAS_MARQUEE].map((f, i) => (
                <div
                  key={`${f.tex}-${i}`}
                  className="inline-flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 shadow-xs transition-transform hover:scale-105"
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      f.sub === "Physics"
                        ? "bg-physics/10 text-physics border border-physics/20"
                        : f.sub === "Chemistry"
                        ? "bg-chemistry/10 text-chemistry border border-chemistry/20"
                        : "bg-maths/10 text-maths border border-maths/20"
                    }`}
                  >
                    {f.sub}
                  </span>
                  <span className="font-mono text-xs font-semibold text-ink">
                    ${f.tex}$
                  </span>
                  <span className="text-[11px] text-muted">
                    ({f.label})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
