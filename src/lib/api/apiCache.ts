/**
 * Client-side API cache (memory + sessionStorage). No Redis.
 * Stale-while-revalidate: return fresh-enough cache instantly, refresh in background.
 */

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
  staleAt: number;
};

const memory = new Map<string, CacheEntry<unknown>>();
const STORAGE_PREFIX = "jeepath_api_cache:";
const inFlight = new Map<string, Promise<unknown>>();

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function readSession<T>(key: string): CacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

function writeSession<T>(key: string, entry: CacheEntry<T>): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    // quota / private mode — memory still works
  }
}

function getEntry<T>(key: string): CacheEntry<T> | null {
  const mem = memory.get(key) as CacheEntry<T> | undefined;
  if (mem) return mem;
  const session = readSession<T>(key);
  if (session) {
    memory.set(key, session as CacheEntry<unknown>);
    return session;
  }
  return null;
}

function setEntry<T>(key: string, data: T, ttlMs: number, staleMs?: number): void {
  const now = Date.now();
  const entry: CacheEntry<T> = {
    data,
    expiresAt: now + ttlMs,
    staleAt: now + (staleMs ?? Math.floor(ttlMs * 0.6)),
  };
  memory.set(key, entry as CacheEntry<unknown>);
  writeSession(key, entry);
}

export const CacheTTL = {
  me: 60_000,
  dashboard: 90_000,
  progress: 180_000,
  roadmap: 60_000,
  /**
   * Short on purpose: the queue is now mutable (complete/dismiss), so a stale
   * card is worse than a round trip. Mutations also call `primeCache` with the
   * queue the server rebuilt, so the cache is corrected without a refetch.
   */
  sandboxQueue: 15_000,
  classroom: 30_000,
  chapters: 600_000,
  chatHistory: 60_000,
  chatHistoryDetail: 300_000,
} as const;

/**
 * Write a value straight into the cache — for when a mutation response already
 * contains the freshly rebuilt read model, so refetching it would be waste.
 */
export function primeCache<T>(key: string, data: T, ttlMs: number): void {
  setEntry(key, data, ttlMs);
}

export function cacheKey(parts: Array<string | number | null | undefined>): string {
  return parts.filter((p) => p != null && p !== "").join(":");
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memory.clear();
    if (typeof window !== "undefined") {
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k?.startsWith(STORAGE_PREFIX)) keys.push(k);
      }
      keys.forEach((k) => sessionStorage.removeItem(k));
    }
    return;
  }
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
  if (typeof window !== "undefined") {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX) && k.includes(prefix)) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  }
}

/** Drop user-scoped product reads after mutations. */
export function invalidateUserProductCache(): void {
  invalidateCache("dashboard");
  invalidateCache("progress");
  invalidateCache("roadmap");
  invalidateCache("sandbox");
  invalidateCache("classroom");
  invalidateCache("me");
}

/**
 * Cached GET with stale-while-revalidate.
 * - Fresh hit: return immediately
 * - Stale hit: return immediately, refresh in background
 * - Miss: await network
 */
export async function cachedGet<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  options?: { force?: boolean }
): Promise<T> {
  const now = Date.now();
  const existing = options?.force ? null : getEntry<T>(key);

  if (existing && existing.expiresAt > now) {
    if (existing.staleAt <= now && !inFlight.has(key)) {
      const refresh = fetcher()
        .then((data) => {
          setEntry(key, data, ttlMs);
          return data;
        })
        .finally(() => inFlight.delete(key));
      inFlight.set(key, refresh);
    }
    return existing.data;
  }

  if (inFlight.has(key)) {
    return inFlight.get(key) as Promise<T>;
  }

  const pending = fetcher()
    .then((data) => {
      setEntry(key, data, ttlMs);
      return data;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, pending);
  return pending;
}

/** Peek without network — for instant UI paint. */
export function peekCache<T>(key: string): T | null {
  const entry = getEntry<T>(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) return null;
  return entry.data;
}
