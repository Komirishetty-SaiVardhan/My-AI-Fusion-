import { TaskCategory, RoutingPolicy } from "./types";

/**
 * Centralized Model Registry
 * Model identifiers are strictly defined here to prevent scattering throughout the codebase.
 */
export const MODELS = {
  // Google Gemini Models (Primary Default)
  GEMINI_FLASH_LATEST: "gemini-flash-latest",
  GEMINI_2_5_FLASH: "gemini-2.5-flash",
  GEMINI_2_0_FLASH: "gemini-2.0-flash",
  GEMINI_1_5_FLASH: "gemini-1.5-flash",
  GEMINI_1_5_PRO: "gemini-1.5-pro",
  TEXT_EMBEDDING_004: "text-embedding-004",

  // Local Open-Source Models (Ollama)
  LLAMA_3_2: "llama3.2",
  LLAMA_3_2_1B: "llama3.2:1b",
  QWEN_2_5: "qwen2.5",
  QWEN_2_5_CODER: "qwen2.5-coder",
  DEEPSEEK_R1: "deepseek-r1",
  MISTRAL: "mistral",
  GEMMA_2: "gemma2",
  LLAVA: "llava",
  NOMIC_EMBED_TEXT: "nomic-embed-text",

  // Cloud Models (Optional Fallbacks)
  GPT_4O_MINI: "gpt-4o-mini",
  GPT_4O: "gpt-4o",
  CLAUDE_3_5_HAIKU: "claude-3-5-haiku-20241022",
  CLAUDE_3_5_SONNET: "claude-3-5-sonnet-20241022",
  CLAUDE_3_7_SONNET: "claude-3-7-sonnet-20250219",
  O3_MINI: "o3-mini",
  O1: "o1",
  TEXT_EMBEDDING_3_SMALL: "text-embedding-3-small",
} as const;

export const DEFAULT_ROUTING_POLICIES: Record<TaskCategory, RoutingPolicy> = {
  SIMPLE: {
    category: "SIMPLE",
    primaryModel: MODELS.GEMINI_FLASH_LATEST,
    fallbackModels: [MODELS.GEMINI_1_5_FLASH, MODELS.LLAMA_3_2, MODELS.GPT_4O_MINI],
    timeoutMs: 15000,
    confidenceThreshold: 0.7,
    escalationTarget: "GENERAL",
    description: "Fast responses for simple facts, greetings, definitions, and short queries",
  },
  GENERAL: {
    category: "GENERAL",
    primaryModel: MODELS.GEMINI_FLASH_LATEST,
    fallbackModels: [MODELS.GEMINI_1_5_PRO, MODELS.LLAMA_3_2, MODELS.GPT_4O],
    timeoutMs: 30000,
    confidenceThreshold: 0.65,
    escalationTarget: "REASONING",
    description: "High-capability model for explanations, brainstorming, and writing",
  },
  REASONING: {
    category: "REASONING",
    primaryModel: MODELS.GEMINI_1_5_PRO,
    fallbackModels: [MODELS.GEMINI_2_5_FLASH, MODELS.DEEPSEEK_R1, MODELS.O3_MINI],
    timeoutMs: 60000,
    confidenceThreshold: 0.6,
    description: "Deep reasoning for mathematical proofs, algorithmic analysis, and complex deductions",
  },
  RESEARCH: {
    category: "RESEARCH",
    primaryModel: MODELS.GEMINI_FLASH_LATEST,
    fallbackModels: [MODELS.GEMINI_1_5_PRO, MODELS.LLAMA_3_2, MODELS.GPT_4O],
    timeoutMs: 40000,
    confidenceThreshold: 0.65,
    requiresTools: ["web_search"],
    description: "Synthesis over live multi-source research pipeline",
  },
  CODING: {
    category: "CODING",
    primaryModel: MODELS.GEMINI_FLASH_LATEST,
    fallbackModels: [MODELS.GEMINI_1_5_PRO, MODELS.QWEN_2_5_CODER, MODELS.CLAUDE_3_5_SONNET],
    timeoutMs: 45000,
    confidenceThreshold: 0.7,
    escalationTarget: "REASONING",
    description: "Code generation, architecture, refactoring, debugging, and SQL queries",
  },
  VISION: {
    category: "VISION",
    primaryModel: MODELS.GEMINI_FLASH_LATEST,
    fallbackModels: [MODELS.GEMINI_1_5_PRO, MODELS.LLAVA, MODELS.GPT_4O],
    timeoutMs: 40000,
    confidenceThreshold: 0.85,
    requiresTools: ["multimodal_vision"],
    description: "Multimodal image understanding, OCR, charts, and diagrams",
  },
  FILE_ANALYSIS: {
    category: "FILE_ANALYSIS",
    primaryModel: MODELS.GEMINI_FLASH_LATEST,
    fallbackModels: [MODELS.GEMINI_1_5_PRO, MODELS.LLAMA_3_2, MODELS.GPT_4O],
    timeoutMs: 45000,
    confidenceThreshold: 0.8,
    requiresTools: ["file_retrieval"],
    description: "Document ingestion, CSV data parsing, PDF comprehension, and long-context processing",
  },
};

export class PolicyManager {
  private policies: Map<TaskCategory, RoutingPolicy>;

  constructor(initialPolicies = DEFAULT_ROUTING_POLICIES) {
    this.policies = new Map(Object.entries(initialPolicies) as [TaskCategory, RoutingPolicy][]);
  }

  getPolicy(category: TaskCategory): RoutingPolicy {
    const policy = this.policies.get(category);
    if (!policy) {
      return this.policies.get("GENERAL") || DEFAULT_ROUTING_POLICIES.GENERAL;
    }
    return { ...policy };
  }

  setPolicy(category: TaskCategory, policyUpdate: Partial<RoutingPolicy>): void {
    const existing = this.getPolicy(category);
    this.policies.set(category, { ...existing, ...policyUpdate });
  }

  getAllPolicies(): Record<TaskCategory, RoutingPolicy> {
    const result = {} as Record<TaskCategory, RoutingPolicy>;
    for (const [k, v] of this.policies.entries()) {
      result[k] = { ...v };
    }
    return result;
  }
}

export const defaultPolicyManager = new PolicyManager();
