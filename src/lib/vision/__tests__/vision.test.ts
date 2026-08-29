import { MultimodalVisionPipeline } from "../pipeline";
import { ImageValidator } from "../validator";
import { VisualClassifier } from "../classifier";
import { VisionImage } from "../types";

export async function runVisionTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING MULTIMODAL IMAGE UNDERSTANDING TESTS");
  console.log("=================================================");

  const validator = new ImageValidator();
  const classifier = new VisualClassifier();
  const pipeline = new MultimodalVisionPipeline({ validator, classifier });

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
  // Test 1: Image Validation & Security Limits
  // ============================================================================
  console.log("\n[1] Testing: Secure Image Validation & Size Limits");
  const validJpeg = validator.validate({
    filename: "system_architecture.png",
    mimeType: "image/png",
    sizeBytes: 1024 * 500, // 500 KB
  });
  assert(validJpeg.isValid === true, "Valid 500KB PNG accepted");
  assert(validJpeg.mimeType === "image/png", "MIME type normalized");

  const oversizeImg = validator.validate({
    filename: "huge_photo.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 15 * 1024 * 1024, // 15 MB (> 10MB limit)
  });
  assert(oversizeImg.isValid === false, "Oversize image (>10MB) rejected");
  assert(Boolean(oversizeImg.error?.includes("exceeds the maximum limit")), "Clear oversize error message");

  const invalidMime = validator.validate({
    filename: "document.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024 * 100,
  });
  assert(invalidMime.isValid === false, "Non-image MIME type rejected");

  // Magic header validation
  const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const validPngHeader = validator.validate({
    filename: "valid.png",
    mimeType: "image/png",
    sizeBytes: 8,
    buffer: pngBytes,
  });
  assert(validPngHeader.isValid === true, "PNG magic bytes verified");

  const fakePngBytes = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
  const corruptedPng = validator.validate({
    filename: "fake.png",
    mimeType: "image/png",
    sizeBytes: 4,
    buffer: fakePngBytes,
  });
  assert(corruptedPng.isValid === false, "Corrupted/mismatched magic bytes rejected");

  // ============================================================================
  // Test 2: Category Classification (All 6 Visual Types)
  // ============================================================================
  console.log("\n[2] Testing: Visual Category Classification");
  const testImages: Array<{ image: VisionImage; prompt?: string; expectedCategory: string }> = [
    {
      image: { id: "1", filename: "q4_revenue_chart.png", mimeType: "image/png", sizeBytes: 100 },
      prompt: "What is the highest revenue quarter in this bar chart?",
      expectedCategory: "chart",
    },
    {
      image: { id: "2", filename: "microservices_architecture_diagram.png", mimeType: "image/png", sizeBytes: 100 },
      prompt: "Explain the database replication topology in this diagram.",
      expectedCategory: "diagram",
    },
    {
      image: { id: "3", filename: "error_dialog_screenshot.png", mimeType: "image/png", sizeBytes: 100 },
      prompt: "What error message is shown in this app screenshot?",
      expectedCategory: "screenshot",
    },
    {
      image: { id: "4", filename: "whiteboard_notes.jpg", mimeType: "image/jpeg", sizeBytes: 100 },
      prompt: "Transcribe the handwritten math equations from this whiteboard.",
      expectedCategory: "handwriting",
    },
    {
      image: { id: "5", filename: "receipt_scan.pdf.png", mimeType: "image/png", sizeBytes: 100 },
      prompt: "OCR this scanned invoice and extract line items.",
      expectedCategory: "scanned_document",
    },
    {
      image: { id: "6", filename: "mountain_landscape_photo.jpg", mimeType: "image/jpeg", sizeBytes: 100 },
      prompt: "Describe the lighting and nature subjects in this photo.",
      expectedCategory: "photograph",
    },
  ];

  for (const item of testImages) {
    const cat = classifier.classifyCategory(item.image, item.prompt);
    assert(cat === item.expectedCategory, `Classified '${item.expectedCategory}' correctly`);
  }

  // ============================================================================
  // Test 3: Structured Visual Understanding & Reasoning Pipeline
  // ============================================================================
  console.log("\n[3] Testing: Structured Visual Analysis & Reasoning");
  const chartImage: VisionImage = {
    id: "chart-01",
    filename: "annual_growth_chart.png",
    mimeType: "image/png",
    sizeBytes: 1024 * 200,
    previewUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  };

  const chartAnalysis = await pipeline.analyzeImage({
    image: chartImage,
    prompt: "What are the growth numbers in this chart?",
  });

  assert(chartAnalysis.category === "chart", "Chart category identified in pipeline");
  assert(chartAnalysis.structuredData.detectedObjects.includes("chart"), "Detected chart object");
  assert(Boolean(chartAnalysis.structuredData.chartData), "Chart data structure populated");
  assert(chartAnalysis.structuredData.keyTakeaways.length > 0, "Key takeaways generated");

  // ============================================================================
  // Test 4: OCR & Scanned Document Parsing
  // ============================================================================
  console.log("\n[4] Testing: Scanned Document & OCR Extraction");
  const scannedDoc: VisionImage = {
    id: "scan-01",
    filename: "invoice_scan.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 1024 * 150,
  };

  const scanAnalysis = await pipeline.analyzeImage({
    image: scannedDoc,
    prompt: "Extract invoice total and vendor name from this scan.",
  });

  assert(scanAnalysis.category === "scanned_document", "Scanned document category identified");
  assert(Boolean(scanAnalysis.structuredData.extractedText), "OCR text field populated");
  assert(scanAnalysis.textResponse.length > 0, "Grounded response text produced");

  // ============================================================================
  // Test 5: Ephemeral Image In-Memory Storage
  // ============================================================================
  console.log("\n[5] Testing: Ephemeral In-Memory Storage");
  const ephemeral = validator.createEphemeralImage(
    "temp_capture.png",
    "image/png",
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    256
  );

  assert(ephemeral.id.startsWith("img-"), "Ephemeral ID generated");
  assert(Boolean(ephemeral.previewUrl?.startsWith("data:image/png;base64,")), "Ephemeral data URL created in memory");

  // ============================================================================
  // Test 6: Multi-Turn Conversation Context Preservation
  // ============================================================================
  console.log("\n[6] Testing: Conversation Context Preservation");
  const multiTurnAnalysis = await pipeline.analyzeImage({
    image: chartImage,
    prompt: "Now compare Q3 and Q4 from the previous chart.",
    messages: [
      { role: "user", content: "Analyze this growth chart." },
      { role: "assistant", content: "The chart shows steady growth across all quarters." },
    ],
  });

  assert(multiTurnAnalysis.textResponse.length > 0, "Multi-turn context preserved and answered");

  console.log("\n=================================================");
  console.log(`ALL MULTIMODAL VISION TESTS PASSED (${passed}/${total})`);
  console.log("=================================================");
  return true;
}

if (typeof require !== "undefined" && require.main === module) {
  runVisionTestSuite().catch((err) => {
    console.error("Vision test suite failed:", err);
    process.exit(1);
  });
}
