import { EntitlementManager } from "../entitlements";
import { BillingWebhookHandler } from "../webhook";

export async function runBillingTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING SUBSCRIPTION BILLING & ENTITLEMENTS TESTS");
  console.log("=================================================");

  const entitlements = new EntitlementManager();
  const webhookHandler = new BillingWebhookHandler(entitlements);

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`  PASS [${total.toString().padStart(2, "0")}]: ${testName}`);
      passed++;
    } else {
      console.error(`  FAIL [${total.toString().padStart(2, "0")}]: ${testName}`);
      if (details) console.error(`        Details: ${details}`);
      throw new Error(`Test failed: ${testName} - ${details || ""}`);
    }
  }

  const TEST_USER = "user-billing-test-99";

  // ============================================================================
  // Test 1: Default Free Plan Entitlements
  // ============================================================================
  console.log("\n[1] Testing: Default Free Plan Entitlements");
  const freeEnt = entitlements.getEntitlements(TEST_USER);
  assert(freeEnt.plan === "free", "New user starts on Free plan");
  assert(freeEnt.dailyRequestsLimit === 50, "Free plan limit = 50 requests/day");
  assert(freeEnt.isAllowed === true, "Allowed to make requests initially");

  // ============================================================================
  // Test 2: Daily Quota Usage Tracking & Rejection
  // ============================================================================
  console.log("\n[2] Testing: Daily Quota Usage Tracking");
  entitlements.resetUsage(TEST_USER);

  // Consume 49 requests
  for (let i = 0; i < 49; i++) {
    entitlements.recordRequest(TEST_USER);
  }
  const status49 = entitlements.getEntitlements(TEST_USER);
  assert(status49.dailyRequestsUsed === 49, "Tracked 49 used requests");
  assert(status49.isAllowed === true, "50th request still permitted");

  // 50th request (hits limit)
  entitlements.recordRequest(TEST_USER);
  const status50 = entitlements.getEntitlements(TEST_USER);
  assert(status50.quotaExceeded === true, "Quota exceeded triggered on 50th request");
  assert(status50.isAllowed === false, "51st request blocked by server-side entitlement check");

  const overLimitAttempt = entitlements.recordRequest(TEST_USER);
  assert(overLimitAttempt.allowed === false, "recordRequest blocked when over quota");

  // ============================================================================
  // Test 3: Webhook Idempotency & Pro Plan Upgrade
  // ============================================================================
  console.log("\n[3] Testing: Webhook Idempotency & Pro Upgrade");
  const eventId = "evt_checkout_12345";
  const upgradeResult = await webhookHandler.processWebhook({
    id: eventId,
    type: "checkout.session.completed",
    timestamp: Date.now(),
    data: {
      userId: TEST_USER,
      customerId: "cus_stripe_999",
      plan: "pro",
      status: "active",
    },
  });

  assert(upgradeResult.success === true, "Webhook processed successfully");
  assert(upgradeResult.isDuplicate === false, "Initial webhook marked as non-duplicate");

  // Duplicate webhook attempt
  const duplicateResult = await webhookHandler.processWebhook({
    id: eventId,
    type: "checkout.session.completed",
    timestamp: Date.now(),
    data: {
      userId: TEST_USER,
      customerId: "cus_stripe_999",
      plan: "pro",
      status: "active",
    },
  });
  assert(duplicateResult.isDuplicate === true, "Duplicate webhook identified and skipped safely");

  // ============================================================================
  // Test 4: Pro Plan Entitlements Verification
  // ============================================================================
  console.log("\n[4] Testing: Pro Plan Entitlements");
  const proEnt = entitlements.getEntitlements(TEST_USER);
  assert(proEnt.plan === "pro", "User successfully upgraded to Pro plan");
  assert(proEnt.canUseDeepReasoning === true, "Pro users can use deep reasoning");
  assert(proEnt.canUseFullWebResearch === true, "Pro users can use full web research");
  assert(proEnt.dailyRequestsLimit === 2000, "Pro users have 2000 daily requests");
  assert(proEnt.isAllowed === true, "User can request again immediately after upgrade");

  // ============================================================================
  // Test 5: Subscription Cancellation Webhook
  // ============================================================================
  console.log("\n[5] Testing: Subscription Cancellation Webhook");
  const cancelResult = await webhookHandler.processWebhook({
    id: "evt_cancel_67890",
    type: "customer.subscription.deleted",
    timestamp: Date.now(),
    data: {
      userId: TEST_USER,
      customerId: "cus_stripe_999",
    },
  });

  assert(cancelResult.success === true, "Cancellation webhook processed");
  const cancelledEnt = entitlements.getEntitlements(TEST_USER);
  assert(cancelledEnt.plan === "free", "User downgraded to Free plan upon cancellation");

  console.log("\n=================================================");
  console.log(`ALL BILLING & ENTITLEMENTS TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runBillingTestSuite().catch((err) => {
    console.error("Billing test suite failed:", err);
    process.exit(1);
  });
}
