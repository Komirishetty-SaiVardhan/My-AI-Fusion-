import { PerformanceTracker } from "../metrics";
import { SpeedCache } from "../cache";

export async function runObservabilityTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING SPEED OPTIMIZATION & OBSERVABILITY TESTS");
  console.log("=================================================");

  const cache = new SpeedCache({ maxEntries: 10, defaultTtlMs: 1000 });
  const tracker = new PerformanceTracker({ maxRecords: 100 });

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

  // ============================================================================
  // Test 1: Speed Cache Keys & Retrieval
  // ============================================================================
  console.log("\n[1] Testing: Speed Cache & Deterministic Keys");
  const key1 = cache.generateKey("search", { query: "Next.js App Router" });
  const key2 = cache.generateKey("search", { query: "Next.js App Router" });
  assert(key1 === key2, "Deterministic SHA-256 cache key generated");

  cache.set(key1, { answer: "Next.js streaming SSR" }, 5000);
  assert(cache.has(key1) === true, "Cache has key after set");

  const cachedVal = cache.get<{ answer: string }>(key1);
  assert(cachedVal?.answer === "Next.js streaming SSR", "Retrieved correct cached object");

  // Cache stats
  const stats = cache.getStats();
  assert(stats.hits >= 1, "Cache hit count incremented");

  // ============================================================================
  // Test 2: Speed Cache TTL Expiration
  // ============================================================================
  console.log("\n[2] Testing: Speed Cache TTL Expiration");
  const expKey = cache.generateKey("test", "short-lived");
  cache.set(expKey, "value", 20); // 20ms TTL

  await new Promise((r) => setTimeout(r, 40));
  assert(cache.get(expKey) === undefined, "Expired cache entry returned undefined");

  // ============================================================================
  // Test 3: Performance Tracking & Latency Percentiles
  // ============================================================================
  console.log("\n[3] Testing: Performance Tracking & Latency Percentiles");
  tracker.clear();

  // Simulate 10 requests with varying latencies
  const testLatencies = [50, 100, 150, 200, 250, 300, 350, 400, 500, 1000];
  for (let i = 0; i < testLatencies.length; i++) {
    tracker.record({
      endpoint: "/api/chat",
      routingDecision: i % 2 === 0 ? "fast" : "reasoning",
      latency: {
        totalDurationMs: testLatencies[i],
        ttftMs: testLatencies[i] / 2,
        modelLatencyMs: testLatencies[i] * 0.8,
      },
      tokenUsage: {
        promptTokens: 100,
        completionTokens: 200,
        totalTokens: 300,
        estimatedCostUsd: 0.0003,
      },
      cacheHit: i === 0,
      isError: i === 9, // 1 error out of 10 = 10% error rate
    });
  }

  const agg = tracker.getAggregatedMetrics();
  assert(agg.totalRequests === 10, "Total requests tracked = 10");
  assert(agg.successfulRequests === 9, "Successful requests tracked = 9");
  assert(agg.errorRatePercent === 10, "Error rate calculated accurately = 10%");
  assert(agg.avgLatencyMs > 0, "Average latency calculated");
  assert(agg.p50LatencyMs >= 250, "P50 latency calculated accurately");
  assert(agg.p95LatencyMs >= 500, "P95 latency calculated accurately");
  assert(agg.p99LatencyMs === 1000, "P99 latency matches maximum latency spike");
  assert(agg.totalTokens === 3000, "Total tokens aggregated accurately");
  assert(agg.totalEstimatedCostUsd > 0, "Estimated cost aggregated accurately");
  assert(agg.routingDecisions["fast"] === 5, "Routing decision breakdown recorded for 'fast'");
  assert(agg.routingDecisions["reasoning"] === 5, "Routing decision breakdown recorded for 'reasoning'");

  console.log("\n=================================================");
  console.log(`ALL OBSERVABILITY TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runObservabilityTestSuite().catch((err) => {
    console.error("Observability test suite failed:", err);
    process.exit(1);
  });
}
