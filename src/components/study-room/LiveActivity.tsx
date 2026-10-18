import type { StudyActivity } from "./useStudySession";

/**
 * What the tutor is doing right now, from the agent's status stream: each tool
 * appears as it starts and gets a tick when it finishes. Replaces the "…" that
 * sat there for 20-40 s with no explanation.
 */
export default function LiveActivity({
  activity,
  elapsed,
  fallback,
  stopping = false,
  onStop,
}: {
  activity: StudyActivity[];
  elapsed: number;
  fallback: string;
  stopping?: boolean;
  onStop?: () => void;
}) {
  // "Thinking" is the backdrop the tools run inside; show it only while nothing
  // more specific is happening, and never as a finished step.
  const list = Array.isArray(activity) ? activity : [];
  const steps = list.filter((a) => a.name !== "thinking" && a.name !== "context");
  const running = steps.find((a) => a.state === "running") ?? list.find((a) => a.state === "running");
  const headline = running
    ? running.thought
      ? `${running.label} (${running.thought})`
      : running.label
    : (steps.length ? "Writing the reply" : fallback);

  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3" role="status" aria-live="polite">
      <div className="flex items-center gap-2.5 text-sm font-medium text-ink">
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
        </span>
        <span>{stopping ? "Stopping" : headline}…</span>
        <span className="ml-auto flex items-center gap-3">
          {elapsed >= 8 && <span className="text-xs tabular-nums text-muted">{elapsed}s</span>}
          {onStop && (
            <button
              type="button"
              onClick={onStop}
              disabled={stopping}
              className="cursor-pointer rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-2 transition-colors hover:border-danger/50 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
            >
              {stopping ? "Stopping…" : "Stop"}
            </button>
          )}
        </span>
      </div>
      {steps.length > 0 && (
        <ol className="mt-2.5 flex flex-col gap-1.5 border-t border-line pt-2.5">
          {steps.map((a) => (
            <li key={a.name} className="flex items-center gap-2 text-xs text-ink-2">
              {a.state === "running" ? (
                <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-line border-t-accent motion-reduce:animate-none" aria-hidden />
              ) : a.state === "error" ? (
                <span className="flex h-3 w-3 items-center justify-center text-[10px] font-bold text-warning" aria-hidden>
                  !
                </span>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-success" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              <div className="flex flex-col">
                <span className={a.state === "running" ? "text-ink font-medium" : ""}>
                  {a.label}
                  {a.count > 1 ? <span className="text-muted"> ×{a.count}</span> : null}
                </span>
                {a.thought && (
                  <span className="text-[11px] italic text-muted">💭 {a.thought}</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
