import { createHash } from "crypto";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export class SpeedCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxEntries: number;
  private defaultTtlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(options?: { maxEntries?: number; defaultTtlMs?: number }) {
    this.maxEntries = options?.maxEntries || 500;
    this.defaultTtlMs = options?.defaultTtlMs || 10 * 60 * 1000; // 10 minutes
  }

  /**
   * Generates a deterministic SHA-256 cache key from namespace and payload.
   */
  generateKey(namespace: string, payload: unknown): string {
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    const hash = createHash("sha256").update(`${namespace}:${raw}`).digest("hex");
    return `${namespace}:${hash.substring(0, 16)}`;
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    entry.lastAccessed = Date.now();
    this.hits++;
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTtlMs;
    const now = Date.now();

    // Evict oldest item if at capacity
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      expiresAt: now + ttl,
      lastAccessed: now,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): { size: number; hits: number; misses: number; hitRatePercent: number } {
    const total = this.hits + this.misses;
    const hitRatePercent = total > 0 ? Number(((this.hits / total) * 100).toFixed(1)) : 0;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRatePercent,
    };
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

export const speedCache = new SpeedCache();
