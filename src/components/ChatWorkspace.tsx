"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import MarkdownMath from "@/components/MarkdownMath";
import StudySidebar from "@/components/StudySidebar";
import {
  CollapsibleScoreSummary,
  FlashcardDeck,
  GradingButtons,
  QuizAssessmentNotice,
  StudyStepBar,
} from "@/components/StudySessionCards";
import { AgentChatResponse, PlacementContext, sendChatMessage, fetchChatSessions, fetchChatSessionDetail, type ChatTurnItem } from "@/lib/agent";
import { getSupabaseUserId } from "@/lib/auth";
import { getAgentApiBase } from "@/lib/auth";
import type { FlashcardItem } from "@/lib/agent";
import * as onboarding from "@/lib/onboarding";
import {
  fetchRoadmap,
  stagePrompt,
  updateRoadmapProgress,
  type PathNode,
  type StudyStage,
} from "@/lib/roadmap";

type PrerequisiteNode = {
  concept: string;
  score: number;
  color: string;
};

type StructuredResponse = {
  filling_gap: string;
  solution_steps: string[];
  insight: string;
  try_next: string[];
  concepts_mentioned: string[];
  prerequisite_chain: PrerequisiteNode[];
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  structured_response?: StructuredResponse | null;
  agent?: AgentChatResponse | null;
};

type Session = {
  id: string;
  title: string;
};

const agentBaseUrl = getAgentApiBase();
const SESSION_STORAGE_KEY = "agent_active_session_id";

const fallbackPrompts = [
  "Explain torque and moment of inertia",
  "Give me a practice question on Newton's 2nd law",
];

function formatSessionTitle(
  preview: string | null | undefined,
  updatedAt: string | null | undefined,
  index: number,
): string {
  if (preview?.trim()) {
    const trimmed = preview.trim();
    return trimmed.length > 48 ? `${trimmed.slice(0, 47)}…` : trimmed;
  }
  if (updatedAt) {
    const date = new Date(updatedAt);
    if (!Number.isNaN(date.getTime())) {
      return `Session · ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    }
  }
  return `Session ${index + 1}`;
}

function turnsToMessages(turns: ChatTurnItem[], sessionId: string): Message[] {
  return turns.map((turn) => ({
    id: turn.turn_id || `turn-${turn.turn_index}`,
    role: turn.role === "user" ? "user" : "assistant",
    content: turn.content,
    agent:
      turn.role === "user"
        ? null
        : {
            session_id: sessionId,
            response: turn.content,
            agent_used: turn.agent_used ?? null,
          },
  }));
}

function ArrowUpIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M12 19V5m0 0-6 6m6-6 6 6" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M5 5h14v14H5V5Zm10 0v14" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="assistant-thinking">
      <span />
      <span />
      <span />
    </div>
  );
}

type AgentChatResponseLegacy = AgentChatResponse;

function AssistantExtras({
  agent,
  onGrade,
  onPickCard,
  gradingDisabled,
  suppressPicker,
}: {
  agent?: AgentChatResponse | null;
  onGrade: (outcome: "correct" | "incorrect") => void;
  onPickCard: (card: FlashcardItem) => void;
  gradingDisabled?: boolean;
  suppressPicker?: boolean;
}) {
  if (!agent) return null;
  const showFlashcards =
    agent.flashcards &&
    !(suppressPicker && agent.flashcards.mode === "picker");
  return (
    <>
      {agent.grading_ui && (
        <GradingButtons gradingUi={agent.grading_ui} disabled={gradingDisabled} onGrade={onGrade} />
      )}
      {showFlashcards && (
        <FlashcardDeck
          cards={agent.flashcards!.cards}
          mode={agent.flashcards!.mode}
          onSelect={agent.flashcards!.mode === "picker" ? onPickCard : undefined}
        />
      )}
      {agent.score_summary && <CollapsibleScoreSummary summary={agent.score_summary} />}
      {agent.quiz_assessment?.require_end_assessment && (
        <QuizAssessmentNotice batchSize={agent.quiz_assessment.batch_size} />
      )}
    </>
  );
}

function AssistantResponse({
  message,
  onGrade,
  onPickCard,
  gradingDisabled,
  suppressPicker,
}: {
  message: Message;
  onGrade: (outcome: "correct" | "incorrect") => void;
  onPickCard: (card: FlashcardItem) => void;
  gradingDisabled?: boolean;
  suppressPicker?: boolean;
}) {
  const structured = message.structured_response;

  if (!structured) {
    return (
      <article className="lesson-response assistant-plain">
        <MarkdownMath content={message.content} />
        <AssistantExtras
          agent={message.agent}
          onGrade={onGrade}
          onPickCard={onPickCard}
          gradingDisabled={gradingDisabled}
          suppressPicker={suppressPicker}
        />
      </article>
    );
  }

  return (
    <article className="lesson-response">
      {structured.filling_gap && (
        <section className="lesson-gap">
          <h3>FILLING A GAP FIRST</h3>
          <MarkdownMath content={structured.filling_gap} />
        </section>
      )}

      {structured.solution_steps.length > 0 && (
        <section className="lesson-solution">
          <div className="solution-rule">
            <span>SOLUTION</span>
          </div>
          {structured.solution_steps.map((line, index) => (
            <div className="solution-step" key={`${index}-${line}`}>
              <span>{index + 1}</span>
              <MarkdownMath content={line} />
            </div>
          ))}
        </section>
      )}

      {structured.insight && (
        <div className="lesson-note">
          <MarkdownMath content={structured.insight} />
        </div>
      )}
      {!structured.filling_gap && !structured.solution_steps.length && (
        <div className="assistant-plain">
          <MarkdownMath content={message.content} />
        </div>
      )}
      <AssistantExtras
        agent={message.agent}
        onGrade={onGrade}
        onPickCard={onPickCard}
        gradingDisabled={gradingDisabled}
        suppressPicker={suppressPicker}
      />
    </article>
  );
}

function normalizeSuggestions(
  suggestions: AgentChatResponseLegacy["follow_up_suggestions"],
): string[] {
  if (!suggestions) return [];
  return suggestions
    .map((item) => {
      if (typeof item === "string") return item;
      const preview = (item as { preview?: string }).preview;
      return preview || (item as { text?: string }).text || "";
    })
    .filter(Boolean);
}

function buildAssistantMessage(response: AgentChatResponseLegacy): Message {
  const text = response.response?.trim() || "I could not generate a response.";
  const tryNext = normalizeSuggestions(response.follow_up_suggestions);

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: text,
    agent: response,
    structured_response: {
      filling_gap: "",
      solution_steps: [],
      insight: "",
      try_next: tryNext,
      concepts_mentioned: [],
      prerequisite_chain: [],
    },
  };
}

export default function ChatWorkspace() {
  const searchParams = useSearchParams();
  const roadmapConceptId = searchParams.get("concept_id");
  const roadmapNodeId = searchParams.get("node_id");
  const roadmapPrompt = searchParams.get("prompt");
  const initialStage = (searchParams.get("stage") as StudyStage | null) ?? "theory";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [awaitingGrade, setAwaitingGrade] = useState(false);
  const [error, setError] = useState("");
  const [placementContext, setPlacementContext] = useState<PlacementContext>({});
  const [roadmapNode, setRoadmapNode] = useState<PathNode | null>(null);
  const [contentSequence, setContentSequence] = useState<string[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [conceptComplete, setConceptComplete] = useState(false);
  const [lastProficiencyPct, setLastProficiencyPct] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const progressMarkedRef = useRef(false);

  const isRoadmapSession = Boolean(roadmapNodeId && contentSequence.length > 0);

  useEffect(() => {
    if (!roadmapNodeId) return;
    const loadNode = async () => {
      try {
        const roadmap = await fetchRoadmap();
        const node = roadmap.nodes.find((item) => item.id === roadmapNodeId) ?? null;
        if (!node) return;
        setRoadmapNode(node);
        const sequence = node.content_sequence?.length
          ? node.content_sequence
          : ["theory", "example", "practice", "pyq"];
        setContentSequence(sequence);
        const stageIndex = Math.max(0, sequence.indexOf(initialStage));
        setCurrentStageIndex(stageIndex >= 0 ? stageIndex : 0);
        if (!progressMarkedRef.current && node.status !== "completed") {
          progressMarkedRef.current = true;
          await updateRoadmapProgress({ node_id: node.id, status: "in_progress" });
        }
        if (node.status === "completed") {
          setConceptComplete(true);
        }
      } catch {
        setContentSequence(["theory", "example", "practice", "pyq"]);
      }
    };
    void loadNode();
  }, [roadmapNodeId, initialStage]);

  const completeConcept = useCallback(async (proficiencyPct?: number | null) => {
    if (!roadmapNodeId || conceptComplete) return;
    try {
      await updateRoadmapProgress({
        node_id: roadmapNodeId,
        status: "completed",
        proficiency_pct: proficiencyPct ?? lastProficiencyPct ?? undefined,
      });
      setConceptComplete(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update roadmap progress.");
    }
  }, [roadmapNodeId, conceptComplete, lastProficiencyPct]);

  useEffect(() => {
    const loadPlacement = async () => {
      try {
        const me = await onboarding.fetchMe();
        const placement = me.placement;
        const baseline = (placement?.diagnostic_baseline || {}) as {
          chapter_scores?: Record<string, number>;
        };
        const chapterScores = baseline.chapter_scores || {};
        const focusChapters = Object.entries(chapterScores)
          .filter(([, score]) => score < 0.45)
          .map(([chapter]) => chapter)
          .slice(0, 3);
        setPlacementContext({
          journeyType: placement?.journey_type ?? null,
          focusChapters:
            focusChapters.length > 0
              ? focusChapters
              : (placement?.covered_chapters || []).slice(0, 2),
        });
      } catch {
        setPlacementContext({});
      }
    };
    void loadPlacement();
  }, []);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

  const latestAssistant = useMemo(
    () => [...messages].reverse().find((message) => message.role === "assistant") ?? null,
    [messages],
  );

  const quickPrompts = useMemo(() => {
    const fromBackend = latestAssistant?.structured_response?.try_next?.filter(Boolean);
    if (fromBackend && fromBackend.length > 0) return fromBackend;
    return fallbackPrompts;
  }, [latestAssistant]);

  async function sendAgentMessage(
    query: string,
    sessionId: string | null,
    options?: {
      conceptId?: string | null;
      nodeId?: string | null;
      studyStage?: StudyStage | null;
      gradedOutcome?: "correct" | "incorrect";
    },
  ) {
    const userId = getSupabaseUserId();
    if (!userId) {
      throw new Error("Missing Supabase user link. Sign out and sign in again.");
    }

    const stage =
      options?.studyStage ??
      (isRoadmapSession ? (contentSequence[currentStageIndex] as StudyStage) : null);

    return sendChatMessage({
      userId,
      sessionId,
      query,
      roadmapConceptId: options?.conceptId ?? roadmapConceptId,
      roadmapNodeId: options?.nodeId ?? roadmapNodeId,
      studyStage: stage,
      gradedOutcome: options?.gradedOutcome,
      placement: placementContext,
    });
  }

  function registerSession(sessionId: string, title?: string) {
    setActiveSessionId(sessionId);
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    setSessions((current) => {
      if (current.some((session) => session.id === sessionId)) return current;
      return [{ id: sessionId, title: title || `Session ${current.length + 1}` }, ...current];
    });
  }

  const loadSessionHistory = useCallback(async (sessionId: string) => {
    const userId = getSupabaseUserId();
    if (!userId) return;

    setIsLoadingSession(true);
    setError("");
    try {
      const detail = await fetchChatSessionDetail(userId, sessionId);
      setMessages(turnsToMessages(detail.turns, sessionId));
      setActiveSessionId(sessionId);
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
      setAwaitingGrade(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load session history.");
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  async function selectSession(sessionId: string) {
    if (sessionId === activeSessionId || isReplying || isLoadingSession) return;
    setMessages([]);
    await loadSessionHistory(sessionId);
  }

  function createSession() {
    setActiveSessionId(null);
    setMessages([]);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setError("");
  }

  async function endSession() {
    if (!activeSessionId || isEndingSession) return;
    const userId = getSupabaseUserId();
    if (!userId) return;

    setIsEndingSession(true);
    setError("");
    try {
      await fetch(`${agentBaseUrl}/api/v1/chat/end-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, session_id: activeSessionId }),
      });
      setActiveSessionId(null);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to end this session.");
    } finally {
      setIsEndingSession(false);
    }
  }

  async function handleAgentResponse(agentResponse: AgentChatResponse) {
    if (agentResponse.error) {
      throw new Error(agentResponse.error);
    }
    registerSession(agentResponse.session_id);
    setAwaitingGrade(Boolean(agentResponse.grading_ui?.show_correct_incorrect));
    if (typeof agentResponse.proficiency_pct === "number") {
      setLastProficiencyPct(agentResponse.proficiency_pct);
    }
    const assistantMessage = buildAssistantMessage(agentResponse);
    setMessages((current) => [...current, assistantMessage]);
    return agentResponse;
  }

  async function submitGrade(outcome: "correct" | "incorrect") {
    setAwaitingGrade(false);
    const agentResponse = await submitMessage(outcome === "correct" ? "1" : "0", outcome);
    if (!agentResponse || !isRoadmapSession) return;

    const currentStage = contentSequence[currentStageIndex];
    if (!currentStage || !["practice", "pyq"].includes(currentStage)) return;

    if (currentStageIndex >= contentSequence.length - 1) {
      await completeConcept(agentResponse.proficiency_pct ?? lastProficiencyPct);
    } else {
      setCurrentStageIndex((index) => index + 1);
    }
  }

  async function advanceStudyStage(nextStage: StudyStage) {
    if (!roadmapNode) return;
    const nextIndex = contentSequence.indexOf(nextStage);
    if (nextIndex >= 0) {
      setCurrentStageIndex(nextIndex);
    }
    await submitMessage(stagePrompt(roadmapNode.concept_name, nextStage), undefined, nextStage);
  }

  async function submitMessage(
    value: string,
    gradedOutcome?: "correct" | "incorrect",
    studyStage?: StudyStage,
  ): Promise<AgentChatResponse | null> {
    const trimmed = value.trim();
    const isGradeTap = Boolean(gradedOutcome);
    if ((!trimmed && !isGradeTap) || isReplying) return null;

    const display = isGradeTap ? (gradedOutcome === "correct" ? "Correct" : "Incorrect") : trimmed;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: display,
    };

    if (!isGradeTap) setInput("");
    setError("");
    setIsReplying(true);
    setMessages((current) => [...current, userMessage]);

    try {
      const agentResponse = await sendAgentMessage(isGradeTap ? "1" : trimmed, activeSessionId, {
        gradedOutcome,
        studyStage,
      });
      return await handleAgentResponse(agentResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
      return null;
    } finally {
      setIsReplying(false);
    }
  }

  async function submitPickerCard(card: FlashcardItem) {
    if (card.content_id) {
      await submitMessage(`Follow up: select content_id=${card.content_id}`);
      return;
    }
    await submitMessage(`Follow up: ${card.front.slice(0, 80)}`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(input);
  }

  useEffect(() => {
    const bootstrapSessions = async () => {
      const userId = getSupabaseUserId();
      if (!userId) {
        setSessionsReady(true);
        return;
      }

      try {
        const list = await fetchChatSessions(userId);
        const mapped: Session[] = list.map((session, index) => ({
          id: session.session_id,
          title: formatSessionTitle(session.preview, session.updated_at, index),
        }));
        setSessions(mapped);

        const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        const targetId =
          savedSessionId && mapped.some((session) => session.id === savedSessionId)
            ? savedSessionId
            : mapped[0]?.id ?? null;

        if (targetId) {
          await loadSessionHistory(targetId);
        }
      } catch (caught) {
        const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSessionId) {
          setActiveSessionId(savedSessionId);
          setSessions([{ id: savedSessionId, title: "Current session" }]);
          try {
            await loadSessionHistory(savedSessionId);
          } catch {
            setError(
              caught instanceof Error ? caught.message : "Could not load your previous sessions.",
            );
          }
        } else {
          setError(
            caught instanceof Error ? caught.message : "Could not load your previous sessions.",
          );
        }
      } finally {
        setSessionsReady(true);
      }
    };

    void bootstrapSessions();
  }, [loadSessionHistory]);

  useEffect(() => {
    if (!sessionsReady || !roadmapPrompt || messages.length > 0 || isReplying || isLoadingSession) {
      return;
    }
    void submitMessage(roadmapPrompt);
  }, [roadmapPrompt, messages.length, isReplying, isLoadingSession, sessionsReady]);

  return (
    <main className="chat-page">
      <StudySidebar />

      <section className="chat-main">
        <header className="chat-header">
          <h1>{activeSession?.title ?? "Study Session"}</h1>
          <div className="header-actions">
            <button type="button" className="header-action-button" onClick={createSession}>
              New chat
            </button>
            <button
              type="button"
              className="end-session"
              onClick={() => void endSession()}
              disabled={!activeSessionId || isEndingSession}
            >
              {isEndingSession ? "Ending..." : "End Session"}
            </button>
          </div>
        </header>

        <div className="chat-scroll">
          <div className="session-list">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className={`session-pill ${session.id === activeSessionId ? "session-pill-active" : ""}`}
                onClick={() => void selectSession(session.id)}
              >
                {session.title}
              </button>
            ))}
          </div>

          {isLoadingSession && messages.length === 0 && (
            <p className="chat-error">Loading your last session…</p>
          )}

          {!isLoadingSession && messages.length === 0 && (
            <p className="chat-error">
              Ask a doubt, request practice, or say &quot;quiz me on torque&quot; to start.
            </p>
          )}

          {messages.map((message) =>
            message.role === "user" ? (
              <div className="user-bubble" key={message.id}>
                {message.content}
              </div>
            ) : (
              <AssistantResponse
                key={message.id}
                message={message}
                onGrade={(outcome) => void submitGrade(outcome)}
                onPickCard={(card) => void submitPickerCard(card)}
                gradingDisabled={isReplying}
                suppressPicker={isRoadmapSession}
              />
            ),
          )}

          {isReplying && <TypingIndicator />}
          {error && <p className="chat-error">{error}</p>}

          {isRoadmapSession && roadmapNode && (
            <StudyStepBar
              stages={contentSequence}
              currentStageIndex={currentStageIndex}
              conceptName={roadmapNode.concept_name}
              loading={isReplying}
              conceptComplete={conceptComplete}
              onAdvance={(stage) => void advanceStudyStage(stage)}
            />
          )}

          <div className="quick-prompts">
            {!awaitingGrade && !isRoadmapSession && (
              <>
                <span>Try next</span>
                {quickPrompts.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => void submitMessage(prompt)}>
                    {prompt} {"->"}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        <form ref={formRef} className="chat-input" onSubmit={onSubmit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask anything from Laws of Motion, Work Energy & Power, or Rotational Motion..."
            rows={2}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
          />
          <button type="submit" disabled={isReplying || !input.trim()} aria-label="Send message">
            <ArrowUpIcon />
          </button>
          <p>After practice questions, use the Correct / Incorrect buttons to self-grade.</p>
        </form>
      </section>

      <aside className={`concept-panel ${panelCollapsed ? "concept-panel-collapsed" : ""}`}>
        <button
          type="button"
          className="concept-toggle"
          onClick={() => setPanelCollapsed((current) => !current)}
          aria-label="Toggle concepts panel"
        >
          {panelCollapsed ? <PanelIcon /> : <XIcon />}
        </button>
        {!panelCollapsed && (
          <div className="concept-content">
            <h2>Live proficiency</h2>
            <p className="concept-empty">
              Concept scores update in Supabase as you study. Check the dashboard for your full concept health.
            </p>
          </div>
        )}
      </aside>
    </main>
  );
}
