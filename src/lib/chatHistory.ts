/**
 * Chat-history reads from Django (`/api/v1/analytics/chat-history/`).
 *
 * The transcripts themselves live in Supabase `public.chat_turns`; Django reads
 * them on the student's behalf, so both endpoints answer **503** with a readable
 * `detail` when Supabase is not configured, and the detail endpoint answers
 * **404** for a session that either does not exist or is not this student's.
 * Neither is a failure worth alarming a student about — `describeHistoryError`
 * turns both into calm copy and says whether a retry is worth offering.
 */

import * as auth from "@/lib/auth";
import { CacheTTL, cacheKey, cachedGet } from "@/lib/apiCache";

export type ChatHistorySession = {
  session_id: string;
  session_type: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  concepts_touched: string[];
  summary: string;
  last_decision: string | null;
  turn_count: number;
};

export type ChatHistoryListResponse = {
  sessions: ChatHistorySession[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
};

export type ChatHistoryTurn = {
  turn_id: string;
  role: string | null;
  content: string;
  turn_index: number | null;
  is_summarized: boolean;
  concepts_referenced: string[];
  agent_used: string | null;
  created_at: string | null;
  decision: string | null;
  content_ids_served: string[];
  presentation?: unknown;
  student_feedback?: unknown;
};

export type ChatHistoryDetail = {
  session_id: string;
  session_type: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  summary: string;
  last_decision: string | null;
  concepts_touched: string[];
  turns: ChatHistoryTurn[];
};

export const DEFAULT_HISTORY_PAGE_SIZE = 10;

export function chatHistoryCacheKey(page: number, pageSize: number, subject?: string): string {
  return cacheKey(["chatHistory", "list", page, pageSize, subject]);
}

export async function getChatHistory(
  page = 1,
  pageSize = DEFAULT_HISTORY_PAGE_SIZE,
  subject?: string,
): Promise<ChatHistoryListResponse> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (subject) params.set("subject", subject);
  return cachedGet(chatHistoryCacheKey(page, pageSize, subject), CacheTTL.chatHistory, () =>
    auth.apiRequest<ChatHistoryListResponse>(
      `${auth.getApiBaseUrl()}/analytics/chat-history/?${params.toString()}`,
    ),
  );
}

export async function getChatHistorySession(sessionId: string): Promise<ChatHistoryDetail> {
  return cachedGet(
    cacheKey(["chatHistory", "detail", sessionId]),
    CacheTTL.chatHistoryDetail,
    () =>
      auth.apiRequest<ChatHistoryDetail>(
        `${auth.getApiBaseUrl()}/analytics/chat-history/${encodeURIComponent(sessionId)}/`,
      ),
  );
}

export type HistoryErrorCopy = {
  /** `empty` reads as "nothing here yet"; `problem` earns a Retry control. */
  tone: "empty" | "problem";
  message: string;
  retryable: boolean;
};

/**
 * Maps a failed history read to student-facing copy using `ApiError.kind` and
 * `status` — never by matching on message text.
 */
export function describeHistoryError(error: unknown): HistoryErrorCopy {
  if (error instanceof auth.ApiError) {
    if (error.status === 503) {
      return {
        tone: "empty",
        message: "Your past sessions are not available right now. They will show up here once history is back.",
        retryable: true,
      };
    }
    if (error.status === 404) {
      return { tone: "empty", message: "That session is no longer available.", retryable: false };
    }
    if (error.kind === "auth") {
      return { tone: "problem", message: error.message, retryable: false };
    }
    return { tone: "problem", message: error.message, retryable: error.retryable };
  }
  return {
    tone: "problem",
    message: error instanceof Error ? error.message : "Could not load your past sessions.",
    retryable: true,
  };
}

export function formatHistoryDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const minutes = Math.round(seconds / 60);
  if (minutes < 1) return "under a minute";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function formatHistoryDate(iso: string | null): string {
  if (!iso) return "Undated";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Undated";
  const today = new Date();
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();
  if (sameDay) {
    return `Today, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}
