import * as auth from "@/lib/api/auth";
import {
  CacheTTL,
  cacheKey,
  cachedGet,
  invalidateUserProductCache,
} from "@/lib/api/apiCache";

export type JourneyType = "fresh_start" | "mid_journey" | "revision_dropper";
export type LearningSource = "school" | "coaching" | "self_study" | "mixed";
export type CoverageDepth = "barely" | "moderate" | "strong";
export type SubjectDepth = "not_started" | CoverageDepth;
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
  unit?: string;
};

export type SyllabusUnit = {
  name: string;
  chapters: string[];
};

export type SyllabusSubject = {
  name: string;
  units: SyllabusUnit[];
};

export type ChapterSnapshot = {
  chapter: string;
  proficiency_pct: number | null;
  label: "strong" | "moderate" | "weak" | "not_started" | "unknown";
  probed: boolean;
};

export type OnboardingState = {
  journey_type: JourneyType;
  target_exam: TargetExam;
  target_year: number;
  grade_level: GradeLevel;
  subject_proficiency: Record<string, SubjectDepth>;
  unit_coverage: Record<string, CoverageDepth>;
  covered_chapters: string[];
  self_assessed_coverage: Record<string, CoverageDepth>;
  daily_goal_minutes: number;
  preferred_depth: PreferredDepth;
  diagnostic_baseline: Record<string, unknown>;
  current_step: number;
};

export const TOTAL_ONBOARDING_STEPS = 3;
export const ONBOARDING_SUBJECTS = ["Physics", "Chemistry", "Mathematics"] as const;

export const DEFAULT_ONBOARDING: OnboardingState = {
  journey_type: "fresh_start",
  target_exam: "BOTH",
  target_year: new Date().getFullYear() + 2,
  grade_level: "CLASS_11",
  subject_proficiency: {
    Physics: "not_started",
    Chemistry: "not_started",
    Mathematics: "not_started",
  },
  unit_coverage: {},
  covered_chapters: [],
  self_assessed_coverage: {},
  daily_goal_minutes: 45,
  preferred_depth: "standard",
  diagnostic_baseline: {},
  current_step: 1,
};

/**
 * Map drafts from the old 7/8-step wizard onto the 3-step flow.
 * New drafts already use steps 1–3.
 */
export function migrateOnboardingStep(step: number, fromLegacy = false): number {
  if (!Number.isFinite(step) || step < 1) return 1;
  if (!fromLegacy) {
    return Math.min(Math.max(Math.round(step), 1), TOTAL_ONBOARDING_STEPS);
  }
  if (step <= 2) return 1;
  if (step <= 4 || step === 6) return 2;
  return 3;
}

function isLegacyStep(step: number | undefined, snapshot?: Record<string, unknown> | null): boolean {
  if (snapshot && typeof snapshot === "object" && snapshot.subject_proficiency) return false;
  return typeof step === "number" && step > TOTAL_ONBOARDING_STEPS;
}

export const DEFAULT_PCM_SUBJECTS: SyllabusSubject[] = [
  {
    name: "Physics",
    units: [
      { name: "Mechanics", chapters: ["Laws of Motion", "Work Energy & Power", "Rotational Motion", "Kinematics", "Gravitation", "Fluid Mechanics"] },
      { name: "Thermodynamics", chapters: ["Thermal Properties", "Thermodynamics", "Kinetic Theory"] },
      { name: "Waves & Sound", chapters: ["Waves", "Sound"] },
      { name: "Optics", chapters: ["Wave Optics", "Ray Optics"] },
      { name: "Electrostatics & Current", chapters: ["Electrostatics", "Current Electricity", "Capacitance"] },
      { name: "Magnetism & EMI", chapters: ["Magnetism", "Magnetic Effects of Current", "Electromagnetic Induction", "Alternating Current"] },
      { name: "Modern Physics", chapters: ["Dual Nature of Radiation", "Atoms", "Nuclei", "Semiconductor"] },
    ],
  },
  {
    name: "Chemistry",
    units: [
      { name: "Physical Chemistry", chapters: ["Mole Concept & Stoichiometry", "Atomic Structure", "Chemical Thermodynamics", "Chemical & Ionic Equilibrium", "Electrochemistry", "Chemical Kinetics", "Solutions"] },
      { name: "Inorganic Chemistry", chapters: ["Periodic Table & Periodicity", "Chemical Bonding", "Coordination Compounds", "p-Block Elements", "d and f Block Elements"] },
      { name: "Organic Chemistry", chapters: ["General Organic Chemistry (GOC)", "Hydrocarbons", "Alkyl & Aryl Halides", "Alcohols, Phenols & Ethers", "Aldehydes & Ketones", "Nitrogen Compounds", "Biomolecules"] },
    ],
  },
  {
    name: "Mathematics",
    units: [
      { name: "Algebra", chapters: ["Quadratic Equations", "Complex Numbers", "Sequences & Series", "Binomial Theorem", "Permutations & Combinations", "Matrices & Determinants", "Probability"] },
      { name: "Trigonometry", chapters: ["Trigonometric Ratios & Identities", "Inverse Trigonometric Functions"] },
      { name: "Coordinate Geometry", chapters: ["Straight Lines", "Circles", "Conic Sections"] },
      { name: "Calculus", chapters: ["Limits, Continuity & Differentiability", "Application of Derivatives", "Integration", "Differential Equations"] },
      { name: "Vectors & 3D", chapters: ["Vector Algebra", "Three Dimensional Geometry"] },
    ],
  },
];

export function expandUnitCoverage(
  unitCoverage: Record<string, CoverageDepth>,
  subjects: SyllabusSubject[]
): { covered_chapters: string[]; self_assessed_coverage: Record<string, CoverageDepth> } {
  const covered_chapters: string[] = [];
  const self_assessed_coverage: Record<string, CoverageDepth> = {};
  const activeSubjects = subjects && subjects.length > 0 ? subjects : DEFAULT_PCM_SUBJECTS;
  for (const subject of activeSubjects) {
    for (const unit of subject.units ?? []) {
      const depth = unitCoverage[unit.name];
      if (!depth) continue;
      for (const chapter of unit.chapters) {
        if (!covered_chapters.includes(chapter)) covered_chapters.push(chapter);
        self_assessed_coverage[chapter] = depth;
      }
    }
  }
  return { covered_chapters, self_assessed_coverage };
}

export function buildKnowledgeBaseline(state: OnboardingState): Record<string, unknown> {
  return {
    ...(state.diagnostic_baseline || {}),
    subject_proficiency: state.subject_proficiency,
    unit_coverage: state.unit_coverage,
    source: "onboarding_self_assess_v3",
  };
}

export function focusChaptersFromPlacement(placement: SyllabusPlacement | null | undefined): string[] {
  if (!placement) return [];
  const fromSelf = Object.entries(placement.self_assessed_coverage || {})
    .filter(([, depth]) => depth === "barely")
    .map(([chapter]) => chapter);
  if (fromSelf.length > 0) return fromSelf.slice(0, 3);
  const baseline = (placement.diagnostic_baseline || {}) as {
    chapter_scores?: Record<string, number>;
  };
  const fromScores = Object.entries(baseline.chapter_scores || {})
    .filter(([, score]) => score < 0.45)
    .map(([chapter]) => chapter);
  if (fromScores.length > 0) return fromScores.slice(0, 3);
  return (placement.covered_chapters || []).slice(0, 2);
}

export async function fetchMe(): Promise<MeResponse> {
  return cachedGet(cacheKey(["me"]), CacheTTL.me, () =>
    auth.apiRequest<MeResponse>(`${auth.getApiBaseUrl()}/auth/me/`)
  );
}

export async function fetchSyllabusOutline(): Promise<{
  chapters: ChapterMeta[];
  subjects: SyllabusSubject[];
}> {
  return cachedGet(cacheKey(["chapters"]), CacheTTL.chapters, () =>
    auth.apiRequest<{ chapters: ChapterMeta[]; subjects?: SyllabusSubject[] }>(
      `${auth.getApiBaseUrl()}/onboarding/chapters/`
    )
  ).then((data) => {
    const hasUnits = data.subjects && data.subjects.some((s) => s.units && s.units.length > 0);
    return {
      chapters: data.chapters || [],
      subjects: hasUnits ? data.subjects! : DEFAULT_PCM_SUBJECTS,
    };
  }).catch(() => ({
    chapters: [],
    subjects: DEFAULT_PCM_SUBJECTS,
  }));
}

export async function fetchChapters(): Promise<ChapterMeta[]> {
  const outline = await fetchSyllabusOutline();
  return outline.chapters;
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

export type MilestoneKind = "target" | "knowledge" | "preferences";

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
      patchPlacement(userId, { journey_type: state.journey_type }),
      patchOnboardingSession(userId, sessionPatch),
    ]);
    return;
  }

  if (kind === "knowledge") {
    const baseline = buildKnowledgeBaseline(state);
    await Promise.all([
      patchPlacement(userId, {
        journey_type: state.journey_type,
        covered_chapters: state.covered_chapters,
        self_assessed_coverage: state.self_assessed_coverage,
        diagnostic_baseline: baseline,
      }),
      patchStudentProfile(userId, { onboarding_step: nextStep }),
      patchOnboardingSession(userId, sessionPatch),
    ]);
    return;
  }

  await Promise.all([
    patchStudentProfile(userId, {
      daily_goal_minutes: state.daily_goal_minutes,
      preferred_depth: state.preferred_depth,
      onboarding_step: nextStep,
    }),
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
  const result = await auth.apiRequest<{ ok: boolean; sandbox: SandboxSummary }>(
    `${auth.getApiBaseUrl()}/onboarding/complete/`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
  invalidateUserProductCache();
  return result;
}

function isSubjectDepth(value: unknown): value is SubjectDepth {
  return value === "not_started" || value === "barely" || value === "moderate" || value === "strong";
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
  if (snapshot.subject_proficiency && typeof snapshot.subject_proficiency === "object") {
    out.subject_proficiency = snapshot.subject_proficiency as Record<string, SubjectDepth>;
  }
  if (snapshot.unit_coverage && typeof snapshot.unit_coverage === "object") {
    out.unit_coverage = snapshot.unit_coverage as Record<string, CoverageDepth>;
  }
  if (typeof snapshot.daily_goal_minutes === "number") {
    out.daily_goal_minutes = snapshot.daily_goal_minutes;
  }
  if (typeof snapshot.preferred_depth === "string") {
    out.preferred_depth = snapshot.preferred_depth as PreferredDepth;
  }
  if (snapshot.diagnostic_baseline && typeof snapshot.diagnostic_baseline === "object") {
    out.diagnostic_baseline = snapshot.diagnostic_baseline as Record<string, unknown>;
    const baseline = snapshot.diagnostic_baseline as Record<string, unknown>;
    if (!out.subject_proficiency && baseline.subject_proficiency && typeof baseline.subject_proficiency === "object") {
      out.subject_proficiency = baseline.subject_proficiency as Record<string, SubjectDepth>;
    }
    if (!out.unit_coverage && baseline.unit_coverage && typeof baseline.unit_coverage === "object") {
      out.unit_coverage = baseline.unit_coverage as Record<string, CoverageDepth>;
    }
  }
  if (typeof snapshot.current_step === "number") {
    out.current_step = migrateOnboardingStep(
      snapshot.current_step,
      isLegacyStep(snapshot.current_step, snapshot)
    );
  }
  return out;
}

export function meToOnboardingState(me: MeResponse): OnboardingState {
  const profile = me.profile;
  const placement = me.placement;
  const session = me.onboarding_session;
  const fromSnapshot = snapshotToState(session?.snapshot);
  const rawStep = fromSnapshot.current_step ?? session?.current_step ?? profile?.onboarding_step ?? 1;
  const step = migrateOnboardingStep(rawStep, isLegacyStep(session?.current_step, session?.snapshot));
  const baseline = (fromSnapshot.diagnostic_baseline ?? placement?.diagnostic_baseline ?? {}) as Record<
    string,
    unknown
  >;
  const subjectFromBaseline = (baseline.subject_proficiency || {}) as Record<string, SubjectDepth>;
  const unitFromBaseline = (baseline.unit_coverage || {}) as Record<string, CoverageDepth>;

  const subject_proficiency = {
    ...DEFAULT_ONBOARDING.subject_proficiency,
    ...subjectFromBaseline,
    ...(fromSnapshot.subject_proficiency || {}),
  };
  for (const key of Object.keys(subject_proficiency)) {
    if (!isSubjectDepth(subject_proficiency[key])) {
      subject_proficiency[key] = "not_started";
    }
  }

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
    subject_proficiency,
    unit_coverage: fromSnapshot.unit_coverage ?? unitFromBaseline ?? {},
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
    diagnostic_baseline: baseline,
    current_step: step,
  };
}

export function hasServerOnboardingProgress(me: MeResponse): boolean {
  const session = me.onboarding_session;
  const step = migrateOnboardingStep(
    session?.current_step ?? me.profile?.onboarding_step ?? 1,
    isLegacyStep(session?.current_step, session?.snapshot)
  );
  const snapshot = session?.snapshot;
  const snapshotKeys = snapshot && typeof snapshot === "object" ? Object.keys(snapshot) : [];
  return step > 1 || snapshotKeys.length > 0;
}

export function estimateWeeksPreview(
  dailyGoalMinutes: number,
  conceptsRemaining: number
): number {
  const daily = Math.max(15, dailyGoalMinutes || 45);
  return Math.max(1, Math.round((conceptsRemaining * 12) / daily));
}
