"use client";

/**
 * Previously the five-facade "Study team" picker (tutor / syllabus /
 * doubt_resolver / practice_coach / mentor_briefing). The architecture is one
 * Main Tutor per student — the student does not choose an agent — so this
 * panel no longer renders. ChatWorkspace still mounts it with the old props;
 * they are accepted and ignored so that split can finish without a conflict.
 */
type AgentRosterPanelProps = {
  userId?: string | null;
  sessionId?: string | null;
  roadmapConceptId?: string | null;
  primaryConceptId?: string | null;
  focusChapters?: string[];
  activeAgent?: string | null;
  refreshKey?: number;
  collapsed?: boolean;
  onToggle?: () => void;
};

export default function AgentRosterPanel(_props: AgentRosterPanelProps) {
  return null;
}
