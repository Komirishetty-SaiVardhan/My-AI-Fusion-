export type DebateExpertRole =
  | "lead-architect"
  | "security-auditor"
  | "finops-strategist"
  | "skeptic-critic"
  | "product-advocate"
  | "ethics-officer"
  | "synthesizer";

export interface DebateAgent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  stance: "pro" | "con" | "pragmatic" | "neutral";
  color: string;
}

export interface DebateTurn {
  id: string;
  agentId: string;
  roundNumber: number;
  stageName: "Opening Argument" | "Cross-Examination & Rebuttal" | "Edge Case Analysis" | "Final Verdict";
  content: string;
  keyPoints: string[];
  confidenceScore: number; // 0 to 100
}

export interface DebateSynthesis {
  consensusTitle: string;
  recommendation: string;
  pros: string[];
  cons: string[];
  unresolvedRisks: string[];
  actionItems: string[];
  winnerStance?: "pro" | "con" | "hybrid";
}

export interface DebateSession {
  id: string;
  topic: string;
  agents: DebateAgent[];
  turns: DebateTurn[];
  synthesis: DebateSynthesis;
  status: "in-progress" | "completed";
}
