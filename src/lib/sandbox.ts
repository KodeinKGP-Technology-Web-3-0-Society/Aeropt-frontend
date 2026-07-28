import * as auth from "@/lib/auth";
import { CacheTTL, cacheKey, cachedGet } from "@/lib/apiCache";

export type SandboxAction = {
  id: string;
  action: string;
  concept_id: string;
  concept_name: string;
  chapter?: string;
  roadmap_node_id?: string;
  duration_min?: number;
  proficiency_pct?: number;
  reason?: string;
  priority?: number;
};

export type SandboxQueueResponse = {
  queue: SandboxAction[];
  count: number;
  daily_goal_minutes?: number;
  preferred_depth?: string;
  queue_target_minutes?: number;
};

export type ReadinessResponse = {
  overall: number;
  target_exam: string;
  graduation_state: string;
  concepts_tracked: number;
  components: {
    concept_mastery: number;
    prerequisite_health: number;
    pyq_performance: number;
    mock_performance: number;
    consistency: number;
  };
};

export async function fetchSandboxQueue(): Promise<SandboxQueueResponse> {
  return cachedGet(cacheKey(["sandbox", "queue"]), CacheTTL.sandboxQueue, () =>
    auth.apiRequest(`${auth.getApiBaseUrl()}/sandbox/queue/`)
  );
}

export async function fetchReadiness(): Promise<ReadinessResponse> {
  return auth.apiRequest(`${auth.getApiBaseUrl()}/sandbox/readiness/`);
}
