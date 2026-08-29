import { RawSearchResult } from "./types";

export interface SearchProvider {
  readonly name: string;
  search(
    query: string,
    options?: { maxResults?: number; allowedDomains?: string[]; signal?: AbortSignal }
  ): Promise<RawSearchResult[]>;
}

/**
 * Deterministic Mock Search Provider
 * Simulates real-world search engine results for robust offline testing and development.
 */
export class MockSearchProvider implements SearchProvider {
  readonly name = "Mock Search Provider";
  private forceFailQueries = new Set<string>();

  setSimulateFailure(querySubstring: string): void {
    this.forceFailQueries.add(querySubstring.toLowerCase());
  }

  clearFailures(): void {
    this.forceFailQueries.clear();
  }

  async search(
    query: string,
    options?: { maxResults?: number; allowedDomains?: string[]; signal?: AbortSignal }
  ): Promise<RawSearchResult[]> {
    const lower = query.toLowerCase();

    // Check for forced failure simulation
    for (const failQ of this.forceFailQueries) {
      if (lower.includes(failQ)) {
        throw new Error(`Search provider upstream failure simulated for query: "${query}"`);
      }
    }

    const max = options?.maxResults || 5;
    const nowYear = 2026;

    // Realistic multi-domain simulated search results based on query terms
    const results: RawSearchResult[] = [
      {
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, "_"))}?utm_source=search`,
        title: `${query} - Comprehensive Overview`,
        snippet: `Detailed encyclopedia reference on ${query}. Highlights key historical context, verified data points, and global metrics.`,
        content: `Comprehensive overview of ${query}. Key verified milestones indicate sustained advancement through ${nowYear}. Research groups report 35% higher adoption in enterprise environments.`,
        publishedAt: "2025-11-15T10:00:00Z",
      },
      {
        url: `https://arxiv.org/abs/${Math.floor(Math.random() * 90000 + 10000)}.pdf`,
        title: `Empirical Research and Benchmark Analysis on ${query}`,
        snippet: `Peer-reviewed scientific study analyzing architectural trade-offs, accuracy improvements, and performance benchmarks for ${query}.`,
        content: `This paper presents formal evaluation of ${query}. Quantitative findings show a 2.4x latency reduction and strict adherence to safety standards. Authors from MIT and Stanford confirmed theoretical bounds.`,
        publishedAt: "2026-01-20T08:30:00Z",
      },
      {
        url: `https://www.reuters.com/technology/${encodeURIComponent(query.replace(/\s+/g, "-"))}-market-report`,
        title: `Reuters: Industry Analysis and Market Update on ${query}`,
        snippet: `Global market reports confirm expanding investments in ${query} with significant adoption across technology and research sectors.`,
        content: `Reuters Market Watch: Global investments in ${query} reached record highs in ${nowYear}. Regulators and industry leaders emphasized verified safety and open interoperability.`,
        publishedAt: "2026-02-10T14:15:00Z",
      },
      {
        url: `https://github.com/topics/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, "-"))}`,
        title: `Open Source Implementations and Standards for ${query}`,
        snippet: `Collection of production-ready repositories, reference architectures, and developer tools for ${query}.`,
        content: `Open source community standards for ${query}. Over 5,000 active contributors have standardized TypeScript and Rust interfaces for high-throughput deployment.`,
        publishedAt: "2025-12-05T12:00:00Z",
      },
      {
        url: `https://docs.technology.org/guides/${encodeURIComponent(query.replace(/\s+/g, "_"))}`,
        title: `Official Documentation: Best Practices for ${query}`,
        snippet: `Official reference documentation outlining architecture requirements, configuration options, and verified guidelines for ${query}.`,
        content: `Official Technical Guide for ${query}. Step 1: Initialize decoupled providers. Step 2: Establish rate limit and citation validation safeguards.`,
        publishedAt: "2026-01-05T09:00:00Z",
      },
    ];

    // Filter by allowed domains if specified
    let filtered = results;
    if (options?.allowedDomains && options.allowedDomains.length > 0) {
      filtered = results.filter((r) =>
        options.allowedDomains!.some((d) => r.url.includes(d.toLowerCase()))
      );
    }

    return filtered.slice(0, max);
  }
}

export const defaultSearchProvider = new MockSearchProvider();
