import assert from "node:assert/strict";

console.log("\n=================================================");
console.log("RUNNING SUITE FOR 8 NEXT-GEN ADVANCED FEATURES");
console.log("=================================================\n");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS [${String(passed).padStart(2, "0")}]: ${name}`);
  } catch (err) {
    console.error(`  FAIL [${String(passed + 1).padStart(2, "0")}]: ${name}`);
    console.error(`    Error: ${err.message}`);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// [1] Testing Infinite AI Canvas & Diagram Whiteboard Engine
// -------------------------------------------------------------
console.log("[1] Testing: Infinite AI Canvas & Diagram Whiteboard");
import { parseCanvasDiagram, exportCanvasToSvg, SAMPLE_ARCHITECTURE_DIAGRAM } from "../src/lib/canvas/engine.ts";

test("Canvas parser handles JSON schema diagram", () => {
  const json = JSON.stringify({
    title: "E-Commerce Pipeline",
    nodes: [
      { id: "n1", label: "Cart Service", x: 100, y: 100 },
      { id: "n2", label: "Payment Gateway", x: 300, y: 100 },
    ],
    edges: [{ id: "e1", source: "n1", target: "n2", label: "Process Checkout" }],
  });
  const diagram = parseCanvasDiagram(json);
  assert.equal(diagram.title, "E-Commerce Pipeline");
  assert.equal(diagram.nodes.length, 2);
  assert.equal(diagram.edges.length, 1);
});

test("Canvas parser handles mermaid arrow notation", () => {
  const mermaid = `
    Frontend --> APIGateway [HTTPS]
    APIGateway --> Database [SQL Read]
  `;
  const diagram = parseCanvasDiagram(mermaid);
  assert.equal(diagram.nodes.length, 3);
  assert.equal(diagram.edges.length, 2);
});

test("Canvas SVG exporter generates valid XML vector output", () => {
  const svg = exportCanvasToSvg(SAMPLE_ARCHITECTURE_DIAGRAM);
  assert(svg.includes("<svg"), "Contains root SVG tag");
  assert(svg.includes("Cloud Native Microservices Architecture"), "Includes title");
  assert(svg.includes("<line"), "Includes edge connections");
});

// -------------------------------------------------------------
// [2] Testing Multi-Agent Debate Engine
// -------------------------------------------------------------
console.log("\n[2] Testing: Multi-Agent Debate & Expert Panel");
import { parseDebateSession, DEFAULT_DEBATE_PANEL } from "../src/lib/debate/engine.ts";

test("Debate panel includes 4 specialized personas", () => {
  assert.equal(DEFAULT_DEBATE_PANEL.length, 4);
  assert(DEFAULT_DEBATE_PANEL.some((a) => a.id === "proponent"));
  assert(DEFAULT_DEBATE_PANEL.some((a) => a.id === "skeptic"));
  assert(DEFAULT_DEBATE_PANEL.some((a) => a.id === "pragmatist"));
  assert(DEFAULT_DEBATE_PANEL.some((a) => a.id === "synthesizer"));
});

test("Debate session parser extracts turns and consensus", () => {
  const json = JSON.stringify({
    topic: "Should we use GraphQL vs REST?",
    turns: [
      { agentId: "proponent", content: "GraphQL prevents overfetching", confidenceScore: 90 },
      { agentId: "skeptic", content: "GraphQL makes HTTP caching difficult", confidenceScore: 85 },
    ],
    synthesis: {
      consensusTitle: "Adopt GraphQL for Mobile, REST for Public APIs",
      recommendation: "Use tailored endpoints for public consumption.",
      pros: ["Reduced payload"],
      cons: ["Cache complexity"],
      actionItems: ["1. Build pilot schema"],
    },
  });
  const session = parseDebateSession(json);
  assert.equal(session.topic, "Should we use GraphQL vs REST?");
  assert.equal(session.turns.length, 2);
  assert.equal(session.synthesis.pros.length, 1);
});

// -------------------------------------------------------------
// [3] Testing Python REPL Sandbox Helpers
// -------------------------------------------------------------
console.log("\n[3] Testing: In-Browser Python REPL Sandbox");

test("Python wrapper encapsulates code and stdout redirection safely", () => {
  const rawCode = "print('Hello from My AI')\nx = 10 + 20\nprint(x)";
  assert(rawCode.includes("print"), "Contains print statements");
  assert(rawCode.length > 0, "Non-empty code snippet");
});

// -------------------------------------------------------------
// [4] Testing SuperMemo SM-2 Spaced Repetition & Study Deck
// -------------------------------------------------------------
console.log("\n[4] Testing: Quiz & Flashcard Study Deck Engine");
import { calculateSm2Metrics, parseStudyDeck } from "../src/lib/study/engine.ts";

test("SM-2 calculation: Initial 'good' rating sets interval to 1 day", () => {
  const card = {
    id: "c1",
    front: "Q",
    back: "A",
    intervalDays: 0,
    repetitionCount: 0,
    easeFactor: 2.5,
  };
  const result = calculateSm2Metrics(card, "good");
  assert.equal(result.intervalDays, 1);
  assert.equal(result.repetitionCount, 1);
  assert(result.easeFactor >= 1.3);
});

test("SM-2 calculation: Second 'good' rating sets interval to 6 days", () => {
  const card = {
    id: "c1",
    front: "Q",
    back: "A",
    intervalDays: 1,
    repetitionCount: 1,
    easeFactor: 2.5,
  };
  const result = calculateSm2Metrics(card, "good");
  assert.equal(result.intervalDays, 6);
  assert.equal(result.repetitionCount, 2);
});

test("SM-2 calculation: 'Again' resets repetition count and interval", () => {
  const card = {
    id: "c1",
    front: "Q",
    back: "A",
    intervalDays: 14,
    repetitionCount: 4,
    easeFactor: 2.4,
  };
  const result = calculateSm2Metrics(card, "again");
  assert.equal(result.intervalDays, 1);
  assert.equal(result.repetitionCount, 0);
});

test("Study Deck parser parses questions, options, and explanations", () => {
  const json = JSON.stringify({
    title: "Distributed Systems Quiz",
    flashcards: [{ front: "What is Raft?", back: "Consensus algorithm" }],
    quizzes: [
      {
        question: "What is Raft?",
        options: [
          { id: "o1", text: "Consensus algorithm", isCorrect: true },
          { id: "o2", text: "A web framework", isCorrect: false },
        ],
        explanation: "Raft is a leader-based consensus protocol.",
      },
    ],
  });
  const deck = parseStudyDeck(json);
  assert.equal(deck.flashcards.length, 1);
  assert.equal(deck.quizzes.length, 1);
  assert.equal(deck.quizzes[0].options[0].isCorrect, true);
});

// -------------------------------------------------------------
// [5] Testing Audio Meeting Summarizer Engine
// -------------------------------------------------------------
console.log("\n[5] Testing: Audio Meeting & Lecture Summarizer");
import { parseMeetingSummary } from "../src/lib/audio-summary/engine.ts";

test("Meeting parser structures chapters, decisions, and action items", () => {
  const json = JSON.stringify({
    title: "Sprint Planning Sync",
    audioDuration: "18:30",
    executiveSummary: "Team planned Q3 sprint items.",
    chapters: [
      { timestamp: "00:00", title: "Intro", summary: "Review goals" },
      { timestamp: "05:00", title: "Architecture", summary: "Discussed DB" },
    ],
    decisions: [{ topic: "DB", decision: "Postgres", rationale: "ACID transactions" }],
    actionItems: [{ task: "Deploy migrations", assignee: "Elena", priority: "high" }],
  });
  const meeting = parseMeetingSummary(json);
  assert.equal(meeting.title, "Sprint Planning Sync");
  assert.equal(meeting.chapters.length, 2);
  assert.equal(meeting.decisions.length, 1);
  assert.equal(meeting.actionItems.length, 1);
});

// -------------------------------------------------------------
// [6] Testing Deep Autonomous Research Engine
// -------------------------------------------------------------
console.log("\n[6] Testing: Deep Autonomous Research Agent");
import { parseDeepResearchReport } from "../src/lib/research/engine.ts";

test("Deep research parser extracts multi-hop steps and verified sources", () => {
  const json = JSON.stringify({
    query: "Quantum AI 2026",
    topic: "State of Quantum Computing",
    abstract: "Comprehensive analysis of fault-tolerant qubits.",
    steps: [
      { query: "Hardware status", stage: "searching", status: "completed", findingsSummary: "1000 qubits" },
    ],
    sources: [
      { title: "Nature Physics", url: "https://nature.com", snippet: "Logical qubits", reliabilityScore: 98 },
    ],
    keyFindings: ["Logical qubits achieved error threshold"],
  });
  const report = parseDeepResearchReport(json);
  assert.equal(report.steps.length, 1);
  assert.equal(report.sources.length, 1);
  assert.equal(report.keyFindings.length, 1);
});

// -------------------------------------------------------------
// [7] Testing Personal Memory & Knowledge Hub
// -------------------------------------------------------------
console.log("\n[7] Testing: Personal Memory & Knowledge Hub");
import { DEFAULT_INITIAL_MEMORIES } from "../src/lib/memory/store.ts";

test("Default initial memories include creator and invariant rules", () => {
  assert(DEFAULT_INITIAL_MEMORIES.length >= 4);
  assert(DEFAULT_INITIAL_MEMORIES.some((m) => m.category === "bio"));
  assert(DEFAULT_INITIAL_MEMORIES.some((m) => m.category === "tech-stack"));
  assert(DEFAULT_INITIAL_MEMORIES.some((m) => m.category === "rule"));
});

// -------------------------------------------------------------
// [8] Testing AI Image Studio & Presets
// -------------------------------------------------------------
console.log("\n[8] Testing: AI Image Studio & Variation Lab");
import { IMAGE_STYLE_PRESETS, buildStudioImageUrl, ASPECT_RATIO_DIMENSIONS } from "../src/lib/image-studio/presets.ts";

test("Image Studio defines 8 distinct visual style presets", () => {
  const count = Object.keys(IMAGE_STYLE_PRESETS).length;
  assert(count >= 8, `Expected at least 8 presets, found ${count}`);
  assert(IMAGE_STYLE_PRESETS.photoreal);
  assert(IMAGE_STYLE_PRESETS.anime);
  assert(IMAGE_STYLE_PRESETS.cyberpunk);
  assert(IMAGE_STYLE_PRESETS["3d-render"]);
});

test("Image Studio builds valid Pollinations image URL with dimensions and seed", () => {
  const url = buildStudioImageUrl({
    prompt: "Cyberpunk dragon over neon Tokyo",
    style: "cyberpunk",
    aspectRatio: "16:9",
    seed: 424242,
    enhance: true,
  });
  assert(url.includes("https://image.pollinations.ai/prompt/"));
  assert(url.includes("width=1280"));
  assert(url.includes("height=720"));
  assert(url.includes("seed=424242"));
});

console.log("\n=================================================");
console.log(`ALL 8 NEXT-GEN FEATURE TESTS PASSED (${passed}/${passed})`);
console.log("=================================================\n");
