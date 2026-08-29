import { EvidenceSnippet, Source } from "./types";

export class ContentExtractor {
  /**
   * Sanitizes raw HTML or scraped text into clean, readable text.
   */
  cleanText(raw: string): string {
    if (!raw) return "";

    return raw
      // Strip script and style blocks
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      // Strip HTML tags
      .replace(/<[^>]+>/g, " ")
      // Strip common boilerplate strings
      .replace(/cookie policy|privacy policy|terms of service|all rights reserved/gi, "")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Extracts grounded evidence snippets from a source that directly answer the query.
   */
  extractEvidence(source: Source, query: string): EvidenceSnippet[] {
    const text = source.content || source.snippet || "";
    if (!text) return [];

    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["what", "when", "where", "which", "how", "the", "and", "for"].includes(w));

    // Split text into candidate sentences
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 350);

    const scoredSentences: Array<{ sentence: string; score: number }> = [];

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      let matchCount = 0;

      for (const term of queryTerms) {
        if (lower.includes(term)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const termDensity = matchCount / Math.max(1, queryTerms.length);
        const score = Math.min(1.0, 0.4 + termDensity * 0.6);
        scoredSentences.push({ sentence, score });
      }
    }

    // Sort by match relevance
    scoredSentences.sort((a, b) => b.score - a.score);

    // Pick top 2-3 distinct evidence snippets
    const topSentences = scoredSentences.slice(0, 3);

    return topSentences.map((item) => ({
      sourceId: source.id,
      sourceUrl: source.url,
      sourceTitle: source.title,
      domain: source.domain,
      text: item.sentence,
      relevanceScore: item.score,
    }));
  }
}

export const contentExtractor = new ContentExtractor();
