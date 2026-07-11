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

export type AgentChatResponse = {
  session_id: string;
  response?: string | null;
  score_summary?: string | null;
  mistake_brief?: string | null;
  agent_used?: string | null;
  follow_up_suggestions?: Array<Record<string, unknown>> | null;
  quiz_steps?: Array<Record<string, unknown>> | null;
  awaiting_graded_response?: boolean;
  flashcards?: FlashcardsPayload | null;
  grading_ui?: GradingUIPayload | null;
  quiz_assessment?: QuizAssessmentPayload | null;
  card?: ProactiveCardPayload | null;
  proficiency_pct?: number | null;
  error?: string | null;
};

export type PlacementContext = {
  journeyType?: string | null;
  focusChapters?: string[];
};

export async function sendChatMessage(payload: {
  userId: string;
  sessionId: string | null;
  query: string;
  roadmapConceptId?: string | null;
  roadmapNodeId?: string | null;
  studyStage?: StudyStage | null;
  gradedOutcome?: "correct" | "incorrect";
  placement?: PlacementContext;
}): Promise<AgentChatResponse> {
  const body: Record<string, unknown> = {
    user_id: payload.userId,
    session_id: payload.sessionId,
    query: payload.query,
  };
  if (payload.roadmapNodeId) body.roadmap_node_id = payload.roadmapNodeId;
  if (payload.roadmapConceptId) body.roadmap_concept_id = payload.roadmapConceptId;
  if (payload.studyStage) body.study_stage = payload.studyStage;
  if (payload.gradedOutcome) body.graded_outcome = payload.gradedOutcome;
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

  return (await response.json()) as AgentChatResponse;
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
