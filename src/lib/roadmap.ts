import * as auth from "@/lib/auth";

export type NodeStatus = "pending" | "in_progress" | "completed" | "skipped";
export type NodeType = "learn" | "revise" | "mastered";

export type ProficiencyDisplay =
  | "not_started"
  | "strong"
  | "moderate"
  | "weak"
  | "mastered";

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
  status: NodeStatus;
  started_at: string | null;
  completed_at: string | null;
};

export function formatProficiencyLabel(node: Pick<PathNode, "proficiency_pct" | "proficiency_display">): string {
  if (node.proficiency_display === "not_started" || node.proficiency_pct === null) {
    return "Not started";
  }
  if (node.proficiency_display === "mastered") {
    return `${node.proficiency_pct}% mastered`;
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
  nodes: PathNode[];
  created_at: string;
  updated_at: string;
};

export type RoadmapNextResponse = {
  nodes: PathNode[];
};

export type RoadmapProgressResponse = {
  node: PathNode;
  roadmap: LearningPath;
};

export async function fetchRoadmap(regenerate = false): Promise<LearningPath> {
  const suffix = regenerate ? "?regenerate=1" : "";
  return auth.apiRequest<LearningPath>(`${auth.getApiBaseUrl()}/roadmap/${suffix}`);
}

export async function fetchRoadmapNext(): Promise<RoadmapNextResponse> {
  return auth.apiRequest<RoadmapNextResponse>(`${auth.getApiBaseUrl()}/roadmap/next/`);
}

export async function updateRoadmapProgress(payload: {
  node_id: string;
  status: NodeStatus;
  proficiency_pct?: number;
}): Promise<RoadmapProgressResponse> {
  return auth.apiRequest<RoadmapProgressResponse>(`${auth.getApiBaseUrl()}/roadmap/progress/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
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

export function buildContinueChatUrl(node: PathNode, stage: StudyStage = "theory"): string {
  const params = new URLSearchParams({
    concept_id: node.concept_id,
    node_id: node.id,
    stage,
    prompt: stagePrompt(node.concept_name, stage),
  });
  return `/chat?${params.toString()}`;
}
