import type { StudyPhase, StudyState } from "@/lib/api/study";

const TITLES: Partial<Record<StudyPhase, string>> = { learn: "Lesson", examples: "Worked examples" };

/**
 * The teacher's outline for the current phase, ticked off as parts complete.
 * `compact` is the one-line form used above the composer on small screens.
 */
export default function LessonOutline({ study, compact = false }: { study: StudyState; compact?: boolean }) {
  const phase = study.current_phase;
  const parts = study.lesson_plan?.[phase] ?? [];
  if (!(phase in TITLES) || parts.length === 0) return null;
  const step = Math.min(study.phase_step ?? 0, parts.length);
  const current = Math.min(step, parts.length - 1);

  if (compact) {
    return (
      <p className="truncate text-xs text-muted">
        <span className="font-semibold text-ink-2">
          {TITLES[phase]} · part {current + 1} of {parts.length}
        </span>
        : {parts[current]}
      </p>
    );
  }

  return (
    <nav aria-label={`${TITLES[phase]} outline`} className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{TITLES[phase]}</p>
      <ol className="mt-3 flex flex-col gap-2.5">
        {parts.map((title, i) => {
          const done = i < step;
          const active = i === current && !done;
          return (
            <li key={`${i}-${title}`} className="flex items-start gap-2.5" aria-current={active ? "step" : undefined}>
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-success/15 text-success"
                    : active
                      ? "bg-accent text-accent-on"
                      : "border border-line text-muted"
                }`}
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={`text-sm leading-snug ${active ? "font-semibold text-ink" : done ? "text-ink-2" : "text-muted"}`}>
                {title}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
