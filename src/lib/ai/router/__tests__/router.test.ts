import { IntelligentAIRouter } from "../router";
import { RequestClassifier } from "../classifier";
import { PolicyManager, DEFAULT_ROUTING_POLICIES } from "../policies";
import { RouterRequest, TaskCategory } from "../types";

interface TestCase {
  category: TaskCategory;
  request: RouterRequest;
  description: string;
}

export const REPRESENTATIVE_QUERIES: TestCase[] = [
  // ============================================================================
  // 1. SIMPLE (6 queries)
  // ============================================================================
  {
    category: "SIMPLE",
    request: { prompt: "Hello! How are you doing today?" },
    description: "Conversational greeting",
  },
  {
    category: "SIMPLE",
    request: { prompt: "Define serendipity." },
    description: "Single-word definition lookup",
  },
  {
    category: "SIMPLE",
    request: { prompt: "2 + 2 = ?" },
    description: "Basic arithmetic computation",
  },
  {
    category: "SIMPLE",
    request: { prompt: "What is the capital of France?" },
    description: "Trivial geographic fact",
  },
  {
    category: "SIMPLE",
    request: { prompt: "What does CPU stand for?" },
    description: "Common acronym definition",
  },
  {
    category: "SIMPLE",
    request: { prompt: "Synonym for cheerful" },
    description: "Synonym inquiry",
  },

  // ============================================================================
  // 2. GENERAL (5 queries)
  // ============================================================================
  {
    category: "GENERAL",
    request: { prompt: "Explain how photosynthesis works in green plants." },
    description: "General scientific explanation",
  },
  {
    category: "GENERAL",
    request: { prompt: "Write an essay discussing the social impact of the industrial revolution." },
    description: "Long-form essay synthesis",
  },
  {
    category: "GENERAL",
    request: { prompt: "Brainstorm 5 creative ideas for a community urban garden." },
    description: "Creative brainstorming session",
  },
  {
    category: "GENERAL",
    request: { prompt: "Give me a step-by-step recipe for homemade sourdough bread." },
    description: "Culinary instruction guide",
  },
  {
    category: "GENERAL",
    request: { prompt: "What are the primary literary themes in Hamlet by Shakespeare?" },
    description: "Literary analysis & overview",
  },

  // ============================================================================
  // 3. REASONING (6 queries)
  // ============================================================================
  {
    category: "REASONING",
    request: { prompt: "Prove that the square root of 2 is an irrational number using a mathematical proof." },
    description: "Formal mathematical proof",
  },
  {
    category: "REASONING",
    request: { prompt: "Analyze the time complexity and trade-offs between B-Trees and LSM-Trees." },
    description: "Deep algorithmic trade-off analysis",
  },
  {
    category: "REASONING",
    request: { prompt: "Solve this logic puzzle: Three boxes are labeled incorrectly..." },
    description: "Formal logic deduction puzzle",
  },
  {
    category: "REASONING",
    request: { prompt: "Calculate the derivative of f(x) = x^3 * e^(2x)." },
    description: "Calculus mathematical derivation",
  },
  {
    category: "REASONING",
    request: { prompt: "Explain Nash Equilibrium in the context of the Prisoner's Dilemma game theory." },
    description: "Formal game theory analysis",
  },
  {
    category: "REASONING",
    request: { prompt: "Why is the Halting Problem undecidable? Explain step-by-step logical deduction." },
    description: "Theoretical computer science deduction",
  },

  // ============================================================================
  // 4. RESEARCH (5 queries)
  // ============================================================================
  {
    category: "RESEARCH",
    request: { prompt: "What is the current weather in Tokyo right now?" },
    description: "Real-time weather query",
  },
  {
    category: "RESEARCH",
    request: { prompt: "What is the current stock price of NVIDIA today?" },
    description: "Live financial market data",
  },
  {
    category: "RESEARCH",
    request: { prompt: "Who won the 2024 presidential election?" },
    description: "Current temporal political event",
  },
  {
    category: "RESEARCH",
    request: { prompt: "Search the web for the latest breakthrough in fusion energy." },
    description: "Explicit web research instruction",
  },
  {
    category: "RESEARCH",
    request: { prompt: "What are the market trends in 2025 for renewable energy investment?" },
    description: "Forward-looking temporal research",
  },

  // ============================================================================
  // 5. CODING (6 queries)
  // ============================================================================
  {
    category: "CODING",
    request: { prompt: "Write a TypeScript function to debounce an async callback with generics." },
    description: "Type-safe TypeScript implementation",
  },
  {
    category: "CODING",
    request: { prompt: "Debug this React hook: why is my useEffect causing an infinite re-render loop?" },
    description: "React lifecycle bug debugging",
  },
  {
    category: "CODING",
    request: { prompt: "Write an optimized PostgreSQL SQL query with an index to join user orders." },
    description: "Database SQL query design",
  },
  {
    category: "CODING",
    request: { prompt: "Implement a binary search tree algorithm in Python." },
    description: "Data structure implementation in Python",
  },
  {
    category: "CODING",
    request: { prompt: "Regex to match valid email addresses according to RFC 5322." },
    description: "Regular expression pattern design",
  },
  {
    category: "CODING",
    request: { prompt: "How do I fix this TypeError: Cannot read properties of undefined (reading 'map')?" },
    description: "Runtime stack trace error resolution",
  },

  // ============================================================================
  // 6. VISION (4 queries)
  // ============================================================================
  {
    category: "VISION",
    request: {
      prompt: "What is shown in this image?",
      attachments: [{ type: "image", mimeType: "image/jpeg" }],
    },
    description: "Image attachment multimodal inspection",
  },
  {
    category: "VISION",
    request: {
      prompt: "Explain the architecture in this diagram.",
      attachments: [{ type: "image", mimeType: "image/png" }],
    },
    description: "Diagram understanding via attachment",
  },
  {
    category: "VISION",
    request: { prompt: "Describe this image and identify all objects in the photo." },
    description: "Text-prompted visual description",
  },
  {
    category: "VISION",
    request: { prompt: "OCR this receipt and extract the line items." },
    description: "Text-prompted receipt OCR task",
  },

  // ============================================================================
  // 7. FILE_ANALYSIS (4 queries)
  // ============================================================================
  {
    category: "FILE_ANALYSIS",
    request: {
      prompt: "Summarize the key findings from this paper.",
      attachments: [{ type: "file", filename: "financial_report.pdf", mimeType: "application/pdf" }],
    },
    description: "PDF attachment document comprehension",
  },
  {
    category: "FILE_ANALYSIS",
    request: {
      prompt: "Find outliers in this dataset.",
      attachments: [{ type: "file", filename: "users.csv", mimeType: "text/csv" }],
    },
    description: "CSV data file parsing",
  },
  {
    category: "FILE_ANALYSIS",
    request: { prompt: "Summarize this PDF document and highlight the main conclusions." },
    description: "Text-prompted PDF summarization",
  },
  {
    category: "FILE_ANALYSIS",
    request: { prompt: "Parse this CSV file and calculate the average revenue." },
    description: "Text-prompted tabular CSV processing",
  },
];

export async function runRouterTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING INTELLIGENT AI ROUTER TEST SUITE (36+ QUERIES)");
  console.log("=================================================");

  const classifier = new RequestClassifier();
  const policyManager = new PolicyManager(DEFAULT_ROUTING_POLICIES);
  const router = new IntelligentAIRouter(classifier, policyManager);

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

  // 1. Run all representative query classifications
  console.log("\n--- [A] Testing 36 Representative Query Classifications ---");
  for (const testCase of REPRESENTATIVE_QUERIES) {
    const classification = classifier.classify(testCase.request);
    const decision = router.route(testCase.request);

    assert(
      classification.category === testCase.category,
      `${testCase.category.padEnd(14)} | ${testCase.description}`,
      `Expected ${testCase.category}, got ${classification.category} (Confidence: ${classification.confidence.toFixed(2)})`
    );

    // Verify decision contains required observability fields
    assert(
      Boolean(decision.requestId && decision.primaryModel && decision.routeReason),
      `Observability audit populated for "${testCase.description}"`
    );
  }

  // 2. Test Confidence-Based Escalation
  console.log("\n--- [B] Testing Confidence-Based Escalation ---");
  const customPolicyManager = new PolicyManager();
  customPolicyManager.setPolicy("SIMPLE", {
    confidenceThreshold: 0.95, // Set very high threshold to force escalation
    escalationTarget: "GENERAL",
  });
  const escalationRouter = new IntelligentAIRouter(classifier, customPolicyManager);

  const borderlineRequest: RouterRequest = { prompt: "Good day friend" };
  const escalatedDecision = escalationRouter.route(borderlineRequest);

  assert(
    escalatedDecision.wasEscalated === true,
    "Low confidence triggers wasEscalated = true",
    `wasEscalated was ${escalatedDecision.wasEscalated}`
  );
  assert(
    escalatedDecision.finalCategory === "GENERAL",
    "Category escalated from SIMPLE to GENERAL",
    `Final category: ${escalatedDecision.finalCategory}`
  );
  assert(
    escalatedDecision.selectedModel === customPolicyManager.getPolicy("GENERAL").primaryModel,
    "Escalated selectedModel adopts stronger tier model",
    `Selected model: ${escalatedDecision.selectedModel}`
  );

  // 3. Test Timeout-Based Fallback Execution
  console.log("\n--- [C] Testing Timeout & Error Fallback Chains ---");
  let attemptCount = 0;
  const attemptedModels: string[] = [];

  const failingExecutor = async (model: string, timeoutMs: number) => {
    attemptCount++;
    attemptedModels.push(model);
    if (attemptCount === 1) {
      throw new Error(`Simulated timeout after ${timeoutMs}ms on primary model ${model}`);
    }
    return `Success response from fallback model ${model}`;
  };

  const codingRequest: RouterRequest = { prompt: "Write a quicksort in Rust" };
  const fallbackResult = await router.executeWithFallback(codingRequest, failingExecutor);

  assert(attemptCount === 2, "Fallback was invoked on primary failure (2 attempts made)");
  assert(fallbackResult.decision.fallbackAttempted === true, "decision.fallbackAttempted is true");
  assert(
    fallbackResult.result.includes("Success response from fallback"),
    "Execution successfully completed using fallback model"
  );

  // 4. Test Observability Buffer
  console.log("\n--- [D] Testing Observability Ring Buffer ---");
  const recent = router.getRecentDecisions(5);
  assert(recent.length > 0, "Recent decisions retrieved from audit log");
  assert(typeof recent[0].timestamp === "number", "Decision timestamp recorded");

  console.log("\n=================================================");
  console.log(`ALL 40+ ROUTER TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runRouterTestSuite().catch((err) => {
    console.error("Router test suite failed:", err);
    process.exit(1);
  });
}
