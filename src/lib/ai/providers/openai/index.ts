import OpenAI, {
  APIError,
  AuthenticationError,
  RateLimitError,
  APIConnectionError,
  InternalServerError,
} from "openai";
import {
  GenerateTextParams,
  AITextResponse,
  StreamTextParams,
  AIStreamChunk,
  AnalyzeImageParams,
  AnalyzeFileParams,
  AIAnalysisResponse,
  EmbedTextParams,
  AIEmbeddingResponse,
} from "../../types";
import { BaseAIAdapter } from "../base-adapter";
import { AIProviderError } from "../../errors";
import { aiLogger } from "../../logger";

export class OpenAIAdapter extends BaseAIAdapter {
  readonly id = "openai";
  readonly name = "OpenAI";
  private configuredApiKey?: string;
  private baseUrl?: string;
  private defaultModel: string;

  constructor(options?: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    super();
    this.configuredApiKey = options?.apiKey;
    this.baseUrl = options?.baseUrl;
    this.defaultModel = options?.defaultModel || process.env.DEFAULT_AI_MODEL || "gpt-4o";
  }

  /**
   * Dynamically retrieves the active API key from instance options or runtime process.env.
   */
  private getApiKey(): string | undefined {
    return this.configuredApiKey || process.env.OPENAI_API_KEY;
  }

  /**
   * Checks if a valid API key is present (non-empty and not a default placeholder).
   */
  isAvailable(): boolean {
    const key = this.getApiKey()?.trim();
    return Boolean(key && key.length > 0 && key !== "your_key_here" && !key.startsWith("your_openai"));
  }

  /**
   * Instantiates an official OpenAI client instance.
   * Throws a descriptive error if the API key is unconfigured.
   */
  private getClient(): OpenAI {
    const key = this.getApiKey()?.trim();

    if (!key || key === "your_key_here" || key.startsWith("your_")) {
      throw new AIProviderError({
        type: "authentication",
        message:
          "OpenAI API key is missing or not configured. Please add your real OPENAI_API_KEY to .env.local to enable live AI responses.",
        statusCode: 401,
        providerName: this.id,
      });
    }

    const baseURL = this.baseUrl || process.env.OPENAI_BASE_URL || undefined;
    return new OpenAI({
      apiKey: key,
      baseURL,
    });
  }

  /**
   * Normalizes official OpenAI SDK errors into project AIProviderError format.
   */
  private handleOpenAIError(err: unknown, defaultMessage: string): never {
    if (err instanceof AIProviderError) {
      throw err;
    }

    if (err instanceof AuthenticationError) {
      throw new AIProviderError({
        type: "authentication",
        message: "Invalid OpenAI API Key. Please verify your OPENAI_API_KEY in .env.local.",
        statusCode: 401,
        providerName: this.id,
        rawError: err,
      });
    }

    if (err instanceof RateLimitError) {
      throw new AIProviderError({
        type: "rate_limit",
        message: "OpenAI rate limit or usage quota exceeded. Please check your OpenAI account billing.",
        statusCode: 429,
        providerName: this.id,
        rawError: err,
      });
    }

    if (err instanceof APIConnectionError) {
      throw new AIProviderError({
        type: "network_error",
        message: "Unable to connect to OpenAI API servers. Please check your internet connection.",
        statusCode: 503,
        providerName: this.id,
        rawError: err,
      });
    }

    if (err instanceof InternalServerError) {
      throw new AIProviderError({
        type: "server_error",
        message: "OpenAI internal server error. Please retry in a few moments.",
        statusCode: 500,
        providerName: this.id,
        rawError: err,
      });
    }

    if (err instanceof APIError) {
      throw new AIProviderError({
        type: "server_error",
        message: `OpenAI API Error (${err.status || 500}): ${err.message}`,
        statusCode: err.status || 500,
        providerName: this.id,
        rawError: err,
      });
    }

    throw new AIProviderError({
      type: "unknown",
      message: err instanceof Error ? err.message : defaultMessage,
      providerName: this.id,
      rawError: err,
    });
  }

  /**
   * Non-streaming text generation using the official OpenAI API.
   */
  async generateText(params: GenerateTextParams): Promise<AITextResponse> {
    const model = params.model || process.env.DEFAULT_AI_MODEL || this.defaultModel;
    const messages = this.normalizeMessages(params.messages);
    const startTime = Date.now();

    aiLogger.info("ai_gateway_generate_text", { provider: this.id, model });

    if (params.simulateError) {
      throw new AIProviderError({
        type: "rate_limit",
        message: "Simulated rate limit error for error handling verification.",
        providerName: this.id,
        statusCode: 429,
      });
    }

    const client = this.getClient();

    try {
      const response = await client.chat.completions.create(
        {
          model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            name: m.name,
          })),
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens,
        },
        { signal: params.signal }
      );

      const choice = response.choices?.[0];
      const text = choice?.message?.content || "";

      return {
        text,
        finishReason: (choice?.finish_reason as AITextResponse["finishReason"]) || "stop",
        model: response.model || model,
        provider: this.id,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        raw: response,
      };
    } catch (err) {
      aiLogger.error("ai_gateway_generate_text_error", {
        provider: this.id,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      this.handleOpenAIError(err, "OpenAI text generation failed");
    }
  }

  /**
   * Real-time text streaming using the official OpenAI API.
   */
  async *streamText(params: StreamTextParams): AsyncGenerator<AIStreamChunk, void, unknown> {
    const model = params.model || process.env.DEFAULT_AI_MODEL || this.defaultModel;
    const messages = this.normalizeMessages(params.messages);
    const startTime = Date.now();

    aiLogger.info("ai_gateway_stream_text_start", { provider: this.id, model });

    if (params.simulateError) {
      yield { type: "status", statusMessage: "Contacting OpenAI gateway..." };
      throw new AIProviderError({
        type: "rate_limit",
        message: "Simulated Rate Limit (429) from OpenAI Gateway.",
        providerName: this.id,
        statusCode: 429,
      });
    }

    const client = this.getClient();
    yield { type: "status", statusMessage: `Streaming from ${this.name} (${model})...` };

    try {
      const stream = await client.chat.completions.create(
        {
          model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            name: m.name,
          })),
          stream: true,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens,
        },
        { signal: params.signal }
      );

      for await (const chunk of stream) {
        if (params.signal?.aborted) {
          yield { type: "done", finishReason: "abort" };
          return;
        }

        const delta = chunk.choices?.[0]?.delta;
        if (delta?.content) {
          yield { type: "text", content: delta.content };
        }

        // Support reasoning models (o1, o3, etc.)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reasoningContent = (delta as any)?.reasoning_content;
        if (reasoningContent) {
          yield { type: "reasoning", content: reasoningContent };
        }

        const finishReason = chunk.choices?.[0]?.finish_reason;
        if (finishReason) {
          yield {
            type: "done",
            finishReason: (finishReason as AIStreamChunk["finishReason"]) || "stop",
          };
          return;
        }
      }

      yield { type: "done", finishReason: "stop" };
    } catch (err) {
      aiLogger.error("ai_gateway_stream_text_error", {
        provider: this.id,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      this.handleOpenAIError(err, "OpenAI streaming request failed");
    }
  }

  /**
   * Multimodal image analysis using OpenAI Vision (e.g. gpt-4o).
   */
  async analyzeImage(params: AnalyzeImageParams): Promise<AIAnalysisResponse> {
    const model = params.model || "gpt-4o";
    const dataUrl = this.imageToDataUrl(params.image, params.mimeType);

    aiLogger.info("ai_gateway_analyze_image", { provider: this.id, model });
    const client = this.getClient();

    try {
      const response = await client.chat.completions.create(
        {
          model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: params.prompt },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
        },
        { signal: params.signal }
      );

      const analysis = response.choices?.[0]?.message?.content || "";
      return {
        analysis,
        model: response.model || model,
        provider: this.id,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        raw: response,
      };
    } catch (err) {
      this.handleOpenAIError(err, "OpenAI image analysis failed");
    }
  }

  /**
   * File analysis through context-augmented prompt generation.
   */
  async analyzeFile(params: AnalyzeFileParams): Promise<AIAnalysisResponse> {
    const model = params.model || process.env.DEFAULT_AI_MODEL || this.defaultModel;

    let fileContent = "";
    if (typeof params.file === "string") {
      fileContent = params.file;
    } else {
      const uint8 = params.file instanceof Uint8Array ? params.file : new Uint8Array(params.file);
      fileContent = Buffer.from(uint8).toString("utf-8");
    }

    const promptWithDoc = `Attached Document: ${params.filename} (${params.mimeType})\n\nContent:\n${fileContent.substring(
      0,
      12000
    )}\n\nTask: ${params.prompt}`;

    return this.generateText({
      messages: [{ role: "user", content: promptWithDoc }],
      model,
      signal: params.signal,
    }).then((res) => ({
      analysis: res.text,
      model: res.model,
      provider: this.id,
      usage: res.usage,
      metadata: { filename: params.filename, mimeType: params.mimeType },
    }));
  }

  /**
   * Text embeddings generation using OpenAI Embeddings API.
   */
  async embedText(params: EmbedTextParams): Promise<AIEmbeddingResponse> {
    const model = params.model || "text-embedding-3-small";
    const inputs = Array.isArray(params.text) ? params.text : [params.text];

    aiLogger.info("ai_gateway_embed_text", { provider: this.id, model, inputCount: inputs.length });
    const client = this.getClient();

    try {
      const response = await client.embeddings.create(
        {
          model,
          input: inputs,
        },
        { signal: params.signal }
      );

      const embeddings = response.data.map((item) => item.embedding);
      return {
        embeddings,
        dimensions: embeddings[0]?.length || 1536,
        model: response.model || model,
        provider: this.id,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: 0,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        raw: response,
      };
    } catch (err) {
      this.handleOpenAIError(err, "OpenAI text embedding failed");
    }
  }
}

export const openAIAdapter = new OpenAIAdapter();
