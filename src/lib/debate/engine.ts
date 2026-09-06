import { DebateAgent, DebateSession, DebateTurn, DebateSynthesis } from "./types";

export const DEFAULT_DEBATE_PANEL: DebateAgent[] = [
  {
    id: "proponent",
    name: "Dr. Elena Vance",
    role: "Lead Systems Architect (Proponent)",
    avatar: "⚡",
    stance: "pro",
    color: "emerald",
  },
  {
    id: "skeptic",
    name: "Marcus Sterling",
    role: "Principal Security & Risk Auditor (Skeptic)",
    avatar: "🛡️",
    stance: "con",
    color: "rose",
  },
  {
    id: "pragmatist",
    name: "Kai Chen",
    role: "FinOps & Engineering Lead (Pragmatist)",
    avatar: "⚖️",
    stance: "pragmatic",
    color: "indigo",
  },
  {
    id: "synthesizer",
    name: "Athena Core",
    role: "Master Synthesis & Decision Engine",
    avatar: "👑",
    stance: "neutral",
    color: "amber",
  },
];

export const SAMPLE_DEBATE_SESSION: DebateSession = {
  id: "debate-sample-1",
  topic: "Should we rewrite our monolithic Node.js backend in Rust for ultra-low latency microservices?",
  status: "completed",
  agents: DEFAULT_DEBATE_PANEL,
  turns: [
    {
      id: "turn-1",
      agentId: "proponent",
      roundNumber: 1,
      stageName: "Opening Argument",
      content:
        "Rust provides zero-cost abstractions, memory safety without garbage collection pauses, and predictable sub-millisecond p99 latencies. For CPU-bound workloads and high-throughput real-time streaming, rewriting critical bottlenecks in Rust reduces infrastructure spend by up to 60% and eliminates entire classes of runtime concurrency bugs.",
      keyPoints: [
        "Zero-cost memory safety without GC latency spikes",
        "Sub-millisecond p99 response times under 100k+ concurrent connections",
        "Drastic reduction in cloud compute & container footprint",
      ],
      confidenceScore: 92,
    },
    {
      id: "turn-2",
      agentId: "skeptic",
      roundNumber: 1,
      stageName: "Cross-Examination & Rebuttal",
      content:
        "A full rewrite is one of the highest-risk engineering initiatives. The Rust learning curve significantly slows feature velocity, hiring specialized Rust engineers is expensive and competitive, and your current bottleneck is likely I/O-bound database queries rather than JavaScript runtime execution. Rewriting the entire monolith is premature optimization.",
      keyPoints: [
        "Steep team learning curve slows down product roadmap delivery",
        "Database roundtrips and network latency dominate, not V8 execution",
        "Higher talent acquisition cost and smaller hiring pool",
      ],
      confidenceScore: 88,
    },
    {
      id: "turn-3",
      agentId: "pragmatist",
      roundNumber: 2,
      stageName: "Edge Case Analysis",
      content:
        "The dichotomy between 100% Rust and 100% Node.js is false. The pragmatic strategy is the Strangler Fig pattern: keep the Node.js API Gateway and fast business CRUD logic, while profiling and extracting ONLY the CPU-heavy pipelines (e.g. video processing, cryptography, vector calculations) into high-performance Rust Native Addons (N-API) or micro-daemons.",
      keyPoints: [
        "Adopt Strangler Fig pattern rather than high-risk big-bang rewrite",
        "Use Node-API (N-API) Rust bindings for hotspot micro-benchmarks",
        "Preserve existing developer velocity for standard CRUD workflows",
      ],
      confidenceScore: 95,
    },
  ],
  synthesis: {
    consensusTitle: "Hybrid Selective Extraction Architecture (Rust Hotspots + Node.js Gateway)",
    recommendation:
      "Do NOT perform a full rewrite of the entire monolith. Instead, isolate the top 5% CPU-bound hotspot services and rewrite them incrementally into Rust microservices or Node.js native addons while keeping the core API in TypeScript/Node.js.",
    pros: [
      "Captures 90% of Rust's latency and throughput benefits",
      "Avoids multi-month product freeze and high rewrite risk",
      "Maintains developer speed for day-to-day web and API features",
    ],
    cons: [
      "Requires maintaining dual-language CI/CD pipelines and toolchains",
      "Team needs basic cross-language interoperability training",
    ],
    unresolvedRisks: [
      "Ensure robust gRPC/Protobuf contracts between Node.js and Rust components",
      "Set up distributed tracing (OpenTelemetry) across language boundaries",
    ],
    actionItems: [
      "1. Profile production APM to pinpoint exact CPU hotspots vs I/O waits",
      "2. Build a proof-of-concept Rust N-API addon for the heaviest calculation",
      "3. Benchmark memory and latency deltas under load before full rollout",
    ],
    winnerStance: "hybrid",
  },
};

/**
 * Parse a markdown code block into a DebateSession
 */
export function parseDebateSession(content: string, defaultTopic = "Multi-Agent Decision Debate"): DebateSession {
  try {
    const trimmed = content.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      if (parsed.topic && Array.isArray(parsed.turns)) {
        return {
          id: parsed.id || `debate-${Date.now()}`,
          topic: parsed.topic || defaultTopic,
          status: parsed.status || "completed",
          agents: parsed.agents || DEFAULT_DEBATE_PANEL,
          turns: parsed.turns.map((t: any, idx: number) => ({
            id: String(t.id || `turn-${idx}`),
            agentId: String(t.agentId || (idx % 2 === 0 ? "proponent" : "skeptic")),
            roundNumber: typeof t.roundNumber === "number" ? t.roundNumber : Math.floor(idx / 2) + 1,
            stageName: t.stageName || (idx === 0 ? "Opening Argument" : "Cross-Examination & Rebuttal"),
            content: String(t.content || ""),
            keyPoints: Array.isArray(t.keyPoints) ? t.keyPoints : [],
            confidenceScore: typeof t.confidenceScore === "number" ? t.confidenceScore : 90,
          })),
          synthesis: parsed.synthesis || SAMPLE_DEBATE_SESSION.synthesis,
        };
      }
    }
  } catch {
    // Fallback on parse failure
  }

  return {
    ...SAMPLE_DEBATE_SESSION,
    topic: defaultTopic,
  };
}
