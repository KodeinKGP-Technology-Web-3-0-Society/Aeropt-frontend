export type StudyStatus = "new" | "progress" | "review" | "mastered";

const PILL: Record<StudyStatus, { label: string }> = {
  new: { label: "Not started" },
  progress: { label: "In progress" },
  review: { label: "Needs review" },
  mastered: { label: "Mastered" },
};

const DOT: Record<StudyStatus, string> = {
  new: "var(--border-button)",
  progress: "var(--warning)",
  review: "var(--danger)",
  mastered: "var(--success)",
};

export function statusFromTone(tone: "danger" | "warning" | "success" | "muted"): StudyStatus {
  if (tone === "danger") return "review";
  if (tone === "warning") return "progress";
  if (tone === "success") return "mastered";
  return "new";
}

export function subjectVar(subject: string | null | undefined): string {
  if (subject === "Physics") return "var(--physics)";
  if (subject === "Chemistry") return "var(--chemistry)";
  if (subject === "Mathematics" || subject === "Maths") return "var(--maths)";
  return "var(--text-muted)";
}

export function subjectInk(subject: string | null | undefined): string {
  return subjectVar(subject === "Syllabus" ? null : subject);
}

export function StatusPill({
  status,
  label,
}: {
  status: StudyStatus;
  label?: string;
}) {
  const meta = PILL[status];
  return (
    <span className="inline-flex min-h-6 items-center gap-1.5 text-[13px] leading-5 font-medium text-ink-2">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: DOT[status] }} aria-hidden />
      {label || meta.label}
    </span>
  );
}

export function StatusLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] leading-5 text-muted">
      {(Object.keys(PILL) as StudyStatus[]).map((status) => (
        <li key={status} className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: DOT[status] }} aria-hidden />
          {PILL[status].label}
        </li>
      ))}
    </ul>
  );
}

export function SubjectMark({ subject }: { subject: string | null }) {
  const color = subjectVar(subject);
  const letter = subject ? subject.slice(0, 1) : "·";
  return (
    <span
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[13px] font-semibold"
      style={{ color: subjectInk(subject), background: `color-mix(in srgb, ${color} 16%, var(--bg-surface))` }}
      aria-hidden
    >
      {letter}
    </span>
  );
}

export function ThickBar({
  mastered,
  started,
  total,
  label,
}: {
  mastered: number;
  started: number;
  total: number;
  label: string;
}) {
  const safe = total > 0 ? total : 1;
  const masteredPct = Math.min(100, (mastered / safe) * 100);
  const startedPct = Math.min(100, (started / safe) * 100);
  return (
    <div
      className="relative h-2.5 w-full overflow-hidden rounded-full"
      style={{ background: "var(--border-button)" }}
      role="img"
      aria-label={label}
    >
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${startedPct}%`, background: "var(--warning)" }} />
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${masteredPct}%`, background: "var(--success)" }} />
    </div>
  );
}

export function SegmentBar({
  counts,
  label,
}: {
  counts: { mastered: number; progress: number; review: number; fresh: number };
  label: string;
}) {
  const total = counts.mastered + counts.progress + counts.review + counts.fresh;
  const parts = [
    ["mastered", counts.mastered, "var(--success)"],
    ["progress", counts.progress, "var(--warning)"],
    ["review", counts.review, "var(--danger)"],
    ["fresh", counts.fresh, "var(--border-button)"],
  ] as const;
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full" role="img" aria-label={label}>
      {total === 0 ? (
        <span className="h-full flex-1" style={{ background: "var(--border-button)" }} />
      ) : (
        parts.map(([key, count, color]) =>
          count > 0 ? (
            <span key={key} className="h-full" style={{ width: `${(count / total) * 100}%`, background: color }} />
          ) : null,
        )
      )}
    </div>
  );
}

export function StatRing({
  percent,
  color,
  label,
  caption,
}: {
  percent: number;
  color: string;
  label: string;
  caption: string;
}) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-3">
      <div
        className="grid h-14 w-14 place-items-center rounded-full"
        role="img"
        aria-label={label}
        style={{ background: `conic-gradient(${color} ${pct * 3.6}deg, var(--border-button) 0)` }}
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-surface text-[13px] font-semibold tabular-nums text-ink">
          {Math.round(pct)}%
        </span>
      </div>
      <div>
        <p className="text-[13px] leading-5 font-medium text-ink">{caption}</p>
        <p className="text-[13px] leading-5 text-muted">{label}</p>
      </div>
    </div>
  );
}
