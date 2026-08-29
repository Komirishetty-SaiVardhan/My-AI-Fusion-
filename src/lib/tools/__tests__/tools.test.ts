import { ToolExecutor } from "../executor";
import { ToolRegistry } from "../registry";
import { PermissionManager } from "../permissions";
import { CalculatorTool } from "../tools/calculator";
import { WebSearchTool } from "../tools/web-search";
import { FileSearchTool } from "../tools/file-search";
import { ITool, ToolCallContext } from "../types";

export async function runToolsTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING SECURE TOOL-CALLING FRAMEWORK TESTS");
  console.log("=================================================");

  const registry = new ToolRegistry();
  const permissions = new PermissionManager();
  const executor = new ToolExecutor({ registry, permissions });

  const calc = new CalculatorTool();
  const webSearch = new WebSearchTool();
  const fileSearch = new FileSearchTool();

  registry.registerTool(calc);
  registry.registerTool(webSearch);
  registry.registerTool(fileSearch);

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

  const baseContext: ToolCallContext = {
    userId: "user-123",
    conversationId: "conv-456",
    executionCount: 0,
    maxExecutionsPerTurn: 5,
    timeoutMs: 3000,
  };

  // ============================================================================
  // Test 1: Runtime Argument & Schema Validation
  // ============================================================================
  console.log("\n[1] Testing: Argument & Schema Validation");
  const validCalcRes = await executor.executeTool("calculator", { expression: "12 * 8 + 4" }, baseContext);
  assert(validCalcRes.success === true, "Valid calculator arguments accepted");
  assert((validCalcRes.data as { result: number })?.result === 100, "Calculator returned 100");

  const missingArgRes = await executor.executeTool("calculator", {}, baseContext);
  assert(missingArgRes.success === false, "Missing required expression rejected");
  assert(Boolean(missingArgRes.error?.includes("required")), "Error mentions missing required field");

  const invalidTypeRes = await executor.executeTool("web_search", { query: 12345 }, baseContext);
  assert(invalidTypeRes.success === false, "Invalid argument type rejected");

  // ============================================================================
  // Test 2: Safe Math Evaluation & Code Injection Sandboxing
  // ============================================================================
  console.log("\n[2] Testing: Calculator Sandboxing & Code Injection Prevention");
  const complexMathRes = await executor.executeTool(
    "calculator",
    { expression: "sqrt(144) + 2^4 + round(sin(pi / 2))" },
    baseContext
  );
  assert(complexMathRes.success === true, "Complex math expression evaluated");
  assert((complexMathRes.data as { result: number })?.result === 29, "sqrt(144) [12] + 2^4 [16] + sin(pi/2) [1] = 29");

  // Attempt code injection
  const injection1 = await executor.executeTool(
    "calculator",
    { expression: "process.exit(1)" },
    baseContext
  );
  assert(injection1.success === false, "Malicious process.exit rejected");
  assert(Boolean(injection1.error?.includes("forbidden keyword")), "Identified forbidden keyword");

  const injection2 = await executor.executeTool(
    "calculator",
    { expression: "require('fs').readFileSync('/etc/passwd')" },
    baseContext
  );
  assert(injection2.success === false, "Malicious require('fs') rejected");

  // ============================================================================
  // Test 3: Web Search Tool Execution
  // ============================================================================
  console.log("\n[3] Testing: Web Search Tool Execution");
  const searchRes = await executor.executeTool(
    "web_search",
    { query: "Next.js streaming SSR architecture", maxResults: 3 },
    baseContext
  );
  assert(searchRes.success === true, "Web search executed successfully");
  const searchData = searchRes.data as { results: Array<{ title: string; url: string }> };
  assert(searchData.results.length > 0, "Web search returned results");
  assert(Boolean(searchData.results[0].url), "Result contains valid URL");

  // ============================================================================
  // Test 4: File Search Tool Execution
  // ============================================================================
  console.log("\n[4] Testing: File Search Tool Execution");
  const fileRes = await executor.executeTool(
    "file_search",
    { query: "authentication and security" },
    baseContext
  );
  assert(fileRes.success === true, "File search tool executed successfully");
  assert(Array.isArray((fileRes.data as { results: unknown[] })?.results), "Results formatted as array");

  // ============================================================================
  // Test 5: Execution Timeouts & Failure Recovery
  // ============================================================================
  console.log("\n[5] Testing: Execution Timeout & Recovery");
  const slowTool: ITool<{ delayMs: number }, string> = {
    name: "slow_tool",
    description: "Simulates a slow tool",
    inputSchema: {
      type: "object",
      properties: { delayMs: { type: "number", description: "Delay in ms" } },
    },
    permissions: { level: "computation" },
    isEnabled: true,
    validate: (input) => ({ isValid: true, parsed: input as { delayMs: number } }),
    execute: async (input) => {
      await new Promise((r) => setTimeout(r, input.delayMs || 2000));
      return "Finished";
    },
  };
  registry.registerTool(slowTool);

  const timeoutRes = await executor.executeTool(
    "slow_tool",
    { delayMs: 1500 },
    { ...baseContext, timeoutMs: 200 } // 200ms timeout
  );
  assert(timeoutRes.success === false, "Slow tool timed out as expected");
  assert(Boolean(timeoutRes.error?.includes("timed out")), "Timeout error message produced");

  // ============================================================================
  // Test 6: Infinite Loop Prevention & Turn Execution Limits
  // ============================================================================
  console.log("\n[6] Testing: Loop Prevention & Turn Limits");
  const loopContext: ToolCallContext = {
    ...baseContext,
    executionCount: 5, // Already at maximum limit
    maxExecutionsPerTurn: 5,
  };
  const loopBlockedRes = await executor.executeTool("calculator", { expression: "2 + 2" }, loopContext);
  assert(loopBlockedRes.success === false, "Loop limit enforced when executionCount >= maxLimit");
  assert(Boolean(loopBlockedRes.error?.includes("Infinite loop prevention")), "Loop prevention error message logged");

  // ============================================================================
  // Test 7: Sensitive Tool User Approval Workflow
  // ============================================================================
  console.log("\n[7] Testing: User Approval for Sensitive Tools");
  const sensitiveTool: ITool<{ action: string }, string> = {
    name: "database_flush",
    description: "Sensitive database maintenance action",
    inputSchema: {
      type: "object",
      properties: { action: { type: "string", description: "Maintenance action" } },
    },
    permissions: {
      level: "sensitive_action",
      requiresUserApproval: true,
      dangerous: true,
    },
    isEnabled: true,
    validate: (input) => ({ isValid: true, parsed: input as { action: string } }),
    execute: async (input) => `Executed ${input.action}`,
  };
  registry.registerTool(sensitiveTool);

  // 1. Initial attempt without approval token
  const unapprovedRes = await executor.executeTool("database_flush", { action: "vacuum" }, baseContext);
  assert(unapprovedRes.success === false, "Sensitive tool blocked without approval");
  assert(unapprovedRes.requiresApproval === true, "Requires approval flag set");
  assert(Boolean(unapprovedRes.approvalToken), "Approval requirement token generated");

  // 2. Subsequent attempt with granted approval token
  const approvedContext: ToolCallContext = {
    ...baseContext,
    grantedApprovalTokens: new Set([unapprovedRes.approvalToken!]),
  };
  const approvedRes = await executor.executeTool("database_flush", { action: "vacuum" }, approvedContext);
  assert(approvedRes.success === true, "Sensitive tool succeeded after approval token provided");
  assert(approvedRes.data === "Executed vacuum", "Sensitive tool executed successfully");

  // ============================================================================
  // Test 8: Configurable Enable / Disable Switches
  // ============================================================================
  console.log("\n[8] Testing: Tool Enable / Disable Switches");
  registry.disableTool("calculator");
  const disabledRes = await executor.executeTool("calculator", { expression: "100 / 4" }, baseContext);
  assert(disabledRes.success === false, "Disabled tool was blocked from execution");
  assert(Boolean(disabledRes.error?.includes("currently disabled")), "Error specifies tool is disabled");

  registry.enableTool("calculator");
  const reenabledRes = await executor.executeTool("calculator", { expression: "100 / 4" }, baseContext);
  assert(reenabledRes.success === true, "Re-enabled tool executed successfully");
  assert((reenabledRes.data as { result: number })?.result === 25, "100 / 4 = 25");

  // ============================================================================
  // Test 9: OpenAI Tool Schema Export
  // ============================================================================
  console.log("\n[9] Testing: LLM Function Definition Export");
  const toolDefs = registry.getOpenAIToolDefinitions();
  assert(toolDefs.length >= 3, "Tool definitions generated for all registered tools");
  assert(toolDefs.some((t) => t.function.name === "calculator"), "Calculator tool definition exported");
  assert(toolDefs.some((t) => t.function.name === "web_search"), "Web search tool definition exported");

  console.log("\n=================================================");
  console.log(`ALL TOOL-CALLING FRAMEWORK TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runToolsTestSuite().catch((err) => {
    console.error("Tool test suite failed:", err);
    process.exit(1);
  });
}
