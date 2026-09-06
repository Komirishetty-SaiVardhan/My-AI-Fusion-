import { AgentTaskData, AgentTaskStep } from "./types";

export const SAMPLE_AGENT_TASK: AgentTaskData = {
  id: "agent-task-01",
  goal: "Build an authenticated rate-limited microservice with Prisma & PostgreSQL",
  status: "completed",
  progressPercent: 100,
  confidenceScore: 98,
  totalTimeMs: 4200,
  steps: [
    {
      id: "step-1",
      stepNumber: 1,
      title: "Decompose Architecture & Schema Requirements",
      type: "plan",
      status: "completed",
      description: "Identified JWT auth flow, sliding-window rate limiter, and database models.",
      durationMs: 450,
      selfReflection: "Considered in-memory token bucket vs Redis sliding window; chose in-memory with Redis adapter interface.",
      logs: [
        "Analyzing project boundary constraints...",
        "Selected schema entities: User, Session, RateLimitToken",
        "Targeting Node.js + TypeScript environment",
      ],
    },
    {
      id: "step-2",
      stepNumber: 2,
      title: "Synthesize Database Models & Migrations",
      type: "code",
      status: "completed",
      description: "Generated Prisma schema with strict indexes and cascade rules.",
      durationMs: 1100,
      logs: [
        "Created schema.prisma with PostgreSQL provider",
        "Applied indexes on user email and token expiration timestamps",
      ],
    },
    {
      id: "step-3",
      stepNumber: 3,
      title: "Implement Sliding-Window Rate Limiter Middleware",
      type: "code",
      status: "completed",
      description: "Created deterministic token-bucket algorithm with IP & user-based keys.",
      durationMs: 1300,
      logs: [
        "Configured max 60 req/min for free tier",
        "Added Retry-After and X-RateLimit-Remaining HTTP headers",
      ],
    },
    {
      id: "step-4",
      stepNumber: 4,
      title: "Self-Critique & Edge-Case Verification",
      type: "verify",
      status: "completed",
      description: "Verified token replay attack resistance and clock skew tolerance.",
      durationMs: 850,
      selfReflection: "Self-correction: Adjusted timestamp clock drift buffer by +200ms to prevent race conditions.",
      logs: [
        "Running edge-case simulation...",
        "Passed concurrent request stress check",
      ],
    },
    {
      id: "step-5",
      stepNumber: 5,
      title: "Final Polish & Artifact Delivery",
      type: "finalize",
      status: "completed",
      description: "Packaged modular TypeScript components with unit test suite.",
      durationMs: 500,
      output: "Production-ready service ready for deployment.",
    },
  ],
  artifacts: [
    {
      id: "art-1",
      name: "schema.prisma",
      type: "file",
      content: `model User {\n  id        String   @id @default(uuid())\n  email     String   @unique\n  role      String   @default("user")\n  createdAt DateTime @default(now())\n}`,
    },
    {
      id: "art-2",
      name: "rateLimiter.ts",
      type: "code",
      content: `export function createRateLimiter(limit: number, windowMs: number) {\n  const hits = new Map<string, number[]>();\n  return (key: string) => {\n    const now = Date.now();\n    const timestamps = (hits.get(key) || []).filter(t => now - t < windowMs);\n    if (timestamps.length >= limit) return false;\n    timestamps.push(now);\n    hits.set(key, timestamps);\n    return true;\n  };\n}`,
    },
  ],
  finalResult: "Autonomous agent execution completed successfully with 100% test pass rate and self-verified edge cases.",
};

export function parseAgentTaskMarkdown(rawText: string): AgentTaskData {
  try {
    const trimmed = rawText.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      return {
        ...SAMPLE_AGENT_TASK,
        ...parsed,
      };
    }
  } catch {
    // ignore
  }

  return SAMPLE_AGENT_TASK;
}
