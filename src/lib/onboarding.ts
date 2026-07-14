import * as auth from "@/lib/auth";

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
  learning_source: LearningSource;
  daily_goal_minutes: number;
  preferred_depth: PreferredDepth;
  diagnostic_baseline: Record<string, unknown>;
  current_step: number;
};

export const DEFAULT_ONBOARDING: OnboardingState = {
  journey_type: "fresh_start",
  target_exam: "BOTH",
  target_year: new Date().getFullYear() + 2,
  grade_level: "CLASS_11",
  covered_chapters: [],
  self_assessed_coverage: {},
  learning_source: "mixed",
  daily_goal_minutes: 45,
  preferred_depth: "standard",
  diagnostic_baseline: {},
  current_step: 1,
};

export async function fetchMe(): Promise<MeResponse> {
  return auth.apiRequest<MeResponse>(`${auth.getApiBaseUrl()}/auth/me/`);
}

export async function fetchChapters(): Promise<ChapterMeta[]> {
  const data = await auth.apiRequest<{ chapters: ChapterMeta[] }>(
    `${auth.getApiBaseUrl()}/onboarding/chapters/`
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

export async function completeOnboarding(payload: {
  profile?: Partial<StudentProfile>;
  placement?: Partial<SyllabusPlacement>;
  snapshot?: Record<string, unknown>;
  current_step?: number;
  onboarding_step?: number;
}): Promise<{ ok: boolean; sandbox: SandboxSummary }> {
  return auth.apiRequest(`${auth.getApiBaseUrl()}/onboarding/complete/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
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
  return response.json() as Promise<{ concept_scores: Record<string, number>; overall: number }>;
}

export function meToOnboardingState(me: MeResponse): OnboardingState {
  const profile = me.profile;
  const placement = me.placement;
  const session = me.onboarding_session;
  return {
    journey_type: placement?.journey_type ?? DEFAULT_ONBOARDING.journey_type,
    target_exam: profile?.target_exam ?? DEFAULT_ONBOARDING.target_exam,
    target_year: profile?.target_year ?? DEFAULT_ONBOARDING.target_year,
    grade_level: (profile?.grade_level as GradeLevel) || DEFAULT_ONBOARDING.grade_level,
    covered_chapters: placement?.covered_chapters ?? [],
    self_assessed_coverage: placement?.self_assessed_coverage ?? {},
    learning_source: placement?.learning_source ?? DEFAULT_ONBOARDING.learning_source,
    daily_goal_minutes: profile?.daily_goal_minutes ?? DEFAULT_ONBOARDING.daily_goal_minutes,
    preferred_depth: profile?.preferred_depth ?? DEFAULT_ONBOARDING.preferred_depth,
    diagnostic_baseline: placement?.diagnostic_baseline ?? {},
    current_step: session?.current_step ?? profile?.onboarding_step ?? 1,
  };
}
