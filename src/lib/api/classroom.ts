import * as auth from "@/lib/api/auth";
import { createChatSession } from "@/lib/api/agent";
import { CacheTTL, cacheKey, cachedGet, primeCache } from "@/lib/api/apiCache";

export type TodayAction = "lesson" | "revise" | "assess";
export type ClassroomSurface = "lesson" | "doubt" | "assess";
export type PlanStatus = "pending" | "in_progress" | "completed" | "skipped";
export type PlanWhen = "today" | "this_week" | (string & {});
export type ReviseDue = "today" | "this_week" | (string & {});
export type ReadinessLabel = "early" | "building" | "ready";
export type ClassroomTodayDecision = "complete" | "dismiss";

export type ClassroomSession = {
  surface: ClassroomSurface;
  concept_id: string;
  agent_session_id: string;
  status: string;
};

export type ClassroomToday = {
  concept_id: string;
  title: string;
  action: TodayAction;
  minutes: number;
  provisional?: boolean;
};

const CLASSROOM_HOME_CACHE_KEY = cacheKey(["classroom", "home"]);

export type ClassroomPlanItem = {
  concept_id: string;
  title: string;
  status: PlanStatus;
  when: PlanWhen;
};

export type ClassroomMapItem = {
  concept_id: string;
  title: string;
  chapter: string;
  mastery: number;
  prereqs: string[];
};

export type ClassroomReviseItem = {
  concept_id: string;
  title: string;
  due: ReviseDue;
};

export type ClassroomReadiness = {
  score: number;
  label: ReadinessLabel;
};

export type ClassroomHome = {
  today: ClassroomToday | null;
  plan: ClassroomPlanItem[];
  map: ClassroomMapItem[];
  revise: ClassroomReviseItem[];
  readiness: ClassroomReadiness;
};

/** True when this chat turn can move mastery, so the next home load must miss the cache. */
export function classroomHomeShouldRefresh(input: {
  gradedOutcome?: "correct" | "incorrect" | null;
  agentUsed?: string | null;
  scoreSummary?: string | null;
}): boolean {
  if (input.gradedOutcome === "correct" || input.gradedOutcome === "incorrect") return true;
  if (input.agentUsed === "graded_fast_path" || input.agentUsed === "diagnostic") return true;
  return Boolean(input.scoreSummary?.trim());
}

/** Lesson room for a concept. */
export function buildLessonUrl(conceptId: string): string {
  return `/lesson/${encodeURIComponent(conceptId)}`;
}

/** Assessment room for a concept. */
export function buildAssessUrl(conceptId: string): string {
  const params = new URLSearchParams({ concept: conceptId });
  return `/assess?${params.toString()}`;
}

/** Today / revise → lesson; assess → assess room. Plan and map always open a lesson. */
export function buildTodayRoomUrl(today: Pick<ClassroomToday, "concept_id" | "action">): string {
  if (today.action === "assess") return buildAssessUrl(today.concept_id);
  return buildLessonUrl(today.concept_id);
}

export async function openClassroomSession(input: {
  surface: ClassroomSurface;
  concept_id?: string;
  agent_session_id?: string;
}): Promise<ClassroomSession> {
  const body: Record<string, string> = {
    surface: input.surface,
    concept_id: input.concept_id ?? "",
  };
  if (input.agent_session_id) {
    body.agent_session_id = input.agent_session_id;
  }
  return auth.apiRequest<ClassroomSession>(`${auth.getApiBaseUrl()}/classroom/sessions/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchClassroomSession(agentSessionId: string): Promise<ClassroomSession> {
  return auth.apiRequest<ClassroomSession>(
    `${auth.getApiBaseUrl()}/classroom/sessions/${encodeURIComponent(agentSessionId)}/`,
  );
}

/**
 * Open (or return) a classroom session, create an agent chat id when unbound,
 * then POST again so Django stores the binding.
 */
export async function ensureClassroomAgentSession(input: {
  surface: ClassroomSurface;
  concept_id?: string;
}): Promise<ClassroomSession> {
  const conceptId = input.concept_id ?? "";
  let session = await openClassroomSession({
    surface: input.surface,
    concept_id: conceptId,
  });

  const existing = (session.agent_session_id || "").trim();
  if (existing) return session;

  const userId = auth.getSupabaseUserId();
  if (!userId) {
    throw new Error("Missing Supabase user link. Sign out and sign in again.");
  }
  const agentSessionId = await createChatSession(userId);
  session = await openClassroomSession({
    surface: input.surface,
    concept_id: conceptId,
    agent_session_id: agentSessionId,
  });
  return session;
}

function isClassroomHome(value: unknown): value is ClassroomHome {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return (
    "today" in body &&
    "plan" in body &&
    "map" in body &&
    "revise" in body &&
    "readiness" in body
  );
}

export async function fetchClassroomHome(force = false): Promise<ClassroomHome> {
  return cachedGet(
    CLASSROOM_HOME_CACHE_KEY,
    CacheTTL.classroom,
    () => auth.apiRequest<ClassroomHome>(`${auth.getApiBaseUrl()}/classroom/home/`),
    { force },
  );
}

/**
 * Record complete/dismiss for today's concept.
 * Returns the home payload when the POST body already is one; otherwise null
 * so the caller can force-refetch GET /classroom/home/.
 */
async function recordClassroomToday(
  conceptId: string,
  decision: ClassroomTodayDecision,
): Promise<ClassroomHome | null> {
  const result = await auth.apiRequest<unknown>(
    `${auth.getApiBaseUrl()}/classroom/today/${encodeURIComponent(conceptId)}/${decision}/`,
    { method: "POST", body: JSON.stringify({}) },
  );
  if (isClassroomHome(result)) {
    primeCache(CLASSROOM_HOME_CACHE_KEY, result, CacheTTL.classroom);
    return result;
  }
  return null;
}

export function completeClassroomToday(conceptId: string): Promise<ClassroomHome | null> {
  return recordClassroomToday(conceptId, "complete");
}

export function dismissClassroomToday(conceptId: string): Promise<ClassroomHome | null> {
  return recordClassroomToday(conceptId, "dismiss");
}
