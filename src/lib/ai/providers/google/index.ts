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

export class GoogleAdapter extends BaseAIAdapter {
  readonly id = "google";
  readonly name = "Google Gemini";
  private configuredApiKey?: string;
  private baseUrl: string;
  private configuredModel?: string;

  constructor(options?: { apiKey?: string; baseUrl?: string; defaultModel?: string }) {
    super();
    this.configuredApiKey = options?.apiKey;
    this.baseUrl = options?.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
    this.configuredModel = options?.defaultModel;
  }

  /**
   * Dynamically retrieves the active API key at runtime.
   */
  private getApiKey(): string | undefined {
    return (
      this.configuredApiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY
    );
  }

  /**
   * Retrieves the configured default model.
   * Defaults to 'gemini-2.5-flash' (or 'gemini-1.5-flash').
   */
  getDefaultModel(): string {
    return (
      this.configuredModel ||
      process.env.GEMINI_MODEL ||
      process.env.DEFAULT_AI_MODEL ||
      "gemini-flash-latest"
    );
  }

  /**
   * Checks if a valid API key is present.
   */
  isAvailable(): boolean {
    const key = this.getApiKey()?.trim();
    return Boolean(
      key &&
        key.length > 0 &&
        key !== "your_gemini_key_here" &&
        key !== "YOUR_GEMINI_API_KEY" &&
        !key.startsWith("your_") &&
        !key.startsWith("YOUR_")
    );
  }

  /**
   * Validates and returns the active API key, throwing a friendly error if missing.
   */
  private requireApiKey(): string {
    const key = this.getApiKey()?.trim();
    if (
      !key ||
      key === "your_gemini_key_here" ||
      key === "YOUR_GEMINI_API_KEY" ||
      key.startsWith("your_") ||
      key.startsWith("YOUR_")
    ) {
      throw new AIProviderError({
        type: "authentication",
        message:
          "Google Gemini API key is not configured. Please add your GEMINI_API_KEY to .env.local to enable live AI responses.",
        statusCode: 401,
        providerName: this.id,
      });
    }
    return key;
  }

  /**
   * Normalizes Gemini HTTP errors into descriptive user-facing errors.
   */
  private handleGeminiError(errText: string, statusCode: number, defaultMsg: string): never {
    const lower = errText.toLowerCase();

    if (
      statusCode === 400 ||
      statusCode === 401 ||
      statusCode === 403 ||
      lower.includes("api_key_invalid") ||
      lower.includes("invalid api key") ||
      lower.includes("api key not valid") ||
      lower.includes("key not found") ||
      lower.includes("unauthenticated") ||
      lower.includes("permission_denied")
    ) {
      throw new AIProviderError({
        type: "authentication",
        message: "Invalid or unconfigured Google Gemini API Key. Please set a valid GEMINI_API_KEY in .env.local.",
        statusCode: 401,
        providerName: this.id,
      });
    }

    if (statusCode === 429 || lower.includes("resource_exhausted") || lower.includes("quota")) {
      throw new AIProviderError({
        type: "rate_limit",
        message: "Google Gemini rate limit or free-tier quota exceeded. Please wait a moment and try again.",
        statusCode: 429,
        providerName: this.id,
      });
    }

    if (statusCode === 404) {
      throw new AIProviderError({
        type: "not_found",
        message: "Gemini model was not found. Please verify your GEMINI_MODEL setting in .env.local (e.g. 'gemini-2.5-flash' or 'gemini-1.5-flash').",
        statusCode: 404,
        providerName: this.id,
      });
    }

    throw new AIProviderError({
      type: "server_error",
      message: `Google Gemini Error (${statusCode}): ${errText || defaultMsg}`,
      statusCode,
      providerName: this.id,
    });
  }

  /**
   * Non-streaming text generation using Google Gemini.
   */
  async generateText(params: GenerateTextParams): Promise<AITextResponse> {
    const apiKey = this.requireApiKey();
    const model = params.model || this.getDefaultModel();
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

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    try {
      const endpoint = `${this.baseUrl}/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: params.temperature ?? 0.7,
            maxOutputTokens: params.maxTokens,
          },
        }),
        signal: params.signal,
      });

      if (!response.ok) {
        const err = await response.text().catch(() => "");
        this.handleGeminiError(err, response.status, "Gemini text generation failed");
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return {
        text,
        finishReason: data.candidates?.[0]?.finishReason === "STOP" ? "stop" : "length",
        model,
        provider: this.id,
        usage: data.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount,
              completionTokens: data.usageMetadata.candidatesTokenCount,
              totalTokens: data.usageMetadata.totalTokenCount,
            }
          : undefined,
        raw: data,
      };
    } catch (err) {
      aiLogger.error("ai_gateway_generate_text_error", {
        provider: this.id,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError({
        type: "network_error",
        message: err instanceof Error ? err.message : "Failed to connect to Google Gemini API",
        statusCode: 503,
        providerName: this.id,
        rawError: err,
      });
    }
  }

  /**
   * Real-time streaming response from Google Gemini API.
   */
  async *streamText(params: StreamTextParams): AsyncGenerator<AIStreamChunk, void, unknown> {
    const apiKey = this.requireApiKey();
    const model = params.model || this.getDefaultModel();
    const messages = this.normalizeMessages(params.messages);
    const startTime = Date.now();

    aiLogger.info("ai_gateway_stream_text_start", { provider: this.id, model });

    if (params.simulateError) {
      yield { type: "status", statusMessage: "Contacting Google Gemini gateway..." };
      throw new AIProviderError({
        type: "rate_limit",
        message: "Simulated Rate Limit (429) from Gemini Gateway.",
        providerName: this.id,
        statusCode: 429,
      });
    }

    yield { type: "status", statusMessage: `Streaming from Google Gemini (${model})...` };

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    let response: Response;
    let activeModel = model;

    try {
      const endpoint = `${this.baseUrl}/models/${activeModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: params.temperature ?? 0.7,
            maxOutputTokens: params.maxTokens,
          },
        }),
        signal: params.signal,
      });

      // If 503 High Demand on primary model, fallback to gemini-flash-lite-latest
      if (!response.ok && response.status === 503 && activeModel !== "gemini-flash-lite-latest") {
        activeModel = "gemini-flash-lite-latest";
        yield { type: "status", statusMessage: `Connecting via high-speed Gemini Lite (${activeModel})...` };
        const fallbackEndpoint = `${this.baseUrl}/models/${activeModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
        response = await fetch(fallbackEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: params.temperature ?? 0.7,
              maxOutputTokens: params.maxTokens,
            },
          }),
          signal: params.signal,
        });
      }
    } catch (err) {
      throw new AIProviderError({
        type: "network_error",
        message: `Unable to connect to Google Gemini API: ${err instanceof Error ? err.message : String(err)}`,
        statusCode: 503,
        providerName: this.id,
        rawError: err,
      });
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      this.handleGeminiError(errText, response.status, "Gemini streaming request failed");
    }

    if (!response.body) {
      throw new AIProviderError({
        type: "server_error",
        message: "Google Gemini returned empty stream body.",
        statusCode: 500,
        providerName: this.id,
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (params.signal?.aborted) {
          yield { type: "done", finishReason: "abort" };
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, "");
          try {
            const parsed = JSON.parse(jsonStr);
            const textDelta = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textDelta) {
              yield { type: "text", content: textDelta };
            }
          } catch {
            // Partial chunk
          }
        }
      }

      yield { type: "done", finishReason: "stop" };
    } catch (err) {
      aiLogger.error("ai_gateway_stream_text_error", {
        provider: this.id,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError({
        type: "server_error",
        message: err instanceof Error ? err.message : "Gemini streaming failed",
        providerName: this.id,
        rawError: err,
      });
    }
  }

  /**
   * Multimodal image analysis using Gemini Vision.
   */
  async analyzeImage(params: AnalyzeImageParams): Promise<AIAnalysisResponse> {
    const apiKey = this.requireApiKey();
    const model = params.model || "gemini-2.5-flash";
    const dataUrl = this.imageToDataUrl(params.image, params.mimeType);
    const base64Data = dataUrl.replace(/^data:[a-zA-Z0-9/]+;base64,/, "");

    aiLogger.info("ai_gateway_analyze_image", { provider: this.id, model });

    try {
      const endpoint = `${this.baseUrl}/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: params.prompt },
                {
                  inlineData: {
                    mimeType: params.mimeType || "image/jpeg",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
        signal: params.signal,
      });

      if (!response.ok) {
        const err = await response.text().catch(() => "");
        this.handleGeminiError(err, response.status, "Gemini image analysis failed");
      }

      const data = await response.json();
      const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return {
        analysis,
        model,
        provider: this.id,
        usage: data.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount,
              completionTokens: data.usageMetadata.candidatesTokenCount,
              totalTokens: data.usageMetadata.totalTokenCount,
            }
          : undefined,
        raw: data,
      };
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError({
        type: "unknown",
        message: err instanceof Error ? err.message : "Gemini image analysis failed",
        providerName: this.id,
        rawError: err,
      });
    }
  }

  /**
   * Document and file analysis through Gemini context augmentation.
   */
  async analyzeFile(params: AnalyzeFileParams): Promise<AIAnalysisResponse> {
    const model = params.model || this.getDefaultModel();

    let fileContent = "";
    if (typeof params.file === "string") {
      fileContent = params.file;
    } else {
      const uint8 = params.file instanceof Uint8Array ? params.file : new Uint8Array(params.file);
      fileContent = Buffer.from(uint8).toString("utf-8");
    }

    const promptWithDoc = `Attached Document: ${params.filename} (${params.mimeType})\n\nContent:\n${fileContent.substring(
      0,
      16000
    )}\n\nTask: ${params.prompt}`;

    const res = await this.generateText({
      messages: [{ role: "user", content: promptWithDoc }],
      model,
      signal: params.signal,
    });

    return {
      analysis: res.text,
      model: res.model,
      provider: this.id,
      usage: res.usage,
      metadata: { filename: params.filename, mimeType: params.mimeType },
    };
  }

  /**
   * Text embeddings using Gemini text-embedding-004.
   */
  async embedText(params: EmbedTextParams): Promise<AIEmbeddingResponse> {
    const apiKey = this.requireApiKey();
    const model = params.model || "text-embedding-004";
    const inputs = Array.isArray(params.text) ? params.text : [params.text];

    aiLogger.info("ai_gateway_embed_text", { provider: this.id, model, inputCount: inputs.length });

    try {
      const endpoint = `${this.baseUrl}/models/${model}:batchEmbedContents?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: inputs.map((t) => ({
            model: `models/${model}`,
            content: { parts: [{ text: t }] },
          })),
        }),
        signal: params.signal,
      });

      if (!response.ok) {
        const err = await response.text().catch(() => "");
        this.handleGeminiError(err, response.status, "Gemini text embedding failed");
      }

      const data = await response.json();
      const embeddings = (data.embeddings || []).map((e: { values: number[] }) => e.values);

      return {
        embeddings,
        dimensions: embeddings[0]?.length || 768,
        model,
        provider: this.id,
        raw: data,
      };
    } catch (err) {
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError({
        type: "unknown",
        message: err instanceof Error ? err.message : "Gemini embedding failed",
        providerName: this.id,
        rawError: err,
      });
    }
  }
}

export const googleAdapter = new GoogleAdapter();
export const geminiAdapter = googleAdapter;
