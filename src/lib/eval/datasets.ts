import { EvaluationTestCase } from "./types";

export const EVALUATION_DATASET: EvaluationTestCase[] = [
  // 1. Simple Questions
  {
    id: "simple-01",
    category: "simple_questions",
    difficulty: "easy",
    question: "What is the capital of France?",
    expectedBehavior: "Provide concise factual answer: Paris.",
    requiredKeywords: ["Paris", "France"],
    expectedRoute: "fast",
  },
  {
    id: "simple-02",
    category: "simple_questions",
    difficulty: "easy",
    question: "What is the boiling point of water in Celsius?",
    expectedBehavior: "State 100 degrees Celsius.",
    requiredKeywords: ["100"],
    expectedRoute: "fast",
  },

  // 2. Reasoning
  {
    id: "reason-01",
    category: "reasoning",
    difficulty: "medium",
    question: "If a farmer has 17 sheep and all but 9 run away, how many sheep are left?",
    expectedBehavior: "Deduce that 9 sheep remain.",
    requiredKeywords: ["9", "left", "remain"],
    expectedRoute: "reasoning",
  },
  {
    id: "reason-02",
    category: "reasoning",
    difficulty: "hard",
    question: "Explain step-by-step why the Halting Problem is undecidable using proof by contradiction.",
    expectedBehavior: "Detail Turing machine contradiction proof step-by-step.",
    requiredKeywords: ["Turing", "contradiction", "halt"],
    expectedRoute: "reasoning",
  },

  // 3. Mathematics
  {
    id: "math-01",
    category: "mathematics",
    difficulty: "easy",
    question: "Calculate sqrt(144) + 25 * 4",
    expectedBehavior: "Compute accurately to 112.",
    requiredKeywords: ["112"],
    expectedTool: "calculator",
  },
  {
    id: "math-02",
    category: "mathematics",
    difficulty: "medium",
    question: "What is 2^10 divided by 16?",
    expectedBehavior: "Compute accurately to 64.",
    requiredKeywords: ["64"],
    expectedTool: "calculator",
  },

  // 4. Coding
  {
    id: "code-01",
    category: "coding",
    difficulty: "easy",
    question: "Write a TypeScript function to reverse a string in place or using built-in methods.",
    expectedBehavior: "Provide clean strongly-typed TypeScript function.",
    requiredKeywords: ["function", "string", "split", "reverse"],
    expectedRoute: "coding",
  },
  {
    id: "code-02",
    category: "coding",
    difficulty: "medium",
    question: "Implement a debounce hook in React 19 with cleanup timeout on unmount.",
    expectedBehavior: "Return custom React hook using useEffect and setTimeout.",
    requiredKeywords: ["useEffect", "setTimeout", "clearTimeout"],
    expectedRoute: "coding",
  },

  // 5. Research
  {
    id: "research-01",
    category: "research",
    difficulty: "medium",
    question: "Research the best engineering laptop under ₹70,000 and compare specifications.",
    expectedBehavior: "Perform web research and return comparative analysis.",
    requiredKeywords: ["RTX", "RAM", "price"],
    expectedTool: "web_search",
    expectedRoute: "research",
    requiresCitation: true,
  },

  // 6. Citations
  {
    id: "citation-01",
    category: "citations",
    difficulty: "medium",
    question: "Find the latest benchmarks for Next.js 16 App Router server actions and cite sources.",
    expectedBehavior: "Ground statements in [1] citations without inventing fake references.",
    requiredKeywords: ["[1]"],
    requiresCitation: true,
    expectedTool: "web_search",
  },

  // 7. Document QA
  {
    id: "doc-01",
    category: "document_qa",
    difficulty: "medium",
    question: "Search our uploaded engineering guidelines for password hashing policies.",
    expectedBehavior: "Retrieve document chunks and cite exact sections.",
    requiredKeywords: ["hashing", "security"],
    expectedTool: "file_search",
  },

  // 8. Image Understanding
  {
    id: "vision-01",
    category: "image_understanding",
    difficulty: "medium",
    question: "Analyze this architecture diagram image and describe microservices communication.",
    expectedBehavior: "Extract visual components, data flows, and services.",
    requiredKeywords: ["architecture", "visual"],
    expectedRoute: "vision",
  },
];
