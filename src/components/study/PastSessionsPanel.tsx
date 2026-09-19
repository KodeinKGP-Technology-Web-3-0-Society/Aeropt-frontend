"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import MarkdownMath from "@/components/MarkdownMath";
import MathErrorBoundary from "@/components/MathErrorBoundary";
import {
  DEFAULT_HISTORY_PAGE_SIZE,
  describeHistoryError,
  formatHistoryDate,
  formatHistoryDuration,
  getChatHistory,
  getChatHistorySession,
  type ChatHistoryDetail,
  type ChatHistorySession,
  type HistoryErrorCopy,
} from "@/lib/api/chatHistory";
import { FOCUS_RING } from "@/lib/focusRing";


function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

/** Transcript preview for one past session, read from Django's detail endpoint. */
function SessionPreview({ sessionId }: { sessionId: string }) {
  const [detail, setDetail] = useState<ChatHistoryDetail | null>(null);
  const [problem, setProblem] = useState<HistoryErrorCopy | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getChatHistorySession(sessionId)
      .then((loaded) => {
        if (!cancelled) setDetail(loaded);
      })
      .catch((caught) => {
        if (!cancelled) setProblem(describeHistoryError(caught));
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, attempt]);

  if (problem) {
    return (
      <div className="mt-2 rounded-lg border border-line bg-canvas p-2">
        <p className="text-[11px] text-muted">{problem.message}</p>
        {problem.retryable ? (
          <button
            type="button"
            onClick={() => {
              setProblem(null);
              setAttempt((n) => n + 1);
            }}
            className={`mt-1 text-[11px] font-semibold text-accent ${FOCUS_RING}`}
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (!detail) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading transcript"
        className="mt-2 h-16 animate-pulse rounded-lg border border-line bg-canvas"
      />
    );
  }

  const turns = detail.turns.slice(-4);
  if (turns.length === 0) {
    return <p className="mt-2 text-[11px] text-muted">This session has no saved turns.</p>;
  }

  return (
    <ol className="mt-2 space-y-2 rounded-lg border border-line bg-canvas p-2">
      {turns.map((turn) => (
        <li key={turn.turn_id}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
            {turn.role === "user" ? "You" : "Tutor"}
          </p>
          <div className="mt-0.5 max-h-28 overflow-hidden text-[11px] leading-relaxed text-ink-2">
            {/* Maths in a transcript must still render: reuse the one renderer. */}
            <MathErrorBoundary content={turn.content}>
              <MarkdownMath content={turn.content} />
            </MathErrorBoundary>
          </div>
        </li>
      ))}
    </ol>
  );
}

function SessionRow({
  session,
  onOpen,
}: {
  session: ChatHistorySession;
  onOpen: (sessionId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const title = session.summary?.trim() || session.concepts_touched[0] || "Study session";

  return (
    <li className="rounded-xl border border-line bg-surface p-2.5">
      <button
        type="button"
        onClick={() => onOpen(session.session_id)}
        aria-label={`Open session from ${formatHistoryDate(session.started_at)}`}
        className={`block w-full text-left ${FOCUS_RING}`}
      >
        <p className="line-clamp-2 text-xs font-semibold text-ink">{title}</p>
        <p className="mt-1 text-[11px] text-muted">
          {formatHistoryDate(session.started_at)} · {formatHistoryDuration(session.duration_seconds)} ·{" "}
          {session.turn_count} {session.turn_count === 1 ? "turn" : "turns"}
        </p>
      </button>
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        aria-expanded={expanded}
        aria-pressed={expanded}
        aria-label={expanded ? "Hide transcript preview" : "Show transcript preview"}
        className={`mt-1.5 text-[11px] font-semibold text-accent ${FOCUS_RING}`}
      >
        {expanded ? "Hide transcript" : "Preview transcript"}
      </button>
      {expanded ? <SessionPreview sessionId={session.session_id} /> : null}
    </li>
  );
}

/**
 * "Past sessions" popover for the global nav.
 *
 * History lives behind Supabase, so an unconfigured backend answers 503 and a
 * foreign/missing session answers 404. Both read as "nothing here", never as a
 * failure — see `describeHistoryError`.
 */
export default function PastSessionsPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatHistorySession[] | null>(null);
  const [problem, setProblem] = useState<HistoryErrorCopy | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async (nextPage: number, append: boolean) => {
    try {
      const payload = await getChatHistory(nextPage, DEFAULT_HISTORY_PAGE_SIZE);
      setProblem(null);
      setHasNext(Boolean(payload.has_next));
      setPage(payload.page || nextPage);
      setSessions((current) =>
        append && current ? [...current, ...(payload.sessions ?? [])] : (payload.sessions ?? []),
      );
    } catch (caught) {
      setProblem(describeHistoryError(caught));
      if (!append) setSessions([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load(1, false);
  }, [open, load, attempt]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function openSession(sessionId: string) {
    setOpen(false);
    router.push(`/chat/${sessionId}`);
  }

  async function loadMore() {
    setLoadingMore(true);
    await load(page + 1, true);
    setLoadingMore(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Past study sessions"
        title="Past study sessions"
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-hover"
      >
        <ClockIcon className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Past study sessions"
          className="absolute right-0 top-[calc(100%+10px)] max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-surface p-2.5 shadow-[var(--shadow-card)]"
        >
          <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
            Past sessions
          </p>

          {sessions === null ? (
            <div role="status" aria-busy="true" aria-label="Loading past sessions" className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-line bg-canvas" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-1 pb-1">
              <p className="text-xs text-muted">
                {problem ? problem.message : "No sessions yet. Your study sessions will be listed here."}
              </p>
              {problem?.retryable ? (
                <button
                  type="button"
                  onClick={() => setAttempt((n) => n + 1)}
                  className={`mt-2 text-[11px] font-semibold text-accent ${FOCUS_RING}`}
                >
                  Try again
                </button>
              ) : null}
            </div>
          ) : (
            <ErrorBoundary
              scope="inline"
              title="Past sessions could not be shown"
              description="Reload the page to try again."
            >
              <ul className="space-y-2">
                {sessions.map((session) => (
                  <SessionRow key={session.session_id} session={session} onOpen={openSession} />
                ))}
              </ul>
              {hasNext ? (
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className={`mt-2 min-h-9 w-full rounded-lg border border-line text-[11px] font-semibold text-ink-2 hover:bg-hover disabled:opacity-60 ${FOCUS_RING}`}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              ) : null}
              {problem ? <p className="mt-2 text-[11px] text-muted">{problem.message}</p> : null}
            </ErrorBoundary>
          )}
        </div>
      ) : null}
    </div>
  );
}
