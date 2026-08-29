import { AggregatedMetrics, PerformanceMetric } from "./types";
import { speedCache } from "./cache";

export class PerformanceTracker {
  private records: PerformanceMetric[] = [];
  private maxRecords: number;

  constructor(options?: { maxRecords?: number }) {
    this.maxRecords = options?.maxRecords || 1000;
  }

  /**
   * Records a complete request execution metric.
   */
  record(metric: Omit<PerformanceMetric, "id" | "timestamp">): PerformanceMetric {
    const fullMetric: PerformanceMetric = {
      id: `perf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      ...metric,
    };

    if (this.records.length >= this.maxRecords) {
      this.records.shift();
    }

    this.records.push(fullMetric);
    return fullMetric;
  }

  /**
   * Computes real-time aggregated metrics across all recorded executions.
   */
  getAggregatedMetrics(): AggregatedMetrics {
    const totalRequests = this.records.length;
    if (totalRequests === 0) {
      const cacheStats = speedCache.getStats();
      return {
        totalRequests: 0,
        successfulRequests: 0,
        errorCount: 0,
        errorRatePercent: 0,
        cacheHits: cacheStats.hits,
        cacheMisses: cacheStats.misses,
        cacheHitRatePercent: cacheStats.hitRatePercent,
        avgLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        avgTtftMs: 0,
        totalTokens: 0,
        totalEstimatedCostUsd: 0,
        routingDecisions: {},
      };
    }

    let errorCount = 0;
    let totalLatency = 0;
    let totalTtft = 0;
    let ttftCount = 0;
    let totalTokens = 0;
    let totalCost = 0;

    const latencies: number[] = [];
    const routingCounts: Record<string, number> = {};

    for (const r of this.records) {
      if (r.isError) {
        errorCount++;
      }

      latencies.push(r.latency.totalDurationMs);
      totalLatency += r.latency.totalDurationMs;

      if (r.latency.ttftMs) {
        totalTtft += r.latency.ttftMs;
        ttftCount++;
      }

      if (r.tokenUsage) {
        totalTokens += r.tokenUsage.totalTokens;
        totalCost += r.tokenUsage.estimatedCostUsd;
      }

      const route = r.routingDecision || "unknown";
      routingCounts[route] = (routingCounts[route] || 0) + 1;
    }

    latencies.sort((a, b) => a - b);
    const p50 = this.getPercentile(latencies, 50);
    const p95 = this.getPercentile(latencies, 95);
    const p99 = this.getPercentile(latencies, 99);

    const cacheStats = speedCache.getStats();
    const successfulRequests = totalRequests - errorCount;
    const errorRatePercent = Number(((errorCount / totalRequests) * 100).toFixed(2));

    return {
      totalRequests,
      successfulRequests,
      errorCount,
      errorRatePercent,
      cacheHits: cacheStats.hits,
      cacheMisses: cacheStats.misses,
      cacheHitRatePercent: cacheStats.hitRatePercent,
      avgLatencyMs: Math.round(totalLatency / totalRequests),
      p50LatencyMs: p50,
      p95LatencyMs: p95,
      p99LatencyMs: p99,
      avgTtftMs: ttftCount > 0 ? Math.round(totalTtft / ttftCount) : 0,
      totalTokens,
      totalEstimatedCostUsd: Number(totalCost.toFixed(6)),
      routingDecisions: routingCounts,
    };
  }

  getRecentMetrics(count = 50): PerformanceMetric[] {
    return this.records.slice(-count);
  }

  clear(): void {
    this.records = [];
  }

  private getPercentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }
}

export const performanceTracker = new PerformanceTracker();
