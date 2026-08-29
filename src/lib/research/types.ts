export interface Source {
  id: string;
  url: string;
  title: string;
  domain: string;
  publishedAt?: string;
  snippet: string;
  content: string;
  relevanceScore: number; // 0.0 to 1.0
  authoritative?: boolean;
}

export type ResearchDepth = "simple" | "deep";

export interface ResearchOptions {
  depth?: ResearchDepth;
  maxSources?: number;
  allowedDomains?: string[];
  blockedDomains?: string[];
  timeoutMs?: number;
  requireAuthoritative?: boolean;
  forcedQuery?: boolean;
}

export interface ResearchPlan {
  shouldResearch: boolean;
  reason: string;
  depth: ResearchDepth;
  queries: string[];
  targetDomains?: string[];
}

export interface RawSearchResult {
  url: string;
  title: string;
  snippet: string;
  content?: string;
  publishedAt?: string;
}

export interface EvidenceSnippet {
  sourceId: string;
  sourceUrl: string;
  sourceTitle: string;
  domain: string;
  text: string;
  relevanceScore: number;
}

export interface Citation {
  index: number;
  sourceId: string;
  url: string;
  title: string;
  domain: string;
  snippet?: string;
}

export interface ResearchResult {
  query: string;
  plan: ResearchPlan;
  sources: Source[];
  evidence: EvidenceSnippet[];
  facts: string[];
  reasoning: string;
  synthesizedAnswer: string;
  citations: Citation[];
  formattedFootnotes: string;
  durationMs: number;
}
