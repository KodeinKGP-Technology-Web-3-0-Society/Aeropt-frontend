"use client";

import type { ClassroomReadiness, ReadinessLabel } from "@/lib/api/classroom";
import { useHomeState } from "@/components/home/useHomeState";
import Link from "next/link";
import { useMemo } from "react";

function formatReadinessLabel(label: ReadinessLabel): string {
  if (label === "ready") return "Exam Ready";
  if (label === "building") return "Building Foundations";
  return "Early Stages";
}

function ReadinessRing({ score }: { score: number }) {
  const size = 200;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  let color = "#3b82f6"; // blue
  if (score >= 75) color = "#10b981"; // green
  else if (score > 0 && score < 40) color = "#f59e0b"; // amber

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-hover)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl font-bold tabular-nums text-ink">{score}</span>
        <span className="text-xs font-semibold text-muted mt-1">out of 100</span>
      </div>
    </div>
  );
}

export default function ReadinessContent() {
  const { home, loading, error, reload } = useHomeState();

  if (loading) {
    return (
      <div className="flex-1 px-6 pb-6 pt-24 lg:px-8 lg:pb-8 overflow-y-auto animate-pulse" aria-busy="true">
        <div className="mx-auto max-w-3xl space-y-12">
          <div className="h-10 w-48 rounded-lg bg-hover" />
          <div className="flex justify-center"><div className="h-48 w-48 rounded-full bg-hover" /></div>
          <div className="h-24 rounded-xl bg-hover" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 pb-6 pt-24 lg:px-8 lg:pb-8">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
          <h3 className="mb-2 text-base font-bold text-ink">Failed to load readiness</h3>
          <p className="mb-5 text-sm text-muted">{error}</p>
          <button type="button" onClick={reload} className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-surface hover:bg-ink/90 transition-colors">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { readiness } = home;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const streak = (home as any).streak ?? { current_streak: 0, week: [] };
  const insights = (home as any).insights ?? [];
  /* eslint-enable */

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-16 pt-24 lg:px-8 lg:pb-20">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center sm:text-left">
          <Link href="/home" className="mb-6 inline-flex items-center gap-2 text-[11px] font-bold text-muted hover:text-ink transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Overall Readiness
          </h1>
          <p className="mt-2 text-sm text-muted max-w-xl mx-auto sm:mx-0">
            Based on your problem-solving accuracy, speed, and conceptual mastery across the entire JEE syllabus.
          </p>
        </header>

        <div className="mb-12 flex flex-col items-center justify-center gap-6 rounded-2xl border border-line bg-surface py-12 px-6">
          <ReadinessRing score={readiness.score} />
          <div className="text-center">
            <h2 className="text-xl font-bold text-ink">{formatReadinessLabel(readiness.label)}</h2>
            <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
              {readiness.score >= 75 
                ? "You're consistently performing at an exam-ready level. Focus on full-length mocks."
                : readiness.score >= 40 
                ? "You have a solid foundation but need to improve accuracy and speed on harder topics."
                : "You are just getting started. Focus on mastering the core concepts and building your streak."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-surface p-6">
            <h3 className="text-[11px] font-bold text-muted mb-4">Current streak</h3>
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-bold text-ink">{streak.current_streak}</span>
              <span className="text-sm text-muted mb-1">days</span>
            </div>
            <p className="mt-3 text-xs text-muted leading-relaxed">
              Consistency is the highest predictor of exam success. The AI tutor adjusts its difficulty based on your momentum.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-6 flex flex-col">
            <h3 className="text-[11px] font-bold text-muted mb-4">What to work on</h3>
            {insights.length > 0 ? (
              <>
                <p className="text-sm font-semibold text-ink">{insights[0].title}</p>
                {insights[0]?.body && (
                  <p className="mt-2 text-xs text-muted leading-relaxed flex-1">{insights[0].body}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted flex-1">Complete more sessions for the AI to generate a detailed analysis of your performance patterns.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
