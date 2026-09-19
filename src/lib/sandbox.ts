import * as auth from "@/lib/auth";
import { CacheTTL, cacheKey, cachedGet, primeCache } from "@/lib/apiCache";

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
  completed_today?: number;
  dismissed_today?: number;
};

export type SandboxActionDecision = "complete" | "dismiss";

export type SandboxActionEvent = {
  action_id: string;
  target_key: string;
  status: string;
  for_date: string;
  action: string;
  concept_id: string;
  roadmap_node_id: string;
  created_at: string;
  updated_at: string;
};

/** What complete/dismiss return: the recorded event plus the rebuilt queue. */
export type SandboxActionResult = {
  event: SandboxActionEvent;
  already_recorded: boolean;
  queue: SandboxQueueResponse;
};

export const SANDBOX_QUEUE_CACHE_KEY = cacheKey(["sandbox", "queue"]);

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
  return cachedGet(SANDBOX_QUEUE_CACHE_KEY, CacheTTL.sandboxQueue, () =>
    auth.apiRequest(`${auth.getApiBaseUrl()}/sandbox/queue/`)
  );
}

export async function fetchReadiness(): Promise<ReadinessResponse> {
  return auth.apiRequest(`${auth.getApiBaseUrl()}/sandbox/readiness/`);
}

/**
 * Record one decision about one queue card.
 *
 * The card `id` is posted verbatim — it carries a shifting `focus-`/`next-`
 * position prefix that the backend canonicalises, so rewriting it here would
 * only break the idempotency key. The endpoint is idempotent (unique on
 * user + action + day) and reports `already_recorded: true` on a repeat, so a
 * double-click needs no client-side guard.
 *
 * The response already contains the queue the server rebuilt, so we write that
 * into the cache instead of refetching it.
 */
async function recordSandboxAction(
  actionId: string,
  decision: SandboxActionDecision,
  context?: { action?: string; concept_id?: string; roadmap_node_id?: string }
): Promise<SandboxActionResult> {
  const result = await auth.apiRequest<SandboxActionResult>(
    `${auth.getApiBaseUrl()}/sandbox/queue/${encodeURIComponent(actionId)}/${decision}/`,
    { method: "POST", body: JSON.stringify(context ?? {}) }
  );
  if (result?.queue) {
    primeCache(SANDBOX_QUEUE_CACHE_KEY, result.queue, CacheTTL.sandboxQueue);
  }
  return result;
}

export function completeSandboxAction(
  actionId: string,
  context?: { action?: string; concept_id?: string; roadmap_node_id?: string }
): Promise<SandboxActionResult> {
  return recordSandboxAction(actionId, "complete", context);
}

export function dismissSandboxAction(
  actionId: string,
  context?: { action?: string; concept_id?: string; roadmap_node_id?: string }
): Promise<SandboxActionResult> {
  return recordSandboxAction(actionId, "dismiss", context);
}
