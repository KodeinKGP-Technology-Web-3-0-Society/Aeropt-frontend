import { invalidateCache } from "@/lib/api/apiCache";

/** Django (:8000) is the only auth authority. Do not call the agent for login/register. */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || "";
if (!API_BASE) {
  console.error("CRITICAL ERROR: NEXT_PUBLIC_API_BASE_URL is unset. API calls will fail.");
}

export const AGENT_API_BASE = process.env.NEXT_PUBLIC_AGENT_API_BASE?.replace(/\/+$/, "") || "";
if (!AGENT_API_BASE) {
  console.error("CRITICAL ERROR: NEXT_PUBLIC_AGENT_API_BASE is unset. Agent calls will fail.");
}

/**
 * An unset base used to resolve to `""`, so every call became a same-origin
 * fetch to `/auth/token/` and failed with a 404 that looked like a backend
 * bug. Fail with the actual cause instead. `next.config.ts` reports the same
 * missing vars at build time.
 */
function assertBase(base: string, envVar: string): string {
  if (!base) {
    throw new ApiError(
      `${envVar} is not set for this build, so the app has no API address to call. ` +
        `Set it in .env.local (see .env.example) and restart the dev server.`,
      { kind: "config" },
    );
  }
  return base;
}

export type ApiErrorKind =
  /** env/config problem — retrying will not help. */
  | "config"
  /** offline, DNS, CORS, server not listening — retrying can help. */
  | "network"
  /** refresh failed; the student has to sign in again. */
  | "auth"
  /** 5xx — server-side, retrying can help. */
  | "server"
  /** 4xx other than 401 — the request itself was wrong. */
  | "client";

/**
 * Carries *why* a request failed so callers can choose between "Retry" and
 * "Sign in again". `message` stays human-readable, so existing call sites that
 * only render `error.message` keep working unchanged.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(message: string, options: { kind: ApiErrorKind; status?: number }) {
    super(message);
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status;
    this.retryable = options.kind === "network" || options.kind === "server";
  }
}

/** Fired once when a refresh attempt fails, i.e. the session is really over. */
export const AUTH_EXPIRED_EVENT = "jeepath:auth-expired";

export function onAuthExpired(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_EXPIRED_EVENT, handler);
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler);
}

let authExpiredAnnounced = false;

/**
 * Refresh failed while a refresh token existed: the session expired mid-use.
 * Tell the app (so an open screen can prompt), then fall back to a hard bounce
 * to /auth — otherwise a student sits in front of a screen whose every fetch
 * 401s with no explanation.
 */
function announceAuthExpired(): void {
  if (typeof window === "undefined" || authExpiredAnnounced) return;
  authExpiredAnnounced = true;
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  if (!window.location.pathname.startsWith("/auth")) {
    window.location.assign("/auth?expired=1");
  }
}

export const ACCESS_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const SUPABASE_USER_ID_KEY = "supabase_user_id";
export const AUTH_COOKIE = "has_auth";

export function getApiBaseUrl(): string {
  return API_BASE;
}

export function getAgentApiBase(): string {
  return AGENT_API_BASE;
}

/** Same as the getters, but throws a named error instead of returning "". */
export function requireApiBaseUrl(): string {
  return assertBase(API_BASE, "NEXT_PUBLIC_API_BASE_URL");
}

export function requireAgentApiBase(): string {
  return assertBase(AGENT_API_BASE, "NEXT_PUBLIC_AGENT_API_BASE");
}

export function getSupabaseUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SUPABASE_USER_ID_KEY);
}

export function storeSupabaseUserId(id: string): void {
  localStorage.setItem(SUPABASE_USER_ID_KEY, id);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * The middleware gate (src/middleware.ts) reads this cookie server-side; it
 * can't see localStorage. Every place that extends how long the browser
 * considers itself logged in must renew this cookie too, or the two fall out
 * of sync — a still-active user (access token silently refreshed
 * indefinitely) hits a cookie that quietly expired on its own fixed clock,
 * and any protected route bounces them to /auth while the client still
 * thinks they're logged in.
 */
function renewAuthCookie(): void {
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
}

export function storeTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  renewAuthCookie();
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(SUPABASE_USER_ID_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

function formatApiError(data: Record<string, unknown>, fallback: string): string {
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) return data.detail.map(String).join(" ");
  if (typeof data.non_field_errors === "object" && Array.isArray(data.non_field_errors)) {
    return data.non_field_errors.map(String).join(" ");
  }
  // The API envelope: { success: false, errors: [{ field, message }] }.
  if (Array.isArray(data.errors)) {
    const messages = data.errors
      .map((e) => (e && typeof e === "object" && typeof (e as { message?: unknown }).message === "string" ? (e as { message: string }).message : typeof e === "string" ? e : ""))
      .filter(Boolean);
    if (messages.length > 0) return messages.join(" ");
  }
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] !== "object") return String(value[0]);
    if (typeof value === "string") return value;
  }
  return fallback;
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(formatApiError(data, "Invalid email or password."));
  }

  const data = (await response.json()) as {
    access: string;
    refresh: string;
    supabase_user_id?: string;
    user?: { supabase_user_id?: string };
  };
  storeTokens(data.access, data.refresh);
  const supabaseId = data.supabase_user_id || data.user?.supabase_user_id;
  if (supabaseId) {
    storeSupabaseUserId(supabaseId);
  } else {
    await fetchAndStoreSupabaseUserId();
  }
}

async function fetchAndStoreSupabaseUserId(): Promise<void> {
  try {
    const profile = await apiRequest<{
      supabase_user_id?: string;
    }>(`${API_BASE}/auth/me/`);
    if (profile.supabase_user_id) {
      storeSupabaseUserId(profile.supabase_user_id);
    }
  } catch {
    // Me endpoint may be unavailable during bootstrap; chat will prompt if needed.
  }
}

export async function register(email: string, password: string, fullName = ""): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throw new Error(formatApiError(data, "Registration failed."));
  }

  await login(email, password);
}

/**
 * In-flight refresh, shared by every caller.
 *
 * A dashboard fires several requests at once; when the access token expires
 * they all 401 together. Without this, each one POSTs `token/refresh/`
 * separately and — with refresh-token rotation on — all but the winner present
 * a refresh token the server has already retired, so a recoverable expiry
 * turns into a forced sign-out.
 */
let refreshInFlight: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = performRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function performRefresh(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearTokens();
    return null;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
  } catch {
    // Offline or backend down. The token may well still be valid, so keep it:
    // signing the student out over a dropped connection is the worse failure.
    throw new ApiError(
      "Unable to reach the API server. Check your connection and API base URL.",
      { kind: "network" },
    );
  }

  if (!response.ok) {
    // 5xx is the server's problem, not an expired session — do not sign out.
    if (response.status >= 500) {
      throw new ApiError(`The API server failed while refreshing your session (${response.status}).`, {
        kind: "server",
        status: response.status,
      });
    }
    clearTokens();
    announceAuthExpired();
    return null;
  }

  const data = (await response.json()) as { access: string; refresh?: string };
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
  if (data.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
  }
  renewAuthCookie();
  authExpiredAnnounced = false;
  return data.access;
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  if (refresh) {
    try {
      await fetch(`${API_BASE}/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // Best-effort server logout; always clear local tokens.
    }
  }
  clearTokens();
  invalidateCache();
}

export async function parseResponseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as Record<string, unknown>;
    return formatApiError(data, `Request failed (${response.status}).`);
  } catch {
    return `Request failed (${response.status}).`;
  }
}

/**
 * A raw `fetch` with the access token attached and one silent refresh on 401, for
 * callers that need the Response itself (SSE streams). Network errors still throw.
 */
export async function authedFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const authHeaders = getAuthHeaders();
  if (authHeaders.Authorization) headers.set("Authorization", authHeaders.Authorization);
  const response = await fetch(url, { ...init, headers });
  if (response.status !== 401) return response;
  const newToken = await refreshAccessToken();
  if (!newToken) return response;
  headers.set("Authorization", `Bearer ${newToken}`);
  return fetch(url, { ...init, headers });
}

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const authHeaders = getAuthHeaders();
  if (authHeaders.Authorization) {
    headers.set("Authorization", authHeaders.Authorization);
  }
  if (init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (url.startsWith("/")) {
    // A missing NEXT_PUBLIC_*_BASE leaves the caller with a relative URL.
    requireApiBaseUrl();
  }

  let response: Response;
  try {
    response = await fetch(url, { credentials: "include", ...init, headers });
  } catch {
    throw new ApiError(
      "Unable to reach the API server. Check your connection and API base URL.",
      { kind: "network" },
    );
  }

  if (response.status === 401) {
    // Silent refresh first; `refreshAccessToken` only signs the student out
    // (and announces it) when the refresh itself is genuinely rejected.
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(url, { credentials: "include", ...init, headers });
    } else {
      throw new ApiError("Your session expired. Please sign in again.", {
        kind: "auth",
        status: 401,
      });
    }
  }

  if (!response.ok) {
    throw new ApiError(await parseResponseError(response), {
      kind: response.status >= 500 ? "server" : response.status === 401 ? "auth" : "client",
      status: response.status,
    });
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
