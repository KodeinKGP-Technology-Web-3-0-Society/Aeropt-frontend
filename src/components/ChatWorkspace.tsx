"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import StudySidebar from "@/components/StudySidebar";
import { getAgentApiBase, getSupabaseUserId } from "@/lib/auth";

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
};

type Session = {
  id: string;
  title: string;
};

type AgentChatResponse = {
  session_id: string;
  response?: string | null;
  follow_up_suggestions?: Array<string | { text?: string; label?: string; suggestion?: string }> | null;
  awaiting_graded_response?: boolean;
  error?: string | null;
};

const agentBaseUrl = getAgentApiBase();
const SESSION_STORAGE_KEY = "agent_active_session_id";

const fallbackPrompts = [
  "Explain torque and moment of inertia",
  "Give me a practice question on Newton's 2nd law",
];

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

function AssistantResponse({ message }: { message: Message }) {
  const structured = message.structured_response;

  if (!structured) {
    return <article className="lesson-response assistant-plain">{message.content}</article>;
  }

  return (
    <article className="lesson-response">
      {structured.filling_gap && (
        <section className="lesson-gap">
          <h3>FILLING A GAP FIRST</h3>
          <p>{structured.filling_gap}</p>
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
              <p>{line}</p>
            </div>
          ))}
        </section>
      )}

      {structured.insight && <div className="lesson-note">{structured.insight}</div>}
      {!structured.filling_gap && !structured.solution_steps.length && (
        <div className="assistant-plain">{message.content}</div>
      )}
    </article>
  );
}

function normalizeSuggestions(
  suggestions: AgentChatResponse["follow_up_suggestions"],
): string[] {
  if (!suggestions) return [];
  return suggestions
    .map((item) => {
      if (typeof item === "string") return item;
      return item.text || item.label || item.suggestion || "";
    })
    .filter(Boolean);
}

function buildAssistantMessage(response: AgentChatResponse): Message {
  const text = response.response?.trim() || "I could not generate a response.";
  const tryNext = normalizeSuggestions(response.follow_up_suggestions);

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: text,
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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(true);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

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

  async function sendAgentMessage(query: string, sessionId: string | null) {
    const userId = getSupabaseUserId();
    if (!userId) {
      throw new Error("Missing Supabase user link. Sign out and sign in again.");
    }

    const response = await fetch(`${agentBaseUrl}/api/v1/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
        query,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { detail?: string; error?: string };
      throw new Error(data.detail || data.error || `Agent request failed (${response.status}).`);
    }

    return (await response.json()) as AgentChatResponse;
  }

  function registerSession(sessionId: string, title?: string) {
    setActiveSessionId(sessionId);
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    setSessions((current) => {
      if (current.some((session) => session.id === sessionId)) return current;
      return [{ id: sessionId, title: title || `Session ${current.length + 1}` }, ...current];
    });
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

  async function submitMessage(value: string) {
    const trimmed = value.trim();
    if (!trimmed || isReplying) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setInput("");
    setError("");
    setIsReplying(true);
    setMessages((current) => [...current, userMessage]);

    try {
      const agentResponse = await sendAgentMessage(trimmed, activeSessionId);
      if (agentResponse.error) {
        throw new Error(agentResponse.error);
      }

      registerSession(agentResponse.session_id);
      const assistantMessage = buildAssistantMessage(agentResponse);
      setMessages((current) => [...current, assistantMessage]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      setMessages((current) => current.filter((message) => message.id !== userMessage.id));
    } finally {
      setIsReplying(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(input);
  }

  useEffect(() => {
    const savedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSessionId) {
      setActiveSessionId(savedSessionId);
      setSessions([{ id: savedSessionId, title: "Current session" }]);
    }
  }, []);

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
                onClick={() => setActiveSessionId(session.id)}
              >
                {session.title}
              </button>
            ))}
          </div>

          {messages.length === 0 && (
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
              <AssistantResponse key={message.id} message={message} />
            ),
          )}

          {isReplying && <TypingIndicator />}
          {error && <p className="chat-error">{error}</p>}

          <div className="quick-prompts">
            <span>Try next</span>
            {quickPrompts.map((prompt) => (
              <button key={prompt} type="button" onClick={() => void submitMessage(prompt)}>
                {prompt} {"->"}
              </button>
            ))}
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
          <p>Powered by JEE Tutor Agent — grade practice answers with 1 (correct) or 0 (wrong)</p>
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
