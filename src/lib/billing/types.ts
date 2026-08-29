export type PlanTier = "free" | "pro";

export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "trialing";

export interface UserSubscription {
  userId: string;
  plan: PlanTier;
  status: SubscriptionStatus;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  customerId?: string;
  subscriptionId?: string;
}

export interface UserEntitlements {
  plan: PlanTier;
  canUseDeepReasoning: boolean;
  canUseFullWebResearch: boolean;
  maxUploadSizeBytes: number;
  dailyRequestsLimit: number;
  dailyRequestsUsed: number;
  isAllowed: boolean;
  quotaExceeded: boolean;
}

export interface WebhookPayload {
  id: string;
  type:
    | "checkout.session.completed"
    | "customer.subscription.updated"
    | "customer.subscription.deleted"
    | "invoice.payment_succeeded";
  timestamp: number;
  data: {
    userId: string;
    customerId: string;
    subscriptionId?: string;
    plan?: PlanTier;
    status?: SubscriptionStatus;
  };
}
