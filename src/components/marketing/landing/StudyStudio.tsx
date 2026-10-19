"use client";

import { useState } from "react";
import TeX from "./TeX";

interface StudioStep {
  id: string;
  stepNumber: string;
  timeSlot: string;
  badge: string;
  badgeColor: string;
  navTitle: string;
  headline: string;
  subhead: string;
  cognitiveGoal: string;
  agentAction: string;
  highlights: string[];
  nextLabel: string;
}

const STEPS: StudioStep[] = [
  {
    id: "socratic",
    stepNumber: "01",
    timeSlot: "Minute 00 – 12",
    badge: "SOCRATIC DIALECTIC",
    badgeColor: "text-accent bg-accent/10 border-accent/20",
    navTitle: "01 / Socratic Dialectic",
    headline: "First-principles guidance that never spoils the solution",
    subhead:
      "The tutor diagnoses exactly where your intuition diverges. It asks calibrating questions rather than dumping textbook solutions, guiding you to derive the concept yourself.",
    cognitiveGoal: "Bridge kinematic translational momentum into rotational inertia partition.",
    agentAction: "SymPy verifies dimensional consistency; tutor scaffolds next inquiry step.",
    highlights: [
      "Breaks multi-step JEE Advanced problems into intuitive sub-questions",
      "Dynamic tone calibration based on hesitation and response length",
      "Real-time symbolic algebraic verification on every intermediate step",
    ],
    nextLabel: "Step 02: Instant Verification",
  },
  {
    id: "practice",
    stepNumber: "02",
    timeSlot: "Minute 12 – 18",
    badge: "INSTANT STEP VERIFICATION",
    badgeColor: "text-success bg-success/10 border-success/20",
    navTitle: "02 / Instant Practice",
    headline: "Immediate verification the millisecond you submit",
    subhead:
      "No waiting for pdf answer keys. You get granular feedback on your exact step, with dimensional analysis and physical justification explaining why an answer is right or wrong.",
    cognitiveGoal: "Apply Le Chatelier's thermodynamic equilibrium shift to exothermic gaseous reactions.",
    agentAction: "Evaluates mole differential (Δn_g) and enthalpy sign in 4.2ms.",
    highlights: [
      "Authentic JEE Main & Advanced multi-choice and numerical question formats",
      "Automated dimensional consistency and arithmetic checks via SymPy",
      "Step-level progressive hints available if you hesitate or pause",
    ],
    nextLabel: "Step 03: Retention Radar",
  },
  {
    id: "retention",
    stepNumber: "03",
    timeSlot: "Minute 18 – 22",
    badge: "EPISODIC LEARNING MEMORY",
    badgeColor: "text-warning bg-warning/10 border-warning/20",
    navTitle: "03 / Retention & Memory",
    headline: "A memory radar tracking your conceptual forgetting curve",
    subhead:
      "Every doubt, mistake, and delay is recorded in episodic learner memory. It calculates decay curves so fragile concepts resurface right before you lose them.",
    cognitiveGoal: "Consolidate Rotational Dynamics and Thermodynamics before the next mock test.",
    agentAction: "Updates concept node proficiency matrix in Postgres public schema.",
    highlights: [
      "Mastery scores that fade with time, so fragile topics come back before you lose them",
      "Streak protection with daily focused 25-minute sprints",
      "Targeted warm-ups generated from yesterday's errors",
    ],
    nextLabel: "Step 04: Exam Roadmap",
  },
  {
    id: "roadmap",
    stepNumber: "04",
    timeSlot: "Minute 22 – 25",
    badge: "ADAPTIVE ROADMAP",
    badgeColor: "text-physics bg-physics/10 border-physics/20",
    navTitle: "04 / Dynamic Roadmap",
    headline: "A calibrated trajectory up to your exam date",
    subhead:
      "Tell JeePath your exam year (JEE 2026 / 2027). It calculates prerequisite dependencies and schedules daily chapters, automatically rebalancing when school exams intervene.",
    cognitiveGoal: "Rebalance Rotational Dynamics -> Thermodynamics trajectory for JEE Advanced.",
    agentAction: "Walks the syllabus to resolve which topics must come first.",
    highlights: [
      "Strict dependency ordering (Vectors before Mechanics, Equilibrium before Electrochemistry)",
      "High-yield weightage prioritization for score optimization",
      "Dynamic catch-up buffering when life or school interferes",
    ],
    nextLabel: "Step 01: Socratic Dialectic",
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
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [selectedPracticeOption, setSelectedPracticeOption] = useState<number | null>(1); // option B is correct
  const [practiceAnswerChecked, setPracticeAnswerChecked] = useState<boolean>(true);
  const [socraticDemoPrompt, setSocraticDemoPrompt] = useState<string>(
    "Why does a solid cylinder roll faster than a hollow cylinder of the same mass?"
  );

  const step = STEPS[activeStepIndex];

  const handleNextStep = () => {
    setActiveStepIndex((prev) => (prev + 1) % STEPS.length);
  };

  const handlePrevStep = () => {
    setActiveStepIndex((prev) => (prev - 1 + STEPS.length) % STEPS.length);
  };

  return (
    <section id="study-studio" className="relative scroll-mt-16 border-t border-line bg-canvas px-5 py-20 sm:px-8 lg:py-28 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute left-1/3 top-1/4 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-accent/[0.035] blur-[140px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Asymmetric Section Header — NOT centered! */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 border-b border-line/70">
          <div className="max-w-2xl">
            <span
              data-reveal
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent shadow-xs"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              STUDY STUDIO · STEP-BY-STEP WORKSPACE
            </span>
            <h2
              data-reveal
              className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl"
            >
              Everything you need for an evening of study
            </h2>
            <p data-reveal className="mt-3 text-base leading-relaxed text-ink-2 sm:text-lg">
              You talk a doubt through until it makes sense. The answer is checked the moment you give it. What is about to slip comes back before the exam, and the last few minutes choose the next chapter.
            </p>
          </div>

          {/* Step Controller & Prev/Next Actions */}
          <div data-reveal className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-1.5 shadow-xs">
              <button
                type="button"
                onClick={handlePrevStep}
                aria-label="Previous study step"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line/60 bg-canvas text-ink-2 hover:bg-hover hover:text-ink transition-colors"
              >
                ←
              </button>
              <div className="px-3 text-center">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted">Study Step</p>
                <p className="text-xs font-bold text-ink tabular-nums">
                  {step.stepNumber} <span className="text-muted">/ 04</span>
                </p>
              </div>
              <button
                type="button"
                onClick={handleNextStep}
                aria-label="Next study step"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line/60 bg-canvas text-ink-2 hover:bg-hover hover:text-ink transition-colors"
              >
                →
              </button>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="landing-btn inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-xs font-semibold text-surface shadow-xs hover:opacity-90"
            >
              <span>{step.nextLabel}</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* Balanced Two-Column Interactive Studio Workstation */}
        <div className="mt-8 grid items-stretch gap-8 lg:grid-cols-12">
          {/* Left Column: Pedagogical Guide & Interactive Controls */}
          <div data-reveal className="flex flex-col justify-between rounded-3xl border border-line bg-surface p-7 sm:p-9 lg:col-span-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-[11px] font-bold tracking-wide ${step.badgeColor}`}>
                  {step.badge}
                </span>
                <span className="text-xs text-muted font-mono">{step.timeSlot}</span>
              </div>

              <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl leading-snug">
                {step.headline}
              </h3>
              
              <p className="mt-4 text-sm leading-relaxed text-ink-2">
                {step.subhead}
              </p>

              {/* Cognitive Blueprint Box */}
              <div className="mt-6 rounded-2xl border border-line/80 bg-canvas p-4 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-accent">Cognitive Objective</p>
                  <p className="text-xs font-medium text-ink mt-0.5">{step.cognitiveGoal}</p>
                </div>
                <div className="h-px bg-line/60" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted">Agent Telemetry Action</p>
                  <p className="text-xs font-mono text-ink-2 mt-0.5">{step.agentAction}</p>
                </div>
              </div>

              {/* Step Checklist */}
              <div className="mt-6 space-y-2.5">
                {step.highlights.map((h) => (
                  <div key={h} className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent text-xs font-bold mt-0.5">
                      ✓
                    </span>
                    <span className="text-xs sm:text-sm text-ink-2 leading-relaxed">
                      {h}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions for Step */}
            <div className="mt-8 pt-6 border-t border-line/70 flex items-center justify-between">
              <span className="text-xs text-muted">
                Step {activeStepIndex + 1} of {STEPS.length}
              </span>
              <button
                type="button"
                onClick={handleNextStep}
                className="landing-btn inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-accent-on shadow-xs hover:bg-accent-hover"
              >
                <span>{step.nextLabel}</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Right Column: Full-Height Interactive Workspace Screen */}
          <div data-reveal className="landing-mockup-wrapper relative flex flex-col rounded-3xl border border-line bg-surface shadow-[0_20px_60px_-15px_oklch(22%_0.03_250/0.18)] lg:col-span-7 overflow-hidden min-h-[500px]">
            {/* Top Workspace Terminal Bar */}
            <div className="flex items-center justify-between border-b border-line bg-canvas/80 px-5 py-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]/80 border border-[#e0443e]/40" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]/80 border border-[#dea123]/40" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]/80 border border-[#1aab29]/40" />
                <span className="ml-3 truncate text-xs font-semibold text-ink-2">
                  JeePath Studio · {step.navTitle.replace(/^\d+\s*\/\s*/, "")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-semibold text-success border border-success/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                  Live Agent
                </span>
              </div>
            </div>

            {/* Stage Body */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between bg-surface">
              {/* STEP 1: Socratic Dialectic */}
              {activeStepIndex === 0 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-physics/10 px-2.5 py-1 text-xs font-bold text-physics border border-physics/20">
                      Physics · Rotational Dynamics
                    </span>
                    <span className="text-xs text-muted">Session duration: 18m</span>
                  </div>

                  {/* Socratic Chat Box */}
                  <div className="rounded-2xl border border-line bg-canvas p-5 space-y-4 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink text-surface text-xs font-bold">
                        Q
                      </div>
                      <div className="text-sm font-semibold text-ink leading-relaxed">
                        {socraticDemoPrompt}
                      </div>
                    </div>

                    <div className="border-t border-line/60 pt-4 flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-on text-xs font-bold">
                        T
                      </div>
                      <div className="space-y-2.5 text-sm text-ink-2 leading-relaxed">
                        <p>
                          Let us analyze energy partition. As an object rolls down an incline without slipping, total kinetic energy divides into translational and rotational parts:
                        </p>
                        <div className="overflow-x-auto rounded-xl border border-line bg-surface p-3 text-center text-ink shadow-xs">
                          <TeX className="landing-katex">{"E_k = \\frac{1}{2} M v^2 + \\frac{1}{2} I \\omega^2 = \\frac{1}{2} M v^2 \\left(1 + \\frac{k^2}{R^2}\\right)"}</TeX>
                        </div>
                        <p className="text-xs text-accent font-semibold">
                          Which cylinder has a smaller radius of gyration <TeX className="landing-katex">{"k"}</TeX> relative to its radius <TeX className="landing-katex">{"R"}</TeX>?
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Quick Prompts to Click */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Try clicking another question prompt:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Why does a solid cylinder roll faster than a hollow cylinder?",
                        "What happens if friction is completely zero?",
                        "Does total mass affect the rolling acceleration?",
                      ].map((promptText) => (
                        <button
                          key={promptText}
                          type="button"
                          onClick={() => setSocraticDemoPrompt(promptText)}
                          className={`rounded-lg border px-2.5 py-1 text-xs text-left transition-colors ${
                            socraticDemoPrompt === promptText
                              ? "border-accent bg-accent/10 text-accent font-semibold"
                              : "border-line bg-canvas hover:bg-hover text-ink-2"
                          }`}
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Input Response Mock */}
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

              {/* STEP 2: Instant Practice */}
              {activeStepIndex === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-chemistry/10 px-2.5 py-1 text-xs font-bold text-chemistry border border-chemistry/20">
                      Chemistry · Chemical Equilibrium
                    </span>
                    <span className="text-xs font-semibold text-muted">Question 3 of 8 · Multi-choice</span>
                  </div>

                  <div className="rounded-2xl border border-line bg-canvas p-4 space-y-2">
                    <p className="text-sm sm:text-base font-semibold text-ink leading-relaxed">
                      For the exothermic Haber synthesis: <br />
                      <span className="my-1.5 inline-block rounded-lg border border-line bg-surface px-3 py-1 text-ink">
                        <TeX className="landing-katex">{"\\mathrm{N_2}(g) + 3\\mathrm{H_2}(g) \\rightleftharpoons 2\\mathrm{NH_3}(g), \\quad \\Delta H < 0"}</TeX>
                      </span>
                      <br />
                      Which parameter shift maximizes the equilibrium yield of ammonia according to Le Chatelier&apos;s principle?
                    </p>
                  </div>

                  {/* Interactive Options */}
                  <div className="grid gap-2">
                    {[
                      { id: 0, text: "Increasing temperature while keeping pressure constant", correct: false, note: "Endothermic direction favored; yield decreases." },
                      { id: 1, text: "Increasing total pressure and lowering the temperature", correct: true, note: "Correct! Δn_g = 2 - 4 = -2 (fewer moles) + exothermic." },
                      { id: 2, text: "Adding an inert gas (Argon) at constant pressure", correct: false, note: "Increases volume; shifts equilibrium to side with more gas moles." },
                      { id: 3, text: "Removing N₂(g) continuously from the reactor", correct: false, note: "Reactant removal shifts system backwards." },
                    ].map((opt) => {
                      const isSelected = selectedPracticeOption === opt.id;
                      const isCorrect = opt.correct;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedPracticeOption(opt.id);
                            setPracticeAnswerChecked(true);
                          }}
                          className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs sm:text-sm transition-all ${
                            isSelected && isCorrect && practiceAnswerChecked
                              ? "border-success bg-success/10 text-ink font-semibold shadow-xs"
                              : isSelected && !isCorrect && practiceAnswerChecked
                              ? "border-danger bg-danger/10 text-ink"
                              : "border-line bg-canvas/60 text-ink-2 hover:border-line-strong hover:bg-canvas"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                isSelected && isCorrect && practiceAnswerChecked
                                  ? "bg-success text-surface"
                                  : isSelected && !isCorrect && practiceAnswerChecked
                                  ? "bg-danger text-surface"
                                  : "border border-line bg-surface text-ink-2"
                              }`}
                            >
                              {isSelected && isCorrect && practiceAnswerChecked ? "✓" : isSelected && !isCorrect && practiceAnswerChecked ? "✗" : String.fromCharCode(65 + opt.id)}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isSelected && isCorrect && practiceAnswerChecked && (
                            <span className="text-[11px] font-bold text-success uppercase tracking-wider">
                              Verified
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Instant Verification Toast */}
                  {selectedPracticeOption !== null && (
                    <div className={`rounded-xl border p-3 flex items-center justify-between text-xs font-medium ${
                      selectedPracticeOption === 1 ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"
                    }`}>
                      <span>
                        {selectedPracticeOption === 1
                          ? "✓ Verified: High pressure shifts equilibrium to fewer gas moles (4 → 2). Lower T favors exothermic forward direction."
                          : "✗ Incorrect: That adjustment shifts equilibrium away from NH₃ formation according to Le Chatelier."}
                      </span>
                      <span className="font-bold tabular-nums shrink-0 ml-3">4.2ms SymPy</span>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Retention & Streaks */}
              {activeStepIndex === 2 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning border border-warning/20">
                      Learner Retention Radar · Physics
                    </span>
                    <span className="text-xs font-bold text-success">🔥 14-Day Consistent Streak</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-line bg-canvas p-3">
                      <p className="text-[11px] text-muted font-medium">Weekly Accuracy</p>
                      <p className="text-xl font-bold text-ink tabular-nums mt-0.5">91.4%</p>
                    </div>
                    <div className="rounded-xl border border-line bg-canvas p-3">
                      <p className="text-[11px] text-muted font-medium">Mastered Concepts</p>
                      <p className="text-xl font-bold text-ink tabular-nums mt-0.5">84 / 106</p>
                    </div>
                    <div className="rounded-xl border border-line bg-canvas p-3">
                      <p className="text-[11px] text-muted font-medium">Scheduled Review</p>
                      <p className="text-xl font-bold text-accent mt-0.5">Tonight</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-line bg-canvas p-4 space-y-3">
                    <p className="text-xs font-bold text-ink">Rotational Dynamics Breakdown</p>
                    {[
                      { topic: "Torque and angular acceleration", score: 94, state: "Retained" },
                      { topic: "Moment of inertia of common bodies", score: 86, state: "Stable" },
                      { topic: "Rolling without slipping", score: 62, state: "Review Due" },
                      { topic: "Angular momentum conservation", score: 48, state: "Needs Practice" },
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

              {/* STEP 4: Dynamic Exam Roadmap */}
              {activeStepIndex === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-physics/10 px-2.5 py-1 text-xs font-bold text-physics border border-physics/20">
                      Adaptive Roadmap · Target: JEE Advanced
                    </span>
                    <span className="text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                      AIR Target: Top 1,000
                    </span>
                  </div>

                  <div className="rounded-2xl border border-line bg-canvas p-4 space-y-3">
                    <p className="text-xs font-bold text-ink">Upcoming Daily Schedule</p>
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

              {/* Window Footer Status */}
              <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs text-muted">
                <span>This part of the session, as the student sees it</span>
                <span className="font-medium text-ink">JeePath Engine v2.4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Continuous Formula Rail Marquee Ticker */}
        <div data-reveal className="mt-14 overflow-hidden rounded-2xl border border-line bg-surface/70 py-4 shadow-xs">
          <div className="flex items-center gap-3 px-4 pb-2 border-b border-line/50 text-[11px] font-semibold text-muted">
            <span className="flex h-2 w-2 rounded-full bg-accent animate-ping" />
            <span className="uppercase tracking-wider">Physics, Chemistry and Maths formula rail</span>
          </div>
          <div className="pointer-events-none relative mt-3 flex overflow-hidden">
            <div className="animate-marquee flex items-center gap-6 whitespace-nowrap">
              {[...FORMULAS_MARQUEE, ...FORMULAS_MARQUEE].map((f, i) => (
                <div
                  key={`${f.tex}-${i}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-2 text-ink shadow-xs"
                >
                  <TeX className="landing-katex">{f.tex}</TeX>
                  <span className="h-3 w-px bg-line" />
                  <span className="text-[11px] font-medium text-ink-2">
                    {f.label}
                  </span>
                  <span className="rounded-md bg-hover px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                    {f.sub}
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
