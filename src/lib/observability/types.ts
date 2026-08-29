export interface LatencyBreakdown {
  ttftMs?: number; // Time to first token
  totalDurationMs: number;
  modelLatencyMs?: number;
  searchLatencyMs?: number;
  toolLatencyMs?: number;
  dbLatencyMs?: number;
}

export interface TokenUsageMetric {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface PerformanceMetric {
  id: string;
  timestamp: number;
  endpoint: string;
  routingDecision: string;
  latency: LatencyBreakdown;
  tokenUsage?: TokenUsageMetric;
  cacheHit: boolean;
  isError: boolean;
  errorMessage?: string;
}

export interface AggregatedMetrics {
  totalRequests: number;
  successfulRequests: number;
  errorCount: number;
  errorRatePercent: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRatePercent: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  avgTtftMs: number;
  totalTokens: number;
  totalEstimatedCostUsd: number;
  routingDecisions: Record<string, number>;
}
