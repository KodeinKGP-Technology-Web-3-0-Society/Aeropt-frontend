import * as auth from "@/lib/api/auth";
import {
  AGENT_STREAM_STALL_TIMEOUT_MS,
  AGENT_STREAM_TOTAL_TIMEOUT_MS,
  AgentStreamError,
  type AgentStreamErrorKind,
} from "@/lib/api/agent";

export type StudyPhase = "learn" | "examples" | "practice" | "evaluation" | "completed";
export type StudyOutcome = "mastered" | "needs_review" | "incomplete" | null;

export interface StudyPracticeOption {
  label: string;
  text: string;
}

export interface StudyPracticeQuestion {
  content_id: string;
  question_text: string;
  question_type?: string | null;
  difficulty: number;
  has_solution: boolean;
  source?: string | null;
  /** Structured layout from ingest (agent local_ingest/structure.py). When present, render
   *  these — never re-split question_text, which broke on figures that mention "(A), (B)". */
  stem?: string | null;
  figure?: string | null;
  options?: StudyPracticeOption[] | null;
  /** Sub-questions (a), (b), … of a multi-part problem — not options. */
  parts?: StudyPracticeOption[] | null;
  /** The answer's form only (never the answer): option buttons or a number box. */
  answer_kind?: "choice" | "multiple" | "number" | "choice_or_number" | null;
  /** True when /study/answer can grade it instantly from the official key. */
  instant_grading?: boolean;
}

/** The numbers the room renders: phase stepper, score strip, practice pane. */
export interface StudyState {
  study_session_id: string;
  concept_id: string;
  concept_name: string;
  chapter?: string | null;
  current_phase: StudyPhase;
  difficulty_level: number;
  questions_served: number;
  questions_correct: number;
  outcome?: StudyOutcome;
  practice_question?: StudyPracticeQuestion | null;
  /** The teacher's outline per phase, e.g. { learn: ["Energy storage", …] }. */
  lesson_plan?: Partial<Record<StudyPhase, string[]>>;
  /** Parts of the current phase already completed. */
  phase_step?: number;
  phase_turns?: number;
  started_at?: string;
  /** Results-card text, stored when the session finished. */
  evaluation_summary?: string | null;
  /** "practice" = straight to questions, no Learn / Examples. */
  mode?: StudyMode;
  question_source?: QuestionSource;
}

export type StudyMode = "learn" | "practice";
export type QuestionSource = "any" | "pyq";

/** One live "what the tutor is doing" event from the agent's status stream. */
export interface StudyStatusEvent {
  kind: "tool" | "stage";
  name: string;
  state: "start" | "done" | "error";
  label: string;
  thought?: string;
  material?: {
    concept_id?: string;
    title?: string;
    sources?: string[];
    chunks_found?: number;
    snippets?: Array<{
      title?: string;
      text?: string;
      cite?: string;
    }>;
  };
}

export interface StudySessionView {
  concept_id: string | null;
  concept_name: string | null;
  chapter?: string | null;
  outcome?: StudyOutcome;
  phase?: StudyPhase | null;
  questions_served: number;
  questions_correct: number;
  difficulty_reached?: number | null;
  when: string;
}

export interface StudyPrerequisite {
  concept_id: string;
  concept_name: string;
  proficiency?: number;
  attempts?: number;
  studied?: StudySessionView;
}

/** What the tutor already knows about the student for this concept. */
export interface StudyLearnerSnapshot {
  returning: boolean;
  prior_sessions: StudySessionView[];
  proficiency?: { proficiency: number; attempts: number; correct: number; flagged_weak: boolean } | null;
  readiness?: number | null;
  prerequisites: StudyPrerequisite[];
  related_sessions: StudySessionView[];
  memories: { kind: string; fact: string; about?: string | null }[];
  recommended_difficulty?: number | null;
}

export interface StudyTranscriptTurn {
  role: "user" | "assistant";
  content: string;
  practice_question?: StudyPracticeQuestion | null;
}

export interface StudyStartResponse extends StudyState {
  session_id: string;
  resumed: boolean;
  resolved_from: string;
  in_syllabus: boolean;
  definition?: string | null;
  alternatives: { concept_id: string; concept_name: string; chapter?: string | null }[];
  learner: StudyLearnerSnapshot;
  transcript: StudyTranscriptTurn[];
  readiness_score?: number | null;
}

export interface StudySession {
  study_session_id: string;
  concept_id: string;
  concept_name?: string;
  chapter?: string;
  current_phase: StudyPhase;
  questions_served: number;
  questions_correct: number;
  difficulty_level: number;
  started_at: string;
  completed_at?: string;
  outcome?: StudyOutcome;
  /** Messages in the session (history endpoint); 0 means opened but never used. */
  message_count?: number;
}

export interface StudyMessageResponse {
  /** The student pressed Stop: nothing was saved, `response` is empty. */
  cancelled?: boolean;
  session_id: string;
  response: string;
  current_phase: StudyPhase;
  practice_question?: StudyPracticeQuestion | null;
  evaluation_summary?: string | null;
  readiness_score?: number | null;
  readiness_delta?: number | null;
  tools_used?: string[];
  study: StudyState;
}

// Concurrent starts for the same topic share one request. React mounts effects
// twice in development, and two POSTs used to create two sessions per visit.
const inflightStarts = new Map<string, Promise<StudyStartResponse>>();

export function startStudySession(
  topic: string,
  options: { forceNew?: boolean; studySessionId?: string | null; mode?: StudyMode; questionSource?: QuestionSource } = {},
): Promise<StudyStartResponse> {
  const userId = auth.getSupabaseUserId();
  if (!userId) {
    return Promise.reject(new Error("User not authenticated."));
  }
  const mode = options.studySessionId ? `id:${options.studySessionId}` : options.forceNew ? "new" : "resume";
  const key = `${userId}:${topic}:${mode}:${options.mode ?? "learn"}:${options.questionSource ?? "any"}`;
  const existing = inflightStarts.get(key);
  if (existing) return existing;

  const base = auth.requireAgentApiBase();
  const request = auth
    .apiRequest<StudyStartResponse>(`${base}/api/v1/study/start`, {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        concept_id: topic,
        force_new: Boolean(options.forceNew),
        study_session_id: options.studySessionId || undefined,
        mode: options.mode ?? "learn",
        question_source: options.questionSource ?? "any",
      }),
    })
    .finally(() => {
      // Keep the settled promise briefly so the second StrictMode mount reuses it.
      setTimeout(() => inflightStarts.delete(key), 2000);
    });
  inflightStarts.set(key, request);
  return request;
}

export async function fetchStudyHistory(): Promise<StudySession[]> {
  const userId = auth.getSupabaseUserId();
  if (!userId) return [];

  const base = auth.requireAgentApiBase();
  return auth.apiRequest<StudySession[]>(
    `${base}/api/v1/study/history/${encodeURIComponent(userId)}`
  );
}

/**
 * One Study Room turn. The agent answers after the whole turn (teacher, tools,
 * answer check) has run, sending `: keepalive` comments every 15 s meanwhile;
 * any bytes reset the stall timer, so only a dead connection times out.
 */
export interface StudyAdvanceResponse {
  study: StudyState;
  evaluation_summary?: string | null;
  readiness_score?: number | null;
  readiness_delta?: number | null;
}

/** Stop the turn running for this session (it ends at its next step and saves nothing). */
export async function stopStudyTurn(studySessionId: string): Promise<void> {
  const userId = auth.getSupabaseUserId();
  if (!userId) return;
  await auth
    .apiRequest(`${auth.requireAgentApiBase()}/api/v1/study/stop`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, study_session_id: studySessionId }),
    })
    .catch(() => undefined);
}

export type ChoiceResult =
  | { graded: false }
  | {
      graded: true;
      correct: boolean;
      key: number[];
      chosen: number[];
      /** The official answer as shown ("(A), (C)", "anything from 1.15 to 1.25"). */
      answer_text?: string;
      /** The stored, verified solution — shown at once instead of waiting for the tutor. */
      solution?: string;
      study: StudyState;
    };

/**
 * Grade a multiple-choice pick against the stored key — instant, no model call.
 * `choice` is the option labels as shown ("2", or "A","C" for multiple correct).
 * `{graded: false}` means the question has no readable key: ask the tutor instead.
 */
export async function submitStudyChoice(
  studySessionId: string,
  choice: string[],
  value?: string,
): Promise<ChoiceResult> {
  const userId = auth.getSupabaseUserId();
  if (!userId) throw new Error("User not authenticated.");
  return auth.apiRequest<ChoiceResult>(`${auth.requireAgentApiBase()}/api/v1/study/answer`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, study_session_id: studySessionId, choice, value }),
  });
}

export type NextQuestionResult = { served: boolean; revisit?: boolean; reason?: string | null; study: StudyState };

/** Serve the next practice question directly — retrieval only, no tutor turn (milliseconds). */
export async function nextStudyQuestion(studySessionId: string): Promise<NextQuestionResult> {
  const userId = auth.getSupabaseUserId();
  if (!userId) throw new Error("User not authenticated.");
  return auth.apiRequest<NextQuestionResult>(`${auth.requireAgentApiBase()}/api/v1/study/next`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, study_session_id: studySessionId }),
  });
}

/** The student's own skip / finish: moves the phase on the server, no model turn. */
export async function advanceStudyPhase(studySessionId: string): Promise<StudyAdvanceResponse> {
  const userId = auth.getSupabaseUserId();
  if (!userId) throw new Error("User not authenticated.");
  return auth.apiRequest<StudyAdvanceResponse>(`${auth.requireAgentApiBase()}/api/v1/study/advance`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, study_session_id: studySessionId }),
  });
}

export async function sendStudyMessage(
  payload: { sessionId: string; studySessionId: string; query: string },
  signal?: AbortSignal,
  onStatus?: (event: StudyStatusEvent) => void,
  /** The reviewed reply, word by word, before the final `result` frame. */
  onToken?: (token: string) => void,
): Promise<StudyMessageResponse> {
  const userId = auth.getSupabaseUserId();
  if (!userId) throw new AgentStreamError("You're signed out. Sign in again to continue.", { kind: "protocol" });

  const controller = new AbortController();
  let abortReason: AgentStreamErrorKind | null = null;
  const abortWith = (reason: AgentStreamErrorKind) => {
    abortReason = reason;
    controller.abort();
  };
  signal?.addEventListener("abort", () => controller.abort(), { once: true });
  const totalTimer = setTimeout(() => abortWith("timeout"), AGENT_STREAM_TOTAL_TIMEOUT_MS);
  let stallTimer: ReturnType<typeof setTimeout> | undefined;
  const armStall = () => {
    if (stallTimer) clearTimeout(stallTimer);
    stallTimer = setTimeout(() => abortWith("timeout"), AGENT_STREAM_STALL_TIMEOUT_MS);
  };
  const clearTimers = () => {
    clearTimeout(totalTimer);
    if (stallTimer) clearTimeout(stallTimer);
  };
  const lostMessage = "Lost the connection to your tutor. Your message is still here — retry when ready.";

  try {
    armStall();
    let response: Response;
    try {
      response = await auth.authedFetch(`${auth.requireAgentApiBase()}/api/v1/study/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          session_id: payload.sessionId,
          study_session_id: payload.studySessionId,
          query: payload.query,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (signal?.aborted) throw err;
      throw new AgentStreamError(lostMessage, { kind: abortReason ?? "network" });
    }

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new AgentStreamError(data.detail || `The tutor could not take that message (${response.status}).`, {
        kind: response.status >= 500 ? "server" : "protocol",
      });
    }
    const reader = response.body?.getReader();
    if (!reader) throw new AgentStreamError("The tutor's reply arrived empty.", { kind: "protocol" });

    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        armStall();
        chunk = await reader.read();
      } catch (err) {
        if (signal?.aborted) throw err;
        throw new AgentStreamError(lostMessage, { kind: abortReason ?? "network" });
      }
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });

      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        let event = "message";
        let data = "";
        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) event = line.slice(6).trim();
          else if (line.startsWith("data:")) data += line.slice(5).trim();
        }
        if (event === "status" && data) {
          try {
            onStatus?.(JSON.parse(data) as StudyStatusEvent);
          } catch {
            /* a malformed status line is cosmetic; keep reading */
          }
          continue;
        }
        if (event === "token" && data) {
          try {
            onToken?.(JSON.parse(data) as string);
          } catch {
            /* a malformed token only costs a word of animation; the result carries the full text */
          }
          continue;
        }
        if (event !== "result" || !data) continue; // keepalive comments land here
        const parsed = JSON.parse(data) as StudyMessageResponse & { error?: string; student_message?: string | null };
        if (parsed.error) {
          throw new AgentStreamError(
            parsed.student_message || "Your tutor hit a problem with that message. Try sending it again.",
            { kind: "server" },
          );
        }
        return parsed;
      }
    }
    throw new AgentStreamError("The tutor's reply ended early. Try sending it again.", { kind: "protocol" });
  } finally {
    clearTimers();
  }
}

// ── /study landing page (agent services/study_overview.py) ──────────────────

export interface OverviewConcept {
  concept_id: string;
  name: string;
  chapter: string;
  chapter_id: string;
  proficiency?: number | null;
  attempts?: number;
  correct?: number;
  last_practised?: string | null;
  phase?: string | null;
  study_session_id?: string | null;
  reason?: string;
  due_at?: string | null;
  overdue?: boolean;
}

export interface OverviewGroup {
  chapter: string;
  chapter_id: string;
  concepts: OverviewConcept[];
}

export interface UpNextItem extends OverviewConcept {
  kind: "review" | "resume" | "next" | "start";
  reason: string;
}

export interface CoverageChapter {
  chapter_id: string;
  chapter: string;
  total: number;
  mastered: number;
  started: number;
  remaining: number;
  next: { concept_id: string; name: string }[];
}

/** One JEE Main syllabus unit (NTA 2026-27) and its topics, exam order within a subject. */
export interface SyllabusUnit {
  unit: string;
  /** Physics, Chemistry, or Mathematics. Absent on older overview payloads. */
  subject?: string;
  total: number;
  mastered: number;
  started: number;
  topics: {
    topic: string;
    concept_id: string;
    status: "mastered" | "started" | "review" | "new";
    /** No textbook section behind it (lab experiments, logic gates…): the tutor teaches it directly. */
    tutor_taught: boolean;
  }[];
}

export interface StudyOverview {
  up_next: UpNextItem[];
  mastered: OverviewGroup[];
  in_progress: OverviewGroup[];
  needs_review: OverviewGroup[];
  counts: { mastered: number; in_progress: number; needs_review: number };
  coverage: CoverageChapter[];
  syllabus: SyllabusUnit[];
}

export async function fetchStudyOverview(): Promise<StudyOverview> {
  const userId = auth.getSupabaseUserId();
  if (!userId) throw new Error("User not authenticated.");
  let tz = "Asia/Kolkata";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz;
  } catch {
    /* keep the default */
  }
  return auth.apiRequest<StudyOverview>(
    `${auth.requireAgentApiBase()}/api/v1/study/overview/${encodeURIComponent(userId)}?tz=${encodeURIComponent(tz)}`,
  );
}
