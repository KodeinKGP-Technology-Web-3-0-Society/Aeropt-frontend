"use client";

import { useMemo, useState } from "react";
import type { ProgressDay } from "@/lib/api/progress";

type Measure = "attempts" | "minutes";

const MEASURES: { key: Measure; label: string }[] = [
  { key: "attempts", label: "Questions" },
  { key: "minutes", label: "Minutes" },
];

/** Round the axis top up to a clean number so ticks read 0 / 5 / 10, not 0 / 3.5 / 7. */
function niceMax(v: number): number {
  if (v <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * step >= v) return m * step;
  return 10 * step;
}

function dayLabel(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString([], opts);
}

/**
 * Daily activity, one column per day. Single series in the accent hue (no legend:
 * the toggle names the measure). Each column is its own hover/focus target with
 * a tooltip; the same numbers are in the table under "Show as table".
 */
export default function ActivityChart({ days }: { days: ProgressDay[] }) {
  const [measure, setMeasure] = useState<Measure>("attempts");
  const [active, setActive] = useState<number | null>(null);

  const values = days.map((d) => d[measure]);
  const top = niceMax(Math.max(0, ...values));
  const total = values.reduce((a, b) => a + b, 0);
  const activeDays = values.filter((v) => v > 0).length;
  const summary = useMemo(
    () =>
      measure === "attempts"
        ? `${total} question${total === 1 ? "" : "s"} over ${activeDays} active day${activeDays === 1 ? "" : "s"}`
        : `${total} minute${total === 1 ? "" : "s"} over ${activeDays} active day${activeDays === 1 ? "" : "s"}`,
    [measure, total, activeDays],
  );

  const hovered = active != null ? days[active] : null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="activity-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="activity-title" className="text-sm font-semibold text-ink">
            Last {days.length} days
          </h2>
          <p className="mt-0.5 text-xs text-muted">{summary}</p>
        </div>
        <div className="flex rounded-lg border border-line p-0.5" role="group" aria-label="Measure">
          {MEASURES.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={measure === m.key}
              onClick={() => setMeasure(m.key)}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                measure === m.key ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-5 flex gap-2">
        {/* y-axis: 0 and the clean top, enough to read magnitude without clutter */}
        <div className="flex h-36 w-6 shrink-0 flex-col justify-between text-right text-[10px] tabular-nums text-muted" aria-hidden>
          <span>{top}</span>
          <span>{top / 2}</span>
          <span>0</span>
        </div>
        <div className="relative h-36 flex-1">
          {[0, 0.5, 1].map((f) => (
            <div key={f} className="absolute inset-x-0 h-px bg-line" style={{ bottom: `${f * 100}%` }} aria-hidden />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]" role="list" aria-label={`Daily ${measure === "attempts" ? "questions" : "minutes"}`}>
            {days.map((d, i) => {
              const v = d[measure];
              const pct = top ? (v / top) * 100 : 0;
              const label =
                measure === "attempts"
                  ? `${dayLabel(d.date, { weekday: "short", day: "numeric", month: "short" })}: ${v} question${v === 1 ? "" : "s"}${v ? `, ${d.correct} correct` : ""}`
                  : `${dayLabel(d.date, { weekday: "short", day: "numeric", month: "short" })}: ${v} minute${v === 1 ? "" : "s"}`;
              return (
                <button
                  key={d.date}
                  type="button"
                  role="listitem"
                  aria-label={label}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive((a) => (a === i ? null : a))}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive((a) => (a === i ? null : a))}
                  className="group flex h-full flex-1 cursor-default items-end justify-center focus-visible:outline-none"
                >
                  <span
                    className={`block w-full max-w-6 rounded-t-[4px] transition-opacity ${
                      v > 0 ? "bg-accent" : ""
                    } ${active != null && active !== i ? "opacity-55" : ""} group-focus-visible:ring-2 group-focus-visible:ring-accent group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-surface`}
                    style={{ height: v > 0 ? `max(${pct}%, 3px)` : 0 }}
                  />
                </button>
              );
            })}
          </div>

          {hovered && active != null && (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow-card)]"
              style={{ left: `${((active + 0.5) / days.length) * 100}%` }}
              role="presentation"
            >
              <p className="font-semibold tabular-nums text-ink">
                {measure === "attempts" ? `${hovered.attempts} question${hovered.attempts === 1 ? "" : "s"}` : `${hovered.minutes} min`}
              </p>
              {measure === "attempts" && hovered.attempts > 0 && (
                <p className="tabular-nums text-ink-2">
                  {hovered.correct} correct · {Math.round((hovered.correct / hovered.attempts) * 100)}%
                </p>
              )}
              {hovered.turns > 0 && <p className="text-ink-2">{hovered.turns} message{hovered.turns === 1 ? "" : "s"} to the tutor</p>}
              <p className="text-muted">{dayLabel(hovered.date, { weekday: "short", day: "numeric", month: "short" })}</p>
            </div>
          )}
        </div>
      </div>
      <div className="ml-8 mt-1.5 flex justify-between text-[10px] text-muted" aria-hidden>
        <span>{dayLabel(days[0]?.date ?? "", { day: "numeric", month: "short" })}</span>
        <span>Today</span>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted hover:text-ink">Show as table</summary>
        <div className="mt-2 max-h-56 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted">
              <tr>
                <th className="py-1 font-medium">Day</th>
                <th className="py-1 text-right font-medium">Questions</th>
                <th className="py-1 text-right font-medium">Correct</th>
                <th className="py-1 text-right font-medium">Minutes</th>
              </tr>
            </thead>
            <tbody className="tabular-nums text-ink-2">
              {[...days].reverse().filter((d) => d.attempts || d.minutes).map((d) => (
                <tr key={d.date} className="border-t border-line">
                  <td className="py-1">{dayLabel(d.date, { weekday: "short", day: "numeric", month: "short" })}</td>
                  <td className="py-1 text-right">{d.attempts}</td>
                  <td className="py-1 text-right">{d.correct}</td>
                  <td className="py-1 text-right">{d.minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
