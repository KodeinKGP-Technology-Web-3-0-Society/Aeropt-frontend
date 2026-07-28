import * as auth from "@/lib/auth";
import {
  CacheTTL,
  cacheKey,
  cachedGet,
  invalidateUserProductCache,
} from "@/lib/apiCache";

export type JourneyType = "fresh_start" | "mid_journey" | "revision_dropper";
export type LearningSource = "school" | "coaching" | "self_study" | "mixed";
export type CoverageDepth = "barely" | "moderate" | "strong";
export type TargetExam = "JEE_MAINS" | "JEE_ADVANCED" | "BOTH";
export type GradeLevel = "CLASS_11" | "CLASS_12" | "DROPPER";
export type PreferredDepth = "quick" | "standard" | "deep";

export type StudentProfile = {
  user: string;
  target_exam: TargetExam;
  target_year: number | null;
  grade_level: GradeLevel | "";
  daily_goal_minutes: number;
  preferred_depth: PreferredDepth;
  onboarding_completed: boolean;
  onboarding_step: number;
};

export type SyllabusPlacement = {
  user: string;
  journey_type: JourneyType;
  learning_source: LearningSource;
  covered_chapters: string[];
  self_assessed_coverage: Record<string, CoverageDepth>;
  diagnostic_baseline: Record<string, unknown>;
};

export type OnboardingSession = {
  user: string;
  current_step: number;
  snapshot: Record<string, unknown>;
  completed_at: string | null;
};

export type MeResponse = {
  id: string;
  email: string;
  full_name: string;
  supabase_user_id?: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  profile: StudentProfile | null;
  placement: SyllabusPlacement | null;
  onboarding_session: OnboardingSession | null;
};

export type SandboxSummary = {
  target_label: string;
  chapters_total: number;
  chapters_covered: number;
  overall_proficiency_pct: number | null;
  concepts_on_path: number;
  estimated_weeks: number;
  first_up: string;
  journey_type: JourneyType;
  chapter_snapshots?: ChapterSnapshot[];
  focus_chapters?: string[];
  strong_chapters?: string[];
};

export type ChapterMeta = {
  name: string;
  concept_count: number;
  order: number;
};

export type ChapterSnapshot = {
  chapter: string;
  proficiency_pct: number | null;
  label: "strong" | "moderate" | "weak" | "not_started" | "unknown";
  probed: boolean;
};

export type PlacementProbe = {
  chapter: string;
  concept_id: string;
  concept_name: string;
  reason?: string;
};

export type PlacementPlan = {
  probes: PlacementProbe[];
  total_probes: number;
  estimated_minutes: number;
  skipped_chapters: string[];
  journey_type: JourneyType;
};

export type DiagnosticQuestion = {
  question_id: string;
  concept_id: string;
  concept_name: string;
  chapter: string;
  question_text: string;
  content_id: string;
  image_url?: string;
  solution_text?: string;
  solution_image_url?: string;
};

export type OnboardingState = {
  journey_type: JourneyType;
  target_exam: TargetExam;
  target_year: number;
  grade_level: GradeLevel;
  covered_chapters: string[];
  self_assessed_coverage: Record<string, CoverageDepth>;
  daily_goal_minutes: number;
  preferred_depth: PreferredDepth;
  diagnostic_baseline: Record<string, unknown>;
  current_step: number;
};

/** Current onboarding step count after removing the unused study-source step. */
export const TOTAL_ONBOARDING_STEPS = 7;

export const DEFAULT_ONBOARDING: OnboardingState = {
  journey_type: "fresh_start",
  target_exam: "BOTH",
  target_year: new Date().getFullYear() + 2,
  grade_level: "CLASS_11",
  covered_chapters: [],
  self_assessed_coverage: {},
  daily_goal_minutes: 45,
  preferred_depth: "standard",
  diagnostic_baseline: {},
  current_step: 1,
};

/**
 * Map drafts saved before study-source was removed
 * (old 8-step flow) onto the current 7-step numbering.
 */
export function migrateOnboardingStep(step: number): number {
  if (!Number.isFinite(step) || step < 1) return 1;
  if (step <= 4) return step;
  if (step === 5) return 5; // old source → rhythm
  if (step === 6) return 5; // old rhythm
  if (step === 7) return 6; // old diagnostic
  return TOTAL_ONBOARDING_STEPS; // old classroom / anything higher
}

export async function fetchMe(): Promise<MeResponse> {
  return cachedGet(cacheKey(["me"]), CacheTTL.me, () =>
    auth.apiRequest<MeResponse>(`${auth.getApiBaseUrl()}/auth/me/`)
  );
}

export async function fetchChapters(): Promise<ChapterMeta[]> {
  const data = await cachedGet(cacheKey(["chapters"]), CacheTTL.chapters, () =>
    auth.apiRequest<{ chapters: ChapterMeta[] }>(`${auth.getApiBaseUrl()}/onboarding/chapters/`)
  );
  return data.chapters;
}

export async function fetchPlacementPlan(payload: {
  journey_type: JourneyType;
  covered_chapters: string[];
  self_assessed_coverage: Record<string, CoverageDepth>;
}): Promise<PlacementPlan> {
  return auth.apiRequest<PlacementPlan>(
    `${auth.getApiBaseUrl()}/onboarding/placement-plan/`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function patchStudentProfile(
  userId: string,
  body: Partial<StudentProfile>
): Promise<StudentProfile> {
  return auth.apiRequest<StudentProfile>(
    `${auth.getApiBaseUrl()}/users/student-profiles/${userId}/`,
    { method: "PATCH", body: JSON.stringify(body) }
  );
}

export async function patchPlacement(
  userId: string,
  body: Partial<SyllabusPlacement>
): Promise<SyllabusPlacement> {
  return auth.apiRequest<SyllabusPlacement>(
    `${auth.getApiBaseUrl()}/users/syllabus-placement/${userId}/`,
    { method: "PATCH", body: JSON.stringify(body) }
  );
}

export async function patchOnboardingSession(
  userId: string,
  body: Partial<OnboardingSession>
): Promise<OnboardingSession> {
  return auth.apiRequest<OnboardingSession>(
    `${auth.getApiBaseUrl()}/users/onboarding-sessions/${userId}/`,
    { method: "PATCH", body: JSON.stringify(body) }
  );
}

export type MilestoneKind = "target" | "placement" | "rhythm" | "diagnostic";

export async function persistOnboardingMilestone(
  userId: string,
  kind: MilestoneKind,
  state: OnboardingState,
  nextStep: number
): Promise<void> {
  const snapshot = { ...state, current_step: nextStep } as unknown as Record<string, unknown>;
  const sessionPatch: Partial<OnboardingSession> = {
    current_step: nextStep,
    snapshot,
  };

  if (kind === "target") {
    await Promise.all([
      patchStudentProfile(userId, {
        target_exam: state.target_exam,
        target_year: state.target_year,
        grade_level: state.grade_level,
        onboarding_step: nextStep,
      }),
      patchOnboardingSession(userId, sessionPatch),
    ]);
    return;
  }

  if (kind === "placement") {
    await Promise.all([
      patchPlacement(userId, {
        journey_type: state.journey_type,
        covered_chapters: state.covered_chapters,
        self_assessed_coverage: state.self_assessed_coverage,
        diagnostic_baseline: state.diagnostic_baseline,
      }),
      patchStudentProfile(userId, { onboarding_step: nextStep }),
      patchOnboardingSession(userId, sessionPatch),
    ]);
    return;
  }

  if (kind === "rhythm") {
    await Promise.all([
      patchStudentProfile(userId, {
        daily_goal_minutes: state.daily_goal_minutes,
        preferred_depth: state.preferred_depth,
        onboarding_step: nextStep,
      }),
      patchOnboardingSession(userId, sessionPatch),
    ]);
    return;
  }

  // diagnostic
  await Promise.all([
    patchPlacement(userId, {
      journey_type: state.journey_type,
      covered_chapters: state.covered_chapters,
      self_assessed_coverage: state.self_assessed_coverage,
      diagnostic_baseline: state.diagnostic_baseline,
    }),
    patchStudentProfile(userId, { onboarding_step: nextStep }),
    patchOnboardingSession(userId, sessionPatch),
  ]);
}

export async function completeOnboarding(payload: {
  profile?: Partial<StudentProfile>;
  placement?: Partial<SyllabusPlacement>;
  snapshot?: Record<string, unknown>;
  current_step?: number;
  onboarding_step?: number;
}): Promise<{ ok: boolean; sandbox: SandboxSummary }> {
  const result = await auth.apiRequest(`${auth.getApiBaseUrl()}/onboarding/complete/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  invalidateUserProductCache();
  return result;
}

export async function startDiagnostic(
  userId: string,
  options: { probes: PlacementProbe[]; questionCount?: number }
): Promise<{ questions: DiagnosticQuestion[] }> {
  const response = await fetch(`${auth.getAgentApiBase()}/api/v1/onboarding/diagnostic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      action: "start",
      question_count: options.questionCount ?? options.probes.length,
      probes: options.probes,
    }),
  });
  if (!response.ok) {
    throw new Error(await auth.parseResponseError(response));
  }
  return response.json() as Promise<{ questions: DiagnosticQuestion[] }>;
}

export async function submitDiagnosticAnswer(payload: {
  user_id: string;
  concept_id: string;
  content_id: string;
  is_correct: boolean;
}): Promise<{ concept_scores: Record<string, number>; overall: number }> {
  const response = await fetch(`${auth.getAgentApiBase()}/api/v1/onboarding/diagnostic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, action: "grade" }),
  });
  if (!response.ok) {
    throw new Error(await auth.parseResponseError(response));
  }
  invalidateUserProductCache();
  return response.json() as Promise<{ concept_scores: Record<string, number>; overall: number }>;
}

function snapshotToState(snapshot: Record<string, unknown> | null | undefined): Partial<OnboardingState> {
  if (!snapshot || typeof snapshot !== "object") return {};
  const out: Partial<OnboardingState> = {};
  if (typeof snapshot.journey_type === "string") {
    out.journey_type = snapshot.journey_type as JourneyType;
  }
  if (typeof snapshot.target_exam === "string") {
    out.target_exam = snapshot.target_exam as TargetExam;
  }
  if (typeof snapshot.target_year === "number") {
    out.target_year = snapshot.target_year;
  }
  if (typeof snapshot.grade_level === "string") {
    out.grade_level = snapshot.grade_level as GradeLevel;
  }
  if (Array.isArray(snapshot.covered_chapters)) {
    out.covered_chapters = snapshot.covered_chapters as string[];
  }
  if (snapshot.self_assessed_coverage && typeof snapshot.self_assessed_coverage === "object") {
    out.self_assessed_coverage = snapshot.self_assessed_coverage as Record<string, CoverageDepth>;
  }
  if (typeof snapshot.daily_goal_minutes === "number") {
    out.daily_goal_minutes = snapshot.daily_goal_minutes;
  }
  if (typeof snapshot.preferred_depth === "string") {
    out.preferred_depth = snapshot.preferred_depth as PreferredDepth;
  }
  if (snapshot.diagnostic_baseline && typeof snapshot.diagnostic_baseline === "object") {
    out.diagnostic_baseline = snapshot.diagnostic_baseline as Record<string, unknown>;
  }
  if (typeof snapshot.current_step === "number") {
    out.current_step = migrateOnboardingStep(snapshot.current_step);
  }
  return out;
}

export function meToOnboardingState(me: MeResponse): OnboardingState {
  const profile = me.profile;
  const placement = me.placement;
  const session = me.onboarding_session;
  const fromSnapshot = snapshotToState(session?.snapshot);
  const step = migrateOnboardingStep(
    fromSnapshot.current_step ??
      session?.current_step ??
      profile?.onboarding_step ??
      1
  );

  return {
    journey_type:
      fromSnapshot.journey_type ??
      placement?.journey_type ??
      DEFAULT_ONBOARDING.journey_type,
    target_exam:
      fromSnapshot.target_exam ?? profile?.target_exam ?? DEFAULT_ONBOARDING.target_exam,
    target_year:
      fromSnapshot.target_year ?? profile?.target_year ?? DEFAULT_ONBOARDING.target_year,
    grade_level:
      fromSnapshot.grade_level ??
      ((profile?.grade_level as GradeLevel) || DEFAULT_ONBOARDING.grade_level),
    covered_chapters:
      fromSnapshot.covered_chapters ?? placement?.covered_chapters ?? [],
    self_assessed_coverage:
      fromSnapshot.self_assessed_coverage ?? placement?.self_assessed_coverage ?? {},
    daily_goal_minutes:
      fromSnapshot.daily_goal_minutes ??
      profile?.daily_goal_minutes ??
      DEFAULT_ONBOARDING.daily_goal_minutes,
    preferred_depth:
      fromSnapshot.preferred_depth ??
      profile?.preferred_depth ??
      DEFAULT_ONBOARDING.preferred_depth,
    diagnostic_baseline:
      fromSnapshot.diagnostic_baseline ?? placement?.diagnostic_baseline ?? {},
    current_step: step,
  };
}

export function hasServerOnboardingProgress(me: MeResponse): boolean {
  const session = me.onboarding_session;
  const step = migrateOnboardingStep(
    session?.current_step ?? me.profile?.onboarding_step ?? 1
  );
  const snapshot = session?.snapshot;
  const snapshotKeys = snapshot && typeof snapshot === "object" ? Object.keys(snapshot) : [];
  return step > 1 || snapshotKeys.length > 0;
}

/** Rough ETA weeks from daily goal + uncovered concept count (classroom preview). */
export function estimateWeeksPreview(
  dailyGoalMinutes: number,
  conceptsRemaining: number
): number {
  const daily = Math.max(15, dailyGoalMinutes || 45);
  return Math.max(1, Math.round((conceptsRemaining * 12) / daily));
}
