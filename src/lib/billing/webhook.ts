import { WebhookPayload } from "./types";
import { entitlementManager } from "./entitlements";
import { aiLogger } from "../ai/logger";

export class BillingWebhookHandler {
  private processedEventMap: Map<string, number> = new Map();
  private entitlements: typeof entitlementManager;

  constructor(entitlementsInstance?: typeof entitlementManager) {
    this.entitlements = entitlementsInstance || entitlementManager;
  }
  async processWebhook(
    payload: WebhookPayload,
    _signature?: string
  ): Promise<{ success: boolean; eventType: string; isDuplicate: boolean }> {
    void _signature;
    // 1. Idempotency Check: reject duplicate webhook IDs
    if (this.processedEventMap.has(payload.id)) {
      aiLogger.info("billing_webhook_duplicate_skipped", { eventId: payload.id, type: payload.type });
      return { success: true, eventType: payload.type, isDuplicate: true };
    }

    const { userId, plan, status, customerId, subscriptionId } = payload.data;

    switch (payload.type) {
      case "checkout.session.completed":
      case "customer.subscription.updated": {
        const now = Date.now();
        this.entitlements.setSubscription({
          userId,
          plan: plan || "pro",
          status: status || "active",
          customerId,
          subscriptionId,
          currentPeriodStart: now,
          currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
          cancelAtPeriodEnd: false,
        });
        aiLogger.info("subscription_activated", { userId, plan: plan || "pro" });
        break;
      }

      case "customer.subscription.deleted": {
        const existing = this.entitlements.getSubscription(userId);
        this.entitlements.setSubscription({
          ...existing,
          plan: "free",
          status: "cancelled",
        });
        aiLogger.info("subscription_cancelled", { userId });
        break;
      }

      default:
        break;
    }

    this.processedEventMap.set(payload.id, Date.now());
    return { success: true, eventType: payload.type, isDuplicate: false };
  }

  isProcessed(eventId: string): boolean {
    return this.processedEventMap.has(eventId);
  }

  clear(): void {
    this.processedEventMap.clear();
  }
}

export const billingWebhookHandler = new BillingWebhookHandler();
