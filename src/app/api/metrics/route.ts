import { NextResponse } from "next/server";
import { performanceTracker } from "@/lib/observability/metrics";
import { speedCache } from "@/lib/observability/cache";

export async function GET() {
  const metrics = performanceTracker.getAggregatedMetrics();
  const recent = performanceTracker.getRecentMetrics(20);
  const cacheStats = speedCache.getStats();

  return NextResponse.json({
    metrics,
    recent,
    cache: cacheStats,
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
}
