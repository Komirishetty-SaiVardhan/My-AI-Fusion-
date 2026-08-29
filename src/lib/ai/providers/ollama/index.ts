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

export interface OllamaModelInfo {
  name: string;
  size?: number;
  modifiedAt?: string;
  digest?: string;
}

export class OllamaAdapter extends BaseAIAdapter {
  readonly id = "ollama";
  readonly name = "Ollama (Local AI)";
  private customBaseUrl?: string;
  private customDefaultModel?: string;

  constructor(options?: { baseUrl?: string; defaultModel?: string }) {
    super();
    this.customBaseUrl = options?.baseUrl;
    this.customDefaultModel = options?.defaultModel;
  }

  /**
   * Retrieves the configured base URL for the local Ollama instance.
   */
  getBaseUrl(): string {
    const url =
      this.customBaseUrl ||
      process.env.OLLAMA_BASE_URL ||
      process.env.LOCAL_AI_BASE_URL ||
      "http://localhost:11434";
    return url.replace(/\/+$/, "");
  }

  /**
   * Retrieves the default local model identifier.
   */
  getDefaultModel(): string {
    return (
      this.customDefaultModel ||
      process.env.OLLAMA_MODEL ||
      process.env.LOCAL_AI_MODEL ||
      process.env.DEFAULT_AI_MODEL ||
      "llama3.2"
    );
  }

  /**
   * Local AI is available by default without requiring external cloud API keys.
   */
  isAvailable(): boolean {
    return process.env.DISABLE_LOCAL_AI !== "true";
  }

  /**
   * Probes Ollama to check if the server is running and lists installed models.
   */
  async checkHealth(): Promise<{
    isRunning: boolean;
    version?: string;
    installedModels: string[];
    error?: string;
  }> {
    const baseUrl = this.getBaseUrl();
    try {
      const versionPromise = fetch(`${baseUrl}/api/version`, {
        signal: AbortSignal.timeout(2500),
      }).then(async (r) => (r.ok ? ((await r.json()) as { version: string }).version : undefined));

      const tagsPromise = fetch(`${baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2500),
      }).then(async (r) => {
        if (!r.ok) return [];
        const data = (await r.json()) as { models?: Array<{ name: string }> };
        return (data.models || []).map((m) => m.name);
      });

      const [version, models] = await Promise.all([versionPromise, tagsPromise]);

      return {
        isRunning: true,
        version,
        installedModels: models || [],
      };
    } catch (err) {
      return {
        isRunning: false,
        installedModels: [],
        error:
          err instanceof Error
            ? `Ollama is not responding at ${baseUrl}: ${err.message}`
            : `Could not connect to Ollama at ${baseUrl}`,
      };
    }
  }

  /**
   * Normalizes Ollama network and execution errors into clean user-facing guidance.
   */
  private normalizeOllamaError(err: unknown, model: string): never {
    if (err instanceof AIProviderError) {
      throw err;
    }

    const msg = err instanceof Error ? err.message : String(err);
    const baseUrl = this.getBaseUrl();

    // 1. Connection Refused / Server not running
    if (
      msg.includes("ECONNREFUSED") ||
      msg.includes("fetch failed") ||
      msg.includes("Failed to fetch") ||
      msg.includes("connect") ||
      msg.includes("undici")
    ) {
      throw new AIProviderError({
        type: "network_error",
        message: `Ollama is not running at ${baseUrl}. Please start Ollama by running 'ollama serve' in your terminal or opening the Ollama app.`,
        statusCode: 503,
        providerName: this.id,
        rawError: err,
      });
    }

    // 2. Model not installed (HTTP 404)
    if (msg.includes("not found") || msg.includes("404") || msg.includes("model")) {
      throw new AIProviderError({
        type: "not_found",
        message: `Model "${model}" is not installed in your local Ollama. Please run 'ollama pull ${model}' in your terminal to download it.`,
        statusCode: 404,
        providerName: this.id,
        rawError: err,
      });
    }

    // 3. Timeout error
    if (msg.includes("timeout") || msg.includes("aborted")) {
      throw new AIProviderError({
        type: "timeout",
        message: `Local model generation timed out. For lighter/faster execution on CPU, try a smaller model like 'llama3.2:1b' or 'qwen2.5:1.5b'.`,
        statusCode: 504,
        providerName: this.id,
        rawError: err,
      });
    }

    throw new AIProviderError({
      type: "server_error",
      message: `Local AI Error: ${msg}`,
      statusCode: 500,
      providerName: this.id,
      rawError: err,
    });
  }

  /**
   * Real-time text streaming from local Ollama runtime.
   */
  async *streamText(params: StreamTextParams): AsyncGenerator<AIStreamChunk, void, unknown> {
    const model = params.model || this.getDefaultModel();
    const messages = this.normalizeMessages(params.messages);
    const baseUrl = this.getBaseUrl();
    const startTime = Date.now();

    aiLogger.info("ollama_stream_text_start", { model, baseUrl, messageCount: messages.length });

    if (params.simulateError) {
      yield { type: "status", statusMessage: "Contacting local Ollama engine..." };
      throw new AIProviderError({
        type: "rate_limit",
        message: "Simulated error for local AI error recovery verification.",
        providerName: this.id,
        statusCode: 429,
      });
    }

    yield { type: "status", statusMessage: `Generating response with local ${model}...` };

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
          options: {
            temperature: params.temperature ?? 0.7,
            num_predict: params.maxTokens,
          },
        }),
        signal: params.signal,
      });
    } catch (err) {
      this.normalizeOllamaError(err, model);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      if (response.status === 404 || errText.includes("not found")) {
        throw new AIProviderError({
          type: "not_found",
          message: `Model "${model}" is not installed in Ollama. Please run 'ollama pull ${model}' in your terminal.`,
          statusCode: 404,
          providerName: this.id,
        });
      }

      throw new AIProviderError({
        type: "server_error",
        message: `Ollama returned error (${response.status}): ${errText || response.statusText}`,
        statusCode: response.status,
        providerName: this.id,
      });
    }

    if (!response.body) {
      throw new AIProviderError({
        type: "server_error",
        message: "Ollama returned an empty response body.",
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

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed) as {
              message?: { content?: string; role?: string };
              done?: boolean;
              prompt_eval_count?: number;
              eval_count?: number;
            };

            if (parsed.message?.content) {
              yield { type: "text", content: parsed.message.content };
            }

            if (parsed.done) {
              yield {
                type: "done",
                finishReason: "stop",
                usage: {
                  promptTokens: parsed.prompt_eval_count || 0,
                  completionTokens: parsed.eval_count || 0,
                  totalTokens: (parsed.prompt_eval_count || 0) + (parsed.eval_count || 0),
                },
              };
              return;
            }
          } catch {
            // Partial JSON chunk in buffer, will be processed in next read
          }
        }
      }

      yield { type: "done", finishReason: "stop" };
    } catch (err) {
      aiLogger.error("ollama_stream_text_error", {
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      this.normalizeOllamaError(err, model);
    }
  }

  /**
   * Non-streaming text generation from local Ollama.
   */
  async generateText(params: GenerateTextParams): Promise<AITextResponse> {
    const model = params.model || this.getDefaultModel();
    const messages = this.normalizeMessages(params.messages);
    const baseUrl = this.getBaseUrl();
    const startTime = Date.now();

    aiLogger.info("ollama_generate_text_start", { model, baseUrl });

    if (params.simulateError) {
      throw new AIProviderError({
        type: "rate_limit",
        message: "Simulated error for local AI error recovery verification.",
        providerName: this.id,
        statusCode: 429,
      });
    }

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: false,
          options: {
            temperature: params.temperature ?? 0.7,
            num_predict: params.maxTokens,
          },
        }),
        signal: params.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        if (response.status === 404 || errText.includes("not found")) {
          throw new AIProviderError({
            type: "not_found",
            message: `Model "${model}" is not installed in Ollama. Run 'ollama pull ${model}' to install it.`,
            statusCode: 404,
            providerName: this.id,
          });
        }
        throw new AIProviderError({
          type: "server_error",
          message: `Ollama error (${response.status}): ${errText}`,
          statusCode: response.status,
          providerName: this.id,
        });
      }

      const data = (await response.json()) as {
        message?: { content?: string };
        prompt_eval_count?: number;
        eval_count?: number;
      };

      const text = data.message?.content || "";

      return {
        text,
        finishReason: "stop",
        model,
        provider: this.id,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        raw: data,
      };
    } catch (err) {
      aiLogger.error("ollama_generate_text_error", {
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      this.normalizeOllamaError(err, model);
    }
  }

  /**
   * Multimodal vision analysis using local vision models (e.g. llama3.2-vision, llava).
   */
  async analyzeImage(params: AnalyzeImageParams): Promise<AIAnalysisResponse> {
    const model = params.model || process.env.OLLAMA_VISION_MODEL || "llama3.2-vision";
    const baseUrl = this.getBaseUrl();
    const dataUrl = this.imageToDataUrl(params.image, params.mimeType);

    // Extract raw base64 string
    const base64Data = dataUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

    aiLogger.info("ollama_analyze_image_start", { model, baseUrl });

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: params.prompt,
              images: [base64Data],
            },
          ],
          stream: false,
        }),
        signal: params.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new AIProviderError({
          type: response.status === 404 ? "not_found" : "server_error",
          message:
            response.status === 404
              ? `Local vision model "${model}" is not installed. Please run 'ollama pull ${model}' or 'ollama pull llama3.2-vision'.`
              : `Ollama vision error: ${errText}`,
          statusCode: response.status,
          providerName: this.id,
        });
      }

      const data = (await response.json()) as {
        message?: { content?: string };
        prompt_eval_count?: number;
        eval_count?: number;
      };

      return {
        analysis: data.message?.content || "",
        model,
        provider: this.id,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
        raw: data,
      };
    } catch (err) {
      this.normalizeOllamaError(err, model);
    }
  }

  /**
   * File analysis through local context augmentation.
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
      12000
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
   * Local text embeddings using Ollama (/api/embed or /api/embeddings).
   */
  async embedText(params: EmbedTextParams): Promise<AIEmbeddingResponse> {
    const model = params.model || process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text";
    const baseUrl = this.getBaseUrl();
    const inputs = Array.isArray(params.text) ? params.text : [params.text];

    aiLogger.info("ollama_embed_text_start", { model, baseUrl, inputCount: inputs.length });

    try {
      // Try /api/embed (Ollama v0.1.34+)
      const response = await fetch(`${baseUrl}/api/embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          input: inputs,
        }),
        signal: params.signal,
      });

      if (response.ok) {
        const data = (await response.json()) as { embeddings?: number[][]; prompt_eval_count?: number };
        const embeddings = data.embeddings || [];
        return {
          embeddings,
          dimensions: embeddings[0]?.length || 768,
          model,
          provider: this.id,
          usage: {
            promptTokens: data.prompt_eval_count || 0,
            completionTokens: 0,
            totalTokens: data.prompt_eval_count || 0,
          },
        };
      }

      // Fallback to /api/embeddings for legacy Ollama versions
      const legacyEmbeddings: number[][] = [];
      for (const input of inputs) {
        const legRes = await fetch(`${baseUrl}/api/embeddings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompt: input }),
          signal: params.signal,
        });

        if (!legRes.ok) {
          const errText = await legRes.text().catch(() => "");
          throw new AIProviderError({
            type: legRes.status === 404 ? "not_found" : "server_error",
            message:
              legRes.status === 404
                ? `Embedding model "${model}" is not installed. Please run 'ollama pull ${model}' or 'ollama pull nomic-embed-text'.`
                : `Ollama embedding error: ${errText}`,
            statusCode: legRes.status,
            providerName: this.id,
          });
        }

        const legData = (await legRes.json()) as { embedding?: number[] };
        if (legData.embedding) {
          legacyEmbeddings.push(legData.embedding);
        }
      }

      return {
        embeddings: legacyEmbeddings,
        dimensions: legacyEmbeddings[0]?.length || 768,
        model,
        provider: this.id,
      };
    } catch (err) {
      this.normalizeOllamaError(err, model);
    }
  }
}

export const ollamaAdapter = new OllamaAdapter();
