"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import MarkdownMath from "@/components/MarkdownMath";
import { sendChatMessage } from "@/lib/api/agent";
import { getSupabaseUserId, ApiError } from "@/lib/api/auth";
import { ensureClassroomAgentSession } from "@/lib/api/classroom";
import Link from "next/link";
import VoiceDoubtRecorder from "@/components/voice/VoiceDoubtRecorder";
import AudioTutorPlayer from "@/components/voice/AudioTutorPlayer";

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
    <main className="flex-1 overflow-y-auto px-6 pb-16 pt-24 lg:px-8 lg:pb-24">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center sm:text-left">
          <Link href="/home" className="mb-6 inline-flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted hover:text-ink transition-colors uppercase">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Exit Room
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Ask a Doubt
          </h1>
          <p className="mt-2 text-sm text-muted max-w-xl mx-auto sm:mx-0">
            Submit a single, specific question. The AI will evaluate your working and provide a targeted explanation to unblock you.
          </p>
        </header>

        {bindError ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center shadow-sm">
            <p className="mb-6 text-sm font-medium text-danger">{bindError}</p>
            <button
              type="button"
              onClick={() => setRetryToken((n) => n + 1)}
              className="cursor-pointer rounded-xl bg-danger px-6 py-2.5 text-sm font-bold text-surface transition-all hover:bg-danger/90"
            >
              Retry Connection
            </button>
          </div>
        ) : !sessionId ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-accent" />
            <p className="mt-4 text-sm font-medium text-muted">Establishing secure AI connection...</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-sm transition-all focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
              <label className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-surface">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
                      What are you struggling with?
                    </span>
                  </div>
                  <VoiceDoubtRecorder
                    onTranscribed={(transcript) => {
                      setQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
                    }}
                    disabled={submitting || Boolean(reply)}
                  />
                </div>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  disabled={submitting || Boolean(reply)}
                  placeholder="E.g. I don't understand why the normal force isn't always equal to mg..."
                  className="w-full resize-y rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-accent disabled:opacity-50"
                />
              </label>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-sm transition-all focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
              <label className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-surface">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
                    Show your working (Optional)
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  The AI can provide much better help if it knows how you approached the problem.
                </p>
                <textarea
                  value={working}
                  onChange={(e) => setWorking(e.target.value)}
                  rows={4}
                  disabled={submitting || Boolean(reply)}
                  placeholder="Step 1: F_net = ma&#10;Step 2: N - mg = ma&#10;..."
                  className="w-full resize-y rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink font-mono outline-none transition-colors placeholder:text-muted/50 focus:border-accent disabled:opacity-50"
                />
              </label>
            </div>

            {submitError && (
              <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center">
                <p className="text-sm font-medium text-danger">{submitError}</p>
              </div>
            )}

            {!reply && (
              <div className="sticky bottom-6 z-10 mx-auto w-full max-w-md rounded-2xl border border-line bg-surface/80 p-4 backdrop-blur-md shadow-[var(--shadow-card)]">
                <button
                  type="submit"
                  disabled={submitting || !question.trim()}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-bold text-surface transition-all hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                      AI Analyzing Request...
                    </>
                  ) : (
                    <>
                      Submit Question
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        )}

        {reply && (
          <section className="mt-8 animate-in fade-in slide-in-from-bottom-4" aria-live="polite">
            <div className="rounded-2xl border-2 border-accent/20 bg-surface shadow-[var(--shadow-card)] overflow-hidden">
              <div className="border-b border-line bg-accent/5 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                  AI Tutor Response
                </h2>
                <div className="flex items-center gap-3">
                  <AudioTutorPlayer text={reply} compact={true} />
                  <button 
                    onClick={() => { setReply(""); setQuestion(""); setWorking(""); }} 
                    className="cursor-pointer text-[11px] font-bold uppercase tracking-widest text-muted hover:text-ink transition-colors"
                  >
                    Ask Another
                  </button>
                </div>
              </div>
              <div className="px-6 pt-5 sm:px-8">
                <AudioTutorPlayer text={reply} title="Bulbul Audio Tutor" />
              </div>
              <div className="p-6 sm:p-8 prose prose-sm prose-slate max-w-none text-ink">
                <MarkdownMath content={reply} />
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default function DoubtPage() {
  return (
    <AuthGuard>
      <div className="flex h-dvh bg-canvas">
        <StudySidebar />
        <Suspense
          fallback={
            <main className="flex flex-1 flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-accent" />
            </main>
          }
        >
          <DoubtRoom />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
