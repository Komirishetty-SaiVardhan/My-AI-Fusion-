import {
  EvalCategory,
  EvaluationResult,
  EvaluationSummary,
  EvaluationTestCase,
} from "./types";
import { EVALUATION_DATASET } from "./datasets";
import { autoModeOrchestrator } from "../auto/orchestrator";
import { aiLogger } from "../ai/logger";

export class AIEvaluator {
  /**
   * Executes the full evaluation suite and scores all benchmark dimensions.
   */
  async runEvaluation(customDataset?: EvaluationTestCase[]): Promise<{
    summary: EvaluationSummary;
    results: EvaluationResult[];
  }> {
    const dataset = customDataset || EVALUATION_DATASET;
    const results: EvaluationResult[] = [];

    const categoryStats: Record<
      EvalCategory,
      { total: number; passed: number; totalLatencyMs: number }
    > = {
      simple_questions: { total: 0, passed: 0, totalLatencyMs: 0 },
      reasoning: { total: 0, passed: 0, totalLatencyMs: 0 },
      mathematics: { total: 0, passed: 0, totalLatencyMs: 0 },
      coding: { total: 0, passed: 0, totalLatencyMs: 0 },
      research: { total: 0, passed: 0, totalLatencyMs: 0 },
      citations: { total: 0, passed: 0, totalLatencyMs: 0 },
      document_qa: { total: 0, passed: 0, totalLatencyMs: 0 },
      image_understanding: { total: 0, passed: 0, totalLatencyMs: 0 },
    };

    let totalLatency = 0;
    let totalCost = 0;
    let totalScore = 0;

    for (const testCase of dataset) {
      const startTime = Date.now();

      // Execute via Auto Mode Orchestrator
      const execution = await autoModeOrchestrator.execute({
        prompt: testCase.question,
      });

      const latencyMs = Date.now() - startTime;
      const respLower = execution.text.toLowerCase();

      // 1. Evaluate accuracy based on required keywords
      let matchedKeywords = 0;
      const required = testCase.requiredKeywords || [];
      for (const kw of required) {
        if (respLower.includes(kw.toLowerCase())) {
          matchedKeywords++;
        }
      }

      const keywordScore = required.length > 0 ? matchedKeywords / required.length : 1.0;
      const accuracyScore = Number(keywordScore.toFixed(2));

      // 2. Evaluate Tool Selection
      let toolSelectionCorrect = true;
      if (testCase.expectedTool) {
        toolSelectionCorrect = execution.details.toolsUsed.includes(testCase.expectedTool);
      }

      // 3. Evaluate Routing Correctness
      let routingCorrect = true;
      if (testCase.expectedRoute) {
        routingCorrect =
          execution.plan.targetCapability === testCase.expectedRoute ||
          (testCase.expectedRoute === "fast" && execution.plan.targetCapability === "fast");
      }

      // 4. Evaluate Citations
      let citationCorrect = true;
      if (testCase.requiresCitation) {
        citationCorrect = execution.text.includes("[1]") || execution.text.includes("[");
      }

      const passed = accuracyScore >= 0.5 && toolSelectionCorrect && citationCorrect;

      const estimatedCost = execution.details.estimatedCostUsd || 0.0002;
      totalCost += estimatedCost;
      totalLatency += latencyMs;
      totalScore += accuracyScore;

      const catStat = categoryStats[testCase.category];
      if (catStat) {
        catStat.total++;
        if (passed) catStat.passed++;
        catStat.totalLatencyMs += latencyMs;
      }

      results.push({
        testId: testCase.id,
        category: testCase.category,
        difficulty: testCase.difficulty,
        question: testCase.question,
        passed,
        accuracyScore,
        latencyMs,
        estimatedCostUsd: estimatedCost,
        toolSelectionCorrect,
        routingCorrect,
        citationCorrect,
        actualResponse: execution.text,
      });
    }

    const passedCount = results.filter((r) => r.passed).length;
    const totalTests = results.length;
    const passRatePercent = totalTests > 0 ? Number(((passedCount / totalTests) * 100).toFixed(1)) : 0;
    const averageAccuracyScore = totalTests > 0 ? Number((totalScore / totalTests).toFixed(2)) : 0;
    const averageLatencyMs = totalTests > 0 ? Math.round(totalLatency / totalTests) : 0;

    const categoryBreakdown: EvaluationSummary["categoryBreakdown"] = {
      simple_questions: this.formatCatStat(categoryStats.simple_questions),
      reasoning: this.formatCatStat(categoryStats.reasoning),
      mathematics: this.formatCatStat(categoryStats.mathematics),
      coding: this.formatCatStat(categoryStats.coding),
      research: this.formatCatStat(categoryStats.research),
      citations: this.formatCatStat(categoryStats.citations),
      document_qa: this.formatCatStat(categoryStats.document_qa),
      image_understanding: this.formatCatStat(categoryStats.image_understanding),
    };

    const summary: EvaluationSummary = {
      totalTests,
      passedCount,
      passRatePercent,
      averageAccuracyScore,
      averageLatencyMs,
      totalEstimatedCostUsd: Number(totalCost.toFixed(5)),
      categoryBreakdown,
      timestamp: new Date().toISOString(),
    };

    aiLogger.info("evaluation_suite_completed", {
      totalTests,
      passedCount,
      passRatePercent,
      avgLatencyMs: averageLatencyMs,
    });

    return { summary, results };
  }

  private formatCatStat(stat: { total: number; passed: number; totalLatencyMs: number }) {
    const rate = stat.total > 0 ? Number(((stat.passed / stat.total) * 100).toFixed(1)) : 0;
    const avgLat = stat.total > 0 ? Math.round(stat.totalLatencyMs / stat.total) : 0;
    return {
      total: stat.total,
      passed: stat.passed,
      avgLatencyMs: avgLat,
      passRatePercent: rate,
    };
  }
}

export const aiEvaluator = new AIEvaluator();
