"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
          setError("Choose a concept from home to start an assessment.");
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
      setSubmitError("Write an answer for every item before submitting.");
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

  return (
    <main className="flex-1 overflow-y-auto px-6 pb-10 pt-[6.75rem] lg:px-8 lg:pb-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">Assess</p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Concept sitting
          </h1>
        </header>

        {loading ? (
          <p className="text-sm text-muted" role="status">
            Building assessment…
          </p>
        ) : error ? (
          <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-[var(--shadow-card)]">
            <p className="mb-4 text-sm text-danger">{error}</p>
            {conceptId ? (
              <button
                type="button"
                onClick={() => setRetryToken((n) => n + 1)}
                className="cursor-pointer rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-on hover:bg-accent-hover"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">No items for this concept yet.</p>
        ) : (
          <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-6">
            <ul className="flex flex-col gap-4">
              {items.map((item, index) => {
                const value = answers[item.item_id] ?? "";
                return (
                  <li
                    key={item.item_id}
                    className="rounded-2xl border border-line bg-surface px-5 py-4 shadow-[var(--shadow-card)]"
                  >
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Item {index + 1}
                    </p>
                    <MarkdownMath content={itemPrompt(item)} />
                    <label className="mt-4 block text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Your answer
                      <input
                        value={value}
                        onChange={(change) => setAnswer(item.item_id, change.target.value)}
                        disabled={submitting || result != null}
                        className="mt-2 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-accent"
                      />
                    </label>
                  </li>
                );
              })}
            </ul>

            {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

            {result == null ? (
              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer rounded-full bg-accent px-4 py-2.5 text-xs font-semibold text-accent-on transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Grading…" : "Submit"}
                </button>
              </div>
            ) : (
              <section className="border-t border-line pt-6" aria-live="polite">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
                  Result
                </h2>
                <dl className="grid grid-cols-3 gap-4">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Mastery
                    </dt>
                    <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">
                      {result.mastery ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Correct
                    </dt>
                    <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">
                      {result.correct ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Attempts
                    </dt>
                    <dd className="mt-1 font-display text-2xl font-semibold tabular-nums text-ink">
                      {result.attempts ?? "—"}
                    </dd>
                  </div>
                </dl>
              </section>
            )}
          </form>
        )}
      </div>
    </main>
  );
}

export default function AssessPage() {
  return (
    <AuthGuard>
      <div className="h-dvh overflow-y-auto bg-transparent text-ink">
        <StudySidebar />
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center px-6 pb-6 pt-[6.75rem]">
              <p className="text-sm text-muted">Building assessment…</p>
            </div>
          }
        >
          <AssessRoom />
        </Suspense>
      </div>
    </AuthGuard>
  );
}
