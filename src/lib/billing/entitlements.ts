import { UserEntitlements, UserSubscription } from "./types";

export class EntitlementManager {
  private subscriptions: Map<string, UserSubscription> = new Map();
  private dailyUsage: Map<string, { count: number; date: string }> = new Map();

  private readonly FREE_DAILY_LIMIT = 50;
  private readonly PRO_DAILY_LIMIT = 2000;

  /**
   * Retrieves active subscription state for a user.
   */
  getSubscription(userId: string): UserSubscription {
    const existing = this.subscriptions.get(userId);
    if (existing) return { ...existing };

    // Default to Free Plan
    const now = Date.now();
    const defaultSub: UserSubscription = {
      userId,
      plan: "free",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
      cancelAtPeriodEnd: false,
    };
    this.subscriptions.set(userId, defaultSub);
    return defaultSub;
  }

  /**
   * Calculates real-time server-side entitlements and quotas.
   */
  getEntitlements(userId: string): UserEntitlements {
    const sub = this.getSubscription(userId);
    const today = new Date().toISOString().split("T")[0];
    const usage = this.dailyUsage.get(userId);

    const usedCount = usage && usage.date === today ? usage.count : 0;
    const isPro = sub.plan === "pro" && sub.status === "active";
    const dailyRequestsLimit = isPro ? this.PRO_DAILY_LIMIT : this.FREE_DAILY_LIMIT;
    const quotaExceeded = usedCount >= dailyRequestsLimit;

    return {
      plan: sub.plan,
      canUseDeepReasoning: isPro,
      canUseFullWebResearch: isPro,
      maxUploadSizeBytes: isPro ? 50 * 1024 * 1024 : 10 * 1024 * 1024,
      dailyRequestsLimit,
      dailyRequestsUsed: usedCount,
      isAllowed: !quotaExceeded,
      quotaExceeded,
    };
  }

  /**
   * Records a request and increments daily usage counter.
   */
  recordRequest(userId: string): { allowed: boolean; remaining: number } {
    const entitlements = this.getEntitlements(userId);
    if (!entitlements.isAllowed) {
      return { allowed: false, remaining: 0 };
    }

    const today = new Date().toISOString().split("T")[0];
    let usage = this.dailyUsage.get(userId);
    if (!usage || usage.date !== today) {
      usage = { count: 0, date: today };
      this.dailyUsage.set(userId, usage);
    }

    usage.count++;
    const remaining = Math.max(0, entitlements.dailyRequestsLimit - usage.count);
    return { allowed: true, remaining };
  }

  /**
   * Sets user plan and subscription status.
   */
  setSubscription(sub: UserSubscription): void {
    this.subscriptions.set(sub.userId, { ...sub });
  }

  resetUsage(userId: string): void {
    this.dailyUsage.delete(userId);
  }
}

export const entitlementManager = new EntitlementManager();
