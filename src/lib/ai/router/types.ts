import { AIMessage } from "../types";

export type TaskCategory =
  | "SIMPLE"
  | "GENERAL"
  | "REASONING"
  | "RESEARCH"
  | "CODING"
  | "VISION"
  | "FILE_ANALYSIS";

export interface RequestAttachment {
  type: "image" | "file";
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface RouterRequest {
  prompt?: string;
  messages?: AIMessage[] | string;
  attachments?: RequestAttachment[];
  explicitCategory?: TaskCategory;
  explicitModel?: string;
  preferredProvider?: string;
}

export interface ClassificationResult {
  category: TaskCategory;
  confidence: number; // 0.0 to 1.0
  reason: string;
  detectedFeatures: string[];
  suggestedEscalation?: boolean;
  alternativeCategory?: TaskCategory;
}

export interface RoutingPolicy {
  category: TaskCategory;
  primaryModel: string;
  fallbackModels: string[];
  timeoutMs: number;
  confidenceThreshold: number; // minimum confidence required, below which escalation triggers
  escalationTarget?: TaskCategory;
  requiresTools?: string[];
  description: string;
}

export interface RoutingDecision {
  requestId: string;
  timestamp: number;
  promptSummary: string;
  classifiedCategory: TaskCategory;
  finalCategory: TaskCategory;
  confidence: number;
  primaryModel: string;
  selectedModel: string;
  wasEscalated: boolean;
  escalationReason?: string;
  fallbackAttempted: boolean;
  fallbackModelUsed?: string;
  durationMs?: number;
  routeReason: string;
  detectedFeatures: string[];
}
