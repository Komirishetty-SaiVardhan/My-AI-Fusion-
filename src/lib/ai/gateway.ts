import {
  IAIGateway,
  GenerateTextParams,
  AITextResponse,
  StreamTextParams,
  AIStreamChunk,
  AnalyzeImageParams,
  AnalyzeFileParams,
  AIAnalysisResponse,
  EmbedTextParams,
  AIEmbeddingResponse,
} from "./types";
import { aiRouter, AIRouter } from "./router";
import { aiLogger } from "./logger";
import { AIProviderError, ProviderTimeoutError } from "./errors";

export class AIGateway implements IAIGateway {
  private router: AIRouter;

  constructor(router: AIRouter = aiRouter) {
    this.router = router;
  }

  async generateText(params: GenerateTextParams): Promise<AITextResponse> {
    const adapter = this.router.getAdapter(params.provider, params.model);
    const timeoutMs = params.timeoutMs || Number(process.env.AI_STREAMING_TIMEOUT_MS) || 60000;
    const startTime = Date.now();

    aiLogger.info("gateway_generate_text_start", {
      provider: adapter.id,
      model: params.model,
      timeoutMs,
    });

    return this.withTimeout(
      (signal) => adapter.generateText({ ...params, signal }),
      timeoutMs,
      adapter.name,
      params.signal
    ).finally(() => {
      aiLogger.info("gateway_generate_text_finish", {
        provider: adapter.id,
        durationMs: Date.now() - startTime,
      });
    });
  }

  async *streamText(params: StreamTextParams): AsyncGenerator<AIStreamChunk, void, unknown> {
    const adapter = this.router.getAdapter(params.provider, params.model);
    const timeoutMs = params.timeoutMs || Number(process.env.AI_STREAMING_TIMEOUT_MS) || 60000;
    const startTime = Date.now();

    aiLogger.info("gateway_stream_text_start", {
      provider: adapter.id,
      model: params.model,
      timeoutMs,
    });

    try {
      yield* adapter.streamText(params);
    } catch (err) {
      aiLogger.error("gateway_stream_text_error", {
        provider: adapter.id,
        durationMs: Date.now() - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      if (err instanceof AIProviderError) throw err;
      throw new AIProviderError({
        type: "unknown",
        message: err instanceof Error ? err.message : "Gateway stream error",
        providerName: adapter.id,
        rawError: err,
      });
    }
  }

  async analyzeImage(params: AnalyzeImageParams): Promise<AIAnalysisResponse> {
    const adapter = this.router.getAdapter(params.provider, params.model);
    const timeoutMs = params.timeoutMs || 60000;

    aiLogger.info("gateway_analyze_image_start", {
      provider: adapter.id,
      model: params.model,
    });

    return this.withTimeout(
      (signal) => adapter.analyzeImage({ ...params, signal }),
      timeoutMs,
      adapter.name,
      params.signal
    );
  }

  async analyzeFile(params: AnalyzeFileParams): Promise<AIAnalysisResponse> {
    const adapter = this.router.getAdapter(params.provider, params.model);
    const timeoutMs = params.timeoutMs || 60000;

    aiLogger.info("gateway_analyze_file_start", {
      provider: adapter.id,
      filename: params.filename,
      mimeType: params.mimeType,
    });

    return this.withTimeout(
      (signal) => adapter.analyzeFile({ ...params, signal }),
      timeoutMs,
      adapter.name,
      params.signal
    );
  }

  async embedText(params: EmbedTextParams): Promise<AIEmbeddingResponse> {
    const adapter = this.router.getAdapter(params.provider, params.model);
    const timeoutMs = params.timeoutMs || 30000;

    aiLogger.info("gateway_embed_text_start", {
      provider: adapter.id,
      model: params.model,
    });

    return this.withTimeout(
      (signal) => adapter.embedText({ ...params, signal }),
      timeoutMs,
      adapter.name,
      params.signal
    );
  }

  private async withTimeout<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    timeoutMs: number,
    providerName: string,
    callerSignal?: AbortSignal
  ): Promise<T> {
    const controller = new AbortController();
    let timer: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new ProviderTimeoutError(providerName, timeoutMs));
      }, timeoutMs);
    });

    const onCallerAbort = () => controller.abort();
    if (callerSignal) {
      if (callerSignal.aborted) controller.abort();
      else callerSignal.addEventListener("abort", onCallerAbort);
    }

    try {
      return await Promise.race([operation(controller.signal), timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
      if (callerSignal) callerSignal.removeEventListener("abort", onCallerAbort);
    }
  }

  listAvailableProviders(): Array<{ id: string; name: string }> {
    return this.router.listAvailableProviders();
  }
}

export const aiGateway = new AIGateway();
