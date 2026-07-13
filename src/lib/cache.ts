// ============================================================
// DINA v2: IN-MEMORY CACHE — Reduce DB queries for hot paths
// ============================================================
// Note: Vercel serverless lambdas are stateless per invocation,
// but warm lambdas reuse module scope. This cache helps when:
// - Multiple requests hit the same warm lambda within TTL
// - Polling endpoints hit same lambda repeatedly
// Cache hits = 0 DB queries = 0 network transfer from Neon.
// ============================================================

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<any>>()

/**
 * Get cached data if still valid, otherwise return null.
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

/**
 * Set cache with TTL in seconds.
 */
export function setCached<T>(key: string, data: T, ttlSeconds: number = 60): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

/**
 * Invalidate specific cache key.
 */
export function invalidateCache(key: string): void {
  cache.delete(key)
}

/**
 * Invalidate all cache keys matching a prefix.
 */
export function invalidateCachePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

/**
 * Wrap an async function with cache.
 * Cache HIT = return cached data (no DB call)
 * Cache MISS = call function, cache result, return
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = getCached<T>(key)
  if (cached !== null) return cached

  const fresh = await fn()
  setCached(key, fresh, ttlSeconds)
  return fresh
}

// Common cache keys
export const CACHE_KEYS = {
  allCustomers: 'dina:allCustomers',
  customerStats: 'dina:customerStats',
  bankDistribution: 'dina:bankDistribution',
  stageDistribution: 'dina:stageDistribution',
  bankConfig: 'dina:bankConfig',
  dashboardStats: 'dashboard:stats',
} as const
