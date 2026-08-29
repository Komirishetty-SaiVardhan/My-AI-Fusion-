import { Memory, ScoredMemory } from "./types";

const STOP_WORDS = new Set([
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "how",
  "should",
  "could",
  "would",
  "the",
  "and",
  "for",
  "with",
  "about",
  "that",
  "this",
  "use",
  "does",
  "did",
  "can",
]);

export class MemoryRanker {
  /**
   * Ranks user memories by relevance to the prompt query, weighted by importance and stability.
   */
  rank(
    memories: Memory[],
    query: string,
    options?: { topK?: number; minScore?: number }
  ): ScoredMemory[] {
    const topK = options?.topK || 5;
    const minScore = options?.minScore || 0.1;

    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ""))
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    const scored: ScoredMemory[] = [];

    for (const memory of memories) {
      const memoryText = `${memory.key} ${memory.content} ${(memory.metadata.tags || []).join(" ")}`.toLowerCase();

      let matchCount = 0;
      for (const term of queryTerms) {
        if (memoryText.includes(term)) {
          matchCount++;
        }
      }

      const matchDensity = queryTerms.length > 0 ? matchCount / queryTerms.length : 0.4;
      const importanceWeight = 0.5 + 0.5 * (memory.metadata.importance / 5);
      const stabilityWeight = 0.5 + 0.5 * memory.metadata.stabilityScore;

      // Base relevance + weighted importance
      let finalScore = (matchCount > 0 ? 0.45 + matchDensity * 0.55 : 0.2) * importanceWeight * stabilityWeight;
      finalScore = Math.min(1.0, Math.max(0.0, Number(finalScore.toFixed(3))));

      if (finalScore >= minScore) {
        scored.push({
          memory,
          relevanceScore: finalScore,
        });
      }
    }

    // Sort descending by relevance score
    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scored.slice(0, topK);
  }
}

export const memoryRanker = new MemoryRanker();
