import { AIProviderAdapter } from "./types";
import { googleAdapter } from "./providers/google";
import { ollamaAdapter } from "./providers/ollama";
import { openAIAdapter } from "./providers/openai";
import { anthropicAdapter } from "./providers/anthropic";
import { ProviderUnavailableError } from "./errors";
import { aiLogger } from "./logger";

export class AIRouter {
  private adapters = new Map<string, AIProviderAdapter>();

  constructor() {
    // 1. Register Google Gemini (Default Primary Cloud Provider)
    this.register(googleAdapter);
    this.adapters.set("gemini", googleAdapter);

    // 2. Register Local Open-Source AI Engine (Ollama)
    this.register(ollamaAdapter);
    this.adapters.set("local", ollamaAdapter);

    // 3. Register optional providers (OpenAI, Anthropic)
    this.register(openAIAdapter);
    this.register(anthropicAdapter);
  }

  register(adapter: AIProviderAdapter): void {
    this.adapters.set(adapter.id.toLowerCase(), adapter);
  }

  getAdapter(providerName?: string, modelName?: string): AIProviderAdapter {
    const configuredDefault = (
      process.env.AI_PROVIDER ||
      process.env.DEFAULT_AI_PROVIDER ||
      "gemini"
    ).toLowerCase();

    // 1. Explicit provider requested
    if (providerName) {
      const p = providerName.toLowerCase();
      const adapter = this.adapters.get(p);
      if (adapter) {
        return adapter;
      }
    }

    // 2. Model prefix inference
    if (modelName) {
      const m = modelName.toLowerCase();
      if (m.startsWith("gemini")) {
        const google = this.adapters.get("google");
        if (google) return google;
      } else if (
        m.startsWith("llama") ||
        m.startsWith("qwen") ||
        m.startsWith("deepseek") ||
        m.startsWith("mistral") ||
        m.startsWith("gemma") ||
        m.startsWith("phi") ||
        m.startsWith("llava") ||
        m.startsWith("nomic") ||
        m.startsWith("local")
      ) {
        const ollama = this.adapters.get("ollama");
        if (ollama) return ollama;
      } else if (m.startsWith("claude")) {
        const anthropic = this.adapters.get("anthropic");
        if (anthropic) return anthropic;
      } else if (m.startsWith("gpt") || m.startsWith("o1") || m.startsWith("o3")) {
        const openai = this.adapters.get("openai");
        if (openai) return openai;
      }
    }

    // 3. Configured AI Provider (Default: Gemini)
    const preferred = this.adapters.get(configuredDefault);
    if (preferred && preferred.isAvailable()) {
      return preferred;
    }

    // 4. Any other available provider
    for (const adapter of this.adapters.values()) {
      if (adapter.isAvailable()) {
        return adapter;
      }
    }

    // 5. Default fallback to Gemini adapter
    const defaultGemini = this.adapters.get("google") || this.adapters.get("gemini");
    if (defaultGemini) {
      return defaultGemini;
    }

    aiLogger.error("ai_router_no_available_providers");
    throw new ProviderUnavailableError(
      "AI Gateway",
      "No AI providers are configured. Please set GEMINI_API_KEY in .env.local to enable live responses."
    );
  }

  listAvailableProviders(): Array<{ id: string; name: string }> {
    return Array.from(new Set(this.adapters.values()))
      .filter((a) => a.isAvailable())
      .map((a) => ({ id: a.id, name: a.name }));
  }
}

export const aiRouter = new AIRouter();
