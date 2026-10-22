import type { OverviewConcept, OverviewGroup, SyllabusUnit, UpNextItem } from "@/lib/api/study";
import { studyHref } from "./routes.ts";

export type TabKind = "review" | "in_progress" | "explored" | "mastered";

export interface TabCounts {
  needs_review: number;
  in_progress: number;
  explored: number;
  mastered: number;
}

export interface SplitInProgressResult {
  inProgressGroups: OverviewGroup[];
  exploredGroups: OverviewGroup[];
  inProgressCount: number;
  exploredCount: number;
}

export const KIND_LABEL: Record<UpNextItem["kind"], { tag: string; cta: string }> = {
  review: { tag: "Review due", cta: "Start review" },
  resume: { tag: "Continue where you left off", cta: "Resume" },
  next: { tag: "Up next", cta: "Start" },
  start: { tag: "Start here", cta: "Start" },
};

/**
 * Returns true if the concept was only touched in chat conversations
 * without structured practice attempts or a formal study phase.
 */
export function isExploredConcept(c: OverviewConcept): boolean {
  return (c.attempts === 0 || c.attempts == null) && !c.phase;
}

/**
 * Splits the backend's `in_progress` array into two clean sets:
 * 1. Active practice (has attempts > 0 or a study phase)
 * 2. Explored in chat (attempts === 0 and no phase)
 */
export function splitInProgressAndExplored(groups: OverviewGroup[]): SplitInProgressResult {
  const inProgressGroups: OverviewGroup[] = [];
  const exploredGroups: OverviewGroup[] = [];
  let inProgressCount = 0;
  let exploredCount = 0;

  for (const group of groups) {
    const actConcepts: OverviewConcept[] = [];
    const expConcepts: OverviewConcept[] = [];

    for (const concept of group.concepts) {
      if (isExploredConcept(concept)) {
        expConcepts.push(concept);
        exploredCount++;
      } else {
        actConcepts.push(concept);
        inProgressCount++;
      }
    }

    if (actConcepts.length > 0) {
      inProgressGroups.push({
        ...group,
        concepts: actConcepts,
      });
    }

    if (expConcepts.length > 0) {
      exploredGroups.push({
        ...group,
        concepts: expConcepts,
      });
    }
  }

  return {
    inProgressGroups,
    exploredGroups,
    inProgressCount,
    exploredCount,
  };
}

/**
 * Flattens chapter groups and sorts concepts by urgency according to the active tab.
 */
export function flattenAndSortConcepts(groups: OverviewGroup[], tab: TabKind): OverviewConcept[] {
  const all: OverviewConcept[] = [];
  for (const g of groups) {
    all.push(...g.concepts);
  }

  if (tab === "review") {
    return all.sort((a, b) => {
      const aOverdue = Boolean(a.overdue);
      const bOverdue = Boolean(b.overdue);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      const aProf = a.proficiency ?? 1;
      const bProf = b.proficiency ?? 1;
      if (aProf !== bProf) return aProf - bProf;
      return String(b.last_practised || "").localeCompare(String(a.last_practised || ""));
    });
  }

  if (tab === "in_progress") {
    return all.sort((a, b) => {
      const aHasPhase = Boolean(a.phase);
      const bHasPhase = Boolean(b.phase);
      if (aHasPhase !== bHasPhase) return aHasPhase ? -1 : 1;
      const aProf = a.proficiency ?? 0;
      const bProf = b.proficiency ?? 0;
      if (aProf !== bProf) return aProf - bProf;
      return String(b.last_practised || "").localeCompare(String(a.last_practised || ""));
    });
  }

  if (tab === "explored") {
    return all.sort((a, b) =>
      String(b.last_practised || "").localeCompare(String(a.last_practised || ""))
    );
  }

  if (tab === "mastered") {
    return all.sort((a, b) => {
      const aProf = a.proficiency ?? 1;
      const bProf = b.proficiency ?? 1;
      if (bProf !== aProf) return bProf - aProf;
      return String(b.last_practised || "").localeCompare(String(a.last_practised || ""));
    });
  }

  return all;
}

/**
 * Picks the most actionable non-empty tab.
 * Urgency order: Needs review -> In progress -> Explored -> Mastered.
 */
export function getDefaultActiveTab(counts: TabCounts): TabKind {
  if (counts.needs_review > 0) return "review";
  if (counts.in_progress > 0) return "in_progress";
  if (counts.explored > 0) return "explored";
  if (counts.mastered > 0) return "mastered";
  return "in_progress";
}

/**
 * Constructs the canonical link to a study session or topic.
 */
export function conceptHref(c: { concept_id: string; study_session_id?: string | null }): string {
  return studyHref(c.concept_id, { session: c.study_session_id });
}

const MATHS_SUBJECTS = new Set(["mathematics", "maths", "math"]);

export function isMathematicsSubject(subject?: string | null): boolean {
  return MATHS_SUBJECTS.has((subject || "").trim().toLowerCase());
}

export interface TodaySetPick {
  conceptId: string;
  topic: string;
  subject?: string;
  unit?: string;
  href: string;
}

type TodayPlanItem = {
  concept_id: string;
  topic: string;
  subject?: string;
  unit?: string;
  kind: string;
  done?: boolean;
};

/** First unfinished Physics or Chemistry item for plan.today. Mathematics only if nothing else is left. */
export function pickTodaySet(
  plan: { today: string; week: { date: string; items: TodayPlanItem[] }[] } | null | undefined,
  queued: { concept_id: string; study_session_id?: string | null }[] = [],
): TodaySetPick | null {
  if (!plan?.today || !plan.week?.length) return null;
  const today = plan.today.slice(0, 10);
  const day = plan.week.find((entry) => (entry.date || "").slice(0, 10) === today);
  if (!day) return null;
  const open = day.items.filter((item) => item.concept_id && item.kind !== "done" && !item.done);
  const taught = open.filter((item) => !isMathematicsSubject(item.subject));
  const item = (taught.length ? taught : open)[0];
  if (!item) return null;
  const match = queued.find((row) => row.concept_id === item.concept_id);
  return {
    conceptId: item.concept_id,
    topic: item.topic,
    subject: item.subject,
    unit: item.unit,
    href: match ? conceptHref(match) : studyHref(item.concept_id),
  };
}

type MistakeRow = {
  concept_id: string | null;
  concept_name: string | null;
  content_id?: string | null;
  fixed: boolean;
};

/**
 * Where "practise the mistakes" goes. A study session is one concept and picks
 * its own questions, so a set made only of these misses is not available: the
 * label names the first unfixed concept.
 */
export function unfixedPracticeTarget(notebook: MistakeRow[]): { href: string; label: string } | null {
  const seen = new Set<string>();
  const open: MistakeRow[] = [];
  for (const row of notebook) {
    if (row.fixed || !row.concept_id) continue;
    const key = row.content_id ? `q:${row.content_id}` : `c:${row.concept_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    open.push(row);
  }
  const first = open[0];
  if (!first?.concept_id) return null;
  const name = displayTitle(first.concept_name || "this concept");
  return {
    href: studyHref(first.concept_id, { mode: "practice" }),
    label: `Practise ${name} again`,
  };
}

export function conceptAction(
  c: OverviewConcept,
  tab: TabKind,
): { label: string; href: string; detail: string; tone: "danger" | "warning" | "success" | "muted" } {
  if (tab === "review") {
    const detail = c.overdue ? "Due now" : (c.reason || "Review due");
    return {
      label: "Review",
      href: conceptHref(c),
      detail,
      tone: "danger",
    };
  }

  if (tab === "in_progress") {
    const detail = c.phase
      ? `in ${c.phase}`
      : c.proficiency != null
        ? `${Math.round(c.proficiency * 100)}%`
        : "Started";
    return {
      label: c.study_session_id ? "Resume" : "Practise",
      href: conceptHref(c),
      detail,
      tone: "warning",
    };
  }

  if (tab === "explored") {
    return {
      label: "Practise",
      href: studyHref(c.concept_id, { mode: "practice" }),
      detail: "Explored in chat",
      tone: "muted",
    };
  }

  // mastered
  const detail = c.proficiency != null ? `${Math.round(c.proficiency * 100)}%` : "Mastered";
  return {
    label: "Practise",
    href: studyHref(c.concept_id, { mode: "practice" }),
    detail,
    tone: "success",
  };
}

const SMALL_WORDS = new Set(["a", "an", "and", "of", "the", "in", "on", "for", "to", "by", "with", "or"]);

/** Title Case for display. Keeps existing capitals (LC, pH) and short prefixes like "d-". */
export function displayTitle(name: string): string {
  const parts = name.split(/(\s+)/);
  let wordIndex = 0;
  return parts
    .map((part) => {
      if (!part.trim()) return part;
      const index = wordIndex;
      wordIndex += 1;
      if (/[A-Z]/.test(part) || /^[a-z]-/.test(part)) return part;
      const lower = part.toLowerCase();
      if (!/[a-z]/i.test(part)) return part;
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

/** Relative within a week ("3 days ago"), otherwise "Oct 11". */
export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return "";
  try {
    const then = new Date(iso);
    if (isNaN(then.getTime())) return "";
    const diffMs = Date.now() - then.getTime();
    const days = Math.floor(diffMs / 86_400_000);
    if (days <= 0) {
      const hours = Math.floor(diffMs / 3_600_000);
      if (hours <= 0) return "Today";
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return then.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

/** Match a chapter or topic label to Physics, Chemistry, or Mathematics when the syllabus knows it. */
export function subjectForLabel(label: string | null | undefined, syllabus: SyllabusUnit[]): string | null {
  const needle = label?.trim().toLowerCase();
  if (!needle) return null;
  for (const unit of syllabus) {
    if (unit.unit.toLowerCase() === needle) return unit.subject ?? null;
    if (unit.topics.some((topic) => topic.topic.toLowerCase() === needle)) return unit.subject ?? null;
  }
  return null;
}

const SUBJECT_ORDER = ["Physics", "Chemistry", "Mathematics"];

export interface SyllabusSubjectGroup {
  subject: string;
  units: SyllabusUnit[];
}

/** Units stay in exam order. Subjects follow Physics, Chemistry, Mathematics, then any other name. */
export function groupSyllabusBySubject(syllabus: SyllabusUnit[]): SyllabusSubjectGroup[] {
  const groups = new Map<string, SyllabusUnit[]>();
  for (const unit of syllabus) {
    const subject = unit.subject?.trim() || "Syllabus";
    const list = groups.get(subject);
    if (list) list.push(unit);
    else groups.set(subject, [unit]);
  }
  const rank = (subject: string) => {
    const index = SUBJECT_ORDER.indexOf(subject);
    return index === -1 ? SUBJECT_ORDER.length : index;
  };
  return [...groups.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]))
    .map(([subject, units]) => ({ subject, units }));
}

export function calculateSyllabusStats(syllabus: SyllabusUnit[]) {
  const totalTopics = syllabus.reduce((acc, u) => acc + (u.total || 0), 0);
  const totalStarted = syllabus.reduce((acc, u) => acc + (u.started || 0), 0);
  const totalMastered = syllabus.reduce((acc, u) => acc + (u.mastered || 0), 0);
  const startedPct = totalTopics > 0 ? Math.round((totalStarted / totalTopics) * 100) : 0;
  const masteredPct = totalTopics > 0 ? Math.round((totalMastered / totalTopics) * 100) : 0;

  return {
    totalTopics,
    totalStarted,
    totalMastered,
    startedPct,
    masteredPct,
  };
}
