import { CognitiveStreamData } from "./types";

export const SAMPLE_COGNITIVE_STREAM: CognitiveStreamData = {
  id: "cog-sample-1",
  topic: "Deep Reasoning & Architecture Strategy",
  totalTimeMs: 820,
  thoughts: [
    {
      id: "th-1",
      stage: "hypothesis",
      title: "Initial Hypothesis & Assumptions",
      thought: "The user is asking for low-latency state synchronization across distributed clients. My initial assumption is WebSockets with CRDTs.",
      confidence: 85,
    },
    {
      id: "th-2",
      stage: "analysis",
      title: "Technical Analysis & Trade-offs",
      thought: "Analyzing bandwidth overhead vs merge conflict resolution complexity. Yjs/Automerge provide state-vector diffing, reducing transfer payload sizes by ~70%.",
      confidence: 92,
    },
    {
      id: "th-3",
      stage: "counterpoint",
      title: "Counter-Hypothesis & Risk Testing",
      thought: "What if clients are offline for days? Pure server-authoritative timestamps will cause clock skew anomalies. Logical timestamps (Lamport clocks) are mandatory.",
      confidence: 96,
    },
    {
      id: "th-4",
      stage: "refinement",
      title: "Self-Correction & Refinement",
      thought: "Refining the architecture to use WebSockets for active sessions + SSE fallback + IndexedDB for local persistence with background replay sync.",
      confidence: 98,
    },
    {
      id: "th-5",
      stage: "decision",
      title: "Synthesized Decision",
      thought: "Deliver a hybrid CRDT model with client-side IndexedDB persistence, logical clock vectors, and WebSocket bi-directional replication.",
      confidence: 99,
    },
  ],
  summary: "Synthesized a zero-loss hybrid CRDT architecture with Lamport logical clocks.",
};

export function parseCognitiveStreamMarkdown(rawText: string): CognitiveStreamData {
  try {
    const trimmed = rawText.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const parsed = JSON.parse(trimmed);
      return {
        ...SAMPLE_COGNITIVE_STREAM,
        ...parsed,
      };
    }
  } catch {
    // ignore
  }

  return SAMPLE_COGNITIVE_STREAM;
}
