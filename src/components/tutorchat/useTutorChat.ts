"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AgentStreamError,
  createChatSession,
  deleteChatSession,
  fetchChatSessionDetail,
  fetchChatSessions,
  renameChatSession,
  sendChatMessage,
  type ChatSessionSummary,
} from "@/lib/api/agent";
import { getSupabaseUserId } from "@/lib/api/auth";
import { turnsToMessages } from "@/components/chat/useChatSession";
import { foldActivity, type StudyActivity } from "@/components/study-room/useStudySession";
import type { Message } from "@/components/chat/types";

/**
 * State for the general tutor chat: the history list, the open conversation and
 * the streaming reply. A new chat has no session until its first message, so
 * opening the page and leaving does not litter the history with empty chats.
 */

const HISTORY_LIMIT = 100;

export type ChatListItem = ChatSessionSummary & { label: string };

function labelFor(s: ChatSessionSummary): string {
  return (s.title || "").trim() || (s.preview || "").trim() || "New chat";
}

type PendingTurn = { text: string; gradedOutcome?: "correct" | "incorrect" };
type FailedTurn = PendingTurn & { messageId: string };

export function useTutorChat(initialSessionId: string | null, onSessionChange: (id: string | null) => void) {
  const userId = typeof window === "undefined" ? null : getSupabaseUserId();

  const [sessions, setSessions] = useState<ChatListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");

  const [activeId, setActiveId] = useState<string | null>(initialSessionId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(Boolean(initialSessionId));
  const [threadMissing, setThreadMissing] = useState(false);

  const [streaming, setStreaming] = useState<string | null>(null);
  // What the tutor is doing before the reply streams: tools, thinking, review.
  const [activity, setActivity] = useState<StudyActivity[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isReplying, setIsReplying] = useState(false);
  const [error, setError] = useState("");
  const [failed, setFailed] = useState<FailedTurn | null>(null);

  // The chat on screen, read by async work. Every switch writes it before
  // setActiveId, so a reply that lands after the student moved on is dropped.
  const activeRef = useRef<string | null>(initialSessionId);

  const refreshSessions = useCallback((): Promise<void> => {
    if (!userId) return Promise.resolve();
    return fetchChatSessions(userId, HISTORY_LIMIT, "chat")
      .then(
        (rows) => {
          setSessions(rows.map((s) => ({ ...s, label: labelFor(s) })));
          setSessionsError("");
        },
        (caught: unknown) => {
          setSessionsError(caught instanceof Error ? caught.message : "Could not load your chats.");
        },
      )
      .finally(() => setSessionsLoading(false));
  }, [userId]);

  /** Fetch a thread and show it if it is still the open chat. Callers reset the view first. */
  const fetchThread = useCallback(
    (id: string): Promise<void> => {
      if (!userId) return Promise.resolve();
      return fetchChatSessionDetail(userId, id).then(
        (detail) => {
          if (activeRef.current !== id) return;
          setMessages(turnsToMessages(detail.turns, id));
          setThreadLoading(false);
        },
        () => {
          if (activeRef.current !== id) return;
          setMessages([]);
          setThreadMissing(true);
          setThreadLoading(false);
        },
      );
    },
    [userId],
  );

  // First load: the history list, and the chat named in the URL.
  // threadLoading already starts true when there is one.
  useEffect(() => {
    void refreshSessions();
    if (initialSessionId) void fetchThread(initialSessionId);
  }, [refreshSessions, fetchThread, initialSessionId]);

  const selectChat = useCallback(
    (id: string) => {
      if (id === activeRef.current || isReplying) return;
      activeRef.current = id;
      setActiveId(id);
      setMessages([]);
      setStreaming(null);
      setThreadLoading(true);
      setThreadMissing(false);
      setError("");
      setFailed(null);
      onSessionChange(id);
      void fetchThread(id);
    },
    [isReplying, fetchThread, onSessionChange],
  );

  const newChat = useCallback(() => {
    if (isReplying) return;
    activeRef.current = null;
    setActiveId(null);
    setMessages([]);
    setStreaming(null);
    setThreadMissing(false);
    setThreadLoading(false);
    setError("");
    setFailed(null);
    onSessionChange(null);
  }, [isReplying, onSessionChange]);

  const send = useCallback(
    async (turn: PendingTurn, retryOf?: string) => {
      const text = turn.text.trim();
      if (!userId || isReplying || (!text && !turn.gradedOutcome)) return;

      // A retry reuses the question already on screen instead of adding it twice.
      const messageId = retryOf ?? crypto.randomUUID();
      if (!retryOf) {
        const display = turn.gradedOutcome ? (turn.gradedOutcome === "correct" ? "Correct" : "Incorrect") : text;
        setMessages((current) => [...current, { id: messageId, role: "user", content: display }]);
      }
      setError("");
      setFailed(null);
      setIsReplying(true);
      setStreaming("");
      setActivity([]);
      setElapsed(0);
      const started = Date.now();
      const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);

      let sessionId = activeRef.current;
      let recordedSteps: StudyActivity[] = [];
      try {
        if (!sessionId) {
          sessionId = await createChatSession(userId, "chat");
          activeRef.current = sessionId;
          setActiveId(sessionId);
          onSessionChange(sessionId);
        }
        const target = sessionId;
        const result = await sendChatMessage(
          {
            userId,
            sessionId: target,
            query: turn.gradedOutcome ? (turn.gradedOutcome === "correct" ? "1" : "0") : text,
            gradedOutcome: turn.gradedOutcome,
          },
          (token) => {
            if (activeRef.current === target) setStreaming((s) => (s ?? "") + token);
          },
          (event) => {
            if (activeRef.current === target) {
              setActivity((list) => {
                const next = foldActivity(list, event);
                recordedSteps = next;
                return next;
              });
            }
          },
        );
        if (activeRef.current === target) {
          setMessages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: result.response?.trim() || "I could not generate a response.",
              agent: result,
              activity: recordedSteps.length ? recordedSteps : undefined,
            },
          ]);
        }
      } catch (caught) {
        // The question stays on screen; Retry resends the same turn.
        setFailed({ ...turn, messageId });
        const partial = caught instanceof AgentStreamError ? caught.partial : "";
        setError(
          (caught instanceof Error ? caught.message : "The tutor could not reply.") +
            (partial ? " Part of the reply arrived before the connection dropped." : ""),
        );
      } finally {
        clearInterval(timer);
        setStreaming(null);
        setActivity([]);
        setIsReplying(false);
        void refreshSessions();
      }
    },
    [userId, isReplying, onSessionChange, refreshSessions],
  );

  const retry = useCallback(() => {
    if (failed) void send(failed, failed.messageId);
  }, [failed, send]);

  const rename = useCallback(
    async (id: string, title: string) => {
      if (!userId) return;
      const saved = await renameChatSession(userId, id, title);
      setSessions((current) =>
        current.map((s) => (s.session_id === id ? { ...s, title: saved, label: labelFor({ ...s, title: saved }) } : s)),
      );
    },
    [userId],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!userId) return;
      await deleteChatSession(userId, id);
      setSessions((current) => current.filter((s) => s.session_id !== id));
      if (activeRef.current === id) newChat();
    },
    [userId, newChat],
  );

  return {
    userId,
    sessions,
    sessionsLoading,
    sessionsError,
    refreshSessions,
    activeId,
    messages,
    threadLoading,
    threadMissing,
    streaming,
    activity,
    elapsed,
    isReplying,
    error,
    failed,
    selectChat,
    newChat,
    send,
    retry,
    rename,
    remove,
  };
}
