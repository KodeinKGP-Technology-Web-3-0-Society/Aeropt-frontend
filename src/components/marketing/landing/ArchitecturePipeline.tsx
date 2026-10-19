"use client";

import { useState } from "react";

interface PipelinePhase {
  id: string;
  phaseNum: string;
  timeframe: string;
  title: string;
  subhead: string;
  summary: string;
  telemetryType: string;
  telemetryStatus: string;
  telemetryDetails: { label: string; val: string }[];
  technicalSpec: string;
  iconType: "crosshair" | "dialectic" | "memory";
}

const PHASES: PipelinePhase[] = [
  {
    id: "phase1",
    phaseNum: "01",
    timeframe: "00:00 – 05:00",
    title: "Diagnostic Concept Isolation",
    subhead: "Maps your doubt to the syllabus graph",
    summary:
      "Bring any homework problem, textbook doubt, or syllabus chapter. JeePath traverses the 1,016-concept prerequisite graph to isolate whether your blockage is a fundamental definition or an algebra oversight.",
    telemetryType: "Prerequisite Knowledge Graph",
    telemetryStatus: "1,016 Nodes Indexed",
    telemetryDetails: [
      { label: "Retrieval Latency", val: "< 6ms local index" },
      { label: "Prerequisite Status", val: "Kinematics 2D verified" },
      { label: "Target Node", val: "Rotational Dynamics (Ch 7)" },
      { label: "Cognitive Load", val: "Calibrated to Medium-High" },
    ],
    technicalSpec: "Zero wasted time reteaching what you already master. Directly targets the pivot point.",
    iconType: "crosshair",
  },
  {
    id: "phase2",
    phaseNum: "02",
    timeframe: "05:00 – 20:00",
    title: "Socratic Loop & SymPy Proof Engine",
    subhead: "Derives the idea without spoiling the answer",
    summary:
      "The agent never dumps raw solutions. It asks calibrating questions one step at a time. Every student formula is piped into SymPy for real-time dimensional and algebraic verification.",
    telemetryType: "SymPy Algebraic Proof Engine",
    telemetryStatus: "Strict Zero-Spoiler Shield",
    telemetryDetails: [
      { label: "Dimensional Check", val: "[M L² T⁻²] Energy partition" },
      { label: "Algebraic Proof", val: "k²/R² gyration verified" },
      { label: "Scaffolding Tone", val: "Warm & First-Principles" },
      { label: "Checker Latency", val: "4.2ms validation" },
    ],
    technicalSpec: "Builds deep geometric and physical intuition so you can solve unseen JEE Advanced variations.",
    iconType: "dialectic",
  },
  {
    id: "phase3",
    phaseNum: "03",
    timeframe: "20:00 – 25:00",
    title: "Episodic Memory & Spaced Retrieval",
    subhead: "Immunizes concepts against forgetting curves",
    summary:
      "Every hesitation, mistake, and breakthrough is recorded in Postgres learner memory. It calculates decay half-lives to schedule micro-warmups before exam day.",
    telemetryType: "Decay Forgetting Model",
    telemetryStatus: "Postgres Persistence",
    telemetryDetails: [
      { label: "Memory Write", val: "User learning profile updated" },
      { label: "Mastery Index", val: "Rotational Dynamics: 88%" },
      { label: "Decay Half-Life", val: "48 hours to next prompt" },
      { label: "Warmup Target", val: "Scheduled tomorrow 6:30 PM" },
    ],
    technicalSpec: "Eliminates the 'blank out during exam' syndrome by transforming short-term hints into permanent recall.",
    iconType: "memory",
  },
];

export default function ArchitecturePipeline() {
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);

  const phase = PHASES[activePhaseIndex];

  return (
    <section id="how-it-works" className="relative scroll-mt-16 border-t border-line bg-canvas px-5 py-20 sm:px-8 lg:py-28 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        {/* Asymmetric Header — NOT centered! */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-line/70">
          <div className="max-w-2xl">
            <span
              data-reveal
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent shadow-xs"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              SYSTEM ARCHITECTURE · AUTONOMOUS AGENT RUNTIME
            </span>
            <h2
              data-reveal
              className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl"
            >
              How a 25-minute study session works
            </h2>
            <p data-reveal className="mt-3 text-base leading-relaxed text-ink-2 sm:text-lg">
              No generic LLM hallucinated answers. Three cooperating systems run underneath: prerequisite graph isolation, SymPy formal algebra proofs, and long-term memory scheduling.
            </p>
          </div>

          {/* Interactive Phase Controller */}
          <div data-reveal className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-mono font-semibold text-muted">
              Select Phase:
            </span>
            <div className="inline-flex items-center rounded-2xl border border-line bg-surface p-1 shadow-xs">
              {PHASES.map((p, idx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePhaseIndex(idx)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    idx === activePhaseIndex
                      ? "bg-accent text-accent-on shadow-xs"
                      : "text-ink-2 hover:bg-hover"
                  }`}
                >
                  Phase {p.phaseNum}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3-Step Interactive Architecture Cards */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PHASES.map((p, index) => {
            const isActive = index === activePhaseIndex;
            return (
              <button
                key={p.id}
                type="button"
                data-reveal
                aria-label={`Inspect Phase ${p.phaseNum}: ${p.title}`}
                onClick={() => setActivePhaseIndex(index)}
                className={`landing-btn group relative flex flex-col justify-between rounded-3xl border p-7 sm:p-8 text-left transition-all duration-300 ${
                  isActive
                    ? "border-accent bg-surface shadow-md ring-2 ring-accent/20"
                    : "border-line bg-surface/70 hover:border-line-strong hover:bg-surface"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-mono text-sm font-bold shadow-xs transition-colors ${
                        isActive ? "bg-accent text-accent-on" : "bg-ink text-surface"
                      }`}
                    >
                      {p.phaseNum}
                    </span>
                    
                    {/* Engineering SVG Schematics */}
                    {p.iconType === "crosshair" && (
                      <svg className={`h-6 w-6 transition-colors ${isActive ? "text-accent" : "text-muted"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                        <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                        <circle cx="12" cy="12" r="4" />
                        <line x1="12" y1="1" x2="12" y2="5" strokeLinecap="round" />
                        <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
                        <line x1="1" y1="12" x2="5" y2="12" strokeLinecap="round" />
                        <line x1="19" y1="12" x2="23" y2="12" strokeLinecap="round" />
                      </svg>
                    )}
                    {p.iconType === "dialectic" && (
                      <svg className={`h-6 w-6 transition-colors ${isActive ? "text-accent" : "text-muted"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                        <circle cx="5" cy="6" r="3" />
                        <circle cx="19" cy="6" r="3" />
                        <circle cx="12" cy="18" r="3" />
                        <path d="M5 9v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" strokeLinecap="round" />
                        <path d="M12 14v1" strokeLinecap="round" />
                      </svg>
                    )}
                    {p.iconType === "memory" && (
                      <svg className={`h-6 w-6 transition-colors ${isActive ? "text-accent" : "text-muted"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                        <rect x="2" y="4" width="20" height="6" rx="2" />
                        <rect x="2" y="14" width="20" height="6" rx="2" />
                        <path d="M6 10v4" />
                        <path d="M18 10v4" />
                      </svg>
                    )}
                  </div>

                  <span className={`mt-5 inline-block text-[11px] font-bold uppercase tracking-wider ${isActive ? "text-accent" : "text-muted"}`}>
                    {p.timeframe} · Phase {p.phaseNum}
                  </span>
                  
                  <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-ink">
                    {p.title}
                  </h3>
                  
                  <p className="mt-2 text-xs sm:text-sm text-ink-2 leading-relaxed">
                    {p.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-[11px] w-full">
                  <span className="text-muted font-medium">{p.subhead}</span>
                  <span className={`font-bold ${isActive ? "text-accent" : "text-ink"}`}>
                    {isActive ? "Active Inspection" : "Click to Inspect"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Interactive Telemetry Inspector Panel for Active Phase */}
        <div data-reveal className="mt-8 rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line/70">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-on font-mono text-xs font-bold">
                {phase.phaseNum}
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-accent font-mono">
                  Runtime Stage Telemetry · {phase.telemetryType}
                </p>
                <h4 className="font-display text-lg font-bold text-ink">
                  {phase.title}
                </h4>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success border border-success/20">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-ping" />
                {phase.telemetryStatus}
              </span>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {phase.telemetryDetails.map((td) => (
              <div key={td.label} className="rounded-2xl border border-line bg-canvas p-4">
                <p className="text-[11px] font-medium text-muted">{td.label}</p>
                <p className="text-xs sm:text-sm font-bold text-ink mt-1 font-mono">{td.val}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink-2">
            <span>⚡ {phase.technicalSpec}</span>
            <button
              type="button"
              onClick={() => setActivePhaseIndex((prev) => (prev + 1) % PHASES.length)}
              className="landing-btn inline-flex items-center gap-1.5 font-bold text-accent hover:underline self-end sm:self-auto"
            >
              <span>Advance to next phase</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
