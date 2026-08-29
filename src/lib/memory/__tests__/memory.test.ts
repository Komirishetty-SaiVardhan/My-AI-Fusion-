import { MemoryService } from "../service";
import { IsolatedMemoryStore } from "../store";
import { MemoryEvaluator } from "../evaluator";

export async function runMemoryTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING SAFE AI MEMORY SYSTEM TEST SUITE");
  console.log("=================================================");

  const store = new IsolatedMemoryStore();
  const evaluator = new MemoryEvaluator();
  const service = new MemoryService({ store, evaluator });

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

  const USER_A = "user-alice-101";
  const USER_B = "user-bob-202";

  // ============================================================================
  // Test 1: Saving Explicit & Inferred Memories
  // ============================================================================
  console.log("\n[1] Testing: Saving Explicit & Inferred Memories");
  const explicitMem = await service.saveExplicitMemory(
    USER_A,
    "Remember that my favorite web framework is Next.js with Tailwind CSS"
  );
  assert(explicitMem.type === "explicit", "Explicit memory type assigned");
  assert(explicitMem.metadata.importance === 5, "Explicit memory given highest importance (5)");
  assert(explicitMem.content.includes("Next.js"), "Explicit memory content preserved");

  const inferredPref = await service.evaluateAndSave(
    USER_A,
    "I prefer TypeScript strict mode and always use functional React components."
  );
  assert(Boolean(inferredPref), "Inferred preference saved");
  assert(inferredPref?.type === "user_preference", "Type categorized as user_preference");
  assert(inferredPref?.metadata.stabilityScore === 0.9, "High stability score assigned to preference");

  const projectRule = await service.evaluateAndSave(
    USER_A,
    "Our tech stack uses PostgreSQL with Prisma ORM and strict foreign keys.",
    { projectId: "proj-ecommerce" }
  );
  assert(Boolean(projectRule), "Project architecture memory saved");
  assert(projectRule?.type === "project", "Type categorized as project");
  assert(projectRule?.projectId === "proj-ecommerce", "Project ID associated with memory");

  // ============================================================================
  // Test 2: Stability Filtering & Secret Rejection
  // ============================================================================
  console.log("\n[2] Testing: Stability Filtering & Zero-Secrets Guard");
  // Ephemeral noise rejection
  const ephemeralMem = await service.evaluateAndSave(USER_A, "I am eating a pizza for lunch today.");
  assert(ephemeralMem === null, "Ephemeral conversational noise was NOT saved");

  const weatherMem = await service.evaluateAndSave(USER_A, "It is raining outside today.");
  assert(weatherMem === null, "Temporary weather statement was NOT saved");

  // Zero-Secrets rejection
  let secretBlocked = false;
  try {
    await service.saveExplicitMemory(USER_A, "Remember my secret api key sk-1234567890abcdef1234567890abcdef");
  } catch (err) {
    secretBlocked = true;
    assert(err instanceof Error && err.message.includes("Security Guard"), "Security Guard error message");
  }
  assert(secretBlocked, "API key secret explicitly blocked from storage");

  const passwordCandidate = await service.evaluateAndSave(USER_A, "My database password=SuperSecretPassword123!");
  assert(passwordCandidate === null, "Password candidate automatically rejected by evaluator");

  // ============================================================================
  // Test 3: Relevance-Ranked Retrieval
  // ============================================================================
  console.log("\n[3] Testing: Relevance-Ranked Memory Retrieval");
  const queryResults = await service.retrieveMemories(USER_A, "What framework and language should I use?");
  assert(queryResults.length > 0, "Retrieved relevant memories for query");
  assert(
    queryResults[0].memory.content.includes("Next.js") || queryResults[0].memory.content.includes("TypeScript"),
    "Top ranked memory matches technology question"
  );
  assert(queryResults[0].relevanceScore > 0.5, "Relevance score reflects high importance");

  // Test prompt formatting helper
  const promptContext = service.formatMemoriesForPrompt(queryResults);
  assert(promptContext.includes("User Preferences & Stored Context"), "Formatted header present");
  assert(promptContext.includes("Next.js"), "Memory text present in prompt context");

  // ============================================================================
  // Test 4: Memory Deletion
  // ============================================================================
  console.log("\n[4] Testing: Memory Deletion");
  const memListBefore = service.listMemories(USER_A);
  const toDelete = memListBefore[0];
  const deleted = await service.deleteMemory(USER_A, toDelete.id);

  assert(deleted === true, "Memory deleted successfully");
  const memListAfter = service.listMemories(USER_A);
  assert(memListAfter.length === memListBefore.length - 1, "Memory count decremented");
  assert(!memListAfter.some((m) => m.id === toDelete.id), "Deleted memory no longer in list");

  // ============================================================================
  // Test 5: Disabling & Re-enabling Memory
  // ============================================================================
  console.log("\n[5] Testing: Disabling & Re-enabling Memory");
  service.setMemoryEnabled(USER_A, false);
  assert(service.isMemoryEnabled(USER_A) === false, "User A memory disabled");

  // When disabled, retrieval returns empty
  const disabledResults = await service.retrieveMemories(USER_A, "What is my tech stack?");
  assert(disabledResults.length === 0, "Retrieval returns empty when memory is disabled");

  // When disabled, saving is blocked
  const disabledSave = await service.evaluateAndSave(USER_A, "I prefer Python over JavaScript.");
  assert(disabledSave === null, "Inferred saving blocked when memory is disabled");

  // Re-enable memory
  service.setMemoryEnabled(USER_A, true);
  assert(service.isMemoryEnabled(USER_A) === true, "User A memory re-enabled");
  const reenabledResults = await service.retrieveMemories(USER_A, "tech stack");
  assert(reenabledResults.length > 0, "Retrieval works again after re-enabling");

  // ============================================================================
  // Test 6: Strict Multi-Tenant User Isolation
  // ============================================================================
  console.log("\n[6] Testing: Strict Multi-Tenant User Isolation");
  // User B has no memories
  const userBMemories = service.listMemories(USER_B);
  assert(userBMemories.length === 0, "User B starts with 0 memories");

  // User B queries for User A's topic
  const userBRetrieval = await service.retrieveMemories(USER_B, "What is my favorite web framework and language?");
  assert(userBRetrieval.length === 0, "Strict User Isolation: User B cannot retrieve User A's memories");

  // User B cannot delete User A's memory
  const userADocId = memListAfter[0]?.id;
  if (userADocId) {
    const unauthorizedDelete = await service.deleteMemory(USER_B, userADocId);
    assert(unauthorizedDelete === false, "User B cannot delete User A's memory");
  }

  // Clear all memories for User A
  await service.clearAllMemories(USER_A);
  assert(service.listMemories(USER_A).length === 0, "All User A memories cleared");

  console.log("\n=================================================");
  console.log(`ALL SAFE AI MEMORY TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runMemoryTestSuite().catch((err) => {
    console.error("Memory test suite failed:", err);
    process.exit(1);
  });
}
