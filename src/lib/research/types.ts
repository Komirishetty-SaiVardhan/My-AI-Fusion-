// Research Engine Types & Pipelines
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

// Deep Autonomous Research Report & Visualizer Types
export type ResearchStage =
  | "planning"
  | "searching"
  | "verifying"
  | "synthesizing"
  | "completed";

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  authorOrDomain?: string;
  reliabilityScore?: number; // 0 to 100
}

export interface ResearchStep {
  id: string;
  query: string;
  stage: ResearchStage;
  status: "pending" | "running" | "completed";
  findingsSummary: string;
  sourcesCount: number;
}

export interface DeepResearchReport {
  id: string;
  query: string;
  topic: string;
  abstract: string;
  steps: ResearchStep[];
  sources: ResearchSource[];
  contentMarkdown: string;
  keyFindings: string[];
  openQuestions: string[];
  totalSourcesConsulted: number;
  confidenceScore: number;
}
