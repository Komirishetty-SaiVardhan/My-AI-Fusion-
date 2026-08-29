import { WebResearchPipeline } from "../pipeline";
import { MockSearchProvider } from "../search-provider";
import { UrlDeduplicator } from "../deduplicator";
import { CitationRenderer } from "../citation";
import { RawSearchResult } from "../types";

export async function runResearchTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING PRODUCTION WEB RESEARCH PIPELINE TESTS");
  console.log("=================================================");

  const mockProvider = new MockSearchProvider();
  const pipeline = new WebResearchPipeline({
    searchProvider: mockProvider,
  });

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
  // Test 1: No Research Required
  // ============================================================================
  console.log("\n[1] Testing: No Research Required");
  const noResearchResult = await pipeline.executeResearch("Hello! What is 2 + 2?");
  assert(noResearchResult.plan.shouldResearch === false, "Trivial query bypassed research");
  assert(noResearchResult.sources.length === 0, "No external sources fetched for trivial query");
  assert(noResearchResult.citations.length === 0, "No citations generated when no research is needed");

  const noResearchDef = await pipeline.executeResearch("Define photosynthesis.");
  assert(noResearchDef.plan.shouldResearch === false, "Timeless definition bypassed research");

  // ============================================================================
  // Test 2: Simple Research
  // ============================================================================
  console.log("\n[2] Testing: Simple Research");
  const simpleResult = await pipeline.executeResearch("What is the current stock price of Apple today?", {
    depth: "simple",
  });
  assert(simpleResult.plan.shouldResearch === true, "Current temporal query triggered research");
  assert(simpleResult.plan.depth === "simple", "Depth is correctly set to simple");
  assert(simpleResult.plan.queries.length === 1, "Simple research generated 1 targeted query");
  assert(simpleResult.sources.length > 0, "Sources retrieved and populated");
  assert(simpleResult.evidence.length > 0, "Evidence snippets extracted");
  assert(simpleResult.facts.length > 0, "Verified facts compiled");
  assert(Boolean(simpleResult.sources[0].domain), "Source domain metadata preserved");

  // ============================================================================
  // Test 3: Deep Research
  // ============================================================================
  console.log("\n[3] Testing: Deep Research");
  const deepResult = await pipeline.executeResearch(
    "Comprehensive market analysis and technical trade-offs of solid state batteries vs lithium ion in 2026",
    { depth: "deep" }
  );
  assert(deepResult.plan.shouldResearch === true, "Complex comparative inquiry triggered research");
  assert(deepResult.plan.depth === "deep", "Depth identified as deep");
  assert(deepResult.plan.queries.length >= 3, `Multi-query decomposition produced ${deepResult.plan.queries.length} sub-queries`);
  assert(deepResult.sources.length >= 3, `Aggregated multiple sources (${deepResult.sources.length} sources)`);
  assert(deepResult.evidence.length >= 3, "Broad multi-source evidence compiled");
  assert(deepResult.synthesizedAnswer.includes("Verified Sourced Findings"), "Structured synthesis sections present");

  // ============================================================================
  // Test 4: Failed Source Handling & Graceful Recovery
  // ============================================================================
  console.log("\n[4] Testing: Failed Source Handling");
  // Set failure on one subquery keyword only
  mockProvider.setSimulateFailure("updates");

  const partialFailResult = await pipeline.executeResearch("Research on quantum computing breakthroughs in 2026", {
    depth: "deep",
  });
  assert(partialFailResult.plan.shouldResearch === true, "Pipeline planned research");
  // One query fails, but other parallel sub-queries succeed
  assert(partialFailResult.sources.length > 0, "Pipeline gracefully recovered and returned remaining sources from surviving queries");
  mockProvider.clearFailures();

  // Test total search outage
  mockProvider.setSimulateFailure("total-outage");
  const totalOutageResult = await pipeline.executeResearch("What is the status of total-outage in 2026?");
  assert(totalOutageResult.sources.length === 0, "Outage handled with empty sources array");
  assert(totalOutageResult.synthesizedAnswer.includes("no relevant sources were returned"), "Outage resulted in polite fallback synthesis");
  mockProvider.clearFailures();

  // ============================================================================
  // Test 5: Duplicate Source Handling & Canonicalization
  // ============================================================================
  console.log("\n[5] Testing: Duplicate Source Handling");
  const deduplicator = new UrlDeduplicator();

  const rawWithDups: RawSearchResult[] = [
    {
      url: "https://www.example.com/research-paper/?utm_source=twitter&utm_medium=social",
      title: "Research Paper Title Short",
      snippet: "Short snippet",
      content: "Short content",
    },
    {
      url: "https://example.com/research-paper#section-1",
      title: "Research Paper Full Title",
      snippet: "Longer detailed snippet with key empirical metrics",
      content: "Longer detailed content with exhaustive proofs and references",
    },
    {
      url: "http://example.com/research-paper/",
      title: "Research Paper Duplicate",
      snippet: "Another duplicate snippet",
    },
    {
      url: "https://other-domain.org/article",
      title: "Distinct Article",
      snippet: "Distinct snippet",
    },
  ];

  const deduped = deduplicator.deduplicate(rawWithDups);
  assert(deduped.length === 2, `4 raw URLs deduplicated to 2 canonical items (got ${deduped.length})`);
  assert(deduped[0].url === "https://example.com/research-paper", `Canonical URL clean (got ${deduped[0].url})`);
  assert(Boolean(deduped[0].content?.includes("Longer detailed content")), "Merged richer content from duplicate");

  // ============================================================================
  // Test 6: Citation Rendering & Hallucination Prevention
  // ============================================================================
  console.log("\n[6] Testing: Citation Rendering & Validation");
  const citationRenderer = new CitationRenderer();

  assert(deepResult.citations.length > 0, "Citations array populated with 1-indexed items");
  assert(deepResult.citations[0].index === 1, "First citation is 1-indexed");
  assert(deepResult.formattedFootnotes.includes("Sourced References"), "Formatted footnotes header generated");
  assert(deepResult.formattedFootnotes.includes(deepResult.citations[0].url), "Footnotes contain markdown links to sources");

  // Test anti-hallucination sanitizer
  const textWithFakeCitation = "This is a real claim [1]. This is an invented claim [99].";
  const sanitized = citationRenderer.sanitizeCitations(textWithFakeCitation, [deepResult.citations[0]]);
  assert(sanitized.includes("[1]"), "Valid citation [1] preserved");
  assert(!sanitized.includes("[99]"), "Hallucinated citation [99] cleanly stripped");

  console.log("\n=================================================");
  console.log(`ALL WEB RESEARCH PIPELINE TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runResearchTestSuite().catch((err) => {
    console.error("Research test suite failed:", err);
    process.exit(1);
  });
}
