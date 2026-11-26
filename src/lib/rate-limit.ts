/**
 * Fixed-window rate limiter, in memory. It protects one server instance only: every serverless instance has its own
 * counters, so this slows a casual flood but is NOT a real limit. A shared store (for example Redis) must replace it
 * before the review form can go live. The clock is a parameter so tests do not wait.
 */
export interface RateLimiter {
  /** True when this call is allowed; false when `key` already used `limit` calls in the current window. */
  allow(key: string, now?: number): boolean;
}

export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }: { limit: number; windowMs: number; maxKeys?: number }): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    allow(key, now = Date.now()) {
      const current = windows.get(key);
      if (!current || now - current.start >= windowMs) {
        if (windows.size >= maxKeys) {
          for (const [stored, entry] of windows) if (now - entry.start >= windowMs) windows.delete(stored);
          if (windows.size >= maxKeys) return false; // full of live windows: refuse rather than grow without bound
        }
        windows.set(key, { start: now, count: 1 });
        return true;
      }
      if (current.count >= limit) return false;
      current.count += 1;
      return true;
    },
  };
}
