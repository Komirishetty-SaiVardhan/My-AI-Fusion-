import { AutoModeOrchestrator } from "../orchestrator";
import { AutoProgressState } from "../types";

export async function runAutoTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING AUTO MODE ORCHESTRATOR TESTS");
  console.log("=================================================");

  const orchestrator = new AutoModeOrchestrator();
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
  // Test 1: User Request: Laptop Research & Comparison
  // ============================================================================
  console.log("\n[1] Testing: Laptop Research & Comparison Intent");
  const laptopPlan = orchestrator.plan(
    "Research the best engineering laptop under ₹70,000 and compare the top 5."
  );
  assert(laptopPlan.needsWebSearch === true, "Auto-detected web research requirement");
  assert(laptopPlan.needsComparisonFormat === true, "Auto-detected comparison table requirement");
  assert(laptopPlan.needsCitations === true, "Auto-detected citation requirement");
  assert(laptopPlan.searchQueries.length >= 2, "Decomposed prompt into multiple focused search queries");

  // ============================================================================
  // Test 2: Math Calculation Intent
  // ============================================================================
  console.log("\n[2] Testing: Math Calculation Intent");
  const mathPlan = orchestrator.plan("Calculate 450 * 12 + 800");
  assert(mathPlan.needsCalculation === true, "Auto-detected calculation requirement");
  assert(mathPlan.targetCapability === "tools", "Target capability set to tools");

  // ============================================================================
  // Test 3: Deep Step-by-Step Reasoning Intent
  // ============================================================================
  console.log("\n[3] Testing: Deep Step-by-Step Reasoning Intent");
  const reasoningPlan = orchestrator.plan(
    "Explain step-by-step how optimistic locking works in distributed databases."
  );
  assert(reasoningPlan.needsReasoning === true, "Auto-detected reasoning requirement");

  // ============================================================================
  // Test 4: End-to-End Execution & Progress State Callbacks
  // ============================================================================
  console.log("\n[4] Testing: End-to-End Execution & Progress Sequence");
  const progressEmitted: AutoProgressState[] = [];

  const executionRes = await orchestrator.execute({
    prompt: "Research the best engineering laptop under ₹70,000 and compare the top 5.",
    onProgress: (state) => progressEmitted.push(state),
  });

  assert(progressEmitted.includes("Understanding"), "Emitted 'Understanding' stage");
  assert(progressEmitted.includes("Searching"), "Emitted 'Searching' stage");
  assert(progressEmitted.includes("Analyzing"), "Emitted 'Analyzing' stage");
  assert(progressEmitted.includes("Preparing answer"), "Emitted 'Preparing answer' stage");

  // Verify response formatting
  assert(executionRes.text.includes("Acer Nitro") || executionRes.text.includes("Lenovo"), "Structured comparison generated");
  assert(executionRes.text.includes("|"), "Markdown table formatting included");
  assert(executionRes.text.includes("[1]"), "Citations embedded in response");

  // ============================================================================
  // Test 5: Advanced Execution Details Metadata
  // ============================================================================
  console.log("\n[5] Testing: Advanced Execution Details Metadata");
  assert(executionRes.details.toolsUsed.includes("web_search"), "Recorded 'web_search' in toolsUsed");
  assert(executionRes.details.sources.length > 0, "Recorded sources in execution details");
  assert(executionRes.details.executionTimeMs > 0, "Execution duration tracked");
  assert(Boolean(executionRes.details.modelRoute), "Model route identified for inspection");

  console.log("\n=================================================");
  console.log(`ALL AUTO MODE TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runAutoTestSuite().catch((err) => {
    console.error("Auto mode test suite failed:", err);
    process.exit(1);
  });
}
