export default function ArchitecturePipeline() {
  return (
    <section id="how-it-works" className="relative scroll-mt-16 border-t border-line bg-canvas px-5 py-24 sm:px-8 lg:py-32 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span
            data-reveal
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent shadow-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            THE LEARNING PIPELINE
          </span>
          <h2
            data-reveal
            className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-4xl lg:text-5xl"
          >
            How a study session works
          </h2>
          <p data-reveal className="mt-4 text-base leading-relaxed text-ink-2 sm:text-lg">
            Built on strict cognitive science and formal mathematical verification. No canned generic AI replies. A single autonomous loop calibrated for deep comprehension.
          </p>
        </div>

        {/* 3-Step Connected Engineering Architecture */}
        <div className="relative mt-16 grid gap-8 md:grid-cols-3">
          {/* Connecting line on desktop */}
          <div
            className="pointer-events-none absolute left-[16%] right-[16%] top-28 hidden h-0.5 bg-gradient-to-r from-accent/20 via-accent/60 to-accent/20 md:block"
            aria-hidden="true"
          />

          {/* Phase 01 */}
          <div
            data-reveal
            className="relative flex flex-col justify-between rounded-3xl border border-line bg-surface p-7 sm:p-8 shadow-xs hover:border-line-strong hover:shadow-md transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-surface font-mono text-sm font-bold shadow-xs">
                  01
                </span>
                {/* Precision Crosshair / Aperture Technical SVG */}
                <svg className="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="1" x2="12" y2="5" strokeLinecap="round" />
                  <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" />
                  <line x1="1" y1="12" x2="5" y2="12" strokeLinecap="round" />
                  <line x1="19" y1="12" x2="23" y2="12" strokeLinecap="round" />
                </svg>
              </div>

              <span className="mt-6 inline-block text-[11px] font-bold uppercase tracking-wider text-accent">
                Phase 1: Concept Isolation
              </span>
              <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Diagnose the exact weak spot
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-ink-2 leading-relaxed">
                Bring any homework problem, textbook doubt, or let JeePath isolate the chapter where your syllabus progress is currently blocked.
              </p>

              {/* Technical Schematic Flow Micro-Diagram */}
              <div className="mt-6 rounded-2xl border border-line bg-canvas p-3.5 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-muted">
                  <span>Input: Student Query</span>
                  <span className="text-success font-semibold">Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <div className="h-1 flex-1 rounded-full bg-line overflow-hidden">
                    <div className="h-full w-2/3 bg-accent rounded-full" />
                  </div>
                  <span className="text-ink font-semibold">Dual Nature Ch 11</span>
                </div>
                <div className="text-[10px] text-muted border-t border-line/60 pt-2 flex justify-between">
                  <span>Prerequisites: Waves, EM Spectrum</span>
                  <span className="text-accent font-semibold">Verified</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-line/60 text-[11px] text-muted">
              Zero wasted time on what you already master.
            </div>
          </div>

          {/* Phase 02 */}
          <div
            data-reveal
            className="relative flex flex-col justify-between rounded-3xl border border-accent/40 bg-surface p-7 sm:p-8 shadow-md hover:border-accent hover:shadow-lg transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-on font-mono text-sm font-bold shadow-xs">
                  02
                </span>
                {/* Dialectic Logic Tree Technical SVG */}
                <svg className="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="12" cy="18" r="3" />
                  <path d="M6 9v3a3 3 0 003 3h6a3 3 0 003-3V9" strokeLinecap="round" />
                  <path d="M12 15v-3" strokeLinecap="round" />
                </svg>
              </div>

              <span className="mt-6 inline-block text-[11px] font-bold uppercase tracking-wider text-accent">
                Phase 2: Socratic Dialectic
              </span>
              <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Solve together, never spoiled
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-ink-2 leading-relaxed">
                The tutor never dumps final answers. It performs real-time symbolic math checks, catches sign errors, and asks guiding questions so you discover the breakthrough.
              </p>

              {/* Technical Schematic Flow Micro-Diagram */}
              <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/[0.04] p-3.5 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-muted">
                  <span>Step Engine: SymPy + Local DB</span>
                  <span className="text-accent font-bold">&lt; 12ms</span>
                </div>
                <div className="rounded-lg bg-surface border border-line px-2.5 py-1.5 text-ink text-[11px]">
                  <span>Step Check:</span>{" "}
                  <span className="text-success font-semibold">dL/dt = τ_net ✓</span>
                </div>
                <div className="text-[10px] text-ink-2 border-t border-line/60 pt-2 flex justify-between">
                  <span>Guidance: Nudge to torque equation</span>
                  <span className="text-success font-semibold">Active</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-line/60 text-[11px] text-accent font-medium">
              Develops independent JEE Advanced problem solving.
            </div>
          </div>

          {/* Phase 03 */}
          <div
            data-reveal
            className="relative flex flex-col justify-between rounded-3xl border border-line bg-surface p-7 sm:p-8 shadow-xs hover:border-line-strong hover:shadow-md transition-all duration-300"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-surface font-mono text-sm font-bold shadow-xs">
                  03
                </span>
                {/* Spaced Retrieval Memory Loop Technical SVG */}
                <svg className="h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path d="M4 12a8 8 0 0114.93-4M20 12a8 8 0 01-14.93 4" strokeLinecap="round" />
                  <polyline points="18 4 20 8 16 8" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="6 20 4 16 8 16" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>

              <span className="mt-6 inline-block text-[11px] font-bold uppercase tracking-wider text-accent">
                Phase 3: Spaced Retrieval
              </span>
              <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Retain it until exam day
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-ink-2 leading-relaxed">
                Episodic memory saves your misconceptions. Spaced review algorithms schedule targeted revision cards right as memory traces begin to decay.
              </p>

              {/* Technical Schematic Flow Micro-Diagram */}
              <div className="mt-6 rounded-2xl border border-line bg-canvas p-3.5 space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-muted">
                  <span>Forgetting Curve: Ebbinghaus Model</span>
                  <span className="text-warning font-semibold">T+24h</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted">Memory:</span>
                  <div className="h-1.5 flex-1 rounded-full bg-line overflow-hidden">
                    <div className="h-full w-4/5 bg-success rounded-full" />
                  </div>
                  <span className="text-xs font-semibold text-ink">92%</span>
                </div>
                <div className="text-[10px] text-muted border-t border-line/60 pt-2 flex justify-between">
                  <span>Next Warm-Up: 3 PYQ Variations</span>
                  <span className="text-ink font-semibold">Scheduled</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-line/60 text-[11px] text-muted">
              Picks up exactly where you left off tomorrow.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
