import {
  RawSearchResult,
  ResearchOptions,
  ResearchResult,
} from "./types";
import { researchPlanner, ResearchPlanner } from "./planner";
import { defaultSearchProvider, SearchProvider } from "./search-provider";
import { urlDeduplicator, UrlDeduplicator } from "./deduplicator";
import { sourceRanker, SourceRanker } from "./ranker";
import { contentExtractor, ContentExtractor } from "./extractor";
import { citationRenderer, CitationRenderer } from "./citation";
import { researchSynthesizer, ResearchSynthesizer } from "./synthesizer";
import { aiLogger } from "../ai/logger";

export class WebResearchPipeline {
  private planner: ResearchPlanner;
  private searchProvider: SearchProvider;
  private deduplicator: UrlDeduplicator;
  private ranker: SourceRanker;
  private extractor: ContentExtractor;
  private citationRenderer: CitationRenderer;
  private synthesizer: ResearchSynthesizer;

  constructor(options?: {
    planner?: ResearchPlanner;
    searchProvider?: SearchProvider;
    deduplicator?: UrlDeduplicator;
    ranker?: SourceRanker;
    extractor?: ContentExtractor;
    citationRenderer?: CitationRenderer;
    synthesizer?: ResearchSynthesizer;
  }) {
    this.planner = options?.planner || researchPlanner;
    this.searchProvider = options?.searchProvider || defaultSearchProvider;
    this.deduplicator = options?.deduplicator || urlDeduplicator;
    this.ranker = options?.ranker || sourceRanker;
    this.extractor = options?.extractor || contentExtractor;
    this.citationRenderer = options?.citationRenderer || citationRenderer;
    this.synthesizer = options?.synthesizer || researchSynthesizer;
  }

  /**
   * Executes the full 10-stage web research workflow.
   */
  async executeResearch(
    question: string,
    options?: ResearchOptions
  ): Promise<ResearchResult> {
    const startTime = Date.now();
    const timeoutMs = options?.timeoutMs || 25000;

    aiLogger.info("research_pipeline_start", { question, depth: options?.depth });

    // Stage 1 & 2: Planning & Query Generation
    const plan = this.planner.planResearch(question, options);

    if (!plan.shouldResearch) {
      return {
        query: question,
        plan,
        sources: [],
        evidence: [],
        facts: [],
        reasoning: "Research was determined to be unnecessary for this query.",
        synthesizedAnswer: "",
        citations: [],
        formattedFootnotes: "",
        durationMs: Date.now() - startTime,
      };
    }

    // Stage 3: Parallel Search Execution
    const rawResults: RawSearchResult[] = [];
    const searchPromises = plan.queries.map(async (query) => {
      try {
        return await this.searchProvider.search(query, {
          maxResults: options?.depth === "deep" ? 6 : 4,
          allowedDomains: options?.allowedDomains,
        });
      } catch (err) {
        aiLogger.warn("research_query_failed", {
          query,
          error: err instanceof Error ? err.message : String(err),
        });
        return [];
      }
    });

    // Execute with timeout safeguard
    const searchSettled = await Promise.race([
      Promise.allSettled(searchPromises),
      new Promise<PromiseSettledResult<RawSearchResult[]>[]>((_, reject) =>
        setTimeout(() => reject(new Error(`Research timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]).catch((err) => {
      aiLogger.error("research_timeout_or_fatal", { error: err.message });
      return [];
    });

    for (const settled of searchSettled) {
      if (settled.status === "fulfilled") {
        rawResults.push(...settled.value);
      }
    }

    // Stage 4 & 5: Deduplication & URL Canonicalization
    const deduplicated = this.deduplicator.deduplicate(rawResults);

    // Stage 6: Authoritative & Relevance Ranking
    const rankedSources = this.ranker.rankSources(deduplicated, question, options);

    // Stage 7: Grounded Evidence Extraction
    const allEvidence = rankedSources.flatMap((source) =>
      this.extractor.extractEvidence(source, question)
    );

    // Sort evidence by relevance
    allEvidence.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const topEvidence = allEvidence.slice(0, 8);

    // Stage 8 & 9: Citation Indexing & Grounded Synthesis
    const citations = this.citationRenderer.buildCitations(rankedSources);
    const synthesis = this.synthesizer.synthesize(
      question,
      rankedSources,
      topEvidence,
      citations
    );

    // Stage 10: Footnote Rendering
    const formattedFootnotes = this.citationRenderer.renderFootnotes(citations);
    const durationMs = Date.now() - startTime;

    aiLogger.info("research_pipeline_complete", {
      question,
      sourceCount: rankedSources.length,
      evidenceCount: topEvidence.length,
      durationMs,
    });

    return {
      query: question,
      plan,
      sources: rankedSources,
      evidence: topEvidence,
      facts: synthesis.facts,
      reasoning: synthesis.reasoning,
      synthesizedAnswer: synthesis.synthesizedAnswer,
      citations,
      formattedFootnotes,
      durationMs,
    };
  }
}

export const webResearchPipeline = new WebResearchPipeline();
