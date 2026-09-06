export type AgentStepType =
  | "plan"
  | "search"
  | "code"
  | "verify"
  | "reflect"
  | "finalize";

export type AgentStepStatus = "pending" | "running" | "completed" | "failed";

export interface AgentTaskStep {
  id: string;
  stepNumber: number;
  title: string;
  type: AgentStepType;
  status: AgentStepStatus;
  description: string;
  logs?: string[];
  output?: string;
  durationMs?: number;
  selfReflection?: string;
}

export interface AgentArtifact {
  id: string;
  name: string;
  type: "file" | "code" | "chart" | "data";
  content: string;
}

export interface AgentTaskData {
  id: string;
  goal: string;
  status: "in_progress" | "completed" | "failed";
  progressPercent: number;
  steps: AgentTaskStep[];
  artifacts?: AgentArtifact[];
  finalResult?: string;
  confidenceScore?: number;
  totalTimeMs?: number;
}
