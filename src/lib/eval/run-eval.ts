import { aiEvaluator } from "./evaluator";

export async function runEvaluationCLI(): Promise<void> {
  console.log("================================================================================");
  console.log("             MY AI — PRODUCTION BENCHMARK EVALUATION HARNESS                   ");
  console.log("================================================================================");
  console.log("Evaluating AI across 8 capabilities: Simple QA, Reasoning, Math, Coding,");
  console.log("Research, Grounded Citations, Document QA, and Image Understanding...\n");

  const startTime = Date.now();
  const { summary, results } = await aiEvaluator.runEvaluation();
  const totalDuration = Date.now() - startTime;

  console.log("--------------------------------------------------------------------------------");
  console.log("  TEST CASE RESULTS BREAKDOWN");
  console.log("--------------------------------------------------------------------------------");

  for (const r of results) {
    const status = r.passed ? "✅ PASS" : "❌ FAIL";
    console.log(
      `[${status}] [${r.category.padEnd(18)}] ${r.question.slice(0, 38).padEnd(38)} (${r.latencyMs}ms, acc: ${(
        r.accuracyScore * 100
      ).toFixed(0)}%)`
    );
  }

  console.log("\n================================================================================");
  console.log("  BENCHMARK CAPABILITY SUMMARY");
  console.log("================================================================================");
  console.log("Category                  | Total | Passed | Pass Rate | Avg Latency");
  console.log("--------------------------+-------+--------+-----------+------------");

  for (const [cat, stat] of Object.entries(summary.categoryBreakdown)) {
    console.log(
      `${cat.padEnd(25)} |   ${stat.total.toString().padStart(2)}  |    ${stat.passed
        .toString()
        .padStart(2)}  |   ${(stat.passRatePercent.toString() + "%").padStart(6)}  |   ${(
        stat.avgLatencyMs.toString() + "ms"
      ).padStart(6)}`
    );
  }

  console.log("================================================================================");
  console.log(`TOTAL TESTS RUN       : ${summary.totalTests}`);
  console.log(`PASSED                : ${summary.passedCount}/${summary.totalTests} (${summary.passRatePercent}%)`);
  console.log(`AVERAGE ACCURACY      : ${(summary.averageAccuracyScore * 100).toFixed(1)}%`);
  console.log(`AVERAGE LATENCY       : ${summary.averageLatencyMs}ms`);
  console.log(`TOTAL EVAL DURATION   : ${totalDuration}ms`);
  console.log(`ESTIMATED RUN COST    : $${summary.totalEstimatedCostUsd.toFixed(5)}`);
  console.log("================================================================================\n");

  if (summary.passedCount < summary.totalTests) {
    console.error("Evaluation failed: Some test cases did not pass.");
    process.exit(1);
  } else {
    console.log("🎉 ALL BENCHMARK TESTS PASSED — SYSTEM PRODUCTION READY!");
  }
}

if (typeof require !== "undefined" && require.main === module) {
  runEvaluationCLI().catch((err) => {
    console.error("Evaluation run error:", err);
    process.exit(1);
  });
}
