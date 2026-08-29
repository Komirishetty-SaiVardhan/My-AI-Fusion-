export type AutoProgressState =
  | "Understanding"
  | "Searching"
  | "Analyzing"
  | "Preparing answer";

export interface AutoPlan {
  needsWebSearch: boolean;
  searchQueries: string[];
  needsReasoning: boolean;
  needsCitations: boolean;
  needsComparisonFormat: boolean;
  needsCalculation: boolean;
  targetCapability: "fast" | "reasoning" | "research" | "tools" | "coding";
  inferredIntent: string;
}

export interface AutoSource {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

export interface AutoExecutionDetails {
  toolsUsed: string[];
  sources: AutoSource[];
  modelRoute: string;
  executionTimeMs: number;
  tokensUsed?: number;
  estimatedCostUsd?: number;
}

export interface AutoExecutionRequest {
  prompt: string;
  userId?: string;
  conversationId?: string;
  onProgress?: (state: AutoProgressState) => void;
  documentId?: string;
  imageUrl?: string;
}

export interface AutoExecutionResult {
  id: string;
  text: string;
  plan: AutoPlan;
  details: AutoExecutionDetails;
  durationMs: number;
}
