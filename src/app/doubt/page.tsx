"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import MarkdownMath from "@/components/MarkdownMath";
import { sendChatMessage } from "@/lib/api/agent";
import { getSupabaseUserId, ApiError } from "@/lib/api/auth";
import { ensureClassroomAgentSession } from "@/lib/api/classroom";

function DoubtRoom() {
  const searchParams = useSearchParams();
  const conceptId = (searchParams.get("concept") || "").trim();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bindError, setBindError] = useState("");
  const [question, setQuestion] = useState("");
  const [working, setWorking] = useState("");
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!cancelled) setBindError("");
      try {
        const session = await ensureClassroomAgentSession({
          surface: "doubt",
          concept_id: conceptId,
        });
        const id = (session.agent_session_id || "").trim();
        if (!id) throw new Error("Could not bind a doubt session.");
        if (!cancelled) setSessionId(id);
      } catch (caught) {
        if (cancelled) return;
        const message =
          caught instanceof ApiError
            ? caught.message
            : caught instanceof Error
              ? caught.message
              : "Could not open doubt.";
        setBindError(message);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [conceptId, retryToken]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || !sessionId || submitting) return;

    const userId = getSupabaseUserId();
    if (!userId) {
      setSubmitError("Sign in to ask a doubt.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    setReply("");
    try {
      const result = await sendChatMessage({
        userId,
        sessionId,
        query: trimmed,
        surface: "doubt",
        roadmapConceptId: conceptId || null,
        studentWork: working.trim() || null,
      });
      setReply(result.response?.trim() || "I could not generate a response.");
    } catch (caught) {
      setSubmitError(
        caught instanceof Error ? caught.message : "Could not send your doubt.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-10 pt-[6.75rem] lg:px-8 lg:pb-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Doubt</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Ask one stuck question
          </h1>
          <p className="mt-2 text-sm text-muted">
            One question, one reply in this room — no separate chat thread.
          </p>
        </header>

        {bindError ? (
          <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-[var(--shadow-card)]">
            <p className="mb-4 text-sm text-danger">{bindError}</p>
            <button
              type="button"
              onClick={() => setRetryToken((n) => n + 1)}
              className="cursor-pointer rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-on hover:bg-accent-hover"
            >
              Retry
            </button>
          </div>
        ) : !sessionId ? (
          <p className="text-sm text-muted" role="status">
            Opening doubt…
          </p>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Your question
              </span>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={5}
                disabled={submitting}
                placeholder="Where are you stuck?"
                className="w-full resize-y rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-60"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Your working, one step per line
              </span>
              <textarea
                value={working}
                onChange={(e) => setWorking(e.target.value)}
                rows={4}
                disabled={submitting}
                placeholder={"F = ma\na = F/m"}
                className="w-full resize-y rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent disabled:opacity-60"
              />
            </label>
            {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}
            <div>
              <button
                type="submit"
                disabled={submitting || !question.trim()}
                className="cursor-pointer rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Working…" : "Ask"}
              </button>
            </div>
          </form>
        )}

        {reply ? (
          <section className="border-t border-line pt-6" aria-live="polite">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Reply</h2>
            <div className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-[var(--shadow-card)]">
              <MarkdownMath content={reply} />
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default function DoubtPage() {
  return (
    <AuthGuard>
      <div className="h-dvh overflow-y-auto bg-transparent text-ink">
        <StudySidebar />
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center px-6 pb-6 pt-[6.75rem]">
              <p className="text-sm text-muted">Opening doubt…</p>
            </div>
          }
        >
          <DoubtRoom />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
