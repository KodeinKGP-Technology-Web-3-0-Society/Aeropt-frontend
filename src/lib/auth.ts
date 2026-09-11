import { invalidateCache } from "@/lib/apiCache";

/** Django (:8000) is the only auth authority. Do not call the agent for login/register. */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  (process.env.NEXT_PUBLIC_CHAT_API_BASE?.replace(/\/chat\/?$/, "") ?? "http://127.0.0.1:8000/api/v1");

export const AGENT_API_BASE =
  process.env.NEXT_PUBLIC_AGENT_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8001";

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
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
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

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearTokens();
    return null;
  }

  const response = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = (await response.json()) as { access: string; refresh?: string };
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
  if (data.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
  }
  renewAuthCookie();
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

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const authHeaders = getAuthHeaders();
  if (authHeaders.Authorization) {
    headers.set("Authorization", authHeaders.Authorization);
  }
  if (init?.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, { credentials: "include", ...init, headers });
  } catch {
    throw new Error("Unable to reach the API server. Check your connection and API base URL.");
  }

  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(url, { credentials: "include", ...init, headers });
    }
  }

  if (!response.ok) {
    throw new Error(await parseResponseError(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
