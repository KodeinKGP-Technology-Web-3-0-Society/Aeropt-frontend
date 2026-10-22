/**
 * Unified application route helpers.
 *
 * For static exports (such as the Android Capacitor bundle), dynamic URL path
 * parameters cannot be statically generated ahead of time. These helpers emit
 * query-param URLs (/study/room?concept=..., /lesson/room?concept=..., /chat/session?id=...)
 * that work identically across both web and mobile environments.
 */

export interface StudyHrefOptions {
  session?: string | null;
  mode?: "learn" | "practice" | string | null;
  source?: "any" | "pyq" | string | null;
}

/** URL for Study Room (theory, practice, or existing session). */
export function studyHref(conceptId: string, opts?: StudyHrefOptions): string {
  const params = new URLSearchParams();
  params.set("concept", conceptId);
  if (opts?.session) {
    params.set("session", opts.session);
  }
  if (opts?.mode && opts.mode !== "learn") {
    params.set("mode", opts.mode);
  }
  if (opts?.source && opts.source !== "any") {
    params.set("source", opts.source);
  }
  return `/study/room?${params.toString()}`;
}

/** URL for Lesson Room. */
export function lessonHref(conceptId: string): string {
  const params = new URLSearchParams({ concept: conceptId });
  return `/lesson/room?${params.toString()}`;
}

/** URL for Classroom session redirect. */
export function chatHref(
  sessionId: string,
  query?: Record<string, string | undefined | null>,
): string {
  const params = new URLSearchParams({ id: sessionId });
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && key !== "id") {
        params.set(key, value);
      }
    }
  }
  return `/chat/session?${params.toString()}`;
}

/** URL for Assessment room. */
export function assessHref(conceptId: string): string {
  const params = new URLSearchParams({ concept: conceptId });
  return `/assess?${params.toString()}`;
}
