"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import * as onboarding from "@/lib/onboarding";
import MarkdownMath from "@/components/MarkdownMath";
import LoadingSpinner from "@/components/LoadingSpinner";
import type {
  ChapterMeta,
  CoverageDepth,
  DiagnosticQuestion,
  JourneyType,
  MilestoneKind,
  OnboardingState,
  PlacementPlan,
} from "@/lib/onboarding";
import * as auth from "@/lib/auth";
import { SlideDots } from "@/components/slides/SlideShell";

const TOTAL_STEPS = onboarding.TOTAL_ONBOARDING_STEPS;
const DRAFT_KEY = "prepwise_onboarding_draft";
const DRAFT_VERSION = 2;

type LocalDiagnosticAnswer = {
  concept_id: string;
  content_id: string;
  is_correct: boolean;
};

type OnboardingDraft = {
  version?: number;
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
    subtitle: "Done the syllabus once. Focus on weak areas.",
  },
];

function loadDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as OnboardingDraft;
    const step = onboarding.migrateOnboardingStep(draft.step);
    const state: OnboardingState = {
      ...onboarding.DEFAULT_ONBOARDING,
      ...draft.state,
      current_step: step,
      daily_goal_minutes:
        draft.state?.daily_goal_minutes ?? onboarding.DEFAULT_ONBOARDING.daily_goal_minutes,
      preferred_depth:
        draft.state?.preferred_depth ?? onboarding.DEFAULT_ONBOARDING.preferred_depth,
    };
    return {
      version: DRAFT_VERSION,
      state,
      step,
      diagnosticAnswers: draft.diagnosticAnswers ?? [],
    };
  } catch {
    return null;
  }
}

function saveDraft(draft: OnboardingDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({ ...draft, version: DRAFT_VERSION })
  );
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
      <div className="bg-[#0d0e16] border border-[#2a2b3c] rounded-[24px] p-8 shadow-[0_8px_30px_rgb(98,88,255,0.06)]">
        <h2 className="text-[38px] leading-tight font-bold text-[#eff0ff] mb-3">{title}</h2>
        {subtitle && (
          <p className="text-base text-[#8f91a3] mb-8">{subtitle}</p>
        )}
        <div className="mb-10 space-y-4">{children}</div>
        <div className="flex gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="flex-1 py-3.5 rounded-lg border border-[#2f3242] bg-[#141622] text-base font-medium text-[#d7d8e8] disabled:opacity-50 hover:bg-[#1a1b28] transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            disabled={nextDisabled || loading}
            onClick={onNext}
            className="flex-1 py-3.5 rounded-lg bg-[#6258ff] hover:bg-[#5045ff] transition-colors disabled:opacity-50 text-white text-base font-semibold shadow-sm flex items-center justify-center"
          >
            {loading ? (
              <LoadingSpinner size={24} className="text-white" />
            ) : (
              nextLabel
            )}
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
  const [persisting, setPersisting] = useState(false);
  const [error, setError] = useState("");
  const [placementPlan, setPlacementPlan] = useState<PlacementPlan | null>(null);
  const [diagQuestions, setDiagQuestions] = useState<DiagnosticQuestion[]>([]);
  const [diagIndex, setDiagIndex] = useState(0);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagGrading, setDiagGrading] = useState(false);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<LocalDiagnosticAnswer[]>([]);
  const [probedConceptScores, setProbedConceptScores] = useState<Record<string, number>>({});
  const [completedDiagQuestions, setCompletedDiagQuestions] = useState<DiagnosticQuestion[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
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
          if (draft?.diagnosticAnswers?.length) {
            setDiagnosticAnswers(draft.diagnosticAnswers);
          }
        } else if (draft) {
          setState(draft.state);
          setStep(draft.step);
          setDiagnosticAnswers(draft.diagnosticAnswers);
        } else {
          const initial = onboarding.meToOnboardingState(me);
          setState(initial);
          setStep(initial.current_step > 0 ? initial.current_step : 1);
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
    saveDraft({ version: DRAFT_VERSION, state, step, diagnosticAnswers });
  }, [state, step, diagnosticAnswers, loading]);

  useEffect(() => {
    if (loading || step !== 6) return;
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
        diagnosticAnswers,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save progress");
    } finally {
      persistLock.current = false;
      setPersisting(false);
    }
  };

  const advanceFrom = async (fromStep: number) => {
    let next = Math.min(fromStep + 1, TOTAL_STEPS);
    if (fromStep === 2 && skipCoverageSteps) {
      next = 5;
    }

    const nextState = { ...state, current_step: next };

    if (fromStep === 2) {
      if (skipCoverageSteps) {
        // Target + empty placement in one pass when coverage is skipped
        if (userId && !persistLock.current) {
          persistLock.current = true;
          setPersisting(true);
          try {
            await onboarding.persistOnboardingMilestone(userId, "target", nextState, next);
            await onboarding.persistOnboardingMilestone(userId, "placement", nextState, next);
            saveDraft({
              version: DRAFT_VERSION,
              state: { ...nextState, current_step: next },
              step: next,
              diagnosticAnswers,
            });
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Could not save progress");
          } finally {
            persistLock.current = false;
            setPersisting(false);
          }
        }
      } else {
        await persistMilestone("target", nextState, next);
      }
    } else if (fromStep === 4) {
      await persistMilestone("placement", nextState, next);
    } else if (fromStep === 5) {
      await persistMilestone("rhythm", nextState, next);
    } else if (fromStep === 6) {
      await persistMilestone("diagnostic", nextState, next);
    }

    goToStep(next);
  };

  const goNext = () => {
    void advanceFrom(step);
  };

  const goBack = () => {
    let prev = step - 1;
    if (prev === 4 && skipCoverageSteps) prev = 2;
    if (prev === 3 && skipCoverageSteps) prev = 2;
    goToStep(Math.max(1, prev));
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
          onboarding_step: TOTAL_STEPS,
        },
        placement: {
          journey_type: state.journey_type,
          covered_chapters: state.covered_chapters,
          self_assessed_coverage: state.self_assessed_coverage,
          diagnostic_baseline,
        },
        snapshot: { ...state, diagnostic_baseline, current_step: TOTAL_STEPS } as unknown as Record<
          string,
          unknown
        >,
        current_step: TOTAL_STEPS,
        onboarding_step: TOTAL_STEPS,
      });
      clearDraft();
      await refreshOnboardingStatus();
      router.replace("/dashboard");
      void result;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not enter classroom");
    } finally {
      setSaving(false);
    }
  };

  const startDiagnostic = async () => {
    const supabaseId = auth.getSupabaseUserId();
    if (!supabaseId) {
      setError("Profile link not ready. Refresh and try again.");
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
      setShowAnswer(false);
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
        const nextState = { ...state, diagnostic_baseline: baseline };
        setState(nextState);
        setDiagQuestions([]);
        setDiagIndex(0);
        setShowAnswer(false);
        await persistMilestone("diagnostic", nextState, step);
      } else {
        setDiagIndex(nextIndex);
        setShowAnswer(false);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not record answer");
    } finally {
      setDiagGrading(false);
    }
  };

  const conceptsRemaining = useMemo(() => {
    const totalConcepts =
      chapters.reduce((sum, ch) => sum + ch.concept_count, 0) || 33;
    if (state.journey_type === "fresh_start") return totalConcepts;
    const coveredSet = new Set(state.covered_chapters);
    const coveredConcepts = chapters
      .filter((ch) => coveredSet.has(ch.name))
      .reduce((sum, ch) => sum + ch.concept_count, 0);
    return Math.max(8, totalConcepts - Math.floor(coveredConcepts * 0.5));
  }, [chapters, state.covered_chapters, state.journey_type]);

  const etaWeeks = onboarding.estimateWeeksPreview(
    state.daily_goal_minutes,
    conceptsRemaining
  );

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
      chapters.length > 0
        ? `You've covered ${state.covered_chapters.length}/${chapters.length} Physics chapters`
        : `You've covered ${state.covered_chapters.length} Physics chapter${state.covered_chapters.length === 1 ? "" : "s"}`,
      state.journey_type === "fresh_start"
        ? `${chapters.reduce((sum, ch) => sum + ch.concept_count, 0) || 33} concepts ready to learn`
        : state.covered_chapters.length > 0
          ? `${state.covered_chapters.length} chapter${state.covered_chapters.length === 1 ? "" : "s"} marked. Starting from your gaps.`
          : "Your path starts from chapter one",
      `Today's goal: ${state.daily_goal_minutes} min · ${state.preferred_depth} depth`,
      `At this pace: ~${etaWeeks} week${etaWeeks === 1 ? "" : "s"} to cover your path`,
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
  }, [state, chapters, etaWeeks]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#05060c]">
        <div className="mb-4">
          <LoadingSpinner size={64} className="text-[#6258ff]" />
        </div>
        <p className="text-base text-[#8f91a3] font-medium">Setting up your classroom...</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-[#05060c] px-4 py-12 md:py-16 font-sans text-[#eff0ff]">
      <div className="max-w-[640px] mx-auto relative">
        <div className="flex items-center justify-between mb-10 min-h-[32px]">
          <span className="w-10" />
          <div className="text-center">
            <p className="text-[14px] uppercase tracking-widest text-[#6258ff] font-semibold">
              Enter the Classroom
            </p>
            <p className="text-sm text-[#8f91a3] mt-1">
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
          <SlideCard title="Welcome to PrepWise" subtitle="Tell us where you are on your JEE journey." onNext={goNext}>
            <div className="space-y-3">
              {JOURNEY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setState((s) => ({ ...s, journey_type: opt.id }))}
                  className={`w-full text-left p-5 rounded-xl border transition-all duration-200 ${
                    state.journey_type === opt.id
                      ? "border-[#6258ff] bg-[#6258ff]/10 shadow-[0_2px_12px_rgb(98,88,255,0.15)]"
                      : "border-[#2f3242] bg-[#141622] hover:border-[#6258ff]/40"
                  }`}
                >
                  <p className="font-semibold text-[18px] text-[#eff0ff]">{opt.title}</p>
                  <p className="text-base text-[#8f91a3] mt-1">{opt.subtitle}</p>
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
            loading={persisting}
          >
            <div className="space-y-4">
              <div>
                <label className="text-[14px] font-medium text-[#eff0ff] block mb-2">
                  Exam
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["JEE_MAINS", "JEE_ADVANCED", "BOTH"] as const).map((exam) => (
                    <button
                      key={exam}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, target_exam: exam }))}
                      className={`py-3 rounded-lg text-[15px] font-medium border transition-colors ${
                        state.target_exam === exam
                          ? "border-[#6258ff] bg-[#6258ff]/10 text-[#6258ff]"
                          : "border-[#2f3242] bg-[#141622] text-[#8f91a3] hover:border-[#6258ff]/40"
                      }`}
                    >
                      {exam === "BOTH" ? "Both" : exam === "JEE_MAINS" ? "Main" : "Advanced"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[14px] font-medium text-[#eff0ff] block mb-2">
                  Class
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["CLASS_11", "CLASS_12", "DROPPER"] as const).map((grade) => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, grade_level: grade }))}
                      className={`py-3 rounded-lg text-[15px] font-medium border transition-colors ${
                        state.grade_level === grade
                          ? "border-[#6258ff] bg-[#6258ff]/10 text-[#6258ff]"
                          : "border-[#2f3242] bg-[#141622] text-[#8f91a3] hover:border-[#6258ff]/40"
                      }`}
                    >
                      {grade === "DROPPER" ? "Dropper" : grade.replace("CLASS_", "Class ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[14px] font-medium text-[#eff0ff] block mb-2">
                  Target year
                </label>
                <input
                  type="number"
                  value={state.target_year}
                  onChange={(e) =>
                    setState((s) => ({ ...s, target_year: Number(e.target.value) || s.target_year }))
                  }
                  className="w-full bg-[#0d0e16] border border-[#2f3242] rounded-lg px-4 py-3 text-[15px] text-[#eff0ff] focus:border-[#6258ff] focus:ring-1 focus:ring-[#6258ff] outline-none transition-all"
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
            <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {chapters.map((ch) => {
                const checked = state.covered_chapters.includes(ch.name);
                return (
                  <label
                    key={ch.name}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                      checked ? "border-[#6258ff] bg-[#6258ff]/10" : "border-[#2f3242] bg-[#141622] hover:border-[#6258ff]/40"
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
                      className="accent-[#6258ff] w-4 h-4"
                    />
                    <span className="text-base text-[#eff0ff] flex-1">{ch.name}</span>
                    {ch.concept_count > 0 && (
                      <span className="text-[12px] font-medium px-2.5 py-1 rounded-full bg-[#1a1b28] text-[#8f91a3]">
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
            loading={persisting}
          >
            <div className="space-y-6 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
              {state.covered_chapters.map((ch) => (
                <div key={ch}>
                  <p className="text-base font-medium text-[#eff0ff] mb-3">{ch}</p>
                  <div className="grid grid-cols-3 gap-3">
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
                        className={`py-2 rounded-lg text-sm font-medium capitalize border transition-colors ${
                          state.self_assessed_coverage[ch] === depth
                            ? "border-[#6258ff] bg-[#6258ff]/10 text-[#6258ff]"
                            : "border-[#2f3242] bg-[#141622] text-[#8f91a3] hover:border-[#6258ff]/40"
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
          <SlideCard
            title="Study rhythm"
            subtitle="We'll size your daily queue and teaching depth to fit."
            onBack={goBack}
            onNext={goNext}
            loading={persisting}
          >
            <div className="space-y-8">
              <div>
                <label className="text-base font-medium text-[#eff0ff] block mb-4">
                  Daily study goal:{" "}
                  <span className="text-[#6258ff] font-bold">
                    {state.daily_goal_minutes === 120 ? "120+" : state.daily_goal_minutes} min
                  </span>
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
                  className="w-full accent-[#6258ff]"
                />
                <p className="text-sm text-[#8f91a3] mt-3">
                  Preview: ~{etaWeeks} week{etaWeeks === 1 ? "" : "s"} on your path at this pace.
                </p>
              </div>
              <div>
                <label className="text-[14px] font-medium text-[#eff0ff] block mb-3">
                  Preferred depth
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["quick", "standard", "deep"] as const).map((depth) => (
                    <button
                      key={depth}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, preferred_depth: depth }))}
                      className={`py-3 rounded-lg text-[15px] font-medium capitalize border transition-colors ${
                        state.preferred_depth === depth
                          ? "border-[#6258ff] bg-[#6258ff]/10 text-[#6258ff]"
                          : "border-[#2f3242] bg-[#141622] text-[#8f91a3] hover:border-[#6258ff]/40"
                      }`}
                    >
                      {depth}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-[#8f91a3] mt-3">
                  {state.preferred_depth === "quick"
                    ? "Shorter explanations and fewer slides."
                    : state.preferred_depth === "deep"
                      ? "More intuition and an extra worked angle."
                      : "Balanced teaching — our default pace."}
                </p>
              </div>
            </div>
          </SlideCard>
        )}

        {step === 6 && (
          <SlideCard
            title="Quick diagnostic"
            subtitle={
              state.journey_type === "fresh_start"
                ? "Optional. Quick check on your first chapters (~2 min)."
                : state.journey_type === "revision_dropper"
                  ? "One question per weak chapter to calibrate your sprint."
                  : "One question per covered chapter (~2–3 min)."
            }
            onBack={goBack}
            onNext={goNext}
            nextLabel="Continue"
            loading={persisting}
          >
            {placementPlan && placementPlan.total_probes > 0 && diagQuestions.length === 0 && diagnosticAnswers.length === 0 && (
              <p className="text-sm text-[#8f91a3] mb-4">
                {placementPlan.total_probes} chapter probe{placementPlan.total_probes === 1 ? "" : "s"} · ~
                {placementPlan.estimated_minutes} min
              </p>
            )}
            {diagQuestions.length === 0 && diagnosticAnswers.length === 0 && (
              <button
                type="button"
                onClick={startDiagnostic}
                disabled={diagLoading || (placementPlan?.total_probes ?? 1) === 0}
                className="w-full py-4 rounded-xl bg-[#6258ff]/10 border border-[#6258ff]/30 text-base text-[#6258ff] font-semibold disabled:opacity-50 hover:bg-[#6258ff]/15 transition-colors flex items-center justify-center"
              >
                {diagLoading ? (
                  <LoadingSpinner size={24} className="text-white" />
                ) : (
                  "Start diagnostic"
                )}
              </button>
            )}
            {diagQuestions.length > 0 && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-medium text-[#8f91a3] mb-1">
                    Chapter {diagIndex + 1} of {diagQuestions.length} · {diagQuestions[diagIndex]?.chapter}
                  </p>
                  <p className="text-xs text-[#6258ff] font-semibold">
                    {diagQuestions[diagIndex]?.concept_name}
                  </p>
                </div>
                <div className="text-base text-[#eff0ff] leading-relaxed p-4 bg-[#05060c] border border-[#2f3242] rounded-lg">
                  {diagQuestions[diagIndex]?.question_text && (
                    <MarkdownMath
                      content={diagQuestions[diagIndex].question_text}
                      className="markdown-math text-base text-[#eff0ff] leading-relaxed"
                    />
                  )}
                </div>
                {diagQuestions[diagIndex]?.image_url && (
                  <div className="mt-2 mb-4 flex justify-center bg-[#141622] p-4 rounded-lg border border-[#2f3242]">
                    <img
                      src={diagQuestions[diagIndex].image_url}
                      alt="Question diagram"
                      className="max-w-full h-auto max-h-[250px] object-contain rounded"
                    />
                  </div>
                )}

                {showAnswer ? (
                  <div className="mt-4 mb-6 p-4 rounded-lg bg-[#6258ff]/10 border border-[#6258ff]/25">
                    <p className="text-sm font-semibold text-[#8584ff] mb-2">Solution</p>
                    {diagQuestions[diagIndex]?.solution_text && (
                      <div className="text-sm text-[#eff0ff] mb-3">
                        <MarkdownMath content={diagQuestions[diagIndex].solution_text!} />
                      </div>
                    )}
                    {diagQuestions[diagIndex]?.solution_image_url && (
                      <div className="flex justify-center bg-[#0d0e16] p-3 rounded border border-[#2f3242] mt-2">
                        <img
                          src={diagQuestions[diagIndex].solution_image_url!}
                          alt="Solution diagram"
                          className="max-w-full h-auto max-h-[200px] object-contain rounded"
                        />
                      </div>
                    )}
                    {!diagQuestions[diagIndex]?.solution_text && !diagQuestions[diagIndex]?.solution_image_url && (
                      <p className="text-sm text-slate-500 italic">No solution provided for this question.</p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAnswer(true)}
                    className="w-full py-3 mb-6 rounded-lg bg-[#141622] text-[#6258ff] border border-[#6258ff]/25 font-medium text-sm hover:bg-[#1a1b28] transition-colors"
                  >
                    Show Answer
                  </button>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => void gradeDiagnostic(true)}
                    disabled={diagGrading}
                    className="py-3 rounded-lg bg-emerald-950/30 text-emerald-400 border border-emerald-500/30 font-medium text-base hover:bg-emerald-950/50 transition-colors disabled:opacity-50"
                  >
                    Got it right
                  </button>
                  <button
                    type="button"
                    onClick={() => void gradeDiagnostic(false)}
                    disabled={diagGrading}
                    className="py-3 rounded-lg bg-red-950/30 text-red-400 border border-red-500/30 font-medium text-base hover:bg-red-950/50 transition-colors disabled:opacity-50"
                  >
                    Got it wrong
                  </button>
                </div>
              </div>
            )}
            {diagQuestions.length === 0 && diagnosticAnswers.length > 0 && (
              <p className="text-base font-medium text-emerald-400 bg-emerald-950/25 p-4 rounded-lg border border-emerald-500/25">
                Diagnostic complete. {diagnosticAnswers.length} chapter
                {diagnosticAnswers.length === 1 ? "" : "s"} probed.
              </p>
            )}
          </SlideCard>
        )}

        {step === 7 && (
          <SlideCard
            title="Your Classroom"
            subtitle="Here's your starting state. Your classroom is ready."
            onBack={goBack}
            onNext={() => void finishOnboarding()}
            nextLabel="Enter Classroom"
            loading={saving}
          >
            <div className="space-y-3">
              {revealCards.map((line, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[#141622] border border-[#2f3242] text-base text-[#d7d8e8] font-medium"
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
