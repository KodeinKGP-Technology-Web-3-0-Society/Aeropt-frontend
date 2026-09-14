import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AgentChatResponse,
  PlacementContext,
  sendChatMessage,
  fetchChatSessions,
  fetchChatSessionDetail,
  presentationToAgentResponse,
  type ChatTurnItem,
} from "@/lib/agent";
import { getSupabaseUserId, getAgentApiBase } from "@/lib/auth";
import type { Session, Message, StructuredResponse } from "./types";
import { asPracticeBatch, asPracticeData, extractPracticeQuestion } from "@/lib/practiceContent";
import { StudyStage } from "@/lib/roadmap";
import * as onboarding from "@/lib/onboarding";

const SESSION_STORAGE_KEY = "agent_active_session_id";
const agentBaseUrl = getAgentApiBase();

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

function dedupeSessions(sessions: Session[]): Session[] {
  const seen = new Set<string>();
  const res: Session[] = [];
  for (const s of sessions) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    res.push(s);
  }
  return res;
}

function formatSessionTitle(preview: string | null | undefined, updatedAt: string | null | undefined, index: number) {
  if (preview) return preview;
  if (!updatedAt) return `Session ${index + 1}`;
  const d = new Date(updatedAt);
  if (isSameCalendarDay(updatedAt)) return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function normalizeSuggestions(suggestions: unknown): string[] {
  if (Array.isArray(suggestions)) {
    return suggestions
      .filter((s) => typeof s === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
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

export function useChatSession(
  sessionId: string,
  roadmapNodeId: string | null,
  roadmapConceptId: string | null,
  isRoadmapSession: boolean,
  startFreshRef: React.MutableRefObject<boolean>,
  setCurrentStageIndex: (idx: number) => void,
  setRoadmapBindReady: (ready: boolean) => void,
  clearRoadmapSessionBind: (nodeId: string) => void,
  writeRoadmapSessionBind: (nodeId: string, payload: any) => void,
  initialStage: StudyStage,
  entryNonce: number
) {
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isReplying, setIsReplying] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const [awaitingGrade, setAwaitingGrade] = useState(false);
  const [error, setError] = useState("");
  const [lastActiveAgent, setLastActiveAgent] = useState<string | null>(null);
  const [placementContext, setPlacementContext] = useState<PlacementContext>({});

  const endingBeaconSentRef = useRef(false);

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

  const visibleSessions = useMemo(() => dedupeSessions(sessions), [sessions]);

  async function sendAgentMessage(
    query: string,
    currentSessionId: string | null,
    options?: {
      conceptId?: string | null;
      nodeId?: string | null;
      studyStage?: StudyStage | null;
      gradedOutcome?: "correct" | "incorrect";
      flaggedStepId?: string | null;
    },
    onToken?: (token: string) => void
  ) {
    const userId = getSupabaseUserId();
    if (!userId) {
      throw new Error("Missing Supabase user link. Sign out and sign in again.");
    }

    return sendChatMessage({
      userId,
      sessionId: currentSessionId,
      query,
      roadmapConceptId: options?.conceptId ?? roadmapConceptId,
      roadmapNodeId: options?.nodeId ?? roadmapNodeId,
      studyStage: options?.studyStage,
      gradedOutcome: options?.gradedOutcome,
      placement: placementContext,
      flaggedStepId: options?.flaggedStepId,
    }, onToken);
  }

  function registerSession(newSessionId: string, title?: string) {
    setActiveSessionId(newSessionId);
    localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
    setSessions((current) => {
      if (current.some((session) => session.id === newSessionId)) return current;
      return [{ id: newSessionId, title: title || `Session ${current.length + 1}`, updatedAt: new Date().toISOString() }, ...current];
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

  function flushEndSessionBeacon(sessId: string) {
    if (endingBeaconSentRef.current) return;
    const userId = getSupabaseUserId();
    if (!userId) return;
    endingBeaconSentRef.current = true;
    const body = JSON.stringify({ user_id: userId, session_id: sessId });
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

  function selectSession(nextSessionId: string) {
    if (nextSessionId === sessionId || isReplying || isLoadingSession) return;
    router.push(`/chat/${nextSessionId}`);
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
    endingBeaconSentRef.current = false;
    const onPageHide = () => {
      if (!activeSessionId) return;
      flushEndSessionBeacon(activeSessionId);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [activeSessionId]);

  return {
    sessions,
    activeSession,
    activeSessionId,
    visibleSessions,
    messages,
    setMessages,
    isReplying,
    setIsReplying,
    isEndingSession,
    isLoadingSession,
    sessionsReady,
    sessionNotFound,
    awaitingGrade,
    setAwaitingGrade,
    error,
    setError,
    lastActiveAgent,
    setLastActiveAgent,
    placementContext,
    sendAgentMessage,
    registerSession,
    endSession,
    selectSession,
    latestAssistant
  };
}
