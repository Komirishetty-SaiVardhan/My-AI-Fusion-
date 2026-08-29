export interface AppEnvironment {
  nodeEnv: "development" | "production" | "test";
  aiProvider: string;
  geminiApiKey?: string;
  geminiModel: string;
  defaultAiModel: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  openAiApiKey?: string;
  anthropicApiKey?: string;
  databaseUrl?: string;
  nextAuthSecret?: string;
  appUrl: string;
}

export function validateEnvironment(): AppEnvironment {
  const nodeEnv = (process.env.NODE_ENV as "development" | "production" | "test") || "development";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const aiProvider = process.env.AI_PROVIDER || process.env.DEFAULT_AI_PROVIDER || "gemini";
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const defaultAiModel = process.env.DEFAULT_AI_MODEL || geminiModel;

  return {
    nodeEnv,
    aiProvider,
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    geminiModel,
    defaultAiModel,
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL,
    ollamaModel: process.env.OLLAMA_MODEL,
    openAiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    nextAuthSecret: process.env.NEXTAUTH_SECRET,
    appUrl,
  };
}

export const env = validateEnvironment();
