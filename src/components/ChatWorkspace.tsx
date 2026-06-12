"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import StudySidebar from "@/components/StudySidebar";

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

type ConceptSnapshot = {
  concept_name: string;
  score_at_time: number;
  trend: "up" | "down" | "flat" | string;
  is_prerequisite: boolean;
  updated_at?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  structured_response?: StructuredResponse | null;
  tokens_used?: number | null;
  latency_ms?: number | null;
  created_at?: string;
  concept_snapshots?: ConceptSnapshot[];
};

type Session = {
  id: string;
  title: string;
  subject: string;
  active_chapters: string[];
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
};

type SessionDetail = Session & {
  messages: Message[];
};

type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

const backendBaseUrl = (process.env.NEXT_PUBLIC_CHAT_API_BASE ?? "http://127.0.0.1:8000/api/v1/chat").replace(/\/+$/, "");

const fallbackPrompts = [
  "What if the force was applied at a 30 degree angle instead?",
  "How does torque relate to moment of inertia?",
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

function scoreColor(color: string) {
  const lowered = color.toLowerCase();
  if (lowered === "red") return "#ff3f52";
  if (lowered === "orange") return "#ffa20d";
  if (lowered === "green") return "#12c48b";
  if (lowered === "yellow") return "#f6d32d";
  if (lowered.startsWith("#")) return color;
  return "#8a8ca0";
}

function conceptTrendMark(trend: string) {
  if (trend === "up") return "up";
  if (trend === "down") return "down";
  return "flat";
}

function ConceptPanel({
  collapsed,
  onToggle,
  concepts,
  prerequisiteChain,
}: {
  collapsed: boolean;
  onToggle: () => void;
  concepts: ConceptSnapshot[];
  prerequisiteChain: PrerequisiteNode[];
}) {
  return (
    <aside className={`concept-panel ${collapsed ? "concept-panel-collapsed" : ""}`}>
      <button type="button" className="concept-toggle" onClick={onToggle} aria-label="Toggle concepts panel">
        {collapsed ? <PanelIcon /> : <XIcon />}
      </button>

      {!collapsed && (
        <div className="concept-content">
          <h2>Concepts in this response</h2>

          <div className="concept-cards">
            {concepts.length === 0 && <p className="concept-empty">No concepts yet.</p>}
            {concepts.map((concept) => (
              <div className="concept-card" key={concept.concept_name}>
                <div className="concept-card-top">
                  <span>{concept.concept_name}</span>
                  {concept.is_prerequisite && <strong style={{ background: "#ff9f0a" }} />}
                </div>
                <div className="concept-progress">
                  <span style={{ width: `${concept.score_at_time}%`, background: scoreColor(concept.trend) }} />
                </div>
                <p>{concept.score_at_time}%</p>
              </div>
            ))}
          </div>

          <h3>Your state on these concepts</h3>
          <div className="mini-metrics">
            {concepts.map((concept) => (
              <div className="mini-metric" key={`metric-${concept.concept_name}`}>
                <span>{concept.concept_name}</span>
                <div>
                  <i style={{ width: `${concept.score_at_time}%`, background: scoreColor(concept.trend) }} />
                </div>
                <b>{conceptTrendMark(concept.trend)}</b>
              </div>
            ))}
          </div>

          <h3>Prerequisite chain</h3>
          <div className="chain-list">
            {prerequisiteChain.length === 0 && <p className="concept-empty">No prerequisite chain yet.</p>}
            {prerequisiteChain.map((item) => (
              <div className="chain-item" key={item.concept}>
                <span style={{ background: scoreColor(item.color) }} />
                <p>
                  {item.concept} ({item.score}%)
                </p>
                <b style={{ background: scoreColor(item.color) }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function AssistantResponse({ message }: { message: Message }) {
  const structured = message.structured_response;

  if (!structured) {
    return <article className="lesson-response assistant-plain">{message.content}</article>;
  }

  return (
    <article className="lesson-response">
      <section className="lesson-gap">
        <h3>FILLING A GAP FIRST</h3>
        <p>{structured.filling_gap || message.content}</p>
      </section>

      <section className="lesson-solution">
        <div className="solution-rule">
          <span>SOLUTION</span>
        </div>
        {(structured.solution_steps ?? []).map((line, index) => (
            <div className="solution-step" key={`${index}-${line}`}>
              <span>{index + 1}</span>
              <p>{line}</p>
            </div>
          ))}
      </section>

      {structured.insight && <div className="lesson-note">{structured.insight}</div>}
    </article>
  );
}

export default function ChatWorkspace() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [concepts, setConcepts] = useState<ConceptSnapshot[]>([]);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
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

  const prerequisiteChain = latestAssistant?.structured_response?.prerequisite_chain ?? [];

  function getAuthHeaders() {
    if (typeof window === "undefined") return {};
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("auth_token") ||
      "";

    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  async function parseResponseError(response: Response) {
    try {
      const data = (await response.json()) as { detail?: string; error?: string; message?: string };
      return data.detail ?? data.error ?? data.message ?? `Request failed (${response.status}).`;
    } catch {
      return `Request failed (${response.status}).`;
    }
  }

  async function apiRequest<T>(pathOrUrl: string, init?: RequestInit) {
    const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
    const headers = new Headers(init?.headers);
    if (init?.body && !(init.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    const authHeaders = getAuthHeaders();
    if (authHeaders.Authorization) {
      headers.set("Authorization", authHeaders.Authorization);
    }

    let response: Response;
    try {
      response = await fetch(isAbsolute ? pathOrUrl : `${backendBaseUrl}${pathOrUrl}`, {
        credentials: "include",
        ...init,
        headers,
      });
    } catch {
      throw new Error(
        `Unable to reach chat backend at ${backendBaseUrl}. Check backend server, CORS, and NEXT_PUBLIC_CHAT_API_BASE.`,
      );
    }

    if (!response.ok) {
      const message = await parseResponseError(response);
      throw new Error(message);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  async function fetchAllPages<T>(path: string) {
    const items: T[] = [];
    let nextUrl: string | null = `${backendBaseUrl}${path}`;

    while (nextUrl) {
      const pageData: PaginatedResponse<T> = await apiRequest<PaginatedResponse<T>>(nextUrl);
      items.push(...pageData.results);
      nextUrl = pageData.next;
    }
    return items;
  }

  async function loadSession(sessionId: string) {
    setError("");
    const detail = await apiRequest<SessionDetail>(`/sessions/${sessionId}/`);
    const paginatedMessages = await fetchAllPages<Message>(`/sessions/${sessionId}/messages/`);
    const conceptsResponse = await apiRequest<ConceptSnapshot[]>(`/sessions/${sessionId}/concepts/`);

    setActiveSessionId(sessionId);
    setMessages(paginatedMessages.length > 0 ? paginatedMessages : (detail.messages ?? []));
    setConcepts(conceptsResponse ?? []);
    setSessions((current) => current.map((session) => (session.id === detail.id ? { ...session, ...detail } : session)));
  }

  async function createSession() {
    setIsCreatingSession(true);
    setError("");
    try {
      const created = await apiRequest<Session>("/sessions/", {
        method: "POST",
        body: JSON.stringify({
          title: `Session ${new Date().toLocaleString()}`,
          subject: "Physics",
          active_chapters: [],
        }),
      });
      setSessions((current) => [created, ...current]);
      setActiveSessionId(created.id);
      setMessages([]);
      setConcepts([]);
      return created.id;
    } finally {
      setIsCreatingSession(false);
    }
  }

  async function ensureSessionId() {
    if (activeSessionId) return activeSessionId;
    return createSession();
  }

  async function endSession() {
    if (!activeSessionId || isEndingSession) return;
    setIsEndingSession(true);
    setError("");
    try {
      const ended = await apiRequest<Session>(`/sessions/${activeSessionId}/end/`, { method: "PATCH" });
      setSessions((current) => current.map((session) => (session.id === ended.id ? ended : session)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to end this session.");
    } finally {
      setIsEndingSession(false);
    }
  }

  async function submitMessage(value: string) {
    const trimmed = value.trim();
    if (!trimmed || isReplying) return;

    const sessionId = await ensureSessionId();
    if (!sessionId) return;

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
      const assistantMessage = await apiRequest<Message>(`/sessions/${sessionId}/messages/`, {
        method: "POST",
        body: JSON.stringify({ content: trimmed }),
      });
      setMessages((current) => [...current, assistantMessage]);
      const updatedConcepts = await apiRequest<ConceptSnapshot[]>(`/sessions/${sessionId}/concepts/`);
      setConcepts(updatedConcepts);
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
    let isMounted = true;

    async function bootstrap() {
      setIsLoading(true);
      setError("");
      try {
        const allSessions = await fetchAllPages<Session>("/sessions/");
        if (!isMounted) return;
        setSessions(allSessions);

        if (allSessions.length > 0) {
          await loadSession(allSessions[0].id);
        }
      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Unable to load sessions.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="chat-page">
      <StudySidebar />

      <section className="chat-main">
        <header className="chat-header">
          <h1>{activeSession?.title ?? "Session"}</h1>
          <div className="header-actions">
            <button type="button" className="header-action-button" onClick={() => void createSession()} disabled={isCreatingSession}>
              {isCreatingSession ? "Creating..." : "New chat"}
            </button>
            <button type="button" className="end-session" onClick={() => void endSession()} disabled={!activeSessionId || isEndingSession}>
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
                onClick={() => void loadSession(session.id)}
              >
                {session.title}
              </button>
            ))}
          </div>

          {isLoading && <p className="chat-error">Loading sessions...</p>}
          {!isLoading && sessions.length === 0 && <p className="chat-error">No sessions yet. Start a new chat.</p>}

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
          <p>KaTeX supported - type $F = ma$ for inline math</p>
        </form>
      </section>

      <ConceptPanel
        collapsed={panelCollapsed}
        onToggle={() => setPanelCollapsed((current) => !current)}
        concepts={concepts}
        prerequisiteChain={prerequisiteChain}
      />
    </main>
  );
}
