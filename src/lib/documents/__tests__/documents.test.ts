import { DocumentManager } from "../manager";
import { DocumentValidator } from "../validator";
import { DocumentVectorStore } from "../vector-store";

export async function runDocumentTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING DOCUMENT INTELLIGENCE & RAG TEST SUITE");
  console.log("=================================================");

  const vectorStore = new DocumentVectorStore();
  const manager = new DocumentManager({ vectorStore });
  const validator = new DocumentValidator();

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
  // Test 1: PDF Upload, Size Limits & Filename Sanitization
  // ============================================================================
  console.log("\n[1] Testing: PDF Upload & Validation");
  const validPdfUpload = validator.validate({
    filename: "../../malicious/path/Quarterly_Report (2026).pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024 * 50, // 50 KB
    content: "--- Page 1 ---\nQuarterly Financial Results for FY2026.\n--- Page 2 ---\nRevenue grew by 42% year-over-year.",
  });

  assert(validPdfUpload.isValid === true, "Valid PDF upload accepted");
  assert(
    !validPdfUpload.sanitizedFilename.includes("/") && !validPdfUpload.sanitizedFilename.includes(".."),
    `Path traversal stripped (got: ${validPdfUpload.sanitizedFilename})`
  );
  assert(validPdfUpload.format === "pdf", "Format identified as PDF");

  // Test oversize limit
  const oversizeUpload = validator.validate({
    filename: "huge.pdf",
    mimeType: "application/pdf",
    sizeBytes: 30 * 1024 * 1024, // 30 MB (exceeds 25MB limit)
  });
  assert(oversizeUpload.isValid === false, "Oversize file (>25MB) rejected");
  assert(Boolean(oversizeUpload.error?.includes("exceeds the maximum limit")), "Appropriate oversize error message");

  // Test dangerous executable extension
  const exeUpload = validator.validate({
    filename: "payload.exe",
    mimeType: "application/octet-stream",
    sizeBytes: 500,
  });
  assert(exeUpload.isValid === false, "Dangerous executable extension rejected");

  // ============================================================================
  // Test 2: Multi-Page Extraction & Metadata Preservation (PDF, DOCX, Markdown)
  // ============================================================================
  console.log("\n[2] Testing: Multi-Page Extraction & Semantic Chunking");
  const pdfSampleContent = `--- Page 1 ---
EXECUTIVE SUMMARY
Quantum computing architectures achieved fault tolerance thresholds in Q1 2026.

--- Page 2 ---
BENCHMARK RESULTS
The superconducting qubit processor demonstrated a 99.98% two-qubit gate fidelity across 256 logical qubits.

--- Page 3 ---
SECURITY IMPLICATIONS
Post-quantum cryptography migration is mandatory for all enterprise database encryption protocols.`;

  const { document: pdfDoc, chunks: pdfChunks } = await manager.uploadAndProcess({
    filename: "quantum_computing_2026.pdf",
    mimeType: "application/pdf",
    sizeBytes: pdfSampleContent.length,
    content: pdfSampleContent,
    title: "Quantum Computing 2026 Report",
  });

  assert(pdfDoc.format === "pdf", "Document recorded with PDF format");
  assert(pdfDoc.pageCount === 3, `Page count accurately preserved (expected 3, got ${pdfDoc.pageCount})`);
  assert(pdfChunks.length >= 3, `Generated ${pdfChunks.length} semantic chunks`);

  // Verify page metadata preservation
  const page2Chunk = pdfChunks.find((c) => c.pageNumber === 2);
  assert(Boolean(page2Chunk), "Chunk with Page 2 metadata exists");
  assert(
    Boolean(page2Chunk?.content.includes("superconducting qubit processor")),
    "Page 2 chunk content accurately preserved"
  );

  // Markdown extraction test
  const mdContent = `# Cloud Infrastructure Guidelines
## Section 1: Kubernetes Deployment
Configure automated pod horizontal autoscaling with CPU threshold at 75%.
## Section 2: PostgreSQL High Availability
Enable multi-region streaming replication with synchronous standby failover.`;

  const { document: mdDoc, chunks: mdChunks } = await manager.uploadAndProcess({
    filename: "cloud_guidelines.md",
    mimeType: "text/markdown",
    sizeBytes: mdContent.length,
    content: mdContent,
  });

  assert(mdDoc.format === "md", "Markdown format detected");
  assert(mdChunks.length >= 2, "Markdown chunks generated");
  const k8sChunk = mdChunks.find((c) => c.content.includes("autoscaling"));
  assert(Boolean(k8sChunk), "Markdown section chunk content matched");

  // ============================================================================
  // Test 3: Vector Retrieval & Cosine Similarity Ranking
  // ============================================================================
  console.log("\n[3] Testing: Isolated Vector Retrieval");

  // Upload an unrelated second document to test strict document isolation
  const cookingContent = `--- Page 1 ---
Traditional Neapolitan Pizza Recipe
Ferment the dough for 48 hours at 18 degrees Celsius using San Marzano tomatoes and fresh mozzarella.`;

  const { document: cookingDoc } = await manager.uploadAndProcess({
    filename: "italian_cooking.pdf",
    mimeType: "application/pdf",
    sizeBytes: cookingContent.length,
    content: cookingContent,
    title: "Italian Culinary Guide",
  });

  // Query PDF document strictly
  const searchResults = await vectorStore.search(
    await (manager as unknown as { embedder: { embedQuery: (q: string) => Promise<number[]> } })[
      "embedder"
    ].embedQuery("qubit gate fidelity and processor benchmarks"),
    {
      query: "qubit gate fidelity",
      documentIds: [pdfDoc.id], // Isolated to PDF Doc
      topK: 3,
    }
  );

  assert(searchResults.length > 0, "Retrieved relevant chunks from target document");
  assert(searchResults[0].chunk.documentId === pdfDoc.id, "Retrieved chunk belongs to target document");
  assert(
    !searchResults.some((r) => r.chunk.documentId === cookingDoc.id),
    "Strict document isolation: Unrelated cooking document was NOT retrieved"
  );

  // ============================================================================
  // Test 4: Question Answering (RAG) with Page & Source References
  // ============================================================================
  console.log("\n[4] Testing: Retrieval-Augmented Generation (RAG) Q&A");
  const ragAnswer = await manager.askDocument("What was the two-qubit gate fidelity achieved in the benchmarks?", {
    documentId: pdfDoc.id,
  });

  assert(ragAnswer.retrievedChunksCount > 0, "RAG retrieved relevant context chunks");
  assert(ragAnswer.citations.length > 0, "RAG populated citations");
  assert(ragAnswer.citations[0].documentTitle === "Quantum Computing 2026 Report", "Citation document title matches");
  assert(ragAnswer.citations[0].pageNumber === 2, `Citation page number accurately referenced Page 2 (got ${ragAnswer.citations[0].pageNumber})`);
  assert(ragAnswer.answer.includes("Page 2"), "Synthesized response includes page citation");

  // ============================================================================
  // Test 5: Nonexistent Document Error Handling
  // ============================================================================
  console.log("\n[5] Testing: Nonexistent Document Handling");
  let nonexistentErrorThrown = false;
  try {
    await manager.askDocument("Any question", { documentId: "nonexistent-doc-999" });
  } catch (err) {
    nonexistentErrorThrown = true;
    assert(err instanceof Error, "Error instance thrown for nonexistent document");
  }
  assert(nonexistentErrorThrown, "Query to nonexistent document threw expected error");

  // ============================================================================
  // Test 6: Clean Document Deletion & Vector Purge
  // ============================================================================
  console.log("\n[6] Testing: Clean Document Deletion");
  const statsBefore = vectorStore.getStats();
  const deleted = await manager.deleteDocument(pdfDoc.id);

  assert(deleted === true, "Document deletion returned true");
  assert(manager.getDocument(pdfDoc.id) === undefined, "Document record purged from registry");

  const statsAfter = vectorStore.getStats();
  assert(statsAfter.documentCount === statsBefore.documentCount - 1, "Document count decremented in vector store");
  assert(statsAfter.chunkCount < statsBefore.chunkCount, "All associated chunks purged from vector store");

  // Verify querying deleted document now fails
  let queryAfterDeleteThrown = false;
  try {
    await manager.askDocument("What was the qubit fidelity?", { documentId: pdfDoc.id });
  } catch {
    queryAfterDeleteThrown = true;
  }
  assert(queryAfterDeleteThrown, "Querying deleted document correctly fails");

  console.log("\n=================================================");
  console.log(`ALL DOCUMENT INTELLIGENCE TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runDocumentTestSuite().catch((err) => {
    console.error("Document test suite failed:", err);
    process.exit(1);
  });
}
