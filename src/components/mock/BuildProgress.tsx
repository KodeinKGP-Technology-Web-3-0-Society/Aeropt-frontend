"use client";

import { useEffect, useRef, useState } from "react";
import { fetchMockStatus, mockUserId, type MockBuildStatus } from "@/lib/api/mockTest";

const POLL_MS = 1000;
const MAX_POLL_MS = 5000;
const GIVE_UP_AFTER_MS = 3 * 60 * 1000;
const MAX_CONSECUTIVE_ERRORS = 8;

const SUBJECT_BAR: Record<string, string> = {
  Physics: "bg-physics",
  Chemistry: "bg-chemistry",
  Mathematics: "bg-maths",
};

function Bar({ value, total, tone = "bg-accent", label }: { value: number; total: number; tone?: string; label: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total || 100}
      aria-valuenow={Math.min(value, total || 100)}
      className="h-2 w-full overflow-hidden rounded-full bg-hover"
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * Live view of a test being assembled. Polls /mock/status, calls `onBuilt` once the
 * paper is ready, and turns every dead end (failure, timeout, lost connection) into
 * a message with a way out.
 */
export default function BuildProgress({
  mockTestId,
  requestedTotal,
  onBuilt,
  onCancel,
  onRetry,
}: {
  mockTestId: string;
  requestedTotal: number;
  onBuilt: (id: string) => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const [status, setStatus] = useState<MockBuildStatus | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const finished = useRef(false);
  const builtCb = useRef(onBuilt);
  useEffect(() => {
    builtCb.current = onBuilt;
  });

  useEffect(() => {
    finished.current = false;
    const startedAt = Date.now();
    const userId = mockUserId();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let errors = 0;
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
        finished.current = true;
        setProblem("This is taking longer than expected. The test may still finish in the background; check Your mock tests below in a minute, or try again.");
        return;
      }
      let delay = POLL_MS;
      try {
        const s = await fetchMockStatus(mockTestId, userId);
        if (stopped) return;
        errors = 0;
        setStatus(s);
        if (s.status === "failed") {
          finished.current = true;
          return;
        }
        if (s.status !== "building") {
          // built, or already started/submitted in another tab: either way the paper exists.
          finished.current = true;
          builtCb.current(mockTestId);
          return;
        }
      } catch (e) {
        if (stopped) return;
        errors += 1;
        delay = Math.min(MAX_POLL_MS, POLL_MS * 2 ** errors);
        if (errors >= MAX_CONSECUTIVE_ERRORS) {
          finished.current = true;
          setProblem(e instanceof Error ? `Lost contact with the server: ${e.message}` : "Lost contact with the server.");
          return;
        }
      }
      timer = setTimeout(tick, delay);
    };
    tick();

    const clock = setInterval(() => {
      if (!finished.current) setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      clearInterval(clock);
    };
  }, [mockTestId]);

  const total = status?.total || requestedTotal;
  const prepared = status?.prepared ?? 0;
  const failed = status?.status === "failed";
  const stage = status?.stage || "Starting";

  if (failed || problem) {
    return (
      <section role="alert" className="rounded-2xl border border-danger/20 bg-danger/5 p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold text-ink">
          {failed ? "The test could not be built" : "Still waiting"}
        </h2>
        <p className="mt-1 text-[15px] leading-6 text-danger">
          {failed ? status?.error || "Something went wrong while picking questions." : problem}
        </p>
        {failed && status && status.shortfall.length > 0 && (
          <ul className="mt-3 space-y-1 text-[14px] text-ink">
            {status.shortfall.map((s) => (
              <li key={s.subject}>
                {s.subject}: asked for {s.requested}, found {s.got}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={onRetry} className="min-h-10 rounded-xl bg-ink px-5 text-[14px] font-semibold text-ink-on hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Try again
          </button>
          <button type="button" onClick={onCancel} className="min-h-10 rounded-xl border border-line bg-surface px-5 text-[14px] font-medium text-ink hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            Back to setup
          </button>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Building your test" className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">Building your test</h2>
        <span className="text-[13px] tabular-nums text-muted">{elapsed}s</span>
      </div>
      <p aria-live="polite" className="mt-1 text-[14px] text-muted">
        {stage}…
      </p>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-[13px]">
          <span className="font-medium text-ink">Questions ready</span>
          <span className="tabular-nums text-muted">
            {prepared} / {total}
          </span>
        </div>
        <Bar value={prepared} total={total} label="Questions prepared" />
      </div>

      {status && status.by_subject.length > 0 && (
        <ul className="mt-4 space-y-3">
          {status.by_subject.map((s) => (
            <li key={s.subject}>
              <div className="mb-1 flex justify-between text-[13px]">
                <span className="text-ink">{s.subject}</span>
                <span className="tabular-nums text-muted">
                  {s.prepared} / {s.total}
                </span>
              </div>
              <Bar value={s.prepared} total={s.total} tone={SUBJECT_BAR[s.subject] ?? "bg-accent"} label={`${s.subject} questions prepared`} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        <button type="button" onClick={onCancel} className="min-h-10 rounded-xl border border-line bg-canvas px-4 text-[14px] font-medium text-ink hover:bg-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          Cancel
        </button>
      </div>
    </section>
  );
}
