import {
  layoutHandwriting,
  generatePageSvg,
  parseHandwrittenBlock,
  PAPER_THEMES,
  INK_THEMES,
  FONT_THEMES,
} from "../engine";
import { HandwritingConfig } from "../types";

export async function runHandwritingTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING DETERMINISTIC HANDWRITING SUITE");
  console.log("=================================================");

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

  // Test 1: Theme maps completeness
  console.log("\n[1] Testing: Theme Maps and Presets");
  assert(Boolean(PAPER_THEMES.lined), "Lined notebook paper theme exists");
  assert(Boolean(PAPER_THEMES["legal-pad"]), "Legal pad theme exists");
  assert(Boolean(PAPER_THEMES.blank), "Blank paper theme exists");
  assert(Boolean(PAPER_THEMES.grid), "Grid graph paper theme exists");
  assert(Boolean(PAPER_THEMES.parchment), "Vintage parchment theme exists");
  assert(Boolean(PAPER_THEMES.chalkboard), "Chalkboard theme exists");

  assert(Boolean(INK_THEMES.blue), "Blue ink exists");
  assert(Boolean(INK_THEMES["royal-blue"]), "Royal blue ink exists");
  assert(Boolean(INK_THEMES.black), "Black ink exists");
  assert(Boolean(INK_THEMES["gel-black"]), "Gel black ink exists");
  assert(Boolean(INK_THEMES.red), "Red ink exists");
  assert(Boolean(INK_THEMES.emerald), "Emerald ink exists");
  assert(Boolean(INK_THEMES.pencil), "Pencil ink exists");
  assert(Boolean(INK_THEMES.white), "White chalk exists");

  assert(Boolean(FONT_THEMES.caveat), "Caveat font exists");
  assert(Boolean(FONT_THEMES.kalam), "Kalam font exists");
  assert(Boolean(FONT_THEMES.patrick), "Patrick Hand font exists");
  assert(Boolean(FONT_THEMES.architect), "Architect font exists");
  assert(Boolean(FONT_THEMES.apple), "Homemade Apple font exists");
  assert(Boolean(FONT_THEMES.dancing), "Dancing Script font exists");
  assert(Boolean(FONT_THEMES.indie), "Indie Flower font exists");
  assert(Boolean(FONT_THEMES.shadows), "Shadows Into Light font exists");

  // Test 2: Verbatim text preservation
  console.log("\n[2] Testing: Exact Verbatim Text Preservation");
  const testPhrase = "The quick brown fox jumps over 13 lazy dogs! Exact spelling: Supercalifragilisticexpialidocious.";
  const config: HandwritingConfig = {
    text: testPhrase,
    paper: "lined",
    ink: "blue",
    font: "caveat",
  };
  const result = layoutHandwriting(config);
  assert(result.totalPages === 1, "Single page layout produced");
  assert(result.pages.length === 1, "Page array matches totalPages count");
  assert(result.totalWords === 12, "Accurate word count calculated");
  const reconstructed = result.pages[0].lines.join(" ");
  assert(reconstructed.includes("Supercalifragilisticexpialidocious"), "Exact complex word preserved");
  assert(reconstructed.includes("13 lazy dogs!"), "Punctuation and numbers preserved");

  // Test 3: Multi-page pagination
  console.log("\n[3] Testing: Multi-Page Pagination");
  const longParagraphs = Array.from({ length: 40 }, (_, i) => `Paragraph ${i + 1}: Line with deterministic content for page boundary testing.`);
  const multiResult = layoutHandwriting({
    text: longParagraphs.join("\n\n"),
    paper: "lined",
    ink: "royal-blue",
    font: "kalam",
    title: "Exam Revision Notes",
  });
  assert(multiResult.totalPages > 1, `Multi-page pagination created ${multiResult.totalPages} pages`);
  assert(multiResult.pages.length === multiResult.totalPages, "All pages generated");
  for (let i = 0; i < multiResult.pages.length; i++) {
    assert(multiResult.pages[i].pageNumber === i + 1, `Page ${i + 1} has correct index`);
    assert(multiResult.pages[i].totalPages === multiResult.totalPages, `Page ${i + 1} has correct totalPages`);
  }

  // Test 4: SVG generation
  console.log("\n[4] Testing: SVG Generation");
  const svg = generatePageSvg(multiResult.pages[0], multiResult.config);
  assert(svg.includes("<svg") && svg.includes("</svg>"), "Valid SVG container generated");
  assert(svg.includes("Exam Revision Notes"), "Title rendered into SVG");
  assert(svg.includes("Page: 1 of"), "Pagination header rendered into SVG");

  // Test 5: Code block parsing with metadata
  console.log("\n[5] Testing: Markdown Code Block Header Parsing");
  const codeBlock = `Title: Physics Assignment 1
Paper: legal-pad
Ink: gel-black
Font: architect
---
F = m * a
Energy E = m * c^2
Exact formula derivation preserved with absolute fidelity.`;
  const parsed = parseHandwrittenBlock(codeBlock);
  assert(parsed.title === "Physics Assignment 1", "Parsed title header");
  assert(parsed.paper === "legal-pad", "Parsed paper header");
  assert(parsed.ink === "gel-black", "Parsed ink header");
  assert(parsed.font === "architect", "Parsed font header");
  assert(parsed.text.includes("F = m * a"), "Extracted verbatim body text");

  // Test 6: Plain code block parsing without header
  console.log("\n[6] Testing: Plain Code Block without Metadata");
  const plain = "Simple handwritten note with no header.";
  const parsedPlain = parseHandwrittenBlock(plain);
  assert(parsedPlain.text === plain, "Body text equals input text");
  assert(parsedPlain.paper === undefined, "No paper header detected");

  console.log("\n=================================================");
  console.log(`ALL ${passed}/${total} HANDWRITING TESTS PASSED SUCCESSFULLY`);
  console.log("=================================================\n");
  return true;
}

// Auto-run if executed directly via tsx
if (process.argv[1]?.includes("handwriting.test.ts")) {
  runHandwritingTestSuite().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}
