"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchMockHistory, mockUserId, type MockHistoryItem } from "@/lib/api/mockTest";

const PAGE = 10;

function when(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function examLabel(e: string): string {
  return e === "JEE_ADVANCED" ? "JEE Advanced" : e === "JEE_MAIN" ? "JEE Main" : e.replace(/_/g, " ");
}

const STATUS_TEXT: Record<string, string> = {
  building: "Preparing",
  built: "Not started",
  failed: "Build failed",
  in_progress: "In progress",
  submitted: "Grading",
  graded: "Completed",
};

const linkBtn =
  "inline-flex min-h-9 items-center rounded-lg px-3.5 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

function Row({ t }: { t: MockHistoryItem }) {
  const id = encodeURIComponent(t.mock_test_id);
  const graded = t.status === "graded";
  const done = graded || t.status === "submitted";
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-ink">
          {examLabel(t.exam)}
          <span className="ml-2 text-[13px] font-normal text-muted">{when(t.submitted_at || t.started_at || t.created_at)}</span>
        </p>
        <p className="mt-0.5 text-[13px] text-muted">
          {t.subjects.join(", ") || "Mixed"} · {t.total_questions} questions · {STATUS_TEXT[t.status] ?? t.status}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {graded && t.score != null && t.max_score != null && (
          <div className="text-right">
            <p className="text-[16px] font-semibold tabular-nums text-ink">
              {t.score} / {t.max_score}
            </p>
            {t.accuracy_pct != null && <p className="text-[12px] tabular-nums text-muted">{t.accuracy_pct.toFixed(0)}% accuracy</p>}
          </div>
        )}
        {done ? (
          <Link href={`/mock/result/${id}`} className={`${linkBtn} border border-line bg-canvas text-ink hover:bg-hover`}>
            {graded ? "Review" : "View result"}
          </Link>
        ) : t.status === "in_progress" ? (
          <Link href={`/mock/exam?id=${id}`} className={`${linkBtn} bg-ink text-ink-on hover:opacity-90`}>
            Resume
          </Link>
        ) : t.status === "built" ? (
          <Link href={`/mock/exam?id=${id}`} className={`${linkBtn} bg-ink text-ink-on hover:opacity-90`}>
            Start
          </Link>
        ) : null}
      </div>
    </li>
  );
}

export default function MockHistory() {
  const [tests, setTests] = useState<MockHistoryItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let live = true;
    setError(null);
    fetchMockHistory(mockUserId(), PAGE, 0)
      .then((h) => {
        if (!live) return;
        setTests(h.tests);
        setTotal(h.total);
      })
      .catch((e: unknown) => {
        if (live) setError(e instanceof Error ? e.message : "Could not load your tests");
      });
    return () => {
      live = false;
    };
  }, [reload]);

  async function more() {
    if (!tests) return;
    setLoadingMore(true);
    try {
      const h = await fetchMockHistory(mockUserId(), PAGE, tests.length);
      setTests([...tests, ...h.tests]);
      setTotal(h.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load more");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section aria-label="Your mock tests">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted">Your mock tests</h2>
      {error && !tests ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-5 py-4">
          <p className="text-[14px] text-danger">{error}</p>
          <button type="button" onClick={() => setReload((n) => n + 1)} className="mt-2 text-[14px] font-semibold text-accent hover:underline">
            Try again
          </button>
        </div>
      ) : !tests ? (
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-4">
              <div className="h-4 w-48 animate-pulse rounded bg-hover" />
              <div className="mt-2 h-3 w-72 max-w-full animate-pulse rounded bg-hover" />
            </div>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-5 py-6 text-[14px] text-muted">
          No mock tests yet. Build your first one below and it will show up here with its score.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)]">
            {tests.map((t) => (
              <Row key={t.mock_test_id} t={t} />
            ))}
          </ul>
          {tests.length < total && (
            <button type="button" onClick={more} disabled={loadingMore} className="mt-3 text-[14px] font-semibold text-accent hover:underline disabled:opacity-50">
              {loadingMore ? "Loading…" : `Show more (${total - tests.length})`}
            </button>
          )}
          {error && <p className="mt-2 text-[13px] text-danger">{error}</p>}
        </>
      )}
    </section>
  );
}
