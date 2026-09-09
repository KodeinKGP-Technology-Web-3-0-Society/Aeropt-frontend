"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarkdownMath from "@/components/MarkdownMath";
import StudySidebar from "@/components/StudySidebar";
import AgentRosterPanel from "@/components/AgentRosterPanel";
import {
  CollapsibleScoreSummary,
  FlashcardDeck,
  GradingButtons,
  QuizAssessmentNotice,
  StudyStepBar,
} from "@/components/StudySessionCards";
import { AgentChatResponse, PlacementContext, sendChatMessage, fetchChatSessions, fetchChatSessionDetail, fetchConceptProficiency, presentationToAgentResponse, type ChatTurnItem } from "@/lib/agent";
import ProactiveIntroCard from "@/components/slides/ProactiveIntroCard";
import PracticeAttemptView from "@/components/PracticeAttemptView";
import InteractivePracticeCanvas from "@/components/InteractivePracticeCanvas";
import PracticeBatchCanvas from "@/components/PracticeBatchCanvas";
import {
  asPracticeBatch,
  asPracticeData,
  extractPracticeQuestion,
  looksLikePracticeDump,
  splitPracticeAttempt,
  type InteractivePracticeData,
} from "@/lib/practiceContent";
import { getSupabaseUserId } from "@/lib/auth";
import { getAgentApiBase } from "@/lib/auth";
import type { FlashcardItem } from "@/lib/agent";
import * as onboarding from "@/lib/onboarding";
import {
  clearRoadmapSessionBind,
  fetchRoadmap,
  readRoadmapSessionBind,
  stagePrompt,
  updateRoadmapProgress,
  writeRoadmapSessionBind,
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
  updatedAt?: string | null;
  preview?: string | null;
};

const agentBaseUrl = getAgentApiBase();
const SESSION_STORAGE_KEY = "agent_active_session_id";

const fallbackPrompts = [
  "Explain torque and moment of inertia",
  "Give me a practice question on Newton's 2nd law",
];

function isSameCalendarDay(iso: string | null | undefined, now = new Date()): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatAgentError(raw: string): string {
  const lower = raw.toLowerCase();
  if (
    lower.includes("graphrag") ||
    lower.includes("retriever") ||
    lower.includes("dns") ||
    lower.includes("name or service not known")
  ) {
    return "Couldn't fetch sources — try again.";
  }
  return raw;
}

function formatSessionTitle(
  preview: string | null | undefined,
  updatedAt: string | null | undefined,
  index: number,
): string {
  if (preview?.trim()) {
    const trimmed = preview.trim().replace(/\s+/g, " ");
    const normalized =
      trimmed.length > 0
        ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
        : trimmed;
    return normalized.length > 42 ? `${normalized.slice(0, 41)}…` : normalized;
  }
  if (updatedAt) {
    const date = new Date(updatedAt);
    if (!Number.isNaN(date.getTime())) {
      return `Session · ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    }
  }
  return `Session ${index + 1}`;
}

function normalizeSuggestions(
  suggestions: AgentChatResponse["follow_up_suggestions"],
): string[] {
  if (!suggestions) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of suggestions) {
    let text = "";
    if (typeof item === "string") text = item;
    else {
      const preview = (item as { preview?: string }).preview;
      text = preview || (item as { text?: string }).text || "";
    }
    const trimmed = text.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function dedupeSessions(sessions: Session[]): Session[] {
  const seen = new Set<string>();
  const out: Session[] = [];
  for (const session of sessions) {
    const key = session.title.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(session);
  }
  return out.slice(0, 8);
}

function turnsToMessages(turns: ChatTurnItem[], sessionId: string): Message[] {
  return turns.map((turn) => {
    const agent =
      turn.role === "user" ? null : presentationToAgentResponse(sessionId, turn);
    const structured = agent?.structured;
    const tryNext = normalizeSuggestions(agent?.follow_up_suggestions);
    return {
      id: turn.turn_id || `turn-${turn.turn_index}`,
      role: turn.role === "user" ? "user" : "assistant",
      content: turn.content,
      agent,
      structured_response: structured
        ? {
            filling_gap: structured.filling_gap || "",
            solution_steps: structured.solution_steps || [],
            insight: structured.insight || "",
            try_next: tryNext,
            concepts_mentioned: agent?.primary_concept_id ? [agent.primary_concept_id] : [],
            prerequisite_chain: [],
          }
        : tryNext.length > 0
          ? {
              filling_gap: "",
              solution_steps: [],
              insight: "",
              try_next: tryNext,
              concepts_mentioned: agent?.primary_concept_id ? [agent.primary_concept_id] : [],
              prerequisite_chain: [],
            }
          : undefined,
    };
  });
}

function ArrowUpIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M12 19V5m0 0-6 6m6-6 6 6" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path d="M4 6h16M4 12h10M4 18h16" />
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
    <div className="assistant-thinking" role="status" aria-live="polite" aria-label="Assistant is typing">
      <span />
      <span />
      <span />
      <span className="sr-only">Assistant is typing</span>
    </div>
  );
}

function AssistantExtras({
  agent,
  onGrade,
  onPickCard,
  gradingDisabled,
  suppressPicker,
  isLatest,
  hideGrade,
}: {
  agent?: AgentChatResponse | null;
  onGrade: (outcome: "correct" | "incorrect") => void;
  onPickCard: (card: FlashcardItem) => void;
  gradingDisabled?: boolean;
  suppressPicker?: boolean;
  isLatest?: boolean;
  hideGrade?: boolean;
}) {
  if (!agent) return null;
  const showFlashcards =
    agent.flashcards &&
    !(suppressPicker && agent.flashcards.mode === "picker");
  return (
    <>
      {agent.mistake_brief && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">
            Where you went wrong
          </p>
          <MarkdownMath content={agent.mistake_brief} className="markdown-math text-sm" />
        </div>
      )}
      {agent.card && isLatest && !suppressPicker && (
        <ProactiveIntroCard card={agent.card} />
      )}
      {agent.grading_ui && isLatest && !hideGrade && (
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
  onOpenBatchCanvas,
  gradingDisabled,
  suppressPicker,
  isLatest,
  pinPractice,
}: {
  message: Message;
  onGrade: (outcome: "correct" | "incorrect") => void;
  onPickCard: (card: FlashcardItem) => void;
  onOpenBatchCanvas?: (batch: InteractivePracticeData[], messageId: string) => void;
  gradingDisabled?: boolean;
  suppressPicker?: boolean;
  isLatest?: boolean;
  pinPractice?: boolean;
}) {
  const extracted = extractPracticeQuestion(message.content);
  const practice = asPracticeData(message.agent?.practice_question) ?? extracted.data;
  const extras = (
    <AssistantExtras
      agent={message.agent}
      onGrade={onGrade}
      onPickCard={onPickCard}
      gradingDisabled={gradingDisabled}
      suppressPicker={suppressPicker}
      isLatest={isLatest}
      hideGrade={Boolean(practice)}
    />
  );

  const practiceBatch = asPracticeBatch(message.agent?.practice_batch);
  const isPreparing =
    message.content.includes("[PREPARING]") && practiceBatch.length === 0 && !practice;

  if (isPreparing) {
    const text = message.content.replace("[PREPARING]", "").trim();
    return (
      <article className="lesson-response assistant-plain">
        <div className="flex items-center gap-3 text-accent">
          <TypingIndicator />
          <span className="font-medium animate-pulse">{text || "Preparing questions..."}</span>
        </div>
      </article>
    );
  }

  if (practice && pinPractice) {
    return (
      <article className="lesson-response assistant-plain">
        <p className="practice-canvas-stub">
          Practice question is open on the canvas. Attempt it there, then ask here if you want a hint.
        </p>
        {extras}
      </article>
    );
  }

  if (practiceBatch.length > 0) {
    const n = practiceBatch.length;
    return (
      <article className="lesson-response assistant-plain">
        <MarkdownMath content={message.content} />
        <div className="practice-open-canvas-wrap">
          <button
            type="button"
            onClick={() => onOpenBatchCanvas?.(practiceBatch, message.id)}
            className="practice-open-canvas-btn"
          >
            <span>
              {n === 1 ? "Open practice canvas" : `Open practice canvas (${n} questions)`}
            </span>
            <PanelIcon />
          </button>
        </div>
        {extras}
      </article>
    );
  }

  if (practice) {
    return (
      <article className="lesson-response assistant-plain">
        <InteractivePracticeCanvas
          data={practice}
          remainder={extracted.remainder}
          onGrade={isLatest ? onGrade : undefined}
          gradingDisabled={gradingDisabled}
        />
        {extras}
      </article>
    );
  }

  if (looksLikePracticeDump(message.content)) {
    return (
      <article className="lesson-response assistant-plain">
        <p className="practice-canvas-stub">Opening the practice canvas…</p>
      </article>
    );
  }

  const practiceSplit = splitPracticeAttempt(message.content);
  const hidePracticeSolution = Boolean(
    isLatest && message.agent?.grading_ui?.show_correct_incorrect,
  );

  return (
    <article className="lesson-response assistant-plain">
      {practiceSplit ? (
        <PracticeAttemptView
          question={practiceSplit.question}
          remainder={practiceSplit.remainder}
          hideSolution={hidePracticeSolution}
        />
      ) : (
        <MarkdownMath content={message.content} />
      )}
      {extras}
    </article>
  );
}

function buildAssistantMessage(response: AgentChatResponse): Message {
  const text = response.response?.trim() || "I could not generate a response.";
  const hasPickerCards = response.flashcards?.mode === "picker";
  const tryNext = hasPickerCards ? [] : normalizeSuggestions(response.follow_up_suggestions);
  const structured = response.structured;

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: text,
    agent: response,
    structured_response:
      structured &&
      (structured.filling_gap || structured.solution_steps?.length || structured.insight)
        ? {
            filling_gap: structured.filling_gap || "",
            solution_steps: structured.solution_steps || [],
            insight: structured.insight || "",
            try_next: tryNext,
            concepts_mentioned: response.primary_concept_id
              ? [response.primary_concept_id]
              : [],
            prerequisite_chain: [],
          }
        : {
            filling_gap: "",
            solution_steps: [],
            insight: "",
            try_next: tryNext,
            concepts_mentioned: response.primary_concept_id
              ? [response.primary_concept_id]
              : [],
            prerequisite_chain: [],
          },
  };
}

export default function ChatWorkspace({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roadmapConceptId = searchParams.get("concept_id");
  const roadmapNodeId = searchParams.get("node_id");
  const roadmapPrompt = searchParams.get("prompt");
  const initialStage = (searchParams.get("stage") as StudyStage | null) ?? "theory";
  const forceFreshStart = searchParams.get("fresh") === "1";

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [awaitingGrade, setAwaitingGrade] = useState(false);
  const [canvasPractice, setCanvasPractice] = useState<{
    data: InteractivePracticeData;
    remainder: string;
    messageId: string;
  } | null>(null);
  const [batchCanvasPractice, setBatchCanvasPractice] = useState<{
    batch: InteractivePracticeData[];
    messageId: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [placementContext, setPlacementContext] = useState<PlacementContext>({});
  const [roadmapNode, setRoadmapNode] = useState<PathNode | null>(null);
  const [contentSequence, setContentSequence] = useState<string[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [conceptComplete, setConceptComplete] = useState(false);
  const [lastProficiencyPct, setLastProficiencyPct] = useState<number | null>(null);
  const [lastActiveAgent, setLastActiveAgent] = useState<string | null>(null);
  const [agentPanelCollapsed, setAgentPanelCollapsed] = useState(false);
  const [agentRefreshKey, setAgentRefreshKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const progressMarkedRef = useRef(false);
  const autoPromptedRef = useRef(false);
  const endingBeaconSentRef = useRef(false);
  const startFreshRef = useRef(forceFreshStart);
  const freshUrlHandledRef = useRef(false);
  const [entryNonce, setEntryNonce] = useState(0);
  const [roadmapBindReady, setRoadmapBindReady] = useState(false);

  const isRoadmapSession = Boolean(roadmapNodeId && contentSequence.length > 0);

  const persistRoadmapBind = useCallback(
    (stageIndex: number, sessionId: string | null = activeSessionId) => {
      if (!roadmapNodeId) return;
      writeRoadmapSessionBind(roadmapNodeId, { sessionId, stageIndex });
    },
    [roadmapNodeId, activeSessionId],
  );

  // Strip one-shot fresh=1 while staying on /chat/<sessionId> (never bare /chat).
  useEffect(() => {
    if (!forceFreshStart) {
      freshUrlHandledRef.current = false;
      return;
    }
    if (freshUrlHandledRef.current) return;
    freshUrlHandledRef.current = true;
    startFreshRef.current = true;
    autoPromptedRef.current = false;
    progressMarkedRef.current = false;
    setEntryNonce((n) => n + 1);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("fresh");
    const qs = params.toString();
    router.replace(qs ? `/chat/${sessionId}?${qs}` : `/chat/${sessionId}`, { scroll: false });
  }, [forceFreshStart, router, searchParams, sessionId]);

  useEffect(() => {
    if (!roadmapNodeId) return;
    const loadNode = async () => {
      try {
        const roadmap = await fetchRoadmap();
        const node = roadmap.nodes.find((item) => item.id === roadmapNodeId) ?? null;
        if (!node) return;
        setRoadmapNode(node);
        if (typeof node.proficiency_pct === "number") {
          setLastProficiencyPct((current) => (current != null ? current : node.proficiency_pct));
        }
        const sequence = node.content_sequence?.length
          ? node.content_sequence
          : ["theory", "example", "practice", "pyq"];
        setContentSequence(sequence);
        const bind = !startFreshRef.current ? readRoadmapSessionBind(roadmapNodeId) : null;
        const fromUrl = Math.max(0, sequence.indexOf(initialStage));
        const stageIndex =
          bind && bind.stageIndex >= 0 && bind.stageIndex < sequence.length
            ? bind.stageIndex
            : fromUrl >= 0
              ? fromUrl
              : 0;
        setCurrentStageIndex(stageIndex);
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
  }, [roadmapNodeId, initialStage, entryNonce]);

  useEffect(() => {
    setRoadmapBindReady(false);
  }, [roadmapNodeId, entryNonce]);

  // Persist roadmap stage + session after bootstrap restores saved state (avoids overwriting bind with 0 on mount).
  useEffect(() => {
    if (!roadmapNodeId || !roadmapBindReady) return;
    persistRoadmapBind(currentStageIndex);
  }, [roadmapNodeId, roadmapBindReady, currentStageIndex, persistRoadmapBind]);

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
        setPlacementContext({
          journeyType: placement?.journey_type ?? null,
          focusChapters: onboarding.focusChaptersFromPlacement(placement),
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

  useEffect(() => {
    if (messages.length === 0) {
      setCanvasPractice(null);
      setBatchCanvasPractice(null);
    }
  }, [messages.length]);

  useEffect(() => {
    if (!latestAssistant) return;
    if (asPracticeBatch(latestAssistant.agent?.practice_batch).length > 1) return;
    const extracted = extractPracticeQuestion(latestAssistant.content);
    const data = asPracticeData(latestAssistant.agent?.practice_question) ?? extracted.data;
    if (!data) return;
    setCanvasPractice({
      data,
      remainder: extracted.remainder,
      messageId: latestAssistant.id,
    });
  }, [latestAssistant]);

  // Prefer turn proficiency; otherwise load durable Supabase user_concept_state.
  useEffect(() => {
    const conceptId =
      roadmapConceptId || latestAssistant?.agent?.primary_concept_id || null;
    if (!conceptId) return;

    if (typeof latestAssistant?.agent?.proficiency_pct === "number") {
      setLastProficiencyPct(latestAssistant.agent.proficiency_pct);
      return;
    }

    const userId = getSupabaseUserId();
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      const row = await fetchConceptProficiency(userId, conceptId);
      if (cancelled || typeof row?.proficiency_pct !== "number") return;
      setLastProficiencyPct(row.proficiency_pct);
      setPanelCollapsed(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    roadmapConceptId,
    latestAssistant?.agent?.primary_concept_id,
    latestAssistant?.agent?.proficiency_pct,
  ]);

  const currentStage = isRoadmapSession ? contentSequence[currentStageIndex] : null;

  const quickPrompts = useMemo(() => {
    if (latestAssistant?.agent?.flashcards?.mode === "picker") return [];
    const fromBackend = latestAssistant?.structured_response?.try_next?.filter(Boolean);
    const raw = fromBackend && fromBackend.length > 0 ? fromBackend : fallbackPrompts;
    const seen = new Set<string>();
    return raw.filter((prompt) => {
      const key = prompt.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [latestAssistant]);

  const visibleSessions = useMemo(() => dedupeSessions(sessions), [sessions]);

  async function sendAgentMessage(
    query: string,
    sessionId: string | null,
    options?: {
      conceptId?: string | null;
      nodeId?: string | null;
      studyStage?: StudyStage | null;
      gradedOutcome?: "correct" | "incorrect";
    },
    onToken?: (token: string) => void
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
    }, onToken);
  }

  function registerSession(sessionId: string, title?: string) {
    setActiveSessionId(sessionId);
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    setSessions((current) => {
      if (current.some((session) => session.id === sessionId)) return current;
      return [{ id: sessionId, title: title || `Session ${current.length + 1}`, updatedAt: new Date().toISOString() }, ...current];
    });
  }

  const loadSessionHistory = useCallback(async (id: string) => {
    const userId = getSupabaseUserId();
    if (!userId) return;

    setIsLoadingSession(true);
    setError("");
    setSessionNotFound(false);
    try {
      const detail = await fetchChatSessionDetail(userId, id);
      const loaded = turnsToMessages(detail.turns, id);
      setMessages(loaded);
      setActiveSessionId(id);
      localStorage.setItem(SESSION_STORAGE_KEY, id);
      const lastAssistant = [...loaded].reverse().find((m) => m.role === "assistant");
      setAwaitingGrade(Boolean(lastAssistant?.agent?.grading_ui?.show_correct_incorrect));
      if (typeof lastAssistant?.agent?.proficiency_pct === "number") {
        setLastProficiencyPct(lastAssistant.agent.proficiency_pct);
      }
      if (lastAssistant?.agent?.active_agent) {
        setLastActiveAgent(lastAssistant.agent.active_agent);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not load session history.";
      const missing =
        message.toLowerCase().includes("not found") || message.toLowerCase().includes("404");
      setSessionNotFound(missing);
      setError(message);
      setMessages([]);
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  function selectSession(nextSessionId: string) {
    if (nextSessionId === sessionId || isReplying || isLoadingSession) return;
    setHistoryOpen(false);
    router.push(`/chat/${nextSessionId}`);
  }

  function createSession() {
    autoPromptedRef.current = true;
    router.push("/chat");
  }

  function flushEndSessionBeacon(sessionId: string) {
    if (endingBeaconSentRef.current) return;
    const userId = getSupabaseUserId();
    if (!userId) return;
    endingBeaconSentRef.current = true;
    const body = JSON.stringify({ user_id: userId, session_id: sessionId });
    const url = `${agentBaseUrl}/api/v1/chat/end-session`;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const ok = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
        if (ok) return;
      }
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    } catch {
      // Best-effort flush on unload
    }
  }

  async function endSession() {
    if (!activeSessionId || isEndingSession) return;
    const userId = getSupabaseUserId();
    if (!userId) return;

    setIsEndingSession(true);
    setError("");
    endingBeaconSentRef.current = true;
    try {
      await fetch(`${agentBaseUrl}/api/v1/chat/end-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, session_id: activeSessionId }),
      });
      localStorage.removeItem(SESSION_STORAGE_KEY);
      if (roadmapNodeId) clearRoadmapSessionBind(roadmapNodeId);
      router.push("/chat");
    } catch (caught) {
      endingBeaconSentRef.current = false;
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
    if (agentResponse.active_agent) {
      setLastActiveAgent(agentResponse.active_agent);
    }
    setAgentRefreshKey((k) => k + 1);
    const assistantMessage = buildAssistantMessage(agentResponse);
    const batch = asPracticeBatch(agentResponse.practice_batch);
    const single =
      asPracticeData(agentResponse.practice_question) ?? (batch.length === 1 ? batch[0] : null);
    setMessages((current) => [...current, assistantMessage]);
    if (batch.length > 1) {
      setBatchCanvasPractice({ batch, messageId: assistantMessage.id });
    } else if (single) {
      setCanvasPractice({
        data: single,
        remainder: "",
        messageId: assistantMessage.id,
      });
    }
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
      const nextIndex = currentStageIndex + 1;
      setCurrentStageIndex(nextIndex);
      persistRoadmapBind(nextIndex);
    }
  }

  async function submitBatch(results: any[]) {
    setBatchCanvasPractice(null);
    await submitMessage("SUBMISSION::" + JSON.stringify(results));
  }

  async function advanceStudyStage(nextStage: StudyStage) {
    if (!roadmapNode) return;
    const nextIndex = contentSequence.indexOf(nextStage);
    if (nextIndex >= 0) {
      setCurrentStageIndex(nextIndex);
      persistRoadmapBind(nextIndex);
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
    const assistantId = crypto.randomUUID();
    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      // graded_outcome is the contract; query mirrors 1/0 for transcript/diagnostics only.
      const agentResponse = await sendAgentMessage(
        isGradeTap ? (gradedOutcome === "correct" ? "1" : "0") : trimmed,
        activeSessionId ?? sessionId,
        {
          gradedOutcome,
          studyStage,
        },
        (token) => {
          setMessages((current) =>
            current.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        }
      );
      
      // Remove the temporary assistant message since handleAgentResponse appends the finalized one
      setMessages((current) => current.filter((m) => m.id !== assistantId));
      return await handleAgentResponse(agentResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      setMessages((current) => current.filter((message) => message.id !== userMessage.id && message.id !== assistantId));
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
        if (roadmapNodeId) {
          setRoadmapBindReady(true);
        }
        return;
      }

      setSessionsReady(false);
      setSessionNotFound(false);
      setActiveSessionId(sessionId);
      localStorage.setItem(SESSION_STORAGE_KEY, sessionId);

      try {
        const list = await fetchChatSessions(userId);
        const mapped: Session[] = list.map((session, index) => ({
          id: session.session_id,
          title: formatSessionTitle(session.preview, session.updated_at, index),
          updatedAt: session.updated_at,
          preview: session.preview ?? null,
        }));
        if (!mapped.some((session) => session.id === sessionId)) {
          mapped.unshift({
            id: sessionId,
            title: "New chat",
            updatedAt: new Date().toISOString(),
            preview: null,
          });
        }
        setSessions(mapped);

        // Roadmap Start/Continue (fresh=1): empty transcript at URL/bound stage; keep this session id.
        if (roadmapNodeId && startFreshRef.current) {
          startFreshRef.current = false;
          const defaultSeq = ["theory", "example", "practice", "pyq"] as StudyStage[];
          const stageIdx = Math.max(0, defaultSeq.indexOf(initialStage));
          writeRoadmapSessionBind(roadmapNodeId, {
            sessionId,
            stageIndex: stageIdx,
          });
          setCurrentStageIndex(stageIdx);
          setMessages([]);
          setAwaitingGrade(false);
          setLastProficiencyPct(null);
          return;
        }

        await loadSessionHistory(sessionId);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Could not load your previous sessions.",
        );
        try {
          await loadSessionHistory(sessionId);
        } catch {
          /* loadSessionHistory sets error / not-found */
        }
      } finally {
        setSessionsReady(true);
        if (roadmapNodeId) {
          setRoadmapBindReady(true);
        }
      }
    };

    void bootstrapSessions();
  }, [loadSessionHistory, roadmapNodeId, entryNonce, initialStage, sessionId]);

  useEffect(() => {
    if (!sessionsReady || messages.length > 0 || isReplying || isLoadingSession) {
      return;
    }
    if (autoPromptedRef.current) return;
    if (!isRoadmapSession || !roadmapNode) {
      if (!roadmapPrompt) return;
      autoPromptedRef.current = true;
      void submitMessage(roadmapPrompt);
      return;
    }

    const stage = (contentSequence[currentStageIndex] ?? initialStage) as StudyStage;
    autoPromptedRef.current = true;
    void submitMessage(stagePrompt(roadmapNode.concept_name, stage), undefined, stage);
  }, [
    roadmapPrompt,
    messages.length,
    isReplying,
    isLoadingSession,
    sessionsReady,
    isRoadmapSession,
    roadmapNode,
    contentSequence,
    currentStageIndex,
    initialStage,
  ]);

  // Flush session summary on tab close / hard navigation away (not soft Next.js routes).
  useEffect(() => {
    endingBeaconSentRef.current = false;
    const onPageHide = () => {
      if (!activeSessionId) return;
      flushEndSessionBeacon(activeSessionId);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [activeSessionId]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isReplying]);

  useEffect(() => {
    if (!historyOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHistoryOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const closeBtn = document.querySelector<HTMLButtonElement>(".chat-history-close");
    closeBtn?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [historyOpen]);

  const emptyThread = !isLoadingSession && messages.length === 0;

  const conceptsCoveredToday = (() => {
    const ids = new Set<string>();
    for (const message of messages) {
      const id = message.agent?.primary_concept_id;
      if (id) ids.add(id);
    }
    for (const session of visibleSessions) {
      if (isSameCalendarDay(session.updatedAt) && session.preview) ids.add(session.id);
    }
    return ids.size;
  })();

  const sessionHeading =
    isRoadmapSession && roadmapNode?.concept_name
      ? roadmapNode.concept_name
      : latestAssistant?.agent?.primary_concept_id
        ? latestAssistant.agent.primary_concept_id.replace(/_/g, " ")
        : activeSession?.title && !/^session\b/i.test(activeSession.title)
          ? activeSession.title
          : "Study session";

  const sessionSubline = isRoadmapSession && roadmapNode
    ? roadmapNode.chapter
    : conceptsCoveredToday > 0
      ? `${conceptsCoveredToday} concept${conceptsCoveredToday === 1 ? "" : "s"} covered today`
      : emptyThread
        ? null
        : null;

  const showSelfGradeHint =
    !canvasPractice &&
    (awaitingGrade || Boolean(latestAssistant?.agent?.grading_ui?.show_correct_incorrect));
  const supabaseUserId = getSupabaseUserId();

  return (
    <>
      <StudySidebar
        studyContext={{
          conceptName: roadmapNode?.concept_name,
          conceptId: roadmapConceptId,
          nodeId: roadmapNodeId,
          stage: currentStage,
          stageIndex: currentStageIndex,
          stageTotal: contentSequence.length,
          proficiencyPct: lastProficiencyPct ?? roadmapNode?.proficiency_pct ?? null,
          weakPrereq: latestAssistant?.agent?.card?.weak_prereq ?? null,
          journeyType: placementContext.journeyType ?? null,
        }}
      />
    <main className="chat-page">
      {historyOpen ? (
        <button
          type="button"
          className="chat-history-scrim"
          aria-label="Close chat history"
          onClick={() => setHistoryOpen(false)}
        />
      ) : null}
      <aside className={`chat-history ${historyOpen ? "chat-history-open" : ""}`} aria-hidden={!historyOpen}>
        <div className="chat-history-head">
          <p>Chat history</p>
          <button type="button" className="chat-history-close" onClick={() => setHistoryOpen(false)} aria-label="Close history">
            <XIcon />
          </button>
        </div>
        <div className="chat-history-list">
          {visibleSessions.length === 0 ? (
            <p className="chat-history-empty">No past sessions yet.</p>
          ) : (
            visibleSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                className={`chat-history-item ${session.id === activeSessionId ? "chat-history-item-active" : ""}`}
                onClick={() => {
                  selectSession(session.id);
                }}
                title={session.title}
              >
                {session.title}
              </button>
            ))
          )}
        </div>
      </aside>

    <div className="chat-page-layout">
      <section className={`chat-main ${isRoadmapSession && roadmapNode ? "chat-main--roadmap" : ""}`}>
        <header className="chat-header">
          <div className="chat-header-start">
            <button
              type="button"
              className="chat-history-toggle"
              onClick={() => setHistoryOpen(true)}
              aria-label="Open chat history"
            >
              <HistoryIcon />
            </button>
            <div className="chat-header-copy">
              <h1>{sessionHeading}</h1>
              {sessionSubline ? <p className="chat-header-sub">{sessionSubline}</p> : null}
            </div>
          </div>
          <div className="header-actions">
            <button type="button" className="header-action-button" onClick={createSession}>
              New chat
            </button>
            {!emptyThread ? (
              <>
                <button
                  type="button"
                  className="end-session"
                  onClick={() => void endSession()}
                  disabled={!activeSessionId || isEndingSession}
                >
                  {isEndingSession ? "Ending..." : "End Session"}
                </button>
                <button
                  type="button"
                  className="concept-toggle"
                  onClick={() => setPanelCollapsed((current) => !current)}
                  aria-label="Toggle concepts panel"
                >
                  {panelCollapsed ? <PanelIcon /> : <XIcon />}
                </button>
              </>
            ) : null}
          </div>
        </header>

        {isRoadmapSession && roadmapNode && (
          <div className="study-path-bar">
            <StudyStepBar
              stages={contentSequence}
              currentStageIndex={currentStageIndex}
              conceptName={roadmapNode.concept_name}
              loading={isReplying}
              conceptComplete={conceptComplete}
              slidesComplete
              requiresSlides={false}
              onAdvance={(stage) => void advanceStudyStage(stage)}
            />
          </div>
        )}

        {!panelCollapsed && !emptyThread && (
          <div className="concept-inline">
            <h2>Live proficiency</h2>
            {(roadmapNode?.concept_name ||
              roadmapConceptId ||
              latestAssistant?.agent?.primary_concept_id) && (
              <p className="concept-name">
                {roadmapNode?.concept_name ||
                  (roadmapConceptId || latestAssistant?.agent?.primary_concept_id || "").replace(
                    /_/g,
                    " ",
                  )}
              </p>
            )}
            {(lastProficiencyPct != null ||
              typeof latestAssistant?.agent?.proficiency_pct === "number" ||
              typeof roadmapNode?.proficiency_pct === "number") && (
              <p className="concept-score">
                {lastProficiencyPct ??
                  latestAssistant?.agent?.proficiency_pct ??
                  roadmapNode?.proficiency_pct}
                % mastery
              </p>
            )}
          </div>
        )}

        <div className={`chat-workspace-body${canvasPractice ? " chat-workspace-body--split" : ""}`}>
        <div className="chat-column">
        <div className={`chat-scroll ${emptyThread ? "chat-scroll-empty" : ""}`}>
          <div className="chat-thread">
            {isLoadingSession && messages.length === 0 && !sessionNotFound && (
              <p className="chat-status" role="status">Loading session…</p>
            )}

            {sessionNotFound && (
              <div className="chat-empty">
                <h2>Session not found</h2>
                <p className="chat-status">This chat may have been deleted or belongs to another account.</p>
                <button type="button" className="header-action-button" onClick={createSession}>
                  New chat
                </button>
              </div>
            )}

            {emptyThread && !isRoadmapSession && !sessionNotFound && !isLoadingSession && (
              <div className="chat-empty">
                <h2>What do you want to study?</h2>
                <p className="chat-status">Pick a starter or type below.</p>
                <div className="chat-empty-chips">
                  <button
                    type="button"
                    className="quick-prompt-chip"
                    onClick={() => void submitMessage("Teach me a short Laws of Motion warm-up from the basics.")}
                  >
                    Laws of Motion intro
                  </button>
                  <button
                    type="button"
                    className="quick-prompt-chip"
                    onClick={() =>
                      void submitMessage(
                        "Give me a 10-minute mixed JEE drill across Physics, Chemistry and Maths."
                      )
                    }
                  >
                    10-min PCM drill
                  </button>
                  <button
                    type="button"
                    className="quick-prompt-chip"
                    onClick={() =>
                      void submitMessage(
                        "Give me one JEE PYQ and walk me through the solution after I attempt it."
                      )
                    }
                  >
                    One PYQ
                  </button>
                </div>
              </div>
            )}

            {isRoadmapSession && isReplying && messages.length === 0 && (
              <p className="chat-status">Loading lesson…</p>
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
                  onOpenBatchCanvas={(batch, msgId) =>
                    setBatchCanvasPractice({ batch: asPracticeBatch(batch), messageId: msgId })
                  }
                  gradingDisabled={isReplying}
                  suppressPicker={isRoadmapSession}
                  isLatest={message.id === latestAssistant?.id}
                  pinPractice={Boolean(canvasPractice) && message.id === canvasPractice?.messageId}
                />
              ),
            )}

            {isReplying && <TypingIndicator />}

            {!awaitingGrade && !isRoadmapSession && quickPrompts.length > 0 && !emptyThread && (
              <div className="quick-prompts-row">
                <span className="quick-prompts-label">Try next</span>
                <div className="quick-prompts-chips">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="quick-prompt-chip"
                      onClick={() => void submitMessage(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={scrollEndRef} />
          </div>
        </div>

        <form ref={formRef} className="chat-input" onSubmit={onSubmit}>
          <div className="chat-composer">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask anything from Laws of Motion, Work Energy & Power, or Rotational Motion..."
              rows={1}
              disabled={sessionNotFound || isLoadingSession}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />
            <button
              type="submit"
              disabled={sessionNotFound || isReplying || isLoadingSession || !input.trim()}
              aria-label="Send message"
            >
              <ArrowUpIcon />
            </button>
          </div>
          {showSelfGradeHint ? (
            <p>After practice questions, use the Correct / Incorrect buttons to self-grade.</p>
          ) : error && !sessionNotFound ? (
            <p className="chat-error">{formatAgentError(error)}</p>
          ) : null}
        </form>
        </div>
        {canvasPractice ? (
          <aside className="practice-canvas-pane">
            <InteractivePracticeCanvas
              data={canvasPractice.data}
              remainder={canvasPractice.remainder}
              onGrade={(outcome) => void submitGrade(outcome)}
              gradingDisabled={isReplying}
            />
          </aside>
        ) : null}
        </div>
      </section>
      <AgentRosterPanel
        userId={supabaseUserId}
        sessionId={activeSessionId}
        roadmapConceptId={roadmapConceptId}
        primaryConceptId={latestAssistant?.agent?.primary_concept_id ?? roadmapConceptId}
        focusChapters={placementContext.focusChapters}
        activeAgent={lastActiveAgent}
        refreshKey={agentRefreshKey}
        collapsed={agentPanelCollapsed}
        onToggle={() => setAgentPanelCollapsed((c) => !c)}
      />
      {batchCanvasPractice && (
        <PracticeBatchCanvas
          batch={batchCanvasPractice.batch}
          onClose={() => setBatchCanvasPractice(null)}
          onSubmitBatch={(results) => void submitBatch(results)}
          isSubmitting={isReplying}
        />
      )}
    </div>
    </main>
    </>
  );
}
