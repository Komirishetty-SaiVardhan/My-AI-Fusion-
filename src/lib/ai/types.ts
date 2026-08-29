export * from "./errors";
export type MessageRole = "user" | "assistant" | "system";

export interface AIMessage {
  role: MessageRole;
  content: string;
  name?: string;
}

// Alias for legacy Chat compatibility
export type AIModelMessage = AIMessage;

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GatewayRequestOptions {
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  timeoutMs?: number;
  simulateError?: boolean;
}

// 1. Text Generation
export interface GenerateTextParams extends GatewayRequestOptions {
  messages: AIMessage[] | string;
  mode?: "auto" | "fast" | "reasoning" | "research";
}

export interface AITextResponse {
  text: string;
  reasoning?: string;
  finishReason: "stop" | "length" | "abort" | "error" | "unknown";
  model: string;
  provider: string;
  usage?: AIUsage;
  raw?: unknown;
}

// 2. Text Streaming
export interface StreamTextParams extends GatewayRequestOptions {
  conversationId?: string;
  messages: AIMessage[] | string;
  mode?: "auto" | "fast" | "reasoning" | "research";
}

export type AIStreamChunkType = "status" | "reasoning" | "text" | "usage" | "done" | "error";

export interface AIStreamChunk {
  type: AIStreamChunkType;
  content?: string;
  statusMessage?: string;
  error?: string;
  finishReason?: "stop" | "length" | "abort" | "error";
  usage?: AIUsage;
}

// 3. Image Understanding
export interface AnalyzeImageParams extends GatewayRequestOptions {
  image: string | Uint8Array | ArrayBuffer;
  prompt: string;
  mimeType?: string;
}

export interface AIAnalysisResponse {
  analysis: string;
  model: string;
  provider: string;
  usage?: AIUsage;
  metadata?: Record<string, unknown>;
  raw?: unknown;
}

// 4. File / Document Understanding
export interface AnalyzeFileParams extends GatewayRequestOptions {
  file: string | Uint8Array | ArrayBuffer;
  filename: string;
  mimeType: string;
  prompt: string;
}

// 5. Text Embeddings
export interface EmbedTextParams extends GatewayRequestOptions {
  text: string | string[];
}

export interface AIEmbeddingResponse {
  embeddings: number[][];
  dimensions: number;
  model: string;
  provider: string;
  usage?: AIUsage;
  raw?: unknown;
}

// Provider Adapter Interface
export interface AIProviderAdapter {
  readonly id: string;
  readonly name: string;
  isAvailable(): boolean;
  generateText(params: GenerateTextParams): Promise<AITextResponse>;
  streamText(params: StreamTextParams): AsyncGenerator<AIStreamChunk, void, unknown>;
  analyzeImage(params: AnalyzeImageParams): Promise<AIAnalysisResponse>;
  analyzeFile(params: AnalyzeFileParams): Promise<AIAnalysisResponse>;
  embedText(params: EmbedTextParams): Promise<AIEmbeddingResponse>;
}

// Common AI Gateway Interface
export interface IAIGateway {
  generateText(params: GenerateTextParams): Promise<AITextResponse>;
  streamText(params: StreamTextParams): AsyncGenerator<AIStreamChunk, void, unknown>;
  analyzeImage(params: AnalyzeImageParams): Promise<AIAnalysisResponse>;
  analyzeFile(params: AnalyzeFileParams): Promise<AIAnalysisResponse>;
  embedText(params: EmbedTextParams): Promise<AIEmbeddingResponse>;
}

// Legacy Aliases
export type AIProvider = AIProviderAdapter;
export type AICompletionRequest = StreamTextParams;
export interface StreamChatOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}
export interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  timeoutMs?: number;
}
