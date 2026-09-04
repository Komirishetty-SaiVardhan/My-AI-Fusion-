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
   * Defaults to 'gemini-3.6-flash'.
   */
  getDefaultModel(): string {
    return (
      this.configuredModel ||
      process.env.GEMINI_MODEL ||
      process.env.DEFAULT_AI_MODEL ||
      "gemini-3.6-flash"
    );
  }

  /**
   * Resolves an ordered list of candidate models for fallback resilience.
   */
  private resolveCandidateModels(requestedModel?: string): string[] {
    const raw = requestedModel || this.getDefaultModel();
    // Upgrade deprecated, legacy, or foreign aliases to active high-performance Gemini endpoints
    const primary =
      raw === "gemini-flash-latest" ||
      raw === "gemini-2.5-flash" ||
      raw === "gemini-2.0-flash" ||
      raw === "gemini-1.5-flash" ||
      raw.startsWith("llama")
        ? "gemini-3.6-flash"
        : raw === "gemini-pro-latest" || raw === "gemini-1.5-pro"
        ? "gemini-3.7-flash"
        : raw === "gpt-4o" || raw.startsWith("gpt")
        ? "gemini-3.5-flash"
        : raw;

    const fallbackChain = [
      primary,
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
    ];

    return Array.from(new Set(fallbackChain));
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

    if (statusCode === 503 || lower.includes("high demand") || lower.includes("unavailable")) {
      throw new AIProviderError({
        type: "server_error",
        message: "Google Gemini is currently experiencing temporary high demand. Please retry in a few moments.",
        statusCode: 503,
        providerName: this.id,
      });
    }

    if (statusCode === 404) {
      throw new AIProviderError({
        type: "not_found",
        message: "Gemini model was not found or is deprecated. Defaulting to gemini-3.6-flash.",
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
   * Non-streaming text generation using Google Gemini with multi-tier fallback.
   */
  async generateText(params: GenerateTextParams): Promise<AITextResponse> {
    const apiKey = this.requireApiKey();
    const candidateModels = this.resolveCandidateModels(params.model);
    const messages = this.normalizeMessages(params.messages);
    const startTime = Date.now();

    aiLogger.info("ai_gateway_generate_text", { provider: this.id, models: candidateModels });

    if (params.simulateError) {
      throw new AIProviderError({
        type: "rate_limit",
        message: "Simulated rate limit error for error handling verification.",
        providerName: this.id,
        statusCode: 429,
      });
    }

    const rawSystemMessage = messages.find((m) => m.role === "system")?.content;
    const identityInstruction = `You are My AI, an intelligent, fast, reasoning, multimodal, and helpful AI assistant created and developed by Komirishetty Sai Vardhan.
Your name is My AI. You were created and developed solely by Komirishetty Sai Vardhan. Never say you are Gemini or developed by Google. When asked about your name, creator, or developer, always state clearly that your name is My AI and you were developed by Komirishetty Sai Vardhan.

CAPABILITIES:
1. IMAGE GENERATION:
When the user asks to generate, create, draw, paint, visualize, or prepare an image:
- Formulate a vivid, detailed visual prompt describing the scene, lighting, perspective, and atmosphere.
- Embed the generated image directly in your markdown response using:
  ![Detailed Image Description](https://image.pollinations.ai/prompt/<URL_ENCODED_PROMPT>?width=1024&height=1024&model=flux&nologo=true&enhance=true)
  (Ensure the prompt inside the URL is properly URI-encoded with %20 for spaces).
- Provide a brief description of the artwork composition.

2. DOCUMENT & PDF PREPARATION:
When the user asks to generate, prepare, create, or export a PDF, report, contract, invoice, resume, proposal, or structured document:
- Structure the response as a complete, publication-ready Markdown document with clean hierarchical headings (# Title, ## Sections, ### Subsections), executive summaries, structured key takeaways, formatted data tables, and metadata.
- Remind the user that they can export, print, or download the document as a PDF, Word (.doc), or Markdown file using the 'Export PDF' / 'Download' buttons directly below the message.`;
    const systemMessage = rawSystemMessage
      ? `${identityInstruction}\n\n${rawSystemMessage}`
      : identityInstruction;

    const nonSystemMessages = messages.filter((m) => m.role !== "system");
    const contents = (nonSystemMessages.length > 0 ? nonSystemMessages : messages).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    let lastError: unknown = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const activeModel = candidateModels[i];
      try {
        const endpoint = `${this.baseUrl}/models/${activeModel}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemMessage }],
            },
            contents,
            generationConfig: {
              temperature: params.temperature ?? 0.7,
              maxOutputTokens: params.maxTokens,
            },
          }),
          signal: params.signal,
        });

        // If 503 or 404 or 429, try next model in fallback chain
        if (!response.ok && (response.status === 503 || response.status === 404 || response.status === 429) && i < candidateModels.length - 1) {
          aiLogger.warn("gemini_generate_text_fallback", {
            failedModel: activeModel,
            status: response.status,
            nextModel: candidateModels[i + 1],
          });
          continue;
        }

        if (!response.ok) {
          const err = await response.text().catch(() => "");
          this.handleGeminiError(err, response.status, "Gemini text generation failed");
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return {
          text,
          finishReason: data.candidates?.[0]?.finishReason === "STOP" ? "stop" : "length",
          model: activeModel,
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
        lastError = err;
        if (err instanceof AIProviderError && (err.statusCode === 503 || err.statusCode === 404 || err.statusCode === 429) && i < candidateModels.length - 1) {
          continue;
        }
        if (i < candidateModels.length - 1 && !(err instanceof DOMException && err.name === "AbortError")) {
          continue;
        }
        throw err;
      }
    }

    aiLogger.error("ai_gateway_generate_text_error", {
      provider: this.id,
      durationMs: Date.now() - startTime,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });

    if (lastError instanceof AIProviderError) throw lastError;
    throw new AIProviderError({
      type: "network_error",
      message: lastError instanceof Error ? lastError.message : "Failed to connect to Google Gemini API",
      statusCode: 503,
      providerName: this.id,
      rawError: lastError,
    });
  }

  /**
   * Real-time streaming response from Google Gemini API with multi-tier fallback resilience.
   */
  async *streamText(params: StreamTextParams): AsyncGenerator<AIStreamChunk, void, unknown> {
    const apiKey = this.requireApiKey();
    const candidateModels = this.resolveCandidateModels(params.model);
    const messages = this.normalizeMessages(params.messages);
    const startTime = Date.now();

    aiLogger.info("ai_gateway_stream_text_start", { provider: this.id, models: candidateModels });

    if (params.simulateError) {
      yield { type: "status", statusMessage: "Thinking..." };
      throw new AIProviderError({
        type: "rate_limit",
        message: "Simulated Rate Limit (429) from Gemini Gateway.",
        providerName: this.id,
        statusCode: 429,
      });
    }

    yield { type: "status", statusMessage: "Thinking..." };

    const rawSystemMessage = messages.find((m) => m.role === "system")?.content;
    const identityInstruction = `You are My AI, an intelligent, fast, reasoning, multimodal, and helpful AI assistant created and developed by Komirishetty Sai Vardhan.
Your name is My AI. You were created and developed solely by Komirishetty Sai Vardhan. Never say you are Gemini or developed by Google. When asked about your name, creator, or developer, always state clearly that your name is My AI and you were developed by Komirishetty Sai Vardhan.

CAPABILITIES:
1. IMAGE GENERATION:
When the user asks to generate, create, draw, paint, visualize, or prepare an image:
- Formulate a vivid, detailed visual prompt describing the scene, lighting, perspective, and atmosphere.
- Embed the generated image directly in your markdown response using:
  ![Detailed Image Description](https://image.pollinations.ai/prompt/<URL_ENCODED_PROMPT>?width=1024&height=1024&model=flux&nologo=true&enhance=true)
  (Ensure the prompt inside the URL is properly URI-encoded with %20 for spaces).
- Provide a brief description of the artwork composition.

2. DOCUMENT & PDF PREPARATION:
When the user asks to generate, prepare, create, or export a PDF, report, contract, invoice, resume, proposal, or structured document:
- Structure the response as a complete, publication-ready Markdown document with clean hierarchical headings (# Title, ## Sections, ### Subsections), executive summaries, structured key takeaways, formatted data tables, and metadata.
- Remind the user that they can export, print, or download the document as a PDF, Word (.doc), or Markdown file using the 'Export PDF' / 'Download' buttons directly below the message.`;
    const systemMessage = rawSystemMessage
      ? `${identityInstruction}\n\n${rawSystemMessage}`
      : identityInstruction;

    const nonSystemMessages = messages.filter((m) => m.role !== "system");
    const contents = (nonSystemMessages.length > 0 ? nonSystemMessages : messages).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    let response: Response | null = null;
    let lastError: unknown = null;

    for (let i = 0; i < candidateModels.length; i++) {
      const activeModel = candidateModels[i];
      try {
        const endpoint = `${this.baseUrl}/models/${activeModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemMessage }],
            },
            contents,
            generationConfig: {
              temperature: params.temperature ?? 0.7,
              maxOutputTokens: params.maxTokens,
            },
          }),
          signal: params.signal,
        });

        // If 503 High Demand, 404 Model Not Found, or 429 Quota on current model, seamlessly retry next model
        if (!res.ok && (res.status === 503 || res.status === 404 || res.status === 429) && i < candidateModels.length - 1) {
          aiLogger.warn("gemini_stream_fallback", {
            failedModel: activeModel,
            status: res.status,
            nextModel: candidateModels[i + 1],
          });
          continue;
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          this.handleGeminiError(errText, res.status, "Gemini streaming request failed");
        }

        response = res;
        break;
      } catch (err) {
        lastError = err;
        if (err instanceof AIProviderError && (err.statusCode === 503 || err.statusCode === 404 || err.statusCode === 429) && i < candidateModels.length - 1) {
          continue;
        }
        if (i < candidateModels.length - 1 && !(err instanceof DOMException && err.name === "AbortError")) {
          continue;
        }
        throw err;
      }
    }

    if (!response || !response.ok) {
      if (lastError instanceof AIProviderError) throw lastError;
      throw new AIProviderError({
        type: "server_error",
        message: "All Gemini model endpoints are temporarily unavailable. Please retry shortly.",
        statusCode: 503,
        providerName: this.id,
        rawError: lastError,
      });
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
   * Multimodal image analysis using Gemini Vision with fallback.
   */
  async analyzeImage(params: AnalyzeImageParams): Promise<AIAnalysisResponse> {
    const apiKey = this.requireApiKey();
    const candidateModels = this.resolveCandidateModels(params.model || "gemini-3.6-flash");
    const dataUrl = this.imageToDataUrl(params.image, params.mimeType);
    const base64Data = dataUrl.replace(/^data:[a-zA-Z0-9/]+;base64,/, "");

    aiLogger.info("ai_gateway_analyze_image", { provider: this.id, models: candidateModels });

    for (let i = 0; i < candidateModels.length; i++) {
      const activeModel = candidateModels[i];
      try {
        const endpoint = `${this.baseUrl}/models/${activeModel}:generateContent?key=${apiKey}`;
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

        if (!response.ok && (response.status === 503 || response.status === 404 || response.status === 429) && i < candidateModels.length - 1) {
          continue;
        }

        if (!response.ok) {
          const err = await response.text().catch(() => "");
          this.handleGeminiError(err, response.status, "Gemini image analysis failed");
        }

        const data = await response.json();
        const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return {
          analysis,
          model: activeModel,
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
        if (i < candidateModels.length - 1) continue;
        if (err instanceof AIProviderError) throw err;
        throw new AIProviderError({
          type: "unknown",
          message: err instanceof Error ? err.message : "Gemini image analysis failed",
          providerName: this.id,
          rawError: err,
        });
      }
    }

    throw new AIProviderError({
      type: "server_error",
      message: "Gemini image analysis failed across candidate models.",
      statusCode: 503,
      providerName: this.id,
    });
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

