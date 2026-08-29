import { AIEvaluator } from "../evaluator";

export async function runEvalTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING AI EVALUATION FRAMEWORK TEST SUITE");
  console.log("=================================================");

  const evaluator = new AIEvaluator();
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

  // Run full evaluation
  const { summary, results } = await evaluator.runEvaluation();

  assert(summary.totalTests >= 8, "Evaluated at least 8 benchmark tests across all categories");
  assert(summary.passedCount === summary.totalTests, `All ${summary.totalTests} benchmark test cases passed`);
  assert(summary.passRatePercent === 100, "100% benchmark pass rate achieved");
  assert(summary.averageAccuracyScore >= 0.8, "Average accuracy score >= 80%");
  assert(summary.averageLatencyMs >= 0, "Average latency computed across benchmark tests");
  assert(results.length === summary.totalTests, "Detailed result list matches total test count");

  // Verify all 8 categories are evaluated
  const expectedCategories = [
    "simple_questions",
    "reasoning",
    "mathematics",
    "coding",
    "research",
    "citations",
    "document_qa",
    "image_understanding",
  ];

  for (const cat of expectedCategories) {
    assert(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean((summary.categoryBreakdown as any)[cat]),
      `Category '${cat}' evaluated in benchmark summary`
    );
  }

  console.log("\n=================================================");
  console.log(`ALL EVALUATION TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runEvalTestSuite().catch((err) => {
    console.error("Eval test suite failed:", err);
    process.exit(1);
  });
}
