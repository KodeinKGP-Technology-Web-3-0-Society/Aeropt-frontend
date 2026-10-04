"use client";

import React from "react";
import * as onboarding from "@/lib/api/onboarding";
import type { CoverageDepth, SubjectDepth } from "@/lib/api/onboarding";
import { TOTAL_STEPS, useOnboardingState } from "./useOnboardingState";

const JOURNEY_OPTIONS: { id: onboarding.JourneyType; title: string; subtitle: string }[] = [
  {
    id: "fresh_start",
    title: "I'm starting fresh",
    subtitle: "Begin from the basics with a gentle pace.",
  },
  {
    id: "mid_journey",
    title: "I'm mid-journey",
    subtitle: "I've covered some of the syllabus already.",
  },
  {
    id: "revision_dropper",
    title: "I'm revising for the exam",
    subtitle: "Done the syllabus once. Focus on weak areas.",
  },
];

const SUBJECT_DEPTHS: { id: SubjectDepth; label: string }[] = [
  { id: "not_started", label: "Not started" },
  { id: "barely", label: "Weak" },
  { id: "moderate", label: "Okay" },
  { id: "strong", label: "Strong" },
];

const UNIT_DEPTHS: { id: CoverageDepth; label: string }[] = [
  { id: "barely", label: "Weak" },
  { id: "moderate", label: "Okay" },
  { id: "strong", label: "Strong" },
];

function SlideCard({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  loading = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="w-full max-w-[640px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="mb-2 text-[28px] font-semibold leading-tight text-ink">{title}</h2>
        {subtitle && <p className="mb-8 text-base text-ink-2">{subtitle}</p>}
        <div className="mb-10 space-y-4">{children}</div>
        <div className="flex gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="flex-1 py-3.5 rounded-lg border border-line-strong bg-hover text-base font-medium text-ink-2 disabled:opacity-50 hover:bg-active transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            disabled={nextDisabled || loading}
            onClick={onNext}
            className="flex-1 py-3.5 rounded-lg bg-accent hover:bg-accent-hover transition-colors disabled:opacity-50 text-white text-base font-semibold shadow-sm"
          >
            {loading ? "Saving…" : nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SegmentedChoice<T extends string>({
  value,
  options,
  onChange,
  groupLabel,
}: {
  value: T | "";
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  /**
   * These are toggle buttons, not a form control, so a `<label>` has nothing to
   * point at. A named group plus `aria-pressed` is what a screen reader can
   * actually announce ("Exam group, Main, pressed").
   */
  groupLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className={`grid gap-2`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={`py-2.5 rounded-lg text-[13px] font-medium border transition-colors ${
            value === opt.id
              ? "border-accent bg-accent/10 text-accent"
              : "border-line bg-surface text-ink-2 hover:border-accent/50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function OnboardingFlow() {
  const {
    state,
    setState,
    step,
    loading,
    saving,
    persisting,
    error,
    goToStep,
    advanceFrom,
    finishOnboarding,
    physicsUnits,
    showUnits,
  } = useOnboardingState();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-base text-muted">Setting up your plan…</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-canvas px-4 py-12 md:py-16 font-sans text-ink">
      <div className="max-w-[640px] mx-auto relative">
        <header className="mb-8">
          <h1 className="text-xl font-semibold text-ink">Set up your study plan</h1>
          <div className="mt-4 flex gap-1.5" aria-hidden>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i < step ? "bg-accent" : "bg-line"}`} />
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">
            Step {step} of {TOTAL_STEPS}
            {persisting ? " · Saving…" : ""}
          </p>
        </header>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger"
          >
            {error}
          </div>
        )}


        {step === 1 && (
          <SlideCard
            title="Your goals"
            subtitle="Tell us where you are starting from and which exam you are aiming for."
            onNext={() => void advanceFrom(1)}
            loading={persisting}
          >
            <div className="space-y-3">
              {JOURNEY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, journey_type: opt.id }))}
                  aria-pressed={state.journey_type === opt.id}
                  className={`flex w-full items-start justify-between gap-4 rounded-lg border px-4 py-3.5 text-left transition-colors ${
                    state.journey_type === opt.id ? "border-accent ring-1 ring-accent" : "border-line hover:border-accent/50"
                  }`}
                >
                  <span>
                    <span className="block font-semibold text-ink">{opt.title}</span>
                    <span className="mt-0.5 block text-sm text-ink-2">{opt.subtitle}</span>
                  </span>
                  <span
                    aria-hidden
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      state.journey_type === opt.id ? "border-accent bg-accent text-accent-on" : "border-line"
                    }`}
                  >
                    {state.journey_type === opt.id && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12l5 5L20 7" />
                      </svg>
                    )}
                  </span>
                </button>
              ))}
            </div>
            <div>
              <span className="text-[14px] font-medium text-ink block mb-2">Exam</span>
              <SegmentedChoice
                groupLabel="Exam"
                value={state.target_exam}
                options={[
                  { id: "JEE_MAINS", label: "Main" },
                  { id: "JEE_ADVANCED", label: "Advanced" },
                  { id: "BOTH", label: "Both" },
                ]}
                onChange={(id) => setState((s) => ({ ...s, target_exam: id }))}
              />
            </div>
            <div>
              <span className="text-[14px] font-medium text-ink block mb-2">Class</span>
              <SegmentedChoice
                groupLabel="Class"
                value={state.grade_level}
                options={[
                  { id: "CLASS_11", label: "Class 11" },
                  { id: "CLASS_12", label: "Class 12" },
                  { id: "DROPPER", label: "Dropper" },
                ]}
                onChange={(id) => setState((s) => ({ ...s, grade_level: id }))}
              />
            </div>
            <div>
              <label htmlFor="onboarding-target-year" className="text-[14px] font-medium text-ink block mb-2">
                Target year
              </label>
              <input
                id="onboarding-target-year"
                type="number"
                value={state.target_year}
                onChange={(e) =>
                  setState((s) => ({ ...s, target_year: Number(e.target.value) || s.target_year }))
                }
                className="w-full bg-surface border border-line-strong rounded-lg px-4 py-3 text-[15px] text-ink focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all"
              />
            </div>
          </SlideCard>
        )}

        {step === 2 && (
          <SlideCard
            title="How much do you know?"
            subtitle="A quick self-check, not a test. Tap how confident you feel in each subject."
            onBack={() => goToStep(1)}
            onNext={() => void advanceFrom(2)}
            loading={persisting}
          >
            <div className="divide-y divide-line">
              {onboarding.ONBOARDING_SUBJECTS.map((subject) => (
                <div key={subject} className="py-4 first:pt-0">
                  <p className="text-base font-medium text-ink mb-3">{subject}</p>
                  <SegmentedChoice
                    groupLabel={`${subject} confidence`}
                    value={state.subject_proficiency[subject] ?? "not_started"}
                    options={SUBJECT_DEPTHS}
                    onChange={(id) =>
                      setState((s) => ({
                        ...s,
                        subject_proficiency: { ...s.subject_proficiency, [subject]: id },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            {showUnits && (
              <div className="pt-2">
                <p className="text-base font-medium text-ink mb-1">Fine-tune Physics</p>
                <p className="text-sm text-muted mb-4">Optional. Rate broad topics, not every chapter.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {physicsUnits.map((unit) => (
                    <div key={unit.name} className="rounded-lg border border-line p-4">
                      <p className="text-sm font-medium text-ink mb-3">{unit.name}</p>
                      <SegmentedChoice
                        groupLabel={`${unit.name} coverage`}
                        value={state.unit_coverage[unit.name] ?? ""}
                        options={UNIT_DEPTHS}
                        onChange={(id) =>
                          setState((s) => ({
                            ...s,
                            unit_coverage: { ...s.unit_coverage, [unit.name]: id },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SlideCard>
        )}

        {step === 3 && (
          <SlideCard
            title="Study preferences"
            subtitle="We'll size your daily queue and teaching depth to fit."
            onBack={() => goToStep(2)}
            onNext={() => void finishOnboarding()}
            nextLabel="Start studying"
            loading={saving}
          >
            <div>
              <label htmlFor="onboarding-daily-goal" className="text-base font-medium text-ink block mb-4">
                Daily study goal:{" "}
                <span className="text-accent font-bold">
                  {state.daily_goal_minutes === 120 ? "120+" : state.daily_goal_minutes} min
                </span>
              </label>
              <input
                id="onboarding-daily-goal"
                type="range"
                min={15}
                max={120}
                step={15}
                value={state.daily_goal_minutes}
                onChange={(e) =>
                  setState((s) => ({ ...s, daily_goal_minutes: Number(e.target.value) }))
                }
                className="w-full accent-accent"
              />
            </div>
            <div>
              <span className="text-[14px] font-medium text-ink block mb-3">Preferred depth</span>
              <SegmentedChoice
                groupLabel="Preferred depth"
                value={state.preferred_depth}
                options={[
                  { id: "quick", label: "Quick" },
                  { id: "standard", label: "Standard" },
                  { id: "deep", label: "Deep" },
                ]}
                onChange={(id) => setState((s) => ({ ...s, preferred_depth: id }))}
              />
              <p className="text-sm text-muted mt-3">
                {state.preferred_depth === "quick"
                  ? "Shorter explanations and fewer slides."
                  : state.preferred_depth === "deep"
                    ? "More intuition and an extra worked angle."
                    : "Balanced explanations at a steady pace."}
              </p>
            </div>
          </SlideCard>
        )}
      </div>
    </div>
  );
}
