import type { CSSProperties } from "react";

export type StudyStatus = "new" | "progress" | "review" | "mastered";

const PILL: Record<StudyStatus, { label: string; style: CSSProperties }> = {
  new: {
    label: "Not started",
    style: {
      background: "color-mix(in srgb, var(--status-new) 55%, var(--bg-surface))",
      color: "var(--text-secondary)",
    },
  },
  progress: {
    label: "In progress",
    style: {
      background: "color-mix(in srgb, var(--status-progress) 22%, var(--bg-surface))",
      color: "var(--warning)",
    },
  },
  review: {
    label: "Needs review",
    style: {
      background: "color-mix(in srgb, var(--status-review) 14%, var(--bg-surface))",
      color: "var(--danger)",
    },
  },
  mastered: {
    label: "Mastered",
    style: {
      background: "color-mix(in srgb, var(--status-mastered) 16%, var(--bg-surface))",
      color: "var(--success)",
    },
  },
};

const DOT: Record<StudyStatus, string> = {
  new: "var(--status-new)",
  progress: "var(--status-progress)",
  review: "var(--status-review)",
  mastered: "var(--status-mastered)",
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
  if (subject === "Physics") return "var(--physics-ink)";
  if (subject === "Chemistry") return "var(--chemistry-ink)";
  if (subject === "Mathematics" || subject === "Maths") return "var(--maths-ink)";
  return "var(--text-main)";
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
    <span
      className="inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 text-[13px] leading-5 font-medium"
      style={meta.style}
    >
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
      style={{ background: "var(--status-new)" }}
      role="img"
      aria-label={label}
    >
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${startedPct}%`, background: "var(--status-progress)" }} />
      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${masteredPct}%`, background: "var(--status-mastered)" }} />
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
    ["mastered", counts.mastered, "var(--status-mastered)"],
    ["progress", counts.progress, "var(--status-progress)"],
    ["review", counts.review, "var(--status-review)"],
    ["fresh", counts.fresh, "var(--status-new)"],
  ] as const;
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full" role="img" aria-label={label}>
      {total === 0 ? (
        <span className="h-full flex-1" style={{ background: "var(--status-new)" }} />
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
        style={{ background: `conic-gradient(${color} ${pct * 3.6}deg, var(--status-new) 0)` }}
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
