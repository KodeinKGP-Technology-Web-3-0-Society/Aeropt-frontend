import * as auth from "@/lib/api/auth";
import { CacheTTL, cacheKey, cachedGet, invalidateCache } from "@/lib/api/apiCache";
import { fetchMe } from "@/lib/api/onboarding";

/** The agent's exam plan (services/study_plan.py), recomputed from the record on every load. */

export type PlanItemKind = "learn" | "continue" | "review" | "done";

export interface PlanItem {
  concept_id: string;
  topic: string;
  unit?: string;
  subject?: string;
  kind: PlanItemKind;
  minutes: number;
  tutor_taught?: boolean;
  done?: boolean;
  spaced?: boolean;
}

export interface PlanDay {
  date: string;
  rest: boolean;
  minutes: number;
  minutes_done: number;
  items: PlanItem[];
}

export interface PlanUnit {
  subject?: string;
  unit: string;
  total: number;
  mastered: number;
  started: number;
  finish_by: string | null;
  complete: boolean;
  topics: { topic: string; concept_id: string; status: "mastered" | "started" | "review" | "new"; tutor_taught: boolean }[];
}

export type ExamChoice = "JEE_MAINS" | "JEE_ADVANCED" | "BOTH";

export interface StudyPlan {
  settings: {
    exam: ExamChoice;
    exam_label: string;
    exam_date: string;
    exam_date_estimated: boolean;
    daily_minutes: number;
    study_days: number;
    revision_weeks: number;
  };
  today: string;
  days_left: number;
  revision_start: string;
  topics_total: number;
  topics_mastered: number;
  topics_remaining: number;
  reviews_pending: number;
  remaining_minutes: number;
  finish_date: string | null;
  verdict: "on_track" | "tight" | "behind" | "done";
  minutes_needed: number | null;
  week: PlanDay[];
  milestones: {
    month: string;
    by: string;
    units: string[];
    subjects?: { subject: string; unit: string; by: string }[];
  }[];
  /** Lowest subject coverage. The plan moves all three subjects in one step. */
  together?: {
    percent: number;
    behind: string | null;
    level: boolean;
    subjects: {
      subject: string;
      topics_total: number;
      topics_mastered: number;
      topics_started: number;
      units_total: number;
      units_done: number;
      next_unit: string | null;
      finish_by: string | null;
      percent: number;
    }[];
  };
  roadmap: PlanUnit[];
}

/** Profile fields the plan is built from (Django onboarding profile). */
export interface PlanProfile {
  exam: ExamChoice;
  targetYear: number | null;
  dailyMinutes: number;
}

export async function fetchPlanProfile(): Promise<PlanProfile> {
  const me = await fetchMe().catch(() => null);
  const p = (me?.profile ?? {}) as { target_exam?: string; target_year?: number | null; daily_goal_minutes?: number | null };
  const exam = (["JEE_MAINS", "JEE_ADVANCED", "BOTH"].includes(p.target_exam ?? "") ? p.target_exam : "BOTH") as ExamChoice;
  return { exam, targetYear: p.target_year ?? null, dailyMinutes: p.daily_goal_minutes || 60 };
}

function timezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
  } catch {
    return "Asia/Kolkata";
  }
}

export async function fetchPlan(profile?: PlanProfile): Promise<StudyPlan> {
  const userId = auth.getSupabaseUserId();
  if (!userId) throw new Error("You're signed out. Sign in to see your plan.");
  const prof = profile ?? (await fetchPlanProfile());
  const qs = new URLSearchParams({ exam: prof.exam, daily_minutes: String(prof.dailyMinutes), tz: timezone() });
  if (prof.targetYear) qs.set("target_year", String(prof.targetYear));
  return cachedGet(cacheKey(["plan", userId, qs.toString()]), CacheTTL.plan, () =>
    auth.apiRequest<StudyPlan>(`${auth.requireAgentApiBase()}/plan/${encodeURIComponent(userId)}?${qs}`),
  );
}

/**
 * Save plan settings: exam, year and daily minutes go to the Django profile (the
 * one onboarding wrote); study days, revision weeks and an exact exam date to the
 * agent's study_plan_settings.
 */
export async function savePlanSettings(next: {
  exam: ExamChoice;
  targetYear: number;
  dailyMinutes: number;
  studyDays: number;
  revisionWeeks: number;
  examDate: string; // "" = use the estimate
}): Promise<void> {
  const userId = auth.getSupabaseUserId();
  if (!userId) throw new Error("You're signed out.");
  await auth.apiRequest(`${auth.getApiBaseUrl()}/users/student-profiles/me/`, {
    method: "PATCH",
    body: JSON.stringify({ target_exam: next.exam, target_year: next.targetYear, daily_goal_minutes: next.dailyMinutes }),
  });
  await auth.apiRequest(`${auth.requireAgentApiBase()}/plan/settings`, {
    method: "PUT",
    body: JSON.stringify({
      user_id: userId,
      study_days: next.studyDays,
      revision_weeks: next.revisionWeeks,
      exam_date: next.examDate,
    }),
  });
  invalidateCache("me");
  invalidateCache("plan");
}
