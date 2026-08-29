import {
  GenerateTextParams,
  AITextResponse,
  StreamTextParams,
  AIStreamChunk,
  AnalyzeImageParams,
  AnalyzeFileParams,
  AIAnalysisResponse,
  AIEmbeddingResponse,
} from "../../types";
import { BaseAIAdapter } from "../base-adapter";
import { AIProviderError } from "../../errors";
import { aiLogger } from "../../logger";

export class AnthropicAdapter extends BaseAIAdapter {
  readonly id = "anthropic";
  readonly name = "Anthropic";
  private apiKey?: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor(options?: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    super();
    this.apiKey = options?.apiKey || process.env.ANTHROPIC_API_KEY;
    this.baseUrl = options?.baseUrl || process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1";
    this.defaultModel = options?.defaultModel || "claude-3-5-sonnet-20241022";
  }

  isAvailable(): boolean {
    const key = this.apiKey?.trim();
    return Boolean(key && key !== "your_anthropic_key_here" && !key.startsWith("your_"));
  }

  async generateText(params: GenerateTextParams): Promise<AITextResponse> {
    this.ensureAvailable();
    const model = params.model || this.defaultModel;
    const messages = this.normalizeMessages(params.messages);

    const systemMsg = messages.find((m) => m.role === "system")?.content;
    const conversationMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

    try {
      const endpoint = `${this.baseUrl.replace(/\/+$/, "")}/messages`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey!,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          system: systemMsg,
          messages: conversationMessages,
          max_tokens: params.maxTokens || 4096,
          temperature: params.temperature ?? 0.7,
        }),
        signal: params.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new AIProviderError({
          type: response.status === 429 ? "rate_limit" : "server_error",
          message: `Anthropic API Error (${response.status}): ${errorText}`,
          statusCode: response.status,
          providerName: this.id,
        });
      }

      const data = await response.json();
      const textBlock = data.content?.find((c: { type: string; text?: string }) => c.type === "text");

      return {
        text: textBlock?.text || "",
        finishReason: data.stop_reason === "end_turn" ? "stop" : "length",
        model: data.model || model,
        provider: this.id,
        usage: data.usage
          ? {
              promptTokens: data.usage.input_tokens,
              completionTokens: data.usage.output_tokens,
              totalTokens: data.usage.input_tokens + data.usage.output_tokens,
            }
          : undefined,
        raw: data,
      };
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError({
        type: "unknown",
        message: err instanceof Error ? err.message : "Anthropic generation failed",
        providerName: this.id,
        rawError: err,
      });
    }
  }

  async *streamText(params: StreamTextParams): AsyncGenerator<AIStreamChunk, void, unknown> {
    this.ensureAvailable();
    const model = params.model || this.defaultModel;
    const messages = this.normalizeMessages(params.messages);

    const systemMsg = messages.find((m) => m.role === "system")?.content;
    const conversationMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));

    const endpoint = `${this.baseUrl.replace(/\/+$/, "")}/messages`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        system: systemMsg,
        messages: conversationMessages,
        max_tokens: params.maxTokens || 4096,
        temperature: params.temperature ?? 0.7,
        stream: true,
      }),
      signal: params.signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new AIProviderError({
        type: response.status === 429 ? "rate_limit" : "server_error",
        message: `Anthropic stream error: ${err}`,
        statusCode: response.status,
        providerName: this.id,
      });
    }

    if (!response.body) {
      throw new AIProviderError({
        type: "server_error",
        message: "Anthropic returned empty stream",
        providerName: this.id,
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, "");
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.type === "content_block_delta" && parsed.delta?.text) {
            yield { type: "text", content: parsed.delta.text };
          }
        } catch {
          // Ignore partial chunks
        }
      }
    }

    yield { type: "done", finishReason: "stop" };
  }

  async analyzeImage(params: AnalyzeImageParams): Promise<AIAnalysisResponse> {
    this.ensureAvailable();
    const model = params.model || this.defaultModel;
    const base64Data = typeof params.image === "string" && params.image.startsWith("data:")
      ? params.image.split(",")[1]
      : typeof params.image === "string"
      ? params.image
      : Buffer.from(params.image instanceof Uint8Array ? params.image : new Uint8Array(params.image)).toString("base64");

    const endpoint = `${this.baseUrl.replace(/\/+$/, "")}/messages`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: params.maxTokens || 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: params.mimeType || "image/jpeg",
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: params.prompt,
              },
            ],
          },
        ],
      }),
      signal: params.signal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new AIProviderError({
        type: response.status === 429 ? "rate_limit" : "server_error",
        message: `Anthropic Vision Error (${response.status}): ${err}`,
        statusCode: response.status,
        providerName: this.id,
      });
    }

    const data = await response.json();
    const textBlock = data.content?.find((c: { type: string; text?: string }) => c.type === "text");

    return {
      analysis: textBlock?.text || "",
      model: data.model || model,
      provider: this.id,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
      raw: data,
    };
  }

  async analyzeFile(params: AnalyzeFileParams): Promise<AIAnalysisResponse> {
    this.ensureAvailable();
    return this.generateText({
      messages: [
        {
          role: "user",
          content: `Document: ${params.filename}\n\n${typeof params.file === "string" ? params.file : Buffer.from(params.file instanceof Uint8Array ? params.file : new Uint8Array(params.file)).toString("utf-8")}\n\nTask: ${params.prompt}`,
        },
      ],
      model: params.model,
    }).then((res) => ({
      analysis: res.text,
      model: res.model,
      provider: this.id,
      usage: res.usage,
      metadata: { filename: params.filename, mimeType: params.mimeType },
    }));
  }

  async embedText(): Promise<AIEmbeddingResponse> {
    this.ensureAvailable();
    aiLogger.warn("anthropic_embeddings_unsupported", { provider: this.id });
    throw new AIProviderError({
      type: "invalid_request",
      message: "Anthropic API does not natively support embeddings. Please route embeddings to OpenAI or Google.",
      statusCode: 400,
      providerName: this.id,
      isRetryable: false,
    });
  }
}

export const anthropicAdapter = new AnthropicAdapter();
