export type CognitiveStage =
  | "hypothesis"
  | "analysis"
  | "counterpoint"
  | "refinement"
  | "decision";

export interface CognitiveThought {
  id: string;
  stage: CognitiveStage;
  title: string;
  thought: string;
  confidence: number;
}

export interface CognitiveStreamData {
  id: string;
  topic?: string;
  thoughts: CognitiveThought[];
  summary: string;
  totalTimeMs?: number;
}
