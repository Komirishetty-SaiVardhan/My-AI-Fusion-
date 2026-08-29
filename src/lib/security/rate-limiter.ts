interface RateLimitRecord {
  timestamps: number[];
}

export class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();

  /**
   * Evaluates if a request identifier (IP, userId) is within allowed rate limits.
   */
  check(
    key: string,
    maxRequests = 60,
    windowMs = 60000
  ): { allowed: boolean; remaining: number; resetTimeMs: number } {
    const now = Date.now();
    let record = this.records.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Filter out timestamps older than the sliding window
    const windowStart = now - windowMs;
    record.timestamps = record.timestamps.filter((t) => t > windowStart);

    const count = record.timestamps.length;
    if (count >= maxRequests) {
      const oldest = record.timestamps[0];
      const resetTimeMs = Math.max(0, oldest + windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetTimeMs,
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: maxRequests - record.timestamps.length,
      resetTimeMs: windowMs,
    };
  }

  reset(key?: string): void {
    if (key) {
      this.records.delete(key);
    } else {
      this.records.clear();
    }
  }
}

export const rateLimiter = new RateLimiter();
