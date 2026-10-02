"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import StudySidebar from "@/components/study/StudySidebar";
import MarkdownMath from "@/components/MarkdownMath";
import {
  buildClassroomAssess,
  gradeClassroomAssess,
  type AssessGradeResponse,
  type AssessItem,
} from "@/lib/api/agent";
import { ApiError, getSupabaseUserId } from "@/lib/api/auth";
import { ensureClassroomAgentSession } from "@/lib/api/classroom";
import { invalidateCache } from "@/lib/api/apiCache";
import Link from "next/link";

function itemPrompt(item: AssessItem): string {
  return (
    item.prompt?.trim() ||
    item.question?.trim() ||
    item.text?.trim() ||
    item.item_id
  );
}

function AssessRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conceptId = (searchParams.get("concept") || "").trim();

  const [items, setItems] = useState<AssessItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState<AssessGradeResponse | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!conceptId) {
        if (!cancelled) {
          setError("Choose a concept from your study queue to start an assessment.");
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setLoading(true);
        setError("");
        setResult(null);
        setSubmitError("");
      }

      try {
        const session = await ensureClassroomAgentSession({
          surface: "assess",
          concept_id: conceptId,
        });
        const built = await buildClassroomAssess(conceptId);
        if (cancelled) return;
        setSessionId(session.agent_session_id || "");
        setItems(built.items);
        setAnswers({});
      } catch (caught) {
        if (cancelled) return;
        const message =
          caught instanceof ApiError
            ? caught.message
            : caught instanceof Error
              ? caught.message
              : "Could not build this assessment.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [conceptId, retryToken]);

  function setAnswer(itemId: string, value: string) {
    setAnswers((current) => ({ ...current, [itemId]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!conceptId || submitting || items.length === 0) return;

    const payload = items.map((item) => ({
      item_id: item.item_id,
      answer: (answers[item.item_id] || "").trim(),
    }));

    if (payload.some((row) => !row.answer)) {
      setSubmitError("Please provide an answer for every question.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const graded = await gradeClassroomAssess({
        conceptId,
        answers: payload,
        userId: getSupabaseUserId(),
        sessionId,
      });
      setResult(graded);
      invalidateCache("classroom");
    } catch (caught) {
      setSubmitError(
        caught instanceof Error ? caught.message : "Could not grade this assessment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-10 pt-24 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg className="absolute inset-0 h-full w-full animate-[spin_3s_linear_infinite] text-hover" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="141.37" />
            </svg>
            <svg className="absolute inset-0 h-full w-full animate-[spin_2s_linear_infinite] text-accent" viewBox="0 0 100 100" style={{ animationDirection: "reverse" }}>
              <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="109.95" strokeDashoffset="55" />
            </svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink">
              <path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-ink">AI Agent Preparing Assessment</h2>
            <p className="mt-1 text-sm text-muted">Analyzing your past performance to generate optimal questions...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 overflow-y-auto px-6 pb-10 pt-24 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-line bg-surface p-10 text-center shadow-sm">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-4 text-danger">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3 className="mb-2 font-display text-lg font-bold text-ink">Failed to build assessment</h3>
            <p className="mb-6 text-sm text-muted">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={() => router.push("/home")} className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink hover:bg-hover transition-colors">
                Back to Dashboard
              </button>
              {conceptId && (
                <button type="button" onClick={() => setRetryToken((n) => n + 1)} className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-surface hover:bg-ink/90 transition-colors">
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="flex-1 overflow-y-auto px-6 pb-10 pt-24 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-center text-sm text-muted">No items available for this concept yet. <Link href="/home" className="text-accent hover:underline">Go back.</Link></p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-16 pt-24 lg:px-8 lg:pb-24">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center sm:text-left">
          <Link href="/home" className="mb-6 inline-flex items-center gap-2 text-[11px] font-bold tracking-widest text-muted hover:text-ink transition-colors uppercase">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Exit Assessment
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Concept Check
          </h1>
          <p className="mt-2 text-sm text-muted max-w-xl mx-auto sm:mx-0">
            Carefully work through each problem. The AI evaluates both your final answer and your conceptual approach.
          </p>
        </header>

        {result ? (
          <div className="mb-10 rounded-2xl border-2 border-accent/20 bg-accent/5 p-8 text-center animate-in fade-in slide-in-from-bottom-4">
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Assessment Complete</h2>
            <p className="text-sm text-muted mb-8">The AI has evaluated your answers and updated your master profile.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-line">
              <div className="flex flex-col items-center justify-center pt-4 sm:pt-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">New Mastery</span>
                <span className="font-display text-5xl font-bold text-accent tabular-nums">{result.mastery ?? "—"}%</span>
              </div>
              <div className="flex flex-col items-center justify-center pt-6 sm:pt-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">Accuracy</span>
                <span className="font-display text-3xl font-bold text-ink tabular-nums">{result.correct ?? "—"} / {items.length}</span>
              </div>
              <div className="flex flex-col items-center justify-center pt-6 sm:pt-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">Total Attempts</span>
                <span className="font-display text-3xl font-bold text-ink tabular-nums">{result.attempts ?? "—"}</span>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/home" className="rounded-lg bg-ink px-8 py-3 text-sm font-bold text-surface hover:bg-ink/90 transition-colors">
                Return to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              {items.map((item, index) => {
                const value = answers[item.item_id] ?? "";
                return (
                  <div key={item.item_id} className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-sm transition-all focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-surface">
                        {index + 1}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
                        Question
                      </span>
                    </div>
                    
                    <div className="prose prose-sm prose-slate max-w-none text-ink">
                      <MarkdownMath content={itemPrompt(item)} />
                    </div>
                    
                    <div className="mt-8">
                      <label htmlFor={`item-${item.item_id}`} className="block text-[11px] font-bold uppercase tracking-widest text-muted mb-2">
                        Your Answer
                      </label>
                      <textarea
                        id={`item-${item.item_id}`}
                        value={value}
                        onChange={(change) => setAnswer(item.item_id, change.target.value)}
                        disabled={submitting}
                        placeholder="Type your final answer and any relevant working steps here..."
                        className="min-h-[100px] w-full resize-y rounded-xl border border-line bg-canvas p-4 text-sm font-medium text-ink placeholder:text-muted/50 outline-none transition-colors focus:border-accent disabled:opacity-50"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {submitError && (
              <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-center">
                <p className="text-sm font-medium text-danger">{submitError}</p>
              </div>
            )}

            <div className="sticky bottom-6 z-10 mx-auto w-full max-w-md rounded-2xl border border-line bg-surface/80 p-4 backdrop-blur-md shadow-[var(--shadow-card)]">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-sm font-bold text-surface transition-all hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    AI Grading in Progress...
                  </>
                ) : (
                  <>
                    Submit for AI Evaluation
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default function AssessPage() {
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
          <AssessRoom />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
