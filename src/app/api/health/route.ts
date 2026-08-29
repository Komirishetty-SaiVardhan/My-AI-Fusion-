import { NextResponse } from "next/server";
import { aiGateway } from "@/lib/ai/gateway";
import { googleAdapter } from "@/lib/ai/providers/google";
import { speedCache } from "@/lib/observability/cache";
import { toolRegistry } from "@/lib/tools/registry";

export async function GET() {
  const providers = aiGateway.listAvailableProviders();
  const cacheStats = speedCache.getStats();
  const enabledTools = toolRegistry.listEnabledTools();
  const memoryUsage = process.memoryUsage();
  const activeProvider = process.env.AI_PROVIDER || "gemini";

  return NextResponse.json(
    {
      status: "healthy",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      activeProvider,
      gemini: {
        configured: googleAdapter.isAvailable(),
        defaultModel: googleAdapter.getDefaultModel(),
      },
      subsystems: {
        aiGateway: {
          status: "ready",
          primaryProvider: activeProvider,
          configuredProviders: providers.map((p: { id: string; name: string }) => p.name),
        },
        speedCache: {
          status: "healthy",
          size: cacheStats.size,
          hitRatePercent: cacheStats.hitRatePercent,
        },
        toolRegistry: {
          status: "healthy",
          enabledToolsCount: enabledTools.length,
          tools: enabledTools.map((t) => t.name),
        },
        memoryService: {
          status: "healthy",
        },
      },
      system: {
        heapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
        rssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
