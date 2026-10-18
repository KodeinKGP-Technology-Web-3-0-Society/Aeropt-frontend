import type { OverviewConcept, OverviewGroup, SyllabusUnit, UpNextItem } from "@/lib/api/study";

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
  const base = `/study/${encodeURIComponent(c.concept_id)}`;
  return c.study_session_id ? `${base}?session=${c.study_session_id}` : base;
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
      href: `/study/${encodeURIComponent(c.concept_id)}?mode=practice`,
      detail: "Explored in chat",
      tone: "muted",
    };
  }

  // mastered
  const detail = c.proficiency != null ? `${Math.round(c.proficiency * 100)}%` : "Mastered";
  return {
    label: "Practise",
    href: `/study/${encodeURIComponent(c.concept_id)}?mode=practice`,
    detail,
    tone: "success",
  };
}

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
      return `${hours}h ago`;
    }
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return then.toLocaleDateString([], { day: "numeric", month: "short" });
  } catch {
    return "";
  }
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
