import { OllamaAdapter } from "../index";
import { aiRouter } from "../../../router";
import { AIProviderError } from "../../../errors";

export async function runOllamaTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING OLLAMA / LOCAL AI ADAPTER TESTS");
  console.log("=================================================");

  const adapter = new OllamaAdapter({ baseUrl: "http://localhost:11434", defaultModel: "llama3.2" });
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
  // Test 1: Configuration & Availability
  // ============================================================================
  console.log("\n[1] Testing: Local AI Adapter Configuration");
  assert(adapter.id === "ollama", "Adapter ID is 'ollama'");
  assert(adapter.isAvailable() === true, "Local AI adapter is available without paid cloud keys");
  assert(adapter.getBaseUrl() === "http://localhost:11434", "Base URL resolved to http://localhost:11434");
  assert(adapter.getDefaultModel() === "llama3.2", "Default model resolved to llama3.2");

  // ============================================================================
  // Test 2: AI Router Local Model Mapping
  // ============================================================================
  console.log("\n[2] Testing: AIRouter Local Model Routing");
  const llamaAdapter = aiRouter.getAdapter(undefined, "llama3.2");
  assert(llamaAdapter.id === "ollama", "llama3.2 routed to Ollama adapter");

  const qwenAdapter = aiRouter.getAdapter(undefined, "qwen2.5-coder");
  assert(qwenAdapter.id === "ollama", "qwen2.5-coder routed to Ollama adapter");

  const deepseekAdapter = aiRouter.getAdapter(undefined, "deepseek-r1");
  assert(deepseekAdapter.id === "ollama", "deepseek-r1 routed to Ollama adapter");

  const explicitLocal = aiRouter.getAdapter("local");
  assert(explicitLocal.id === "ollama", "Explicit 'local' provider routed to Ollama adapter");

  // ============================================================================
  // Test 3: Offline Ollama Error Normalization
  // ============================================================================
  console.log("\n[3] Testing: Connection & Error Normalization");
  const offlineAdapter = new OllamaAdapter({ baseUrl: "http://127.0.0.1:19999" }); // Non-existent port
  let caughtOfflineError = false;
  let offlineErrorMessage = "";

  try {
    await offlineAdapter.generateText({ messages: "test prompt" });
  } catch (err) {
    if (err instanceof AIProviderError) {
      caughtOfflineError = true;
      offlineErrorMessage = err.message;
    }
  }

  assert(caughtOfflineError === true, "Caught AIProviderError when Ollama is offline");
  assert(
    offlineErrorMessage.includes("Ollama is not running") || offlineErrorMessage.includes("ollama serve"),
    "Actionable instruction ('ollama serve') provided in error message"
  );

  // ============================================================================
  // Test 4: Simulated Error Recovery
  // ============================================================================
  console.log("\n[4] Testing: Simulated Error Recovery");
  let caughtSimulated = false;
  try {
    await adapter.generateText({ messages: "hello", simulateError: true });
  } catch (err) {
    if (err instanceof AIProviderError) {
      caughtSimulated = true;
    }
  }
  assert(caughtSimulated === true, "Simulated error triggered AIProviderError cleanly");

  console.log("\n=================================================");
  console.log(`ALL OLLAMA / LOCAL AI TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runOllamaTestSuite().catch((err) => {
    console.error("Ollama test suite failed:", err);
    process.exit(1);
  });
}
