import React from "react";
import type { StudyMode, StudyPhase } from "@/lib/api/study";

const PHASES: { key: StudyPhase; label: string }[] = [
  { key: "learn", label: "Learn" },
  { key: "examples", label: "Examples" },
  { key: "practice", label: "Practice" },
  { key: "evaluation", label: "Results" },
];

export default function PhaseIndicator({ currentPhase, mode = "learn" }: { currentPhase: StudyPhase; mode?: StudyMode }) {
  // A practice-only session never has Learn or Examples.
  const steps = mode === "practice" ? PHASES.filter((p) => p.key === "practice" || p.key === "evaluation") : PHASES;
  const current = steps.findIndex((p) => p.key === (currentPhase === "completed" ? "evaluation" : currentPhase));

  return (
    <ol className="flex items-center gap-1.5" aria-label="Study progress">
      {steps.map((phase, i) => {
        const done = i < current || currentPhase === "completed";
        const active = i === current && currentPhase !== "completed";
        return (
          <li key={phase.key} className="flex items-center gap-1.5">
            <span
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-300 ${
                active
                  ? "bg-accent-soft text-accent"
                  : done
                    ? "text-ink-2"
                    : "text-muted"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                  active
                    ? "bg-accent text-accent-on"
                    : done
                      ? "bg-ink-2/15 text-ink-2"
                      : "border border-line text-muted"
                }`}
              >
                {done ? (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={active ? "" : "max-sm:hidden"}>{phase.label}</span>
            </span>
            {i < steps.length - 1 && <span className={`h-px w-3 sm:w-5 ${done ? "bg-ink-2/30" : "bg-line"}`} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
