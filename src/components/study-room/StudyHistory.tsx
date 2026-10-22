"use client";

import Link from "next/link";
import { studyHref } from "@/lib/routes";
import { useEffect, useRef, useState } from "react";
import { fetchStudyHistory, type StudySession } from "@/lib/api/study";

function when(iso: string): string {
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return then.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return then.toLocaleDateString([], { weekday: "short" });
  return then.toLocaleDateString([], { day: "numeric", month: "short" });
}

function status(s: StudySession): { text: string; tone: string } {
  if (s.outcome === "mastered") return { text: "Mastered", tone: "text-success" };
  if (s.outcome === "needs_review") return { text: "Needs review", tone: "text-ink-2" };
  const phase = { learn: "Learn", examples: "Examples", practice: "Practice" }[s.current_phase as string] ?? "Done";
  return { text: `In progress · ${phase}`, tone: "text-ink-2" };
}

/**
 * Every study session, newest first, each opening with its full conversation.
 * Starting a fresh session no longer hides the old one — it is one click away.
 */
export default function StudyHistory({
  open,
  onClose,
  currentId,
}: {
  open: boolean;
  onClose: () => void;
  currentId?: string | null;
}) {
  const [sessions, setSessions] = useState<StudySession[] | null>(null);
  const [failed, setFailed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Held in a ref so a parent passing an inline arrow does not re-run the fetch
  // (and steal focus) on every render while the panel is open.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    fetchStudyHistory()
      .then((rows) => {
        if (!live) return;
        // Sessions opened but never started carry nothing worth reopening.
        setSessions(rows.filter((s) => s.study_session_id === currentId || (s.message_count ?? 1) > 0));
        setFailed(false);
      })
      .catch(() => live && setFailed(true));
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      live = false;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, currentId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="study-history-title">
      <button type="button" aria-label="Close history" className="absolute inset-0 cursor-default bg-ink/20" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-sm flex-col border-l border-line bg-canvas">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="study-history-title" className="font-display text-lg font-semibold text-ink">
            Study history
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-muted hover:bg-hover hover:text-ink"
          >
            Close
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {failed ? (
            <p className="px-2 py-6 text-center text-sm text-muted">Could not load your history.</p>
          ) : sessions === null ? (
            <p className="px-2 py-6 text-center text-sm text-muted">Loading…</p>
          ) : sessions.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted">No study sessions yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {sessions.map((s) => {
                const st = status(s);
                const current = s.study_session_id === currentId;
                return (
                  <li key={s.study_session_id}>
                    <Link
                      href={studyHref(s.concept_id, { session: s.study_session_id })}
                      onClick={onClose}
                      aria-current={current ? "page" : undefined}
                      className={`block rounded-xl px-3 py-2.5 transition-colors ${
                        current ? "bg-accent-soft" : "hover:bg-hover"
                      }`}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-ink">{s.concept_name || s.concept_id}</span>
                        <span className="shrink-0 text-[11px] text-muted">{when(s.started_at)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs">
                        <span className={st.tone}>{st.text}</span>
                        {s.questions_served > 0 && (
                          <span className="text-muted">
                            · {s.questions_correct}/{s.questions_served} correct
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
