import { GoogleAdapter } from "../index";
import { aiRouter } from "../../../router";
import { AIProviderError } from "../../../errors";

export async function runGoogleTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING GOOGLE GEMINI PROVIDER TESTS");
  console.log("=================================================");

  const adapter = new GoogleAdapter({ defaultModel: "gemini-2.5-flash" });
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
  console.log("\n[1] Testing: Google Gemini Configuration");
  assert(adapter.id === "google", "Adapter ID is 'google'");
  assert(adapter.name === "Google Gemini", "Adapter name is 'Google Gemini'");
  assert(adapter.getDefaultModel() === "gemini-2.5-flash", "Default model resolved to gemini-2.5-flash");

  // ============================================================================
  // Test 2: Missing Key Error Handling
  // ============================================================================
  console.log("\n[2] Testing: Unconfigured Key Error Handling");
  const unconfiguredAdapter = new GoogleAdapter({ apiKey: "your_gemini_key_here" });
  assert(unconfiguredAdapter.isAvailable() === false, "Placeholder key marked unavailable");

  let caughtMissingKey = false;
  let missingKeyMessage = "";
  try {
    await unconfiguredAdapter.generateText({ messages: "hello" });
  } catch (err) {
    if (err instanceof AIProviderError) {
      caughtMissingKey = true;
      missingKeyMessage = err.message;
    }
  }
  assert(caughtMissingKey === true, "Throws AIProviderError when GEMINI_API_KEY is not configured");
  assert(
    missingKeyMessage.includes("GEMINI_API_KEY") || missingKeyMessage.includes(".env.local"),
    "Helpful guidance pointing to GEMINI_API_KEY in .env.local"
  );

  // ============================================================================
  // Test 3: AIRouter Model Mapping
  // ============================================================================
  console.log("\n[3] Testing: AIRouter Gemini Model Routing");
  const flashAdapter = aiRouter.getAdapter(undefined, "gemini-2.5-flash");
  assert(flashAdapter.id === "google", "gemini-2.5-flash routed to Google adapter");

  const proAdapter = aiRouter.getAdapter(undefined, "gemini-1.5-pro");
  assert(proAdapter.id === "google", "gemini-1.5-pro routed to Google adapter");

  const explicitGemini = aiRouter.getAdapter("gemini");
  assert(explicitGemini.id === "google", "Explicit 'gemini' provider routed to Google adapter");

  // ============================================================================
  // Test 4: Simulated Error Recovery
  // ============================================================================
  console.log("\n[4] Testing: Simulated Error Recovery");
  const liveMockAdapter = new GoogleAdapter({ apiKey: "AIzaSy_test_key_for_testing" });
  let caughtSimulated = false;
  try {
    await liveMockAdapter.generateText({ messages: "test", simulateError: true });
  } catch (err) {
    if (err instanceof AIProviderError) {
      caughtSimulated = true;
    }
  }
  assert(caughtSimulated === true, "Simulated error triggered AIProviderError cleanly");

  console.log("\n=================================================");
  console.log(`ALL GOOGLE GEMINI TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runGoogleTestSuite().catch((err) => {
    console.error("Google Gemini test suite failed:", err);
    process.exit(1);
  });
}
