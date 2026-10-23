import * as auth from "@/lib/api/auth";
import { CacheTTL, cacheKey, cachedGet } from "@/lib/api/apiCache";

/** Shapes returned by the agent's GET /api/v1/progress/{user_id} (services/progress_report.py). */

export type ConceptStatus = "mastered" | "strong" | "building" | "weak" | "new";

export interface ProgressOverview {
  questions_attempted: number;
  questions_correct: number;
  accuracy: number | null;
  attempts_7d: number;
  accuracy_7d: number | null;
  accuracy_prev_7d: number | null;
  questions_asked_7d: number;
  active_minutes_7d: number;
  active_days_30d: number;
  streak_days: number;
  best_streak_days: number;
  active_today: boolean;
  concepts_practised: number;
  concepts_mastered: number;
  study_sessions_completed: number;
  last_active: string | null;
}

export interface ProgressDay {
  date: string;
  attempts: number;
  correct: number;
  turns: number;
  minutes: number;
}

export interface ProgressChapter {
  chapter: string;
  unit: string;
  concepts: number;
  attempts: number;
  correct: number;
  mastered: number;
  weak: number;
  proficiency: number;
  accuracy: number | null;
  last_practised: string | null;
}

export interface ProgressConcept {
  concept_id: string;
  name: string;
  chapter: string;
  unit: string;
  proficiency: number;
  attempts: number;
  correct: number;
  accuracy: number | null;
  trend: number | null;
  status: ConceptStatus;
  /** Taught in chat or a lesson, never practised: no score yet. */
  discussed_only?: boolean;
  flagged_weak: boolean;
  last_practised: string | null;
  days_since: number | null;
  readiness: number | null;
  review_due: string | null;
}

export interface MistakeEntry {
  concept_id: string | null;
  concept_name: string | null;
  content_id: string | null;
  question: string;
  student_answer: string;
  error_type: string | null;
  source: string | null;
  when: string;
  fixed: boolean;
}

export interface ProgressReview {
  concept_id: string;
  name: string;
  due_at: string | null;
  overdue: boolean;
  reason: string | null;
}

export interface ProgressInsight {
  tone: "action" | "pattern" | "good";
  text: string;
  concept_id?: string;
  action?: "study" | "review";
}

export interface TimelineItem {
  kind: "attempt" | "tutor_turn" | "study_started" | "study_completed" | "review_done";
  text: string;
  detail?: string;
  when: string;
  concept_id?: string | null;
  outcome?: string | null;
  delta_pct?: number | null;
  source?: string | null;
  count?: number;
}

export interface ProgressReport {
  generated_at: string;
  timezone: string;
  overview: ProgressOverview;
  daily: ProgressDay[];
  chapters: ProgressChapter[];
  concepts: ProgressConcept[];
  mistakes: { by_type: Record<string, number>; total_wrong: number; notebook: MistakeEntry[] };
  reviews: ProgressReview[];
  memories: { kind: string; fact: string }[];
  timeline: TimelineItem[];
  insights: ProgressInsight[];
}

export async function fetchProgress(days = 30): Promise<ProgressReport> {
  const userId = auth.getSupabaseUserId();
  if (!userId) throw new Error("You're signed out. Sign in to see your progress.");
  let tz = "Asia/Kolkata";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz;
  } catch {
    /* keep the default */
  }
  const qs = new URLSearchParams({ tz, days: String(days) });
  return auth.apiRequest<ProgressReport>(
    `${auth.requireAgentApiBase()}/progress/${encodeURIComponent(userId)}?${qs}`,
  );
}

/**
 * Same report, cached (stale-while-revalidate): the nav's streak chip and the
 * home page both read it on every navigation, and it changes slowly.
 */
export function fetchProgressCached(force = false): Promise<ProgressReport> {
  return cachedGet(cacheKey(["progress", auth.getSupabaseUserId()]), CacheTTL.progress, () => fetchProgress(30), {
    force,
  });
}
