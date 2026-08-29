import { AIProviderAdapter } from "./types";
import { openAIAdapter, OpenAIAdapter } from "./providers/openai";

export const firstProvider = openAIAdapter;
export { OpenAIAdapter as FirstProvider };

export function getAIProvider(): AIProviderAdapter {
  return openAIAdapter;
}

export * from "./types";
export * from "./errors";
export * from "./logger";
