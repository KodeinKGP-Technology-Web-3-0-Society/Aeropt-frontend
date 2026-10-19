"use client";

import { useId, useState } from "react";
import type { StudyActivity } from "@/components/study-room/useStudySession";

/**
 * Interactive Activity & Grounding Trail:
 * Shows the live thinking, tool progression, and retrieved syllabus material
 * that the tutor used to formulate the reply.
 */
export default function ActivityTrail({
  activity,
  waiting,
}: {
  activity: StudyActivity[];
  /** True while the reply has produced nothing yet, so there is always a line to read. */
  waiting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [showMaterial, setShowMaterial] = useState(false);
  const listId = useId();

  const list = Array.isArray(activity) ? activity : [];

  // Active steps
  const running = list.find((a) => a.state === "running");
  const busy = Boolean(running);

  // All meaningful steps (tools and stages)
  const steps = list.filter((a) => a.name !== "context");
  const retrievedItem = list.find(
    (a) => a.material && Array.isArray(a.material.snippets) && a.material.snippets.length > 0,
  );
  const material = retrievedItem?.material;

  if (steps.length === 0 && !waiting) return null;

  const currentThought = running?.thought || steps[steps.length - 1]?.thought;

  const summary = running
    ? running.thought
      ? `${running.label} — ${running.thought}`
      : `${running.label}…`
    : steps.length === 0
      ? "Thinking…"
      : busy
        ? "Formulating reply…"
        : `Tutor reasoning & grounding · ${steps.length} step${steps.length === 1 ? "" : "s"}${
            material?.title ? ` · 📚 ${material.title}` : ""
          }`;

  return (
    <div className="mb-3 rounded-xl border border-line/70 bg-surface/50 p-2.5 text-xs text-muted transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={listId}
          disabled={steps.length === 0}
          className="flex min-h-6 flex-1 cursor-pointer items-center gap-2 rounded-md text-left transition-colors hover:text-ink disabled:cursor-default disabled:hover:text-muted"
        >
          {busy || steps.length === 0 ? (
            <span
              className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-[1.5px] border-line border-t-ink motion-reduce:animate-none"
              aria-hidden
            />
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-ink-2"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-ink-2" aria-live="polite">
              {summary}
            </span>
            {busy && currentThought && !running?.thought && (
              <span className="italic text-muted line-clamp-1">({currentThought})</span>
            )}
          </div>

          {steps.length > 0 && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`ml-auto shrink-0 text-muted transition-transform motion-reduce:transition-none ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </button>

        {material && !open && (
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setShowMaterial(true);
            }}
            className="flex items-center gap-1 rounded-md border border-line bg-hover px-2 py-0.5 text-[11px] font-medium text-ink-2 hover:text-ink transition-colors"
          >
            <span>📚 Course Material</span>
          </button>
        )}
      </div>

      {open && steps.length > 0 && (
        <div id={listId} className="mt-2.5 border-t border-line/60 pt-2.5 flex flex-col gap-2.5">
          <ul className="flex flex-col gap-2">
            {steps.map((a, idx) => (
              <li key={`${a.name}-${idx}`} className="flex flex-col gap-1 rounded-lg bg-surface/40 p-2 text-ink-2">
                <div className="flex items-center gap-2 font-medium text-xs">
                  {a.state === "running" ? (
                    <span
                      className="h-3 w-3 shrink-0 animate-spin rounded-full border-[1.5px] border-line border-t-ink motion-reduce:animate-none"
                      aria-hidden
                    />
                  ) : a.state === "error" ? (
                    <span
                      className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-warning/20 text-[10px] font-bold text-warning"
                      aria-hidden
                    >
                      !
                    </span>
                  ) : (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-ink-2"
                      aria-hidden
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                  <span>
                    {a.label}
                    {a.count > 1 ? <span className="text-muted"> ×{a.count}</span> : null}
                  </span>
                </div>

                {a.thought && (
                  <p className="ml-5 text-[11px] italic text-muted leading-relaxed">
                    💭 {a.thought}
                  </p>
                )}

                {/* Retrieved material card for retrieve_content step */}
                {a.material && Array.isArray(a.material.snippets) && a.material.snippets.length > 0 && (
                  <div className="ml-5 mt-1.5 rounded-lg border border-line bg-canvas p-2.5 text-ink-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-line">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">📖</span>
                        <span className="font-semibold text-xs text-ink">
                          {a.material.title || "Retrieved Course Material"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMaterial((v) => !v)}
                        className="text-[10px] text-ink-2 font-medium hover:underline cursor-pointer"
                      >
                        {showMaterial ? "Hide excerpts" : `View ${a.material.snippets.length} excerpt(s)`}
                      </button>
                    </div>

                    {Array.isArray(a.material.sources) && a.material.sources.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {a.material.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-block rounded bg-surface/80 px-1.5 py-0.5 text-[10px] text-muted border border-line"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}

                    {showMaterial && Array.isArray(a.material.snippets) && (
                      <div className="mt-2 flex flex-col gap-2">
                        {a.material.snippets.map((snip, sIdx) => (
                          <div
                            key={sIdx}
                            className="rounded border-l-2 border-line-strong bg-surface/60 p-2 text-[11px] text-ink leading-relaxed"
                          >
                            {snip.title && (
                              <p className="font-semibold text-[10px] uppercase text-ink-2 mb-1 tracking-wider">
                                {snip.title}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap">{snip.text || ""}</p>
                            {snip.cite && (
                              <p className="mt-1 text-[9px] text-muted text-right italic">— {snip.cite}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
