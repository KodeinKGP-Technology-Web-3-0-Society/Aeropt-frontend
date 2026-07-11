"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import * as onboarding from "@/lib/onboarding";
import type {
  ChapterMeta,
  CoverageDepth,
  DiagnosticQuestion,
  JourneyType,
  LearningSource,
  OnboardingState,
  PlacementPlan,
} from "@/lib/onboarding";
import * as auth from "@/lib/auth";

const TOTAL_STEPS = 8;
const DRAFT_KEY = "prepwise_onboarding_draft";

type LocalDiagnosticAnswer = {
  concept_id: string;
  content_id: string;
  is_correct: boolean;
};

type OnboardingDraft = {
  state: OnboardingState;
  step: number;
  diagnosticAnswers: LocalDiagnosticAnswer[];
};

const JOURNEY_OPTIONS: { id: JourneyType; title: string; subtitle: string }[] = [
  {
    id: "fresh_start",
    title: "I'm starting fresh",
    subtitle: "Begin from chapter one with a gentle pace.",
  },
  {
    id: "mid_journey",
    title: "I'm mid-journey",
    subtitle: "I've covered some syllabus already.",
  },
  {
    id: "revision_dropper",
    title: "I'm revising for the exam",
    subtitle: "Done the syllabus once — focus on weak areas.",
  },
];

function loadDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as OnboardingDraft) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: OnboardingDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DRAFT_KEY);
}

function buildDiagnosticBaseline(
  conceptScores: Record<string, number>,
  questions: DiagnosticQuestion[]
) {
  if (Object.keys(conceptScores).length === 0) return {};
  const chapterBuckets: Record<string, number[]> = {};
  for (const question of questions) {
    const score = conceptScores[question.concept_id];
    if (score !== undefined && question.chapter) {
      chapterBuckets[question.chapter] = chapterBuckets[question.chapter] || [];
      chapterBuckets[question.chapter].push(score);
    }
  }
  const chapter_scores: Record<string, number> = {};
  for (const [chapter, values] of Object.entries(chapterBuckets)) {
    chapter_scores[chapter] =
      Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 1000) / 1000;
  }
  const values = Object.values(conceptScores);
  const overall = Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 1000) / 1000;
  return {
    concept_scores: conceptScores,
    chapter_scores,
    probed_chapters: Object.keys(chapter_scores),
    overall,
    source: "onboarding_v1",
  };
}

function canSkipStep(step: number): boolean {
  return step === 5 || step === 6 || step === 7;
}

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i + 1 === step ? "w-6 bg-[#6258ff]" : i + 1 < step ? "w-1.5 bg-[#6258ff]/50" : "w-1.5 bg-slate-600/40"
          }`}
        />
      ))}
    </div>
  );
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
    <div className="w-full max-w-lg mx-auto">
      <div className="dark:bg-[#0d0e16] bg-white/90 border dark:border-[#1b1c2b] border-slate-200 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-1">{title}</h2>
        {subtitle && (
          <p className="text-sm dark:text-slate-400 text-slate-500 mb-5">{subtitle}</p>
        )}
        <div className="mb-6">{children}</div>
        <div className="flex gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border dark:border-[#1b1c2b] border-slate-200 text-sm font-medium dark:text-slate-300 text-slate-600 disabled:opacity-50"
            >
              Back
            </button>
          )}
          <button
            type="button"
            disabled={nextDisabled || loading}
            onClick={onNext}
            className="flex-1 py-2.5 rounded-lg bg-[#6258ff] hover:bg-[#5045ff] disabled:opacity-50 text-white text-sm font-semibold"
          >
            {loading ? "Setting up..." : nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingFlow() {
  const router = useRouter();
  const { refreshOnboardingStatus } = useApp();
  const [userId, setUserId] = useState<string | null>(null);
  const [state, setState] = useState<OnboardingState>(onboarding.DEFAULT_ONBOARDING);
  const [chapters, setChapters] = useState<ChapterMeta[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [placementPlan, setPlacementPlan] = useState<PlacementPlan | null>(null);
  const [diagQuestions, setDiagQuestions] = useState<DiagnosticQuestion[]>([]);
  const [diagIndex, setDiagIndex] = useState(0);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagGrading, setDiagGrading] = useState(false);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<LocalDiagnosticAnswer[]>([]);
  const [probedConceptScores, setProbedConceptScores] = useState<Record<string, number>>({});
  const [completedDiagQuestions, setCompletedDiagQuestions] = useState<DiagnosticQuestion[]>([]);

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
        if (draft) {
          setState(draft.state);
          setStep(draft.step);
          setDiagnosticAnswers(draft.diagnosticAnswers);
        } else {
          setState(onboarding.meToOnboardingState(me));
          setStep(me.onboarding_step > 0 ? me.onboarding_step : 1);
        }
        const ch = await onboarding.fetchChapters();
        setChapters(ch);
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
    saveDraft({ state, step, diagnosticAnswers });
  }, [state, step, diagnosticAnswers, loading]);

  useEffect(() => {
    if (loading || step !== 7) return;
    const loadPlan = async () => {
      try {
        const plan = await onboarding.fetchPlacementPlan({
          journey_type: state.journey_type,
          covered_chapters: state.covered_chapters,
          self_assessed_coverage: state.self_assessed_coverage,
        });
        setPlacementPlan(plan);
      } catch {
        setPlacementPlan(null);
      }
    };
    void loadPlan();
  }, [loading, step, state.journey_type, state.covered_chapters, state.self_assessed_coverage]);

  const skipCoverageSteps = state.journey_type === "fresh_start";
  const skipDiagnosticStep =
    state.journey_type !== "fresh_start" && state.covered_chapters.length > 0;

  const goToStep = (nextStep: number) => {
    setError("");
    setState((s) => ({ ...s, current_step: nextStep }));
    setStep(nextStep);
  };

  const goNext = () => {
    if (step === 2 && skipCoverageSteps) {
      goToStep(5);
      return;
    }
    if (step === 6 && skipDiagnosticStep) {
      goToStep(8);
      return;
    }
    goToStep(Math.min(step + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    let prev = step - 1;
    if (prev === 4 && skipCoverageSteps) prev = 2;
    if (prev === 3 && skipCoverageSteps) prev = 2;
    if (prev === 7 && skipDiagnosticStep) prev = 6;
    if (prev === 8 && skipDiagnosticStep) prev = 6;
    goToStep(Math.max(1, prev));
  };

  const skipStep = () => {
    if (step === 7) {
      setDiagQuestions([]);
      setDiagIndex(0);
    }
    goNext();
  };

  const finishOnboarding = async () => {
    if (!userId) return;
    setSaving(true);
    setError("");
    try {
      const diagnostic_baseline =
        Object.keys(probedConceptScores).length > 0
          ? buildDiagnosticBaseline(
              probedConceptScores,
              completedDiagQuestions.length > 0 ? completedDiagQuestions : diagQuestions
            )
          : diagnosticAnswers.length > 0
            ? buildDiagnosticBaseline(
                Object.fromEntries(
                  diagnosticAnswers.map((a) => [
                    a.concept_id,
                    a.is_correct ? 0.65 : 0.35,
                  ])
                ),
                []
              )
            : state.diagnostic_baseline;

      const result = await onboarding.completeOnboarding({
        profile: {
          target_exam: state.target_exam,
          target_year: state.target_year,
          grade_level: state.grade_level,
          daily_goal_minutes: state.daily_goal_minutes,
          preferred_depth: state.preferred_depth,
          onboarding_step: 8,
        },
        placement: {
          journey_type: state.journey_type,
          learning_source: state.learning_source,
          covered_chapters: state.covered_chapters,
          self_assessed_coverage: state.self_assessed_coverage,
          diagnostic_baseline,
        },
        snapshot: { ...state, diagnostic_baseline } as unknown as Record<string, unknown>,
        current_step: 8,
        onboarding_step: 8,
      });
      clearDraft();
      await refreshOnboardingStatus();
      router.replace("/dashboard");
      void result;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not enter sandbox");
    } finally {
      setSaving(false);
    }
  };

  const startDiagnostic = async () => {
    const supabaseId = auth.getSupabaseUserId();
    if (!supabaseId) {
      setError("Profile link not ready — refresh and try again.");
      return;
    }
    setDiagLoading(true);
    setError("");
    try {
      const plan =
        placementPlan ??
        (await onboarding.fetchPlacementPlan({
          journey_type: state.journey_type,
          covered_chapters: state.covered_chapters,
          self_assessed_coverage: state.self_assessed_coverage,
        }));
      setPlacementPlan(plan);
      if (plan.total_probes === 0) {
        setError("No diagnostic probes available for your selection.");
        return;
      }
      const data = await onboarding.startDiagnostic(supabaseId, { probes: plan.probes });
      setDiagQuestions(data.questions);
      setDiagIndex(0);
      setDiagnosticAnswers([]);
      setProbedConceptScores({});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Diagnostic unavailable");
    } finally {
      setDiagLoading(false);
    }
  };

  const gradeDiagnostic = async (isCorrect: boolean) => {
    const q = diagQuestions[diagIndex];
    const supabaseId = auth.getSupabaseUserId();
    if (!q || !supabaseId || diagGrading) return;

    setDiagGrading(true);
    setError("");
    try {
      const result = await onboarding.submitDiagnosticAnswer({
        user_id: supabaseId,
        concept_id: q.concept_id,
        content_id: q.content_id,
        is_correct: isCorrect,
      });

      const nextScores = {
        ...probedConceptScores,
        [q.concept_id]: result.concept_scores[q.concept_id] ?? (isCorrect ? 0.65 : 0.35),
      };
      setProbedConceptScores(nextScores);

      const nextAnswers = [
        ...diagnosticAnswers,
        { concept_id: q.concept_id, content_id: q.content_id, is_correct: isCorrect },
      ];
      setDiagnosticAnswers(nextAnswers);

      const nextIndex = diagIndex + 1;
      if (nextIndex >= diagQuestions.length) {
        const baseline = buildDiagnosticBaseline(nextScores, diagQuestions);
        setCompletedDiagQuestions(diagQuestions);
        setState((prev) => ({ ...prev, diagnostic_baseline: baseline }));
        setDiagQuestions([]);
        setDiagIndex(0);
      } else {
        setDiagIndex(nextIndex);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not record answer");
    } finally {
      setDiagGrading(false);
    }
  };

  const revealCards = useMemo(() => {
    const target =
      state.target_exam === "JEE_ADVANCED"
        ? "JEE Advanced"
        : state.target_exam === "JEE_MAINS"
          ? "JEE Main"
          : "JEE Main + Advanced";
    const baseline = state.diagnostic_baseline as {
      overall?: number;
      chapter_scores?: Record<string, number>;
      probed_chapters?: string[];
    };
    const cards = [
      `Your target: ${target} ${state.target_year}`,
      `You've covered ${state.covered_chapters.length}/${chapters.length || 12} Physics chapters`,
      state.journey_type === "fresh_start"
        ? `${chapters.reduce((sum, ch) => sum + ch.concept_count, 0) || 33} concepts ready to learn`
        : state.covered_chapters.length > 0
          ? `${state.covered_chapters.length} chapter${state.covered_chapters.length === 1 ? "" : "s"} marked — starting from your gaps`
          : "Your path starts from chapter one",
      `Daily rhythm: ${state.daily_goal_minutes} min · ${state.preferred_depth} depth`,
    ];

    if (typeof baseline.overall === "number") {
      cards.splice(3, 0, `Diagnostic baseline: ~${Math.round(baseline.overall * 100)}% overall`);
    }

    const chapterScores = baseline.chapter_scores || {};
    const probed = new Set(baseline.probed_chapters || []);
    const snapshots = Object.entries(chapterScores)
      .map(([chapter, score]) => ({
        chapter,
        pct: Math.round(score * 100),
        probed: probed.has(chapter),
      }))
      .sort((a, b) => a.pct - b.pct);

    if (snapshots.length > 0) {
      const weak = snapshots.filter((s) => s.pct < 45).map((s) => s.chapter);
      const strong = snapshots.filter((s) => s.pct >= 60).map((s) => s.chapter);
      if (weak.length > 0) {
        cards.push(`Focus chapters: ${weak.slice(0, 2).join(", ")}`);
      }
      if (strong.length > 0) {
        cards.push(`Strong areas: ${strong.slice(0, 2).join(", ")}`);
      }
    }

    cards.push("First up: your personalized learning path");
    return cards;
  }, [state, chapters.length]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center dark:bg-[#05060c] bg-slate-50">
        <p className="text-sm dark:text-slate-400 text-slate-500">Setting up your classroom...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-[#05060c] bg-slate-50 px-4 py-8 font-sans dark:text-slate-100 text-slate-900">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#6258ff]/10 blur-[120px] pointer-events-none" />
      <div className="max-w-lg mx-auto relative">
        <div className="flex items-center justify-between mb-6 min-h-[32px]">
          {canSkipStep(step) ? (
            <button
              type="button"
              onClick={skipStep}
              disabled={saving}
              className="text-sm font-medium dark:text-slate-400 text-slate-500 hover:dark:text-slate-200 hover:text-slate-800 disabled:opacity-50"
            >
              Skip
            </button>
          ) : (
            <span className="w-10" />
          )}
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-widest dark:text-slate-500 text-slate-400 font-semibold">
              Enter the Sandbox
            </p>
            <p className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
              Step {step} of {TOTAL_STEPS}
            </p>
          </div>
          <span className="w-10" />
        </div>

        {error && (
          <div className="mb-4 text-xs text-red-400 bg-red-950/20 border border-red-900/50 rounded-lg p-2.5 text-center">
            {error}
          </div>
        )}

        <StepDots step={step} />

        {step === 1 && (
          <SlideCard title="Welcome to PrepWise" subtitle="Tell us where you are on your JEE journey." onNext={goNext}>
            <div className="space-y-3">
              {JOURNEY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, journey_type: opt.id }))}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    state.journey_type === opt.id
                      ? "border-[#6258ff] bg-[#6258ff]/10"
                      : "dark:border-[#1b1c2b] border-slate-200 dark:hover:border-slate-600"
                  }`}
                >
                  <p className="font-semibold text-sm">{opt.title}</p>
                  <p className="text-xs dark:text-slate-400 text-slate-500 mt-1">{opt.subtitle}</p>
                </button>
              ))}
            </div>
          </SlideCard>
        )}

        {step === 2 && (
          <SlideCard
            title="Your target"
            subtitle="We'll tune content depth and PYQ mix to this."
            onBack={goBack}
            onNext={goNext}
          >
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                  Exam
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(["JEE_MAINS", "JEE_ADVANCED", "BOTH"] as const).map((exam) => (
                    <button
                      key={exam}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, target_exam: exam }))}
                      className={`py-2 rounded-lg text-xs font-medium border ${
                        state.target_exam === exam
                          ? "border-[#6258ff] bg-[#6258ff]/15"
                          : "dark:border-[#1b1c2b] border-slate-200"
                      }`}
                    >
                      {exam === "BOTH" ? "Both" : exam === "JEE_MAINS" ? "Main" : "Advanced"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                  Class
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(["CLASS_11", "CLASS_12", "DROPPER"] as const).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, grade_level: grade }))}
                      className={`py-2 rounded-lg text-xs font-medium border ${
                        state.grade_level === grade
                          ? "border-[#6258ff] bg-[#6258ff]/15"
                          : "dark:border-[#1b1c2b] border-slate-200"
                      }`}
                    >
                      {grade === "DROPPER" ? "Dropper" : grade.replace("CLASS_", "Class ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                  Target year
                </label>
                <input
                  type="number"
                  value={state.target_year}
                  onChange={(e) =>
                    setState((s) => ({ ...s, target_year: Number(e.target.value) || s.target_year }))
                  }
                  className="w-full mt-2 dark:bg-[#07080d] bg-white border dark:border-[#1b1c2b] border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </SlideCard>
        )}

        {step === 3 && !skipCoverageSteps && (
          <SlideCard
            title="Syllabus coverage"
            subtitle="Which Physics chapters have you studied?"
            onBack={goBack}
            onNext={goNext}
          >
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
              {chapters.map((ch) => {
                const checked = state.covered_chapters.includes(ch.name);
                return (
                  <label
                    key={ch.name}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                      checked ? "border-[#6258ff]/60 bg-[#6258ff]/8" : "dark:border-[#1b1c2b] border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setState((s) => ({
                          ...s,
                          covered_chapters: checked
                            ? s.covered_chapters.filter((c) => c !== ch.name)
                            : [...s.covered_chapters, ch.name],
                        }))
                      }
                      className="accent-[#6258ff]"
                    />
                    <span className="text-sm flex-1">{ch.name}</span>
                    {ch.concept_count > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full dark:bg-slate-800 bg-slate-100 dark:text-slate-400 text-slate-500">
                        {ch.concept_count} concepts
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </SlideCard>
        )}

        {step === 4 && !skipCoverageSteps && (
          <SlideCard
            title="Confidence per chapter"
            subtitle="How well do you know each covered chapter?"
            onBack={goBack}
            onNext={goNext}
            nextDisabled={state.covered_chapters.length === 0}
          >
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {state.covered_chapters.map((ch) => (
                <div key={ch}>
                  <p className="text-sm font-medium mb-2">{ch}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["barely", "moderate", "strong"] as CoverageDepth[]).map((depth) => (
                      <button
                        key={depth}
                        type="button"
                        onClick={() =>
                          setState((s) => ({
                            ...s,
                            self_assessed_coverage: {
                              ...s.self_assessed_coverage,
                              [ch]: depth,
                            },
                          }))
                        }
                        className={`py-1.5 rounded-lg text-xs capitalize border ${
                          state.self_assessed_coverage[ch] === depth
                            ? "border-[#6258ff] bg-[#6258ff]/15"
                            : "dark:border-[#1b1c2b] border-slate-200"
                        }`}
                      >
                        {depth}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SlideCard>
        )}

        {step === 5 && (
          <SlideCard title="Where do you study from?" onBack={goBack} onNext={goNext}>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["school", "School"],
                  ["coaching", "Coaching"],
                  ["self_study", "Self-study"],
                  ["mixed", "Mixed"],
                ] as [LearningSource, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, learning_source: id }))}
                  className={`py-3 rounded-xl text-sm font-medium border ${
                    state.learning_source === id
                      ? "border-[#6258ff] bg-[#6258ff]/15"
                      : "dark:border-[#1b1c2b] border-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </SlideCard>
        )}

        {step === 6 && (
          <SlideCard
            title="Study rhythm"
            subtitle="We'll size sessions to fit your day."
            onBack={goBack}
            onNext={goNext}
          >
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium">
                  Daily study goal: {state.daily_goal_minutes} min
                </label>
                <input
                  type="range"
                  min={15}
                  max={120}
                  step={15}
                  value={state.daily_goal_minutes}
                  onChange={(e) =>
                    setState((s) => ({ ...s, daily_goal_minutes: Number(e.target.value) }))
                  }
                  className="w-full mt-3 accent-[#6258ff]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider dark:text-slate-400 text-slate-500">
                  Preferred depth
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(["quick", "standard", "deep"] as const).map((depth) => (
                    <button
                      key={depth}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, preferred_depth: depth }))}
                      className={`py-2 rounded-lg text-xs capitalize border ${
                        state.preferred_depth === depth
                          ? "border-[#6258ff] bg-[#6258ff]/15"
                          : "dark:border-[#1b1c2b] border-slate-200"
                      }`}
                    >
                      {depth}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SlideCard>
        )}

        {step === 7 && (
          <SlideCard
            title="Quick diagnostic"
            subtitle={
              state.journey_type === "fresh_start"
                ? "Optional — quick check on your first chapters (~2 min)."
                : state.journey_type === "revision_dropper"
                  ? "One question per weak chapter to calibrate your sprint."
                  : "One question per covered chapter — ~2–3 min."
            }
            onBack={goBack}
            onNext={goNext}
            nextLabel="Continue"
          >
            {placementPlan && placementPlan.total_probes > 0 && diagQuestions.length === 0 && diagnosticAnswers.length === 0 && (
              <p className="text-xs dark:text-slate-400 text-slate-500 mb-3">
                {placementPlan.total_probes} chapter probe{placementPlan.total_probes === 1 ? "" : "s"} · ~
                {placementPlan.estimated_minutes} min
              </p>
            )}
            {diagQuestions.length === 0 && diagnosticAnswers.length === 0 && (
              <button
                type="button"
                onClick={() => void startDiagnostic()}
                disabled={diagLoading || (placementPlan?.total_probes ?? 1) === 0}
                className="w-full py-3 rounded-xl bg-[#6258ff]/20 border border-[#6258ff]/40 text-sm font-semibold disabled:opacity-50"
              >
                {diagLoading ? "Loading questions..." : "Start diagnostic"}
              </button>
            )}
            {diagQuestions.length > 0 && (
              <div className="space-y-4">
                <p className="text-xs dark:text-slate-400 text-slate-500">
                  Chapter {diagIndex + 1} of {diagQuestions.length} · {diagQuestions[diagIndex]?.chapter}
                </p>
                <p className="text-[11px] dark:text-slate-500 text-slate-400">
                  {diagQuestions[diagIndex]?.concept_name}
                </p>
                <p className="text-sm leading-relaxed">{diagQuestions[diagIndex]?.question_text}</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => void gradeDiagnostic(true)}
                    disabled={diagGrading}
                    className="py-2.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-sm disabled:opacity-50"
                  >
                    Got it right
                  </button>
                  <button
                    type="button"
                    onClick={() => void gradeDiagnostic(false)}
                    disabled={diagGrading}
                    className="py-2.5 rounded-lg bg-red-600/20 border border-red-500/40 text-sm disabled:opacity-50"
                  >
                    Got it wrong
                  </button>
                </div>
              </div>
            )}
            {diagQuestions.length === 0 && diagnosticAnswers.length > 0 && (
              <p className="text-sm text-emerald-400">
                Diagnostic complete — {diagnosticAnswers.length} chapter
                {diagnosticAnswers.length === 1 ? "" : "s"} probed.
              </p>
            )}
          </SlideCard>
        )}

        {step === 8 && (
          <SlideCard
            title="Your Sandbox"
            subtitle="Here's your starting state — your classroom is ready."
            onBack={goBack}
            onNext={() => void finishOnboarding()}
            nextLabel="Enter Sandbox"
            loading={saving}
          >
            <div className="space-y-3">
              {revealCards.map((line, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl dark:bg-[#07080d] bg-slate-50 border dark:border-[#1b1c2b] border-slate-200 text-sm"
                >
                  {line}
                </div>
              ))}
            </div>
          </SlideCard>
        )}
      </div>
    </div>
  );
}
