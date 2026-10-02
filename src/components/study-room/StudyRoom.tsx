"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import StudySidebar from "@/components/study/StudySidebar";
import MarkdownMath from "@/components/MarkdownMath";
import MathErrorBoundary from "@/components/MathErrorBoundary";
import type { QuestionSource, StudyMode, StudyPhase, StudyState } from "@/lib/api/study";
import LessonOutline from "./LessonOutline";
import LiveActivity from "./LiveActivity";
import PhaseIndicator from "./PhaseIndicator";
import PracticePane from "./PracticePane";
import StudyHistory from "./StudyHistory";
import StudyResults from "./StudyResults";
import StudyWelcome from "./StudyWelcome";
import { useStudySession, type StudyMessage } from "./useStudySession";

// Moving on is a button (PhaseActions), not a phrase the model may ignore.
const QUICK_REPLIES: Record<StudyPhase, string[]> = {
  learn: ["Explain that differently", "Give me an analogy", "Draw a diagram"],
  examples: ["Why that step?", "Draw a diagram"],
  practice: ["Which concept is this testing?", "Give me a hint", "Explain the concept behind this"],
  evaluation: ["What should I revise first?", "Explain my mistake again"],
  completed: ["What should I revise first?", "Explain my mistake again"],
};

/** The student's own controls for pace: continue, skip ahead, finish. */
function PhaseActions({
  study,
  busy,
  onSend,
  onAdvance,
}: {
  study: StudyState;
  busy: boolean;
  onSend: (text: string) => void;
  onAdvance: () => void;
}) {
  const phase = study.current_phase;
  const parts = study.lesson_plan?.[phase] ?? [];
  const lastPart = parts.length > 0 && (study.phase_step ?? 0) >= parts.length - 1;
  const btn =
    "cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  if (phase === "learn" || phase === "examples") {
    const unit = phase === "learn" ? "part" : "example";
    return (
      <div className="flex flex-wrap items-center gap-2">
        {!lastPart && parts.length > 0 && (
          <button type="button" disabled={busy} onClick={() => onSend(`Got it — next ${unit}, please.`)} className={`${btn} border border-line bg-surface text-ink hover:bg-hover`}>
            Next {unit}
          </button>
        )}
        <button type="button" disabled={busy} onClick={onAdvance} className={`${btn} bg-ink text-ink-on hover:bg-ink/90`}>
          {phase === "learn" ? "Skip to examples →" : "Start practice →"}
        </button>
      </div>
    );
  }
  if (phase === "practice") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy || study.questions_served === 0}
          title={study.questions_served === 0 ? "Answer at least one question first" : undefined}
          onClick={() => {
            if (study.questions_served >= 3 || window.confirm(`Finish now with ${study.questions_served} question${study.questions_served === 1 ? "" : "s"} answered?`)) onAdvance();
          }}
          className={`${btn} bg-ink text-ink-on hover:bg-ink/90`}
        >
          Finish & see results
        </button>
        <span className="text-xs text-muted">
          {study.questions_correct}/{study.questions_served} correct · level {study.difficulty_level}/5
        </span>
      </div>
    );
  }
  return null;
}

function MessageBubble({ message }: { message: StudyMessage }) {
  if (message.role === "user" && message.auto) {
    return (
      <p className="self-center rounded-full border border-line px-3 py-1 text-[11px] font-medium text-muted">
        {message.content}
      </p>
    );
  }
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className={`max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md px-4 py-2.5 text-sm leading-relaxed ${
            message.failed ? "border border-danger/40 bg-danger/5 text-ink" : "bg-ink text-ink-on"
          }`}
        >
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <article className="study-notes">
      <MathErrorBoundary content={message.content}>
        <MarkdownMath content={message.content} />
      </MathErrorBoundary>
    </article>
  );
}

function Composer({
  busy,
  phase,
  placeholder,
  onSend,
  initialValue = "",
  onStop,
  stopping = false,
}: {
  busy: boolean;
  phase: StudyPhase;
  placeholder: string;
  onSend: (text: string) => void;
  /** Text handed back after Stop; the parent remounts the composer to apply it. */
  initialValue?: string;
  /** Present while a turn runs: the send button becomes Stop. */
  onStop?: () => void;
  stopping?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || busy) return;
    onSend(text);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick replies">
        {QUICK_REPLIES[phase].map((q) => (
          <button
            key={q}
            type="button"
            disabled={busy}
            onClick={() => onSend(q)}
            className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-2 transition-colors hover:border-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow-composer)] transition-colors focus-within:border-accent"
      >
        <label htmlFor="study-composer" className="sr-only">
          Message your tutor
        </label>
        <textarea
          id="study-composer"
          aria-label="Message your tutor"
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="max-h-[180px] min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70"
        />
        {onStop ? (
          <button
            type="button"
            onClick={onStop}
            disabled={stopping}
            aria-label={stopping ? "Stopping" : "Stop the tutor"}
            title="Stop — use this if you sent that by mistake"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-ink text-ink-on transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {stopping ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-on/30 border-t-ink-on motion-reduce:animate-none" aria-hidden />
            ) : (
              <span className="h-3.5 w-3.5 rounded-[3px] bg-ink-on" aria-hidden />
            )}
          </button>
        ) : (
          <button
            type="submit"
            disabled={busy || !value.trim()}
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-accent text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}


export default function StudyRoom({
  conceptId,
  sessionId,
  mode: requestedMode = "learn",
  questionSource: requestedSource = "any",
}: {
  conceptId: string;
  sessionId?: string | null;
  mode?: StudyMode;
  questionSource?: QuestionSource;
}) {
  const {
    study,
    learner,
    startInfo,
    messages,
    startError,
    sendError,
    busy,
    activity,
    elapsed,
    evaluation,
    send,
    advance,
    stop,
    stopping,
    restored,
    notice,
    advancing,
    answered,
    answerChoice,
    retry,
    restart,
    reload,
  } = useStudySession(conceptId, sessionId, requestedMode, requestedSource);
  const [historyOpen, setHistoryOpen] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, busy, study?.current_phase, activity.length]);

  const phase: StudyPhase = study?.current_phase ?? "learn";
  const finished = phase === "evaluation" || phase === "completed";
  // A graded multiple-choice question stays on screen, with its result, until the next one is served.
  const liveQuestion = phase === "practice" ? study?.practice_question ?? null : null;
  const question = liveQuestion ?? (phase === "practice" ? answered?.question ?? null : null);
  const showingResult = !liveQuestion && Boolean(answered);
  const showWelcome = Boolean(study) && messages.length === 0 && !busy;

  const nav = (
    <StudySidebar
      studyContext={study ? { conceptName: study.concept_name, conceptId: study.concept_id, stage: phase } : undefined}
    />
  );

  if (startError) {
    return (
      <div className="flex h-dvh bg-canvas">
        {nav}
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center">
            <p className="text-sm font-medium text-danger">{startError}</p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={reload}
                className="cursor-pointer rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-ink-on hover:bg-ink/90"
              >
                Try again
              </button>
              <Link href="/study" className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-ink-2 hover:bg-hover">
                Pick another topic
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="flex h-dvh bg-canvas">
        {nav}
        <main className="flex flex-1 flex-col items-center justify-center gap-4" role="status">
          <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-line border-t-accent motion-reduce:animate-none" />
          <p className="text-sm text-muted">Opening your study room…</p>
        </main>
      </div>
    );
  }

  const conversation = (
    <div className="flex flex-col gap-7">
      {startInfo?.resumed && messages.length > 0 && (
        <p className="self-center rounded-full bg-hover px-3 py-1 text-[11px] font-medium text-ink-2">
          Picked up where you left off
        </p>
      )}
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
      {busy && (
        <LiveActivity
          activity={activity}
          elapsed={elapsed}
          fallback={advancing ? "Moving on" : "Sending your message"}
          stopping={stopping}
          onStop={advancing ? undefined : stop}
        />
      )}
      {notice && !busy && <p className="self-center text-xs text-muted">{notice}</p>}
      {sendError && !busy && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          <span className="flex-1">{sendError}</span>
          <button type="button" onClick={retry} className="cursor-pointer rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-surface hover:bg-danger/90">
            Retry
          </button>
        </div>
      )}
      {finished && (
        <StudyResults
          study={study}
          summary={evaluation?.summary ?? null}
          readiness={evaluation?.readiness ?? null}
          delta={evaluation?.delta ?? null}
          onPracticeAgain={restart}
        />
      )}
      <div ref={endRef} className="h-2" />
    </div>
  );

  const composer = (
    <div className="flex flex-col gap-2.5">
      <div className="lg:hidden">
        <LessonOutline study={study} compact />
      </div>
      <PhaseActions study={study} busy={busy} onSend={(t) => void send(t)} onAdvance={() => void advance()} />
      <Composer
      key={restored?.nonce ?? "composer"}
      initialValue={restored?.text ?? ""}
      onStop={busy && !advancing ? stop : undefined}
      stopping={stopping}
      busy={busy}
      phase={phase}
      onSend={(t) => void send(t)}
      placeholder={
        question
          ? "Ask about this question — or answer it in the practice panel"
          : finished
            ? "Any last doubts?"
            : "Answer the question, or ask anything…"
      }
    />
    </div>
  );

  return (
    <div className="flex h-dvh bg-canvas">
      {nav}
      <main className="flex min-w-0 flex-1 flex-col pt-14">
        <div className="border-b border-line">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold uppercase tracking-widest text-muted">
                {(study.mode ?? requestedMode) === "practice"
                  ? `Practice${(study.question_source ?? requestedSource) === "pyq" ? " · past JEE papers" : ""}`
                  : "Study room"}
                {study.chapter ? ` · ${study.chapter}` : ""}
              </p>
              <h1 className="truncate font-display text-lg font-semibold text-ink">{study.concept_name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <PhaseIndicator currentPhase={phase} mode={study.mode ?? requestedMode} />
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-hover hover:text-ink"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                  <path d="M3 3v5h5M12 7v5l3 2" />
                </svg>
                History
              </button>
              {messages.length > 0 && !finished && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Start this topic over from the beginning? Your progress so far stays in your record.")) restart();
                  }}
                  className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-hover hover:text-ink max-sm:hidden"
                >
                  Start over
                </button>
              )}
            </div>
          </div>
        </div>

        {showWelcome ? (
          <div className="flex-1 overflow-y-auto px-4 sm:px-6">
            <StudyWelcome
              conceptName={study.concept_name}
              chapter={study.chapter}
              definition={startInfo?.definition}
              resolvedFrom={startInfo?.resolved_from}
              inSyllabus={startInfo?.in_syllabus ?? true}
              alternatives={startInfo?.alternatives ?? []}
              learner={learner}
              busy={busy}
              mode={study.mode ?? requestedMode}
              questionSource={study.question_source ?? requestedSource}
              modeHref={(m, src) => {
                const base = `/study/${encodeURIComponent(study.concept_id)}`;
                if (m !== "practice") return base;
                return `${base}?mode=practice${src === "pyq" ? "&source=pyq" : ""}`;
              }}
              onStart={() =>
                void send(
                  (study.mode ?? requestedMode) === "practice"
                    ? "Give me the first question."
                    : learner?.returning
                      ? "I've studied this before — let's recap and get going."
                      : "Let's begin.",
                )
              }
            />
          </div>
        ) : question ? (
          <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            {/* Question on the right on wide screens (order-last), on top on phones. */}
            <div className="overflow-y-auto border-line px-4 py-5 sm:px-6 lg:order-last lg:border-l max-lg:max-h-[48vh] max-lg:border-b">
              <PracticePane
                key={question.content_id /* a new question starts with an empty answer box */}
                question={question}
                number={showingResult ? study.questions_served : study.questions_served + 1}
                correct={study.questions_correct}
                attempted={study.questions_served}
                difficulty={study.difficulty_level}
                busy={busy}
                result={showingResult ? answered : null}
                onSubmit={(a) => void send(`My answer: ${a}`)}
                onChoose={(labels, positionOf) => void answerChoice(labels, question, positionOf)}
                onAsk={(t) => void send(t)}
              />
            </div>
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">{conversation}</div>
              <div className="px-4 pb-4 pt-2 sm:px-6">{composer}</div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1">
            {(study.lesson_plan?.[phase]?.length ?? 0) > 0 && (
              <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-line px-4 py-6 lg:block">
                <LessonOutline study={study} />
              </aside>
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                <div className="mx-auto w-full max-w-3xl">{conversation}</div>
              </div>
              <div className="px-4 pb-4 pt-2 sm:px-6">
                <div className="mx-auto w-full max-w-3xl">{composer}</div>
              </div>
            </div>
          </div>
        )}
      </main>
      <StudyHistory open={historyOpen} onClose={() => setHistoryOpen(false)} currentId={study.study_session_id} />
    </div>
  );
}
