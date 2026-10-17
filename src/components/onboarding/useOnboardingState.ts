"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import * as onboarding from "@/lib/api/onboarding";
import type {
  MilestoneKind,
  OnboardingState,
  SyllabusSubject,
} from "@/lib/api/onboarding";

export const TOTAL_STEPS = onboarding.TOTAL_ONBOARDING_STEPS;
const DRAFT_KEY = "jeepath_onboarding_draft";
const DRAFT_VERSION = 3;

type OnboardingDraft = {
  version?: number;
  state: OnboardingState;
  step: number;
};

function loadDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY) || sessionStorage.getItem("prepwise_onboarding_draft");
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

/**
 * The onboarding draft lifecycle: resume from server or sessionStorage, persist a
 * milestone per step, and finish. `OnboardingFlow` renders the slides only.
 */
export function useOnboardingState() {
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
          router.replace("/home");
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
      router.replace("/home");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not finish setup");
    } finally {
      setSaving(false);
    }
  };

  const [activeSubject, setActiveSubject] = useState<string>("Physics");
  const physicsUnits = subjects.find((s) => s.name === "Physics")?.units ?? [];
  const activeSubjectUnits = subjects.find((s) => s.name === activeSubject)?.units ?? [];
  const showUnits = state.journey_type !== "fresh_start" && subjects.some((s) => (s.units?.length ?? 0) > 0);
  return {
    state,
    setState,
    step,
    loading,
    saving,
    persisting,
    error,
    knowledgeState,
    goToStep,
    advanceFrom,
    finishOnboarding,
    subjects,
    activeSubject,
    setActiveSubject,
    activeSubjectUnits,
    physicsUnits,
    showUnits,
  };
}
