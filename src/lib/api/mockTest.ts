/**
 * Mock Test API client
 *
 * All routes live on the agent service under /api/v1/mock/*.
 * The Django gateway proxies them at NEXT_PUBLIC_API_BASE_URL/agent/mock/*.
 */

import * as auth from "@/lib/api/auth";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CatalogChapter {
  chapter_id: string;
  title: string;
  subject: string;
  in_syllabus: boolean;
  gradeable_pyqs: number;
  recommended_max: number;
}

export interface MockCatalog {
  exam: string;
  chapters: CatalogChapter[];
  subjects: string[];
}

export interface SubjectConfig {
  subject: string;
  chapters: string[];          // chapter_ids; empty = all chapters in subject
  n_questions: number;
  difficulty_target?: number | null;
  question_types?: QuestionTypeGroup[];   // empty / omitted = all types
}

/** What the student picks; the agent maps each to the stored question types. */
export type QuestionTypeGroup = "single" | "multiple" | "numerical";

export interface MockBuildRequest {
  user_id: string;
  exam: "JEE_ADVANCED" | "JEE_MAIN" | "custom";
  subjects: SubjectConfig[];
  total_time_minutes: number;
  marking_scheme?: Record<string, unknown> | null;
  exclude_seen?: boolean;
  force_new?: boolean;
  allow_fallback?: boolean;
  /** Return immediately with status "building"; poll fetchMockStatus for progress. */
  async_build?: boolean;
}

export interface MockTestOption {
  label: string;
  text: string;
}

export interface MockTestQuestion {
  content_id: string;
  display_order: number;
  section: string;
  chapter_id: string;
  chapter_title: string;
  concept_id: string;
  concept_name: string;
  /** The agent normally sends one of the first four; other strings are tolerated by the UI. */
  question_type: "single_correct" | "multiple_correct" | "numeric" | "integer" | "comprehension" | (string & {});
  difficulty: number;
  stem: string;
  options: MockTestOption[] | null;
  has_gradekey: boolean;
}

export interface MockBuildResult {
  mock_test_id: string;
  /** "building" when async_build was requested, "built" for the synchronous shape. */
  status: "building" | "built";
  exam?: string;
  total_questions: number;
  time_limit_minutes: number;
  questions?: MockTestQuestion[];
  feasibility?: Record<string, unknown>;
}

export interface MockStartResult {
  mock_test_id: string;
  status: "in_progress";
  started_at: string;
  time_limit_minutes: number;
  total_questions: number;
  questions: MockTestQuestion[];
  /** Optional: answers already saved server-side (not sent by the agent today). */
  answers?: SavedAnswer[] | Record<string, SavedAnswer>;
}

export interface SavedAnswer {
  content_id?: string;
  student_answer?: string | null;
  choice?: string[] | null;
  numeric_value?: number | null;
}

export type MockStatus =
  | "building" | "built" | "failed" | "in_progress" | "submitted" | "graded";

export interface MockBuildStatus {
  mock_test_id: string;
  status: MockStatus;
  stage: string;
  prepared: number;
  total: number;
  by_subject: { subject: string; prepared: number; total: number }[];
  error: string | null;
  shortfall: { subject: string; requested: number; got: number }[];
}

export interface MockHistoryItem {
  mock_test_id: string;
  exam: string;
  status: MockStatus;
  created_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  total_questions: number;
  attempted: number | null;
  correct: number | null;
  score: number | null;
  max_score: number | null;
  accuracy_pct: number | null;
  subjects: string[];
}

export interface MockHistory {
  tests: MockHistoryItem[];
  total: number;
}

export interface MockAnswerRequest {
  user_id: string;
  mock_test_id: string;
  content_id: string;
  student_answer?: string | null;
  choice?: string[] | null;
  numeric_value?: number | null;
  time_taken_sec?: number | null;
}

export interface SubjectScore {
  raw_score: number;
  max_score: number;
  accuracy_pct: number;
  questions_total: number;
  questions_attempted: number;
  questions_correct: number;
}

export interface GradedQuestion extends MockTestQuestion {
  grade_status: "correct" | "incorrect" | "unattempted" | "ungradable" | null;
  is_correct: boolean | null;
  question_score: number | null;
  answer_text: string | null;
  student_answer: string | null;
}

export interface MockTestResult {
  mock_test_id: string;
  status: string;
  exam: string;
  time_limit_minutes: number;
  started_at: string;
  submitted_at: string;
  overall: {
    raw_score: number;
    max_score: number;
    accuracy_pct: number;
    questions_total: number;
    questions_attempted: number;
    questions_correct: number;
  };
  subject_scores: Record<string, SubjectScore>;
  chapter_scores: Record<string, SubjectScore>;
  graded_questions: GradedQuestion[];
  debrief: string | null;
}

// ── API helpers ────────────────────────────────────────────────────────────────

/** The id every mock call uses; the gateway pins the real one, so never block on a missing value. */
export function mockUserId(): string {
  return auth.getSupabaseUserId() || "anonymous";
}

function agentBase(): string {
  return auth.requireAgentApiBase();
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

/** GET /mock/catalog — chapter list with gradeable PYQ counts. */
export async function fetchMockCatalog(
  userId: string,
  exam: string = "JEE_ADVANCED",
  subject?: string,
  types: QuestionTypeGroup[] = [],
): Promise<MockCatalog> {
  const params = new URLSearchParams({ user_id: userId, exam });
  if (subject) params.set("subject", subject);
  if (types.length) params.set("types", types.join(","));
  return auth.apiRequest<MockCatalog>(
    `${agentBase()}/mock/catalog?${params}`,
  );
}

/** POST /mock/build — validate config, select questions, persist. */
export async function buildMockTest(req: MockBuildRequest): Promise<MockBuildResult> {
  return auth.apiRequest<MockBuildResult>(`${agentBase()}/mock/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
}

/** POST /mock/start — flip status to in_progress, return question list. */
export async function startMockTest(
  userId: string,
  mockTestId: string,
): Promise<MockStartResult> {
  return auth.apiRequest<MockStartResult>(`${agentBase()}/mock/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, mock_test_id: mockTestId }),
  });
}

/** POST /mock/answer — save one student answer (idempotent). */
export async function submitAnswer(req: MockAnswerRequest): Promise<{ ok: boolean }> {
  return auth.apiRequest<{ ok: boolean }>(`${agentBase()}/mock/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
}

/** POST /mock/submit — grade all answers, compute analytics. */
export async function submitMockTest(
  userId: string,
  mockTestId: string,
): Promise<{ submitted: boolean; mock_test_id: string }> {
  return auth.apiRequest<{ submitted: boolean; mock_test_id: string }>(
    `${agentBase()}/mock/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, mock_test_id: mockTestId }),
    },
  );
}

/** GET /mock/result/{id} — full analytics + optional LLM debrief. */
export async function fetchMockResult(
  mockTestId: string,
  userId: string,
  includeDebrief: boolean = false,
): Promise<MockTestResult> {
  const params = new URLSearchParams({ user_id: userId });
  if (includeDebrief) params.set("include_debrief", "true");
  return auth.apiRequest<MockTestResult>(
    `${agentBase()}/mock/result/${encodeURIComponent(mockTestId)}?${params}`,
  );
}

/** GET /mock/status/{id} — build progress (also the current state of any test). */
export async function fetchMockStatus(
  mockTestId: string,
  userId: string,
): Promise<MockBuildStatus> {
  const params = new URLSearchParams({ user_id: userId });
  return auth.apiRequest<MockBuildStatus>(
    `${agentBase()}/mock/status/${encodeURIComponent(mockTestId)}?${params}`,
  );
}

/** GET /mock/history — the student's past mock tests, newest first. */
export async function fetchMockHistory(
  userId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<MockHistory> {
  const params = new URLSearchParams({
    user_id: userId,
    limit: String(limit),
    offset: String(offset),
  });
  return auth.apiRequest<MockHistory>(`${agentBase()}/mock/history?${params}`);
}
