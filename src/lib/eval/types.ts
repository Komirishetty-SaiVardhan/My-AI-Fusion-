export type EvalCategory =
  | "simple_questions"
  | "reasoning"
  | "mathematics"
  | "coding"
  | "research"
  | "citations"
  | "document_qa"
  | "image_understanding";

export type EvalDifficulty = "easy" | "medium" | "hard";

export interface EvaluationTestCase {
  id: string;
  category: EvalCategory;
  difficulty: EvalDifficulty;
  question: string;
  expectedBehavior: string;
  requiredKeywords?: string[];
  expectedTool?: string;
  expectedRoute?: string;
  requiresCitation?: boolean;
}

export interface EvaluationResult {
  testId: string;
  category: EvalCategory;
  difficulty: EvalDifficulty;
  question: string;
  passed: boolean;
  accuracyScore: number; // 0.0 to 1.0
  latencyMs: number;
  estimatedCostUsd: number;
  toolSelectionCorrect: boolean;
  routingCorrect: boolean;
  citationCorrect: boolean;
  actualResponse: string;
  details?: string;
}

export interface EvaluationSummary {
  totalTests: number;
  passedCount: number;
  passRatePercent: number;
  averageAccuracyScore: number;
  averageLatencyMs: number;
  totalEstimatedCostUsd: number;
  categoryBreakdown: Record<
    EvalCategory,
    { total: number; passed: number; avgLatencyMs: number; passRatePercent: number }
  >;
  timestamp: string;
}
