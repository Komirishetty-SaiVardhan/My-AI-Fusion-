import { ResearchDepth, ResearchOptions, ResearchPlan } from "./types";

export class ResearchPlanner {
  shouldResearch(question: string, options?: ResearchOptions): boolean {
    if (options?.forcedQuery) return true;
    if (!question || question.trim().length === 0) return false;

    const lower = question.toLowerCase();

    // 1. Definite non-research queries (basic math, greeting, timeless definitions, pure code)
    if (/^(hello|hi|hey|good\s+(morning|evening)|who\s+are\s+you)[.!?]?$/.test(lower)) {
      return false;
    }
    if (/^\s*\d+\s*[\+\-\*\/]\s*\d+\s*(=|\?|=\s*\?)?\s*$/.test(lower)) {
      return false;
    }
    if (lower.startsWith("write a typescript") || lower.startsWith("write a python") || lower.startsWith("debug this")) {
      return false;
    }

    // 2. Real-time / Current temporal indicators
    const currentYearIndicators = /\b(2024|2025|2026)\b/;
    const temporalKeywords = /\b(latest|current|currently|recent|recently|today|yesterday|this\s+week|this\s+month|newest|breaking|upcoming|forecast|live\s+score|stock\s+price|market\s+price)\b/;
    const queryVerbs = /\b(search\s+for|look\s+up|find\s+out|who\s+won|what\s+happened|current\s+status\s+of|news\s+about)\b/;

    if (currentYearIndicators.test(lower) || temporalKeywords.test(lower) || queryVerbs.test(lower)) {
      return true;
    }

    // 3. Questions asking about specific real-world products, companies, or comparative metrics
    if (lower.includes("price") || lower.includes("weather in") || lower.includes("election") || lower.includes("who is the current")) {
      return true;
    }

    return false;
  }

  planResearch(question: string, options?: ResearchOptions): ResearchPlan {
    const should = this.shouldResearch(question, options);
    if (!should) {
      return {
        shouldResearch: false,
        reason: "Query does not require live web research; internal knowledge is sufficient",
        depth: "simple",
        queries: [],
      };
    }

    const depth: ResearchDepth = options?.depth || this.inferDepth(question);
    const queries = this.generateQueries(question, depth);

    return {
      shouldResearch: true,
      reason: `Web research required (${depth} depth) for current verification`,
      depth,
      queries,
      targetDomains: options?.allowedDomains,
    };
  }

  private inferDepth(question: string): ResearchDepth {
    const lower = question.toLowerCase();
    const isDeep =
      lower.includes("comprehensive") ||
      lower.includes("in-depth") ||
      lower.includes("detailed breakdown") ||
      lower.includes("compare and contrast") ||
      lower.includes("trade-offs") ||
      lower.includes("pros and cons") ||
      question.split(/\s+/).length > 15;

    return isDeep ? "deep" : "simple";
  }

  private generateQueries(question: string, depth: ResearchDepth): string[] {
    const clean = question.replace(/[?.,!]/g, "").trim();

    if (depth === "simple") {
      return [clean];
    }

    // Deep research: generate multiple targeted facet queries
    const subQueries: string[] = [clean];

    // Facet 1: Latest trends & updates
    subQueries.push(`${clean} latest updates 2025 2026`);

    // Facet 2: Official data & statistics / comparison
    if (clean.toLowerCase().includes("vs") || clean.toLowerCase().includes("compare")) {
      subQueries.push(`${clean} benchmark analysis comparison`);
    } else {
      subQueries.push(`${clean} key facts statistics analysis`);
    }

    // Facet 3: Overview & expert consensus
    subQueries.push(`${clean} official documentation overview`);

    // Deduplicate and return top 3-4 subqueries
    return Array.from(new Set(subQueries)).slice(0, 4);
  }
}

export const researchPlanner = new ResearchPlanner();
