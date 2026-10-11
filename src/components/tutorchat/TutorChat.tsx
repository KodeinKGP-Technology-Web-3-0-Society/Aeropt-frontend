"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import AssistantResponse from "@/components/chat/AssistantResponse";
import MarkdownMath from "@/components/MarkdownMath";
import MathErrorBoundary from "@/components/MathErrorBoundary";
import LiveActivity from "@/components/study-room/LiveActivity";
import ChatHistory from "./ChatHistory";
import { useTutorChat } from "./useTutorChat";
import VoiceDoubtRecorder from "@/components/voice/VoiceDoubtRecorder";

const STARTERS = [
  "Why does a body in uniform circular motion accelerate if its speed is constant?",
  "Explain the difference between work done by conservative and non-conservative forces",
  "How do I decide the sign convention in a mirror problem?",
  "Give me a JEE-level question on rotational motion",
];

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

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [chat.messages, chat.streaming, chat.activity]);

  const activeLabel =
    chat.sessions.find((s) => s.session_id === chat.activeId)?.label ?? (chat.activeId ? "Chat" : "New chat");
  const empty = !chat.threadLoading && !chat.threadMissing && chat.messages.length === 0 && chat.streaming === null;
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
          <span className="hidden text-xs text-muted sm:inline">Physics tutor</span>
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
                <button
                  type="button"
                  onClick={chat.newChat}
                  className="mt-3 cursor-pointer text-sm font-semibold text-accent hover:text-accent-hover"
                >
                  Start a new chat
                </button>
              </div>
            ) : empty ? (
              <div className="mt-10 sm:mt-20">
                <h2 className="text-2xl font-semibold tracking-tight text-ink">What are you stuck on?</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  Ask any physics doubt, paste a question you could not solve, or ask what to revise. The tutor
                  knows what you have studied and practised, so you can say “the question from my last lesson”.
                </p>
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {STARTERS.map((text) => (
                    <button
                      key={text}
                      type="button"
                      onClick={() => void chat.send({ text })}
                      className="cursor-pointer rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm text-ink transition-colors hover:border-accent hover:bg-accent-soft"
                    >
                      {text}
                    </button>
                  ))}
                </div>
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
