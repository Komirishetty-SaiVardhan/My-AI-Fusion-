export type MemoryType =
  | "conversation"
  | "user_preference"
  | "project"
  | "explicit";

export type MemorySource =
  | "explicit_user_prompt"
  | "inferred_preference"
  | "project_context"
  | "conversation_summary";

export interface MemoryMetadata {
  confidence: number; // 0.0 to 1.0
  importance: number; // 1 to 5 (5 is critical)
  stabilityScore: number; // 0.0 to 1.0 (1.0 is permanent/timeless)
  lastAccessedAt?: string;
  sourceContext?: string;
  tags?: string[];
}

export interface Memory {
  id: string;
  userId: string;
  projectId?: string;
  type: MemoryType;
  source: MemorySource;
  key: string;
  content: string;
  metadata: MemoryMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryFilter {
  userId: string;
  projectId?: string;
  types?: MemoryType[];
  tags?: string[];
  minImportance?: number;
}

export interface ScoredMemory {
  memory: Memory;
  relevanceScore: number; // 0.0 to 1.0
}

export interface MemoryEvaluationResult {
  shouldSave: boolean;
  reason: string;
  type?: MemoryType;
  source?: MemorySource;
  key?: string;
  distilledFact?: string;
  stabilityScore: number;
  importance: number;
  rejectedSecret?: boolean;
}
