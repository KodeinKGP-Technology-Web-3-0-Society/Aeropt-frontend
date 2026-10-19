"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import AssistantResponse from "@/components/chat/AssistantResponse";
import ActivityTrail from "@/components/chat/ActivityTrail";
import MarkdownMath from "@/components/MarkdownMath";
import MathErrorBoundary from "@/components/MathErrorBoundary";
import LiveActivity from "@/components/study-room/LiveActivity";
import ChatHistory from "./ChatHistory";
import { useTutorChat } from "./useTutorChat";
import VoiceDoubtRecorder from "@/components/voice/VoiceDoubtRecorder";
import { fetchStudyOverview, type StudyOverview } from "@/lib/api/study";

export interface RecommendedPrompt {
  id: string;
  prompt: string;
  badge: string;
  badgeVariant?: "accent" | "warning" | "default";
  detail?: string;
}

const DEFAULT_STARTERS: RecommendedPrompt[] = [
  {
    id: "default-roadmap",
    prompt: "Help me plan my study roadmap for JEE Advanced",
    badge: "Roadmap • Planning",
    badgeVariant: "accent",
    detail: "Set up a personalized learning sequence across Physics, Chemistry, and Maths",
  },
  {
    id: "default-diagnostic",
    prompt: "Give me a mixed 10-minute diagnostic drill across PCM",
    badge: "Diagnostic • PCM",
    badgeVariant: "default",
    detail: "Assess your baseline strengths and pinpoint areas for improvement",
  },
  {
    id: "default-weightage",
    prompt: "Which high-weightage topics in JEE should I prioritize first?",
    badge: "Exam Strategy",
    badgeVariant: "default",
    detail: "Review high-yield chapters based on recent JEE Advanced papers",
  },
  {
    id: "default-pyq",
    prompt: "Give me a classic JEE Advanced problem with step-by-step guidance",
    badge: "Practice Problem",
    badgeVariant: "accent",
    detail: "Tackle a multi-concept question with Socratic hints as you work",
  },
];

function buildProgressRecommendations(overview: StudyOverview | null): RecommendedPrompt[] {
  if (!overview) return DEFAULT_STARTERS;
  const items: RecommendedPrompt[] = [];

  // 1. Up next / Resume items
  for (const next of overview.up_next || []) {
    if (items.length >= 4) break;
    if (next.kind === "resume") {
      items.push({
        id: `resume-${next.concept_id}`,
        prompt: `Pick up where I left off on ${next.name}`,
        badge: `Resume • ${next.chapter || "Study"}`,
        badgeVariant: "accent",
        detail: next.reason || "Continue from your last session",
      });
    } else if (next.kind === "review") {
      items.push({
        id: `review-${next.concept_id}`,
        prompt: `Review ${next.name} — give me a practice problem`,
        badge: `Review Due • ${next.chapter || "Study"}`,
        badgeVariant: "warning",
        detail: next.reason || "Spaced review recommended for today",
      });
    } else if (next.kind === "next") {
      items.push({
        id: `next-${next.concept_id}`,
        prompt: `Help me start the next topic: ${next.name}`,
        badge: `Up Next • ${next.chapter || "Syllabus"}`,
        badgeVariant: "default",
        detail: next.reason || "Next topic in your syllabus sequence",
      });
    }
  }

  // 2. Concepts needing review (struggled topics)
  if (items.length < 4 && overview.needs_review) {
    for (const group of overview.needs_review) {
      for (const concept of group.concepts || []) {
        if (items.length >= 4) break;
        if (!items.some((i) => i.prompt.includes(concept.name))) {
          items.push({
            id: `weak-${concept.concept_id}`,
            prompt: `I had trouble with ${concept.name}. Can you explain where students usually get stuck?`,
            badge: `Review • ${group.chapter}`,
            badgeVariant: "warning",
            detail: `From your practice in ${group.chapter}`,
          });
        }
      }
    }
  }

  // 3. In-progress concepts
  if (items.length < 4 && overview.in_progress) {
    for (const group of overview.in_progress) {
      for (const concept of group.concepts || []) {
        if (items.length >= 4) break;
        if (!items.some((i) => i.prompt.includes(concept.name))) {
          items.push({
            id: `progress-${concept.concept_id}`,
            prompt: `Give me a JEE Advanced problem on ${concept.name}`,
            badge: `In Progress • ${group.chapter}`,
            badgeVariant: "accent",
            detail: `Test your mastery on ${concept.name}`,
          });
        }
      }
    }
  }

  // 4. Overarching progress check if we have studied items
  if (items.length > 0 && items.length < 4) {
    items.push({
      id: "progress-overview",
      prompt: "What should I revise today based on my study progress?",
      badge: "Study Plan Check",
      badgeVariant: "default",
      detail: "Ask your tutor to evaluate your recent study history",
    });
  }

  return items.length > 0 ? items : DEFAULT_STARTERS;
}

function SparklesIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
    </svg>
  );
}

function EyeOffIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5m0 0-6 6m6-6 6 6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h10" />
    </svg>
  );
}

function Composer({ disabled, onSend }: { disabled: boolean; onSend: (text: string) => void }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (disabled || !value.trim()) return;
    onSend(value);
    setValue("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-3xl">
      <div className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-sm transition-colors focus-within:border-accent">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a doubt, paste a question, or ask about your progress…"
          aria-label="Message the tutor"
          className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 text-ink outline-none placeholder:text-muted"
        />
        <div className="flex items-center gap-1.5 pb-0.5">
          <VoiceDoubtRecorder
            onTranscribed={(transcript) => {
              setValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
            }}
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-accent text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendIcon />
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">
        Enter to send · Shift+Enter for a new line · The tutor remembers your Study Room work
      </p>
    </form>
  );
}

export default function TutorChat({
  initialSessionId,
  onSessionChange,
}: {
  initialSessionId: string | null;
  onSessionChange: (id: string | null) => void;
}) {
  const chat = useTutorChat(initialSessionId, onSessionChange);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const [overview, setOverview] = useState<StudyOverview | null>(null);
  const [hideStarters, setHideStarters] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem("aeropt_hide_chat_recommendations") === "true";
      }
    } catch {
      /* ignore storage access error */
    }
    return false;
  });

  useEffect(() => {
    let active = true;
    fetchStudyOverview()
      .then((data) => {
        if (active) setOverview(data);
      })
      .catch(() => {
        /* graceful fallback */
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleHideStarters = () => {
    setHideStarters((prev) => {
      const next = !prev;
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("aeropt_hide_chat_recommendations", String(next));
        }
      } catch {
        /* ignore storage error */
      }
      return next;
    });
  };

  const recommendations = useMemo(() => buildProgressRecommendations(overview), [overview]);
  const hasStudiedTopics = Boolean(
    overview &&
      ((overview.up_next && overview.up_next.length > 0) ||
        (overview.in_progress && overview.in_progress.length > 0) ||
        (overview.needs_review && overview.needs_review.length > 0))
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [chat.messages, chat.streaming, chat.activity]);

  const activeLabel =
    chat.sessions.find((s) => s.session_id === chat.activeId)?.label ?? (chat.activeId ? "Chat" : "New chat");
  const empty =
    !chat.threadLoading &&
    !chat.threadMissing &&
    !chat.threadError &&
    chat.messages.length === 0 &&
    chat.streaming === null;
  const latestAssistantId = [...chat.messages].reverse().find((m) => m.role === "assistant")?.id;

  const history = (
    <ChatHistory
      sessions={chat.sessions}
      loading={chat.sessionsLoading}
      error={chat.sessionsError}
      activeId={chat.activeId}
      busy={chat.isReplying}
      onNewChat={() => {
        chat.newChat();
        setDrawerOpen(false);
      }}
      onSelect={(id) => {
        stickToBottom.current = true;
        chat.selectChat(id);
        setDrawerOpen(false);
      }}
      onRename={chat.rename}
      onDelete={chat.remove}
      onRetry={() => void chat.refreshSessions()}
    />
  );

  // pt-14 clears the fixed site navbar (StudySidebar, h-14).
  return (
    <div className="flex min-w-0 flex-1 pt-14">
      <aside className="hidden w-72 shrink-0 border-r border-line bg-surface lg:block">{history}</aside>

      {drawerOpen ? (
        <div className="fixed inset-x-0 bottom-0 top-14 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close chat history"
            className="absolute inset-0 bg-ink/30"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-surface shadow-xl">{history}</aside>
        </div>
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open chat history"
            className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-hover hover:text-ink lg:hidden"
          >
            <MenuIcon />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{activeLabel}</h1>
          <span className="hidden text-xs text-muted sm:inline">JEE Tutor (PCM)</span>
        </header>

        <div
          ref={scrollRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
          }}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
            {chat.threadLoading ? (
              <div className="flex flex-col gap-4" aria-label="Loading conversation">
                <div className="ml-auto h-10 w-2/3 animate-pulse rounded-2xl bg-hover" />
                <div className="h-24 w-full animate-pulse rounded-2xl bg-hover" />
              </div>
            ) : chat.threadMissing ? (
              <div className="mt-16 text-center">
                <p className="text-sm text-ink">This chat could not be found. It may have been deleted.</p>
                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={chat.retryThread}
                    className="cursor-pointer text-sm font-semibold text-accent hover:text-accent-hover"
                  >
                    Retry loading
                  </button>
                  <button
                    type="button"
                    onClick={chat.newChat}
                    className="cursor-pointer text-sm font-medium text-muted hover:text-ink"
                  >
                    Start a new chat
                  </button>
                </div>
              </div>
            ) : chat.threadError ? (
              <div className="mt-16 text-center">
                <p className="text-sm text-ink">{chat.threadError}</p>
                <div className="mt-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={chat.retryThread}
                    className="cursor-pointer text-sm font-semibold text-accent hover:text-accent-hover"
                  >
                    Retry loading
                  </button>
                  <button
                    type="button"
                    onClick={chat.newChat}
                    className="cursor-pointer text-sm font-medium text-muted hover:text-ink"
                  >
                    Start a new chat
                  </button>
                </div>
              </div>
            ) : empty ? (
              <div className="mt-10 sm:mt-16">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-[32px] leading-10 font-semibold tracking-tight text-ink">What are you stuck on?</h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                      Ask any doubt across Physics, Chemistry, or Mathematics, paste a question you could not solve, or ask what to revise.
                      {hasStudiedTopics ? " Your tutor remembers what you have studied and practiced." : ""}
                    </p>
                  </div>
                  {recommendations.length > 0 ? (
                    <button
                      type="button"
                      onClick={toggleHideStarters}
                      className="cursor-pointer inline-flex items-center gap-1.5 self-start rounded-lg px-2.5 py-1 text-xs font-medium text-muted hover:bg-hover hover:text-ink transition-colors"
                      title={hideStarters ? "Show recommended study prompts" : "Hide recommended prompts"}
                    >
                      {hideStarters ? (
                        <>
                          <SparklesIcon className="h-3.5 w-3.5 text-accent" />
                          <span>Show suggestions</span>
                        </>
                      ) : (
                        <>
                          <EyeOffIcon className="h-3.5 w-3.5" />
                          <span>Hide suggestions</span>
                        </>
                      )}
                    </button>
                  ) : null}
                </div>

                {!hideStarters && recommendations.length > 0 ? (
                  <div className="mt-6">
                    <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                      <SparklesIcon className="h-3.5 w-3.5 text-accent" />
                      <span>{hasStudiedTopics ? "Recommended from your study progress" : "Suggested starting points"}</span>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {recommendations.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => void chat.send({ text: item.prompt })}
                          className="group flex flex-col justify-between rounded-xl border border-line bg-surface p-4 text-left transition-all hover:border-accent/40 hover:bg-hover hover:shadow-sm cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                                  item.badgeVariant === "accent"
                                    ? "bg-accent/10 text-accent"
                                    : item.badgeVariant === "warning"
                                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                      : "bg-ink/5 text-muted"
                                }`}
                              >
                                {item.badge}
                              </span>
                            </div>
                            <p className="mt-2.5 text-sm font-medium text-ink group-hover:text-accent transition-colors">
                              {item.prompt}
                            </p>
                          </div>
                          {item.detail ? (
                            <p className="mt-2 text-xs text-muted line-clamp-1">
                              {item.detail}
                            </p>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                {chat.messages.map((message) =>
                  message.role === "user" ? (
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15px] leading-6 text-surface">
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    // study-notes: the Study Room's reply typography (headings, bullets,
                    // nested lists, tables), which Tailwind's reset otherwise flattens.
                    <div key={message.id} className="study-notes min-w-0">
                      <AssistantResponse
                        message={message}
                        isLatest={message.id === latestAssistantId}
                        gradingDisabled={chat.isReplying}
                        onGrade={(outcome) => void chat.send({ text: "", gradedOutcome: outcome })}
                        onPickCard={(card) =>
                          void chat.send({
                            text: card.content_id
                              ? `Follow up: select content_id=${card.content_id}`
                              : `Follow up: ${card.front.slice(0, 80)}`,
                          })
                        }
                        onFlagStep={() => void chat.send({ text: "I don't get this step" })}
                      />
                    </div>
                  ),
                )}
                {chat.streaming !== null ? (
                  <div className="study-notes min-w-0" aria-live="polite">
                    {chat.streaming ? (
                      <article className="lesson-response assistant-plain">
                        {chat.activity.length > 0 && (
                          <ActivityTrail activity={chat.activity} waiting={false} />
                        )}
                        <MathErrorBoundary content={chat.streaming}>
                          <MarkdownMath content={chat.streaming} />
                        </MathErrorBoundary>
                      </article>
                    ) : (
                      <LiveActivity activity={chat.activity} elapsed={chat.elapsed} fallback="Thinking" />
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-line bg-canvas px-4 pb-4 pt-3">
          {chat.error ? (
            <div className="mx-auto mb-3 flex w-full max-w-3xl items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger/5 px-4 py-2.5">
              <p className="text-sm text-danger">{chat.error}</p>
              {chat.failed ? (
                <button
                  type="button"
                  onClick={chat.retry}
                  className="shrink-0 cursor-pointer text-sm font-semibold text-danger underline-offset-2 hover:underline"
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : null}
          <Composer
            disabled={chat.isReplying || chat.threadLoading || !chat.userId}
            onSend={(text) => {
              stickToBottom.current = true;
              void chat.send({ text });
            }}
          />
        </div>
      </main>
    </div>
  );
}
