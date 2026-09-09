import { getAgentApiBase } from "@/lib/auth";
import type { StudyStage } from "@/lib/roadmap";

export type FlashcardItem = {
  id: string;
  card_type: string;
  front: string;
  back: string;
  hint?: string | null;
  concept_id?: string | null;
  content_id?: string | null;
  selectable?: boolean;
};

export type FlashcardsPayload = {
  mode: "remediation" | "picker" | "quiz" | string;
  cards: FlashcardItem[];
};

export type GradingUIPayload = {
  show_correct_incorrect: boolean;
  prompt: string;
};

export type QuizAssessmentPayload = {
  batch_size: number;
  require_end_assessment: boolean;
};

export type ProactiveCardPayload = {
  card_type: string;
  title: string;
  duration_min?: number | null;
  proficiency_pct?: number | null;
  weak_prereq?: string | null;
  preview_text?: string | null;
  image_url?: string | null;
  actions?: string[];
  concept_id?: string | null;
  action?: string | null;
};

export type StudySlideItem = {
  id: string;
  type: string;
  title: string;
  body_md: string;
  image_url?: string | null;
};

export type SlidesPayload = {
  mode: string;
  slides: StudySlideItem[];
  current_index?: number;
};

export type StructuredLessonPayload = {
  filling_gap?: string;
  solution_steps?: string[];
  insight?: string;
};

export type TurnPresentationPayload = {
  slides?: SlidesPayload | null;
  flashcards?: FlashcardsPayload | null;
  grading_ui?: GradingUIPayload | null;
  quiz_assessment?: QuizAssessmentPayload | null;
  card?: ProactiveCardPayload | null;
  mistake_brief?: string | null;
  score_summary?: string | null;
  structured?: StructuredLessonPayload | null;
  proficiency_pct?: number | null;
  awaiting_graded_response?: boolean;
  follow_up_suggestions?: Array<Record<string, unknown> | string> | null;
  quiz_steps?: Array<Record<string, unknown>> | null;
  primary_concept_id?: string | null;
  content_type_requested?: string | null;
  practice_question?: Record<string, unknown> | null;
  practice_batch?: Record<string, unknown>[] | null;
  active_agent?: string | null;
  steps?: Array<{ step_id: string; text: string; order: number }> | null;
};

export type AgentChatResponse = {
  session_id: string;
  response?: string | null;
  score_summary?: string | null;
  mistake_brief?: string | null;
  agent_used?: string | null;
  follow_up_suggestions?: Array<Record<string, unknown> | string> | null;
  quiz_steps?: Array<Record<string, unknown>> | null;
  awaiting_graded_response?: boolean;
  flashcards?: FlashcardsPayload | null;
  grading_ui?: GradingUIPayload | null;
  quiz_assessment?: QuizAssessmentPayload | null;
  card?: ProactiveCardPayload | null;
  slides?: SlidesPayload | null;
  structured?: StructuredLessonPayload | null;
  proficiency_pct?: number | null;
  primary_concept_id?: string | null;
  content_type_requested?: string | null;
  practice_question?: Record<string, unknown> | null;
  practice_batch?: Record<string, unknown>[] | null;
  error?: string | null;
  active_agent?: string | null;
  agent_signals?: AgentStatusPayload | null;
  steps?: Array<{ step_id: string; text: string; order: number }> | null;
};

export type AgentCard = {
  id: string;
  name: string;
  description: string;
  status: string;
  signal: string;
  signal_type: string;
};

export type AgentStatusPayload = {
  agents: AgentCard[];
  active_agent?: string | null;
};

export type PlacementContext = {
  journeyType?: string | null;
  focusChapters?: string[];
};

export type ChatSessionSummary = {
  session_id: string;
  interaction_count: number;
  updated_at?: string | null;
  preview?: string | null;
};

export type ChatTurnItem = {
  turn_id: string;
  role: string;
  content: string;
  turn_index: number;
  agent_used?: string | null;
  presentation?: TurnPresentationPayload | null;
};

export function presentationToAgentResponse(
  sessionId: string,
  turn: ChatTurnItem,
): AgentChatResponse | null {
  const pres = turn.presentation;
  if (!pres && turn.role !== "assistant") return null;
  return {
    session_id: sessionId,
    response: turn.content,
    agent_used: turn.agent_used ?? null,
    score_summary: pres?.score_summary ?? null,
    mistake_brief: pres?.mistake_brief ?? null,
    awaiting_graded_response: pres?.awaiting_graded_response ?? false,
    flashcards: pres?.flashcards ?? null,
    grading_ui: pres?.grading_ui ?? null,
    quiz_assessment: pres?.quiz_assessment ?? null,
    card: pres?.card ?? null,
    slides: pres?.slides ?? null,
    structured: pres?.structured ?? null,
    proficiency_pct: pres?.proficiency_pct ?? null,
    follow_up_suggestions: pres?.follow_up_suggestions ?? null,
    quiz_steps: (pres?.quiz_steps as AgentChatResponse["quiz_steps"]) ?? null,
    primary_concept_id: pres?.primary_concept_id ?? null,
    content_type_requested: pres?.content_type_requested ?? null,
    practice_question: (pres?.practice_question as AgentChatResponse["practice_question"]) ?? null,
    practice_batch: (pres?.practice_batch as AgentChatResponse["practice_batch"]) ?? null,
    active_agent: pres?.active_agent ?? null,
    steps: pres?.steps ?? null,
  };
}

export type ChatSessionDetail = {
  session_id: string;
  interaction_count: number;
  turns: ChatTurnItem[];
};

function sessionApiError(response: Response, data: { detail?: string; error?: string }) {
  return data.detail || data.error || `Agent request failed (${response.status}).`;
}

export async function fetchChatSessions(
  userId: string,
  limit = 20,
): Promise<ChatSessionSummary[]> {
  const params = new URLSearchParams({ user_id: userId, limit: String(limit) });
  const response = await fetch(`${getAgentApiBase()}/api/v1/chat/sessions?${params}`);
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(sessionApiError(response, data));
  }
  const payload = (await response.json()) as { sessions: ChatSessionSummary[] };
  return payload.sessions ?? [];
}

export async function createChatSession(userId: string): Promise<string> {
  const response = await fetch(`${getAgentApiBase()}/api/v1/chat/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(sessionApiError(response, data));
  }
  const payload = (await response.json()) as { session_id: string };
  if (!payload.session_id) {
    throw new Error("Session created without an id.");
  }
  return payload.session_id;
}

export async function fetchChatSessionDetail(
  userId: string,
  sessionId: string,
): Promise<ChatSessionDetail> {
  const params = new URLSearchParams({ user_id: userId });
  const response = await fetch(
    `${getAgentApiBase()}/api/v1/chat/sessions/${sessionId}?${params}`,
  );
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(sessionApiError(response, data));
  }
  return (await response.json()) as ChatSessionDetail;
}

export type ConceptProficiency = {
  concept_id: string;
  proficiency_pct: number | null;
  proficiency_score?: number | null;
  flagged_weak?: boolean | null;
};

/** Durable mastery from Supabase `user_concept_state` for the Live proficiency panel. */
export async function fetchConceptProficiency(
  userId: string,
  conceptId: string,
): Promise<ConceptProficiency | null> {
  const params = new URLSearchParams({ user_id: userId });
  const response = await fetch(
    `${getAgentApiBase()}/api/v1/concepts/${encodeURIComponent(conceptId)}/proficiency?${params}`,
  );
  if (!response.ok) return null;
  return (await response.json()) as ConceptProficiency;
}

export async function sendChatMessage(payload: {
  userId: string;
  sessionId: string | null;
  query: string;
  roadmapConceptId?: string | null;
  roadmapNodeId?: string | null;
  studyStage?: StudyStage | null;
  gradedOutcome?: "correct" | "incorrect";
  placement?: PlacementContext;
  flaggedStepId?: string | null;
}, onToken?: (token: string) => void): Promise<AgentChatResponse> {
  const body: Record<string, unknown> = {
    user_id: payload.userId,
    session_id: payload.sessionId,
    query: payload.query,
  };
  if (payload.roadmapNodeId) body.roadmap_node_id = payload.roadmapNodeId;
  if (payload.roadmapConceptId) body.roadmap_concept_id = payload.roadmapConceptId;
  if (payload.studyStage) body.study_stage = payload.studyStage;
  if (payload.gradedOutcome) body.graded_outcome = payload.gradedOutcome;
  if (payload.flaggedStepId) body.flagged_step_id = payload.flaggedStepId;
  if (payload.placement?.journeyType) body.journey_type = payload.placement.journeyType;
  if (payload.placement?.focusChapters?.length) {
    body.focus_chapters = payload.placement.focusChapters;
  }

  const response = await fetch(`${getAgentApiBase()}/api/v1/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(data.detail || data.error || `Agent request failed (${response.status}).`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: AgentChatResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let lineEnd = buffer.indexOf("\n\n");
    while (lineEnd !== -1) {
      const eventBlock = buffer.slice(0, lineEnd);
      buffer = buffer.slice(lineEnd + 2);
      lineEnd = buffer.indexOf("\n\n");

      let eventType = "message";
      let eventData = "";

      const lines = eventBlock.split("\n");
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.substring(7).trim();
        } else if (line.startsWith("data: ")) {
          eventData = line.substring(6).trim();
        }
      }

      if (eventData) {
        if (eventType === "token" && onToken) {
          try {
            onToken(JSON.parse(eventData));
          } catch (e) {
            console.error("Failed to parse token", e);
          }
        } else if (eventType === "result") {
          finalResult = JSON.parse(eventData) as AgentChatResponse;
        } else if (eventType === "error") {
          throw new Error(JSON.parse(eventData));
        }
      }
    }
  }

  if (!finalResult) {
    throw new Error("Stream ended without returning a final result.");
  }

  return finalResult;
}

export async function executeSandboxAction(payload: {
  userId: string;
  sessionId: string | null;
  action: string;
  conceptId: string;
  conceptName?: string;
  roadmapNodeId?: string;
  reason?: string;
  durationMin?: number;
  proficiencyPct?: number;
  placement?: PlacementContext;
}): Promise<AgentChatResponse> {
  const response = await fetch(`${getAgentApiBase()}/api/v1/sandbox/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: payload.userId,
      session_id: payload.sessionId,
      action: payload.action,
      concept_id: payload.conceptId,
      concept_name: payload.conceptName,
      roadmap_node_id: payload.roadmapNodeId,
      reason: payload.reason,
      duration_min: payload.durationMin,
      proficiency_pct: payload.proficiencyPct,
      journey_type: payload.placement?.journeyType,
      focus_chapters: payload.placement?.focusChapters,
    }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(data.detail || data.error || `Sandbox execute failed (${response.status}).`);
  }

  return (await response.json()) as AgentChatResponse;
}

export async function fetchAgentStatus(params: {
  userId: string;
  sessionId?: string | null;
  roadmapConceptId?: string | null;
  primaryConceptId?: string | null;
  activeAgent?: string | null;
  focusChapters?: string[];
}): Promise<AgentStatusPayload> {
  const qs = new URLSearchParams({ user_id: params.userId });
  if (params.sessionId) qs.set("session_id", params.sessionId);
  if (params.roadmapConceptId) qs.set("roadmap_concept_id", params.roadmapConceptId);
  if (params.primaryConceptId) qs.set("primary_concept_id", params.primaryConceptId);
  if (params.activeAgent) qs.set("active_agent", params.activeAgent);
  if (params.focusChapters?.length) qs.set("focus_chapters", params.focusChapters.join(","));

  const response = await fetch(`${getAgentApiBase()}/api/v1/agents/status?${qs}`);
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(data.detail || data.error || `Agent status failed (${response.status}).`);
  }
  return (await response.json()) as AgentStatusPayload;
}

export type DailyBriefingPayload = {
  briefing_text?: string | null;
  mission?: Record<string, unknown> | null;
  pcm?: Record<string, unknown> | null;
  goal?: Record<string, unknown> | null;
};

/** Mentor Briefing card + dashboard coach note from Django analytics. */
export async function fetchDailyBriefing(): Promise<DailyBriefingPayload | null> {
  const { apiRequest, getApiBaseUrl } = await import("@/lib/auth");
  try {
    return await apiRequest<DailyBriefingPayload>(
      `${getApiBaseUrl()}/analytics/daily-briefing/`,
    );
  } catch {
    return null;
  }
}
