import * as auth from "@/lib/api/auth";
import {
  CacheTTL,
  cacheKey,
  cachedGet,
  invalidateCache,
  invalidateUserProductCache,
} from "@/lib/api/apiCache";

export type NodeStatus = "pending" | "in_progress" | "completed" | "skipped";
export type NodeType = "learn" | "revise" | "mastered";

export type ProficiencyDisplay =
  | "not_started"
  | "strong"
  | "almost_mastered"
  | "moderate"
  | "weak"
  | "mastered";

/** Meeting Jul 17 — unified mastery gate (percent scale for dashboard colors). */
export const MASTERY_THRESHOLD_PCT = 80;
export const ALMOST_MASTERED_THRESHOLD_PCT = 65;
export const WEAK_THRESHOLD_PCT = 40;

export type PathNode = {
  id: string;
  sequence_index: number;
  concept_id: string;
  concept_name: string;
  chapter: string;
  node_type: NodeType;
  exam_weight: string;
  content_sequence: string[];
  mastery_threshold: number;
  estimated_minutes: number;
  proficiency_pct: number | null;
  proficiency_display: ProficiencyDisplay;
  /** False when the tutor has no seeded content for this concept yet. */
  content_ready?: boolean;
  status: NodeStatus;
  started_at: string | null;
  completed_at: string | null;
};

export function formatProficiencyLabel(node: Pick<PathNode, "proficiency_pct" | "proficiency_display">): string {
  if (node.proficiency_display === "not_started" || node.proficiency_pct === null) {
    return "Not started";
  }
  if (node.proficiency_display === "mastered" || node.proficiency_display === "strong") {
    return `${node.proficiency_pct}% mastered`;
  }
  if (node.proficiency_display === "almost_mastered") {
    return `${node.proficiency_pct}% · Almost mastered`;
  }
  if (node.proficiency_display === "weak") {
    return `${node.proficiency_pct}% · Weak`;
  }
  return `${node.proficiency_pct}% mastery`;
}

export type LearningPath = {
  id: string;
  subject: string;
  total_nodes: number;
  active_nodes: number;
  estimated_weeks: number;
  daily_goal_minutes: number;
  progress_pct: number;
  current_node: PathNode | null;
  study_plan?: StudyPlan | null;
  nodes: PathNode[];
  created_at: string;
  updated_at: string;
};

export type StudyPlanStep = {
  node_id: string;
  action: string;
};

export type StudyPlanLaterChapter = {
  chapter: string;
  remaining: number;
  minutes: number;
};

export type StudyPlan = {
  headline: string;
  why: string;
  today_node_id: string | null;
  this_week: StudyPlanStep[];
  later: StudyPlanLaterChapter[];
  later_more?: number;
};

/** Subjects the backend actually has a syllabus file for. */
export const DEFAULT_SUBJECT = "Physics";

const STAGE_WORDS: Record<string, string> = {
  theory: "theory",
  example: "a worked example",
  practice: "practice",
  pyq: "a PYQ",
};

function actionForNode(node: PathNode): string {
  if (node.node_type.toLowerCase() === "revise") {
    return "Skip a full theory pass. Do a worked example, then a PYQ.";
  }
  const sequence = node.content_sequence?.length
    ? node.content_sequence
    : ["theory", "example", "practice"];
  const words = sequence.slice(0, 3).map((stage) => STAGE_WORDS[stage.toLowerCase()] ?? stage);
  const path = words.join(" → ") || "theory → a worked example";
  return `Complete ${path}. Go deeper only if you want more.`;
}

/** Client fallback when a cached API payload has no `study_plan` yet. */
export function fallbackStudyPlan(
  nodes: PathNode[],
  subject = DEFAULT_SUBJECT,
  dailyGoalMinutes = 45,
): StudyPlan {
  const ordered = [...nodes].sort((a, b) => a.sequence_index - b.sequence_index);
  const open = ordered.filter((n) => n.status !== "skipped" && n.status !== "completed");
  const current = open.find((n) => n.status === "in_progress") ?? open[0] ?? null;
  const limit = Math.max(3, Math.min(5, Math.max(3, Math.floor((dailyGoalMinutes || 45) / 12))));
  const start = current ? Math.max(0, open.findIndex((n) => n.id === current.id)) : 0;
  const thisWeekNodes = current ? open.slice(start, start + limit) : [];
  const weekIds = new Set(thisWeekNodes.map((n) => n.id));
  const lastSeq = thisWeekNodes.reduce((max, n) => Math.max(max, n.sequence_index), -1);

  const laterCounts = new Map<string, { remaining: number; minutes: number }>();
  for (const n of open) {
    if (weekIds.has(n.id) || n.sequence_index <= lastSeq) continue;
    const chapter = n.chapter || subject;
    const bucket = laterCounts.get(chapter) ?? { remaining: 0, minutes: 0 };
    bucket.remaining += 1;
    bucket.minutes += n.estimated_minutes || 0;
    laterCounts.set(chapter, bucket);
  }
  const laterAll = [...laterCounts.entries()].map(([chapter, counts]) => ({
    chapter,
    remaining: counts.remaining,
    minutes: counts.minutes,
  }));
  const later = laterAll.slice(0, 14);

  let headline: string;
  let why: string;
  if (!current) {
    headline = `${subject} path complete`;
    why = "Every concept on this path is done or skipped. Open a chapter below to review.";
  } else {
    const weekChapters: string[] = [];
    for (const n of thisWeekNodes) {
      const ch = n.chapter || subject;
      if (!weekChapters.includes(ch)) weekChapters.push(ch);
    }
    if (weekChapters.length === 1) headline = `This week: ${weekChapters[0]}`;
    else if (weekChapters.length) headline = `This week: ${weekChapters[0]}, then ${weekChapters[1]}`;
    else headline = `This week on ${subject}`;
    why = `Follow this order. Prerequisites come first, so do not skip ahead. Today start with ${current.concept_name}.`;
  }

  return {
    headline,
    why,
    today_node_id: current?.id ?? null,
    this_week: thisWeekNodes.map((n) => ({ node_id: n.id, action: actionForNode(n) })),
    later,
    later_more: Math.max(0, laterAll.length - later.length),
  };
}

export type RoadmapNextResponse = {
  nodes: PathNode[];
};

export type RoadmapProgressResponse = {
  node: PathNode;
  roadmap: LearningPath;
};

export async function fetchRoadmapSubjects(): Promise<string[]> {
  return cachedGet(cacheKey(["roadmap", "subjects"]), CacheTTL.roadmap, async () => {
    const res = await auth.apiRequest<{ subjects: string[] }>(
      `${auth.getApiBaseUrl()}/roadmap/subjects/`
    );
    return res.subjects ?? [DEFAULT_SUBJECT];
  });
}

export async function fetchRoadmap(
  regenerate = false,
  subject: string = DEFAULT_SUBJECT
): Promise<LearningPath> {
  const q = `subject=${encodeURIComponent(subject)}`;
  if (regenerate) {
    // Only this subject's cached payload is stale — the others are untouched.
    invalidateCache(cacheKey(["roadmap", subject]));
    return auth.apiRequest<LearningPath>(
      `${auth.getApiBaseUrl()}/roadmap/?regenerate=1&${q}`
    );
  }
  return cachedGet(cacheKey(["roadmap", subject]), CacheTTL.roadmap, () =>
    auth.apiRequest<LearningPath>(`${auth.getApiBaseUrl()}/roadmap/?${q}`)
  );
}

export async function fetchRoadmapNext(
  subject: string = DEFAULT_SUBJECT
): Promise<RoadmapNextResponse> {
  return auth.apiRequest<RoadmapNextResponse>(
    `${auth.getApiBaseUrl()}/roadmap/next/?subject=${encodeURIComponent(subject)}`
  );
}

export async function updateRoadmapProgress(payload: {
  node_id: string;
  status: NodeStatus;
  proficiency_pct?: number;
}): Promise<RoadmapProgressResponse> {
  const result = await auth.apiRequest<RoadmapProgressResponse>(
    `${auth.getApiBaseUrl()}/roadmap/progress/`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  invalidateUserProductCache();
  return result;
}

export function groupNodesByChapter(nodes: PathNode[]): Record<string, PathNode[]> {
  return nodes.reduce<Record<string, PathNode[]>>((acc, node) => {
    const chapter = node.chapter || "Physics";
    if (!acc[chapter]) acc[chapter] = [];
    acc[chapter].push(node);
    return acc;
  }, {});
}

export function chapterMasteryPct(nodes: PathNode[]): number {
  const active = nodes.filter((n) => n.status !== "skipped");
  if (active.length === 0) return 0;
  const done = active.filter((n) => n.status === "completed").length;
  return Math.round((done / active.length) * 100);
}

export type StudyStage = "theory" | "example" | "practice" | "pyq";

export type NodeEntryMode = "start" | "resume" | "review";

export type NodeEntry = {
  mode: NodeEntryMode;
  stage: StudyStage;
  stageIndex: number;
  /** When true, open a new empty transcript then strip `fresh` from `/chat/<id>?…`. */
  fresh: boolean;
  /** Card CTA, e.g. "Resume · Example" */
  label: string;
  /** Hero / dashboard primary button */
  heroLabel: string;
};

export type StageProgressItem = {
  stage: StudyStage;
  label: string;
  state: "done" | "current" | "todo";
};

export type BuildChatUrlOptions = {
  stage?: StudyStage;
  fresh?: boolean;
};

const DEFAULT_SEQUENCE: StudyStage[] = ["theory", "example", "practice", "pyq"];

function isStudyStage(value: string): value is StudyStage {
  return value === "theory" || value === "example" || value === "practice" || value === "pyq";
}

export function formatStageLabel(stage: StudyStage): string {
  if (stage === "pyq") return "PYQ";
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

/** Normalized content_sequence for a node (falls back to theory→pyq). */
export function nodeContentSequence(node: PathNode): StudyStage[] {
  const raw = node.content_sequence?.length ? node.content_sequence : DEFAULT_SEQUENCE;
  const stages = raw.filter(isStudyStage);
  return stages.length > 0 ? stages : [...DEFAULT_SEQUENCE];
}

export function stagePrompt(conceptName: string, stage: StudyStage): string {
  switch (stage) {
    case "theory":
      return `Explain ${conceptName}`;
    case "example":
      return `Show me a worked example for ${conceptName}`;
    case "practice":
      return `Give me a practice question on ${conceptName}`;
    case "pyq":
      return `Give me a PYQ on ${conceptName}`;
    default:
      return `Explain ${conceptName}`;
  }
}

/**
 * Decide Start vs Resume vs Review for a roadmap node.
 * Resume keeps the bound stage but always uses `fresh=1` so Study Session opens a
 * new empty transcript (ChatGPT-style) instead of restoring prior turns.
 */
export function resolveNodeEntry(node: PathNode): NodeEntry {
  const sequence = nodeContentSequence(node);
  const firstStage = sequence[0] ?? "theory";

  if (node.status === "completed" || node.status === "skipped") {
    return {
      mode: "review",
      stage: firstStage,
      stageIndex: 0,
      fresh: true,
      label: `Review · ${formatStageLabel(firstStage)}`,
      heroLabel: "Review concept",
    };
  }

  if (node.status === "in_progress") {
    const bind = readRoadmapSessionBind(node.id);
    const stageIndex =
      bind && bind.stageIndex >= 0 && bind.stageIndex < sequence.length
        ? bind.stageIndex
        : 0;
    const stage = sequence[stageIndex] ?? firstStage;
    return {
      mode: "resume",
      stage,
      stageIndex,
      fresh: true,
      label: `Resume · ${formatStageLabel(stage)}`,
      heroLabel: `Resume · ${formatStageLabel(stage)}`,
    };
  }

  return {
    mode: "start",
    stage: firstStage,
    stageIndex: 0,
    fresh: true,
    label: `Start · ${formatStageLabel(firstStage)}`,
    heroLabel: "Start learning",
  };
}

/** Stage strip for in-progress / current cards (and completed = all done). */
export function nodeStageProgress(node: PathNode): StageProgressItem[] {
  const sequence = nodeContentSequence(node);
  if (node.status === "completed") {
    return sequence.map((stage) => ({
      stage,
      label: formatStageLabel(stage),
      state: "done" as const,
    }));
  }
  const entry = resolveNodeEntry(node);
  // Pending = about to start at first stage; in_progress uses bind index.
  const currentIndex = node.status === "pending" ? 0 : entry.stageIndex;
  return sequence.map((stage, index) => ({
    stage,
    label: formatStageLabel(stage),
    state:
      index < currentIndex
        ? ("done" as const)
        : index === currentIndex
          ? ("current" as const)
          : ("todo" as const),
  }));
}

/**
 * Build /chat URL for a roadmap node (create-then-redirect lands on /chat/<id>).
 * - No second arg: uses {@link resolveNodeEntry} (bound stage + always fresh transcript).
 * - `StudyStage` string: force that stage with `fresh=1`.
 * - Options object: explicit stage + fresh.
 */
export function buildContinueChatUrl(
  node: PathNode,
  stageOrOptions?: StudyStage | BuildChatUrlOptions,
): string {
  let stage: StudyStage;
  let fresh: boolean;

  if (typeof stageOrOptions === "string") {
    stage = stageOrOptions;
    fresh = true;
  } else if (stageOrOptions) {
    stage = stageOrOptions.stage ?? resolveNodeEntry(node).stage;
    fresh = stageOrOptions.fresh ?? true;
  } else {
    const entry = resolveNodeEntry(node);
    stage = entry.stage;
    fresh = entry.fresh;
  }

  const params = new URLSearchParams({
    concept_id: node.concept_id,
    node_id: node.id,
    stage,
    prompt: stagePrompt(node.concept_name, stage),
  });
  if (fresh) {
    // One-shot: ChatWorkspace applies lesson setup then strips this from /chat/<id>.
    params.set("fresh", "1");
  }
  return `/chat?${params.toString()}`;
}

/** localStorage key binding a roadmap node to its active study session + stage. */
export function roadmapSessionBindKey(nodeId: string): string {
  return `prepwise_roadmap_bind:${nodeId}`;
}

export type RoadmapSessionBind = {
  sessionId: string | null;
  stageIndex: number;
};

export function readRoadmapSessionBind(nodeId: string): RoadmapSessionBind | null {
  if (typeof window === "undefined") return null;
  try {
    let raw = localStorage.getItem(roadmapSessionBindKey(nodeId));
    if (!raw) {
      // Migration from old key
      const oldKey = `aeropt-roadmap-bind:${nodeId}`;
      raw = localStorage.getItem(oldKey);
      if (raw) {
        localStorage.setItem(roadmapSessionBindKey(nodeId), raw);
        localStorage.removeItem(oldKey);
      } else {
        return null;
      }
    }
    const parsed = JSON.parse(raw) as RoadmapSessionBind;
    if (typeof parsed.stageIndex !== "number") return null;
    return {
      sessionId: parsed.sessionId ?? null,
      stageIndex: parsed.stageIndex,
    };
  } catch {
    return null;
  }
}

export function writeRoadmapSessionBind(nodeId: string, bind: RoadmapSessionBind): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(roadmapSessionBindKey(nodeId), JSON.stringify(bind));
}

export function clearRoadmapSessionBind(nodeId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(roadmapSessionBindKey(nodeId));
}
