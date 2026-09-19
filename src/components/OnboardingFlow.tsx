"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import * as onboarding from "@/lib/onboarding";
import type {
  CoverageDepth,
  MilestoneKind,
  OnboardingState,
  SubjectDepth,
  SyllabusSubject,
} from "@/lib/onboarding";
import { SlideDots } from "@/components/slides/SlideShell";

const TOTAL_STEPS = onboarding.TOTAL_ONBOARDING_STEPS;
const DRAFT_KEY = "prepwise_onboarding_draft";
const DRAFT_VERSION = 3;

type OnboardingDraft = {
  version?: number;
  state: OnboardingState;
  step: number;
};

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

function loadDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as OnboardingDraft;
    const fromLegacy = (draft.version ?? 0) < DRAFT_VERSION;
    const step = onboarding.migrateOnboardingStep(draft.step, fromLegacy);
    const state: OnboardingState = {
      ...onboarding.DEFAULT_ONBOARDING,
      ...draft.state,
      subject_proficiency: {
        ...onboarding.DEFAULT_ONBOARDING.subject_proficiency,
        ...(draft.state?.subject_proficiency || {}),
      },
      unit_coverage: draft.state?.unit_coverage ?? {},
      current_step: step,
    };
    return { version: DRAFT_VERSION, state, step };
  } catch {
    return null;
  }
}

function saveDraft(draft: OnboardingDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, version: DRAFT_VERSION }));
}

function clearDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DRAFT_KEY);
}

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
      <div className="bg-surface border border-line rounded-[24px] p-8 shadow-[var(--shadow-card)]">
        <h2 className="text-[38px] leading-tight font-bold text-ink mb-3">{title}</h2>
        {subtitle && <p className="text-base text-muted mb-8">{subtitle}</p>}
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
            {loading ? "Setting up..." : nextLabel}
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
              : "border-line-strong bg-hover text-muted hover:border-accent/40"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function OnboardingFlow() {
  const router = useRouter();
  const { refreshOnboardingStatus } = useApp();
  const [userId, setUserId] = useState<string | null>(null);
  const [state, setState] = useState<OnboardingState>(onboarding.DEFAULT_ONBOARDING);
  const [subjects, setSubjects] = useState<SyllabusSubject[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [persisting, setPersisting] = useState(false);
  const [error, setError] = useState("");
  const persistLock = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await onboarding.fetchMe();
        if (me.onboarding_completed) {
          router.replace("/dashboard");
          return;
        }
        setUserId(me.id);
        const draft = loadDraft();
        if (onboarding.hasServerOnboardingProgress(me)) {
          const serverState = onboarding.meToOnboardingState(me);
          setState(serverState);
          setStep(serverState.current_step);
        } else if (draft) {
          setState(draft.state);
          setStep(draft.step);
        } else {
          const initial = onboarding.meToOnboardingState(me);
          setState(initial);
          setStep(initial.current_step > 0 ? initial.current_step : 1);
        }
        const outline = await onboarding.fetchSyllabusOutline();
        setSubjects(outline.subjects);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load onboarding");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [router]);

  useEffect(() => {
    if (loading) return;
    saveDraft({ version: DRAFT_VERSION, state, step });
  }, [state, step, loading]);

  const knowledgeState = useMemo(() => {
    const expanded = onboarding.expandUnitCoverage(state.unit_coverage, subjects);
    const baseline = onboarding.buildKnowledgeBaseline(state);
    return {
      ...state,
      covered_chapters: expanded.covered_chapters,
      self_assessed_coverage: expanded.self_assessed_coverage,
      diagnostic_baseline: baseline,
    };
  }, [state, subjects]);

  const goToStep = (nextStep: number) => {
    setError("");
    setState((s) => ({ ...s, current_step: nextStep }));
    setStep(nextStep);
  };

  const persistMilestone = async (
    kind: MilestoneKind,
    nextState: OnboardingState,
    nextStep: number
  ) => {
    if (!userId || persistLock.current) return;
    persistLock.current = true;
    setPersisting(true);
    try {
      await onboarding.persistOnboardingMilestone(userId, kind, nextState, nextStep);
      saveDraft({
        version: DRAFT_VERSION,
        state: { ...nextState, current_step: nextStep },
        step: nextStep,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save progress");
    } finally {
      persistLock.current = false;
      setPersisting(false);
    }
  };

  const advanceFrom = async (fromStep: number) => {
    const next = Math.min(fromStep + 1, TOTAL_STEPS);
    const nextState = {
      ...knowledgeState,
      current_step: next,
    };
    if (fromStep === 1) {
      await persistMilestone("target", nextState, next);
    } else if (fromStep === 2) {
      await persistMilestone("knowledge", nextState, next);
    }
    goToStep(next);
  };

  const finishOnboarding = async () => {
    if (!userId) return;
    setSaving(true);
    setError("");
    try {
      const finalState = { ...knowledgeState, current_step: TOTAL_STEPS };
      await persistMilestone("preferences", finalState, TOTAL_STEPS);
      await onboarding.completeOnboarding({
        profile: {
          target_exam: finalState.target_exam,
          target_year: finalState.target_year,
          grade_level: finalState.grade_level,
          daily_goal_minutes: finalState.daily_goal_minutes,
          preferred_depth: finalState.preferred_depth,
          onboarding_step: TOTAL_STEPS,
        },
        placement: {
          journey_type: finalState.journey_type,
          covered_chapters: finalState.covered_chapters,
          self_assessed_coverage: finalState.self_assessed_coverage,
          diagnostic_baseline: finalState.diagnostic_baseline,
        },
        snapshot: finalState as unknown as Record<string, unknown>,
        current_step: TOTAL_STEPS,
        onboarding_step: TOTAL_STEPS,
      });
      clearDraft();
      await refreshOnboardingStatus();
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not finish setup");
    } finally {
      setSaving(false);
    }
  };

  const physicsUnits = subjects.find((s) => s.name === "Physics")?.units ?? [];
  const showUnits = state.journey_type !== "fresh_start" && physicsUnits.length > 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-base text-muted">Setting up your classroom...</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-canvas px-4 py-12 md:py-16 font-sans text-ink">
      <div className="max-w-[640px] mx-auto relative">
        <div className="flex items-center justify-between mb-10 min-h-[32px]">
          <span className="w-10" />
          <div className="text-center">
            <p className="text-[14px] uppercase tracking-widest text-accent font-semibold">
              Enter the Classroom
            </p>
            <p className="text-sm text-muted mt-1">
              Step {step} of {TOTAL_STEPS}
              {persisting ? " · Saving…" : ""}
            </p>
          </div>
          <span className="w-10" />
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 text-xs text-red-400 bg-red-950/20 border border-red-900/50 rounded-lg p-2.5 text-center"
          >
            {error}
          </div>
        )}

        <div className="mb-6">
          <SlideDots total={TOTAL_STEPS} current={step - 1} />
        </div>

        {step === 1 && (
          <SlideCard
            title="Your goals"
            subtitle="Where you are heading — we'll tune teaching to this."
            onNext={() => void advanceFrom(1)}
            loading={persisting}
          >
            <div className="space-y-3">
              {JOURNEY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, journey_type: opt.id }))}
                  className={`w-full text-left p-5 rounded-xl border transition-all duration-200 ${
                    state.journey_type === opt.id
                      ? "border-accent bg-accent/10 shadow-none"
                      : "border-line-strong bg-hover hover:border-accent/40"
                  }`}
                >
                  <p className="font-semibold text-[18px] text-ink">{opt.title}</p>
                  <p className="text-base text-muted mt-1">{opt.subtitle}</p>
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
            subtitle="A quick self-check. No quiz — just tap how confident you feel."
            onBack={() => goToStep(1)}
            onNext={() => void advanceFrom(2)}
            loading={persisting}
          >
            <div className="space-y-5">
              {onboarding.ONBOARDING_SUBJECTS.map((subject) => (
                <div key={subject} className="p-4 rounded-xl border border-line-strong bg-hover">
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
                    <div key={unit.name} className="p-4 rounded-xl border border-line-strong bg-hover">
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
            nextLabel="Enter Classroom"
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
                    : "Balanced teaching — our default pace."}
              </p>
            </div>
          </SlideCard>
        )}
      </div>
    </div>
  );
}
