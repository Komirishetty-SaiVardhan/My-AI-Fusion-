import { RawSearchResult, ResearchOptions, Source } from "./types";
import { contentExtractor } from "./extractor";

const AUTHORITATIVE_DOMAINS = new Set([
  "arxiv.org",
  "nature.com",
  "science.org",
  "nih.gov",
  "cdc.gov",
  "nasa.gov",
  "wikipedia.org",
  "reuters.com",
  "bloomberg.com",
  "bbc.com",
  "apnews.com",
  "github.com",
  "developer.mozilla.org",
  "w3.org",
  "ietf.org",
]);

export class SourceRanker {
  /**
   * Normalizes raw search items into Source objects, enforces domain filters, and ranks by relevance & authority.
   */
  rankSources(
    rawResults: RawSearchResult[],
    query: string,
    options?: ResearchOptions
  ): Source[] {
    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let candidates = rawResults;

    // 1. Enforce Domain Filters
    if (options?.allowedDomains && options.allowedDomains.length > 0) {
      const allowed = options.allowedDomains.map((d) => d.toLowerCase());
      candidates = candidates.filter((item) => {
        const domain = this.extractDomain(item.url);
        return allowed.some((a) => domain.includes(a));
      });
    }

    if (options?.blockedDomains && options.blockedDomains.length > 0) {
      const blocked = options.blockedDomains.map((d) => d.toLowerCase());
      candidates = candidates.filter((item) => {
        const domain = this.extractDomain(item.url);
        return !blocked.some((b) => domain.includes(b));
      });
    }

    // 2. Score each candidate
    const scoredSources: Source[] = candidates.map((item, idx) => {
      const domain = this.extractDomain(item.url);
      const isAuth = this.isAuthoritativeDomain(domain);

      const title = item.title || "Untitled Source";
      const cleanedContent = contentExtractor.cleanText(item.content || item.snippet);
      const cleanedSnippet = contentExtractor.cleanText(item.snippet);

      const score = this.calculateRelevance(queryTerms, title, cleanedContent, isAuth, item.publishedAt);

      return {
        id: `src-${idx + 1}`,
        url: item.url,
        title,
        domain,
        publishedAt: item.publishedAt,
        snippet: cleanedSnippet,
        content: cleanedContent,
        relevanceScore: score,
        authoritative: isAuth,
      };
    });

    // 3. Sort by relevance score descending
    scoredSources.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Re-index IDs sequentially
    const maxSources = options?.maxSources || (options?.depth === "deep" ? 8 : 5);
    return scoredSources.slice(0, maxSources).map((s, idx) => ({
      ...s,
      id: `src-${idx + 1}`,
    }));
  }

  isAuthoritativeDomain(domain: string): boolean {
    const lower = domain.toLowerCase();
    if (lower.endsWith(".edu") || lower.endsWith(".gov") || lower.endsWith(".mil") || lower.endsWith(".org")) {
      return true;
    }
    if (lower.startsWith("docs.") || lower.startsWith("developer.")) {
      return true;
    }
    for (const auth of AUTHORITATIVE_DOMAINS) {
      if (lower === auth || lower.endsWith(`.${auth}`)) {
        return true;
      }
    }
    return false;
  }

  private extractDomain(urlStr: string): string {
    try {
      const u = new URL(urlStr);
      return u.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return urlStr.split("/")[2] || urlStr;
    }
  }

  private calculateRelevance(
    queryTerms: string[],
    title: string,
    content: string,
    isAuthoritative: boolean,
    publishedAt?: string
  ): number {
    if (queryTerms.length === 0) return 0.5;

    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();

    let titleMatches = 0;
    let contentMatches = 0;

    for (const term of queryTerms) {
      if (lowerTitle.includes(term)) titleMatches++;
      if (lowerContent.includes(term)) contentMatches++;
    }

    const titleDensity = titleMatches / queryTerms.length;
    const contentDensity = contentMatches / queryTerms.length;

    let score = titleDensity * 0.45 + contentDensity * 0.35 + 0.2;

    // Authority bonus (25% boost)
    if (isAuthoritative) {
      score *= 1.25;
    }

    // Recency bonus (10% boost for 2025/2026 publications)
    if (publishedAt && (publishedAt.includes("2025") || publishedAt.includes("2026"))) {
      score *= 1.1;
    }

    return Math.min(0.99, Math.max(0.1, Number(score.toFixed(2))));
  }
}

export const sourceRanker = new SourceRanker();
